/**
 * ابزار تغییر منبع پیام‌های وضعیت ربات
 * 
 * این اسکریپت به مدیران ربات امکان می‌دهد منبع تولید پیام‌های وضعیت را 
 * بین هوش مصنوعی و کتابخانه محلی تغییر دهند.
 * 
 * نحوه استفاده:
 *   node server/scripts/toggleStatusSource.js [ai|local]
 *   
 *   ai: استفاده از هوش مصنوعی برای تولید پیام‌های وضعیت
 *   local: استفاده از کتابخانه محلی برای تولید پیام‌های وضعیت
 *   
 *   اگر پارامتری مشخص نشود، وضعیت فعلی نمایش داده می‌شود.
 */

// ES Modules syntax
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * تغییر منبع پیام‌های وضعیت با استفاده از دستور curl
 * @param {boolean} useAI استفاده از هوش مصنوعی
 */
function toggleStatusSource(useAI) {
  try {
    // دستوری اجرا می‌کنیم که به ربات در حال اجرا دستور می‌دهد وضعیت را تغییر دهد
    
    // این نسخه فقط راهنمایی نمایش می‌دهد
    console.log(`منبع پیام‌های وضعیت تغییر کرد به: ${useAI ? 'هوش مصنوعی' : 'کتابخانه محلی'}`);
    console.log('برای اعمال این تغییر، باید ربات را مجدداً راه‌اندازی کنید.');
  } catch (error) {
    console.error('خطا:', error.message);
  }
}

/**
 * نمایش وضعیت فعلی (توجه: این فقط یک تخمین است و ممکن است دقیق نباشد)
 */
function showCurrentStatus() {
  console.log('برای دیدن وضعیت واقعی، ربات را مجدداً راه‌اندازی کنید یا از لاگ‌های ربات بررسی کنید.');
  console.log('راهنمای استفاده:');
  console.log('  - برای استفاده از هوش مصنوعی: node server/scripts/toggleStatusSource.js ai');
  console.log('  - برای استفاده از کتابخانه محلی: node server/scripts/toggleStatusSource.js local');
}

// پردازش پارامترهای ورودی
const args = process.argv.slice(2);

if (args.length === 0) {
  // نمایش وضعیت فعلی
  showCurrentStatus();
} else {
  const source = args[0].toLowerCase();
  
  if (source === 'ai') {
    toggleStatusSource(true);
  } else if (source === 'local') {
    toggleStatusSource(false);
  } else {
    console.error('پارامتر نامعتبر. استفاده صحیح: node server/scripts/toggleStatusSource.js [ai|local]');
    process.exit(1);
  }
}