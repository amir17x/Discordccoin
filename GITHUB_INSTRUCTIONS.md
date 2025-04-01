
# CCoinAI Initial Checkpoint

## فایل‌های آماده برای پوش به گیت‌هاب

1. **ccoin_ai_training_updated.csv** - فایل CSV داده‌های آموزشی با 30+ نمونه
2. **ccoin_ai_training_updated.json** - فایل JSON برای آپلود به Google AI Studio
3. **ccoin_ai_tuning.py** - اسکریپت Python برای آموزش مدل
4. **ccoin_ai_tuning_guide.md** - راهنمای کامل آموزش و پیاده‌سازی
5. **README_CCoinAI.md** - توضیحات اصلی پروژه

## دستورات گیت برای پوش به گیت‌هاب

```bash
# افزودن فایل‌ها به استیج
git add ccoin_ai_training_updated.csv ccoin_ai_training_updated.json ccoin_ai_tuning.py ccoin_ai_tuning_guide.md README_CCoinAI.md

# کامیت کردن تغییرات
git commit -m "Initial commit: CCoinAI training data and implementation guide"

# پوش کردن به مخزن گیت‌هاب
git push
```

## توضیحات محتوا

این مجموعه شامل داده‌های آموزشی و راهنمای پیاده‌سازی برای CCoinAI است - یک مدل هوش مصنوعی اختصاصی برای ربات CCoin که با استفاده از Gemini API آموزش داده می‌شود.

این مدل می‌تواند:
- به سؤالات مرتبط با ربات CCoin پاسخ دهد
- دستورات slash و کاربرد آن‌ها را توضیح دهد
- اطلاعات دقیق و جزئیات قابلیت‌های ربات را ارائه کند
- با سبکی جذاب و استفاده از ایموجی‌های مناسب، تجربه کاربری بهتری ایجاد کند

## نکات مهم

- فایل‌های CSV و JSON شامل داده‌های یکسان هستند، فقط فرمت آن‌ها متفاوت است
- برای بهترین نتیجه در آموزش، حداقل 100 نمونه توصیه می‌شود (در حال حاضر 30+ نمونه موجود است)
- این داده‌ها کاملاً مطابق با دستورات slash ربات CCoin طراحی شده‌اند
