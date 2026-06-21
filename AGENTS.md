# Recess

## Project

Recess is a browser extension for Chromium and Safari that manages focus/break sessions, blocks distracting sites during focus time, and offers chance-based break rewards by temporarily unblocking selected sites.

## Agent Workflow

The user should primarily interact with the Recess Orchestrator Agent.

@.github/agents/orchestrator.md

## Instructions

Agent MUST follow this guidance:

- **Use the Orchestrator for non-trivial work**: Feature work, bug fixes, refactors, reviews, and testing tasks must start with the Orchestrator workflow.
- **Load only relevant instructions and skills**: Use files in `.github/instructions/` and `.github/skills/` only when they apply to the current task.
- **Explain workflow usage**: At each meaningful step, state which agent, skill, instruction, prompt, or hook is being used, how it is being used, and what result is passed to or from it.
- **Protect high-risk areas**: Treat timers, pause/resume, persistence, browser extension behavior, site blocking, manifest permissions, browser compatibility, new dependencies, and broad refactors as high-risk.
- **Keep changes focused**: Do not touch unrelated files or introduce new dependencies without approval.
- **Verify implementation**: Run `npm run build` after implementation whenever feasible.
- **Do not invent test commands**: If no test command exists, report that clearly.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues; external pull requests are not a triage request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the canonical labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Recess uses a single-context domain layout with `CONTEXT.md` at the repository root and architectural decisions under `docs/adr/`. See `docs/agents/domain.md`.
