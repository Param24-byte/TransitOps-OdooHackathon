// src/routes/fuel.routes.ts

import { Router } from "express";
import { fuelController } from "../controllers/fuel.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const createValidation = {
  date: { required: true, type: "string" as const },
  liters: { required: true, type: "number" as const, min: 0 },
  cost: { required: true, type: "number" as const, min: 0 },
  vehicleId: { required: true, type: "number" as const },
};

router.get("/stats", fuelController.getEfficiencyStats);
router.get("/", fuelController.getAll);

router.post("/", authorize("FLEET_MANAGER", "FINANCIAL_ANALYST"), validate(createValidation), fuelController.create);
router.delete("/:id", authorize("FLEET_MANAGER", "FINANCIAL_ANALYST"), fuelController.delete);

export default router;
