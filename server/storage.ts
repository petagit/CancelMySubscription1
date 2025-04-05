import { users, type User, type InsertUser, subscriptions, type Subscription, type InsertSubscription, type Stats } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscriptions: Map<number, Subscription>;
  private userIdCounter: number;
  private subscriptionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.userIdCounter = 1;
    this.subscriptionIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id,
      isActive: true
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      (subscription) => subscription.userId === userId
    );
  }

  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async updateSubscription(id: number, subscriptionUpdate: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const existingSubscription = this.subscriptions.get(id);
    
    if (!existingSubscription) return undefined;
    
    const updatedSubscription: Subscription = {
      ...existingSubscription,
      ...subscriptionUpdate
    };
    
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async deleteSubscription(id: number): Promise<boolean> {
    return this.subscriptions.delete(id);
  }

  async getSubscriptionStats(userId: number): Promise<Stats> {
    const userSubscriptions = await this.getSubscriptionsByUserId(userId);
    const activeSubscriptions = userSubscriptions.filter(sub => sub.isActive);
    
    let monthlySpending = 0;
    let yearlySpending = 0;
    
    activeSubscriptions.forEach(subscription => {
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
      activeSubscriptions: activeSubscriptions.length
    };
  }
}

export const storage = new MemStorage();
