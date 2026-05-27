import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { whatsappMessages, appointments } from '@/src/lib/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId, type, message, confirmed, appointmentId } = await req.json();
  if (!type || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await db.insert(whatsappMessages).values({
    barbershopId: session.user.barbershopId,
    clientId: clientId ?? null,
    type,
    message,
    status: confirmed ? 'sent' : 'pending',
    confirmedSent: !!confirmed,
    sentAt: new Date(),
  });

  // Si es recordatorio confirmado, marcar reminderSent24h en la cita
  if (type === 'recordatorio' && confirmed && appointmentId) {
    await db
      .update(appointments)
      .set({ reminderSent24h: true })
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.barbershopId, session.user.barbershopId),
      ));
  }

  return NextResponse.json({ ok: true });
}
