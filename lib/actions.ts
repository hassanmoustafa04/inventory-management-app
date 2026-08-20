'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, getSetting, setSetting, sha256, Booking } from './db';
import { requireTeacher, sessionToken, SESSION_COOKIE } from './auth';
import { normalizeKwPhone } from './slots';
import { Member, Resource, ResourceAccess, SUBJECTS, LEVELS, RESOURCE_TYPES } from './db';
import { currentMember, hashPassword, MEMBER_COOKIE, memberCookieValue, verifyPassword } from './members';
import { deleteStoredFile, saveUpload, slugify } from './resources';

// ---------- auth ----------

export async function loginAction(_prev: { error?: string }, formData: FormData) {
  const password = String(formData.get('password') ?? '');
  if (sha256(password) !== getSetting('password_hash')) {
    return { error: 'كلمة المرور غير صحيحة، حاول مرة أخرى.' };
  }
  cookies().set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect('/teacher');
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect('/teacher/login');
}

export async function changePasswordAction(formData: FormData) {
  requireTeacher();
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  if (sha256(current) !== getSetting('password_hash')) {
    redirect('/teacher/settings?msg=' + encodeURIComponent('كلمة المرور الحالية غير صحيحة'));
  }
  if (next.length < 8) {
    redirect('/teacher/settings?msg=' + encodeURIComponent('كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل'));
  }
  setSetting('password_hash', sha256(next));
  redirect('/teacher/settings?msg=' + encodeURIComponent('تم تغيير كلمة المرور بنجاح'));
}

// ---------- bookings ----------

const TEACHER_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['pending'],
  declined: ['pending'],
  cancelled: ['pending', 'confirmed'],
  completed: ['confirmed'],
};

export async function setBookingStatusAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  const allowedFrom = TEACHER_TRANSITIONS[status];
  if (!allowedFrom) return;
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking | undefined;
  if (!booking || !allowedFrom.includes(booking.status)) return;
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
  revalidatePath('/teacher');
  revalidatePath('/teacher/bookings');
}

/** Public: a student cancels their own booking using its code. */
export async function cancelBookingByCodeAction(formData: FormData) {
  const code = String(formData.get('code') ?? '');
  const db = getDb();
  db.prepare(
    "UPDATE bookings SET status = 'cancelled' WHERE code = ? AND status IN ('pending','confirmed')"
  ).run(code);
  revalidatePath(`/booking/${code}`);
}

// ---------- schedule ----------

const HM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function addRuleAction(formData: FormData) {
  requireTeacher();
  const weekday = Number(formData.get('weekday'));
  const start = String(formData.get('start') ?? '');
  const end = String(formData.get('end') ?? '');
  if (weekday < 0 || weekday > 6 || !HM_RE.test(start) || !HM_RE.test(end) || start >= end) {
    redirect('/teacher/schedule?msg=' + encodeURIComponent('الفترة غير صحيحة — تأكد أن وقت البداية قبل وقت النهاية'));
  }
  getDb()
    .prepare('INSERT INTO availability_rules (weekday, start_time, end_time) VALUES (?, ?, ?)')
    .run(weekday, start, end);
  revalidatePath('/teacher/schedule');
  redirect('/teacher/schedule');
}

export async function deleteRuleAction(formData: FormData) {
  requireTeacher();
  getDb().prepare('DELETE FROM availability_rules WHERE id = ?').run(Number(formData.get('id')));
  revalidatePath('/teacher/schedule');
}

export async function blockDateAction(formData: FormData) {
  requireTeacher();
  const date = String(formData.get('date') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/teacher/schedule');
  getDb()
    .prepare('INSERT INTO blocked_dates (date, reason) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET reason = excluded.reason')
    .run(date, reason);
  revalidatePath('/teacher/schedule');
  redirect('/teacher/schedule');
}

export async function unblockDateAction(formData: FormData) {
  requireTeacher();
  getDb().prepare('DELETE FROM blocked_dates WHERE date = ?').run(String(formData.get('date')));
  revalidatePath('/teacher/schedule');
}

// ---------- settings ----------

export async function saveSettingsAction(formData: FormData) {
  requireTeacher();
  const fields = ['teacher_name', 'tagline', 'location', 'bio'] as const;
  for (const f of fields) {
    const v = String(formData.get(f) ?? '').trim();
    if (v) setSetting(f, v);
  }
  const whatsappRaw = String(formData.get('whatsapp') ?? '').trim();
  const normalized = normalizeKwPhone(whatsappRaw);
  if (normalized) setSetting('whatsapp', normalized);
  setSetting('auto_confirm', formData.get('auto_confirm') ? '1' : '0');
  setSetting('setup_profile', '1');
  const lead = Number(formData.get('min_lead_hours'));
  if (Number.isFinite(lead) && lead >= 0 && lead <= 48) setSetting('min_lead_hours', String(lead));
  revalidatePath('/');
  revalidatePath('/teacher/settings');
  redirect('/teacher/settings?msg=' + encodeURIComponent('تم حفظ الإعدادات'));
}

export async function saveOfferingAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  const price = Number(formData.get('price_kwd'));
  const duration = Number(formData.get('duration_min'));
  const active = formData.get('active') ? 1 : 0;
  if (!Number.isFinite(price) || price <= 0 || ![45, 60, 90, 120].includes(duration)) {
    redirect('/teacher/settings?msg=' + encodeURIComponent('قيمة السعر أو المدة غير صحيحة'));
  }
  getDb()
    .prepare('UPDATE offerings SET price_kwd = ?, duration_min = ?, active = ? WHERE id = ?')
    .run(price, duration, active, id);
  setSetting('setup_pricing', '1');
  revalidatePath('/');
  revalidatePath('/teacher/settings');
  revalidatePath('/teacher/setup');
  redirect('/teacher/settings?msg=' + encodeURIComponent('تم تحديث الباقة'));
}

