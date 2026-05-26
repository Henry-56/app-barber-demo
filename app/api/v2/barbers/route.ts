import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { barbers, appointments } from '@/src/lib/schema';
import { eq, and, count, gte } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const barbershopId = session.user.barbershopId;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const rows = await db
    .select()
    .from(barbers)
    .where(eq(barbers.barbershopId, barbershopId))
    .orderBy(barbers.name);

  const monthCounts = await db
    .select({ barberId: appointments.barberId, total: count() })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      eq(appointments.status, 'completed'),
      gte(appointments.scheduledAt, monthStart),
    ))
    .groupBy(appointments.barberId);

  const countMap = Object.fromEntries(monthCounts.map(m => [m.barberId, m.total]));

  return NextResponse.json(rows.map(b => ({
    ...b,
    cutsThisMonth: countMap[b.id] ?? 0,
  })));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { name, phone } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  let normalizedPhone = (phone ?? '').replace(/\s/g, '');
  if (/^9\d{8}$/.test(normalizedPhone)) normalizedPhone = `+51${normalizedPhone}`;

  const [barber] = await db
    .insert(barbers)
    .values({ barbershopId: session.user.barbershopId, name, phone: normalizedPhone || null })
    .returning();

  return NextResponse.json(barber, { status: 201 });
}
