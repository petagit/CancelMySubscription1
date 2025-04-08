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
  getUserByClerkId(clerkId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>; // Added updateUser method
  
  // Subscription related methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionsByUserId(userId: number): Promise<Subscription[]>;
  getSubscriptionsByGuestId(guestId: string): Promise<Subscription[]>;
  getSubscriptionById(id: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: number): Promise<boolean>;
  getSubscriptionStats(userId: number): Promise<Stats>;
  getSubscriptionStatsForGuest(guestId: string): Promise<Stats>;
  
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
  
  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    console.log(`=== Looking up user by Clerk ID: ${clerkId} ===`);
    
    try {
      // First, check if the clerkId is valid
      if (!clerkId) {
        console.log('Invalid Clerk ID: null or empty');
        return undefined;
      }
      
      // Log the actual SQL query that would be executed
      const query = db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId));
      
      console.log('Executing SQL query:', query.toSQL());
      
      const [user] = await query;
      
      if (user) {
        console.log(`Found user with ID ${user.id} for Clerk ID ${clerkId}`);
        console.log(`User details: username=${user.username}, clerkId=${user.clerkId}`);
      } else {
        console.log(`No user found with Clerk ID: ${clerkId}`);
        
        // If not found by exact match, try to find users with similar clerk IDs to debug issues
        const allUsers = await db.select().from(users);
        console.log(`Total users in database: ${allUsers.length}`);
        
        const usersWithClerkIds = allUsers.filter(u => u.clerkId);
        console.log(`Users with Clerk IDs: ${usersWithClerkIds.length}`);
        
        if (usersWithClerkIds.length > 0) {
          console.log('Sample of users with Clerk IDs:');
          usersWithClerkIds.slice(0, 5).forEach(u => {
            console.log(`- User ID: ${u.id}, username: ${u.username}, clerkId: ${u.clerkId}`);
          });
        }
      }
      
      return user;
    } catch (error) {
      console.error(`Error looking up user by Clerk ID ${clerkId}:`, error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
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

  async getSubscriptionsByGuestId(guestId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.guestId, guestId));
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
    
    return this.calculateStats(userSubscriptions);
  }
  
  async getSubscriptionStatsForGuest(guestId: string): Promise<Stats> {
    // Get all active subscriptions for the guest user
    const guestSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.guestId, guestId),
        eq(subscriptions.isActive, true)
      ));
    
    return this.calculateStats(guestSubscriptions);
  }
  
  private calculateStats(subscriptionsList: Subscription[]): Stats {
    let monthlySpending = 0;
    let yearlySpending = 0;
    
    subscriptionsList.forEach(subscription => {
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
      activeSubscriptions: subscriptionsList.length
    };
  }
}

export const storage = new DatabaseStorage();
