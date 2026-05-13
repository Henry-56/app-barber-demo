import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

let initialized = false;

export async function ensureDB() {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      notes TEXT,
      total_visits INTEGER NOT NULL DEFAULT 1,
      cuts_toward_free INTEGER NOT NULL DEFAULT 1,
      free_cuts_available INTEGER NOT NULL DEFAULT 0,
      last_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_visit_notified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS avg_frequency_days FLOAT`;

  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_free_cut BOOLEAN NOT NULL DEFAULT false
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS outreach_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      outcome VARCHAR(20),
      message_type VARCHAR(50) NOT NULL
    )
  `;

  initialized = true;
}
