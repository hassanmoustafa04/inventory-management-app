import { NextRequest, NextResponse } from 'next/server';
import { getDb, getSetting, Offering } from '@/lib/db';
import { isSlotFree, newBookingCode, normalizeKwPhone } from '@/lib/slots';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const offeringId = Number(body.offeringId);
  const date = String(body.date ?? '');
  const time = String(body.time ?? '');
  const name = String(body.name ?? '').trim();
  const phoneRaw = String(body.phone ?? '');
  const grade = String(body.grade ?? '').trim();
  const notes = String(body.notes ?? '').trim().slice(0, 500);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'الموعد غير صالح' }, { status: 400 });
  }
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: 'فضلاً اكتب اسمك الكامل' }, { status: 400 });
  }
  const phone = normalizeKwPhone(phoneRaw);
  if (!phone) {
    return NextResponse.json(
      { error: 'رقم الهاتف غير صحيح — اكتب رقم كويتي من ٨ أرقام' },
      { status: 400 }
    );
  }

  const db = getDb();
  const offering = db
    .prepare('SELECT * FROM offerings WHERE id = ? AND active = 1')
    .get(offeringId) as Offering | undefined;
  if (!offering) {
    return NextResponse.json({ error: 'الباقة غير متاحة' }, { status: 400 });
  }

  const autoConfirm = getSetting('auto_confirm') === '1';

  // Insert inside a transaction so the availability re-check and the write
  // are atomic (better-sqlite3 is synchronous, so no interleaving).
  const tx = db.transaction(() => {
    if (!isSlotFree(date, time, offering.duration_min)) {
      throw new Error('SLOT_TAKEN');
    }
    const code = newBookingCode();
    db.prepare(
      `INSERT INTO bookings
        (code, offering_id, offering_name, mode, date, time, duration_min, price_kwd,
         student_name, phone, grade, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      code,
      offering.id,
      offering.name_ar,
      offering.mode,
      date,
      time,
      offering.duration_min,
      offering.price_kwd,
      name,
      phone,
      grade,
      notes,
      autoConfirm ? 'confirmed' : 'pending'
    );
    return code;
  });

  try {
    const code = tx();
    return NextResponse.json({ code });
  } catch (e) {
    if (e instanceof Error && e.message === 'SLOT_TAKEN') {
      return NextResponse.json(
        { error: 'للأسف انحجز هذا الموعد للتو — اختر موعداً آخر', slotTaken: true },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'حدث خطأ غير متوقع، حاول مرة أخرى' }, { status: 500 });
  }
}
