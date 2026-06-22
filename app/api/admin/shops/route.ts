import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookie } from '@/src/lib/admin-auth';
import { db } from '@/src/lib/drizzle';
import { barbershops, users } from '@/src/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function slugify(text: string) {
  const ACCENT: Record<number, string> = {
    225:'a',224:'a',228:'a',226:'a',227:'a',
    233:'e',232:'e',235:'e',234:'e',
    237:'i',236:'i',239:'i',238:'i',
    243:'o',242:'o',246:'o',244:'o',245:'o',
    250:'u',249:'u',252:'u',251:'u',
    241:'n',231:'c',
  };
  return text
    .toLowerCase()
    .split('')
    .map(c => ACCENT[c.charCodeAt(0)] ?? c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 1;
  while (true) {
    const [existing] = await db
      .select({ id: barbershops.id })
      .from(barbershops)
      .where(eq(barbershops.slug, slug))
      .limit(1);
    if (!existing) break;
    slug = `${base}-${++attempt}`;
  }
  return slug;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminCookie(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shops = await db
    .select({
      id: barbershops.id,
      name: barbershops.name,
      slug: barbershops.slug,
      city: barbershops.city,
      phone: barbershops.phone,
      plan: barbershops.plan,
      subscriptionStatus: barbershops.subscriptionStatus,
      trialEndsAt: barbershops.trialEndsAt,
      trialStartedAt: barbershops.trialStartedAt,
      createdAt: barbershops.createdAt,
      ownerEmail: sql<string>`(SELECT email FROM users WHERE barbershop_id = ${barbershops.id} AND role = 'owner' LIMIT 1)`,
      ownerName: sql<string>`(SELECT name FROM users WHERE barbershop_id = ${barbershops.id} AND role = 'owner' LIMIT 1)`,
      citasMes: sql<number>`(SELECT COUNT(*) FROM appointments WHERE barbershop_id = ${barbershops.id} AND date_trunc('month', scheduled_at) = date_trunc('month', NOW()))::int`,
      totalClientes: sql<number>`(SELECT COUNT(*) FROM clients WHERE barbershop_id = ${barbershops.id})::int`,
    })
    .from(barbershops)
    .orderBy(desc(barbershops.createdAt));

  return NextResponse.json(shops);
}

export async function POST(req: NextRequest) {
  if (!verifyAdminCookie(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { barbershopName, city, phone, ownerName, email, password, plan = 'basic', trialDays = 21 } =
    await req.json() as {
      barbershopName: string;
      city?: string;
      phone?: string;
      ownerName: string;
      email: string;
      password: string;
      plan?: string;
      trialDays?: number;
    };

  if (!barbershopName || !ownerName || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
  }

  const slug = await generateUniqueSlug(barbershopName);
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + Number(trialDays) * 86_400_000);

  const [shop] = await db
    .insert(barbershops)
    .values({
      name: barbershopName,
      slug,
      city: city || null,
      phone: phone || null,
      trialStartedAt,
      trialEndsAt,
      subscriptionStatus: 'trial',
      plan,
    })
    .returning({ id: barbershops.id, slug: barbershops.slug });

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    barbershopId: shop.id,
    name: ownerName,
    email,
    passwordHash,
    role: 'owner',
  });

  return NextResponse.json({ ok: true, shopId: shop.id, slug: shop.slug }, { status: 201 });
}
