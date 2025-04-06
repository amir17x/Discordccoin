/**
 * کنترلر مدیریت کاربران
 */

import * as userService from '../services/userService.js';
import * as economyService from '../services/economyService.js';

/**
 * نمایش لیست کاربران
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function listUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = req.query.q || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'createdAt_desc';
    
    console.log(`🔍 دریافت لیست کاربران: صفحه ${page}، تعداد ${limit}، جستجو: "${query}", وضعیت: "${status}", مرتب‌سازی: "${sort}"`);
    
    // تبدیل پارامتر مرتب‌سازی به فرمت مناسب برای سرویس
    const [sortField, sortDirection] = sort.split('_');
    const sortOptions = {
      field: sortField,
      direction: sortDirection === 'asc' ? 1 : -1
    };
    
    // وضعیت‌های فیلتر
    const filterOptions = {};
    if (status === 'active') {
      filterOptions.banned = false;
      filterOptions.inactive = false;
    } else if (status === 'banned') {
      filterOptions.banned = true;
    } else if (status === 'inactive') {
      filterOptions.inactive = true;
    }
    
    const result = await userService.getUsers({
      page,
      limit,
      query,
      filters: filterOptions,
      sort: sortOptions
    });
    
    res.render('users/index', {
      title: 'مدیریت کاربران',
      users: result.users || [],
      query,
      status,
      sort,
      pagination: {
        page,
        limit,
        totalPages: result.totalPages || 1,
        totalUsers: result.total || 0
      }
    });
  } catch (error) {
    console.error('❌ خطا در نمایش لیست کاربران:', error);
    req.flash('error', 'خطایی در بارگیری لیست کاربران رخ داده است');
    res.render('users/index', {
      title: 'مدیریت کاربران',
      users: [],
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalUsers: 0
      }
    });
  }
}

/**
 * نمایش جزئیات کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function viewUser(req, res) {
  try {
    const userId = req.params.id;
    console.log(`🔍 نمایش جزئیات کاربر: ${userId}`);
    
    const user = await userService.getUserById(userId);
    if (!user) {
      req.flash('error', 'کاربر مورد نظر یافت نشد');
      return res.redirect('/admin/users');
    }
    
    // دریافت تاریخچه تراکنش‌ها
    const transactions = await economyService.getUserTransactions(userId, 10);
    
    // دریافت آمار فعالیت کاربر
    const userStats = await userService.getUserStats(userId);
    
    res.render('users/view', {
      title: `پروفایل ${user.name}`,
      user,
      transactions: transactions || [],
      stats: userStats || {}
    });
  } catch (error) {
    console.error('❌ خطا در نمایش جزئیات کاربر:', error);
    req.flash('error', 'خطایی در بارگیری اطلاعات کاربر رخ داده است');
    res.redirect('/admin/users');
  }
}

/**
 * نمایش فرم ویرایش کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function editUserForm(req, res) {
  try {
    const userId = req.params.id;
    console.log(`🔍 نمایش فرم ویرایش کاربر: ${userId}`);
    
    const user = await userService.getUserById(userId);
    if (!user) {
      req.flash('error', 'کاربر مورد نظر یافت نشد');
      return res.redirect('/admin/users');
    }
    
    res.render('users/edit', {
      title: `ویرایش ${user.name}`,
      user
    });
  } catch (error) {
    console.error('❌ خطا در نمایش فرم ویرایش کاربر:', error);
    req.flash('error', 'خطایی در بارگیری اطلاعات کاربر رخ داده است');
    res.redirect('/admin/users');
  }
}

/**
 * ذخیره تغییرات کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    console.log(`✏️ ویرایش کاربر: ${userId}`);
    
    const result = await userService.updateUser(userId, updateData);
    if (result.success) {
      req.flash('success', 'اطلاعات کاربر با موفقیت به‌روزرسانی شد');
    } else {
      req.flash('error', result.message || 'خطایی در به‌روزرسانی اطلاعات کاربر رخ داده است');
    }
    
    res.redirect(`/admin/users/${userId}/edit`);
  } catch (error) {
    console.error('❌ خطا در ویرایش کاربر:', error);
    req.flash('error', 'خطایی در به‌روزرسانی اطلاعات کاربر رخ داده است');
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
}

/**
 * نمایش فرم تایید حذف کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function deleteUserConfirmation(req, res) {
  try {
    const userId = req.params.id;
    console.log(`🔍 نمایش فرم تایید حذف کاربر: ${userId}`);
    
    const user = await userService.getUserById(userId);
    if (!user) {
      req.flash('error', 'کاربر مورد نظر یافت نشد');
      return res.redirect('/admin/users');
    }
    
    res.render('users/delete', {
      title: `حذف ${user.name}`,
      user
    });
  } catch (error) {
    console.error('❌ خطا در نمایش فرم تایید حذف کاربر:', error);
    req.flash('error', 'خطایی در بارگیری اطلاعات کاربر رخ داده است');
    res.redirect('/admin/users');
  }
}

/**
 * حذف کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    console.log(`❌ حذف کاربر: ${userId}`);
    
    const result = await userService.deleteUser(userId);
    if (result.success) {
      req.flash('success', 'کاربر با موفقیت حذف شد');
    } else {
      req.flash('error', result.message || 'خطایی در حذف کاربر رخ داده است');
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('❌ خطا در حذف کاربر:', error);
    req.flash('error', 'خطایی در حذف کاربر رخ داده است');
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
    console.log(`🚫 مسدود کردن کاربر: ${userId}`);
    
    const result = await userService.banUser(userId);
    if (result.success) {
      req.flash('success', 'کاربر با موفقیت مسدود شد');
    } else {
      req.flash('error', result.message || 'خطایی در مسدود کردن کاربر رخ داده است');
    }
    
    // بازگشت به صفحه قبل یا لیست کاربران
    res.redirect(req.query.returnTo || '/admin/users');
  } catch (error) {
    console.error('❌ خطا در مسدود کردن کاربر:', error);
    req.flash('error', 'خطایی در مسدود کردن کاربر رخ داده است');
    res.redirect('/admin/users');
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
    console.log(`✅ رفع مسدودیت کاربر: ${userId}`);
    
    const result = await userService.unbanUser(userId);
    if (result.success) {
      req.flash('success', 'مسدودیت کاربر با موفقیت برداشته شد');
    } else {
      req.flash('error', result.message || 'خطایی در رفع مسدودیت کاربر رخ داده است');
    }
    
    // بازگشت به صفحه قبل یا لیست کاربران
    res.redirect(req.query.returnTo || '/admin/users');
  } catch (error) {
    console.error('❌ خطا در رفع مسدودیت کاربر:', error);
    req.flash('error', 'خطایی در رفع مسدودیت کاربر رخ داده است');
    res.redirect('/admin/users');
  }
}

/**
 * افزودن سکه به کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function addCoinsToUser(req, res) {
  try {
    const { discordId, amount, reason } = req.body;
    
    console.log(`💰 افزودن ${amount} سکه به کاربر با شناسه دیسکورد ${discordId}`);
    
    if (!discordId || !amount || amount <= 0) {
      req.flash('error', 'شناسه دیسکورد و مقدار سکه (مثبت) باید وارد شود');
      return res.redirect('/admin/users');
    }
    
    const result = await economyService.addCoinsToUser({
      discordId,
      amount: parseInt(amount),
      reason: reason || 'افزودن سکه توسط ادمین',
      adminId: req.session.user.id
    });
    
    if (result.success) {
      req.flash('success', `${amount} سکه با موفقیت به کاربر با شناسه ${discordId} اضافه شد`);
    } else {
      req.flash('error', result.message || 'خطایی در افزودن سکه رخ داده است');
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('❌ خطا در افزودن سکه به کاربر:', error);
    req.flash('error', 'خطایی در افزودن سکه به کاربر رخ داده است');
    res.redirect('/admin/users');
  }
}

/**
 * کسر سکه از کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function removeCoinsFromUser(req, res) {
  try {
    const { discordId, amount, reason } = req.body;
    
    console.log(`💰 کسر ${amount} سکه از کاربر با شناسه دیسکورد ${discordId}`);
    
    if (!discordId || !amount || amount <= 0) {
      req.flash('error', 'شناسه دیسکورد و مقدار سکه (مثبت) باید وارد شود');
      return res.redirect('/admin/users');
    }
    
    const result = await economyService.removeCoinsFromUser({
      discordId,
      amount: parseInt(amount),
      reason: reason || 'کسر سکه توسط ادمین',
      adminId: req.session.user.id
    });
    
    if (result.success) {
      req.flash('success', `${amount} سکه با موفقیت از کاربر با شناسه ${discordId} کسر شد`);
    } else {
      req.flash('error', result.message || 'خطایی در کسر سکه رخ داده است');
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    console.error('❌ خطا در کسر سکه از کاربر:', error);
    req.flash('error', 'خطایی در کسر سکه از کاربر رخ داده است');
    res.redirect('/admin/users');
  }
}

/**
 * خروجی اکسل کاربران
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function exportUsers(req, res) {
  try {
    const query = req.query.q || '';
    const status = req.query.status || '';
    
    console.log(`📋 خروجی اکسل کاربران - جستجو: "${query}", وضعیت: "${status}"`);
    
    // وضعیت‌های فیلتر
    const filterOptions = {};
    if (status === 'active') {
      filterOptions.banned = false;
      filterOptions.inactive = false;
    } else if (status === 'banned') {
      filterOptions.banned = true;
    } else if (status === 'inactive') {
      filterOptions.inactive = true;
    }
    
    // دریافت تمام کاربران بدون صفحه‌بندی
    const users = await userService.getAllUsers({
      query,
      filters: filterOptions
    });
    
    // تنظیم هدرهای پاسخ برای دانلود فایل
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    
    // عناوین ستون‌ها
    res.write('شناسه,نام کاربری,شناسه دیسکورد,موجودی,وضعیت,تاریخ عضویت\n');
    
    // داده‌های کاربران
    users.forEach(user => {
      const status = user.banned ? 'مسدود' : (user.inactive ? 'غیرفعال' : 'فعال');
      const createdAt = new Date(user.createdAt).toLocaleDateString('fa-IR');
      
      res.write(`${user._id},${user.name},${user.discordId},${user.balance || 0},${status},${createdAt}\n`);
    });
    
    res.end();
  } catch (error) {
    console.error('❌ خطا در خروجی اکسل کاربران:', error);
    req.flash('error', 'خطایی در تهیه خروجی اکسل کاربران رخ داده است');
    res.redirect('/admin/users');
  }
}

/**
 * دریافت تراکنش‌های کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function getUserTransactions(req, res) {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    console.log(`💰 دریافت تراکنش‌های کاربر: ${userId}, صفحه ${page}, تعداد ${limit}`);
    
    const user = await userService.getUserById(userId);
    if (!user) {
      req.flash('error', 'کاربر مورد نظر یافت نشد');
      return res.redirect('/admin/users');
    }
    
    const result = await economyService.getUserTransactionsPaginated(userId, page, limit);
    
    res.render('users/transactions', {
      title: `تراکنش‌های ${user.name}`,
      user,
      transactions: result.transactions || [],
      pagination: {
        page,
        limit,
        totalPages: result.totalPages || 1,
        totalTransactions: result.total || 0
      }
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تراکنش‌های کاربر:', error);
    req.flash('error', 'خطایی در بارگیری تراکنش‌های کاربر رخ داده است');
    res.redirect('/admin/users');
  }
}
