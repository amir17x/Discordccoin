/**
 * کنترلر مدیریت وضعیت ربات
 * 
 * این ماژول API‌هایی برای مدیریت و تغییر وضعیت ربات ارائه می‌دهد،
 * از جمله تغییر منبع تولید پیام‌های وضعیت (هوش مصنوعی یا کتابخانه محلی)
 */

import { Request, Response } from 'express';
import { setStatusGenerationMethod, getStatusGenerationMethod, generateNewStatus } from '../discord/utils/aiStatusMessages';
import { Client } from 'discord.js';
import { log } from '../vite';

/**
 * دریافت منبع فعلی تولید پیام‌های وضعیت
 * @route GET /api/status/source
 */
export const getStatusSource = async (req: Request, res: Response) => {
  try {
    const useAI = getStatusGenerationMethod();
    
    return res.status(200).json({ 
      success: true, 
      source: useAI ? 'ai' : 'local',
      useAI,
      message: `منبع فعلی پیام‌های وضعیت: ${useAI ? 'هوش مصنوعی' : 'کتابخانه محلی'}`
    });
  } catch (error: any) {
    log(`خطا در دریافت منبع پیام‌های وضعیت: ${error}`, 'error');
    return res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت منبع پیام‌های وضعیت', 
      error: error.message 
    });
  }
};

/**
 * تغییر منبع تولید پیام‌های وضعیت
 * @route PUT /api/status/source
 */
export const toggleStatusSource = async (req: Request, res: Response) => {
  try {
    const { useAI } = req.body;
    
    if (typeof useAI !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'پارامتر useAI باید به صورت boolean ارسال شود' 
      });
    }
    
    setStatusGenerationMethod(useAI);
    
    return res.status(200).json({ 
      success: true, 
      message: `منبع پیام‌های وضعیت با موفقیت به ${useAI ? 'هوش مصنوعی' : 'کتابخانه محلی'} تغییر یافت`,
      useAI
    });
  } catch (error: any) {
    log(`خطا در تغییر منبع پیام‌های وضعیت: ${error}`, 'error');
    return res.status(500).json({ 
      success: false, 
      message: 'خطا در تغییر منبع پیام‌های وضعیت', 
      error: error.message 
    });
  }
};

/**
 * تولید یک پیام وضعیت جدید
 * @route POST /api/status/generate
 */
export const generateStatus = async (req: Request, res: Response) => {
  try {
    // به دلیل محدودیت‌های دسترسی، این API برای تولید پیام وضعیت جدید فعلاً غیرفعال است
    // و نیاز به راه‌اندازی مجدد ربات دارد
    
    const { theme } = req.body;
    
    return res.status(200).json({ 
      success: false, 
      message: 'برای تولید پیام وضعیت جدید، لطفاً ربات را راه‌اندازی مجدد کنید',
      note: 'این قابلیت از طریق API فعلاً غیرفعال است',
      requestedTheme: theme || 'عمومی'
    });
  } catch (error: any) {
    log(`خطا در پردازش درخواست تولید پیام وضعیت: ${error}`, 'error');
    return res.status(500).json({ 
      success: false, 
      message: 'خطا در پردازش درخواست', 
      error: error.message 
    });
  }
};