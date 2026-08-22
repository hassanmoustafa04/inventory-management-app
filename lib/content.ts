import { getDb, Lesson, Material, Resource, Track, Unit } from './db';

export type LessonWithCount = Lesson & { material_count: number };
export type UnitWithLessons = Unit & { lessons: LessonWithCount[] };

export function tracksFor(curriculum: string): Track[] {
  return getDb()
    .prepare('SELECT * FROM tracks WHERE curriculum = ? AND active = 1 ORDER BY sort, id')
    .all(curriculum) as Track[];
}

export function allTracks(): Track[] {
  return getDb().prepare('SELECT * FROM tracks ORDER BY curriculum DESC, sort, id').all() as Track[];
}

export function trackBySlug(slug: string): Track | null {
  return (getDb().prepare('SELECT * FROM tracks WHERE slug = ?').get(slug) as Track) ?? null;
}

export function trackById(id: number): Track | null {
  return (getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track) ?? null;
}

/** Units of a track, each with its lessons and how many materials each holds. */
export function unitsWithLessons(trackId: number): UnitWithLessons[] {
  const db = getDb();
  const units = db
    .prepare('SELECT * FROM units WHERE track_id = ? ORDER BY sort, id')
    .all(trackId) as Unit[];
  const lessonStmt = db.prepare(
    `SELECT l.*, (SELECT COUNT(*) FROM materials m WHERE m.lesson_id = l.id) AS material_count
     FROM lessons l WHERE l.unit_id = ? ORDER BY l.sort, l.id`
  );
  return units.map((u) => ({ ...u, lessons: lessonStmt.all(u.id) as LessonWithCount[] }));
}

export function trackStats(trackId: number): { units: number; lessons: number; materials: number } {
  const db = getDb();
  const units = (db.prepare('SELECT COUNT(*) AS c FROM units WHERE track_id = ?').get(trackId) as { c: number }).c;
  const lessons = (db
    .prepare('SELECT COUNT(*) AS c FROM lessons WHERE unit_id IN (SELECT id FROM units WHERE track_id = ?)')
    .get(trackId) as { c: number }).c;
  const materials = (db
    .prepare(
      `SELECT COUNT(*) AS c FROM materials WHERE lesson_id IN (
         SELECT id FROM lessons WHERE unit_id IN (SELECT id FROM units WHERE track_id = ?))`
    )
    .get(trackId) as { c: number }).c;
  return { units, lessons, materials };
}

export type LessonContext = {
  lesson: Lesson;
  unit: Unit;
  track: Track;
  materials: (Material & { resource: Resource | null })[];
  prev: Lesson | null;
  next: Lesson | null;
};

export function lessonBySlug(slug: string): LessonContext | null {
  const db = getDb();
  const lesson = db.prepare('SELECT * FROM lessons WHERE slug = ?').get(slug) as Lesson | undefined;
  if (!lesson) return null;
  return lessonContext(lesson);
}

export function lessonById(id: number): LessonContext | null {
  const lesson = getDb().prepare('SELECT * FROM lessons WHERE id = ?').get(id) as Lesson | undefined;
  return lesson ? lessonContext(lesson) : null;
}

function lessonContext(lesson: Lesson): LessonContext | null {
  const db = getDb();
  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(lesson.unit_id) as Unit | undefined;
  if (!unit) return null;
  const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(unit.track_id) as Track | undefined;
  if (!track) return null;

  const rows = db
    .prepare('SELECT * FROM materials WHERE lesson_id = ? ORDER BY sort, id')
    .all(lesson.id) as Material[];
  const resStmt = db.prepare('SELECT * FROM resources WHERE id = ?');
  const materials = rows.map((m) => ({
    ...m,
    resource: m.resource_id ? ((resStmt.get(m.resource_id) as Resource) ?? null) : null,
  }));

  // Neighbours run across the whole track, so a student can walk the syllabus.
  const ordered = db
    .prepare(
      `SELECT l.* FROM lessons l JOIN units u ON u.id = l.unit_id
       WHERE u.track_id = ? ORDER BY u.sort, u.id, l.sort, l.id`
    )
    .all(track.id) as Lesson[];
  const idx = ordered.findIndex((l) => l.id === lesson.id);

  return {
    lesson,
    unit,
    track,
    materials,
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
  };
}

export function lessonSlug(title: string, hint = ''): string {
  const base = `${hint}-${title}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'lesson';
  const db = getDb();
  let slug = base;
  let n = 2;
  while (db.prepare('SELECT 1 FROM lessons WHERE slug = ?').get(slug)) slug = `${base}-${n++}`;
  return slug;
}

/** Next sort value in a sibling list. */
export function nextSort(table: 'units' | 'lessons' | 'materials', column: string, parentId: number): number {
  const row = getDb()
    .prepare(`SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM ${table} WHERE ${column} = ?`)
    .get(parentId) as { n: number };
  return row.n;
}
