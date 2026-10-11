import { describe, expect, it } from 'vitest'
import { chooseActiveSite, selectedIdFromProjectEvent } from './useActiveSite'

describe('useActiveSite selection', () => {
  it('falls back to the first project when the saved id disappeared', () => {
    const sites = [{ id: 'first' }, { id: 'second' }]
    expect(chooseActiveSite(sites, 'deleted')?.id).toBe('first')
    expect(chooseActiveSite(sites, 'second')?.id).toBe('second')
  })

  it('reacts to an explicit project-changed event', () => {
    const event = { detail: { siteId: 'second' } } as CustomEvent<{ siteId?: string }>
    expect(selectedIdFromProjectEvent(event, () => 'first')).toBe('second')
    expect(selectedIdFromProjectEvent({ detail: {} } as CustomEvent, () => 'first')).toBe('first')
  })
})
