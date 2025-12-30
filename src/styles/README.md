# Design System Documentation

This directory contains the shared design system modules for the Recess extension.

## Structure

### Core Modules

1. **`colors.module.css`** - Color tokens

   - Defines all color variables used throughout the application
   - Includes text colors, background colors, and border colors
   - Uses CSS custom properties for easy theming

2. **`typography.module.css`** - Typography tokens

   - Font families (Patrick Hand, BenchNine)
   - Font sizes (12px to 96px)
   - Letter spacing utilities
   - Text transforms and alignment

3. **`spacing.module.css`** - Spacing tokens

   - Padding and margin utilities
   - Gap utilities for flexbox/grid
   - Consistent spacing scale

4. **`breakpoints.module.css`** - Breakpoint tokens

   - Media query breakpoints
   - Container widths
   - Responsive design utilities
   - See breakpoints section below for usage

5. **`breakpoints.ts`** - Breakpoint constants for TypeScript/JavaScript

   - TypeScript constants matching CSS breakpoints
   - Media query helpers for window.matchMedia()
   - Use in React hooks or responsive logic

6. **`globals.css`** - Global styles
   - Base resets
   - Common utilities
   - Shadow definitions
   - Transform utilities

## Usage

### Importing Design Tokens

```css
/* In your component CSS module */
.myComponent {
  color: var(--recess-black);
  background-color: var(--recess-white);
  font-family: 'Patrick Hand', cursive;
}
```

### Using CSS Modules in Components

```tsx
import styles from './MyComponent.module.css';

function MyComponent() {
  return <div className={styles.container}>Content</div>;
}
```

## Color Palette

- `--recess-black`: #1b1b1b
- `--recess-white`: #ffffff
- `--recess-gray`: #929292
- `--recess-gray-light`: #717171
- `--recess-gray-bg`: #f1f0f0
- `--recess-gray-border`: #e7e5e4
- `--recess-gray-light-bg`: #f5f5f4
- `--recess-green`: #37eb4f

## Typography

- **Primary Font**: Patrick Hand (cursive)
- **Secondary Font**: BenchNine (sans-serif)
- **Sizes**: 12px, 14px, 16px, 18px, 22px, 26px, 28px, 41px, 64px, 96px

## Breakpoints

### Available Breakpoints

- **xs**: 500px - Minimum supported width
- **sm**: 640px - Small mobile
- **cardHide**: 700px - Hide card descriptions
- **tablet**: 767px - Below tablet threshold
- **md**: 768px - Tablet and above
- **lg**: 1024px - Desktop
- **xl**: 1280px - Large desktop
- **2xl**: 1536px - Extra large desktop

### Using Breakpoints in CSS

**Important**: CSS custom properties cannot be used directly in `@media` queries. Use the pixel values directly.

```css
/* In your component CSS module */
.myComponent {
  padding: 20px;
}

/* Mobile-first: max-width queries */
@media (max-width: 640px) {
  .myComponent {
    padding: 12px;
  }
}

/* Desktop-first: min-width queries */
@media (min-width: 1024px) {
  .myComponent {
    padding: 32px;
  }
}
```

### Using Breakpoints in TypeScript/JavaScript

```tsx
import { BREAKPOINTS, mediaQueries } from '../styles/breakpoints';

// Using constants
const isMobile = window.innerWidth < BREAKPOINTS.sm;

// Using matchMedia
const mediaQuery = window.matchMedia(mediaQueries.max.sm);
if (mediaQuery.matches) {
  // Mobile styles
}

// In React hooks
useEffect(() => {
  const mediaQuery = window.matchMedia(mediaQueries.max.md);
  const handleChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      // Handle mobile view
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []);
```

## Best Practices

1. Always use CSS custom properties from `colors.module.css` instead of hardcoded colors
2. Use typography classes from `typography.module.css` for consistent text styling
3. Use spacing utilities from `spacing.module.css` for consistent layout
4. **Use breakpoint values from `breakpoints.module.css` comments** - copy the exact pixel values to ensure consistency
5. Create component-specific CSS modules for component styles
6. Keep shared utilities in `globals.css`
7. For TypeScript/JavaScript responsive logic, import from `breakpoints.ts`
