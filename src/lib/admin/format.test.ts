import { describe, expect, it } from 'vitest'
import { escapeLike, excerpt, formatDate, listHref, pageCount, parseFilter, parsePage, percent } from '@/lib/admin/format'
import { parseFeedbackPatch } from '@/lib/admin/feedback-patch'

describe('format admin', () => {
  it('formatDate gère les dates invalides sans planter', () => {
    expect(formatDate('2026-10-18T10:00:00Z')).toContain('2026')
    expect(formatDate('pas une date')).toBe('—')
    expect(formatDate(null)).toBe('—')
  })

  it('parsePage retombe sur 1 pour toute valeur invalide', () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage('0')).toBe(1)
    expect(parsePage('-3')).toBe(1)
    expect(parsePage('abc')).toBe(1)
    expect(parsePage('4')).toBe(4)
    expect(parsePage(['2', '5'])).toBe(2)
  })

  it('parseFilter refuse les valeurs hors liste', () => {
    expect(parseFilter('bug', ['bug', 'other'] as const)).toBe('bug')
    expect(parseFilter('drop table', ['bug', 'other'] as const)).toBe('')
    expect(parseFilter(undefined, ['bug'] as const)).toBe('')
  })

  it('listHref ignore les paramètres vides et la page 1', () => {
    expect(listHref('/admin/emails', { status: 'failed', type: '', page: 1 })).toBe('/admin/emails?status=failed')
    expect(listHref('/admin/emails', { page: 3 })).toBe('/admin/emails?page=3')
    expect(listHref('/admin/users', {})).toBe('/admin/users')
  })

  it('pageCount, percent et excerpt', () => {
    expect(pageCount(0, 25)).toBe(1)
    expect(pageCount(51, 25)).toBe(3)
    expect(percent(1, 3)).toBe(33)
    expect(percent(1, 0)).toBe(0)
    expect(excerpt('  un   texte\nlong  ', 8)).toBe('un text…')
  })

  it('escapeLike neutralise les jokers', () => {
    expect(escapeLike('100%_ok\\')).toBe('100\\%\\_ok\\\\')
  })
})

describe('parseFeedbackPatch', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000'
  it('accepte un statut, une priorité et une note', () => {
    const result = parseFeedbackPatch({ id, status: 'planned', priority: 'high', adminNote: '  à revoir  ' })
    expect(result).toEqual({ ok: true, id, changes: { status: 'planned', priority: 'high', admin_note: 'à revoir' } })
  })

  it('une note vide devient null', () => {
    expect(parseFeedbackPatch({ id, adminNote: '   ' })).toEqual({ ok: true, id, changes: { admin_note: null } })
  })

  it('refuse identifiant, statut, priorité ou note invalides, et les requêtes vides', () => {
    expect(parseFeedbackPatch({ id: 'x', status: 'done' }).ok).toBe(false)
    expect(parseFeedbackPatch({ id, status: 'inconnu' }).ok).toBe(false)
    expect(parseFeedbackPatch({ id, priority: 'urgent' }).ok).toBe(false)
    expect(parseFeedbackPatch({ id, adminNote: 'a'.repeat(2001) }).ok).toBe(false)
    expect(parseFeedbackPatch({ id }).ok).toBe(false)
    expect(parseFeedbackPatch(null).ok).toBe(false)
  })
})
