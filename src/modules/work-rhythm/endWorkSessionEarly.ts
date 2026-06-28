import type { Result } from '@/modules/persisted-application-state/types';
import {
  coinsForExtensionFocusMinutes,
  coinsForStandardFocusMinutes,
} from '@/modules/coin/duration';
import type { WorkHistoryFact } from '@/modules/work-history';
import { createFocusBlockCompletedFact } from './focusBlockCompleted';
import {
  computeActualFocusSeconds,
  focusBlockCompletedFactId,
  workSessionCompletedFactId,
} from './settleFocusBoundary';
import { createWorkSessionCompletedFact } from './workSessionCompleted';
import type { WorkRhythmFocusBlock, WorkRhythmValue } from './workRhythmDocument';

export type EndWorkSessionEarlyError =
  | { kind: 'no-active-work-session' }
  | { kind: 'original-goal-already-complete' };

export interface EndWorkSessionEarlyOutcome {
  nextValue: { phase: 'inactive' };
  commandId: string;
  focusBlockFact?: WorkHistoryFact;
  workSessionCompletedFact?: WorkHistoryFact;
  coinCredit?: {
    transactionId: string;
    amount: number;
    reasonCode: 'standard-focus' | 'extension-focus';
    recordedAt: number;
    context: Record<string, string | number | boolean | null>;
  };
}

export const endWorkSessionEarlyCommandId = (sessionId: string): string =>
  `end-work-session-${sessionId}`;

export const endWorkSessionEarlyCoinTransactionId = (
  sessionId: string,
  focusBlockIndex: number
): string => `coin-${sessionId}-block-${focusBlockIndex}-early-end`;

