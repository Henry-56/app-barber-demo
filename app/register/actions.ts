'use server';

import { signIn } from '@/src/lib/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { db } from '@/src/lib/drizzle';
import { barbershops, users } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 1;
  while (true) {
    const [existing] = await db.select({ id: barbershops.id }).from(barbershops).where(eq(barbershops.slug, slug)).limit(1);
    if (!existing) break;
    slug = `${base}-${++attempt}`;
  }
  return slug;
}

export async function registerAction(_: { error: string } | undefined, formData: FormData): Promise<{ error: string } | undefined> {
  const barbershopName = formData.get('barbershopName') as string;
  const city = formData.get('city') as string;
  const phone = formData.get('phone') as string;
  const ownerName = formData.get('ownerName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!barbershopName || !ownerName || !email || !password) {
    return { error: 'Completa todos los campos requeridos' };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: 'Ya existe una cuenta con ese email' };
  }

  let normalizedPhone = (phone ?? '').replace(/\s/g, '');
  if (/^9\d{8}$/.test(normalizedPhone)) normalizedPhone = `+51${normalizedPhone}`;

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + 21 * 24 * 60 * 60 * 1000);

  const slug = await generateUniqueSlug(barbershopName);

  const [shop] = await db
    .insert(barbershops)
    .values({ name: barbershopName, slug, city: city || null, phone: normalizedPhone || null, trialStartedAt, trialEndsAt, subscriptionStatus: 'trial' })
    .returning({ id: barbershops.id });

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ barbershopId: shop.id, name: ownerName, email, passwordHash, role: 'owner' });

  // Auto-login después de registrar
  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Cuenta creada, pero no se pudo ingresar automáticamente. Ve a iniciar sesión.' };
    }
    throw error;
  }
}
