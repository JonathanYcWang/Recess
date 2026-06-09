import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  notifyBreakComplete,
  notifyBreakEnding,
  notifyFocusComplete,
  notifyFocusEnding,
} from './notificationService';

const originalChrome = globalThis.chrome;

describe('notificationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.chrome = originalChrome;
  });

  it('does nothing when the Chrome runtime API is unavailable', () => {
    globalThis.chrome = undefined as unknown as typeof chrome;

    expect(() => notifyFocusComplete()).not.toThrow();
  });

  it('sends a focus ending notification after a successful ping', () => {
    const sendMessage = vi
      .fn()
      .mockImplementationOnce((_message, callback) => callback({ ok: true }))
      .mockImplementationOnce((_message, callback) => callback());
    globalThis.chrome = {
      runtime: {
        sendMessage,
      },
    } as unknown as typeof chrome;

    notifyFocusEnding(5);

    expect(sendMessage).toHaveBeenNthCalledWith(1, { type: 'PING' }, expect.any(Function));
    expect(sendMessage).toHaveBeenNthCalledWith(
      2,
      {
        type: 'SESSION_NOTIFICATION',
        title: 'Focus Ending Soon',
        message: '5 minutes left in your focus session!',
      },
      expect.any(Function)
    );
  });

  it('does not send a notification when the ping has no receiver', () => {
    const sendMessage = vi.fn((_message, callback) => {
      globalThis.chrome.runtime.lastError = { message: 'Receiving end does not exist' };
      callback();
    });
    globalThis.chrome = {
      runtime: {
        sendMessage,
      },
    } as unknown as typeof chrome;

    notifyBreakComplete();

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('logs delivery errors without throwing', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const sendMessage = vi
      .fn()
      .mockImplementationOnce((_message, callback) => callback({ ok: true }))
      .mockImplementationOnce((_message, callback) => {
        globalThis.chrome.runtime.lastError = { message: 'closed' };
        callback();
      });
    globalThis.chrome = {
      runtime: {
        sendMessage,
      },
    } as unknown as typeof chrome;

    notifyBreakEnding(5);

    expect(debug).toHaveBeenCalledWith('Notification message not delivered:', 'closed');
  });

  it('uses the expected complete notification copy', () => {
    const sendMessage = vi
      .fn()
      .mockImplementationOnce((_message, callback) => callback({ ok: true }))
      .mockImplementationOnce((_message, callback) => callback());
    globalThis.chrome = {
      runtime: {
        sendMessage,
      },
    } as unknown as typeof chrome;

    notifyFocusComplete();

    expect(sendMessage).toHaveBeenNthCalledWith(
      2,
      {
        type: 'SESSION_NOTIFICATION',
        title: 'Focus Complete',
        message: 'Your focus session has ended!',
      },
      expect.any(Function)
    );
  });
});
