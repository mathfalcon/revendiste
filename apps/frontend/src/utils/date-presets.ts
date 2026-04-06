import {
  addDays,
  endOfMonth,
  format,
  startOfMonth,
  nextFriday,
  nextSunday,
  previousFriday,
  isFriday,
  isSaturday,
  isSunday,
} from 'date-fns';

export interface DatePreset {
  label: string;
  from: string;
  to: string;
}

// When the local hour is before 6 AM, the user is likely still experiencing the
// previous calendar day (e.g. coming home from an event, looking for what's on
// right now). In those cases we include yesterday in "Hoy" so ongoing late-night
// events are still visible.
const LATE_NIGHT_CUTOFF_HOUR = 6;

function isLateNight(now: Date): boolean {
  return now.getHours() < LATE_NIGHT_CUTOFF_HOUR;
}

/**
 * Returns the Friday–Sunday range for "este finde".
 * - Mon–Thu  → next Fri to next Sun
 * - Friday   → today to next Sun
 * - Saturday → last Fri to next Sun
 * - Sunday   → last Fri to today
 *
 * This ensures "Este finde" never collapses to a single day (which would
 * visually match "Hoy" and highlight both pills at the same time on Sundays).
 */
function computeWeekendRange(now: Date): {start: string; end: string} {
  const today = format(now, 'yyyy-MM-dd');

  if (isSunday(now)) {
    return {
      start: format(previousFriday(now), 'yyyy-MM-dd'),
      end: today,
    };
  }
  if (isSaturday(now)) {
    return {
      start: format(previousFriday(now), 'yyyy-MM-dd'),
      end: format(nextSunday(now), 'yyyy-MM-dd'),
    };
  }
  if (isFriday(now)) {
    return {
      start: today,
      end: format(nextSunday(now), 'yyyy-MM-dd'),
    };
  }
  // Mon–Thu
  return {
    start: format(nextFriday(now), 'yyyy-MM-dd'),
    end: format(nextSunday(now), 'yyyy-MM-dd'),
  };
}

export function getDatePresets(): DatePreset[] {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const yesterday = format(addDays(now, -1), 'yyyy-MM-dd');
  const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');

  // Before 6 AM, "Hoy" also includes yesterday so late-night events show up.
  const todayFrom = isLateNight(now) ? yesterday : today;

  const {start: weekendStart, end: weekendEnd} = computeWeekendRange(now);

  return [
    {label: 'Hoy', from: todayFrom, to: today},
    {label: 'Mañana', from: tomorrow, to: tomorrow},
    {label: 'Este finde', from: weekendStart, to: weekendEnd},
    {label: 'Este mes', from: monthStart, to: monthEnd},
  ];
}

export function getTodayDateRange(): {from: string; to: string} {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const yesterday = format(addDays(now, -1), 'yyyy-MM-dd');
  // Before 6 AM include yesterday so late-night events are shown.
  return {from: isLateNight(now) ? yesterday : today, to: today};
}

export function getWeekendDateRange(): {from: string; to: string} {
  const now = new Date();
  const {start, end} = computeWeekendRange(now);
  return {from: start, to: end};
}
