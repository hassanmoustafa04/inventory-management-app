import {
  addRuleAction,
  blockDateAction,
  confirmScheduleAction,
  deleteRuleAction,
  unblockDateAction,
} from '@/lib/actions';
import { getSetting } from '@/lib/db';
import { AvailabilityRule, getDb } from '@/lib/db';
import { fmtDateAr, fmtTimeAr, todayKW, WEEKDAYS_AR } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function SchedulePage({ searchParams }: { searchParams: { msg?: string } }) {
  const db = getDb();
  const rules = db
    .prepare('SELECT * FROM availability_rules ORDER BY weekday, start_time')
    .all() as AvailabilityRule[];
  const blocked = db
    .prepare('SELECT date, reason FROM blocked_dates WHERE date >= ? ORDER BY date')
    .all(todayKW()) as { date: string; reason: string }[];

  const byDay = new Map<number, AvailabilityRule[]>();
  for (const r of rules) {
    byDay.set(r.weekday, [...(byDay.get(r.weekday) ?? []), r]);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>جدول أوقاتي</h1>
          <div className="sub">
            حدد الأوقات اللي تستقبل فيها حجوزات كل أسبوع — الطلاب يشوفون هذي الأوقات مباشرة
          </div>
        </div>
      </div>

      {searchParams.msg && <div className="form-ok">{searchParams.msg}</div>}

      {getSetting('setup_schedule') !== '1' && (
        <div className="notice spread">
          <span>هذي أوقات افتراضية — عدّليها لتطابق جدولك، وبعدين أكّديها.</span>
          <form action={confirmScheduleAction}>
            <button type="submit" className="btn btn-sm btn-navy">✓ جدولي صحيح</button>
          </form>
        </div>
      )}

      <section style={{ marginBottom: 34 }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 12 }}>🗓️ الجدول الأسبوعي</h2>
        {WEEKDAYS_AR.map((name, wd) => {
          const dayRules = byDay.get(wd) ?? [];
          return (
            <div className="day-block" key={wd}>
              <span className="day-name">{name}</span>
              {dayRules.length === 0 && <span className="day-off">— إجازة</span>}
              {dayRules.map((r) => (
                <span className="range-tag" key={r.id}>
                  {fmtTimeAr(r.start_time)} إلى {fmtTimeAr(r.end_time)}
                  <form action={deleteRuleAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" title="حذف الفترة" aria-label="حذف الفترة">
                      ✕
                    </button>
                  </form>
                </span>
              ))}
            </div>
          );
        })}

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12 }}>➕ أضف فترة جديدة</h3>
          <form action={addRuleAction} className="row-flex">
            <select name="weekday" className="select" style={{ width: 'auto' }} required>
              {WEEKDAYS_AR.map((name, wd) => (
                <option key={wd} value={wd}>
                  {name}
                </option>
              ))}
            </select>
            <label className="small muted">من</label>
            <input type="time" name="start" className="input ltr" style={{ width: 130 }} defaultValue="16:00" required />
            <label className="small muted">إلى</label>
            <input type="time" name="end" className="input ltr" style={{ width: 130 }} defaultValue="21:00" required />
            <button type="submit" className="btn btn-navy btn-sm">
              إضافة
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 12 }}>
          🚫 أيام مقفلة (إجازات واستثناءات)
        </h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          اقفل يوماً محدداً (سفر، مناسبة…) بدون تغيير جدولك الأسبوعي.
        </p>

        {blocked.length === 0 ? (
          <div className="empty">ما فيه أيام مقفلة قادمة</div>
        ) : (
          blocked.map((b) => (
            <div className="day-block" key={b.date}>
              <span className="day-name" style={{ minWidth: 180 }}>
                {fmtDateAr(b.date)}
              </span>
              {b.reason && <span className="muted small">({b.reason})</span>}
              <span style={{ flex: 1 }} />
              <form action={unblockDateAction}>
                <input type="hidden" name="date" value={b.date} />
                <button type="submit" className="btn btn-sm btn-light">
                  فتح اليوم
                </button>
              </form>
            </div>
          ))
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12 }}>➕ اقفل يوماً</h3>
          <form action={blockDateAction} className="row-flex">
            <input type="date" name="date" className="input ltr" style={{ width: 180 }} min={todayKW()} required />
            <input
              type="text"
              name="reason"
              className="input"
              style={{ width: 240 }}
              placeholder="السبب (اختياري)"
            />
            <button type="submit" className="btn btn-navy btn-sm">
              قفل اليوم
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
