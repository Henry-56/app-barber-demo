import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { clients, barbershops, whatsappMessages } from '@/src/lib/schema';
import { eq, and, lt, isNotNull, sql } from 'drizzle-orm';
import { sendWhatsAppMessage, templates } from '@/src/lib/whatsapp';

export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const thirtyOneDaysAgo = new Date(Date.now() - 31 * 86400000);

  // Marcar inactivos
  await db
    .update(clients)
    .set({ isInactive: true })
    .where(and(
      lt(clients.lastVisitAt, thirtyDaysAgo),
      eq(clients.isInactive, false),
      isNotNull(clients.lastVisitAt),
    ));

  // Encontrar clientes que se volvieron inactivos HOY (entre 30 y 31 días sin visita)
  // y aún no recibieron mensaje de recuperación hoy
  const newlyInactive = await db
    .select({ id: clients.id, name: clients.name, phone: clients.phone, barbershopId: clients.barbershopId, lastVisitAt: clients.lastVisitAt })
    .from(clients)
    .where(and(
      lt(clients.lastVisitAt, thirtyDaysAgo),
      sql`${clients.lastVisitAt} >= ${thirtyOneDaysAgo}`,
      eq(clients.isInactive, true),
      isNotNull(clients.phone),
    ));

  const shops = await db.select({ id: barbershops.id, name: barbershops.name }).from(barbershops);
  const shopMap = Object.fromEntries(shops.map(s => [s.id, s.name]));

  let sent = 0;
  for (const client of newlyInactive) {
    const days = Math.floor((Date.now() - new Date(client.lastVisitAt!).getTime()) / 86400000);
    const shopName = shopMap[client.barbershopId] ?? 'tu barbería';
    await sendWhatsAppMessage({
      barbershopId: client.barbershopId,
      clientId: client.id,
      to: client.phone!,
      message: templates.recovery(client.name, shopName, days),
      type: 'recovery',
    });
    sent++;
  }

  return NextResponse.json({ ok: true, markedInactive: newlyInactive.length, sent });
}
