# راهنمای استفاده از فایل‌های CCoinAI برای گیت‌هاب

## حل مشکل کدگذاری UTF-8 در فایل CSV

مشکلی که در نمایش فایل CSV مشاهده کردید، به دلیل عدم تشخیص صحیح کدگذاری UTF-8 توسط مرورگر است. برای حل این مشکل، می‌توانید از یکی از روش‌های زیر استفاده کنید:

### روش اول: استفاده از فایل CSV با BOM (Byte Order Mark)

فایل `ccoin_ai_training_updated_bom.csv` با نشانگر BOM ایجاد شده است. این نشانگر به مرورگرها و نرم‌افزارها کمک می‌کند تا تشخیص دهند که فایل با کدگذاری UTF-8 است:

```bash
# برای استفاده از این فایل در گیت‌هاب
git add ccoin_ai_training_updated_bom.csv
git commit -m "Add CSV with BOM for correct UTF-8 display"
git push
```

### روش دوم: استفاده از فایل JSON

فایل JSON معمولاً مشکلات کمتری در نمایش دارد. می‌توانید از `ccoin_ai_training_updated.json` استفاده کنید:

```bash
# برای استفاده از فایل JSON
git add ccoin_ai_training_updated.json
git commit -m "Add JSON format of training data"
git push
```

### روش سوم: تبدیل به Excel/XLSX

برای کاربران غیرفنی، تبدیل به فرمت Excel مناسب‌تر است:

1. فایل CSV را در Excel باز کنید
2. مطمئن شوید که کدگذاری UTF-8 به درستی تشخیص داده شده است
3. ذخیره به فرمت XLSX
4. فایل XLSX را در گیت‌هاب آپلود کنید

## نکات مهم استفاده از داده‌های آموزشی

1. **فایل JSON برای آپلود مستقیم**: برای آپلود به Google AI Studio، از فایل JSON استفاده کنید
2. **مشکلات کدگذاری**: اگر در زمان آموزش مدل مشکلات کدگذاری دیدید، فایل را با BOM ذخیره کنید
3. **مدیریت فایل‌های بزرگ**: در صورت افزایش حجم داده‌های آموزشی، از ابزارهای مدیریت فایل بزرگ گیت (Git LFS) استفاده کنید
4. **راهنمای آموزش**: مطالعه فایل `ccoin_ai_tuning_guide.md` برای جزئیات بیشتر در مورد نحوه آموزش مدل الزامی است