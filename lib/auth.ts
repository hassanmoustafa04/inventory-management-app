import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE = 'pt_session';

export function sessionSecretValue(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const dir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
  const file = path.join(dir, '.session-secret');
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    fs.mkdirSync(dir, { recursive: true });
    const secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(file, secret, { mode: 0o600 });
    return secret;
  }
}

export function sessionToken(): string {
  return crypto.createHmac('sha256', sessionSecretValue()).update('teacher-session-v1').digest('hex');
}

export function isTeacher(): boolean {
  const c = cookies().get(SESSION_COOKIE)?.value ?? '';
  const expected = sessionToken();
  if (c.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(c), Buffer.from(expected));
}

/** Guard for owner pages and server actions. */
export function requireTeacher(): void {
  if (!isTeacher()) redirect('/teacher/login');
}
