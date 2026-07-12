// src/routes/trip.routes.ts
// Trip lifecycle routes.
// POST   /api/trips               — Create a new trip (DRAFT)
// PATCH  /api/trips/:id/dispatch  — Dispatch a trip (DRAFT → DISPATCHED)
// PATCH  /api/trips/:id/complete  — Complete a trip (DISPATCHED → COMPLETED)
// PATCH  /api/trips/:id/cancel    — Cancel a trip

import { Router } from "express";
import { tripController } from "../controllers/trip.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const createValidation = {
  source: { required: true, type: "string" as const, min: 2 },
  destination: { required: true, type: "string" as const, min: 2 },
  cargoWeight: { required: true, type: "number" as const, min: 0 },
  plannedDistance: { required: true, type: "number" as const, min: 0 },
  vehicleId: { required: true, type: "number" as const },
  driverId: { required: true, type: "number" as const },
};

router.get("/stats", tripController.getStats);
router.get("/utilization-chart", tripController.getUtilizationChart);
router.get("/", tripController.getAll);
router.get("/:id", tripController.getById);

router.post("/", authorize("DRIVER", "FLEET_MANAGER"), validate(createValidation), tripController.create);
router.patch("/:id/dispatch", authorize("DRIVER", "FLEET_MANAGER"), tripController.dispatch);
router.patch("/:id/complete", authorize("DRIVER", "FLEET_MANAGER"), tripController.complete);
router.patch("/:id/cancel", authorize("DRIVER", "FLEET_MANAGER"), tripController.cancel);

export default router;
