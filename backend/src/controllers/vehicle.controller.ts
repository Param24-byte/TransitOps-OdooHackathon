// src/controllers/vehicle.controller.ts

import { Request, Response } from "express";
import { vehicleService } from "../services/vehicle.service";
import { VehicleStatus } from "@prisma/client";

export const vehicleController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as VehicleStatus | undefined;
      const vehicles = await vehicleService.getAll(status);

      res.status(200).json({
        success: true,
        message: "Vehicles retrieved.",
        data: vehicles,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve vehicles.";
      res.status(500).json({ success: false, message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to retrieve vehicle.";
      res.status(404).json({ success: false, message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await vehicleService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Vehicle created successfully.",
        data: vehicle,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create vehicle.";
      res.status(400).json({ success: false, message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to update vehicle.";
      res.status(400).json({ success: false, message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to delete vehicle.";
      res.status(400).json({ success: false, message });
    }
  },

  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await vehicleService.getStats();

      res.status(200).json({
        success: true,
        message: "Vehicle stats retrieved.",
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve stats.";
      res.status(500).json({ success: false, message });
    }
  },
};
