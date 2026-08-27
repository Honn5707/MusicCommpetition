// 소셜 로그인 시작 헬퍼.
// 브라우저를 각 제공자의 인증 화면으로 보낸다(백엔드 API 호출이 아니라 직접 리다이렉트).
// redirect_uri 는 백엔드 oauth.redirect-uri 및 구글 콘솔 등록 URI 와 "정확히" 같아야 한다.

// 구글이 인증 후 브라우저를 되돌려 보낼 곳 = "프론트" 콜백 페이지(/oauth/callback).
// ※ 절대 백엔드 API 경로(/api/auth/...)를 쓰면 안 된다 — 그러면 구글이 브라우저를
//   백엔드로 직접 보내 JSON 응답이 화면에 그대로 노출된다. 여기는 리액트 라우터가
//   처리하는 페이지 경로여야 하고, 그 페이지가 code를 백엔드에 fetch로 넘긴다.
// 이 값은 구글 콘솔 "승인된 리디렉션 URI" 와 정확히 같아야 한다.
export function googleRedirectUri(): string {
  // 명시하면 그 값을, 없으면 현재 출처 기준 프론트 콜백 경로.
  return (
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/oauth/callback`
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
