/**
 * Vision UI Dashboard - Notification Center (Simplified)
 * مرکز اعلان‌های متحرک با انتقال‌های ظریف - نسخه ساده‌سازی شده و سازگار با مرورگرهای قدیمی‌تر
 */

document.addEventListener('DOMContentLoaded', function() {
  initNotificationCenter();
});

/**
 * داده‌های اعلان برای نمایش
 * در واقعیت، این داده‌ها از API دریافت می‌شوند
 */
var sampleNotifications = [
  {
    id: 1,
    type: 'primary',
    icon: 'bi bi-person',
    title: 'کاربر جدید ثبت نام کرد',
    description: 'کاربر جدیدی با نام Anon#2357 در سیستم ثبت نام کرد.',
    time: new Date(Date.now() - 5 * 60000), // 5 دقیقه پیش
    read: false,
    category: 'account'
  },
  {
    id: 2,
    type: 'success',
    icon: 'bi bi-check-circle',
    title: 'تراکنش موفق',
    description: 'تراکنش انتقال 500 Ccoin به user#1234 با موفقیت انجام شد.',
    time: new Date(Date.now() - 15 * 60000), // 15 دقیقه پیش
    read: false,
    category: 'transaction'
  },
  {
    id: 3,
    type: 'info',
    icon: 'bi bi-info-circle',
    title: 'بروزرسانی سیستم',
    description: 'سیستم با موفقیت به نسخه 2.3.0 بروزرسانی شد.',
    time: new Date(Date.now() - 60 * 60000), // 1 ساعت پیش
    read: true,
    category: 'system'
  },
  {
    id: 4,
    type: 'warning',
    icon: 'bi bi-exclamation-triangle',
    title: 'خطای سرور',
    description: 'خطای سرور در پردازش درخواست‌ها. لطفا بررسی کنید.',
    time: new Date(Date.now() - 2 * 60 * 60000), // 2 ساعت پیش
    read: true,
    category: 'system'
  }
];

// متغیرهای سراسری
var notificationCenter;
var notificationList;
var activeFilter = 'all';
var notifications = [];
var notificationCount = 0;

// کپی آرایه اعلانات نمونه به آرایه notifications
for (var i = 0; i < sampleNotifications.length; i++) {
  notifications.push(sampleNotifications[i]);
}

/**
 * راه‌اندازی مرکز اعلان‌ها
 */
function initNotificationCenter() {
  // ایجاد آیکون اعلان در نوار بالا
  createNotificationButton();
  
  // ایجاد مرکز اعلان‌ها
  createNotificationCenter();
  
  // محاسبه تعداد اعلان‌های خوانده نشده
  updateUnreadCount();
  
  // به‌روزرسانی نشانگر اعلان‌ها
  updateNotificationIndicator();
}

/**
 * ایجاد دکمه اعلان در نوار بالا
 */
function createNotificationButton() {
  // ایجاد دکمه فقط اگر وجود ندارد
  if (document.querySelector('.notification-button')) return;
  
  // پیدا کردن محل مناسب برای افزودن دکمه
  var navbarMenu = document.querySelector('.navbar-nav');
  
  if (navbarMenu) {
    var notificationItem = document.createElement('li');
    notificationItem.className = 'nav-item dropdown pe-2 d-flex align-items-center notification-indicator';
    
    notificationItem.innerHTML = '<a href="javascript:;" class="nav-link text-white p-0 notification-button" id="dropdownMenuButton">' +
      '<i class="bi bi-bell cursor-pointer"></i>' +
      '<span class="badge">0</span>' +
      '</a>';
    
    // افزودن به نوار بالا
    navbarMenu.appendChild(notificationItem);
    
    // رویداد کلیک روی دکمه
    var button = notificationItem.querySelector('.notification-button');
    if (button) {
      button.addEventListener('click', toggleNotificationCenter);
    }
  }
}

/**
 * ایجاد مرکز اعلان‌ها
 */
