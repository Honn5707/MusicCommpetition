package com.musicbattle.service;

import com.musicbattle.config.BattleRuleProperties;
import com.musicbattle.domain.Battle;
import com.musicbattle.domain.Match;
import com.musicbattle.domain.MatchEntry;
import com.musicbattle.domain.Member;
import com.musicbattle.domain.enums.EntrySide;
import com.musicbattle.domain.enums.MatchStatus;
import com.musicbattle.repository.BattleRepository;
import com.musicbattle.repository.MatchEntryRepository;
import com.musicbattle.repository.MatchRepository;
import com.musicbattle.repository.MemberRepository;
import com.musicbattle.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.musicbattle.domain.enums.BattleMode.ONE_VS_ONE;


@Service
@RequiredArgsConstructor
public class BattleService {
    private final BattleRuleProperties rules;
    private final MatchRepository matchRepository;
    private final BattleRepository battleRepository;
    private final MatchEntryRepository matchEntryRepository;
    private final MatchLifecycleService matchLifecycleService;
    private final MemberRepository memberRepository;

    @Transactional //레파지토리 저장을 하나로 묶음
    public BattleCreateResult createOneVsOneBattle(CreateBattleRequest request, Long hostMemberId) {
        memberRepository.findById(hostMemberId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 호스트를 참조"));

        if(!useAbleBattle(hostMemberId)) throw new IllegalStateException("참여할 수 있는 대결의 개수는 최대 3개입니다.");


        Battle battle = Battle.builder()
                .voteWindowSec(request.voteDurationSec())
                .mode(ONE_VS_ONE)
                .hostMemberId(hostMemberId)
                .title(request.title())
                .build();
        battleRepository.save(battle);

        Match match = Match.builder().battleId(battle.getId()).build();
        matchRepository.save(match);

        MatchEntry matchEntry = MatchEntry.builder()
                .side(EntrySide.A)
                .videoId(request.videoId())
                .songTitle(request.songTitle())
                .channelTitle(request.channelTitle())
                .thumbnailUrl(request.thumbnailUrl())
                .durationSec(request.durationSec())
                .embeddable(true)
                .submitterMemberId(hostMemberId)
                .matchId(match.getId())
                .build();
        matchEntryRepository.save(matchEntry);

        return new BattleCreateResult(battle.getId(), battle.getTitle(), match.getCreatedAt());
    }

    @Transactional
    public MatchCreateResult joinAsChallenger(Long battleId, ChallengeRequest request, Long challengerId) {
        Battle battle = battleRepository.findById(battleId)
                .orElseThrow(() -> new IllegalStateException("방을 찾을 수 없습니다"));
        memberRepository.findById(challengerId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 도전자를 참조"));
        if(!useAbleBattle(challengerId)) throw new IllegalStateException("참여할 수 있는 대결의 개수는 최대 3개입니다.");

        if (battle.getHostMemberId().equals(challengerId))
            throw new IllegalStateException("본인이 만든 배틀에는 참가 불가");

        Match match = matchRepository.findByBattleId(battle.getId())
                .orElseThrow(() -> new IllegalStateException("배틀에 연결된 매치를 찾을 수 없습니다 (데이터 정합성 오류): battleId=" + battle.getId()));

        List<MatchEntry> matchEntries = matchEntryRepository.findByMatchId(match.getId());
        //순회하여 B가 있는지 확인
        if (matchEntries.stream().anyMatch(me -> me.getSide() == EntrySide.B))
            throw new IllegalStateException("이미 도전자가 존재합니다");
        if (match.getStatus() != MatchStatus.RECRUITING)
            throw new IllegalStateException("경기가 대기중이 아닙니다!(상태 불일치)");

        //도전자 데이터 저장
        MatchEntry matchEntry = MatchEntry.builder()
                .side(EntrySide.B)
                .videoId(request.videoId())
                .songTitle(request.songTitle())
                .channelTitle(request.channelTitle())
                .thumbnailUrl(request.thumbnailUrl())
                .durationSec(request.durationSec())
                .embeddable(true)
                .submitterMemberId(challengerId)
                .matchId(match.getId())
                .build();
        matchEntryRepository.save(matchEntry);
        matchLifecycleService.openVoting(match.getId(), battle.getVoteWindowSec());


        return new MatchCreateResult(match.getVotingEndsAt());
    }
    @Transactional(readOnly=true)
    public BattleDetailResponse getBattleDetail(Long battleId) {

        Battle battle = battleRepository.findById(battleId).orElseThrow(() -> new IllegalStateException("배틀 ID를 찾을 수 없습니다!"));
        Match match = matchRepository.findByBattleId(battle.getId()).orElseThrow(() -> new IllegalStateException("배틀ID에 맞는 매치를 찾을 수 없습니다"));
        List<MatchEntry> matchEntries = matchEntryRepository.findByMatchId(match.getId());
        MatchEntry hostPlayer = matchEntries.stream().filter(matchEntry -> matchEntry.getSide() == EntrySide.A).findFirst().orElseThrow(() -> new IllegalStateException("호스트를 찾을 수 없습니다"));
        MatchEntry challengerPlayer = matchEntries.stream().filter(matchEntry -> matchEntry.getSide() == EntrySide.B).findFirst().orElse(null);
        Long challengerEntryId;

        String hostVideoId = hostPlayer.getVideoId();
        String hostSongTitle = hostPlayer.getSongTitle();
        int hostScore = hostPlayer.getVoteScore();

        String challengerVideoId;
        String challengerSongTitle;
        int challengerScore;
        Long challengerMemberId;

        if (challengerPlayer != null) {
            challengerVideoId = challengerPlayer.getVideoId();
            challengerSongTitle = challengerPlayer.getSongTitle();
            challengerScore = challengerPlayer.getVoteScore();
            challengerEntryId = challengerPlayer.getId();
            challengerMemberId = challengerPlayer.getSubmitterMemberId();
        } else {
            challengerVideoId = null;
            challengerSongTitle = null;
            challengerScore = 0;
            challengerEntryId = null;
            challengerMemberId = null;

        }

        String winner;

        if (challengerPlayer != null) {
            if (hostScore > challengerScore) winner = "host";
            else if (hostScore < challengerScore) winner = "challenger";
            else winner = "equal";
        } else winner = "none";

        String hostNickname = memberRepository.findById(battle.getHostMemberId())
                .map(Member::getNickname).orElse("알 수 없음");
        String challengerNickname = challengerMemberId != null
                ? memberRepository.findById(challengerMemberId).map(Member::getNickname).orElse("알 수 없음")
                : null;

        return new BattleDetailResponse(battle.getTitle(), match.getId(), match.getStatus(),
                hostVideoId, hostSongTitle, challengerVideoId, challengerSongTitle,
                hostScore, challengerScore, winner, hostPlayer.getId(), challengerEntryId,
                battle.getHostMemberId(), challengerMemberId,
                hostNickname, challengerNickname, match.getVotingEndsAt(),match.getCreatedAt());
    }



    public PageResponse<BattleSummaryResponse> getBattleList(Pageable pageable) {
        Page<Battle> battlePage = battleRepository.findAll(pageable);
        List<Battle> pages = battlePage.getContent();

        List<BattleSummaryResponse> pageReturn =  pages.stream().map(battle-> {
            Match match =  matchRepository.findByBattleId(battle.getId()).orElseThrow(()->new IllegalStateException("배틀정보 참조 불가"));
            List<MatchEntry> matchEntries = matchEntryRepository.findByMatchId(match.getId());
            MatchEntry hostPlayer = matchEntries.stream().filter(matchEntry -> matchEntry.getSide() == EntrySide.A).findFirst().orElseThrow(() -> new IllegalStateException("호스트를 찾을 수 없습니다"));

            MatchEntry challengerPlayer = matchEntries.stream()
                    .filter(me -> me.getSide() == EntrySide.B)
                    .findFirst()
                    .orElse(null);

            String hostNickname = nicknameOf(hostPlayer.getSubmitterMemberId());

            if(challengerPlayer != null) {
                return new BattleSummaryResponse(
                        battle.getId(),
                        battle.getTitle(),
                        hostPlayer.getSongTitle(),
                        challengerPlayer.getSongTitle(),
                        hostPlayer.getVoteScore(),
                        challengerPlayer.getVoteScore(),
                        match.getStatus(),
                        hostNickname,
                        nicknameOf(challengerPlayer.getSubmitterMemberId()),
                        match.getVotingEndsAt(),
                        match.getCreatedAt());
            }
            return new BattleSummaryResponse(battle.getId(),
                    battle.getTitle(),
                    hostPlayer.getSongTitle(),
                    null,
                    hostPlayer.getVoteScore(),
                    0,
                    match.getStatus(),
                    hostNickname,
                    null,
                    null,
                    match.getCreatedAt());

        }).toList();
        return new PageResponse<BattleSummaryResponse>(pageReturn, battlePage.getNumber(), battlePage.getSize(), battlePage.getTotalElements(), battlePage.getTotalPages(), battlePage.hasNext());

    }

    @Transactional
    public void hostBattleDelete(Long battleId, Long memberId){
        Battle battle = battleRepository.findById(battleId).orElseThrow(()->new IllegalStateException("존재하지 않는 battleId"));
        Match match = matchRepository.findByBattleId(battleId).orElseThrow(()-> new IllegalStateException("[match 엔티티 조회 불가]: 일치하지 않는 battleId"));
        List<MatchEntry> matchEntries = matchEntryRepository.findByMatchId(match.getId()); // matchId에 맞는 entries를 list형식으로

        if(!battle.getHostMemberId().equals(memberId)) throw new IllegalStateException("[배틀 삭제 불가] 호스트 멤버와 다른 ID를 사용중");
        if(matchEntries.stream().anyMatch(me -> me.getSide() == EntrySide.B)) throw new IllegalStateException("[배틀 삭제 불가] 상대방이 존재할때는 삭제가 불가합니다");
        if(match.getStatus() != MatchStatus.RECRUITING) throw new IllegalStateException("[배틀 석재 뷸가] 투표단계 이후 배틀 삭제는 불가");

        battleDelete(matchEntries, match, battle);


    }
//    운영자 권한의 배틀 삭제 (토큰을 통한 인증 필요 x)
    @Transactional
    public void forceBattleDelete(Long battleId){
        Battle battle = battleRepository.findById(battleId).orElseThrow(()->new IllegalStateException("존재하지 않는 battleId"));
        Match match = matchRepository.findByBattleId(battleId).orElseThrow(()-> new IllegalStateException("[match 엔티티 조회 불가]: 일치하지 않는 battleId"));
        List<MatchEntry> matchEntries = matchEntryRepository.findByMatchId(match.getId()); // matchId에 맞는 entries를 list형식으로

        battleDelete(matchEntries, match, battle);
    }

    @Transactional
    public void battleDelete(List<MatchEntry> matchEntries, Match match,  Battle battle){
        //예외 작업 이후 배틀 삭제

        matchEntryRepository.deleteAll(matchEntries);
        matchRepository.delete(match);
        battleRepository.delete(battle);
    }

    @Transactional
    public void battleSurrender(Long battleId, Long memberId){
        Battle battle = battleRepository.findById(battleId).orElseThrow(()->new IllegalStateException("존재하지 않는 battleId"));
        Match match = matchRepository.findByBattleId(battleId).orElseThrow(()-> new IllegalStateException("[match 엔티티 조회 불가]: 일치하지 않는 battleId"));
        if(match.getStatus() != MatchStatus.VOTING) throw new IllegalStateException("투표 단계에서만 항복 가능");
        List<MatchEntry> matchEntries = matchEntryRepository.findByMatchId(match.getId()); // matchId에 맞는 entries를 list형식으로

        if(matchEntries.stream().noneMatch(matchEntry-> matchEntry.getSubmitterMemberId().equals(memberId))) throw new IllegalStateException("배틀에 참여하지 않은 인원이 surrender요청");

        //모든 예외처리 작업 후 승자 정하기
        Long winnerMatchEntryId = matchEntries.stream().filter(matchEntry -> !matchEntry.getSubmitterMemberId().equals(memberId)).findFirst().orElseThrow(()->new IllegalStateException("항복자의 상대방을 찾을 수 없음")).getId();
        match.surrender(winnerMatchEntryId);

    }

    public boolean useAbleBattle(Long memberId){
        return matchEntryRepository.countActiveMatchesByMember(memberId, MatchStatus.FINISHED) < rules.getMember().getMaxJoinBattle();
    }

    private String nicknameOf(Long memberId){
        if(memberId == null) return null;
        return memberRepository.findById(memberId).map(Member::getNickname).orElse("알 수 없음");
    }




}


