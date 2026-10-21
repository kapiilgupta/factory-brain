import {
  generateScheduleForDate,
  getScheduleByDate,
  getDailyMachineUtilization,
} from '../services/schedulingEngine.js';

/**
 * Triggers the Earliest Due Date (EDD) machine scheduling algorithm for a target date
 * POST /api/schedule/generate
 * Body: { scheduleDate: "YYYY-MM-DD" }
 */
export const generateSchedule = async (req, res, next) => {
  try {
    const { scheduleDate } = req.body;

    if (!scheduleDate || !/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
      return res.status(400).json({
        success: false,
        message: 'Valid scheduleDate in YYYY-MM-DD format is required.',
      });
    }

    const result = await generateScheduleForDate({
      userId: req.user._id,
      scheduleDate,
    });

    res.status(201).json({
      success: true,
      message: result.slots.length
        ? `Successfully scheduled ${result.slots.length} production orders across machines.`
        : (result.message || 'No pending orders to schedule for this date.'),
      scheduleDate,
      count: result.slots.length,
      slots: result.slots,
      utilization: result.utilization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the timeline schedule slots for a date (ordered for Gantt rendering)
 * GET /api/schedule?date=YYYY-MM-DD
 */
export const getSchedule = async (req, res, next) => {
  try {
    const scheduleDate = req.query.date || new Date().toISOString().split('T')[0];

    const slots = await getScheduleByDate(req.user._id, scheduleDate);

    res.status(200).json({
      success: true,
      scheduleDate,
      count: slots.length,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves machine utilization summary for a target date
 * GET /api/schedule/utilization?date=YYYY-MM-DD
 */
export const getUtilization = async (req, res, next) => {
  try {
    const scheduleDate = req.query.date || new Date().toISOString().split('T')[0];

    const utilization = await getDailyMachineUtilization(req.user._id, scheduleDate);

    res.status(200).json({
      success: true,
      scheduleDate,
      count: utilization.length,
      utilization,
    });
  } catch (error) {
    next(error);
  }
};