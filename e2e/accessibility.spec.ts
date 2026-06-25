import { test, expect } from '@playwright/test';
import {
  applyThemeFixture,
  assertNoSeriousAxeViolations,
  gotoAppRoute,
  resolveThemeFromColorScheme,
  routesUnderTest,
} from './fixtures/accessibility';

test.describe('axe accessibility gate', () => {
  for (const route of routesUnderTest) {
    test(`${route.label} has no serious or critical axe violations`, async ({ page, colorScheme }, testInfo) => {
      const theme = resolveThemeFromColorScheme(colorScheme);
      await gotoAppRoute(page, route.path);
      await applyThemeFixture(page, theme);

      const contextLabel = `${testInfo.project.name}:${route.label}`;
      await assertNoSeriousAxeViolations(page, contextLabel);
    });
  }
});
