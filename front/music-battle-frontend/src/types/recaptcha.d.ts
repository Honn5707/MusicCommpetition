// Google reCAPTCHA v2 스크립트의 최소 타입 선언. widget render/reset만 쓰므로 과한 패키지는 안 씀.
export {}

declare global {
  interface Window {
    grecaptcha?: ReCaptchaV2
    onRecaptchaApiReady?: () => void
  }

  interface ReCaptchaV2 {
    render(container: string | HTMLElement, params: ReCaptchaRenderParams): number
    reset(widgetId?: number): void
    getResponse(widgetId?: number): string
  }

  interface ReCaptchaRenderParams {
    sitekey: string
    callback?: (token: string) => void
    'expired-callback'?: () => void
    'error-callback'?: () => void
  }
}
