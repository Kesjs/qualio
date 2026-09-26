# Qualio - Product Vision

## Qu'est-ce que Qualio ?
Qualio est un **Continuous Website QA Workspace**.
Son objectif est de permettre à une équipe de répondre immédiatement à une question simple :
> **« Je viens de déployer. Est-ce que j'ai cassé quelque chose ? »**

Qualio teste réellement un site web, reproduit des parcours utilisateur, collecte des preuves, regroupe les problèmes, explique ce qui est probablement cassé et vérifie les corrections après un nouveau déploiement.

La promesse produit :
> **Ship updates without holding your breath.**

L'idée centrale :
> **Un agent QA teste tout le site en moins d'une minute, identifie les problèmes importants, explique leur cause probable et vérifie les corrections après déploiement.**

## Architecture Fondamentale
L'architecture logique de Qualio est :

```text
PLAYWRIGHT
Detection + raw evidence
        ↓
EVIDENCE ENGINE
Normalize / correlate / deduplicate / group
        ↓
DIFF ENGINE
Deterministic scan comparison
        ↓
AI QA ENGINE
Interpretation / synthesis / diagnosis
        ↓
QUALIO UI
Help user fix and verify
```

## Evidence First. AI Second. Verification Always.
- Playwright est la **source de faits observés**.
- AI QA Engine ne détecte pas de nouveaux bugs. Il **interprète** des incidents synthétisés par l'Evidence Engine.
- AI n'est pas la source de vérité. La source de vérité est `Playwright + Evidence Engine + Scan data + Diff Engine`.
- Diff Engine compare de manière **déterministe** les scans pour identifier ce qui est nouveau, persistant ou résolu.

## Limites & Complexité
- **Start simple. Scale when necessary.** Ne pas ajouter d'infrastructure complexe (Redis, BullMQ, Kafka, microservices) avant d'en avoir un besoin impératif.
- Restreindre les coûts : Ne pas envoyer 40 événements bruts à l'IA ; regrouper d'abord en incidents métiers pertinents (règle des `40 événements -> 5 incidents`).
