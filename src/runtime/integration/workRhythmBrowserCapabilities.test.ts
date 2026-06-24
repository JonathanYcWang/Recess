import { describe, expect, it } from 'vitest';
import { createChromiumWindDownNotificationAdapter } from '@/runtime/windDown/windDownNotificationAdapter';
import { createSafariCompatibleWindDownNotificationAdapter } from '@/runtime/windDown/windDownNotificationAdapter';
import { createInMemoryWindDownNotificationAdapter } from '@/runtime/windDown/windDownNotificationAdapter';
import { createChromiumWindDownSoundAdapter } from '@/runtime/windDown/windDownSoundAdapter';
import { createSafariCompatibleWindDownSoundAdapter } from '@/runtime/windDown/windDownSoundAdapter';
import {
  WIND_DOWN_NOTIFICATION_EFFECT_KIND,
  WIND_DOWN_SOUND_EFFECT_KIND,
} from '@/runtime/windDown/windDownEffectTypes';

describe('work rhythm browser capability adapters', () => {
  it('exposes notification and sound adapter kinds for chromium and safari-compatible runtimes', () => {
    const chromiumNotification = createChromiumWindDownNotificationAdapter();
    const safariNotification = createSafariCompatibleWindDownNotificationAdapter();
    const chromiumSound = createChromiumWindDownSoundAdapter();
    const safariSound = createSafariCompatibleWindDownSoundAdapter();

    expect(chromiumNotification.kind).toBe(WIND_DOWN_NOTIFICATION_EFFECT_KIND);
    expect(safariNotification.kind).toBe(WIND_DOWN_NOTIFICATION_EFFECT_KIND);
    expect(chromiumSound.kind).toBe(WIND_DOWN_SOUND_EFFECT_KIND);
    expect(safariSound.kind).toBe(WIND_DOWN_SOUND_EFFECT_KIND);
  });

  it('reports typed capability failures from the in-memory notification adapter', async () => {
    const adapter = createInMemoryWindDownNotificationAdapter({ capability: 'unsupported' });
    const result = await adapter.execute({
      intentId: 'effect-test',
      commandId: 'wind-down-test',
      module: 'wind-down',
      kind: adapter.kind,
      facts: { sessionId: 'ws-1', phaseKind: 'focus-block', remainingSeconds: '120' },
    });
    expect(result).toEqual({ ok: false, error: 'capability-unavailable' });
  });
});
