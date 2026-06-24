import type { Result } from '@/modules/persisted-application-state/types';
import {
  coinsForExtensionFocusMinutes,
  coinsForStandardFocusMinutes,
} from '@/modules/coin/duration';
import type { WorkHistoryFact } from '@/modules/work-history';
import { createFocusBlockCompletedFact } from './focusBlockCompleted';
import {
  focusBlockStreakCoinTransactionId,
  FOCUS_BLOCK_STREAK_MILESTONE_COINS,
  nextFocusBlockStreakAfterCompletion,
  shouldAwardFocusBlockStreakMilestone,
} from './focusBlockStreak';
import { createWorkSessionCompletedFact } from './workSessionCompleted';
import type {
  WorkRhythmFocusBlock,
  WorkRhythmRecessPrompt,
  WorkRhythmValue,
} from './workRhythmDocument';

export type FocusBoundarySettlementError =
  | { kind: 'invalid-phase-for-settlement' }
  | { kind: 'boundary-not-due' };

export interface FocusBoundarySettlement {
  nextValue: WorkRhythmValue;
  settlementCommandId: string;
  focusBlockFact: WorkHistoryFact;
  workSessionCompletedFact?: WorkHistoryFact;
  coinCredit: {
    transactionId: string;
    amount: number;
    reasonCode: 'standard-focus' | 'extension-focus';
    recordedAt: number;
    context: Record<string, string | number | boolean | null>;
  };
  streakCoinCredit?: {
    transactionId: string;
    amount: number;
    reasonCode: 'focus-block-streak';
    recordedAt: number;
    context: Record<string, string | number | boolean | null>;
  };
}

export const focusBoundarySettlementCommandId = (
  sessionId: string,
  focusBlockIndex: number
): string => `settle-${sessionId}-block-${focusBlockIndex}`;

export const focusBoundaryCoinTransactionId = (
  sessionId: string,
  focusBlockIndex: number
): string => `coin-${sessionId}-block-${focusBlockIndex}-focus`;

export const focusBlockCompletedFactId = (sessionId: string, focusBlockIndex: number): string =>
  `focus-block-${sessionId}-${focusBlockIndex}`;

export const workSessionCompletedFactId = (sessionId: string): string =>
  `work-session-completed-${sessionId}`;

export const workRhythmFocusAlarmName = (sessionId: string): string =>
  `work-rhythm-focus-${sessionId}`;

export const isFocusBoundaryDue = (focus: WorkRhythmFocusBlock, nowEpochMs: number): boolean =>
  nowEpochMs >= focus.focusDeadlineAtEpochMs;

export const computeActualFocusSeconds = (
  focus: WorkRhythmFocusBlock,
  nowEpochMs: number
): number => {
  const settledAt = Math.min(nowEpochMs, focus.focusDeadlineAtEpochMs);
  const elapsed = Math.max(0, Math.floor((settledAt - focus.focusBlockStartedAtEpochMs) / 1000));
  return Math.min(focus.focusDurationSeconds, elapsed);
};

const toRecessPrompt = (
  focus: WorkRhythmFocusBlock,
  settledRemainingWorkSessionSeconds: number,
  focusBlockStreak: number
): WorkRhythmRecessPrompt => ({
  phase: 'recess-prompt',
  sessionId: focus.sessionId,
  originalGoalSeconds: focus.originalGoalSeconds,
  sessionStartedAtEpochMs: focus.sessionStartedAtEpochMs,
  settledRemainingWorkSessionSeconds,
  energy: focus.energy,
  momentum: focus.momentum,
  focusBlockStreak,
  completedFocusBlockIndex: focus.focusBlockIndex,
  deferredRecessCount: 1,
  originalGoalPermanentlyComplete: false,
});

