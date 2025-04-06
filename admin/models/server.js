/**
 * مدل سرور
 * 
 * این مدل برای ذخیره اطلاعات سرورهای دیسکورد استفاده می‌شود.
 */

import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  ownerId: {
    type: String
  },
  memberCount: {
    type: Number,
    default: 0
  },
  channels: [{
    channelId: String,
    name: String,
    type: String
  }],
  roles: [{
    roleId: String,
    name: String,
    color: String,
    position: Number,
    permissions: String
  }],
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
      type: String
    }],
    modRoles: [{
      type: String
    }],
    allowedCommands: [{
      type: String
    }],
    disabledCommands: [{
      type: String
    }],
    disabledChannels: [{
      type: String
    }],
    welcomeChannel: {
      type: String
    },
    welcomeMessage: {
      type: String
    },
    logsChannel: {
      type: String
    },
    announcementChannel: {
      type: String
    },
    economyEnabled: {
      type: Boolean,
      default: true
    },
    eventsEnabled: {
      type: Boolean,
      default: true
    },
    gameChannels: [{
      gameType: String,
      channelId: String
    }]
  },
  features: {
    economy: {
      startingCoins: {
        type: Number,
        default: 1000
      },
      startingCrystals: {
        type: Number,
        default: 0
      },
      dailyReward: {
        type: Number,
        default: 100
      },
      weeklyReward: {
        type: Number,
        default: 500
      },
      streakBonusEnabled: {
        type: Boolean,
        default: true
      }
    },
    games: {
      enabled: {
        type: Boolean,
        default: true
      },
      gamblingEnabled: {
        type: Boolean,
        default: true
      },
      minBet: {
        type: Number,
        default: 10
      },
      maxBet: {
        type: Number,
        default: 10000
      }
    },
    events: {
      giveawaysEnabled: {
        type: Boolean,
        default: true
      },
      challengesEnabled: {
        type: Boolean,
        default: true
      },
      timeEventsEnabled: {
        type: Boolean,
        default: true
      }
    },
    levels: {
      enabled: {
        type: Boolean,
        default: true
      },
      xpPerMessage: {
        type: Number,
        default: 5
      },
      xpCooldown: {
        type: Number, // در ثانیه
        default: 60
      },
      levelupMessage: {
        type: Boolean,
        default: true
      },
      roleRewards: [{
        level: Number,
        roleId: String
      }]
    }
  },
  premium: {
    isPremium: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date
    },
    tier: {
      type: Number,
      default: 0
    }
  },
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    messagesCount: {
      type: Number,
      default: 0
    },
    commandsUsed: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    coinsCirculating: {
      type: Number,
      default: 0
    }
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
  collection: 'servers'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
serverSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Server = mongoose.model('Server', serverSchema);