# Prompteur v0.4 Slice 3 — Explicit Harness Profiles

Date: 2026-09-21

## Scope completed

Implemented the third bounded v0.4 slice from `PROMPTEUR_RESEARCH_2026-09-20.md`: a small, versioned target/harness profile layer that is **explicit-only** and leaves the deterministic baseline unchanged when no profile is selected.

This slice does not claim any downstream task-quality improvement. It creates a testable H2 variant for future paired execution: compare the normal coding-agent baseline with a profile that removes only harness-redundant scaffolding.

## Implementation

- `src/core/profiles.js`
  - profile registry version `1.0`;
  - one experimental profile: `managed-coding-agent`;
  - capability metadata is explicit and conservative;
  - profile status is `experimental`, `default: false`, and `evidenceState: not_evaluated`;
  - compatible only with `target=agent`;
  - suppresses exactly one generic instruction: `Inspect the available context and tools before changing anything.`;
  - retains implementation-minimality, non-fabrication, and verification instructions.
- `src/core/pipeline.js`
  - adds optional `profile` compiler option;
  - never auto-selects a profile;
  - unknown profiles fail with `INVALID_PROFILE`;
  - incompatible target/profile combinations fail with `INCOMPATIBLE_PROFILE`;
  - provenance records selected profile (or `null`) and profile-registry version;
  - capabilities expose safe cloned profile metadata, not mutable registry internals.
- `src/core/normalize.js` / `src/core/compile.js`
  - carry explicit profile selection through Prompt IR;
  - apply profile suppression/additions only when explicitly selected;
  - no-profile compilation follows the pre-existing instruction path unchanged.
- `bin/prompteur.js` and `src/mcp/server.js`
  - expose explicit profile selection on CLI/MCP surfaces without changing defaults.
- `evaluations/paired.js` / `evaluations/paired-record.schema.json`
  - paired schema moves to `1.2` to record profile and profile-registry provenance;
  - downstream quality remains `not_evaluated` and `mayLabelImproved` remains false.

## Tests added

Focused tests prove that:

1. no profile is auto-selected;
2. no-profile agent output retains all existing generic execution instructions;
3. the explicit managed-agent profile removes only the intended redundant tool/context-discovery instruction;
4. non-fabrication and verification protections remain;
5. unknown and incompatible profiles fail closed;
6. capabilities label the profile experimental, non-default, and unevaluated;
7. paired evaluation distinguishes the profile variant while refusing an improvement claim.

## Verification

- `node --test tests/core.test.js` — **7/7 passed**.
- `node --test tests/paired-evaluation.test.js` — **12/12 passed**.
- `npm run check` — **42 passed, 0 failed, 1 Windows symlink-permission skip**; deterministic evaluation **6/6 passed**.
- `node scripts/paired-evaluate.js` — paired deterministic evaluation **6/6 contract checks passed** and **6/6 hard-constraint preservation cases passed**; downstream task quality remains `not_evaluated`.

## Explicit non-goals

Not added in this slice: provider/model execution, automatic provider detection, automatic profile selection, model-specific compiler forks, context hydration, full-chat injection, optimizer/self-reflection loops, new dependencies, UI redesign, deployment, or any claim that the profiled variant is better.

## Next evidence gate

The profile remains experimental until H2 is run with real downstream execution against representative coding tasks. Promotion requires same-or-better task success and safety with a material reduction in redundant input tokens and/or latency. Until then, the ordinary deterministic agent compiler remains the default.
