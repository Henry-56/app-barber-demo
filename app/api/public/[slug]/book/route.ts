import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { barbershops, clients, appointments, services } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [shop] = await db
    .select()
    .from(barbershops)
    .where(eq(barbershops.slug, slug))
    .limit(1);

  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { clientName, clientPhone, barberId, serviceId, date, time, notes } = body;

  if (!clientName || !clientPhone || !date || !time) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  // Normalize phone
  const phone = clientPhone.replace(/\D/g, '');

  // Find or create client
  let [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.barbershopId, shop.id), eq(clients.phone, phone)))
    .limit(1);

  if (!client) {
    const [newClient] = await db
      .insert(clients)
      .values({
        barbershopId: shop.id,
        name: clientName,
        phone,
        source: 'public',
      })
      .returning();
    client = newClient;
  }

  // Build scheduledAt
  const scheduledAt = new Date(`${date}T${time}:00`);

  // Get service name/price if serviceId provided
  let serviceName: string | null = null;
  let servicePrice: number | null = null;
  if (serviceId) {
    const [svc] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (svc) {
      serviceName = svc.name;
      servicePrice = Number(svc.price);
    }
  }

  const [appointment] = await db
    .insert(appointments)
    .values({
      barbershopId: shop.id,
      clientId: client.id,
      barberId: barberId ?? null,
      serviceId: serviceId ?? null,
      scheduledAt,
      service: serviceName,
      price: servicePrice,
      status: 'pending_confirmation',
      notes: notes ?? null,
      source: 'public',
    })
    .returning();

  return NextResponse.json({
    success: true,
    appointmentId: appointment.id,
    clientId: client.id,
    status: 'pending_confirmation',
  });
}
