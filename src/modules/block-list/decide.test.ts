import { describe, expect, it } from 'vitest';
import type { AccessContext } from './accessContext';
import { decideAccess } from './decide';
import type { Destination } from './destination';

const website = (hostname: string): Destination => ({
  kind: 'website',
  url: `https://${hostname}/`,
  hostname,
});

const baseContext = (overrides: Partial<AccessContext> = {}): AccessContext => ({
  phase: 'focus-block',
  blockListEntries: ['example.com'],
  recessPassEntry: null,
  hallPassEntry: null,
  ...overrides,
});

describe('decideAccess matrix', () => {
  const cases: Array<{
    name: string;
    destination: Destination;
    context: AccessContext;
    expected: ReturnType<typeof decideAccess>;
  }> = [
    {
      name: 'allows unrelated destinations',
      destination: website('other.com'),
      context: baseContext(),
      expected: { outcome: 'allow' },
    },
    {
      name: 'blocks matching destinations during focus',
      destination: website('www.example.com'),
      context: baseContext({ phase: 'focus-block' }),
      expected: { outcome: 'block' },
    },
    {
      name: 'blocks during reward game',
      destination: website('example.com'),
      context: baseContext({ phase: 'reward-game' }),
      expected: { outcome: 'block' },
    },
    {
      name: 'blocks during back to work countdown',
      destination: website('example.com'),
      context: baseContext({ phase: 'back-to-work-countdown' }),
      expected: { outcome: 'block' },
    },
    {
      name: 'blocks during time out without hall pass',
      destination: website('example.com'),
      context: baseContext({ phase: 'time-out' }),
      expected: { outcome: 'block' },
    },
    {
      name: 'allows recess pass destination during recess',
      destination: website('example.com'),
      context: baseContext({
        phase: 'recess',
        recessPassEntry: 'example.com',
      }),
      expected: { outcome: 'allow' },
    },
    {
      name: 'blocks non-pass destinations during recess',
      destination: website('example.com'),
      context: baseContext({ phase: 'recess', recessPassEntry: 'other.com' }),
      expected: { outcome: 'block' },
    },
    {
      name: 'allows hall pass destination during time out',
      destination: website('example.com'),
      context: baseContext({
        phase: 'time-out',
        hallPassEntry: 'example.com',
      }),
      expected: { outcome: 'allow' },
    },
    {
      name: 'allows before work',
      destination: website('example.com'),
      context: baseContext({ phase: 'before-work' }),
      expected: { outcome: 'allow' },
    },
    {
      name: 'allows after work session ended',
      destination: website('example.com'),
      context: baseContext({ phase: 'work-session-ended' }),
      expected: { outcome: 'allow' },
    },
    {
      name: 'excludes private browsing',
      destination: { kind: 'private-browsing' },
      context: baseContext(),
      expected: { outcome: 'excluded', reason: 'private-browsing' },
    },
    {
      name: 'excludes internal destinations',
      destination: { kind: 'internal' },
      context: baseContext(),
      expected: { outcome: 'excluded', reason: 'internal' },
    },
    {
      name: 'returns unsupported for native-like destinations',
      destination: { kind: 'unsupported', reason: 'native-app' },
      context: baseContext(),
      expected: { outcome: 'unsupported', reason: 'native-app' },
    },
  ];

  it.each(cases)('$name', ({ destination, context, expected }) => {
    expect(decideAccess(destination, context)).toEqual(expected);
  });
});
