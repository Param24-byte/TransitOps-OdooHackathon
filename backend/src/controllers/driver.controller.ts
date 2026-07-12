// src/controllers/driver.controller.ts

import { Request, Response, NextFunction } from "express";
import { driverService } from "../services/driver.service";
import { DriverStatus } from "@prisma/client";

export const driverController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as DriverStatus | undefined;
      if (status && !Object.values(DriverStatus).includes(status)) {
        res.status(400).json({ success: false, message: "Invalid driver status." });
        return;
      }
      const drivers = await driverService.getAll(status);

      res.status(200).json({
        success: true,
        message: "Drivers retrieved.",
        data: drivers,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(500).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid driver ID." });
        return;
      }

      const driver = await driverService.getById(id);

      res.status(200).json({
        success: true,
        message: "Driver retrieved.",
        data: driver,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(404).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driver = await driverService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Driver created successfully.",
        data: driver,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid driver ID." });
        return;
      }

      const driver = await driverService.update(id, req.body);

      res.status(200).json({
        success: true,
        message: "Driver updated successfully.",
        data: driver,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid driver ID." });
        return;
      }

      await driverService.delete(id);

      res.status(200).json({
        success: true,
        message: "Driver deleted successfully.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async suspend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid driver ID." });
        return;
      }

      await driverService.suspend(id);

      res.status(200).json({
        success: true,
        message: "Driver suspended successfully.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await driverService.getStats();

      res.status(200).json({
        success: true,
        message: "Driver stats retrieved.",
        data: stats,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(500).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },
};
