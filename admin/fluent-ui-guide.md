# راهنمای استفاده از Fluent UI در پنل مدیریت CCOIN

این راهنما به شما کمک می‌کند تا نحوه استفاده از سیستم طراحی Fluent UI در پنل مدیریت CCOIN را یاد بگیرید.

## فهرست مطالب

1. [مقدمه](#مقدمه)
2. [نحوه فعال‌سازی رابط کاربری Fluent](#نحوه-فعال‌سازی-رابط-کاربری-fluent)
3. [ساختار فایل‌ها](#ساختار-فایل‌ها)
4. [کامپوننت‌های اصلی](#کامپوننت‌های-اصلی)
5. [نحوه ایجاد صفحات جدید](#نحوه-ایجاد-صفحات-جدید)
6. [نکات مهم](#نکات-مهم)

## مقدمه

سیستم طراحی Fluent UI یک سیستم طراحی منعطف و مدرن است که توسط مایکروسافت ایجاد شده است. در پنل مدیریت CCOIN، ما یک پیاده‌سازی سفارشی از این سیستم طراحی را ایجاد کرده‌ایم که با نیازهای پروژه ما مطابقت دارد.

## نحوه فعال‌سازی رابط کاربری Fluent

برای فعال‌سازی رابط کاربری Fluent، متغیر `USE_FLUENT_UI` را در فایل `.env` برابر با `true` قرار دهید:

```
USE_FLUENT_UI=true
```

## ساختار فایل‌ها

فایل‌های مربوط به Fluent UI در مسیرهای زیر قرار دارند:

- **استایل‌ها:** `admin/public/css/fluent.css`
- **اسکریپت‌ها:** `admin/public/js/fluent-ui.js`
- **قالب اصلی:** `admin/views/layouts/fluent-main.ejs`
- **قالب‌های صفحات:** فایل‌هایی که با پیشوند `fluent-` در پوشه `admin/views` قرار دارند

## کامپوننت‌های اصلی

### دکمه‌ها (Buttons)

دکمه‌های Fluent UI در چند نوع مختلف ارائه شده‌اند:

```html
<!-- دکمه اصلی -->
<button class="fluent-button primary">دکمه اصلی</button>

<!-- دکمه ثانویه -->
<button class="fluent-button">دکمه ثانویه</button>

<!-- دکمه خنثی -->
<button class="fluent-button neutral">دکمه خنثی</button>

<!-- دکمه خطر -->
<button class="fluent-button danger">دکمه خطر</button>

<!-- دکمه آیکون -->
<button class="fluent-icon-button"><i class="fa-solid fa-search"></i></button>
```

### فرم‌ها (Forms)

کامپوننت‌های فرم شامل:

```html
<!-- گروه فرم -->
<div class="fluent-form-group">
    <label class="fluent-label" for="username">نام کاربری</label>
    <input class="fluent-input" type="text" id="username" name="username" />
</div>

<!-- چک باکس -->
<div class="fluent-checkbox">
    <input type="checkbox" id="remember" name="remember" />
    <label for="remember">مرا به خاطر بسپار</label>
</div>

<!-- رادیو باتن -->
<div class="fluent-radio">
    <input type="radio" id="option1" name="options" value="1" />
    <label for="option1">گزینه ۱</label>
</div>

<!-- کادر انتخاب -->
<select class="fluent-select" name="category">
    <option value="">انتخاب کنید</option>
    <option value="1">دسته ۱</option>
    <option value="2">دسته ۲</option>
</select>

<!-- دکمه فرم -->
<button type="submit" class="fluent-button primary">ارسال</button>
```

### کارت‌ها (Cards)

```html
<div class="fluent-card">
    <div class="fluent-card-header">
        <h2 class="fluent-card-title">عنوان کارت</h2>
    </div>
    <div class="fluent-card-content">
        <p>محتوای کارت در اینجا قرار می‌گیرد...</p>
    </div>
    <div class="fluent-card-footer">
        <button class="fluent-button">مشاهده جزئیات</button>
    </div>
</div>
```

### جدول‌ها (Tables)

```html
<div class="fluent-table-container">
    <table class="fluent-table">
        <thead>
            <tr>
                <th>ردیف</th>
                <th>نام کاربری</th>
                <th>ایمیل</th>
                <th>وضعیت</th>
                <th>عملیات</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>۱</td>
                <td>user1</td>
                <td>user1@example.com</td>
                <td><span class="fluent-badge success">فعال</span></td>
                <td>
                    <div class="fluent-action-buttons">
                        <button class="fluent-icon-button small"><i class="fa-solid fa-edit"></i></button>
                        <button class="fluent-icon-button small danger"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

### اعلان‌ها (Alerts)

```html
<!-- اعلان موفقیت -->
<div class="fluent-alert success">
    <i class="fa-solid fa-check-circle"></i>
    عملیات با موفقیت انجام شد.
</div>

<!-- اعلان خطا -->
<div class="fluent-alert error">
    <i class="fa-solid fa-exclamation-circle"></i>
    خطایی رخ داده است.
</div>

<!-- اعلان اطلاعات -->
<div class="fluent-alert info">
    <i class="fa-solid fa-info-circle"></i>
    اطلاعات مهم.
</div>

<!-- اعلان هشدار -->
<div class="fluent-alert warning">
    <i class="fa-solid fa-exclamation-triangle"></i>
    هشدار!
</div>
```

### نشان‌ها (Badges)

```html
<span class="fluent-badge">پیش‌فرض</span>
<span class="fluent-badge primary">اصلی</span>
<span class="fluent-badge success">موفقیت</span>
<span class="fluent-badge warning">هشدار</span>
<span class="fluent-badge danger">خطر</span>
<span class="fluent-badge info">اطلاعات</span>
```

### تب‌ها (Tabs)

```html
<div class="fluent-tabs">
    <div class="fluent-tab-buttons">
        <button class="fluent-tab-button active" data-tab="tab1">تب ۱</button>
        <button class="fluent-tab-button" data-tab="tab2">تب ۲</button>
        <button class="fluent-tab-button" data-tab="tab3">تب ۳</button>
    </div>
    
    <div class="fluent-tab-content">
        <div class="fluent-tab-panel active" id="tab1">
            <p>محتوای تب ۱</p>
        </div>
        <div class="fluent-tab-panel" id="tab2">
            <p>محتوای تب ۲</p>
        </div>
        <div class="fluent-tab-panel" id="tab3">
            <p>محتوای تب ۳</p>
        </div>
    </div>
</div>
```

### نمودارها (Charts)

برای رسم نمودار از کتابخانه Chart.js استفاده می‌کنیم:

```html
<div class="fluent-chart-container">
    <canvas id="myChart"></canvas>
</div>

<script>
    // تنظیم نمودار با استفاده از Chart.js
    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
            datasets: [{
                label: 'فروش',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: 'rgb(0, 120, 212)',
                backgroundColor: 'rgba(0, 120, 212, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
</script>
```

## نحوه ایجاد صفحات جدید

برای ایجاد یک صفحه جدید با رابط کاربری Fluent، مراحل زیر را دنبال کنید:

1. یک فایل EJS جدید با پیشوند `fluent-` در پوشه `admin/views` ایجاد کنید. مثلاً `fluent-users.ejs`

2. در کنترلر مربوطه، از قالب Fluent UI استفاده کنید:

```javascript
// در کنترلر
export async function showUsers(req, res) {
  try {
    // دریافت داده‌ها
    const users = await userService.getAllUsers();
    
    // آماده‌سازی داده‌ها برای نمایش
    const viewData = {
      title: 'کاربران',
      users
    };
    
    // استفاده از قالب Fluent UI
    if (process.env.USE_FLUENT_UI === 'true') {
      viewData.layout = 'layouts/fluent-main';
      res.render('fluent-users', viewData);
    } else {
      res.render('users/index', viewData);
    }
  } catch (error) {
    console.error('❌ خطا در نمایش کاربران:', error);
    // پردازش خطا
  }
}
```

3. محتوای صفحه را با استفاده از کامپوننت‌های Fluent UI ایجاد کنید.

## نکات مهم

1. **سازگاری با مرورگرها:** رابط کاربری Fluent UI با مرورگرهای مدرن سازگار است.

2. **پاسخگویی:** تمام کامپوننت‌های Fluent UI به صورت پاسخگو (Responsive) طراحی شده‌اند.

3. **استفاده از آیکون‌ها:** برای آیکون‌ها از Font Awesome استفاده می‌کنیم.

4. **نامگذاری کلاس‌ها:** تمام کلاس‌های CSS با پیشوند `fluent-` نامگذاری شده‌اند.

5. **جهت RTL:** رابط کاربری Fluent UI به طور کامل از جهت راست به چپ (RTL) پشتیبانی می‌کند.

---

در صورت نیاز به راهنمایی بیشتر، لطفاً با تیم توسعه تماس بگیرید.