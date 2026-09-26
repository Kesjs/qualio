---
name: combo
description: Applique automatiquement toute la séquence de commandes Impeccable "Operate" (bolder, animate, colorize, clarify, adapt, harden, distill, polish) sur une cible donnée (composant, page ou dossier). Utilise ce skill dès que Ken demande de "passer une page/un composant à Impeccable", de "faire la passe operate", ou d'appliquer le traitement complet Impeccable sur une cible, sans qu'il ait besoin d'énumérer les commandes une à une.
---

# Impeccable — Séquence "Operate"

Ce skill enchaîne automatiquement les commandes du système Impeccable (installé dans `.cursor/skills/impeccable`) dans un ordre fixe, sur une cible unique (fichier, composant ou dossier), pour les interfaces de type **Operate** (dashboards, formulaires, tables, écrans d'usage interne).

## Quand l'utiliser

- Ken donne une cible (chemin de fichier, nom de composant, nom de page) et demande d'y appliquer Impeccable / la passe complète / le traitement standard / combo.
- Il n'a pas besoin de répéter la liste des commandes : ce skill le fait à sa place.
- Si Ken précise un autre mode (Persuade, Read, Experience) ou une autre séquence, adapte l'ordre mais garde ce fichier comme référence de structure.

## Séquence à exécuter, dans cet ordre exact

1. **bolder** [target] — amplifie contrastes, typo, caractère (si l'interface est trop plate/générique).
2. **animate** [target] — ajoute des micro-animations ciblées (Framer Motion / transitions CSS, feedback sur boutons).
3. **colorize** [target] — ajoute une palette stratégique et subtile si l'interface est trop monochrome.
4. **clarify** [target] — révise l'UX writing (libellés, messages d'erreur, tooltips).
5. **adapt** [target] — ajuste le responsive (375px mobile, 768px tablette, 1440px desktop).
6. **harden** [target] — ajoute les états de chargement (skeletons), erreurs, empty states, cas limites.
7. **distill** [target] — élimine le superflu, simplifie vers l'essentiel.
8. **polish** [target] — passe de finition finale : alignements, micro-espacements, bordures, états :hover/:focus/:active/:disabled.

## Règles de rendu strictes & Anti-patrons (Standards Qualio)

1. **Surfaces élevées (Zéro fil de fer creux)** :
   - En dark mode, toujours utiliser la vraie surface anthracite du design system : `bg-white dark:bg-[#16181E] border border-gray-200/90 dark:border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]`.
   - Ne JAMAIS laisser une carte transparente sur fond noir pur (`#000000`) avec de simples bordures blanches dures.

2. **Pas de boîtes dans des boîtes (Aération visuelle)** :
   - Éviter d'enfermer les métriques dans des sous-boîtes à bordures rigides. Présenter les compteurs et données en flux aéré avec des séparations douces (`border-t border-gray-100 dark:border-white/[0.06]`).
   - Ne pas empiler des conteneurs à bordures pour chaque élément textuel.

3. **Zéro liseré néon kitsch** :
   - Ne JAMAIS mettre de bordure supérieure fluo (`border-t-2 border-rose-500` ou vert).
   - Utiliser des badges ronds raffinés avec pastille de couleur (`rounded-full px-2.5 py-0.5 text-[11px] font-semibold`).

4. **Typographie moderne (Linear / Vercel)** :
   - La police principale est **Manrope** (`font-sans`), avec des graisses équilibrées (`font-semibold` ou `font-bold`), sans abuser de `font-black` écrasant.
   - Les chiffres et URLs utilisent `font-mono` avec des graisses vectorisées réelles.

5. **Actions et boutons hiérarchisés** :
   - Action primaire unique par contexte : Signal Orange (`bg-[#ee6018] hover:bg-[#d95514] text-white`).
   - Actions de navigation / workspace : bouton contrasté affirmé (`bg-gray-950 dark:bg-white text-white dark:text-gray-950`).
   - Actions secondaires : fond doux (`bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-zinc-300`).

## Comment procéder

1. Identifie la cible exacte donnée par Ken (chemin du fichier ou nom du composant/page).
2. Annonce en une ligne que tu vas lancer la séquence complète sur cette cible.
3. Exécute les 8 commandes ci-dessus **dans l'ordre**, une passe cohérente chacune, sans t'arrêter demander confirmation entre chaque étape (principe "Bounded Passes" d'Impeccable : une passe complète, pas de boucle infinie de retouches).
4. À la fin, fais un résumé court des changements clés apportés par étape (2-3 lignes max par commande), pas un pavé.
5. Respecte toujours les préférences de Ken : proposer d'abord la liste des changements avant de livrer le code, fournir des fichiers complets prêts à coller (pas de diffs partiels), rester concis.

## Notes

- Le mode par défaut de ce skill est **Operate**. Si la cible est une landing page ou une page de pricing, signale-le à Ken et propose plutôt le mode **Persuade** avant de lancer la séquence.
- Ne pas exécuter `init`, `document`, `shape`, `extract`, `critique`, `audit`, `doctor`, `live`, `layout`, `typeset`, `delight`, `optimize`, `quieter` dans cette séquence automatique — elles restent des commandes à appeler explicitement par Ken si besoin.
