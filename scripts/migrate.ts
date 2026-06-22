import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Iniciando migración...');

  await sql`
    DO $$ BEGIN
      CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled', 'suspended');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE whatsapp_message_type AS ENUM ('welcome', 'reminder_24h', 'reminder_2h', 'recovery', 'loyalty_complete', 'trial_reminder', 'bot', 'manual');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE whatsapp_message_status AS ENUM ('sent', 'failed', 'pending');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('owner', 'barber');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE bot_step AS ENUM ('greeting', 'ask_day', 'show_slots', 'ask_name', 'confirmed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS barbershops (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      city VARCHAR(100),
      phone VARCHAR(50),
      plan VARCHAR(50) NOT NULL DEFAULT 'basic',
      trial_started_at TIMESTAMPTZ DEFAULT NOW(),
      trial_ends_at TIMESTAMPTZ,
      subscription_status subscription_status NOT NULL DEFAULT 'trial',
      meta_phone_number_id VARCHAR(100),
      meta_whatsapp_token TEXT,
      welcome_message TEXT,
      recovery_message TEXT,
      loyalty_message TEXT,
      appointment_duration INTEGER NOT NULL DEFAULT 30,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ barbershops');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role user_role NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ users');

  await sql`
    CREATE TABLE IF NOT EXISTS barbers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ barbers');

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      notes TEXT,
      last_visit_at TIMESTAMPTZ,
      total_visits INTEGER NOT NULL DEFAULT 0,
      no_show_count INTEGER NOT NULL DEFAULT 0,
      is_inactive BOOLEAN NOT NULL DEFAULT false,
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      loyalty_redeemed INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ clients (nueva tabla multi-tenant)');

  await sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      service VARCHAR(255),
      price DOUBLE PRECISION,
      status appointment_status NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      reminder_sent_24h BOOLEAN NOT NULL DEFAULT false,
      reminder_sent_2h BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ appointments');

  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
      client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
      type whatsapp_message_type NOT NULL,
      message TEXT NOT NULL,
      status whatsapp_message_status NOT NULL DEFAULT 'pending',
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ whatsapp_messages');

  await sql`
    CREATE TABLE IF NOT EXISTS bot_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
      client_phone VARCHAR(50) NOT NULL,
      step bot_step NOT NULL DEFAULT 'greeting',
      temp_date VARCHAR(50),
      temp_barber_id UUID,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ bot_sessions');

  console.log('\n✅ Migración completada exitosamente.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
