import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { barbershops, appointments, services } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { findOrCreateClient } from '@/src/lib/clients';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [shop] = await db.select().from(barbershops).where(eq(barbershops.slug, slug)).limit(1);
  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { phone, name, barberId, serviceId, date, time, notes, depositPaid } = body;

  if (!phone || !date || !time) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof findOrCreateClient>>;
  try {
    result = await findOrCreateClient({
      barbershopId: shop.id,
      phone,
      name,
      source: 'public_booking',
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NAME_REQUIRED') {
      return NextResponse.json({ needsName: true });
    }
    throw e;
  }

  const { client } = result;

  const scheduledAt = new Date(`${date}T${time}:00-05:00`); // Lima UTC-5

  let serviceName: string | null = null;
  let servicePrice: number | null = null;
  if (serviceId) {
    const [svc] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (svc) { serviceName = svc.name; servicePrice = Number(svc.price); }
  }

  // Anticipo: si el shop tiene depósito activo y el cliente dijo que pagó
  const hasDeposit = shop.depositEnabled && depositPaid === true;
  const appointmentStatus = hasDeposit ? 'pending_payment' : 'pending_confirmation';
  const depositStatus = hasDeposit ? 'pending' : 'not_required';
  const depositRequired = hasDeposit;
  const depositAmount = hasDeposit ? shop.depositAmount : null;

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
      status: appointmentStatus,
      notes: notes ?? null,
      source: 'public_booking',
      depositRequired,
      depositAmount,
      depositStatus,
    })
    .returning();

  return NextResponse.json({
    success: true,
    appointmentId: appointment.id,
    clientId: client.id,
    status: appointmentStatus,
    depositPaid: hasDeposit,
  });
}
