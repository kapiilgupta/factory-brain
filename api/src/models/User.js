import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        company: {
            name: {
                type: String,
                required: [true, 'Company name is required'],
                trim: true,
            },
            industry: {
                type: String,
                default: 'Manufacturing',
                trim: true,
            },
            numMachines: {
                type: Number,
                default: 1,
                min: [1, 'Must have at least 1 machine'],
            },
            productionType: {
                type: String,
                enum: ['batch', 'continuous', 'job-shop', 'discrete'],
                default: 'batch',
            },
        },
        role: {
            type: String,
            enum: ['admin', 'manager', 'viewer'],
            default: 'manager',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
            select: false,
        },
        otpExpires: {
            type: Date,
            select: false,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.otp;
                delete ret.otpExpires;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Hash modified passwords before writing to storage
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare plain-text password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Safe object utility for explicit calls
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpires;
    delete obj.__v;
    return obj;
};

const User = mongoose.model('User', userSchema);

export default User;