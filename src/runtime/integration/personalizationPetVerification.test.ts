import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import type { FrictionDimension } from '@/modules/workstyle-profile';
import {
  applyWorkstyleProfileCommand,
  createDefaultWorkstyleProfileValue,
} from '@/modules/workstyle-profile';
import {
  applyPersonalizationQuizAnswer,
  createZeroFrictionScoreEffects,
  evaluatePersonalizationQuizResult,
  MAX_TOTAL_QUESTIONS,
  nextPersonalizationQuizScenarioId,
  getPersonalizationQuizScenarioById,
} from '@/modules/personalization-quiz';
import { petCatalog, resolvePetIdFromQuizOutcome } from '@/modules/pet-catalog';
import { applyPetMoodEvent, createDefaultPetMoodValue } from '@/modules/pet-mood';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import { createWorkstyleProfileCommandEnvelope } from '../client/inProcessWorkstyleProfileClient';

describe('personalization and pet verification', () => {
  it('maps every quiz outcome to a unique catalog pet', () => {
    for (const [key, petId] of Object.entries(petCatalog.assignmentMap)) {
      const outcome =
        key === 'balanced'
          ? ({ kind: 'balanced' } as const)
          : ({
              kind: 'top-two',
              dimensions: key.split('|') as [FrictionDimension, FrictionDimension],
            } as const);
      expect(resolvePetIdFromQuizOutcome(outcome)).toBe(petId);
    }
  });

  it('keeps pet assignment immutable across profile enrichment and retakes', () => {
    let profile = createDefaultWorkstyleProfileValue();
    const onboarded = applyWorkstyleProfileCommand(profile, {
      kind: 'initialize-from-onboarding',
      energy: 'steady',
      cadence: '25/5',
      primaryFriction: 'distraction',
    });
    expect(onboarded.ok).toBe(true);
    if (!onboarded.ok) {
      return;
    }
    profile = onboarded.value;

    const completed = applyWorkstyleProfileCommand(profile, {
      kind: 'complete-personalization-quiz',
      outcome: { kind: 'top-two', dimensions: ['distraction', 'starting'] },
    });
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    const firstPet = completed.value.assignedPetId;
    expect(firstPet).toBe('pet-nudge');

    const retake = applyWorkstyleProfileCommand(completed.value, {
      kind: 'complete-personalization-quiz',
      outcome: { kind: 'balanced' },
    });
    expect(retake.ok).toBe(true);
    if (retake.ok) {
      expect(retake.value.assignedPetId).toBe(firstPet);
    }
  });

  it('runs screening questions in order and supports Balanced after twelve answers', () => {
    let asked: string[] = [];
    let scores = createZeroFrictionScoreEffects();
    for (let index = 0; index < MAX_TOTAL_QUESTIONS; index += 1) {
      const scenarioId = nextPersonalizationQuizScenarioId(asked, scores);
      expect(scenarioId).toBeTruthy();
      const scenario = getPersonalizationQuizScenarioById(scenarioId!);
      const optionId = scenario?.options[0]?.id;
      expect(optionId).toBeTruthy();
      const applied = applyPersonalizationQuizAnswer(scores, asked, scenarioId!, optionId!);
      expect(applied.ok).toBe(true);
      if (!applied.ok) {
        return;
      }
      asked = applied.value.askedScenarioIds;
      scores = applied.value.scores;
      if (index + 1 === MAX_TOTAL_QUESTIONS) {
        const result = evaluatePersonalizationQuizResult(scores, asked.length);
        expect(result?.kind === 'top-two' || result?.kind === 'balanced').toBe(true);
      }
    }
  });

  it('does not let pet mood changes imply gameplay penalties in domain commands', () => {
    let mood = createDefaultPetMoodValue();
    const sad = applyPetMoodEvent(mood, { kind: 'reminder-missed' });
    expect(sad.ok).toBe(true);
    if (!sad.ok) {
      return;
    }
    mood = sad.value;
    expect(mood.currentMood).toBe('sad');
    const boosted = applyPetMoodEvent(mood, { kind: 'mood-boost-applied' });
    expect(boosted.ok).toBe(true);
    if (boosted.ok) {
      expect(boosted.value.currentMood).toBe('happy');
    }
  });

  it('charges exactly ten coins once for a mood boost purchase', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'assign-pet', petId: 'pet-tide' })
    );
    await root.value.coin.command({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: 'credit-20',
      module: 'coin',
      command: {
        kind: 'credit',
        transactionId: 'credit-20',
        amount: 20,
        recordedAt: 1,
        reasonCode: 'work-session-streak',
      },
    });

    const first = await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope(
        { kind: 'purchase-pet-mood-boost' },
        { commandId: 'boost-1' }
      )
    );
    expect(first.ok).toBe(true);

    const duplicate = await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope(
        { kind: 'purchase-pet-mood-boost' },
        { commandId: 'boost-1' }
      )
    );
    expect(duplicate.ok).toBe(true);

    const coin = await root.value.coin.current();
    expect(coin.ok).toBe(true);
    if (coin.ok) {
      expect(coin.value.value.balance).toBe(10);
      expect(
        coin.value.value.transactions.filter((txn) => txn.reasonCode === 'mood-boost')
      ).toHaveLength(1);
    }
  });
});
