/** Import CSV de prospects : analyse, normalisation et validation (utilisé côté navigateur ET côté serveur). */

export type ImportRow = { email: string; domain: string; company: string; name: string; role: string }
export type RowIssue = { line: number; value: string; reason: string }
export type ParsedImport = { rows: ImportRow[]; issues: RowIssue[]; total: number }

export const MAX_IMPORT_ROWS = 500

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i
const DOMAIN_RE = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\.[a-z]{2,}$/i
const FREEMAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'icloud.com', 'orange.fr', 'free.fr', 'laposte.net', 'wanadoo.fr', 'sfr.fr', 'proton.me', 'protonmail.com'])
const DISPOSABLE = new Set(['mailinator.com', 'yopmail.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'trashmail.com'])

export function isValidEmail(value: string) { return EMAIL_RE.test(value.trim()) && value.length <= 254 }

export function cleanDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/?#].*$/, '')
}

export function companyFromDomain(domain: string) {
  const label = domain.split('.')[0] ?? domain
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function normalizeHeader(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

const HEADERS: Record<string, 'email' | 'domain' | 'company' | 'name' | 'first' | 'last' | 'role'> = {
  email: 'email', mail: 'email', courriel: 'email', emailaddress: 'email', adresseemail: 'email', workemail: 'email', professionalemail: 'email',
  domain: 'domain', domaine: 'domain', site: 'domain', website: 'domain', siteweb: 'domain', url: 'domain', companydomain: 'domain',
  company: 'company', entreprise: 'company', societe: 'company', organisation: 'company', organization: 'company', companyname: 'company', nomentreprise: 'company',
  name: 'name', nom: 'name', fullname: 'name', nomcomplet: 'name', contact: 'name',
  prenom: 'first', firstname: 'first', givenname: 'first',
  lastname: 'last', nomdefamille: 'last', familyname: 'last',
  role: 'role', poste: 'role', title: 'role', jobtitle: 'role', fonction: 'role', position: 'role',
}

/** Découpe un CSV (virgule, point-virgule ou tabulation ; guillemets et retours à la ligne gérés). */
export function splitCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const firstLine = source.split(/\r?\n/, 1)[0] ?? ''
  const counts = { ';': (firstLine.match(/;/g) ?? []).length, ',': (firstLine.match(/,/g) ?? []).length, '\t': (firstLine.match(/\t/g) ?? []).length }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const delimiter = best && best[1] > 0 ? best[0] : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1 }
      else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === delimiter) { row.push(cell); cell = '' }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1
      row.push(cell); cell = ''
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
    } else cell += char
  }
  row.push(cell)
  if (row.some((value) => value.trim() !== '')) rows.push(row)
  return rows
}

/** Valide une ligne déjà structurée. Retourne la ligne propre ou la raison du rejet. */
export function normalizeRow(input: Partial<ImportRow>): { row: ImportRow } | { reason: string } {
  const email = String(input.email ?? '').trim().toLowerCase()
  if (!isValidEmail(email)) return { reason: 'Email invalide' }
  const host = email.split('@')[1]
  if (DISPOSABLE.has(host)) return { reason: 'Email jetable' }
  const explicitDomain = cleanDomain(String(input.domain ?? ''))
  if (explicitDomain && !DOMAIN_RE.test(explicitDomain)) return { reason: 'Domaine invalide' }
  if (!explicitDomain && FREEMAIL.has(host)) return { reason: 'Adresse personnelle sans domaine d’entreprise' }
  const domain = explicitDomain || host
  const company = String(input.company ?? '').trim().slice(0, 120) || companyFromDomain(domain)
  return { row: { email, domain, company, name: String(input.name ?? '').trim().slice(0, 120), role: String(input.role ?? '').trim().slice(0, 120) } }
}

export function parseImport(text: string): ParsedImport {
  const table = splitCsv(text)
  if (!table.length) return { rows: [], issues: [], total: 0 }
  const headerKeys = table[0].map((cell) => HEADERS[normalizeHeader(cell)])
  const hasHeader = headerKeys.includes('email')
  let dataRows = table
  let keys: Array<string | undefined> = headerKeys
  if (hasHeader) dataRows = table.slice(1)
  else {
    const emailColumn = table[0].findIndex((cell) => cell.includes('@'))
    if (emailColumn === -1) return { rows: [], issues: [{ line: 1, value: table[0].join(' ').slice(0, 60), reason: 'Colonne « email » introuvable' }], total: table.length }
    keys = table[0].map((_, index) => (index === emailColumn ? 'email' : undefined))
  }
  const rows: ImportRow[] = []
  const issues: RowIssue[] = []
  const seen = new Set<string>()
  dataRows.slice(0, MAX_IMPORT_ROWS + 50).forEach((cells, index) => {
    const line = index + (hasHeader ? 2 : 1)
    const raw: Record<string, string> = {}
    cells.forEach((cell, column) => { const key = keys[column]; if (key && !raw[key]) raw[key] = cell.trim() })
    if (raw.first && raw.name && !raw.last) { raw.last = raw.name; raw.name = '' }
    const name = raw.name || [raw.first, raw.last].filter(Boolean).join(' ')
    const result = normalizeRow({ email: raw.email, domain: raw.domain, company: raw.company, name, role: raw.role })
    if ('reason' in result) { issues.push({ line, value: (raw.email ?? cells.join(' ')).slice(0, 60), reason: result.reason }); return }
    if (seen.has(result.row.email)) { issues.push({ line, value: result.row.email, reason: 'Doublon dans le fichier' }); return }
    seen.add(result.row.email)
    if (rows.length >= MAX_IMPORT_ROWS) { issues.push({ line, value: result.row.email, reason: `Au-delà de ${MAX_IMPORT_ROWS} lignes` }); return }
    rows.push(result.row)
  })
  return { rows, issues, total: dataRows.length }
}
