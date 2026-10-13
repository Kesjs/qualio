import { describe, expect, it } from 'vitest'
import { COLUMN_HINTS, detectColumn, detectDelimiter, parseCsv, toCsv } from './csv'

describe('parseCsv', () => {
  it('lit les virgules entre guillemets et les guillemets doublés', () => {
    expect(parseCsv('content,author\n"Je pense, donc ""j\'ai"" un avis",Ada')).toEqual([
      ['content', 'author'],
      ['Je pense, donc "j\'ai" un avis', 'Ada'],
    ])
  })

  it('gère le point-virgule, le BOM et les fins de ligne Windows', () => {
    const rows = parseCsv('\uFEFFavis;date\r\nTrès bien;2026-10-01\r\nÀ revoir;2026-10-02\r\n')
    expect(rows).toEqual([['avis', 'date'], ['Très bien', '2026-10-01'], ['À revoir', '2026-10-02']])
  })

  it('ignore les lignes vides et garde les retours à la ligne entre guillemets', () => {
    expect(parseCsv('content\n\n"ligne 1\nligne 2"\n\n')).toEqual([['content'], ['ligne 1\nligne 2']])
  })

  it('détecte le séparateur sur la première ligne', () => {
    expect(detectDelimiter('a;b;c,d')).toBe(';')
    expect(detectDelimiter('a,b,c')).toBe(',')
  })
})

describe('toCsv', () => {
  it('échappe les cellules et reste lisible par parseCsv', () => {
    const rows = [['content', 'author_name'], ['Avis, avec "guillemets"', 'Ken']]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})

describe('detectColumn', () => {
  it('trouve la colonne texte, avec ou sans accents et majuscules', () => {
    expect(detectColumn(['Date', 'Commentaire'], COLUMN_HINTS.text)).toBe(1)
    expect(detectColumn(['Auteur', 'DATE_CRÉATION'], COLUMN_HINTS.date)).toBe(1)
    expect(detectColumn(['Nom', 'Date'], COLUMN_HINTS.date)).toBe(1)
  })
})
