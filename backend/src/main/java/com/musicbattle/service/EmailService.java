package com.musicbattle.service;

import com.musicbattle.config.EmailProperties;
import com.musicbattle.web.dto.EmailCodeConfirmRequest;
import com.musicbattle.web.dto.EmailCodeSendRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmailService {
    private static final String CODE_KEY_PREFIX = "email-send:";
    public final String VERIFY_KEY_PREFIX = "email-verify:";
    private final JavaMailSender javaMailSender;
    private final StringRedisTemplate redisTemplate;
    private final EmailProperties rules;


    public boolean isVerified(String email) {
        return redisTemplate.hasKey(VERIFY_KEY_PREFIX + email);
    }

    public void clearVerification(String email) {
        redisTemplate.delete(VERIFY_KEY_PREFIX + email);
    }

    @Transactional
    public void sendCode(EmailCodeSendRequest request){
        String code = String.valueOf((int)(Math.random() * 900000) + 100000);
        redisTemplate.opsForValue().set(CODE_KEY_PREFIX + request.email(),code, rules.getKeyExpirationMs());
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.email());
        message.setSubject("[듣기평가] 회원가입 인증코드");
        message.setText("인증코드: " + code + "\n\n10분 이내에 입력해주세염.");
        javaMailSender.send(message);



    }

    @Transactional
    public void confirmCode(EmailCodeConfirmRequest request) {
        String savedCode = redisTemplate.opsForValue().get(CODE_KEY_PREFIX + request.email());
        if (savedCode == null) throw new IllegalStateException("인증번호가 만료되었습니다.");
        if (!savedCode.equals(request.code())) throw new IllegalStateException("인증번호가 틀립니다 다시 입력해주세요");

        redisTemplate.delete(CODE_KEY_PREFIX + request.email());
        redisTemplate.opsForValue().set(VERIFY_KEY_PREFIX+ request.email(), "1", rules.getVerifyExpirationMs());

    }

}
