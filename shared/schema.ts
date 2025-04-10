import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  clerkId: text("clerk_id").unique(), // Add Clerk ID for integration
  
  // Payment related fields
  stripeCustomerId: text("stripe_customer_id").unique(),
  hasPaidPlan: boolean("has_paid_plan").default(false).notNull(),
  maxSubscriptions: integer("max_subscriptions").default(10).notNull(), // Default 10 for free plan
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  clerkId: true,
  stripeCustomerId: true,
  hasPaidPlan: true,
  maxSubscriptions: true,
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
  userId: integer("user_id"), // No longer notNull to allow guest users
  guestId: text("guest_id"), // New field to track guest users
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
    guestId: true,
    name: true,
    amount: true,
    billingCycle: true,
    nextBillingDate: true,
    category: true,
    cancelUrl: true,
  })
  .extend({
    userId: z.number().nullable().optional(),
    guestId: z.string().nullable().optional(),
    category: z.enum(subscriptionCategories),
    amount: z.string().refine(val => !isNaN(parseFloat(val)), {
      message: "Amount must be a valid number",
    }),
    nextBillingDate: z.coerce.date(),
    billingCycle: z.enum(["monthly", "yearly", "quarterly", "weekly"]),
  });

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Create a new payments table for tracking Stripe payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSessionId: text("stripe_session_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  planType: text("plan_type").notNull().default("premium"), // premium, etc.
});

// Payment insert schema
export const insertPaymentSchema = createInsertSchema(payments)
  .pick({
    userId: true,
    stripeCustomerId: true,
    stripeSessionId: true,
    stripeSubscriptionId: true,
    amount: true,
    status: true,
    planType: true,
  })
  .extend({
    amount: z.string().or(z.number()).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ),
  });

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Stats schema for returning dashboard statistics
export const statsSchema = z.object({
  monthlySpending: z.number(),
  yearlySpending: z.number(),
  activeSubscriptions: z.number(),
  subscriptionLimit: z.number(),
  isPremium: z.boolean(),
});

export type Stats = z.infer<typeof statsSchema>;
