import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import type { CodecError } from '@/modules/persisted-application-state/types';
import { ENERGY_LEVELS, MOMENTUM_LEVELS } from '@/modules/workstyle-profile';
import type { SchedulerReasonCode } from '@/modules/scheduler';
import {
  cloneWorkRhythmValue,
  createDefaultWorkRhythmValue,
  type WorkRhythmFocusBlock,
  type WorkRhythmRecessPrompt,
  type WorkRhythmRewardGame,
  type WorkRhythmRecess,
  type WorkRhythmBackToWorkCountdown,
  type WorkRhythmTimeOut,
  type WorkRhythmValue,
  type WorkRhythmWorkSessionCompleted,
} from './workRhythmDocument';

export const WORK_RHYTHM_SCHEMA_VERSION = 1;

const SCHEDULER_REASON_CODES = [
  'base-cadence',
  'energy-low',
  'energy-high',
  'momentum-low',
  'momentum-building',
  'momentum-flowing',
  'two-thirds-progress',
  'focus-clamp-min',
  'focus-clamp-max',
  'recess-clamp-min',
  'recess-clamp-max',
  'task-cap',
  'final-focus-budget',
  'final-focus-exact',
  'post-game-recess-exact',
] as const satisfies readonly SchedulerReasonCode[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

const parseSchedulerReason = (
  value: unknown
): Result<WorkRhythmFocusBlock['schedulerReasons'][number], string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'scheduler reason must be an object' };
  }
  if (typeof value.code !== 'string' || !includes(SCHEDULER_REASON_CODES, value.code)) {
    return { ok: false, error: 'scheduler reason code is invalid' };
  }
  if (typeof value.focusDeltaMinutes !== 'number' || !Number.isFinite(value.focusDeltaMinutes)) {
    return { ok: false, error: 'focusDeltaMinutes must be a number' };
  }
  if (typeof value.recessDeltaMinutes !== 'number' || !Number.isFinite(value.recessDeltaMinutes)) {
    return { ok: false, error: 'recessDeltaMinutes must be a number' };
  }
  return {
    ok: true,
    value: {
      code: value.code,
      focusDeltaMinutes: value.focusDeltaMinutes,
      recessDeltaMinutes: value.recessDeltaMinutes,
    },
  };
};

const parseBooleanField = (
  value: unknown,
  field: string,
  defaultValue: boolean
): Result<boolean, string> => {
  if (value === undefined) {
    return { ok: true, value: defaultValue };
  }
  if (typeof value !== 'boolean') {
    return { ok: false, error: `${field} must be a boolean` };
  }
  return { ok: true, value };
};

const parseNumberField = (
  value: unknown,
  field: string,
  defaultValue: number
): Result<number, string> => {
  if (value === undefined) {
    return { ok: true, value: defaultValue };
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: `${field} must be a finite number` };
  }
  return { ok: true, value };
};

