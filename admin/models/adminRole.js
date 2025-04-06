/**
 * مدل نقش‌های مدیریتی پنل ادمین
 * 
 * این مدل برای مدیریت نقش‌های دسترسی کاربران ادمین استفاده می‌شود.
 */

import mongoose from 'mongoose';

const adminRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    enum: [
      'dashboard:view',
      'users:view', 'users:create', 'users:edit', 'users:delete',
      'economy:view', 'economy:edit',
      'servers:view', 'servers:edit',
      'settings:view', 'settings:edit',
      'logs:view', 'logs:delete',
      'admins:view', 'admins:create', 'admins:edit', 'admins:delete',
      'shop:view', 'shop:edit',
      'games:view', 'games:edit',
      'events:view', 'events:edit',
      'giftcodes:view', 'giftcodes:create', 'giftcodes:delete'
    ]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  collection: 'admin_roles'
});

// ایجاد و صادر کردن مدل - از تعریف مجدد جلوگیری می‌کنیم
export const AdminRole = mongoose.models.AdminRole || mongoose.model('AdminRole', adminRoleSchema);
