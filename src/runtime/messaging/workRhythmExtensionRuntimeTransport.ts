import {
  WORK_RHYTHM_RUNTIME_CHANNEL,
  WORK_RHYTHM_RUNTIME_PORT_NAME,
  type WorkRhythmRuntimeMessageResponse,
  type WorkRhythmRuntimeMessageTransport,
  type WorkRhythmRuntimePortMessage,
  type WorkRhythmRuntimeRequest,
} from './workRhythmMessages';
import type { ExtensionRuntimeApi } from './extensionRuntimeApi';
import {
  createExtensionRuntimeTransport,
  createSafariCompatibleRuntimeTransport,
} from './extensionRuntimeTransport';

const workRhythmRuntimeTransportConfig = {
  channel: WORK_RHYTHM_RUNTIME_CHANNEL,
  portName: WORK_RHYTHM_RUNTIME_PORT_NAME,
};

export const createWorkRhythmExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): WorkRhythmRuntimeMessageTransport =>
  createExtensionRuntimeTransport<
    WorkRhythmRuntimeRequest,
    WorkRhythmRuntimeMessageResponse,
    WorkRhythmRuntimePortMessage
  >(runtime, workRhythmRuntimeTransportConfig);

export const createWorkRhythmSafariCompatibleRuntimeTransport =
  (): WorkRhythmRuntimeMessageTransport | null =>
    createSafariCompatibleRuntimeTransport<
      WorkRhythmRuntimeRequest,
      WorkRhythmRuntimeMessageResponse,
      WorkRhythmRuntimePortMessage
    >(workRhythmRuntimeTransportConfig);
