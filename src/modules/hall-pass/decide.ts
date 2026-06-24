import { findMatchingBlockListEntry, parseDestination } from '@/modules/block-list';
import type { Result } from '@/modules/persisted-application-state';
import {
  cloneHallPassActivePass,
  cloneHallPassValue,
  HALL_PASS_ACTIVE_MINUTE_SECONDS,
  HALL_PASS_RATE_COINS_PER_MINUTE,
  hallPassMinuteDebitTransactionId,
  type HallPassActivePass,
  type HallPassPendingRequest,
  type HallPassValue,
} from './hallPassDocument';

export type HallPassPhaseContext = {
  isTimeOut: boolean;
  blockListEntries: readonly string[];
};

export type HallPassDecisionError =
  | { kind: 'not-in-time-out' }
  | { kind: 'destination-not-blocked' }
  | { kind: 'private-or-unsupported-destination' }
  | { kind: 'zero-balance' }
  | { kind: 'no-pending-request' }
  | { kind: 'stale-pending-request'; requestId: string }
  | { kind: 'no-active-pass' }
  | { kind: 'stale-pass'; passId: string }
  | { kind: 'entry-removed'; destination: string }
  | { kind: 'invalid-destination' }
  | { kind: 'invalid-request-id' }
  | { kind: 'invalid-pass-id' };

export type HallPassMeterDebit = {
  transactionId: string;
  amount: number;
  minuteOrdinal: number;
};

export type HallPassDecisionOutcome =
  | { kind: 'pending-requested'; value: HallPassValue; request: HallPassPendingRequest }
  | { kind: 'pending-cancelled'; value: HallPassValue }
  | { kind: 'pass-granted'; value: HallPassValue; pass: HallPassActivePass }
  | { kind: 'pass-revoked'; value: HallPassValue; passId: string }
  | {
      kind: 'pass-replaced';
      value: HallPassValue;
      previousPassId: string;
      pass: HallPassActivePass;
    }
  | { kind: 'meter-updated'; value: HallPassValue; debits: HallPassMeterDebit[]; revoked: boolean }
  | { kind: 'noop'; value: HallPassValue };

const isEligibleBlockedDestination = (
  url: string,
  context: HallPassPhaseContext
): Result<{ destination: string; rememberedUrl: string }, HallPassDecisionError> => {
  const parsed = parseDestination(url);
  if (parsed.kind === 'private-browsing' || parsed.kind === 'internal') {
    return { ok: false, error: { kind: 'private-or-unsupported-destination' } };
  }
  if (parsed.kind === 'unsupported') {
    return { ok: false, error: { kind: 'private-or-unsupported-destination' } };
  }
  const destination = findMatchingBlockListEntry(parsed.hostname, context.blockListEntries);
  if (!destination) {
    return { ok: false, error: { kind: 'destination-not-blocked' } };
  }
  return { ok: true, value: { destination, rememberedUrl: parsed.url } };
};

const ensureTimeOut = (context: HallPassPhaseContext): Result<void, HallPassDecisionError> => {
  if (!context.isTimeOut) {
    return { ok: false, error: { kind: 'not-in-time-out' } };
  }
  return { ok: true, value: undefined };
};

const ensureEntryStillBlocked = (
  destination: string,
  context: HallPassPhaseContext
): Result<void, HallPassDecisionError> => {
  if (!context.blockListEntries.includes(destination)) {
    return { ok: false, error: { kind: 'entry-removed', destination } };
  }
  return { ok: true, value: undefined };
};

