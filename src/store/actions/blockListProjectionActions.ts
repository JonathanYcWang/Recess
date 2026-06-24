import { createAction } from '@reduxjs/toolkit';
import type { BlockListConnectionState } from '../reducers/blockListProjectionReducer';

export const setBlockListProjection = createAction<{
  revision: number;
  entries: string[];
}>('blockListProjection/setProjection');

export const setBlockListConnectionState = createAction<BlockListConnectionState>(
  'blockListProjection/setConnectionState'
);
