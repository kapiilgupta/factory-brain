import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
    {
        // Multi-tenant: Scoped strictly to the authenticated user/company
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Machine name is required (e.g. CNC Router A, Sewing Line 1)'],
            trim: true,
        },
        type: {
            type: String,
            required: [true, 'Machine type is required'],
            enum: [
                'Cutting',
                'Sewing',
                'Finishing',
                'Packaging',
                'Assembly',
                'CNC',
                'Printing',
                'Other',
            ],
            default: 'Other',
        },
        // Daily available capacity in minutes (Default: 480 mins = 8 hours shift)
        shiftMinutes: {
            type: Number,
            required: [true, 'Shift minutes are required for capacity planning'],
            min: [60, 'Minimum shift duration is 60 minutes'],
            max: [1440, 'Maximum shift duration cannot exceed 1440 minutes (24 hours)'],
            default: 480,
        },
        // Allows shop floor managers to take machines offline for maintenance or repair
        isOperational: {
            type: Boolean,
            default: true,
            index: true,
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
// 1. Prevent duplicate machine names within the same factory
machineSchema.index({ userId: 1, name: 1 }, { unique: true });

// 2. High-speed lookup for available operational machines during scheduling
machineSchema.index({ userId: 1, isOperational: 1 });

const Machine = mongoose.model('Machine', machineSchema);

export default Machine;
