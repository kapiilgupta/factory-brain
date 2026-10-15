import mongoose from 'mongoose';

//Subdocument Schema: Product Size/Variant 
const sizeVariantSchema = new mongoose.Schema(
    {
        sizeLabel: {
            type: String,
            required: [true, 'Size label is required (e.g. S, M, L, XL, Standard)'],
            trim: true,
        },
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            uppercase: true,
            trim: true,
        },

        machineMinutesPerUnit: { // Required by the EDD Scheduling Engine to calculate production time
            type: Number,
            required: [true, 'Machine minutes per unit is required'],
            min: [0, 'Machine minutes cannot be negative'],
            default: 5,
        },

        materialQtyPerUnit: { // Raw material consumed per finished unit
            type: Number,
            required: [true, 'Material quantity per unit is required'],
            min: [0, 'Material quantity cannot be negative'],
            default: 1,
        },
    },
    {
        _id: true, // Each size variant gets its own unique MongoDB ObjectId
    }
);

// Main Product Schema 
const productSchema = new mongoose.Schema(
    {
        // Multi-tenant isolation: every product belongs strictly to one company/user
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required for multi-tenancy'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'Tops',
                'Bottoms',
                'Outerwear',
                'Accessories',
                'Footwear',
                'Electronics',
                'Food & Beverage',
                'Other',
            ],
            default: 'Other',
        },
        // Soft Delete: when deactivated, isActive is false instead of deleting the document
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        // Embedded sizes array
        sizes: {
            type: [sizeVariantSchema],
            validate: [
                (sizes) => sizes && sizes.length > 0,
                'A product must have at least one size variant or SKU',
            ],
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Compound Indexes 
// 1. Ensures fast queries when fetching all active products for a user
productSchema.index({ userId: 1, isActive: 1 });

// 2. Multi-tenant uniqueness index: Ensures User A cannot duplicate an SKU,
// while allowing User B in a different company to use the same SKU.
productSchema.index({ userId: 1, 'sizes.sku': 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
