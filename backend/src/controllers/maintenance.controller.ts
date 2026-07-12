// src/controllers/maintenance.controller.ts

import { Request, Response } from "express";
import { maintenanceService } from "../services/maintenance.service";

export const maintenanceController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = req.query.vehicleId
        ? parseInt(req.query.vehicleId as string)
        : undefined;
      const logs = await maintenanceService.getAll(vehicleId);

      res.status(200).json({
        success: true,
        message: "Maintenance logs retrieved.",
        data: logs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve logs.";
      res.status(500).json({ success: false, message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const log = await maintenanceService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Maintenance log created. Vehicle status set to IN_SHOP.",
        data: log,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create log.";
      res.status(400).json({ success: false, message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid maintenance log ID." });
        return;
      }

      await maintenanceService.delete(id);

      res.status(200).json({
        success: true,
        message: "Maintenance log deleted.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete log.";
      res.status(400).json({ success: false, message });
    }
  },

  async closeMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid maintenance log ID." });
        return;
      }

      const log = await maintenanceService.closeMaintenance(id);

      res.status(200).json({
        success: true,
        message: "Maintenance log closed. Vehicle restored to AVAILABLE if applicable.",
        data: log,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to close maintenance log.";
      res.status(400).json({ success: false, message });
    }
  },
};
