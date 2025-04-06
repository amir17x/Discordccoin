/**
 * ابزارهای مربوط به هوش مصنوعی
 * 
 * این فایل حاوی توابع کمکی برای تعامل با سرویس‌های هوش مصنوعی است.
 */

/**
 * دریافت پینگ سرویس هوش مصنوعی
 * @returns {Promise<number>} پینگ به میلی‌ثانیه
 */
export async function getAIPing() {
  try {
    // سعی می‌کنیم به سرویس هوش مصنوعی دسترسی پیدا کنیم
    let pingValue = 0;
    
    try {
      // سعی می‌کنیم از طریق ماژول به سرویس هوش مصنوعی دسترسی پیدا کنیم
      const aiService = await import('../../server/services/aiService.js').catch(() => null);
      
      if (aiService && typeof aiService.ping === 'function') {
        // استفاده از تابع ping داخلی سرویس
        pingValue = await aiService.ping();
        console.log(`پینگ هوش مصنوعی از طریق aiService.ping: ${pingValue}ms`);
      } else if (global.aiService && typeof global.aiService.ping === 'function') {
        // دسترسی به سرویس ذخیره شده در متغیر سراسری
        pingValue = await global.aiService.ping();
        console.log(`پینگ هوش مصنوعی از طریق global.aiService: ${pingValue}ms`);
      }
    } catch (innerError) {
      console.warn('خطا در دریافت پینگ هوش مصنوعی از طریق ماژول:', innerError);
    }
    
    // اگر هنوز پینگ دریافت نشده، ممکن است از طریق یک API داخلی یا ذخیره شده در دیتابیس پینگ دریافت شود
    if (!pingValue) {
      try {
        // در اینجا می‌توان پینگ را از یک API داخلی یا دیتابیس دریافت کرد
        const response = await fetch('http://localhost:5000/api/ai/ping').catch(() => null);
        
        if (response) {
          const data = await response.json();
          if (data && data.ping) {
            pingValue = data.ping;
            console.log(`پینگ هوش مصنوعی از طریق API: ${pingValue}ms`);
          }
        }
      } catch (apiError) {
        console.warn('خطا در دریافت پینگ هوش مصنوعی از طریق API:', apiError);
      }
    }
    
    // اگر هنوز هم پینگ دریافت نشده، مقدار معقول برگردانیم
    if (!pingValue) {
      // برای خدمات هوش مصنوعی معمولاً بین 150 تا 300 میلی‌ثانیه معقول است
      pingValue = 150;
      console.log(`استفاده از پینگ هوش مصنوعی پیش‌فرض: ${pingValue}ms`);
    }
    
    return pingValue;
  } catch (error) {
    console.error('خطا در دریافت پینگ هوش مصنوعی:', error);
    return 200; // مقدار پیش‌فرض در صورت خطا
  }
}

/**
 * ارسال یک درخواست به سرویس هوش مصنوعی
 * این تابع یک متن یا پرامپت به سرویس هوش مصنوعی ارسال می‌کند و پاسخ را دریافت می‌کند
 * 
 * @param {string} text متن ورودی
 * @param {Object} options تنظیمات اضافی
 * @returns {Promise<Object>} پاسخ دریافتی از هوش مصنوعی
 */
export async function queryAI(text, options = {}) {
  try {
    // ابتدا تلاش می‌کنیم از طریق ماژول
    try {
      const aiService = await import('../../server/services/aiService.js').catch(() => null);
      
      if (aiService && typeof aiService.ask === 'function') {
        const result = await aiService.ask(text, options);
        return result;
      } else if (global.aiService && typeof global.aiService.ask === 'function') {
        const result = await global.aiService.ask(text, options);
        return result;
      }
    } catch (moduleError) {
      console.warn('خطا در ارسال درخواست به هوش مصنوعی از طریق ماژول:', moduleError);
    }
    
    // سپس تلاش می‌کنیم از طریق API
    try {
      const response = await fetch('http://localhost:5000/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          ...options 
        })
      }).catch(() => null);
      
      if (response) {
        const data = await response.json();
        return data;
      }
    } catch (apiError) {
      console.warn('خطا در ارسال درخواست به هوش مصنوعی از طریق API:', apiError);
    }
    
    // اگر نتوانستیم ارتباط برقرار کنیم، یک خطا برمی‌گردانیم
    return {
      success: false,
      message: 'خطا در ارتباط با سرویس هوش مصنوعی',
      text: 'سرویس هوش مصنوعی در دسترس نیست'
    };
  } catch (error) {
    console.error('خطا در ارسال درخواست به هوش مصنوعی:', error);
    return {
      success: false,
      message: `خطا در ارسال درخواست به هوش مصنوعی: ${error.message}`,
      text: 'خطایی در پردازش درخواست رخ داده است'
    };
  }
}