import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';
import { isTrialActive, trialExpiredResponse } from '@/src/lib/trial-guard';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isTrialActive(session.user.barbershopId)) return trialExpiredResponse();

  const { id } = await params;

  const [updated] = await db
    .update(appointments)
    .set({
      status: 'scheduled',
      depositStatus: 'confirmed',
      depositConfirmedAt: new Date(),
      depositConfirmedBy: session.user.barbershopId,
    })
    .where(and(
      eq(appointments.id, id),
      eq(appointments.barbershopId, session.user.barbershopId),
      eq(appointments.status, 'pending_payment'),
    ))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
