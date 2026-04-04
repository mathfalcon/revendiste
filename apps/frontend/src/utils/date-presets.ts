import {
  addDays,
  endOfMonth,
  format,
  startOfMonth,
  nextFriday,
  nextSunday,
  isFriday,
  isSaturday,
  isSunday,
} from 'date-fns';

export interface DatePreset {
  label: string;
  from: string;
  to: string;
}

export function getDatePresets(): DatePreset[] {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');

  // Weekend = Friday to Sunday. If we're already in the weekend, start from today.
  const isWeekend = isFriday(now) || isSaturday(now) || isSunday(now);
  const weekendStart = isWeekend
    ? today
    : format(nextFriday(now), 'yyyy-MM-dd');
  const weekendEnd = isSunday(now)
    ? today
    : format(nextSunday(now), 'yyyy-MM-dd');

  return [
    {label: 'Hoy', from: today, to: today},
    {label: 'Mañana', from: tomorrow, to: tomorrow},
    {label: 'Este finde', from: weekendStart, to: weekendEnd},
    {label: 'Este mes', from: monthStart, to: monthEnd},
  ];
}

export function getTodayDateRange(): {from: string; to: string} {
  const today = format(new Date(), 'yyyy-MM-dd');
  return {from: today, to: today};
}

export function getWeekendDateRange(): {from: string; to: string} {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const isWeekend = isFriday(now) || isSaturday(now) || isSunday(now);
  const weekendStart = isWeekend
    ? today
    : format(nextFriday(now), 'yyyy-MM-dd');
  const weekendEnd = isSunday(now)
    ? today
    : format(nextSunday(now), 'yyyy-MM-dd');
  return {from: weekendStart, to: weekendEnd};
}
