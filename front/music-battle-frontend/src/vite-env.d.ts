/// <reference types="vite/client" />

// 선택적 환경변수 타입 선언. 설정 시 유튜브 검색이 활성화된다(미설정이면 링크 붙여넣기 폴백).
interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY?: string
  // 회원가입 폼의 reCAPTCHA v2 체크박스에 쓰인다. 백엔드 recaptcha.secret과 짝을 이루는 사이트 키.
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  // 구글 OAuth 클라이언트 ID(공개 값). 설정 시 "Google로 로그인" 버튼이 동작한다.
  readonly VITE_GOOGLE_CLIENT_ID?: "928248154948-cifoc9uggihvb11d0gt2qo6lrli9i3et.apps.googleusercontent.com"
  // 구글 리다이렉트 URI. 미설정 시 현재 출처의 /oauth/google/callback 을 쓴다.
  // 백엔드 oauth.redirect-uri 및 구글 콘솔 등록 URI와 반드시 동일해야 한다.
  readonly VITE_GOOGLE_REDIRECT_URI?: "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"
  // 실시간 댓글 STOMP 브로커 URL. 미설정 시 ws://localhost:8080/ws 를 쓴다.
  readonly VITE_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
