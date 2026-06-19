import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbers } from '@/src/lib/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { isTrialActive, trialExpiredResponse } from '@/src/lib/trial-guard';

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

function limaDay(offsetDays = 0) {
  const nowLima = new Date(Date.now() - LIMA_OFFSET_MS);
  const d = new Date(nowLima.getTime() + offsetDays * 86400000);
  const str = d.toISOString().split('T')[0];
  return {
    start: new Date(`${str}T00:00:00-05:00`),
    end:   new Date(`${str}T00:00:00-05:00`).getTime() + 86400000,
  };
}

const COLS = {
  appt: {
    id: appointments.id,
    scheduledAt: appointments.scheduledAt,
    status: appointments.status,
    service: appointments.service,
    price: appointments.price,
  },
  client: { id: clients.id, name: clients.name, phone: clients.phone },
  barber: { id: barbers.id, name: barbers.name },
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isTrialActive(session.user.barbershopId)) return trialExpiredResponse();

  const { barbershopId } = session.user;
  const today = limaDay(0);

  // No asistió: citas de hoy con no_show — candidatos a reenganche
  const noShows = await db.select(COLS).from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      eq(appointments.status, 'no_show'),
      gte(appointments.scheduledAt, today.start),
      lt(appointments.scheduledAt, new Date(today.end)),
    ));

  return NextResponse.json({ noShows });
}
