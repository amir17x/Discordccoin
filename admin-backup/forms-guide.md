# راهنمای فرم‌های پنل مدیریت Ccoin

این راهنما به شما کمک می‌کند تا با انواع فرم‌های موجود در پنل مدیریت Ccoin آشنا شوید و نحوه استفاده صحیح از آن‌ها را بیاموزید.

## فرم‌های اصلی پنل مدیریت

### 1. فرم ورود (Login Form)
```html
<form id="login-form" action="/admin/login" method="POST">
  <div class="form-group">
    <label for="username">نام کاربری</label>
    <input type="text" class="form-control" id="username" name="username" required>
  </div>
  <div class="form-group">
    <label for="password">رمز عبور</label>
    <input type="password" class="form-control" id="password" name="password" required>
  </div>
  <button type="submit" class="btn btn-primary btn-block">ورود</button>
</form>
```

### 2. فرم افزایش موجودی (Add Coins Form)
```html
<form id="add-coins-form">
  <div class="form-group">
    <label for="coin-amount">مقدار (به Ccoin)</label>
    <input type="number" class="form-control" id="coin-amount" name="amount" min="1" required>
  </div>
  <div class="form-group">
    <label for="coin-to">مقصد</label>
    <select class="form-control" id="coin-to" name="destination">
      <option value="wallet">کیف پول</option>
      <option value="bank">حساب بانکی</option>
    </select>
  </div>
  <div class="form-group">
    <label for="coin-reason">دلیل</label>
    <textarea class="form-control" id="coin-reason" name="reason" rows="2"></textarea>
  </div>
</form>
```

### 3. فرم کاهش موجودی (Remove Coins Form)
```html
<form id="remove-coins-form">
  <div class="form-group">
    <label for="coin-amount">مقدار (به Ccoin)</label>
    <input type="number" class="form-control" id="coin-amount" name="amount" min="1" required>
  </div>
  <div class="form-group">
    <label for="coin-from">منبع</label>
    <select class="form-control" id="coin-from" name="source">
      <option value="wallet">کیف پول</option>
      <option value="bank">حساب بانکی</option>
    </select>
  </div>
  <div class="form-group">
    <label for="coin-reason">دلیل</label>
    <textarea class="form-control" id="coin-reason" name="reason" rows="2"></textarea>
  </div>
</form>
```

### 4. فرم افزودن آیتم (Add Item Form)
```html
<form id="add-item-form">
  <div class="form-group">
    <label for="item-id">انتخاب آیتم</label>
    <select class="form-control" id="item-id" name="itemId" required>
      <!-- آیتم‌ها از سرور بارگذاری می‌شوند -->
    </select>
  </div>
  <div class="form-group">
    <label for="item-quantity">تعداد</label>
    <input type="number" class="form-control" id="item-quantity" name="quantity" min="1" value="1" required>
  </div>
</form>
```

### 5. فرم مسدودسازی کاربر (Ban User Form)
```html
<form id="ban-user-form">
  <div class="form-group">
    <label for="ban-reason">دلیل مسدودسازی</label>
    <textarea class="form-control" id="ban-reason" name="reason" rows="3" required></textarea>
  </div>
</form>
```

### 6. فرم ایجاد ماموریت (Create Quest Form)
```html
<form id="create-quest-form" action="/admin/quests/create" method="POST">
  <div class="form-group">
    <label for="title">عنوان ماموریت</label>
    <input type="text" class="form-control" id="title" name="title" required>
  </div>
  <div class="form-group">
    <label for="description">توضیحات</label>
    <textarea class="form-control" id="description" name="description" rows="3"></textarea>
  </div>
  <div class="form-group">
    <label for="type">نوع ماموریت</label>
    <select class="form-control" id="type" name="type" required>
      <option value="daily">روزانه</option>
      <option value="weekly">هفتگی</option>
      <option value="special">ویژه</option>
    </select>
  </div>
  <div class="form-group">
    <label for="requirement">نیازمندی</label>
    <input type="text" class="form-control" id="requirement" name="requirement" required>
  </div>
  <div class="form-group">
    <label for="targetAmount">مقدار هدف</label>
    <input type="number" class="form-control" id="targetAmount" name="targetAmount" min="1" required>
  </div>
  <div class="form-group">
    <label for="reward">پاداش (Ccoin)</label>
    <input type="number" class="form-control" id="reward" name="reward" min="1" required>
  </div>
  <button type="submit" class="btn btn-primary">ایجاد ماموریت</button>
</form>
```

