// src/controllers/fuel.controller.ts

import { Request, Response } from "express";
import { fuelService } from "../services/fuel.service";

export const fuelController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = req.query.vehicleId
        ? parseInt(req.query.vehicleId as string)
        : undefined;
      const logs = await fuelService.getAll(vehicleId);

      res.status(200).json({
        success: true,
        message: "Fuel logs retrieved.",
        data: logs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve fuel logs.";
      res.status(500).json({ success: false, message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const log = await fuelService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Fuel log created successfully.",
        data: log,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create fuel log.";
      res.status(400).json({ success: false, message });
    }
  },

  async getEfficiencyStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await fuelService.getEfficiencyStats();

      res.status(200).json({
        success: true,
        message: "Fuel efficiency stats retrieved.",
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve stats.";
      res.status(500).json({ success: false, message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid fuel log ID." });
        return;
      }

      await fuelService.delete(id);

      res.status(200).json({
        success: true,
        message: "Fuel log deleted.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete fuel log.";
      res.status(400).json({ success: false, message });
    }
  },
};
