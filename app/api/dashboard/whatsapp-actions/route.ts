import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbers } from '@/src/lib/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bid = session.user.barbershopId;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86_400_000);
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
  const tomorrowEnd   = new Date(tomorrowStart.getTime() + 86_400_000);

  // Citas de mañana que necesitan recordatorio (no sent yet)
  const reminders = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      service: appointments.service,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
      barberName: barbers.name,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(and(
      eq(appointments.barbershopId, bid),
      inArray(appointments.status, ['scheduled', 'pending_confirmation']),
      gte(appointments.scheduledAt, tomorrowStart),
      lte(appointments.scheduledAt, tomorrowEnd),
      eq(appointments.reminderSent24h, false),
    ))
    .orderBy(appointments.scheduledAt);

  // No-shows de hoy
  const noShows = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      service: appointments.service,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .where(and(
      eq(appointments.barbershopId, bid),
      eq(appointments.status, 'no_show'),
      gte(appointments.scheduledAt, todayStart),
      lte(appointments.scheduledAt, todayEnd),
    ));

  // Clientes con 5 sellos listos (fidelización)
  const loyalty = await db
    .select({ id: clients.id, name: clients.name, phone: clients.phone, loyaltyPoints: clients.loyaltyPoints })
    .from(clients)
    .where(and(eq(clients.barbershopId, bid), gte(clients.loyaltyPoints, 5)));

  // Clientes inactivos
  const inactive = await db
    .select({ id: clients.id, name: clients.name, phone: clients.phone, lastVisitAt: clients.lastVisitAt, loyaltyPoints: clients.loyaltyPoints })
    .from(clients)
    .where(and(eq(clients.barbershopId, bid), eq(clients.isInactive, true)))
    .limit(10);

  const total = reminders.length + noShows.length + loyalty.length + inactive.length;

  return NextResponse.json({ reminders, noShows, loyalty, inactive, total });
}
