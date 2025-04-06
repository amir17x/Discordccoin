# طرح پیاده‌سازی برای هماهنگ‌سازی پنل ادمین وب با دیسکورد

## مقدمه
این سند طرح پیاده‌سازی برای هماهنگ‌سازی پنل ادمین تحت وب با پنل ادمین دیسکورد (دستور `/admin`) است. هدف، ایجاد یک رابط کاربری منسجم و یکپارچه با بات دیسکورد است که همه قابلیت‌های موجود در پنل ادمین دیسکورد را در قالب یک پنل تحت وب با طراحی Fluent UI پیاده‌سازی می‌کند.

## بخش‌های اصلی پنل ادمین دیسکورد

بر اساس بررسی کد، پنل ادمین دیسکورد دارای این بخش‌های اصلی است:

1. **مدیریت اقتصاد** (`admin_economy`) - مدیریت سکه‌ها، نرخ سود، مالیات و...
2. **مدیریت کاربران** (`admin_users`) - جستجو، مسدودسازی، ریست و مشاهده کاربران
3. **مدیریت آیتم‌ها** (`admin_items`) - افزودن، ویرایش، حذف و مشاهده آیتم‌های فروشگاه
4. **مدیریت ماموریت‌ها** (`admin_quests`) - مدیریت ماموریت‌ها و چالش‌ها
5. **مدیریت کلن‌ها** (`admin_clans`) - مدیریت کلن‌ها و گروه‌ها
6. **آمار ربات** (`admin_stats`) - مشاهده آمار و اطلاعات کلی سیستم
7. **تنظیمات** (`admin_settings`) - تنظیمات کلی، اقتصاد، بازی‌ها، کلن‌ها و...
8. **اطلاع‌رسانی** (`admin_broadcast`) - ارسال پیام و اطلاعیه به کاربران
9. **پشتیبان‌گیری** (`admin_backup`) - مدیریت نسخه‌های پشتیبان
10. **تنظیمات هوش مصنوعی** (`aiSettingsMenu`) - مدیریت هوش مصنوعی CCoin AI

## زیرمنوهای تنظیمات

بخش تنظیمات خود دارای زیرمنوهای متعددی است:

1. **تنظیمات عمومی** (`generalSettingsMenu`)
2. **تنظیمات اقتصادی** (`economySettingsMenu`)
3. **تنظیمات بازی‌ها** (`gamesSettingsMenu`)
4. **تنظیمات کلن‌ها** (`clansSettingsMenu`)
5. **تنظیمات سطح‌بندی** (`levelsSettingsMenu`)
6. **تنظیمات هوش مصنوعی** (`aiSettingsMenu`)

## طرح پیاده‌سازی

### 1. به‌روزرسانی ساختار منو

منوهای سایدبار باید با بخش‌های پنل ادمین دیسکورد هماهنگ باشند. این شامل:

- افزودن بخش مدیریت ماموریت‌ها (Quests)
- افزودن بخش مدیریت کلن‌ها (Clans)
- افزودن بخش آمار ربات (Stats)
- افزودن بخش اطلاع‌رسانی (Broadcast)
- افزودن بخش پشتیبان‌گیری (Backup)
- افزودن بخش تنظیمات هوش مصنوعی (AI Settings)

### 2. ایجاد صفحات و کنترلرهای جدید

برای هر بخش، یک فایل قالب EJS و یک متد کنترلر می‌سازیم:

- `fluentController.js` - کنترلر اصلی با متدهای نمایش و پردازش هر صفحه
- `views/fluent/quests.ejs` - صفحه مدیریت ماموریت‌ها
- `views/fluent/clans.ejs` - صفحه مدیریت کلن‌ها
- `views/fluent/stats.ejs` - صفحه آمار ربات
- `views/fluent/broadcast.ejs` - صفحه اطلاع‌رسانی
- `views/fluent/backup.ejs` - صفحه پشتیبان‌گیری
- `views/fluent/ai-settings.ejs` - صفحه تنظیمات هوش مصنوعی

### 3. به‌روزرسانی مسیرها

اضافه کردن مسیرهای جدید در `routes/fluent.js`:

