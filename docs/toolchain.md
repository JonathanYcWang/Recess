# Recess toolchain

## Supported Node versions

Recess uses npm and `package-lock.json`.

- Required local, CI, and release runtime: Node 24.17.0 LTS.
- Supported package range: Node `>=24`.
- Required npm version: 11.13.0.

Verify the active local runtime:

```sh
node --version
npm --version
```

Dependency installation continues to use npm:

```sh
npm ci
```

The repository `.node-version`, package engine range, and CI configuration must remain aligned to Node 24 LTS.

## Xcode and Safari tooling

Recess pins Xcode 26.5. Select it and complete its first-launch setup:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

Verify the selected toolchain and Safari extension converter:

```sh
xcodebuild -version
xcode-select --print-path
xcrun --find safari-web-extension-converter
```

## Development signing prerequisites

Safari packaging requires a development signing identity configured in Xcode and stored in the macOS Keychain. Before converting or signing a Safari extension:

1. Open Xcode and sign in with an Apple ID or team account that has development-signing access.
2. Confirm a valid development certificate appears under Xcode → Settings → Accounts.
3. Keep provisioning profiles, certificates, and team secrets in Xcode and Keychain only.

Development signing identities and credentials must not be committed to Git or printed in shared logs. Signed packaging and release-artifact verification are owned by their dedicated packaging issue.

## Local verification

`npm run verify` is the single local quality gate. It runs, in order:

1. `npm run format:check`
2. `npm run lint`
3. `npm test`
4. `npm run knip`
5. `npm run build`
6. `npm run package:chromium`
7. `npm run package:safari`

Any failed step exits non-zero. Packaging outputs land in gitignored `dist/` and `build/` directories and do not modify tracked files.

Browser end-to-end checks use Playwright against the built popup fixture. See `docs/e2e-accessibility.md` for the Chromium axe gate and `docs/browser-smoke-checks.md` for manual Chromium and Safari smoke checklists.

Safari packaging requires macOS with the pinned Xcode toolchain. Linux environments can run every verify step except `package:safari`.

Required GitHub Actions check names for `main` branch protection:

- `verify`
- `package-chromium`
- `package-safari`

See `docs/release/branch-protection.md` for branch-rule and milestone-artifact conventions.

## CI and release alignment

GitHub Actions reads Node from `.node-version` and installs dependencies with `npm ci`. Release automation must use the same Node 24.17.0 and npm 11.13.0 pins documented above.
