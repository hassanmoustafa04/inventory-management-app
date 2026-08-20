import { getDb, getSettings, sha256 } from './db';
import { fmtNumAr } from './kwtime';

export const DEFAULT_PASSWORD = 'teacher123';
export const PLACEHOLDER_WHATSAPP = '96550000000';

export type SetupStep = {
  key: string;
  title: string;
  why: string;
  href: string;
  cta: string;
  done: boolean;
  critical: boolean;
};

/**
 * The first-run checklist. Every step is derived from real data — nothing is a
 * checkbox the teacher can tick without actually doing the thing.
 */
export function setupSteps(): SetupStep[] {
  const db = getDb();
  const s = getSettings();

  const ownFiles = (db
    .prepare('SELECT COUNT(*) AS c FROM resources WHERE author_id IS NULL AND is_sample = 0')
    .get() as { c: number }).c;
  const samples = (db
    .prepare('SELECT COUNT(*) AS c FROM resources WHERE is_sample = 1')
    .get() as { c: number }).c;

  return [
    {
      key: 'password',
      title: 'غيّري كلمة المرور',
      why: 'الحساب الآن على كلمة مرور افتراضية يعرفها أي أحد — هذي أول خطوة ضرورية.',
      href: '/teacher/settings#password',
      cta: 'تغيير كلمة المرور',
      done: s.password_hash !== sha256(DEFAULT_PASSWORD),
      critical: true,
    },
    {
      key: 'whatsapp',
      title: 'أضيفي رقم الواتساب',
      why: 'كل أزرار التواصل في الموقع تروح لهذا الرقم — بدونه ما يقدر أحد يوصلك.',
      href: '/teacher/settings',
      cta: 'إضافة الرقم',
      done: Boolean(s.whatsapp) && s.whatsapp !== PLACEHOLDER_WHATSAPP,
      critical: true,
    },
    {
      key: 'profile',
      title: 'اكتبي نبذتك بكلماتك',
      why: 'النبذة تظهر في الصفحة الرئيسية وهي أول شي يقرأه الطالب أو ولي الأمر عنك.',
      href: '/teacher/settings',
      cta: 'تعديل النبذة',
      done: s.setup_profile === '1',
      critical: false,
    },
    {
      key: 'schedule',
      title: 'ثبّتي أوقاتك الأسبوعية',
      why: 'الطلاب يحجزون داخل هذي الأوقات فقط — عدّليها لتطابق جدولك الحقيقي.',
      href: '/teacher/schedule',
      cta: 'ضبط الجدول',
      done: s.setup_schedule === '1',
      critical: true,
    },
    {
      key: 'pricing',
      title: 'راجعي الأسعار والباقات',
      why: 'الأسعار الحالية افتراضية — حدّثيها وعطّلي أي باقة ما تناسبك.',
      href: '/teacher/settings#pricing',
      cta: 'مراجعة الأسعار',
      done: s.setup_pricing === '1',
      critical: true,
    },
    {
      key: 'upload',
      title: 'ارفعي أول ملفاتك',
      why: 'المكتبة هي اللي تجيب لك طلاب — كل ملف صفحة جديدة يلقاها الطالب في البحث.',
      href: '/teacher/resources/new',
      cta: 'رفع ملفات',
      done: ownFiles > 0,
      critical: true,
    },
    {
      key: 'samples',
      title: 'احذفي الملفات التجريبية',
      why: `المكتبة فيها ${fmtNumAr(samples)} ملف تجريبي جاي مع الموقع — احذفيها بعد ما ترفعين ملفاتك.`,
      href: '/teacher/resources',
      cta: 'حذف الملفات التجريبية',
      done: samples === 0,
      critical: false,
    },
  ];
}

export function setupProgress() {
  const steps = setupSteps();
  const done = steps.filter((s) => s.done).length;
  return {
    steps,
    done,
    total: steps.length,
    complete: done === steps.length,
    blockers: steps.filter((s) => s.critical && !s.done).length,
  };
}
