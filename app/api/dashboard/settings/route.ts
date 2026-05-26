import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { barbershops } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [shop] = await db
    .select()
    .from(barbershops)
    .where(eq(barbershops.id, session.user.barbershopId))
    .limit(1);

  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(shop);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const allowed = [
    'name', 'description', 'address', 'city', 'phone',
    'coverPhoto', 'openingHours', 'maxAdvanceDays', 'minAdvanceHours',
    'appointmentDuration',
    'whatsappTemplateConfirmacion', 'whatsappTemplateRecordatorio',
    'whatsappTemplateRecuperacion', 'whatsappTemplateFidelizacion',
    'whatsappTemplateBienvenida',
  ];

  // Handle slug separately — only allow if not yet changed
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  if (body.slug !== undefined) {
    const [current] = await db
      .select({ slugChanged: barbershops.slugChanged, slug: barbershops.slug })
      .from(barbershops)
      .where(eq(barbershops.id, session.user.barbershopId))
      .limit(1);

    if (!current?.slugChanged && body.slug !== current?.slug) {
      updateData.slug = body.slug;
      updateData.slugChanged = true;
    }
  }

  const [updated] = await db
    .update(barbershops)
    .set(updateData)
    .where(eq(barbershops.id, session.user.barbershopId))
    .returning();

  return NextResponse.json(updated);
}

