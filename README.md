# Recess

A focus and break manager that blocks distracting sites during declared work sessions and offers chance-based recovery between them.

## Quick start

```sh
npm ci
npm run verify
```

`npm run verify` is the single local quality gate. It runs, in order: `format:check`, `lint`, `test`, `knip`, `build`, `package:chromium`, `package:safari`. Any failed step exits non-zero.

Packaging outputs land in gitignored `dist/` and `build/safari/` and do not modify tracked files.

## Browser smoke checks

Run these after `npm run verify` succeeds.

### Chromium

Output: `dist/`.

1. Open `chrome://extensions`, enable Developer mode, click **Load unpacked**, select `dist/`.
2. Open the Recess toolbar action and confirm the popup loads without console errors.
3. Start or resume a focus session from the popup; confirm the timer view renders and session controls respond.
4. Confirm `storage`, `tabs`, `alarms`, and `notifications` are granted or prompted as expected.

Limitation: Chromium validation uses the unpacked `dist/` artifact only; store packaging is out of scope.

### Safari

Output: `build/safari/` (Xcode project generated on macOS).

1. Run `npm run package:safari` after `npm run build`. Open the generated Xcode project, build and run the macOS app target with your development team selected.
2. Enable the Recess extension in Safari → Settings → Extensions. Open the popup and confirm it loads.
3. Repeat the same focus-session entry path used for Chromium.
4. Confirm extension permissions mirror the Chromium build (`storage`, `tabs`, `alarms`, `notifications`).

Limitations: converter output requires a local Xcode build and a development signing identity. Safari behavior can diverge from Chromium for alarms, notifications, and storage timing.
