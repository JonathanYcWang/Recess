# Domain Docs

Recess uses a single-context domain layout.

## Before exploring

- Read root `CONTEXT.md` for canonical terminology.
- Read `docs/domain/glossary.md` when relationships or examples are needed.
- Read `docs/domain/rules.md` when work touches product lifecycle, timing, access, Tasks, rewards, progression, or personalization.
- Read relevant decisions under `docs/adr/`.

If a file does not exist, proceed silently. Domain files are created lazily as concepts and decisions become concrete.

## Intended model versus implementation

The domain docs describe the intended product model. They do not prove that behavior is implemented. Inspect the code and tests before reporting current behavior or planning a change.

## Use canonical language

Use terms from `CONTEXT.md` in issues, plans, test names, and implementation discussions. Do not silently introduce synonyms for an established concept.

## Architectural decisions

If proposed work conflicts with an ADR, surface the conflict explicitly rather than silently overriding it.

## Layout

- `CONTEXT.md` — compact canonical language
- `docs/domain/glossary.md` — expanded definitions and scenarios
- `docs/domain/rules.md` — lifecycle and behavioral rules
- `docs/adr/` — architectural decisions, created only when a qualifying decision exists