```javascript
// مسیرهای جدید
router.get('/quests', checkAuth, fluentController.showQuests);
router.get('/clans', checkAuth, fluentController.showClans);
router.get('/stats', checkAuth, fluentController.showStats);
router.get('/broadcast', checkAuth, fluentController.showBroadcast);
router.get('/backup', checkAuth, fluentController.showBackup);
router.get('/ai-settings', checkAuth, fluentController.showAISettings);
```

### 4. اضافه کردن API‌های همگام‌سازی

برای تضمین همگام‌سازی بین پنل وب و دیسکورد، API‌های زیر را پیاده‌سازی می‌کنیم:

```javascript
// API های همگام‌سازی با دیسکورد
router.post('/api/economy/add-coins', checkAuth, fluentController.addCoins);
router.post('/api/economy/remove-coins', checkAuth, fluentController.removeCoins);
router.post('/api/items/add', checkAuth, fluentController.addItem);
router.post('/api/items/edit/:id', checkAuth, fluentController.editItem);
router.post('/api/items/delete/:id', checkAuth, fluentController.deleteItem);
router.post('/api/broadcast/send', checkAuth, fluentController.sendBroadcast);
router.post('/api/settings/update', checkAuth, fluentController.updateSettings);
```

### 5. ایجاد سرویس‌های جدید

ایجاد سرویس‌های لازم برای دسترسی به مدل‌های دیگر در `services/mongoService.js`:

```javascript
// دریافت ماموریت‌ها
export async function getQuests() { ... }

// دریافت کلن‌ها
export async function getClans() { ... }

// دریافت آمار ربات
export async function getBotStats() { ... }

// ارسال پیام به کاربران
export async function sendBroadcastMessage() { ... }

// مدیریت نسخه‌های پشتیبان
export async function createBackup() { ... }
export async function restoreBackup() { ... }

// تنظیمات هوش مصنوعی
export async function getAISettings() { ... }
export async function updateAISettings() { ... }
```

### 6. استفاده از Fluent UI برای طراحی

هر صفحه باید با Fluent UI طراحی شود و برای عملکرد خاص خود بهینه شود:

- صفحه ماموریت‌ها: کارت‌های ماموریت با آیکون‌های مناسب
- صفحه کلن‌ها: جدول‌های کلن و اعضا با امکان فیلتر و جستجو
- صفحه آمار: نمودارها و کارت‌های آماری با Chart.js
- صفحه اطلاع‌رسانی: فرم ساختارمند برای ارسال پیام
- صفحه پشتیبان‌گیری: مدیریت فایل‌ها با امکان آپلود و دانلود
- صفحه تنظیمات هوش مصنوعی: تنظیمات پیشرفته با شخصی‌سازی

### 7. ارتباط با Discord API

برای هماهنگی کامل، باید سرویسی ایجاد کنیم که با API دیسکورد ارتباط برقرار کند:

```javascript
// سرویس ارتباط با دیسکورد
export async function sendDiscordCommand(command, data) {
  // ارسال دستور به بات دیسکورد
}
```

### 8. همگام‌سازی داده‌ها

برای اطمینان از همگام‌سازی دو طرفه:

1. **Webhook**: دیسکورد بات باید تغییرات را به پنل وب اطلاع دهد
2. **Socket.IO**: ارتباط زنده برای دریافت تغییرات بلادرنگ
3. **ذخیره‌سازی مشترک**: هر دو سیستم از یک پایگاه داده استفاده می‌کنند

## زمان‌بندی

1. **فاز 1**: ایجاد منوی کامل و صفحات خالی - 1 روز
2. **فاز 2**: پیاده‌سازی صفحات و API‌های اصلی - 3 روز
3. **فاز 3**: همگام‌سازی با دیسکورد - 2 روز
4. **فاز 4**: تست و رفع اشکال - 1 روز

## نتیجه نهایی

پنل ادمین وب کاملاً با دیسکورد هماهنگ خواهد بود، به طوری که مدیران سیستم می‌توانند از هر دو پلتفرم برای مدیریت استفاده کنند و تغییرات در یک پلتفرم بلافاصله در پلتفرم دیگر منعکس می‌شود.