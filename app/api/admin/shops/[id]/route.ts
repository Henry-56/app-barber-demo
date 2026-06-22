import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookie } from '@/src/lib/admin-auth';
import { db } from '@/src/lib/drizzle';
import { barbershops, appointments } from '@/src/lib/schema';
import { eq, sql, desc, getTableColumns } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminCookie(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [shop] = await db
    .select({
      ...getTableColumns(barbershops),
      ownerEmail: sql<string>`(SELECT email FROM users WHERE barbershop_id = ${barbershops.id} AND role = 'owner' LIMIT 1)`,
      ownerName: sql<string>`(SELECT name FROM users WHERE barbershop_id = ${barbershops.id} AND role = 'owner' LIMIT 1)`,
      citasMes: sql<number>`(SELECT COUNT(*) FROM appointments WHERE barbershop_id = ${barbershops.id} AND date_trunc('month', scheduled_at) = date_trunc('month', NOW()))::int`,
      totalCitas: sql<number>`(SELECT COUNT(*) FROM appointments WHERE barbershop_id = ${barbershops.id})::int`,
      totalClientes: sql<number>`(SELECT COUNT(*) FROM clients WHERE barbershop_id = ${barbershops.id})::int`,
      revenueMes: sql<number>`(SELECT COALESCE(SUM(price), 0) FROM appointments WHERE barbershop_id = ${barbershops.id} AND date_trunc('month', scheduled_at) = date_trunc('month', NOW()) AND status IN ('completed', 'scheduled'))`,
    })
    .from(barbershops)
    .where(eq(barbershops.id, id))
    .limit(1);

  if (!shop) {
    return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });
  }

  const lastAppointments = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      service: appointments.service,
      price: appointments.price,
      status: appointments.status,
    })
    .from(appointments)
    .where(eq(appointments.barbershopId, id))
    .orderBy(desc(appointments.scheduledAt))
    .limit(5);

  return NextResponse.json({ ...shop, lastAppointments });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminCookie(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  const allowed = ['name', 'plan', 'subscriptionStatus', 'trialEndsAt'];
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (body.extendTrialDays !== undefined) {
    const [current] = await db
      .select({ trialEndsAt: barbershops.trialEndsAt })
      .from(barbershops)
      .where(eq(barbershops.id, id))
      .limit(1);
    const base = current?.trialEndsAt
      ? new Date(Math.max(Date.now(), new Date(current.trialEndsAt).getTime()))
      : new Date();
    update.trialEndsAt = new Date(base.getTime() + Number(body.extendTrialDays) * 86_400_000);
    update.subscriptionStatus = 'trial';
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const [updated] = await db
    .update(barbershops)
    .set(update)
    .where(eq(barbershops.id, id))
    .returning();

  return NextResponse.json(updated);
}
