import { findMatchingBlockListEntry, parseDestination } from '@/modules/block-list';
import type { Result } from '@/modules/persisted-application-state';
import {
  cloneHallPassValue,
  HALL_PASS_RATE_COINS_PER_MINUTE,
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

export type HallPassDecisionOutcome =
  | { kind: 'pending-requested'; value: HallPassValue; request: HallPassPendingRequest }
  | { kind: 'pending-cancelled'; value: HallPassValue }
  | { kind: 'pass-granted'; value: HallPassValue; pass: HallPassActivePass }
  | { kind: 'pass-revoked'; value: HallPassValue; passId: string }
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

export const projectHallPassEntry = (value: HallPassValue): string | null =>
  value.activePass?.destination ?? null;
