import { NextRequest, NextResponse } from 'next/server';
import { getDb, Offering } from '@/lib/db';
import { availabilityForOffering } from '@/lib/slots';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const offeringId = Number(req.nextUrl.searchParams.get('offeringId'));
  const offering = getDb()
    .prepare('SELECT * FROM offerings WHERE id = ? AND active = 1')
    .get(offeringId) as Offering | undefined;
  if (!offering) {
    return NextResponse.json({ error: 'offering not found' }, { status: 404 });
  }
  return NextResponse.json({ days: availabilityForOffering(offering) });
}
