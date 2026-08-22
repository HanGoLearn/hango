/**
 * Study streak (14.1 "Basic study streak") - pure, UTC-date based. A
 * documented simplification: dates are compared in UTC, not the learner's
 * local timezone (no timezone is stored anywhere in the profile), so a
 * learner near a date boundary could see their streak flip a little early
 * or late relative to their own clock.
 */
export function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface StreakResult {
  currentStreak: number;
  activeToday: boolean;
}

export function computeStreak(
  activityDates: string[],
  today: string = toUtcDateString(new Date()),
): StreakResult {
  const uniqueDates = new Set(activityDates);
  const activeToday = uniqueDates.has(today);

  let streak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!activeToday) {
    // Today not being logged yet doesn't break an existing streak until the day ends.
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (uniqueDates.has(toUtcDateString(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { currentStreak: streak, activeToday };
}

export interface DayActivity {
  date: string;
  active: boolean;
}

/**
 * Last 7 calendar days (today inclusive), oldest first - powers the
 * Dashboard's weekly activity strip. Takes the same `activityDates` list
 * `computeStreak` already uses, so callers that need both never have to
 * fetch activity twice for one request (dashboard-data.ts shares the single
 * cached query behind both).
 */
export function computeLast7DaysActivity(
  activityDates: string[],
  today: string = toUtcDateString(new Date()),
): DayActivity[] {
  const uniqueDates = new Set(activityDates);
  const cursor = new Date(`${today}T00:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() - 6);

  const days: DayActivity[] = [];
  for (let i = 0; i < 7; i++) {
    const date = toUtcDateString(cursor);
    days.push({ date, active: uniqueDates.has(date) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
