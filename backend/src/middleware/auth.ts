// src/middleware/auth.ts
// JWT Authentication & Role-Based Authorization middleware.
//
// HOW IT WORKS:
// 1. Client sends a request with header: Authorization: Bearer <token>
// 2. This middleware extracts the token, verifies it using our JWT_SECRET.
// 3. If valid, it attaches the decoded user payload to `req.user`.
// 4. If invalid/missing, it rejects the request with a 401 Unauthorized.
//
// The `authorize` function is a Higher-Order Function (HOF) that returns
// a middleware. It checks if req.user.role is in the allowed roles list.
// This is how we implement Role-Based Access Control (RBAC).

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production.");
}
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Middleware: Verify that the request has a valid JWT token
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
    return;
  }

  // Extract the token part after "Bearer "
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Access denied. Token is malformed.",
    });
    return;
  }

  try {
    // jwt.verify throws if the token is expired or tampered with
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    // Attach decoded user data to the request for downstream use
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Access denied. Token is invalid or expired.",
    });
  }
};

// HOF: Returns a middleware that checks if the user's role is allowed
// Usage: router.get("/admin", authenticate, authorize("FLEET_MANAGER"), handler)
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Access denied. Not authenticated.",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};
