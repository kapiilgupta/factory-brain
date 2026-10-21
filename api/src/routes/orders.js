import express from 'express';
import {
    generateOrders,
    getOrders,
    getOrderById,
    updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Enforce session authentication across all production order endpoints
router.use(authenticateUser);

router.post('/generate', generateOrders);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

export default router;
