package com.musicbattle.service;

import com.musicbattle.domain.Follow;
import com.musicbattle.domain.Member;
import com.musicbattle.repository.FollowRepository;
import com.musicbattle.repository.MemberRepository;
import com.musicbattle.web.dto.FollowerListResponse;
import com.musicbattle.web.dto.FollowingListResponse;
import com.musicbattle.web.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {
    private final FollowRepository followRepository;
    private final MemberRepository memberRepository;
    @Transactional
    public void following(Long followerId, Long followingId){

        if (followerId.equals(followingId))
            throw new IllegalStateException("자기 자신은 팔로우할 수 없습니다");
        try {
            Follow newFollow = Follow.builder().followerId(followerId).followingId(followingId).build();
            followRepository.save(newFollow);
        }catch (DataIntegrityViolationException e){throw new IllegalStateException("이미 팔로우 상태입니다!");}
    }
    @Transactional
    public void removeFollow(Long followerId, Long FollowingId){
        Follow follow = followRepository.findByFollowerIdAndFollowingId(followerId, FollowingId).orElseThrow(()->new IllegalStateException("팔로워를 찾을 수 없습니다"));
        followRepository.delete(follow);
    }

    public PageResponse<FollowerListResponse> getFollowerList(Long memberId, Pageable pageable){

        Page<Follow> followPage = followRepository.findByFollowingId(memberId, pageable);
        List<Follow> followerList = followPage.getContent();
        Map<Long, String> followerNicknameMap = memberRepository.findAllById(followerList.stream().map(Follow::getFollowerId).distinct().toList()).stream().collect(Collectors.toMap(Member::getId, Member::getNickname));

        List<FollowerListResponse> responses = followerList.stream().map(f->new FollowerListResponse(followerNicknameMap.getOrDefault(f.getFollowerId(),"닉네임 조회 불가"), f.getFollowerId())).toList();

        return new PageResponse<>(responses, followPage.getNumber(), followPage.getSize(),
                followPage.getTotalElements(), followPage.getTotalPages(), followPage.hasNext());
    }
    public PageResponse<FollowingListResponse> getFollowingList(Long memberId, Pageable pageable){

        Page<Follow> followPage = followRepository.findByFollowerId(memberId, pageable);
        List<Follow> followingList = followPage.getContent();
        Map<Long, String> followingNicknameMap = memberRepository.findAllById(followingList.stream().map(Follow::getFollowingId).distinct().toList()).stream().collect(Collectors.toMap(Member::getId, Member::getNickname));

        List<FollowingListResponse> responses = followingList.stream().map(f->new FollowingListResponse(followingNicknameMap.getOrDefault(f.getFollowingId(),"닉네임 조회 불가"), f.getFollowingId())).toList();

        return new PageResponse<>(responses, followPage.getNumber(), followPage.getSize(),
                followPage.getTotalElements(), followPage.getTotalPages(), followPage.hasNext());
    }
}



