/**
 * تست سریع سیستم نکات - فقط سه موضوع خاص
 */

import { ccoinAITipService } from './discord/services/ccoinAITipService';

/**
 * اجرای تست سریع سیستم نکات
 */
async function quickTestTips() {
  try {
    // بررسی وضعیت اتصال
    console.log('🔄 در حال بررسی وضعیت اتصال به CCOIN AI...');
    const status = await ccoinAITipService.checkConnectionStatus();
    console.log('📡 وضعیت اتصال:', status);
    
    if (status.isAvailable) {
      // تست تولید نکته برای موضوعات مشکل‌دار قبلی
      const testTopics = [
        "مدیریت کلن‌ها",
        "استراتژی‌های موفقیت در بازی گرگینه",
        "تاکتیک‌های برنده شدن در بازی مافیا"
      ];
      
      // تست تولید نکته برای هر موضوع
      for (const topic of testTopics) {
        console.log(`\n🎯 در حال تولید نکته با موضوع "${topic}"...`);
        const topicTip = await ccoinAITipService.generateTopicTip(topic);
        console.log('💡 نکته تولید شده:\n', topicTip);
      }
      
      console.log('\n✅ تست سریع سیستم نکات با موفقیت انجام شد.');
    } else {
      console.error('❌ سرویس CCOIN AI در دسترس نیست. تست متوقف شد.');
    }
  } catch (error) {
    console.error('❌ خطا در انجام تست سریع سیستم نکات:', error);
  }
}

// اجرای تست سریع
quickTestTips()
  .then(() => setTimeout(() => process.exit(0), 1000))
  .catch(err => {
    console.error(err);
    setTimeout(() => process.exit(1), 1000);
  });