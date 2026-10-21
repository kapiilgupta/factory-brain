import DemandForecast from '../models/DemandForecast.js';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import ProductionOrder from '../models/ProductionOrder.js';

/**
 * Generates next sequential human-readable order number (e.g. PO-202611-0001)
 */
const generateSequentialOrderNumber = async (userId, forecastPeriod, offset = 0) => {
    const periodPrefix = forecastPeriod.replace('-', ''); // '2026-11' -> '202611'
    const prefix = `PO-${periodPrefix}`;

    // Find the highest order number previously generated for this month
    const latestOrder = await ProductionOrder.findOne({
        userId,
        orderNumber: { $regex: `^${prefix}` },
    }).sort({ createdAt: -1 });

    let sequence = 1;
    if (latestOrder) {
        const parts = latestOrder.orderNumber.split('-');
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    const finalSeq = sequence + offset;
    return `${prefix}-${String(finalSeq).padStart(4, '0')}`;
};

/**
 * Net Requirement Planning Algorithm:
 * netRequirement = max(0, forecastQty - quantityOnHand)
 * Groups all size shortfall variants of the same product into a single batch PO
 */
export const generateOrdersFromForecast = async ({
    userId,
    forecastPeriod,
    defaultDueDate,
}) => {
    // 1. Fetch all demand forecasts for the target period
    const forecasts = await DemandForecast.find({ userId, forecastPeriod });

    if (!forecasts.length) {
        throw new Error(`No demand forecasts found for period ${forecastPeriod}. Please generate forecasts first.`);
    }

    // 2. Fetch real-time warehouse inventory for all user SKUs
    const inventoryItems = await Inventory.find({ userId });
    const stockMap = new Map();
    inventoryItems.forEach((item) => stockMap.set(item.sku, item.quantityOnHand));

    // 3. Fetch product definitions to look up size labels and machine minute ratings
    const products = await Product.find({ userId });
    const productMap = new Map();
    const sizeMap = new Map();

    products.forEach((p) => {
        productMap.set(String(p._id), p);
        p.sizes.forEach((s) => {
            sizeMap.set(s.sku, {
                sizeId: s._id,
                sizeLabel: s.sizeLabel,
                machineMinutesPerUnit: s.machineMinutesPerUnit,
            });
        });
    });

    // 4. Calculate Net Requirements and group by productId
    // Map<productId, lineItems[]>
    const productShortfalls = new Map();

    for (const forecast of forecasts) {
        const stockOnHand = stockMap.get(forecast.sku) || 0;
        const netRequirement = Math.max(0, forecast.forecastQty - stockOnHand);

        // Only produce if there is an actual shortfall
        if (netRequirement > 0) {
            const sizeInfo = sizeMap.get(forecast.sku) || {
                sizeId: forecast.sizeId,
                sizeLabel: 'Standard',
                machineMinutesPerUnit: 5,
            };

            const lineItem = {
                sizeId: sizeInfo.sizeId,
                sku: forecast.sku,
                sizeLabel: sizeInfo.sizeLabel,
                plannedQty: netRequirement,
                machineMinutesPerUnit: sizeInfo.machineMinutesPerUnit,
            };

            const prodIdStr = String(forecast.productId);
            if (!productShortfalls.has(prodIdStr)) {
                productShortfalls.set(prodIdStr, []);
            }
            productShortfalls.get(prodIdStr).push(lineItem);
        }
    }

    // 5. If no shortfalls exist, warehouse inventory is completely adequate
    if (productShortfalls.size === 0) {
        return [];
    }

    // 6. Compute delivery deadline (defaults to 14 days from now if not passed)
    const dueDate = defaultDueDate
        ? new Date(defaultDueDate)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const createdOrders = [];
    let index = 0;

    // 7. Create one consolidated ProductionOrder document per product
    for (const [productId, items] of productShortfalls.entries()) {
        const orderNumber = await generateSequentialOrderNumber(userId, forecastPeriod, index);

        const order = await ProductionOrder.create({
            userId,
            orderNumber,
            productId,
            forecastPeriod,
            dueDate,
            status: 'pending',
            items,
            notes: `Auto-generated from ${forecastPeriod} Net Requirement Plan`,
        });

        createdOrders.push(order);
        index++;
    }

    return createdOrders;
};
