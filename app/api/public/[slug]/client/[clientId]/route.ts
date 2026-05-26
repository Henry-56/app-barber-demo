import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { barbershops, clients, appointments, barbers } from '@/src/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; clientId: string }> },
) {
  const { slug, clientId } = await params;

  const [shop] = await db
    .select({ id: barbershops.id })
    .from(barbershops)
    .where(eq(barbershops.slug, slug))
    .limit(1);

  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.barbershopId, shop.id)))
    .limit(1);

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const recentAppointments = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      service: appointments.service,
      price: appointments.price,
      status: appointments.status,
      barberName: barbers.name,
    })
    .from(appointments)
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(and(eq(appointments.clientId, clientId), eq(appointments.barbershopId, shop.id)))
    .orderBy(desc(appointments.scheduledAt))
    .limit(10);

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      phone: client.phone,
      totalVisits: client.totalVisits,
      loyaltyPoints: client.loyaltyPoints,
      loyaltyRedeemed: client.loyaltyRedeemed,
      lastVisitAt: client.lastVisitAt,
    },
    appointments: recentAppointments,
  });
}
