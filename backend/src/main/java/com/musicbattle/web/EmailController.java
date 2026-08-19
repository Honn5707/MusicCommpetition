package com.musicbattle.web;

import com.musicbattle.service.EmailService;
import com.musicbattle.web.dto.EmailCodeConfirmRequest;
import com.musicbattle.web.dto.EmailCodeSendRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailController {
    private final EmailService emailService;
    @PostMapping("/code-send")
    public ResponseEntity<Void> codeSend(
            @RequestBody EmailCodeSendRequest emailCodeSendRequest
    ){
        emailService.sendCode(emailCodeSendRequest);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/code-confirm")
    public ResponseEntity<Void> codeConfirm(
            @RequestBody EmailCodeConfirmRequest emailCodeConfirmRequest
            ){
        emailService.confirmCode(emailCodeConfirmRequest);

        return ResponseEntity.ok().build();
    }
}
