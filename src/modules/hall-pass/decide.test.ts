import { describe, expect, it } from 'vitest';
import { decideCancelPending, decideConfirmGrant, decideReportBlockedAttempt } from './decide';
import { createDefaultHallPassValue } from './hallPassDocument';

const timeOutContext = {
  isTimeOut: true,
  blockListEntries: ['blocked.test'],
};

describe('hall pass grant decisions', () => {
  it('reports a pending request for blocked destinations during time out', () => {
    const result = decideReportBlockedAttempt(createDefaultHallPassValue(), {
      url: 'https://blocked.test/page',
      requestId: 'req-1',
      reportedAtEpochMs: 1_000,
      context: timeOutContext,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'pending-requested') {
      throw new Error('expected pending request');
    }
    expect(result.value.request.destination).toBe('blocked.test');
  });

  it('requires at least one coin to confirm without upfront debit', () => {
    const pending = decideReportBlockedAttempt(createDefaultHallPassValue(), {
      url: 'https://blocked.test/page',
      requestId: 'req-1',
      reportedAtEpochMs: 1_000,
      context: timeOutContext,
    });
    if (!pending.ok || pending.value.kind !== 'pending-requested') {
      throw new Error('expected pending');
    }
    const zeroBalance = decideConfirmGrant(pending.value.value, {
      requestId: 'req-1',
      passId: 'pass-1',
      grantedAtEpochMs: 2_000,
      coinBalance: 0,
      context: timeOutContext,
    });
    expect(zeroBalance).toEqual({ ok: false, error: { kind: 'zero-balance' } });

    const granted = decideConfirmGrant(pending.value.value, {
      requestId: 'req-1',
      passId: 'pass-1',
      grantedAtEpochMs: 2_000,
      coinBalance: 3,
      context: timeOutContext,
    });
    expect(granted.ok).toBe(true);
    if (!granted.ok || granted.value.kind !== 'pass-granted') {
      throw new Error('expected grant');
    }
    expect(granted.value.pass.destination).toBe('blocked.test');
    expect(granted.value.value.pendingRequest).toBeNull();
  });

  it('cancels pending requests without changing balance state', () => {
    const pending = decideReportBlockedAttempt(createDefaultHallPassValue(), {
      url: 'https://blocked.test/page',
      requestId: 'req-1',
      reportedAtEpochMs: 1_000,
      context: timeOutContext,
    });
    if (!pending.ok || pending.value.kind !== 'pending-requested') {
      throw new Error('expected pending');
    }
    const cancelled = decideCancelPending(pending.value.value, {
      requestId: 'req-1',
      context: timeOutContext,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) {
      throw new Error('expected cancel');
    }
    expect(cancelled.value.value.pendingRequest).toBeNull();
  });
});
