import browser from 'webextension-polyfill';

type BrowserAction = typeof browser.action;

type ActionWithOpenPopup = BrowserAction & {
  openPopup: () => Promise<void>;
};

const actionSupportsOpenPopup = (action: BrowserAction): action is ActionWithOpenPopup =>
  'openPopup' in action && typeof action.openPopup === 'function';

export const openActionPopup = async (): Promise<void> => {
  if (!actionSupportsOpenPopup(browser.action)) {
    return;
  }

  await browser.action.openPopup().catch(() => undefined);
};
