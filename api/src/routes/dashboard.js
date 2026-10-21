import express from 'express';
import {
    getDashboardSummary,
    getProductionBreakdown,
    getScheduleOverview,
    getActiveAlerts,
    getInventoryOverview,
} from '../controllers/dashboardController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Enforce session authentication across all dashboard aggregation endpoints
router.use(authenticateUser);

router.get('/summary', getDashboardSummary);
router.get('/production', getProductionBreakdown);
router.get('/schedule', getScheduleOverview);
router.get('/alerts', getActiveAlerts);
router.get('/inventory', getInventoryOverview);

export default router;