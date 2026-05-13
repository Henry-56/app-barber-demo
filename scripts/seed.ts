import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

function ago(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const DEMO_CLIENTS = [
  {
    name: 'Miguel Quispe',
    phone: '+51 929 111 222',
    notes: 'Fade + degradado. Cliente fiel desde 2024.',
    total_visits: 5,
    cuts_toward_free: 0,
    free_cuts_available: 1,
    last_visit: ago(18),
    // Visits: -58, -48, -38, -28, -18 → gaps de 10d → avg 10d
    visit_days: [58, 48, 38, 28, 18],
  },
  {
    name: 'Roberto Chávez',
    phone: '+51 929 333 444',
    notes: 'Máquina N°2 en los lados. Le gusta el look limpio.',
    total_visits: 4,
    cuts_toward_free: 4,
    free_cuts_available: 0,
    last_visit: ago(16),
    // Visits: -52, -40, -28, -16 → gaps de 12d → avg 12d
    visit_days: [52, 40, 28, 16],
  },
  {
    name: 'Pedro Torres',
    phone: '+51 929 555 666',
    notes: null,
    total_visits: 4,
    cuts_toward_free: 2,
    free_cuts_available: 0,
    last_visit: ago(18),
    // Visits: -60, -45, -30, -18 → gaps 15, 15, 12 → avg ~14d
    visit_days: [60, 45, 30, 18],
  },
  {
    name: 'Juan Ramos',
    phone: '+51 929 777 888',
    notes: 'Corte undercut. Trabaja en centro comercial.',
    total_visits: 4,
    cuts_toward_free: 3,
    free_cuts_available: 0,
    last_visit: ago(22),
    // Visits: -80, -60, -40, -22 → gaps 20, 20, 18 → avg ~19d
    visit_days: [80, 60, 40, 22],
  },
  {
    name: 'Carlos Mamani',
    phone: '+51 929 999 000',
    notes: 'Fade alto. Viene siempre los sábados.',
    total_visits: 4,
    cuts_toward_free: 4,
    free_cuts_available: 0,
    last_visit: ago(9),
    // Visits: -45, -33, -21, -9 → gaps de 12d → avg 12d
    visit_days: [45, 33, 21, 9],
  },
  {
    name: 'Luis Gutiérrez',
    phone: '+51 929 123 456',
    notes: 'Barba + cabello. Cliente mensual.',
    total_visits: 3,
    cuts_toward_free: 3,
    free_cuts_available: 0,
    last_visit: ago(24),
    // Visits: -90, -60, -24 → gaps 30, 36 → avg ~33d
    visit_days: [90, 60, 24],
  },
  {
    name: 'Alex Vargas',
    phone: '+51 929 654 321',
    notes: 'VIP. Viene casi cada semana. Skin fade.',
    total_visits: 4,
    cuts_toward_free: 4,
    free_cuts_available: 0,
    last_visit: ago(6),
    // Visits: -30, -22, -14, -6 → gaps de 8d → avg 8d
    visit_days: [30, 22, 14, 6],
  },
];

async function seed() {
  console.log('🌱 Limpiando datos existentes...');
  await sql`TRUNCATE outreach_log, visits, clients`;

  console.log('👤 Insertando clientes demo...\n');

  const insertedIds: string[] = [];

  for (const client of DEMO_CLIENTS) {
    // 1. Insert client
    const [row] = await sql`
      INSERT INTO clients (
        name, phone, notes, total_visits,
        cuts_toward_free, free_cuts_available, last_visit
      )
      VALUES (
        ${client.name}, ${client.phone}, ${client.notes},
        ${client.total_visits}, ${client.cuts_toward_free},
        ${client.free_cuts_available}, ${client.last_visit.toISOString()}
      )
      RETURNING id
    `;

    // 2. Insert visit records
    for (const days of client.visit_days) {
      await sql`
        INSERT INTO visits (client_id, visited_at, is_free_cut)
        VALUES (${row.id}, ${ago(days).toISOString()}, false)
      `;
    }

    // 3. Calculate and update avg_frequency_days from visits
    await sql`
      UPDATE clients SET
        avg_frequency_days = (
          SELECT
            CASE WHEN COUNT(*) < 2 THEN NULL
            ELSE AVG(gap_days) END
          FROM (
            SELECT
              EXTRACT(EPOCH FROM (
                visited_at - LAG(visited_at) OVER (ORDER BY visited_at)
              )) / 86400.0 AS gap_days
            FROM visits
            WHERE client_id = ${row.id}
          ) t
          WHERE gap_days IS NOT NULL
        )
      WHERE id = ${row.id}
    `;

    // 4. Read back avg for logging
    const [updated] = await sql`
      SELECT avg_frequency_days FROM clients WHERE id = ${row.id}
    `;
    const freq = updated.avg_frequency_days?.toFixed(1) ?? 'N/A';
    const score = (client.visit_days[client.visit_days.length - 1] / parseFloat(freq || '15')).toFixed(2);
    const urgency = parseFloat(score) >= 1.5 ? '🔴 URGENTE' : parseFloat(score) >= 1.0 ? '🟡 Contactar hoy' : '⚪ Próximo';

    console.log(`  ✓ ${client.name.padEnd(20)} freq: ${freq}d | ${client.visit_days.at(-1)}d sin venir | score: ${score} → ${urgency}`);
    insertedIds.push(row.id);
  }

  // Outreach histórico este mes para que el Panel muestre números reales
  console.log('\n📊 Insertando historial de outreach...');

  const outreachRecords = [
    // Semana pasada — ya recuperados (generan revenue en el Panel)
    { idx: 0, daysAgo: 12, outcome: 'came_back',   type: 'free_cut'     }, // Miguel
    { idx: 1, daysAgo: 10, outcome: 'came_back',   type: 'close_to_free'}, // Roberto
    { idx: 2, daysAgo: 8,  outcome: 'came_back',   type: 'reminder'     }, // Pedro
    { idx: 3, daysAgo: 6,  outcome: 'responded',   type: 'reminder'     }, // Juan
    { idx: 4, daysAgo: 5,  outcome: 'no_response',  type: 'reminder'     }, // Carlos
    // Esta semana — más recuperaciones
    { idx: 0, daysAgo: 3,  outcome: 'came_back',   type: 'free_cut'     }, // Miguel (volvió otra vez)
    { idx: 5, daysAgo: 2,  outcome: 'came_back',   type: 'reminder'     }, // Luis
    { idx: 6, daysAgo: 1,  outcome: 'responded',   type: 'close_to_free'}, // Alex
  ];

  for (const r of outreachRecords) {
    const clientId = insertedIds[r.idx];
    await sql`
      INSERT INTO outreach_log (client_id, sent_at, outcome, message_type)
      VALUES (${clientId}, ${ago(r.daysAgo).toISOString()}, ${r.outcome}, ${r.type})
    `;
  }

  console.log(`  ✓ ${outreachRecords.length} registros insertados`);
  console.log('\n✅ Seed completado. Recarga el browser.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
