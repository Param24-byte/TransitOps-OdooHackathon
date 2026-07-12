// src/controllers/trip.controller.ts

import { Request, Response, NextFunction } from "express";
import { tripService } from "../services/trip.service";
import { TripStatus } from "@prisma/client";

export const tripController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as TripStatus | undefined;
      const trips = await tripService.getAll(status);

      res.status(200).json({
        success: true,
        message: "Trips retrieved.",
        data: trips,
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
        res.status(400).json({ success: false, message: "Invalid trip ID." });
        return;
      }

      const trip = await tripService.getById(id);

      res.status(200).json({
        success: true,
        message: "Trip retrieved.",
        data: trip,
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
      const trip = await tripService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Trip created successfully.",
        data: trip,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async dispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid trip ID." });
        return;
      }

      const trip = await tripService.dispatch(id);

      res.status(200).json({
        success: true,
        message: "Trip dispatched successfully.",
        data: trip,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid trip ID." });
        return;
      }

      const trip = await tripService.complete(id, req.body);

      res.status(200).json({
        success: true,
        message: "Trip completed successfully.",
        data: trip,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid trip ID." });
        return;
      }

      const trip = await tripService.cancel(id);

      res.status(200).json({
        success: true,
        message: "Trip cancelled successfully.",
        data: trip,
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
      const stats = await tripService.getStats();

      res.status(200).json({
        success: true,
        message: "Trip stats retrieved.",
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

  async getUtilizationChart(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await tripService.getUtilizationStats();

      res.status(200).json({
        success: true,
        message: "Utilization stats retrieved.",
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
