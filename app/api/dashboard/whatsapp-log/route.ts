import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { whatsappMessages } from '@/src/lib/schema';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId, type, message, confirmed } = await req.json();
  if (!type || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await db.insert(whatsappMessages).values({
    barbershopId: session.user.barbershopId,
    clientId: clientId ?? null,
    type,
    message,
    status: confirmed ? 'sent' : 'pending',
    confirmedSent: !!confirmed,
    sentAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
