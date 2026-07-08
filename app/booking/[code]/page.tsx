import Link from 'next/link';
import { notFound } from 'next/navigation';
import Atom from '@/components/Atom';
import { cancelBookingByCodeAction } from '@/lib/actions';
import { Booking, getDb, getSetting } from '@/lib/db';
import { fmtDateAr, fmtDurationAr, fmtKWD, fmtTimeAr, todayKW } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

const STATUS_VIEW: Record<
  Booking['status'],
  { mark: string; markClass: string; title: string; body: string }
> = {
  pending: {
    mark: '⏳',
    markClass: 'mark-wait',
    title: 'وصلنا طلبك!',
    body: 'حجزك الآن قيد المراجعة — بأكده وأرسل لك رسالة واتساب خلال ساعات قليلة. احفظ رقم الحجز للمتابعة.',
  },
  confirmed: {
    mark: '✅',
    markClass: 'mark-ok',
    title: 'حجزك مؤكد!',
    body: 'موعدك محفوظ. إذا كانت الحصة أونلاين بيوصلك رابط الحصة على الواتساب قبل الموعد.',
  },
  declined: {
    mark: '🙏',
    markClass: 'mark-bad',
    title: 'اعتذر عن هذا الموعد',
    body: 'ما قدرت أقبل الحجز في هذا الوقت — احجز موعداً آخر أو كلمني واتساب ونرتب وقتاً يناسبنا.',
  },
  cancelled: {
    mark: '🚫',
    markClass: 'mark-bad',
    title: 'تم إلغاء الحجز',
    body: 'هذا الحجز ملغي. تقدر تحجز موعداً جديداً بأي وقت.',
  },
  completed: {
    mark: '🎓',
    markClass: 'mark-ok',
    title: 'الحصة انتهت',
    body: 'أتمنى الحصة كانت مفيدة! تقدر تحجز حصتك الجاية من نفس الصفحة.',
  },
};

export default function BookingStatusPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const booking = getDb().prepare('SELECT * FROM bookings WHERE code = ?').get(code) as
    | Booking
    | undefined;
  if (!booking) notFound();

  const view = STATUS_VIEW[booking.status];
  const teacherWa = getSetting('whatsapp');
  const waHref = `https://wa.me/${teacherWa}?text=${encodeURIComponent(
    `السلام عليكم أستاذ، بخصوص حجزي رقم ${booking.code}`
  )}`;
  const isUpcoming = booking.date >= todayKW();
  const canCancel = (booking.status === 'pending' || booking.status === 'confirmed') && isUpcoming;

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="brand">
            <Atom />
            <span>فيزياء مع {getSetting('teacher_name')}</span>
          </Link>
          <nav className="topnav">
            <Link className="navlink" href="/">
              ← الرئيسية
            </Link>
          </nav>
        </div>
      </header>

      <div className="container-narrow" style={{ padding: '40px 20px 80px' }}>
        <div className="card">
          <div className="confirm-hero">
            <div className={`mark ${view.markClass}`}>{view.mark}</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{view.title}</h1>
            <div className="code-chip">{booking.code}</div>
            <p className="muted" style={{ maxWidth: 440, margin: '0 auto' }}>
              {view.body}
            </p>
          </div>

          <hr className="divider" />

          <div className="summary-box">
            <div className="row">
              <span>الحالة</span>
              <b>
                <span className={`badge badge-${booking.status}`}>
                  {
                    {
                      pending: 'قيد المراجعة',
                      confirmed: 'مؤكد',
                      declined: 'معتذر عنه',
                      cancelled: 'ملغي',
                      completed: 'منتهية',
                    }[booking.status]
                  }
                </span>
              </b>
            </div>
            <div className="row">
              <span>الحصة</span>
              <b>{booking.offering_name}</b>
            </div>
            <div className="row">
              <span>الموعد</span>
              <b>
                {fmtDateAr(booking.date, { year: true })} — {fmtTimeAr(booking.time)}
              </b>
            </div>
            <div className="row">
              <span>المدة</span>
              <b>{fmtDurationAr(booking.duration_min)}</b>
            </div>
            <div className="row">
              <span>الطالب</span>
              <b>
                {booking.student_name}
                {booking.grade ? ` · ${booking.grade}` : ''}
              </b>
            </div>
            <div className="row">
              <span>السعر</span>
              <b className="total">{fmtKWD(booking.price_kwd)}</b>
            </div>
          </div>

          <div className="row-flex" style={{ marginTop: 22, justifyContent: 'center' }}>
            <a href={waHref} target="_blank" rel="noopener" className="btn btn-green">
              💬 تواصل واتساب
            </a>
            {(booking.status === 'declined' || booking.status === 'cancelled' || booking.status === 'completed') && (
              <Link href="/book" className="btn btn-primary">
                احجز موعداً جديداً
              </Link>
            )}
            {canCancel && (
              <form action={cancelBookingByCodeAction}>
                <input type="hidden" name="code" value={booking.code} />
                <button type="submit" className="btn btn-red-soft">
                  إلغاء الحجز
                </button>
              </form>
            )}
          </div>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 18 }}>
            احفظ رابط هذي الصفحة — تقدر ترجع لها بأي وقت لمتابعة حالة حجزك.
          </p>
        </div>
      </div>
    </>
  );
}