## نحوه پردازش فرم‌ها

### استفاده از JavaScript برای ارسال فرم‌ها

برای فرم‌های موجود در مودال‌ها، از فایل `user-actions.js` و `modal-confirmation-fix.js` استفاده می‌شود:

```javascript
// نمونه کد - ارسال فرم افزایش موجودی
function processAddCoinsForm(form, modal) {
  // بررسی اعتبار فرم
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // جمع‌آوری داده‌های فرم
  var formData = new FormData(form);
  var userId = modal.getAttribute('data-user-id');
  
  // ارسال درخواست به سرور
  $.ajax({
    url: '/admin/users/add-coins',
    type: 'POST',
    data: {
      userId: userId,
      amount: formData.get('amount'),
      destination: formData.get('destination'),
      reason: formData.get('reason')
    },
    success: function(response) {
      // بستن مودال و نمایش پیام موفقیت
      closeModal(modal);
      showNotification('موجودی کاربر با موفقیت افزایش یافت', 'success');
      // بروزرسانی صفحه
      setTimeout(function() {
        location.reload();
      }, 1000);
    },
    error: function(xhr) {
      // نمایش پیام خطا
      var message = 'خطا در افزایش موجودی';
      if (xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }
      showModalError(modal, message);
    }
  });
}
```

### بررسی اعتبار فرم‌ها (Validation)

برای بررسی اعتبار فرم‌ها، از HTML5 validation و بررسی‌های سمت کلاینت با JavaScript استفاده می‌شود:

```javascript
function validateForm(form) {
  // بررسی اعتبار HTML5
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }
  
  // بررسی‌های اضافی
  var amount = form.querySelector('#coin-amount').value;
  if (amount <= 0) {
    showModalError(form.closest('.modal'), 'مقدار باید بیشتر از صفر باشد');
    return false;
  }
  
  return true;
}
```

## نکات مهم در استفاده از فرم‌ها

### 1. شناسه‌های منحصر به فرد

اطمینان حاصل کنید که هر فرم دارای یک `id` منحصر به فرد است که در فایل‌های JavaScript به آن ارجاع داده می‌شود.

### 2. اعتبارسنجی درست

از ویژگی‌های اعتبارسنجی HTML5 مانند `required`، `min`، `max` و `pattern` استفاده کنید.

### 3. پیام‌های خطای مناسب

برای نمایش خطاها از تابع `showModalError` استفاده کنید و پیام‌های خطای واضح و دقیق نمایش دهید.

### 4. ارتباط با سرور

برای ارسال داده‌ها به سرور، از `$.ajax` یا `fetch` استفاده کنید و از صحت URL و پارامترهای ارسالی اطمینان حاصل کنید.

### 5. بروزرسانی رابط کاربری

پس از ارسال موفق فرم، رابط کاربری را بروزرسانی کنید تا تغییرات اعمال شده نمایش داده شوند.

## نمونه‌های بیشتر

برای مشاهده نمونه‌های بیشتر فرم‌ها و نحوه پیاده‌سازی آن‌ها، به فایل‌های زیر مراجعه کنید:

- `admin-panel/views/users/index.ejs` - فرم‌های مربوط به مدیریت کاربران
- `admin-panel/views/quests/create.ejs` - فرم ایجاد ماموریت جدید
- `admin-panel/views/items/create.ejs` - فرم ایجاد آیتم جدید
- `admin-panel/public/js/user-actions.js` - پردازش فرم‌های کاربری
- `admin-panel/public/js/modal-confirmation-fix.js` - پردازش فرم‌های مودال