export const decideReportBlockedAttempt = (
  current: HallPassValue,
  input: {
    url: string;
    requestId: string;
    reportedAtEpochMs: number;
    context: HallPassPhaseContext;
  }
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  const timeOut = ensureTimeOut(input.context);
  if (!timeOut.ok) {
    return timeOut;
  }
  const eligible = isEligibleBlockedDestination(input.url, input.context);
  if (!eligible.ok) {
    return eligible;
  }
  if (current.activePass?.destination === eligible.value.destination) {
    return { ok: true, value: { kind: 'noop', value: cloneHallPassValue(current) } };
  }
  if (typeof input.requestId !== 'string' || input.requestId.trim().length === 0) {
    return { ok: false, error: { kind: 'invalid-request-id' } };
  }
  const value = cloneHallPassValue(current);
  const request: HallPassPendingRequest = {
    requestId: input.requestId.trim(),
    destination: eligible.value.destination,
    rememberedUrl: eligible.value.rememberedUrl,
    reportedAtEpochMs: input.reportedAtEpochMs,
  };
  value.pendingRequest = request;
  return { ok: true, value: { kind: 'pending-requested', value, request } };
};

export const decideCancelPending = (
  current: HallPassValue,
  input: {
    requestId?: string;
    context: HallPassPhaseContext;
  }
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  const timeOut = ensureTimeOut(input.context);
  if (!timeOut.ok) {
    return timeOut;
  }
  if (!current.pendingRequest) {
    return { ok: false, error: { kind: 'no-pending-request' } };
  }
  if (input.requestId && input.requestId !== current.pendingRequest.requestId) {
    return { ok: false, error: { kind: 'stale-pending-request', requestId: input.requestId } };
  }
  const value = cloneHallPassValue(current);
  value.pendingRequest = null;
  return { ok: true, value: { kind: 'pending-cancelled', value } };
};

export const decideConfirmGrant = (
  current: HallPassValue,
  input: {
    requestId: string;
    passId: string;
    grantedAtEpochMs: number;
    coinBalance: number;
    context: HallPassPhaseContext;
  }
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  const timeOut = ensureTimeOut(input.context);
  if (!timeOut.ok) {
    return timeOut;
  }
  if (!current.pendingRequest) {
    return { ok: false, error: { kind: 'no-pending-request' } };
  }
  if (current.pendingRequest.requestId !== input.requestId) {
    return { ok: false, error: { kind: 'stale-pending-request', requestId: input.requestId } };
  }
  const entry = ensureEntryStillBlocked(current.pendingRequest.destination, input.context);
  if (!entry.ok) {
    return entry;
  }
  if (input.coinBalance < HALL_PASS_RATE_COINS_PER_MINUTE) {
    return { ok: false, error: { kind: 'zero-balance' } };
  }
  if (typeof input.passId !== 'string' || input.passId.trim().length === 0) {
    return { ok: false, error: { kind: 'invalid-pass-id' } };
  }
  if (current.activePass) {
    return { ok: false, error: { kind: 'stale-pass', passId: current.activePass.passId } };
  }
  const value = cloneHallPassValue(current);
  const pass: HallPassActivePass = {
    passId: input.passId.trim(),
    destination: current.pendingRequest.destination,
    grantedAtEpochMs: input.grantedAtEpochMs,
    activeSecondsAccumulated: 0,
    billedMinuteCount: 0,
    meterAnchorEpochMs: null,
    isMeteringActive: false,
  };
  value.pendingRequest = null;
  value.activePass = pass;
  return { ok: true, value: { kind: 'pass-granted', value, pass } };
};

export const decideConfirmReplace = (
  current: HallPassValue,
  input: {
    requestId: string;
    passId: string;
    grantedAtEpochMs: number;
    coinBalance: number;
    context: HallPassPhaseContext;
  }
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  const timeOut = ensureTimeOut(input.context);
  if (!timeOut.ok) {
    return timeOut;
  }
  if (!current.pendingRequest) {
    return { ok: false, error: { kind: 'no-pending-request' } };
  }
  if (current.pendingRequest.requestId !== input.requestId) {
    return { ok: false, error: { kind: 'stale-pending-request', requestId: input.requestId } };
  }
  const entry = ensureEntryStillBlocked(current.pendingRequest.destination, input.context);
  if (!entry.ok) {
    return entry;
  }
  if (input.coinBalance < HALL_PASS_RATE_COINS_PER_MINUTE) {
    return { ok: false, error: { kind: 'zero-balance' } };
  }
  if (!current.activePass) {
    return decideConfirmGrant(current, input);
  }
  const previousPassId = current.activePass.passId;
  const value = cloneHallPassValue(current);
  const pass: HallPassActivePass = {
    passId: input.passId.trim(),
    destination: current.pendingRequest.destination,
    grantedAtEpochMs: input.grantedAtEpochMs,
    activeSecondsAccumulated: 0,
    billedMinuteCount: 0,
    meterAnchorEpochMs: null,
    isMeteringActive: false,
  };
  value.pendingRequest = null;
  value.activePass = pass;
  return { ok: true, value: { kind: 'pass-replaced', value, previousPassId, pass } };
};

