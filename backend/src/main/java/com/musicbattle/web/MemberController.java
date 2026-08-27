package com.musicbattle.web;



import com.musicbattle.service.FollowService;
import com.musicbattle.service.MemberService;
import com.musicbattle.web.dto.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;
    private final FollowService followService;

    @PostMapping("/register")
    public ResponseEntity<MemberRegisterResult> register(
            @Valid @RequestBody MemberRegisterRequest request
    ){

        MemberRegisterResult result = memberService.register(request);
        return ResponseEntity.ok(result);


    }

    @GetMapping("/mypage")
    public ResponseEntity<MemberPageResponse> myPage(
            @AuthenticationPrincipal Long memberId,
            @PageableDefault(size = 5) Pageable pageable){
        MemberPageResponse response = memberService.memberPage(memberId, pageable);

        return ResponseEntity.ok(response);

    }

    @GetMapping("/{targetId}/profile")
    public ResponseEntity<MemberProfileResponse> profile(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long targetId
    ){
        MemberProfileResponse response = memberService.memberProfile(memberId,targetId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody DeleteAccountRequest deleteAccountRequest
    ){
        memberService.deleteMember(memberId, deleteAccountRequest);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{targetId}/follow")
    public ResponseEntity<Void> followMember(
            @AuthenticationPrincipal Long memberId, @PathVariable Long targetId)
    {
        followService.following(memberId, targetId);
        return  ResponseEntity.ok().build();
    }

    @DeleteMapping("/{targetId}/follow")
    public ResponseEntity<Void> removeFollowMember(
            @AuthenticationPrincipal Long memberId, @PathVariable Long targetId)
    {
        followService.removeFollow(memberId, targetId);
        return  ResponseEntity.ok().build();
    }

    @GetMapping("/followerList")
    public ResponseEntity<PageResponse<FollowerListResponse>>followerList(
            @AuthenticationPrincipal Long memberId,
            Pageable pageable)
    {
             return ResponseEntity.ok(followService.getFollowerList(memberId,pageable));
    }

    @GetMapping("/followingList")
    public ResponseEntity<PageResponse<FollowingListResponse>> followingList(
            @AuthenticationPrincipal Long memberId,
            Pageable pageable)
    {
        return ResponseEntity.ok(followService.getFollowingList(memberId,pageable));

    }








}
