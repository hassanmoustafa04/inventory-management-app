import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { getDb, Resource } from '@/lib/db';
import { canAccess, currentMember } from '@/lib/members';
import { resolveStoredFile } from '@/lib/resources';
import { isTeacher } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(Number(params.id)) as
    | Resource | undefined;

  // The owner can inspect any file, including submissions still under review.
  const owner = isTeacher();

  if (!resource || (resource.status !== 'published' && !owner)) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
  }

  const member = currentMember();
  if (!owner && !canAccess(member, resource.access)) {
    return NextResponse.json({ error: 'ليس لديك صلاحية تحميل هذا الملف' }, { status: 403 });
  }

  const full = resolveStoredFile(resource.file_path);
  if (!full) {
    return NextResponse.json({ error: 'الملف غير متوفر حالياً' }, { status: 404 });
  }

  // Owner previews are not counted as real downloads.
  if (!owner) {
    db.prepare('UPDATE resources SET downloads = downloads + 1 WHERE id = ?').run(resource.id);
    db.prepare('INSERT INTO resource_downloads (resource_id, member_id) VALUES (?, ?)').run(
      resource.id,
      member?.id ?? null
    );
  }

  const body = fs.readFileSync(full);
  return new NextResponse(body, {
    headers: {
      'Content-Type': resource.mime,
      'Content-Length': String(body.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(resource.file_name)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
