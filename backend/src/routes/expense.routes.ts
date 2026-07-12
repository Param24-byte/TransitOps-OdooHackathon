// src/routes/expense.routes.ts

import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const createValidation = {
  date: { required: true, type: "string" as const },
  type: {
    required: true,
    type: "string" as const,
    enum: ["FUEL", "TOLL", "PERMIT", "INSURANCE", "REPAIR", "OTHER"],
  },
  description: { required: true, type: "string" as const, min: 3 },
  amount: { required: true, type: "number" as const, min: 0 },
  vehicleId: { required: true, type: "number" as const },
};

router.get("/summary", expenseController.getSummary);
router.get("/", expenseController.getAll);

router.post("/", authorize("FLEET_MANAGER", "FINANCIAL_ANALYST"), validate(createValidation), expenseController.create);
router.delete("/:id", authorize("FLEET_MANAGER", "FINANCIAL_ANALYST"), expenseController.delete);

export default router;
