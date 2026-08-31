package com.musicbattle.service;

import com.musicbattle.domain.Match;
import com.musicbattle.domain.MatchEntry;
import com.musicbattle.domain.enums.EntrySide;
import com.musicbattle.domain.enums.PointTransactionType;
import com.musicbattle.repository.MatchEntryRepository;
import com.musicbattle.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Match 상태머신(RECRUITING -> VOTING -> CALCULATING -> FINISHED)의 전이를
 * 실제로 실행하는 서비스. 상태를 바꾸는 코드는 이 클래스 안에서만 존재해야 한다
 * (컨트롤러/스케줄러는 이 서비스만 호출하고 절대 match.set... 을 직접 하지 않는다).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchLifecycleService {

    private static final int MATCH_WIN_POINT = 50; // MVP 고정값. 추후 설정값/모드별 차등으로 확장.

    private final MatchRepository matchRepository;
    private final MatchEntryRepository matchEntryRepository;
    private final PointLedgerService pointLedgerService;

    /** RECRUITING -> VOTING. 양 진영이 채워진 직후 컨트롤러/도전 매칭 로직에서 호출. */
    @Transactional
    public void openVoting(Long matchId, int voteWindowSec) {
        Match match = getForUpdate(matchId);
        match.openVoting(voteWindowSec);
    }

    /**
     * 스케줄러 전용 진입점. 마감 시각이 지난 VOTING 매치 하나를 집계까지 끝낸다.
     * 비관적 락(findByIdForUpdate)으로 동일 매치에 대한 중복 실행을 방지한다.
     */

    @Transactional
    public void closeAndFinalize(Long matchId) {
        Match match = matchRepository.findByIdForUpdate(matchId);
        if (!match.isVotingExpired()) {
            return; // 다른 스케줄러 스레드가 이미 처리했거나 아직 마감 전
        }

        match.closeVoting(); // VOTING -> CALCULATING

        List<MatchEntry> entries = matchEntryRepository.findByMatchId(matchId);
        MatchEntry winner = decideWinner(entries);

        match.finish(winner.getId()); // CALCULATING -> FINISHED

        //포인트를 지급하지 못하는 상황일때(ex.익명) 예외 발생시 위 매치 상태변경이 트랜잰션 예외 처리로 인해 롤백됨. 이를 해결하기 위해 포인트를 지급할 때 새로운 트랜잭션 생성.
        // 트랜잭션 전파->grant메서드 확인

        try {
            pointLedgerService.grant(
                    winner.getSubmitterMemberId(),
                    MATCH_WIN_POINT,
                    PointTransactionType.MATCH_WIN,
                    "MATCH",
                    match.getId()
            );
        }catch (Exception e) {
            log.error("포인트 지급 실패 - 수동 확인 필요: matchId={}, winnerEntryId={}, memberId={}",
                    match.getId(), winner.getId(), winner.getSubmitterMemberId(), e);
        }
    }

    /**
     * 동점 처리 규칙: 챔피언/방장(side A) 우세 유지 - 디펜더 어드밴티지.
     * 렐리 모드에서 side A = 현재 챔피언으로 배정하는 관례를 따른다.
     */
    private MatchEntry decideWinner(List<MatchEntry> entries) {
        MatchEntry sideA = entries.stream().filter(e -> e.getSide() == EntrySide.A).findFirst()
                .orElseThrow(() -> new IllegalStateException("A 진영 엔트리 없음"));
        MatchEntry sideB = entries.stream().filter(e -> e.getSide() == EntrySide.B).findFirst()
                .orElseThrow(() -> new IllegalStateException("B 진영 엔트리 없음"));

        return sideB.getVoteScore() > sideA.getVoteScore() ? sideB : sideA;
    }

    private Match getForUpdate(Long matchId) {
        return matchRepository.findByIdForUpdate(matchId);
    }
}
