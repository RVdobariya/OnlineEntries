import { Router } from 'express';
import controller from '../controller/role.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addRole").post(authenticateToken, requireAdmin, controller.addRole);
router.route("/getAllRoles").get(authenticateToken, requireAdmin,controller.getAllRoles);
router.route("/getAllUsersWithRoles").get(authenticateToken, requireAdmin, controller.getAllUsersWithRoles);
router.route("/getRoleById/:id").get(authenticateToken, requireAdmin, controller.getRoleById);
router.route("/getUsersByRole/:roleId").get(authenticateToken, requireAdmin, controller.getUsersByRole);
router.route("/updateRole/:id").post(authenticateToken, requireAdmin, controller.updateRole);
router.route("/deleteRole/:id").post(authenticateToken, requireAdmin, controller.deleteRole);

export default router;
