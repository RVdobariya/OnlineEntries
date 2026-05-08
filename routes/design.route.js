import { Router } from 'express';
import controller from '../controller/design.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addDesign").post(authenticateToken, requireAdmin, controller.addDesign);
router.route("/getAllDesigns").get(authenticateToken, requireAdmin, controller.getAllDesigns);
router.route("/getDesignById/:id").get(authenticateToken, requireAdmin, controller.getDesignById);
router.route("/updateDesign/:id").put(authenticateToken, requireAdmin, controller.updateDesign);
router.route("/deleteDesign/:id").delete(authenticateToken, requireAdmin, controller.deleteDesign);

export default router;