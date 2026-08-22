import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { curriculumOf } from '@/lib/curriculum';
import { trackBySlug, trackStats, unitsWithLessons } from '@/lib/content';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { track: string } }) {
  const t = trackBySlug(params.track);
  return { title: t ? `${t.name_ar} — المناهج` : 'غير موجود' };
}

export default function TrackPage({ params }: { params: { track: string } }) {
  const track = trackBySlug(params.track);
  if (!track || track.active !== 1) notFound();

  const c = curriculumOf(track.curriculum);
  const units = unitsWithLessons(track.id);
  const stats = trackStats(track.id);
  const unitWord = track.curriculum === 'british' ? 'موضوع' : 'وحدة';

  return (
    <>
      <SiteHeader active="curriculum" />

      <section className={`page-hero ${c.accent}`}>
        <div className="container">
          <div className="crumbs">
            <Link href="/curriculum">المناهج</Link>
            <span>›</span>
            <span>{c.flag} {c.short_ar}</span>
          </div>
          <h1>{track.name_ar}</h1>
          {track.name_en && <p className="track-en-hero">{track.name_en}</p>}
          <p>
            {stats.units > 0
              ? `${fmtNumAr(stats.units)} ${unitWord} · ${fmtNumAr(stats.lessons)} درس`
              : 'المحتوى قيد الإعداد'}
          </p>
          {track.note && <p className="hero-note">ℹ️ {track.note}</p>}
        </div>
      </section>

      <div className="container-narrow" style={{ padding: '34px 20px 70px' }}>
        {units.length === 0 ? (
          <div className="empty">
            <div className="big">🚧</div>
            وحدات هذا الصف قيد الإعداد — تابعينا قريباً.
            <div style={{ marginTop: 14 }}>
              <Link href="/curriculum" className="btn btn-sm btn-light">رجوع للمناهج</Link>
            </div>
          </div>
        ) : (
          units.map((unit, i) => (
            <details className="unit-block" key={unit.id} open={i === 0}>
              <summary>
                <span className="unit-num">{fmtNumAr(i + 1)}</span>
                <span className="unit-title">
                  <b>{unit.title}</b>
                  {unit.subtitle && <small>{unit.subtitle}</small>}
                </span>
                <span className="unit-count">{fmtNumAr(unit.lessons.length)} درس</span>
              </summary>
              <div className="lesson-list">
                {unit.lessons.length === 0 && (
                  <div className="muted small" style={{ padding: '10px 16px' }}>
                    لا توجد دروس في هذه الوحدة بعد.
                  </div>
                )}
                {unit.lessons.map((lesson, li) => (
                  <Link key={lesson.id} href={`/lesson/${lesson.slug}`} className="lesson-row">
                    <span className="lesson-idx">{fmtNumAr(li + 1)}</span>
                    <span className="lesson-name">
                      {lesson.title}
                      {lesson.summary && <small>{lesson.summary}</small>}
                    </span>
                    {lesson.material_count > 0 ? (
                      <span className="lesson-badge">{fmtNumAr(lesson.material_count)} قسم</span>
                    ) : (
                      <span className="lesson-badge soon">قريباً</span>
                    )}
                  </Link>
                ))}
              </div>
            </details>
          ))
        )}

        <div className="teach-cta card" style={{ marginTop: 30 }}>
          <div>
            <b>تحتاج شرح مباشر؟</b>
            <p className="muted small" style={{ margin: 0 }}>احجز حصة خصوصية على أي درس من هذي الوحدات.</p>
          </div>
          <Link href="/book" className="btn btn-navy">احجز حصة</Link>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
