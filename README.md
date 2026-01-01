# Recess Chrome Extension

A focus session manager Chrome extension built with React and Tailwind CSS. This extension helps users manage focus sessions with breaks and site blocking capabilities.

## Features

- 🎯 **Dynamic Focus Sessions**: Adaptive session lengths based on your momentum, fatigue, and progress
- 🎮 **Break Management**: Earn breaks with reward selection from your blocked sites
- 🚫 **Site Blocking**: Block distracting websites during focus sessions using Chrome's declarativeNetRequest API
- ⏰ **Work Hours**: Set custom work hours for your daily work target
- 📊 **Smart Duration Calculations**: Uses CEWMA (Completion Exponentially Weighted Moving Average) to adjust session lengths

## Pages & Views

1. **Welcome Page** - Initial onboarding with feature overview
2. **Before Work Session View** - Start your daily work session with duration preview
3. **Ongoing Focus Session View** - Active focus session with countdown timer and pause option
4. **Reward Selection View** - Choose your break reward after completing a focus session
5. **Ongoing Break Session View** - Active break with selected reward
6. **Focus Session Countdown View** - 10-second transition before returning to focus
7. **Work Session Complete View** - Congratulations screen when daily target is met
8. **Settings - Blocked Sites** - Manage blocked websites list
9. **Settings - Work Hours** - Configure work hours schedule

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

**Note**: Extension icons are located in `public/assets/logo.png`. The extension will open in a new tab when clicked.

## Project Structure

```
Recess-Extension/
├── src/
│   ├── assets/          # Images and SVG icons
│   ├── components/      # Reusable React components
│   │   └── ui/         # UI components (TimeField, etc.)
│   ├── lib/            # Business logic and utilities
│   │   ├── constants.ts              # Configuration constants
│   │   ├── session-duration-calculator.ts  # Dynamic duration formulas
│   │   ├── timer-utils.ts            # Time formatting utilities
│   │   ├── types.ts                  # TypeScript type definitions
│   │   └── utils.ts                  # General utilities
│   ├── pages/          # Page components
│   │   └── views/      # State-specific views for MainPage
│   ├── store/          # Redux store
│   │   ├── slices/     # Redux slices (timer, workHours, blockedSites, routing)
│   │   ├── hooks/      # Custom hooks (useTimer)
│   │   ├── selectors/  # Redux selectors
│   │   └── storageMiddleware.ts  # Chrome storage persistence
│   ├── styles/         # CSS modules and global styles
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Entry point and store initialization
│   ├── background.ts   # Background service worker for site blocking
│   └── content.ts      # Content script (minimal, for future features)
├── docs/               # Comprehensive developer documentation
├── manifest.json       # Chrome extension manifest (v3)
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management with persistence
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Chrome Extensions API** - Manifest V3 with declarativeNetRequest for site blocking

## Documentation

Comprehensive developer documentation is available in the `/docs` directory:

- **[Architecture Overview](docs/architecture.md)** - System design and data flow
- **[Session Lifecycle](docs/session-lifecycle.md)** - Step-by-step walkthrough of focus/break cycles
- **[Time Calculations](docs/time-calculations.md)** - Explanation of dynamic duration formulas
- **[State and Storage](docs/state-and-storage.md)** - Redux state structure and persistence
- **[Developer Notes](docs/developer-notes.md)** - Design decisions and tradeoffs

See [docs/README.md](docs/README.md) for the full documentation index.

## Design

The extension follows the Figma designs provided, using:
- Patrick Hand font for body text
- BenchNine font for the logo
- Custom color palette matching the designs
- Exact dimensions and spacing from Figma

## License

MIT

