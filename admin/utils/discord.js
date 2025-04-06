/**
 * ابزارهای مربوط به دیسکورد
 * 
 * این فایل حاوی توابع کمکی برای تعامل با دیسکورد و ربات دیسکورد است.
 */

/**
 * دریافت پینگ ربات دیسکورد
 * @returns {Promise<number>} پینگ به میلی‌ثانیه
 */
export async function getDiscordPing() {
  try {
    // سعی می‌کنیم به ربات دیسکورد دسترسی پیدا کنیم
    // توجه: در مدل واقعی، این تابع می‌تواند در داخل خود ربات دیسکورد اجرا شود
    // یا از طریق API داخلی با ربات ارتباط برقرار کند
    
    let pingValue = 0;
    
    try {
      // سعی می‌کنیم از طریق require به ربات دیسکورد دسترسی پیدا کنیم
      const discordBot = await import('../../server/discord/client.js').catch(() => null);
      
      if (discordBot && discordBot.default && discordBot.default.ws) {
        // استفاده از ping داخلی کتابخانه دیسکورد
        pingValue = discordBot.default.ws.ping;
        console.log(`پینگ دیسکورد از طریق client.ws.ping: ${pingValue}ms`);
      } else if (global.discordClient && global.discordClient.ws) {
        // دسترسی به ربات ذخیره شده در متغیر سراسری
        pingValue = global.discordClient.ws.ping;
        console.log(`پینگ دیسکورد از طریق global.discordClient: ${pingValue}ms`);
      }
    } catch (innerError) {
      console.warn('خطا در دریافت پینگ دیسکورد از طریق require:', innerError);
    }
    
    // اگر هنوز پینگ دریافت نشده، ممکن است از طریق یک API داخلی یا ذخیره شده در دیتابیس پینگ دریافت شود
    if (!pingValue) {
      try {
        // در اینجا می‌توان پینگ را از یک API داخلی یا دیتابیس دریافت کرد
        const response = await fetch('http://localhost:5000/api/discord/ping').catch(() => null);
        
        if (response) {
          const data = await response.json();
          if (data && data.ping) {
            pingValue = data.ping;
            console.log(`پینگ دیسکورد از طریق API: ${pingValue}ms`);
          }
        }
      } catch (apiError) {
        console.warn('خطا در دریافت پینگ دیسکورد از طریق API:', apiError);
      }
    }
    
    // اگر هنوز هم پینگ دریافت نشده، از یک مقدار معقول استفاده می‌کنیم
    if (!pingValue) {
      // مقدار 50ms یک تخمین معقول است
      pingValue = 50;
      console.log(`استفاده از پینگ دیسکورد پیش‌فرض: ${pingValue}ms`);
    }
    
    return pingValue;
  } catch (error) {
    console.error('خطا در دریافت پینگ دیسکورد:', error);
    return 100; // مقدار پیش‌فرض در صورت خطا
  }
}

/**
 * به‌روزرسانی قیمت سهام از طریق ربات دیسکورد
 * این تابع با ربات دیسکورد ارتباط برقرار می‌کند و قیمت یک سهام را به‌روزرسانی می‌کند
 * 
 * @param {string} symbol نماد سهام
 * @param {string} adminUsername نام کاربری ادمین
 * @returns {Promise<Object>} نتیجه به‌روزرسانی
 */
export async function updateStockPrice(symbol, adminUsername) {
  try {
    // در اینجا می‌توان از طریق API یا فراخوانی مستقیم با ربات دیسکورد ارتباط برقرار کرد
    
    // ابتدا تلاش می‌کنیم از طریق API داخلی با ربات ارتباط برقرار کنیم
    try {
      const response = await fetch(`http://localhost:5000/api/stocks/${symbol}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin: adminUsername })
      }).catch(() => null);
      
      if (response) {
        const data = await response.json();
        return data;
      }
    } catch (apiError) {
      console.warn(`خطا در به‌روزرسانی قیمت سهام ${symbol} از طریق API:`, apiError);
    }
    
    // بعد تلاش می‌کنیم از طریق واردات مستقیم
    try {
      const stockModule = await import('../../server/discord/commands/economy/stock.js').catch(() => null);
      
      if (stockModule && typeof stockModule.updateStockPrice === 'function') {
        const result = await stockModule.updateStockPrice(symbol, { username: adminUsername });
        return result;
      }
    } catch (moduleError) {
      console.warn(`خطا در به‌روزرسانی قیمت سهام ${symbol} از طریق ماژول:`, moduleError);
    }
    
    // اگر نتوانستیم از طریق API یا واردات مستقیم اقدام کنیم، یک خطا برمی‌گردانیم
    return {
      success: false,
      message: `خطا در ارتباط با ربات دیسکورد برای به‌روزرسانی قیمت سهام ${symbol}`
    };
  } catch (error) {
    console.error(`خطا در به‌روزرسانی قیمت سهام ${symbol}:`, error);
    return {
      success: false,
      message: `خطا در به‌روزرسانی قیمت سهام ${symbol}: ${error.message}`
    };
  }
}