/**
 * مدل کاربران پنل مدیریت
 * 
 * این مدل برای مدیریت کاربران پنل ادمین استفاده می‌شود.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'لطفا یک آدرس ایمیل معتبر وارد کنید']
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminRole',
    required: true
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
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockReason: {
    type: String
  },
  lastLogin: {
    type: Date
  },
  lastIp: {
    type: String
  },
  avatar: {
    type: String
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, { 
  timestamps: true,
  collection: 'admin_users'
});

// هش کردن پسورد قبل از ذخیره
adminUserSchema.pre('save', async function(next) {
  // فقط اگر پسورد تغییر کرده باشد هش می‌کنیم
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// متد بررسی پسورد
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// متد بررسی وجود دسترسی
adminUserSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// متد برای افزودن دسترسی
adminUserSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

// متد برای حذف دسترسی
adminUserSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

// متد ثبت ورود موفق
adminUserSchema.methods.logSuccessfulLogin = function(ip) {
  this.lastLogin = new Date();
  this.lastIp = ip;
  this.failedLoginAttempts = 0;
  return this.save();
};

// متد ثبت ورود ناموفق
adminUserSchema.methods.logFailedLogin = function() {
  this.failedLoginAttempts += 1;
  
  // قفل کردن اکانت بعد از 5 بار تلاش ناموفق
  if (this.failedLoginAttempts >= 5) {
    this.isLocked = true;
    this.lockReason = 'تلاش‌های ناموفق متعدد برای ورود';
  }
  
  return this.save();
};

// تعریف خروجی JSON برای امنیت
adminUserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

// ایجاد و صادر کردن مدل
export const AdminUser = mongoose.model('AdminUser', adminUserSchema);