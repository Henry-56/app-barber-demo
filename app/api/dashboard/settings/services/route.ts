import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { services } from '@/src/lib/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(services)
    .where(eq(services.barbershopId, session.user.barbershopId))
    .orderBy(asc(services.sortOrder), asc(services.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, price, durationMinutes, sortOrder } = await req.json();

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'name y price son requeridos' }, { status: 400 });
  }

  const [svc] = await db
    .insert(services)
    .values({
      barbershopId: session.user.barbershopId,
      name,
      price: String(price),
      durationMinutes: durationMinutes ?? 30,
      sortOrder: sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(svc, { status: 201 });
}