const parseFocusBlock = (value: unknown): Result<WorkRhythmFocusBlock, string> => {
  if (!isRecord(value) || value.phase !== 'focus-block') {
    return { ok: false, error: 'focus block value must have phase focus-block' };
  }
  const stringFields = ['sessionId'] as const;
  for (const field of stringFields) {
    if (typeof value[field] !== 'string' || value[field].length === 0) {
      return { ok: false, error: `${field} must be a non-empty string` };
    }
  }
  const numberFields = [
    'originalGoalSeconds',
    'sessionStartedAtEpochMs',
    'remainingWorkSessionSeconds',
    'settledRemainingWorkSessionSeconds',
    'focusBlockIndex',
    'focusBlockStartedAtEpochMs',
    'focusDeadlineAtEpochMs',
    'focusDurationSeconds',
    'focusBlockStreak',
    'settlementSegment',
  ] as const;
  for (const field of numberFields) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field])) {
      return { ok: false, error: `${field} must be a finite number` };
    }
  }
  if (typeof value.energy !== 'string' || !includes(ENERGY_LEVELS, value.energy)) {
    return { ok: false, error: 'energy must be low, steady, or high' };
  }
  if (typeof value.momentum !== 'string' || !includes(MOMENTUM_LEVELS, value.momentum)) {
    return { ok: false, error: 'momentum must be a valid momentum level' };
  }
  if (typeof value.isFinalFocus !== 'boolean') {
    return { ok: false, error: 'isFinalFocus must be a boolean' };
  }
  if (typeof value.wasExtension !== 'boolean') {
    return { ok: false, error: 'wasExtension must be a boolean' };
  }
  if (!Array.isArray(value.schedulerReasons)) {
    return { ok: false, error: 'schedulerReasons must be an array' };
  }
  const schedulerReasons: WorkRhythmFocusBlock['schedulerReasons'] = [];
  for (const reason of value.schedulerReasons) {
    const parsed = parseSchedulerReason(reason);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    schedulerReasons.push(parsed.value);
  }
  const originalGoalPermanentlyComplete = parseBooleanField(
    value.originalGoalPermanentlyComplete,
    'originalGoalPermanentlyComplete',
    false
  );
  if (!originalGoalPermanentlyComplete.ok) {
    return { ok: false, error: originalGoalPermanentlyComplete.error };
  }
  const isWorkSessionExtension = parseBooleanField(
    value.isWorkSessionExtension,
    'isWorkSessionExtension',
    false
  );
  if (!isWorkSessionExtension.ok) {
    return { ok: false, error: isWorkSessionExtension.error };
  }
  const extensionTrancheSeconds = parseNumberField(
    value.extensionTrancheSeconds,
    'extensionTrancheSeconds',
    0
  );
  if (!extensionTrancheSeconds.ok) {
    return { ok: false, error: extensionTrancheSeconds.error };
  }
  const extensionBaselineCumulativeSeconds = parseNumberField(
    value.extensionBaselineCumulativeSeconds,
    'extensionBaselineCumulativeSeconds',
    0
  );
  if (!extensionBaselineCumulativeSeconds.ok) {
    return { ok: false, error: extensionBaselineCumulativeSeconds.error };
  }
  const extensionBaselineCount = parseNumberField(
    value.extensionBaselineCount,
    'extensionBaselineCount',
    0
  );
  if (!extensionBaselineCount.ok) {
    return { ok: false, error: extensionBaselineCount.error };
  }
  return {
    ok: true,
    value: {
      phase: 'focus-block',
      sessionId: value.sessionId as string,
      originalGoalSeconds: value.originalGoalSeconds as number,
      sessionStartedAtEpochMs: value.sessionStartedAtEpochMs as number,
      remainingWorkSessionSeconds: value.remainingWorkSessionSeconds as number,
      settledRemainingWorkSessionSeconds: value.settledRemainingWorkSessionSeconds as number,
      energy: value.energy as WorkRhythmFocusBlock['energy'],
      momentum: value.momentum as WorkRhythmFocusBlock['momentum'],
      focusBlockIndex: value.focusBlockIndex as number,
      focusBlockStartedAtEpochMs: value.focusBlockStartedAtEpochMs as number,
      focusDeadlineAtEpochMs: value.focusDeadlineAtEpochMs as number,
      focusDurationSeconds: value.focusDurationSeconds as number,
      isFinalFocus: value.isFinalFocus as boolean,
      wasExtension: value.wasExtension as boolean,
      schedulerReasons,
      focusBlockStreak: value.focusBlockStreak as number,
      settlementSegment: value.settlementSegment as number,
      originalGoalPermanentlyComplete: originalGoalPermanentlyComplete.value,
      isWorkSessionExtension: isWorkSessionExtension.value,
      extensionTrancheSeconds: extensionTrancheSeconds.value,
      extensionBaselineCumulativeSeconds: extensionBaselineCumulativeSeconds.value,
      extensionBaselineCount: extensionBaselineCount.value,
    },
  };
};

