import express from 'express';
import {
  generateSchedule,
  getSchedule,
  getUtilization,
} from '../controllers/scheduleController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Enforce session authentication across all scheduling endpoints
router.use(authenticateUser);

router.post('/generate', generateSchedule);
router.get('/', getSchedule);
router.get('/utilization', getUtilization);

export default router;
