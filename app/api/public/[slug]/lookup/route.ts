import { NextResponse } from 'next/server';
import { db } from '@/src/lib/drizzle';
import { barbershops, clients } from '@/src/lib/schema';
import { and, eq } from 'drizzle-orm';
import { normalizePhone } from '@/src/lib/phone';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const rawPhone = searchParams.get('phone') ?? '';

  if (!rawPhone) return NextResponse.json({ found: false });

  const [shop] = await db.select({ id: barbershops.id })
    .from(barbershops).where(eq(barbershops.slug, slug)).limit(1);
  if (!shop) return NextResponse.json({ found: false });

  const phone = normalizePhone(rawPhone);
  const [client] = await db
    .select({ id: clients.id, name: clients.name, loyaltyPoints: clients.loyaltyPoints })
    .from(clients)
    .where(and(eq(clients.barbershopId, shop.id), eq(clients.phone, phone)))
    .limit(1);

  if (!client) return NextResponse.json({ found: false });

  return NextResponse.json({ found: true, clientId: client.id, name: client.name, loyaltyPoints: client.loyaltyPoints });
}