function createNotificationCenter() {
  // بررسی وجود مرکز اعلان قبلی
  if (document.querySelector('.vui-notification-center')) return;
  
  notificationCenter = document.createElement('div');
  notificationCenter.className = 'vui-notification-center';
  
  notificationCenter.innerHTML = '<div class="vui-notification-header">' +
    '<h5>اعلان‌ها</h5>' +
    '<div class="vui-notification-actions">' +
    '<button title="علامت‌گذاری همه به عنوان خوانده شده">' +
    '<i class="bi bi-check-all"></i>' +
    '</button>' +
    '<button title="تنظیمات اعلان‌ها">' +
    '<i class="bi bi-gear"></i>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '<div class="vui-notification-tabs">' +
    '<div class="vui-notification-tab active" data-filter="all">همه</div>' +
    '<div class="vui-notification-tab" data-filter="account">حساب</div>' +
    '<div class="vui-notification-tab" data-filter="system">سیستم</div>' +
    '<div class="vui-notification-tab" data-filter="transaction">تراکنش‌ها</div>' +
    '</div>' +
    '<ul class="vui-notification-list"></ul>' +
    '<div class="vui-notification-footer">' +
    '<a href="javascript:void(0)">مشاهده تمام اعلان‌ها</a>' +
    '</div>';
  
  document.body.appendChild(notificationCenter);
  
  // دسترسی به لیست اعلان‌ها
  notificationList = notificationCenter.querySelector('.vui-notification-list');
  
  // رندر اعلان‌ها
  renderNotifications();
  
  // تنظیم رویدادها
  setupNotificationEvents();
}

/**
 * رندر اعلان‌ها براساس فیلتر فعلی
 */
function renderNotifications() {
  if (!notificationList) return;
  
  // فیلتر اعلان‌ها
  var filteredNotifications = [];
  
  if (activeFilter === 'all') {
    filteredNotifications = notifications;
  } else {
    for (var i = 0; i < notifications.length; i++) {
      if (notifications[i].category === activeFilter) {
        filteredNotifications.push(notifications[i]);
      }
    }
  }
  
  // خالی کردن لیست
  notificationList.innerHTML = '';
  
  // اگر اعلانی وجود ندارد
  if (filteredNotifications.length === 0) {
    notificationList.innerHTML = '<li class="vui-notification-item empty-state">' +
      '<div style="text-align: center; width: 100%; padding: 20px;">' +
      '<i class="bi bi-bell-slash" style="font-size: 24px; color: var(--text-muted);"></i>' +
      '<p style="margin-top: 10px; color: var(--text-secondary);">اعلان جدیدی وجود ندارد</p>' +
      '</div>' +
      '</li>';
    return;
  }
  
  // رندر اعلان‌ها
  for (var i = 0; i < filteredNotifications.length; i++) {
    var notification = filteredNotifications[i];
    var index = i;
    
    var notificationItem = document.createElement('li');
    notificationItem.className = 'vui-notification-item ' + (notification.read ? '' : 'unread');
    notificationItem.setAttribute('data-id', notification.id);
    
    // اعمال تاخیر به انیمیشن برای حالت آبشاری
    notificationItem.style.animationDelay = (index * 0.05) + 's';
    
    notificationItem.innerHTML = '<div class="vui-notification-icon ' + notification.type + '">' +
      '<i class="' + notification.icon + '"></i>' +
      '</div>' +
      '<div class="vui-notification-content">' +
      '<h6 class="vui-notification-title">' + notification.title + '</h6>' +
      '<p class="vui-notification-desc">' + notification.description + '</p>' +
      '<span class="vui-notification-time">' + formatRelativeTime(notification.time) + '</span>' +
      '</div>';
    
    notificationList.appendChild(notificationItem);
  }
}

/**
 * تنظیم رویدادهای مربوط به اعلان‌ها
 */
