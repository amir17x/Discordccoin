/**
 * ماژول اتصال به پایگاه داده
 * 
 * این ماژول امکان اتصال به پایگاه داده MongoDB را فراهم می‌کند.
 */

import mongoose from 'mongoose';
import { Log } from '../models/log.js';

// تنظیمات اتصال به دیتابیس
const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin';

// گزینه‌های اتصال به دیتابیس
const DB_OPTIONS = {
  useNewUrlParser: true, 
  useUnifiedTopology: true
};

/**
 * اتصال به پایگاه داده
 * @returns {Promise<Object>} اتصال به پایگاه داده
 */
export async function connectToDatabase() {
  try {
    // غیرفعال کردن استفاده از مدل پیش از تعریف آن
    mongoose.set('strictQuery', true);
    
    // ایجاد اتصال به پایگاه داده
    const connection = await mongoose.connect(DATABASE_URI, DB_OPTIONS);
    
    console.log('Connected to MongoDB database');
    
    // ثبت لاگ اتصال موفق به دیتابیس
    try {
      await Log.info('اتصال به دیتابیس با موفقیت برقرار شد', 'db');
    } catch (logError) {
      // اگر مدل هنوز ایجاد نشده، خطا را نادیده می‌گیریم
      console.warn('Could not log database connection (models may not be ready):', logError.message);
    }
    
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

/**
 * بستن اتصال به پایگاه داده
 * @returns {Promise<void>}
 */
export async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB database');
  } catch (error) {
    console.error('Database disconnection error:', error);
    throw error;
  }
}

// خروج با بستن اتصال دیتابیس
process.on('SIGINT', async () => {
  try {
    await disconnectFromDatabase();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});

export default {
  connectToDatabase,
  disconnectFromDatabase
};