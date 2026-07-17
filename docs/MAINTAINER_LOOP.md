# Agent maintainer loop

Prompteur is designed to be maintained with strong agent assistance, but not by unreviewed autonomous mutation. Agents may research, diagnose, implement, test, document, and prepare releases. Acceptance remains evidence-based and traceable.

## Operating loop

### 1. Intake

Convert every request into one of:

- bug with reproduction,
- prompt-quality regression,
- security issue,
- architecture change,
- research hypothesis,
- documentation mismatch,
- release or maintenance task.

Do not begin by editing random files. Establish the user-visible or maintainer-visible failure first.

### 2. Context acquisition

Read the instruction chain and relevant architecture records. Inspect current code and tests before proposing a solution. For external methods, prefer primary sources and record why a technique applies to Prompteur.

### 3. Case creation

For compiler and linter work, create or update a representative evaluation case that demonstrates:

- the input,
- target and settings,
- expected issue IDs,
- required output fragments,
- forbidden output fragments,
- rationale.

Anecdotal “this feels better” changes are not enough.

### 4. Plan

Choose the smallest coherent change. Identify:

- affected layer,
- security implications,
- expected behavior,
- tests and rendered flows,
- documentation that must remain aligned.

Create an ADR before crossing an architecture boundary, adding a dependency, changing secret handling, or changing accepted evaluation semantics.

### 5. Implement

Keep deterministic behavior in `src/core`. Keep provider logic behind the local server. Keep UI state out of compiler logic. Avoid duplication and model-specific assumptions in Prompt IR.

### 6. Verify

Minimum verification:

```bash
npm run check
npm run eval
```

For UI changes:

- load the real local server,
- check desktop and mobile widths,
- inspect console errors,
- exercise the changed interaction,
- verify keyboard and dialog behavior where relevant.

For provider changes:

- test missing credentials,
- test invalid configuration,
- test unreachable provider,
- verify secrets are absent from logs, storage, and committed fixtures.

### 7. Review the whole story

Before committing, ask:

- Does the UI claim exactly what the code does?
- Does the change preserve intent and hard constraints?
- Is a model candidate still clearly distinguished from an evaluated result?
- Could supplied text cross an instruction boundary?
- Did complexity increase more than capability?
- Can another agent understand and reverse the change?

### 8. Commit and publish

Use a focused commit message. Pull requests should include:

- problem and case,
- approach,
- evidence,
- screenshots for UI work,
- risks and limitations,
- documentation or ADR changes.

## Autonomous permissions

Agents may proceed without extra confirmation when they are:

- fixing tested defects,
- improving documentation accuracy,
- adding regression cases,
- refactoring inside established boundaries with no behavior change,
- updating CI or maintenance files without expanding permissions,
- researching and documenting options.

Agents must stop for owner review before:

- publishing secrets or user data,
- enabling arbitrary remote execution or network destinations,
- deleting user prompt libraries or evaluation history,
- changing repository visibility,
- introducing paid infrastructure,
- accepting a model-generated candidate as a released prompt without evaluation,
- materially changing the project mission.

## Scheduled maintenance rhythm

Recommended recurring loop:

### Weekly

- review open issues and failed CI,
- convert reproducible prompt failures into cases,
- check documentation drift,
- inspect dependency and platform advisories when dependencies exist.

### Monthly

- run the representative model evaluation matrix,
- review score drift, cost, and latency,
- cluster failure categories,
- update roadmap priorities from evidence,
- archive stale research hypotheses.

### Before release

- run all deterministic checks,
- run supported-browser smoke tests,
- scan for secrets and accidentally served files,
- verify README claims,
- review new ADRs,
- publish release notes with known limitations.

## Agent handoff format

Every substantial handoff should state:

```text
Goal:
Current state:
Evidence gathered:
Decisions made:
Files changed:
Checks run:
Known limitations:
Next highest-value action:
```

This format belongs in issue comments, pull requests, or `.ai-bridge` handoff files when local agent tooling is available.
