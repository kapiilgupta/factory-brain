import mongoose from 'mongoose';

const demandForecastSchema = new mongoose.Schema(
    {
        // Multi-tenant isolation: Scoped strictly to the authenticated user/company
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        // SKU being forecasted
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            uppercase: true,
            trim: true,
        },
        // Product reference
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
            index: true,
        },
        // Specific size variant reference
        sizeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Size variant ID is required'],
            index: true,
        },
        // Forecast bucket represented as canonical 'YYYY-MM' string (e.g. '2026-11')
        forecastPeriod: {
            type: String,
            required: [true, 'Forecast period is required (format: YYYY-MM)'],
            match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Forecast period must be in YYYY-MM format'],
            index: true,
        },
        // Total integer units forecasted to sell in this period
        forecastQty: {
            type: Number,
            required: [true, 'Forecast quantity is required'],
            min: [0, 'Forecast quantity cannot be negative'],
        },
        // Statistical method used
        method: {
            type: String,
            enum: ['3-Period Moving Average', 'Manual', 'Exponential Smoothing'],
            default: '3-Period Moving Average',
        },
        // Reliability metric (e.g., 85% for 3 periods, 60% for 2 periods)
        confidencePct: {
            type: Number,
            min: [0, 'Confidence cannot be less than 0%'],
            max: [100, 'Confidence cannot exceed 100%'],
            default: 85,
        },
        // Number of historical periods available when generating this prediction
        historicalPeriodsUsed: {
            type: Number,
            default: 3,
            min: 1,
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Compound Indexes
// 1. Ensures an SKU has only ONE forecast per monthly period for a given tenant
demandForecastSchema.index({ userId: 1, forecastPeriod: 1, sku: 1 }, { unique: true });

// 2. High-speed lookup when generating Production Orders for an entire month
demandForecastSchema.index({ userId: 1, forecastPeriod: 1 });

const DemandForecast = mongoose.model('DemandForecast', demandForecastSchema);

export default DemandForecast;
