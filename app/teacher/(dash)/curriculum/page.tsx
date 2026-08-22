import Link from 'next/link';
import { CURRICULA } from '@/lib/curriculum';
import { tracksFor, trackStats } from '@/lib/content';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function TeacherCurriculumPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>المناهج</h1>
          <div className="sub">الوحدات والدروس ومحتوى كل درس — مقسّمة حسب المنهج</div>
        </div>
        <Link href="/curriculum" className="btn btn-sm btn-light">عرض ما يراه الطالب</Link>
      </div>

      {CURRICULA.map((c) => {
        const tracks = tracksFor(c.key);
        return (
          <section key={c.key} style={{ marginBottom: 32 }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.05rem', marginBottom: 12 }}>
              {c.flag} {c.name_ar}
            </h2>
            <div className="grid-3">
              {tracks.map((t) => {
                const s = trackStats(t.id);
                return (
                  <Link key={t.id} href={`/teacher/curriculum/${t.slug}`} className={`track-card ${c.accent}`}>
                    <h3>{t.name_ar}</h3>
                    {t.name_en && <div className="track-en">{t.name_en}</div>}
                    <div className="track-meta">
                      {fmtNumAr(s.units)} {c.key === 'british' ? 'موضوع' : 'وحدة'} ·{' '}
                      {fmtNumAr(s.lessons)} درس · {fmtNumAr(s.materials)} قسم
                    </div>
                    {s.materials === 0 && <div className="track-note">ما فيه محتوى بعد</div>}
                    <span className="track-cta">إدارة ←</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>💡 كيف يشتغل التقسيم</h3>
        <ul className="tips">
          <li><b>المنهج ← الصف/البرنامج ← الوحدة ← الدرس ← أقسام الدرس.</b></li>
          <li>
            <b>الحجوزات والطلاب والمواعيد والإعدادات نظام واحد</b> — اللي ينقسم هو
            المحتوى الدراسي فقط.
          </li>
          <li>
            <b>كل قسم له مستوى وصول مستقل</b> — خلي الشرح والمذكرة مجانية، وحطي
            بنك الأسئلة أو نماذج الإجابة «لطلابي».
          </li>
        </ul>
      </div>
    </>
  );
}
