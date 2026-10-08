import type { FormSelection, FormType } from '../types'

const TYPES = new Set<FormType>(['contact', 'newsletter', 'login', 'signup', 'other'])
export function validateFormSelection(value: unknown, siteUrl: string): FormSelection[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) throw new Error('Sélectionnez entre 1 et 20 formulaires.')
  const origin = new URL(siteUrl).origin
  const seen = new Set<string>()
  return value.map(item => {
    if (!item || typeof item !== 'object' || typeof item.signature !== 'string' || !/^[a-f0-9]{64}$/.test(item.signature)) throw new Error('Signature de formulaire invalide.')
    if (seen.has(item.signature)) throw new Error('Un formulaire ne peut être sélectionné qu’une fois.')
    seen.add(item.signature)
    if (!TYPES.has(item.formType)) throw new Error('Type de formulaire invalide.')
    if (typeof item.pageUrl !== 'string' || item.pageUrl.length > 2048) throw new Error('Page du formulaire invalide.')
    const page = new URL(item.pageUrl)
    if (page.origin !== origin || page.username || page.password) throw new Error('La page du formulaire doit appartenir au site.')
    if (item.formType === 'signup') {
      if (typeof item.testEmail !== 'string' || !/^qualio-test-\d{10,16}@qualio-test\.dev$/.test(item.testEmail)) throw new Error('L’email de test doit être affiché avant l’inscription.')
      return { signature: item.signature, pageUrl: page.toString(), formType: 'signup', testEmail: item.testEmail } as FormSelection
    }
    return { signature: item.signature, pageUrl: page.toString(), formType: item.formType } as FormSelection
  })
}