function setupNotificationEvents() {
  if (!notificationCenter) return;
  
  // رویداد تب‌های فیلتر
  var tabs = notificationCenter.querySelectorAll('.vui-notification-tab');
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    
    tab.addEventListener('click', function() {
      for (var j = 0; j < tabs.length; j++) {
        tabs[j].classList.remove('active');
      }
      this.classList.add('active');
      
      // تنظیم فیلتر فعلی
      activeFilter = this.getAttribute('data-filter');
      
      // رندر مجدد اعلان‌ها
      renderNotifications();
    });
  }
  
  // رویداد علامت‌گذاری همه به عنوان خوانده شده
  var markAllReadButton = notificationCenter.querySelector('.vui-notification-actions button:first-child');
  if (markAllReadButton) {
    markAllReadButton.addEventListener('click', function() {
      for (var i = 0; i < notifications.length; i++) {
        notifications[i].read = true;
      }
      
      // رندر مجدد اعلان‌ها
      renderNotifications();
      
      // به‌روزرسانی تعداد اعلان‌های خوانده نشده
      updateUnreadCount();
      
      // به‌روزرسانی نشانگر اعلان‌ها
      updateNotificationIndicator();
      
      // نمایش پیام موفقیت
      showNotificationPopup({
        type: 'success',
        title: 'عملیات موفق',
        message: 'تمام اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند.',
        icon: 'bi bi-check-circle'
      });
    });
  }
  
  // رویداد کلیک روی اعلان‌ها
  notificationList.addEventListener('click', function(e) {
    var notificationItem = e.target.closest('.vui-notification-item');
    if (notificationItem && !notificationItem.classList.contains('empty-state')) {
      var notificationId = parseInt(notificationItem.getAttribute('data-id'));
      
      // علامت‌گذاری به عنوان خوانده شده
      for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id === notificationId) {
          notifications[i].read = true;
          break;
        }
      }
      
      // رندر مجدد اعلان‌ها
      renderNotifications();
      
      // به‌روزرسانی تعداد اعلان‌های خوانده نشده
      updateUnreadCount();
      
      // به‌روزرسانی نشانگر اعلان‌ها
      updateNotificationIndicator();
    }
  });
  
  // رویداد تنظیمات اعلان‌ها
  var settingsButton = notificationCenter.querySelector('.vui-notification-actions button:last-child');
  if (settingsButton) {
    settingsButton.addEventListener('click', function() {
      // در اینجا می‌توان مدال تنظیمات را نمایش داد
      showNotificationPopup({
        type: 'info',
        title: 'تنظیمات اعلان‌ها',
        message: 'این قابلیت در بروزرسانی بعدی افزوده خواهد شد.',
        icon: 'bi bi-gear'
      });
    });
  }
  
  // بستن مرکز با کلیک خارج از آن
  document.addEventListener('click', function(e) {
    var notificationButton = document.querySelector('.notification-button');
    
    if (notificationCenter && 
        notificationCenter.classList.contains('show') && 
        !notificationCenter.contains(e.target) && 
        notificationButton && 
        !notificationButton.contains(e.target)) {
      notificationCenter.classList.remove('show');
    }
  });
  
  // رویداد کلیک روی لینک "مشاهده تمام اعلان‌ها"
  var viewAllLink = notificationCenter.querySelector('.vui-notification-footer a');
  if (viewAllLink) {
    viewAllLink.addEventListener('click', function() {
      // در اینجا می‌توان صفحه تمام اعلان‌ها را نمایش داد
      showNotificationPopup({
        type: 'info',
        title: 'صفحه اعلان‌ها',
        message: 'این قابلیت در بروزرسانی بعدی افزوده خواهد شد.',
        icon: 'bi bi-bell'
      });
    });
  }
}

/**
 * نمایش/مخفی کردن مرکز اعلان‌ها
 */
function toggleNotificationCenter() {
  if (!notificationCenter) return;
  
  notificationCenter.classList.toggle('show');
}

/**
 * به‌روزرسانی تعداد اعلان‌های خوانده نشده
 */
function updateUnreadCount() {
  notificationCount = 0;
  for (var i = 0; i < notifications.length; i++) {
    if (!notifications[i].read) {
      notificationCount++;
    }
  }
}

/**
 * به‌روزرسانی نشانگر اعلان‌ها
 */
function updateNotificationIndicator() {
  var badge = document.querySelector('.notification-indicator .badge');
  
  if (badge) {
    badge.textContent = notificationCount;
    
    // اگر اعلان خوانده نشده وجود دارد، کلاس has-new را اضافه می‌کنیم
    if (notificationCount > 0) {
      badge.classList.add('has-new');
    } else {
      badge.classList.remove('has-new');
    }
  }
}

