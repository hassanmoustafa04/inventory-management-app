import Link from 'next/link';
import { getSetting } from '@/lib/db';
import { setupProgress } from '@/lib/setup';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function SetupPage() {
  const { steps, done, total, complete } = setupProgress();
  const pct = Math.round((done / total) * 100);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>خطوات التجهيز</h1>
          <div className="sub">
            {complete
              ? 'كل شي جاهز — موقعك يشتغل بالكامل 🎉'
              : 'سبع خطوات وموقعك يصير جاهز تماماً للطلاب'}
          </div>
        </div>
        <Link href="/teacher" className="btn btn-sm btn-light">الرئيسية</Link>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="spread" style={{ marginBottom: 10 }}>
          <b>أنجزتِ {fmtNumAr(done)} من {fmtNumAr(total)}</b>
          <b style={{ color: complete ? 'var(--green)' : 'var(--amber-deep)' }}>{fmtNumAr(pct)}٪</b>
        </div>
        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="stack">
        {steps.map((step, i) => (
          <div className={`setup-step ${step.done ? 'done' : ''}`} key={step.key}>
            <span className="step-mark">{step.done ? '✓' : fmtNumAr(i + 1)}</span>
            <div className="step-body">
              <b>
                {step.title}
                {step.critical && !step.done && <span className="req">مهمة</span>}
              </b>
              <p>{step.why}</p>
            </div>
            {step.done ? (
              <span className="badge badge-confirmed">تم</span>
            ) : (
              <Link href={step.href} className="btn btn-sm btn-navy">{step.cta}</Link>
            )}
          </div>
        ))}
      </div>

      {complete && (
        <div className="cta-band" style={{ marginTop: 26 }}>
          <h2>موقعك جاهز 🎉</h2>
          <p>شاركي رابط الموقع في مجموعات الواتساب وحسابات التواصل — وابدئي تستقبلين حجوزات.</p>
          <Link href="/" className="btn btn-primary btn-lg">شوفي موقعك</Link>
        </div>
      )}

      <div className="card" style={{ marginTop: 26 }}>
        <h3 style={{ marginBottom: 10 }}>💡 نصائح تخلي مكتبتك تشتغل لصالحك</h3>
        <ul className="tips">
          <li>
            <b>خلي أغلب ملفاتك «متاح للجميع».</b> الملف المجاني ينتشر في مجموعات
            الواتساب ويجيب لك طلاب ما يعرفونك — هذا أقوى تسويق ممكن.
          </li>
          <li>
            <b>استخدمي «للأعضاء» للملفات القوية.</b> الطالب يسجّل حساب مجاني عشان
            يحمّلها، وأنتِ تحصلين على قائمة تواصل حقيقية.
          </li>
          <li>
            <b>«لطلابي» تنفتح تلقائياً</b> لأي طالب عنده حصة مؤكدة معك — ما تحتاجين
            تسوين شي يدوياً.
          </li>
          <li>
            <b>«للمعلمين» لخطط الدروس</b> وتوزيع المنهج — أشياء ما تنفع تنشر للطلاب.
          </li>
          <li>
            <b>عنوان واضح = طالب يلقاك.</b> اكتبي «الكهرباء — عرض تقديمي IGCSE» بدل
            «عرض ١».
          </li>
        </ul>
      </div>
    </>
  );
}
