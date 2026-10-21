import 'dotenv/config'; // Must be FIRST — loads all .env variables

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import connectDB from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';
import authRouter from "./routes/auth.js"
import productRouter from "./routes/product.js"
import inventoryRouter from "./routes/inventory.js"
import machinesRouter from "./routes/machines.js"
import forecastRouter from "./routes/forecast.js"
import orderRouter from "./routes/orders.js"
import scheduleRouter from "./routes/schedule.js"
import dashboardRouter from "./routes/dashboard.js"

// Connect to MongoDB
connectDB();

const app = express();

//Middlewares
app.use(morgan('dev'));

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Factory Brain API is running 🚀' });
});

//API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/machines', machinesRouter)
app.use('/api/forecast', forecastRouter)
app.use('/api/orders', orderRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/dashboard', dashboardRouter)

//Fallback for unknown API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

//Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`\n Factory Brain API → http://localhost:${PORT}`);
    console.log(`   Mode    : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   MongoDB : ${process.env.MONGODB_URI ? 'configured ✅' : 'NOT SET ⚠️'}\n`);
});