export const decideRevokePass = (
  current: HallPassValue,
  input?: { passId?: string }
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  if (!current.activePass) {
    return { ok: false, error: { kind: 'no-active-pass' } };
  }
  if (input?.passId && input.passId !== current.activePass.passId) {
    return { ok: false, error: { kind: 'stale-pass', passId: input.passId } };
  }
  const passId = current.activePass.passId;
  const value = cloneHallPassValue(current);
  value.activePass = null;
  value.pendingRequest = null;
  return { ok: true, value: { kind: 'pass-revoked', value, passId } };
};

export const decideClearForNonTimeOut = (
  current: HallPassValue
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  if (!current.activePass && !current.pendingRequest) {
    return { ok: true, value: { kind: 'noop', value: cloneHallPassValue(current) } };
  }
  const passId = current.activePass?.passId ?? 'none';
  const value = cloneHallPassValue(current);
  value.activePass = null;
  value.pendingRequest = null;
  return { ok: true, value: { kind: 'pass-revoked', value, passId } };
};

export const urlMatchesHallPassDestination = (url: string, destination: string): boolean => {
  const parsed = parseDestination(url);
  if (parsed.kind !== 'website') {
    return false;
  }
  return findMatchingBlockListEntry(parsed.hostname, [destination]) === destination;
};

export const isBillableHallPassUse = (input: {
  pass: HallPassActivePass;
  focusedWindowId: number | null;
  activeTab: { tabId: number; windowId: number; url: string; active: boolean } | null;
  isTimeOut: boolean;
}): boolean => {
  if (!input.isTimeOut || !input.pass) {
    return false;
  }
  if (input.focusedWindowId === null || !input.activeTab?.active) {
    return false;
  }
  if (input.activeTab.windowId !== input.focusedWindowId) {
    return false;
  }
  return urlMatchesHallPassDestination(input.activeTab.url, input.pass.destination);
};

const accumulateActiveSeconds = (
  pass: HallPassActivePass,
  nowEpochMs: number
): HallPassActivePass => {
  const next = cloneHallPassActivePass(pass);
  if (!next.isMeteringActive || next.meterAnchorEpochMs === null) {
    return next;
  }
  const elapsedMs = Math.max(0, nowEpochMs - next.meterAnchorEpochMs);
  next.activeSecondsAccumulated += Math.floor(elapsedMs / 1000);
  next.meterAnchorEpochMs = nowEpochMs;
  return next;
};

const startMetering = (pass: HallPassActivePass, nowEpochMs: number): HallPassActivePass => {
  const next = cloneHallPassActivePass(pass);
  next.isMeteringActive = true;
  next.meterAnchorEpochMs = nowEpochMs;
  return next;
};

const pauseMetering = (pass: HallPassActivePass, nowEpochMs: number): HallPassActivePass => {
  const accumulated = accumulateActiveSeconds(pass, nowEpochMs);
  const next = cloneHallPassActivePass(accumulated);
  next.isMeteringActive = false;
  next.meterAnchorEpochMs = null;
  return next;
};

