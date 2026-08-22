import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { CURRICULA } from '@/lib/curriculum';
import { tracksFor, trackStats } from '@/lib/content';
import { getDb } from '@/lib/db';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'المناهج والمكتبة' };

export default function CurriculumHome() {
  const libraryCount = (getDb()
    .prepare("SELECT COUNT(*) AS c FROM resources WHERE status = 'published'")
    .get() as { c: number }).c;

  return (
    <>
      <SiteHeader active="curriculum" />

      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">📚 المناهج والمكتبة</span>
          <h1>اختاري منهجك وابدئي من أول درس</h1>
          <p>
            المحتوى مقسّم حسب المنهج — كل صف له وحداته ودروسه، وكل درس فيه الشرح
            والمذكرة والتدريبات والاختبارات.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '40px 20px 70px' }}>
        <div className="curric-grid">
          {CURRICULA.map((c) => {
            const tracks = tracksFor(c.key);
            const totals = tracks.reduce(
              (acc, t) => {
                const s = trackStats(t.id);
                return { units: acc.units + s.units, lessons: acc.lessons + s.lessons };
              },
              { units: 0, lessons: 0 }
            );
            return (
              <Link key={c.key} href={`/curriculum?c=${c.key}#${c.key}`} className={`curric-card ${c.accent}`} id={c.key}>
                <span className="curric-flag">{c.flag}</span>
                <h2>{c.name_ar}</h2>
                <p>{c.blurb_ar}</p>
                <div className="curric-meta">
                  {fmtNumAr(tracks.length)} {c.key === 'kuwaiti' ? 'صفوف' : 'برنامج'} ·{' '}
                  {fmtNumAr(totals.lessons)} درس
                </div>
              </Link>
            );
          })}
        </div>

        {CURRICULA.map((c) => {
          const tracks = tracksFor(c.key);
          if (tracks.length === 0) return null;
          return (
            <section key={c.key} style={{ marginTop: 44 }}>
              <h2 className="curric-section-head">
                <span>{c.flag}</span> {c.name_ar}
              </h2>
              <div className="grid-3">
                {tracks.map((t) => {
                  const s = trackStats(t.id);
                  return (
                    <Link key={t.id} href={`/curriculum/${t.slug}`} className={`track-card ${c.accent}`}>
                      <h3>{t.name_ar}</h3>
                      {t.name_en && <div className="track-en">{t.name_en}</div>}
                      <div className="track-meta">
                        {s.units > 0 ? (
                          <>
                            {fmtNumAr(s.units)} {c.key === 'british' ? 'موضوع' : 'وحدة'} ·{' '}
                            {fmtNumAr(s.lessons)} درس
                          </>
                        ) : (
                          <span className="muted">قيد الإعداد</span>
                        )}
                      </div>
                      {t.note && <div className="track-note">{t.note}</div>}
                      <span className="track-cta">ادخل ←</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="teach-cta card" style={{ marginTop: 44 }}>
          <div>
            <b>📁 مكتبة الملفات</b>
            <p className="muted small" style={{ margin: 0 }}>
              كل الملفات في مكان واحد ({fmtNumAr(libraryCount)} ملف) — عروض، مذكرات،
              أوراق عمل ونماذج امتحانات، مع بحث وتصفية.
            </p>
          </div>
          <Link href="/resources" className="btn btn-navy">تصفّح المكتبة</Link>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
