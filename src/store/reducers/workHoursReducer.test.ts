import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addWorkHoursEntry,
  deleteWorkHoursEntry,
  markWorkHoursLoaded,
  setWorkHours,
  toggleWorkHoursEntry,
  updateWorkHoursEntry,
} from '../actions/workHoursActions';
import workHoursReducer from './workHoursReducer';

const days = [true, false, true, false, true, false, false];

describe('workHoursReducer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with no entries and unloaded state', () => {
    expect(workHoursReducer(undefined, { type: 'test/init' })).toEqual({
      entries: [],
      isLoaded: false,
    });
  });

  it('sets persisted work hours and marks them loaded', () => {
    const state = workHoursReducer(
      undefined,
      setWorkHours([{ id: 'morning', time: '09:00', days, enabled: true }])
    );

    expect(state.entries).toEqual([{ id: 'morning', time: '09:00', days, enabled: true }]);
    expect(state.isLoaded).toBe(true);
  });

  it('adds entries with generated ids enabled by default', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345);

    const state = workHoursReducer(undefined, addWorkHoursEntry({ time: '10:30', days }));

    expect(state.entries).toEqual([{ id: '12345', time: '10:30', days, enabled: true }]);
  });

  it('updates, toggles, and deletes existing entries', () => {
    const loaded = workHoursReducer(
      undefined,
      setWorkHours([{ id: 'morning', time: '09:00', days, enabled: true }])
    );
    const updated = workHoursReducer(
      loaded,
      updateWorkHoursEntry({
        id: 'morning',
        time: '10:00',
        days: [false, true, false, true, false, true, false],
      })
    );
    const toggled = workHoursReducer(updated, toggleWorkHoursEntry('morning'));
    const deleted = workHoursReducer(toggled, deleteWorkHoursEntry('morning'));

    expect(updated.entries[0]).toMatchObject({ id: 'morning', time: '10:00', enabled: true });
    expect(toggled.entries[0].enabled).toBe(false);
    expect(deleted.entries).toEqual([]);
  });

  it('ignores updates and toggles for missing entries', () => {
    const loaded = workHoursReducer(
      undefined,
      setWorkHours([{ id: 'morning', time: '09:00', days, enabled: true }])
    );
    const updated = workHoursReducer(
      loaded,
      updateWorkHoursEntry({ id: 'missing', time: '10:00', days })
    );
    const toggled = workHoursReducer(updated, toggleWorkHoursEntry('missing'));

    expect(toggled).toEqual(loaded);
  });

  it('marks work hours loaded without changing entries', () => {
    const state = workHoursReducer(undefined, markWorkHoursLoaded());

    expect(state.entries).toEqual([]);
    expect(state.isLoaded).toBe(true);
  });
});
