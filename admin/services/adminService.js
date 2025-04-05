/**
 * سرویس مدیریت ادمین‌ها
 * 
 * این سرویس مسئول مدیریت کاربران ادمین و عملیات مرتبط با آن‌ها است.
 */

import bcrypt from 'bcryptjs';

// فعلاً از یک لیست ثابت استفاده می‌کنیم، در محیط واقعی از پایگاه داده استفاده می‌شود
const admins = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$10$x7Tj9YcAkKhKBDJbkRCOZ.LNL5pCx6StRyA.8Z3GfY1hXOQvFZ6Ja', // 'admin123'
    name: 'مدیر اصلی',
    email: 'admin@ccoin.com',
    role: 'admin',
    permissions: ['users', 'economy', 'games', 'ai', 'events', 'servers', 'logs', 'settings'],
    lastLogin: new Date().toISOString(),
    active: true
  },
  {
    id: '2',
    username: 'moderator',
    password: '$2a$10$bSsVuG7.hDUFGBCnSrT0FuKzWYIHCnR3Y6T3nrWBKixM/x3WZ1J1m', // 'mod123'
    name: 'مدیر محتوا',
    email: 'mod@ccoin.com',
    role: 'moderator',
    permissions: ['users', 'games', 'events'],
    lastLogin: new Date().toISOString(),
    active: true
  }
];

/**
 * دریافت لیست تمام ادمین‌ها
 * 
 * @returns {Promise<Array>} لیست ادمین‌ها
 */
export async function getAllAdmins() {
  return admins.map(admin => {
    const { password, ...adminData } = admin;
    return adminData;
  });
}

/**
 * دریافت ادمین با شناسه مشخص
 * 
 * @param {string} adminId شناسه ادمین
 * @returns {Promise<Object|null>} اطلاعات ادمین یا null در صورت عدم وجود
 */
export async function getAdminById(adminId) {
  const admin = admins.find(a => a.id === adminId);
  
  if (!admin) {
    return null;
  }
  
  const { password, ...adminData } = admin;
  return adminData;
}

/**
 * دریافت ادمین با نام کاربری مشخص
 * 
 * @param {string} username نام کاربری
 * @returns {Promise<Object|null>} اطلاعات ادمین یا null در صورت عدم وجود
 */
export async function getAdminByUsername(username) {
  return admins.find(a => a.username === username && a.active) || null;
}

/**
 * ایجاد ادمین جدید
 * 
 * @param {Object} adminData اطلاعات ادمین جدید
 * @returns {Promise<Object>} اطلاعات ادمین ایجاد شده
 */
export async function createAdmin(adminData) {
  // بررسی وجود نام کاربری
  const existingAdmin = await getAdminByUsername(adminData.username);
  
  if (existingAdmin) {
    throw new Error('این نام کاربری قبلاً ثبت شده است.');
  }
  
  // رمزنگاری رمز عبور
  const hashedPassword = await bcrypt.hash(adminData.password, 10);
  
  // ایجاد ادمین جدید
  const newAdmin = {
    id: (admins.length + 1).toString(),
    username: adminData.username,
    password: hashedPassword,
    name: adminData.name || adminData.username,
    email: adminData.email || '',
    role: adminData.role || 'moderator',
    permissions: adminData.permissions || [],
    lastLogin: new Date().toISOString(),
    active: true
  };
  
  // افزودن به لیست
  admins.push(newAdmin);
  
  // حذف رمز عبور از خروجی
  const { password, ...adminWithoutPassword } = newAdmin;
  return adminWithoutPassword;
}

/**
 * بروزرسانی اطلاعات ادمین
 * 
 * @param {string} adminId شناسه ادمین
 * @param {Object} updateData اطلاعات جدید
 * @returns {Promise<Object|null>} اطلاعات بروزرسانی شده یا null در صورت عدم وجود
 */
export async function updateAdmin(adminId, updateData) {
  const adminIndex = admins.findIndex(a => a.id === adminId);
  
  if (adminIndex === -1) {
    return null;
  }
  
  // بروزرسانی اطلاعات
  admins[adminIndex] = {
    ...admins[adminIndex],
    ...updateData,
    // اطمینان از عدم تغییر شناسه و رمز عبور
    id: admins[adminIndex].id,
    password: admins[adminIndex].password
  };
  
  // حذف رمز عبور از خروجی
  const { password, ...adminWithoutPassword } = admins[adminIndex];
  return adminWithoutPassword;
}

/**
 * بروزرسانی رمز عبور ادمین
 * 
 * @param {string} adminId شناسه ادمین
 * @param {string} newPassword رمز عبور جدید (هش شده)
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function updateAdminPassword(adminId, newPassword) {
  const adminIndex = admins.findIndex(a => a.id === adminId);
  
  if (adminIndex === -1) {
    return false;
  }
  
  // بروزرسانی رمز عبور
  admins[adminIndex].password = newPassword;
  
  return true;
}

/**
 * غیرفعال کردن ادمین
 * 
 * @param {string} adminId شناسه ادمین
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function deactivateAdmin(adminId) {
  const adminIndex = admins.findIndex(a => a.id === adminId);
  
  if (adminIndex === -1) {
    return false;
  }
  
  // غیرفعال کردن
  admins[adminIndex].active = false;
  
  return true;
}

/**
 * فعال کردن ادمین
 * 
 * @param {string} adminId شناسه ادمین
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function activateAdmin(adminId) {
  const adminIndex = admins.findIndex(a => a.id === adminId);
  
  if (adminIndex === -1) {
    return false;
  }
  
  // فعال کردن
  admins[adminIndex].active = true;
  
  return true;
}

/**
 * بروزرسانی زمان آخرین ورود
 * 
 * @param {string} adminId شناسه ادمین
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function updateLastLogin(adminId) {
  const adminIndex = admins.findIndex(a => a.id === adminId);
  
  if (adminIndex === -1) {
    return false;
  }
  
  // بروزرسانی زمان آخرین ورود
  admins[adminIndex].lastLogin = new Date().toISOString();
  
  return true;
}