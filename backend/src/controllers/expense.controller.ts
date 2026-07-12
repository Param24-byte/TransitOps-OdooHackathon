// src/controllers/expense.controller.ts

import { Request, Response, NextFunction } from "express";
import { expenseService } from "../services/expense.service";

export const expenseController = {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expenses = await expenseService.getAll();

      res.status(200).json({
        success: true,
        message: "Expenses retrieved.",
        data: expenses,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(500).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expenseService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Expense created successfully.",
        data: expense,
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
        res.status(400).json({ success: false, message: "Invalid expense ID." });
        return;
      }

      await expenseService.delete(id);

      res.status(200).json({
        success: true,
        message: "Expense deleted.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "Error") {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  },

  async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await expenseService.getSummary();

      res.status(200).json({
        success: true,
        message: "Expense summary retrieved.",
        data: summary,
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