// ============================================================
//  Hub: members, resources, review queue
// ============================================================


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function backTo(pathname: string, msg: string, isError = false): never {
  redirect(`${pathname}?${isError ? 'err' : 'msg'}=${encodeURIComponent(msg)}`);
}

// ---------- member auth ----------

export async function registerAction(_prev: { error: string }, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phoneRaw = String(formData.get('phone') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'student') === 'teacher' ? 'teacher' : 'student';
  const school = String(formData.get('school') ?? '').trim();
  const subjects = (formData.getAll('subjects') as string[]).filter((s) => SUBJECTS.includes(s)).join('، ');
  const bio = String(formData.get('bio') ?? '').trim().slice(0, 600);

  if (name.length < 2) return { error: 'اكتب اسمك الكامل' };
  if (!EMAIL_RE.test(email)) return { error: 'البريد الإلكتروني غير صحيح' };
  if (password.length < 8) return { error: 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل' };

  const phone = phoneRaw ? normalizeKwPhone(phoneRaw) : '';
  if (phoneRaw && !phone) return { error: 'رقم الهاتف غير صحيح — اكتب رقماً كويتياً من ٨ أرقام' };
  if (role === 'teacher' && !school) return { error: 'اكتب اسم المدرسة أو جهة العمل' };

  const db = getDb();
  if (db.prepare('SELECT 1 FROM members WHERE email = ?').get(email)) {
    return { error: 'هذا البريد مسجّل مسبقاً — سجّل الدخول بدلاً من ذلك' };
  }

  // Teachers join a curated network: they wait for the owner's approval.
  const status = role === 'teacher' ? 'pending' : 'active';
  const info = db
    .prepare(
      `INSERT INTO members (name, email, phone, password_hash, role, status, school, subjects, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, email, phone || '', hashPassword(password), role, status, school, subjects, bio);

  cookies().set(MEMBER_COOKIE, memberCookieValue(Number(info.lastInsertRowid)), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 60,
  });
  revalidatePath('/teacher/review');
  redirect(role === 'teacher' ? '/me?welcome=teacher' : '/me?welcome=student');
}

export async function memberLoginAction(_prev: { error: string }, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const member = getDb().prepare('SELECT * FROM members WHERE email = ?').get(email) as
    | Member | undefined;
  if (!member || !verifyPassword(password, member.password_hash)) {
    return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  }
  if (member.status === 'rejected') {
    return { error: 'هذا الحساب غير مفعّل — تواصل معنا للمساعدة' };
  }
  cookies().set(MEMBER_COOKIE, memberCookieValue(member.id), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 60,
  });
  redirect('/me');
}

export async function memberLogoutAction() {
  cookies().delete(MEMBER_COOKIE);
  redirect('/');
}

export async function updateMemberProfileAction(formData: FormData) {
  const member = currentMember();
  if (!member) redirect('/auth/login');
  const name = String(formData.get('name') ?? '').trim();
  const phoneRaw = String(formData.get('phone') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim().slice(0, 600);
  const phone = phoneRaw ? normalizeKwPhone(phoneRaw) : '';
  if (phoneRaw && !phone) backTo('/me/profile', 'رقم الهاتف غير صحيح', true);
  if (name.length < 2) backTo('/me/profile', 'اكتب اسمك الكامل', true);

  getDb()
    .prepare('UPDATE members SET name = ?, phone = ?, school = ?, bio = ? WHERE id = ?')
    .run(name, phone || '', school, bio, member.id);
  revalidatePath('/me');
  backTo('/me/profile', 'تم حفظ بياناتك');
}

// ---------- resource submit / manage ----------

function readResourceFields(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim().slice(0, 2000);
  const subject = String(formData.get('subject') ?? '');
  const level = String(formData.get('level') ?? '');
  const type = String(formData.get('type') ?? '');
  const access = String(formData.get('access') ?? 'public') as ResourceAccess;
  return { title, description, subject, level, type, access };
}

function validateResourceFields(f: ReturnType<typeof readResourceFields>): string {
  if (f.title.length < 4) return 'اكتب عنواناً واضحاً للملف';
  if (!SUBJECTS.includes(f.subject)) return 'اختر المادة';
  if (!LEVELS.includes(f.level)) return 'اختر المستوى الدراسي';
  if (!RESOURCE_TYPES.some((t) => t.key === f.type)) return 'اختر نوع الملف';
  if (!['public', 'member', 'student', 'teacher'].includes(f.access)) return 'اختر مستوى الوصول';
  return '';
}

/** A network teacher submits a resource — it lands in the owner's review queue. */
export async function submitResourceAction(_prev: { error: string }, formData: FormData) {
  const member = currentMember();
  if (!member) redirect('/auth/login');
  if (member.role !== 'teacher' || member.status !== 'active') {
    return { error: 'المشاركة متاحة للمعلمين المعتمدين فقط' };
  }
  const fields = readResourceFields(formData);
  const err = validateResourceFields(fields);
  if (err) return { error: err };

  try {
    const saved = await saveUpload(formData.get('file') as File);
    getDb()
      .prepare(
        `INSERT INTO resources
           (slug, title, description, subject, level, type, access, file_name, file_path,
            file_size, mime, status, author_id, author_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
      )
      .run(
        slugify(fields.title), fields.title, fields.description, fields.subject, fields.level,
        fields.type, fields.access, saved.fileName, saved.storedName, saved.size, saved.mime,
        member.id, member.name
      );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'تعذر رفع الملف' };
  }
  revalidatePath('/me');
  revalidatePath('/teacher/review');
  redirect('/me?msg=' + encodeURIComponent('تم إرسال الملف للمراجعة — سيُنشر بعد الموافقة عليه'));
}

