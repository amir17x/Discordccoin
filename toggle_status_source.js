/**
 * ابزار تغییر منبع پیام‌های وضعیت ربات (استفاده از API)
 * 
 * این اسکریپت به مدیران ربات امکان می‌دهد منبع تولید پیام‌های وضعیت را 
 * بین هوش مصنوعی و کتابخانه محلی با استفاده از API تغییر دهند.
 * 
 * نحوه استفاده:
 *   node toggle_status_source.js [ai|local]
 *   
 *   ai: استفاده از هوش مصنوعی برای تولید پیام‌های وضعیت
 *   local: استفاده از کتابخانه محلی برای تولید پیام‌های وضعیت
 *   
 *   اگر پارامتری مشخص نشود، راهنمای استفاده نمایش داده می‌شود.
 */

// در Node.js ورژن 18 و بالاتر fetch بصورت پیش‌فرض موجود است
// در ورژن‌های پایین‌تر نیاز به پکیج node-fetch است

/**
 * تغییر منبع پیام‌های وضعیت با استفاده از API
 * @param {boolean} useAI استفاده از هوش مصنوعی
 */
async function toggleStatusSource(useAI) {
  try {
    const response = await fetch('http://localhost:5000/api/status/source', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ useAI }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ ${data.message}`);
    } else {
      console.error(`❌ خطا: ${data.message}`);
    }
  } catch (error) {
    console.error('❌ خطا در ارتباط با API:', error.message);
  }
}

/**
 * نمایش راهنمای استفاده
 */
function showHelp() {
  console.log('راهنمای استفاده:');
  console.log('  - برای استفاده از هوش مصنوعی: node toggle_status_source.js ai');
  console.log('  - برای استفاده از کتابخانه محلی: node toggle_status_source.js local');
}

// پردازش پارامترهای ورودی
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
} else {
  const source = args[0].toLowerCase();
  
  if (source === 'ai') {
    toggleStatusSource(true);
  } else if (source === 'local') {
    toggleStatusSource(false);
  } else {
    console.error('❌ پارامتر نامعتبر.');
    showHelp();
    process.exit(1);
  }
}