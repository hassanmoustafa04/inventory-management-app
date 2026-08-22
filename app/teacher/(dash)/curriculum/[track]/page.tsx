import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  addLessonAction,
  addUnitAction,
  deleteLessonAction,
  deleteUnitAction,
  moveLessonAction,
  moveUnitAction,
  renameUnitAction,
} from '@/lib/actions';
import { curriculumOf } from '@/lib/curriculum';
import { trackBySlug, unitsWithLessons } from '@/lib/content';
import { fmtNumAr } from '@/lib/kwtime';

export const dynamic = 'force-dynamic';

export default function ManageTrackPage({
  params,
  searchParams,
}: {
  params: { track: string };
  searchParams: { msg?: string; err?: string; edit?: string };
}) {
  const track = trackBySlug(params.track);
  if (!track) notFound();
  const c = curriculumOf(track.curriculum);
  const units = unitsWithLessons(track.id);
  const unitWord = track.curriculum === 'british' ? 'الموضوع' : 'الوحدة';
  const editing = searchParams.edit ? Number(searchParams.edit) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{c.flag} {track.name_ar}</h1>
          <div className="sub">
            {track.name_en || c.name_ar} — رتّبي الوحدات والدروس، وافتحي أي درس لإضافة محتواه
          </div>
        </div>
        <div className="row-flex">
          <Link href={`/curriculum/${track.slug}`} className="btn btn-sm btn-light">معاينة</Link>
          <Link href="/teacher/curriculum" className="btn btn-sm btn-light">كل المناهج</Link>
        </div>
      </div>

      {searchParams.msg && <div className="form-ok">{searchParams.msg}</div>}
      {searchParams.err && <div className="form-error">{searchParams.err}</div>}

      {units.length === 0 && (
        <div className="empty" style={{ marginBottom: 20 }}>
          <div className="big">📗</div>
          ما فيه {unitWord === 'الموضوع' ? 'مواضيع' : 'وحدات'} بعد — أضيفي أول واحدة من الأسفل.
        </div>
      )}

      {units.map((unit, i) => (
        <div className="card manage-unit" key={unit.id}>
          <div className="spread" style={{ marginBottom: 10 }}>
            <h3>
              <span className="unit-num sm">{fmtNumAr(i + 1)}</span> {unit.title}
              {unit.subtitle && <small className="muted"> — {unit.subtitle}</small>}
            </h3>
            <div className="row-flex" style={{ gap: 6 }}>
              <form action={moveUnitAction}>
                <input type="hidden" name="id" value={unit.id} />
                <input type="hidden" name="dir" value="up" />
                <input type="hidden" name="track_slug" value={track.slug} />
                <button className="btn btn-sm btn-light" title="أعلى">↑</button>
              </form>
              <form action={moveUnitAction}>
                <input type="hidden" name="id" value={unit.id} />
                <input type="hidden" name="dir" value="down" />
                <input type="hidden" name="track_slug" value={track.slug} />
                <button className="btn btn-sm btn-light" title="أسفل">↓</button>
              </form>
              <Link
                href={`/teacher/curriculum/${track.slug}?edit=${unit.id}`}
                className="btn btn-sm btn-light"
              >
                تعديل
              </Link>
              <form action={deleteUnitAction}>
                <input type="hidden" name="id" value={unit.id} />
                <input type="hidden" name="track_slug" value={track.slug} />
                <button className="btn btn-sm btn-red-soft">حذف</button>
              </form>
            </div>
          </div>

          {editing === unit.id && (
            <form action={renameUnitAction} className="row-flex" style={{ marginBottom: 12 }}>
              <input type="hidden" name="id" value={unit.id} />
              <input type="hidden" name="track_slug" value={track.slug} />
              <input name="title" className="input" defaultValue={unit.title} style={{ flex: 1, minWidth: 180 }} required />
              <input name="subtitle" className="input" defaultValue={unit.subtitle} placeholder="وصف مختصر (اختياري)" style={{ flex: 1, minWidth: 160 }} />
              <button className="btn btn-sm btn-navy">حفظ</button>
              <Link href={`/teacher/curriculum/${track.slug}`} className="btn btn-sm btn-light">إلغاء</Link>
            </form>
          )}

          <div className="stack">
            {unit.lessons.map((lesson) => (
              <div className="mini-row manage-lesson" key={lesson.id}>
                <span className="mini-title">
                  {lesson.title}
                  <small className="muted">
                    {lesson.material_count > 0
                      ? ` · ${fmtNumAr(lesson.material_count)} قسم`
                      : ' · فاضي'}
                  </small>
                </span>
                <div className="row-flex" style={{ gap: 6 }}>
                  <form action={moveLessonAction}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="dir" value="up" />
                    <input type="hidden" name="track_slug" value={track.slug} />
                    <button className="btn btn-sm btn-light">↑</button>
                  </form>
                  <form action={moveLessonAction}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="dir" value="down" />
                    <input type="hidden" name="track_slug" value={track.slug} />
                    <button className="btn btn-sm btn-light">↓</button>
                  </form>
                  <Link href={`/teacher/lesson/${lesson.id}`} className="btn btn-sm btn-navy">
                    محتوى الدرس
                  </Link>
                  <form action={deleteLessonAction}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="track_slug" value={track.slug} />
                    <button className="btn btn-sm btn-red-soft">حذف</button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <form action={addLessonAction} className="row-flex" style={{ marginTop: 12 }}>
            <input type="hidden" name="unit_id" value={unit.id} />
            <input type="hidden" name="track_slug" value={track.slug} />
            <input name="title" className="input" placeholder="عنوان درس جديد…" style={{ flex: 1, minWidth: 200 }} required />
            <button className="btn btn-sm btn-navy">➕ أضيفي درساً</button>
          </form>
        </div>
      ))}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>➕ {unitWord === 'الموضوع' ? 'موضوع جديد' : 'وحدة جديدة'}</h3>
        <form action={addUnitAction} className="row-flex">
          <input type="hidden" name="track_id" value={track.id} />
          <input
            name="title"
            className="input"
            placeholder={track.curriculum === 'british' ? 'Topic title…' : 'مثال: الوحدة الثانية: الحركة'}
            style={{ flex: 1, minWidth: 220 }}
            required
          />
          <input name="subtitle" className="input" placeholder="وصف مختصر (اختياري)" style={{ flex: 1, minWidth: 180 }} />
          <button className="btn btn-navy">إضافة</button>
        </form>
      </div>
    </>
  );
}
