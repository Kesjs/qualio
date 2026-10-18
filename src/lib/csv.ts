/** Lecture et écriture CSV minimales : guillemets, retours à la ligne, séparateur `,` ou `;`, BOM. */

export const CSV_MAX_BYTES = 5 * 1024 * 1024
export const CSV_MAX_ROWS = 5000

export function isCsvFileName(name: string) {
  return /\.csv$/i.test(name.trim())
}

export function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] ?? ''
  const semicolons = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semicolons > commas ? ';' : ','
}

export type CsvRecord = { line: number; cells: string[] }

/**
 * Lecture brute : chaque enregistrement garde le numéro de la ligne où il commence (celui d'un tableur).
 * Un guillemet n'ouvre un champ entre guillemets qu'en début de champ : `écran 27"` reste du texte.
 * `unclosedQuoteLine` indique un guillemet jamais refermé, cause classique des colonnes décalées.
 */
export function parseCsvRecords(text: string): { records: CsvRecord[]; unclosedQuoteLine: number | null } {
  const input = text.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(input)
  const records: CsvRecord[] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let quoteLine = 0
  let lineNo = 1
  let startLine = 1
  let atStart = true

  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    if (atStart && char !== '\r' && char !== '\n') { startLine = lineNo; atStart = false }
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') { cell += '"'; index++ } else quoted = false
      } else {
        if (char === '\n') lineNo++
        cell += char
      }
      continue
    }
    if (char === '"' && cell === '') { quoted = true; quoteLine = lineNo; continue }
    if (char === delimiter) { row.push(cell); cell = ''; continue }
    if (char === '\r') continue
    if (char === '\n') {
      row.push(cell); records.push({ line: startLine, cells: row })
      row = []; cell = ''; lineNo++; atStart = true
      continue
    }
    cell += char
  }
  if (cell.length || row.length) { row.push(cell); records.push({ line: startLine, cells: row }) }

  return {
    records: records
      .filter((record) => record.cells.some((value) => value.trim() !== ''))
      .map((record) => ({ line: record.line, cells: record.cells.map((value) => value.trim()) })),
    unclosedQuoteLine: quoted ? quoteLine : null,
  }
}

export function parseCsv(text: string): string[][] {
  return parseCsvRecords(text).records.map((record) => record.cells)
}

function escapeCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Écrit des lignes en CSV standard (virgule, guillemets si nécessaire). */
export function toCsv(rows: string[][]): string {
  return rows.map((cells) => cells.map(escapeCell).join(',')).join('\n')
}

export function normalizeHeader(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Synonymes reconnus par l'import serveur (routes /api/feedback/import). */
export const COLUMN_HINTS = {
  text: ['content', 'text', 'texte', 'feedback', 'avis', 'review', 'review_text', 'reviewtext', 'comment', 'commentaire', 'message', 'texte_avis', 'texte_du_commentaire'],
  author: ['author_name', 'name', 'nom', 'auteur'],
  date: ['created_at', 'date', 'created', 'date_creation'],
} as const

/** Index de la première colonne dont le nom figure dans `hints`, ou -1. */
export function detectColumn(headers: string[], hints: readonly string[]) {
  return headers.map(normalizeHeader).findIndex((header) => hints.includes(header))
}

/**
 * Fallback for real-world exports whose text column has a product-specific name.
 * Long, populated cells are much more likely to be review text than author/date fields.
 */
export function guessTextColumn(headers: string[], rows: string[][]) {
  if (!headers.length || !rows.length) return -1
  const scores = headers.map((_, index) => {
    const values = rows.map((row) => row[index]?.trim() ?? '').filter(Boolean)
    if (!values.length) return -1
    const averageLength = values.reduce((total, value) => total + value.length, 0) / values.length
    const coverage = values.length / rows.length
    return averageLength * coverage
  })
  return scores.reduce((best, score, index) => score > scores[best] ? index : best, 0)
}

/* ------------------------------------------------------------ Validation */

export type CsvIssue = { line: number | null; message: string }
export type CsvDataRow = { line: number; cells: string[] }
export type CsvAnalysis = {
  headers: string[]
  rows: CsvDataRow[]
  /** Erreurs bloquantes : tant qu'il y en a, l'aperçu serait faux et l'import est refusé. */
  errors: CsvIssue[]
  detected: { text: number; author: number; date: number }
}

/**
 * Analyse structurelle : une ligne dont le nombre de colonnes diffère de l'en-tête est une erreur
 * (le texte d'un avis coupé à chaque virgule), jamais une aperçu silencieusement décalé.
 */
export function analyzeCsv(text: string): CsvAnalysis {
  const { records, unclosedQuoteLine } = parseCsvRecords(text)
  const [head, ...body] = records
  const errors: CsvIssue[] = []
  const headers = head?.cells ?? []
  const detectedText = detectColumn(headers, COLUMN_HINTS.text)
  const detected = {
    text: detectedText >= 0 ? detectedText : guessTextColumn(headers, body.map((record) => record.cells)),
    author: detectColumn(headers, COLUMN_HINTS.author),
    date: detectColumn(headers, COLUMN_HINTS.date),
  }

  if (!head || !body.length) {
    return { headers, rows: [], errors: [{ line: null, message: 'Le fichier doit contenir un en-tête et au moins une ligne.' }], detected }
  }
  if (unclosedQuoteLine !== null) {
    errors.push({ line: unclosedQuoteLine, message: `Guillemet ouvert à la ligne ${unclosedQuoteLine} et jamais refermé : les lignes suivantes sont fusionnées dans la même cellule.` })
  }
  if (body.length > CSV_MAX_ROWS) {
    errors.push({ line: null, message: `Le fichier ne peut pas dépasser ${CSV_MAX_ROWS.toLocaleString('fr-FR')} lignes.` })
  }

  const rows: CsvDataRow[] = []
  for (const record of body) {
    const extra = record.cells.slice(headers.length)
    const cells = extra.every((value) => value === '') ? record.cells.slice(0, headers.length) : record.cells
    if (cells.length !== headers.length) {
      errors.push({ line: record.line, message: `Ligne ${record.line} : ${cells.length} colonne${cells.length > 1 ? 's' : ''} au lieu de ${headers.length}. Un texte contenant une virgule doit être entouré de guillemets.` })
      continue
    }
    rows.push({ line: record.line, cells })
  }
  return { headers, rows, errors, detected }
}

/** Même règle que l'import serveur : une date renseignée mais illisible fait ignorer la ligne. */
export function isValidCsvDate(value: string | undefined) {
  return !value || Number.isFinite(Date.parse(value))
}

/** Sépare les lignes importables de celles que l'import ignorerait (texte vide, date illisible). */
export function splitByContent(rows: CsvDataRow[], textColumn: number, dateColumn = -1) {
  const valid: CsvDataRow[] = []
  let emptyText = 0
  let invalidDate = 0
  for (const row of rows) {
    if (textColumn < 0 || (row.cells[textColumn] ?? '').trim() === '') { emptyText++; continue }
    if (dateColumn >= 0 && !isValidCsvDate(row.cells[dateColumn])) { invalidDate++; continue }
    valid.push(row)
  }
  return { valid, ignored: emptyText + invalidDate, emptyText, invalidDate }
}
