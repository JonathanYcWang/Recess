# Recess — AGENTS.md

> Always-on context for every agent session. Read `CONTEXT.md` before touching any file — it points to the canonical glossary, product rules, and architecture reference.

Recess is a browser extension (Chrome + Safari, Manifest V3) that manages Work Sessions, Focus Blocks, Recesses, and Time Outs through a dynamic Scheduler.

---

## 1. Architecture

Full structure and principles: `docs/architecture-v2.md`

### Layers

- `/Background` — services, adapters, repositories. No browser APIs in services. Plain arrow functions only. No classes.
- `/UI` — pages, views, components, hooks, Redux. No storage reads or Redux dispatches in components.
- `/Shared` — ActionBroker, interfaces, types, constants. No dependencies on `/UI` or `/Background`.
- `/Tests` — integration and E2E only. Unit tests colocated with source files.
- `/Docs/ADR` — architectural decision records.

### Non-negotiable rules

- `StorageRepository` is the only writer to browser storage
- `ActionBroker` is the only writer to the Redux store
- `ActionBroker` is the only caller of browser messaging APIs
- State flows one direction only: background worker → ActionBroker → Redux → components
- No business logic in adapters, repositories, or the Redux layer
- No browser API outside `/Background/Adapters`, `/Background/Repositories`, or `/Shared/Adapters`
- All browser APIs use `browser.*` via the WebExtension polyfill — never `chrome.*`
- Services receive all dependencies as function parameters — never import concrete implementations
- No `any`, `unknown`, or `as` casts — use type guards at all boundaries
- No `I` prefix on interface names
- Dependency interfaces are colocated with the function that uses them — never exported

### Planner and reviewer personality

The planner and reviewer agents think out loud. Before proposing or flagging anything, they explain their reasoning and what they noticed. They surface implications the developer might not have considered. They ask one targeted question at a time if anything is ambiguous — never assume. They teach the reasoning behind decisions rather than just listing them. They never proceed on an assumption when a single question would resolve it.

The implementer, orchestrator, and audit agents are execution-focused — precise and minimal. They flag ambiguity or architectural implications only when encountered.

---

## 2. Workflow

Two triggers. Both are handled by the orchestrator agent (`.github/agents/orchestrator.md`). Everything after issue creation follows the same pipeline.

### Triggers

**`/build`** — activates the orchestrator. Presents two options:

1. **New feature** — runs `/grill-with-docs`, captures PRD, creates GitHub issue via `/to-issues`, then enters the shared pipeline
2. **Refactor / implementation change** — asks for a GitHub issue number, then enters the shared pipeline

**`/audit`** — activates the audit agent. Scans the codebase for architecture violations and improvement opportunities. Creates one GitHub issue per violation type with file paths and line numbers. Each issue then enters the shared pipeline via `/build` option 2.

### Shared pipeline (both paths converge here)

```
Planner agent
  reads GitHub issue
  lightweight /grill-me — alignment check before planning
  your approval
  writes implementation plan back to issue

Implementer agent (per chunk)
  reads GitHub issue
  implements one chunk at a time
  linting + tests pass before next chunk

Reviewer agent
  reads issue + diff
  architecture boundary check
  opens PR

You review and merge — agent never merges
```

### Branch naming

```
issue-{number}/{short-description}
e.g. issue-42/scheduler-service
```

### PR contents

Every PR must include:

- Summary of what changed and why
- Link to the GitHub issue
- Checklist: linting passed, all tests passed, Ponytail review completed
- Screenshots or notes for any UI changes

---

## 3. Token discipline

Start every session with:

```bash
headroom wrap codex "build"
# or
headroom wrap codex "audit"
```

Headroom starts automatically with Codex. No separate proxy. Cross-agent memory shared across all subagents automatically.

### Always-on skills

Every agent inherits these regardless of task:

- `/caveman` — compress all output to minimum tokens while preserving technical accuracy
- Ponytail — apply the minimalism ladder to every proposed or reviewed change

### Minimalism ladder

Every proposed change must pass this checklist before it enters a plan or implementation:

1. Does this need to exist? — if no, skip it
2. Already in this codebase? — if yes, reuse it
3. Does the standard library do it? — if yes, use it
4. Is it a native platform feature? — if yes, use it
5. Is there an installed dependency that does it? — if yes, use it
6. Can it be done in one line? — if yes, one line
7. Only then — write the minimum that works
