'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addMaterialAction } from '@/lib/actions';
import { ACCESS_OPTIONS } from '@/lib/constants';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-navy btn-lg" disabled={pending}>
      {pending ? '⏳ جاري الحفظ…' : 'أضيفي القسم'}
    </button>
  );
}

export default function MaterialForm({
  lessonId,
  kinds,
}: {
  lessonId: number;
  kinds: { key: string; label: string; icon: string; used: boolean }[];
}) {
  const [state, formAction] = useFormState(addMaterialAction, { error: '' });
  const [kind, setKind] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const added = useRef(0);

  // A successful add clears the form so the next section can be entered straight away.
  useEffect(() => {
    if (state.error) return;
    if (added.current > 0) {
      formRef.current?.reset();
      setKind('');
    }
    added.current += 1;
  }, [state]);

  return (
    <>
      {state.error && <div className="form-error">{state.error}</div>}
      <form action={formAction} ref={formRef}>
        <input type="hidden" name="lesson_id" value={lessonId} />

        <div className="field">
          <label>نوع القسم *</label>
          <div className="kind-grid">
            {kinds.map((k) => (
              <label key={k.key} className={`kind-chip ${kind === k.key ? 'on' : ''} ${k.used ? 'used' : ''}`}>
                <input
                  type="radio"
                  name="kind"
                  value={k.key}
                  checked={kind === k.key}
                  onChange={() => setKind(k.key)}
                />
                <span>{k.icon}</span>
                <span className="kind-label">{k.label}</span>
                {k.used && <span className="kind-used">مضاف</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="m-title">عنوان مخصص (اختياري)</label>
          <input id="m-title" name="title" className="input" placeholder="يُستخدم اسم النوع إذا تركتيه فاضي" />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="m-file">ملف (PDF / PowerPoint / Word)</label>
            <input
              id="m-file"
              name="file"
              type="file"
              className="input"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
            />
          </div>
          <div className="field">
            <label htmlFor="m-video">رابط فيديو (YouTube / Vimeo)</label>
            <input id="m-video" name="video_url" className="input ltr" placeholder="https://youtu.be/…" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="m-body">نص القسم (اختياري)</label>
          <textarea
            id="m-body"
            name="body"
            className="textarea"
            placeholder="اكتبي الشرح أو أهم القوانين أو الأخطاء الشائعة مباشرة هنا…"
          />
          <div className="hint">يكفي أي واحد: ملف أو فيديو أو نص.</div>
        </div>

        <div className="field">
          <label>من يقدر يشوف هذا القسم؟ *</label>
          <div className="stack">
            {ACCESS_OPTIONS.map((o) => (
              <label key={o.key} className="access-opt">
                <input type="radio" name="access" value={o.key} defaultChecked={o.key === 'public'} />
                <span><b>{o.label}</b><small>{o.hint}</small></span>
              </label>
            ))}
          </div>
        </div>

        <Submit />
      </form>
    </>
  );
}
