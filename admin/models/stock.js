/**
 * مدل سهام برای پنل ادمین
 * 
 * این مدل برای مدیریت سهام‌های قابل خرید و فروش در سیستم استفاده می‌شود.
 * نام مدل به AdminStock تغییر داده شده تا با مدل Stock در سرور اصلی تداخل نداشته باشد.
 */

import mongoose from 'mongoose';

const adminStockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 1
  },
  initialPrice: {
    type: Number,
    required: true
  },
  dailyHigh: {
    type: Number
  },
  dailyLow: {
    type: Number
  },
  allTimeHigh: {
    type: Number
  },
  allTimeLow: {
    type: Number
  },
  volatility: {
    type: Number,
    min: 0,
    max: 100,
    default: 15
  },
  trend: {
    type: Number,
    min: -100,
    max: 100,
    default: 0
  },
  dividend: {
    rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    nextPayment: {
      type: Date
    }
  },
  category: {
    type: String,
    enum: ['tech', 'finance', 'energy', 'consumer', 'healthcare', 'industrial', 'other'],
    default: 'other'
  },
  image: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  priceHistory: [{
    price: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
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
  collection: 'stocks'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
adminStockSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// محاسبه تغییر قیمت (درصد)
adminStockSchema.virtual('priceChange').get(function() {
  if (this.priceHistory && this.priceHistory.length > 1) {
    const previousPrice = this.priceHistory[this.priceHistory.length - 2].price;
    return ((this.currentPrice - previousPrice) / previousPrice) * 100;
  }
  return 0;
});

// محاسبه تغییر قیمت نسبت به قیمت اولیه (درصد)
adminStockSchema.virtual('overallChange').get(function() {
  return ((this.currentPrice - this.initialPrice) / this.initialPrice) * 100;
});

// ایجاد و صادر کردن مدل - از تعریف مجدد جلوگیری می‌کنیم
export const AdminStock = mongoose.models.AdminStock || mongoose.model('AdminStock', adminStockSchema);