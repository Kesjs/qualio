/** Lecture et écriture CSV minimales : guillemets, retours à la ligne, séparateur `,` ou `;`, BOM. */

export function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] ?? ''
  const semicolons = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semicolons > commas ? ';' : ','
}

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(input)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') { cell += '"'; index++ } else quoted = false
      } else cell += char
      continue
    }
    if (char === '"') { quoted = true; continue }
    if (char === delimiter) { row.push(cell); cell = ''; continue }
    if (char === '\r') continue
    if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue }
    cell += char
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row) }

  return rows
    .filter((cells) => cells.some((value) => value.trim() !== ''))
    .map((cells) => cells.map((value) => value.trim()))
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
  text: ['content', 'feedback', 'avis', 'comment', 'commentaire', 'message'],
  author: ['author_name', 'name', 'nom', 'auteur'],
  date: ['created_at', 'date', 'created', 'date_creation'],
} as const

/** Index de la première colonne dont le nom figure dans `hints`, ou -1. */
export function detectColumn(headers: string[], hints: readonly string[]) {
  return headers.map(normalizeHeader).findIndex((header) => hints.includes(header))
}
