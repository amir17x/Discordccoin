/**
 * مدل سرور
 * 
 * این مدل برای ذخیره و مدیریت اطلاعات سرورهای دیسکورد استفاده می‌شود.
 */

import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: String,
    trim: true
  },
  ownerTag: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    trim: true
  },
  memberCount: {
    type: Number,
    default: 0
  },
  botJoinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumUntil: {
    type: Date
  },
  settings: {
    prefix: {
      type: String,
      default: '!'
    },
    language: {
      type: String,
      default: 'fa'
    },
    timezone: {
      type: String,
      default: 'Asia/Tehran'
    },
    adminRoles: [{
      type: String,
      trim: true
    }],
    moderatorRoles: [{
      type: String,
      trim: true
    }],
    autoRoles: [{
      type: String,
      trim: true
    }],
    welcomeChannel: {
      type: String,
      trim: true
    },
    welcomeMessage: {
      type: String,
      trim: true
    },
    logChannel: {
      type: String,
      trim: true
    },
    economyEnabled: {
      type: Boolean,
      default: true
    },
    allowedCommands: [{
      type: String,
      trim: true
    }],
    disabledCommands: [{
      type: String,
      trim: true
    }],
    allowedChannels: [{
      type: String,
      trim: true
    }],
    disabledChannels: [{
      type: String,
      trim: true
    }],
    customCommandPrefix: {
      type: String,
      default: '!'
    }
  },
  features: {
    economy: {
      type: Boolean,
      default: true
    },
    games: {
      type: Boolean,
      default: true
    },
    moderation: {
      type: Boolean,
      default: true
    },
    music: {
      type: Boolean,
      default: false
    },
    leveling: {
      type: Boolean,
      default: true
    },
    ai: {
      type: Boolean,
      default: true
    },
    tips: {
      type: Boolean,
      default: true
    },
    welcomer: {
      type: Boolean,
      default: true
    },
    customCommands: {
      type: Boolean,
      default: true
    }
  },
  analytics: {
    commandUsage: {
      type: Map,
      of: Number,
      default: {}
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    totalCommands: {
      type: Number,
      default: 0
    },
    economyTransactions: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    totalCoins: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  customCommands: [{
    name: {
      type: String,
      trim: true
    },
    response: {
      type: String,
      trim: true
    },
    createdBy: {
      type: String,
      trim: true
    },
    usageCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true,
  collection: 'servers'
});

// ایندکس‌ها
serverSchema.index({ serverId: 1 });
serverSchema.index({ name: 1 });
serverSchema.index({ isActive: 1 });
serverSchema.index({ isPremium: 1 });
serverSchema.index({ memberCount: -1 });
serverSchema.index({ botJoinedAt: -1 });
serverSchema.index({ createdAt: -1 });

// ایجاد slug برای سرور (برای URLs)
serverSchema.virtual('slug').get(function() {
  return this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
});

// متد استاتیک برای یافتن سرور با ID
serverSchema.statics.findByServerId = function(serverId) {
  return this.findOne({ serverId });
};

// متد استاتیک برای به‌روزرسانی تعداد اعضا
serverSchema.statics.updateMemberCount = function(serverId, memberCount) {
  return this.findOneAndUpdate(
    { serverId },
    { memberCount },
    { new: true }
  );
};

// متد برای بررسی وضعیت premium
serverSchema.methods.isPremiumActive = function() {
  if (!this.isPremium) return false;
  if (!this.premiumUntil) return true; // بدون تاریخ انقضا، دائمی است
  return this.premiumUntil > new Date();
};

// متد برای ثبت استفاده از دستور
serverSchema.methods.logCommandUsage = function(commandName) {
  const commandKey = `analytics.commandUsage.${commandName}`;
  const updateObj = { $inc: {} };
  updateObj.$inc[commandKey] = 1;
  updateObj.$inc['analytics.totalCommands'] = 1;
  updateObj.$set = { 'analytics.lastUpdated': new Date() };
  
  return this.constructor.findByIdAndUpdate(
    this._id,
    updateObj,
    { new: true }
  );
};

// متد برای به‌روزرسانی آمار سرور
serverSchema.methods.updateAnalytics = function(analyticsData) {
  const update = {
    $set: {
      'analytics.activeUsers': analyticsData.activeUsers || this.analytics.activeUsers,
      'analytics.economyTransactions': analyticsData.economyTransactions || this.analytics.economyTransactions,
      'analytics.gamesPlayed': analyticsData.gamesPlayed || this.analytics.gamesPlayed,
      'analytics.totalCoins': analyticsData.totalCoins || this.analytics.totalCoins,
      'analytics.lastUpdated': new Date()
    }
  };
  
  return this.constructor.findByIdAndUpdate(
    this._id,
    update,
    { new: true }
  );
};

// تبدیل به JSON
serverSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.id;
    return ret;
  }
});

// ایجاد و صادر کردن مدل
export const Server = mongoose.model('Server', serverSchema);