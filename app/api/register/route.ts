import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/lib/drizzle';
import { barbershops, users } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { barbershopName, city, phone, ownerName, email, password } = await req.json();

    if (!barbershopName || !ownerName || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 });
    }

    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 21 * 24 * 60 * 60 * 1000);

    const [shop] = await db
      .insert(barbershops)
      .values({
        name: barbershopName,
        city: city ?? null,
        phone: phone ?? null,
        trialStartedAt,
        trialEndsAt,
        subscriptionStatus: 'trial',
      })
      .returning({ id: barbershops.id });

    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      barbershopId: shop.id,
      name: ownerName,
      email,
      passwordHash,
      role: 'owner',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/register]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
