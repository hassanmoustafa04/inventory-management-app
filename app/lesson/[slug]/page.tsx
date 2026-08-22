import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { curriculumOf, embedUrl, kindInfo, kindLabel } from '@/lib/curriculum';
import { lessonBySlug } from '@/lib/content';
import { canAccess, currentMember, lockReason } from '@/lib/members';
import { ACCESS_LABELS } from '@/lib/db';
import { fmtFileSize } from '@/lib/resources';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const ctx = lessonBySlug(params.slug);
  return { title: ctx ? `${ctx.lesson.title} — ${ctx.track.name_ar}` : 'الدرس غير موجود' };
}

export default function LessonPage({ params }: { params: { slug: string } }) {
  const ctx = lessonBySlug(params.slug);
  if (!ctx) notFound();

  const { lesson, unit, track, materials, prev, next } = ctx;
  const c = curriculumOf(track.curriculum);
  const member = currentMember();

  return (
    <>
      <SiteHeader active="curriculum" />

      <section className={`page-hero ${c.accent}`}>
        <div className="container">
          <div className="crumbs">
            <Link href="/curriculum">المناهج</Link>
            <span>›</span>
            <Link href={`/curriculum/${track.slug}`}>{track.name_ar}</Link>
            <span>›</span>
            <span>{unit.title}</span>
          </div>
          <h1>{lesson.title}</h1>
          {lesson.summary && <p>{lesson.summary}</p>}
        </div>
      </section>

      <div className="container-narrow" style={{ padding: '30px 20px 70px' }}>
        {materials.length === 0 ? (
          <div className="empty">
            <div className="big">🚧</div>
            محتوى هذا الدرس قيد الإعداد.
            <div style={{ marginTop: 14 }}>
              <Link href={`/curriculum/${track.slug}`} className="btn btn-sm btn-light">
                باقي دروس {track.name_ar}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <nav className="section-jump">
              {materials.map((m) => (
                <a key={m.id} href={`#m-${m.id}`}>
                  {kindInfo(m.kind).icon} {m.title || kindLabel(m.kind, track.curriculum)}
                </a>
              ))}
            </nav>

            {materials.map((m) => {
              const info = kindInfo(m.kind);
              const label = kindLabel(m.kind, track.curriculum);
              const unlocked = canAccess(member, m.access);
              const embed = m.video_url ? embedUrl(m.video_url) : null;

              return (
                <section className="material" id={`m-${m.id}`} key={m.id}>
                  <header>
                    <span className="mat-icon">{info.icon}</span>
                    <div className="grow">
                      <b>{m.title || label}</b>
                      {m.title && <small>{label}</small>}
                    </div>
                    {m.access !== 'public' && (
                      <span className={`badge ${ACCESS_LABELS[m.access].cls}`}>
                        {ACCESS_LABELS[m.access].short}
                      </span>
                    )}
                  </header>

                  {!unlocked ? (
                    <div className="lock-box">
                      <div className="lock-icon">🔒</div>
                      <b>{lockReason(member, m.access)}</b>
                      <div className="row-flex" style={{ justifyContent: 'center', marginTop: 12 }}>
                        {!member && <Link href="/auth/register" className="btn btn-sm btn-primary">سجّل مجاناً</Link>}
                        {member && m.access === 'student' && (
                          <Link href="/book" className="btn btn-sm btn-primary">احجز حصة</Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mat-body">
                      {m.body && <p className="mat-text">{m.body}</p>}

                      {embed && (
                        <div className="video-wrap">
                          <iframe
                            src={embed}
                            title={m.title || label}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {m.video_url && !embed && (
                        <a href={m.video_url} target="_blank" rel="noopener" className="btn btn-sm btn-light">
                          🎥 افتح الفيديو
                        </a>
                      )}

                      {m.resource && (
                        <a
                          href={`/api/resources/${m.resource.id}/download`}
                          className="mat-file"
                        >
                          <span>⬇</span>
                          <span className="grow">
                            <b>{m.resource.file_name}</b>
                            <small>
                              {fmtFileSize(m.resource.file_size)} · {fmtNumAr(m.resource.downloads)} تحميل
                            </small>
                          </span>
                          <span className="btn btn-sm btn-primary">تحميل</span>
                        </a>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </>
        )}

        <div className="lesson-nav">
          {prev ? (
            <Link href={`/lesson/${prev.slug}`} className="btn btn-light">→ {prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link href={`/lesson/${next.slug}`} className="btn btn-navy">{next.title} ←</Link>
          ) : <span />}
        </div>

        <div className="teach-cta card" style={{ marginTop: 24 }}>
          <div>
            <b>ما زال الدرس صعب؟</b>
            <p className="muted small" style={{ margin: 0 }}>احجز حصة خصوصية على هذا الدرس بالذات.</p>
          </div>
          <Link href="/book" className="btn btn-navy">احجز حصة</Link>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
