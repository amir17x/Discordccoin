# سیستم طراحی مایکروسافت فلوئنت UI

این پوشه شامل فایل‌های CSS سیستم طراحی مایکروسافت فلوئنت UI است که برای پنل مدیریت CCOIN بازطراحی شده است.

## ساختار فایل‌ها

```
fluent-ui/
├── components/          # کامپوننت‌های منفرد
│   ├── buttons.css      # دکمه‌ها و عناصر قابل کلیک
│   ├── cards.css        # کارت‌ها و کانتینرها
│   ├── dialogs.css      # دیالوگ‌ها، مدال‌ها و پاپ‌آپ‌ها
│   ├── forms.css        # فرم‌ها، ورودی‌ها و کنترل‌ها
│   ├── navigation.css   # منوها، نوارها و عناصر ناوبری
│   └── tables.css       # جداول و عناصر نمایش داده
├── fluent-ui.css        # فایل اصلی که همه کامپوننت‌ها را واکشی می‌کند
├── fluent-variables.css # متغیرهای CSS، رنگ‌ها، فونت‌ها و مقادیر پایه
└── README.md            # این فایل
```

## نحوه استفاده

برای استفاده از سیستم طراحی فلوئنت UI، کافی است فایل `fluent-ui.css` را در لایوت اصلی خود وارد کنید:

```html
<link rel="stylesheet" href="/admin/public/css/fluent-ui/fluent-ui.css">
```

## کامپوننت‌های پایه

### ساختار صفحه

برای ساختار اصلی صفحه از کلاس‌های زیر استفاده کنید:

```html
<div class="fluent-app">
  <!-- منوی کناری -->
  <aside class="fluent-nav" id="mainSidebar">
    <!-- محتوای منو -->
  </aside>
  
  <div class="fluent-main">
    <!-- هدر -->
    <header class="fluent-header">
      <!-- محتوای هدر -->
    </header>
    
    <!-- محتوای اصلی -->
    <main class="fluent-content">
      <!-- محتوای صفحه -->
    </main>
  </div>
</div>
```

### دکمه‌ها

انواع مختلف دکمه‌ها:

```html
<!-- دکمه اصلی -->
<button class="fluent-btn fluent-btn-primary">دکمه اصلی</button>

<!-- دکمه ثانویه -->
<button class="fluent-btn fluent-btn-secondary">دکمه ثانویه</button>

<!-- دکمه نامحسوس -->
<button class="fluent-btn fluent-btn-subtle">دکمه نامحسوس</button>

<!-- دکمه خطوط بیرونی -->
<button class="fluent-btn fluent-btn-outline">دکمه خطوط بیرونی</button>

<!-- دکمه خطر -->
<button class="fluent-btn fluent-btn-danger">دکمه خطر</button>

<!-- دکمه آیکون‌دار -->
<button class="fluent-btn fluent-btn-with-icon">
  <i class="fas fa-plus"></i>
  دکمه آیکون‌دار
</button>

<!-- دکمه فقط آیکون -->
<button class="fluent-btn fluent-btn-icon fluent-btn-primary">
  <i class="fas fa-plus"></i>
</button>

<!-- دکمه با سایزهای مختلف -->
<button class="fluent-btn fluent-btn-primary fluent-btn-sm">دکمه کوچک</button>
<button class="fluent-btn fluent-btn-primary">دکمه متوسط</button>
<button class="fluent-btn fluent-btn-primary fluent-btn-lg">دکمه بزرگ</button>
```

### کارت‌ها

انواع مختلف کارت‌ها:

```html
<!-- کارت ساده -->
<div class="fluent-card fluent-p-4">
  <h3>عنوان کارت</h3>
  <p>محتوای کارت در اینجا قرار می‌گیرد.</p>
</div>

<!-- کارت با هدر و فوتر -->
<div class="fluent-card fluent-p-0">
  <div class="fluent-card-header">
    <h3 class="fluent-card-title">عنوان کارت</h3>
  </div>
  <div class="fluent-card-body">
    محتوای کارت در اینجا قرار می‌گیرد.
  </div>
  <div class="fluent-card-footer">
    <button class="fluent-btn fluent-btn-subtle">لغو</button>
    <button class="fluent-btn fluent-btn-primary">تایید</button>
  </div>
</div>
```

### فرم‌ها

انواع مختلف فرم‌ها:

