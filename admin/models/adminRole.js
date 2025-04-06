/**
 * مدل نقش‌های مدیریتی
 * 
 * این مدل برای تعریف نقش‌ها و سطوح دسترسی مدیران سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const adminRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
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
  isSystem: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, { 
  timestamps: true,
  collection: 'admin_roles'
});

// متد بررسی وجود دسترسی
adminRoleSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// متد برای افزودن دسترسی
adminRoleSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

// متد برای حذف دسترسی
adminRoleSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

// متد برای ایجاد نقش‌های پیش‌فرض
adminRoleSchema.statics.createDefaultRoles = async function() {
  try {
    // بررسی وجود نقش مدیر ارشد
    const superAdminExists = await this.findOne({ slug: 'super-admin' });
    
    if (!superAdminExists) {
      await this.create({
        name: 'مدیر ارشد',
        slug: 'super-admin',
        description: 'دسترسی کامل به تمام قسمت‌های پنل مدیریت',
        permissions: [
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
        ],
        isSystem: true
      });
    }
    
    // بررسی وجود نقش مدیر
    const adminExists = await this.findOne({ slug: 'admin' });
    
    if (!adminExists) {
      await this.create({
        name: 'مدیر',
        slug: 'admin',
        description: 'دسترسی به بیشتر قسمت‌های پنل مدیریت',
        permissions: [
          'dashboard:view',
          'users:view', 'users:edit',
          'economy:view', 'economy:edit',
          'servers:view', 'servers:edit',
          'logs:view',
          'shop:view', 'shop:edit',
          'games:view', 'games:edit',
          'events:view', 'events:edit',
          'giftcodes:view', 'giftcodes:create'
        ],
        isSystem: true
      });
    }
    
    // بررسی وجود نقش ناظر
    const moderatorExists = await this.findOne({ slug: 'moderator' });
    
    if (!moderatorExists) {
      await this.create({
        name: 'ناظر',
        slug: 'moderator',
        description: 'دسترسی محدود و فقط خواندنی به برخی قسمت‌های پنل مدیریت',
        permissions: [
          'dashboard:view',
          'users:view',
          'economy:view',
          'servers:view',
          'logs:view',
          'shop:view',
          'games:view',
          'events:view',
          'giftcodes:view'
        ],
        isSystem: true
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating default roles:', error);
    throw error;
  }
};

// ایجاد و صادر کردن مدل
export const AdminRole = mongoose.model('AdminRole', adminRoleSchema);