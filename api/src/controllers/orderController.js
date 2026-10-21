import ProductionOrder from '../models/ProductionOrder.js';
import { generateOrdersFromForecast } from '../services/planningEngine.js';

// Allowed state transitions to protect shop-floor reality
const VALID_TRANSITIONS = {
    pending: ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
    completed: [], // Terminal state
    cancelled: ['pending'], // Re-open
};

/**
 * Triggers automated Net Requirement Planning to generate consolidated batch orders
 */
export const generateOrders = async (req, res, next) => {
    try {
        const { forecastPeriod, defaultDueDate } = req.body;

        if (!forecastPeriod) {
            return res.status(400).json({
                success: false,
                message: 'Forecast period (format: YYYY-MM) is required.',
            });
        }

        const orders = await generateOrdersFromForecast({
            userId: req.user._id,
            forecastPeriod,
            defaultDueDate,
        });

        res.status(201).json({
            success: true,
            message: orders.length
                ? `Successfully generated ${orders.length} batch production orders.`
                : 'Warehouse inventory already satisfies forecasted demand. No shortfalls detected.',
            count: orders.length,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves all production orders sorted by due date (EDD order)
 * Supports optional filtering: ?status=pending&forecastPeriod=2026-11
 */
export const getOrders = async (req, res, next) => {
    try {
        const { status, forecastPeriod } = req.query;

        const filter = { userId: req.user._id };

        if (status) filter.status = status;
        if (forecastPeriod) filter.forecastPeriod = forecastPeriod;

        const orders = await ProductionOrder.find(filter)
            .populate('productId', 'name category')
            .sort({ dueDate: 1 }); // Earliest Due Date first

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves a single production order by ID with line items and product details
 */
export const getOrderById = async (req, res, next) => {
    try {
        const order = await ProductionOrder.findOne({
            _id: req.params.id,
            userId: req.user._id,
        }).populate('productId', 'name category sizes');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Production order not found.',
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Updates order status through strict state machine transition validation
 */
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const order = await ProductionOrder.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Production order not found.',
            });
        }

        // Validate state machine transition
        const allowedNextStates = VALID_TRANSITIONS[order.status] || [];
        if (!allowedNextStates.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid state transition from "${order.status}" to "${status}". Allowed transitions: ${allowedNextStates.join(', ') || 'none (terminal state)'}.`,
            });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: `Order status updated to "${status}".`,
            order,
        });
    } catch (error) {
        next(error);
    }
};
