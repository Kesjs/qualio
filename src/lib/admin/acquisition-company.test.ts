import { describe, expect, it, vi } from 'vitest'
import { pickBestContact, resolveAppStoreCompany } from '@/lib/admin/acquisition-company'

describe('pickBestContact', () => {
  it('exclut suppressed/invalid et préfère une adresse nominative avant contact@/info@', () => {
    const best = pickBestContact([
      { id: '1', email: 'alice@swile.co', full_name: 'Alice', email_status: 'suppressed', confidence: 95 },
      { id: '2', email: 'contact@swile.co', full_name: null, email_status: 'verified', confidence: 90 },
      { id: '3', email: 'bob@swile.co', full_name: 'Bob', email_status: 'public', confidence: 70 },
      { id: '4', email: 'bad@swile.co', full_name: null, email_status: 'invalid', confidence: 99 },
    ])
    expect(best?.id).toBe('3')
    expect(best?.email).toBe('bob@swile.co')
  })

  it('retourne null si aucun contact utilisable', () => {
    expect(
      pickBestContact([
        { id: '1', email: 'a@x.fr', full_name: null, email_status: 'suppressed', confidence: 80 },
        { id: '2', email: 'b@x.fr', full_name: null, email_status: 'invalid', confidence: 80 },
      ]),
    ).toBeNull()
  })
})

describe('resolveAppStoreCompany', () => {
  it('retourne null si sellerUrl est nul ou pointe vers un réseau social, apple.com ou github', async () => {
    const admin = { from: vi.fn() }
    for (const url of [
      null,
      '',
      'https://apps.apple.com/fr/developer/swile',
      'https://github.com/swile/app',
      'https://www.linkedin.com/company/swile',
      'https://x.com/swile',
    ]) {
      const res = await resolveAppStoreCompany(admin, { sellerUrl: url, companyName: 'Swile' })
      expect(res).toBeNull()
    }
    expect(admin.from).not.toHaveBeenCalled()
  })

  it('réutilise une entreprise existante sans créer de doublon', async () => {
    const insertMock = vi.fn()
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { id: 'comp-1', name: 'Swile', domain: 'swile.co', source_notes: null },
    })
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            maybeSingle: maybeSingleMock,
          }),
        }),
        insert: insertMock,
      }),
    }

    const res = await resolveAppStoreCompany(admin, {
      sellerUrl: 'https://www.swile.co/fr/contact',
      companyName: 'Swile',
    })
    expect(res).toEqual({
      id: 'comp-1',
      name: 'Swile',
      domain: 'swile.co',
      source_notes: null,
      created: false,
    })
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('crée une entreprise avec le domaine nettoyé si elle n’existe pas encore', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null })
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: 'comp-2', name: 'Qlower', domain: 'qlower.com', source_notes: 'App Store' },
      error: null,
    })
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: singleMock,
      }),
    })
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            maybeSingle: maybeSingleMock,
          }),
        }),
        insert: insertMock,
      }),
    }

    const res = await resolveAppStoreCompany(admin, {
      sellerUrl: 'https://www.qlower.com/support',
      companyName: 'Qlower',
      country: 'fr',
    })
    expect(res).toEqual({
      id: 'comp-2',
      name: 'Qlower',
      domain: 'qlower.com',
      source_notes: 'App Store',
      created: true,
    })
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'qlower.com',
        name: 'Qlower',
      }),
    )
  })
})
