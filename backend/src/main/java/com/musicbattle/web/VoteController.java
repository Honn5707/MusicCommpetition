package com.musicbattle.web;

import com.musicbattle.service.VoteService;
import com.musicbattle.util.IpUtilities;
import com.musicbattle.web.dto.VoteRequest;
import com.musicbattle.web.dto.VoteResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matches/{matchId}/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;
    private final IpUtilities ipUtilities;

    @PostMapping
    public ResponseEntity<VoteResult> vote(
            @PathVariable Long matchId,
            @Valid @RequestBody VoteRequest request,
            @AuthenticationPrincipal Long voterMemberId,
            HttpServletRequest httpRequest
    ) {
        String clientIp = ipUtilities.extractClientIp(httpRequest);
        String ipHash = ipUtilities.sha256(clientIp);
        VoteResult result = voteService.vote(matchId, request, voterMemberId, ipHash);
        return ResponseEntity.ok(result);
    }

}
