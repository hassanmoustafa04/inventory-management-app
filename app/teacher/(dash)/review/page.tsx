import Link from 'next/link';
import { reviewMemberAction, reviewResourceAction } from '@/lib/actions';
import { ACCESS_LABELS, getDb, Member, Resource, typeLabel } from '@/lib/db';
import { fmtFileSize } from '@/lib/resources';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function ReviewPage() {
  const db = getDb();
  const pendingResources = db
    .prepare("SELECT * FROM resources WHERE status = 'pending' ORDER BY id")
    .all() as Resource[];
  const pendingTeachers = db
    .prepare("SELECT * FROM members WHERE role = 'teacher' AND status = 'pending' ORDER BY id")
    .all() as Member[];

  const nothing = pendingResources.length === 0 && pendingTeachers.length === 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>المراجعة</h1>
          <div className="sub">
            طلبات المعلمين والملفات المرسلة — أنتِ صاحبة القرار قبل أي نشر
          </div>
        </div>
      </div>

      {nothing && (
        <div className="empty">
          <div className="big">✨</div>
          ما فيه شي بانتظار المراجعة
        </div>
      )}

      {pendingTeachers.length > 0 && (
        <section style={{ marginBottom: 34 }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 12 }}>
            🧑‍🏫 طلبات انضمام معلمين ({fmtNumAr(pendingTeachers.length)})
          </h2>
          {pendingTeachers.map((t) => (
            <div className="b-row" key={t.id}>
              <div className="b-info">
                <b>{t.name}</b>
                <div className="meta">{t.school || '—'} · {t.subjects || 'بدون مواد محددة'}</div>
                <div className="meta" style={{ direction: 'ltr', textAlign: 'end' }}>{t.email}</div>
                {t.bio && <div className="meta">📝 {t.bio}</div>}
              </div>
              <div className="b-actions">
                <form action={reviewMemberAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="decision" value="active" />
                  <button className="btn btn-sm btn-green" type="submit">✓ اعتماد</button>
                </form>
                <form action={reviewMemberAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <button className="btn btn-sm btn-red-soft" type="submit">رفض</button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      {pendingResources.length > 0 && (
        <section>
          <h2 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 12 }}>
            📥 ملفات بانتظار المراجعة ({fmtNumAr(pendingResources.length)})
          </h2>
          {pendingResources.map((r) => (
            <div className="card" key={r.id} style={{ marginBottom: 12 }}>
              <div className="spread" style={{ marginBottom: 8 }}>
                <div>
                  <b>{typeLabel(r.type).icon} {r.title}</b>
                  <div className="muted small">
                    من: {r.author_name} · {r.subject} · {r.level} · {fmtFileSize(r.file_size)}
                  </div>
                </div>
                <span className={`badge ${ACCESS_LABELS[r.access].cls}`}>
                  {ACCESS_LABELS[r.access].short}
                </span>
              </div>
              {r.description && <p className="muted small">{r.description}</p>}
              <div className="row-flex" style={{ marginTop: 12 }}>
                <a
                  href={`/api/resources/${r.id}/download`}
                  className="btn btn-sm btn-light"
                >
                  ⬇ افحص الملف
                </a>
                <form action={reviewResourceAction} className="row-flex" style={{ flex: 1, gap: 8 }}>
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    name="note"
                    className="input"
                    placeholder="ملاحظة للمعلم (اختياري — تظهر عند الرفض)"
                    style={{ flex: 1, minWidth: 180 }}
                  />
                  <button className="btn btn-sm btn-green" type="submit" name="decision" value="published">
                    ✓ نشر
                  </button>
                  <button className="btn btn-sm btn-red-soft" type="submit" name="decision" value="rejected">
                    رفض
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      <p className="muted small" style={{ marginTop: 24 }}>
        الملفات المنشورة تنتقل إلى <Link href="/teacher/resources"><b>المكتبة</b></Link>.
      </p>
    </>
  );
}