```html
<!-- فیلد متنی -->
<div class="fluent-form-field">
  <label class="fluent-form-label">نام کاربری</label>
  <input type="text" class="fluent-input" placeholder="نام کاربری خود را وارد کنید">
  <span class="fluent-form-hint">نام کاربری باید حداقل 3 کاراکتر باشد</span>
</div>

<!-- فیلد با آیکون -->
<div class="fluent-form-field">
  <label class="fluent-form-label">ایمیل</label>
  <div class="fluent-input-with-icon">
    <span class="fluent-input-icon">
      <i class="fas fa-envelope"></i>
    </span>
    <input type="text" class="fluent-input" placeholder="ایمیل خود را وارد کنید">
  </div>
</div>

<!-- چک‌باکس -->
<div class="fluent-checkbox-field">
  <label class="fluent-checkbox">
    <input type="checkbox" class="fluent-checkbox-input">
    <span class="fluent-checkbox-box"></span>
    <span class="fluent-checkbox-label">مرا به خاطر بسپار</span>
  </label>
</div>

<!-- رادیو باتن -->
<div class="fluent-radio-group">
  <div class="fluent-radio-field">
    <label class="fluent-radio">
      <input type="radio" name="option" class="fluent-radio-input" checked>
      <span class="fluent-radio-circle"></span>
      <span class="fluent-radio-label">گزینه اول</span>
    </label>
  </div>
  <div class="fluent-radio-field">
    <label class="fluent-radio">
      <input type="radio" name="option" class="fluent-radio-input">
      <span class="fluent-radio-circle"></span>
      <span class="fluent-radio-label">گزینه دوم</span>
    </label>
  </div>
</div>

<!-- سوئیچ -->
<div class="fluent-switch-field">
  <label class="fluent-switch">
    <input type="checkbox" class="fluent-switch-input">
    <span class="fluent-switch-slider"></span>
  </label>
  <span class="fluent-switch-label">فعال‌سازی ویژگی</span>
</div>
```

### جداول

```html
<div class="fluent-table-container">
  <table class="fluent-table">
    <thead>
      <tr>
        <th>نام</th>
        <th>ایمیل</th>
        <th>تاریخ ثبت‌نام</th>
        <th>عملیات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>علی محمدی</td>
        <td>ali@example.com</td>
        <td>1402/04/15</td>
        <td>
          <div class="fluent-table-row-actions">
            <button class="fluent-table-row-action" title="ویرایش">
              <i class="fas fa-edit"></i>
            </button>
            <button class="fluent-table-row-action fluent-table-row-action-danger" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
      <!-- ردیف‌های دیگر -->
    </tbody>
  </table>
</div>
```

### دیالوگ‌ها

```html
<!-- دیالوگ معمولی -->
<div class="fluent-modal-backdrop">
  <div class="fluent-dialog">
    <div class="fluent-dialog-header">
      <h3 class="fluent-dialog-title">عنوان دیالوگ</h3>
      <button class="fluent-dialog-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="fluent-dialog-content">
      محتوای دیالوگ در اینجا قرار می‌گیرد.
    </div>
    <div class="fluent-dialog-footer">
      <button class="fluent-btn fluent-btn-subtle">لغو</button>
      <button class="fluent-btn fluent-btn-primary">تایید</button>
    </div>
  </div>
</div>
```

## کلاس‌های کمکی

سیستم طراحی فلوئنت UI شامل مجموعه‌ای از کلاس‌های کمکی برای رنگ متن، حاشیه، پدینگ، فلکس‌باکس و... است:

### فاصله‌گذاری

```html
<!-- مارجین -->
<div class="fluent-m-0">بدون مارجین</div>
<div class="fluent-mt-2">مارجین بالا</div>
<div class="fluent-mb-4">مارجین پایین</div>
<div class="fluent-mx-3">مارجین افقی</div>

<!-- پدینگ -->
<div class="fluent-p-0">بدون پدینگ</div>
<div class="fluent-pt-2">پدینگ بالا</div>
<div class="fluent-pb-4">پدینگ پایین</div>
<div class="fluent-px-3">پدینگ افقی</div>
```

### فلکس‌باکس

```html
<!-- فلکس معمولی -->
<div class="fluent-flex">
  <div>آیتم 1</div>
  <div>آیتم 2</div>
</div>

<!-- فلکس با ترازبندی -->
<div class="fluent-flex fluent-align-center fluent-justify-between">
  <div>سمت راست</div>
  <div>سمت چپ</div>
</div>
```

### رنگ و پس‌زمینه

```html
<!-- رنگ متن -->
<p class="fluent-text-primary">متن اصلی</p>
<p class="fluent-text-secondary">متن ثانویه</p>
<p class="fluent-text-brand">متن برند</p>

<!-- پس‌زمینه -->
<div class="fluent-bg-primary">پس‌زمینه اصلی</div>
<div class="fluent-bg-surface">پس‌زمینه سطح</div>
<div class="fluent-bg-subtle">پس‌زمینه نامحسوس</div>
```

## اصول طراحی

هنگام استفاده از این سیستم طراحی، اصول زیر را دنبال کنید:

1. **سادگی**: از شلوغی بیش از حد رابط کاربری خودداری کنید.
2. **سلسله مراتب بصری**: اطلاعات مهم‌تر باید برجسته‌تر باشند.
3. **فاصله‌گذاری**: از فضای سفید به طور مؤثر استفاده کنید.
4. **ثبات**: المان‌های مشابه باید ظاهر و رفتار مشابه داشته باشند.
5. **پاسخگویی**: رابط کاربری باید در همه دستگاه‌ها به خوبی نمایش داده شود.

## سازگاری مرورگر

این سیستم طراحی با مرورگرهای مدرن زیر سازگار است:
- Edge (نسخه‌های اخیر)
- Chrome (نسخه‌های اخیر)
- Firefox (نسخه‌های اخیر)
- Safari (نسخه‌های اخیر)
- Opera (نسخه‌های اخیر)