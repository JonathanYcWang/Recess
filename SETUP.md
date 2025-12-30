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
   This starts the Vite dev server. Note: For Chrome extension testing, you'll need to build and load the extension.

3. **Build for Production**
   ```bash
   npm run build
   ```
   This will:
   - Compile TypeScript
   - Build the React app with Vite
   - Copy manifest.json to dist/
   - Convert background.ts and content.ts to JavaScript and copy to dist/

4. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder

## Project Structure

- `src/` - Source code
  - `pages/` - All page components
  - `components/` - Reusable components (Header, Timer)
  - `assets/` - SVG icons and images
  - `background.ts` - Background service worker
  - `content.ts` - Content script
- `public/` - Static assets (extension icons)
- `dist/` - Built extension (created after `npm run build`)

## Icons

You'll need to create proper icon files:
- `public/assets/icon-16.png` (16x16 pixels)
- `public/assets/icon-48.png` (48x48 pixels)  
- `public/assets/icon-128.png` (128x128 pixels)

Currently these are placeholder files. Replace them with your actual extension icons.

## Features Implemented

✅ All 10 Figma designs implemented:
1. Welcome Page
2. Main Page - Before Focus Session Starts
3. Main Page - During Focus Session
4. Main Page - Focus Session Paused
5. Break Page
6. Reward Selection Page
7. Settings - Blocked Sites
8. Settings - Work Hours (two variations)
9. Back To It Transition Page

✅ React Router for navigation
✅ Tailwind CSS styling matching Figma designs
✅ TypeScript for type safety
✅ Chrome Extension manifest v3
✅ Background and content scripts
✅ Timer functionality
✅ State management ready

## Next Steps

1. Replace placeholder icons with actual designs
2. Implement Chrome storage for persistence
3. Add actual site blocking functionality
4. Connect timer to Chrome alarms API
5. Add reward site unlocking logic
6. Implement work hours scheduling

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

