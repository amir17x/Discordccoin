# راهنمای آموزش و fine-tuning ربات CCoin با API Gemini

این راهنما به شما کمک می‌کند تا مدل هوش مصنوعی اختصاصی CCoin را با استفاده از Google Gemini API آموزش دهید.

## پیش‌نیازها

1. کلید API Gemini (از [Google AI Studio](https://ai.google.dev/))
2. Python 3.7 یا بالاتر
3. فایل‌های داده‌های آموزشی (`ccoin_ai_training_updated.csv` یا `ccoin_ai_training_updated.json`)

## روش‌های آموزش

### روش اول: استفاده از Google AI Studio (آسان‌تر)

1. به [Google AI Studio](https://ai.google.dev/) بروید و وارد حساب خود شوید
2. به بخش "Custom Models" یا "Tuning" بروید
3. روی "Create new tuned model" کلیک کنید
4. فایل `ccoin_ai_training_updated.json` را آپلود کنید
5. نام مدل را "CCoinAI" یا هر نام دلخواه دیگری قرار دهید
6. تنظیمات پیش‌فرض را بپذیرید و روی "Create" کلیک کنید
7. منتظر بمانید تا فرآیند آموزش تکمیل شود (معمولاً بین 30 دقیقه تا چند ساعت)

### روش دوم: استفاده از API و اسکریپت Python (پیشرفته‌تر)

1. مخزن را کلون کنید و وارد دایرکتوری پروژه شوید
2. پکیج‌های مورد نیاز را نصب کنید:
   ```bash
   pip install google-generativeai pandas
   ```
3. کلید API خود را در یک فایل `.env` قرار دهید:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. اسکریپت `ccoin_ai_tuning.py` را اجرا کنید:
   ```bash
   python ccoin_ai_tuning.py
   ```
5. اسکریپت به صورت خودکار داده‌های آموزشی را بارگیری کرده و فرآیند fine-tuning را آغاز می‌کند
6. پس از اتمام، اسکریپت چند پرسش آزمایشی را برای تست مدل اجرا می‌کند

## استفاده از مدل آموزش‌دیده در کد

```python
import os
import google.generativeai as genai
from dotenv import load_dotenv

# بارگیری متغیرهای محیطی
load_dotenv()

# تنظیم کلید API
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# شناسه مدل آموزش‌دیده شما (پس از آموزش به دست می‌آید)
model_name = "gemini-1.5-pro-001-tuned_YOUR_MODEL_ID"

# ایجاد نمونه مدل
model = genai.GenerativeModel(model_name)

# دریافت پاسخ از هوش مصنوعی
response = model.generate_content("سلام! CCoin چیست؟")
print(response.text)
```

## نکات مهم

1. **افزایش کیفیت مدل**: برای بهبود کیفیت، حداقل 100 نمونه آموزشی توصیه می‌شود. در حال حاضر، ما 30+ نمونه داریم.
2. **ساختار داده‌ها**: داده‌های آموزشی باید در ساختار کلید-مقدار باشند، جایی که:
   - `text_input`: سؤال یا درخواست کاربر
   - `output`: پاسخ مطلوب CCoinAI با فرمت‌بندی و ایموجی‌های مناسب
3. **فرمت‌بندی پاسخ‌ها**: تمام پاسخ‌ها با ایموجی‌های مرتبط، فرمت‌بندی مارک‌داون و اشاره به دستورات slash (مانند `</help:0>`) فرمت‌بندی شده‌اند.
4. **هزینه**: آموزش مدل Gemini ممکن است هزینه‌هایی داشته باشد. قیمت‌گذاری فعلی را در [Google AI Studio](https://ai.google.dev/) بررسی کنید.

## عیب‌یابی

- **خطای کلید API**: اطمینان حاصل کنید که کلید API معتبر است و دسترسی کافی به API Gemini دارد.
- **خطای فرمت داده**: از صحت فرمت فایل JSON یا CSV اطمینان حاصل کنید. داده‌ها باید دقیقاً مطابق با ساختار مورد انتظار باشند.
- **کیفیت پایین پاسخ‌ها**: اگر پاسخ‌های مدل کیفیت پایینی دارند، تعداد نمونه‌های آموزشی را افزایش دهید یا کیفیت نمونه‌های موجود را بهبود بخشید.

## منابع بیشتر

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Fine-tuning Gemini Models](https://ai.google.dev/docs/fine-tuning_overview)
- [سرور پشتیبانی CCoin](https://discord.gg/ccoin)

---

در صورت نیاز به کمک بیشتر، لطفاً با تیم توسعه CCoin تماس بگیرید.