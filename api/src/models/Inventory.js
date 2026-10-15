import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
    {
        // Multi-tenant: Every inventory record belongs strictly to a user/tenant
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        // Reference to the parent product document
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
            index: true,
        },
        // Reference to the specific size subdocument _id inside Product.sizes
        sizeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Size variant ID is required'],
            index: true,
        },
        // Redundant SKU field stored here for O(1) direct lookups without population
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            uppercase: true,
            trim: true,
        },
        // Real-time stock available on the shop floor / warehouse
        quantityOnHand: {
            type: Number,
            required: [true, 'Quantity on hand is required'],
            min: [0, 'Quantity on hand cannot be negative'],
            default: 0,
        },
        // Threshold stock level that triggers replenishment alerts
        reorderPoint: {
            type: Number,
            required: [true, 'Reorder point is required'],
            min: [0, 'Reorder point cannot be negative'],
            default: 10,
        },
        unit: {
            type: String,
            default: 'units',
            trim: true,
        },
    },
    {
        timestamps: true,
        // Enable virtuals when converting Mongoose documents to JSON
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual Property: Stock Status
// Dynamically classifies inventory health without extra database writes
inventorySchema.virtual('status').get(function () {
    if (this.quantityOnHand === 0) return 'Critical'; // Out of stock
    if (this.quantityOnHand <= this.reorderPoint) return 'Low'; // Needs reorder
    return 'Good'; // Healthy stock level
});

// Virtual Property: Fill Percentage
// Calculates percentage fill relative to an optimal buffer (reorderPoint * 2)
// Used directly by the Dashboard Inventory Bar UI widget
inventorySchema.virtual('fillPercentage').get(function () {
    const targetBuffer = this.reorderPoint > 0 ? this.reorderPoint * 2 : 20;
    const pct = Math.round((this.quantityOnHand / targetBuffer) * 100);
    return Math.min(100, Math.max(0, pct));
});

// Compound Indexes
// 1. Ensures SKU is unique per tenant
inventorySchema.index({ userId: 1, sku: 1 }, { unique: true });

// 2. Fast retrieval of all variant stock for a single product
inventorySchema.index({ userId: 1, productId: 1 });

// 3. Fast indexing for the Dashboard Stock Alert queries (quantityOnHand <= reorderPoint)
inventorySchema.index({ userId: 1, quantityOnHand: 1, reorderPoint: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
