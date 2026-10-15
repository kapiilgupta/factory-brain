import Inventory from '../models/Inventory.js';

/**
 * Retrieves all inventory stock records for the authenticated company
 * Supports optional filtering by SKU or Product ID
 */
export const getInventory = async (req, res, next) => {
    try {
        const { sku, productId } = req.query;

        const filter = { userId: req.user._id };

        if (sku) filter.sku = sku.toUpperCase().trim();
        if (productId) filter.productId = productId;

        const inventory = await Inventory.find(filter)
            .populate('productId', 'name category isActive')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: inventory.length,
            inventory,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * High-speed alert query returning all SKUs at or below their reorder threshold
 * Powered by MongoDB's $expr operator for in-database field-to-field comparison
 */
export const getInventoryAlerts = async (req, res, next) => {
    try {
        const alerts = await Inventory.find({
            userId: req.user._id,
            $expr: { $lte: ['$quantityOnHand', '$reorderPoint'] },
        })
            .populate('productId', 'name category')
            .sort({ quantityOnHand: 1 }); // Most critical (lowest stock) first

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Idempotently updates verified stock levels and reorder thresholds for a specific SKU
 */
export const updateStockBySku = async (req, res, next) => {
    try {
        const { sku } = req.params;
        const { quantityOnHand, reorderPoint } = req.body;

        const updateFields = {};
        if (quantityOnHand !== undefined) updateFields.quantityOnHand = Math.max(0, Number(quantityOnHand));
        if (reorderPoint !== undefined) updateFields.reorderPoint = Math.max(0, Number(reorderPoint));

        const item = await Inventory.findOneAndUpdate(
            {
                userId: req.user._id,
                sku: sku.toUpperCase().trim(),
            },
            updateFields,
            { new: true, runValidators: true }
        ).populate('productId', 'name category');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: `Inventory record for SKU "${sku}" not found.`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully.',
            inventory: item,
        });
    } catch (error) {
        next(error);
    }
};
