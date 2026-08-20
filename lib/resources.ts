import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDb, Resource, UPLOAD_DIR } from './db';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

export const ALLOWED_EXT_LIST = Object.keys(ALLOWED_EXT);

export type ResourceFilters = {
  subject?: string;
  level?: string;
  type?: string;
  q?: string;
};

export function listPublishedResources(f: ResourceFilters = {}): Resource[] {
  const where: string[] = ["status = 'published'"];
  const args: unknown[] = [];
  if (f.subject) { where.push('subject = ?'); args.push(f.subject); }
  if (f.level) { where.push('level = ?'); args.push(f.level); }
  if (f.type) { where.push('type = ?'); args.push(f.type); }
  if (f.q) {
    where.push('(title LIKE ? OR description LIKE ? OR subject LIKE ?)');
    const like = `%${f.q}%`;
    args.push(like, like, like);
  }
  return getDb()
    .prepare(
      `SELECT * FROM resources WHERE ${where.join(' AND ')}
       ORDER BY featured DESC, datetime(created_at) DESC, id DESC`
    )
    .all(...args) as Resource[];
}

export function getResourceBySlug(slug: string): Resource | null {
  return (getDb().prepare('SELECT * FROM resources WHERE slug = ?').get(slug) as Resource) ?? null;
}

export function getResourceById(id: number): Resource | null {
  return (getDb().prepare('SELECT * FROM resources WHERE id = ?').get(id) as Resource) ?? null;
}

export function relatedResources(r: Resource, limit = 3): Resource[] {
  return getDb()
    .prepare(
      `SELECT * FROM resources
       WHERE status = 'published' AND id != ? AND (subject = ? OR type = ?)
       ORDER BY featured DESC, datetime(created_at) DESC LIMIT ?`
    )
    .all(r.id, r.subject, r.type, limit) as Resource[];
}

export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const stem = base || 'resource';
  const db = getDb();
  let slug = stem;
  let n = 2;
  while (db.prepare('SELECT 1 FROM resources WHERE slug = ?').get(slug)) {
    slug = `${stem}-${n++}`;
  }
  return slug;
}

export type SavedFile = { fileName: string; storedName: string; size: number; mime: string };

/**
 * Repair a filename that arrived as UTF-8 bytes decoded as Latin-1 — the shape
 * multipart filenames come through in, which turns an Arabic name into
 * mojibake. The round-trip check leaves a genuinely Latin-1 name untouched.
 */
export function repairFileName(name: string): string {
  if (!/[\u0080-\u00FF]/.test(name)) return name;
  const repaired = Buffer.from(name, 'latin1').toString('utf8');
  if (repaired.includes('\uFFFD')) return name;
  return Buffer.from(repaired, 'utf8').toString('latin1') === name ? repaired : name;
}

/** Validate and persist an uploaded file. Throws Error with an Arabic message on failure. */
export async function saveUpload(file: File): Promise<SavedFile> {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    throw new Error('فضلاً اختر ملفاً لرفعه');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('حجم الملف كبير — الحد الأقصى ٢٥ ميجابايت');
  }
  const original = repairFileName(path.basename(file.name || 'file'));
  const ext = original.split('.').pop()?.toLowerCase() ?? '';
  const mime = ALLOWED_EXT[ext];
  if (!mime) {
    throw new Error(`صيغة الملف غير مدعومة — المسموح: ${ALLOWED_EXT_LIST.join('، ')}`);
  }
  const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, storedName), buf);
  return { fileName: original, storedName, size: buf.length, mime };
}

/** Resolve a stored file, refusing anything that escapes the upload directory. */
export function resolveStoredFile(storedName: string): string | null {
  const full = path.resolve(UPLOAD_DIR, storedName);
  const root = path.resolve(UPLOAD_DIR);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return fs.existsSync(full) ? full : null;
}

export function deleteStoredFile(storedName: string) {
  const full = resolveStoredFile(storedName);
  if (full) {
    try { fs.unlinkSync(full); } catch { /* already gone */ }
  }
}

export function fmtFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} كيلوبايت`;
  return `${bytes} بايت`;
}
