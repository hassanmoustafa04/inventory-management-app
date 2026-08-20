import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ResourceCard from '@/components/ResourceCard';
import { ACCESS_LABELS, getSetting, typeLabel } from '@/lib/db';
import { fmtFileSize, getResourceBySlug, relatedResources } from '@/lib/resources';
import { canAccess, currentMember, lockReason } from '@/lib/members';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const r = getResourceBySlug(params.slug);
  return { title: r ? `${r.title} — المكتبة` : 'الملف غير موجود' };
}

export default function ResourceDetailPage({ params }: { params: { slug: string } }) {
  const resource = getResourceBySlug(params.slug);
  if (!resource || resource.status !== 'published') notFound();

  const member = currentMember();
  const unlocked = canAccess(member, resource.access);
  const t = typeLabel(resource.type);
  const acc = ACCESS_LABELS[resource.access];
  const related = relatedResources(resource);
  const teacherName = getSetting('teacher_name');

  return (
    <>
      <SiteHeader active="resources" />

      <div className="container-narrow" style={{ padding: '30px 20px 70px' }}>
        <Link href="/resources" className="muted small">← رجوع للمكتبة</Link>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="row-flex" style={{ marginBottom: 12 }}>
            <span className="res-icon lg">{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div className="row-flex" style={{ gap: 8, marginBottom: 4 }}>
                <span className={`badge ${acc.cls}`}>{acc.label}</span>
                <span className="badge badge-cancelled">{t.label}</span>
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.45 }}>{resource.title}</h1>
            </div>
          </div>

          <p style={{ color: 'var(--ink-2)' }}>{resource.description}</p>

          <div className="summary-box" style={{ marginTop: 18 }}>
            <div className="row"><span>المادة</span><b>{resource.subject}</b></div>
            <div className="row"><span>المستوى</span><b>{resource.level}</b></div>
            <div className="row"><span>إعداد</span><b>{resource.author_name || teacherName}</b></div>
            <div className="row"><span>الملف</span><b>{fmtFileSize(resource.file_size)}</b></div>
            <div className="row"><span>مرات التحميل</span><b>{fmtNumAr(resource.downloads)}</b></div>
          </div>

          {unlocked ? (
            <a
              href={`/api/resources/${resource.id}/download`}
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 20 }}
            >
              ⬇ تحميل الملف
            </a>
          ) : (
            <div className="lock-box">
              <div className="lock-icon">🔒</div>
              <b>{lockReason(member, resource.access)}</b>
              <div className="row-flex" style={{ justifyContent: 'center', marginTop: 14 }}>
                {!member && (
                  <>
                    <Link href="/auth/register" className="btn btn-primary">سجّل مجاناً</Link>
                    <Link href="/auth/login" className="btn btn-light">لدي حساب</Link>
                  </>
                )}
                {member && resource.access === 'student' && (
                  <Link href="/book" className="btn btn-primary">احجز حصة</Link>
                )}
                {member && resource.access === 'teacher' && member.role !== 'teacher' && (
                  <Link href="/auth/register?role=teacher" className="btn btn-primary">
                    انضم كمعلم
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card teach-cta">
          <div>
            <b>تبي شرح مباشر لهذا الموضوع؟</b>
            <p className="muted small" style={{ margin: 0 }}>
              احجز حصة خصوصية مع {teacherName} — أونلاين أو حضورياً.
            </p>
          </div>
          <Link href="/book" className="btn btn-navy">احجز حصة</Link>
        </div>

        {related.length > 0 && (
          <>
            <h2 style={{ fontWeight: 900, fontSize: '1.1rem', margin: '30px 0 14px' }}>
              ملفات ذات صلة
            </h2>
            <div className="res-grid">
              {related.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          </>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
