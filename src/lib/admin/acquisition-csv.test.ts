import { describe, expect, it } from 'vitest'
import { parseImport } from '@/lib/admin/acquisition-csv'

describe('import CSV acquisition', () => {
  it('lit un export avec point-virgule et accents', () => {
    const result = parseImport('Prénom;Nom;Email;Entreprise;Site web\nAïcha;Diallo;aicha@lebistro.fr;Le Bistro;https://www.lebistro.fr/\n')
    expect(result.rows).toEqual([{ email: 'aicha@lebistro.fr', domain: 'lebistro.fr', company: 'Le Bistro', name: 'Aïcha Diallo', role: '' }])
  })

  it('accepte une simple liste d’emails sans en-tête', () => {
    const result = parseImport('contact@hotel-plage.com\nreservation@hotel-mer.fr')
    expect(result.rows.map((row) => row.email)).toEqual(['contact@hotel-plage.com', 'reservation@hotel-mer.fr'])
    expect(result.rows[0].company).toBe('Hotel-plage')
  })

  it('rejette invalides, jetables, personnels et doublons avec la raison', () => {
    const result = parseImport('email\nnope\nx@mailinator.com\nmoi@gmail.com\na@shop.fr\nA@shop.fr')
    expect(result.rows.map((row) => row.email)).toEqual(['a@shop.fr'])
    expect(result.issues.map((issue) => issue.reason)).toEqual(['Email invalide', 'Email jetable', 'Adresse personnelle sans domaine d’entreprise', 'Doublon dans le fichier'])
  })

  it('garde une adresse gmail quand le domaine de l’entreprise est fourni', () => {
    const result = parseImport('email,domaine\nboss@gmail.com,monsalon.fr')
    expect(result.rows[0]).toMatchObject({ email: 'boss@gmail.com', domain: 'monsalon.fr' })
  })

  it('gère les guillemets et les virgules dans une cellule', () => {
    const result = parseImport('email,entreprise\na@shop.fr,"Dupont, Fils ""Bio"""')
    expect(result.rows[0].company).toBe('Dupont, Fils "Bio"')
  })
})
