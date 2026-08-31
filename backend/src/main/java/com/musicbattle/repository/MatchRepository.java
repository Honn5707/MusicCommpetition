package com.musicbattle.repository;

import com.musicbattle.domain.Match;
import com.musicbattle.domain.enums.MatchStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {

    // 스케줄러 폴링용: 마감 시각이 지난 VOTING 상태 매치만 조회
    @Query("select m from Match m where m.status = :status and m.votingEndsAt <= :now")
    List<Match> findExpiredVoting(@Param("status") MatchStatus status, @Param("now") LocalDateTime now);

    // 같은 매치를 여러 스케줄러 인스턴스가 동시에 집계하지 못하도록 비관적 락
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Match m where m.id = :id")
    Match findByIdForUpdate(@Param("id") Long id);

    @Query("select m from Match m where m.status = :status and m.createdAt <= :expiredTime")
    List<Match> findExpiredRecruited(@Param("status") MatchStatus status, LocalDateTime expiredTime);

    //RECRUITING이며, 특정ID가 방장임을 찾는 메서드

    @Query("select m from Match m join MatchEntry me on me.matchId = m.id " +
            "where me.submitterMemberId = :memberId and m.status = :status")
    List<Match> findMatchesByMemberAndStatus(@Param("memberId") Long memberId, @Param("status") MatchStatus status);

    Optional<Match> findByBattleId(Long id);
}
