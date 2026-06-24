import { createAction } from '@reduxjs/toolkit';
import type { WorkRhythmSnapshot } from '@/modules/work-rhythm';
import type { WorkRhythmConnectionState } from '../reducers/workRhythmProjectionReducer';

export const setWorkRhythmProjection = createAction<{
  revision: number;
  snapshot: WorkRhythmSnapshot;
}>('workRhythmProjection/set');

export const setWorkRhythmConnectionState = createAction<WorkRhythmConnectionState>(
  'workRhythmProjection/setConnectionState'
);
