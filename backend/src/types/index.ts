// src/types/index.ts
// Centralized custom TypeScript types for the backend.
// WHY? Instead of repeating inline types across controllers and services,
// we define them once here. This ensures consistency and makes refactoring easier.

import { Request } from "express";

// Extends Express's Request to include the authenticated user payload.
// After our JWT middleware verifies the token, it attaches the decoded
// user data here so downstream controllers can access req.user.
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Standard API response shape for consistency across all endpoints.
// Every response from our API will follow this contract.
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
