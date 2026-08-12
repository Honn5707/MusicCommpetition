package com.musicbattle.web;



import com.musicbattle.service.MemberService;
import com.musicbattle.web.dto.DeleteAccountRequest;import com.musicbattle.web.dto.MemberPageResponse;
import com.musicbattle.web.dto.MemberRegisterRequest;
import com.musicbattle.web.dto.MemberRegisterResult;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;

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
        MemberPageResponse result = memberService.memberPage(memberId, pageable);

        return ResponseEntity.ok(result);

    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody DeleteAccountRequest deleteAccountRequest
    ){
        memberService.deleteMember(memberId, deleteAccountRequest);

        return ResponseEntity.ok().build();
    }




}
