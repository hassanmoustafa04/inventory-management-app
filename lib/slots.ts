import { getDb, getSetting, Offering, AvailabilityRule, Booking } from './db';
import { addDays, nowMinutesKW, todayKW, toHM, toMinutes, weekdayOf } from './kwtime';

const SLOT_STEP_MIN = 60;

export type DayAvailability = {
  date: string;
  slots: string[]; // 'HH:MM' start times
};

function activeBookingsOn(date: string): Pick<Booking, 'time' | 'duration_min'>[] {
  return getDb()
    .prepare(
      "SELECT time, duration_min FROM bookings WHERE date = ? AND status IN ('pending','confirmed')"
    )
    .all(date) as Pick<Booking, 'time' | 'duration_min'>[];
}

export function slotsForDate(date: string, durationMin: number): string[] {
  const db = getDb();

  const blocked = db.prepare('SELECT 1 FROM blocked_dates WHERE date = ?').get(date);
  if (blocked) return [];

  const rules = db
    .prepare('SELECT * FROM availability_rules WHERE weekday = ? ORDER BY start_time')
    .all(weekdayOf(date)) as AvailabilityRule[];
  if (rules.length === 0) return [];

  const taken = activeBookingsOn(date);
  const minLeadMin = Number(getSetting('min_lead_hours') || '3') * 60;
  const isToday = date === todayKW();
  const earliestToday = nowMinutesKW() + minLeadMin;

  const out: string[] = [];
  for (const rule of rules) {
    const ruleStart = toMinutes(rule.start_time);
    const ruleEnd = toMinutes(rule.end_time);
    for (let start = ruleStart; start + durationMin <= ruleEnd; start += SLOT_STEP_MIN) {
      if (isToday && start < earliestToday) continue;
      const end = start + durationMin;
      const clash = taken.some((b) => {
        const bStart = toMinutes(b.time);
        const bEnd = bStart + b.duration_min;
        return start < bEnd && bStart < end;
      });
      if (!clash) out.push(toHM(start));
    }
  }
  return Array.from(new Set(out)).sort();
}

/** Availability for the whole booking horizon, for a given offering. */
export function availabilityForOffering(offering: Offering): DayAvailability[] {
  const horizon = Number(getSetting('horizon_days') || '21');
  const start = todayKW();
  const days: DayAvailability[] = [];
  for (let i = 0; i < horizon; i++) {
    const date = addDays(start, i);
    days.push({ date, slots: slotsForDate(date, offering.duration_min) });
  }
  return days;
}

/** Re-check a specific slot right before inserting a booking (race safety). */
export function isSlotFree(date: string, time: string, durationMin: number): boolean {
  return slotsForDate(date, durationMin).includes(time);
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function newBookingCode(): string {
  const db = getDb();
  for (let attempt = 0; attempt < 20; attempt++) {
    let suffix = '';
    for (let i = 0; i < 5; i++) {
      suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    const code = `PHY-${suffix}`;
    const exists = db.prepare('SELECT 1 FROM bookings WHERE code = ?').get(code);
    if (!exists) return code;
  }
  throw new Error('could not generate unique booking code');
}

/** Normalize a Kuwaiti mobile number to '965XXXXXXXX'. Returns null if invalid. */
export function normalizeKwPhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-()+]/g, '');
  // Convert Eastern Arabic numerals if the user typed them.
  digits = digits.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  if (digits.startsWith('00965')) digits = digits.slice(5);
  else if (digits.startsWith('965') && digits.length === 11) digits = digits.slice(3);
  if (!/^[569]\d{7}$/.test(digits)) return null;
  return `965${digits}`;
}
