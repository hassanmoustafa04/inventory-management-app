import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');

function createDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, 'app.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offerings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT UNIQUE NOT NULL,
      name_ar      TEXT NOT NULL,
      desc_ar      TEXT NOT NULL DEFAULT '',
      mode         TEXT NOT NULL CHECK (mode IN ('online', 'in_person')),
      kind         TEXT NOT NULL CHECK (kind IN ('private', 'group', 'intensive')),
      duration_min INTEGER NOT NULL,
      price_kwd    REAL NOT NULL,
      active       INTEGER NOT NULL DEFAULT 1,
      sort         INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS availability_rules (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_dates (
      date   TEXT PRIMARY KEY,
      reason TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      code          TEXT UNIQUE NOT NULL,
      offering_id   INTEGER NOT NULL REFERENCES offerings(id),
      offering_name TEXT NOT NULL,
      mode          TEXT NOT NULL,
      date          TEXT NOT NULL,
      time          TEXT NOT NULL,
      duration_min  INTEGER NOT NULL,
      price_kwd     REAL NOT NULL,
      student_name  TEXT NOT NULL,
      phone         TEXT NOT NULL,
      grade         TEXT NOT NULL DEFAULT '',
      notes         TEXT NOT NULL DEFAULT '',
      status        TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','declined','cancelled','completed')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
    CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
  `);

  seed(db);
  return db;
}

function seed(db: Database.Database) {
  const hasSettings = db.prepare('SELECT COUNT(*) AS c FROM settings').get() as { c: number };
  if (hasSettings.c === 0) {
    const defaults: Record<string, string> = {
      teacher_name: 'أ. حسن مصطفى',
      tagline: 'مدرّس فيزياء — ثانوية عامة و IGCSE',
      whatsapp: '96550000000',
      location: 'السالمية — حولي، الكويت',
      bio: 'أكثر من ١٠ سنوات خبرة في تدريس الفيزياء لمناهج وزارة التربية الكويتية والمناهج الأجنبية. أسلوبي: نفهم الفكرة قبل ما نحفظ القانون.',
      auto_confirm: '0',
      password_hash: sha256('teacher123'),
      min_lead_hours: '3',
      horizon_days: '21',
    };
    const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(defaults)) ins.run(k, v);
  }

  const hasOfferings = db.prepare('SELECT COUNT(*) AS c FROM offerings').get() as { c: number };
  if (hasOfferings.c === 0) {
    const ins = db.prepare(
      `INSERT INTO offerings (slug, name_ar, desc_ar, mode, kind, duration_min, price_kwd, active, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
    );
    ins.run(
      'private-online',
      'حصة خصوصية — أونلاين',
      'حصة فردية مباشرة عبر الإنترنت مع سبورة تفاعلية وملخص بعد الحصة.',
      'online', 'private', 60, 8, 1
    );
    ins.run(
      'private-inperson',
      'حصة خصوصية — حضورياً',
      'حصة فردية وجهاً لوجه، تركيز كامل على نقاط ضعف الطالب.',
      'in_person', 'private', 60, 12, 2
    );
    ins.run(
      'group-online',
      'مجموعة صغيرة — أونلاين (٢ إلى ٤ طلاب)',
      'مجموعة مصغّرة بنفس الصف الدراسي، السعر لكل طالب.',
      'online', 'group', 90, 5, 3
    );
    ins.run(
      'exam-intensive',
      'مراجعة مكثفة قبل الاختبار',
      'مراجعة شاملة للوحدة أو الاختبار القصير مع حل نماذج اختبارات سابقة.',
      'online', 'intensive', 120, 15, 4
    );
  }

  const hasRules = db.prepare('SELECT COUNT(*) AS c FROM availability_rules').get() as { c: number };
  if (hasRules.c === 0) {
    const ins = db.prepare('INSERT INTO availability_rules (weekday, start_time, end_time) VALUES (?, ?, ?)');
    // Sunday..Thursday evenings (after school), Saturday morning-afternoon.
    for (const wd of [0, 1, 2, 3, 4]) ins.run(wd, '16:00', '21:00');
    ins.run(6, '10:00', '14:00');
  }
}

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

declare global {
  // eslint-disable-next-line no-var
  var __appDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__appDb) global.__appDb = createDb();
  return global.__appDb;
}

// ---- typed helpers ----

export type Offering = {
  id: number;
  slug: string;
  name_ar: string;
  desc_ar: string;
  mode: 'online' | 'in_person';
  kind: 'private' | 'group' | 'intensive';
  duration_min: number;
  price_kwd: number;
  active: number;
  sort: number;
};

export type Booking = {
  id: number;
  code: string;
  offering_id: number;
  offering_name: string;
  mode: string;
  date: string;
  time: string;
  duration_min: number;
  price_kwd: number;
  student_name: string;
  phone: string;
  grade: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  created_at: string;
};

export type AvailabilityRule = {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
};

export function getSetting(key: string): string {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? '';
}

export function getSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, value);
}

export function activeOfferings(): Offering[] {
  return getDb()
    .prepare('SELECT * FROM offerings WHERE active = 1 ORDER BY sort')
    .all() as Offering[];
}

export function allOfferings(): Offering[] {
  return getDb().prepare('SELECT * FROM offerings ORDER BY sort').all() as Offering[];
}
