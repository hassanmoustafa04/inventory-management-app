import { setBookingStatusAction } from '@/lib/actions';
import type { Booking } from '@/lib/db';
import { fmtDayMonthAr, fmtDurationAr, fmtKWD, fmtTimeAr, fmtWeekdayAr } from '@/lib/kwtime';

export const STATUS_AR: Record<Booking['status'], string> = {
  pending: 'قيد المراجعة',
  confirmed: 'مؤكد',
  declined: 'معتذر عنه',
  cancelled: 'ملغي',
  completed: 'منتهية',
};

function ActionForm({
  id,
  status,
  label,
  className,
}: {
  id: number;
  status: string;
  label: string;
  className: string;
}) {
  return (
    <form action={setBookingStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={`btn btn-sm ${className}`}>
        {label}
      </button>
    </form>
  );
}

export default function BookingRow({ booking, isPast }: { booking: Booking; isPast: boolean }) {
  const waHref = `https://wa.me/${booking.phone}?text=${encodeURIComponent(
    `مرحباً ${booking.student_name}، بخصوص حجز حصة الفيزياء (${booking.code})`
  )}`;

  return (
    <div className="b-row">
      <div className="b-when">
        <small>{fmtWeekdayAr(booking.date)}</small>
        <b>{fmtDayMonthAr(booking.date)}</b>
        <small>{fmtTimeAr(booking.time)}</small>
      </div>
      <div className="b-info">
        <b>{booking.student_name}</b>
        {booking.grade && <span className="meta"> · {booking.grade}</span>}
        <div className="meta">
          {booking.mode === 'online' ? '🖥️' : '🏠'} {booking.offering_name} ·{' '}
          {fmtDurationAr(booking.duration_min)} · {fmtKWD(booking.price_kwd)}
        </div>
        {booking.notes && <div className="meta">📝 {booking.notes}</div>}
        <div className="meta" style={{ direction: 'ltr', textAlign: 'end' }}>
          {booking.code}
        </div>
      </div>
      <div className="b-actions">
        <span className={`badge badge-${booking.status}`}>{STATUS_AR[booking.status]}</span>
        <a href={waHref} target="_blank" rel="noopener" className="btn btn-sm btn-light">
          💬 واتساب
        </a>
        {booking.status === 'pending' && (
          <>
            <ActionForm id={booking.id} status="confirmed" label="✓ تأكيد" className="btn-green" />
            <ActionForm id={booking.id} status="declined" label="اعتذار" className="btn-red-soft" />
          </>
        )}
        {booking.status === 'confirmed' && !isPast && (
          <ActionForm id={booking.id} status="cancelled" label="إلغاء" className="btn-red-soft" />
        )}
        {booking.status === 'confirmed' && isPast && (
          <ActionForm id={booking.id} status="completed" label="✓ تمت الحصة" className="btn-navy" />
        )}
      </div>
    </div>
  );
}
