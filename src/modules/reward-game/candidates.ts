import { MAX_CANDIDATES } from './rewardGameDocument';

export const normalizeDestinations = (destinations: readonly string[]): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const entry of destinations) {
    const hostname = entry.trim().toLowerCase();
    if (!hostname || seen.has(hostname)) {
      continue;
    }
    seen.add(hostname);
    normalized.push(hostname);
  }
  return normalized;
};

export const selectCandidates = (
  destinations: readonly string[],
  randomValues: readonly number[]
): string[] => {
  const pool = normalizeDestinations(destinations);
  const count = Math.min(MAX_CANDIDATES, pool.length);
  const selected: string[] = [];
  const working = [...pool];

  for (let i = 0; i < count; i += 1) {
    if (working.length === 0) {
      break;
    }
    const draw = randomValues[i] ?? 0;
    const index = draw % working.length;
    selected.push(working.splice(index, 1)[0]);
  }

  return selected;
};

export const resolveDestination = (
  candidates: readonly string[],
  resolutionKind: 'choice' | 'timeout' | 'trigger',
  options: { choiceIndex?: number; randomValue: number }
): string | null => {
  if (candidates.length === 0) {
    return null;
  }
  if (resolutionKind === 'choice') {
    const index = options.choiceIndex ?? 0;
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length) {
      return null;
    }
    return candidates[index];
  }
  const index = options.randomValue % candidates.length;
  return candidates[index];
};
