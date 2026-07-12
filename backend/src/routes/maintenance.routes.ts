// src/routes/maintenance.routes.ts

import { Router } from "express";
import { maintenanceController } from "../controllers/maintenance.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const createValidation = {
  date: { required: true, type: "string" as const },
  description: { required: true, type: "string" as const, min: 5 },
  cost: { required: true, type: "number" as const, min: 0 },
  vehicleId: { required: true, type: "number" as const },
};

router.get("/", maintenanceController.getAll);
router.post("/", validate(createValidation), maintenanceController.create);
router.delete("/:id", maintenanceController.delete);

export default router;
