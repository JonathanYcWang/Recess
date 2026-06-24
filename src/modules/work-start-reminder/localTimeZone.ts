import type { LocalClockTime } from './workStartReminderDocument';

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

export type LocalInstantResolution =
  | { kind: 'unique'; epochMs: number }
  | {
      kind: 'gap-advanced';
      epochMs: number;
      requested: LocalClockTime;
      resolved: LocalClockTime;
    }
  | { kind: 'repeat-first'; epochMs: number };

const readPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
  parts.find((part) => part.type === type)?.value ?? '';

export const getZonedParts = (epochMs: number, timeZoneId: string): ZonedDateParts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  });
  const parts = formatter.formatToParts(new Date(epochMs));
  const weekdayLabel = readPart(parts, 'weekday');
  return {
    year: Number(readPart(parts, 'year')),
    month: Number(readPart(parts, 'month')),
    day: Number(readPart(parts, 'day')),
    hour: Number(readPart(parts, 'hour')),
    minute: Number(readPart(parts, 'minute')),
    weekday: WEEKDAY_TO_INDEX[weekdayLabel] ?? 0,
  };
};

export const getTimeZoneOffsetMs = (epochMs: number, timeZoneId: string): number => {
  const parts = getZonedParts(epochMs, timeZoneId);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
  return asUtc - epochMs;
};

export const zonedTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZoneId: string
): number => {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = getTimeZoneOffsetMs(utc, timeZoneId);
    const adjusted = Date.UTC(year, month - 1, day, hour, minute, second) - offset;
    if (adjusted === utc) {
      return utc;
    }
    utc = adjusted;
  }
  return utc;
};

const matchesLocalDateTime = (
  epochMs: number,
  timeZoneId: string,
  year: number,
  month: number,
  day: number,
  localTime: LocalClockTime
): boolean => {
  const parts = getZonedParts(epochMs, timeZoneId);
  return (
    parts.year === year &&
    parts.month === month &&
    parts.day === day &&
    parts.hour === localTime.hour &&
    parts.minute === localTime.minute
  );
};

const collectMatchingInstants = (
  year: number,
  month: number,
  day: number,
  localTime: LocalClockTime,
  timeZoneId: string
): number[] => {
  const noon = zonedTimeToUtc(year, month, day, 12, 0, 0, timeZoneId);
  const matches: number[] = [];
  for (let offsetMin = -12 * 60; offsetMin <= 12 * 60; offsetMin += 1) {
    const probe = noon + offsetMin * 60_000;
    if (matchesLocalDateTime(probe, timeZoneId, year, month, day, localTime)) {
      matches.push(probe);
    }
  }
  return matches;
};

export const resolveLocalWallTimeOnDate = (
  year: number,
  month: number,
  day: number,
  localTime: LocalClockTime,
  timeZoneId: string
): LocalInstantResolution | null => {
  const matches = collectMatchingInstants(year, month, day, localTime, timeZoneId);
  if (matches.length > 1) {
    return { kind: 'repeat-first', epochMs: Math.min(...matches) };
  }
  if (matches.length === 1) {
    return { kind: 'unique', epochMs: matches[0] };
  }

  const startMinute = localTime.hour * 60 + localTime.minute;
  for (let minute = startMinute + 1; minute < 24 * 60; minute += 1) {
    const hour = Math.floor(minute / 60);
    const minutePart = minute % 60;
    const gapMatches = collectMatchingInstants(
      year,
      month,
      day,
      { hour, minute: minutePart },
      timeZoneId
    );
    if (gapMatches.length > 0) {
      return {
        kind: 'gap-advanced',
        epochMs: Math.min(...gapMatches),
        requested: localTime,
        resolved: { hour, minute: minutePart },
      };
    }
  }

  return null;
};

export const addCalendarDays = (
  year: number,
  month: number,
  day: number,
  count: number
): { year: number; month: number; day: number } => {
  const civil = new Date(Date.UTC(year, month - 1, day));
  civil.setUTCDate(civil.getUTCDate() + count);
  return {
    year: civil.getUTCFullYear(),
    month: civil.getUTCMonth() + 1,
    day: civil.getUTCDate(),
  };
};

export const weekdayInTimeZone = (
  year: number,
  month: number,
  day: number,
  timeZoneId: string
): number =>
  getZonedParts(zonedTimeToUtc(year, month, day, 12, 0, 0, timeZoneId), timeZoneId).weekday;
