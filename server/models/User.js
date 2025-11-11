const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: 'Username can only contain letters, numbers, and underscores'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        validate: {
            validator: function(v) {
                // At least one uppercase, one lowercase, one number, one special character
                return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(v);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true, // Allows multiple null values
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Invalid email format'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual for account lock
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
    // Update updatedAt
    this.updatedAt = new Date();

    // Hash password if modified
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12); // Increased rounds for better security
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (this.isLocked) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
    }
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Lock for 2 hours
        };
    }

    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { lastLogin: new Date() }
    });
};

// Index for username lookups
userSchema.index({ username: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
