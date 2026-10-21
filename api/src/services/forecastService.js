import DemandForecast from '../models/DemandForecast.js';
import Product from '../models/Product.js';

/**
 * Computes 3-Period Moving Average with whole-unit ceiling and heuristic confidence score
 * @param {number[]} historicalSales - Array of past period unit sales (e.g. [120, 140, 130])
 */
export const calculate3PeriodMovingAverage = (historicalSales = []) => {
    if (!historicalSales.length) {
        return { forecastQty: 0, confidencePct: 20, periodsUsed: 0 };
    }

    // Use the most recent 3 periods available
    const recentPeriods = historicalSales.slice(-3);
    const sum = recentPeriods.reduce((acc, val) => acc + Number(val), 0);
    const average = sum / recentPeriods.length;

    // Discrete whole-unit projection (always ceiling in manufacturing)
    const forecastQty = Math.ceil(average);

    // Confidence mapping based on historical sample depth
    let confidencePct = 40;
    if (recentPeriods.length === 2) confidencePct = 60;
    if (recentPeriods.length >= 3) confidencePct = 85;

    return {
        forecastQty,
        confidencePct,
        periodsUsed: recentPeriods.length,
    };
};

/**
 * Generates or reconciles demand forecasts across all active product SKUs for a target period
 */
export const generateForecastsForPeriod = async ({
    userId,
    forecastPeriod,
    historicalData = [],
}) => {
    // 1. Fetch all active catalog products and their size variants
    const activeProducts = await Product.find({ userId, isActive: true });

    if (!activeProducts.length) {
        throw new Error('No active products found in catalog. Create products before forecasting.');
    }

    // 2. Index historical inputs by SKU: Map<SKU, salesNumbers[]>
    const historyBySku = new Map();
    historicalData.forEach((entry) => {
        const sku = entry.sku?.toUpperCase().trim();
        if (!sku) return;
        if (!historyBySku.has(sku)) historyBySku.set(sku, []);
        historyBySku.get(sku).push(entry.actualSales || entry.sales || 0);
    });

    const forecastPromises = [];

    // 3. Generate forecasts for every SKU across all products
    for (const product of activeProducts) {
        for (const size of product.sizes) {
            const salesHistory = historyBySku.get(size.sku) || [];

            // Calculate statistical forecast or apply sensible baseline if new SKU
            const stats = salesHistory.length
                ? calculate3PeriodMovingAverage(salesHistory)
                : { forecastQty: 50, confidencePct: 35, periodsUsed: 0 };

            // Atomic idempotent upsert
            const upsertPromise = DemandForecast.findOneAndUpdate(
                { userId, forecastPeriod, sku: size.sku },
                {
                    userId,
                    sku: size.sku,
                    productId: product._id,
                    sizeId: size._id,
                    forecastPeriod,
                    forecastQty: stats.forecastQty,
                    confidencePct: stats.confidencePct,
                    historicalPeriodsUsed: stats.periodsUsed,
                    method: '3-Period Moving Average',
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            forecastPromises.push(upsertPromise);
        }
    }

    return Promise.all(forecastPromises);
};

/**
 * Fetches all saved forecasts for a target period
 */
export const getForecastsByPeriod = async (userId, forecastPeriod) => {
    return DemandForecast.find({ userId, forecastPeriod })
        .populate('productId', 'name category')
        .sort({ sku: 1 });
};
