import { describe, expect, it } from 'vitest';
import {
  HALL_PASS_ACTIVE_MINUTE_SECONDS,
  hallPassMinuteDebitTransactionId,
} from './hallPassDocument';
import {
  decideCancelPending,
  decideConfirmGrant,
  decideMeterActivity,
  decideReportBlockedAttempt,
  decideRevokePass,
  decideSettlePassAtBoundary,
} from './decide';
import { createDefaultHallPassValue } from './hallPassDocument';

const timeOutContext = {
  isTimeOut: true,
  blockListEntries: ['blocked.test'],
};

describe('hall pass decisions', () => {
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

  it('bills completed active minutes exactly once at sixty-second boundaries', () => {
    const granted = decideConfirmGrant(
      {
        pendingRequest: {
          requestId: 'req-1',
          destination: 'blocked.test',
          rememberedUrl: 'https://blocked.test/page',
          reportedAtEpochMs: 1_000,
        },
        activePass: null,
      },
      {
        requestId: 'req-1',
        passId: 'pass-1',
        grantedAtEpochMs: 2_000,
        coinBalance: 2,
        context: timeOutContext,
      }
    );
    if (!granted.ok || granted.value.kind !== 'pass-granted') {
      throw new Error('expected grant');
    }

    const value = granted.value.value;
    let pass = value.activePass;
    if (!pass) {
      throw new Error('expected active pass');
    }
    pass = { ...pass, isMeteringActive: true, meterAnchorEpochMs: 0, activeSecondsAccumulated: 0 };

    const metered = decideMeterActivity(
      { ...value, activePass: pass },
      {
        nowEpochMs: HALL_PASS_ACTIVE_MINUTE_SECONDS * 1000,
        coinBalance: 2,
        focusedWindowId: 1,
        activeTab: {
          tabId: 1,
          windowId: 1,
          url: 'https://blocked.test/page',
          active: true,
        },
        context: timeOutContext,
      }
    );
    if (!metered.ok || metered.value.kind !== 'meter-updated') {
      throw new Error('expected meter update');
    }
    expect(metered.value.debits).toEqual([
      {
        transactionId: hallPassMinuteDebitTransactionId('pass-1', 1),
        amount: 1,
        minuteOrdinal: 1,
      },
    ]);
    expect(metered.value.value.activePass?.billedMinuteCount).toBe(1);
    expect(metered.value.value.activePass?.activeSecondsAccumulated).toBe(0);
  });

  it('revokes when the next coin cannot be paid', () => {
    const value = {
      pendingRequest: null,
      activePass: {
        passId: 'pass-1',
        destination: 'blocked.test',
        grantedAtEpochMs: 0,
        activeSecondsAccumulated: HALL_PASS_ACTIVE_MINUTE_SECONDS,
        billedMinuteCount: 0,
        meterAnchorEpochMs: null,
        isMeteringActive: false,
      },
    };
    const metered = decideMeterActivity(value, {
      nowEpochMs: 1_000,
      coinBalance: 0,
      focusedWindowId: 1,
      activeTab: {
        tabId: 1,
        windowId: 1,
        url: 'https://blocked.test/page',
        active: true,
      },
      context: timeOutContext,
    });
    if (!metered.ok || metered.value.kind !== 'meter-updated') {
      throw new Error('expected meter update');
    }
    expect(metered.value.revoked).toBe(true);
    expect(metered.value.value.activePass).toBeNull();
  });

  it('discards partial minutes when settling at a lifecycle boundary', () => {
    const value = {
      pendingRequest: null,
      activePass: {
        passId: 'pass-1',
        destination: 'blocked.test',
        grantedAtEpochMs: 0,
        activeSecondsAccumulated: 59,
        billedMinuteCount: 1,
        meterAnchorEpochMs: null,
        isMeteringActive: false,
      },
    };
    const settled = decideSettlePassAtBoundary(value, {
      nowEpochMs: 5_000,
      coinBalance: 3,
      focusedWindowId: null,
      activeTab: null,
      context: timeOutContext,
    });
    expect(settled.ok).toBe(true);
    if (!settled.ok || settled.value.kind !== 'pass-revoked') {
      throw new Error('expected revoke settlement');
    }
    expect(settled.value.value.activePass).toBeNull();
  });

  it('revokes active passes on manual revoke', () => {
    const value = {
      pendingRequest: null,
      activePass: {
        passId: 'pass-1',
        destination: 'blocked.test',
        grantedAtEpochMs: 0,
        activeSecondsAccumulated: 0,
        billedMinuteCount: 0,
        meterAnchorEpochMs: null,
        isMeteringActive: false,
      },
    };
    const revoked = decideRevokePass(value, { passId: 'pass-1' });
    expect(revoked.ok).toBe(true);
    if (!revoked.ok || revoked.value.kind !== 'pass-revoked') {
      throw new Error('expected revoke');
    }
    expect(revoked.value.value.activePass).toBeNull();
  });
});
