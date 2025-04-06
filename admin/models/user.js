/**
 * مدل کاربر
 * 
 * این مدل برای ذخیره اطلاعات کاربران استفاده می‌شود.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  discriminator: {
    type: String
  },
  avatar: {
    type: String
  },
  isBot: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'fa'
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    privateMode: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    displayCurrency: {
      type: String,
      enum: ['coins', 'crystals', 'both'],
      default: 'both'
    }
  },
  profile: {
    bio: {
      type: String,
      maxlength: 300
    },
    customTitle: {
      type: String,
      maxlength: 50
    },
    badges: [{
      id: String,
      name: String,
      description: String,
      icon: String,
      earned: Date
    }],
    background: {
      type: String
    },
    reputation: {
      type: Number,
      default: 0
    }
  },
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    commandsUsed: {
      type: Number,
      default: 0
    },
    coinsEarned: {
      type: Number,
      default: 0
    },
    coinsSpent: {
      type: Number,
      default: 0
    },
    dailyStreak: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  roles: [{
    roleId: String,
    name: String,
    color: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  servers: [{
    serverId: String,
    name: String,
    joinedAt: Date
  }],
  level: {
    xp: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    progress: {
      type: Number,
      default: 0
    }
  },
  warnings: [{
    reason: String,
    adminId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  banned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'users'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل - از تعریف مجدد جلوگیری می‌کنیم
export const User = mongoose.models.User || mongoose.model('User', userSchema);