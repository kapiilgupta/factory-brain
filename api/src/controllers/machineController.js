import Machine from '../models/Machine.js';
import ScheduleSlot from '../models/ScheduleSlot.js';

/**
 * Retrieves all registered factory machines for the company
 * Supports optional filtering: ?type=Sewing&isOperational=true
 */
export const getMachines = async (req, res, next) => {
    try {
        const { type, isOperational } = req.query;

        const filter = { userId: req.user._id };

        if (type) filter.type = type;
        if (isOperational !== undefined) filter.isOperational = isOperational === 'true';

        const machines = await Machine.find(filter).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: machines.length,
            machines,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves a single machine by ID (strictly tenant-scoped)
 */
export const getMachineById = async (req, res, next) => {
    try {
        const machine = await Machine.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'Machine not found.',
            });
        }

        res.status(200).json({
            success: true,
            machine,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Registers a new machine asset with defined operating capacity
 */
export const createMachine = async (req, res, next) => {
    try {
        const { name, type, shiftMinutes, isOperational, notes } = req.body;

        const machine = await Machine.create({
            userId: req.user._id,
            name,
            type,
            shiftMinutes,
            isOperational,
            notes,
        });

        res.status(201).json({
            success: true,
            message: 'Machine registered successfully.',
            machine,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Updates machine parameters (capacity adjustments or maintenance downtime toggles)
 */
export const updateMachine = async (req, res, next) => {
    try {
        const { name, type, shiftMinutes, isOperational, notes } = req.body;

        const machine = await Machine.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { name, type, shiftMinutes, isOperational, notes },
            { new: true, runValidators: true }
        );

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'Machine not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Machine updated successfully.',
            machine,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Decommissions a machine asset after verifying it has no active scheduled jobs
 */
export const deleteMachine = async (req, res, next) => {
    try {
        // Check if machine currently has pending/in-progress scheduled tasks
        const activeSlots = await ScheduleSlot.countDocuments({
            userId: req.user._id,
            machineId: req.params.id,
            status: { $in: ['scheduled', 'in-progress'] },
        });

        if (activeSlots > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete machine. There are ${activeSlots} active production slots allocated to it. Re-dispatch or cancel those jobs first.`,
            });
        }

        const machine = await Machine.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'Machine not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Machine deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};
