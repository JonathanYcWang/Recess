export type EffectIntentPhase = 'pending-execution' | 'pending-completion' | 'completed';

export interface EffectIntentFacts {
  [key: string]: string;
}

export interface EffectIntent {
  intentId: string;
  commandId: string;
  module: 'settings' | 'work-history';
  kind: string;
  facts: EffectIntentFacts;
}

export interface EffectIntentRecord extends EffectIntent {
  phase: EffectIntentPhase;
  outcomeRevision: number;
}

export type EffectAdapterResult = { ok: true } | { ok: false; error: string };

export interface EffectAdapter {
  readonly kind: string;
  execute(intent: EffectIntent): Promise<EffectAdapterResult>;
}

export type EffectExecutorHooks = {
  beforeExecute?: (record: EffectIntentRecord) => void | Promise<void>;
  afterExternalSuccess?: (record: EffectIntentRecord) => void | Promise<void>;
  beforeMarkComplete?: (record: EffectIntentRecord) => void | Promise<void>;
};
