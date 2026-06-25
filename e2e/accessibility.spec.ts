import { test } from '@playwright/test';
import {
  assertNoSeriousAxeViolations,
  gotoAppRoute,
  routesUnderTest,
} from './fixtures/accessibility';

test.describe('axe accessibility gate', () => {
  for (const route of routesUnderTest) {
    test(`${route.label} has no serious or critical axe violations`, async ({ page }, testInfo) => {
      await gotoAppRoute(page, route.path);

      const contextLabel = `${testInfo.project.name}:${route.label}`;
      await assertNoSeriousAxeViolations(page, contextLabel);
    });
  }
});
