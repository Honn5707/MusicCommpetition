package com.musicbattle.service;

import com.musicbattle.config.BattleRuleProperties;
import com.musicbattle.domain.Match;
import com.musicbattle.domain.MatchEntry;
import com.musicbattle.domain.Vote;
import com.musicbattle.domain.enums.MatchStatus;
import com.musicbattle.repository.MatchEntryRepository;
import com.musicbattle.repository.MatchRepository;
import com.musicbattle.repository.VoteRepository;
import com.musicbattle.web.dto.VoteRequest;
import com.musicbattle.web.dto.VoteResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

/**
 * 투표 처리의 진짜 방어선은 Redis(빠른 원자적 락)이고,
 * MySQL의 vote 테이블은 감사(audit)/집계용 영속 기록이다.
 * 이 둘의 역할을 섞지 않는 게 핵심 - Redis가 "지금 이 요청을 통과시킬지"를 결정하고
 * MySQL은 "무슨 일이 있었는지"를 기록한다.
 */
@Service
@RequiredArgsConstructor
public class VoteService {

    private final StringRedisTemplate redisTemplate;
    private final MatchRepository matchRepository;
    private final MatchEntryRepository matchEntryRepository;
    private final VoteRepository voteRepository;
//    private final ExtraVoteUsageRepository extraVoteUsageRepository;
    private final BattleRuleProperties rules;

    @Transactional
    public VoteResult vote(Long matchId, VoteRequest request, Long voterMemberId, String ipHash){//ip는 해시값으로 받음

        Match match = matchRepository.findById(matchId).orElseThrow(() ->new IllegalStateException("매치가 존재하지 않습니다.(voteService)")); //id에 적합하는 match엔티티 조회
        if(match.getStatus() != MatchStatus.VOTING) throw new IllegalStateException("현재 매치가 투표가능 상태가 아닙니다");//매치가 투표상태가 아닐떄 예외


        MatchEntry matchEntry = matchEntryRepository.findById(request.matchEntryId()).orElseThrow(()->new IllegalStateException("투표대상을 찾을 수 없습니다."));
        if(!matchEntry.getMatchId().equals(matchId)) throw new IllegalStateException("존재하지않은 매치에대한 요청이 발생하였습니다!");

        String lockKey;
        lockKey = "vote:lock:" + matchId + ":" + ipHash; // ip중복 투표 방지를 위한 KEY
//         lockKey  = "vote:lock:" + voterMemberId + ":" + ipHash;


        boolean required = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofSeconds(rules.getAntiAbuse().getVoteLockTtlSeconds()));




        if (voterMemberId != null) {
            boolean alreadyVoted = voteRepository.existsByMatchIdAndVoterMemberId(matchId, voterMemberId);
            if (alreadyVoted) throw new IllegalStateException("이미 투표하셨습니다.");
        }
        if(!required)throw new IllegalStateException("동일한 IP로는 1회만 투표 가능합니다.");
        int weight;
        if(voterMemberId != null) weight = rules.getVote().getWeightMember();
        else weight = rules.getVote().getWeightAnonymous();
        matchEntry.addVote(weight);


        //vote 엔티티 생성
        Vote vote = Vote.builder().matchId(match.getId()).matchEntryId(matchEntry.getId()).voterMemberId(voterMemberId).weight(weight).ipHash(ipHash)
                .extraVote(false).build();
        voteRepository.save(vote);

        return new VoteResult(match.getId(), matchEntry.getId(), voterMemberId, matchEntry.getVoteScore());

    }




}


