import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ResourceCard from '@/components/ResourceCard';
import { activeOfferings, getDb, getSettings, RESOURCE_TYPES } from '@/lib/db';
import { listPublishedResources } from '@/lib/resources';
import { fmtDurationAr, fmtKWD, fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

const FEATURES = [
  {
    icon: '📚',
    title: 'مكتبة مفتوحة',
    body: 'عروض تقديمية وملخصات وأوراق عمل جاهزة للتحميل — كثير منها مجاني للجميع.',
  },
  {
    icon: '🎯',
    title: 'مبنية على منهج IGCSE',
    body: 'كل ملف مربوط بوحدة محددة من المنهج، مو مواد عامة منقولة من الإنترنت.',
  },
  {
    icon: '🧑‍🏫',
    title: 'حصص خصوصية',
    body: 'تبي شرح مباشر؟ احجز حصة أونلاين أو حضورياً مع نفس المعلمة اللي أعدّت المواد.',
  },
  {
    icon: '🤝',
    title: 'شبكة معلمين',
    body: 'معلمون معتمدون يشاركون خططهم ومواردهم — بمراجعة قبل النشر للحفاظ على الجودة.',
  },
];

const FAQ = [
  {
    q: 'هل تحميل الملفات مجاني؟',
    a: 'أغلب الملفات مجانية تماماً وبدون تسجيل. بعض الملفات المتقدمة تحتاج حساباً مجانياً، وملفات معينة مخصصة لطلابي المسجّلين في الحصص أو للمعلمين المعتمدين في الشبكة.',
  },
  {
    q: 'كيف تتم الحصص الأونلاين؟',
    a: 'عبر مكالمة فيديو مع سبورة تفاعلية. بعد الحصة يوصلك ملخص وملفات الوحدة اللي شرحناها.',
  },
  {
    q: 'أنا معلم — كيف أنضم للشبكة؟',
    a: 'قدّم طلب انضمام من صفحة شبكة المعلمين. بعد مراجعة الطلب تُفتح لك ملفات المعلمين وتقدر تشارك موادك، وكل ملف تشاركه يُراجع قبل نشره.',
  },
  {
    q: 'كيف أدفع رسوم الحصص؟',
    a: 'بعد تأكيد الحجز يوصلك رابط دفع (KNET) على الواتساب، أو تدفع نقداً في الحصص الحضورية. ما تدفع شي وقت الحجز.',
  },
  {
    q: 'هل تعطي حصة تجريبية؟',
    a: 'أول حصة أونلاين تجريبية — إذا ما ناسبك الأسلوب، ما تدفع شي.',
  },
];

export default function LandingPage() {
  const s = getSettings();
  const offerings = activeOfferings();
  const featured = listPublishedResources().slice(0, 3);
  const db = getDb();
  const counts = db
    .prepare("SELECT COUNT(*) AS files, COALESCE(SUM(downloads),0) AS dl FROM resources WHERE status = 'published'")
    .get() as { files: number; dl: number };
  const teacherCount = (db
    .prepare("SELECT COUNT(*) AS c FROM members WHERE role = 'teacher' AND status = 'active'")
    .get() as { c: number }).c;

  const waHref = `https://wa.me/${s.whatsapp}?text=${encodeURIComponent('السلام عليكم، أبي أستفسر عن الحصص')}`;

  return (
    <>
      <SiteHeader />

      <section className="hero">
        <span className="formula" style={{ top: '12%', insetInlineEnd: '6%' }}>F = ma</span>
        <span className="formula" style={{ bottom: '20%', insetInlineEnd: '20%', fontSize: '2.2rem' }}>E = mc²</span>
        <span className="formula" style={{ top: '58%', insetInlineStart: '4%', fontSize: '1.8rem' }}>PV = nRT</span>
        <span className="orbit" style={{ width: 420, height: 420, top: -140, insetInlineStart: -120 }} />
        <span className="orbit" style={{ width: 300, height: 300, bottom: -100, insetInlineEnd: -80 }} />

        <div className="container">
          <div className="hero-inner">
            <span className="eyebrow">⚛️ IGCSE · AS / A Level — الكويت</span>
            <h1>
              مكتبة مواد IGCSE…
              <br />
              و<span className="hl">معلمة تشرحها لك</span>
            </h1>
            <p className="sub">{s.bio}</p>
            <div className="hero-ctas">
              <Link href="/resources" className="btn btn-primary btn-lg">
                📚 تصفّح المكتبة مجاناً
              </Link>
              <Link href="/book" className="btn btn-ghost btn-lg">احجز حصة</Link>
            </div>
            <div className="stats-strip">
              <div className="stat">
                <b>{fmtNumAr(counts.files)}</b>
                <span>ملف تعليمي</span>
              </div>
              <div className="stat">
                <b>{fmtNumAr(counts.dl)}</b>
                <span>مرة تحميل</span>
              </div>
              <div className="stat">
                <b>{fmtNumAr(teacherCount + 1)}</b>
                <span>معلم في الشبكة</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="kicker">شنو تلقى هنا؟</div>
            <h2>مكتبة تتعلم منها… ومعلمة توصلك للدرجة</h2>
            <p>ابدأ بالملفات المجانية، وإذا احتجت شرح مباشر احجز حصة.</p>
          </div>
          <div className="grid-4">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <div className="icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div className="kicker">من المكتبة</div>
              <h2>ملفات مختارة</h2>
              <p>حمّل مباشرة — أغلبها ما يحتاج تسجيل.</p>
            </div>
            <div className="res-grid">
              {featured.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 26 }}>
              <Link href="/resources" className="btn btn-navy btn-lg">شوف كل الملفات</Link>
            </div>
            <div className="chips" style={{ marginTop: 24 }}>
              {RESOURCE_TYPES.map((t) => (
                <Link key={t.key} href={`/resources?type=${t.key}`} className="chip">
                  {t.icon} {t.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <div className="kicker">الحصص والأسعار</div>
            <h2>أسعار واضحة، بدون مفاجآت</h2>
            <p>الدفع بعد تأكيد الحجز — عبر KNET أو نقداً.</p>
          </div>
          <div className="grid-4">
            {offerings.map((o) => (
              <div className="price-card" key={o.id}>
                <span className={`mode-tag ${o.mode === 'online' ? 'mode-online' : 'mode-inperson'}`}>
                  {o.mode === 'online' ? '🖥️ أونلاين' : '🏠 حضوري'}
                </span>
                <h3>{o.name_ar}</h3>
                <p className="desc">{o.desc_ar}</p>
                <div className="price">
                  {fmtKWD(o.price_kwd)} {o.kind === 'group' && <small>/ للطالب</small>}
                </div>
                <div className="dur">مدة الحصة: {fmtDurationAr(o.duration_min)}</div>
                <Link href={`/book?offering=${o.slug}`} className="btn btn-navy btn-block">
                  احجز هذي الباقة
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: 30 }}>
            <div>
              <div className="kicker" style={{ color: 'var(--amber-deep)', fontWeight: 800 }}>
                للمعلمين
              </div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '6px 0 12px' }}>
                معلم IGCSE؟ انضم للشبكة
              </h2>
              <p style={{ color: 'var(--ink-2)', marginBottom: 20 }}>
                وصول لخطط الدروس وتوزيع المناهج ومواد المعلمين، وفرصة تشارك موادك مع
                معلمين وطلاب غيرك. الطلبات تُراجع يدوياً — الشبكة صغيرة ومختارة عن قصد.
              </p>
              <div className="row-flex">
                <Link href="/auth/register?role=teacher" className="btn btn-primary">قدّم طلب انضمام</Link>
                <Link href="/teachers" className="btn btn-light">اعرف أكثر</Link>
              </div>
            </div>
            <div className="stack">
              <div className="feature"><div className="icon">🗒️</div><h3>خطط دروس جاهزة</h3><p>خطط أسبوعية وتوزيع منهج لسنة كاملة.</p></div>
              <div className="feature"><div className="icon">✅</div><h3>مراجعة قبل النشر</h3><p>كل مشاركة تمر على مراجعة — الجودة قبل الكمية.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container-narrow">
          <div className="section-head">
            <div className="kicker">أسئلة شائعة</div>
            <h2>كل اللي تبي تعرفه</h2>
          </div>
          {FAQ.map((f) => (
            <details className="faq-item" key={f.q}>
              <summary>{f.q}</summary>
              <div className="faq-body">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2>ابدأ من ملف… وكمّل بحصة</h2>
            <p>حمّل الملفات المجانية اليوم، واحجز حصتك إذا احتجت شرح مباشر.</p>
            <div className="row-flex" style={{ justifyContent: 'center' }}>
              <Link href="/resources" className="btn btn-primary btn-lg">تصفّح المكتبة</Link>
              <Link href="/book" className="btn btn-ghost btn-lg">احجز حصة</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <a href={waHref} target="_blank" rel="noopener" className="wa-float" aria-label="تواصل عبر واتساب">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-2.9-1.3-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .5l-.4.6c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.9 1.7 1.2 2 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.2 1.3Z" />
        </svg>
      </a>
    </>
  );
}
