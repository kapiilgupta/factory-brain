import {
    generateForecastsForPeriod,
    getForecastsByPeriod,
} from '../services/forecastService.js';
import DemandForecast from '../models/DemandForecast.js';

/**
 * Triggers automated 3-period moving average demand forecasting calculation
 */
export const generateForecast = async (req, res, next) => {
    try {
        const { forecastPeriod, historicalData } = req.body;

        if (!forecastPeriod) {
            return res.status(400).json({
                success: false,
                message: 'Forecast period (YYYY-MM) is required.',
            });
        }

        const forecasts = await generateForecastsForPeriod({
            userId: req.user._id,
            forecastPeriod,
            historicalData,
        });

        res.status(200).json({
            success: true,
            message: `Forecasts generated successfully for ${forecastPeriod}.`,
            count: forecasts.length,
            forecasts,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves saved forecasts for a target period, or lists all available periods
 */
export const getForecasts = async (req, res, next) => {
    try {
        const { period } = req.query;

        // If specific period is requested (e.g. ?period=2026-11)
        if (period) {
            const forecasts = await getForecastsByPeriod(req.user._id, period);
            return res.status(200).json({
                success: true,
                count: forecasts.length,
                period,
                forecasts,
            });
        }

        // Otherwise, return all distinct forecast periods saved in the database
        const savedPeriods = await DemandForecast.distinct('forecastPeriod', {
            userId: req.user._id,
        });

        res.status(200).json({
            success: true,
            periods: savedPeriods.sort().reverse(),
        });
    } catch (error) {
        next(error);
    }
};
