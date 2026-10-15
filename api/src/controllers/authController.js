import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generates signed JWT payload
 */
const signAuthToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Sets secure HTTP-only authentication cookie
 */
const setAuthCookie = (res, token) => {
    const maxAge = parseInt(process.env.COOKIE_MAX_AGE, 10) || 7 * 24 * 60 * 60 * 1000;
    res.cookie('fb_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
    });
};

/**
 * Registers new manufacturing account and generates activation OTP
 */
export const register = async (req, res, next) => {
    try {
        const { username, email, password, company } = req.body;

        // Check existing email or username before creating
        const existingUser = await User.findOne({
            $or: [{ email: email?.toLowerCase() }, { username }],
        });

        if (existingUser) {
            const field = existingUser.email === email?.toLowerCase() ? 'Email' : 'Username';
            return res.status(409).json({
                success: false,
                message: `${field} is already registered.`,
            });
        }

        // Generate 6-digit numeric OTP valid for 10 minutes
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        const newUser = await User.create({
            username,
            email,
            password,
            company,
            otp,
            otpExpires,
            isVerified: false,
        });

        // In local development, log the OTP directly to terminal for testing
        console.log(`\n🔑 [Verification OTP] Code for ${newUser.email}: ${otp}\n`);

        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please verify your email with the OTP code.',
            user: newUser,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Confirms account activation OTP and establishes session
 */
export const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Both email and verification OTP are required.',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Account not found for provided email.',
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Account is already verified. Please log in directly.',
            });
        }

        if (!user.otp || user.otp !== otp.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code.',
            });
        }

        if (user.otpExpires && user.otpExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.',
            });
        }

        // Mark verified and clear OTP credentials
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = signAuthToken(user._id);
        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully. Session established.',
            user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Authenticates user credentials and sets session cookie
 */
export const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both username/email and password.',
            });
        }

        // Support logging in with either email or username
        const user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid login credentials.',
            });
        }

        // Update last login timestamp without re-validating the full document
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = signAuthToken(user._id);
        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: 'Logged in successfully.',
            user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Terminates session by clearing authentication cookie
 */
export const logout = (req, res) => {
    res.cookie('fb_token', 'logged_out', {
        httpOnly: true,
        expires: new Date(Date.now() + 1000),
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
    });
};

/**
 * Returns authenticated account profile
 */
export const getMe = (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
};