export const decideFocusBoundarySettlement = (
  focus: WorkRhythmFocusBlock,
  nowEpochMs: number
): Result<FocusBoundarySettlement, FocusBoundarySettlementError> => {
  if (focus.phase !== 'focus-block') {
    return { ok: false, error: { kind: 'invalid-phase-for-settlement' } };
  }
  if (!isFocusBoundaryDue(focus, nowEpochMs)) {
    return { ok: false, error: { kind: 'boundary-not-due' } };
  }

  const actualFocusSeconds = computeActualFocusSeconds(focus, nowEpochMs);
  const completedMinutes = actualFocusSeconds / 60;
  const coinAmount = focus.wasExtension
    ? coinsForExtensionFocusMinutes(completedMinutes)
    : coinsForStandardFocusMinutes(completedMinutes);
  const reasonCode: 'standard-focus' | 'extension-focus' = focus.wasExtension
    ? 'extension-focus'
    : 'standard-focus';
  const settledRemainingWorkSessionSeconds = Math.max(
    0,
    focus.settledRemainingWorkSessionSeconds - actualFocusSeconds
  );
  const settlementCommandId = focusBoundarySettlementCommandId(
    focus.sessionId,
    focus.focusBlockIndex
  );
  const focusBlockFact = createFocusBlockCompletedFact({
    factId: focusBlockCompletedFactId(focus.sessionId, focus.focusBlockIndex),
    recordedAt: nowEpochMs,
    workSessionId: focus.sessionId,
    focusBlockIndex: focus.focusBlockIndex,
    plannedFocusMinutes: Math.floor(focus.focusDurationSeconds / 60),
    actualFocusSeconds,
    completedAt: focus.focusDeadlineAtEpochMs,
    energyAtStart: focus.energy,
    wasExtension: focus.wasExtension,
  });

  const coinCredit = {
    transactionId: focusBoundaryCoinTransactionId(focus.sessionId, focus.focusBlockIndex),
    amount: coinAmount,
    reasonCode,
    recordedAt: nowEpochMs,
    context: {
      workSessionId: focus.sessionId,
      focusBlockIndex: focus.focusBlockIndex,
      actualFocusSeconds,
      wasExtension: focus.wasExtension,
    },
  };

  const nextFocusBlockStreak = nextFocusBlockStreakAfterCompletion(
    focus.focusBlockStreak,
    focus.wasExtension
  );
  const streakCoinCredit = shouldAwardFocusBlockStreakMilestone(nextFocusBlockStreak)
    ? {
        transactionId: focusBlockStreakCoinTransactionId(focus.sessionId, nextFocusBlockStreak),
        amount: FOCUS_BLOCK_STREAK_MILESTONE_COINS,
        reasonCode: 'focus-block-streak' as const,
        recordedAt: nowEpochMs,
        context: {
          workSessionId: focus.sessionId,
          focusBlockStreak: nextFocusBlockStreak,
          focusBlockIndex: focus.focusBlockIndex,
        },
      }
    : undefined;

  if (focus.isFinalFocus) {
    const actualWorkedSeconds = focus.originalGoalSeconds - settledRemainingWorkSessionSeconds;
    const workSessionCompletedFact = createWorkSessionCompletedFact({
      factId: workSessionCompletedFactId(focus.sessionId),
      recordedAt: nowEpochMs,
      workSessionId: focus.sessionId,
      originalGoalSeconds: focus.originalGoalSeconds,
      actualWorkedSeconds,
      completedAt: nowEpochMs,
      originalGoalPermanentlyComplete: true,
    });
    return {
      ok: true,
      value: {
        nextValue: { phase: 'inactive' },
        settlementCommandId,
        focusBlockFact,
        workSessionCompletedFact,
        coinCredit,
        streakCoinCredit,
      },
    };
  }

  return {
    ok: true,
    value: {
      nextValue: toRecessPrompt(focus, settledRemainingWorkSessionSeconds, nextFocusBlockStreak),
      settlementCommandId,
      focusBlockFact,
      coinCredit,
      streakCoinCredit,
    },
  };
};
