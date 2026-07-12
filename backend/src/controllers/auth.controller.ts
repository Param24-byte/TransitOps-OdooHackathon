// src/controllers/auth.controller.ts
// HTTP layer for authentication.
// Controllers ONLY handle: parsing the request, calling the service, and formatting the response.
// They should contain ZERO business logic.

import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const user = await authService.register({ email, password, name, role: "DRIVER" });

      res.status(201).json({
        success: true,
        message: "User registered successfully.",
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Login successful.",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(401).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated." });
        return;
      }

      const user = await authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        message: "Profile retrieved.",
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(404).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },
};
