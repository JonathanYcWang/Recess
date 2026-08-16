# Recess

A focus and break manager that blocks distracting sites during declared work sessions and offers chance-based recovery between them.

## Documentation

### Architecture

- [Architecture blueprint](docs/architecture.md) — layers, messaging, app actions, and engineering standards

### Domain

- [Glossary](docs/domain/glossary.md) — ubiquitous language for Work Sessions, Focus Blocks, Recesses, and related terms
- [Domain rules](docs/domain/rules.md) — intended product rules and lifecycle constraints

### Release and agents

- [Branch protection](docs/release/branch-protection.md) — required GitHub settings and PR policy for `main`
- [Issue tracker](docs/agents/issue-tracker.md) — how agents and humans work issues and PRs via `gh`

## Quick start

```sh
npm install
npm run verify
```

`npm run verify` is the single local quality gate. It runs, in order: `format:check`, `lint`, `test`, `knip`, `build`, `package:chromium`, `package:safari`. Any failed step exits non-zero.

Packaging outputs land in gitignored `dist/` and `build/safari/` and do not modify tracked files.

## Running it locally

### `npm run dev` vs `npm run build`

| Command | Use when | What it does |
| --- | --- | --- |
| `npm run dev` | Day-to-day development | Starts Vite (CRXJS). Writes to `dist/` and rebuilds on change so you can iterate in the browser. |
| `npm run build` | Checking a production build, packaging, or Safari | Typechecks (`tsc`) then produces a production build in `dist/`. |

Use **dev** while coding. Use **build** before packaging or when you need a production artifact.

### Chromium

1. Run `npm run dev` (or `npm run build` for a production load).
2. Open `chrome://extensions`, enable Developer mode, click **Load unpacked**, select `dist/`.
3. Open the Recess toolbar action and confirm the popup loads without console errors.
4. Start or resume a focus session from the popup; confirm the timer view renders and session controls respond.
5. Confirm `storage`, `tabs`, `alarms`, and `notifications` are granted or prompted as expected.

With `npm run dev`, leave the terminal running and reload the extension (or reopen the popup) after changes. Chromium validation uses the unpacked `dist/` artifact only; store packaging is out of scope.

### Safari

Safari needs a production build and the generated Xcode project (macOS + Xcode required).

1. Run `npm run build`, then `npm run package:safari`.
2. Open the generated Xcode project under `build/safari/`, build and run the macOS app target with your development team selected.
3. Enable the Recess extension in Safari → Settings → Extensions. Open the popup and confirm it loads.
4. Repeat the same focus-session entry path used for Chromium.
5. Confirm extension permissions mirror the Chromium build (`storage`, `tabs`, `alarms`, `notifications`).

Limitations: converter output requires a local Xcode build and a development signing identity. Safari behavior can diverge from Chromium for alarms, notifications, and storage timing. `npm run dev` does not drive the Safari packaging path.
