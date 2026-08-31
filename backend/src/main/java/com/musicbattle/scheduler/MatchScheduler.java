package com.musicbattle.scheduler;

import com.musicbattle.config.BattleRuleProperties;
import com.musicbattle.domain.Match;
import com.musicbattle.domain.enums.MatchStatus;
import com.musicbattle.repository.MatchRepository;
import com.musicbattle.service.BattleService;
import com.musicbattle.service.MatchLifecycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MVP: 전체 테이블 폴링으로 충분 (방 수가 적을 때).
 * 방 수가 늘어나면: Redis TTL keyspace notification 또는 방별 Quartz 예약 잡으로
 * 이벤트 구동 방식으로 전환 - 지금은 오버엔지니어링하지 않는다 (YAGNI).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchScheduler {

    private final MatchRepository matchRepository;
    private final MatchLifecycleService matchLifecycleService;
    private final BattleService battleService;
    private final BattleRuleProperties rules;
    @Scheduled(fixedDelay = 5000) // 5초 간격 폴링
    public void closeExpiredVotingMatches() {
        List<Match> expired = matchRepository.findExpiredVoting(MatchStatus.VOTING, LocalDateTime.now());
        for (Match match : expired) {
            try {
                matchLifecycleService.closeAndFinalize(match.getId());
            } catch (Exception e) {
                // 한 매치 처리 실패가 나머지 매치 집계를 막으면 안 된다 - 격리 처리 + 로깅
                log.error("매치 집계 실패 matchId={}", match.getId(), e);
            }
        }
    }

    @Scheduled(fixedDelay = 300000)//5분 간격
    public void deleteExpiredMatches(){
        List<Match> expiredRecruitedMatches = matchRepository.findExpiredRecruited(MatchStatus.RECRUITING,
                LocalDateTime.now().minusHours(rules.getRecruiting().getExpireHours()));
        for(Match match: expiredRecruitedMatches){
            try {
                battleService.forceBattleDelete(match.getBattleId());
            }
            catch (Exception e){
                log.error("RECRUITING 배틀 자동 삭제 실패 matchId={}", match.getId(), e);            }
            }
    }
}
