'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import Atom from '@/components/Atom';
import { registerAction } from '@/lib/actions';
import { SUBJECTS } from '@/lib/constants';

function SubmitBtn({ role }: { role: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-navy btn-block" disabled={pending}>
      {pending ? '⏳ لحظة…' : role === 'teacher' ? 'أرسل طلب الانضمام' : 'أنشئ حسابي'}
    </button>
  );
}

function RegisterForm() {
  const params = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'teacher' ? 'teacher' : 'student');
  const [state, formAction] = useFormState(registerAction, { error: '' });

  return (
    <div className="login-wrap">
      <div className="login-card" style={{ maxWidth: 520 }}>
        <div className="brand" style={{ display: 'flex', justifyContent: 'center' }}>
          <Atom className="atom" />
        </div>
        <h1 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 900, marginBottom: 16 }}>
          إنشاء حساب مجاني
        </h1>

        <div className="role-switch">
          <button
            type="button"
            className={role === 'student' ? 'on' : ''}
            onClick={() => setRole('student')}
          >
            🎓 طالب
          </button>
          <button
            type="button"
            className={role === 'teacher' ? 'on' : ''}
            onClick={() => setRole('teacher')}
          >
            🧑‍🏫 معلم
          </button>
        </div>

        <p className="muted small" style={{ textAlign: 'center', margin: '12px 0 18px' }}>
          {role === 'student'
            ? 'حساب الطالب يفتح لك ملفات الأعضاء فوراً.'
            : 'طلبات المعلمين تُراجع يدوياً — بعد الموافقة تفتح لك ملفات المعلمين وتقدر تشارك موادك.'}
        </p>

        {state.error && <div className="form-error">{state.error}</div>}

        <form action={formAction}>
          <input type="hidden" name="role" value={role} />
          <div className="field">
            <label htmlFor="r-name">الاسم الكامل *</label>
            <input id="r-name" name="name" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="r-email">البريد الإلكتروني *</label>
            <input id="r-email" name="email" type="email" className="input ltr" required />
          </div>
          <div className="field">
            <label htmlFor="r-phone">رقم الواتساب {role === 'student' ? '(مهم لربط حجوزاتك)' : ''}</label>
            <input id="r-phone" name="phone" className="input ltr" placeholder="5XXXXXXX" inputMode="tel" />
          </div>
          <div className="field">
            <label htmlFor="r-pass">كلمة المرور * (٨ أحرف على الأقل)</label>
            <input id="r-pass" name="password" type="password" className="input ltr" minLength={8} required />
          </div>

          {role === 'teacher' && (
            <>
              <div className="field">
                <label htmlFor="r-school">المدرسة / جهة العمل *</label>
                <input id="r-school" name="school" className="input" required />
              </div>
              <div className="field">
                <label>المواد اللي تدرّسها</label>
                <div className="check-row">
                  {SUBJECTS.map((s) => (
                    <label key={s} className="check-chip">
                      <input type="checkbox" name="subjects" value={s} /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="r-bio">نبذة مختصرة عنك</label>
                <textarea id="r-bio" name="bio" className="textarea" placeholder="خبرتك، المناهج اللي تدرّسها…" />
              </div>
            </>
          )}

          <SubmitBtn role={role} />
        </form>

        <p className="small" style={{ textAlign: 'center', marginTop: 18 }}>
          عندك حساب؟ <Link href="/auth/login"><b>سجّل الدخول</b></Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="login-wrap"><div className="login-card">جاري التحميل…</div></div>}>
      <RegisterForm />
    </Suspense>
  );
}
