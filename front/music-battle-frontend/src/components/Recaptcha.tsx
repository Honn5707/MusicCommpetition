import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { loadRecaptchaApi } from '../lib/recaptcha.ts'

export interface RecaptchaHandle {
  // 제출 실패 시 토큰이 1회용이라 위젯을 다시 체크할 수 있도록 초기화한다.
  reset: () => void
}

interface RecaptchaProps {
  onChange: (token: string | null) => void
}

// VITE_RECAPTCHA_SITE_KEY 미설정 시 위젯을 그리지 않는다(회원가입 폼이 recaptchaToken 없이 막히는 걸
// 바로 알 수 있게, 조용히 숨기지 않고 안내 문구를 보여준다).
const Recaptcha = forwardRef<RecaptchaHandle, RecaptchaProps>(function Recaptcha({ onChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null) {
        window.grecaptcha?.reset(widgetIdRef.current)
        onChange(null)
      }
    },
  }))

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    let cancelled = false
    loadRecaptchaApi().then((grecaptcha) => {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return
      widgetIdRef.current = grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onChange(token),
        'expired-callback': () => onChange(null),
        'error-callback': () => onChange(null),
      })
    })

    return () => {
      cancelled = true
    }
  }, [siteKey, onChange])

  if (!siteKey) {
    return <p className="text-sm text-amber-600">VITE_RECAPTCHA_SITE_KEY가 설정되지 않았습니다.</p>
  }

  return <div ref={containerRef} />
})

export default Recaptcha
