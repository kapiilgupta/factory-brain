import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Enforce session authentication across all product endpoints by default
router.use(authenticateUser);

router
    .route('/')
    .get(getProducts)
    .post(createProduct);

router
    .route('/:id')
    .get(getProductById)
    .patch(updateProduct)
    .delete(deleteProduct);

export default router;