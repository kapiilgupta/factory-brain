import mongoose from 'mongoose';

// Subdocument: Line Items per Size Variant
const orderItemSchema = new mongoose.Schema(
    {
        sizeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Size variant ID is required'],
        },
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            uppercase: true,
            trim: true,
        },
        sizeLabel: {
            type: String,
            required: [true, 'Size label is required (e.g. S, M, L)'],
            trim: true,
        },
        plannedQty: {
            type: Number,
            required: [true, 'Planned quantity is required'],
            min: [1, 'Planned quantity must be at least 1 unit'],
        },
        machineMinutesPerUnit: {
            type: Number,
            required: [true, 'Machine minutes per unit is required'],
            min: [0, 'Machine minutes cannot be negative'],
        },
        completedQty: {
            type: Number,
            default: 0,
            min: [0, 'Completed quantity cannot be negative'],
        },
    },
    {
        _id: true,
    }
);

// Main Production Order Schema
const productionOrderSchema = new mongoose.Schema(
    {
        // Multi-tenant: Scoped strictly to the company/user
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        // Human-readable sequential order identifier (e.g. PO-2026-0001)
        orderNumber: {
            type: String,
            required: [true, 'Order number is required'],
            uppercase: true,
            trim: true,
        },
        // Product being produced
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product reference is required'],
            index: true,
        },
        // Monthly planning period that generated this order
        forecastPeriod: {
            type: String,
            required: [true, 'Forecast period is required (format: YYYY-MM)'],
            match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Forecast period must be in YYYY-MM format'],
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        // The delivery deadline — fundamental for Earliest Due Date (EDD) dispatching
        dueDate: {
            type: Date,
            required: [true, 'Due date is required for scheduling'],
            index: true,
        },
        // Line items for each size variant included in this production run
        items: {
            type: [orderItemSchema],
            validate: [
                (items) => items && items.length > 0,
                'A production order must have at least one line item',
            ],
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: Total Units in Batch
productionOrderSchema.virtual('totalUnits').get(function () {
    if (!this.items) return 0;
    return this.items.reduce((sum, item) => sum + (item.plannedQty || 0), 0);
});

// Virtual: Total Machine Workload (Minutes)
productionOrderSchema.virtual('totalMachineMinutes').get(function () {
    if (!this.items) return 0;
    return this.items.reduce(
        (sum, item) => sum + (item.plannedQty || 0) * (item.machineMinutesPerUnit || 0),
        0
    );
});

// Compound Indexes
// 1. Order numbers must be unique within a tenant
productionOrderSchema.index({ userId: 1, orderNumber: 1 }, { unique: true });

// 2. High-speed query for the EDD Scheduling Engine
productionOrderSchema.index({ userId: 1, status: 1, dueDate: 1 });

// 3. Fast retrieval of orders by monthly planning cycle
productionOrderSchema.index({ userId: 1, forecastPeriod: 1 });

const ProductionOrder = mongoose.model('ProductionOrder', productionOrderSchema);

export default ProductionOrder;
