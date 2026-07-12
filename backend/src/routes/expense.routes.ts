// src/routes/expense.routes.ts

import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { authenticate } from "../middleware/auth";
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
};

router.get("/summary", expenseController.getSummary);
router.get("/", expenseController.getAll);
router.post("/", validate(createValidation), expenseController.create);
router.delete("/:id", expenseController.delete);

export default router;
