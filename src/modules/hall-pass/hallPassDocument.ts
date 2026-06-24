export const HALL_PASS_RATE_COINS_PER_MINUTE = 1;
export const HALL_PASS_ACTIVE_MINUTE_SECONDS = 60;

export interface HallPassPendingRequest {
  requestId: string;
  destination: string;
  rememberedUrl: string;
  reportedAtEpochMs: number;
}

export interface HallPassActivePass {
  passId: string;
  destination: string;
  grantedAtEpochMs: number;
  activeSecondsAccumulated: number;
  billedMinuteCount: number;
  meterAnchorEpochMs: number | null;
  isMeteringActive: boolean;
}

export interface HallPassValue {
  pendingRequest: HallPassPendingRequest | null;
  activePass: HallPassActivePass | null;
}

export const createDefaultHallPassValue = (): HallPassValue => ({
  pendingRequest: null,
  activePass: null,
});

export const cloneHallPassPendingRequest = (
  request: HallPassPendingRequest
): HallPassPendingRequest => ({
  requestId: request.requestId,
  destination: request.destination,
  rememberedUrl: request.rememberedUrl,
  reportedAtEpochMs: request.reportedAtEpochMs,
});

export const cloneHallPassActivePass = (pass: HallPassActivePass): HallPassActivePass => ({
  passId: pass.passId,
  destination: pass.destination,
  grantedAtEpochMs: pass.grantedAtEpochMs,
  activeSecondsAccumulated: pass.activeSecondsAccumulated,
  billedMinuteCount: pass.billedMinuteCount,
  meterAnchorEpochMs: pass.meterAnchorEpochMs,
  isMeteringActive: pass.isMeteringActive,
});

export const cloneHallPassValue = (value: HallPassValue): HallPassValue => ({
  pendingRequest: value.pendingRequest ? cloneHallPassPendingRequest(value.pendingRequest) : null,
  activePass: value.activePass ? cloneHallPassActivePass(value.activePass) : null,
});

export const hallPassMinuteDebitTransactionId = (passId: string, minuteOrdinal: number): string =>
  `hall-pass-${passId}-minute-${minuteOrdinal}`;
