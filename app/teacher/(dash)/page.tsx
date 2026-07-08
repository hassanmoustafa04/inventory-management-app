import Link from 'next/link';
import BookingRow from '@/components/BookingRow';
import { Booking, getDb, getSetting } from '@/lib/db';
import { addDays, fmtDateAr, fmtKWD, fmtNumAr, nowMinutesKW, todayKW, toMinutes } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function TeacherHome() {
  const db = getDb();
  const today = todayKW();
  const nowMin = nowMinutesKW();
  const monthStart = today.slice(0, 8) + '01';
  const weekEnd = addDays(today, 7);

  const pending = db
    .prepare("SELECT * FROM bookings WHERE status = 'pending' ORDER BY date, time")
    .all() as Booking[];

  const todays = db
    .prepare("SELECT * FROM bookings WHERE date = ? AND status IN ('confirmed','completed') ORDER BY time")
    .all(today) as Booking[];

  const weekCount = db
    .prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'confirmed' AND date >= ? AND date < ?")
    .get(today, weekEnd) as { c: number };

  const monthRevenue = db
    .prepare(
      "SELECT COALESCE(SUM(price_kwd), 0) AS s FROM bookings WHERE status IN ('confirmed','completed') AND date >= ? AND date <= ?"
    )
    .get(monthStart, addDays(monthStart, 31)) as { s: number };

  // Confirmed lessons whose time has passed and still need to be marked completed.
  const needClosing = db
    .prepare("SELECT * FROM bookings WHERE status = 'confirmed' AND date < ? ORDER BY date DESC, time LIMIT 6")
    .all(today) as Booking[];

  const isPast = (b: Booking) =>
    b.date < today || (b.date === today && toMinutes(b.time) + b.duration_min <= nowMin);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>مرحباً، {getSetting('teacher_name')} 👋</h1>
          <div className="sub">اليوم {fmtDateAr(today, { year: true })}</div>
        </div>
        <Link href="/teacher/schedule" className="btn btn-navy btn-sm">
          🗓️ عدّل أوقاتك
        </Link>
      </div>

      <div className="tiles">
        <div className="tile tile-navy">
          <div className="t-label">حصص اليوم</div>
          <div className="t-value">{fmtNumAr(todays.length)}</div>
        </div>
        <div className="tile tile-amber">
          <div className="t-label">طلبات بانتظار ردك</div>
          <div className="t-value">{fmtNumAr(pending.length)}</div>
        </div>
        <div className="tile tile-blue">
          <div className="t-label">حصص مؤكدة (٧ أيام)</div>
          <div className="t-value">{fmtNumAr(weekCount.c)}</div>
        </div>
        <div className="tile tile-green">
          <div className="t-label">دخل هذا الشهر</div>
          <div className="t-value">{fmtKWD(monthRevenue.s)}</div>
        </div>
      </div>

      {pending.length > 0 && (
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 12 }}>
            ⏳ طلبات حجز بانتظار موافقتك
          </h2>
          {pending.map((b) => (
            <BookingRow key={b.id} booking={b} isPast={isPast(b)} />
          ))}
        </section>
      )}

      <section style={{ marginBottom: 30 }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 12 }}>📅 جدول اليوم</h2>
        {todays.length === 0 ? (
          <div className="empty">
            <div className="big">☕</div>
            ما عندك حصص اليوم — يوم هادئ!
          </div>
        ) : (
          todays.map((b) => <BookingRow key={b.id} booking={b} isPast={isPast(b)} />)
        )}
      </section>

      {needClosing.length > 0 && (
        <section>
          <h2 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 12 }}>
            🗂️ حصص سابقة تحتاج إغلاق
          </h2>
          <p className="muted small" style={{ marginBottom: 12 }}>
            علّمها «تمت الحصة» حتى تنحسب في سجل الطالب والدخل.
          </p>
          {needClosing.map((b) => (
            <BookingRow key={b.id} booking={b} isPast />
          ))}
        </section>
      )}
    </>
  );
}
