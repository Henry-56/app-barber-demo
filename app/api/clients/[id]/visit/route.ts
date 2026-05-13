import { NextResponse } from 'next/server';
import { sql, ensureDB } from '@/src/lib/db';
import { CUTS_REQUIRED_FOR_FREE } from '@/src/constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDB();

  const { id } = await params;
  const { isFreeCut } = await request.json();

  const [client] = await sql`SELECT * FROM clients WHERE id = ${id}`;
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`
    INSERT INTO visits (client_id, visited_at, is_free_cut)
    VALUES (${id}, NOW(), ${isFreeCut})
  `;

  if (isFreeCut) {
    await sql`
      UPDATE clients SET
        total_visits = total_visits + 1,
        free_cuts_available = GREATEST(0, free_cuts_available - 1),
        last_visit = NOW(),
        last_visit_notified = false
      WHERE id = ${id}
    `;
  } else {
    const newCuts = client.cuts_toward_free + 1;
    const earnedFree = newCuts >= CUTS_REQUIRED_FOR_FREE;
    await sql`
      UPDATE clients SET
        total_visits = total_visits + 1,
        cuts_toward_free = ${earnedFree ? 0 : newCuts},
        free_cuts_available = free_cuts_available + ${earnedFree ? 1 : 0},
        last_visit = NOW(),
        last_visit_notified = false
      WHERE id = ${id}
    `;
  }

  await sql`
    UPDATE clients SET
      avg_frequency_days = (
        SELECT
          CASE WHEN COUNT(*) < 2 THEN NULL
          ELSE AVG(gap_days) END
        FROM (
          SELECT
            EXTRACT(EPOCH FROM (visited_at - LAG(visited_at) OVER (ORDER BY visited_at))) / 86400.0 AS gap_days
          FROM visits
          WHERE client_id = ${id}
        ) t
        WHERE gap_days IS NOT NULL
      )
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}
