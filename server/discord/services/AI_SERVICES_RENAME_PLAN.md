# طرح بازنام‌گذاری فایل‌های سرویس هوش مصنوعی CCOIN

این فایل راهنما نحوه بازنام‌گذاری فایل‌های سرویس هوش مصنوعی را توضیح می‌دهد. هدف ما استاندارد کردن نام‌گذاری و بهبود خوانایی کد است.

## مراحل انجام کار

1. برای هر فایل، ابتدا یک کپی پشتیبان ایجاد می‌کنیم
2. سپس نام فایل را تغییر می‌دهیم
3. سپس تمام import ها در سایر فایل‌ها را به‌روزرسانی می‌کنیم

## جدول تغییرات

| فایل فعلی | فایل جدید | توضیحات |
|-----------|-----------|----------|
| googleai.ts | ccoinAIService.ts | سرویس اصلی CCOIN AI |
| geminiSdkService.ts | ccoinAISDKService.ts | استفاده از SDK رسمی Google AI |
| geminiService.ts | ccoinAIDirectService.ts | ارتباط مستقیم با API جمینی |
| vertexai.ts | ccoinAIVertexService.ts | سرویس Vertex AI |
| ccoinAiTipService.ts | ccoinAITipService.ts | اصلاح نام‌گذاری (i به I) |

## فایل‌هایی که باید به‌روزرسانی شوند

### برای googleai.ts -> ccoinAIService.ts:
- server/discord/components/aiSettingsMenu.ts

### برای geminiSdkService.ts -> ccoinAISDKService.ts:
- server/discord/services/aiService.ts

### برای geminiService.ts -> ccoinAIDirectService.ts:
- server/discord/services/aiService.ts

### برای vertexai.ts -> ccoinAIVertexService.ts:
- (نیاز به بررسی دارد)

### برای ccoinAiTipService.ts -> ccoinAITipService.ts:
- (نیاز به بررسی دارد)