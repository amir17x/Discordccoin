# راهنمای پیاده‌سازی رابط کاربری Fluent در پنل مدیریت CCOIN

این راهنما برای توسعه‌دهندگانی است که قصد دارند قابلیت‌های جدید را به پنل مدیریت CCOIN با طراحی Fluent UI اضافه کنند.

## مقدمه

پنل مدیریت CCOIN از رابط کاربری Fluent UI مایکروسافت به عنوان سیستم طراحی اصلی استفاده می‌کند. این طراحی مدرن و یکپارچه، تجربه کاربری بهتری را برای مدیران سیستم فراهم می‌کند.

## ساختار فایل‌ها

```
admin/
├── public/
│   ├── css/
│   │   └── fluent.css       # استایل‌های اصلی فلوئنت UI
│   ├── js/
│   │   └── fluent-ui.js     # اسکریپت‌های مربوط به فلوئنت UI
│   └── img/
│       ├── ccoin-logo.svg   # لوگوی CCOIN
│       └── user-avatar.svg  # آواتار پیش‌فرض کاربر
├── views/
│   ├── layouts/
│   │   ├── fluent-main.ejs  # قالب اصلی برای صفحات پنل
│   │   └── fluent-auth.ejs  # قالب احراز هویت
│   ├── fluent-login.ejs            # صفحه ورود
│   ├── fluent-forgot-password.ejs  # صفحه فراموشی رمز عبور
│   ├── fluent-reset-password.ejs   # صفحه بازنشانی رمز عبور
│   └── fluent-dashboard.ejs        # صفحه داشبورد
└── fluent-ui-guide.md      # این راهنما
```

## فعال‌سازی رابط کاربری Fluent

رابط کاربری Fluent با متغیر محیطی `USE_FLUENT_UI` کنترل می‌شود. برای فعال‌سازی آن، این مقدار را در فایل `.env` به `true` تنظیم کنید:

```
USE_FLUENT_UI=true
```

## نحوه اضافه کردن صفحات جدید

برای ایجاد یک صفحه جدید با طراحی Fluent UI، مراحل زیر را دنبال کنید:

1. یک فایل قالب جدید با پیشوند `fluent-` در دایرکتوری `views/` ایجاد کنید.
2. از قالب `layouts/fluent-main.ejs` برای صفحات اصلی پنل و `layouts/fluent-auth.ejs` برای صفحات احراز هویت استفاده کنید.
3. در کنترلر مربوطه، شرایط تشخیص استفاده از قالب Fluent UI را اضافه کنید:

```javascript
if (process.env.USE_FLUENT_UI === 'true') {
  // استفاده از قالب Fluent UI
  res.render('fluent-page-name', {
    title: 'عنوان صفحه',
    layout: 'layouts/fluent-main',
    // داده‌های مورد نیاز صفحه...
  });
} else {
  // استفاده از قالب قدیمی
  res.render('old-page-path', {
    title: 'عنوان صفحه',
    // داده‌های مورد نیاز صفحه...
  });
}
```

## کامپوننت‌های اصلی

### کارت‌ها (Cards)

برای ایجاد کارت‌ها از ساختار زیر استفاده کنید:

```html
<div class="fluent-card">
  <div class="fluent-card-header">
    <h2 class="fluent-card-title">عنوان کارت</h2>
    <div class="fluent-card-header-actions">
      <!-- دکمه‌ها یا عناصر کنترلی -->
    </div>
  </div>
  <div class="fluent-card-content">
    <!-- محتوای کارت -->
  </div>
</div>
```

### دکمه‌ها (Buttons)

```html
<!-- دکمه اصلی -->
<button class="fluent-button fluent-button-primary">دکمه اصلی</button>

<!-- دکمه ثانویه -->
<button class="fluent-button fluent-button-secondary">دکمه ثانویه</button>

<!-- دکمه تمام عرض -->
<button class="fluent-button fluent-button-primary fluent-button-block">دکمه تمام عرض</button>

<!-- دکمه آیکون -->
<button class="fluent-icon-button">
  <i class="fa-solid fa-sync-alt"></i>
</button>
```

### فرم‌ها (Forms)

