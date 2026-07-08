import Link from 'next/link';
import Atom from '@/components/Atom';
import { activeOfferings, getSettings } from '@/lib/db';
import { fmtDurationAr, fmtKWD, fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

const GRADES = [
  'الصف العاشر',
  'الحادي عشر — علمي',
  'الثاني عشر — علمي',
  'IGCSE / GCSE',
  'SAT Physics',
  'فيزياء جامعية',
];

const FEATURES = [
  {
    icon: '🎯',
    title: 'خبرة بمناهج الكويت',
    body: 'أكثر من ١٠ سنوات مع منهج وزارة التربية والمناهج الأجنبية — أعرف أسئلة الاختبارات قبل ما تجي.',
  },
  {
    icon: '🧠',
    title: 'نفهم قبل ما نحفظ',
    body: 'الفيزياء مو قوانين تنحفظ، هي أفكار تنفهم. أبسّط لك الفكرة لين تقدر تشرحها أنت بنفسك.',
  },
  {
    icon: '💻',
    title: 'أونلاين أو حضوري',
    body: 'حصص مباشرة بسبورة تفاعلية من بيتك، أو حضورياً — أنت تختار الطريقة اللي تناسبك.',
  },
  {
    icon: '📈',
    title: 'متابعة مستمرة',
    body: 'ملخص بعد كل حصة، واجبات قصيرة، وتقرير دوري لولي الأمر عن مستوى الطالب.',
  },
];

const TESTIMONIALS = [
  {
    text: 'كنت أعتبر الفيزياء أصعب مادة، وبعد شهرين صارت أعلى درجاتي. طريقة الشرح تخليك تحس إن كل شي منطقي.',
    who: 'عبدالله الفارس',
    meta: 'الثاني عشر علمي — ثانوية اليرموك',
  },
  {
    text: 'الحصص الأونلاين كانت أفضل من الحضوري الصراحة، السبورة التفاعلية والملخصات وفرت علي وقت طويل.',
    who: 'نورة العنزي',
    meta: 'IGCSE — المدرسة الإنجليزية',
  },
  {
    text: 'بنتي تحسنت من D إلى A في اختبار الفيزياء خلال فصل واحد. المتابعة والتقارير كانت ممتازة.',
    who: 'أم دانة',
    meta: 'ولية أمر — الحادي عشر علمي',
  },
];

const FAQ = [
  {
    q: 'كيف تتم الحصص الأونلاين؟',
    a: 'عبر مكالمة فيديو مع سبورة تفاعلية أكتب عليها مباشرة. تشوف كل شي أول بأول وتقدر تسأل بأي لحظة، وبعد الحصة يوصلك ملخص PDF بكل اللي شرحناه.',
  },
  {
    q: 'كيف أدفع؟',
    a: 'بعد تأكيد الحجز أرسل لك رابط دفع (KNET) عبر الواتساب، أو تقدر تدفع نقداً في الحصص الحضورية. الدفع دائماً بعد التأكيد — ما تدفع شي وقت الحجز.',
  },
  {
    q: 'هل أقدر ألغي أو أعدّل الحجز؟',
    a: 'أكيد. من صفحة الحجز تقدر تلغي بأي وقت قبل الحصة بـ ٦ ساعات بدون أي رسوم، وتحجز موعد ثاني يناسبك.',
  },
  {
    q: 'وين تكون الحصص الحضورية؟',
    a: 'في مكتبي أو في بيت الطالب حسب المنطقة — نتفق على المكان عبر الواتساب بعد تأكيد الحجز.',
  },
  {
    q: 'هل تعطي حصة تجريبية؟',
    a: 'أول حصة أونلاين تعتبر تجريبية: إذا ما عجبك الأسلوب، ما تدفع شي. هدفي إنك ترتاح للطريقة قبل ما تلتزم.',
  },
];

export default function LandingPage() {
  const settings = getSettings();
  const offerings = activeOfferings();
  const wa = settings.whatsapp || '96550000000';
  const waHref = `https://wa.me/${wa}?text=${encodeURIComponent('السلام عليكم أستاذ، أبي أستفسر عن دروس الفيزياء')}`;

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="brand">
            <Atom />
            <span>
              فيزياء مع {settings.teacher_name?.replace('أ. ', 'أ. ') || 'الأستاذ'}
            </span>
          </Link>
          <nav className="topnav">
            <a className="navlink" href="#why">
              ليش معي؟
            </a>
            <a className="navlink" href="#pricing">
              الأسعار
            </a>
            <a className="navlink" href="#faq">
              أسئلة شائعة
            </a>
            <Link href="/book" className="btn btn-primary btn-sm">
              احجز حصتك
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <span className="formula" style={{ top: '12%', insetInlineEnd: '6%' }}>
          F = ma
        </span>
        <span className="formula" style={{ bottom: '18%', insetInlineEnd: '18%', fontSize: '2.2rem' }}>
          E = mc²
        </span>
        <span className="formula" style={{ top: '55%', insetInlineStart: '4%', fontSize: '1.8rem' }}>
          v = λf
        </span>
        <span className="orbit" style={{ width: 420, height: 420, top: -140, insetInlineStart: -120 }} />
        <span className="orbit" style={{ width: 300, height: 300, bottom: -100, insetInlineEnd: -80 }} />

        <div className="container">
          <div className="hero-inner">
            <span className="eyebrow">⚛️ مناهج وزارة التربية الكويتية + IGCSE + SAT</span>
            <h1>
              الفيزياء ما تحتاج حفظ…
              <br />
              تحتاج <span className="hl">أستاذ يفهّمك</span>
            </h1>
            <p className="sub">
              {settings.bio ||
                'دروس فيزياء خصوصية للثانوية العامة والمناهج الأجنبية — أونلاين أو حضورياً في الكويت.'}
            </p>
            <div className="hero-ctas">
              <Link href="/book" className="btn btn-primary btn-lg">
                احجز حصتك الآن — خلال دقيقة
              </Link>
              <a href={waHref} target="_blank" rel="noopener" className="btn btn-ghost btn-lg">
                كلمني واتساب
              </a>
            </div>
            <div className="stats-strip">
              <div className="stat">
                <b>+{fmtNumAr(10)}</b>
                <span>سنوات خبرة</span>
              </div>
              <div className="stat">
                <b>+{fmtNumAr(400)}</b>
                <span>طالب وطالبة</span>
              </div>
              <div className="stat">
                <b>{fmtNumAr(96)}٪</b>
                <span>حسّنوا درجاتهم</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="why">
        <div className="container">
          <div className="section-head">
            <div className="kicker">ليش تدرس معي؟</div>
            <h2>مو مجرد حصة… خطة كاملة لدرجتك</h2>
            <p>كل طالب له طريقة، وشغلي إني ألقى الطريقة اللي توصلك للدرجة اللي تبيها.</p>
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

      <section className="section section-alt" id="how">
        <div className="container">
          <div className="section-head">
            <div className="kicker">طريقة الحجز</div>
            <h2>ثلاث خطوات وتكون حجزت</h2>
            <p>بدون تسجيل حساب وبدون مكالمات — كل شي أونلاين.</p>
          </div>
          <div className="grid-3">
            <div className="feature step-card">
              <div className="step-num">١</div>
              <h3>اختر نوع الحصة</h3>
              <p>خصوصي أو مجموعة، أونلاين أو حضوري — والسعر واضح قدامك من البداية.</p>
            </div>
            <div className="feature step-card">
              <div className="step-num">٢</div>
              <h3>اختر الموعد المناسب</h3>
              <p>تشوف جدولي الفعلي وتختار اليوم والساعة اللي تناسبك — بدون أخذ ورد.</p>
            </div>
            <div className="feature step-card">
              <div className="step-num">٣</div>
              <h3>يوصلك التأكيد</h3>
              <p>اكتب اسمك ورقم واتسابك وبس. أأكد لك الحجز وأرسل كل التفاصيل على الواتساب.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <div className="kicker">الباقات والأسعار</div>
            <h2>أسعار واضحة، بدون مفاجآت</h2>
            <p>الدفع بعد تأكيد الحجز — عبر لينك KNET أو نقداً.</p>
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

      <section className="section section-alt" id="grades">
        <div className="container">
          <div className="section-head">
            <div className="kicker">الصفوف والمناهج</div>
            <h2>أدرّس هذي المراحل</h2>
          </div>
          <div className="chips">
            {GRADES.map((g) => (
              <span className="chip" key={g}>
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="reviews">
        <div className="container">
          <div className="section-head">
            <div className="kicker">آراء الطلاب وأولياء الأمور</div>
            <h2>النتائج تتكلم</h2>
          </div>
          <div className="grid-3">
            {TESTIMONIALS.map((t) => (
              <div className="quote" key={t.who}>
                <div className="stars">★★★★★</div>
                <p>«{t.text}»</p>
                <div className="who">
                  {t.who}
                  <small>{t.meta}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="faq">
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
            <h2>جاهز ترفع درجتك في الفيزياء؟</h2>
            <p>المواعيد القريبة تنحجز بسرعة — خصوصاً قبل فترة الاختبارات.</p>
            <Link href="/book" className="btn btn-primary btn-lg">
              احجز حصتك الآن
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <b style={{ color: '#fff' }}>{settings.teacher_name}</b> — {settings.tagline}
            <div className="small">📍 {settings.location}</div>
          </div>
          <div className="row-flex">
            <a href={waHref} target="_blank" rel="noopener">
              واتساب
            </a>
            <span style={{ opacity: 0.3 }}>|</span>
            <Link href="/teacher/login">دخول المعلم</Link>
          </div>
        </div>
      </footer>

      <a href={waHref} target="_blank" rel="noopener" className="wa-float" aria-label="تواصل عبر واتساب">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-2.9-1.3-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .5l-.4.6c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.9 1.7 1.2 2 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.2 1.3Z" />
        </svg>
      </a>
    </>
  );
}
