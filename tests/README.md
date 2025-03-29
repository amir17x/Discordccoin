# سیستم تست CCOIN BOT

این پوشه شامل اسکریپت‌های تست برای بخش‌های مختلف ربات CCOIN است.

## ساختار پوشه‌های تست

- `ai-services`: تست‌های مربوط به سرویس‌های هوش مصنوعی (CCOIN AI)
- `vertex-ai`: تست‌های مربوط به Google Vertex AI
- `economy`: تست‌های سیستم اقتصادی ربات
- `other`: سایر تست‌ها

## نحوه اجرای تست‌ها

برای اجرای تست‌ها، به پوشه مربوطه بروید و دستور زیر را اجرا کنید:

```bash
node <test-file-name.js>
```

مثال:

```bash
node tests/ai-services/test_gemini_updated.js
```