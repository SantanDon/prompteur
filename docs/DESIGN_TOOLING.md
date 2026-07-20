# Design and frontend tooling

Prompteur uses a small, evidence-driven design toolchain. Tools are selected for what they add to the workflow, not because they are fashionable.

## Figma MCP — design source of truth

Use Figma's remote MCP server when a Figma file or frame exists. It can expose structured layout, variables, components, and design context to supported agents. The remote server is preferred over the desktop server because it has the broadest tool set.

Prompteur's Figma account is connected in the ChatGPT workflow. For local Codex, install the Figma plugin from **Plugins → Figma** and authorize it. Design work should be scoped with a copied Figma file or frame URL.

Required Figma workflow:

1. Start from the exact frame or component URL.
2. Read structure, variables, and reusable components before generating code.
3. Map Figma concepts to existing Prompteur tokens and elements; do not paste generated CSS blindly.
4. Preserve semantic HTML and responsive behavior even when the source frame is desktop-only.
5. Treat the browser implementation as a product surface that still requires QA.

## Playwright — browser evidence

Use Playwright for real interaction and layout verification.

For coding agents, Playwright CLI plus a project skill is usually the default because it is more context-efficient. Use Playwright MCP for exploratory or persistent browser sessions where accessibility-tree inspection and iterative interaction are valuable.

Generic MCP configuration example:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--isolated",
        "--headless",
        "--allowed-hosts",
        "127.0.0.1,localhost,santandon.github.io"
      ]
    }
  }
}
```

For Codex CLI:

```bash
codex mcp add playwright npx "@playwright/mcp@latest"
```

For OpenCode, add a local `playwright` MCP entry that runs `npx @playwright/mcp@latest` and keep it enabled only in workspaces where browser automation is expected.

## Required UI verification matrix

Test these viewports or device equivalents:

- 1440 × 900
- 1024 × 768
- 390 × 844
- 320 × 568

For every substantial UI change verify:

- initial state,
- compile interaction,
- result tabs,
- settings open/save/cancel,
- keyboard-only navigation,
- long prompt and long result wrapping,
- no horizontal overflow,
- no console errors,
- visible focus,
- reduced motion,
- public GitHub Pages subpath loading.

## Storybook — intentionally deferred

Storybook MCP can give agents component documentation, stories, and component-state testing. Prompteur does not currently have a component framework or enough reusable component complexity to justify adding Storybook and its dependency graph.

Do not migrate the application to React or add Storybook solely for an MCP integration. Reconsider it only when:

- reusable components have independent states worth documenting,
- UI regression work is materially slowed by the current structure,
- the dependency and maintenance cost is accepted in an ADR.

## Project skill

The canonical frontend workflow is stored at:

```text
.agents/skills/prompteur-frontend-design/SKILL.md
```

Agents should load it for Prompteur UI, UX, accessibility, responsive, or frontend design work.
