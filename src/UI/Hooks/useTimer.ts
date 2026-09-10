import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { sendAppAction } from '../../Shared/ActionBrokers/ActionBroker';
import {
  APP_ACTION,
  NOTIFY_TIME_LEFT_SECONDS,
  SCHEDULER_PHASE,
} from '../../Shared/Constants/Constants';
import type { SchedulerPhase, SchedulerState } from '../../Shared/Types/AppState';
import type { RootState } from '../Redux/store';
// TODO(arch): UI must not import /Background — move computeFocusBlockDuration to /Shared (or expose via selectors only).
import { computeFocusBlockDuration } from '../../Background/Services/Scheduler/SchedulerService';
// TODO(arch): UI must not import /Background — route notifications through ActionBroker / background instead of NotificationAdapter.
import {
  notifyFocusEnding,
  notifyFocusComplete,
  notifyBreakEnding,
  notifyBreakComplete,
} from '../../Background/Adapters/Notification/NotificationAdapter';
import { selectScheduler } from '../Redux/Selectors/Scheduler/schedulerSelectors';

const TICK_MS = 1000;
const ENDING_SOON_MINUTES = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);

const TIMED_PHASES = new Set<SchedulerPhase>([SCHEDULER_PHASE.FOCUS_BLOCK, SCHEDULER_PHASE.RECESS]);
const TICKING_PHASES = new Set<SchedulerPhase>([
  SCHEDULER_PHASE.FOCUS_BLOCK,
  SCHEDULER_PHASE.RECESS,
  SCHEDULER_PHASE.PAUSE,
]);

const phaseDuration = (scheduler: SchedulerState): number =>
  scheduler.activePhase === null ? computeFocusBlockDuration(scheduler) : scheduler.phaseRemaining;

const elapsedSecondsInPhase = (scheduler: SchedulerState, now: number): number => {
  if (scheduler.phaseStart === null) {
    return 0;
  }

  return Math.max(0, Math.floor((now - new Date(scheduler.phaseStart).getTime()) / 1000));
};

const phaseRemainingFromState = (scheduler: SchedulerState, now: number): number => {
  if (scheduler.activePhase === SCHEDULER_PHASE.PAUSE) {
    return scheduler.phaseRemaining;
  }

  return Math.max(0, scheduler.phaseRemaining - elapsedSecondsInPhase(scheduler, now));
};

const workSessionRemaining = (scheduler: SchedulerState, now: number): number => {
  if (
    scheduler.activePhase !== SCHEDULER_PHASE.FOCUS_BLOCK &&
    scheduler.activePhase !== SCHEDULER_PHASE.RECESS
  ) {
    return Math.max(0, scheduler.workSessionRemaining);
  }

  return Math.max(0, scheduler.workSessionRemaining - elapsedSecondsInPhase(scheduler, now));
};

const pauseElapsedSeconds = (scheduler: SchedulerState, now: number): number =>
  scheduler.activePhase === SCHEDULER_PHASE.PAUSE ? elapsedSecondsInPhase(scheduler, now) : 0;

const notifyEndingSoon = (phase: SchedulerPhase): void => {
  if (phase === SCHEDULER_PHASE.FOCUS_BLOCK) {
    notifyFocusEnding(ENDING_SOON_MINUTES);
    return;
  }

  if (phase === SCHEDULER_PHASE.RECESS) {
    notifyBreakEnding(ENDING_SOON_MINUTES);
  }
};

const handlePhaseEnd = (phase: SchedulerPhase): void => {
  if (phase === SCHEDULER_PHASE.FOCUS_BLOCK) {
    notifyFocusComplete();
    return;
  }

  if (phase === SCHEDULER_PHASE.RECESS) {
    notifyBreakComplete();
  }
};

/**
 * Custom hook that provides timer functionality to components.
 * Sends domain actions through ActionBroker; reads state from Redux selectors.
 */
export const useTimer = () => {
  const [now, setNow] = useState(() => Date.now());
  const endingSoonNotifiedRef = useRef(false);

  const scheduler = useSelector((state: RootState) => selectScheduler(state));
  const activePhase = scheduler.activePhase;
  const phaseRemaining = phaseRemainingFromState(scheduler, now);

  // React to derived remaining time: ending-soon notifications and phase expiry actions.
  useEffect(() => {
    if (activePhase === null || !TIMED_PHASES.has(activePhase)) {
      return;
    }

    if (phaseRemaining > NOTIFY_TIME_LEFT_SECONDS) {
      endingSoonNotifiedRef.current = false;
      return;
    }

    if (phaseRemaining > 0 && !endingSoonNotifiedRef.current) {
      endingSoonNotifiedRef.current = true;
      notifyEndingSoon(activePhase);
      return;
    }

    if (phaseRemaining === 0) {
      handlePhaseEnd(activePhase);
    }
  }, [phaseRemaining, activePhase]);

  useEffect(() => {
    if (activePhase === null || !TICKING_PHASES.has(activePhase)) {
      return;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [activePhase]);

  return {
    startWorkSession: () => sendAppAction({ type: APP_ACTION.START_WORK_SESSION }),
    endSessionEarly: () => sendAppAction({ type: APP_ACTION.END_WORK_SESSION_EARLY }),
    endWorkSession: () => sendAppAction({ type: APP_ACTION.END_WORK_SESSION_EARLY }),
    pause: () => sendAppAction({ type: APP_ACTION.PAUSE }),
    resume: () => sendAppAction({ type: APP_ACTION.RESUME }),
    scheduler,
    activePhase,
    phaseDuration: phaseDuration(scheduler),
    phaseRemaining,
    sessionRemaining: workSessionRemaining(scheduler, now),
    pauseElapsed: pauseElapsedSeconds(scheduler, now),
  };
};
