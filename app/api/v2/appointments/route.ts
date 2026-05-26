import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbers } from '@/src/lib/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { sendWhatsAppMessage, templates } from '@/src/lib/whatsapp';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  const barbershopId = session.user.barbershopId;

  let whereClause = eq(appointments.barbershopId, barbershopId);

  if (date) {
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(start.getTime() + 86400000);
    whereClause = and(whereClause, gte(appointments.scheduledAt, start), lte(appointments.scheduledAt, end)) as any;
  }

  const rows = await db
    .select({
      appointment: appointments,
      client: { id: clients.id, name: clients.name, phone: clients.phone },
      barber: { id: barbers.id, name: barbers.name },
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(whereClause)
    .orderBy(appointments.scheduledAt);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { clientId, barberId, scheduledAt, service, price, notes } = await req.json();

  if (!clientId || !scheduledAt) {
    return NextResponse.json({ error: 'Cliente y fecha son requeridos' }, { status: 400 });
  }

  const barbershopId = session.user.barbershopId;

  // Verificar disponibilidad del barbero
  if (barberId) {
    const [conflict] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(
        eq(appointments.barbershopId, barbershopId),
        eq(appointments.barberId, barberId),
        eq(appointments.status, 'scheduled'),
        gte(appointments.scheduledAt, new Date(new Date(scheduledAt).getTime() - 30 * 60000)),
        lte(appointments.scheduledAt, new Date(new Date(scheduledAt).getTime() + 30 * 60000)),
      ))
      .limit(1);

    if (conflict) {
      return NextResponse.json({ error: 'El barbero ya tiene una cita en ese horario' }, { status: 409 });
    }
  }

  const [appt] = await db
    .insert(appointments)
    .values({
      barbershopId,
      clientId,
      barberId: barberId ?? null,
      scheduledAt: new Date(scheduledAt),
      service: service ?? null,
      price: price ?? null,
      notes: notes ?? null,
    })
    .returning();

  // Enviar confirmación WhatsApp en background
  const [client] = await db.select({ name: clients.name, phone: clients.phone }).from(clients).where(eq(clients.id, clientId)).limit(1);
  const [barber] = barberId ? await db.select({ name: barbers.name }).from(barbers).where(eq(barbers.id, barberId)).limit(1) : [null];

  if (client?.phone) {
    const dt = new Date(scheduledAt);
    const dateStr = dt.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    sendWhatsAppMessage({
      barbershopId,
      clientId,
      to: client.phone,
      message: `Hola ${client.name} ✅ Tu cita queda confirmada:\n📅 ${dateStr} a las ${timeStr}\n✂️ Con ${barber?.name ?? 'tu barbero'}\nTe recordaremos 24h antes. ¡Hasta pronto!`,
      type: 'bot',
    }).catch(() => {});
  }

  return NextResponse.json(appt, { status: 201 });
}
