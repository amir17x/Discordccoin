# سرویس‌های هوش مصنوعی CCOIN

این پوشه شامل سرویس‌های مختلف برای استفاده از قابلیت‌های هوش مصنوعی در ربات CCOIN است.

## فایل‌های سرویس

### سرویس اصلی
- `aiService.ts`: سرویس اصلی که مدیریت تمام سرویس‌های دیگر را بر عهده دارد

### سرویس‌های CCOIN AI
- `ccoinAIService.ts` (قبلاً: googleai.ts): سرویس اصلی CCOIN AI با استفاده از Google AI API
- `ccoinAISDKService.ts` (قبلاً: geminiSdkService.ts): استفاده از SDK رسمی Google AI برای CCOIN AI
- `ccoinAIDirectService.ts` (قبلاً: geminiService.ts): ارتباط مستقیم با API جمینی برای CCOIN AI
- `ccoinAIVertexService.ts` (قبلاً: vertexai.ts): سرویس Vertex AI برای CCOIN AI
- `ccoinAITipService.ts`: سرویس تولید نکات آموزشی هوشمند
- `ccoinAIAltService.ts`: سرویس جایگزین CCOIN AI برای مواقع مشکل در سرویس اصلی

### سرویس‌های دیگر
- `openaiService.ts`: سرویس OpenAI (غیرفعال)
- `openrouter.ts`: سرویس OpenRouter (غیرفعال)
- `grok.ts`: سرویس Grok (غیرفعال)

## طرح بازنام‌گذاری

| نام فعلی | نام جدید | توضیحات |
|----------|----------|----------|
| googleai.ts | ccoinAIService.ts | سرویس اصلی CCOIN AI |
| geminiSdkService.ts | ccoinAISDKService.ts | استفاده از SDK رسمی |
| geminiService.ts | ccoinAIDirectService.ts | ارتباط مستقیم با API |
| vertexai.ts | ccoinAIVertexService.ts | سرویس Vertex AI برای CCOIN AI |
| ccoinAiTipService.ts | ccoinAITipService.ts | اصلاح نام‌گذاری (AI به AI) |