/**
 * نمایش پاپ‌آپ اعلان
 * @param {Object} options - تنظیمات پاپ‌آپ
 */
function showNotificationPopup(options) {
  // حذف پاپ‌آپ‌های قبلی
  var existingPopups = document.querySelectorAll('.vui-notification-popup');
  for (var i = 0; i < existingPopups.length; i++) {
    var popup = existingPopups[i];
    var index = i;
    
    // تنظیم موقعیت عمودی بالاتر برای پاپ‌آپ‌های موجود
    popup.style.transform = 'translateY(-' + ((index + 1) * 70) + 'px)';
    
    // حذف بعد از مدتی
    (function(popupToRemove) {
      setTimeout(function() {
        popupToRemove.style.opacity = '0';
        popupToRemove.style.transform = 'translateX(120%)';
        
        setTimeout(function() {
          if (popupToRemove.parentNode) {
            popupToRemove.parentNode.removeChild(popupToRemove);
          }
        }, 300);
      }, 3000);
    })(popup);
  }
  
  // ایجاد پاپ‌آپ جدید
  var popup = document.createElement('div');
  popup.className = 'vui-notification-popup ' + (options.type || 'info');
  
  popup.innerHTML = '<div class="vui-notification-popup-icon ' + (options.type || 'info') + '">' +
    '<i class="' + (options.icon || 'bi bi-info-circle') + '"></i>' +
    '</div>' +
    '<div class="vui-notification-popup-content">' +
    '<h6 class="vui-notification-popup-title">' + (options.title || 'اعلان جدید') + '</h6>' +
    '<p class="vui-notification-popup-desc">' + (options.message || '') + '</p>' +
    '</div>' +
    '<button class="vui-notification-popup-close">' +
    '<i class="bi bi-x"></i>' +
    '</button>';
  
  document.body.appendChild(popup);
  
  // نمایش پاپ‌آپ با تاخیر برای اجرای انیمیشن
  setTimeout(function() {
    popup.classList.add('show');
  }, 10);
  
  // رویداد دکمه بستن
  var closeButton = popup.querySelector('.vui-notification-popup-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      popup.style.opacity = '0';
      popup.style.transform = 'translateX(120%)';
      
      setTimeout(function() {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 300);
    });
  }
  
  // حذف خودکار بعد از 5 ثانیه
  setTimeout(function() {
    if (popup && document.body.contains(popup)) {
      popup.style.opacity = '0';
      popup.style.transform = 'translateX(120%)';
      
      setTimeout(function() {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 300);
    }
  }, 5000);
}

/**
 * فرمت تاریخ به صورت نسبی
 * @param {Date} date - تاریخ
 * @returns {string} - زمان نسبی (مثلا "2 دقیقه پیش")
 */
function formatRelativeTime(date) {
  var now = new Date();
  var diffInMs = now - new Date(date);
  var diffInSec = Math.floor(diffInMs / 1000);
  var diffInMin = Math.floor(diffInSec / 60);
  var diffInHour = Math.floor(diffInMin / 60);
  var diffInDay = Math.floor(diffInHour / 24);
  
  if (diffInSec < 60) {
    return 'چند لحظه پیش';
  } else if (diffInMin < 60) {
    return diffInMin + ' دقیقه پیش';
  } else if (diffInHour < 24) {
    return diffInHour + ' ساعت پیش';
  } else if (diffInDay < 7) {
    return diffInDay + ' روز پیش';
  } else {
    // فرمت تاریخ به صورت عادی
    return new Date(date).toLocaleDateString('fa-IR');
  }
}

// API عمومی
window.visionUiNotifications = {
  addNotification: function(notification) {
    return addNotification(notification);
  },
  markAsRead: function(id) {
    for (var i = 0; i < notifications.length; i++) {
      if (notifications[i].id === id) {
        notifications[i].read = true;
        renderNotifications();
        updateUnreadCount();
        updateNotificationIndicator();
        return true;
      }
    }
    return false;
  },
  clearAll: function() {
    notifications = [];
    renderNotifications();
    updateUnreadCount();
    updateNotificationIndicator();
    return true;
  }
};