/** The owner publishes a resource directly. */
export async function ownerCreateResourceAction(_prev: { error: string }, formData: FormData) {
  requireTeacher();
  const fields = readResourceFields(formData);
  const err = validateResourceFields(fields);
  if (err) return { error: err };
  try {
    const saved = await saveUpload(formData.get('file') as File);
    getDb()
      .prepare(
        `INSERT INTO resources
           (slug, title, description, subject, level, type, access, file_name, file_path,
            file_size, mime, status, author_id, author_name, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', NULL, ?, ?)`
      )
      .run(
        slugify(fields.title), fields.title, fields.description, fields.subject, fields.level,
        fields.type, fields.access, saved.fileName, saved.storedName, saved.size, saved.mime,
        getSetting('teacher_name'), formData.get('featured') ? 1 : 0
      );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'تعذر رفع الملف' };
  }
  revalidatePath('/resources');
  revalidatePath('/teacher/resources');
  redirect('/teacher/resources?msg=' + encodeURIComponent('تم نشر الملف'));
}

export async function updateResourceAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  const fields = readResourceFields(formData);
  const err = validateResourceFields(fields);
  if (err) backTo('/teacher/resources', err, true);
  getDb()
    .prepare(
      `UPDATE resources SET title = ?, description = ?, subject = ?, level = ?, type = ?,
                            access = ?, featured = ? WHERE id = ?`
    )
    .run(
      fields.title, fields.description, fields.subject, fields.level, fields.type,
      fields.access, formData.get('featured') ? 1 : 0, id
    );
  revalidatePath('/resources');
  revalidatePath('/teacher/resources');
  backTo('/teacher/resources', 'تم تحديث الملف');
}

export async function deleteResourceAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  const db = getDb();
  const res = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as Resource | undefined;
  if (!res) return;
  db.prepare('DELETE FROM resource_downloads WHERE resource_id = ?').run(id);
  db.prepare('DELETE FROM resources WHERE id = ?').run(id);
  deleteStoredFile(res.file_path);
  revalidatePath('/resources');
  revalidatePath('/teacher/resources');
}

export async function reviewResourceAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  const decision = String(formData.get('decision'));
  if (!['published', 'rejected'].includes(decision)) return;
  const note = String(formData.get('note') ?? '').trim().slice(0, 300);
  getDb()
    .prepare("UPDATE resources SET status = ?, review_note = ? WHERE id = ? AND status = 'pending'")
    .run(decision, note, id);
  revalidatePath('/resources');
  revalidatePath('/teacher/review');
  revalidatePath('/me');
}

