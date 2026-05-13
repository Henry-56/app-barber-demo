import { NextResponse } from 'next/server';
import { sql, ensureDB } from '@/src/lib/db';

export async function GET() {
  try {
  await ensureDB();

  const rows = await sql`
    SELECT
      c.id, c.name, c.phone, c.email, c.notes,
      c.total_visits, c.cuts_toward_free, c.free_cuts_available,
      c.last_visit, c.last_visit_notified, c.avg_frequency_days,
      COALESCE(
        json_agg(v.visited_at::text ORDER BY v.visited_at ASC) FILTER (WHERE v.id IS NOT NULL),
        '[]'::json
      ) AS visit_history,
      (
        SELECT json_build_object(
          'id', ol.id,
          'sentAt', ol.sent_at,
          'outcome', ol.outcome,
          'messageType', ol.message_type
        )
        FROM outreach_log ol
        WHERE ol.client_id = c.id AND ol.sent_at >= CURRENT_DATE
        ORDER BY ol.sent_at DESC
        LIMIT 1
      ) AS pending_outreach
    FROM clients c
    LEFT JOIN visits v ON v.client_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  const clients = rows.map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    totalVisits: row.total_visits,
    cutsTowardsFree: row.cuts_toward_free,
    freeCutsAvailable: row.free_cuts_available,
    lastVisit: new Date(row.last_visit).toISOString(),
    lastVisitNotified: row.last_visit_notified,
    avgFrequencyDays: row.avg_frequency_days ?? null,
    visitHistory: (row.visit_history as string[]).map(d => new Date(d).toISOString()),
    pendingOutreach: row.pending_outreach
      ? {
          id: row.pending_outreach.id,
          sentAt: new Date(row.pending_outreach.sentAt).toISOString(),
          outcome: row.pending_outreach.outcome ?? null,
          messageType: row.pending_outreach.messageType,
        }
      : null,
  }));

  return NextResponse.json(clients);
  } catch (err) {
    console.error('[GET /api/clients]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureDB();

  const { name, phone, notes } = await request.json();

  const [client] = await sql`
    INSERT INTO clients (name, phone, notes, total_visits, cuts_toward_free, free_cuts_available, last_visit)
    VALUES (${name}, ${phone}, ${notes ?? null}, 1, 1, 0, NOW())
    RETURNING id
  `;

  await sql`
    INSERT INTO visits (client_id, visited_at, is_free_cut)
    VALUES (${client.id}, NOW(), false)
  `;

  return NextResponse.json({ success: true, id: client.id });
}
