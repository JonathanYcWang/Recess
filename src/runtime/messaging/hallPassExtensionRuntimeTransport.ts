import {
  HALL_PASS_RUNTIME_CHANNEL,
  HALL_PASS_RUNTIME_PORT_NAME,
  type HallPassRuntimeMessageResponse,
  type HallPassRuntimeMessageTransport,
  type HallPassRuntimePortMessage,
  type HallPassRuntimeRequest,
} from './hallPassMessages';
import type { ExtensionRuntimeApi } from './extensionRuntimeApi';
import {
  createExtensionRuntimeTransport,
  createSafariCompatibleRuntimeTransport,
} from './extensionRuntimeTransport';

const hallPassRuntimeTransportConfig = {
  channel: HALL_PASS_RUNTIME_CHANNEL,
  portName: HALL_PASS_RUNTIME_PORT_NAME,
};

export const createHallPassExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): HallPassRuntimeMessageTransport =>
  createExtensionRuntimeTransport<
    HallPassRuntimeRequest,
    HallPassRuntimeMessageResponse,
    HallPassRuntimePortMessage
  >(runtime, hallPassRuntimeTransportConfig);

export const createHallPassSafariCompatibleRuntimeTransport =
  (): HallPassRuntimeMessageTransport | null =>
    createSafariCompatibleRuntimeTransport<
      HallPassRuntimeRequest,
      HallPassRuntimeMessageResponse,
      HallPassRuntimePortMessage
    >(hallPassRuntimeTransportConfig);
