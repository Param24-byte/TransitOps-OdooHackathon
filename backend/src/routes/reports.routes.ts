import { Router } from "express";
import { reportsController } from "../controllers/reports.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// Only FINANCIAL_ANALYST and FLEET_MANAGER can access reports
router.use(authenticate);
router.use(authorize("FINANCIAL_ANALYST", "FLEET_MANAGER"));

router.get("/fuel-efficiency", reportsController.getFuelEfficiency);
router.get("/operational-costs", reportsController.getOperationalCosts);
router.get("/fleet-utilization", reportsController.getFleetUtilization);
router.get("/vehicle-roi", reportsController.getVehicleROI);
router.get("/export.csv", reportsController.exportCSV);

export default router;
