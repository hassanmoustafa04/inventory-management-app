import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getDb, getSetting, Member, Resource } from '@/lib/db';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'شبكة المعلمين' };

export default function TeachersPage() {
  const db = getDb();
  const teachers = db
    .prepare("SELECT * FROM members WHERE role = 'teacher' AND status = 'active' ORDER BY id")
    .all() as Member[];

  const contributions = new Map<number, number>();
  for (const row of db
    .prepare("SELECT author_id, COUNT(*) AS c FROM resources WHERE status = 'published' AND author_id IS NOT NULL GROUP BY author_id")
    .all() as { author_id: number; c: number }[]) {
    contributions.set(row.author_id, row.c);
  }

  const shared = db
    .prepare("SELECT COUNT(*) AS c FROM resources WHERE status = 'published'")
    .get() as { c: number };

  return (
    <>
      <SiteHeader active="teachers" />

      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">🤝 شبكة المعلمين</span>
          <h1>معلمون يشاركون موادهم… ويستفيدون من بعض</h1>
          <p>
            شبكة مصغّرة من معلمي IGCSE في الكويت. الأعضاء يوصلون لخطط الدروس ومواد
            المعلمين، ويقدرون يشاركون موادهم بعد مراجعتها للحفاظ على الجودة.
          </p>
          <div className="row-flex" style={{ marginTop: 20 }}>
            <Link href="/auth/register?role=teacher" className="btn btn-primary btn-lg">
              قدّم طلب انضمام
            </Link>
            <Link href="/resources" className="btn btn-ghost btn-lg">تصفّح المكتبة</Link>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '40px 20px 70px' }}>
        <div className="grid-3" style={{ marginBottom: 40 }}>
          <div className="feature">
            <div className="icon">📥</div>
            <h3>وصول لمواد المعلمين</h3>
            <p>خطط دروس، توزيع مناهج، وملفات ما تنشر للطلاب.</p>
          </div>
          <div className="feature">
            <div className="icon">✅</div>
            <h3>مراجعة قبل النشر</h3>
            <p>كل ملف يمر على مراجعة — المكتبة تبقى نظيفة وموثوقة.</p>
          </div>
          <div className="feature">
            <div className="icon">🔁</div>
            <h3>إحالة الطلاب</h3>
            <p>جدولك ممتلئ؟ حوّل الطالب لمعلم ثاني في الشبكة.</p>
          </div>
        </div>

        <div className="section-head">
          <div className="kicker">الأعضاء الحاليون</div>
          <h2>{fmtNumAr(teachers.length + 1)} معلم · {fmtNumAr(shared.c)} ملف منشور</h2>
        </div>

        <div className="grid-3">
          <div className="quote">
            <div className="stars">مؤسِّسة الشبكة</div>
            <div className="who" style={{ marginBottom: 8 }}>
              {getSetting('teacher_name')}
              <small>{getSetting('tagline')}</small>
            </div>
            <p>{getSetting('bio')}</p>
          </div>
          {teachers.map((t) => (
            <div className="quote" key={t.id}>
              <div className="stars">معلم معتمد</div>
              <div className="who" style={{ marginBottom: 8 }}>
                {t.name}
                <small>{t.school || 'معلم في الشبكة'}</small>
              </div>
              <p>{t.bio || 'عضو في شبكة المعلمين.'}</p>
              <div className="muted small">
                {t.subjects && <>{t.subjects} · </>}
                {fmtNumAr(contributions.get(t.id) ?? 0)} ملف منشور
              </div>
            </div>
          ))}
        </div>

        {teachers.length === 0 && (
          <p className="muted small" style={{ textAlign: 'center', marginTop: 20 }}>
            الشبكة في بدايتها — كن أول معلم ينضم.
          </p>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
