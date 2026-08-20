'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { bulkUploadAction } from '@/lib/actions';
import { ACCESS_OPTIONS, LEVELS, RESOURCE_TYPES, SUBJECTS } from '@/lib/constants';

function Submit({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-navy btn-lg" disabled={pending || count === 0}>
      {pending ? '⏳ جاري الرفع…' : count > 0 ? `ارفعي ${count} ملف` : 'اختاري الملفات أولاً'}
    </button>
  );
}

export default function BulkUploadPage() {
  const [state, formAction] = useFormState(bulkUploadAction, { error: '', ok: '' });
  const [names, setNames] = useState<string[]>([]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>رفع مجموعة ملفات</h1>
          <div className="sub">عندك مجلد بوربوينتات؟ ارفعيها كلها مرة وحدة</div>
        </div>
        <Link href="/teacher/resources" className="btn btn-sm btn-light">رجوع</Link>
      </div>

      <div className="mode-tabs">
        <Link href="/teacher/resources/new">ملف واحد بتفاصيله</Link>
        <Link href="/teacher/resources/bulk" className="on">مجموعة ملفات</Link>
      </div>

      <div className="card">
        {state.error && <div className="form-error">{state.error}</div>}
        <p className="muted small" style={{ marginBottom: 18 }}>
          كل الملفات بتاخذ نفس المادة والمستوى والنوع ومستوى الوصول. عنوان كل ملف
          يتولّد من اسمه، وتقدرين تعدّلينه بعدين من المكتبة.
        </p>

        <form action={formAction}>
          <div className="grid-3">
            <div className="field">
              <label htmlFor="b-subject">المادة *</label>
              <select id="b-subject" name="subject" className="select" defaultValue="الفيزياء" required>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="b-level">المستوى *</label>
              <select id="b-level" name="level" className="select" defaultValue="IGCSE" required>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="b-type">نوع الملفات *</label>
              <select id="b-type" name="type" className="select" defaultValue="presentation" required>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>من يقدر يحمّلها؟ *</label>
            <div className="stack">
              {ACCESS_OPTIONS.map((o) => (
                <label key={o.key} className="access-opt">
                  <input type="radio" name="access" value={o.key} defaultChecked={o.key === 'public'} />
                  <span><b>{o.label}</b><small>{o.hint}</small></span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="b-files">الملفات *</label>
            <div className="bulk-drop">
              <input
                id="b-files"
                name="files"
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
                onChange={(e) => setNames(Array.from(e.target.files ?? []).map((f) => f.name))}
              />
              <div className="muted small" style={{ marginTop: 10 }}>
                تقدرين تختارين عدة ملفات مرة وحدة — PowerPoint أو PDF أو Word، حتى ٢٥ ميجابايت للملف.
              </div>
            </div>
            {names.length > 0 && (
              <div className="stack" style={{ marginTop: 12 }}>
                {names.map((n) => (
                  <div className="mini-row" key={n}>
                    <span>📄</span>
                    <span className="mini-title">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="check-chip" style={{ marginBottom: 18 }}>
            <input type="checkbox" name="as_draft" defaultChecked /> ارفعيها كمسودات (ما تظهر
            للطلاب لين تراجعين العناوين وتنشرينها)
          </label>

          <Submit count={names.length} />
        </form>
      </div>
    </>
  );
}
