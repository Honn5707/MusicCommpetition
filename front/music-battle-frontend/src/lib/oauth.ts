// 소셜 로그인 시작 헬퍼.
// 브라우저를 각 제공자의 인증 화면으로 보낸다(백엔드 API 호출이 아니라 직접 리다이렉트).
// redirect_uri 는 백엔드 oauth.redirect-uri 및 구글 콘솔 등록 URI 와 "정확히" 같아야 한다.

// 구글이 인증 후 브라우저를 되돌려 보낼 곳 = 백엔드 콜백 API(/api/auth/google/callback).
// 이 값은 구글 콘솔 등록 URI 및 백엔드 oauth.redirect-uri 와 "정확히" 같아야 한다.
export function googleRedirectUri(): string {
  // 명시하면 그 값을(로컬은 백엔드 포트가 달라 반드시 지정), 없으면 현재 출처 기준 백엔드 경로.
  // (배포처럼 프론트/백엔드가 같은 도메인일 때만 폴백이 유효하다.)
  return (
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/api/auth/google/callback`
  )
}

export function hasGoogleLogin(): boolean {
  return !!import.meta.env.VITE_GOOGLE_CLIENT_ID
}

// 구글 인증 화면으로 이동한다.
export function startGoogleLogin(): void {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    // 키가 없으면 리다이렉트해봤자 구글이 400을 낸다. 개발자가 바로 알 수 있게 막는다.
    throw new Error('VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다.')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'email profile',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
