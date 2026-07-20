# ADR 0003: Authored workbench and design toolchain

Date: 2026-07-20
Status: accepted

## Context

Prompteur's first browser interface was functional but relied on familiar AI-product styling: a large marketing-style hero, purple gradients, glass surfaces, glow, repeated cards, and subtle icon controls. User feedback correctly identified the result as generated and vibe-coded rather than intentionally designed. A browser audit also found that the narrow layout could exceed the viewport and lose the primary workflow.

The repository had strong compiler, security, and maintenance contracts but no equivalent design contract. Future autonomous agents could therefore reintroduce the same patterns even after a one-time redesign.

## Decision

Prompteur adopts a restrained compiler-workbench visual system.

- The source-to-contract workflow is the dominant information architecture.
- Solid warm-neutral surfaces, hairline borders, one signal color, restrained corners, and one interface typeface define the visual language.
- Gradients, glassmorphism, ambient glow, detached metric-card dashboards, and icon-only primary controls are prohibited defaults.
- Quality dimensions are integrated with the compiler result as diagnostic signals.
- The interface uses semantic tabs, accessible progress values, explicit labels, visible focus, and mobile containment down to 320 px.
- The right-side native dialog remains the settings surface.

The design workflow uses:

- Figma remote MCP when a design file or frame exists,
- Playwright CLI/skills for repeated coding-agent QA,
- Playwright MCP or an equivalent browser agent for exploratory persistent sessions,
- a repository Agent Skill at `.agents/skills/prompteur-frontend-design/`.

Storybook is deferred. Prompteur will not adopt React or another component framework merely to obtain Storybook or a design-system MCP.

## Consequences

### Positive

- Product identity follows the compiler workflow rather than AI-dashboard fashion.
- Responsive and accessibility expectations become reviewable repository contracts.
- Future agents can load a focused design skill instead of improvising UI taste.
- Figma and browser tools have clear, non-overlapping roles.

### Tradeoffs

- Visual experimentation is intentionally constrained.
- Figma is not required for every change; code remains the source of truth until a canonical file and component mapping are established.
- Storybook-style isolated component documentation remains unavailable until component complexity justifies it.
- Browser verification remains an explicit maintenance cost for substantial UI work.
