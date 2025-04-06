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
    
    res.render('users/view', {
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
    res.redirect(`/admin/users/view/${userId}`);
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
    // اگر از صفحه جزئیات کاربر آمده باشد، از پارامتر id استفاده می‌کنیم
    // در غیر این صورت از فیلد userId در بدنه درخواست استفاده می‌کنیم (فرم مودال)
    const userId = req.params.id || req.body.userId;
    const { amount, description, reason } = req.body;
    
    if (!userId) {
      req.flash('error_msg', 'شناسه کاربر الزامی است');
      return res.redirect('/admin/users');
    }
    
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      req.flash('error_msg', 'مقدار سکه باید عددی بزرگتر از صفر باشد');
      
      // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
      if (req.params.id) {
        return res.redirect(`/admin/users/view/${req.params.id}`);
      }
      
      return res.redirect('/admin/users');
    }
    
    // ترکیب دلیل و توضیحات
    const finalDescription = reason ? 
      (description ? `${reason}: ${description}` : reason) : 
      (description || 'افزودن سکه توسط ادمین');
    
    const result = await addUserCoins(userId, parseInt(amount), finalDescription);
    
    req.flash('success_msg', `${amount} سکه با موفقیت به کاربر اضافه شد`);
    
    // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
    if (req.params.id) {
      return res.redirect(`/admin/users/view/${req.params.id}`);
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('خطا در افزودن سکه به کاربر:', error);
    req.flash('error_msg', `خطا در افزودن سکه: ${error.message}`);
    
    // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
    if (req.params.id) {
      return res.redirect(`/admin/users/view/${req.params.id}`);
    }
    
    res.redirect('/admin/users');
  }
}

