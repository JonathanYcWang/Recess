---
status: accepted
date: 2026-06-22
---

# Module dependency direction and public entry points

Recess modules follow inward dependency direction from React through domain clients, transport, handlers, and pure domain modules. Each module exposes one public index entry point; callers may not import implementation files. Domain modules exclude React, Redux, browser, storage, message, CSS, and UI-copy dependencies and return typed expected failures. Pure domain transitions return next state, immutable facts, and typed effect intents as a single contract.

## Considered options

- **Flat feature folders with cross-imports:** faster initially but spreads rules across UI, Redux, and background code. Rejected because Work rhythm and Block List already leak policy across seams.
- **Shared utility layer without ownership:** reduces duplication but hides module boundaries. Rejected because tests and callers would still reach through multiple interfaces for one concept.
- **Automated boundary enforcement in CI:** attractive long term but premature before module shapes stabilize. Rejected for now in favor of mandatory review.

## Consequences

- New domain behavior lands in a module with a typed public entry point before UI or Redux callers adopt it.
- Refactors must update callers to the public seam rather than importing internal files.
- Reviewers treat cross-module implementation imports as blockers.
- Pure domain code remains synchronous, deterministic, and testable without browser or React fixtures.

## Governs

- #43 Manage websites through the Block List module
- #51 Manage Workstyle Signals through the Workstyle Profile
- #53 Schedule one deterministic Focus and Recess cycle
- #57 Start a Work Session and its first Focus Block
- #82 Manage weekly Work Start Reminders
- #89 Manage an ordered Task List with immutable estimates
- All later module migration issues under Epics 2–13
