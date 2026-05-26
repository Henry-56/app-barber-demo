import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { normalizePhone } from '../src/lib/phone';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('📱 Normalizing phones...');

  const rows = await sql`SELECT id, phone FROM clients`;
  let updated = 0;

  for (const row of rows) {
    const normalized = normalizePhone(row.phone ?? '');
    if (normalized !== row.phone) {
      await sql`UPDATE clients SET phone = ${normalized} WHERE id = ${row.id}`;
      updated++;
    }
  }

  console.log(`✅ Phones normalized: ${updated} updated out of ${rows.length}`);

  console.log('🔒 Adding unique constraint (barbershop_id, phone)...');
  try {
    await sql`
      ALTER TABLE clients
      ADD CONSTRAINT clients_barbershop_phone_unique
      UNIQUE (barbershop_id, phone)
    `;
    console.log('✅ Constraint added');
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('already exists')) {
      console.log('ℹ️  Constraint already exists, skipping');
    } else {
      throw e;
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
