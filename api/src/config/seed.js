import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Machine from '../models/Machine.js';
import DemandForecast from '../models/DemandForecast.js';
import ProductionOrder from '../models/ProductionOrder.js';
import ScheduleSlot from '../models/ScheduleSlot.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in api/.env');
    process.exit(1);
}

const seedDatabase = async () => {
    try {
        console.log('\n🌱 Connecting to MongoDB Atlas for seeding...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        // 1. Create or Re-seed Demo Factory Manager
        const demoEmail = 'manager@factorybrain.io';
        let demoUser = await User.findOne({ email: demoEmail });

        if (demoUser) {
            console.log(`🧹 Clearing previous seed data for ${demoEmail}...`);
            await Promise.all([
                Product.deleteMany({ userId: demoUser._id }),
                Inventory.deleteMany({ userId: demoUser._id }),
                Machine.deleteMany({ userId: demoUser._id }),
                DemandForecast.deleteMany({ userId: demoUser._id }),
                ProductionOrder.deleteMany({ userId: demoUser._id }),
                ScheduleSlot.deleteMany({ userId: demoUser._id }),
            ]);
        } else {
            console.log('👤 Creating demo factory manager account...');
            demoUser = await User.create({
                username: 'demomanager',
                email: demoEmail,
                password: 'FactoryBrain2026!', // Hashed automatically by User pre-save hook
                role: 'manager',
                isVerified: true,
                company: {
                    name: 'Apex Apparel Manufacturing Co.',
                    industry: 'Textiles & Garments',
                    numMachines: 4,
                    productionType: 'batch', // Fixed: matches User enum ['batch', 'continuous', 'job-shop', 'discrete']
                },
            });
            console.log(`✅ Demo user created: ${demoUser.email} / FactoryBrain2026!`);
        }

        const userId = demoUser._id;

        // 2. Seed Machines
        console.log('⚙️ Creating machines...');
        const [cuttingMachine, sewingMachine, packagingMachine] = await Machine.create([
            {
                userId,
                name: 'High-Precision Cutting Machine A',
                type: 'Cutting', // Fixed: Capitalized to match Machine enum
                shiftMinutes: 480, // 8-hour shift
                isOperational: true,
            },
            {
                userId,
                name: 'Industrial Sewing Line B',
                type: 'Sewing', // Fixed: Capitalized to match Machine enum
                shiftMinutes: 480,
                isOperational: true,
            },
            {
                userId,
                name: 'Automated Packaging Unit C',
                type: 'Packaging', // Fixed: Capitalized to match Machine enum
                shiftMinutes: 480,
                isOperational: true,
            },
        ]);

        // 3. Seed Products with Multi-Size SKUs
        console.log('📦 Creating catalog products...');
        const [tshirtProduct, hoodieProduct] = await Product.create([
            {
                userId,
                name: 'Heavyweight Cotton Crewneck T-Shirt',
                category: 'Tops',
                isActive: true,
                sizes: [
                    { sizeLabel: 'S', sku: 'TSHIRT-BLK-S', machineMinutesPerUnit: 3, materialQtyPerUnit: 1.0 },
                    { sizeLabel: 'M', sku: 'TSHIRT-BLK-M', machineMinutesPerUnit: 3, materialQtyPerUnit: 1.2 },
                    { sizeLabel: 'L', sku: 'TSHIRT-BLK-L', machineMinutesPerUnit: 4, materialQtyPerUnit: 1.4 },
                    { sizeLabel: 'XL', sku: 'TSHIRT-BLK-XL', machineMinutesPerUnit: 4, materialQtyPerUnit: 1.6 },
                ],
            },
            {
                userId,
                name: 'French Terry Pullover Hoodie',
                category: 'Tops',
                isActive: true,
                sizes: [
                    { sizeLabel: 'S', sku: 'HOODIE-GRY-S', machineMinutesPerUnit: 6, materialQtyPerUnit: 2.0 },
                    { sizeLabel: 'M', sku: 'HOODIE-GRY-M', machineMinutesPerUnit: 7, materialQtyPerUnit: 2.3 },
                    { sizeLabel: 'L', sku: 'HOODIE-GRY-L', machineMinutesPerUnit: 8, materialQtyPerUnit: 2.6 },
                ],
            },
        ]);

        // 4. Seed Inventory Records (including intentional low stock alerts)
        console.log('📊 Initializing warehouse inventory ledger...');
        await Inventory.create([
            // T-Shirts:
            { userId, productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[0]._id, sku: 'TSHIRT-BLK-S', quantityOnHand: 45, reorderPoint: 50 }, // ⚠️ Low Stock Alert
            { userId, productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[1]._id, sku: 'TSHIRT-BLK-M', quantityOnHand: 180, reorderPoint: 80 },
            { userId, productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[2]._id, sku: 'TSHIRT-BLK-L', quantityOnHand: 25, reorderPoint: 60 },  // ⚠️ Low Stock Alert
            { userId, productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[3]._id, sku: 'TSHIRT-BLK-XL', quantityOnHand: 90, reorderPoint: 40 },
            // Hoodies:
            { userId, productId: hoodieProduct._id, sizeId: hoodieProduct.sizes[0]._id, sku: 'HOODIE-GRY-S', quantityOnHand: 15, reorderPoint: 30 },  // ⚠️ Low Stock Alert
            { userId, productId: hoodieProduct._id, sizeId: hoodieProduct.sizes[1]._id, sku: 'HOODIE-GRY-M', quantityOnHand: 60, reorderPoint: 50 },
            { userId, productId: hoodieProduct._id, sizeId: hoodieProduct.sizes[2]._id, sku: 'HOODIE-GRY-L', quantityOnHand: 75, reorderPoint: 45 },
        ]);

        // 5. Seed 3-Month Historical Demand Data
        console.log('📈 Seeding historical demand forecasts (3-period history)...');
        const historicalMonths = ['2026-08', '2026-09', '2026-10'];
        const forecastRecords = [];

        for (const month of historicalMonths) {
            forecastRecords.push(
                { userId, sku: 'TSHIRT-BLK-S', productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[0]._id, forecastPeriod: month, forecastQty: 120, confidencePct: 85, method: '3-Period Moving Average' },
                { userId, sku: 'TSHIRT-BLK-M', productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[1]._id, forecastPeriod: month, forecastQty: 240, confidencePct: 85, method: '3-Period Moving Average' },
                { userId, sku: 'TSHIRT-BLK-L', productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[2]._id, forecastPeriod: month, forecastQty: 190, confidencePct: 85, method: '3-Period Moving Average' },
                { userId, sku: 'TSHIRT-BLK-XL', productId: tshirtProduct._id, sizeId: tshirtProduct.sizes[3]._id, forecastPeriod: month, forecastQty: 110, confidencePct: 85, method: '3-Period Moving Average' },
                { userId, sku: 'HOODIE-GRY-S', productId: hoodieProduct._id, sizeId: hoodieProduct.sizes[0]._id, forecastPeriod: month, forecastQty: 80, confidencePct: 85, method: '3-Period Moving Average' },
                { userId, sku: 'HOODIE-GRY-M', productId: hoodieProduct._id, sizeId: hoodieProduct.sizes[1]._id, forecastPeriod: month, forecastQty: 150, confidencePct: 85, method: '3-Period Moving Average' },
                { userId, sku: 'HOODIE-GRY-L', productId: hoodieProduct._id, sizeId: hoodieProduct.sizes[2]._id, forecastPeriod: month, forecastQty: 130, confidencePct: 85, method: '3-Period Moving Average' }
            );
        }
        await DemandForecast.insertMany(forecastRecords);

        // 6. Seed Sample Production Order
        console.log('📋 Creating initial production order...');
        const initialOrder = await ProductionOrder.create({
            userId,
            orderNumber: 'PO-202611-0001',
            productId: tshirtProduct._id,
            forecastPeriod: '2026-11',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: 'in-progress',
            items: [
                {
                    sizeId: tshirtProduct.sizes[0]._id,
                    sku: 'TSHIRT-BLK-S',
                    sizeLabel: 'S',
                    plannedQty: 75,
                    machineMinutesPerUnit: 3,
                },
                {
                    sizeId: tshirtProduct.sizes[2]._id,
                    sku: 'TSHIRT-BLK-L',
                    sizeLabel: 'L',
                    plannedQty: 100,
                    machineMinutesPerUnit: 4,
                },
            ],
            notes: 'Priority batch replenishment for low-stock sizes',
        });

        // 7. Seed Today's Timeline Schedule Slot for the Gantt Chart
        console.log('⏱️ Allocating initial machine schedule slot...');
        const todayStr = new Date().toISOString().split('T')[0];
        const [year, month, day] = todayStr.split('-').map(Number);
        const shiftStart = new Date(year, month - 1, day, 8, 30, 0);
        const shiftEnd = new Date(year, month - 1, day, 11, 45, 0); // ~195 minutes

        await ScheduleSlot.create({
            userId,
            productionOrderId: initialOrder._id,
            orderNumber: initialOrder.orderNumber,
            machineId: cuttingMachine._id,
            machineName: cuttingMachine.name,
            scheduleDate: todayStr,
            startTime: shiftStart,
            endTime: shiftEnd,
            durationMinutes: 195,
            bufferMinutes: 15,
            sequence: 1,
            status: 'scheduled',
        });

        console.log('\n=========================================');
        console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
        console.log('=========================================');
        console.log(`Demo Account  : ${demoEmail}`);
        console.log('Password      : FactoryBrain2026!');
        console.log('Products      : 2 created (7 sizes total)');
        console.log('Machines      : 3 created (all operational)');
        console.log('Inventory     : 7 SKUs initialized (3 low-stock alerts)');
        console.log('Forecasts     : 21 historical records created');
        console.log('Orders        : 1 batch PO created (PO-202611-0001)');
        console.log(`Schedule      : 1 slot scheduled on ${todayStr}`);
        console.log('=========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
