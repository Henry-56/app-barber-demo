import {
  pgTable, uuid, varchar, text, integer, boolean,
  timestamp, doublePrecision, jsonb, decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Barbershops (tenants) ────────────────────────────────
export const barbershops = pgTable('barbershops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: text('slug').unique(),
  description: text('description'),
  coverPhoto: text('cover_photo'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  plan: varchar('plan', { length: 50 }).notNull().default('basic'),
  trialStartedAt: timestamp('trial_started_at').defaultNow(),
  trialEndsAt: timestamp('trial_ends_at'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).notNull().default('trial'),
  metaPhoneNumberId: varchar('meta_phone_number_id', { length: 100 }),
  metaWhatsappToken: text('meta_whatsapp_token'),
  welcomeMessage: text('welcome_message'),
  recoveryMessage: text('recovery_message'),
  loyaltyMessage: text('loyalty_message'),
  appointmentDuration: integer('appointment_duration').notNull().default(30),
  openingHours: jsonb('opening_hours'),
  maxAdvanceDays: integer('max_advance_days').default(14),
  minAdvanceHours: integer('min_advance_hours').default(2),
  slugChanged: boolean('slug_changed').default(false),
  whatsappTemplateConfirmacion: text('whatsapp_template_confirmacion'),
  whatsappTemplateRecordatorio: text('whatsapp_template_recordatorio'),
  whatsappTemplateRecuperacion: text('whatsapp_template_recuperacion'),
  whatsappTemplateFidelizacion: text('whatsapp_template_fidelizacion'),
  whatsappTemplateBienvenida: text('whatsapp_template_bienvenida'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Users ────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('owner'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Barbers ──────────────────────────────────────────────
export const barbers = pgTable('barbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Clients (multi-tenant) ───────────────────────────────
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  notes: text('notes'),
  lastVisitAt: timestamp('last_visit_at'),
  totalVisits: integer('total_visits').notNull().default(0),
  noShowCount: integer('no_show_count').notNull().default(0),
  isInactive: boolean('is_inactive').notNull().default(false),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  loyaltyRedeemed: integer('loyalty_redeemed').notNull().default(0),
  source: text('source').default('manual'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Services ─────────────────────────────────────────────
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer('duration_minutes').default(30),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Appointments ─────────────────────────────────────────
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  barberId: uuid('barber_id').references(() => barbers.id, { onDelete: 'set null' }),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  service: varchar('service', { length: 255 }),
  price: doublePrecision('price'),
  status: varchar('status', { length: 30 }).notNull().default('scheduled'),
  notes: text('notes'),
  source: text('source').default('manual'),
  reminderSent24h: boolean('reminder_sent_24h').notNull().default(false),
  reminderSent2h: boolean('reminder_sent_2h').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── WhatsApp Messages ────────────────────────────────────
export const whatsappMessages = pgTable('whatsapp_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  confirmedSent: boolean('confirmed_sent').default(false),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────
export const barbershopsRelations = relations(barbershops, ({ many }) => ({
  users: many(users),
  barbers: many(barbers),
  clients: many(clients),
  appointments: many(appointments),
  whatsappMessages: many(whatsappMessages),
  services: many(services),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  barbershop: one(barbershops, { fields: [clients.barbershopId], references: [barbershops.id] }),
  appointments: many(appointments),
  whatsappMessages: many(whatsappMessages),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  barbershop: one(barbershops, { fields: [appointments.barbershopId], references: [barbershops.id] }),
  client: one(clients, { fields: [appointments.clientId], references: [clients.id] }),
  barber: one(barbers, { fields: [appointments.barberId], references: [barbers.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  barbershop: one(barbershops, { fields: [services.barbershopId], references: [barbershops.id] }),
}));

// ─── Types ────────────────────────────────────────────────
export type OpeningHours = {
  [day: string]: { open: string; close: string; closed: boolean };
};
