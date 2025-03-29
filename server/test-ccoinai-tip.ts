/**
 * اسکریپت تست سرویس نکات CCOIN AI
 * این فایل برای تست قابلیت‌های سرویس جدید نکات CCOIN AI استفاده می‌شود
 */

import { ccoinAiTipService } from './discord/services/ccoinAiTipService';

async function testCcoinAiTipService() {
  try {
    // بررسی وضعیت اتصال
    console.log('🔄 در حال بررسی وضعیت اتصال به CCOIN AI...');
    const status = await ccoinAiTipService.checkConnectionStatus();
    console.log('📡 وضعیت اتصال:', status);
    
    if (status.isAvailable) {
      // تست تولید نکته اتفاقی
      console.log('\n🎲 در حال تولید یک نکته اتفاقی...');
      const randomTip = await ccoinAiTipService.generateRandomTip();
      console.log('💡 نکته اتفاقی تولید شده:\n', randomTip);
      
      // تست تولید نکته با موضوع مشخص
      const topic = "مدیریت کلن‌ها";
      console.log(`\n🎯 در حال تولید نکته با موضوع "${topic}"...`);
      const topicTip = await ccoinAiTipService.generateTopicTip(topic);
      console.log('💡 نکته موضوعی تولید شده:\n', topicTip);
    } else {
      console.error('❌ سرویس CCOIN AI در دسترس نیست. تست متوقف شد.');
    }
  } catch (error) {
    console.error('❌ خطا در اجرای تست:', error);
  }
}

// اجرای تست
console.log('🚀 شروع تست سرویس نکات CCOIN AI...');
testCcoinAiTipService().then(() => {
  console.log('✅ تست سرویس نکات CCOIN AI به پایان رسید.');
}).catch(error => {
  console.error('❌ خطا در اجرای تست:', error);
});