import type { FieldInfo, FormType } from '../types'

export function createSignupTestEmail(timestamp = Date.now()): `qualio-test-${number}@qualio-test.dev` {
  return `qualio-test-${timestamp}@qualio-test.dev`
}

export function isHoneypot(field: Pick<FieldInfo, 'name' | 'type'> & { hidden?: boolean }): boolean {
  return field.hidden === true || field.type === 'hidden' || /(?:honeypot|honey_pot|botcheck|bot_check|trap|fax_only|website_url_confirm)/i.test(field.name)
}

export function testDataForField(field: FieldInfo, options: {
  formType: FormType; email?: string; username?: string; password?: string
}): string {
  if (isHoneypot(field)) return ''
  const name = `${field.name} ${field.label ?? ''}`.toLowerCase()
  if (field.type === 'password') return options.password ?? 'QualioTest!2026_invalid'
  if (field.type === 'email' || /email|e-mail|courriel/.test(name)) return options.email ?? 'qualio-test@qualio-test.dev'
  if (/username|user_name|identifiant|login/.test(name)) return options.username ?? options.email ?? 'qualio-test-invalid'
  if (field.type === 'tel' || /phone|téléphone|telephone/.test(name)) return '+33600000000'
  if (field.type === 'url') return 'https://qualio-test.dev'
  if (['number', 'range'].includes(field.type)) return '1'
  if (field.type === 'date') return '2000-01-01'
  if (field.type === 'datetime-local') return '2000-01-01T12:00'
  if (field.type === 'time') return '12:00'
  if (/last.?name|surname|nom de famille/.test(name)) return 'Test Qualio'
  if (/first.?name|prénom|prenom/.test(name)) return 'Qualio'
  if (/name|nom/.test(name)) return 'Qualio Test'
  if (/subject|objet/.test(name)) return '[TEST QUALIO] Vérification du formulaire'
  return '[TEST QUALIO] Soumission de test autorisée. Vous pouvez ignorer ce message.'
}
