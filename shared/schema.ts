import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum('role', ['college', 'trainer', 'admin']);
export const trainingStatusEnum = pgEnum('training_status', ['open', 'in_progress', 'completed']);
export const applicationStatusEnum = pgEnum('application_status', ['applied', 'shortlisted', 'accepted', 'rejected']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull(),
  bio: text("bio"),
  organization: text("organization"),
  verified: boolean("verified").default(false),
  skills: text("skills").array(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  requirements: many(trainingRequirements),
  applications: many(applications),
  givenReviews: many(reviews, { relationName: "givenReviews" }),
  receivedReviews: many(reviews, { relationName: "receivedReviews" }),
}));

// Training Requirements table
export const trainingRequirements = pgTable("training_requirements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  posted_by: integer("posted_by").notNull().references(() => users.id),
  status: trainingStatusEnum("status").default('open').notNull(),
  mode: text("mode").notNull(),
  skills_required: text("skills_required").array(),
  duration_weeks: integer("duration_weeks").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Training Requirements relations
export const trainingRequirementsRelations = relations(trainingRequirements, ({ one, many }) => ({
  postedBy: one(users, {
    fields: [trainingRequirements.posted_by],
    references: [users.id],
  }),
  applications: many(applications),
}));

// Applications table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  trainer_id: integer("trainer_id").notNull().references(() => users.id),
  requirement_id: integer("requirement_id").notNull().references(() => trainingRequirements.id),
  status: applicationStatusEnum("status").default('applied').notNull(),
  cover_letter: text("cover_letter"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Applications relations
export const applicationsRelations = relations(applications, ({ one, many }) => ({
  trainer: one(users, {
    fields: [applications.trainer_id],
    references: [users.id],
  }),
  requirement: one(trainingRequirements, {
    fields: [applications.requirement_id],
    references: [trainingRequirements.id],
  }),
  contract: many(contracts),
}));

// Contracts table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  trainer_id: integer("trainer_id").notNull().references(() => users.id),
  college_id: integer("college_id").notNull().references(() => users.id),
  requirement_id: integer("requirement_id").notNull().references(() => trainingRequirements.id),
  application_id: integer("application_id").notNull().references(() => applications.id),
  terms: text("terms").notNull(),
  fee: integer("fee").notNull(),
  signed_by_trainer: boolean("signed_by_trainer").default(false),
  signed_by_college: boolean("signed_by_college").default(false),
  payment_status: paymentStatusEnum("payment_status").default('pending'),
  trainer_signed_at: timestamp("trainer_signed_at"),
  college_signed_at: timestamp("college_signed_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Contracts relations
export const contractsRelations = relations(contracts, ({ one }) => ({
  trainer: one(users, {
    fields: [contracts.trainer_id],
    references: [users.id],
    relationName: "trainerContracts",
  }),
  college: one(users, {
    fields: [contracts.college_id],
    references: [users.id],
    relationName: "collegeContracts",
  }),
  requirement: one(trainingRequirements, {
    fields: [contracts.requirement_id],
    references: [trainingRequirements.id],
  }),
  application: one(applications, {
    fields: [contracts.application_id],
    references: [applications.id],
  }),
}));

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  given_by: integer("given_by").notNull().references(() => users.id),
  given_to: integer("given_to").notNull().references(() => users.id),
  requirement_id: integer("requirement_id").notNull().references(() => trainingRequirements.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  created_at: timestamp("created_at").defaultNow(),
});

// Reviews relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  giver: one(users, {
    fields: [reviews.given_by],
    references: [users.id],
    relationName: "givenReviews",
  }),
  receiver: one(users, {
    fields: [reviews.given_to],
    references: [users.id],
    relationName: "receivedReviews",
  }),
  requirement: one(trainingRequirements, {
    fields: [reviews.requirement_id],
    references: [trainingRequirements.id],
  }),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  related_entity_type: text("related_entity_type"), // e.g., 'application', 'contract', etc.
  related_entity_id: integer("related_entity_id"),
  created_at: timestamp("created_at").defaultNow(),
});

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, created_at: true, updated_at: true, verified: true });

export const insertTrainingRequirementSchema = createInsertSchema(trainingRequirements)
  .omit({ id: true, created_at: true, updated_at: true });

export const insertApplicationSchema = createInsertSchema(applications)
  .omit({ id: true, created_at: true, updated_at: true });

export const insertContractSchema = createInsertSchema(contracts)
  .omit({ 
    id: true, 
    signed_by_trainer: true, 
    signed_by_college: true, 
    trainer_signed_at: true, 
    college_signed_at: true,
    payment_status: true,
    created_at: true, 
    updated_at: true 
  });

export const insertReviewSchema = createInsertSchema(reviews)
  .omit({ id: true, created_at: true });

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, read: true, created_at: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrainingRequirement = z.infer<typeof insertTrainingRequirementSchema>;
export type TrainingRequirement = typeof trainingRequirements.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
