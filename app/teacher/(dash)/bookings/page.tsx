import Link from 'next/link';
import BookingRow from '@/components/BookingRow';
import { Booking, getDb } from '@/lib/db';
import { fmtNumAr, nowMinutesKW, todayKW, toMinutes } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

const FILTERS: { key: string; label: string; where: string }[] = [
  { key: 'upcoming', label: 'القادمة', where: "status = 'confirmed' AND date >= :today" },
  { key: 'pending', label: 'قيد المراجعة', where: "status = 'pending'" },
  { key: 'past', label: 'المنتهية', where: "(status = 'completed' OR (status = 'confirmed' AND date < :today))" },
  { key: 'cancelled', label: 'الملغية', where: "status IN ('cancelled','declined')" },
  { key: 'all', label: 'الكل', where: '1=1' },
];

export default function BookingsPage({ searchParams }: { searchParams: { f?: string } }) {
  const db = getDb();
  const today = todayKW();
  const nowMin = nowMinutesKW();
  const filter = FILTERS.find((f) => f.key === (searchParams.f ?? 'upcoming')) ?? FILTERS[0];

  const bookings = db
    .prepare(
      `SELECT * FROM bookings WHERE ${filter.where.replaceAll(':today', '?')}
       ORDER BY date ${filter.key === 'past' || filter.key === 'all' ? 'DESC' : 'ASC'}, time`
    )
    .all(...(filter.where.includes(':today') ? [today] : [])) as Booking[];

  const counts = Object.fromEntries(
    FILTERS.map((f) => [
      f.key,
      (
        db
          .prepare(`SELECT COUNT(*) AS c FROM bookings WHERE ${f.where.replaceAll(':today', '?')}`)
          .get(...(f.where.includes(':today') ? [today] : [])) as { c: number }
      ).c,
    ])
  );

  const isPast = (b: Booking) =>
    b.date < today || (b.date === today && toMinutes(b.time) + b.duration_min <= nowMin);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>الحجوزات</h1>
          <div className="sub">كل حجوزات الطلاب في مكان واحد</div>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/teacher/bookings?f=${f.key}`}
            className={f.key === filter.key ? 'active' : ''}
          >
            {f.label} ({fmtNumAr(counts[f.key])})
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="empty">
          <div className="big">📭</div>
          ما فيه حجوزات في هذي القائمة
        </div>
      ) : (
        bookings.map((b) => <BookingRow key={b.id} booking={b} isPast={isPast(b)} />)
      )}
    </>
  );
}
