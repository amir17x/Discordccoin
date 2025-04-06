/**
 * کمک‌کننده‌های مدل برای ES Modules
 * این فایل مدل‌های مختلف را برای استفاده در ES Modules صادر می‌کند
 */

// برای اجرای مستقیم از ریشه پروژه
import mongoose from 'mongoose';

// وقتی که مدل‌ها قبلاً در mongoose ثبت شده‌اند، می‌توانیم از آنها استفاده کنیم
export const User = mongoose.models.User || {};
export const Transaction = mongoose.models.Transaction || {};
export const Stock = mongoose.models.Stock || {};
export const MarketListing = mongoose.models.MarketListing || {};
export const Loan = mongoose.models.Loan || {};
export const GlobalSettings = { getGlobalSettings: () => ({}) };