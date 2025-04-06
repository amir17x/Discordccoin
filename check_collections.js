import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ccoin';

async function checkCollections() {
  try {
    const client = await MongoClient.connect(MONGO_URI);
    console.log('🗄️ اتصال به MongoDB با موفقیت برقرار شد');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log('کالکشن‌های موجود در دیتابیس:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // نمونه‌ای از داده‌های گرفته شده از کالکشن‌ها
    if (collections.length > 0) {
      console.log('\nبررسی نمونه داده‌ها از تعدادی از کالکشن‌ها:');
      
      // سرورها
      try {
        const servers = await db.collection('servers').find().limit(2).toArray();
        console.log('\nسرورها:', JSON.stringify(servers, null, 2));
      } catch (error) {
        console.log('خطا در دریافت اطلاعات سرورها:', error.message);
      }
      
      // کاربران
      try {
        const users = await db.collection('users').find().limit(2).toArray();
        console.log('\nکاربران:', JSON.stringify(users, null, 2));
      } catch (error) {
        console.log('خطا در دریافت اطلاعات کاربران:', error.message);
      }
      
      // تراکنش‌ها (اگر وجود داشته باشد)
      try {
        const transactions = await db.collection('transactions').find().limit(2).toArray();
        console.log('\nتراکنش‌ها:', JSON.stringify(transactions, null, 2));
      } catch (error) {
        console.log('خطا در دریافت اطلاعات تراکنش‌ها:', error.message);
      }
      
      // سهام (اگر وجود داشته باشد)
      try {
        const stocks = await db.collection('stocks').find().limit(2).toArray();
        console.log('\nسهام:', JSON.stringify(stocks, null, 2));
      } catch (error) {
        console.log('خطا در دریافت اطلاعات سهام:', error.message);
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('خطا در اتصال به پایگاه داده:', error);
  }
}

checkCollections();