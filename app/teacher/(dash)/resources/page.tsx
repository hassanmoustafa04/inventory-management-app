import Link from 'next/link';
import {
  deleteResourceAction,
  deleteSamplesAction,
  toggleResourceStatusAction,
  updateResourceAction,
} from '@/lib/actions';
import { ACCESS_LABELS, getDb, Resource, typeLabel } from '@/lib/db';
import { ACCESS_OPTIONS, LEVELS, RESOURCE_TYPES, SUBJECTS } from '@/lib/constants';
import { fmtFileSize } from '@/lib/resources';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function OwnerResourcesPage({
  searchParams,
}: {
  searchParams: { msg?: string; err?: string; edit?: string };
}) {
  const db = getDb();
  const resources = db
    .prepare("SELECT * FROM resources WHERE status != 'pending' ORDER BY status = 'draft' DESC, featured DESC, id DESC")
    .all() as Resource[];
  const editing = searchParams.edit
    ? (db.prepare('SELECT * FROM resources WHERE id = ?').get(Number(searchParams.edit)) as Resource | undefined)
    : undefined;

  const totalDownloads = resources.reduce((s, r) => s + r.downloads, 0);
  const sampleCount = resources.filter((r) => r.is_sample === 1).length;
  const draftCount = resources.filter((r) => r.status === 'draft').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>المكتبة</h1>
          <div className="sub">
            {fmtNumAr(resources.length)} ملف
            {draftCount > 0 && ` · ${fmtNumAr(draftCount)} مسودة`}
            {' '}· {fmtNumAr(totalDownloads)} تحميل إجمالي
          </div>
        </div>
        <div className="row-flex">
          <Link href="/teacher/resources/bulk" className="btn btn-light btn-sm">📁 رفع مجموعة</Link>
          <Link href="/teacher/resources/new" className="btn btn-navy btn-sm">➕ أضف ملفاً</Link>
        </div>
      </div>

      {searchParams.msg && <div className="form-ok">{searchParams.msg}</div>}

      {sampleCount > 0 && (
        <div className="notice spread">
          <span>
            المكتبة فيها {fmtNumAr(sampleCount)} ملف تجريبي جاي مع الموقع — احذفيها بعد ما ترفعين ملفاتك.
          </span>
          <form action={deleteSamplesAction}>
            <button type="submit" className="btn btn-sm btn-red-soft">حذف الملفات التجريبية</button>
          </form>
        </div>
      )}
      {searchParams.err && <div className="form-error">{searchParams.err}</div>}

      {editing && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="spread" style={{ marginBottom: 14 }}>
            <h3>✏️ تعديل: {editing.title}</h3>
            <Link href="/teacher/resources" className="btn btn-sm btn-light">إلغاء</Link>
          </div>
          <form action={updateResourceAction}>
            <input type="hidden" name="id" value={editing.id} />
            <div className="field">
              <label htmlFor="e-title">العنوان</label>
              <input id="e-title" name="title" className="input" defaultValue={editing.title} required />
            </div>
            <div className="field">
              <label htmlFor="e-desc">الوصف</label>
              <textarea id="e-desc" name="description" className="textarea" defaultValue={editing.description} />
            </div>
            <div className="grid-3">
              <div className="field">
                <label htmlFor="e-subject">المادة</label>
                <select id="e-subject" name="subject" className="select" defaultValue={editing.subject}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="e-level">المستوى</label>
                <select id="e-level" name="level" className="select" defaultValue={editing.level}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="e-type">النوع</label>
                <select id="e-type" name="type" className="select" defaultValue={editing.type}>
                  {RESOURCE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>مستوى الوصول</label>
              <div className="stack">
                {ACCESS_OPTIONS.map((o) => (
                  <label key={o.key} className="access-opt">
                    <input type="radio" name="access" value={o.key} defaultChecked={editing.access === o.key} />
                    <span><b>{o.label}</b><small>{o.hint}</small></span>
                  </label>
                ))}
              </div>
            </div>
            <label className="check-chip" style={{ marginBottom: 16 }}>
              <input type="checkbox" name="featured" defaultChecked={editing.featured === 1} /> ⭐ ملف مميّز
            </label>
            <button type="submit" className="btn btn-navy">حفظ التعديلات</button>
          </form>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="empty">
          <div className="big">📚</div>
          المكتبة فاضية — ارفع أول عرض تقديمي أو خطة درس.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>الملف</th>
                <th>المادة</th>
                <th>الوصول</th>
                <th>التحميلات</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{typeLabel(r.type).icon} {r.title}</b>
                    <div className="muted small">
                      {r.author_name} · {fmtFileSize(r.file_size)}
                      {r.featured === 1 && ' · ⭐ مميّز'}
                    </div>
                  </td>
                  <td>{r.subject}<div className="muted small">{r.level}</div></td>
                  <td><span className={`badge ${ACCESS_LABELS[r.access].cls}`}>{ACCESS_LABELS[r.access].short}</span></td>
                  <td>{fmtNumAr(r.downloads)}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        r.status === 'published' ? 'confirmed' : r.status === 'draft' ? 'pending' : 'declined'
                      }`}
                    >
                      {r.status === 'published' ? 'منشور' : r.status === 'draft' ? 'مسودة' : 'مرفوض'}
                    </span>
                    {r.is_sample === 1 && <div className="muted small">تجريبي</div>}
                  </td>
                  <td>
                    <div className="row-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      {(r.status === 'published' || r.status === 'draft') && (
                        <form action={toggleResourceStatusAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button
                            type="submit"
                            className={`btn btn-sm ${r.status === 'draft' ? 'btn-green' : 'btn-light'}`}
                          >
                            {r.status === 'draft' ? '✓ نشر' : 'إخفاء'}
                          </button>
                        </form>
                      )}
                      <Link href={`/teacher/resources?edit=${r.id}`} className="btn btn-sm btn-light">تعديل</Link>
                      <Link href={`/resources/${r.slug}`} className="btn btn-sm btn-light">عرض</Link>
                      <form action={deleteResourceAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="btn btn-sm btn-red-soft">حذف</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
