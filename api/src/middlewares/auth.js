import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Extracts session token from HTTP-only cookie or Bearer authorization header
 */
const extractToken = (req) => {
    if (req.cookies?.fb_token) {
        return req.cookies.fb_token;
    }
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    return null;
};

/**
 * Verifies JWT session token and hydrates authenticated user context
 */
export const authenticateUser = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. No session token provided.',
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const account = await User.findById(payload.id);

        if (!account) {
            return res.status(401).json({
                success: false,
                message: 'Account associated with this session no longer exists.',
            });
        }

        req.user = account;
        next();
    } catch (error) {
        const isExpired = error.name === 'TokenExpiredError';
        return res.status(401).json({
            success: false,
            message: isExpired
                ? 'Session expired. Please log in again.'
                : 'Invalid session token. Access denied.',
        });
    }
};

/**
 * Role-Based Access Control gatekeeper
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient account permissions for this resource.',
            });
        }
        next();
    };
};

/**
 * Optional session hydration for public/semi-public routes
 */
export const optionalAuth = async (req, res, next) => {
    const token = extractToken(req);
    if (token) {
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            const account = await User.findById(payload.id);
            if (account) req.user = account;
        } catch {
            // Intentionally ignore token errors for optional routes
        }
    }
    next();
};

// Aliases for compatibility
export const protect = authenticateUser;
export const restrictTo = authorizeRoles;
