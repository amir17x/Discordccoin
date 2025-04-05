/**
 * کنترلر مدیریت هوش مصنوعی
 * 
 * این کنترلر مسئول مدیریت CCOIN AI و تنظیمات آن است.
 */

import {
  getAISettings,
  updateAISettings,
  getAIUsageStats,
  getPromptTemplates,
  getPromptTemplateById,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  getTuningJobs,
  createTuningJob,
  getTuningJobStatus,
  getTunedModels,
  testModel
} from '../services/aiService.js';

/**
 * نمایش داشبورد هوش مصنوعی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showDashboard = async (req, res) => {
  try {
    // دریافت تنظیمات هوش مصنوعی
    const settings = await getAISettings();
    
    // دریافت آمار استفاده
    const usageStats = await getAIUsageStats();
    
    // دریافت مدل‌های آموزش‌دیده
    const tunedModels = await getTunedModels();
    
    // دریافت الگوهای پرامپت
    const promptTemplates = await getPromptTemplates();
    
    res.render('ai/dashboard', {
      title: 'مدیریت CCOIN AI',
      settings,
      usageStats,
      tunedModels,
      promptTemplates
    });
  } catch (error) {
    console.error('AI dashboard error:', error);
    req.flash('error', 'خطا در بارگذاری داشبورد هوش مصنوعی');
    res.render('ai/dashboard', {
      title: 'مدیریت CCOIN AI',
      settings: {},
      usageStats: {},
      tunedModels: [],
      promptTemplates: []
    });
  }
};

/**
 * نمایش صفحه تنظیمات هوش مصنوعی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showSettings = async (req, res) => {
  try {
    // دریافت تنظیمات هوش مصنوعی
    const settings = await getAISettings();
    
    res.render('ai/settings', {
      title: 'تنظیمات CCOIN AI',
      settings
    });
  } catch (error) {
    console.error('AI settings error:', error);
    req.flash('error', 'خطا در بارگذاری تنظیمات هوش مصنوعی');
    res.render('ai/settings', {
      title: 'تنظیمات CCOIN AI',
      settings: {}
    });
  }
};

/**
 * بروزرسانی تنظیمات هوش مصنوعی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // بروزرسانی تنظیمات
    await updateAISettings(settings);
    
    req.flash('success', 'تنظیمات CCOIN AI با موفقیت بروزرسانی شد');
    res.redirect('/admin/ai/settings');
  } catch (error) {
    console.error('Update AI settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات هوش مصنوعی');
    res.redirect('/admin/ai/settings');
  }
};

/**
 * نمایش صفحه آمار استفاده
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showUsage = async (req, res) => {
  try {
    // دریافت آمار استفاده
    const usageStats = await getAIUsageStats();
    
    res.render('ai/usage', {
      title: 'آمار استفاده از CCOIN AI',
      usageStats
    });
  } catch (error) {
    console.error('AI usage error:', error);
    req.flash('error', 'خطا در بارگذاری آمار استفاده از هوش مصنوعی');
    res.render('ai/usage', {
      title: 'آمار استفاده از CCOIN AI',
      usageStats: {}
    });
  }
};

/**
 * دریافت آمار استفاده (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getUsageStats = async (req, res) => {
  try {
    // دریافت آمار استفاده
    const usageStats = await getAIUsageStats();
    
    res.json({
      success: true,
      data: usageStats
    });
  } catch (error) {
    console.error('Get AI usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت آمار استفاده از هوش مصنوعی'
    });
  }
};

/**
 * دریافت نمودارهای آمار استفاده (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getUsageCharts = async (req, res) => {
  try {
    // در یک محیط واقعی، این داده‌ها از پایگاه داده دریافت می‌شوند
    const data = {
      monthly: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        datasets: [
          {
            label: 'تعداد درخواست‌ها',
            data: [1245, 1587, 1890, 2150, 2496, 2731]
          },
          {
            label: 'تعداد کاربران',
            data: [120, 145, 189, 210, 230, 256]
          }
        ]
      },
      distribution: {
        labels: ['چت', 'تولید محتوا', 'تحلیل تصویر', 'برنامه‌نویسی', 'آموزش'],
        data: [45, 20, 15, 12, 8]
      },
      modelUsage: {
        labels: ['Flash', 'Pro'],
        data: [70, 30]
      }
    };
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get AI usage charts error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت نمودارهای استفاده از هوش مصنوعی'
    });
  }
};

/**
 * نمایش صفحه Fine-tuning
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showTuning = async (req, res) => {
  try {
    // دریافت مدل‌های آموزش‌دیده
    const tunedModels = await getTunedModels();
    
    // دریافت وظایف آموزش
    const tuningJobs = await getTuningJobs();
    
    res.render('ai/tuning', {
      title: 'آموزش مدل‌ها',
      tunedModels,
      tuningJobs
    });
  } catch (error) {
    console.error('AI tuning error:', error);
    req.flash('error', 'خطا در بارگذاری صفحه آموزش مدل‌ها');
    res.render('ai/tuning', {
      title: 'آموزش مدل‌ها',
      tunedModels: [],
      tuningJobs: []
    });
  }
};

/**
 * دریافت مدل‌های آموزش‌دیده (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getTunedModels = async (req, res) => {
  try {
    // دریافت مدل‌های آموزش‌دیده
    const tunedModels = await getTunedModels();
    
    res.json({
      success: true,
      data: tunedModels
    });
  } catch (error) {
    console.error('Get tuned models error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت مدل‌های آموزش‌دیده'
    });
  }
};

/**
 * دریافت وظایف آموزش (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getTuningJobs = async (req, res) => {
  try {
    // دریافت وظایف آموزش
    const tuningJobs = await getTuningJobs();
    
    res.json({
      success: true,
      data: tuningJobs
    });
  } catch (error) {
    console.error('Get tuning jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت وظایف آموزش'
    });
  }
};

/**
 * شروع وظیفه آموزش جدید
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const startTuningJob = async (req, res) => {
  try {
    const { baseModel, displayName, trainingData } = req.body;
    
    // ایجاد وظیفه آموزش
    const job = await createTuningJob(trainingData, baseModel, displayName);
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Start tuning job error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در شروع وظیفه آموزش'
    });
  }
};

/**
 * دریافت وضعیت وظیفه آموزش (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getTuningJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // دریافت وضعیت وظیفه
    const status = await getTuningJobStatus(jobId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get tuning job status error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت وضعیت وظیفه آموزش'
    });
  }
};

/**
 * نمایش صفحه مدیریت پرامپت‌ها و الگوها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showPrompts = async (req, res) => {
  try {
    // دریافت الگوهای پرامپت
    const promptTemplates = await getPromptTemplates();
    
    res.render('ai/prompts', {
      title: 'مدیریت پرامپت‌ها',
      promptTemplates
    });
  } catch (error) {
    console.error('AI prompts error:', error);
    req.flash('error', 'خطا در بارگذاری صفحه مدیریت پرامپت‌ها');
    res.render('ai/prompts', {
      title: 'مدیریت پرامپت‌ها',
      promptTemplates: []
    });
  }
};

/**
 * دریافت پرامپت با شناسه مشخص (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getPrompt = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت الگوی پرامپت
    const prompt = await getPromptTemplateById(id);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'پرامپت مورد نظر یافت نشد'
      });
    }
    
    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    console.error('Get prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت پرامپت'
    });
  }
};

/**
 * ایجاد پرامپت جدید (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const createPrompt = async (req, res) => {
  try {
    const { name, template, description, category, variables } = req.body;
    
    // ایجاد پرامپت جدید
    const prompt = await createPromptTemplate({
      name,
      template,
      description,
      category,
      variables: variables || []
    });
    
    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ایجاد پرامپت'
    });
  }
};

/**
 * بروزرسانی پرامپت (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, template, description, category, variables } = req.body;
    
    // دریافت پرامپت
    const prompt = await getPromptTemplateById(id);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'پرامپت مورد نظر یافت نشد'
      });
    }
    
    // بروزرسانی پرامپت
    const updatedPrompt = await updatePromptTemplate(id, {
      name,
      template,
      description,
      category,
      variables: variables || []
    });
    
    res.json({
      success: true,
      data: updatedPrompt
    });
  } catch (error) {
    console.error('Update prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در بروزرسانی پرامپت'
    });
  }
};

/**
 * حذف پرامپت (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    
    // دریافت پرامپت
    const prompt = await getPromptTemplateById(id);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'پرامپت مورد نظر یافت نشد'
      });
    }
    
    // حذف پرامپت
    await deletePromptTemplate(id);
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف پرامپت'
    });
  }
};

/**
 * نمایش صفحه تست مدل
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showTestPage = async (req, res) => {
  try {
    // دریافت مدل‌های آموزش‌دیده
    const tunedModels = await getTunedModels();
    
    res.render('ai/test', {
      title: 'تست مدل',
      tunedModels
    });
  } catch (error) {
    console.error('AI test page error:', error);
    req.flash('error', 'خطا در بارگذاری صفحه تست مدل');
    res.render('ai/test', {
      title: 'تست مدل',
      tunedModels: []
    });
  }
};

/**
 * تست تکمیل متن با مدل (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const testCompletion = async (req, res) => {
  try {
    const { modelName, prompt, temperature } = req.body;
    
    // تست مدل
    const result = await testModel(modelName, prompt, temperature);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Test completion error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تست مدل'
    });
  }
};

/**
 * تست تولید تصویر با مدل (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const testImageGeneration = async (req, res) => {
  try {
    const { prompt, width, height } = req.body;
    
    // تولید تصویر (این قسمت اگر دسترسی به API تولید تصویر ندارید، می‌توانید حذف کنید)
    // این تابع باید در سرویس AI پیاده‌سازی شود
    
    res.json({
      success: true,
      data: {
        imageUrl: "https://placeholder.com/image",
        width: width || 512,
        height: height || 512
      }
    });
  } catch (error) {
    console.error('Test image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید تصویر'
    });
  }
};

export const aiController = {
  showDashboard,
  showSettings,
  updateSettings,
  showUsage,
  getUsageStats,
  getUsageCharts,
  showTuning,
  getTunedModels,
  getTuningJobs,
  startTuningJob,
  getTuningJobStatus,
  showPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  showTestPage,
  testCompletion,
  testImageGeneration
};