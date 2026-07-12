// src/services/auth.service.ts
// Authentication business logic — separated from the HTTP layer.
// WHY? Controllers should only handle req/res. Business logic (hashing,
// token generation, user lookup) belongs here so it can be reused
// and tested independently.

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { Role } from "@prisma/client";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production.");
}
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const SALT_ROUNDS = 10; // bcrypt cost factor: 2^10 = 1024 iterations

export const authService = {
  /**
   * Register a new user.
   * 1. Check if the email already exists (unique constraint).
   * 2. Hash the password with bcrypt (NEVER store plain text passwords).
   * 3. Create the user in the database.
   * 4. Return the user WITHOUT the password field.
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: Role;
  }) {
    // Check for duplicate email before hitting a database constraint error
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    // Hash the password — bcrypt automatically generates a random salt
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
      },
      // Prisma's select lets us exclude the password from the response
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  },

  /**
   * Login: verify credentials and return a JWT.
   * 1. Find user by email.
   * 2. Compare provided password with stored hash using bcrypt.
   * 3. If valid, sign a JWT containing the user's id, email, and role.
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    // bcrypt.compare handles salt extraction and comparison internally
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password.");
    }

    // JWT payload — keep it minimal (no sensitive data)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  /**
   * Get user profile by ID (used by the "me" endpoint).
   */
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  },
};
