// src/middleware/errorHandler.ts
// Global error handling middleware for Express.
// WHY? Without this, any unhandled error in a route would crash the server
// or leak a raw stack trace to the client. This middleware catches ALL errors
// and returns a clean, structured JSON response.
//
// Express recognizes a middleware as an error handler when it has 4 parameters:
// (err, req, res, next). This MUST be registered LAST in the middleware chain.

import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  const response: ApiResponse = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  // In production, never expose stack traces
  if (process.env.NODE_ENV === "development") {
    response.errors = [err.stack || ""];
  }

  res.status(statusCode).json(response);
};
