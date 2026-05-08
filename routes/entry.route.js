import { Router } from 'express';
import controller from '../controller/entry.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();


router.route("/addEntry").post(authenticateToken, requireAdmin, controller.addEntry);
router.route("/deleteEntry/:id").delete(authenticateToken, requireAdmin, controller.deleteEntry);
router.route("/getEntriesByMonth").get(authenticateToken, controller.getEntriesByPeriod);
router.route("/getRoleTotalsByPeriod").get(authenticateToken, controller.getRoleTotalsByPeriod);
router.route("/getOverlockTotalsByPeriod").get(authenticateToken, controller.getOverlockTotalsByPeriod);
router.route("/getEntriesByUserRole").get(authenticateToken, controller.getEntriesByUserRole);

export default router;