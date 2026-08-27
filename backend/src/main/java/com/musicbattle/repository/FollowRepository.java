package com.musicbattle.repository;

import com.musicbattle.domain.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;


public interface FollowRepository extends JpaRepository<Follow, Long> {
    @Query
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    @Query
    Boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    @Query
    Page<Follow> findByFollowerId(Long memberId, Pageable pageable);

    @Query
    Page<Follow> findByFollowingId(Long memberId, Pageable pageable);

    Long countByFollowingId(Long followingId);

    Long countByFollowerId(Long followerId);
}