const parseRecessPrompt = (value: unknown): Result<WorkRhythmRecessPrompt, string> => {
  if (!isRecord(value) || value.phase !== 'recess-prompt') {
    return { ok: false, error: 'recess prompt value must have phase recess-prompt' };
  }
  if (typeof value.sessionId !== 'string' || value.sessionId.length === 0) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }
  const numberFields = [
    'originalGoalSeconds',
    'sessionStartedAtEpochMs',
    'settledRemainingWorkSessionSeconds',
    'focusBlockStreak',
    'completedFocusBlockIndex',
    'lastSettledSegment',
    'deferredRecessCount',
  ] as const;
  for (const field of numberFields) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field])) {
      return { ok: false, error: `${field} must be a finite number` };
    }
  }
  if (typeof value.energy !== 'string' || !includes(ENERGY_LEVELS, value.energy)) {
    return { ok: false, error: 'energy must be low, steady, or high' };
  }
  if (typeof value.momentum !== 'string' || !includes(MOMENTUM_LEVELS, value.momentum)) {
    return { ok: false, error: 'momentum must be a valid momentum level' };
  }
  if (typeof value.originalGoalPermanentlyComplete !== 'boolean') {
    return { ok: false, error: 'originalGoalPermanentlyComplete must be a boolean' };
  }
  const isWorkSessionExtension = parseBooleanField(
    value.isWorkSessionExtension,
    'isWorkSessionExtension',
    false
  );
  if (!isWorkSessionExtension.ok) {
    return { ok: false, error: isWorkSessionExtension.error };
  }
  const extensionTrancheSeconds = parseNumberField(
    value.extensionTrancheSeconds,
    'extensionTrancheSeconds',
    0
  );
  if (!extensionTrancheSeconds.ok) {
    return { ok: false, error: extensionTrancheSeconds.error };
  }
  const extensionBaselineCumulativeSeconds = parseNumberField(
    value.extensionBaselineCumulativeSeconds,
    'extensionBaselineCumulativeSeconds',
    0
  );
  if (!extensionBaselineCumulativeSeconds.ok) {
    return { ok: false, error: extensionBaselineCumulativeSeconds.error };
  }
  const extensionBaselineCount = parseNumberField(
    value.extensionBaselineCount,
    'extensionBaselineCount',
    0
  );
  if (!extensionBaselineCount.ok) {
    return { ok: false, error: extensionBaselineCount.error };
  }
  return {
    ok: true,
    value: {
      phase: 'recess-prompt',
      sessionId: value.sessionId as string,
      originalGoalSeconds: value.originalGoalSeconds as number,
      sessionStartedAtEpochMs: value.sessionStartedAtEpochMs as number,
      settledRemainingWorkSessionSeconds: value.settledRemainingWorkSessionSeconds as number,
      energy: value.energy as WorkRhythmRecessPrompt['energy'],
      momentum: value.momentum as WorkRhythmRecessPrompt['momentum'],
      focusBlockStreak: value.focusBlockStreak as number,
      completedFocusBlockIndex: value.completedFocusBlockIndex as number,
      lastSettledSegment: value.lastSettledSegment as number,
      deferredRecessCount: value.deferredRecessCount as number,
      originalGoalPermanentlyComplete: value.originalGoalPermanentlyComplete as boolean,
      isWorkSessionExtension: isWorkSessionExtension.value,
      extensionTrancheSeconds: extensionTrancheSeconds.value,
      extensionBaselineCumulativeSeconds: extensionBaselineCumulativeSeconds.value,
      extensionBaselineCount: extensionBaselineCount.value,
    },
  };
};

