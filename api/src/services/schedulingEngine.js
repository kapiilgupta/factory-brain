import Machine from '../models/Machine.js';
import ProductionOrder from '../models/ProductionOrder.js';
import ScheduleSlot from '../models/ScheduleSlot.js';

/**
 * Computes machine utilization percentage and traffic-light health classification
 */
export const calculateUtilizationStatus = (scheduledMinutes, shiftMinutes) => {
    if (!shiftMinutes || shiftMinutes <= 0) return { pct: 0, status: 'idle' };
    const pct = Math.round((scheduledMinutes / shiftMinutes) * 100);

    let status = 'idle';
    if (pct > 100) status = 'over'; // Over-scheduled bottleneck
    else if (pct > 75) status = 'high'; // High utilization
    else if (pct > 0) status = 'normal'; // Sustainable workload

    return { pct, status };
};

/**
 * Earliest Due Date (EDD) Machine Scheduling Algorithm
 * Sequences pending orders by dueDate ASC and assigns them across operational machines
 */
export const generateScheduleForDate = async ({ userId, scheduleDate }) => {
    // 1. Fetch available operational machines
    const operationalMachines = await Machine.find({ userId, isOperational: true }).sort({ name: 1 });

    if (!operationalMachines.length) {
        throw new Error('No operational machines available for scheduling. Please activate machines first.');
    }

    // 2. Fetch uncompleted production orders sorted by due date (EDD order)
    const pendingOrders = await ProductionOrder.find({
        userId,
        status: { $in: ['pending', 'in-progress'] },
    }).sort({ dueDate: 1 });

    if (!pendingOrders.length) {
        return {
            message: 'No pending orders available to schedule.',
            slots: [],
            utilization: [],
        };
    }

    // 3. Clear existing schedule slots for this day to allow clean, idempotent recalculation
    await ScheduleSlot.deleteMany({ userId, scheduleDate });

    // 4. Initialize machine timeline pointers (starting at 08:00 AM on scheduleDate)
    const [year, month, day] = scheduleDate.split('-').map(Number);
    const shiftStartTime = new Date(year, month - 1, day, 8, 0, 0);

    const machineTimelines = new Map();
    operationalMachines.forEach((machine) => {
        machineTimelines.set(String(machine._id), {
            machine,
            nextAvailableTime: new Date(shiftStartTime),
            totalScheduledMinutes: 0,
            slotsCount: 0,
        });
    });

    const generatedSlots = [];

    // 5. Dispatch each order to the machine with the earliest available opening
    for (const order of pendingOrders) {
        const durationMinutes = order.totalMachineMinutes || 30; // Pure run time in minutes
        const bufferMinutes = 15; // Setup/changeover buffer

        // Greedily select machine with earliest nextAvailableTime
        let bestTimeline = null;
        for (const timeline of machineTimelines.values()) {
            if (!bestTimeline || timeline.nextAvailableTime < bestTimeline.nextAvailableTime) {
                bestTimeline = timeline;
            }
        }

        const slotStartTime = new Date(bestTimeline.nextAvailableTime);
        const slotEndTime = new Date(slotStartTime.getTime() + durationMinutes * 60 * 1000);
        const nextFreeTime = new Date(slotEndTime.getTime() + bufferMinutes * 60 * 1000);

        const sequence = bestTimeline.slotsCount + 1;

        // Create schedule slot document
        const slot = await ScheduleSlot.create({
            userId,
            productionOrderId: order._id,
            orderNumber: order.orderNumber,
            machineId: bestTimeline.machine._id,
            machineName: bestTimeline.machine.name,
            scheduleDate,
            startTime: slotStartTime,
            endTime: slotEndTime,
            durationMinutes,
            bufferMinutes,
            sequence,
            status: 'scheduled',
        });

        generatedSlots.push(slot);

        // Update machine state
        bestTimeline.nextAvailableTime = nextFreeTime;
        bestTimeline.totalScheduledMinutes += durationMinutes;
        bestTimeline.slotsCount = sequence;
    }

    // 6. Calculate utilization summary per machine
    const utilization = operationalMachines.map((machine) => {
        const timeline = machineTimelines.get(String(machine._id));
        const scheduledMinutes = timeline ? timeline.totalScheduledMinutes : 0;
        const { pct, status } = calculateUtilizationStatus(scheduledMinutes, machine.shiftMinutes);

        return {
            machineId: machine._id,
            machineName: machine.name,
            machineType: machine.type,
            shiftMinutes: machine.shiftMinutes,
            scheduledMinutes,
            utilizationPct: pct,
            status, // 'idle' | 'normal' | 'high' | 'over'
        };
    });

    return {
        slots: generatedSlots,
        utilization,
    };
};

/**
 * Retrieves the timeline schedule for a specific day sorted for Gantt rendering
 */
export const getScheduleByDate = async (userId, scheduleDate) => {
    return ScheduleSlot.find({ userId, scheduleDate })
        .populate('productionOrderId', 'items status priority dueDate')
        .sort({ machineName: 1, sequence: 1 });
};

/**
 * Computes machine capacity utilization summary for a given day
 */
export const getDailyMachineUtilization = async (userId, scheduleDate) => {
    const machines = await Machine.find({ userId });
    const slots = await ScheduleSlot.find({ userId, scheduleDate });

    const workloadByMachine = new Map();
    slots.forEach((slot) => {
        const id = String(slot.machineId);
        workloadByMachine.set(id, (workloadByMachine.get(id) || 0) + slot.durationMinutes);
    });

    return machines.map((machine) => {
        const scheduledMinutes = workloadByMachine.get(String(machine._id)) || 0;
        const { pct, status } = calculateUtilizationStatus(scheduledMinutes, machine.shiftMinutes);

        return {
            machineId: machine._id,
            machineName: machine.name,
            machineType: machine.type,
            shiftMinutes: machine.shiftMinutes,
            scheduledMinutes,
            utilizationPct: pct,
            status,
            isOperational: machine.isOperational,
        };
    });
};
