import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { clients } from '@/src/lib/schema';
import { eq, and, or, ilike, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const filter = searchParams.get('filter') ?? 'all';

  const barbershopId = session.user.barbershopId;

  let whereClause = eq(clients.barbershopId, barbershopId);

  const rows = await db
    .select()
    .from(clients)
    .where(whereClause)
    .orderBy(desc(clients.lastVisitAt));

  let result = rows;

  if (q) {
    const lower = q.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(lower) || (c.phone ?? '').includes(q)
    );
  }

  if (filter === 'active') result = result.filter(c => !c.isInactive);
  if (filter === 'inactive') result = result.filter(c => c.isInactive);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { name, phone, notes } = await req.json();

  if (!name || !phone) return NextResponse.json({ error: 'Nombre y teléfono requeridos' }, { status: 400 });

  let normalizedPhone = phone.replace(/\s/g, '');
  if (/^9\d{8}$/.test(normalizedPhone)) normalizedPhone = `+51${normalizedPhone}`;

  const [client] = await db
    .insert(clients)
    .values({
      barbershopId: session.user.barbershopId,
      name,
      phone: normalizedPhone,
      notes: notes ?? null,
      lastVisitAt: new Date(),
      totalVisits: 0,
      loyaltyPoints: 0,
    })
    .returning();

  return NextResponse.json(client, { status: 201 });
}