const parseTimeOut = (value: unknown): Result<WorkRhythmTimeOut, string> => {
  if (!isRecord(value) || value.phase !== 'time-out') {
    return { ok: false, error: 'time out value must have phase time-out' };
  }
  if (typeof value.sessionId !== 'string' || value.sessionId.length === 0) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }
  const numberFields = [
    'originalGoalSeconds',
    'settledRemainingWorkSessionSeconds',
    'settledRemainingFocusSeconds',
    'focusBlockIndex',
    'focusDurationSeconds',
    'focusBlockStreak',
    'settlementSegment',
    'timeOutStartedAtEpochMs',
    'lastReportedFiveMinuteBoundary',
  ] as const;
  for (const field of numberFields) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field])) {
      return { ok: false, error: `${field} must be a finite number` };
    }
  }
  if (typeof value.energy !== 'string' || !includes(ENERGY_LEVELS, value.energy)) {
    return { ok: false, error: 'energy must be low, steady, or high' };
  }
  if (typeof value.momentum !== 'string' || !includes(MOMENTUM_LEVELS, value.momentum)) {
    return { ok: false, error: 'momentum must be a valid momentum level' };
  }
  if (typeof value.isFinalFocus !== 'boolean') {
    return { ok: false, error: 'isFinalFocus must be a boolean' };
  }
  if (typeof value.wasExtension !== 'boolean') {
    return { ok: false, error: 'wasExtension must be a boolean' };
  }
  if (typeof value.momentumLoweredDuringTimeOut !== 'boolean') {
    return { ok: false, error: 'momentumLoweredDuringTimeOut must be a boolean' };
  }
  if (!Array.isArray(value.schedulerReasons)) {
    return { ok: false, error: 'schedulerReasons must be an array' };
  }
  const schedulerReasons: WorkRhythmTimeOut['schedulerReasons'] = [];
  for (const reason of value.schedulerReasons) {
    const parsed = parseSchedulerReason(reason);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    schedulerReasons.push(parsed.value);
  }
  const originalGoalPermanentlyComplete = parseBooleanField(
    value.originalGoalPermanentlyComplete,
    'originalGoalPermanentlyComplete',
    false
  );
  if (!originalGoalPermanentlyComplete.ok) {
    return { ok: false, error: originalGoalPermanentlyComplete.error };
  }
  const isWorkSessionExtension = parseBooleanField(
    value.isWorkSessionExtension,
    'isWorkSessionExtension',
    false
  );
  if (!isWorkSessionExtension.ok) {
    return { ok: false, error: isWorkSessionExtension.error };
  }
  const extensionTrancheSeconds = parseNumberField(
    value.extensionTrancheSeconds,
    'extensionTrancheSeconds',
    0
  );
  if (!extensionTrancheSeconds.ok) {
    return { ok: false, error: extensionTrancheSeconds.error };
  }
  const extensionBaselineCumulativeSeconds = parseNumberField(
    value.extensionBaselineCumulativeSeconds,
    'extensionBaselineCumulativeSeconds',
    0
  );
  if (!extensionBaselineCumulativeSeconds.ok) {
    return { ok: false, error: extensionBaselineCumulativeSeconds.error };
  }
  const extensionBaselineCount = parseNumberField(
    value.extensionBaselineCount,
    'extensionBaselineCount',
    0
  );
  if (!extensionBaselineCount.ok) {
    return { ok: false, error: extensionBaselineCount.error };
  }
  return {
    ok: true,
    value: {
      phase: 'time-out',
      sessionId: value.sessionId as string,
      originalGoalSeconds: value.originalGoalSeconds as number,
      settledRemainingWorkSessionSeconds: value.settledRemainingWorkSessionSeconds as number,
      settledRemainingFocusSeconds: value.settledRemainingFocusSeconds as number,
      energy: value.energy as WorkRhythmTimeOut['energy'],
      momentum: value.momentum as WorkRhythmTimeOut['momentum'],
      focusBlockIndex: value.focusBlockIndex as number,
      focusDurationSeconds: value.focusDurationSeconds as number,
      isFinalFocus: value.isFinalFocus as boolean,
      wasExtension: value.wasExtension as boolean,
      schedulerReasons,
      focusBlockStreak: value.focusBlockStreak as number,
      settlementSegment: value.settlementSegment as number,
      timeOutStartedAtEpochMs: value.timeOutStartedAtEpochMs as number,
      lastReportedFiveMinuteBoundary: value.lastReportedFiveMinuteBoundary as number,
      momentumLoweredDuringTimeOut: value.momentumLoweredDuringTimeOut as boolean,
      originalGoalPermanentlyComplete: originalGoalPermanentlyComplete.value,
      isWorkSessionExtension: isWorkSessionExtension.value,
      extensionTrancheSeconds: extensionTrancheSeconds.value,
      extensionBaselineCumulativeSeconds: extensionBaselineCumulativeSeconds.value,
      extensionBaselineCount: extensionBaselineCount.value,
    },
  };
};

