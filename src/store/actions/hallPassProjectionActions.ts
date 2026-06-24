import { createAction } from '@reduxjs/toolkit';
import type { HallPassSnapshot } from '@/modules/hall-pass';

export const setHallPassProjection = createAction<{
  revision: number;
  snapshot: HallPassSnapshot;
  hallPassEntry: string | null;
}>('hallPassProjection/set');

export const setHallPassConnectionState = createAction<'connecting' | 'connected' | 'disconnected'>(
  'hallPassProjection/setConnectionState'
);
