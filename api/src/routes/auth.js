import express from 'express';
import { register, verifyOtp, login, logout, getMe } from '../controllers/authController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Public authentication endpoints
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/logout', logout);

// Protected session endpoints
router.get('/me', authenticateUser, getMe);

export default router;