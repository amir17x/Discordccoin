/**
 * این فایل قدیمی بوده و با سرویس ccoinAiTipService جایگزین شده است
 * لطفاً به جای آن از test-ccoinai-tip.ts استفاده کنید
 */

import { ccoinAiTipService } from './discord/services/ccoinAiTipService';

async function testReplacement() {
  console.log('⚠️ این فایل تست قدیمی است و با سرویس CCOIN AI جایگزین شده است.');
  console.log('🔄 هدایت به تست جدید...');
  
  try {
    // تست اتصال به سرویس جدید
    const status = await ccoinAiTipService.checkConnectionStatus();
    console.log('📡 وضعیت اتصال به CCOIN AI:', status);
    
    if (status.isAvailable) {
      console.log('✅ سرویس CCOIN AI در دسترس است. برای تست کامل از test-ccoinai-tip.ts استفاده کنید.');
    } else {
      console.log('❌ سرویس CCOIN AI در دسترس نیست.');
    }
  } catch (error) {
    console.error('❌ خطا در اتصال به سرویس CCOIN AI:', error);
  }
  
  console.log('ℹ️ برای اجرای تست کامل دستور زیر را وارد کنید:');
  console.log('🔍 npx tsx server/test-ccoinai-tip.ts');
}

// اجرای تست جایگزین
testReplacement();