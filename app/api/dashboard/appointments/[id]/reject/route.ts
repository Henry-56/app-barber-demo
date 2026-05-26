import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [updated] = await db
    .update(appointments)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.barbershopId, session.user.barbershopId),
        eq(appointments.status, 'pending_confirmation'),
      ),
    )
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
