import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { oauthCallback } from '../api/auth.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

// 소셜 로그인 콜백 처리 페이지. (라우트: /oauth/callback 및 /oauth/:provider/callback)
// 구글 redirect_uri 가 여기(프론트 경로)로 오고, 이 페이지가 code를 백엔드에 fetch로 넘긴다.
// 구글이 브라우저를 이 주소로 되돌려 보내면(code 포함), 그 code를 백엔드에 넘겨 처리한다.
// - 기존 회원(isNewMember=false): 토큰 저장 후 메인으로.
// - 신규 회원(isNewMember=true): tempToken을 들고 닉네임 확정 화면으로.
export default function OauthCallbackPage() {
  const { provider = 'google' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()

  const [error, setError] = useState<string | null>(null)
  // StrictMode(개발)에서 effect가 두 번 실행되어 1회용 code를 두 번 교환하지 않도록 막는다.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const code = searchParams.get('code')
    const oauthError = searchParams.get('error') // 사용자가 동의를 거부하면 구글이 error를 붙여 보낸다.

    if (oauthError) {
      setError('로그인이 취소되었습니다.')
      return
    }
    if (!code) {
      setError('인증 코드가 없습니다. 다시 시도해주세요.')
      return
    }

    oauthCallback(provider, code)
      .then((res) => {
        if (!res.isNewMember && res.loginResponse) {
          // 기존 회원 → 토큰 저장 후 메인으로.
          completeLogin(res.loginResponse)
          navigate('/', { replace: true })
        } else if (res.isNewMember && res.tempToken) {
          // 신규 회원 → 닉네임 확정 화면으로 tempToken 전달.
          navigate('/oauth/register', {
            replace: true,
            state: { tempToken: res.tempToken, provider },
          })
        } else {
          setError('예상치 못한 응답입니다. 다시 시도해주세요.')
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : '로그인 처리에 실패했습니다.')
      })
    // provider/code는 첫 렌더 값만 쓰면 되므로 deps를 비운다(1회 실행).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      {!error ? (
        <>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          <p className="mt-6 text-lg text-gray-600">로그인 처리 중…</p>
        </>
      ) : (
        <div className="glass px-6 py-10">
          <p className="text-lg text-gray-600">{error}</p>
          <Link to="/login" className="btn-primary mt-6 inline-block">
            로그인으로 돌아가기
          </Link>
        </div>
      )}
    </div>
  )
}
