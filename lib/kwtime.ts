// All dates/times in the app are Kuwait local time (Asia/Kuwait, UTC+3, no DST).
// Dates are stored as 'YYYY-MM-DD' strings and times as 'HH:MM' strings.

const KW_TZ = 'Asia/Kuwait';

export function todayKW(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: KW_TZ }).format(new Date());
}

export function nowMinutesKW(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KW_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

export function toMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function toHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** JS convention: 0 = Sunday … 6 = Saturday. */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

const AR = 'ar-KW';

/** e.g. «الأحد ١٢ يوليو» */
export function fmtDateAr(dateStr: string, opts?: { year?: boolean }): string {
  return new Intl.DateTimeFormat(AR, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(opts?.year ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

/** e.g. «الأحد» */
export function fmtWeekdayAr(dateStr: string): string {
  return new Intl.DateTimeFormat(AR, { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${dateStr}T00:00:00Z`)
  );
}

/** e.g. «١٢ يوليو» */
export function fmtDayMonthAr(dateStr: string): string {
  return new Intl.DateTimeFormat(AR, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateStr}T00:00:00Z`)
  );
}

/** '16:00' → «٤:٠٠ م» */
export function fmtTimeAr(hm: string): string {
  return new Intl.DateTimeFormat(AR, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(`2000-01-01T${hm}:00Z`));
}

export function fmtNumAr(n: number): string {
  return new Intl.NumberFormat(AR).format(n);
}

/** e.g. «١٢ د.ك» */
export function fmtKWD(n: number): string {
  return `${fmtNumAr(n)} د.ك`;
}

export function fmtDurationAr(min: number): string {
  if (min === 60) return 'ساعة';
  if (min === 90) return 'ساعة ونصف';
  if (min === 120) return 'ساعتان';
  if (min === 45) return '٤٥ دقيقة';
  return `${fmtNumAr(min)} دقيقة`;
}

export const WEEKDAYS_AR = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];
