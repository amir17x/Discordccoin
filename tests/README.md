# ساختار تست‌های Ccoin

این پوشه شامل تست‌های مختلف برای بخش‌های مختلف ربات Ccoin است. هر بخش در پوشه‌ای جداگانه قرار گرفته است.

## ساختار پوشه‌ها

### `/ai-services`
تست‌های مربوط به سرویس‌های هوش مصنوعی CCOIN AI (بر پایه Gemini و دیگر سرویس‌ها).
- `simpler_test_gemini.js`: تست ساده برای API Gemini
- `test_gemini.js`: تست‌های اصلی برای سرویس Gemini
- `test_gemini_alt_service.js`: تست سرویس جایگزین Gemini
- `test_gemini_image_fix.js`: تست رفع باگ تصاویر در Gemini
- `test_gemini_sdk_fix.js`: تست رفع مشکلات SDK
- `test_gemini_updated.js`: نسخه به‌روزرسانی شده تست‌های Gemini
- `test_google_genai.js`: تست SDK رسمی Google Generative AI
- `test_googleai_sdk.js`: تست کتابخانه SDK GoogleAI
- `test_vertexai.js`: تست سرویس VertexAI
- `test_vertex_ai_direct.js`: تست اتصال مستقیم به VertexAI
- `test_vertex_sdk.js`: تست SDK VertexAI

### `/economy`
تست‌های مربوط به سیستم اقتصادی ربات.
- `test_economy.js`: تست‌های اصلی سیستم اقتصادی
- `test_economy_fix.js`: تست‌های رفع باگ‌های سیستم اقتصادی

### `/verification`
اسکریپت‌های تأیید و اعتبارسنجی عملکردها.
- `verify_storage_functions.js`: اعتبارسنجی توابع ذخیره‌سازی
- `verification_script.js`: اسکریپت‌های تأیید عملکردها

### `/temp`
فایل‌های موقت و آزمایشی که هنوز در حال توسعه هستند.
- `temp_aiSettingsMenu.ts`: منوی تنظیمات هوش مصنوعی (نسخه موقت)

### `/ai-assistants`
تست‌های مربوط به دستیار هوش مصنوعی بات.
- `test_ai_assistant.js`: تست قابلیت‌های دستیار هوش مصنوصی

## راهنمای اجرای تست‌ها

برای اجرای تست‌ها، دستور زیر را در ترمینال وارد کنید:

```bash
node tests/path/to/test.js
```

برای مثال:

```bash
node tests/ai-services/simpler_test_gemini.js
```

توجه: برای اجرای برخی تست‌ها نیاز به تنظیم متغیرهای محیطی مانند `GOOGLE_AI_API_KEY` دارید. اطمینان حاصل کنید که فایل `.env` به درستی تنظیم شده باشد.