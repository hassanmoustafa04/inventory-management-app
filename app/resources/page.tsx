import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ResourceCard from '@/components/ResourceCard';
import { LEVELS, RESOURCE_TYPES, SUBJECTS, getSetting } from '@/lib/db';
import { listPublishedResources } from '@/lib/resources';
import { currentMember, allowedTiers } from '@/lib/members';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'مكتبة الفيزياء — IGCSE و A Level' };

type SP = { subject?: string; level?: string; type?: string; q?: string };

function buildHref(sp: SP, patch: Partial<SP>) {
  const next = { ...sp, ...patch };
  const qs = Object.entries(next)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `/resources${qs ? `?${qs}` : ''}`;
}

export default function ResourcesPage({ searchParams }: { searchParams: SP }) {
  const resources = listPublishedResources(searchParams);
  const member = currentMember();
  const tiers = allowedTiers(member);
  const hasFilters = Boolean(
    searchParams.subject || searchParams.level || searchParams.type || searchParams.q
  );

  return (
    <>
      <SiteHeader active="resources" />

      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">📚 المكتبة التعليمية</span>
          <h1>عروض فيزياء، خطط دروس، وأوراق عمل — جاهزة للتحميل</h1>
          <p>{getSetting('hub_intro')}</p>
          <form className="res-search" action="/resources">
            {searchParams.subject && <input type="hidden" name="subject" value={searchParams.subject} />}
            {searchParams.level && <input type="hidden" name="level" value={searchParams.level} />}
            {searchParams.type && <input type="hidden" name="type" value={searchParams.type} />}
            <input
              className="input"
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="ابحث عن وحدة، موضوع، أو نوع ملف…"
            />
            <button className="btn btn-primary" type="submit">بحث</button>
          </form>
        </div>
      </section>

      <div className="container" style={{ padding: '30px 20px 70px' }}>
        <div className="filters">
          <div className="filter-row">
            <span className="filter-label">المادة</span>
            <Link href={buildHref(searchParams, { subject: '' })} className={!searchParams.subject ? 'on' : ''}>الكل</Link>
            {SUBJECTS.map((s) => (
              <Link key={s} href={buildHref(searchParams, { subject: s })} className={searchParams.subject === s ? 'on' : ''}>
                {s}
              </Link>
            ))}
          </div>
          <div className="filter-row">
            <span className="filter-label">المستوى</span>
            <Link href={buildHref(searchParams, { level: '' })} className={!searchParams.level ? 'on' : ''}>الكل</Link>
            {LEVELS.map((l) => (
              <Link key={l} href={buildHref(searchParams, { level: l })} className={searchParams.level === l ? 'on' : ''}>
                {l}
              </Link>
            ))}
          </div>
          <div className="filter-row">
            <span className="filter-label">النوع</span>
            <Link href={buildHref(searchParams, { type: '' })} className={!searchParams.type ? 'on' : ''}>الكل</Link>
            {RESOURCE_TYPES.map((t) => (
              <Link key={t.key} href={buildHref(searchParams, { type: t.key })} className={searchParams.type === t.key ? 'on' : ''}>
                {t.icon} {t.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="spread" style={{ margin: '20px 0 16px' }}>
          <span className="muted small">{fmtNumAr(resources.length)} ملف</span>
          {hasFilters && (
            <Link href="/resources" className="btn btn-sm btn-light">مسح عوامل التصفية</Link>
          )}
        </div>

        {!member && (
          <div className="notice">
            🔓 أنت تتصفح كزائر — سجّل حساباً مجانياً لفتح ملفات الأعضاء.{' '}
            <Link href="/auth/register"><b>سجّل الآن</b></Link>
          </div>
        )}
        {member?.role === 'teacher' && member.status === 'pending' && (
          <div className="notice">
            ⏳ طلب انضمامك لشبكة المعلمين قيد المراجعة — ملفات المعلمين ستُفتح بعد الموافقة.
          </div>
        )}

        {resources.length === 0 ? (
          <div className="empty">
            <div className="big">🔍</div>
            ما لقينا ملفات بهذي المواصفات — جرّب تصفية أخرى.
          </div>
        ) : (
          <div className="res-grid">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}

        <div className="cta-band" style={{ marginTop: 46 }}>
          <h2>عندك ملفات تستاهل تنشر؟</h2>
          <p>انضم لشبكة المعلمين وشارك موادك مع معلمين وطلاب آخرين.</p>
          <Link href="/auth/register?role=teacher" className="btn btn-primary btn-lg">
            انضم كمعلم
          </Link>
        </div>
        <p className="muted small" style={{ textAlign: 'center', marginTop: 14 }}>
          مستوى وصولك الحالي: {tiers.length === 1 ? 'الملفات المجانية فقط' : `${fmtNumAr(tiers.length)} مستويات`}
        </p>
      </div>

      <SiteFooter />
    </>
  );
}
