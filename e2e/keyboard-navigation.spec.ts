import { test, expect } from '@playwright/test';
import { FOCUSABLE_TAGS, focusFirstTabStop, gotoAppRoute } from './fixtures/accessibility';

test.describe('keyboard and navigation behavior', () => {
  test('home route exposes a focusable control via keyboard', async ({ page }) => {
    await gotoAppRoute(page, '/#/');

    const focusedTag = await focusFirstTabStop(page);
    expect(FOCUSABLE_TAGS).toContain(focusedTag);
  });

  test('onboarding route is keyboard reachable', async ({ page }) => {
    await gotoAppRoute(page, '/#/onboarding');

    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('reduced-motion project disables CSS animation duration', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'compact-reduced-motion', 'reduced-motion fixture only');

    await gotoAppRoute(page, '/#/');

    const animationDuration = await page.evaluate(() => {
      const element = document.body;
      return window.getComputedStyle(element).animationDuration;
    });
    expect(['0.01ms', '0s']).toContain(animationDuration);
  });

  test('primitive examples route is keyboard reachable', async ({ page }) => {
    await gotoAppRoute(page, '/#/primitive-examples');

    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
