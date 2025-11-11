const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        maxlength: 1000,
        validate: {
            validator: function(v) {
                return v.trim().length > 0;
            },
            message: 'Message cannot be empty'
        }
    },
    username: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    // For private messages
    isPrivate: {
        type: Boolean,
        default: false
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Index for efficient queries
messageSchema.index({ timestamp: -1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ isPrivate: 1, recipientId: 1, timestamp: -1 });

// Pre-save middleware to sanitize text
messageSchema.pre('save', function(next) {
    if (this.isModified('text')) {
        // Basic XSS prevention - remove potentially dangerous tags
        this.text = this.text.replace(/<[^>]*>/g, '');
        // Trim whitespace
        this.text = this.text.trim();
    }
    next();
});

// Virtual for formatted timestamp
messageSchema.virtual('formattedTimestamp').get(function() {
    return this.timestamp.toISOString();
});

// Method to mark as edited
messageSchema.methods.markAsEdited = function() {
    this.edited = true;
    this.editedAt = new Date();
    return this.save();
};

// Method to soft delete
messageSchema.methods.softDelete = function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.text = '[Message deleted]';
    return this.save();
};

// Static method to get messages for user (including private ones)
messageSchema.statics.getMessagesForUser = function(userId, options = {}) {
    const { limit = 50, before, includePrivate = true } = options;

    let query = {
        $or: [
            { isPrivate: false }, // Public messages
            { userId: userId }, // Messages sent by user
        ]
    };

    if (includePrivate) {
        query.$or.push({ recipientId: userId }); // Messages received by user
    }

    if (before) {
        query.timestamp = { $lt: before };
    }

    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'username')
        .populate('recipientId', 'username');
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
