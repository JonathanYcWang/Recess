import { test, expect } from '@playwright/test';
import {
  applyThemeFixture,
  FOCUSABLE_TAGS,
  focusFirstTabStop,
  gotoAppRoute,
  resolveThemeFromColorScheme,
} from './fixtures/accessibility';

test.describe('keyboard and navigation behavior', () => {
  test('home route exposes a focusable control via keyboard', async ({ page, colorScheme }) => {
    const theme = resolveThemeFromColorScheme(colorScheme);
    await gotoAppRoute(page, '/#/');
    await applyThemeFixture(page, theme);

    const focusedTag = await focusFirstTabStop(page);
    expect(FOCUSABLE_TAGS).toContain(focusedTag);
  });

  test('onboarding route is keyboard reachable', async ({ page, colorScheme }) => {
    const theme = resolveThemeFromColorScheme(colorScheme);
    await gotoAppRoute(page, '/#/onboarding');
    await applyThemeFixture(page, theme);

    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('reduced-motion project disables CSS animation duration', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'compact-reduced-motion', 'reduced-motion fixture only');

    await gotoAppRoute(page, '/#/');
    await applyThemeFixture(page, 'light');

    const animationDuration = await page.evaluate(() => {
      const element = document.body;
      return window.getComputedStyle(element).animationDuration;
    });
    expect(['0.01ms', '0s']).toContain(animationDuration);
  });

  test('theme fixture applies data-theme attribute', async ({ page, colorScheme }) => {
    const theme = resolveThemeFromColorScheme(colorScheme);
    await gotoAppRoute(page, '/#/');
    await applyThemeFixture(page, theme);

    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(dataTheme).toBe(theme);
  });
});
