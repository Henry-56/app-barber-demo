import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { barbershops, barbers, services } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [shop] = await db
    .select()
    .from(barbershops)
    .where(eq(barbershops.slug, slug))
    .limit(1);

  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const activeBarbers = await db
    .select({ id: barbers.id, name: barbers.name })
    .from(barbers)
    .where(and(eq(barbers.barbershopId, shop.id), eq(barbers.isActive, true)));

  const activeServices = await db
    .select({ id: services.id, name: services.name, price: services.price, durationMinutes: services.durationMinutes })
    .from(services)
    .where(and(eq(services.barbershopId, shop.id), eq(services.isActive, true)));

  return NextResponse.json({
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description,
    coverPhoto: shop.coverPhoto,
    address: shop.address,
    city: shop.city,
    phone: shop.phone,
    appointmentDuration: shop.appointmentDuration,
    openingHours: shop.openingHours,
    maxAdvanceDays: shop.maxAdvanceDays,
    minAdvanceHours: shop.minAdvanceHours,
    depositEnabled: shop.depositEnabled,
    depositAmount: shop.depositAmount,
    depositMandatory: shop.depositMandatory,
    paymentQrUrl: shop.paymentQrUrl,
    paymentPhone: shop.paymentPhone,
    paymentMethodLabel: shop.paymentMethodLabel,
    barbers: activeBarbers,
    services: activeServices,
  });
}
