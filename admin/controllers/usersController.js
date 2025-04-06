/**
 * کنترلر مدیریت کاربران پنل ادمین
 */

import {
  getAllUsers,
  getUserById,
  updateUser,
  banUser as banUserService,
  unbanUser as unbanUserService,
  addUserCoins,
  removeUserCoins,
  addUserItem,
  resetUserData,
  exportUsersToCsv
} from '../services/userService.js';

/**
 * نمایش لیست کاربران
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showUsersList(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    
    // فیلترها
    const filter = {};
    if (req.query.isActive === 'true') filter.isActive = true;
    if (req.query.isActive === 'false') filter.isActive = false;
    if (req.query.isBanned === 'true') filter.isBanned = true;
    if (req.query.isBanned === 'false') filter.isBanned = false;
    if (req.query.minCoins) filter.minCoins = parseInt(req.query.minCoins);
    if (req.query.maxCoins) filter.maxCoins = parseInt(req.query.maxCoins);
    if (req.query.minLevel) filter.minLevel = parseInt(req.query.minLevel);
    if (req.query.maxLevel) filter.maxLevel = parseInt(req.query.maxLevel);
    
    const result = await getAllUsers({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      filter
    });
    
    res.render('users/index', {
      title: 'مدیریت کاربران',
      users: result.users,
      pagination: result.pagination,
      search,
      sortBy,
      sortOrder,
      filter: req.query
    });
  } catch (error) {
    console.error('خطا در نمایش لیست کاربران:', error);
    req.flash('error_msg', 'خطا در بارگذاری لیست کاربران');
    res.redirect('/admin/dashboard');
  }
}

/**
 * نمایش جزئیات کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showUserDetails(req, res) {
  try {
    const userId = req.params.id;
    
    const user = await getUserById(userId);
    
    if (!user) {
      req.flash('error_msg', 'کاربر مورد نظر یافت نشد');
      return res.redirect('/admin/users');
    }
    
    res.render('users/details', {
      title: `جزئیات کاربر: ${user.username}`,
      user
    });
  } catch (error) {
    console.error('خطا در نمایش جزئیات کاربر:', error);
    req.flash('error_msg', 'خطا در بارگذاری اطلاعات کاربر');
    res.redirect('/admin/users');
  }
}

/**
 * نمایش فرم ویرایش کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showUserEdit(req, res) {
  try {
    const userId = req.params.id;
    
    const user = await getUserById(userId);
    
    if (!user) {
      req.flash('error_msg', 'کاربر مورد نظر یافت نشد');
      return res.redirect('/admin/users');
    }
    
    res.render('users/edit', {
      title: `ویرایش کاربر: ${user.username}`,
      user
    });
  } catch (error) {
    console.error('خطا در نمایش فرم ویرایش کاربر:', error);
    req.flash('error_msg', 'خطا در بارگذاری اطلاعات کاربر');
    res.redirect('/admin/users');
  }
}

/**
 * پردازش فرم ویرایش کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function processUserEdit(req, res) {
  try {
    const userId = req.params.id;
    const { displayName, isActive } = req.body;
    
    const updatedUser = await updateUser(userId, {
      displayName,
      isActive: isActive === 'true'
    });
    
    if (!updatedUser) {
      req.flash('error_msg', 'کاربر مورد نظر یافت نشد یا بروزرسانی با خطا مواجه شد');
      return res.redirect('/admin/users');
    }
    
    req.flash('success_msg', 'اطلاعات کاربر با موفقیت بروزرسانی شد');
    res.redirect(`/admin/users/details/${userId}`);
  } catch (error) {
    console.error('خطا در پردازش فرم ویرایش کاربر:', error);
    req.flash('error_msg', 'خطا در بروزرسانی اطلاعات کاربر');
    res.redirect('/admin/users');
  }
}

/**
 * افزودن سکه به کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function addCoins(req, res) {
  try {
    const userId = req.params.id;
    const { amount, description } = req.body;
    
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      req.flash('error_msg', 'مقدار سکه باید عددی بزرگتر از صفر باشد');
      return res.redirect(`/admin/users/details/${userId}`);
    }
    
    const result = await addUserCoins(userId, parseInt(amount), description);
    
    req.flash('success_msg', `${amount} سکه با موفقیت به کاربر اضافه شد`);
    res.redirect(`/admin/users/details/${userId}`);
  } catch (error) {
    console.error('خطا در افزودن سکه به کاربر:', error);
    req.flash('error_msg', `خطا در افزودن سکه: ${error.message}`);
    res.redirect(`/admin/users/details/${req.params.id}`);
  }
}

/**
 * کم کردن سکه از کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function removeCoins(req, res) {
  try {
    const userId = req.params.id;
    const { amount, description } = req.body;
    
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      req.flash('error_msg', 'مقدار سکه باید عددی بزرگتر از صفر باشد');
      return res.redirect(`/admin/users/details/${userId}`);
    }
    
    const result = await removeUserCoins(userId, parseInt(amount), description);
    
    req.flash('success_msg', `${amount} سکه با موفقیت از کاربر کم شد`);
    res.redirect(`/admin/users/details/${userId}`);
  } catch (error) {
    console.error('خطا در کم کردن سکه از کاربر:', error);
    req.flash('error_msg', `خطا در کم کردن سکه: ${error.message}`);
    res.redirect(`/admin/users/details/${req.params.id}`);
  }
}

/**
 * افزودن آیتم به کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function addItem(req, res) {
  try {
    const userId = req.params.id;
    const { itemId, quantity } = req.body;
    
    if (!itemId) {
      req.flash('error_msg', 'انتخاب آیتم الزامی است');
      return res.redirect(`/admin/users/details/${userId}`);
    }
    
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      req.flash('error_msg', 'تعداد آیتم باید عددی بزرگتر از صفر باشد');
      return res.redirect(`/admin/users/details/${userId}`);
    }
    
    const result = await addUserItem(userId, itemId, parseInt(quantity));
    
    req.flash('success_msg', result.message);
    res.redirect(`/admin/users/details/${userId}`);
  } catch (error) {
    console.error('خطا در افزودن آیتم به کاربر:', error);
    req.flash('error_msg', `خطا در افزودن آیتم: ${error.message}`);
    res.redirect(`/admin/users/details/${req.params.id}`);
  }
}

/**
 * مسدود کردن کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function banUser(req, res) {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    const result = await banUserService(userId, reason);
    
    req.flash('success_msg', 'کاربر با موفقیت مسدود شد');
    res.redirect(`/admin/users/details/${userId}`);
  } catch (error) {
    console.error('خطا در مسدود کردن کاربر:', error);
    req.flash('error_msg', `خطا در مسدود کردن کاربر: ${error.message}`);
    res.redirect(`/admin/users/details/${req.params.id}`);
  }
}

/**
 * رفع مسدودیت کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function unbanUser(req, res) {
  try {
    const userId = req.params.id;
    
    const result = await unbanUserService(userId);
    
    req.flash('success_msg', 'مسدودیت کاربر با موفقیت رفع شد');
    res.redirect(`/admin/users/details/${userId}`);
  } catch (error) {
    console.error('خطا در رفع مسدودیت کاربر:', error);
    req.flash('error_msg', `خطا در رفع مسدودیت کاربر: ${error.message}`);
    res.redirect(`/admin/users/details/${req.params.id}`);
  }
}

/**
 * ریست کردن اطلاعات کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function resetUser(req, res) {
  try {
    const userId = req.params.id;
    const {
      resetCoins,
      resetCrystals,
      resetItems,
      resetLevel,
      resetBank
    } = req.body;
    
    // تبدیل مقادیر به بولین
    const options = {
      resetCoins: resetCoins === 'on',
      resetCrystals: resetCrystals === 'on',
      resetItems: resetItems === 'on',
      resetLevel: resetLevel === 'on',
      resetBank: resetBank === 'on'
    };
    
    // بررسی انتخاب حداقل یک گزینه
    if (!Object.values(options).some(val => val)) {
      req.flash('error_msg', 'حداقل یک گزینه باید انتخاب شود');
      return res.redirect(`/admin/users/details/${userId}`);
    }
    
    const result = await resetUserData(userId, options);
    
    req.flash('success_msg', result.message);
    res.redirect(`/admin/users/details/${userId}`);
  } catch (error) {
    console.error('خطا در ریست کردن اطلاعات کاربر:', error);
    req.flash('error_msg', `خطا در ریست کردن اطلاعات کاربر: ${error.message}`);
    res.redirect(`/admin/users/details/${req.params.id}`);
  }
}

/**
 * خروجی لیست کاربران
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function exportUsers(req, res) {
  try {
    const { search, isActive, isBanned, sortBy, sortOrder } = req.query;
    
    // فیلترها
    const filter = {};
    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;
    if (isBanned === 'true') filter.isBanned = true;
    if (isBanned === 'false') filter.isBanned = false;
    
    // مرتب‌سازی
    const sort = {
      field: sortBy || 'createdAt',
      order: sortOrder || 'desc'
    };
    
    const csvContent = await exportUsersToCsv(search, filter, sort);
    
    // تنظیم هدرهای HTTP
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    
    // ارسال فایل CSV
    res.send(csvContent);
  } catch (error) {
    console.error('خطا در خروجی لیست کاربران:', error);
    req.flash('error_msg', `خطا در تهیه خروجی: ${error.message}`);
    res.redirect('/admin/users');
  }
}