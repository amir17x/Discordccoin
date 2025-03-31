/**
 * ابزار تست سیستم نکات
 * این فایل برای تست ویژگی‌های سیستم نکات هوشمند استفاده می‌شود
 */

import { ccoinAITipService, tipTopics } from './discord/services/ccoinAITipService';
import { log } from './vite';

/**
 * اجرای تست‌های سیستم نکات
 */
async function testTipSystem() {
  try {
    // بررسی وضعیت اتصال
    console.log('🔄 در حال بررسی وضعیت اتصال به CCOIN AI...');
    const status = await ccoinAITipService.checkConnectionStatus();
    console.log('📡 وضعیت اتصال:', status);
    
    if (status.isAvailable) {
      // تست تولید نکته اتفاقی
      console.log('\n🎲 در حال تولید یک نکته اتفاقی...');
      const randomTip = await ccoinAITipService.generateRandomTip();
      console.log('💡 نکته اتفاقی تولید شده:\n', randomTip);
      
      // تست تولید نکته برای موضوعات خاص
      console.log('\n🔍 در حال تست تولید نکته برای موضوعات خاص...');
      
      // لیست موضوعات تستی که می‌خواهیم نکات آنها را بررسی کنیم
      const testTopics = [
        // چند موضوع از هر دسته‌بندی
        "سیستم بانکی Ccoin",
        "مدیریت سکه‌ها و ذخیره‌سازی",
        "تشکیل و مدیریت کلن",
        "مزایای عضویت در کلن‌ها",
        "استراتژی‌های موفقیت در بازی گرگینه",
        "تاکتیک‌های برنده شدن در بازی مافیا",
        "گسترش روابط دوستی در Ccoin",
        "چت‌های ناشناس و اصول استفاده",
        "محافظت از حساب و سکه‌ها",
        "شروع قدرتمند در Ccoin"
      ];
      
      // تست تولید نکته برای هر موضوع
      for (const topic of testTopics) {
        console.log(`\n🎯 در حال تولید نکته با موضوع "${topic}"...`);
        const topicTip = await ccoinAITipService.generateTopicTip(topic);
        console.log('💡 نکته تولید شده:\n', topicTip);
        
        // کمی تأخیر بین درخواست‌ها برای جلوگیری از محدودیت نرخ API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('\n✅ تمام تست‌های سیستم نکات با موفقیت انجام شد.');
    } else {
      console.error('❌ سرویس CCOIN AI در دسترس نیست. تست متوقف شد.');
    }
  } catch (error) {
    console.error('❌ خطا در انجام تست سیستم نکات:', error);
  }
}

// اجرای تست‌ها
testTipSystem()
  .then(() => {
    log('تست‌های سیستم نکات به پایان رسید.', 'info');
    // در محیط توسعه، برنامه را خاتمه می‌دهیم
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(() => process.exit(0), 1000);
    }
  })
  .catch(err => {
    log(`خطا در اجرای تست سیستم نکات: ${err}`, 'error');
    // در محیط توسعه، با کد خطا خارج می‌شویم
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(() => process.exit(1), 1000);
    }
  });