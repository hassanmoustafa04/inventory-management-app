import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { memberLogoutAction } from '@/lib/actions';
import { ACCESS_LABELS, Booking, getDb, Resource, typeLabel } from '@/lib/db';
import { allowedTiers, currentMember, isEnrolledStudent } from '@/lib/members';
import { fmtDateAr, fmtKWD, fmtNumAr, fmtTimeAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'حسابي' };

export default function MePage({
  searchParams,
}: {
  searchParams: { welcome?: string; msg?: string };
}) {
  const member = currentMember();
  if (!member) redirect('/auth/login');

  const db = getDb();
  const tiers = allowedTiers(member);
  const enrolled = isEnrolledStudent(member);

  const downloads = db
    .prepare(
      `SELECT r.* FROM resource_downloads d
       JOIN resources r ON r.id = d.resource_id
       WHERE d.member_id = ?
       GROUP BY r.id
       ORDER BY MAX(d.created_at) DESC LIMIT 12`
    )
    .all(member.id) as Resource[];

  const bookings = member.phone
    ? (db
        .prepare('SELECT * FROM bookings WHERE phone = ? ORDER BY date DESC, time DESC LIMIT 10')
        .all(member.phone) as Booking[])
    : [];

  const myUploads =
    member.role === 'teacher'
      ? (db
          .prepare('SELECT * FROM resources WHERE author_id = ? ORDER BY id DESC')
          .all(member.id) as Resource[])
      : [];

  return (
    <>
      <SiteHeader />
      <div className="container" style={{ padding: '30px 20px 70px' }}>
        {searchParams.welcome === 'teacher' && (
          <div className="form-ok">
            ✅ وصلنا طلبك! بعد مراجعته تُفتح لك ملفات المعلمين وتقدر تشارك موادك.
          </div>
        )}
        {searchParams.welcome === 'student' && (
          <div className="form-ok">✅ أهلاً فيك! حسابك جاهز وملفات الأعضاء مفتوحة لك.</div>
        )}
        {searchParams.msg && <div className="form-ok">{searchParams.msg}</div>}

        <div className="page-head">
          <div>
            <h1>أهلاً، {member.name} 👋</h1>
            <div className="sub">
              {member.role === 'teacher' ? 'حساب معلم' : 'حساب طالب'}
              {member.status === 'pending' && ' — قيد المراجعة'}
            </div>
          </div>
          <div className="row-flex">
            <Link href="/me/profile" className="btn btn-sm btn-light">بياناتي</Link>
            <form action={memberLogoutAction}>
              <button className="btn btn-sm btn-light" type="submit">خروج</button>
            </form>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 22 }}>
          <h3 style={{ marginBottom: 10 }}>🔑 مستوى وصولك</h3>
          <div className="row-flex">
            {(['public', 'member', 'student', 'teacher'] as const).map((t) => {
              const on = tiers.includes(t);
              return (
                <span key={t} className={`tier-pill ${on ? 'on' : ''}`}>
                  {on ? '✓' : '🔒'} {ACCESS_LABELS[t].label}
                </span>
              );
            })}
          </div>
          {!enrolled && member.role === 'student' && (
            <p className="muted small" style={{ marginTop: 12 }}>
              ملفات «لطلابي» تُفتح تلقائياً بعد أول حصة مؤكدة.{' '}
              <Link href="/book"><b>احجز حصة</b></Link>
            </p>
          )}
          {member.role === 'teacher' && member.status === 'pending' && (
            <p className="muted small" style={{ marginTop: 12 }}>
              ⏳ طلب الانضمام قيد المراجعة — بنبلغك أول ما يتم اعتماده.
            </p>
          )}
        </div>

        {member.role === 'teacher' && member.status === 'active' && (
          <div className="card" style={{ marginBottom: 22 }}>
            <div className="spread" style={{ marginBottom: 14 }}>
              <h3>📤 مشاركاتي في المكتبة</h3>
              <Link href="/me/upload" className="btn btn-sm btn-navy">أضف ملفاً</Link>
            </div>
            {myUploads.length === 0 ? (
              <p className="muted small">
                ما شاركت ملفات بعد — شارك أول ملف وخلّ غيرك يستفيد منه.
              </p>
            ) : (
              <div className="stack">
                {myUploads.map((r) => (
                  <div className="b-row" key={r.id} style={{ marginBottom: 0 }}>
                    <span className="res-icon">{typeLabel(r.type).icon}</span>
                    <div className="b-info">
                      <b>{r.title}</b>
                      <div className="meta">
                        {r.subject} · {r.level} · ⬇ {fmtNumAr(r.downloads)}
                      </div>
                      {r.status === 'rejected' && r.review_note && (
                        <div className="meta" style={{ color: 'var(--red)' }}>
                          ملاحظة المراجعة: {r.review_note}
                        </div>
                      )}
                    </div>
                    <span className={`badge badge-${r.status === 'published' ? 'confirmed' : r.status === 'pending' ? 'pending' : 'declined'}`}>
                      {r.status === 'published' ? 'منشور' : r.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                    </span>
                    {r.status === 'published' && (
                      <Link href={`/resources/${r.slug}`} className="btn btn-sm btn-light">عرض</Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>⬇ ملفات حمّلتها</h3>
            {downloads.length === 0 ? (
              <p className="muted small">
                ما حمّلت شي بعد. <Link href="/resources"><b>تصفّح المكتبة</b></Link>
              </p>
            ) : (
              <div className="stack">
                {downloads.map((r) => (
                  <Link key={r.id} href={`/resources/${r.slug}`} className="mini-row">
                    <span>{typeLabel(r.type).icon}</span>
                    <span className="mini-title">{r.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 14 }}>📅 حجوزاتي</h3>
            {!member.phone && (
              <p className="muted small">
                أضف رقم واتسابك في <Link href="/me/profile"><b>بياناتي</b></Link> لربط حجوزاتك تلقائياً.
              </p>
            )}
            {member.phone && bookings.length === 0 && (
              <p className="muted small">
                ما عندك حجوزات. <Link href="/book"><b>احجز حصتك الأولى</b></Link>
              </p>
            )}
            <div className="stack">
              {bookings.map((b) => (
                <Link key={b.id} href={`/booking/${b.code}`} className="mini-row">
                  <span className={`badge badge-${b.status}`}>
                    {{
                      pending: 'قيد المراجعة', confirmed: 'مؤكد', declined: 'معتذر',
                      cancelled: 'ملغي', completed: 'تمت',
                    }[b.status]}
                  </span>
                  <span className="mini-title">
                    {fmtDateAr(b.date)} — {fmtTimeAr(b.time)} · {fmtKWD(b.price_kwd)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
