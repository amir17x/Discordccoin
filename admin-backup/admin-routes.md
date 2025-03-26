# مسیرهای پنل مدیریت Ccoin

این فایل شامل تمام مسیرهای (Routes) پنل مدیریت Ccoin است. این مسیرها در فایل `server/admin.ts` تعریف شده‌اند.

## مسیرهای اصلی

- **GET /admin** - صفحه اصلی پنل مدیریت (ریدایرکت به /admin/dashboard یا /admin/login)
- **GET /admin/login** - صفحه ورود به پنل مدیریت
- **POST /admin/login** - پردازش فرم ورود
- **GET /admin/logout** - خروج از حساب کاربری
- **GET /admin/dashboard** - داشبورد اصلی مدیریت

## مدیریت کاربران

- **GET /admin/users** - لیست کاربران
- **GET /admin/users/:id** - مشاهده جزئیات کاربر
- **POST /admin/users/:id/update** - بروزرسانی اطلاعات کاربر
- **POST /admin/users/add-coins** - افزایش موجودی کاربر
- **GET /admin/users/:id/ban** - مسدودسازی کاربر
- **GET /admin/users/:id/unban** - رفع مسدودیت کاربر
- **GET /admin/users/:id/transactions** - مشاهده تراکنش‌های کاربر
- **GET /admin/users/:id/inventory** - مشاهده انبار کاربر
- **POST /admin/users/:id/add-item** - افزودن آیتم به کاربر
- **POST /admin/users/:id/remove-item** - حذف آیتم از انبار کاربر

## مدیریت ماموریت‌ها

- **GET /admin/quests** - لیست ماموریت‌ها
- **GET /admin/quests/create** - صفحه ایجاد ماموریت جدید
- **POST /admin/quests/create** - پردازش ایجاد ماموریت جدید
- **GET /admin/quests/:id** - مشاهده جزئیات ماموریت
- **GET /admin/quests/:id/edit** - صفحه ویرایش ماموریت
- **POST /admin/quests/:id/edit** - پردازش ویرایش ماموریت
- **GET /admin/quests/:id/delete** - حذف ماموریت

## مدیریت کلن‌ها

- **GET /admin/clans** - لیست کلن‌ها
- **POST /admin/clans/create** - ایجاد کلن جدید
- **GET /admin/clans/:id** - مشاهده جزئیات کلن
- **POST /admin/clans/:id/update** - بروزرسانی اطلاعات کلن
- **GET /admin/clans/:id/delete** - حذف کلن

## مدیریت آیتم‌ها

- **GET /admin/items** - لیست آیتم‌ها
- **GET /admin/items/create** - صفحه ایجاد آیتم جدید
- **POST /admin/items/create** - پردازش ایجاد آیتم جدید
- **GET /admin/items/:id** - مشاهده جزئیات آیتم
- **GET /admin/items/:id/edit** - صفحه ویرایش آیتم
- **POST /admin/items/:id/edit** - پردازش ویرایش آیتم
- **GET /admin/items/:id/delete** - حذف آیتم

## مدیریت دوستی‌ها و بلاک‌ها

- **GET /admin/friendships** - مدیریت دوستی‌ها
- **GET /admin/users/:id/friends** - مشاهده دوستان یک کاربر
- **GET /admin/blocked-users** - مدیریت کاربران بلاک شده
- **GET /admin/users/:id/blocked** - مشاهده کاربران بلاک شده توسط یک کاربر
- **POST /admin/unblock-user** - رفع بلاک یک کاربر (توسط ادمین)

## مدیریت چت‌ها

- **GET /admin/private-chats** - مدیریت چت‌های خصوصی
- **GET /admin/users/:id/chats** - مشاهده چت‌های خصوصی یک کاربر
- **GET /admin/chats/:id** - مشاهده یک چت خصوصی