import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type ThemeFixture = 'light' | 'dark';

const FOCUSABLE_TAGS = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];

export const installExtensionApiFixture = async (page: Page) => {
  await page.addInitScript(() => {
    const runtime = {
      sendMessage: async () => ({
        ok: true,
        result: {
          ok: true,
          value: {
            value: {
              onboardingCompleted: true,
            },
          },
        },
      }),
      onMessage: {
        addListener: () => undefined,
        removeListener: () => undefined,
      },
    };

    const chromeApi = { runtime };
    Object.defineProperty(window, 'chrome', {
      configurable: true,
      value: chromeApi,
    });
  });
};

export const applyThemeFixture = async (page: Page, theme: ThemeFixture) => {
  await page.evaluate((resolvedTheme) => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, theme);
};

export const resolveThemeFromColorScheme = (colorScheme: 'light' | 'dark' | null | undefined): ThemeFixture =>
  colorScheme === 'dark' ? 'dark' : 'light';

export const gotoAppRoute = async (page: Page, path: string) => {
  await installExtensionApiFixture(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button', { state: 'attached', timeout: 15_000 });
};

export const focusFirstTabStop = async (page: Page) => {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    if (FOCUSABLE_TAGS.includes(focusedTag)) {
      return focusedTag;
    }
  }
  return page.evaluate(() => document.activeElement?.tagName ?? '');
};

export const assertNoSeriousAxeViolations = async (page: Page, contextLabel: string) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical'
  );

  if (blocking.length > 0) {
    const summary = blocking
      .map((violation) => {
        const nodes = violation.nodes.map((node) => node.html).join(' | ');
        return `${violation.id} (${violation.impact}) on ${violation.nodes.length} node(s): ${nodes}`;
      })
      .join('; ');
    throw new Error(`[${contextLabel}] axe serious/critical violations: ${summary}`);
  }
};

export const routesUnderTest = [
  { path: '/#/onboarding', label: 'onboarding' },
  { path: '/#/primitive-examples', label: 'primitive-examples' },
] as const;

/** Home focus route — add to axe gate after #117 shell migration fixes contrast debt (#112 §7). */
export const routesPendingAxeGate = [{ path: '/#/', label: 'home-focus' }] as const;

export { FOCUSABLE_TAGS };
