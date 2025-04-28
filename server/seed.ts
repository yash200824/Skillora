import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users, trainingRequirements } from "@shared/schema";
import { eq } from "drizzle-orm";

// Function to seed the database with sample data
export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Clear existing data (optional - use with caution)
    // await db.delete(users).where(not(eq(users.username, "admin")));
    // await db.delete(trainingRequirements);
    
    // Trainers
    const trainers = [
      {
        username: "john",
        password: await hashPassword("John@123"),
        name: "John Doe",
        email: "john@example.com",
        role: "trainer" as const,
        bio: "Experienced finance specialist with over 10 years in corporate training. Specializes in financial literacy, investment strategies, and budgeting workshops.",
        skills: ["Finance", "Budgeting", "Investment", "Corporate Finance", "Financial Planning"],
        location: "New York, NY",
        phone: "+1 (555) 123-4567",
        verified: true
      },
      {
        username: "sarah",
        password: await hashPassword("Sarah@123"),
        name: "Sarah Lee",
        email: "sarah@example.com",
        role: "trainer" as const,
        bio: "Tech and AI specialist with expertise in machine learning, data science, and web development. Previously worked at major tech companies before becoming a full-time trainer.",
        skills: ["AI", "Machine Learning", "Web Development", "Data Science", "Python"],
        location: "San Francisco, CA",
        phone: "+1 (555) 987-6543",
        verified: true
      },
      {
        username: "amit",
        password: await hashPassword("Amit@123"),
        name: "Amit Sharma",
        email: "amit@example.com",
        role: "trainer" as const,
        bio: "Business strategy expert with a background in consulting. Helps organizations develop effective business models and growth strategies through interactive workshops.",
        skills: ["Business Strategy", "Leadership", "Management", "Consulting", "Entrepreneurship"],
        location: "Mumbai, India",
        phone: "+91 98765 43210",
        verified: true
      },
      {
        username: "priya",
        password: await hashPassword("Priya@123"),
        name: "Priya Nair",
        email: "priya@example.com",
        role: "trainer" as const,
        bio: "HR skills coach specializing in team building, workplace communication, and employee development. Creates customized training programs for organizations of all sizes.",
        skills: ["HR", "Team Building", "Communication", "Leadership", "Employee Development"],
        location: "Bangalore, India",
        phone: "+91 87654 32109",
        verified: true
      },
      {
        username: "carlos",
        password: await hashPassword("Carlos@123"),
        name: "Carlos Mendez",
        email: "carlos@example.com",
        role: "trainer" as const,
        bio: "Digital marketing trainer with expertise in social media, SEO, and content marketing. Helps businesses develop effective digital marketing strategies.",
        skills: ["Digital Marketing", "Social Media", "SEO", "Content Marketing", "Analytics"],
        location: "Miami, FL",
        phone: "+1 (555) 765-4321",
        verified: true
      }
    ];
    
    // Colleges/Universities
    const colleges = [
      {
        username: "sunrise",
        password: await hashPassword("Sunrise@123"),
        name: "Sunrise University",
        email: "sunrise@example.com",
        role: "college" as const,
        organization: "Sunrise Education Group",
        location: "Boston, MA",
        phone: "+1 (555) 111-2222",
        verified: true
      },
      {
        username: "greenfield",
        password: await hashPassword("Green@123"),
        name: "Greenfield College",
        email: "greenfield@example.com",
        role: "college" as const,
        organization: "Greenfield Education Trust",
        location: "Portland, OR",
        phone: "+1 (555) 333-4444",
        verified: true
      },
      {
        username: "techbridge",
        password: await hashPassword("Tech@123"),
        name: "TechBridge Institute",
        email: "techbridge@example.com",
        role: "college" as const,
        organization: "TechBridge Foundation",
        location: "Austin, TX",
        phone: "+1 (555) 555-6666",
        verified: true
      },
      {
        username: "blueocean",
        password: await hashPassword("Ocean@123"),
        name: "BlueOcean University",
        email: "blueocean@example.com",
        role: "college" as const,
        organization: "BlueOcean Educational Society",
        location: "Seattle, WA",
        phone: "+1 (555) 777-8888",
        verified: true
      },
      {
        username: "zenith",
        password: await hashPassword("Zenith@123"),
        name: "Zenith Business School",
        email: "zenith@example.com",
        role: "college" as const,
        organization: "Zenith Global Education",
        location: "Chicago, IL",
        phone: "+1 (555) 999-0000",
        verified: true
      }
    ];
    
    // Insert trainers
    console.log("Creating trainer accounts...");
    for (const trainer of trainers) {
      const existingUser = await storage.getUserByUsername(trainer.username);
      if (!existingUser) {
        await storage.createUser(trainer);
        console.log(`Created trainer: ${trainer.name}`);
      } else {
        console.log(`Trainer ${trainer.name} already exists, skipping...`);
      }
    }
    
    // Insert colleges
    console.log("Creating college accounts...");
    const collegeUsers = [];
    for (const college of colleges) {
      const existingUser = await storage.getUserByUsername(college.username);
      if (!existingUser) {
        const newCollege = await storage.createUser(college);
        collegeUsers.push(newCollege);
        console.log(`Created college: ${college.name}`);
      } else {
        collegeUsers.push(existingUser);
        console.log(`College ${college.name} already exists, skipping...`);
      }
    }
    
    // Requirements for each college
    console.log("Creating training requirements...");
    
    // Sunrise University Requirements
    const sunriseRequirements = [
      {
        title: "Financial Literacy Program",
        description: "A comprehensive 4-week program to teach students about personal finance, budgeting, and investment fundamentals. Looking for an experienced financial trainer who can make these concepts accessible to undergraduate students.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Finance", "Budgeting", "Investment"],
        duration_weeks: 4,
        posted_by: collegeUsers[0].id
      },
      {
        title: "Web Development Bootcamp",
        description: "An intensive 8-week web development bootcamp covering HTML, CSS, JavaScript, and modern frameworks. The ideal trainer should have industry experience and strong teaching skills.",
        status: "open" as const,
        mode: "hybrid" as const,
        skills_required: ["Web Development", "JavaScript", "HTML/CSS", "React"],
        duration_weeks: 8,
        posted_by: collegeUsers[0].id
      },
      {
        title: "Leadership Workshop Series",
        description: "A series of leadership workshops for graduate students focusing on team management, conflict resolution, and effective communication. Sessions will be held weekly over a semester.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Leadership", "Management", "Communication"],
        duration_weeks: 12,
        posted_by: collegeUsers[0].id
      },
      {
        title: "Corporate Finance Masterclass",
        description: "A specialized course on corporate finance for MBA students. Topics include valuation, capital structure, and corporate financial strategy. Seeking an experienced corporate finance professional.",
        status: "open" as const,
        mode: "online" as const,
        skills_required: ["Corporate Finance", "Valuation", "Financial Analysis"],
        duration_weeks: 6,
        posted_by: collegeUsers[0].id
      }
    ];
    
    // Greenfield College Requirements
    const greenfieldRequirements = [
      {
        title: "Digital Marketing Certificate Program",
        description: "A comprehensive program covering all aspects of digital marketing, including social media, SEO, content marketing, and analytics. The program will run for 10 weeks with both theoretical and practical components.",
        status: "open" as const,
        mode: "hybrid" as const,
        skills_required: ["Digital Marketing", "Social Media", "SEO", "Content Marketing"],
        duration_weeks: 10,
        posted_by: collegeUsers[1].id
      },
      {
        title: "Data Science Fundamentals",
        description: "An introductory course on data science for undergraduate students. The course will cover statistics, Python programming, and basic machine learning concepts. Looking for a trainer with experience in teaching technical concepts to beginners.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Data Science", "Python", "Statistics", "Machine Learning"],
        duration_weeks: 8,
        posted_by: collegeUsers[1].id
      },
      {
        title: "Entrepreneurship Workshop",
        description: "A practical workshop for students interested in starting their own businesses. Topics include business model development, market research, and pitching to investors. Seeking an experienced entrepreneur who can share real-world insights.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Entrepreneurship", "Business Strategy", "Marketing"],
        duration_weeks: 4,
        posted_by: collegeUsers[1].id
      },
      {
        title: "HR Best Practices Seminar",
        description: "A seminar series for HR management students on modern HR practices, employee development, and workplace culture. The ideal trainer should have current industry experience in HR leadership.",
        status: "open" as const,
        mode: "online" as const,
        skills_required: ["HR", "Employee Development", "Workplace Culture"],
        duration_weeks: 6,
        posted_by: collegeUsers[1].id
      }
    ];
    
    // TechBridge Institute Requirements
    const techbridgeRequirements = [
      {
        title: "Artificial Intelligence and Machine Learning Course",
        description: "An advanced course on AI and ML for computer science students. The course will cover neural networks, deep learning, and practical applications. Looking for a trainer with both academic and industry experience in AI.",
        status: "open" as const,
        mode: "hybrid" as const,
        skills_required: ["AI", "Machine Learning", "Python", "Deep Learning"],
        duration_weeks: 12,
        posted_by: collegeUsers[2].id
      },
      {
        title: "Cybersecurity Fundamentals",
        description: "A comprehensive introduction to cybersecurity principles and practices. Topics include network security, ethical hacking, and security protocols. The trainer should have practical experience in cybersecurity.",
        status: "open" as const,
        mode: "online" as const,
        skills_required: ["Cybersecurity", "Network Security", "Ethical Hacking"],
        duration_weeks: 8,
        posted_by: collegeUsers[2].id
      },
      {
        title: "Mobile App Development Workshop",
        description: "A hands-on workshop teaching students how to build mobile applications for iOS and Android platforms. The focus will be on practical, project-based learning. Seeking a trainer with experience developing and launching mobile apps.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Mobile Development", "iOS", "Android", "UI/UX"],
        duration_weeks: 6,
        posted_by: collegeUsers[2].id
      },
      {
        title: "Cloud Computing Certificate",
        description: "A certification program covering cloud infrastructure, services, and deployment models. Students will gain hands-on experience with major cloud platforms. The ideal trainer should have extensive cloud computing experience.",
        status: "open" as const,
        mode: "online" as const,
        skills_required: ["Cloud Computing", "AWS", "Azure", "DevOps"],
        duration_weeks: 10,
        posted_by: collegeUsers[2].id
      }
    ];
    
    // BlueOcean University Requirements
    const blueoceanRequirements = [
      {
        title: "Strategic Management in Global Markets",
        description: "An executive education program on strategic management for global businesses. Topics include international market entry, competitive analysis, and global business strategy. Seeking a trainer with international business experience.",
        status: "open" as const,
        mode: "hybrid" as const,
        skills_required: ["Business Strategy", "Global Markets", "Strategic Management"],
        duration_weeks: 8,
        posted_by: collegeUsers[3].id
      },
      {
        title: "Sustainable Business Practices Workshop",
        description: "A workshop series on implementing sustainable business practices and corporate social responsibility. The ideal trainer should have experience in sustainability initiatives within corporate environments.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Sustainability", "CSR", "Business Ethics"],
        duration_weeks: 4,
        posted_by: collegeUsers[3].id
      },
      {
        title: "Financial Risk Management",
        description: "An advanced course on financial risk management for finance students. Topics include market risk, credit risk, and risk mitigation strategies. Looking for a trainer with experience in risk management in financial institutions.",
        status: "open" as const,
        mode: "online" as const,
        skills_required: ["Finance", "Risk Management", "Financial Analysis"],
        duration_weeks: 6,
        posted_by: collegeUsers[3].id
      },
      {
        title: "Organizational Leadership and Change",
        description: "A program for management students on leading organizational change, managing resistance, and implementing effective change strategies. The trainer should have experience in organizational development and change management.",
        status: "open" as const,
        mode: "hybrid" as const,
        skills_required: ["Leadership", "Change Management", "Organizational Development"],
        duration_weeks: 8,
        posted_by: collegeUsers[3].id
      }
    ];
    
    // Zenith Business School Requirements
    const zenithRequirements = [
      {
        title: "Digital Transformation Strategy",
        description: "A course on digital transformation for business leaders. Topics include technology adoption, business model innovation, and change management. Seeking a trainer with experience in leading digital transformation initiatives.",
        status: "open" as const,
        mode: "online" as const,
        skills_required: ["Digital Transformation", "Strategy", "Innovation"],
        duration_weeks: 6,
        posted_by: collegeUsers[4].id
      },
      {
        title: "Executive Communication Skills",
        description: "A program for MBA students focusing on persuasive communication, executive presence, and presentation skills. The ideal trainer should have experience in executive coaching or corporate communication training.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Communication", "Leadership", "Presentation Skills"],
        duration_weeks: 4,
        posted_by: collegeUsers[4].id
      },
      {
        title: "Supply Chain Management and Analytics",
        description: "An advanced course on modern supply chain management and the use of analytics for optimization. Looking for a trainer with practical experience in supply chain management and analytics.",
        status: "open" as const,
        mode: "hybrid" as const,
        skills_required: ["Supply Chain", "Analytics", "Operations Management"],
        duration_weeks: 8,
        posted_by: collegeUsers[4].id
      },
      {
        title: "Negotiation Skills for Business Professionals",
        description: "A workshop on effective negotiation strategies, conflict resolution, and deal-making for business professionals. The trainer should have extensive experience in business negotiations.",
        status: "open" as const,
        mode: "in-person" as const,
        skills_required: ["Negotiation", "Conflict Resolution", "Communication"],
        duration_weeks: 3,
        posted_by: collegeUsers[4].id
      }
    ];
    
    // Insert all requirements
    const allRequirements = [
      ...sunriseRequirements,
      ...greenfieldRequirements,
      ...techbridgeRequirements,
      ...blueoceanRequirements,
      ...zenithRequirements
    ];
    
    for (const requirement of allRequirements) {
      // Check if a similar requirement already exists to avoid duplicates
      const existingRequirements = await db
        .select()
        .from(trainingRequirements)
        .where(eq(trainingRequirements.title, requirement.title));
      
      if (existingRequirements.length === 0) {
        await storage.createTrainingRequirement(requirement);
        console.log(`Created requirement: ${requirement.title}`);
      } else {
        console.log(`Requirement ${requirement.title} already exists, skipping...`);
      }
    }
    
    console.log("Database seeding completed successfully!");
    return { success: true, message: "Database seeded successfully with sample data" };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, message: "Error seeding database", error };
  }
}