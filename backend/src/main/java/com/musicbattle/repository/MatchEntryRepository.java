package com.musicbattle.repository;

import com.musicbattle.domain.Match;
import com.musicbattle.domain.MatchEntry;
import com.musicbattle.domain.enums.MatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchEntryRepository extends JpaRepository<MatchEntry, Long> {
    List<MatchEntry> findByMatchId(Long matchId);

    Optional<MatchEntry> findByMatchIdAndSubmitterMemberId(Long matchId, Long memberId);

    @Query("select count(me) from MatchEntry me join Match m on me.matchId = m.id " +
            "where me.submitterMemberId = :memberId and m.status <> :excludedStatus")
    long countActiveMatchesByMember(@Param("memberId") Long memberId, @Param("excludedStatus") MatchStatus excludedStatus);

    @Query("select m from MatchEntry me join Match m on me.matchId = m.id " +
            "where me.submitterMemberId = :memberId and m.status <> :excludedStatus")
    List<Match> listOfCurrentMatches(@Param("memberId") Long memberId, @Param("excludedStatus") MatchStatus excludedStatus);

    @Query("select m from MatchEntry me join Match m on me.matchId = m.id " +
            "where me.submitterMemberId = :memberId and m.status = :includedStatus")
    Page<Match> listOfFinishedMatches(@Param("memberId") Long memberId, @Param("includedStatus") MatchStatus includedStatus, Pageable pageable);
}
