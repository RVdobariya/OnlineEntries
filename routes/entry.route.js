import { Router } from 'express';
import controller from '../controller/entry.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();


router.route("/addEntry").post(authenticateToken, requireAdmin, controller.addEntry);
router.route("/editEntry/:id").post(authenticateToken, requireAdmin, controller.editEntry);
router.route("/deleteEntry/:id").post(authenticateToken, requireAdmin, controller.deleteEntry);
router.route("/getEntriesByMonth").get(authenticateToken, controller.getEntriesByMonth);
router.route("/getRoleTotalsByPeriod").get(authenticateToken, controller.getRoleTotalsByPeriod);
router.route("/getOverlockTotalsByPeriod").get(authenticateToken, controller.getOverlockTotalsByPeriod);
router.route("/getEntriesByUserRole").get(authenticateToken, controller.getEntriesByUserRole);
router.route("/getEntriesByPeriodAndLot").get(authenticateToken, controller.getEntriesByPeriodAndLot);
router.route("/getDatesByPeriod").get(authenticateToken, controller.getDatesByPeriod);
router.route("/getEntriesBySpecificDate").get(authenticateToken, controller.getEntriesBySpecificDate);
router.route("/getEntryCount").get(authenticateToken, controller.getEntryCount);
router.route("/exportExcel").get(controller.exportAllEntriesToExcel);

export default router;
