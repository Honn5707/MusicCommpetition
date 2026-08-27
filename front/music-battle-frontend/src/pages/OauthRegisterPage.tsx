import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { oauthRegister } from '../api/auth.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

interface LocationState {
  tempToken?: string
  provider?: string
}

// 소셜 신규 회원 닉네임 확정 화면. (라우트: /oauth/register)
// 콜백 페이지에서 navigate state로 넘겨준 tempToken으로 닉네임만 정해 가입을 마친다.
export default function OauthRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeLogin } = useAuth()

  const state = location.state as LocationState | null
  const tempToken = state?.tempToken

  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // tempToken 없이 이 페이지에 직접 들어온 경우(새로고침/북마크 등)는 처리할 수 없다.
  if (!tempToken) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="glass px-6 py-10">
          <p className="text-lg text-gray-600">인증 정보가 없습니다. 로그인을 다시 시작해주세요.</p>
          <Link to="/login" className="btn-primary mt-6 inline-block">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = nickname.trim()
    if (name.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await oauthRegister({ tempToken: tempToken!, name })
      completeLogin(res)
      navigate('/', { replace: true })
    } catch (err) {
      // 만료된 tempToken("인증 기간이 만료되었습니다"), 중복 닉네임 등은 백엔드 메시지를 그대로 보여준다.
      setError(err instanceof ApiError ? err.message : '가입에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="glass p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">닉네임을 정해주세요</h1>
        <p className="mt-1.5 text-sm text-gray-500">노래대결에서 사용할 이름이에요.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">닉네임</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="2~20자"
              maxLength={20}
              autoFocus
              className="glass-input"
            />
          </div>

          {error && <p className="text-sm text-gray-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-40">
            {submitting ? '처리 중…' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
