import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.tsx'
import { ApiError } from '../api/client.ts'
import { confirmEmailCode, sendEmailCode } from '../api/email.ts'
import { startGoogleLogin } from '../lib/oauth.ts'

type Mode = 'login' | 'register'

// 구글 컬러 G 로고(간단 인라인 SVG).
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

// 이메일 형식 프론트 검증(UX용). 최종 검증은 백엔드가 한다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // ── 이메일 인증 상태 ──
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [confirmingCode, setConfirmingCode] = useState(false)
  // 이메일 인증 관련 안내(성공 흐름) 메시지. 에러는 error에 따로 담는다.
  const [emailNotice, setEmailNotice] = useState<string | null>(null)
  // 소셜 로그인 관련 안내(미설정/준비중 등).
  const [socialNote, setSocialNote] = useState<string | null>(null)

  function handleGoogleLogin() {
    setSocialNote(null)
    try {
      startGoogleLogin() // 구글 인증 화면으로 리다이렉트
    } catch {
      setSocialNote('구글 로그인이 아직 설정되지 않았습니다. (VITE_GOOGLE_CLIENT_ID 필요)')
    }
  }

  // 카카오/네이버는 버튼만 우선 배치(백엔드 추가 예정).
  function handleComingSoon(name: string) {
    setSocialNote(`${name} 로그인은 준비 중이에요.`)
  }

  function resetEmailFlow() {
    setEmail('')
    setCode('')
    setCodeSent(false)
    setEmailVerified(false)
    setEmailNotice(null)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    resetEmailFlow()
  }

  // 이메일을 수정하면 이전 발송/인증 상태를 초기화한다(다른 주소로 인증되는 혼동 방지).
  function handleEmailChange(next: string) {
    setEmail(next)
    if (codeSent || emailVerified || emailNotice) {
      setCode('')
      setCodeSent(false)
      setEmailVerified(false)
      setEmailNotice(null)
    }
  }

  async function handleSendCode() {
    const addr = email.trim()
    if (!EMAIL_RE.test(addr)) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }
    setSendingCode(true)
    setError(null)
    try {
      await sendEmailCode({ email: addr })
      setCodeSent(true)
      setEmailNotice('인증코드가 발송되었습니다. 메일함을 확인해주세요. (10분 이내 유효)')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '인증코드 발송에 실패했습니다.')
    } finally {
      setSendingCode(false)
    }
  }

  async function handleConfirmCode() {
    const addr = email.trim()
    if (!code.trim()) {
      setError('인증코드를 입력해주세요.')
      return
    }
    setConfirmingCode(true)
    setError(null)
    try {
      await confirmEmailCode({ email: addr, code: code.trim() })
      setEmailVerified(true)
      setEmailNotice('이메일 인증이 완료되었습니다.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '인증코드 확인에 실패했습니다.')
    } finally {
      setConfirmingCode(false)
    }
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
      // 이메일 인증은 강제하지 않는다 — 미인증이면 백엔드가 409로 막아 에러 메시지를 보여준다.
      // (인증받는 동안에도 아이디/닉네임/비밀번호 입력과 가입 신청이 가능하도록)
      const name = nickname.trim()
      if (name.length < 2) {
        setError('닉네임은 2자 이상이어야 합니다.')
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'register') {
        await register(id, password, nickname.trim(), email.trim())
      } else {
        await login(id, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '요청에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link to="/" className="text-sm text-gray-400 transition-colors hover:text-gray-900">
        ← 목록으로
      </Link>

      <div className="glass mt-6 p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {mode === 'login'
            ? '노래대결을 만들거나 도전하려면 로그인하세요.'
            : '이메일 인증 후 계정을 만드세요.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* 회원가입: 이메일 인증 블록 */}
          {mode === 'register' && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={emailVerified}
                  className="glass-input flex-1 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || emailVerified}
                  className="btn-ghost shrink-0 whitespace-nowrap px-3 disabled:opacity-40"
                >
                  {sendingCode ? '발송 중…' : codeSent ? '재발송' : '인증코드 받기'}
                </button>
              </div>

              {/* 코드 입력창: 발송 후 && 미인증일 때만 활성화 */}
              {codeSent && !emailVerified && (
                <div className="mt-3 flex gap-2">
                  <input
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6자리 인증코드"
                    maxLength={6}
                    className="glass-input flex-1 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmCode}
                    disabled={confirmingCode}
                    className="btn-primary shrink-0 whitespace-nowrap px-4 disabled:opacity-40"
                  >
                    {confirmingCode ? '확인 중…' : '확인'}
                  </button>
                </div>
              )}

              {emailVerified && (
                <p className="mt-2 text-sm font-medium text-brand-600">✓ 이메일 인증 완료</p>
              )}
              {!emailVerified && emailNotice && (
                <p className="mt-2 text-sm text-gray-700">{emailNotice}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">아이디</label>
            <input
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="아이디"
              autoFocus={mode === 'login'}
              autoComplete="username"
              className="glass-input"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">닉네임</label>
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
            <label className="mb-1.5 block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8~16자"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="glass-input"
            />
          </div>

          {error && <p className="text-sm text-gray-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-40"
          >
            {submitting ? '처리 중…' : mode === 'login' ? '로그인' : '가입하고 시작하기'}
          </button>
        </form>

        {/* 소셜 로그인 */}
        <div className="mt-6">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            또는 소셜 계정으로
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{ textShadow: 'none' }}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white/95 px-4 py-2.5 font-semibold text-gray-800 transition-colors hover:bg-white"
            >
              <GoogleIcon />
              Google로 로그인
            </button>
            <button
              type="button"
              onClick={() => handleComingSoon('카카오')}
              style={{ textShadow: 'none' }}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#FEE500] px-4 py-2.5 font-semibold text-[#191600] transition-opacity hover:opacity-90"
            >
              <span className="text-lg leading-none">💬</span>
              카카오로 로그인
            </button>
            <button
              type="button"
              onClick={() => handleComingSoon('네이버')}
              style={{ textShadow: 'none' }}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#03C75A] px-4 py-2.5 font-semibold text-gray-900 transition-opacity hover:opacity-90"
            >
              <span className="font-black">N</span>
              네이버로 로그인
            </button>
          </div>

          {socialNote && <p className="mt-3 text-center text-sm text-amber-600">{socialNote}</p>}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <>
              아직 계정이 없나요?{' '}
              <button
                onClick={() => switchMode('register')}
                className="font-medium text-gray-600 underline-offset-2 hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있나요?{' '}
              <button
                onClick={() => switchMode('login')}
                className="font-medium text-gray-600 underline-offset-2 hover:underline"
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
