# راهنمای پیاده‌سازی مایکروسافت فلوئنت UI برای پنل ادمین CCOIN

این سند راهنما به منظور کمک به تیم توسعه برای پیاده‌سازی طراحی جدید پنل ادمین CCOIN با استفاده از Microsoft Fluent UI ایجاد شده است. این راهنما شامل اطلاعات مهم در مورد ساختار فایل‌ها، نحوه استفاده از کامپوننت‌ها و بهترین روش‌های پیاده‌سازی است.

## فهرست مطالب

1. [مقدمه](#مقدمه)
2. [ساختار فایل‌ها](#ساختار-فایلها)
3. [متغیرهای CSS](#متغیرهای-css)
4. [کامپوننت‌های اصلی](#کامپوننتهای-اصلی)
5. [لایه‌بندی صفحات](#لایهبندی-صفحات)
6. [راهنمای فرم‌ها](#راهنمای-فرمها)
7. [نکات مهم](#نکات-مهم)
8. [مثال‌های کاربردی](#مثالهای-کاربردی)

## مقدمه

طراحی جدید پنل ادمین CCOIN بر اساس Microsoft Fluent UI انجام شده است که یک سیستم طراحی مدرن، منسجم و قابل استفاده است. این سیستم طراحی با هدف بهبود تجربه کاربری، افزایش کارایی و ایجاد ظاهری حرفه‌ای طراحی شده است.

مزایای استفاده از Fluent UI:
- طراحی مدرن و یکپارچه
- استفاده از اصول طراحی تجربه کاربری مایکروسافت
- واکنش‌گرایی کامل برای نمایش در تمام دستگاه‌ها
- دسترس‌پذیری بهتر
- عملکرد بهینه

## ساختار فایل‌ها

فایل‌های CSS و JavaScript مربوط به Fluent UI در مسیرهای زیر قرار دارند:

```
admin/public/css/fluent-ui/
├── fluent-variables.css         # متغیرهای CSS برای رنگ‌ها، فونت‌ها و غیره
├── fluent-ui.css                # استایل‌های اصلی و پایه
└── components/                  # کامپوننت‌های جداگانه
    ├── buttons.css              # دکمه‌ها
    ├── cards.css                # کارت‌ها
    ├── dialogs.css              # دیالوگ‌ها و مودال‌ها
    ├── forms.css                # فرم‌ها و ورودی‌ها
    ├── navigation.css           # ناوبری و منوها
    └── tables.css               # جدول‌ها

admin/public/js/
└── fluent-ui.js                 # اسکریپت‌های جاوااسکریپت برای کامپوننت‌های تعاملی
```

برای استفاده از این فایل‌ها، تگ‌های زیر را به بخش `<head>` صفحه یا قالب اصلی اضافه کنید:

```html
<!-- فونت‌ها -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- آیکون‌ها -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.css">

<!-- استایل‌های فلوئنت UI -->
<link rel="stylesheet" href="/admin/public/css/fluent-ui/fluent-variables.css">
<link rel="stylesheet" href="/admin/public/css/fluent-ui/fluent-ui.css">

<!-- اسکریپت‌ها در انتهای صفحه -->
<script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
<script src="/admin/public/js/fluent-ui.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // فعال‌سازی آیکون‌ها
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  });
</script>
```

## متغیرهای CSS

متغیرهای CSS در فایل `fluent-variables.css` تعریف شده‌اند. این متغیرها برای ایجاد یکپارچگی در طراحی استفاده می‌شوند و شامل موارد زیر هستند:

- رنگ‌های اصلی و ثانویه
- رنگ‌های وضعیت (موفقیت، خطا، هشدار و غیره)
- رنگ‌های خاکستری
- متغیرهای فونت (اندازه، وزن و غیره)
- سایه‌ها
- گرد گوشه‌ها
- فاصله‌ها
- انیمیشن‌ها

نمونه‌ای از متغیرهای پرکاربرد:

```css
/* رنگ‌های اصلی */
--fluent-primary: #0078d4;
--fluent-primary-dark: #106ebe;

/* رنگ‌های وضعیت */
--fluent-success: #107c10;
--fluent-error: #a4262c;
--fluent-warning: #ffb900;

/* رنگ‌های متنی */
--fluent-text-primary: var(--fluent-gray-130);
--fluent-text-secondary: var(--fluent-gray-110);

/* تایپوگرافی */
--fluent-font-size-base: 1rem;
--fluent-font-weight-medium: 500;

/* گرد گوشه‌ها */
--fluent-radius: 4px;
```

## کامپوننت‌های اصلی

### 1. لایه‌بندی اصلی

لایه‌بندی اصلی شامل سه بخش است:
- منوی کناری (Sidebar)
- هدر (Header)
- محتوای اصلی (Content)

```html
<div class="fluent-app">
  <!-- منوی کناری -->
  <aside class="fluent-sidebar fluent-scrollbar">
    <!-- محتوای منوی کناری -->
  </aside>
  
  <!-- محتوای اصلی -->
  <main class="fluent-main">
    <!-- هدر -->
    <header class="fluent-header">
      <!-- محتوای هدر -->
    </header>
    
    <!-- محتوای صفحه -->
    <div class="fluent-content">
      <!-- محتوای اصلی صفحه -->
    </div>
    
    <!-- فوتر -->
    <footer class="fluent-footer">
      <!-- محتوای فوتر -->
    </footer>
  </main>
</div>
```

### 2. دکمه‌ها

دکمه‌ها با کلاس `fluent-btn` و انواع مختلف آن ساخته می‌شوند:

```html
<!-- دکمه عادی -->
<button class="fluent-btn">دکمه عادی</button>

<!-- دکمه اصلی -->
<button class="fluent-btn fluent-btn-primary">دکمه اصلی</button>

<!-- دکمه موفقیت -->
<button class="fluent-btn fluent-btn-success">دکمه موفقیت</button>

<!-- دکمه خطا -->
<button class="fluent-btn fluent-btn-error">دکمه خطا</button>

<!-- دکمه هشدار -->
<button class="fluent-btn fluent-btn-warning">دکمه هشدار</button>

<!-- دکمه با حاشیه -->
<button class="fluent-btn fluent-btn-outline">دکمه با حاشیه</button>

<!-- دکمه با حاشیه اصلی -->
<button class="fluent-btn fluent-btn-outline-primary">دکمه با حاشیه اصلی</button>

<!-- دکمه لینک -->
<button class="fluent-btn fluent-btn-link">دکمه لینک</button>

<!-- دکمه با اندازه‌های مختلف -->
<button class="fluent-btn fluent-btn-primary fluent-btn-sm">دکمه کوچک</button>
<button class="fluent-btn fluent-btn-primary">دکمه متوسط</button>
<button class="fluent-btn fluent-btn-primary fluent-btn-lg">دکمه بزرگ</button>

<!-- دکمه آیکون‌دار -->
<button class="fluent-btn fluent-btn-primary">
  <i data-feather="save" class="fluent-btn-icon-left"></i>
  ذخیره
</button>

<!-- دکمه غیرفعال -->
<button class="fluent-btn fluent-btn-primary" disabled>دکمه غیرفعال</button>

<!-- دکمه در حال بارگذاری -->
<button class="fluent-btn fluent-btn-primary fluent-btn-loading">در حال بارگذاری</button>
```

### 3. کارت‌ها

کارت‌ها با کلاس `fluent-card` و اجزای آن ساخته می‌شوند:

```html
<!-- کارت ساده -->
<div class="fluent-card">
  <div class="fluent-card-body">
    محتوای کارت
  </div>
</div>

<!-- کارت با هدر و فوتر -->
<div class="fluent-card">
  <div class="fluent-card-header">
    <h3 class="fluent-card-title">عنوان کارت</h3>
    <div class="fluent-card-actions">
      <button class="fluent-btn fluent-btn-sm fluent-btn-outline">دکمه</button>
    </div>
  </div>
  <div class="fluent-card-body">
    محتوای کارت
  </div>
  <div class="fluent-card-footer">
    فوتر کارت
  </div>
</div>

<!-- کارت آمار -->
<div class="fluent-card fluent-stat-card">
  <div class="fluent-card-stat-content">
    <div class="fluent-card-stat-icon fluent-bg-primary-lighter">
      <i data-feather="users"></i>
    </div>
    <div class="fluent-card-stat-info">
      <p class="fluent-card-stat-title">تعداد کاربران</p>
      <h3 class="fluent-card-stat-value">
        1,254
        <span class="fluent-card-stat-change fluent-card-stat-change-up">
          <i data-feather="arrow-up"></i> 
          5.2%
        </span>
      </h3>
      <p class="fluent-card-stat-subtitle">نسبت به ماه گذشته</p>
    </div>
  </div>
</div>
```

### 4. فرم‌ها

فرم‌ها و ورودی‌ها با کلاس‌های مختلف ساخته می‌شوند:

```html
<!-- گروه فرم -->
<div class="fluent-form-group">
  <label class="fluent-label" for="username">نام کاربری</label>
  <input type="text" id="username" class="fluent-input" placeholder="نام کاربری خود را وارد کنید">
</div>

<!-- ورودی با آیکون -->
<div class="fluent-form-group">
  <label class="fluent-label" for="search">جستجو</label>
  <div class="fluent-input-with-icon">
    <i data-feather="search" class="fluent-input-icon"></i>
    <input type="text" id="search" class="fluent-input" placeholder="جستجو...">
  </div>
</div>

<!-- سلکت -->
<div class="fluent-form-group">
  <label class="fluent-label" for="country">کشور</label>
  <div class="fluent-select">
    <select id="country" name="country">
      <option value="">انتخاب کنید</option>
      <option value="iran">ایران</option>
      <option value="usa">آمریکا</option>
    </select>
  </div>
</div>

<!-- چک‌باکس -->
<div class="fluent-form-group">
  <label class="fluent-checkbox">
    <input type="checkbox" name="remember" id="remember">
    <span class="fluent-checkbox-checkmark"></span>
    <span class="fluent-checkbox-label">مرا به خاطر بسپار</span>
  </label>
</div>

<!-- رادیو باتن -->
<div class="fluent-form-group">
  <div class="fluent-radio-group">
    <label class="fluent-radio">
      <input type="radio" name="gender" value="male" checked>
      <span class="fluent-radio-mark"></span>
      <span class="fluent-radio-label">مرد</span>
    </label>
    <label class="fluent-radio">
      <input type="radio" name="gender" value="female">
      <span class="fluent-radio-mark"></span>
      <span class="fluent-radio-label">زن</span>
    </label>
  </div>
</div>

<!-- تکست اریا -->
<div class="fluent-form-group">
  <label class="fluent-label" for="message">پیام</label>
  <textarea id="message" class="fluent-textarea" rows="4" placeholder="پیام خود را وارد کنید"></textarea>
</div>

<!-- فرم با خطا -->
<div class="fluent-form-group">
  <label class="fluent-label" for="email">ایمیل</label>
  <input type="email" id="email" class="fluent-input error" value="invalid-email">
  <div class="fluent-form-error">ایمیل وارد شده معتبر نیست</div>
</div>
```

### 5. جدول‌ها

جدول‌ها با کلاس `fluent-table` و اجزای آن ساخته می‌شوند:

```html
<div class="fluent-table-container">
  <table class="fluent-table">
    <thead class="fluent-table-header">
      <tr>
        <th>نام</th>
        <th>سن</th>
        <th>شهر</th>
        <th class="fluent-table-sortable">تاریخ عضویت</th>
        <th>عملیات</th>
      </tr>
    </thead>
    <tbody>
      <tr class="fluent-table-row">
        <td class="fluent-table-cell">علی محمدی</td>
        <td class="fluent-table-cell">28</td>
        <td class="fluent-table-cell">تهران</td>
        <td class="fluent-table-cell">1402/04/15</td>
        <td class="fluent-table-cell">
          <div class="fluent-table-actions">
            <button class="fluent-btn fluent-btn-sm fluent-btn-primary">ویرایش</button>
            <button class="fluent-btn fluent-btn-sm fluent-btn-error">حذف</button>
          </div>
        </td>
      </tr>
      <tr class="fluent-table-row">
        <td class="fluent-table-cell">سارا احمدی</td>
        <td class="fluent-table-cell">32</td>
        <td class="fluent-table-cell">اصفهان</td>
        <td class="fluent-table-cell">1402/02/10</td>
        <td class="fluent-table-cell">
          <div class="fluent-table-actions">
            <button class="fluent-btn fluent-btn-sm fluent-btn-primary">ویرایش</button>
            <button class="fluent-btn fluent-btn-sm fluent-btn-error">حذف</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 6. دیالوگ‌ها

دیالوگ‌ها با کلاس `fluent-dialog-backdrop` و `fluent-dialog` ساخته می‌شوند و معمولاً با جاوااسکریپت کنترل می‌شوند:

```html
<!-- دکمه برای نمایش دیالوگ -->
<button class="fluent-btn fluent-btn-primary" data-toggle="dialog" data-target="myDialog">نمایش دیالوگ</button>

<!-- دیالوگ -->
<div id="myDialog" class="fluent-dialog-backdrop">
  <div class="fluent-dialog">
    <div class="fluent-dialog-header">
      <h3 class="fluent-dialog-title">عنوان دیالوگ</h3>
      <button class="fluent-dialog-close" data-dismiss="dialog" aria-label="بستن">
        <i data-feather="x"></i>
      </button>
    </div>
    <div class="fluent-dialog-body">
      محتوای دیالوگ
    </div>
    <div class="fluent-dialog-footer">
      <button class="fluent-btn" data-dismiss="dialog">انصراف</button>
      <button class="fluent-btn fluent-btn-primary">تایید</button>
    </div>
  </div>
</div>
```

برای نمایش دیالوگ تأییدیه می‌توانید از تابع `fluentConfirm` استفاده کنید:

```javascript
fluentConfirm({
  title: 'حذف کاربر',
  message: 'آیا از حذف این کاربر اطمینان دارید؟',
  confirmText: 'بله، حذف شود',
  cancelText: 'انصراف',
  confirmType: 'error',
  onConfirm: function() {
    // کد حذف کاربر
    console.log('کاربر حذف شد');
  },
  onCancel: function() {
    console.log('عملیات لغو شد');
  }
});
```

## لایه‌بندی صفحات

برای ایجاد صفحات مختلف، می‌توانید از الگوهای زیر استفاده کنید:

### 1. صفحه داشبورد

```html
<div class="fluent-dashboard-page">
  <!-- بخش خلاصه وضعیت -->
  <div class="fluent-dashboard-summary">
    <!-- کارت‌های آمار -->
  </div>
  
  <!-- بخش نمودارها -->
  <div class="fluent-dashboard-charts">
    <!-- کارت‌های نمودار -->
  </div>
  
  <!-- بخش جداول -->
  <div class="fluent-dashboard-tables">
    <!-- جداول و سایر اطلاعات -->
  </div>
</div>
```

### 2. صفحه لیست

```html
<div class="fluent-page">
  <!-- هدر صفحه -->
  <div class="fluent-page-header">
    <h2 class="fluent-page-title">لیست کاربران</h2>
    <div class="fluent-page-actions">
      <button class="fluent-btn fluent-btn-primary">
        <i data-feather="plus" class="fluent-btn-icon-left"></i>
        افزودن کاربر جدید
      </button>
    </div>
  </div>
  
  <!-- فیلترها -->
  <div class="fluent-card fluent-mb-4">
    <div class="fluent-card-body">
      <div class="fluent-table-filter-bar">
        <div class="fluent-input-with-icon fluent-table-filter-search">
          <i data-feather="search" class="fluent-input-icon"></i>
          <input type="text" class="fluent-input" placeholder="جستجو...">
        </div>
        <div class="fluent-table-filter-actions">
          <div class="fluent-select fluent-select-sm">
            <select>
              <option value="">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>
          <button class="fluent-btn fluent-btn-outline fluent-btn-sm">فیلتر پیشرفته</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- جدول اصلی -->
  <div class="fluent-card">
    <div class="fluent-table-container">
      <!-- جدول -->
    </div>
  </div>
</div>
```

### 3. صفحه فرم

```html
<div class="fluent-page">
  <!-- هدر صفحه -->
  <div class="fluent-page-header">
    <h2 class="fluent-page-title">ویرایش کاربر</h2>
    <div class="fluent-page-actions">
      <button class="fluent-btn fluent-btn-outline" onclick="history.back()">انصراف</button>
      <button type="submit" form="userForm" class="fluent-btn fluent-btn-primary">ذخیره تغییرات</button>
    </div>
  </div>
  
  <!-- فرم -->
  <div class="fluent-card">
    <div class="fluent-card-body">
      <form id="userForm">
        <!-- فیلدهای فرم -->
      </form>
    </div>
  </div>
</div>
```

## راهنمای فرم‌ها

برای ایجاد فرم‌های مختلف می‌توانید از الگوهای زیر استفاده کنید:

### 1. فرم ورود

```html
<div class="fluent-card">
  <div class="fluent-card-body">
    <form>
      <div class="fluent-form-group">
        <label class="fluent-label" for="username">نام کاربری</label>
        <div class="fluent-input-with-icon">
          <i data-feather="user" class="fluent-input-icon"></i>
          <input type="text" id="username" name="username" class="fluent-input" placeholder="نام کاربری خود را وارد کنید" required>
        </div>
      </div>
      
      <div class="fluent-form-group">
        <div class="fluent-label-with-link">
          <label class="fluent-label" for="password">رمز عبور</label>
          <a href="/forgot-password" class="fluent-link">فراموشی رمز عبور؟</a>
        </div>
        <div class="fluent-input-with-icon">
          <i data-feather="lock" class="fluent-input-icon"></i>
          <input type="password" id="password" name="password" class="fluent-input" placeholder="رمز عبور خود را وارد کنید" required>
        </div>
      </div>
      
      <div class="fluent-form-group">
        <label class="fluent-checkbox">
          <input type="checkbox" name="remember" id="remember">
          <span class="fluent-checkbox-checkmark"></span>
          <span class="fluent-checkbox-label">مرا به خاطر بسپار</span>
        </label>
      </div>
      
      <div class="fluent-form-group">
        <button type="submit" class="fluent-btn fluent-btn-primary fluent-btn-block">ورود</button>
      </div>
    </form>
  </div>
</div>
```

### 2. فرم چند ستونه

```html
<div class="fluent-card">
  <div class="fluent-card-body">
    <form>
      <div class="fluent-form-row">
        <div class="fluent-form-col">
          <div class="fluent-form-group">
            <label class="fluent-label" for="firstName">نام</label>
            <input type="text" id="firstName" name="firstName" class="fluent-input">
          </div>
        </div>
        <div class="fluent-form-col">
          <div class="fluent-form-group">
            <label class="fluent-label" for="lastName">نام خانوادگی</label>
            <input type="text" id="lastName" name="lastName" class="fluent-input">
          </div>
        </div>
      </div>
      
      <div class="fluent-form-group">
        <label class="fluent-label" for="email">ایمیل</label>
        <input type="email" id="email" name="email" class="fluent-input">
      </div>
      
      <div class="fluent-form-row">
        <div class="fluent-form-col">
          <div class="fluent-form-group">
            <label class="fluent-label" for="city">شهر</label>
            <input type="text" id="city" name="city" class="fluent-input">
          </div>
        </div>
        <div class="fluent-form-col">
          <div class="fluent-form-group">
            <label class="fluent-label" for="postalCode">کد پستی</label>
            <input type="text" id="postalCode" name="postalCode" class="fluent-input">
          </div>
        </div>
      </div>
      
      <div class="fluent-form-footer">
        <button type="submit" class="fluent-btn fluent-btn-primary">ثبت</button>
      </div>
    </form>
  </div>
</div>
```

## نکات مهم

1. **استفاده از آیکون‌ها**:
   - از کتابخانه `feather-icons` استفاده می‌شود.
   - برای استفاده از آیکون‌ها، از تگ `<i data-feather="نام-آیکون"></i>` استفاده کنید.
   - فراموش نکنید که در انتهای صفحه، تابع `feather.replace()` را فراخوانی کنید.

2. **واکنش‌گرایی**:
   - تمام کامپوننت‌ها برای صفحات موبایل و تبلت بهینه شده‌اند.
   - برای تست واکنش‌گرایی، از ابزارهای توسعه‌دهنده مرورگر استفاده کنید.

3. **حالت تاریک**:
   - برای فعال کردن حالت تاریک، کلاس `fluent-dark-theme` را به تگ `<body>` اضافه کنید.
   - می‌توانید با جاوااسکریپت، این کلاس را به صورت پویا اضافه یا حذف کنید.

4. **نمایش خطاها**:
   - برای نمایش خطاها در فرم‌ها، از کلاس `error` برای ورودی و کلاس `fluent-form-error` برای پیام خطا استفاده کنید.

5. **نمایش اعلان‌ها**:
   - برای نمایش اعلان‌ها (Toast)، از تابع `showToast` استفاده کنید:
   ```javascript
   showToast({
     title: 'عملیات موفق',
     message: 'اطلاعات با موفقیت ذخیره شد',
     type: 'success', // success, error, warning, info
     duration: 5000 // مدت زمان نمایش به میلی‌ثانیه
   });
   ```

## مثال‌های کاربردی

### 1. صفحه داشبورد

فایل نمونه `fluent-dashboard.ejs` ایجاد شده است که می‌توانید آن را به عنوان الگو برای ایجاد صفحه داشبورد استفاده کنید.

### 2. صفحه ورود

فایل نمونه `fluent-login.ejs` ایجاد شده است که می‌توانید آن را به عنوان الگو برای ایجاد صفحه ورود استفاده کنید.

### 3. قالب اصلی

فایل `fluent-main.ejs` در پوشه `layouts` ایجاد شده است که می‌توانید آن را به عنوان قالب اصلی برای تمام صفحات استفاده کنید.

## پشتیبانی و سوالات

در صورت داشتن هرگونه سوال یا نیاز به پشتیبانی، لطفاً با تیم توسعه به آدرس ایمیل [team@ccoin.ir](mailto:team@ccoin.ir) تماس بگیرید.

---

تهیه شده توسط تیم توسعه CCOIN - 1404