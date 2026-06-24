import type { AccessContext, AccessDecision } from './accessContext';
import type { Destination } from './destination';
import { findMatchingBlockListEntry } from './match';

const ENFORCED_PHASES = new Set<AccessContext['phase']>([
  'focus-block',
  'reward-game',
  'back-to-work-countdown',
  'time-out',
  'recess',
]);

export const decideAccess = (destination: Destination, context: AccessContext): AccessDecision => {
  if (destination.kind === 'private-browsing') {
    return { outcome: 'excluded', reason: 'private-browsing' };
  }
  if (destination.kind === 'internal') {
    return { outcome: 'excluded', reason: 'internal' };
  }
  if (destination.kind === 'unsupported') {
    return { outcome: 'unsupported', reason: destination.reason };
  }

  const matchingEntry = findMatchingBlockListEntry(destination.hostname, context.blockListEntries);
  if (!matchingEntry) {
    return { outcome: 'allow' };
  }

  if (context.phase === 'before-work' || context.phase === 'work-session-ended') {
    return { outcome: 'allow' };
  }

  if (context.phase === 'recess' && context.recessPassEntry === matchingEntry) {
    return { outcome: 'allow' };
  }

  if (context.phase === 'time-out' && context.hallPassEntry === matchingEntry) {
    return { outcome: 'allow' };
  }

  if (ENFORCED_PHASES.has(context.phase)) {
    return { outcome: 'block' };
  }

  return { outcome: 'allow' };
};
