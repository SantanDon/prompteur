---
name: prompteur-frontend-design
description: Design, implement, review, and test Prompteur UI/UX and frontend changes. Use for layout, visual hierarchy, interaction design, accessibility, responsive behavior, Figma handoff, browser QA, design-system work, or any request that says the interface feels generated, generic, template-like, or vibe-coded.
---

# Prompteur frontend design

## Product intent

Prompteur is a precision compiler workbench. It must feel authored around the source-to-contract workflow, not assembled from generic AI dashboard patterns.

Read before changing the interface:

- `docs/DESIGN_SYSTEM.md`
- `docs/DESIGN_TOOLING.md`
- `AGENTS.md`
- the current `index.html`, `style.css`, and `src/app.js`

## Required workflow

1. Reproduce the user-facing problem in a real browser.
2. Name the user job, current friction, and success criteria before styling.
3. Inspect the existing DOM, state transitions, and responsive rules.
4. When a Figma URL is available, use Figma MCP to read the exact frame, variables, components, and layout. Do not infer unseen design details.
5. Change the smallest coherent set of structure, style, and interaction files.
6. Preserve compiler behavior, provider boundaries, IDs used by JavaScript, and static-file security.
7. Add or update semantic and responsive regression tests.
8. Run `npm run check`.
9. Run browser QA at desktop, tablet, narrow mobile, and 320 px.
10. Inspect keyboard behavior, visible focus, dialog behavior, tab semantics, long-content wrapping, console errors, and horizontal overflow.
11. Update design and handoff documents when principles or components change.

## Design rules

- Prefer hierarchy, alignment, typography, and spacing over decoration.
- Use one restrained accent color.
- Use solid surfaces and hairline borders.
- Keep the main task visible above secondary explanation.
- Integrate evidence with the result instead of creating dashboard card grids.
- Use explicit text labels for primary controls.
- Keep score language honest and non-gamified.
- Make empty, loading, success, warning, error, and disabled states intentional.
- Support real 320 px layouts without document-level horizontal scrolling.

## Reject these defaults

Do not add gradients, glassmorphism, ambient glow, oversized hero typography, decorative card soup, unexplained icon buttons, fake analytics, or a frontend framework merely to obtain a component library.

Do not copy Figma-generated code wholesale. Translate design intent into the existing architecture and semantic HTML.

## Tool routing

- **Figma MCP:** source design context, variables, components, and frame structure.
- **Playwright CLI/skill:** repeated implementation QA and compact evidence gathering.
- **Playwright MCP:** exploratory browser work requiring persistent state or accessibility-tree inspection.
- **Storybook MCP:** deferred until an ADR establishes sufficient component-system complexity.

## Evidence required for completion

- `npm run check` passes.
- No horizontal overflow at 1440, 1024, 390, and 320 widths.
- Core compile, tab, copy, settings, save, and cancel flows work.
- Keyboard arrows move between result tabs.
- Visible focus is present.
- No new console or network errors.
- GitHub Pages project-subpath loading still works.
- User-visible claims match actual behavior.
