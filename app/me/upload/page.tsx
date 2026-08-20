'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import SiteHeaderClient from '@/components/SiteHeaderClient';
import ResourceForm from '@/components/ResourceForm';
import { submitResourceAction } from '@/lib/actions';

export default function MemberUploadPage() {
  const [state, formAction] = useFormState(submitResourceAction, { error: '' });

  return (
    <>
      <SiteHeaderClient />
      <div className="container-narrow" style={{ padding: '30px 20px 70px' }}>
        <Link href="/me" className="muted small">← رجوع لحسابي</Link>
        <div className="card" style={{ marginTop: 14 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 6 }}>
            شارك ملفاً في المكتبة
          </h1>
          <p className="muted small" style={{ marginBottom: 20 }}>
            كل ملف يُراجع قبل النشر للحفاظ على جودة المكتبة — عادةً خلال يوم.
          </p>
          {state.error && <div className="form-error">{state.error}</div>}
          <form action={formAction}>
            <ResourceForm submitLabel="أرسل للمراجعة" />
          </form>
        </div>
      </div>
    </>
  );
}
