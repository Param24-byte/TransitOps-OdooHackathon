// src/controllers/trip.controller.ts

import { Request, Response } from "express";
import { tripService } from "../services/trip.service";
import { TripStatus } from "@prisma/client";

export const tripController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as TripStatus | undefined;
      const trips = await tripService.getAll(status);

      res.status(200).json({
        success: true,
        message: "Trips retrieved.",
        data: trips,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve trips.";
      res.status(500).json({ success: false, message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to retrieve trip.";
      res.status(404).json({ success: false, message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const trip = await tripService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Trip created successfully.",
        data: trip,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create trip.";
      res.status(400).json({ success: false, message });
    }
  },

  async dispatch(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to dispatch trip.";
      res.status(400).json({ success: false, message });
    }
  },

  async complete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid trip ID." });
        return;
      }

      const trip = await tripService.complete(id);

      res.status(200).json({
        success: true,
        message: "Trip completed successfully.",
        data: trip,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete trip.";
      res.status(400).json({ success: false, message });
    }
  },

  async cancel(req: Request, res: Response): Promise<void> {
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
      const message = error instanceof Error ? error.message : "Failed to cancel trip.";
      res.status(400).json({ success: false, message });
    }
  },

  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await tripService.getStats();

      res.status(200).json({
        success: true,
        message: "Trip stats retrieved.",
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve stats.";
      res.status(500).json({ success: false, message });
    }
  },

  async getUtilizationChart(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await tripService.getUtilizationStats();

      res.status(200).json({
        success: true,
        message: "Utilization stats retrieved.",
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve utilization stats.";
      res.status(500).json({ success: false, message });
    }
  },
};
