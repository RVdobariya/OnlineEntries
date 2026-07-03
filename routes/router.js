import { Router } from 'express';
import countryRoutes from './role.route.js';
import authRoutes from './auth.route.js';
import designRoutes from './design.route.js';
import colorRoutes from './color.route.js';
import typeRoutes from './type.route.js';
import machineRoutes from './machine.route.js';
import entryRoutes from './entry.route.js';
import periodRoutes from './period.route.js';
import lotNoRoutes from './lot_no.route.js';
import pressGalaRoutes from './press_gala.route.js';


const router = Router();

router.use('/auth', authRoutes);
router.use('/role', countryRoutes);
router.use('/design', designRoutes);
router.use('/color', colorRoutes);
router.use('/type', typeRoutes);
router.use('/machine', machineRoutes);
router.use('/entry', entryRoutes);
router.use('/period', periodRoutes);
router.use('/lotNo', lotNoRoutes);
router.use('/pressGala', pressGalaRoutes);

export default router;