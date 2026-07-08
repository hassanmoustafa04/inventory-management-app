import { getDb } from '@/lib/db';
import { fmtDayMonthAr, fmtKWD, fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

type StudentRow = {
  phone: string;
  student_name: string;
  grade: string;
  lessons: number;
  upcoming: number;
  last_date: string;
  total_paid: number;
};

export default function StudentsPage() {
  const students = getDb()
    .prepare(
      `SELECT
         phone,
         MAX(student_name) AS student_name,
         MAX(grade) AS grade,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS lessons,
         SUM(CASE WHEN status IN ('pending','confirmed') AND date >= date('now') THEN 1 ELSE 0 END) AS upcoming,
         MAX(CASE WHEN status IN ('completed','confirmed') THEN date ELSE NULL END) AS last_date,
         SUM(CASE WHEN status = 'completed' THEN price_kwd ELSE 0 END) AS total_paid
       FROM bookings
       WHERE status NOT IN ('declined')
       GROUP BY phone
       ORDER BY MAX(created_at) DESC`
    )
    .all() as StudentRow[];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>الطلاب</h1>
          <div className="sub">
            يتكوّن سجل الطلاب تلقائياً من الحجوزات — {fmtNumAr(students.length)} طالب
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty">
          <div className="big">👥</div>
          أول ما يحجز طالب، بيظهر هنا تلقائياً
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الصف</th>
                <th>حصص مكتملة</th>
                <th>حجوزات قادمة</th>
                <th>آخر حصة</th>
                <th>إجمالي المدفوع</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.phone}>
                  <td>
                    <b>{s.student_name}</b>
                    <div className="muted small" style={{ direction: 'ltr', textAlign: 'end' }}>
                      +{s.phone}
                    </div>
                  </td>
                  <td>{s.grade || '—'}</td>
                  <td>{fmtNumAr(s.lessons)}</td>
                  <td>{s.upcoming > 0 ? <b>{fmtNumAr(s.upcoming)}</b> : '—'}</td>
                  <td>{s.last_date ? fmtDayMonthAr(s.last_date) : '—'}</td>
                  <td>{fmtKWD(s.total_paid)}</td>
                  <td>
                    <a
                      href={`https://wa.me/${s.phone}`}
                      target="_blank"
                      rel="noopener"
                      className="btn btn-sm btn-light"
                    >
                      💬 واتساب
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
