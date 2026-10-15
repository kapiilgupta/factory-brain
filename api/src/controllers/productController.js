import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';

/**
 * Retrieves all catalog products for the authenticated company
 * Supports optional query filtering: ?category=Tops&isActive=true&search=shirt
 */
export const getProducts = async (req, res, next) => {
    try {
        const { category, isActive, search } = req.query;

        const filter = { userId: req.user._id };

        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (search) {
            filter.name = { $regex: search.trim(), $options: 'i' };
        }

        const products = await Product.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves a single product by ID (strictly tenant-scoped)
 */
export const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.',
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Creates a new product and automatically boots up zero-stock inventory records for all variants
 */
export const createProduct = async (req, res, next) => {
    try {
        const { name, category, sizes, notes } = req.body;

        // 1. Create product catalog entry
        const product = await Product.create({
            userId: req.user._id,
            name,
            category,
            sizes,
            notes,
        });

        // 2. Automatically initialize an Inventory tracking record for each size variant
        const initialInventory = product.sizes.map((variant) => ({
            userId: req.user._id,
            productId: product._id,
            sizeId: variant._id,
            sku: variant.sku,
            quantityOnHand: 0,
            reorderPoint: 10,
        }));

        await Inventory.insertMany(initialInventory);

        res.status(201).json({
            success: true,
            message: 'Product created and inventory tracking initialized.',
            product,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Updates product details (name, category, notes, or active status)
 */
export const updateProduct = async (req, res, next) => {
    try {
        const { name, category, isActive, notes } = req.body;

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { name, category, isActive, notes },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully.',
            product,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Soft-deletes a product by flagging isActive as false to preserve historical schedules
 */
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deactivated successfully.',
            product,
        });
    } catch (error) {
        next(error);
    }
};
