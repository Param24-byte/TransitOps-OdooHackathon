// src/controllers/auth.controller.ts
// HTTP layer for authentication.
// Controllers ONLY handle: parsing the request, calling the service, and formatting the response.
// They should contain ZERO business logic.

import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;
      const user = await authService.register({ email, password, name, role });

      res.status(201).json({
        success: true,
        message: "User registered successfully.",
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      res.status(400).json({ success: false, message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Login successful.",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      res.status(401).json({ success: false, message });
    }
  },

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to retrieve profile.";
      res.status(404).json({ success: false, message });
    }
  },
};
