import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define subscription categories
export const subscriptionCategories = [
  "Entertainment",
  "Productivity",
  "Utilities",
  "Health & Fitness",
  "Other"
] as const;

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  cancelUrl: text("cancel_url"),
});

// Subscription insert schema with validation
export const insertSubscriptionSchema = createInsertSchema(subscriptions)
  .pick({
    userId: true,
    name: true,
    amount: true,
    billingCycle: true,
    nextBillingDate: true,
    category: true,
    cancelUrl: true,
  })
  .extend({
    category: z.enum(subscriptionCategories),
    amount: z.string().refine(val => !isNaN(parseFloat(val)), {
      message: "Amount must be a valid number",
    }),
    nextBillingDate: z.coerce.date(),
    billingCycle: z.enum(["monthly", "yearly", "quarterly", "weekly"]),
  });

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Stats schema for returning dashboard statistics
export const statsSchema = z.object({
  monthlySpending: z.number(),
  yearlySpending: z.number(),
  activeSubscriptions: z.number(),
});

export type Stats = z.infer<typeof statsSchema>;
