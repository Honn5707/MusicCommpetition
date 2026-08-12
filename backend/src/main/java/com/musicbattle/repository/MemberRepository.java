package com.musicbattle.repository;

import com.musicbattle.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByProviderId(String providerId);
    Optional<Member> findByNickname(String nickname);

}
