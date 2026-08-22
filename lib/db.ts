import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/** Where the database and uploads live. Point DATA_DIR at a mounted volume in
 *  production so both survive redeploys. */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const RESOURCES_DDL = `
CREATE TABLE IF NOT EXISTS resources (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  subject      TEXT NOT NULL,
  level        TEXT NOT NULL,
  type         TEXT NOT NULL,
  access       TEXT NOT NULL DEFAULT 'public'
               CHECK (access IN ('public','member','student','teacher')),
  file_name    TEXT NOT NULL,
  file_path    TEXT NOT NULL,
  file_size    INTEGER NOT NULL DEFAULT 0,
  mime         TEXT NOT NULL DEFAULT 'application/octet-stream',
  downloads    INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'published'
               CHECK (status IN ('published','draft','pending','rejected')),
  author_id    INTEGER REFERENCES members(id),
  author_name  TEXT NOT NULL DEFAULT '',
  featured     INTEGER NOT NULL DEFAULT 0,
  review_note  TEXT NOT NULL DEFAULT '',
  is_sample    INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const RESOURCE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject);
`;


const CONTENT_DDL = `
CREATE TABLE IF NOT EXISTS tracks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum TEXT NOT NULL CHECK (curriculum IN ('kuwaiti','british')),
  slug       TEXT UNIQUE NOT NULL,
  name_ar    TEXT NOT NULL,
  name_en    TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  sort       INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS units (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  title    TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  sort     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id  INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  slug     TEXT UNIQUE NOT NULL,
  title    TEXT NOT NULL,
  summary  TEXT NOT NULL DEFAULT '',
  sort     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS materials (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  video_url   TEXT NOT NULL DEFAULT '',
  resource_id INTEGER REFERENCES resources(id),
  access      TEXT NOT NULL DEFAULT 'public'
              CHECK (access IN ('public','member','student','teacher')),
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_units_track ON units(track_id);
CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_materials_lesson ON materials(lesson_id);
`;

const SAMPLE_SLUGS = [
  'igcse-physics-electricity-slides',
  'igcse-physics-waves-notes',
  'igcse-physics-forces-slides',
  'igcse-physics-thermal-worksheet',
  'igcse-physics-past-paper-pack',
  'scheme-of-work-igcse-physics',
  'lesson-plan-radioactivity',
  'as-level-mechanics-slides',
];

function createDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

    -- ---------- hub: members, resources ----------

    CREATE TABLE IF NOT EXISTS members (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      phone         TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('student','teacher')),
      status        TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','pending','rejected')),
      school        TEXT NOT NULL DEFAULT '',
      subjects      TEXT NOT NULL DEFAULT '',
      bio           TEXT NOT NULL DEFAULT '',
      is_student    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS resource_downloads (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      member_id   INTEGER REFERENCES members(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(RESOURCES_DDL);
  migrate(db);
  db.exec(RESOURCE_INDEXES);
  db.exec(CONTENT_DDL);
  migrateMembers(db);
  seed(db);
  return db;
}

/** Students record which curriculum and grade/programme they follow. */
function migrateMembers(db: Database.Database) {
  const cols = db.prepare('PRAGMA table_info(members)').all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  if (!have.has('curriculum')) {
    db.exec("ALTER TABLE members ADD COLUMN curriculum TEXT NOT NULL DEFAULT ''");
  }
  if (!have.has('track_id')) {
    db.exec('ALTER TABLE members ADD COLUMN track_id INTEGER');
  }
}

/** Bring pre-existing databases up to the current resources schema. */
function migrate(db: Database.Database) {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='resources'")
    .get() as { sql: string } | undefined;
  if (!row) return;
  if (row.sql.includes("'draft'") && row.sql.includes('is_sample')) return;

  const cols = [
    'id', 'slug', 'title', 'description', 'subject', 'level', 'type', 'access',
    'file_name', 'file_path', 'file_size', 'mime', 'downloads', 'status',
    'author_id', 'author_name', 'featured', 'review_note', 'created_at',
  ].join(', ');

  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    db.exec('ALTER TABLE resources RENAME TO resources_old');
    db.exec(RESOURCES_DDL);
    db.exec(`INSERT INTO resources (${cols}) SELECT ${cols} FROM resources_old`);
    db.exec('DROP TABLE resources_old');
    const mark = db.prepare('UPDATE resources SET is_sample = 1 WHERE slug = ?');
    for (const slug of SAMPLE_SLUGS) mark.run(slug);
  })();
  db.pragma('foreign_keys = ON');
}

