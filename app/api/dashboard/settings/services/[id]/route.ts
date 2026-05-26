import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { services } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.price !== undefined) updateData.price = String(body.price);
  if (body.durationMinutes !== undefined) updateData.durationMinutes = body.durationMinutes;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

  const [updated] = await db
    .update(services)
    .set(updateData)
    .where(and(eq(services.id, id), eq(services.barbershopId, session.user.barbershopId)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await db
    .delete(services)
    .where(and(eq(services.id, id), eq(services.barbershopId, session.user.barbershopId)));

  return NextResponse.json({ success: true });
}
