import { Router } from 'express';
import controller from '../controller/type.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addType").post(authenticateToken, requireAdmin, controller.addType);
router.route("/getAllTypes").get(authenticateToken, requireAdmin, controller.getAllTypes);
router.route("/getTypeById/:id").get(authenticateToken, requireAdmin, controller.getTypeById);
router.route("/updateType/:id").put(authenticateToken, requireAdmin, controller.updateType);
router.route("/deleteType/:id").delete(authenticateToken, requireAdmin, controller.deleteType);

export default router;