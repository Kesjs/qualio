import { describe, expect, it } from 'vitest'
import { analyzeCsv, COLUMN_HINTS, detectColumn, detectDelimiter, guessTextColumn, parseCsv, splitByContent, toCsv } from './csv'

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
    expect(detectColumn(['text', 'author'], COLUMN_HINTS.text)).toBe(0)
    expect(detectColumn(['Texte', 'author'], COLUMN_HINTS.text)).toBe(0)
    expect(detectColumn(['Auteur', 'DATE_CRÉATION'], COLUMN_HINTS.date)).toBe(1)
    expect(detectColumn(['Nom', 'Date'], COLUMN_HINTS.date)).toBe(1)
  })
})

describe('guessTextColumn', () => {
  it('choisit une colonne de texte même avec un en-tête métier inconnu', () => {
    expect(guessTextColumn(['customer_id', 'customer_note', 'status'], [
      ['42', 'La livraison était rapide et claire', 'open'],
      ['43', 'Je ne trouve pas ma facture', 'closed'],
    ])).toBe(1)
  })
})

describe('parseCsv : guillemets au milieu d’un champ', () => {
  it('garde un guillemet isolé comme du texte sans avaler la suite', () => {
    expect(parseCsv('content,author\nÉcran 27" parfait,Ada\nTrès bien,Bob')).toEqual([
      ['content', 'author'],
      ['Écran 27" parfait', 'Ada'],
      ['Très bien', 'Bob'],
    ])
  })
})

describe('analyzeCsv', () => {
  it('accepte un fichier bien formé et détecte les colonnes', () => {
    const result = analyzeCsv('content,author_name,created_at\n"Clair, simple",Camille,2026-10-01\nUtile,Nora,2026-10-02')
    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.detected).toEqual({ text: 0, author: 1, date: 2 })
    expect(result.rows[0].cells[0]).toBe('Clair, simple')
  })

  it('accepte une colonne de texte avec un nom métier non prévu', () => {
    const result = analyzeCsv('customer_id,customer_note,status\n42,"La livraison était rapide",open\n43,"Je ne trouve pas ma facture",closed')
    expect(result.errors).toEqual([])
    expect(result.detected.text).toBe(1)
  })

  it('signale une ligne dont le texte est coupé à chaque virgule, avec son numéro de ligne', () => {
    const result = analyzeCsv('content,author_name,created_at\nBien,Ada,2026-10-01\nLe parcours est clair, voire simple, mais long,Bob,2026-10-02')
    expect(result.rows).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].line).toBe(3)
    expect(result.errors[0].message).toContain('5 colonnes au lieu de 3')
  })

  it('numérote les lignes comme un tableur, retours à la ligne et lignes vides compris', () => {
    const result = analyzeCsv('content,author_name\n"ligne 1\nligne 2",Ada\n\ncassée,a,b,c')
    expect(result.errors[0].line).toBe(5)
  })

  it('détecte un guillemet jamais refermé', () => {
    const result = analyzeCsv('content,author_name\n"Avis ouvert,Ada\nAutre,Bob')
    expect(result.errors.some((issue) => issue.line === 2 && issue.message.includes('jamais refermé'))).toBe(true)
  })

  it('tolère une virgule finale vide et refuse un fichier sans ligne', () => {
    expect(analyzeCsv('content,author_name\nBien,Ada,\n').errors).toEqual([])
    expect(analyzeCsv('content,author_name').errors[0].message).toContain('au moins une ligne')
  })
})

describe('splitByContent', () => {
  it('compte les lignes sans texte comme ignorées', () => {
    const { rows } = analyzeCsv('content,author_name\nBien,Ada\n,Bob\n   ,Cy')
    expect(splitByContent(rows, 0)).toMatchObject({ ignored: 2 })
    expect(splitByContent(rows, 0).valid).toHaveLength(1)
    expect(splitByContent(rows, -1).valid).toHaveLength(0)
  })

  it('ignore aussi les dates illisibles, comme l’import serveur', () => {
    const { rows } = analyzeCsv('content,created_at\nBien,2026-10-01\nMoyen,pas une date\nSans date,')
    const result = splitByContent(rows, 0, 1)
    expect(result.valid).toHaveLength(2)
    expect(result.invalidDate).toBe(1)
  })
})
