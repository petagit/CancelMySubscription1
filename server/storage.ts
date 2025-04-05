import { users, type User, type InsertUser, subscriptions, type Subscription, type InsertSubscription, type Stats } from "@shared/schema";
import { db } from "./db";
import { eq, and, count, sum } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Subscription related methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionsByUserId(userId: number): Promise<Subscription[]>;
  getSubscriptionById(id: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: number): Promise<boolean>;
  getSubscriptionStats(userId: number): Promise<Stats>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        ...insertSubscription,
        isActive: true
      })
      .returning();
    return subscription;
  }

  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
  }

  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async updateSubscription(id: number, subscriptionUpdate: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscriptionUpdate)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async deleteSubscription(id: number): Promise<boolean> {
    const result = await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, id))
      .returning({ id: subscriptions.id });
    
    return result.length > 0;
  }

  async getSubscriptionStats(userId: number): Promise<Stats> {
    // Get all active subscriptions for the user
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.isActive, true)
      ));
    
    let monthlySpending = 0;
    let yearlySpending = 0;
    
    userSubscriptions.forEach(subscription => {
      const amount = Number(subscription.amount);
      
      switch(subscription.billingCycle) {
        case 'monthly':
          monthlySpending += amount;
          yearlySpending += amount * 12;
          break;
        case 'yearly':
          monthlySpending += amount / 12;
          yearlySpending += amount;
          break;
        case 'quarterly':
          monthlySpending += amount / 3;
          yearlySpending += amount * 4;
          break;
        case 'weekly':
          monthlySpending += amount * 4.33; // Average weeks in a month
          yearlySpending += amount * 52;
          break;
      }
    });
    
    return {
      monthlySpending,
      yearlySpending,
      activeSubscriptions: userSubscriptions.length
    };
  }
}

export const storage = new DatabaseStorage();
