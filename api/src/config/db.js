import mongoose from 'mongoose';

/**
 * Manages MongoDB Atlas lifecycle and persistent connection
 */
const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.includes('YOUR_ACTUAL_MONGODB_URI_HERE')) {
        console.warn('⚠️ MONGODB_URI is not configured in .env. Skipping connection.');
        return;
    }

    // Monitor connection lifecycle events
    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB connection lost. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB connection restored.');
    });

    try {
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Initial Connection Error: ${error.message}`);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

export default connectDB;