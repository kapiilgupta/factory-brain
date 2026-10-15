import express from 'express';
import {
    getInventory,
    getInventoryAlerts,
    updateStockBySku,
} from '../controllers/inventoryController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Enforce authentication across all inventory routes
router.use(authenticateUser);

// 1. General inventory ledger
router.get('/', getInventory);

// 2. Stock alerts feed (declared before /:sku to prevent route shadowing)
router.get('/alerts', getInventoryAlerts);

// 3. Idempotent stock level updates by SKU
router.put('/:sku', updateStockBySku);

export default router;
