# Chrome Web Store Submission Checklist

This project is technically close to publishable, but Chrome Web Store submission still needs a few non-code items.

## Already Covered In Repo

- Manifest V3 extension structure
- Static packaging into `dist`
- Background service worker for alarms, notifications, and site blocking
- No remote code execution
- No third-party analytics or ad SDKs in the current codebase

## Still Needed To Publish

- A live privacy policy URL that describes what local data the extension stores and whether any data is shared.
- Chrome Web Store listing screenshots and a complete product description.
- Developer account verification and 2-step verification enabled on the publishing account.
- A support email or support page URL.
- Final review of the store listing privacy fields so they match the product behavior.

## Permissions Review

The manifest now keeps only permissions that are used by the current code path:

- `storage` for saved settings and timer state
- `tabs` for opening the extension UI in a new tab
- `declarativeNetRequest` for site blocking
- `alarms` for scheduled reminders
- `notifications` for user prompts and session alerts

`webRequest` and `activeTab` were removed because the repo does not use them.

## Policy Notes

Chrome Web Store review will care about the following:

- Request the narrowest permissions necessary.
- Disclose all data collection, sharing, and storage behavior clearly.
- Keep all functionality self-contained in the extension package.
- Ensure the listing metadata is accurate and not misleading.

## Recommended Next Step

Host the privacy policy and support pages, then submit the built `dist` folder as the unpacked extension package source for the store upload.
