# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Development Mode**
   ```bash
   npm run dev
   ```
   This starts the Vite dev server. For Chrome extension testing, always build and load from `dist`.
3. **Build for Production**
   ```bash
   npm run build
   ```
   This will:
   - Compile TypeScript
   - Build the React app with Vite
   - Copy manifest.json to dist/
   - Compile background.ts and content.ts to JavaScript and copy to dist/
4. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder

## Project Structure

- `src/` - Source code
  - `pages/` - All page components
    - `views/` - State-specific views for main page
  - `components/` - Reusable components
  - `lib/` - Business logic and utilities
  - `store/` - Redux store with slices, hooks, and selectors
  - `assets/` - SVG icons and images
  - `background.ts` - Background service worker
  - `content.ts` - Content script (minimal)
- `docs/` - Comprehensive developer documentation
- `public/` - Static assets (extension icons)
- `dist/` - Built extension (created after `npm run build`)

## Icons

Extension icons are located at `public/assets/logo.png`. This single icon file is used for all sizes (16x16, 48x48, 128x128) as specified in manifest.json.

## Features Implemented

✅ All state views implemented:

1. Welcome Page (onboarding)
2. Before Work Session View
3. Ongoing Focus Session View (with pause/resume)
4. Reward Selection View
5. Ongoing Break Session View
6. Focus Session Countdown View (10-second transition)
7. Work Session Complete View
8. Settings - Blocked Sites
9. Settings - Work Hours

✅ Core Features:

- Dynamic session duration calculation based on momentum, fatigue, and progress
- Site blocking using Chrome's declarativeNetRequest API
- Redux state management with Chrome storage persistence
- Pause/resume functionality with timestamp-based calculations
- Timer survives popup close/reopen

✅ Technical Implementation:

- React Router for navigation
- Tailwind CSS styling matching Figma designs
- TypeScript for type safety
- Chrome Extension manifest v3
- Background service worker for site blocking
- Storage middleware for automatic state persistence

## Documentation

For detailed information about the system architecture, session lifecycle, and dynamic calculations, see the `/docs` directory:

- [docs/README.md](docs/README.md) - Documentation index
- [docs/architecture.md](docs/architecture.md) - System design
- [docs/session-lifecycle.md](docs/session-lifecycle.md) - Session flow
- [docs/time-calculations.md](docs/time-calculations.md) - Duration formulas
- [docs/state-and-storage.md](docs/state-and-storage.md) - Redux state structure
- [docs/developer-notes.md](docs/developer-notes.md) - Design decisions

## Troubleshooting

**Build fails:**

- Make sure all dependencies are installed: `npm install`
- Check that Node.js version is 18+

**Extension won't load:**

- Make sure you're loading the `dist` folder, not the project root
- Check browser console for errors
- Verify manifest.json is in dist/ folder

**Styles not working:**

- Ensure Tailwind CSS is properly configured
- Check that fonts are loaded (Patrick Hand, BenchNine)
