---
name: Qualio
description: Continuous Website QA Workspace
colors:
  primary: "#ee6018"
  success: "#a0ca92"
  danger: "#ef4444"
  neutral-canvas: "#101010"
  neutral-surface: "#1d1a18"
  neutral-elevated: "#161413"
  neutral-border: "rgba(255,255,255,0.06)"
  text-primary: "#eeeeee"
  text-secondary: "#8a8380"
typography:
  display:
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif"
    fontWeight: 500
  body:
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  sm: "8px"
  md: "16px"
---

# Design System: Qualio

## Overview

**Creative North Star: "The Factory Quality Floor"**

Qualio's interface is an unadorned, technical workspace for engineers and product teams. It prioritizes data density, absolute clarity, and functional precision over marketing flair. The atmosphere is stark and highly controlled: an OLED black canvas (`#101010`) provides maximum contrast for structural borders and metric data. 

**Key Characteristics:**
- **Operate Mode:** The user is here to complete a task, not to be entertained.
- **Data-First:** Monospace fonts are used for all technical data (latencies, HTTP codes, URLs).
- **High-Contrast Semantics:** Status colors (Signal Orange, Metric Green, Danger Red) are reserved strictly for system states and actions, never for decoration.

## Colors

The palette is restrained and purposeful, providing a dark, high-contrast environment.

### Primary
- **Signal Orange** (#EE6018): The core action color. Used for primary CTAs, active states, and elements requiring immediate attention.

### Neutral
- **Canvas** (#101010): The absolute base of the application.
- **Surface** (#1D1A18): The background for structural cards and panels.
- **Elevated** (#161413): Used for sub-panels, hovered items, and secondary surfaces.
- **Border** (rgba(255,255,255,0.06)): A hairline, barely-there structure that defines sections without drawing attention.
- **Bone** (#EEEEEE): Primary text. High contrast but slightly softened from pure white to reduce eye strain.
- **Granite** (#8A8380): Secondary text and metadata.

### Semantic
- **Metric Green** (#A0CA92): Used strictly for success states, passed checks, and resolved issues.
- **Danger Red** (#EF4444): Used for critical issues, failed checks, and regressions.

**The Functional Color Rule.** Color is reserved for state, action, and data visualization. Never use Signal Orange, Metric Green, or Danger Red for background decoration or non-interactive elements.

## Typography

**Display/Body Font:** Manrope
**Data/Mono Font:** JetBrains Mono

**Character:** Technical, precise, and highly legible. Manrope provides a clean, geometric structure for prose and UI labels, while JetBrains Mono anchors all technical data.

### Hierarchy
- **Headline** (500, varying sizes): Used for page titles and major section headers.
- **Body** (400, 14px-16px): Used for descriptions and general prose.
- **Label** (400, 11px-13px, JetBrains Mono): Used for URLs, HTTP status codes, latencies, tags, and technical metadata.

**The Data Anchoring Rule.** If a piece of text represents a machine-generated value (a timestamp, an error code, a duration, a URL), it MUST be set in JetBrains Mono.

## Layout

The layout follows a strict dashboard structure with a collapsible sidebar and a main content area. Containers use a 1px border (`rgba(255,255,255,0.06)`) to separate content areas rather than relying on heavy shadows or elevation changes.

## Elevation & Depth

Qualio is a flat interface. It relies entirely on tonal layering (Canvas -> Surface -> Elevated) and 1px borders to establish hierarchy.

**The Flat-By-Default Rule.** Surfaces are flat at rest. Do not use box-shadows for structure. Shadows may only appear as a response to interactive states (e.g., hover on a button) or for transient overlays (modals, popovers).

## Shapes

Forms and containers are sharp and geometric. Radii are kept tight (`6px` to `12px`) to maintain a technical, engineered feel.

## Do's and Don'ts

### Do:
- **Do** use `rgba(255,255,255,0.06)` for borders to maintain a subtle structure.
- **Do** use JetBrains Mono for all technical metadata and URLs.
- **Do** reserve Signal Orange (`#ee6018`) for the most important action on the screen.

### Don't:
- **Don't** use gradients, heavy box-shadows, or glassmorphism.
- **Don't** use system generic fonts (Arial, system-ui) for data display; always use JetBrains Mono.
- **Don't** invert the theme. Qualio is a dark-mode only application.
