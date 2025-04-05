// اسکریپت تست مدل آموزش‌دیده CCOIN AI
// این اسکریپت تست می‌کند که آیا سرویس CCOIN AI به درستی راه‌اندازی شده و مدل آموزش‌دیده در دسترس است

// از یک تابع async که بلافاصله اجرا می‌شود استفاده می‌کنیم
(async () => {
  try {
    // ماژول ccoinAIService را از مسیر آن وارد می‌کنیم
    const ccoinAIService = require('./server/discord/services/ccoinAIService');
    
    console.log("سرویس CCOIN AI با موفقیت بارگیری شد");
    console.log("---------------------------------");
    
    // بررسی در دسترس بودن مدل آموزش‌دیده
    const hasTunedModel = ccoinAIService.hasTunedModelAvailable();
    console.log(`مدل آموزش‌دیده در دسترس است: ${hasTunedModel ? 'بله ✅' : 'خیر ❌'}`);
    
    if (hasTunedModel) {
      // تست مدل آموزش‌دیده با چند سوال نمونه
      console.log("\nتست مدل آموزش‌دیده با چند سوال نمونه:");
      
      const testQuestions = [
        "سلام! CCoin چیست؟",
        "چگونه می‌توانم سکه‌های بیشتری به دست بیاورم؟",
        "دستور /daily چه کاری انجام می‌دهد؟"
      ];
      
      for (const question of testQuestions) {
        console.log(`\nسوال: ${question}`);
        try {
          console.log("در حال تولید پاسخ...");
          const response = await ccoinAIService.generateContentWithTunedModel(question, 1000, 0.2);
          console.log(`پاسخ: ${response}`);
        } catch (error) {
          console.error(`خطا در تولید پاسخ: ${error.message}`);
        }
      }
    } else {
      // سعی در بارگیری مجدد مدل
      console.log("\nتلاش برای بارگیری مجدد مدل آموزش‌دیده...");
      const reloaded = ccoinAIService.reloadTunedModel();
      console.log(`بارگیری مجدد: ${reloaded ? 'موفق ✅' : 'ناموفق ❌'}`);
      
      // تست استفاده از مدل استاندارد
      console.log("\nتست مدل استاندارد با یک سوال نمونه:");
      const question = "سلام! CCoin چیست؟";
      console.log(`سوال: ${question}`);
      
      try {
        console.log("در حال تولید پاسخ...");
        const response = await ccoinAIService.generateContent(question, 1000, 0.7);
        console.log(`پاسخ: ${response}`);
      } catch (error) {
        console.error(`خطا در تولید پاسخ: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`خطا در بارگیری سرویس CCOIN AI: ${error.message}`);
    
    if (error.stack) {
      console.error("جزئیات خطا:");
      console.error(error.stack);
    }
  }
})();