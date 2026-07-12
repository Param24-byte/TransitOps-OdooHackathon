// src/routes/driver.routes.ts

import { Router } from "express";
import { driverController } from "../controllers/driver.controller";
import { authenticate } from "../middleware/auth";
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

router.get("/stats", driverController.getStats);
router.get("/", driverController.getAll);
router.get("/:id", driverController.getById);
router.post("/", validate(createValidation), driverController.create);
router.put("/:id", driverController.update);
router.delete("/:id", driverController.delete);

export default router;
