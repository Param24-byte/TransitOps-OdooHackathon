// src/routes/driver.routes.ts

import { Router } from "express";
import { driverController } from "../controllers/driver.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const createValidation = {
  name: { required: true, type: "string" as const, min: 2 },
  licenseNumber: { required: true, type: "string" as const },
  licenseCategory: { required: true, type: "string" as const },
  licenseExpiry: { required: true, type: "string" as const },
  contactNumber: { required: true, type: "string" as const },
};

const updateValidation = {
  name: { required: false, type: "string" as const, min: 2 },
  licenseCategory: { required: false, type: "string" as const },
  contactNumber: { required: false, type: "string" as const },
  safetyScore: { required: false, type: "number" as const, min: 0 },
};

router.get("/stats", driverController.getStats);
router.get("/", driverController.getAll);
router.get("/:id", driverController.getById);

router.post("/", authorize("FLEET_MANAGER", "SAFETY_OFFICER"), validate(createValidation), driverController.create);
router.put("/:id", authorize("FLEET_MANAGER", "SAFETY_OFFICER"), validate(updateValidation), driverController.update);
router.put("/:id/suspend", authorize("FLEET_MANAGER", "SAFETY_OFFICER"), driverController.suspend);
router.delete("/:id", authorize("FLEET_MANAGER", "SAFETY_OFFICER"), driverController.delete);

export default router;
