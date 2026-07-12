import { Request, Response, NextFunction } from "express";
import { reportsService } from "../services/reports.service";

export const reportsController = {
  async getFuelEfficiency(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getFuelEfficiency();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get fuel efficiency report." });
    }
  },

  async getOperationalCosts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getOperationalCosts();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get operational costs report." });
    }
  },

  async getFleetUtilization(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getFleetUtilization();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get fleet utilization report." });
    }
  },

  async getVehicleROI(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getVehicleROI();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get vehicle ROI report." });
    }
  },

  async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string;
      if (!type) {
        res.status(400).json({ success: false, message: "Missing export type." });
        return;
      }
      
      const csv = await reportsService.getExportCSV(type);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      res.status(200).send(csv);
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }
};
