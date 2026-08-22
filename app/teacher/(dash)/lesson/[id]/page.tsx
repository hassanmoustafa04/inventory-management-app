import Link from 'next/link';
import { notFound } from 'next/navigation';
import MaterialForm from '@/components/MaterialForm';
import { deleteMaterialAction, moveMaterialAction, updateLessonAction } from '@/lib/actions';
import { curriculumOf, kindInfo, kindLabel, kindsFor } from '@/lib/curriculum';
import { lessonById } from '@/lib/content';
import { ACCESS_LABELS } from '@/lib/db';
import { fmtFileSize } from '@/lib/resources';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function ManageLessonPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { msg?: string };
}) {
  const ctx = lessonById(Number(params.id));
  if (!ctx) notFound();
  const { lesson, unit, track, materials } = ctx;
  const c = curriculumOf(track.curriculum);
  const kinds = kindsFor(track.curriculum);
  const used = new Set(materials.map((m) => m.kind));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumbs dark">
            <Link href="/teacher/curriculum">المناهج</Link>
            <span>›</span>
            <Link href={`/teacher/curriculum/${track.slug}`}>{track.name_ar}</Link>
            <span>›</span>
            <span>{unit.title}</span>
          </div>
          <h1>{lesson.title}</h1>
        </div>
        <Link href={`/lesson/${lesson.slug}`} className="btn btn-sm btn-light">معاينة</Link>
      </div>

      {searchParams.msg && <div className="form-ok">{searchParams.msg}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <form action={updateLessonAction} className="row-flex">
          <input type="hidden" name="id" value={lesson.id} />
          <input type="hidden" name="track_slug" value={track.slug} />
          <input name="title" className="input" defaultValue={lesson.title} style={{ flex: 1, minWidth: 200 }} required />
          <input name="summary" className="input" defaultValue={lesson.summary} placeholder="وصف مختصر للدرس (اختياري)" style={{ flex: 1, minWidth: 200 }} />
          <button className="btn btn-sm btn-navy">حفظ</button>
        </form>
      </div>

      <h2 style={{ fontWeight: 900, fontSize: '1.05rem', marginBottom: 12 }}>
        أقسام الدرس ({fmtNumAr(materials.length)})
      </h2>

      {materials.length === 0 ? (
        <div className="empty" style={{ marginBottom: 20 }}>
          <div className="big">🧩</div>
          ما فيه أقسام بعد — أضيفي الشرح أو المذكرة أو الفيديو من الأسفل.
        </div>
      ) : (
        <div className="stack" style={{ marginBottom: 24 }}>
          {materials.map((m) => (
            <div className="b-row" key={m.id}>
              <span className="res-icon">{kindInfo(m.kind).icon}</span>
              <div className="b-info">
                <b>{m.title || kindLabel(m.kind, track.curriculum)}</b>
                <div className="meta">
                  {kindLabel(m.kind, track.curriculum)}
                  {m.resource && ` · 📎 ${m.resource.file_name} (${fmtFileSize(m.resource.file_size)})`}
                  {m.video_url && ' · 🎥 فيديو'}
                  {m.body && ' · 📝 نص'}
                </div>
              </div>
              <span className={`badge ${ACCESS_LABELS[m.access].cls}`}>
                {ACCESS_LABELS[m.access].short}
              </span>
              <div className="b-actions">
                <form action={moveMaterialAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="lesson_id" value={lesson.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button className="btn btn-sm btn-light">↑</button>
                </form>
                <form action={moveMaterialAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="lesson_id" value={lesson.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button className="btn btn-sm btn-light">↓</button>
                </form>
                <form action={deleteMaterialAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="lesson_id" value={lesson.id} />
                  <button className="btn btn-sm btn-red-soft">حذف</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 6 }}>➕ أضيفي قسماً</h3>
        <p className="muted small" style={{ marginBottom: 16 }}>
          أقسام {c.name_ar} — تقدرين ترفعين ملفاً، أو تحطين رابط فيديو، أو تكتبين نصاً مباشرة.
        </p>
        <MaterialForm
          lessonId={lesson.id}
          kinds={kinds.map((k) => ({
            key: k.key,
            label: track.curriculum === 'british' ? k.en : k.ar,
            icon: k.icon,
            used: used.has(k.key),
          }))}
        />
      </div>
    </>
  );
}
