// 소셜 로그인 시작 헬퍼.
// 브라우저를 각 제공자의 인증 화면으로 보낸다(백엔드 API 호출이 아니라 직접 리다이렉트).
// redirect_uri 는 백엔드 oauth.redirect-uri 및 구글 콘솔 등록 URI 와 "정확히" 같아야 한다.

// 프론트 콜백 라우트. 구글이 여기로 브라우저를 되돌려 보내면, 그 페이지가 code를 백엔드에 넘긴다.
export function googleRedirectUri(): string {
  // 명시적으로 지정하면 그 값을, 없으면 현재 출처 기준 프론트 콜백 경로를 쓴다.
  return (
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/oauth/google/callback`
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
