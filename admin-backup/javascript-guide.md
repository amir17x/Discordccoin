# راهنمای فایل‌های JavaScript پنل مدیریت

این فایل راهنما توضیح می‌دهد که هر فایل JavaScript در پنل مدیریت چه وظیفه‌ای دارد و چگونه با یکدیگر ارتباط برقرار می‌کنند.

## فایل‌های اصلی

### 1. main.js
فایل اصلی جاوااسکریپت که در تمام صفحات لود می‌شود و وظیفه مدیریت عمومی صفحات و راه‌اندازی کامپوننت‌های مختلف را دارد.

### 2. sidebar-controller.js
مدیریت منوی کناری با قابلیت جمع شدن و نمایش/مخفی کردن زیرمنوها.
```javascript
// نمونه استفاده
sidebarController.initialize(); // راه‌اندازی کنترل‌کننده منوی کناری
sidebarController.toggleSidebar(); // باز/بسته کردن منوی کناری
```

### 3. user-actions.js
مدیریت اقدامات مربوط به کاربران مانند افزایش موجودی، حذف کاربر و غیره.
```javascript
// نمونه استفاده
vuiUserActions.showModal('افزایش موجودی', 'افزایش سکه به کاربر', userId);
vuiUserActions.processAddCoinsForm(form, modal); // پردازش فرم افزایش موجودی
```

### 4. modal-confirmation-fix.js
رفع مشکل دکمه‌های تأیید در مودال‌ها و مدیریت رویدادهای آنها.
```javascript
// این فایل به صورت خودکار اجرا می‌شود و نیاز به فراخوانی ندارد
// اما می‌توان از توابع آن استفاده کرد
processModalAction(modal, data); // پردازش اقدام مودال
closeModal(modal); // بستن مودال
```

### 5. vision-charts-simplified.js
رسم نمودارها در داشبورد مدیریت با استفاده از کتابخانه Chart.js.
```javascript
// نمونه استفاده
visionCharts.createLineChart('users-chart', data, options);
visionCharts.createBarChart('revenue-chart', data, options);
visionCharts.createDoughnutChart('stats-chart', data, options);
```

### 6. notification-center.js
مدیریت نمایش اعلان‌ها و پیام‌های سیستمی به کاربر.
```javascript
// نمونه استفاده
notificationCenter.showSuccess('عملیات با موفقیت انجام شد');
notificationCenter.showError('خطا در انجام عملیات');
notificationCenter.showWarning('هشدار! این عملیات قابل بازگشت نیست');
```

### 7. dropdown-fixes.js
رفع مشکلات مربوط به منوهای کشویی و عملکرد درست آنها در پنل مدیریت.
```javascript
// این فایل به صورت خودکار اجرا می‌شود و نیاز به فراخوانی ندارد
```

## ارتباط بین فایل‌ها

1. **main.js** فایل اصلی است که بقیه فایل‌ها را فراخوانی می‌کند.
2. **user-actions.js** از **modal-confirmation-fix.js** برای مدیریت مودال‌ها استفاده می‌کند.
3. **notification-center.js** توسط اکثر فایل‌ها برای نمایش پیام‌ها استفاده می‌شود.
4. **sidebar-controller.js** مستقل عمل می‌کند اما با **main.js** تعامل دارد.
5. **vision-charts-simplified.js** در صفحه داشبورد استفاده می‌شود و با داده‌های دریافتی از سرور کار می‌کند.

## نحوه استفاده از توابع اصلی

### مودال‌ها
```javascript
// نمایش مودال
vuiUserActions.showModal(title, content, userId, options);

// بستن مودال
closeModal(document.querySelector('#modal-id'));

// نمایش خطا در مودال
showModalError(modal, 'پیام خطا');
```

### اعلان‌ها
```javascript
// نمایش اعلان موفقیت
notificationCenter.showSuccess('عملیات با موفقیت انجام شد');

// نمایش اعلان خطا
notificationCenter.showError('خطا در انجام عملیات');
```

### ارسال فرم‌ها
```javascript
// ارسال فرم به صورت Ajax
vuiUserActions.submitForm(form, {
  url: '/admin/users/add-coins',
  success: function(response) {
    // اقدامات لازم بعد از موفقیت
  },
  error: function(error) {
    // مدیریت خطا
  }
});
```

### منوی کناری
```javascript
// تغییر وضعیت منوی کناری
sidebarController.toggleSidebar();

// فعال کردن یک آیتم منو
sidebarController.setActiveItem('users');
```

## مدیریت رویدادها

رویدادهای اصلی صفحه در `main.js` مدیریت می‌شوند. برای افزودن رویداد جدید:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  // اضافه کردن رویداد به یک دکمه
  document.querySelectorAll('.action-button').forEach(function(button) {
    button.addEventListener('click', function(e) {
      // اقدامات لازم
    });
  });
});
```

## اشکال‌زدایی

برای اشکال‌زدایی، از کنسول مرورگر استفاده کنید. بسیاری از توابع، پیام‌های مفیدی در کنسول نمایش می‌دهند:

```javascript
// نمونه‌ای از پیام‌های اشکال‌زدایی
console.log('Modal confirmation button clicked:', element);
console.log('Form data collected:', formData);
console.log('Processing modal action for', modalId);
```