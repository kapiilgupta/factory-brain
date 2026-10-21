import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Machine from '../models/Machine.js';
import ProductionOrder from '../models/ProductionOrder.js';
import ScheduleSlot from '../models/ScheduleSlot.js';
import { getDailyMachineUtilization } from '../services/schedulingEngine.js';

/**
 * High-level executive KPI summary for the factory
 * GET /api/dashboard/summary
 */
export const getDashboardSummary = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [
            totalProducts,
            totalInventoryItems,
            operationalMachines,
            totalMachines,
            lowStockAlertsCount,
            pendingOrdersCount,
            inProgressOrdersCount,
            stockAggregate,
        ] = await Promise.all([
            Product.countDocuments({ userId, isDeleted: false }),
            Inventory.countDocuments({ userId }),
            Machine.countDocuments({ userId, isOperational: true }),
            Machine.countDocuments({ userId }),
            Inventory.countDocuments({
                userId,
                $expr: { $lte: ['$quantityOnHand', '$reorderPoint'] },
            }),
            ProductionOrder.countDocuments({ userId, status: 'pending' }),
            ProductionOrder.countDocuments({ userId, status: 'in-progress' }),
            Inventory.aggregate([
                { $match: { userId } },
                { $group: { _id: null, totalOnHand: { $sum: '$quantityOnHand' } } },
            ]),
        ]);

        const totalStockUnits = stockAggregate.length > 0 ? stockAggregate[0].totalOnHand : 0;

        res.status(200).json({
            success: true,
            kpis: {
                products: {
                    total: totalProducts,
                },
                inventory: {
                    totalSKUs: totalInventoryItems,
                    totalUnitsOnHand: totalStockUnits,
                    lowStockAlerts: lowStockAlertsCount,
                },
                machines: {
                    total: totalMachines,
                    operational: operationalMachines,
                    offline: totalMachines - operationalMachines,
                },
                orders: {
                    pending: pendingOrdersCount,
                    inProgress: inProgressOrdersCount,
                    totalActive: pendingOrdersCount + inProgressOrdersCount,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Breakdown of production orders and current manufacturing workload
 * GET /api/dashboard/production
 */
export const getProductionBreakdown = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Aggregation of orders grouped by status
        const statusBreakdown = await ProductionOrder.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$status',
                    orderCount: { $sum: 1 },
                    totalUnits: { $sum: '$totalUnits' },
                },
            },
        ]);

        // Fetch the 5 most recent production orders
        const recentOrders = await ProductionOrder.find({ userId })
            .populate('productId', 'name category')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            statusBreakdown,
            recentOrders,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Today's schedule slots and machine utilization overview for shop-floor display
 * GET /api/dashboard/schedule?date=YYYY-MM-DD
 */
export const getScheduleOverview = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const scheduleDate = req.query.date || new Date().toISOString().split('T')[0];

        const [slots, utilization] = await Promise.all([
            ScheduleSlot.find({ userId, scheduleDate })
                .populate('productionOrderId', 'status priority dueDate')
                .sort({ machineName: 1, sequence: 1 }),
            getDailyMachineUtilization(userId, scheduleDate),
        ]);

        res.status(200).json({
            success: true,
            scheduleDate,
            slotsCount: slots.length,
            slots,
            utilization,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Real-time active alerts: low stock, overdue orders, and offline machines
 * GET /api/dashboard/alerts
 */
export const getActiveAlerts = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        const [lowStockItems, overdueOrders, offlineMachines] = await Promise.all([
            Inventory.find({
                userId,
                $expr: { $lte: ['$quantityOnHand', '$reorderPoint'] },
            }).populate('productId', 'name category'),
            ProductionOrder.find({
                userId,
                status: { $in: ['pending', 'in-progress'] },
                dueDate: { $lt: now },
            }).populate('productId', 'name category'),
            Machine.find({
                userId,
                isOperational: false,
            }),
        ]);

        res.status(200).json({
            success: true,
            summary: {
                totalAlerts: lowStockItems.length + overdueOrders.length + offlineMachines.length,
                stockAlertsCount: lowStockItems.length,
                overdueOrdersCount: overdueOrders.length,
                offlineMachinesCount: offlineMachines.length,
            },
            alerts: {
                lowStock: lowStockItems,
                overdueOrders,
                offlineMachines,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Top inventory items with capacity fill percentage for dashboard bars
 * GET /api/dashboard/inventory
 */
export const getInventoryOverview = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const items = await Inventory.find({ userId })
            .populate('productId', 'name category')
            .sort({ quantityOnHand: -1 })
            .limit(6);

        res.status(200).json({
            success: true,
            count: items.length,
            items,
        });
    } catch (error) {
        next(error);
    }
};
