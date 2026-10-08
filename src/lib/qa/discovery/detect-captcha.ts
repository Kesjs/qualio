export type CaptchaProvider = 'reCAPTCHA' | 'hCaptcha' | 'Turnstile'

export function detectCaptcha(markup: string): CaptchaProvider | null {
  if (/g-recaptcha|grecaptcha|recaptcha\/(?:api|enterprise)|recaptcha\.net|google\.com\/recaptcha/i.test(markup)) return 'reCAPTCHA'
  if (/h-captcha|hcaptcha\.com|hcaptcha-response/i.test(markup)) return 'hCaptcha'
  if (/cf-turnstile|challenges\.cloudflare\.com\/turnstile|turnstile-response/i.test(markup)) return 'Turnstile'
  return null
}
