# Browser Extension Instructions

Use when changing extension APIs, background behavior, manifest configuration, storage, alarms, notifications, tabs, site blocking, or browser compatibility.

## Rules

- Build Recess for Chromium and Safari compatibility from the ground up.
- Do not treat Safari as a later port or an afterthought.
- Avoid spreading raw Chrome-specific assumptions throughout application code.
- Prefer browser-extension service boundaries for storage, alarms, notifications, tabs, and site blocking.
- Keep manifest and permission changes minimal and justified.
- Do not rely on long-lived background/service-worker memory for scheduled behavior.
- Call out APIs that may differ between Chromium and Safari before implementation.
- Guard extension APIs when code can run outside an extension context.