// ---------- teacher network approvals ----------

export async function reviewMemberAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  const decision = String(formData.get('decision'));
  if (!['active', 'rejected'].includes(decision)) return;
  getDb()
    .prepare("UPDATE members SET status = ? WHERE id = ? AND role = 'teacher'")
    .run(decision, id);
  revalidatePath('/teacher/review');
  revalidatePath('/teachers');
}

/** Manually flag a member as one of the teacher's own students. */
export async function toggleStudentFlagAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  getDb().prepare('UPDATE members SET is_student = 1 - is_student WHERE id = ?').run(id);
  revalidatePath('/teacher/students');
}

// ============================================================
//  Owner onboarding: bulk upload, drafts, sample cleanup
// ============================================================

/**
 * Upload many files at once. Built for the common case of a teacher who already
 * has a folder of PowerPoints: pick the shared details once, drop in the files,
 * and each one becomes a resource titled after its filename.
 */
export async function bulkUploadAction(
  _prev: { error: string; ok: string },
  formData: FormData
): Promise<{ error: string; ok: string }> {
  requireTeacher();
  const subject = String(formData.get('subject') ?? '');
  const level = String(formData.get('level') ?? '');
  const type = String(formData.get('type') ?? '');
  const access = String(formData.get('access') ?? 'public') as ResourceAccess;
  const asDraft = Boolean(formData.get('as_draft'));

  const fields = { title: 'placeholder', description: '', subject, level, type, access };
  const invalid = validateResourceFields(fields);
  if (invalid && !invalid.includes('عنوان')) return { error: invalid, ok: '' };

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: 'اختاري ملفاً واحداً على الأقل', ok: '' };

  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO resources
       (slug, title, description, subject, level, type, access, file_name, file_path,
        file_size, mime, status, author_id, author_name, is_sample)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0)`
  );

  const authorName = getSetting('teacher_name');
  const status = asDraft ? 'draft' : 'published';
  let saved = 0;
  const failures: string[] = [];

  for (const file of files) {
    try {
      const stored = await saveUpload(file);
      const title = stored.fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      insert.run(
        slugify(title), title || stored.fileName, '', subject, level, type, access,
        stored.fileName, stored.storedName, stored.size, stored.mime, status, authorName
      );
      saved++;
    } catch (e) {
      failures.push(`${file.name}: ${e instanceof Error ? e.message : 'خطأ'}`);
    }
  }

  revalidatePath('/resources');
  revalidatePath('/teacher/resources');
  revalidatePath('/teacher');

  if (saved === 0) return { error: failures.join(' — ') || 'تعذر رفع الملفات', ok: '' };
  const note = failures.length ? ` (تعذر رفع ${failures.length}: ${failures.join('، ')})` : '';
  redirect(
    '/teacher/resources?msg=' +
      encodeURIComponent(
        `تم رفع ${saved} ملف${asDraft ? ' كمسودة — راجعي العناوين ثم انشريها' : ''}${note}`
      )
  );
}

export async function toggleResourceStatusAction(formData: FormData) {
  requireTeacher();
  const id = Number(formData.get('id'));
  const db = getDb();
  const res = db.prepare('SELECT status FROM resources WHERE id = ?').get(id) as
    | { status: string } | undefined;
  if (!res || !['published', 'draft'].includes(res.status)) return;
  db.prepare('UPDATE resources SET status = ? WHERE id = ?')
    .run(res.status === 'published' ? 'draft' : 'published', id);
  revalidatePath('/resources');
  revalidatePath('/teacher/resources');
}

/** Remove every demo file that shipped with the site, and its stored file. */
export async function deleteSamplesAction() {
  requireTeacher();
  const db = getDb();
  const samples = db.prepare('SELECT * FROM resources WHERE is_sample = 1').all() as Resource[];
  const tx = db.transaction(() => {
    for (const r of samples) {
      db.prepare('DELETE FROM resource_downloads WHERE resource_id = ?').run(r.id);
      db.prepare('DELETE FROM resources WHERE id = ?').run(r.id);
    }
  });
  tx();
  for (const r of samples) deleteStoredFile(r.file_path);
  revalidatePath('/resources');
  revalidatePath('/teacher/resources');
  revalidatePath('/teacher/setup');
  redirect('/teacher/resources?msg=' + encodeURIComponent(`تم حذف ${samples.length} ملف تجريبي`));
}

/** Teacher confirms her weekly hours are correct (setup checklist step). */
export async function confirmScheduleAction() {
  requireTeacher();
  setSetting('setup_schedule', '1');
  revalidatePath('/teacher/schedule');
  revalidatePath('/teacher/setup');
  redirect('/teacher/schedule?msg=' + encodeURIComponent('تم تأكيد جدولك ✅'));
}
