'use client';

import { useFormStatus } from 'react-dom';
import { ACCESS_OPTIONS, LEVELS, RESOURCE_TYPES, SUBJECTS } from '@/lib/constants';

type Defaults = {
  title?: string; description?: string; subject?: string;
  level?: string; type?: string; access?: string; featured?: boolean;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-navy btn-lg" disabled={pending}>
      {pending ? '⏳ جاري الرفع…' : label}
    </button>
  );
}

/** Shared fields for uploading (owner or network teacher) and editing. */
export default function ResourceForm({
  defaults = {},
  withFile = true,
  withFeatured = false,
  submitLabel = 'نشر الملف',
}: {
  defaults?: Defaults;
  withFile?: boolean;
  withFeatured?: boolean;
  submitLabel?: string;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor="rf-title">عنوان الملف *</label>
        <input
          id="rf-title" name="title" className="input" required
          defaultValue={defaults.title}
          placeholder="مثال: الكهرباء والدوائر — عرض تقديمي كامل"
        />
      </div>

      <div className="field">
        <label htmlFor="rf-desc">الوصف</label>
        <textarea
          id="rf-desc" name="description" className="textarea"
          defaultValue={defaults.description}
          placeholder="شنو يغطي الملف؟ كم شريحة/صفحة؟ لأي وحدة من المنهج؟"
        />
        <div className="hint">وصف واضح يساعد الطلاب والمعلمين يلقون ملفك في البحث.</div>
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="rf-subject">المادة *</label>
          <select id="rf-subject" name="subject" className="select" defaultValue={defaults.subject ?? ''} required>
            <option value="">— اختر —</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rf-level">المستوى *</label>
          <select id="rf-level" name="level" className="select" defaultValue={defaults.level ?? ''} required>
            <option value="">— اختر —</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rf-type">نوع الملف *</label>
          <select id="rf-type" name="type" className="select" defaultValue={defaults.type ?? ''} required>
            <option value="">— اختر —</option>
            {RESOURCE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>من يقدر يحمّل الملف؟ *</label>
        <div className="stack">
          {ACCESS_OPTIONS.map((o) => (
            <label key={o.key} className="access-opt">
              <input
                type="radio" name="access" value={o.key}
                defaultChecked={(defaults.access ?? 'public') === o.key}
              />
              <span>
                <b>{o.label}</b>
                <small>{o.hint}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      {withFile && (
        <div className="field">
          <label htmlFor="rf-file">الملف *</label>
          <input
            id="rf-file" name="file" type="file" className="input" required
            accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
          />
          <div className="hint">
            PowerPoint، PDF، Word، Excel، صور أو ZIP — حتى ٢٥ ميجابايت.
          </div>
        </div>
      )}

      {withFeatured && (
        <label className="check-chip" style={{ marginBottom: 16 }}>
          <input type="checkbox" name="featured" defaultChecked={defaults.featured} /> ⭐ ملف مميّز (يظهر بالمقدمة)
        </label>
      )}

      <Submit label={submitLabel} />
    </>
  );
}
