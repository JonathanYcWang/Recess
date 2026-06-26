import {
  WORK_RHYTHM_RUNTIME_CHANNEL,
  WORK_RHYTHM_RUNTIME_PORT_NAME,
  isWorkRhythmRuntimePortMessage,
  isWorkRhythmRuntimeRequest,
} from '../messaging/workRhythmMessages';
import { createRuntimeListener } from './createRuntimeListener';

const workRhythmListener = createRuntimeListener({
  channel: WORK_RHYTHM_RUNTIME_CHANNEL,
  portName: WORK_RHYTHM_RUNTIME_PORT_NAME,
  isRequest: isWorkRhythmRuntimeRequest,
  isPortMessage: isWorkRhythmRuntimePortMessage,
  buildHandler: (root) => root.workRhythmHandler,
});

export const registerWorkRhythmRuntimeListener = (
  options: Parameters<typeof workRhythmListener.register>[0]
): void => workRhythmListener.register(options);

export const resetWorkRhythmRuntimeListenerForTests = (): void =>
  workRhythmListener.resetForTests();
