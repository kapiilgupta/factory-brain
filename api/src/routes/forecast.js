import express from 'express';
import { generateForecast, getForecasts } from '../controllers/forecastController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Enforce session authentication across all forecast endpoints
router.use(authenticateUser);

router.post('/generate', generateForecast);
router.get('/', getForecasts);

export default router;
