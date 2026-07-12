// src/routes/auth.routes.ts
// Authentication routes.
// POST /api/auth/register — Create a new user account
// POST /api/auth/login    — Login and receive a JWT
// GET  /api/auth/me        — Get current user profile (protected)

import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, error: "Too many login attempts, please try again after 15 minutes" },
});

const router = Router();

// Validation schema for registration
const registerValidation = {
  email: { required: true, type: "string" as const },
  password: { required: true, type: "string" as const, min: 6 },
  name: { required: true, type: "string" as const, min: 2 },
  role: {
    required: true,
    type: "string" as const,
    enum: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
  },
};

const loginValidation = {
  email: { required: true, type: "string" as const },
  password: { required: true, type: "string" as const },
};

router.post("/register", validate(registerValidation), authController.register);
router.post("/login", loginLimiter, validate(loginValidation), authController.login);
router.get("/me", authenticate, authController.getProfile);

export default router;
