/**
 * کنترلر مدیریت سرورها
 * 
 * این کنترلر مسئول مدیریت سرورهای دیسکورد و تنظیمات آن‌ها است.
 */

import { getServersList, getServerDetails, updateServer } from '../services/serversService.js';

/**
 * نمایش داشبورد مدیریت سرورها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function showDashboard(req, res) {
  try {
    console.log('🔍 دریافت لیست سرورها...');
    // دریافت لیست سرورها
    const servers = await getServersList();
    
    // محاسبه آمار کلی
    const totalServers = servers.length;
    const activeServers = servers.filter(server => server.active).length;
    const inactiveServers = totalServers - activeServers;
    const totalMembers = servers.reduce((total, server) => total + (server.memberCount || 0), 0);
    
    // آماده‌سازی آمار برای نمایش
    const stats = {
      totalServers,
      activeServers,
      inactiveServers,
      totalMembers
    };
    
    // سرورهای اخیر
    const recentServers = servers
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5); // 5 سرور اخیر
    
    console.log(`✅ ${servers.length} سرور یافت شد. نمایش داشبورد سرورها...`);
    
    if (process.env.USE_FLUENT_UI === 'true') {
      console.log('🎨 استفاده از رابط کاربری Fluent برای صفحه مدیریت سرورها');
      
      res.render('fluent-servers', {
        title: 'مدیریت سرورها',
        currentRoute: req.path,
        layout: 'layouts/fluent-main',
        user: req.session.user,
        servers,
        stats,
        recentServers
      });
    } else {
      res.render('servers/dashboard', {
        title: 'مدیریت سرورها',
        totalServers,
        activeServers,
        totalMembers,
        recentServers
      });
    }
  } catch (error) {
    console.error('❌ خطا در نمایش داشبورد سرورها:', error);
    req.flash('error', 'خطا در بارگذاری داشبورد سرورها');
    
    if (process.env.USE_FLUENT_UI === 'true') {
      res.render('fluent-servers', {
        title: 'مدیریت سرورها',
        currentRoute: req.path,
        layout: 'layouts/fluent-main',
        user: req.session.user,
        servers: [],
        stats: {
          totalServers: 0,
          activeServers: 0,
          inactiveServers: 0,
          totalMembers: 0
        },
        recentServers: []
      });
    } else {
      res.render('servers/dashboard', {
        title: 'مدیریت سرورها',
        totalServers: 0,
        activeServers: 0,
        totalMembers: 0,
        recentServers: []
      });
    }
  }
};

/**
 * نمایش لیست سرورها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServersList = async (req, res) => {
  try {
    // دریافت پارامترهای فیلتر و مرتب‌سازی
    const { search, sortBy, order, page = 1, limit = 20 } = req.query;
    
    // دریافت لیست سرورها
    const servers = await getServersList({ search, sortBy, order, page, limit });
    
    res.render('servers/list', {
      title: 'لیست سرورها',
      servers,
      filters: { search, sortBy, order, page, limit }
    });
  } catch (error) {
    console.error('Servers list error:', error);
    req.flash('error', 'خطا در بارگذاری لیست سرورها');
    res.render('servers/list', {
      title: 'لیست سرورها',
      servers: [],
      filters: req.query
    });
  }
};

/**
 * نمایش جزئیات سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/details', {
      title: `جزئیات سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server details error:', error);
    req.flash('error', 'خطا در بارگذاری جزئیات سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * بروزرسانی تنظیمات سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateServerSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    
    // بروزرسانی تنظیمات سرور
    await updateServer(id, settings);
    
    req.flash('success', 'تنظیمات سرور با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}`);
  } catch (error) {
    console.error('Update server settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات سرور');
    res.redirect(`/admin/servers/${req.params.id}`);
  }
};

/**
 * فعال/غیرفعال کردن سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const toggleServerEnabled = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    // بروزرسانی وضعیت فعال بودن سرور
    await updateServer(id, { isActive: enabled === 'true' });
    
    req.flash('success', `سرور ${enabled === 'true' ? 'فعال' : 'غیرفعال'} شد`);
    res.redirect(`/admin/servers/${id}`);
  } catch (error) {
    console.error('Toggle server error:', error);
    req.flash('error', 'خطا در تغییر وضعیت سرور');
    res.redirect(`/admin/servers/${req.params.id}`);
  }
};

/**
 * نمایش ویژگی‌های سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerFeatures = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/features', {
      title: `ویژگی‌های سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server features error:', error);
    req.flash('error', 'خطا در بارگذاری ویژگی‌های سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * بروزرسانی ویژگی‌های سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateServerFeatures = async (req, res) => {
  try {
    const { id } = req.params;
    const features = req.body.features || {};
    
    // بروزرسانی ویژگی‌های سرور
    await updateServer(id, { features });
    
    req.flash('success', 'ویژگی‌های سرور با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}/features`);
  } catch (error) {
    console.error('Update server features error:', error);
    req.flash('error', 'خطا در بروزرسانی ویژگی‌های سرور');
    res.redirect(`/admin/servers/${req.params.id}/features`);
  }
};

/**
 * نمایش کانال‌های سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerChannels = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/channels', {
      title: `کانال‌های سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server channels error:', error);
    req.flash('error', 'خطا در بارگذاری کانال‌های سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * بروزرسانی تنظیمات کانال
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateChannelSettings = async (req, res) => {
  try {
    const { id, channelId } = req.params;
    const settings = req.body;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // بروزرسانی تنظیمات کانال
    // این بخش باید با API دیسکورد کار کند
    
    req.flash('success', 'تنظیمات کانال با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}/channels`);
  } catch (error) {
    console.error('Update channel settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات کانال');
    res.redirect(`/admin/servers/${req.params.id}/channels`);
  }
};

/**
 * نمایش رول‌های سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerRoles = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/roles', {
      title: `رول‌های سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server roles error:', error);
    req.flash('error', 'خطا در بارگذاری رول‌های سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * بروزرسانی تنظیمات رول
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateRoleSettings = async (req, res) => {
  try {
    const { id, roleId } = req.params;
    const settings = req.body;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // بروزرسانی تنظیمات رول
    // این بخش باید با API دیسکورد کار کند
    
    req.flash('success', 'تنظیمات رول با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}/roles`);
  } catch (error) {
    console.error('Update role settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات رول');
    res.redirect(`/admin/servers/${req.params.id}/roles`);
  }
};

/**
 * نمایش اعضای سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerMembers = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/members', {
      title: `اعضای سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server members error:', error);
    req.flash('error', 'خطا در بارگذاری اعضای سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * نمایش جزئیات عضو
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showMemberDetails = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // دریافت جزئیات کاربر
    // این بخش باید با API دیسکورد کار کند
    const member = { id: userId, name: 'کاربر نمونه' }; // نمونه
    
    res.render('servers/member-details', {
      title: `جزئیات عضو: ${member.name}`,
      server,
      member
    });
  } catch (error) {
    console.error('Member details error:', error);
    req.flash('error', 'خطا در بارگذاری جزئیات عضو');
    res.redirect(`/admin/servers/${req.params.id}/members`);
  }
};

/**
 * بروزرسانی تنظیمات عضو
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateMemberSettings = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const settings = req.body;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // بروزرسانی تنظیمات عضو
    // این بخش باید با API دیسکورد کار کند
    
    req.flash('success', 'تنظیمات عضو با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}/members/${userId}`);
  } catch (error) {
    console.error('Update member settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات عضو');
    res.redirect(`/admin/servers/${req.params.id}/members/${req.params.userId}`);
  }
};

/**
 * نمایش کامندهای سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerCommands = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/commands', {
      title: `کامندهای سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server commands error:', error);
    req.flash('error', 'خطا در بارگذاری کامندهای سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * بروزرسانی کامندهای سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateServerCommands = async (req, res) => {
  try {
    const { id } = req.params;
    const commands = req.body.commands || {};
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // بروزرسانی کامندهای سرور
    // این بخش باید با API دیسکورد کار کند
    
    req.flash('success', 'کامندهای سرور با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}/commands`);
  } catch (error) {
    console.error('Update server commands error:', error);
    req.flash('error', 'خطا در بروزرسانی کامندهای سرور');
    res.redirect(`/admin/servers/${req.params.id}/commands`);
  }
};

/**
 * نمایش لاگ‌های سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerLogs = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/logs', {
      title: `لاگ‌های سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * بروزرسانی تنظیمات لاگ
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateLogSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // بروزرسانی تنظیمات لاگ
    // این بخش باید با API دیسکورد کار کند
    
    req.flash('success', 'تنظیمات لاگ با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}/logs`);
  } catch (error) {
    console.error('Update log settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات لاگ');
    res.redirect(`/admin/servers/${req.params.id}/logs`);
  }
};

/**
 * پاکسازی لاگ‌های سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const clearServerLogs = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // پاکسازی لاگ‌های سرور
    // این بخش باید با API دیسکورد کار کند
    
    req.flash('success', 'لاگ‌های سرور با موفقیت پاکسازی شد');
    res.redirect(`/admin/servers/${id}/logs`);
  } catch (error) {
    console.error('Clear server logs error:', error);
    req.flash('error', 'خطا در پاکسازی لاگ‌های سرور');
    res.redirect(`/admin/servers/${req.params.id}/logs`);
  }
};

/**
 * نمایش آمار سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/stats', {
      title: `آمار سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server stats error:', error);
    req.flash('error', 'خطا در بارگذاری آمار سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * خروجی آمار سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportServerStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // ایجاد خروجی CSV یا JSON
    // این بخش باید داده‌های آماری را جمع‌آوری و خروجی دهد
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=server-stats-${id}.csv`);
    res.send('ID,Name,Value\n1,Sample,100');
  } catch (error) {
    console.error('Export server stats error:', error);
    req.flash('error', 'خطا در خروجی آمار سرور');
    res.redirect(`/admin/servers/${req.params.id}/stats`);
  }
};

/**
 * نمایش تنظیمات سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showServerSettings = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    res.render('servers/settings', {
      title: `تنظیمات سرور: ${server.name}`,
      server
    });
  } catch (error) {
    console.error('Server settings error:', error);
    req.flash('error', 'خطا در بارگذاری تنظیمات سرور');
    res.redirect('/admin/servers/list');
  }
};

/**
 * بروزرسانی تنظیمات پیشرفته سرور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateAdvancedSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    
    // دریافت جزئیات سرور
    const server = await getServerDetails(id);
    
    if (!server) {
      req.flash('error', 'سرور مورد نظر یافت نشد');
      return res.redirect('/admin/servers/list');
    }
    
    // بروزرسانی تنظیمات پیشرفته سرور
    await updateServer(id, settings);
    
    req.flash('success', 'تنظیمات پیشرفته سرور با موفقیت بروزرسانی شد');
    res.redirect(`/admin/servers/${id}/settings`);
  } catch (error) {
    console.error('Update advanced settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات پیشرفته سرور');
    res.redirect(`/admin/servers/${req.params.id}/settings`);
  }
};

export const serversController = {
  showDashboard,
  showServersList,
  showServerDetails,
  updateServerSettings,
  toggleServerEnabled,
  showServerFeatures,
  updateServerFeatures,
  showServerChannels,
  updateChannelSettings,
  showServerRoles,
  updateRoleSettings,
  showServerMembers,
  showMemberDetails,
  updateMemberSettings,
  showServerCommands,
  updateServerCommands,
  showServerLogs,
  updateLogSettings,
  clearServerLogs,
  showServerStats,
  exportServerStats,
  showServerSettings,
  updateAdvancedSettings
};