/// <reference types="vite/client" />

// 선택적 환경변수 타입 선언. 설정 시 유튜브 검색이 활성화된다(미설정이면 링크 붙여넣기 폴백).
interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY?: string
  // 회원가입 폼의 reCAPTCHA v2 체크박스에 쓰인다. 백엔드 recaptcha.secret과 짝을 이루는 사이트 키.
  readonly VITE_RECAPTCHA_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
