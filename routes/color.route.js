import { Router } from 'express';
import controller from '../controller/color.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addColor").post(authenticateToken, requireAdmin, controller.addColor);
router.route("/getAllColors").get(authenticateToken, requireAdmin, controller.getAllColors);
router.route("/getColorById/:id").get(authenticateToken, requireAdmin, controller.getColorById);
router.route("/updateColor/:id").post(authenticateToken, requireAdmin, controller.updateColor);
router.route("/deleteColor/:id").post(authenticateToken, requireAdmin, controller.deleteColor);

export default router;