import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, clients, barbershops } from '@/src/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendWhatsAppMessage, templates } from '@/src/lib/whatsapp';

const LOYALTY_REQUIRED = 5;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  const barbershopId = session.user.barbershopId;

  const [appt] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.barbershopId, barbershopId)))
    .limit(1);

  if (!appt) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

  await db
    .update(appointments)
    .set({ status })
    .where(eq(appointments.id, id));

  if (status === 'completed') {
    // Sumar visita + sello de fidelización
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appt.clientId))
      .limit(1);

    if (client) {
      const newPoints = (client.loyaltyPoints + 1) % LOYALTY_REQUIRED;
      const earnedFree = client.loyaltyPoints + 1 >= LOYALTY_REQUIRED;
      const newRedeemed = earnedFree ? client.loyaltyRedeemed + 1 : client.loyaltyRedeemed;

      await db
        .update(clients)
        .set({
          totalVisits: sql`${clients.totalVisits} + 1`,
          lastVisitAt: new Date(),
          isInactive: false,
          loyaltyPoints: newPoints,
          loyaltyRedeemed: newRedeemed,
        })
        .where(eq(clients.id, appt.clientId));

      // Si completó 5 sellos → WhatsApp automático
      if (earnedFree && client.phone) {
        const [shop] = await db.select({ name: barbershops.name }).from(barbershops).where(eq(barbershops.id, barbershopId)).limit(1);
        sendWhatsAppMessage({
          barbershopId,
          clientId: client.id,
          to: client.phone,
          message: templates.loyaltyComplete(client.name, shop?.name ?? 'tu barbería'),
          type: 'loyalty_complete',
        }).catch(() => {});
      }
    }
  }

  if (status === 'no_show') {
    await db
      .update(clients)
      .set({ noShowCount: sql`${clients.noShowCount} + 1` })
      .where(eq(clients.id, appt.clientId));
  }

  return NextResponse.json({ ok: true });
}
