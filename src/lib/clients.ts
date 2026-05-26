import { db } from '@/src/lib/drizzle';
import { clients } from '@/src/lib/schema';
import { and, eq } from 'drizzle-orm';
import { normalizePhone } from './phone';

type ClientRow = typeof clients.$inferSelect;

export async function findOrCreateClient({
  barbershopId,
  phone,
  name,
  source = 'manual',
}: {
  barbershopId: string;
  phone: string;
  name?: string;
  source?: 'manual' | 'public_booking';
}): Promise<{ client: ClientRow; isNew: boolean }> {
  const normalizedPhone = normalizePhone(phone);

  const [existing] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.barbershopId, barbershopId), eq(clients.phone, normalizedPhone)))
    .limit(1);

  if (existing) return { client: existing, isNew: false };

  if (!name || name.trim() === '') {
    throw new Error('NAME_REQUIRED');
  }

  const [newClient] = await db
    .insert(clients)
    .values({
      barbershopId,
      phone: normalizedPhone,
      name: name.trim(),
      source,
      loyaltyPoints: 0,
      totalVisits: 0,
      noShowCount: 0,
      isInactive: false,
    })
    .returning();

  return { client: newClient, isNew: true };
}
