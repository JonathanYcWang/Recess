import { describe, expect, it } from 'vitest';
import { createReminderOccurrenceResolvedFact } from '@/modules/work-start-reminder/reminderOccurrenceResolved';
import { calculateReminderAdherence } from '@/modules/insights';

describe('reminder adherence projection', () => {
  it('calculates adherence from satisfied and missed occurrences', () => {
    const facts = [
      createReminderOccurrenceResolvedFact({
        factId: 'reminder-1',
        recordedAt: 1,
        logicalOutcomeId: 'o1',
        occurrenceIds: ['occ-1'],
        outcome: 'satisfied',
        resolvedAtEpochMs: 1,
      }),
      createReminderOccurrenceResolvedFact({
        factId: 'reminder-2',
        recordedAt: 2,
        logicalOutcomeId: 'o2',
        occurrenceIds: ['occ-2'],
        outcome: 'missed',
        resolvedAtEpochMs: 2,
      }),
    ];
    const result = calculateReminderAdherence(facts, 'all-time');
    expect(result.state).toBe('calculated');
    expect(result.value?.adherencePercent).toBe(50);
    expect(result.value?.occurrenceCount).toBe(2);
  });

  it('returns no relevant data without non-neutral occurrences', () => {
    const result = calculateReminderAdherence([], 'all-time');
    expect(result.state).toBe('no-relevant-data');
  });

  it('returns 100% for a single satisfied occurrence', () => {
    const facts = [
      createReminderOccurrenceResolvedFact({
        factId: 'reminder-1',
        recordedAt: 1,
        logicalOutcomeId: 'o1',
        occurrenceIds: ['occ-1'],
        outcome: 'satisfied',
        resolvedAtEpochMs: 1,
      }),
    ];
    const result = calculateReminderAdherence(facts, 'all-time');
    expect(result.value?.adherencePercent).toBe(100);
  });

  it('returns 0% for a single missed occurrence', () => {
    const facts = [
      createReminderOccurrenceResolvedFact({
        factId: 'reminder-1',
        recordedAt: 1,
        logicalOutcomeId: 'o1',
        occurrenceIds: ['occ-1'],
        outcome: 'missed',
        resolvedAtEpochMs: 1,
      }),
    ];
    const result = calculateReminderAdherence(facts, 'all-time');
    expect(result.value?.adherencePercent).toBe(0);
  });
});
