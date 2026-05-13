import { NextResponse } from 'next/server';
import { sql, ensureDB } from '@/src/lib/db';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDB();

  const { id } = await params;
  await sql`UPDATE clients SET last_visit_notified = true WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
