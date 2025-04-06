/**
 * کمک‌کننده‌های مدل برای ES Modules
 * این فایل مدل‌های مختلف را برای استفاده در ES Modules صادر می‌کند
 */

// برای اجرای مستقیم از ریشه پروژه
import mongoose from 'mongoose';

// تعریف اسکیمای کاربر
const userSchema = new mongoose.Schema({
  id: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true, 
    unique: true 
  },
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String, default: null },
  wallet: { type: Number, default: 500 },
  bank: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
}, { 
  strict: false, // اجازه می‌دهد فیلدهای دیگر هم در مدل قرار بگیرند
  timestamps: true 
});

// استفاده از مدل‌های موجود یا ایجاد مدل‌های جدید
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
export const Stock = mongoose.models.Stock || mongoose.model('Stock', new mongoose.Schema({}, { strict: false }));
export const MarketListing = mongoose.models.MarketListing || mongoose.model('MarketListing', new mongoose.Schema({}, { strict: false }));
export const Loan = mongoose.models.Loan || mongoose.model('Loan', new mongoose.Schema({}, { strict: false }));
export const GlobalSettings = { getGlobalSettings: () => ({}) };