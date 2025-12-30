# Recess Chrome Extension

A focus session manager Chrome extension built with React and Tailwind CSS. This extension helps users manage focus sessions with breaks and site blocking capabilities.

## Features

- 🎯 **Focus Sessions**: Start, pause, and resume focus sessions with customizable timers
- 🎮 **Break Management**: Take breaks with reward selection
- 🚫 **Site Blocking**: Block distracting websites during focus sessions
- ⏰ **Work Hours**: Set custom work hours for automatic session management
- 💪 **Energy Tracking**: Monitor your energy levels throughout sessions

## Pages

1. **Welcome Page** - Initial landing page
2. **Main Page - Before Session** - Start a new focus session
3. **Main Page - During Session** - Active session with timer and pause option
4. **Main Page - Paused** - Paused session with resume option
5. **Break Page** - Active break with unlocked site access
6. **Reward Selection Page** - Choose how to spend your break time
7. **Settings - Blocked Sites** - Manage blocked websites
8. **Settings - Work Hours** - Configure work hours schedule
9. **Back To It Page** - Transition page after break

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. The built extension will be in the `dist` folder.

### Development Mode

Run the development server:
```bash
npm run dev
```

### Loading the Extension in Chrome

1. Build the extension:
```bash
npm run build
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder from this project
6. The extension icon should appear in your Chrome toolbar

**Note**: You'll need to create icon files (icon-16.png, icon-48.png, icon-128.png) in the `public/assets` folder or update the manifest.json to point to existing icons.

## Project Structure

```
Recess-Extension/
├── src/
│   ├── assets/          # Images and SVG icons
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Entry point
│   ├── background.ts   # Background service worker
│   ├── content.ts      # Content script
│   └── index.css       # Global styles
├── manifest.json       # Chrome extension manifest
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Vite** - Build tool
- **Chrome Extensions API** - Extension functionality

## Design

The extension follows the Figma designs provided, using:
- Patrick Hand font for body text
- BenchNine font for the logo
- Custom color palette matching the designs
- Exact dimensions and spacing from Figma

## License

MIT

