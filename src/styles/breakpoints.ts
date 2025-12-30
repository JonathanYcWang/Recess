/**
 * Breakpoint Constants
 *
 * These constants match the breakpoints defined in breakpoints.module.css
 * Use these in TypeScript/JavaScript files for responsive logic.
 *
 * Note: CSS custom properties cannot be used in @media queries,
 * so use the pixel values directly in CSS files.
 */

export const BREAKPOINTS = {
  /** Minimum supported width */
  xs: 500,

  /** Small mobile */
  sm: 640,

  /** Hide card descriptions below this width */
  cardHide: 700,

  /** Below tablet threshold (for hiding elements like cow image) */
  tablet: 767,

  /** Tablet and above */
  md: 768,

  /** Desktop */
  lg: 1024,

  /** Large desktop */
  xl: 1280,

  /** Extra large desktop */
  '2xl': 1536,

  /** Card scaling breakpoints */
  card800: 800,
  card1000: 1000,
  card1200: 1200,

  /** Illustration positioning */
  illustration: 1440,
} as const;

/**
 * Media query helpers for use with window.matchMedia()
 *
 * Example:
 * const isMobile = window.matchMedia(`(max-width: ${BREAKPOINTS.sm}px)`).matches;
 */
export const mediaQueries = {
  /** max-width queries (mobile-first) */
  max: {
    xs: `(max-width: ${BREAKPOINTS.xs}px)`,
    sm: `(max-width: ${BREAKPOINTS.sm}px)`,
    cardHide: `(max-width: ${BREAKPOINTS.cardHide}px)`,
    tablet: `(max-width: ${BREAKPOINTS.tablet}px)`,
    md: `(max-width: ${BREAKPOINTS.md}px)`,
    lg: `(max-width: ${BREAKPOINTS.lg}px)`,
    xl: `(max-width: ${BREAKPOINTS.xl}px)`,
    '2xl': `(max-width: ${BREAKPOINTS['2xl']}px)`,
  },

  /** min-width queries (desktop-first) */
  min: {
    sm: `(min-width: ${BREAKPOINTS.sm}px)`,
    md: `(min-width: ${BREAKPOINTS.md}px)`,
    lg: `(min-width: ${BREAKPOINTS.lg}px)`,
    xl: `(min-width: ${BREAKPOINTS.xl}px)`,
    '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
  },
} as const;
