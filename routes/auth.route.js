import { Router } from 'express';
import authController from '../controller/auth.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addUser").post(authenticateToken, requireAdmin, authController.register);
router.route("/updateUser/:id").post(authenticateToken, requireAdmin, authController.updateUser);
router.route("/login").post(authController.login);
router.route("/changePassword").post(authenticateToken, authController.changePassword);
router.route("/updateUserStatus/:id").post(authenticateToken, requireAdmin, authController.updateUserStatus);

export default router;