const parseWorkSessionCompleted = (
  value: unknown
): Result<WorkRhythmWorkSessionCompleted, string> => {
  if (!isRecord(value) || value.phase !== 'work-session-completed') {
    return {
      ok: false,
      error: 'work session completed value must have phase work-session-completed',
    };
  }
  if (typeof value.sessionId !== 'string' || value.sessionId.length === 0) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }
  const numberFields = [
    'originalGoalSeconds',
    'cumulativeExtensionSeconds',
    'extensionCount',
    'focusBlockStreak',
    'lastCompletedFocusBlockIndex',
    'sessionCompletedAtEpochMs',
  ] as const;
  for (const field of numberFields) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field])) {
      return { ok: false, error: `${field} must be a finite number` };
    }
  }
  if (typeof value.energy !== 'string' || !includes(ENERGY_LEVELS, value.energy)) {
    return { ok: false, error: 'energy must be low, steady, or high' };
  }
  if (typeof value.momentum !== 'string' || !includes(MOMENTUM_LEVELS, value.momentum)) {
    return { ok: false, error: 'momentum must be a valid momentum level' };
  }
  if (value.originalGoalPermanentlyComplete !== true) {
    return { ok: false, error: 'originalGoalPermanentlyComplete must be true' };
  }
  return {
    ok: true,
    value: {
      phase: 'work-session-completed',
      sessionId: value.sessionId as string,
      originalGoalSeconds: value.originalGoalSeconds as number,
      cumulativeExtensionSeconds: value.cumulativeExtensionSeconds as number,
      extensionCount: value.extensionCount as number,
      energy: value.energy as WorkRhythmWorkSessionCompleted['energy'],
      momentum: value.momentum as WorkRhythmWorkSessionCompleted['momentum'],
      focusBlockStreak: value.focusBlockStreak as number,
      lastCompletedFocusBlockIndex: value.lastCompletedFocusBlockIndex as number,
      originalGoalPermanentlyComplete: true,
      sessionCompletedAtEpochMs: value.sessionCompletedAtEpochMs as number,
    },
  };
};

const parseSessionFields = (
  value: Record<string, unknown>
): Result<
  {
    sessionId: string;
    originalGoalSeconds: number;
    sessionStartedAtEpochMs: number;
    settledRemainingWorkSessionSeconds: number;
    energy: WorkRhythmFocusBlock['energy'];
    momentum: WorkRhythmFocusBlock['momentum'];
    focusBlockStreak: number;
  },
  string
