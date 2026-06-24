import type { LocalClockTime } from './workStartReminderDocument';

export type LocalTimeParseError = { kind: 'invalid-format' };

const isValidLocalClockTime = (time: LocalClockTime): boolean =>
  Number.isInteger(time.hour) &&
  time.hour >= 0 &&
  time.hour <= 23 &&
  Number.isInteger(time.minute) &&
  time.minute >= 0 &&
  time.minute <= 59;

export const parseDisplayTimeString = (
  timeStr: string
): { ok: true; value: LocalClockTime } | { ok: false; error: LocalTimeParseError } => {
  if (typeof timeStr !== 'string') {
    return { ok: false, error: { kind: 'invalid-format' } };
  }
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr.trim());
  if (!match) {
    return { ok: false, error: { kind: 'invalid-format' } };
  }
  const hourPart = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (!Number.isInteger(hourPart) || hourPart < 1 || hourPart > 12) {
    return { ok: false, error: { kind: 'invalid-format' } };
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { ok: false, error: { kind: 'invalid-format' } };
  }
  let hour = hourPart % 12;
  if (period === 'PM') {
    hour += 12;
  }
  const value = { hour, minute };
  return isValidLocalClockTime(value)
    ? { ok: true, value }
    : { ok: false, error: { kind: 'invalid-format' } };
};

export const formatDisplayTimeString = (time: LocalClockTime): string => {
  let hours = time.hour % 12;
  if (hours === 0) {
    hours = 12;
  }
  const period = time.hour >= 12 ? 'PM' : 'AM';
  return `${hours}:${time.minute.toString().padStart(2, '0')} ${period}`;
};

export const isLocalClockTime = (value: unknown): value is LocalClockTime =>
  typeof value === 'object' &&
  value !== null &&
  'hour' in value &&
  'minute' in value &&
  isValidLocalClockTime(value as LocalClockTime);
