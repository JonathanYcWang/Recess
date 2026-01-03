# Design System Documentation

This directory contains the shared design system modules for the Recess extension.

## Structure

### Core Modules

1. **`colors.module.css`** — Color tokens (CSS custom properties for all colors)
2. **`typography.module.css`** — Typography tokens (fonts, sizes, spacing)
3. **`spacing.module.css`** — Spacing tokens (padding, margin, gap)
4. **`breakpoints.module.css`** — Breakpoint tokens (media queries, container widths)
5. **`breakpoints.ts`** — TypeScript constants for breakpoints and media queries
6. **`globals.css`** — Global styles (resets, utilities, shadows)

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

- **xs**: 500px — Minimum supported width
- **sm**: 640px — Small mobile
- **cardHide**: 700px — Hide card descriptions
- **tablet**: 767px — Below tablet threshold
- **md**: 768px — Tablet and above
- **lg**: 1024px — Desktop
- **xl**: 1280px — Large desktop
- **2xl**: 1536px — Extra large desktop

### Using Breakpoints in CSS

```css
@media (max-width: 640px) {
  .myComponent {
    padding: 12px;
  }
}
@media (min-width: 1024px) {
  .myComponent {
    padding: 32px;
  }
}
```

### Using Breakpoints in TypeScript/JavaScript

```tsx
import { BREAKPOINTS, mediaQueries } from '../styles/breakpoints';
const isMobile = window.innerWidth < BREAKPOINTS.sm;
const mediaQuery = window.matchMedia(mediaQueries.max.sm);
if (mediaQuery.matches) {
  // Mobile styles
}
```

## Best Practices

1. Use CSS custom properties from `colors.module.css` for all colors
2. Use typography classes from `typography.module.css` for consistent text
3. Use spacing utilities from `spacing.module.css` for layout
4. Use breakpoint values from `breakpoints.module.css` for media queries
5. Create component-specific CSS modules for component styles
6. Keep shared utilities in `globals.css`
7. For responsive logic in TypeScript/JavaScript, import from `breakpoints.ts`
