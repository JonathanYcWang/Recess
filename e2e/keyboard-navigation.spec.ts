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

  test('compact home mobile nav reaches schedule section', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'compact-light-360', 'compact shell navigation only');

    await gotoAppRoute(page, '/#/');
    await page.getByRole('button', { name: 'Schedule' }).click();
    await expect(page.getByText('Set Work Start Reminders')).toBeVisible();
  });

  test('full-tab skip link targets main content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'full-tab-light-768', 'full-tab shell only');

    await gotoAppRoute(page, '/#/');
    await page.getByRole('link', { name: 'Skip to main content' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('primitive examples route is keyboard reachable', async ({ page }) => {
    await gotoAppRoute(page, '/#/primitive-examples');

    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
