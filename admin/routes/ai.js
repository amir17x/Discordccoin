/**
 * مسیرهای مدیریت هوش مصنوعی
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت CCOIN AI و تنظیمات آن است.
 */

import express from 'express';
import { aiController } from '../controllers/aiController.js';

const router = express.Router();

// صفحه اصلی مدیریت هوش مصنوعی
router.get('/', aiController.showDashboard);

// تنظیمات هوش مصنوعی
router.get('/settings', aiController.showSettings);
router.post('/settings', aiController.updateSettings);

// آمار استفاده
router.get('/usage', aiController.showUsage);
router.get('/usage/stats', aiController.getUsageStats);
router.get('/usage/charts', aiController.getUsageCharts);

// Fine-tuning مدل‌ها
router.get('/tuning', aiController.showTuning);
router.get('/tuning/models', aiController.getTunedModels);
router.get('/tuning/jobs', aiController.getTuningJobs);
router.post('/tuning/start', aiController.startTuningJob);
router.get('/tuning/status/:jobId', aiController.getTuningJobStatus);

// مدیریت پرامپت‌ها و الگوها
router.get('/prompts', aiController.showPrompts);
router.get('/prompts/:id', aiController.getPrompt);
router.post('/prompts', aiController.createPrompt);
router.put('/prompts/:id', aiController.updatePrompt);
router.delete('/prompts/:id', aiController.deletePrompt);

// تست مدل
router.get('/test', aiController.showTestPage);
router.post('/test/completion', aiController.testCompletion);
router.post('/test/image', aiController.testImageGeneration);

export default router;