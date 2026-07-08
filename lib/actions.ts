'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, getSetting, setSetting, sha256, Booking } from './db';
import { requireTeacher, sessionToken, SESSION_COOKIE } from './auth';
import { normalizeKwPhone } from './slots';

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
  revalidatePath('/');
  revalidatePath('/teacher/settings');
  redirect('/teacher/settings?msg=' + encodeURIComponent('تم تحديث الباقة'));
}
