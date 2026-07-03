import { Router } from 'express';
import controller from '../controller/period.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addPeriod").post(authenticateToken, requireAdmin, controller.addPeriod);
router.route("/getAllPeriods").get(authenticateToken, controller.getAllPeriods);
router.route("/getPeriodById/:id").get(authenticateToken, controller.getPeriodById);
router.route("/current").get(authenticateToken, controller.getCurrentPeriod);
router.route("/updatePeriod/:id").post(authenticateToken, requireAdmin, controller.updatePeriod);
router.route("/deletePeriod/:id").post(authenticateToken, requireAdmin, controller.deletePeriod);

export default router;