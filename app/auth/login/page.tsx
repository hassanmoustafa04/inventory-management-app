'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import Atom from '@/components/Atom';
import { memberLoginAction } from '@/lib/actions';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-navy btn-block" disabled={pending}>
      {pending ? '⏳ لحظة…' : 'تسجيل الدخول'}
    </button>
  );
}

export default function MemberLoginPage() {
  const [state, formAction] = useFormState(memberLoginAction, { error: '' });
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ display: 'flex', justifyContent: 'center' }}>
          <Atom className="atom" />
        </div>
        <h1 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 900, marginBottom: 4 }}>
          دخول الأعضاء
        </h1>
        <p className="muted small" style={{ textAlign: 'center', marginBottom: 22 }}>
          ادخل لتحميل ملفات الأعضاء ومتابعة حجوزاتك
        </p>

        {state.error && <div className="form-error">{state.error}</div>}

        <form action={formAction}>
          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" className="input ltr" required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input id="password" name="password" type="password" className="input ltr" required />
          </div>
          <SubmitBtn />
        </form>

        <p className="small" style={{ textAlign: 'center', marginTop: 18 }}>
          ما عندك حساب؟ <Link href="/auth/register"><b>سجّل مجاناً</b></Link>
        </p>
        <p className="small" style={{ textAlign: 'center', marginTop: 8 }}>
          <Link href="/" className="muted">← الرجوع للموقع</Link>
        </p>
      </div>
    </div>
  );
}
