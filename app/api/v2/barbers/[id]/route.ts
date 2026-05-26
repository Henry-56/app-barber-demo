import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { barbers } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const barbershopId = session.user.barbershopId;

  const allowed: Record<string, unknown> = {};
  if (typeof body.isActive === 'boolean') allowed.isActive = body.isActive;
  if (typeof body.name === 'string') allowed.name = body.name;
  if (typeof body.phone === 'string') allowed.phone = body.phone;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Sin campos a actualizar' }, { status: 400 });
  }

  await db
    .update(barbers)
    .set(allowed)
    .where(and(eq(barbers.id, id), eq(barbers.barbershopId, barbershopId)));

  return NextResponse.json({ ok: true });
}
