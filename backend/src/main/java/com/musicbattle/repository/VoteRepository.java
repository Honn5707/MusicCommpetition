package com.musicbattle.repository;

import com.musicbattle.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Boolean existsByMatchIdAndVoterMemberId(Long matchId, Long voterMemberId);
}
