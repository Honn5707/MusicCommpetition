package com.musicbattle.web;

import com.musicbattle.service.BattleCommentService;
import com.musicbattle.web.dto.BattleCommentRequest;
import com.musicbattle.web.dto.BattleCommentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController

@RequiredArgsConstructor
public class BattleCommentController {
    private final BattleCommentService battleCommentService;
    @PostMapping("/api/battles/{battleId}/comments")
    public ResponseEntity<Void> addComment(@PathVariable Long battleId,@RequestBody BattleCommentRequest request, @AuthenticationPrincipal Long memberId){
            battleCommentService.battleCommentAdd(battleId, memberId, request);

            return ResponseEntity.ok().build();
    }

    @GetMapping("/api/battles/{battleId}/comments")
    public ResponseEntity<List<BattleCommentResponse>> retrieveComment(@PathVariable Long battleId, @RequestParam(required = false) LocalDateTime afterTime){
        return ResponseEntity.ok(battleCommentService.battleCommentListRetrieve(battleId ,afterTime));

    }

}

