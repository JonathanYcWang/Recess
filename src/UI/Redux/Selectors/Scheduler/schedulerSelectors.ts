import { createDefaultSchedulerState } from '@/Background/Services/Scheduler/SchedulerService';
import type { SchedulerState } from '@/Shared/Types/AppState';
import type { RootState } from '../../store';

export const selectScheduler = (state: RootState): SchedulerState =>
  state.appState?.scheduler ?? createDefaultSchedulerState();
