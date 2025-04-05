/**
 * مسیرهای مدیریت هوش مصنوعی پنل ادمین
 */

import express from 'express';
import { getAIStats, getAISettings, updateAISettings, getAIModels, 
         getRecentAIConversations, getTunedModels, getModelUsage, 
         getAILogs, toggleAIFeature } from '../services/aiService.js';

const router = express.Router();

/**
 * صفحه اصلی مدیریت هوش مصنوعی
 */
router.get('/', async (req, res) => {
  try {
    const stats = await getAIStats();
    const settings = await getAISettings();
    const recentConversations = await getRecentAIConversations(5);
    
    res.render('ai/index', {
      title: 'مدیریت CCOIN AI',
      stats,
      settings,
      recentConversations
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات هوش مصنوعی: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

/**
 * صفحه تنظیمات هوش مصنوعی
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await getAISettings();
    const models = await getAIModels();
    
    res.render('ai/settings', {
      title: 'تنظیمات CCOIN AI',
      settings,
      models
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری تنظیمات هوش مصنوعی: ${error.message}`);
    res.redirect('/admin/ai');
  }
});

/**
 * به‌روزرسانی تنظیمات هوش مصنوعی
 */
router.post('/settings', async (req, res) => {
  const settings = req.body;
  
  try {
    await updateAISettings(settings);
    req.flash('success_msg', 'تنظیمات CCOIN AI با موفقیت به‌روزرسانی شد');
    res.redirect('/admin/ai/settings');
  } catch (error) {
    req.flash('error_msg', `خطا در به‌روزرسانی تنظیمات هوش مصنوعی: ${error.message}`);
    res.redirect('/admin/ai/settings');
  }
});

/**
 * صفحه مدل‌های آموزش‌دیده
 */
router.get('/tuned-models', async (req, res) => {
  try {
    const tunedModels = await getTunedModels();
    
    res.render('ai/tuned-models', {
      title: 'مدل‌های آموزش‌دیده',
      tunedModels
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری مدل‌های آموزش‌دیده: ${error.message}`);
    res.redirect('/admin/ai');
  }
});

/**
 * صفحه آمار استفاده از مدل‌ها
 */
router.get('/usage', async (req, res) => {
  try {
    const modelId = req.query.model || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    
    const options = {
      modelId: modelId || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };
    
    const usage = await getModelUsage(options);
    const models = await getAIModels();
    
    res.render('ai/usage', {
      title: 'آمار استفاده از CCOIN AI',
      usage,
      models,
      filters: {
        modelId,
        startDate,
        endDate
      }
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری آمار استفاده: ${error.message}`);
    res.redirect('/admin/ai');
  }
});

/**
 * صفحه لاگ‌های هوش مصنوعی
 */
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const level = req.query.level || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    
    const options = {
      page,
      limit,
      level,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };
    
    const logs = await getAILogs(options);
    
    res.render('ai/logs', {
      title: 'لاگ‌های CCOIN AI',
      logs: logs.logs,
      pagination: logs.pagination,
      filters: {
        level,
        startDate,
        endDate
      }
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری لاگ‌ها: ${error.message}`);
    res.redirect('/admin/ai');
  }
});

/**
 * فعال/غیرفعال کردن یک ویژگی هوش مصنوعی
 */
router.post('/feature/toggle', async (req, res) => {
  const { featureId, enabled } = req.body;
  
  try {
    await toggleAIFeature(featureId, enabled === 'true');
    req.flash('success_msg', `ویژگی با موفقیت ${enabled === 'true' ? 'فعال' : 'غیرفعال'} شد`);
    
    // اگر درخواست از طریق AJAX آمده باشد JSON برمی‌گرداند
    if (req.xhr) {
      return res.json({ success: true });
    }
    
    res.redirect('/admin/ai/settings');
  } catch (error) {
    req.flash('error_msg', `خطا در تغییر وضعیت ویژگی: ${error.message}`);
    
    // اگر درخواست از طریق AJAX آمده باشد JSON برمی‌گرداند
    if (req.xhr) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.redirect('/admin/ai/settings');
  }
});

export default router;