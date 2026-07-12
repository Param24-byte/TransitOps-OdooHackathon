// src/controllers/vehicle.controller.ts

import { Request, Response, NextFunction } from "express";
import { vehicleService } from "../services/vehicle.service";
import { VehicleStatus } from "@prisma/client";

export const vehicleController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as VehicleStatus | undefined;
      const region = req.query.region as string | undefined;
      const vehicles = await vehicleService.getAll(status, region);

      res.status(200).json({
        success: true,
        message: "Vehicles retrieved.",
        data: vehicles,
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
        res.status(400).json({ success: false, message: "Invalid vehicle ID." });
        return;
      }

      const vehicle = await vehicleService.getById(id);

      res.status(200).json({
        success: true,
        message: "Vehicle retrieved.",
        data: vehicle,
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
      const vehicle = await vehicleService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Vehicle created successfully.",
        data: vehicle,
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
        res.status(400).json({ success: false, message: "Invalid vehicle ID." });
        return;
      }

      const vehicle = await vehicleService.update(id, req.body);

      res.status(200).json({
        success: true,
        message: "Vehicle updated successfully.",
        data: vehicle,
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
        res.status(400).json({ success: false, message: "Invalid vehicle ID." });
        return;
      }

      await vehicleService.delete(id);

      res.status(200).json({
        success: true,
        message: "Vehicle deleted successfully.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async retire(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid vehicle ID." });
        return;
      }

      await vehicleService.retire(id);

      res.status(200).json({
        success: true,
        message: "Vehicle retired successfully.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = req.query.region as string | undefined;
      const stats = await vehicleService.getStats(region);

      res.status(200).json({
        success: true,
        message: "Vehicle stats retrieved.",
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
