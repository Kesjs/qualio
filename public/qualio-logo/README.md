# Qualio — Logo Package

Vectorisation fidèle du monogramme fourni (le "Qa" — anneau/Q ouvert +
lettre "a" en contour) : tracé nettoyé en courbes SVG (pas un simple import
bitmap), donc net à toutes les tailles, du favicon 16px à l'impression grand
format. Couleurs alignées sur la charte du spec produit : fond obsidienne
(#101010), bone (#eeeeee), orange signal (#ee6018).

## Contenu

- **src/** — tous les fichiers SVG source (monogramme vectoriel pur,
  modifiable/recolorable à l'infini)
- **export/mark/** — le monogramme seul, fond transparent, PNG 16 à 1024px
  (`monogram-bone`, `monogram-orange`, `monogram-obsidian`, `monogram-white`)
- **export/icon/** — le monogramme posé sur un carré à coins arrondis
  (`icon-obsidian-bone` = version principale identique à la référence,
  `icon-orange-obsidian` = variante orange signal, `icon-bone-obsidian` = fond clair)
- **export/lockup/** — logo complet (mark + "Qualio") en PNG @1x/@2x/@3x
  (`lockup-dark`, `lockup-light`, `lockup-brand-dark` = mark orange + texte bone,
  `lockup-mono-black`/`lockup-mono-white`)
- **export/wordmark/** — le mot "Qualio" seul, sans le mark
- **export/favicon/** — favicon.ico (16/32/48) + PNG individuels
- **export/app-icons/** — apple-touch-icon, android-chrome (192/512),
  et une version "maskable" avec marge de sécurité pour Android adaptive icons

## Usage rapide

- Site web (header, dark UI) → `lockup-dark` ou `lockup-brand-dark`
- Site web (fond clair) → `lockup-light`
- Favicon → `export/favicon/favicon.ico`
- Réseaux sociaux / avatar → `icon-obsidian-bone-512.png` ou `-1024.png`
- Document imprimé en noir seul → `monogram-obsidian`

Tous les SVG sont éditables directement (couleurs en variables hex simples,
pas de dégradé, pas d'ombre).
