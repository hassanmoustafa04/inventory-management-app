import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDb, Member, sha256, ResourceAccess } from './db';
import { sessionSecretValue } from './auth';

export const MEMBER_COOKIE = 'pt_member';

function sign(id: number): string {
  return crypto.createHmac('sha256', sessionSecretValue()).update(`member:${id}`).digest('hex');
}

export function memberCookieValue(id: number): string {
  return `${id}.${sign(id)}`;
}

/** The member for the current request, or null. */
export function currentMember(): Member | null {
  const raw = cookies().get(MEMBER_COOKIE)?.value ?? '';
  const [idPart, mac] = raw.split('.');
  const id = Number(idPart);
  if (!Number.isInteger(id) || id <= 0 || !mac) return null;

  const expected = sign(id);
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;

  const member = getDb().prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
  return member ?? null;
}

export function hashPassword(password: string): string {
  return sha256(`pt:${password}`);
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Which resource tiers this viewer may download.
 * - anonymous            → public only
 * - registered student   → public + member
 * - enrolled student     → + student   (has at least one confirmed/completed booking)
 * - approved teacher     → + teacher
 */
export function allowedTiers(member: Member | null): ResourceAccess[] {
  if (!member || member.status !== 'active') return ['public'];
  const tiers: ResourceAccess[] = ['public', 'member'];
  if (member.role === 'teacher') tiers.push('teacher');
  if (isEnrolledStudent(member)) tiers.push('student');
  return tiers;
}

/** A member counts as "my student" once they have a confirmed or completed lesson. */
export function isEnrolledStudent(member: Member): boolean {
  if (member.is_student === 1) return true;
  if (!member.phone) return false;
  const row = getDb()
    .prepare(
      "SELECT 1 AS x FROM bookings WHERE phone = ? AND status IN ('confirmed','completed') LIMIT 1"
    )
    .get(member.phone) as { x: number } | undefined;
  return Boolean(row);
}

export function canAccess(member: Member | null, access: ResourceAccess): boolean {
  return allowedTiers(member).includes(access);
}

/** Message shown when a resource is locked for this viewer. */
export function lockReason(member: Member | null, access: ResourceAccess): string {
  if (access === 'member') return 'سجّل حساباً مجانياً لتحميل هذا الملف';
  if (access === 'student') {
    return member
      ? 'هذا الملف متاح لطلابي المسجّلين في الحصص — احجز حصتك للوصول إليه'
      : 'هذا الملف متاح لطلابي فقط — سجّل الدخول إذا كنت من طلابي';
  }
  if (access === 'teacher') {
    if (member?.role === 'teacher' && member.status === 'pending') {
      return 'طلب انضمامك كمعلم قيد المراجعة — سيتم تفعيل وصولك بعد الموافقة';
    }
    return 'هذا الملف مخصص للمعلمين المعتمدين في الشبكة';
  }
  return '';
}
