import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbers } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';
import { isTrialActive, trialExpiredResponse } from '@/src/lib/trial-guard';

export async function GET() {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isTrialActive(session.user.barbershopId)) return trialExpiredResponse();

  const rows = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      service: appointments.service,
      price: appointments.price,
      depositAmount: appointments.depositAmount,
      depositStatus: appointments.depositStatus,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
      barberName: barbers.name,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(and(
      eq(appointments.barbershopId, session.user.barbershopId),
      eq(appointments.status, 'pending_payment'),
    ));

  return NextResponse.json(rows);
}
