import { NextResponse } from 'next/server';
import { sql, ensureDB } from '@/src/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDB();

  const { id } = await params;
  const { outcome } = await request.json();

  await sql`UPDATE outreach_log SET outcome = ${outcome} WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
