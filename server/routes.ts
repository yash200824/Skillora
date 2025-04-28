import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { eq, and, inArray, not, desc, asc } from "drizzle-orm";
import { db } from "./db";
import {
  trainingRequirements,
  applications,
  contracts,
  reviews,
  notifications,
  users,
  insertTrainingRequirementSchema,
  insertApplicationSchema,
  insertContractSchema,
  insertReviewSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";

// Helper function to check if user is authenticated with specific role
const checkRole = (role: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
};

// Helper function to create notification
const createNotificationHelper = async (userId: number, message: string, entityType?: string, entityId?: number) => {
  await storage.createNotification({
    user_id: userId,
    message,
    related_entity_type: entityType,
    related_entity_id: entityId
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes setup from blueprint
  setupAuth(app);

  // Get current user profile
  app.get("/api/profile", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Update user profile
  app.patch("/api/profile/update", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // TRAINING REQUIREMENTS ROUTES

  // Create training requirement (College only)
  app.post("/api/requirements", checkRole("college"), async (req, res) => {
    try {
      const validatedData = insertTrainingRequirementSchema.parse(req.body);
      const newRequirement = await storage.createTrainingRequirement({
        ...validatedData,
        posted_by: req.user.id
      });
      res.status(201).json(newRequirement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create training requirement" });
    }
  });

  // Get all training requirements (open ones for trainers, all for colleges)
  app.get("/api/requirements", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let requirements: typeof trainingRequirements.$inferSelect[] = [];
      
      if (req.user.role === "trainer") {
        requirements = await storage.getOpenTrainingRequirements();
      } else if (req.user.role === "college") {
        requirements = await storage.getTrainingRequirementsByCollege(req.user.id);
      } else if (req.user.role === "admin") {
        requirements = await db.select().from(trainingRequirements).orderBy(desc(trainingRequirements.created_at));
      }

      // Get the posters information
      const posterIds = [...new Set(requirements.map(req => req.posted_by))];
      const posters = await db.select().from(users).where(inArray(users.id, posterIds));
      
      const result = requirements.map(req => {
        const poster = posters.find(p => p.id === req.posted_by);
        return {
          ...req,
          poster: poster ? { id: poster.id, name: poster.name, organization: poster.organization } : null
        };
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requirements" });
    }
  });

  // Get single training requirement by ID
  app.get("/api/requirements/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const requirement = await storage.getTrainingRequirementById(parseInt(req.params.id));
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      const poster = await storage.getUser(requirement.posted_by);
      
      res.json({
        ...requirement,
        poster: poster ? { id: poster.id, name: poster.name, organization: poster.organization } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requirement" });
    }
  });

  // Update training requirement status
  app.patch("/api/requirements/:id", checkRole("college"), async (req, res) => {
    const { status } = req.body;
    const id = parseInt(req.params.id);

    try {
      const requirement = await storage.getTrainingRequirementById(id);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      if (requirement.posted_by !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own requirements" });
      }

      await storage.updateTrainingRequirementStatus(id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Delete training requirement (College only)
  app.delete("/api/requirements/:id", checkRole("college"), async (req, res) => {
    const id = parseInt(req.params.id);

    try {
      const requirement = await storage.getTrainingRequirementById(id);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      if (requirement.posted_by !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own requirements" });
      }

      // Check if there are any applications
      const existingApplications = await storage.getApplicationsByRequirement(id);
      if (existingApplications.length > 0) {
        return res.status(400).json({ message: "Cannot delete requirement with existing applications" });
      }

      await db.delete(trainingRequirements).where(eq(trainingRequirements.id, id));
      res.json({ message: "Requirement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete requirement" });
    }
  });

  // APPLICATION ROUTES

  // Apply to a training requirement (Trainer only)
  app.post("/api/apply/:requirementId", checkRole("trainer"), async (req, res) => {
    const requirementId = parseInt(req.params.requirementId);

    try {
      // Check if requirement exists and is open
      const requirement = await storage.getTrainingRequirementById(requirementId);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      if (requirement.status !== "open") {
        return res.status(400).json({ message: "This training requirement is not open for applications" });
      }

      // Check if trainer has already applied
      const existingApplications = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.trainer_id, req.user.id),
            eq(applications.requirement_id, requirementId)
          )
        );

      if (existingApplications.length > 0) {
        return res.status(400).json({ message: "You have already applied to this requirement" });
      }

      // Create the application
      const application = await storage.createApplication({
        trainer_id: req.user.id,
        requirement_id: requirementId,
        cover_letter: req.body.cover_letter
      });

      // Create notification for college
      createNotificationHelper(
        requirement.posted_by,
        `New application received for "${requirement.title}"`,
        "application",
        application.id
      );

      res.status(201).json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // Get applications by trainer
  app.get("/api/my-applications", checkRole("trainer"), async (req, res) => {
    try {
      const trainerApplications = await storage.getApplicationsByTrainer(req.user.id);
      
      // Get related requirements
      const requirementIds = [...new Set(trainerApplications.map(app => app.requirement_id))];
      const requirements = await db
        .select()
        .from(trainingRequirements)
        .where(inArray(trainingRequirements.id, requirementIds));
      
      // Get colleges
      const collegeIds = [...new Set(requirements.map(req => req.posted_by))];
      const colleges = await db
        .select()
        .from(users)
        .where(inArray(users.id, collegeIds));
      
      const result = trainerApplications.map(app => {
        const requirement = requirements.find(req => req.id === app.requirement_id);
        const college = requirement ? colleges.find(col => col.id === requirement.posted_by) : null;
        
        return {
          ...app,
          requirement: requirement || null,
          college: college ? { id: college.id, name: college.name, organization: college.organization } : null
        };
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get applications for a specific requirement (College only)
  app.get("/api/requirements/:id/applications", checkRole("college"), async (req, res) => {
    const requirementId = parseInt(req.params.id);

    try {
      const requirement = await storage.getTrainingRequirementById(requirementId);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      if (requirement.posted_by !== req.user.id) {
        return res.status(403).json({ message: "You can only view applications for your own requirements" });
      }

      const requirementApplications = await storage.getApplicationsByRequirement(requirementId);
      
      // Get trainers info
      const trainerIds = [...new Set(requirementApplications.map(app => app.trainer_id))];
      const trainers = await db
        .select()
        .from(users)
        .where(inArray(users.id, trainerIds));
      
      const result = requirementApplications.map(app => {
        const trainer = trainers.find(t => t.id === app.trainer_id);
        return {
          ...app,
          trainer: trainer ? {
            id: trainer.id,
            name: trainer.name,
            email: trainer.email,
            bio: trainer.bio,
            skills: trainer.skills
          } : null
        };
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Shortlist an application (College only)
  app.post("/api/requirements/:id/shortlist", checkRole("college"), async (req, res) => {
    const { applicationId } = req.body;
    const requirementId = parseInt(req.params.id);

    try {
      const requirement = await storage.getTrainingRequirementById(requirementId);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      if (requirement.posted_by !== req.user.id) {
        return res.status(403).json({ message: "You can only shortlist applications for your own requirements" });
      }

      const application = await storage.getApplicationById(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.requirement_id !== requirementId) {
        return res.status(400).json({ message: "Application does not belong to this requirement" });
      }

      await storage.updateApplicationStatus(applicationId, "shortlisted");
      
      // Create notification for trainer
      createNotificationHelper(
        application.trainer_id,
        `Your application for "${requirement.title}" has been shortlisted`,
        "application",
        applicationId
      );

      res.json({ message: "Application shortlisted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to shortlist application" });
    }
  });

  // Accept an application (College only)
  app.post("/api/requirements/:id/accept", checkRole("college"), async (req, res) => {
    const { applicationId } = req.body;
    const requirementId = parseInt(req.params.id);

    try {
      const requirement = await storage.getTrainingRequirementById(requirementId);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      if (requirement.posted_by !== req.user.id) {
        return res.status(403).json({ message: "You can only accept applications for your own requirements" });
      }

      const application = await storage.getApplicationById(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.requirement_id !== requirementId) {
        return res.status(400).json({ message: "Application does not belong to this requirement" });
      }

      // Update the application status
      await storage.updateApplicationStatus(applicationId, "accepted");

      // Generate a contract
      const terms = `This contract is for the training requirement "${requirement.title}" between ${req.user.name} (College) and the selected trainer. The training will be conducted according to the requirement description and will follow all agreed terms.`;
      
      const contract = await storage.createContract({
        trainer_id: application.trainer_id,
        college_id: req.user.id,
        requirement_id: requirementId,
        application_id: applicationId,
        terms,
        fee: 1000 // Default fee for MVP
      });

      // Update requirement status
      await storage.updateTrainingRequirementStatus(requirementId, "in_progress");

      // Create notification for trainer
      createNotificationHelper(
        application.trainer_id,
        `Your application for "${requirement.title}" has been accepted! A contract is ready for your review.`,
        "contract",
        contract.id
      );

      res.json({ 
        message: "Application accepted successfully", 
        contract
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept application" });
    }
  });

  // CONTRACT ROUTES

  // Get all contracts for a user (both college and trainer)
  app.get("/api/contracts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let userContracts: typeof contracts.$inferSelect[] = [];
      
      if (req.user.role === "trainer") {
        userContracts = await storage.getContractsByTrainer(req.user.id);
      } else if (req.user.role === "college") {
        userContracts = await storage.getContractsByCollege(req.user.id);
      }

      // Get requirements and users
      const requirementIds = [...new Set(userContracts.map(c => c.requirement_id))];
      const requirements = await db
        .select()
        .from(trainingRequirements)
        .where(inArray(trainingRequirements.id, requirementIds));
      
      const userIds = [
        ...new Set([
          ...userContracts.map(c => c.trainer_id),
          ...userContracts.map(c => c.college_id)
        ])
      ];
      
      const contractUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));
      
      const result = userContracts.map(contract => {
        const requirement = requirements.find(r => r.id === contract.requirement_id);
        const trainer = contractUsers.find(u => u.id === contract.trainer_id);
        const college = contractUsers.find(u => u.id === contract.college_id);
        
        return {
          ...contract,
          requirement: requirement || null,
          trainer: trainer ? { id: trainer.id, name: trainer.name } : null,
          college: college ? { id: college.id, name: college.name, organization: college.organization } : null
        };
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  // Get a specific contract
  app.get("/api/contracts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const contractId = parseInt(req.params.id);

    try {
      const contract = await storage.getContractById(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Check if user is authorized to view this contract
      if (req.user.id !== contract.trainer_id && req.user.id !== contract.college_id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to view this contract" });
      }

      // Get requirement and application details
      const requirement = await storage.getTrainingRequirementById(contract.requirement_id);
      const application = await storage.getApplicationById(contract.application_id);
      
      // Get user details
      const trainer = await storage.getUser(contract.trainer_id);
      const college = await storage.getUser(contract.college_id);
      
      res.json({
        ...contract,
        requirement,
        application,
        trainer: trainer ? { id: trainer.id, name: trainer.name, email: trainer.email } : null,
        college: college ? { id: college.id, name: college.name, organization: college.organization, email: college.email } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  // Sign a contract
  app.post("/api/contract/sign", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { contractId } = req.body;

    try {
      const contract = await storage.getContractById(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Determine if the user is the trainer or the college
      let role: 'trainer' | 'college';
      let otherPartyId: number;

      if (req.user.id === contract.trainer_id) {
        role = 'trainer';
        otherPartyId = contract.college_id;

        // Check if trainer has already signed
        if (contract.signed_by_trainer) {
          return res.status(400).json({ message: "You have already signed this contract" });
        }
      } else if (req.user.id === contract.college_id) {
        role = 'college';
        otherPartyId = contract.trainer_id;

        // Check if college has already signed
        if (contract.signed_by_college) {
          return res.status(400).json({ message: "You have already signed this contract" });
        }
      } else {
        return res.status(403).json({ message: "You don't have permission to sign this contract" });
      }

      // Update signature
      await storage.updateContractSignature(contractId, role);

      // Create notification for the other party
      const requirement = await storage.getTrainingRequirementById(contract.requirement_id);
      createNotificationHelper(
        otherPartyId,
        `${req.user.name} has signed the contract for "${requirement.title}"`,
        "contract",
        contractId
      );

      res.json({ message: "Contract signed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to sign contract" });
    }
  });

  // Mark a contract as paid (College only)
  app.post("/api/contract/payment", checkRole("college"), async (req, res) => {
    const { contractId } = req.body;

    try {
      const contract = await storage.getContractById(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      if (contract.college_id !== req.user.id) {
        return res.status(403).json({ message: "You can only mark your own contracts as paid" });
      }

      if (contract.payment_status === "paid") {
        return res.status(400).json({ message: "Payment has already been marked as completed" });
      }

      // Both parties must have signed
      if (!contract.signed_by_trainer || !contract.signed_by_college) {
        return res.status(400).json({ message: "Both parties must sign the contract before marking payment as complete" });
      }

      // Update payment status
      await storage.updatePaymentStatus(contractId, "paid");

      // Create notification for trainer
      const requirement = await storage.getTrainingRequirementById(contract.requirement_id);
      createNotificationHelper(
        contract.trainer_id,
        `Payment for "${requirement.title}" has been marked as completed`,
        "contract",
        contractId
      );

      res.json({ message: "Payment marked as completed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // REVIEW ROUTES

  // Create a review
  app.post("/api/review", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { given_to, requirement_id, rating, comment } = req.body;
      
      // Check if the requirement exists
      const requirement = await storage.getTrainingRequirementById(requirement_id);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      // Verify the user is either the college or the trainer
      let isAuthorized = false;
      let receiverRole = "";

      if (req.user.id === requirement.posted_by) {
        // College is reviewing a trainer
        isAuthorized = true;
        receiverRole = "trainer";
      } else {
        // Check if the user is a trainer who was accepted for this requirement
        const applications = await db
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.trainer_id, req.user.id),
              eq(applications.requirement_id, requirement_id),
              eq(applications.status, "accepted")
            )
          );

        if (applications.length > 0) {
          isAuthorized = true;
          receiverRole = "college";
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ message: "You don't have permission to review this requirement" });
      }

      // Check if the receiver has the correct role
      const receiver = await storage.getUser(given_to);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      if (receiver.role !== receiverRole) {
        return res.status(400).json({ message: `The receiver must be a ${receiverRole}` });
      }

      // Check if a review already exists
      const existingReviews = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.given_by, req.user.id),
            eq(reviews.given_to, given_to),
            eq(reviews.requirement_id, requirement_id)
          )
        );

      if (existingReviews.length > 0) {
        return res.status(400).json({ message: "You have already reviewed this user for this requirement" });
      }

      // Create the review
      const review = await storage.createReview({
        given_by: req.user.id,
        given_to,
        requirement_id,
        rating,
        comment
      });

      // Create notification
      createNotificationHelper(
        given_to,
        `You received a ${rating}-star review from ${req.user.name} for "${requirement.title}"`,
        "review",
        review.id
      );

      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get reviews for a user
  app.get("/api/reviews/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = parseInt(req.params.userId);

    try {
      const userReviews = await storage.getReviewsByUser(userId);
      
      // Get requirements and reviewers
      const requirementIds = [...new Set(userReviews.map(r => r.requirement_id))];
      const requirements = await db
        .select()
        .from(trainingRequirements)
        .where(inArray(trainingRequirements.id, requirementIds));
      
      const reviewerIds = [...new Set(userReviews.map(r => r.given_by))];
      const reviewers = await db
        .select()
        .from(users)
        .where(inArray(users.id, reviewerIds));
      
      const result = userReviews.map(review => {
        const requirement = requirements.find(r => r.id === review.requirement_id);
        const reviewer = reviewers.find(u => u.id === review.given_by);
        
        return {
          ...review,
          requirement: requirement ? { id: requirement.id, title: requirement.title } : null,
          reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, role: reviewer.role } : null
        };
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get average rating for a user
  app.get("/api/ratings/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = parseInt(req.params.userId);

    try {
      const avgRating = await storage.getAverageRatingForUser(userId);
      res.json({ averageRating: avgRating });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch average rating" });
    }
  });

  // NOTIFICATION ROUTES

  // Get notifications for a user
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userNotifications = await storage.getNotificationsByUser(req.user.id);
      res.json(userNotifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notificationId = parseInt(req.params.id);

    try {
      // Verify the notification belongs to the user
      const [notification] = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.user_id, req.user.id)
          )
        );

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // ADMIN ROUTES

  // Get all trainers (Admin only)
  app.get("/api/admin/trainers", checkRole("admin"), async (req, res) => {
    try {
      const trainersList = await storage.getUsersByRole("trainer");
      res.json(trainersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trainers" });
    }
  });

  // Approve trainer (Admin only)
  app.patch("/api/admin/approve-trainer/:trainerId", checkRole("admin"), async (req, res) => {
    const trainerId = parseInt(req.params.trainerId);

    try {
      const trainer = await storage.getUser(trainerId);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }

      if (trainer.role !== "trainer") {
        return res.status(400).json({ message: "User is not a trainer" });
      }

      await storage.updateUser(trainerId, { verified: true });
      
      // Create notification
      createNotificationHelper(
        trainerId,
        "Your profile has been approved by admin. You can now apply to training requirements.",
        "profile_approval"
      );

      res.json({ message: "Trainer approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve trainer" });
    }
  });

  // Get all colleges (Admin only)
  app.get("/api/admin/colleges", checkRole("admin"), async (req, res) => {
    try {
      const collegesList = await storage.getUsersByRole("college");
      res.json(collegesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch colleges" });
    }
  });

  // Block/Unblock user (Admin only)
  app.patch("/api/admin/block-user/:userId", checkRole("admin"), async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { blocked } = req.body;

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For simplicity, we're using the 'verified' field to indicate blocked status (verified = !blocked)
      await storage.updateUser(userId, { verified: !blocked });
      
      // Create notification
      createNotificationHelper(
        userId,
        blocked ? "Your account has been blocked by admin." : "Your account has been unblocked by admin.",
        "account_status"
      );

      res.json({ message: blocked ? "User blocked successfully" : "User unblocked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Platform Statistics (Admin only)
  app.get("/api/admin/statistics", checkRole("admin"), async (req, res) => {
    try {
      const [trainers, colleges, openRequirements, inProgressRequirements, completedRequirements, totalApplications, totalContracts] = await Promise.all([
        db.select().from(users).where(eq(users.role, "trainer")),
        db.select().from(users).where(eq(users.role, "college")),
        db.select().from(trainingRequirements).where(eq(trainingRequirements.status, "open")),
        db.select().from(trainingRequirements).where(eq(trainingRequirements.status, "in_progress")),
        db.select().from(trainingRequirements).where(eq(trainingRequirements.status, "completed")),
        db.select().from(applications),
        db.select().from(contracts)
      ]);

      res.json({
        users: {
          trainers: trainers.length,
          colleges: colleges.length,
          total: trainers.length + colleges.length + 1 // +1 for admin
        },
        requirements: {
          open: openRequirements.length,
          inProgress: inProgressRequirements.length,
          completed: completedRequirements.length,
          total: openRequirements.length + inProgressRequirements.length + completedRequirements.length
        },
        applications: {
          total: totalApplications.length,
          accepted: totalApplications.filter(a => a.status === "accepted").length,
          pending: totalApplications.filter(a => a.status === "applied" || a.status === "shortlisted").length
        },
        contracts: {
          total: totalContracts.length,
          signed: totalContracts.filter(c => c.signed_by_trainer && c.signed_by_college).length,
          paid: totalContracts.filter(c => c.payment_status === "paid").length
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
