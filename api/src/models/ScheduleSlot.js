import mongoose from 'mongoose';

const scheduleSlotSchema = new mongoose.Schema(
    {
        // Multi-tenant: Scoped strictly to the company/user
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        // Reference to the production order being manufactured
        productionOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductionOrder',
            required: [true, 'Production order ID is required'],
            index: true,
        },
        // Denormalized order number for immediate display on the Gantt chart
        orderNumber: {
            type: String,
            required: [true, 'Order number is required'],
            uppercase: true,
            trim: true,
        },
        // Machine assigned to execute this job
        machineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Machine',
            required: [true, 'Machine ID is required'],
            index: true,
        },
        // Denormalized machine name for instant Gantt lane rendering
        machineName: {
            type: String,
            required: [true, 'Machine name is required'],
            trim: true,
        },
        // Discrete calendar day of execution (format: YYYY-MM-DD)
        scheduleDate: {
            type: String,
            required: [true, 'Schedule date is required (format: YYYY-MM-DD)'],
            match: [
                /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
                'Schedule date must be in YYYY-MM-DD format',
            ],
            index: true,
        },
        // Scheduled start timestamp
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
        },
        // Scheduled completion timestamp (startTime + durationMinutes)
        endTime: {
            type: Date,
            required: [true, 'End time is required'],
        },
        // Pure production processing duration in minutes
        durationMinutes: {
            type: Number,
            required: [true, 'Duration in minutes is required'],
            min: [1, 'Duration must be at least 1 minute'],
        },
        // Setup / changeover / maintenance buffer before next job starts
        bufferMinutes: {
            type: Number,
            default: 15,
            min: [0, 'Buffer minutes cannot be negative'],
        },
        // Sequence order of this job on the machine today (1st, 2nd, 3rd, etc.)
        sequence: {
            type: Number,
            default: 1,
            min: 1,
        },
        status: {
            type: String,
            enum: ['scheduled', 'in-progress', 'completed', 'delayed'],
            default: 'scheduled',
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
// 1. High-speed lookup for chronological Gantt chart timeline per machine
scheduleSlotSchema.index({ userId: 1, machineId: 1, scheduleDate: 1, startTime: 1 });

// 2. High-speed retrieval of all schedule slots for a selected calendar day
scheduleSlotSchema.index({ userId: 1, scheduleDate: 1 });

// 3. Fast lookup of schedule history for a specific Production Order
scheduleSlotSchema.index({ userId: 1, productionOrderId: 1 });

const ScheduleSlot = mongoose.model('ScheduleSlot', scheduleSlotSchema);

export default ScheduleSlot;