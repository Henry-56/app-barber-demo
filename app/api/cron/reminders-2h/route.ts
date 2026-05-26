import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbers } from '@/src/lib/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { sendWhatsAppMessage, templates } from '@/src/lib/whatsapp';

export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 3600000);
  const twoHalfHoursLater = new Date(now.getTime() + 2.5 * 3600000);

  const pending = await db
    .select({
      appt: appointments,
      client: { name: clients.name, phone: clients.phone },
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .where(and(
      eq(appointments.status, 'scheduled'),
      eq(appointments.reminderSent2h, false),
      gte(appointments.scheduledAt, twoHoursLater),
      lte(appointments.scheduledAt, twoHalfHoursLater),
    ));

  let sent = 0;
  for (const { appt, client } of pending) {
    if (!client?.phone) continue;
    const timeStr = new Date(appt.scheduledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    await sendWhatsAppMessage({
      barbershopId: appt.barbershopId,
      clientId: appt.clientId,
      to: client.phone,
      message: templates.reminder2h(client.name, timeStr),
      type: 'reminder_2h',
    });
    await db.update(appointments).set({ reminderSent2h: true }).where(eq(appointments.id, appt.id));
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
