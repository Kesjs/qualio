import type { FormInfo, FormTestability } from '../types'
import { detectCaptcha } from './detect-captcha'

export function detectUntestable(form: FormInfo, signals: {
  markup?: string; thirdPartyIframe?: boolean; multiStep?: boolean; spa?: boolean
} = {}): FormTestability {
  const captcha = detectCaptcha(signals.markup ?? '')
  if (captcha) return { testable: false, code: 'captcha', reason: `CAPTCHA détecté (${captcha}) : aucun contournement.` }
  if (signals.thirdPartyIframe) return { testable: false, code: 'third_party_iframe', reason: 'Formulaire dans une iframe tierce, non testable en V1.' }
  if (form.fields.some(field => field.type === 'file')) return { testable: false, code: 'file_upload', reason: 'Upload de fichier, non testable en V1.' }
  if (signals.multiStep || /\b(?:next step|next|continue|suivant|continuer|étape suivante)\b/i.test(form.submitButton ?? '')) return { testable: false, code: 'multi_step', reason: 'Formulaire multi-étapes, non testable en V1.' }
  if (signals.spa) return { testable: false, code: 'unsupported_spa', reason: 'Formulaire SPA sans balise <form> : soumission ciblée non prise en charge en V1.' }
  return { testable: true }
}
