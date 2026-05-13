import { NextResponse } from 'next/server';
import { sql, ensureDB } from '@/src/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDB();

  const { id } = await params;
  const { messageType } = await request.json();

  const [log] = await sql`
    INSERT INTO outreach_log (client_id, message_type)
    VALUES (${id}, ${messageType})
    RETURNING id
  `;

  return NextResponse.json({ id: log.id });
}
