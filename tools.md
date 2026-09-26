Impeccable est le système de direction artistique et d’ingénierie UI/UX installé dans votre projet (.cursor/skills/impeccable).



Il permet de transformer des interfaces "génériques" ou banales en designs de calibre professionnel ("out-of-distribution craft"), avec des règles strictes sur la hiérarchie visuelle, la typographie, les contrastes, les micro-interactions et la performance.



Voici le guide complet pour comprendre le rôle de chaque commande et comment les utiliser efficacement.



1\. Catalogue des commandes par objectif

A. Construire \& Cadrer (Build)

init : Analyse le projet et crée le fichier PRODUCT.md (valeur du produit, audience cible, contraintes, univers de marque). À faire au tout début d'un projet ou d'un pivot.

document : Scanne le code UI existant (composants, tokens Tailwind, CSS variables) et génère le fichier DESIGN.md qui sert de charte graphique et de référence visuelle.

shape \[feature] : Phase de conception pure avant d'écrire du code. Clarifie l'architecture de l'information, le parcours utilisateur et le layout avant implémentation.

extract \[target] : Détecte les duplications dans vos composants et extrait des tokens réutilisables ou des composants partagés vers votre design system.

B. Évaluer \& Diagnostiquer (Evaluate)

critique \[target] : Revue de design et d'ergonomie (UX Review) avec notation heuristique. Identifie la charge cognitive, les incohérences visuelles et les anti-patterns.

audit \[target] : Audit technique rigoureux : accessibilité (contraste WCAG, labels ARIA), responsiveness, overflow horizontal et performance de rendu.

C. Polir \& Affiner (Refine)

polish \[target] : La commande la plus utile avant de merger. Passe de finition complète : alignements au pixel près, micro-espacements, harmonisation des bordures, états :hover, :focus, :active et :disabled.

bolder \[target] : À utiliser quand une page est trop "plate", timide, grise ou générique. Amplifie les contrastes, la typographie et donne du caractère.

quieter \[target] : À l'inverse, si une interface est agressive, trop chargée en couleurs, bordures ou animations, cette commande adoucit et calme le visuel.

distill \[target] : Élimine le superflu. Réduit le bruit visuel, supprime les cartes imbriquées inutiles et simplifie l'interface vers l'essentiel.

harden \[target] : Prépare la mise en production : états de chargement (skeletons), gestion des erreurs, empty states, textes longs/overflows et cas limites.

onboard \[target] : Conçoit les premiers pas de l'utilisateur : premier écran d'accueil, états vides engageants, guidage d'activation.

D. Rehausser \& Sublimer (Enhance)

animate \[target] : Ajoute des micro-animations ciblées et fluides (Framer Motion, transitions CSS, feedback tactile sur les boutons).

colorize \[target] : Ajoute une palette stratégique et subtile à une interface trop monochrome sans la rendre criarde.

typeset \[target] : Révise la typographie : échelle des tailles (text-xs à text-4xl), interlignages (leading), graisses (font-medium, font-semibold) et lisibilité.

layout \[target] : Corrige le rythme vertical, les grilles, les espacements (gap, padding) et la hiérarchie visuelle.

delight \[target] : Ajoute des détails mémorables et de la personnalité (sons subtils, badges vivants, transitions élégantes).

E. Corriger \& Adapter (Fix)

clarify \[target] : Révise l'UX Writing : améliore les textes, les libellés de boutons, les messages d'erreurs et les infobulles pour les rendre limpides.

adapt \[target] : Ajuste l'interface pour le multi-écrans (smartphone 375px, tablette 768px, desktop 1440px).

optimize \[target] : Diagnostic et optimisation des performances UI (re-renders inutiles, images trop lourdes, CLS).

F. Outils système \& Utilitaires

doctor : Vérifie la cohérence entre vos fichiers de configuration (PRODUCT.md, DESIGN.md) et le code existant.

live : Mode itératif permettant de générer des variantes visuelles en direct dans le navigateur.

2\. Les 4 "Modes" d'Impeccable (Le contexte compte)

Impeccable adapte son travail selon la nature de la page :



Operate (Dashboard, formulaires, tables, bugs) : Priorité à la rapidité de lecture, à la densité d'information et à la suppression des distractions.

Persuade (Landing page, pricing) : Priorité à la conversion, aux contrastes forts, aux grands titres et à l'impact visuel.

Read (Documentation, guides, FAQ) : Priorité au confort de lecture et à la hiérarchie des paragraphes.

Experience (Showcases, galeries) : Priorité à l'immersion visuelle.

3\. Comment les utiliser concrètement ?

Vous n'avez pas besoin d'apprendre une syntaxe complexe. Il vous suffit d'indiquer le verbe + la cible dans votre demande :



Exemples pratiques sur Qualio :

Pour polir une page avant livraison :



"Applique un polish sur la page src/app/dashboard/bugs/page.tsx."



Pour rendre la landing page plus percutante :



"La landing page est un peu trop timide, fais un bolder sur src/components/landing/Hero.tsx."



Pour concevoir un composant manquant :



"Fais un harden sur nos formulaires et nos empty states."



Pour réviser l'ergonomie mobile :



"Fais un adapt sur le dashboard pour écran mobile 375px."



Pour lancer une revue globale :



"Lance un critique sur le flux de création de site."



4\. La règle d'or pour aller vite ("Bounded Passes")

Impeccable suit un principe fondamental : pas de boucles infinies de retouches.



Vous donnez la commande et la cible.

Le système analyse, effectue les modifications complètes en une passe cohérente (desktop + mobile).

Une seule vérification finale valide le résultat.

