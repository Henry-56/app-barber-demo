import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { barbershops, appointments } from '@/src/lib/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { generateSlots } from '@/src/lib/availability';
import type { OpeningHours } from '@/src/lib/schema';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const dateStr = url.searchParams.get('date'); // YYYY-MM-DD
  const barberId = url.searchParams.get('barberId');

  if (!dateStr) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const [shop] = await db
    .select()
    .from(barbershops)
    .where(eq(barbershops.slug, slug))
    .limit(1);

  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const date = new Date(`${dateStr}T00:00:00-05:00`); // Lima midnight
  const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  const whereConditions = [
    eq(appointments.barbershopId, shop.id),
    gte(appointments.scheduledAt, date),
    lt(appointments.scheduledAt, nextDay),
  ] as const;

  const existing = await db
    .select({ scheduledAt: appointments.scheduledAt, barberId: appointments.barberId })
    .from(appointments)
    .where(and(...whereConditions));

  // Filter by barberId if provided, otherwise all occupied times
  const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;
  const occupiedTimes = existing
    .filter(a => !barberId || a.barberId === barberId)
    .map(a => {
      const lima = new Date(new Date(a.scheduledAt).getTime() - LIMA_OFFSET_MS);
      return `${String(lima.getUTCHours()).padStart(2, '0')}:${String(lima.getUTCMinutes()).padStart(2, '0')}`;
    });

  const slots = generateSlots(
    date,
    (shop.openingHours ?? {}) as OpeningHours,
    shop.appointmentDuration ?? 30,
    occupiedTimes,
    shop.minAdvanceHours ?? 2,
  );

  return NextResponse.json({ slots });
}
