import { Router } from 'express';
import controller from '../controller/machine.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/addMachine").post(authenticateToken, requireAdmin, controller.addMachine);
router.route("/getAllMachines").get(authenticateToken, requireAdmin, controller.getAllMachines);
router.route("/getMachineById/:id").get(authenticateToken, requireAdmin, controller.getMachineById);
router.route("/updateMachine/:id").post(authenticateToken, requireAdmin, controller.updateMachine);
router.route("/deleteMachine/:id").post(authenticateToken, requireAdmin, controller.deleteMachine);

export default router;