import { Router } from 'express';
import controller from '../controller/lot_no.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addLotNo").post(authenticateToken, requireAdmin, controller.addLotNo);
router.route("/getAllLotNos").get(authenticateToken, requireAdmin, controller.getAllLotNos);
router.route("/getLotNoById/:id").get(authenticateToken, requireAdmin, controller.getLotNoById);
router.route("/updateLotNo/:id").post(authenticateToken, requireAdmin, controller.updateLotNo);
router.route("/deleteLotNo/:id").post(authenticateToken, requireAdmin, controller.deleteLotNo);

export default router;
