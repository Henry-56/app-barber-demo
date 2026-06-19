import { db } from './drizzle';
import { barbershops } from './schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function isTrialActive(barbershopId: string): Promise<boolean> {
  const [shop] = await db
    .select({
      trialEndsAt: barbershops.trialEndsAt,
      subscriptionStatus: barbershops.subscriptionStatus,
    })
    .from(barbershops)
    .where(eq(barbershops.id, barbershopId))
    .limit(1);

  if (!shop) return false;
  if (shop.subscriptionStatus === 'active' || shop.subscriptionStatus === 'paid') return true;
  if (!shop.trialEndsAt) return false;
  return new Date(shop.trialEndsAt) > new Date();
}

export function trialExpiredResponse() {
  return NextResponse.json(
    { error: 'Tu prueba gratuita ha vencido. Activa tu plan para continuar.' },
    { status: 403 }
  );
}
