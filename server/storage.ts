import { 
  users, 
  type User, 
  type InsertUser, 
  trainingRequirements, 
  type TrainingRequirement, 
  type InsertTrainingRequirement, 
  applications, 
  type Application, 
  type InsertApplication, 
  contracts, 
  type Contract, 
  type InsertContract, 
  reviews, 
  type Review, 
  type InsertReview, 
  notifications, 
  type Notification, 
  type InsertNotification 
} from "@shared/schema";

import { db } from "./db";
import { eq, and, inArray, not, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUsersByRole(role: 'college' | 'trainer' | 'admin'): Promise<User[]>;
  
  // Training requirements methods
  createTrainingRequirement(requirement: InsertTrainingRequirement): Promise<TrainingRequirement>;
  getTrainingRequirementById(id: number): Promise<TrainingRequirement | undefined>;
  getTrainingRequirementsByCollege(collegeId: number): Promise<TrainingRequirement[]>;
  getOpenTrainingRequirements(): Promise<TrainingRequirement[]>;
  updateTrainingRequirementStatus(id: number, status: 'open' | 'in_progress' | 'completed'): Promise<void>;
  
  // Applications methods
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByTrainer(trainerId: number): Promise<Application[]>;
  getApplicationsByRequirement(requirementId: number): Promise<Application[]>;
  updateApplicationStatus(id: number, status: 'applied' | 'shortlisted' | 'accepted' | 'rejected'): Promise<void>;
  
  // Contract methods
  createContract(contract: InsertContract): Promise<Contract>;
  getContractById(id: number): Promise<Contract | undefined>;
  getContractsByTrainer(trainerId: number): Promise<Contract[]>;
  getContractsByCollege(collegeId: number): Promise<Contract[]>;
  updateContractSignature(id: number, role: 'trainer' | 'college'): Promise<void>;
  updatePaymentStatus(id: number, status: 'paid'): Promise<void>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  getAverageRatingForUser(userId: number): Promise<number>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getUsersByRole(role: 'college' | 'trainer' | 'admin'): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
  
  // Training requirements methods
  async createTrainingRequirement(requirement: InsertTrainingRequirement): Promise<TrainingRequirement> {
    const [createdRequirement] = await db
      .insert(trainingRequirements)
      .values(requirement)
      .returning();
    return createdRequirement;
  }
  
  async getTrainingRequirementById(id: number): Promise<TrainingRequirement | undefined> {
    const [requirement] = await db
      .select()
      .from(trainingRequirements)
      .where(eq(trainingRequirements.id, id));
    return requirement;
  }
  
  async getTrainingRequirementsByCollege(collegeId: number): Promise<TrainingRequirement[]> {
    return await db
      .select()
      .from(trainingRequirements)
      .where(eq(trainingRequirements.posted_by, collegeId))
      .orderBy(desc(trainingRequirements.created_at));
  }
  
  async getOpenTrainingRequirements(): Promise<TrainingRequirement[]> {
    return await db
      .select()
      .from(trainingRequirements)
      .where(eq(trainingRequirements.status, 'open'))
      .orderBy(desc(trainingRequirements.created_at));
  }
  
  async updateTrainingRequirementStatus(id: number, status: 'open' | 'in_progress' | 'completed'): Promise<void> {
    await db
      .update(trainingRequirements)
      .set({ 
        status, 
        updated_at: new Date() 
      })
      .where(eq(trainingRequirements.id, id));
  }
  
  // Applications methods
  async createApplication(application: InsertApplication): Promise<Application> {
    const [createdApplication] = await db
      .insert(applications)
      .values(application)
      .returning();
    return createdApplication;
  }
  
  async getApplicationById(id: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application;
  }
  
  async getApplicationsByTrainer(trainerId: number): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.trainer_id, trainerId))
      .orderBy(desc(applications.created_at));
  }
  
  async getApplicationsByRequirement(requirementId: number): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.requirement_id, requirementId))
      .orderBy(desc(applications.created_at));
  }
  
  async updateApplicationStatus(id: number, status: 'applied' | 'shortlisted' | 'accepted' | 'rejected'): Promise<void> {
    await db
      .update(applications)
      .set({ 
        status, 
        updated_at: new Date() 
      })
      .where(eq(applications.id, id));
  }
  
  // Contract methods
  async createContract(contract: InsertContract): Promise<Contract> {
    const [createdContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return createdContract;
  }
  
  async getContractById(id: number): Promise<Contract | undefined> {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id));
    return contract;
  }
  
  async getContractsByTrainer(trainerId: number): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.trainer_id, trainerId))
      .orderBy(desc(contracts.created_at));
  }
  
  async getContractsByCollege(collegeId: number): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.college_id, collegeId))
      .orderBy(desc(contracts.created_at));
  }
  
  async updateContractSignature(id: number, role: 'trainer' | 'college'): Promise<void> {
    const updateData = role === 'trainer' 
      ? { 
          signed_by_trainer: true, 
          trainer_signed_at: new Date(),
          updated_at: new Date()
        } 
      : { 
          signed_by_college: true, 
          college_signed_at: new Date(),
          updated_at: new Date()
        };
    
    await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id));
  }
  
  async updatePaymentStatus(id: number, status: 'paid'): Promise<void> {
    await db
      .update(contracts)
      .set({ 
        payment_status: status,
        updated_at: new Date() 
      })
      .where(eq(contracts.id, id));
  }
  
  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const [createdReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return createdReview;
  }
  
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.given_to, userId))
      .orderBy(desc(reviews.created_at));
  }
  
  async getAverageRatingForUser(userId: number): Promise<number> {
    const userReviews = await this.getReviewsByUser(userId);
    
    if (userReviews.length === 0) {
      return 0;
    }
    
    const sum = userReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / userReviews.length;
  }
  
  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return createdNotification;
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at));
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
