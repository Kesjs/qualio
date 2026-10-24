import { describe, expect, it } from 'vitest'
import { areaIdFromNominatim, domainFromWebsite, overpassQuery, placesFromOverpass } from '@/lib/admin/acquisition-osm'

describe('découverte OpenStreetMap', () => {
  it('extrait le domaine et écarte réseaux sociaux et plateformes', () => {
    expect(domainFromWebsite('https://www.Le-Bistro.fr/carte')).toBe('le-bistro.fr')
    expect(domainFromWebsite('hotel-mer.com')).toBe('hotel-mer.com')
    expect(domainFromWebsite('https://www.facebook.com/lebistro')).toBeNull()
    expect(domainFromWebsite('https://fr.tripadvisor.com/Restaurant')).toBeNull()
    expect(domainFromWebsite('pas un site')).toBeNull()
    expect(domainFromWebsite(undefined)).toBeNull()
  })

  it('crée un prospect par domaine, avec email si valide, sans doublon ni domaine exclu', () => {
    const places = placesFromOverpass([
      { type: 'node', id: 1, tags: { name: 'Le Bistro', website: 'https://lebistro.fr', email: 'Contact@LeBistro.fr' } },
      { type: 'way', id: 2, tags: { name: 'Le Bistro 2', 'contact:website': 'http://www.lebistro.fr/autre' } },
      { type: 'node', id: 3, tags: { name: 'Chez Mo', website: 'chezmo.fr', email: 'pas-un-email' } },
      { type: 'node', id: 4, tags: { name: 'Déjà connu', website: 'connu.fr' } },
      { type: 'node', id: 5, tags: { website: 'sansnom.fr' } },
    ], new Set(['connu.fr']))
    expect(places).toEqual([
      { name: 'Le Bistro', domain: 'lebistro.fr', email: 'contact@lebistro.fr', sourceUrl: 'https://www.openstreetmap.org/node/1' },
      { name: 'Chez Mo', domain: 'chezmo.fr', email: null, sourceUrl: 'https://www.openstreetmap.org/node/3' },
    ])
  })

  it('calcule la zone Overpass et construit la requête', () => {
    expect(areaIdFromNominatim({ osm_type: 'relation', osm_id: 123 })).toBe(3_600_000_123)
    expect(areaIdFromNominatim({ osm_type: 'way', osm_id: 5 })).toBe(2_400_000_005)
    expect(areaIdFromNominatim({ osm_type: 'node', osm_id: 5 })).toBeNull()
    expect(overpassQuery({ filter: '["shop"="hairdresser"]', areaId: 3_600_000_123 })).toContain('area(3600000123)->.a;')
    expect(overpassQuery({ filter: '["shop"="hairdresser"]', bbox: [1, 2, 3, 4] })).toContain('(1,2,3,4)')
  })
})
