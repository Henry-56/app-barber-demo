import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, clients } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { findOrCreateClient } from '@/src/lib/clients';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { phone, name, serviceName, serviceId, price, barberId } = await req.json();

  if (!phone) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });

  let result: Awaited<ReturnType<typeof findOrCreateClient>>;
  try {
    result = await findOrCreateClient({
      barbershopId: session.user.barbershopId,
      phone,
      name,
      source: 'manual',
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NAME_REQUIRED') {
      return NextResponse.json({ needsName: true });
    }
    throw e;
  }

  const { client, isNew } = result;

  const [appointment] = await db
    .insert(appointments)
    .values({
      barbershopId: session.user.barbershopId,
      clientId: client.id,
      barberId: barberId ?? null,
      serviceId: serviceId ?? null,
      scheduledAt: new Date(),
      service: serviceName ?? null,
      price: price ? Number(price) : null,
      status: 'completed',
      source: 'manual',
      reminderSent24h: true,
      reminderSent2h: true,
    })
    .returning();

  // Update client stats
  await db
    .update(clients)
    .set({
      totalVisits: client.totalVisits + 1,
      lastVisitAt: new Date(),
      loyaltyPoints: client.loyaltyPoints >= 4 ? 0 : client.loyaltyPoints + 1,
      loyaltyRedeemed: client.loyaltyPoints >= 4 ? (client.loyaltyRedeemed ?? 0) + 1 : client.loyaltyRedeemed,
      isInactive: false,
    })
    .where(eq(clients.id, client.id));

  const earnedFree = client.loyaltyPoints >= 4;

  return NextResponse.json({ client, appointment, isNew, earnedFree }, { status: 201 });
}