> => {
  if (typeof value.sessionId !== 'string' || value.sessionId.length === 0) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }
  const numberFields = [
    'originalGoalSeconds',
    'sessionStartedAtEpochMs',
    'settledRemainingWorkSessionSeconds',
    'focusBlockStreak',
  ] as const;
  for (const field of numberFields) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field])) {
      return { ok: false, error: `${field} must be a finite number` };
    }
  }
  if (typeof value.energy !== 'string' || !includes(ENERGY_LEVELS, value.energy)) {
    return { ok: false, error: 'energy must be low, steady, or high' };
  }
  if (typeof value.momentum !== 'string' || !includes(MOMENTUM_LEVELS, value.momentum)) {
    return { ok: false, error: 'momentum must be a valid momentum level' };
  }
  return {
    ok: true,
    value: {
      sessionId: value.sessionId as string,
      originalGoalSeconds: value.originalGoalSeconds as number,
      sessionStartedAtEpochMs: value.sessionStartedAtEpochMs as number,
      settledRemainingWorkSessionSeconds: value.settledRemainingWorkSessionSeconds as number,
      energy: value.energy as WorkRhythmFocusBlock['energy'],
      momentum: value.momentum as WorkRhythmFocusBlock['momentum'],
      focusBlockStreak: value.focusBlockStreak as number,
    },
  };
};

const parseRewardGame = (value: unknown): Result<WorkRhythmRewardGame, string> => {
  if (!isRecord(value) || value.phase !== 'reward-game') {
    return { ok: false, error: 'reward game value must have phase reward-game' };
  }
  const session = parseSessionFields(value);
  if (!session.ok) {
    return session;
  }
  if (typeof value.completedFocusBlockIndex !== 'number') {
    return { ok: false, error: 'completedFocusBlockIndex must be a number' };
  }
  if (typeof value.roundId !== 'string' || value.roundId.length === 0) {
    return { ok: false, error: 'roundId must be a non-empty string' };
  }
  return {
    ok: true,
    value: {
      phase: 'reward-game',
      ...session.value,
      completedFocusBlockIndex: value.completedFocusBlockIndex as number,
      roundId: value.roundId as string,
    },
  };
};

const parseRecess = (value: unknown): Result<WorkRhythmRecess, string> => {
  if (!isRecord(value) || value.phase !== 'recess') {
    return { ok: false, error: 'recess value must have phase recess' };
  }
  const session = parseSessionFields(value);
  if (!session.ok) {
    return session;
  }
  if (typeof value.nextFocusBlockIndex !== 'number') {
    return { ok: false, error: 'nextFocusBlockIndex must be a number' };
  }
  if (
    value.recessPassDestination !== null &&
    (typeof value.recessPassDestination !== 'string' || value.recessPassDestination.length === 0)
  ) {
    return { ok: false, error: 'recessPassDestination must be null or a non-empty string' };
  }
  const epochFields = [
    'recessStartedAtEpochMs',
    'recessDeadlineAtEpochMs',
    'recessDurationSeconds',
  ] as const;
  for (const field of epochFields) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field])) {
      return { ok: false, error: `${field} must be a finite number` };
    }
  }
  if (!Array.isArray(value.schedulerReasons)) {
    return { ok: false, error: 'schedulerReasons must be an array' };
  }
  const schedulerReasons: WorkRhythmRecess['schedulerReasons'] = [];
  for (const reason of value.schedulerReasons) {
    const parsed = parseSchedulerReason(reason);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    schedulerReasons.push(parsed.value);
  }
  return {
    ok: true,
    value: {
      phase: 'recess',
      ...session.value,
      nextFocusBlockIndex: value.nextFocusBlockIndex as number,
      recessPassDestination: value.recessPassDestination as string | null,
      recessStartedAtEpochMs: value.recessStartedAtEpochMs as number,
      recessDeadlineAtEpochMs: value.recessDeadlineAtEpochMs as number,
      recessDurationSeconds: value.recessDurationSeconds as number,
      schedulerReasons,
    },
  };
};

