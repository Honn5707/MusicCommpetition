package com.musicbattle.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * 예외를 각 컨트롤러에서 try-catch로 흩뿌리지 않고 한 곳에서 상태코드로 변환한다.
 * 실무에서 API 응답 포맷 일관성을 지키는 표준 패턴.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }



    // 동시 투표 경합으로 낙관적 락이 걸리면 클라이언트에 "다시 시도하세요"로 안내.
    // 실무에서는 여기에 @Retryable 을 얹어 서버가 자동 재시도하는 방식도 흔하다.
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLock(ObjectOptimisticLockingFailureException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "요청이 몰려 처리가 지연되었습니다. 다시 시도해 주세요."));

    }


    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> handleValidation(MethodArgumentNotValidException e){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "에러가 발생하였습니다:" +e.getBindingResult().getFieldError().getDefaultMessage() ));
    }

    @ExceptionHandler(Exception.class)

    public ResponseEntity<Map<String, String>> handleUnexpected(Exception e){
        log.error("예상치 못한 예외 발생:" , e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "에러가 발생하였습니다"));
    }
}
