import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.tsx'
import { ApiError } from '../api/client.ts'
import Recaptcha, { type RecaptchaHandle } from '../components/Recaptcha.tsx'

type Mode = 'login' | 'register'

// 로그인 후 돌아갈 위치. 다른 페이지에서 navigate('/login', { state: { from } }) 로 넘겨준다.
interface LocationState {
  from?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  const from = (location.state as LocationState | null)?.from ?? '/'

  const [mode, setMode] = useState<Mode>('login')
  const [providerId, setProviderId] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<RecaptchaHandle>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setRecaptchaToken(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const id = providerId.trim()
    if (!id) {
      setError('아이디를 입력해주세요.')
      return
    }
    if (password.length < 8 || password.length > 16) {
      setError('비밀번호는 8~16자여야 합니다.')
      return
    }
    if (mode === 'register') {
      const name = nickname.trim()
      if (name.length < 2) {
        setError('닉네임은 2자 이상이어야 합니다.')
        return
      }
      if (!recaptchaToken) {
        setError('로봇이 아님을 확인해주세요.')
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'register') {
        await register(id, password, nickname.trim(), recaptchaToken!)
      } else {
        await login(id, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '요청에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitting(false)
      // 토큰은 1회용이라 실패 후 재시도하려면 체크박스를 다시 눌러야 한다.
      recaptchaRef.current?.reset()
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link to="/" className="text-sm text-white/40 transition-colors hover:text-white">
        ← 목록으로
      </Link>

      <div className="glass mt-6 p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>
        <p className="mt-1.5 text-sm text-white/50">
          {mode === 'login'
            ? '듣기평가를 만들거나 도전하려면 로그인하세요.'
            : '아이디와 비밀번호로 계정을 만드세요.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">아이디</label>
            <input
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="아이디"
              autoFocus
              autoComplete="username"
              className="glass-input"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">닉네임</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2~20자"
                maxLength={20}
                className="glass-input"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8~16자"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="glass-input"
            />
          </div>

          {mode === 'register' && (
            <Recaptcha ref={recaptchaRef} onChange={setRecaptchaToken} />
          )}

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? '처리 중…' : mode === 'login' ? '로그인' : '가입하고 시작하기'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-white/50">
          {mode === 'login' ? (
            <>
              아직 계정이 없나요?{' '}
              <button
                onClick={() => switchMode('register')}
                className="font-medium text-fuchsia-300 underline-offset-2 hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있나요?{' '}
              <button
                onClick={() => switchMode('login')}
                className="font-medium text-fuchsia-300 underline-offset-2 hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
