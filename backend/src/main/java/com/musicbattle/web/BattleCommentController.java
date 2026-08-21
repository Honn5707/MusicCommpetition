package com.musicbattle.web;

import com.musicbattle.web.dto.BattleSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public BattleSummaryResponse class BattleCommentController {
    @MessageMapping("/{battleId}/comment")
    public  battleComment(){

    }

}