```html
<form class="fluent-form">
  <div class="fluent-form-group">
    <label for="input-id" class="fluent-label">عنوان فیلد</label>
    <input type="text" id="input-id" name="input-name" class="fluent-input" placeholder="متن راهنما">
  </div>
  
  <div class="fluent-form-group">
    <label for="select-id" class="fluent-label">انتخاب</label>
    <select id="select-id" name="select-name" class="fluent-select">
      <option value="">انتخاب کنید</option>
      <option value="1">گزینه 1</option>
      <option value="2">گزینه 2</option>
    </select>
  </div>
  
  <div class="fluent-form-group">
    <label class="fluent-checkbox">
      <input type="checkbox" name="checkbox-name" value="true">
      <span class="fluent-checkbox-indicator"></span>
      متن چک‌باکس
    </label>
  </div>
  
  <div class="fluent-form-actions">
    <button type="button" class="fluent-button fluent-button-secondary">انصراف</button>
    <button type="submit" class="fluent-button fluent-button-primary">ذخیره</button>
  </div>
</form>
```

### جدول‌ها (Tables)

```html
<div class="fluent-table-container">
  <table class="fluent-table" id="table-id">
    <thead>
      <tr>
        <th>عنوان ستون 1</th>
        <th>عنوان ستون 2</th>
        <th>عملیات</th>
      </tr>
    </thead>
    <tbody>
      <tr data-href="/admin/path/to/item/1">
        <td>مقدار 1</td>
        <td>مقدار 2</td>
        <td>
          <div class="fluent-table-actions">
            <button class="fluent-icon-button small">
              <i class="fa-solid fa-edit"></i>
            </button>
            <button class="fluent-icon-button small">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### نمایش وضعیت (Status Badges)

```html
<span class="fluent-badge success">موفق</span>
<span class="fluent-badge warning">هشدار</span>
<span class="fluent-badge error">خطا</span>
<span class="fluent-badge info">اطلاعات</span>
<span class="fluent-badge neutral">خنثی</span>
```

### هشدارها (Alerts)

```html
<div class="fluent-alert success">
  <i class="fa-solid fa-check-circle"></i>
  پیام موفقیت
</div>

<div class="fluent-alert error">
  <i class="fa-solid fa-times-circle"></i>
  پیام خطا
</div>

<div class="fluent-alert info">
  <i class="fa-solid fa-info-circle"></i>
  پیام اطلاعاتی
</div>

<div class="fluent-alert warning">
  <i class="fa-solid fa-exclamation-triangle"></i>
  پیام هشدار
</div>
```

## نمودارها (Charts)

برای ایجاد نمودارها از کتابخانه Chart.js استفاده می‌شود. نمونه کد:

```html
<div class="fluent-chart-container" id="chart-id" data-auto-height="true">
  <!-- نمودار اینجا رندر می‌شود -->
</div>

<script>
  const ctx = document.getElementById('chart-id').getContext('2d');
  new Chart(ctx, {
    type: 'line', // یا 'bar', 'pie', etc.
    data: {
      labels: ['فروردین', 'اردیبهشت', 'خرداد'],
      datasets: [{
        label: 'داده‌ها',
        data: [12, 19, 3],
        borderColor: '#0078d4',
        backgroundColor: 'rgba(0, 120, 212, 0.1)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // تنظیمات بیشتر...
    }
  });
</script>
```

## نکات مهم

1. **آیکون‌ها**: از آیکون‌های Font Awesome و Feather Icons استفاده کنید.
2. **رنگ‌ها**: از متغیرهای CSS تعریف شده در `fluent.css` استفاده کنید، تا ظاهر یکپارچه حفظ شود.
3. **ریسپانسیو**: طراحی پنل به صورت ریسپانسیو است و در دستگاه‌های مختلف به درستی نمایش داده می‌شود.
4. **جهت متن**: قالب‌ها برای زبان فارسی و جهت راست به چپ (RTL) بهینه شده‌اند.

## توابع JavaScript مفید

- `showToast(message, type, duration)`: نمایش پیام toast با انواع success، error، warning و info
- `confirmAction(message, onConfirm, options)`: نمایش پنجره تأیید با دکمه‌های تأیید و انصراف

## پشتیبانی از حالت تاریک

قالب Fluent UI به صورت خودکار از حالت تاریک سیستم عامل پشتیبانی می‌کند. این قابلیت با استفاده از CSS Media Query `prefers-color-scheme` پیاده‌سازی شده است.
