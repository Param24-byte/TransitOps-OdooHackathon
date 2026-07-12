// src/routes/vehicle.routes.ts
// Vehicle CRUD routes. All routes are protected by JWT authentication.
// GET    /api/vehicles        — List all vehicles (optional ?status= filter)
// GET    /api/vehicles/stats  — Dashboard statistics
// GET    /api/vehicles/:id    — Get single vehicle with related data
// POST   /api/vehicles        — Create a new vehicle
// PUT    /api/vehicles/:id    — Update vehicle details
// DELETE /api/vehicles/:id    — Delete a vehicle

import { Router } from "express";
import { vehicleController } from "../controllers/vehicle.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

const createValidation = {
  registrationNo: { required: true, type: "string" as const, min: 2 },
  name: { required: true, type: "string" as const, min: 2 },
  type: { required: true, type: "string" as const },
  capacity: { required: true, type: "number" as const, min: 0 },
  odometer: { required: true, type: "number" as const, min: 0 },
  acquisitionCost: { required: true, type: "number" as const, min: 0 },
};

router.get("/stats", vehicleController.getStats);
router.get("/", vehicleController.getAll);
router.get("/:id", vehicleController.getById);
router.post("/", validate(createValidation), vehicleController.create);
router.put("/:id", vehicleController.update);
router.delete("/:id", vehicleController.delete);

export default router;
