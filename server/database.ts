import mongoose from 'mongoose';

/**
 * راه‌اندازی اتصال به دیتابیس MongoDB
 * @returns Promise که با اتصال موفق به دیتابیس حل می‌شود
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  try {
    // بررسی وجود URI اتصال به MongoDB
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ متغیر محیطی MONGODB_URI پیدا نشد. از قابلیت‌های پایگاه داده استفاده نمی‌شود.');
      throw new Error('لطفاً متغیر محیطی MONGODB_URI را تنظیم کنید');
    }

    // تنظیم گزینه‌های اتصال با تایم‌اوت بیشتر
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      connectTimeoutMS: 10000
    };

    // اتصال به دیتابیس
    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('🗄️ اتصال به MongoDB با موفقیت برقرار شد');
    
    // تنظیم پیام اتصال
    mongoose.connection.on('connected', () => {
      console.log('🔄 اتصال به MongoDB مجدداً برقرار شد');
    });
    
    // تنظیم پیام قطع اتصال
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ اتصال به MongoDB قطع شد');
    });
    
    // تنظیم پیام خطا
    mongoose.connection.on('error', (err) => {
      console.error('❌ خطا در اتصال به MongoDB:', err);
    });
    
    return connection;
  } catch (error) {
    console.error('❌ خطا در اتصال به MongoDB:', error);
    throw error;
  }
}

/**
 * بستن اتصال به دیتابیس MongoDB
 * @returns Promise که با بستن موفق اتصال حل می‌شود
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('🔌 اتصال به MongoDB بسته شد');
  } catch (error) {
    console.error('❌ خطا در بستن اتصال به MongoDB:', error);
    throw error;
  }
}

// تنظیم واکنش به سیگنال‌های پایان برنامه برای بستن مناسب اتصال‌ها
process.on('SIGINT', async () => {
  try {
    await disconnectFromDatabase();
    console.log('👋 برنامه با موفقیت خاتمه یافت');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا در خاتمه برنامه:', error);
    process.exit(1);
  }
});