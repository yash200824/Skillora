import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Generate a random secret if one isn't provided
  const SESSION_SECRET = process.env.SESSION_SECRET || 
    require('crypto').randomBytes(32).toString('hex');
  
  console.log('Setting up session middleware with PostgreSQL store');
  
  const sessionSettings: session.SessionOptions = {
    secret: SESSION_SECRET,
    name: 'connect.sid', // Default name, being explicit
    resave: false,       // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    rolling: true,       // Force cookie set on every response
    cookie: {
      path: '/',         // Cookie valid for the entire site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,    // Cookie not accessible via JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'    // Provides CSRF protection with some exceptions
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`Attempting to authenticate user: ${username}`);
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`Authentication failed: User ${username} not found`);
          return done(null, false, { message: "User not found" });
        }
        
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          console.log(`Authentication failed: Invalid password for ${username}`);
          return done(null, false, { message: "Invalid password" });
        }
        
        console.log(`Authentication successful for ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`Authentication error for ${username}:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user ID:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found during deserialization");
        return done(new Error("User not found"), null);
      }
      console.log("User deserialized successfully");
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    console.log("Registration request received:", { 
      username: req.body.username,
      email: req.body.email,
      role: req.body.role
    });
    
    try {
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        console.log(`Registration failed: Username ${req.body.username} already exists`);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log(`Registration failed: Email ${req.body.email} already exists`);
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Validate required fields
      const requiredFields = ['username', 'password', 'email', 'name', 'role'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          console.log(`Registration failed: Missing required field ${field}`);
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      console.log(`Password hashed successfully for ${req.body.username}`);
      
      const userData = {
        ...req.body,
        password: hashedPassword,
        // Make sure skills is properly formatted as an array
        skills: Array.isArray(req.body.skills) ? req.body.skills : 
                req.body.skills ? [req.body.skills] : [],
      };
      
      console.log(`Creating user in database: ${req.body.username}`);
      const user = await storage.createUser(userData);
      console.log(`User created successfully: ${user.id} (${user.username})`);
      
      // Log the user in automatically after registration
      req.login(user, (err) => {
        if (err) {
          console.error("Error during login after registration:", err);
          return next(err);
        }
        
        console.log(`User logged in after registration: ${user.id}`);
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Registration failed due to server error" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session error during login:", loginErr);
          return next(loginErr);
        }
        
        console.log("User logged in successfully:", user.id);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (!req.isAuthenticated()) {
      console.log("Logout requested but no authenticated user found");
      return res.status(200).json({ message: "Not logged in" });
    }
    
    // Store user info for logging before logout
    const userId = req.user?.id;
    const username = req.user?.username;
    console.log(`Logging out user: ${username} (ID: ${userId})`);
    
    req.logout((err) => {
      if (err) {
        console.error("Passport logout error:", err);
        return next(err);
      }
      
      console.log(`Passport logout successful for user: ${username}`);
      
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destruction error:", sessionErr);
          return next(sessionErr);
        }
        
        console.log(`Session destroyed for user: ${username}`);
        
        // Clear the session cookie with proper options
        res.clearCookie('connect.sid', { 
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        console.log("Logout process completed successfully");
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
