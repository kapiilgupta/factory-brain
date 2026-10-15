/**
 * Global API error handling middleware
 * Normalizes Mongoose, MongoDB, and application exceptions into unified JSON responses
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // MongoDB unique constraint violation (duplicate key)
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'record';
        message = `A ${field} with that value already exists.`;
    }

    // Mongoose invalid ObjectId format
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid resource identifier: ${err.value}`;
    }

    // Mongoose schema validation failure
    if (err.name === 'ValidationError') {
        statusCode = 422;
        const errorDetails = Object.values(err.errors).map((e) => e.message);
        message = errorDetails.join('. ');
    }

    if (process.env.NODE_ENV === 'development') {
        console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
