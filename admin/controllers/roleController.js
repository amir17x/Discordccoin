/**
 * کنترلر مدیریت نقش‌های کاربری پنل ادمین
 * 
 * این ماژول مدیریت نقش‌های کاربری در پنل مدیریت را فراهم می‌کند.
 */

import { AdminRole } from '../models/adminRole.js';
import { AdminUser } from '../models/adminUser.js';

/**
 * نمایش لیست نقش‌های موجود
 */
export async function listRoles(req, res, next) {
  try {
    const roles = await AdminRole.find().sort({ name: 1 });
    
    // اضافه کردن تعداد کاربران هر نقش
    const rolesWithUserCount = await Promise.all(roles.map(async (role) => {
      const userCount = await AdminUser.countDocuments({ role: role._id });
      const roleObj = role.toObject();
      roleObj.userCount = userCount;
      return roleObj;
    }));
    
    res.render('roles/index', { 
      title: 'مدیریت نقش‌ها',
      roles: rolesWithUserCount,
      activeMenu: 'settings',
      activeSubmenu: 'roles' 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * نمایش فرم ایجاد نقش جدید
 */
export function showCreateRoleForm(req, res) {
  // لیست همه دسترسی‌های ممکن
  const allPermissions = [
    { id: 'dashboard:view', name: 'مشاهده داشبورد', category: 'داشبورد' },
    
    { id: 'users:view', name: 'مشاهده کاربران', category: 'کاربران' },
    { id: 'users:create', name: 'ایجاد کاربر', category: 'کاربران' },
    { id: 'users:edit', name: 'ویرایش کاربران', category: 'کاربران' },
    { id: 'users:delete', name: 'حذف کاربران', category: 'کاربران' },
    
    { id: 'economy:view', name: 'مشاهده اقتصاد', category: 'اقتصاد' },
    { id: 'economy:edit', name: 'مدیریت اقتصاد', category: 'اقتصاد' },
    
    { id: 'servers:view', name: 'مشاهده سرورها', category: 'سرورها' },
    { id: 'servers:edit', name: 'مدیریت سرورها', category: 'سرورها' },
    
    { id: 'settings:view', name: 'مشاهده تنظیمات', category: 'تنظیمات' },
    { id: 'settings:edit', name: 'ویرایش تنظیمات', category: 'تنظیمات' },
    
    { id: 'logs:view', name: 'مشاهده لاگ‌ها', category: 'لاگ‌ها' },
    { id: 'logs:delete', name: 'حذف لاگ‌ها', category: 'لاگ‌ها' },
    
    { id: 'admins:view', name: 'مشاهده مدیران', category: 'مدیران' },
    { id: 'admins:create', name: 'ایجاد مدیر', category: 'مدیران' },
    { id: 'admins:edit', name: 'ویرایش مدیران', category: 'مدیران' },
    { id: 'admins:delete', name: 'حذف مدیران', category: 'مدیران' },
    
    { id: 'shop:view', name: 'مشاهده فروشگاه', category: 'فروشگاه' },
    { id: 'shop:edit', name: 'مدیریت فروشگاه', category: 'فروشگاه' },
    
    { id: 'games:view', name: 'مشاهده بازی‌ها', category: 'بازی‌ها' },
    { id: 'games:edit', name: 'مدیریت بازی‌ها', category: 'بازی‌ها' },
    
    { id: 'events:view', name: 'مشاهده رویدادها', category: 'رویدادها' },
    { id: 'events:edit', name: 'مدیریت رویدادها', category: 'رویدادها' },
    
    { id: 'giftcodes:view', name: 'مشاهده کدهای هدیه', category: 'کدهای هدیه' },
    { id: 'giftcodes:create', name: 'ایجاد کد هدیه', category: 'کدهای هدیه' },
    { id: 'giftcodes:delete', name: 'حذف کدهای هدیه', category: 'کدهای هدیه' }
  ];
  
  // گروه‌بندی دسترسی‌ها بر اساس دسته
  const permissionCategories = {};
  
  allPermissions.forEach(permission => {
    if (!permissionCategories[permission.category]) {
      permissionCategories[permission.category] = [];
    }
    
    permissionCategories[permission.category].push(permission);
  });
  
  res.render('roles/create', { 
    title: 'ایجاد نقش جدید',
    permissionCategories,
    activeMenu: 'settings',
    activeSubmenu: 'roles',
    role: {}
  });
}

/**
 * ایجاد نقش جدید
 */
export async function createRole(req, res, next) {
  try {
    const { name, description, permissions = [] } = req.body;
    
    // اعتبارسنجی داده‌های ورودی
    if (!name || name.trim() === '') {
      req.flash('error', 'نام نقش نمی‌تواند خالی باشد');
      return res.redirect('/admin/roles/create');
    }
    
    // بررسی وجود نقش با نام مشابه
    const existingRole = await AdminRole.findOne({ name: name.trim() });
    
    if (existingRole) {
      req.flash('error', 'نقشی با این نام قبلاً ثبت شده است');
      return res.redirect('/admin/roles/create');
    }
    
    // ایجاد نقش جدید
    const newRole = new AdminRole({
      name: name.trim(),
      description: description ? description.trim() : '',
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      createdBy: req.user._id
    });
    
    await newRole.save();
    
    req.flash('success', `نقش "${name}" با موفقیت ایجاد شد`);
    res.redirect('/admin/roles');
    
  } catch (error) {
    next(error);
  }
}

/**
 * نمایش فرم ویرایش نقش
 */
export async function showEditRoleForm(req, res, next) {
  try {
    const roleId = req.params.id;
    const role = await AdminRole.findById(roleId);
    
    if (!role) {
      req.flash('error', 'نقش مورد نظر یافت نشد');
      return res.redirect('/admin/roles');
    }
    
    // لیست همه دسترسی‌های ممکن
    const allPermissions = [
      { id: 'dashboard:view', name: 'مشاهده داشبورد', category: 'داشبورد' },
      
      { id: 'users:view', name: 'مشاهده کاربران', category: 'کاربران' },
      { id: 'users:create', name: 'ایجاد کاربر', category: 'کاربران' },
      { id: 'users:edit', name: 'ویرایش کاربران', category: 'کاربران' },
      { id: 'users:delete', name: 'حذف کاربران', category: 'کاربران' },
      
      { id: 'economy:view', name: 'مشاهده اقتصاد', category: 'اقتصاد' },
      { id: 'economy:edit', name: 'مدیریت اقتصاد', category: 'اقتصاد' },
      
      { id: 'servers:view', name: 'مشاهده سرورها', category: 'سرورها' },
      { id: 'servers:edit', name: 'مدیریت سرورها', category: 'سرورها' },
      
      { id: 'settings:view', name: 'مشاهده تنظیمات', category: 'تنظیمات' },
      { id: 'settings:edit', name: 'ویرایش تنظیمات', category: 'تنظیمات' },
      
      { id: 'logs:view', name: 'مشاهده لاگ‌ها', category: 'لاگ‌ها' },
      { id: 'logs:delete', name: 'حذف لاگ‌ها', category: 'لاگ‌ها' },
      
      { id: 'admins:view', name: 'مشاهده مدیران', category: 'مدیران' },
      { id: 'admins:create', name: 'ایجاد مدیر', category: 'مدیران' },
      { id: 'admins:edit', name: 'ویرایش مدیران', category: 'مدیران' },
      { id: 'admins:delete', name: 'حذف مدیران', category: 'مدیران' },
      
      { id: 'shop:view', name: 'مشاهده فروشگاه', category: 'فروشگاه' },
      { id: 'shop:edit', name: 'مدیریت فروشگاه', category: 'فروشگاه' },
      
      { id: 'games:view', name: 'مشاهده بازی‌ها', category: 'بازی‌ها' },
      { id: 'games:edit', name: 'مدیریت بازی‌ها', category: 'بازی‌ها' },
      
      { id: 'events:view', name: 'مشاهده رویدادها', category: 'رویدادها' },
      { id: 'events:edit', name: 'مدیریت رویدادها', category: 'رویدادها' },
      
      { id: 'giftcodes:view', name: 'مشاهده کدهای هدیه', category: 'کدهای هدیه' },
      { id: 'giftcodes:create', name: 'ایجاد کد هدیه', category: 'کدهای هدیه' },
      { id: 'giftcodes:delete', name: 'حذف کدهای هدیه', category: 'کدهای هدیه' }
    ];
    
    // گروه‌بندی دسترسی‌ها بر اساس دسته
    const permissionCategories = {};
    
    allPermissions.forEach(permission => {
      if (!permissionCategories[permission.category]) {
        permissionCategories[permission.category] = [];
      }
      
      // افزودن وضعیت انتخاب به هر دسترسی
      const permWithSelection = { 
        ...permission, 
        selected: role.permissions.includes(permission.id) 
      };
      
      permissionCategories[permission.category].push(permWithSelection);
    });
    
    // بررسی تعداد کاربران با این نقش
    const userCount = await AdminUser.countDocuments({ role: roleId });
    
    res.render('roles/edit', { 
      title: `ویرایش نقش: ${role.name}`,
      role,
      userCount,
      permissionCategories,
      activeMenu: 'settings',
      activeSubmenu: 'roles'
    });
    
  } catch (error) {
    next(error);
  }
}

/**
 * ذخیره تغییرات نقش
 */
export async function updateRole(req, res, next) {
  try {
    const roleId = req.params.id;
    const { name, description, permissions = [] } = req.body;
    
    // اعتبارسنجی داده‌های ورودی
    if (!name || name.trim() === '') {
      req.flash('error', 'نام نقش نمی‌تواند خالی باشد');
      return res.redirect(`/admin/roles/edit/${roleId}`);
    }
    
    // بررسی وجود نقش با نام مشابه
    const existingRole = await AdminRole.findOne({ name: name.trim(), _id: { $ne: roleId } });
    
    if (existingRole) {
      req.flash('error', 'نقشی با این نام قبلاً ثبت شده است');
      return res.redirect(`/admin/roles/edit/${roleId}`);
    }
    
    // پیدا کردن و به‌روزرسانی نقش
    const role = await AdminRole.findById(roleId);
    
    if (!role) {
      req.flash('error', 'نقش مورد نظر یافت نشد');
      return res.redirect('/admin/roles');
    }
    
    // در صورتی که نقش پیش‌فرض است، برخی محدودیت‌ها اعمال می‌شود
    if (role.isDefault) {
      // امکان تغییر دسترسی‌های نقش‌های پیش‌فرض وجود دارد،
      // اما نام آن‌ها قابل تغییر نیست
      role.permissions = Array.isArray(permissions) ? permissions : [permissions];
      
      if (description) {
        role.description = description.trim();
      }
    } else {
      // به‌روزرسانی داده‌های نقش
      role.name = name.trim();
      role.description = description ? description.trim() : '';
      role.permissions = Array.isArray(permissions) ? permissions : [permissions];
    }
    
    await role.save();
    
    // به‌روزرسانی دسترسی‌های کاربران این نقش
    await AdminUser.updateMany(
      { role: roleId }, 
      { $set: { permissions: role.permissions } }
    );
    
    req.flash('success', `نقش "${role.name}" با موفقیت به‌روزرسانی شد`);
    res.redirect('/admin/roles');
    
  } catch (error) {
    next(error);
  }
}

/**
 * حذف نقش
 */
export async function deleteRole(req, res, next) {
  try {
    const roleId = req.params.id;
    
    // پیدا کردن نقش
    const role = await AdminRole.findById(roleId);
    
    if (!role) {
      req.flash('error', 'نقش مورد نظر یافت نشد');
      return res.redirect('/admin/roles');
    }
    
    // نقش‌های پیش‌فرض قابل حذف نیستند
    if (role.isDefault) {
      req.flash('error', 'نقش‌های پیش‌فرض قابل حذف نیستند');
      return res.redirect('/admin/roles');
    }
    
    // بررسی وجود کاربر با این نقش
    const userCount = await AdminUser.countDocuments({ role: roleId });
    
    if (userCount > 0) {
      req.flash('error', `این نقش به ${userCount} کاربر اختصاص داده شده و قابل حذف نیست`);
      return res.redirect('/admin/roles');
    }
    
    // حذف نقش
    await AdminRole.findByIdAndDelete(roleId);
    
    req.flash('success', `نقش "${role.name}" با موفقیت حذف شد`);
    res.redirect('/admin/roles');
    
  } catch (error) {
    next(error);
  }
}

/**
 * نمایش جزئیات نقش
 */
export async function viewRoleDetails(req, res, next) {
  try {
    const roleId = req.params.id;
    
    // پیدا کردن نقش
    const role = await AdminRole.findById(roleId);
    
    if (!role) {
      req.flash('error', 'نقش مورد نظر یافت نشد');
      return res.redirect('/admin/roles');
    }
    
    // گروه‌بندی دسترسی‌ها
    const permissionGroups = {
      'داشبورد': role.permissions.filter(p => p.startsWith('dashboard:')),
      'کاربران': role.permissions.filter(p => p.startsWith('users:')),
      'اقتصاد': role.permissions.filter(p => p.startsWith('economy:')),
      'سرورها': role.permissions.filter(p => p.startsWith('servers:')),
      'تنظیمات': role.permissions.filter(p => p.startsWith('settings:')),
      'لاگ‌ها': role.permissions.filter(p => p.startsWith('logs:')),
      'مدیران': role.permissions.filter(p => p.startsWith('admins:')),
      'فروشگاه': role.permissions.filter(p => p.startsWith('shop:')),
      'بازی‌ها': role.permissions.filter(p => p.startsWith('games:')),
      'رویدادها': role.permissions.filter(p => p.startsWith('events:')),
      'کدهای هدیه': role.permissions.filter(p => p.startsWith('giftcodes:'))
    };
    
    // لیست کاربران دارای این نقش
    const users = await AdminUser.find({ role: roleId })
      .select('username name email lastLogin active')
      .sort({ name: 1 });
    
    res.render('roles/view', {
      title: `جزئیات نقش: ${role.name}`,
      role,
      permissionGroups,
      users,
      activeMenu: 'settings',
      activeSubmenu: 'roles'
    });
    
  } catch (error) {
    next(error);
  }
}