export const decideEndWorkSessionEarly = (
  current: WorkRhythmValue,
  nowEpochMs: number
): Result<EndWorkSessionEarlyOutcome, EndWorkSessionEarlyError> => {
  if (current.phase === 'inactive') {
    return { ok: false, error: { kind: 'no-active-work-session' } };
  }

  if (current.phase === 'work-session-completed') {
    return {
      ok: true,
      value: {
        nextValue: { phase: 'inactive' },
        commandId: endWorkSessionEarlyCommandId(current.sessionId),
      },
    };
  }

  if (current.phase === 'recess-prompt') {
    if (current.originalGoalPermanentlyComplete) {
      return { ok: false, error: { kind: 'original-goal-already-complete' } };
    }
    const actualWorkedSeconds =
      current.originalGoalSeconds - current.settledRemainingWorkSessionSeconds;
    return {
      ok: true,
      value: {
        nextValue: { phase: 'inactive' },
        commandId: endWorkSessionEarlyCommandId(current.sessionId),
        workSessionCompletedFact: createWorkSessionCompletedFact({
          factId: workSessionCompletedFactId(current.sessionId),
          recordedAt: nowEpochMs,
          workSessionId: current.sessionId,
          originalGoalSeconds: current.originalGoalSeconds,
          actualWorkedSeconds,
          completedAt: nowEpochMs,
          originalGoalPermanentlyComplete: false,
        }),
      },
    };
  }

  if (current.phase === 'time-out') {
    const timeOut = current;
    const actualFocusSeconds = Math.max(
      0,
      timeOut.focusDurationSeconds - timeOut.settledRemainingFocusSeconds
    );
    const completedMinutes = actualFocusSeconds / 60;
    const coinAmount = timeOut.wasExtension
      ? coinsForExtensionFocusMinutes(completedMinutes)
      : coinsForStandardFocusMinutes(completedMinutes);
    const reasonCode: 'standard-focus' | 'extension-focus' = timeOut.wasExtension
      ? 'extension-focus'
      : 'standard-focus';
    const extensionWorkedSeconds = timeOut.isWorkSessionExtension
      ? timeOut.extensionTrancheSeconds - timeOut.settledRemainingWorkSessionSeconds
      : 0;
    const actualWorkedSeconds = timeOut.originalGoalPermanentlyComplete
      ? timeOut.originalGoalSeconds +
        timeOut.extensionBaselineCumulativeSeconds +
        extensionWorkedSeconds
      : timeOut.originalGoalSeconds - timeOut.settledRemainingWorkSessionSeconds;
    const sessionPermanentlyComplete = timeOut.originalGoalPermanentlyComplete;

    const focusBlockFact = createFocusBlockCompletedFact({
      factId: focusBlockCompletedFactId(
        timeOut.sessionId,
        timeOut.focusBlockIndex,
        timeOut.settlementSegment
      ),
      recordedAt: nowEpochMs,
      workSessionId: timeOut.sessionId,
      focusBlockIndex: timeOut.focusBlockIndex,
      plannedFocusMinutes: Math.floor(timeOut.focusDurationSeconds / 60),
      actualFocusSeconds,
      completedAt: nowEpochMs,
      energyAtStart: timeOut.energy,
      wasExtension: timeOut.wasExtension,
      completed: false,
    });

    const outcome: EndWorkSessionEarlyOutcome = {
      nextValue: { phase: 'inactive' },
      commandId: endWorkSessionEarlyCommandId(timeOut.sessionId),
      focusBlockFact,
    };

    if (!sessionPermanentlyComplete) {
      outcome.workSessionCompletedFact = createWorkSessionCompletedFact({
        factId: workSessionCompletedFactId(timeOut.sessionId),
        recordedAt: nowEpochMs,
        workSessionId: timeOut.sessionId,
        originalGoalSeconds: timeOut.originalGoalSeconds,
        actualWorkedSeconds,
        completedAt: nowEpochMs,
        originalGoalPermanentlyComplete: false,
      });
    }

    if (coinAmount > 0) {
      outcome.coinCredit = {
        transactionId: endWorkSessionEarlyCoinTransactionId(
          timeOut.sessionId,
          timeOut.focusBlockIndex
        ),
        amount: coinAmount,
        reasonCode,
        recordedAt: nowEpochMs,
        context: {
          workSessionId: timeOut.sessionId,
          focusBlockIndex: timeOut.focusBlockIndex,
          actualFocusSeconds,
          wasExtension: timeOut.wasExtension,
          endedEarly: true,
        },
      };
    }

    return { ok: true, value: outcome };
  }

  const focus = current as WorkRhythmFocusBlock;
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
  const extensionWorkedSeconds = focus.isWorkSessionExtension
    ? focus.extensionTrancheSeconds - settledRemainingWorkSessionSeconds
    : 0;
  const actualWorkedSeconds = focus.originalGoalPermanentlyComplete
    ? focus.originalGoalSeconds + focus.extensionBaselineCumulativeSeconds + extensionWorkedSeconds
    : focus.originalGoalSeconds - settledRemainingWorkSessionSeconds;
  const sessionPermanentlyComplete = focus.originalGoalPermanentlyComplete;

  const focusBlockFact = createFocusBlockCompletedFact({
    factId: focusBlockCompletedFactId(
      focus.sessionId,
      focus.focusBlockIndex,
      focus.settlementSegment
    ),
    recordedAt: nowEpochMs,
    workSessionId: focus.sessionId,
    focusBlockIndex: focus.focusBlockIndex,
    plannedFocusMinutes: Math.floor(focus.focusDurationSeconds / 60),
    actualFocusSeconds,
    completedAt: nowEpochMs,
    energyAtStart: focus.energy,
    wasExtension: focus.wasExtension,
    completed: false,
  });

  const outcome: EndWorkSessionEarlyOutcome = {
    nextValue: { phase: 'inactive' },
    commandId: endWorkSessionEarlyCommandId(focus.sessionId),
    focusBlockFact,
  };

  if (!sessionPermanentlyComplete) {
    outcome.workSessionCompletedFact = createWorkSessionCompletedFact({
      factId: workSessionCompletedFactId(focus.sessionId),
      recordedAt: nowEpochMs,
      workSessionId: focus.sessionId,
      originalGoalSeconds: focus.originalGoalSeconds,
      actualWorkedSeconds,
      completedAt: nowEpochMs,
      originalGoalPermanentlyComplete: false,
    });
  }

  if (coinAmount > 0) {
    outcome.coinCredit = {
      transactionId: endWorkSessionEarlyCoinTransactionId(focus.sessionId, focus.focusBlockIndex),
      amount: coinAmount,
      reasonCode,
      recordedAt: nowEpochMs,
      context: {
        workSessionId: focus.sessionId,
        focusBlockIndex: focus.focusBlockIndex,
        actualFocusSeconds,
        wasExtension: focus.wasExtension,
        endedEarly: true,
      },
    };
  }

  return { ok: true, value: outcome };
};
