# Browser packaging smoke checks

Manual checks for Chromium and Safari development builds.

## Prerequisites

- `npm run verify` succeeds locally.
- Chromium packaging output: `dist/`
- Safari packaging output: `build/safari/` (Xcode project generated on macOS)

## Chromium checklist

1. **Install**
   - Open `chrome://extensions`
   - Enable Developer mode
   - Load unpacked and select the repository `dist/` directory
2. **Launch**
   - Open the Recess toolbar action and confirm the popup loads without console errors
3. **Representative session path**
   - Start or resume a focus session from the popup
   - Confirm the timer view renders and session controls respond
4. **Permissions**
   - Confirm `storage`, `tabs`, `alarms`, and `notifications` are granted or prompted as expected
5. **Limitations**
   - Chromium validation uses the unpacked `dist/` artifact only; store packaging is out of scope

## Safari checklist

1. **Install prerequisites**
   - Xcode 26.5 is selected (`xcodebuild -version`)
   - A development signing identity is configured in Xcode and Keychain (see `docs/toolchain.md`)
2. **Package**
   - Run `npm run package:safari` after `npm run build`
   - Open the generated Xcode project under `build/safari/`
   - Build and run the macOS app target with the development team selected
3. **Launch**
   - Enable the Recess extension in Safari → Settings → Extensions
   - Open the extension popup and confirm it loads
4. **Representative session path**
   - Repeat the same focus-session entry path used for Chromium
5. **Permissions**
   - Confirm extension permissions mirror the Chromium build (`storage`, `tabs`, `alarms`, `notifications`)
6. **Limitations**
   - Converter output still requires a local Xcode build and development signing step
   - Safari behavior can diverge from Chromium for alarms, notifications, and storage timing