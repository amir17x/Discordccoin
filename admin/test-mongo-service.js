/**
 * اسکریپت تست برای بررسی اتصال به MongoDB و دریافت داده‌ها
 */

import mongoose from 'mongoose';

// آدرس اتصال به MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ccoin';

async function testMongoService() {
  try {
    console.log('🧪 شروع تست سرویس MongoDB...');
    
    // اتصال به MongoDB
    console.log('🔄 اتصال به MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ اتصال به MongoDB با موفقیت برقرار شد');
    
    // دریافت لیست مدل‌های موجود
    console.log('🔄 بررسی مدل‌های موجود...');
    const modelNames = Object.keys(mongoose.models);
    console.log(`✅ ${modelNames.length} مدل پیدا شد:`);
    console.log(modelNames.join(', '));
    
    if (mongoose.models.User) {
      // شمارش کاربران
      const userCount = await mongoose.models.User.countDocuments();
      console.log(`✅ تعداد کاربران: ${userCount}`);
      
      // نمایش چند کاربر
      if (userCount > 0) {
        const sampleUsers = await mongoose.models.User.find().limit(3).lean();
        console.log('✅ نمونه کاربران:');
        console.log(JSON.stringify(sampleUsers.map(u => ({ 
          discordId: u.discordId, 
          username: u.username, 
          wallet: u.wallet, 
          bank: u.bank 
        })), null, 2));
      }
    } else {
      console.log('❌ مدل User پیدا نشد!');
    }
    
    if (mongoose.models.Transaction) {
      // شمارش تراکنش‌ها
      const txCount = await mongoose.models.Transaction.countDocuments();
      console.log(`✅ تعداد تراکنش‌ها: ${txCount}`);
      
      // نمایش چند تراکنش
      if (txCount > 0) {
        const sampleTx = await mongoose.models.Transaction.find().sort({ timestamp: -1 }).limit(3).lean();
        console.log('✅ نمونه تراکنش‌ها:');
        console.log(JSON.stringify(sampleTx, null, 2));
      }
    } else {
      console.log('❌ مدل Transaction پیدا نشد!');
    }
    
    if (mongoose.models.Stock) {
      // شمارش سهام
      const stockCount = await mongoose.models.Stock.countDocuments();
      console.log(`✅ تعداد سهام: ${stockCount}`);
      
      // نمایش چند سهم
      if (stockCount > 0) {
        const sampleStocks = await mongoose.models.Stock.find().limit(3).lean();
        console.log('✅ نمونه سهام:');
        console.log(JSON.stringify(sampleStocks, null, 2));
      }
    } else {
      console.log('❌ مدل Stock پیدا نشد!');
    }
    
    console.log('🎉 تست اتصال به MongoDB با موفقیت به پایان رسید!');
  } catch (error) {
    console.error('❌ خطا در تست اتصال به MongoDB:', error);
  } finally {
    // قطع اتصال
    await mongoose.disconnect();
    console.log('🔌 اتصال به MongoDB قطع شد');
  }
}

// اجرای تست
testMongoService();