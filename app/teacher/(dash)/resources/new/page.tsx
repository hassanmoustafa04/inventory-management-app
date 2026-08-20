'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import ResourceForm from '@/components/ResourceForm';
import { ownerCreateResourceAction } from '@/lib/actions';

export default function NewResourcePage() {
  const [state, formAction] = useFormState(ownerCreateResourceAction, { error: '' });
  return (
    <>
      <div className="page-head">
        <div>
          <h1>أضف ملفاً للمكتبة</h1>
          <div className="sub">ملفاتك تُنشر مباشرة بدون مراجعة</div>
        </div>
        <Link href="/teacher/resources" className="btn btn-sm btn-light">رجوع</Link>
      </div>
      <div className="mode-tabs">
        <Link href="/teacher/resources/new" className="on">ملف واحد بتفاصيله</Link>
        <Link href="/teacher/resources/bulk">مجموعة ملفات</Link>
      </div>

      <div className="card">
        {state.error && <div className="form-error">{state.error}</div>}
        <form action={formAction}>
          <ResourceForm withFeatured submitLabel="نشر الملف" />
        </form>
      </div>
    </>
  );
}
