import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbers } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pending = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      service: appointments.service,
      price: appointments.price,
      notes: appointments.notes,
      source: appointments.source,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
      barberName: barbers.name,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(
      and(
        eq(appointments.barbershopId, session.user.barbershopId),
        eq(appointments.status, 'pending_confirmation'),
      ),
    )
    .orderBy(appointments.scheduledAt);

  return NextResponse.json(pending);
}

