/// <reference types="vite/client" />

// 선택적 환경변수 타입 선언. 설정 시 유튜브 검색이 활성화된다(미설정이면 링크 붙여넣기 폴백).
interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