/**
 * کم کردن سکه از کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function removeCoins(req, res) {
  try {
    // اگر از صفحه جزئیات کاربر آمده باشد، از پارامتر id استفاده می‌کنیم
    // در غیر این صورت از فیلد userId در بدنه درخواست استفاده می‌کنیم (فرم مودال)
    const userId = req.params.id || req.body.userId;
    const { amount, description, reason } = req.body;
    
    if (!userId) {
      req.flash('error_msg', 'شناسه کاربر الزامی است');
      return res.redirect('/admin/users');
    }
    
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      req.flash('error_msg', 'مقدار سکه باید عددی بزرگتر از صفر باشد');
      
      // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
      if (req.params.id) {
        return res.redirect(`/admin/users/view/${req.params.id}`);
      }
      
      return res.redirect('/admin/users');
    }
    
    // ترکیب دلیل و توضیحات
    const finalDescription = reason ? 
      (description ? `${reason}: ${description}` : reason) : 
      (description || 'کم کردن سکه توسط ادمین');
    
    const result = await removeUserCoins(userId, parseInt(amount), finalDescription);
    
    req.flash('success_msg', `${amount} سکه با موفقیت از کاربر کم شد`);
    
    // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
    if (req.params.id) {
      return res.redirect(`/admin/users/view/${req.params.id}`);
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('خطا در کم کردن سکه از کاربر:', error);
    req.flash('error_msg', `خطا در کم کردن سکه: ${error.message}`);
    
    // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
    if (req.params.id) {
      return res.redirect(`/admin/users/view/${req.params.id}`);
    }
    
    res.redirect('/admin/users');
  }
}

/**
 * افزودن آیتم به کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function addItem(req, res) {
  try {
    // اگر از صفحه جزئیات کاربر آمده باشد، از پارامتر id استفاده می‌کنیم
    // در غیر این صورت از فیلد userId در بدنه درخواست استفاده می‌کنیم (فرم مودال)
    const userId = req.params.id || req.body.userId;
    const { itemId, quantity, reason, description } = req.body;
    
    if (!userId) {
      req.flash('error_msg', 'شناسه کاربر الزامی است');
      return res.redirect('/admin/users');
    }
    
    if (!itemId) {
      req.flash('error_msg', 'انتخاب آیتم الزامی است');
      
      // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
      if (req.params.id) {
        return res.redirect(`/admin/users/view/${req.params.id}`);
      }
      
      return res.redirect('/admin/users');
    }
    
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      req.flash('error_msg', 'تعداد آیتم باید عددی بزرگتر از صفر باشد');
      
      // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
      if (req.params.id) {
        return res.redirect(`/admin/users/view/${req.params.id}`);
      }
      
      return res.redirect('/admin/users');
    }
    
    const result = await addUserItem(userId, itemId, parseInt(quantity));
    
    req.flash('success_msg', result.message);
    
    // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
    if (req.params.id) {
      return res.redirect(`/admin/users/view/${req.params.id}`);
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('خطا در افزودن آیتم به کاربر:', error);
    req.flash('error_msg', `خطا در افزودن آیتم: ${error.message}`);
    
    // اگر از صفحه جزئیات آمده، به همان صفحه برگردیم
    if (req.params.id) {
      return res.redirect(`/admin/users/view/${req.params.id}`);
    }
    
    res.redirect('/admin/users');
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
    res.redirect(`/admin/users/view/${userId}`);
  } catch (error) {
    console.error('خطا در مسدود کردن کاربر:', error);
    req.flash('error_msg', `خطا در مسدود کردن کاربر: ${error.message}`);
    res.redirect(`/admin/users/view/${req.params.id}`);
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
    res.redirect(`/admin/users/view/${userId}`);
  } catch (error) {
    console.error('خطا در رفع مسدودیت کاربر:', error);
    req.flash('error_msg', `خطا در رفع مسدودیت کاربر: ${error.message}`);
    res.redirect(`/admin/users/view/${req.params.id}`);
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
      return res.redirect(`/admin/users/view/${userId}`);
    }
    
    const result = await resetUserData(userId, options);
    
    req.flash('success_msg', result.message);
    res.redirect(`/admin/users/view/${userId}`);
  } catch (error) {
    console.error('خطا در ریست کردن اطلاعات کاربر:', error);
    req.flash('error_msg', `خطا در ریست کردن اطلاعات کاربر: ${error.message}`);
    res.redirect(`/admin/users/view/${req.params.id}`);
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

// تعریف کنترلر برای ارائه به صورت یک آبجکت
export const usersController = {
  showDashboard: (req, res) => {
    res.render('users/dashboard', { title: 'مدیریت کاربران' });
  },
  showUsersList,
  filterUsers: (req, res) => {
    // بازیابی پارامترهای فیلتر از بدنه درخواست
    const { search, isActive, isBanned, minCoins, maxCoins, minLevel, maxLevel } = req.body;
    
    // ساخت URL با پارامترهای فیلتر
    let url = '/admin/users/list?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (isActive) url += `isActive=${isActive}&`;
    if (isBanned) url += `isBanned=${isBanned}&`;
    if (minCoins) url += `minCoins=${minCoins}&`;
    if (maxCoins) url += `maxCoins=${maxCoins}&`;
    if (minLevel) url += `minLevel=${minLevel}&`;
    if (maxLevel) url += `maxLevel=${maxLevel}&`;
    
    res.redirect(url);
  },
  showUserDetails,
  showUserEdit,
  updateUser: processUserEdit,
  addCoins,
  removeCoins,
  addItem,
  banUser,
  unbanUser,
  resetUser,
  exportUsers,
  
  // توابع اضافی که در routes/users.js استفاده شده است
  showUserEconomy: (req, res) => {
    res.render('users/economy', { title: 'اقتصاد کاربر', userId: req.params.id });
  },
  updateUserEconomy: (req, res) => {
    // پیاده‌سازی به‌روزرسانی اقتصاد کاربر
    res.redirect(`/admin/users/${req.params.id}/economy`);
  },
  addUserTransaction: (req, res) => {
    // پیاده‌سازی افزودن تراکنش
    res.redirect(`/admin/users/${req.params.id}/economy/transactions`);
  },
  showUserTransactions: (req, res) => {
    res.render('users/transactions', { title: 'تراکنش‌های کاربر', userId: req.params.id });
  },
  showUserStats: (req, res) => {
    res.render('users/stats', { title: 'آمار کاربر', userId: req.params.id });
  },
  resetUserStats: (req, res) => {
    // پیاده‌سازی ریست آمار کاربر
    res.redirect(`/admin/users/${req.params.id}/stats`);
  },
  showUserFriends: (req, res) => {
    res.render('users/friends', { title: 'دوستان کاربر', userId: req.params.id });
  },
  addUserFriend: (req, res) => {
    // پیاده‌سازی افزودن دوست
    res.redirect(`/admin/users/${req.params.id}/friends`);
  },
  removeUserFriend: (req, res) => {
    // پیاده‌سازی حذف دوست
    res.redirect(`/admin/users/${req.params.id}/friends`);
  },
  showUserInventory: (req, res) => {
    res.render('users/inventory', { title: 'کوله‌پشتی کاربر', userId: req.params.id });
  },
  addItemToInventory: (req, res) => {
    // پیاده‌سازی افزودن آیتم به کوله‌پشتی
    res.redirect(`/admin/users/${req.params.id}/inventory`);
  },
  removeItemFromInventory: (req, res) => {
    // پیاده‌سازی حذف آیتم از کوله‌پشتی
    res.redirect(`/admin/users/${req.params.id}/inventory`);
  },
  showUserRewards: (req, res) => {
    res.render('users/rewards', { title: 'جوایز کاربر', userId: req.params.id });
  },
  addUserReward: (req, res) => {
    // پیاده‌سازی افزودن جایزه
    res.redirect(`/admin/users/${req.params.id}/rewards`);
  },
  removeUserReward: (req, res) => {
    // پیاده‌سازی حذف جایزه
    res.redirect(`/admin/users/${req.params.id}/rewards`);
  },
  showUserRoles: (req, res) => {
    res.render('users/roles', { title: 'نقش‌های کاربر', userId: req.params.id });
  },
  addUserRole: (req, res) => {
    // پیاده‌سازی افزودن نقش
    res.redirect(`/admin/users/${req.params.id}/roles`);
  },
  removeUserRole: (req, res) => {
    // پیاده‌سازی حذف نقش
    res.redirect(`/admin/users/${req.params.id}/roles`);
  },
  showUserBanks: (req, res) => {
    res.render('users/banks', { title: 'حساب‌های بانکی کاربر', userId: req.params.id });
  },
  updateUserBank: (req, res) => {
    // پیاده‌سازی به‌روزرسانی حساب بانکی
    res.redirect(`/admin/users/${req.params.id}/bank`);
  },
  showUserStocks: (req, res) => {
    res.render('users/stocks', { title: 'سهام کاربر', userId: req.params.id });
  },
  updateUserStocks: (req, res) => {
    // پیاده‌سازی به‌روزرسانی سهام
    res.redirect(`/admin/users/${req.params.id}/stocks`);
  },
  showUserLogs: (req, res) => {
    res.render('users/logs', { title: 'لاگ‌های کاربر', userId: req.params.id });
  },
  filterUserLogs: (req, res) => {
    // پیاده‌سازی فیلتر لاگ‌ها
    res.redirect(`/admin/users/${req.params.id}/logs`);
  },
  exportUserLogs: (req, res) => {
    // پیاده‌سازی خروجی لاگ‌ها
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=user-logs.csv');
    res.send('لاگ‌های کاربر');
  },
  showSettings: (req, res) => {
    res.render('users/settings', { title: 'تنظیمات کاربران' });
  },
  updateSettings: (req, res) => {
    // پیاده‌سازی به‌روزرسانی تنظیمات
    res.redirect('/admin/users/settings');
  }
};