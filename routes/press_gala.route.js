import { Router } from 'express';
import controller from '../controller/press_gala.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addPressGalaEntry").post(authenticateToken, requireAdmin, controller.addEntry);
router.route("/editPressGalaEntry/:id").post(authenticateToken, requireAdmin, controller.editEntry);
router.route("/getAllPressGalaEntries").get(authenticateToken, requireAdmin, controller.getAllEntries);
router.route("/getPressGalaTotalsByPeriod").get(authenticateToken, controller.getPressGalaTotalsByPeriod);
router.route("/deletePressGalaEntry/:id").post(authenticateToken, requireAdmin, controller.deleteEntry);

export default router;