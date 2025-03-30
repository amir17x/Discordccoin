/**
 * مسیرهای API برای مدیریت وضعیت ربات
 */
import express from 'express';
import { getStatusSource, toggleStatusSource, generateStatus } from '../controllers/statusController';

const router = express.Router();

// مسیر دریافت منبع فعلی تولید پیام‌های وضعیت
router.get('/source', getStatusSource);

// مسیر تغییر منبع تولید پیام‌های وضعیت
router.put('/source', toggleStatusSource);

// مسیر تولید پیام وضعیت جدید
router.post('/generate', generateStatus);

export default router;