// ---------------- seed ----------------

function seed(db: Database.Database) {
  const hasSettings = db.prepare('SELECT COUNT(*) AS c FROM settings').get() as { c: number };
  if (hasSettings.c === 0) {
    const defaults: Record<string, string> = {
      teacher_name: 'أ. منى مرسي',
      tagline: 'معلمة فيزياء — IGCSE و A Level',
      whatsapp: '96550000000',
      location: 'السالمية — حولي، الكويت',
      bio: 'معلمة فيزياء لمناهج IGCSE و A Level. أشارك هنا عروضي التقديمية وخطط دروسي وأوراق العمل مجاناً، وأعطي حصصاً خصوصية للطلاب اللي يبون يفهمون الفيزياء — مو يحفظونها.',
      auto_confirm: '0',
      password_hash: sha256('teacher123'),
      min_lead_hours: '3',
      horizon_days: '21',
      hub_intro:
        'مكتبة مفتوحة من عروض الفيزياء وخطط الدروس وأوراق العمل لمناهج IGCSE و A Level — للطلاب وللمعلمين.',
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
    ins.run('private-online', 'حصة خصوصية — أونلاين',
      'حصة فردية مباشرة عبر الإنترنت مع سبورة تفاعلية وملخص بعد الحصة.',
      'online', 'private', 60, 8, 1);
    ins.run('private-inperson', 'حصة خصوصية — حضورياً',
      'حصة فردية وجهاً لوجه، تركيز كامل على نقاط ضعف الطالب.',
      'in_person', 'private', 60, 12, 2);
    ins.run('group-online', 'مجموعة صغيرة — أونلاين (٢ إلى ٤ طلاب)',
      'مجموعة مصغّرة بنفس المستوى الدراسي، السعر لكل طالب.',
      'online', 'group', 90, 5, 3);
    ins.run('exam-intensive', 'مراجعة مكثفة قبل الامتحان',
      'مراجعة شاملة للوحدة مع حل نماذج Past Papers.',
      'online', 'intensive', 120, 15, 4);
  }

  const hasRules = db.prepare('SELECT COUNT(*) AS c FROM availability_rules').get() as { c: number };
  if (hasRules.c === 0) {
    const ins = db.prepare('INSERT INTO availability_rules (weekday, start_time, end_time) VALUES (?, ?, ?)');
    for (const wd of [0, 1, 2, 3, 4]) ins.run(wd, '16:00', '21:00');
    ins.run(6, '10:00', '14:00');
  }

  const hasResources = db.prepare('SELECT COUNT(*) AS c FROM resources').get() as { c: number };
  if (hasResources.c === 0) seedResources(db);

  const hasTracks = db.prepare('SELECT COUNT(*) AS c FROM tracks').get() as { c: number };
  if (hasTracks.c === 0) seedCurriculum(db);
}

/** Sample library so the hub is never empty on first run. Files are real, downloadable PDFs. */
function seedResources(db: Database.Database) {
  const owner = (db.prepare("SELECT value FROM settings WHERE key = 'teacher_name'").get() as
    | { value: string }
    | undefined)?.value ?? '';

  const samples: {
    slug: string; title: string; description: string; subject: string;
    level: string; type: string; access: string; featured?: number;
  }[] = [
    {
      slug: 'igcse-physics-electricity-slides',
      title: 'الكهرباء والدوائر الكهربائية — عرض تقديمي كامل',
      description:
        'عرض تقديمي من ٤٢ شريحة يغطي وحدة الكهرباء في منهج IGCSE Physics: التيار، الجهد، المقاومة، قانون أوم، والدوائر المتوالية والمتوازية، مع أمثلة محلولة وأسئلة تفاعلية في نهاية كل قسم.',
      subject: 'الفيزياء', level: 'IGCSE', type: 'presentation', access: 'public', featured: 1,
    },
    {
      slug: 'igcse-physics-waves-notes',
      title: 'الموجات والضوء — ملخص مراجعة',
      description:
        'ملخص مكثّف في ٨ صفحات لوحدة الموجات: الموجات المستعرضة والطولية، الانعكاس والانكسار، والطيف الكهرومغناطيسي — مثالي للمراجعة قبل الامتحان.',
      subject: 'الفيزياء', level: 'IGCSE', type: 'notes', access: 'public',
    },
    {
      slug: 'igcse-physics-forces-slides',
      title: 'القوى والحركة — عرض تقديمي',
      description:
        'قوانين نيوتن الثلاثة، السرعة والتسارع، وقراءة الرسوم البيانية للحركة — مع تجارب توضيحية وأمثلة من الحياة اليومية.',
      subject: 'الفيزياء', level: 'IGCSE', type: 'presentation', access: 'public',
    },
    {
      slug: 'igcse-physics-thermal-worksheet',
      title: 'الحرارة وانتقال الطاقة — ورقة عمل مع نموذج الإجابة',
      description:
        'ورقة عمل من ٢٠ سؤالاً على التوصيل والحمل والإشعاع، والسعة الحرارية، وتغيّر الحالة — مع نموذج إجابة كامل في النهاية.',
      subject: 'الفيزياء', level: 'IGCSE', type: 'worksheet', access: 'member',
    },
    {
      slug: 'igcse-physics-past-paper-pack',
      title: 'حزمة نماذج امتحانات محلولة — الفيزياء',
      description:
        'مجموعة من أسئلة الامتحانات السابقة مصنّفة حسب الوحدة، مع حلول مشروحة خطوة بخطوة وتنبيهات على الأخطاء الشائعة.',
      subject: 'الفيزياء', level: 'IGCSE', type: 'past_paper', access: 'student', featured: 1,
    },
    {
      slug: 'scheme-of-work-igcse-physics',
      title: 'خطة توزيع منهج الفيزياء IGCSE — سنة كاملة',
      description:
        'خطة فصلية جاهزة لتوزيع منهج الفيزياء على ٣٠ أسبوعاً: الأهداف التعليمية لكل أسبوع، الأنشطة المقترحة، وطرق التقييم. مخصصة للمعلمين.',
      subject: 'الفيزياء', level: 'IGCSE', type: 'lesson_plan', access: 'teacher',
    },
    {
      slug: 'lesson-plan-radioactivity',
      title: 'خطة درس — النشاط الإشعاعي (٥٠ دقيقة)',
      description:
        'خطة درس تفصيلية عن أنواع الإشعاع وعمر النصف: التمهيد، النشاط الاستقصائي، أسئلة التقويم التكويني، والواجب المنزلي. مخصصة للمعلمين.',
      subject: 'الفيزياء', level: 'IGCSE', type: 'lesson_plan', access: 'teacher',
    },
    {
      slug: 'as-level-mechanics-slides',
      title: 'الميكانيكا — AS Level عرض تقديمي',
      description:
        'مقدمة الميكانيكا لطلاب AS Level: المتجهات، الاتزان، وحركة المقذوفات، مع أمثلة على أسئلة الامتحان.',
      subject: 'الفيزياء', level: 'AS / A Level', type: 'presentation', access: 'member',
    },
  ];

  const ins = db.prepare(
    `INSERT INTO resources
       (slug, title, description, subject, level, type, access, file_name, file_path,
        file_size, mime, status, author_id, author_name, featured, is_sample)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'application/pdf', 'published', NULL, ?, ?, 1)`
  );

  for (const s of samples) {
    const fileName = `${s.slug}.pdf`;
    const stored = `sample-${s.slug}.pdf`;
    const full = path.join(UPLOAD_DIR, stored);
    const bytes = samplePdf(s.title, s.subject, owner);
    fs.writeFileSync(full, bytes);
    ins.run(
      s.slug, s.title, s.description, s.subject, s.level, s.type, s.access,
      fileName, stored, bytes.length, owner, s.featured ?? 0
    );
  }
}

/** Build a small but valid single-page PDF (Latin text only — it is a placeholder file). */
function samplePdf(titleAr: string, subject: string, author: string): Buffer {
  void titleAr;
  void subject;
  void author;
  const lines = [
    'Sample resource file',
    '',
    'This is a placeholder document that ships with the demo',
    'library so downloads work out of the box.',
    '',
    'Replace it from the dashboard:',
    'Resources -> edit -> upload your real PowerPoint or PDF.',
  ];
  const content =
    'BT\n/F1 16 Tf\n60 780 Td\n18 TL\n' +
    lines.map((l) => `(${l.replace(/[()\\]/g, '')}) Tj T*`).join('\n') +
    '\nET\n';

  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    `<</Length ${Buffer.byteLength(content)}>>\nstream\n${content}endstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}


/**
 * Seeds the curriculum skeleton: the Kuwaiti grades and the Cambridge IGCSE
 * topic tree. Lesson *content* is left empty on purpose — the teacher fills it
 * in; only the structure ships.
 */
function seedCurriculum(db: Database.Database) {
  const insTrack = db.prepare(
    'INSERT INTO tracks (curriculum, slug, name_ar, name_en, note, sort) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insUnit = db.prepare(
    'INSERT INTO units (track_id, title, subtitle, sort) VALUES (?, ?, ?, ?)'
  );
  const insLesson = db.prepare(
    'INSERT INTO lessons (unit_id, slug, title, sort) VALUES (?, ?, ?, ?)'
  );

  const addLessons = (unitId: number, prefix: string, titles: string[]) => {
    titles.forEach((title, i) => {
      const base = `${prefix}-${title}`
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 70);
      let slug = base;
      let n = 2;
      while (db.prepare('SELECT 1 FROM lessons WHERE slug = ?').get(slug)) slug = `${base}-${n++}`;
      insLesson.run(unitId, slug, title, i + 1);
    });
  };

  // ----- Kuwaiti government curriculum -----
  const kwGrades: [string, string, [string, string[]][]][] = [
    ['grade-10', 'الصف العاشر', []],
    [
      'grade-11-sci',
      'الصف الحادي عشر علمي',
      [
        ['الوحدة الأولى: المتجهات', [
          'الكميات القياسية والمتجهة',
          'تمثيل المتجهات',
          'جمع المتجهات',
          'تحليل المتجهات',
        ]],
      ],
    ],
    ['grade-12-sci', 'الصف الثاني عشر علمي', []],
  ];

  kwGrades.forEach(([slug, name, units], gi) => {
    const trackId = Number(
      insTrack.run('kuwaiti', slug, name, '', '', gi + 1).lastInsertRowid
    );
    units.forEach(([unitTitle, lessons], ui) => {
      const unitId = Number(insUnit.run(trackId, unitTitle, '', ui + 1).lastInsertRowid);
      addLessons(unitId, slug, lessons);
    });
  });

  // ----- Cambridge IGCSE Physics (0625) -----
  const igcseId = Number(
    insTrack
      .run(
        'british',
        'cambridge-igcse',
        'فيزياء IGCSE — كامبريدج',
        'Cambridge IGCSE Physics',
        'مناهج أخرى (Edexcel، AS، A Level) تُضاف لاحقاً',
        1
      )
      .lastInsertRowid
  );

  const igcseTopics: [string, string[]][] = [
    ['Motion, Forces & Energy', [
      'Physical quantities and measurement',
      'Motion',
      'Speed & velocity',
      'Acceleration',
      'Equations of motion',
      'Free fall',
      'Mass & weight',
      'Density',
      'Forces & Newton\'s laws',
      'Momentum',
      'Energy, work & power',
      'Pressure',
    ]],
    ['Thermal Physics', [
      'States of matter',
      'Kinetic particle model',
      'Thermal expansion',
      'Specific heat capacity',
      'Melting, boiling & evaporation',
      'Thermal conduction, convection & radiation',
    ]],
    ['Waves', [
      'General properties of waves',
      'Light & reflection',
      'Refraction',
      'Thin lenses',
      'Dispersion & the electromagnetic spectrum',
      'Sound',
    ]],
    ['Electricity & Magnetism', [
      'Magnetism',
      'Static electricity',
      'Electric current',
      'Electromotive force & potential difference',
      'Resistance',
      'Electrical energy & power',
      'Circuit diagrams & components',
      'Electrical safety',
      'Electromagnetic induction',
      'Motors & generators',
      'Transformers',
    ]],
    ['Nuclear Physics', [
      'The nuclear model of the atom',
      'Isotopes',
      'Radioactive decay & emissions',
      'Half-life',
      'Safety precautions',
    ]],
    ['Space Physics', [
      'The Solar System',
      'Orbits',
      'Stars & the life cycle of a star',
      'The Universe & redshift',
    ]],
  ];

  igcseTopics.forEach(([title, lessons], ti) => {
    const unitId = Number(insUnit.run(igcseId, title, '', ti + 1).lastInsertRowid);
    addLessons(unitId, 'igcse', lessons);
  });
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

// ---------------- types ----------------

export type Offering = {
  id: number; slug: string; name_ar: string; desc_ar: string;
  mode: 'online' | 'in_person'; kind: 'private' | 'group' | 'intensive';
  duration_min: number; price_kwd: number; active: number; sort: number;
};

export type Booking = {
  id: number; code: string; offering_id: number; offering_name: string; mode: string;
  date: string; time: string; duration_min: number; price_kwd: number;
  student_name: string; phone: string; grade: string; notes: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  created_at: string;
};

export type AvailabilityRule = { id: number; weekday: number; start_time: string; end_time: string };

export type Member = {
  id: number; name: string; email: string; phone: string; password_hash: string;
  role: 'student' | 'teacher'; status: 'active' | 'pending' | 'rejected';
  curriculum: string; track_id: number | null;
  school: string; subjects: string; bio: string; is_student: number; created_at: string;
};

export type Track = {
  id: number; curriculum: 'kuwaiti' | 'british'; slug: string;
  name_ar: string; name_en: string; note: string; sort: number; active: number;
};

export type Unit = {
  id: number; track_id: number; title: string; subtitle: string; sort: number;
};

export type Lesson = {
  id: number; unit_id: number; slug: string; title: string; summary: string; sort: number;
};

export type Material = {
  id: number; lesson_id: number; kind: string; title: string; body: string;
  video_url: string; resource_id: number | null; access: ResourceAccess;
  sort: number; created_at: string;
};

export type ResourceAccess = 'public' | 'member' | 'student' | 'teacher';

export type Resource = {
  id: number; slug: string; title: string; description: string;
  subject: string; level: string; type: string; access: ResourceAccess;
  file_name: string; file_path: string; file_size: number; mime: string;
  downloads: number; status: 'published' | 'draft' | 'pending' | 'rejected';
  author_id: number | null; author_name: string; featured: number;
  review_note: string; is_sample: number; created_at: string;
};

// ---------------- taxonomy ----------------

export const SUBJECTS = ['الفيزياء', 'الكيمياء', 'الأحياء', 'الرياضيات'];
export const LEVELS = ['IGCSE', 'AS / A Level', 'Checkpoint', 'عام'];

export const RESOURCE_TYPES: { key: string; label: string; icon: string }[] = [
  { key: 'presentation', label: 'عرض تقديمي', icon: '📊' },
  { key: 'lesson_plan', label: 'خطة درس', icon: '🗒️' },
  { key: 'worksheet', label: 'ورقة عمل', icon: '📝' },
  { key: 'notes', label: 'ملخص مراجعة', icon: '📘' },
  { key: 'past_paper', label: 'نماذج امتحانات', icon: '🧾' },
];

export const ACCESS_LABELS: Record<ResourceAccess, { label: string; short: string; cls: string }> = {
  public: { label: 'متاح للجميع', short: 'مجاني', cls: 'acc-public' },
  member: { label: 'للأعضاء المسجّلين', short: 'للأعضاء', cls: 'acc-member' },
  student: { label: 'لطلابي فقط', short: 'لطلابي', cls: 'acc-student' },
  teacher: { label: 'للمعلمين المعتمدين', short: 'للمعلمين', cls: 'acc-teacher' },
};

export function typeLabel(key: string) {
  return RESOURCE_TYPES.find((t) => t.key === key) ?? { key, label: key, icon: '📄' };
}

// ---------------- helpers ----------------

export function getSetting(key: string): string {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string } | undefined;
  return row?.value ?? '';
}

export function getSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as
    { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
}

export function activeOfferings(): Offering[] {
  return getDb().prepare('SELECT * FROM offerings WHERE active = 1 ORDER BY sort').all() as Offering[];
}

export function allOfferings(): Offering[] {
  return getDb().prepare('SELECT * FROM offerings ORDER BY sort').all() as Offering[];
}
