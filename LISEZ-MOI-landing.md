# Patch landing Qualio

## Appliquer
Copier le dossier `src/` de ce zip par-dessus `src/` du dépôt (mêmes chemins), ou `git apply qualio-landing.diff`.
Puis : `npm run lint && npx tsc --noEmit && npm run build`, et vérifier sur téléphone.
Facultatif : supprimer `public/qualio-hero-feedback-map.png` (1,7 Mo), plus utilisé nulle part.

## Ce qui change
| Fichier | Changement |
|---|---|
| `app/layout.tsx` | Manrope et JetBrains Mono chargées via `next/font/google` |
| `app/globals.css` | Retrait des 2 variables de police « en dur » qui masquaient next/font ; ajout du bloc CSS `hs-*` (scène du hero + réduction des animations) |
| `landing/HeroScene.tsx` (nouveau) | Scène vivante du hero : avis → thème « Facturation » (14) → recommandation. Jouée une fois à l'entrée à l'écran, parallaxe léger, version verticale sur mobile, état final si « réduire les animations » |
| `landing/LightLanding.tsx` | Hero : scène à la place du PNG, texte sans `Reveal` (visible sans attendre React), titre sur une ligne dès 1024 px, hauteur du hero réduite pour laisser entrevoir la scène |
| `landing/tokens.ts` | `ACCENT_INK` (#c2410c, ≥ 4,5:1 sur blanc) pour texte et boutons pleins ; `SAGE` |
| `primitives.tsx`, `SiteShell.tsx`, `StepDemos.tsx`, `WeeklyScreen.tsx`, `PricingCards.tsx`, `legal.tsx`, `sections.tsx` | Boutons, badges et textes orange passent à `ACCENT_INK` ; `ACCENT` reste pour les aplats décoratifs |
| `SiteShell.tsx` | `MotionConfig reducedMotion="user"` ; fond blanc forcé sur `<html>` (rebond iOS) |
| `sections.tsx` | `StepsFull` déplacé ; accordéon FAQ sans animation si « réduire les animations » |
| `landing/StepsFull.tsx` (nouveau) | Les 4 démos ne sont plus importées par la landing, seule `/produit` les charge |
| `StepDemos.tsx` | Zone tactile de « Rejouer » agrandie ; classe `qualio-demo` (transitions coupées si « réduire les animations ») |

## Vérifié ici
- La scène du hero a été rendue dans Chromium à 360, 768, 1024 et 1440 px (état final et milieu d'animation).
- La landing, `/produit` et `/exemple` se rendent côté serveur sans erreur d'exécution (bibliothèques simulées).
- Syntaxe TypeScript des 13 fichiers modifiés : 0 erreur.

## Non vérifié (à faire chez toi)
- `npm run build`, `tsc` complet et `lint` : impossible ici (pas de réseau, dépendances absentes).
- Le rendu complet avec Tailwind (seule la scène a été vue dans un navigateur).
- `next/font/google` télécharge les polices au build : il faut du réseau au build (Vercel : OK).
- Sur téléphone réel : fluidité du parallaxe, tableau de comparaison à 320 px, menu mobile.

## À reporter dans le doc (version 2.0)
> **Hero (changé, v2.0).** Le hero n'est plus inchangé : l'image fixe est remplacée par une scène animée en HTML/SVG (avis → thème → recommandation), jouée une seule fois à l'entrée à l'écran, avec un léger parallaxe au défilement. Elle montre le même exemple que le reste de la landing (« Facturation », 14 avis sur 40). Sans animation si l'utilisateur a demandé moins de mouvement. Contrastes : texte et boutons orange passent de #ee6018 à #c2410c (AA).