const collectCompletedMinuteDebits = (
  pass: HallPassActivePass,
  coinBalance: number
): { pass: HallPassActivePass; debits: HallPassMeterDebit[]; revoked: boolean } => {
  const debits: HallPassMeterDebit[] = [];
  const next = cloneHallPassActivePass(pass);
  let balance = coinBalance;

  while (next.activeSecondsAccumulated >= HALL_PASS_ACTIVE_MINUTE_SECONDS) {
    if (balance < HALL_PASS_RATE_COINS_PER_MINUTE) {
      return { pass: next, debits, revoked: true };
    }
    const minuteOrdinal = next.billedMinuteCount + 1;
    debits.push({
      transactionId: hallPassMinuteDebitTransactionId(next.passId, minuteOrdinal),
      amount: HALL_PASS_RATE_COINS_PER_MINUTE,
      minuteOrdinal,
    });
    next.billedMinuteCount = minuteOrdinal;
    next.activeSecondsAccumulated -= HALL_PASS_ACTIVE_MINUTE_SECONDS;
    balance -= HALL_PASS_RATE_COINS_PER_MINUTE;
  }

  return { pass: next, debits, revoked: false };
};

export const decideMeterActivity = (
  current: HallPassValue,
  input: {
    nowEpochMs: number;
    coinBalance: number;
    focusedWindowId: number | null;
    activeTab: { tabId: number; windowId: number; url: string; active: boolean } | null;
    context: HallPassPhaseContext;
  }
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  if (!current.activePass) {
    return { ok: true, value: { kind: 'noop', value: cloneHallPassValue(current) } };
  }

  const entry = ensureEntryStillBlocked(current.activePass.destination, input.context);
  if (!entry.ok) {
    const revoked = decideRevokePass(current);
    return revoked;
  }

  let pass = current.activePass;
  const billable = isBillableHallPassUse({
    pass,
    focusedWindowId: input.focusedWindowId,
    activeTab: input.activeTab,
    isTimeOut: input.context.isTimeOut,
  });

  if (billable && !pass.isMeteringActive) {
    pass = startMetering(pass, input.nowEpochMs);
  } else if (!billable && pass.isMeteringActive) {
    pass = pauseMetering(pass, input.nowEpochMs);
  } else if (pass.isMeteringActive) {
    pass = accumulateActiveSeconds(pass, input.nowEpochMs);
  }

  const settled = collectCompletedMinuteDebits(pass, input.coinBalance);
  const value = cloneHallPassValue(current);
  if (settled.revoked) {
    value.activePass = null;
    return {
      ok: true,
      value: {
        kind: 'meter-updated',
        value,
        debits: settled.debits,
        revoked: true,
      },
    };
  }
  value.activePass = settled.pass;
  return {
    ok: true,
    value: {
      kind: 'meter-updated',
      value,
      debits: settled.debits,
      revoked: false,
    },
  };
};

export const decideSettlePassAtBoundary = (
  current: HallPassValue,
  input: {
    nowEpochMs: number;
    coinBalance: number;
    context: HallPassPhaseContext;
    focusedWindowId: number | null;
    activeTab: { tabId: number; windowId: number; url: string; active: boolean } | null;
  }
): Result<HallPassDecisionOutcome, HallPassDecisionError> => {
  if (!current.activePass) {
    return { ok: true, value: { kind: 'noop', value: cloneHallPassValue(current) } };
  }

  const passId = current.activePass.passId;
  const metered = decideMeterActivity(current, input);
  if (!metered.ok) {
    return metered;
  }

  const debits = metered.value.kind === 'meter-updated' ? [...metered.value.debits] : [];
  let working = metered.value.value;

  if (working.activePass) {
    const paused = pauseMetering(working.activePass, input.nowEpochMs);
    const settled = collectCompletedMinuteDebits(paused, input.coinBalance - debits.length);
    debits.push(...settled.debits);
    working = cloneHallPassValue(working);
    if (settled.revoked) {
      working.activePass = null;
      return {
        ok: true,
        value: { kind: 'meter-updated', value: working, debits, revoked: true },
      };
    }
  }

  const revoked = decideRevokePass(working);
  if (!revoked.ok) {
    return revoked;
  }
  return {
    ok: true,
    value: {
      kind: 'pass-revoked',
      value: revoked.value.value,
      passId,
    },
  };
};

export const projectHallPassEntry = (value: HallPassValue): string | null =>
  value.activePass?.destination ?? null;
