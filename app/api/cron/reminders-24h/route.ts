import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbers, barbershops } from '@/src/lib/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { sendWhatsAppMessage, templates } from '@/src/lib/whatsapp';

export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const end = new Date(start.getTime() + 86400000);

  const pending = await db
    .select({
      appt: appointments,
      client: { name: clients.name, phone: clients.phone },
      barber: { name: barbers.name },
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(and(
      eq(appointments.status, 'scheduled'),
      eq(appointments.reminderSent24h, false),
      gte(appointments.scheduledAt, start),
      lte(appointments.scheduledAt, end),
    ));

  let sent = 0;
  for (const { appt, client, barber } of pending) {
    if (!client?.phone) continue;
    const dt = new Date(appt.scheduledAt);
    const dateStr = dt.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    await sendWhatsAppMessage({
      barbershopId: appt.barbershopId,
      clientId: appt.clientId,
      to: client.phone,
      message: templates.reminder24h(client.name, dateStr, timeStr, barber?.name ?? 'tu barbero'),
      type: 'reminder_24h',
    });
    await db.update(appointments).set({ reminderSent24h: true }).where(eq(appointments.id, appt.id));
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
