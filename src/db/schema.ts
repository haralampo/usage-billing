import { pgTable, serial, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  eventName: text("event_name").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pricingTiers = pgTable("pricing_tiers", {
  id: serial("id").primaryKey(),
  metric: text("metric").notNull(),                 // e.g., "ai_summary"
  unitPriceCents: integer("unit_price_cents").notNull(),
  currency: varchar("currency", { length: 16 }).default("usd").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  taxCents: integer("tax_cents").default(0).notNull(),
  totalCents: integer("total_cents").notNull(),
  status: varchar("status", { length: 32 }).default("draft").notNull(), // draft|open|paid|void
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
