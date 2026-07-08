'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import Atom from '@/components/Atom';
import { loginAction } from '@/lib/actions';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-navy btn-block" disabled={pending}>
      {pending ? '⏳ لحظة…' : 'تسجيل الدخول'}
    </button>
  );
}

export default function TeacherLoginPage() {
  const [state, formAction] = useFormState(loginAction, { error: '' });

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ display: 'flex', justifyContent: 'center' }}>
          <Atom className="atom" />
        </div>
        <h1 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 900, marginBottom: 4 }}>
          لوحة تحكم المعلم
        </h1>
        <p className="muted small" style={{ textAlign: 'center', marginBottom: 22 }}>
          هذي الصفحة خاصة بالمعلم فقط
        </p>

        {state?.error && <div className="form-error">{state.error}</div>}

        <form action={formAction}>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input ltr"
              autoFocus
              required
            />
          </div>
          <SubmitBtn />
        </form>

        <p className="small" style={{ textAlign: 'center', marginTop: 18 }}>
          <Link href="/" className="muted">
            ← الرجوع للموقع
          </Link>
        </p>
      </div>
    </div>
  );
}
