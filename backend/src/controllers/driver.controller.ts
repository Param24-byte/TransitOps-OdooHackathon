// src/controllers/driver.controller.ts

import { Request, Response } from "express";
import { driverService } from "../services/driver.service";
import { DriverStatus } from "@prisma/client";

export const driverController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as DriverStatus | undefined;
      const drivers = await driverService.getAll(status);

      res.status(200).json({
        success: true,
        message: "Drivers retrieved.",
        data: drivers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve drivers.";
      res.status(500).json({ success: false, message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to retrieve driver.";
      res.status(404).json({ success: false, message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const driver = await driverService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Driver created successfully.",
        data: driver,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create driver.";
      res.status(400).json({ success: false, message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to update driver.";
      res.status(400).json({ success: false, message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to delete driver.";
      res.status(400).json({ success: false, message });
    }
  },

  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await driverService.getStats();

      res.status(200).json({
        success: true,
        message: "Driver stats retrieved.",
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve stats.";
      res.status(500).json({ success: false, message });
    }
  },
};
