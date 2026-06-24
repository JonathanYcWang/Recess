import type { HallPassValue } from './hallPassDocument';
import { HALL_PASS_RATE_COINS_PER_MINUTE } from './hallPassDocument';

export type HallPassPendingSnapshot = {
  requestId: string;
  destination: string;
  rememberedUrl: string;
};

export type HallPassActiveSnapshot = {
  passId: string;
  destination: string;
  billedMinuteCount: number;
  activeSecondsAccumulated: number;
  isMeteringActive: boolean;
};

export type HallPassSnapshot = {
  pendingRequest: HallPassPendingSnapshot | null;
  activePass: HallPassActiveSnapshot | null;
  rateCoinsPerMinute: number;
  coinBalance: number;
};

export const projectHallPassSnapshot = (
  value: HallPassValue,
  coinBalance: number
): HallPassSnapshot => ({
  pendingRequest: value.pendingRequest
    ? {
        requestId: value.pendingRequest.requestId,
        destination: value.pendingRequest.destination,
        rememberedUrl: value.pendingRequest.rememberedUrl,
      }
    : null,
  activePass: value.activePass
    ? {
        passId: value.activePass.passId,
        destination: value.activePass.destination,
        billedMinuteCount: value.activePass.billedMinuteCount,
        activeSecondsAccumulated: value.activePass.activeSecondsAccumulated,
        isMeteringActive: value.activePass.isMeteringActive,
      }
    : null,
  rateCoinsPerMinute: HALL_PASS_RATE_COINS_PER_MINUTE,
  coinBalance,
});
