// reCAPTCHA v2 스크립트를 한 번만 로드하고, 로드가 끝나면 window.grecaptcha를 리턴한다.
let apiPromise: Promise<ReCaptchaV2> | null = null

export function loadRecaptchaApi(): Promise<ReCaptchaV2> {
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha)
      return
    }

    window.onRecaptchaApiReady = () => resolve(window.grecaptcha as ReCaptchaV2)

    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaApiReady&render=explicit'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })

  return apiPromise
}
