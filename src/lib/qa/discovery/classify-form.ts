import type { FormInfo, FormType } from '../types'

/** Field structure takes precedence over page copy (e.g. a footer newsletter). */
export function classifyForm(form: FormInfo, pageUrl = ''): FormType {
  const visibleFields = form.fields.filter(field => !field.hidden && !['hidden', 'submit', 'button'].includes(field.type))
  const fields = visibleFields.map(field => `${field.name} ${field.label ?? ''}`).join(' ').toLowerCase()
  const button = (form.submitButton ?? '').toLowerCase()
  const action = form.action.toLowerCase()
  const passwordCount = visibleFields.filter(field => field.type === 'password').length
  const email = visibleFields.some(field => field.type === 'email' || /email|e-mail|courriel/i.test(field.name))
  if (passwordCount) {
    if (passwordCount > 1 || /sign.?up|register|inscri|créer|create.*account|confirm.*password/.test(`${button} ${fields} ${action}`)) return 'signup'
    return 'login'
  }
  if (visibleFields.some(field => field.type === 'textarea') || /message|comment|objet|subject/.test(fields)) return 'contact'
  if (email && /newsletter|subscribe|abonn|actualit/.test(`${button} ${action} ${fields}`)) return 'newsletter'
  if (/contact|envoyer|send.*message/.test(`${button} ${action}`)) return 'contact'
  if (email && /sign.?up|register|inscri|create.*account/.test(`${button} ${action}`)) return 'signup'
  // Only use the page route when the form itself has no stronger signal.
  if (email && visibleFields.length <= 2 && /newsletter/.test(pageUrl)) return 'newsletter'
  return 'other'
}
