import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { clients } from '@/src/lib/schema';
import { and, eq, desc } from 'drizzle-orm';
import { findOrCreateClient } from '@/src/lib/clients';
import { normalizePhone } from '@/src/lib/phone';
import { isTrialActive, trialExpiredResponse } from '@/src/lib/trial-guard';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const filter = searchParams.get('filter') ?? 'all';
  const phoneQuery = searchParams.get('phone');

  const barbershopId = session.user.barbershopId;

  // Lookup by phone (for modal search)
  if (phoneQuery) {
    const normalized = normalizePhone(phoneQuery);
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.barbershopId, barbershopId), eq(clients.phone, normalized)))
      .limit(1);
    return NextResponse.json(client ?? null);
  }

  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.barbershopId, barbershopId))
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
  if (!await isTrialActive(session.user.barbershopId)) return trialExpiredResponse();

  const { phone, name, notes } = await req.json();

  if (!phone) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });

  try {
    const { client, isNew } = await findOrCreateClient({
      barbershopId: session.user.barbershopId,
      phone,
      name,
      source: 'manual',
    });

    if (notes && isNew) {
      await db.update(clients).set({ notes }).where(eq(clients.id, client.id));
    }

    return NextResponse.json({ ...client, isNew }, { status: isNew ? 201 : 200 });
  } catch (e) {
    if (e instanceof Error && e.message === 'NAME_REQUIRED') {
      return NextResponse.json({ needsName: true });
    }
    throw e;
  }
}
