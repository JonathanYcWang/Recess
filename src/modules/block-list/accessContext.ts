export type AccessPhase =
  | 'before-work'
  | 'focus-block'
  | 'reward-game'
  | 'back-to-work-countdown'
  | 'recess'
  | 'time-out'
  | 'work-session-ended';

export interface AccessContext {
  phase: AccessPhase;
  blockListEntries: readonly string[];
  recessPassEntry: string | null;
  hallPassEntry: string | null;
}

export type AccessDecision =
  | { outcome: 'allow' }
  | { outcome: 'block' }
  | { outcome: 'excluded'; reason: 'private-browsing' | 'internal' }
  | { outcome: 'unsupported'; reason: string };
