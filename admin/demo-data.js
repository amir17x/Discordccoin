/**
 * داده دمو برای تست پنل مدیریت
 * این فایل برای نمایش فقط در حالت توسعه استفاده می‌شود و در محیط تولید از داده‌های واقعی استفاده خواهد شد.
 */

export const demoData = {
  user: {
    id: 1,
    username: 'admin',
    displayName: 'مدیر سیستم',
    email: 'admin@example.com',
    role: 'admin',
    avatar: '/admin/public/images/avatar.png',
    lastLogin: new Date()
  },
  
  userStats: {
    totalUsers: 12367,
    newUsersToday: 156,
    activeUsers: 4532,
    premiumUsers: 984,
    topUsers: [
      { username: 'علی_گیمر', totalWealth: 18456000 },
      { username: 'سارا۸۵', totalWealth: 15678000 },
      { username: 'امیر_کوین', totalWealth: 14530000 },
      { username: 'نگین‌استار', totalWealth: 13245000 },
      { username: 'محمد_بزرگوار', totalWealth: 12897000 }
    ]
  },
  
  systemStats: {
    uptime: 1209600, // 14 روز
    commands: 1483921,
    aiRequests: 285632,
    gamesPlayed: 764321,
    transactions: 3564287,
    robberies: {
      total: 94387,
      successful: 38567,
      successRate: 40.9
    },
    loans: {
      outstandingCount: 1245,
      totalAmount: 450000000
    },
    lastBackup: new Date(Date.now() - 12 * 3600 * 1000), // 12 ساعت پیش
    
    today: {
      commandsUsed: 12453,
      aiRequests: 2763,
      gamesPlayed: 4532,
      transactions: 14325
    },
    
    weeklyStats: {
      commandsUsed: [15432, 14320, 16543, 15987, 17654, 16543, 12453],
      aiRequests: [2345, 2456, 2876, 2654, 3012, 2987, 2763],
      gamesPlayed: [4765, 4876, 5432, 5123, 5765, 5432, 4532],
      newUsers: [138, 145, 162, 153, 174, 168, 156]
    }
  },
  
  scheduledTasks: [
    {
      name: 'بک‌آپ گیری خودکار',
      nextRun: new Date(Date.now() + 12 * 3600 * 1000), // 12 ساعت بعد
      status: 'active',
      lastRun: new Date(Date.now() - 12 * 3600 * 1000) // 12 ساعت پیش
    },
    {
      name: 'به‌روزرسانی قیمت‌های بازار',
      nextRun: new Date(Date.now() + 1 * 3600 * 1000), // 1 ساعت بعد
      status: 'active',
      lastRun: new Date(Date.now() - 3 * 3600 * 1000) // 3 ساعت پیش
    },
    {
      name: 'پاکسازی لاگ‌های قدیمی',
      nextRun: new Date(Date.now() + 24 * 3600 * 1000), // 24 ساعت بعد
      status: 'active',
      lastRun: new Date(Date.now() - 24 * 3600 * 1000) // 24 ساعت پیش
    },
    {
      name: 'ارسال ایمیل‌های تبلیغاتی',
      nextRun: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 روز بعد
      status: 'inactive',
      lastRun: null
    }
  ],
  
  alerts: [
    {
      type: 'error',
      message: 'خطا در اتصال به سرور دیسکورد در ساعت 14:32',
      time: new Date(Date.now() - 2 * 3600 * 1000) // 2 ساعت پیش
    },
    {
      type: 'warning',
      message: 'مصرف CPU به بیش از 80% رسیده است',
      time: new Date(Date.now() - 5 * 3600 * 1000) // 5 ساعت پیش
    },
    {
      type: 'info',
      message: 'به‌روزرسانی نرم‌افزار با موفقیت انجام شد (نسخه 2.4.1)',
      time: new Date(Date.now() - 8 * 3600 * 1000) // 8 ساعت پیش
    }
  ],
  
  recentActivities: [
    {
      type: 'user',
      username: 'محمد_بزرگوار',
      action: 'ثبت‌نام',
      details: 'از طریق لینک دعوت کاربر امیر_کوین',
      time: new Date(Date.now() - 0.5 * 3600 * 1000) // 30 دقیقه پیش
    },
    {
      type: 'transaction',
      username: 'سارا۸۵',
      action: 'انتقال ارز',
      details: 'انتقال 50,000 کوین به کاربر نگین‌استار',
      time: new Date(Date.now() - 1.2 * 3600 * 1000) // 1.2 ساعت پیش
    },
    {
      type: 'game',
      username: 'علی_گیمر',
      action: 'برنده جایزه',
      details: 'برنده 100,000 کوین از بازی اسلات',
      time: new Date(Date.now() - 1.8 * 3600 * 1000) // 1.8 ساعت پیش
    },
    {
      type: 'system',
      username: 'سیستم',
      action: 'بک‌آپ خودکار',
      details: 'بک‌آپ کامل دیتابیس انجام شد (384 MB)',
      time: new Date(Date.now() - 12 * 3600 * 1000) // 12 ساعت پیش
    }
  ]
};