const parseCountdown = (value: unknown): Result<WorkRhythmBackToWorkCountdown, string> => {
  if (!isRecord(value) || value.phase !== 'back-to-work-countdown') {
    return { ok: false, error: 'countdown value must have phase back-to-work-countdown' };
  }
  const session = parseSessionFields(value);
  if (!session.ok) {
    return session;
  }
  if (typeof value.nextFocusBlockIndex !== 'number') {
    return { ok: false, error: 'nextFocusBlockIndex must be a number' };
  }
  if (
    typeof value.countdownStartedAtEpochMs !== 'number' ||
    !Number.isFinite(value.countdownStartedAtEpochMs)
  ) {
    return { ok: false, error: 'countdownStartedAtEpochMs must be a finite number' };
  }
  if (
    typeof value.countdownDeadlineAtEpochMs !== 'number' ||
    !Number.isFinite(value.countdownDeadlineAtEpochMs)
  ) {
    return { ok: false, error: 'countdownDeadlineAtEpochMs must be a finite number' };
  }
  return {
    ok: true,
    value: {
      phase: 'back-to-work-countdown',
      ...session.value,
      nextFocusBlockIndex: value.nextFocusBlockIndex as number,
      countdownStartedAtEpochMs: value.countdownStartedAtEpochMs as number,
      countdownDeadlineAtEpochMs: value.countdownDeadlineAtEpochMs as number,
    },
  };
};

const parseWorkRhythmValue = (value: unknown): Result<WorkRhythmValue, string> => {
  if (!isRecord(value) || typeof value.phase !== 'string') {
    return { ok: false, error: 'work rhythm value must include phase' };
  }
  if (value.phase === 'inactive') {
    return { ok: true, value: { phase: 'inactive' } };
  }
  if (value.phase === 'focus-block') {
    return parseFocusBlock(value);
  }
  if (value.phase === 'recess-prompt') {
    return parseRecessPrompt(value);
  }
  if (value.phase === 'reward-game') {
    return parseRewardGame(value);
  }
  if (value.phase === 'recess') {
    return parseRecess(value);
  }
  if (value.phase === 'back-to-work-countdown') {
    return parseCountdown(value);
  }
  if (value.phase === 'time-out') {
    return parseTimeOut(value);
  }
  if (value.phase === 'work-session-completed') {
    return parseWorkSessionCompleted(value);
  }
  return {
    ok: false,
    error:
      'phase must be inactive, focus-block, recess-prompt, time-out, work-session-completed, reward-game, recess, or back-to-work-countdown',
  };
};

export const workRhythmCodec: DocumentCodec<WorkRhythmValue> = {
  schemaVersion: WORK_RHYTHM_SCHEMA_VERSION,

  createDefault(): VersionedDocument<WorkRhythmValue> {
    return {
      schemaVersion: WORK_RHYTHM_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultWorkRhythmValue(),
    };
  },

  encode(document: VersionedDocument<WorkRhythmValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: cloneWorkRhythmValue(document.value),
    };
  },

  decode(wire: unknown): Result<VersionedDocument<WorkRhythmValue>, CodecError> {
    if (!isRecord(wire)) {
      return {
        ok: false,
        error: { kind: 'invalid-document', message: 'work rhythm document must be an object' },
      };
    }
    if (wire.schemaVersion !== WORK_RHYTHM_SCHEMA_VERSION) {
      return {
        ok: false,
        error: {
          kind: 'unsupported-version',
          message: `unsupported work rhythm schema version ${String(wire.schemaVersion)}`,
        },
      };
    }
    if (
      typeof wire.revision !== 'number' ||
      !Number.isInteger(wire.revision) ||
      wire.revision < 0
    ) {
      return {
        ok: false,
        error: {
          kind: 'invalid-field',
          message: 'revision must be a non-negative integer',
          field: 'revision',
        },
      };
    }
    const value = parseWorkRhythmValue(wire.value);
    if (!value.ok) {
      return {
        ok: false,
        error: { kind: 'invalid-field', message: value.error, field: 'value' },
      };
    }
    return {
      ok: true,
      value: {
        schemaVersion: WORK_RHYTHM_SCHEMA_VERSION,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
