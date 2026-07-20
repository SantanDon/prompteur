# Prompteur design system

## Product position

Prompteur is a precision workbench, not a marketing landing page or a generic AI dashboard. The interface should feel like a compact compiler/editor: quiet, inspectable, and designed around the movement from rough intent to a verifiable task contract.

## Design principles

1. **Workflow before atmosphere.** The source, target, result, findings, and evidence must dominate the page.
2. **One visual hierarchy.** Avoid nested cards, decorative panels, and repeated labels that compete for attention.
3. **Restraint creates identity.** Use solid surfaces, hairline borders, clear typography, and one signal color. Do not use gradients, glass effects, glow, or ornamental shadows.
4. **Explain state in words.** Prefer `Settings`, `Local compiler ready`, and `Task contract` to ambiguous icon-only controls.
5. **Keep heuristics honest.** Readiness and dimension values are diagnostic signals, never claims of model quality or accuracy.
6. **Mobile is a real workflow.** The complete compile, inspect, and copy flow must work at 320 px without horizontal scrolling.

## Visual language

### Color

The source of truth is `style.css`.

- Canvas: warm near-black, not blue-purple black.
- Surfaces: small tonal steps with solid fills.
- Text: warm off-white with two restrained secondary levels.
- Signal: chartreuse is reserved for compilation, active state, progress, and local readiness.
- Status colors: green, amber, and red communicate success, caution, and error only.

The signal color must never become a page-wide wash or decorative glow.

### Typography

- Inter is the interface typeface.
- System monospace is used only for Prompt IR, score values, keyboard notation, and compiler-like numbering.
- Display headings use the same family as the interface. Product identity comes from proportion and language rather than a decorative display font.
- Body copy should normally remain between 11 px and 14 px in the workbench.

### Spacing and shape

- Base spacing unit: 4 px.
- Common gaps: 8, 12, 16, 20, 24, and 32 px.
- Corners are 6–12 px. Large soft cards are not part of the system.
- Borders define structure. Shadows should not be required for hierarchy.

## Information architecture

The primary sequence is:

```text
Target → Source intent → Compile → Task contract → Findings / Prompt IR → Copy or candidate
```

The quality dimensions sit inside the compiler frame as supporting evidence. They must not become a detached dashboard.

## Core components

### Top bar

Contains only identity, provider state, and settings. It is not a marketing navigation bar.

### Compiler toolbar

Shows the target and a concise description of how that target changes compilation. Keyboard help is secondary and disappears on narrow layouts.

### Source pane

A plain writing surface with one primary action. Character count and local-processing status are supporting metadata.

### Result pane

Keeps the task contract, findings, and Prompt IR in one tab system. Active state must be visible without relying on color alone.

### Contract signals

Five compact progress indicators: clarity, context, constraints, output, and verification. Their accessible values must be updated with the visible values.

### Settings sheet

A right-side native dialog on desktop and a full-width sheet on mobile. Providers are a list, not three promotional cards.

## Responsive rules

- Every grid child must permit shrinking with `min-width: 0`.
- The document must never exceed the viewport width.
- At 1040 px, source and result stack vertically.
- At 760 px, controls wrap and footer actions become full-width.
- At 460 px, nonessential brand text and compiler numbering may collapse.
- Long prompts, URLs, JSON, and provider messages must wrap or scroll inside their own region rather than widening the page.

## Accessibility baseline

- Use real labels for every input.
- Tab controls use `role="tab"`, `aria-selected`, `aria-controls`, roving `tabindex`, and arrow-key navigation.
- Progress signals expose `aria-valuenow`.
- Status and output changes use polite live regions.
- Focus indicators must remain visible on every interactive element.
- Touch targets should be at least 36 px high, with primary mobile actions at least 42 px.
- Reduced-motion preferences disable nonessential movement.

## Prohibited patterns

Do not introduce:

- purple-blue AI gradients,
- glassmorphism or blur-backed panels,
- ambient glow,
- card grids used only to fill space,
- icon-only primary controls,
- oversized landing-page hero text above the workbench,
- fabricated metrics or gamified scoring,
- frontend-framework migrations without an ADR and a real capability gap.
