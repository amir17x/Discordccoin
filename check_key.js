console.log('Google AI API KEY محیطی:', process.env.GOOGLE_AI_API_KEY ? process.env.GOOGLE_AI_API_KEY.substring(0, 5) + '...' : 'تعریف نشده');
console.log('Vertex AI API KEY محیطی:', process.env.VORTEX_AI_API_KEY ? process.env.VORTEX_AI_API_KEY.substring(0, 5) + '...' : 'تعریف نشده');

// بررسی وجود حداقل یکی از کلیدها
if (!process.env.GOOGLE_AI_API_KEY && !process.env.VORTEX_AI_API_KEY) {
  console.log('هشدار: هیچ کلید API برای سرویس‌های هوش مصنوعی تنظیم نشده است!');
} else {
  console.log('حداقل یکی از کلیدهای API هوش مصنوعی تنظیم شده است.');
}
