/**
 * کنترلر مدیریت تنظیمات
 * 
 * این ماژول شامل توابع مدیریت تنظیمات کلی سیستم، تنظیمات دیسکورد،
 * تنظیمات ربات، تنظیمات زبان، پایگاه داده، امنیتی و غیره است.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { Setting } from '../models/setting.js';
import { AdminUser } from '../models/adminUser.js';
import { AdminRole } from '../models/adminRole.js';
import { Module } from '../models/module.js';
import { Translation } from '../models/translation.js';
import { Support } from '../models/support.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// تعریف __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * کنترلر تنظیمات
 */
export const settingsController = {
  /**
   * نمایش داشبورد تنظیمات
   */
  showDashboard: async (req, res) => {
    try {
      // دریافت تعداد ادمین‌ها
      const adminCount = await AdminUser.countDocuments();
      
      // دریافت تعداد ماژول‌ها
      const moduleCount = await Module.countDocuments();
      const activeModuleCount = await Module.countDocuments({ isActive: true });
      
      // دریافت وضعیت حالت نگهداری
      const maintenanceMode = await Setting.findOne({ key: 'maintenance_mode' });
      
      // دریافت آخرین پشتیبان گیری
      const lastBackup = await Setting.findOne({ key: 'last_backup_date' });
      
      // ارسال دیتا به قالب
      res.render('settings/dashboard', {
        title: 'داشبورد تنظیمات',
        adminCount,
        moduleCount,
        activeModuleCount,
        maintenanceMode: maintenanceMode?.value === 'true',
        lastBackupDate: lastBackup?.value ? new Date(lastBackup.value) : null
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری داشبورد تنظیمات: ${error.message}`);
      res.redirect('/admin/dashboard');
    }
  },

  /**
   * نمایش تنظیمات عمومی
   */
  showGeneralSettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const settings = {};
      const keys = ['site_name', 'site_description', 'contact_email', 'timezone', 'date_format'];
      
      for (const key of keys) {
        const setting = await Setting.findOne({ key });
        settings[key] = setting?.value || '';
      }
      
      res.render('settings/general', {
        title: 'تنظیمات عمومی',
        settings
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات عمومی: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * به‌روزرسانی تنظیمات عمومی
   */
  updateGeneralSettings: async (req, res) => {
    try {
      const { site_name, site_description, contact_email, timezone, date_format } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      await Setting.findOneAndUpdate(
        { key: 'site_name' },
        { key: 'site_name', value: site_name },
        { upsert: true }
      );
      
      await Setting.findOneAndUpdate(
        { key: 'site_description' },
        { key: 'site_description', value: site_description },
        { upsert: true }
      );
      
      await Setting.findOneAndUpdate(
        { key: 'contact_email' },
        { key: 'contact_email', value: contact_email },
        { upsert: true }
      );
      
      await Setting.findOneAndUpdate(
        { key: 'timezone' },
        { key: 'timezone', value: timezone },
        { upsert: true }
      );
      
      await Setting.findOneAndUpdate(
        { key: 'date_format' },
        { key: 'date_format', value: date_format },
        { upsert: true }
      );
      
      req.flash('success', 'تنظیمات عمومی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/general');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات عمومی: ${error.message}`);
      res.redirect('/admin/settings/general');
    }
  },

  /**
   * نمایش تنظیمات دیسکورد
   */
  showDiscordSettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const settings = {};
      const keys = [
        'discord_client_id', 
        'discord_client_secret', 
        'discord_bot_token',
        'discord_redirect_uri',
        'discord_guild_id',
        'discord_owner_id',
        'discord_admin_role_id',
        'discord_mod_role_id',
        'discord_command_prefix'
      ];
      
      for (const key of keys) {
        const setting = await Setting.findOne({ key });
        settings[key] = setting?.value || '';
      }
      
      res.render('settings/discord', {
        title: 'تنظیمات دیسکورد',
        settings
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات دیسکورد: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * به‌روزرسانی تنظیمات دیسکورد
   */
  updateDiscordSettings: async (req, res) => {
    try {
      const {
        discord_client_id,
        discord_client_secret,
        discord_bot_token,
        discord_redirect_uri,
        discord_guild_id,
        discord_owner_id,
        discord_admin_role_id,
        discord_mod_role_id,
        discord_command_prefix
      } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      const keys = [
        'discord_client_id', 
        'discord_client_secret', 
        'discord_bot_token',
        'discord_redirect_uri',
        'discord_guild_id',
        'discord_owner_id',
        'discord_admin_role_id',
        'discord_mod_role_id',
        'discord_command_prefix'
      ];
      
      const values = [
        discord_client_id,
        discord_client_secret,
        discord_bot_token,
        discord_redirect_uri,
        discord_guild_id,
        discord_owner_id,
        discord_admin_role_id,
        discord_mod_role_id,
        discord_command_prefix
      ];
      
      for (let i = 0; i < keys.length; i++) {
        await Setting.findOneAndUpdate(
          { key: keys[i] },
          { key: keys[i], value: values[i] },
          { upsert: true }
        );
      }
      
      req.flash('success', 'تنظیمات دیسکورد با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/discord');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات دیسکورد: ${error.message}`);
      res.redirect('/admin/settings/discord');
    }
  },

  /**
   * نمایش تنظیمات ربات
   */
  showBotSettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const settings = {};
      const keys = [
        'bot_name',
        'bot_color',
        'bot_status',
        'bot_activity',
        'bot_activity_type',
        'bot_auto_restart',
        'bot_restart_interval',
        'bot_log_level',
        'bot_enable_slash_commands',
        'bot_enable_message_commands'
      ];
      
      for (const key of keys) {
        const setting = await Setting.findOne({ key });
        settings[key] = setting?.value || '';
      }
      
      res.render('settings/bot', {
        title: 'تنظیمات ربات',
        settings
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات ربات: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * به‌روزرسانی تنظیمات ربات
   */
  updateBotSettings: async (req, res) => {
    try {
      const {
        bot_name,
        bot_color,
        bot_status,
        bot_activity,
        bot_activity_type,
        bot_auto_restart,
        bot_restart_interval,
        bot_log_level,
        bot_enable_slash_commands,
        bot_enable_message_commands
      } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      const keys = [
        'bot_name',
        'bot_color',
        'bot_status',
        'bot_activity',
        'bot_activity_type',
        'bot_auto_restart',
        'bot_restart_interval',
        'bot_log_level',
        'bot_enable_slash_commands',
        'bot_enable_message_commands'
      ];
      
      const values = [
        bot_name,
        bot_color,
        bot_status,
        bot_activity,
        bot_activity_type,
        bot_auto_restart === 'on' ? 'true' : 'false',
        bot_restart_interval,
        bot_log_level,
        bot_enable_slash_commands === 'on' ? 'true' : 'false',
        bot_enable_message_commands === 'on' ? 'true' : 'false'
      ];
      
      for (let i = 0; i < keys.length; i++) {
        await Setting.findOneAndUpdate(
          { key: keys[i] },
          { key: keys[i], value: values[i] },
          { upsert: true }
        );
      }
      
      req.flash('success', 'تنظیمات ربات با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/bot');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات ربات: ${error.message}`);
      res.redirect('/admin/settings/bot');
    }
  },

  /**
   * نمایش تنظیمات زبان و ترجمه
   */
  showLocalizationSettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const defaultLang = await Setting.findOne({ key: 'default_language' });
      const availableLangs = await Setting.findOne({ key: 'available_languages' });
      
      // دریافت ترجمه‌ها
      const translations = await Translation.find().sort({ locale: 1, key: 1 });
      
      // گروه‌بندی ترجمه‌ها بر اساس زبان
      const translationsByLang = {};
      
      translations.forEach(t => {
        if (!translationsByLang[t.locale]) {
          translationsByLang[t.locale] = [];
        }
        
        translationsByLang[t.locale].push(t);
      });
      
      res.render('settings/localization', {
        title: 'تنظیمات زبان و ترجمه',
        defaultLanguage: defaultLang?.value || 'fa',
        availableLanguages: availableLangs?.value ? availableLangs.value.split(',') : ['fa', 'en'],
        translations: translationsByLang
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات زبان: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * به‌روزرسانی تنظیمات زبان و ترجمه
   */
  updateLocalizationSettings: async (req, res) => {
    try {
      const { default_language, available_languages, translations } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      await Setting.findOneAndUpdate(
        { key: 'default_language' },
        { key: 'default_language', value: default_language },
        { upsert: true }
      );
      
      await Setting.findOneAndUpdate(
        { key: 'available_languages' },
        { key: 'available_languages', value: available_languages.join(',') },
        { upsert: true }
      );
      
      // به‌روزرسانی ترجمه‌ها
      if (translations) {
        for (const locale in translations) {
          for (const key in translations[locale]) {
            await Translation.findOneAndUpdate(
              { locale, key },
              { locale, key, value: translations[locale][key] },
              { upsert: true }
            );
          }
        }
      }
      
      req.flash('success', 'تنظیمات زبان با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/localization');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات زبان: ${error.message}`);
      res.redirect('/admin/settings/localization');
    }
  },

  /**
   * استخراج ترجمه‌ها
   */
  exportTranslations: async (req, res) => {
    try {
      const { locale } = req.query;
      
      let query = {};
      if (locale) {
        query.locale = locale;
      }
      
      const translations = await Translation.find(query).sort({ locale: 1, key: 1 });
      
      // تبدیل به JSON
      const exportData = {};
      
      translations.forEach(t => {
        if (!exportData[t.locale]) {
          exportData[t.locale] = {};
        }
        
        exportData[t.locale][t.key] = t.value;
      });
      
      // ارسال فایل JSON
      res.header('Content-Type', 'application/json');
      res.attachment(`translations${locale ? `-${locale}` : ''}.json`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      req.flash('error', `خطا در استخراج ترجمه‌ها: ${error.message}`);
      res.redirect('/admin/settings/localization');
    }
  },

  /**
   * وارد کردن ترجمه‌ها
   */
  importTranslations: async (req, res) => {
    try {
      // کد واقعی برای آپلود و پردازش فایل JSON در اینجا خواهد بود
      // به عنوان مثال ساده:
      const importData = JSON.parse(req.body.translations);
      
      for (const locale in importData) {
        for (const key in importData[locale]) {
          await Translation.findOneAndUpdate(
            { locale, key },
            { locale, key, value: importData[locale][key] },
            { upsert: true }
          );
        }
      }
      
      req.flash('success', 'ترجمه‌ها با موفقیت وارد شدند');
      res.redirect('/admin/settings/localization');
    } catch (error) {
      req.flash('error', `خطا در وارد کردن ترجمه‌ها: ${error.message}`);
      res.redirect('/admin/settings/localization');
    }
  },

  /**
   * نمایش تنظیمات پایگاه داده
   */
  showDatabaseSettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const settings = {};
      const keys = [
        'db_host',
        'db_port',
        'db_name',
        'db_user',
        'db_backup_enabled',
        'db_backup_interval',
        'db_backup_path',
        'last_backup_date'
      ];
      
      for (const key of keys) {
        const setting = await Setting.findOne({ key });
        settings[key] = setting?.value || '';
      }
      
      // دریافت اطلاعات پایگاه داده
      const dbStats = await mongoose.connection.db.stats();
      
      // لیست پشتیبان‌ها
      let backups = [];
      const backupPath = settings.db_backup_path || './backups';
      
      if (fs.existsSync(backupPath)) {
        backups = fs.readdirSync(backupPath)
          .filter(file => file.endsWith('.gz'))
          .map(file => {
            const stats = fs.statSync(path.join(backupPath, file));
            return {
              name: file,
              size: Math.round(stats.size / 1024) + ' KB',
              date: stats.mtime
            };
          })
          .sort((a, b) => b.date - a.date);
      }
      
      res.render('settings/database', {
        title: 'تنظیمات پایگاه داده',
        settings,
        dbStats: {
          collections: dbStats.collections,
          documents: dbStats.objects,
          dataSize: Math.round(dbStats.dataSize / (1024 * 1024) * 100) / 100 + ' MB',
          storageSize: Math.round(dbStats.storageSize / (1024 * 1024) * 100) / 100 + ' MB',
        },
        backups
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات پایگاه داده: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * به‌روزرسانی تنظیمات پایگاه داده
   */
  updateDatabaseSettings: async (req, res) => {
    try {
      const {
        db_host,
        db_port,
        db_name,
        db_user,
        db_backup_enabled,
        db_backup_interval,
        db_backup_path
      } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      const keys = [
        'db_host',
        'db_port',
        'db_name',
        'db_user',
        'db_backup_enabled',
        'db_backup_interval',
        'db_backup_path'
      ];
      
      const values = [
        db_host,
        db_port,
        db_name,
        db_user,
        db_backup_enabled === 'on' ? 'true' : 'false',
        db_backup_interval,
        db_backup_path
      ];
      
      for (let i = 0; i < keys.length; i++) {
        await Setting.findOneAndUpdate(
          { key: keys[i] },
          { key: keys[i], value: values[i] },
          { upsert: true }
        );
      }
      
      // ایجاد مسیر پشتیبان اگر وجود ندارد
      if (db_backup_path && !fs.existsSync(db_backup_path)) {
        fs.mkdirSync(db_backup_path, { recursive: true });
      }
      
      req.flash('success', 'تنظیمات پایگاه داده با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/database');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات پایگاه داده: ${error.message}`);
      res.redirect('/admin/settings/database');
    }
  },

  /**
   * ایجاد پشتیبان از پایگاه داده
   */
  createDatabaseBackup: async (req, res) => {
    try {
      // دریافت تنظیمات پشتیبان‌گیری
      const dbBackupPath = await Setting.findOne({ key: 'db_backup_path' });
      const backupPath = dbBackupPath?.value || './backups';
      
      // ایجاد مسیر پشتیبان اگر وجود ندارد
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
      
      // نام فایل پشتیبان
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${timestamp}.gz`;
      const filePath = path.join(backupPath, fileName);
      
      // اجرای دستور mongodump
      // توجه: این کد مثال است و در محیط واقعی نیاز به مدیریت امنیتی دارد
      const dbURI = mongoose.connection.client.s.url;
      const command = `mongodump --uri="${dbURI}" --gzip --archive="${filePath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          req.flash('error', `خطا در ایجاد پشتیبان: ${error.message}`);
          return res.redirect('/admin/settings/database');
        }
        
        // به‌روزرسانی تاریخ آخرین پشتیبان‌گیری
        Setting.findOneAndUpdate(
          { key: 'last_backup_date' },
          { key: 'last_backup_date', value: new Date().toISOString() },
          { upsert: true }
        ).then(() => {
          req.flash('success', `پشتیبان با موفقیت ایجاد شد: ${fileName}`);
          res.redirect('/admin/settings/database');
        });
      });
    } catch (error) {
      req.flash('error', `خطا در ایجاد پشتیبان: ${error.message}`);
      res.redirect('/admin/settings/database');
    }
  },

  /**
   * بازیابی پشتیبان پایگاه داده
   */
  restoreDatabaseBackup: async (req, res) => {
    try {
      const { backup_file } = req.body;
      
      // دریافت تنظیمات پشتیبان‌گیری
      const dbBackupPath = await Setting.findOne({ key: 'db_backup_path' });
      const backupPath = dbBackupPath?.value || './backups';
      
      // مسیر کامل فایل پشتیبان
      const filePath = path.join(backupPath, backup_file);
      
      // بررسی وجود فایل
      if (!fs.existsSync(filePath)) {
        req.flash('error', 'فایل پشتیبان یافت نشد');
        return res.redirect('/admin/settings/database');
      }
      
      // اجرای دستور mongorestore
      // توجه: این کد مثال است و در محیط واقعی نیاز به مدیریت امنیتی دارد
      const dbURI = mongoose.connection.client.s.url;
      const command = `mongorestore --uri="${dbURI}" --gzip --archive="${filePath}" --drop`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          req.flash('error', `خطا در بازیابی پشتیبان: ${error.message}`);
          return res.redirect('/admin/settings/database');
        }
        
        req.flash('success', 'پایگاه داده با موفقیت بازیابی شد');
        res.redirect('/admin/settings/database');
      });
    } catch (error) {
      req.flash('error', `خطا در بازیابی پشتیبان: ${error.message}`);
      res.redirect('/admin/settings/database');
    }
  },

  /**
   * نمایش تنظیمات امنیتی
   */
  showSecuritySettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const settings = {};
      const keys = [
        'security_login_attempts',
        'security_login_timeout',
        'security_session_timeout',
        'security_password_min_length',
        'security_password_require_special',
        'security_password_require_numbers',
        'security_password_expire_days',
        'security_api_rate_limit',
        'security_enable_captcha',
        'security_enable_2fa'
      ];
      
      for (const key of keys) {
        const setting = await Setting.findOne({ key });
        settings[key] = setting?.value || '';
      }
      
      res.render('settings/security', {
        title: 'تنظیمات امنیتی',
        settings
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات امنیتی: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * به‌روزرسانی تنظیمات امنیتی
   */
  updateSecuritySettings: async (req, res) => {
    try {
      const {
        security_login_attempts,
        security_login_timeout,
        security_session_timeout,
        security_password_min_length,
        security_password_require_special,
        security_password_require_numbers,
        security_password_expire_days,
        security_api_rate_limit,
        security_enable_captcha,
        security_enable_2fa
      } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      const keys = [
        'security_login_attempts',
        'security_login_timeout',
        'security_session_timeout',
        'security_password_min_length',
        'security_password_require_special',
        'security_password_require_numbers',
        'security_password_expire_days',
        'security_api_rate_limit',
        'security_enable_captcha',
        'security_enable_2fa'
      ];
      
      const values = [
        security_login_attempts,
        security_login_timeout,
        security_session_timeout,
        security_password_min_length,
        security_password_require_special === 'on' ? 'true' : 'false',
        security_password_require_numbers === 'on' ? 'true' : 'false',
        security_password_expire_days,
        security_api_rate_limit,
        security_enable_captcha === 'on' ? 'true' : 'false',
        security_enable_2fa === 'on' ? 'true' : 'false'
      ];
      
      for (let i = 0; i < keys.length; i++) {
        await Setting.findOneAndUpdate(
          { key: keys[i] },
          { key: keys[i], value: values[i] },
          { upsert: true }
        );
      }
      
      req.flash('success', 'تنظیمات امنیتی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/security');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات امنیتی: ${error.message}`);
      res.redirect('/admin/settings/security');
    }
  },

  /**
   * بازنشانی توکن‌های امنیتی
   */
  resetSecurityTokens: async (req, res) => {
    try {
      // بازنشانی توکن API
      const apiToken = generateRandomToken(32);
      await Setting.findOneAndUpdate(
        { key: 'security_api_token' },
        { key: 'security_api_token', value: apiToken },
        { upsert: true }
      );
      
      // بازنشانی توکن Webhook
      const webhookToken = generateRandomToken(32);
      await Setting.findOneAndUpdate(
        { key: 'security_webhook_token' },
        { key: 'security_webhook_token', value: webhookToken },
        { upsert: true }
      );
      
      req.flash('success', 'توکن‌های امنیتی با موفقیت بازنشانی شدند');
      res.redirect('/admin/settings/security');
    } catch (error) {
      req.flash('error', `خطا در بازنشانی توکن‌های امنیتی: ${error.message}`);
      res.redirect('/admin/settings/security');
    }
  },

  /**
   * نمایش تنظیمات اعلان‌ها
   */
  showNotificationSettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const settings = {};
      const keys = [
        'notification_discord_enabled',
        'notification_discord_webhook',
        'notification_email_enabled',
        'notification_email_from',
        'notification_email_smtp_host',
        'notification_email_smtp_port',
        'notification_email_smtp_user',
        'notification_telegram_enabled',
        'notification_telegram_bot_token',
        'notification_telegram_chat_id',
        'notification_system_events',
        'notification_user_events',
        'notification_error_events'
      ];
      
      for (const key of keys) {
        const setting = await Setting.findOne({ key });
        settings[key] = setting?.value || '';
      }
      
      res.render('settings/notifications', {
        title: 'تنظیمات اعلان‌ها',
        settings
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات اعلان‌ها: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * به‌روزرسانی تنظیمات اعلان‌ها
   */
  updateNotificationSettings: async (req, res) => {
    try {
      const {
        notification_discord_enabled,
        notification_discord_webhook,
        notification_email_enabled,
        notification_email_from,
        notification_email_smtp_host,
        notification_email_smtp_port,
        notification_email_smtp_user,
        notification_email_smtp_pass,
        notification_telegram_enabled,
        notification_telegram_bot_token,
        notification_telegram_chat_id,
        notification_system_events,
        notification_user_events,
        notification_error_events
      } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      const keys = [
        'notification_discord_enabled',
        'notification_discord_webhook',
        'notification_email_enabled',
        'notification_email_from',
        'notification_email_smtp_host',
        'notification_email_smtp_port',
        'notification_email_smtp_user',
        'notification_telegram_enabled',
        'notification_telegram_bot_token',
        'notification_telegram_chat_id',
        'notification_system_events',
        'notification_user_events',
        'notification_error_events'
      ];
      
      const values = [
        notification_discord_enabled === 'on' ? 'true' : 'false',
        notification_discord_webhook,
        notification_email_enabled === 'on' ? 'true' : 'false',
        notification_email_from,
        notification_email_smtp_host,
        notification_email_smtp_port,
        notification_email_smtp_user,
        notification_telegram_enabled === 'on' ? 'true' : 'false',
        notification_telegram_bot_token,
        notification_telegram_chat_id,
        notification_system_events === 'on' ? 'true' : 'false',
        notification_user_events === 'on' ? 'true' : 'false',
        notification_error_events === 'on' ? 'true' : 'false'
      ];
      
      for (let i = 0; i < keys.length; i++) {
        await Setting.findOneAndUpdate(
          { key: keys[i] },
          { key: keys[i], value: values[i] },
          { upsert: true }
        );
      }
      
      // ذخیره رمز عبور SMTP اگر وارد شده باشد
      if (notification_email_smtp_pass) {
        await Setting.findOneAndUpdate(
          { key: 'notification_email_smtp_pass' },
          { key: 'notification_email_smtp_pass', value: notification_email_smtp_pass },
          { upsert: true }
        );
      }
      
      req.flash('success', 'تنظیمات اعلان‌ها با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/notifications');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات اعلان‌ها: ${error.message}`);
      res.redirect('/admin/settings/notifications');
    }
  },

  /**
   * آزمایش سیستم اعلان
   */
  testNotification: async (req, res) => {
    try {
      const { notification_type } = req.body;
      
      // ارسال اعلان آزمایشی
      // کد واقعی برای ارسال اعلان به سرویس‌های مختلف در اینجا خواهد بود
      
      req.flash('success', `اعلان آزمایشی با موفقیت از طریق ${notification_type} ارسال شد`);
      res.redirect('/admin/settings/notifications');
    } catch (error) {
      req.flash('error', `خطا در ارسال اعلان آزمایشی: ${error.message}`);
      res.redirect('/admin/settings/notifications');
    }
  },

  /**
   * نمایش لیست کاربران ادمین
   */
  showAdminUsers: async (req, res) => {
    try {
      const adminUsers = await AdminUser.find().populate('role');
      const roles = await AdminRole.find().sort({ name: 1 });
      
      res.render('settings/admins/index', {
        title: 'مدیریت کاربران ادمین',
        adminUsers,
        roles
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری کاربران ادمین: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * ایجاد کاربر ادمین جدید
   */
  createAdminUser: async (req, res) => {
    try {
      const { username, password, email, fullName, role, isActive } = req.body;
      
      // بررسی تکراری نبودن نام کاربری
      const existingUser = await AdminUser.findOne({ username });
      if (existingUser) {
        req.flash('error', 'این نام کاربری قبلاً استفاده شده است');
        return res.redirect('/admin/settings/admins');
      }
      
      // هش کردن رمز عبور
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // ایجاد کاربر جدید
      await AdminUser.create({
        username,
        password: hashedPassword,
        email,
        fullName,
        role,
        isActive: isActive === 'on',
        createdAt: new Date()
      });
      
      req.flash('success', 'کاربر ادمین جدید با موفقیت ایجاد شد');
      res.redirect('/admin/settings/admins');
    } catch (error) {
      req.flash('error', `خطا در ایجاد کاربر ادمین: ${error.message}`);
      res.redirect('/admin/settings/admins');
    }
  },

  /**
   * نمایش جزئیات کاربر ادمین
   */
  showAdminUser: async (req, res) => {
    try {
      const adminUser = await AdminUser.findById(req.params.id).populate('role');
      
      if (!adminUser) {
        req.flash('error', 'کاربر ادمین مورد نظر یافت نشد');
        return res.redirect('/admin/settings/admins');
      }
      
      const roles = await AdminRole.find().sort({ name: 1 });
      
      res.render('settings/admins/edit', {
        title: `ویرایش کاربر ادمین: ${adminUser.username}`,
        adminUser,
        roles
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات کاربر ادمین: ${error.message}`);
      res.redirect('/admin/settings/admins');
    }
  },

  /**
   * به‌روزرسانی کاربر ادمین
   */
  updateAdminUser: async (req, res) => {
    try {
      const { username, password, email, fullName, role, isActive } = req.body;
      
      // بررسی تکراری نبودن نام کاربری
      const existingUser = await AdminUser.findOne({ 
        username, 
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        req.flash('error', 'این نام کاربری قبلاً استفاده شده است');
        return res.redirect(`/admin/settings/admins/${req.params.id}`);
      }
      
      // ایجاد آبجکت به‌روزرسانی
      const updateData = {
        username,
        email,
        fullName,
        role,
        isActive: isActive === 'on',
        updatedAt: new Date()
      };
      
      // اگر رمز عبور وارد شده باشد، آن را هش کرده و به‌روزرسانی می‌کنیم
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      // به‌روزرسانی کاربر
      await AdminUser.findByIdAndUpdate(req.params.id, updateData);
      
      req.flash('success', 'کاربر ادمین با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/admins');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی کاربر ادمین: ${error.message}`);
      res.redirect(`/admin/settings/admins/${req.params.id}`);
    }
  },

  /**
   * حذف کاربر ادمین
   */
  deleteAdminUser: async (req, res) => {
    try {
      // اطمینان از حذف نکردن کاربر فعلی
      if (req.session.user._id.toString() === req.params.id) {
        req.flash('error', 'شما نمی‌توانید حساب کاربری خود را حذف کنید');
        return res.redirect('/admin/settings/admins');
      }
      
      // اطمینان از وجود حداقل یک ادمین دیگر
      const adminsCount = await AdminUser.countDocuments();
      if (adminsCount <= 1) {
        req.flash('error', 'حداقل یک کاربر ادمین باید وجود داشته باشد');
        return res.redirect('/admin/settings/admins');
      }
      
      await AdminUser.findByIdAndDelete(req.params.id);
      
      req.flash('success', 'کاربر ادمین با موفقیت حذف شد');
      res.redirect('/admin/settings/admins');
    } catch (error) {
      req.flash('error', `خطا در حذف کاربر ادمین: ${error.message}`);
      res.redirect('/admin/settings/admins');
    }
  },

  /**
   * نمایش لیست نقش‌های ادمین
   */
  showAdminRoles: async (req, res) => {
    try {
      const roles = await AdminRole.find().sort({ name: 1 });
      
      res.render('settings/roles/index', {
        title: 'مدیریت نقش‌های ادمین',
        roles
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری نقش‌های ادمین: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * ایجاد نقش ادمین جدید
   */
  createAdminRole: async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      
      // بررسی تکراری نبودن نام نقش
      const existingRole = await AdminRole.findOne({ name });
      if (existingRole) {
        req.flash('error', 'این نام نقش قبلاً استفاده شده است');
        return res.redirect('/admin/settings/roles');
      }
      
      // ایجاد نقش جدید
      await AdminRole.create({
        name,
        description,
        permissions: permissions || [],
        createdAt: new Date()
      });
      
      req.flash('success', 'نقش ادمین جدید با موفقیت ایجاد شد');
      res.redirect('/admin/settings/roles');
    } catch (error) {
      req.flash('error', `خطا در ایجاد نقش ادمین: ${error.message}`);
      res.redirect('/admin/settings/roles');
    }
  },

  /**
   * نمایش جزئیات نقش ادمین
   */
  showAdminRole: async (req, res) => {
    try {
      const role = await AdminRole.findById(req.params.id);
      
      if (!role) {
        req.flash('error', 'نقش ادمین مورد نظر یافت نشد');
        return res.redirect('/admin/settings/roles');
      }
      
      // لیست تمام دسترسی‌های ممکن
      const allPermissions = [
        { key: 'dashboard_view', name: 'مشاهده داشبورد' },
        { key: 'users_view', name: 'مشاهده کاربران' },
        { key: 'users_edit', name: 'ویرایش کاربران' },
        { key: 'economy_view', name: 'مشاهده اقتصاد' },
        { key: 'economy_edit', name: 'ویرایش اقتصاد' },
        { key: 'games_view', name: 'مشاهده بازی‌ها' },
        { key: 'games_edit', name: 'ویرایش بازی‌ها' },
        { key: 'events_view', name: 'مشاهده رویدادها' },
        { key: 'events_edit', name: 'ویرایش رویدادها' },
        { key: 'servers_view', name: 'مشاهده سرورها' },
        { key: 'servers_edit', name: 'ویرایش سرورها' },
        { key: 'logs_view', name: 'مشاهده لاگ‌ها' },
        { key: 'settings_view', name: 'مشاهده تنظیمات' },
        { key: 'settings_edit', name: 'ویرایش تنظیمات' },
        { key: 'admins_view', name: 'مشاهده ادمین‌ها' },
        { key: 'admins_edit', name: 'ویرایش ادمین‌ها' }
      ];
      
      res.render('settings/roles/edit', {
        title: `ویرایش نقش ادمین: ${role.name}`,
        role,
        allPermissions
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات نقش ادمین: ${error.message}`);
      res.redirect('/admin/settings/roles');
    }
  },

  /**
   * به‌روزرسانی نقش ادمین
   */
  updateAdminRole: async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      
      // بررسی تکراری نبودن نام نقش
      const existingRole = await AdminRole.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingRole) {
        req.flash('error', 'این نام نقش قبلاً استفاده شده است');
        return res.redirect(`/admin/settings/roles/${req.params.id}`);
      }
      
      // به‌روزرسانی نقش
      await AdminRole.findByIdAndUpdate(req.params.id, {
        name,
        description,
        permissions: permissions || [],
        updatedAt: new Date()
      });
      
      req.flash('success', 'نقش ادمین با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/settings/roles');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی نقش ادمین: ${error.message}`);
      res.redirect(`/admin/settings/roles/${req.params.id}`);
    }
  },

  /**
   * حذف نقش ادمین
   */
  deleteAdminRole: async (req, res) => {
    try {
      // بررسی استفاده نشدن نقش توسط کاربران
      const usersWithRole = await AdminUser.countDocuments({ role: req.params.id });
      
      if (usersWithRole > 0) {
        req.flash('error', 'این نقش توسط کاربران استفاده می‌شود و نمی‌تواند حذف شود');
        return res.redirect('/admin/settings/roles');
      }
      
      await AdminRole.findByIdAndDelete(req.params.id);
      
      req.flash('success', 'نقش ادمین با موفقیت حذف شد');
      res.redirect('/admin/settings/roles');
    } catch (error) {
      req.flash('error', `خطا در حذف نقش ادمین: ${error.message}`);
      res.redirect('/admin/settings/roles');
    }
  },

  /**
   * نمایش لیست ماژول‌ها
   */
  showModules: async (req, res) => {
    try {
      const modules = await Module.find().sort({ name: 1 });
      
      res.render('settings/modules/index', {
        title: 'مدیریت ماژول‌ها',
        modules
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری ماژول‌ها: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * فعال/غیرفعال کردن ماژول
   */
  toggleModule: async (req, res) => {
    try {
      const module = await Module.findById(req.params.id);
      
      if (!module) {
        req.flash('error', 'ماژول مورد نظر یافت نشد');
        return res.redirect('/admin/settings/modules');
      }
      
      // تغییر وضعیت فعال بودن
      await Module.findByIdAndUpdate(req.params.id, {
        isActive: !module.isActive
      });
      
      req.flash('success', `ماژول ${module.name} ${module.isActive ? 'غیرفعال' : 'فعال'} شد`);
      res.redirect('/admin/settings/modules');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت ماژول: ${error.message}`);
      res.redirect('/admin/settings/modules');
    }
  },

  /**
   * به‌روزرسانی تنظیمات ماژول
   */
  updateModuleSettings: async (req, res) => {
    try {
      const { settings } = req.body;
      
      const module = await Module.findById(req.params.id);
      
      if (!module) {
        req.flash('error', 'ماژول مورد نظر یافت نشد');
        return res.redirect('/admin/settings/modules');
      }
      
      // به‌روزرسانی تنظیمات ماژول
      await Module.findByIdAndUpdate(req.params.id, {
        settings: settings || {}
      });
      
      req.flash('success', `تنظیمات ماژول ${module.name} با موفقیت به‌روزرسانی شد`);
      res.redirect('/admin/settings/modules');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات ماژول: ${error.message}`);
      res.redirect('/admin/settings/modules');
    }
  },

  /**
   * نمایش صفحه پشتیبانی
   */
  showSupportPage: async (req, res) => {
    try {
      // دریافت پیام‌های پشتیبانی قبلی
      const supportMessages = await Support.find()
        .sort({ createdAt: -1 })
        .limit(10);
      
      res.render('settings/support', {
        title: 'پشتیبانی',
        supportMessages
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری صفحه پشتیبانی: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * ارسال پیام پشتیبانی
   */
  sendSupportMessage: async (req, res) => {
    try {
      const { subject, message, type } = req.body;
      
      // ذخیره پیام پشتیبانی
      await Support.create({
        subject,
        message,
        type: type || 'question',
        userId: req.session.user._id,
        createdAt: new Date()
      });
      
      // کد واقعی برای ارسال پیام به سیستم پشتیبانی در اینجا خواهد بود
      
      req.flash('success', 'پیام پشتیبانی با موفقیت ارسال شد');
      res.redirect('/admin/settings/support');
    } catch (error) {
      req.flash('error', `خطا در ارسال پیام پشتیبانی: ${error.message}`);
      res.redirect('/admin/settings/support');
    }
  },

  /**
   * نمایش تنظیمات نگهداری
   */
  showMaintenanceSettings: async (req, res) => {
    try {
      // دریافت تنظیمات از دیتابیس
      const maintenanceMode = await Setting.findOne({ key: 'maintenance_mode' });
      const maintenanceMessage = await Setting.findOne({ key: 'maintenance_message' });
      const lastCacheClear = await Setting.findOne({ key: 'last_cache_clear' });
      const lastRestart = await Setting.findOne({ key: 'last_restart' });
      
      // اطلاعات سیستم
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: Math.floor(process.uptime() / 3600) + ' ساعت',
        memoryUsage: Math.round(process.memoryUsage().rss / (1024 * 1024)) + ' MB',
        dbConnections: mongoose.connections.length
      };
      
      res.render('settings/maintenance', {
        title: 'تنظیمات نگهداری',
        maintenanceMode: maintenanceMode?.value === 'true',
        maintenanceMessage: maintenanceMessage?.value || 'سایت در حال به‌روزرسانی است. لطفاً بعداً مراجعه کنید.',
        lastCacheClear: lastCacheClear?.value ? new Date(lastCacheClear.value) : null,
        lastRestart: lastRestart?.value ? new Date(lastRestart.value) : null,
        systemInfo
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات نگهداری: ${error.message}`);
      res.redirect('/admin/settings');
    }
  },

  /**
   * فعال/غیرفعال کردن حالت نگهداری
   */
  toggleMaintenanceMode: async (req, res) => {
    try {
      const { maintenance_mode, maintenance_message } = req.body;
      
      // ذخیره تنظیمات در دیتابیس
      await Setting.findOneAndUpdate(
        { key: 'maintenance_mode' },
        { key: 'maintenance_mode', value: maintenance_mode === 'on' ? 'true' : 'false' },
        { upsert: true }
      );
      
      if (maintenance_message) {
        await Setting.findOneAndUpdate(
          { key: 'maintenance_message' },
          { key: 'maintenance_message', value: maintenance_message },
          { upsert: true }
        );
      }
      
      req.flash('success', `حالت نگهداری ${maintenance_mode === 'on' ? 'فعال' : 'غیرفعال'} شد`);
      res.redirect('/admin/settings/maintenance');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت حالت نگهداری: ${error.message}`);
      res.redirect('/admin/settings/maintenance');
    }
  },

  /**
   * پاک کردن کش
   */
  clearCache: async (req, res) => {
    try {
      // کد واقعی برای پاک کردن کش در اینجا خواهد بود
      
      // به‌روزرسانی تاریخ آخرین پاک کردن کش
      await Setting.findOneAndUpdate(
        { key: 'last_cache_clear' },
        { key: 'last_cache_clear', value: new Date().toISOString() },
        { upsert: true }
      );
      
      req.flash('success', 'کش با موفقیت پاک شد');
      res.redirect('/admin/settings/maintenance');
    } catch (error) {
      req.flash('error', `خطا در پاک کردن کش: ${error.message}`);
      res.redirect('/admin/settings/maintenance');
    }
  },

  /**
   * راه‌اندازی مجدد سرویس‌ها
   */
  restartServices: async (req, res) => {
    try {
      // کد واقعی برای راه‌اندازی مجدد سرویس‌ها در اینجا خواهد بود
      
      // به‌روزرسانی تاریخ آخرین راه‌اندازی مجدد
      await Setting.findOneAndUpdate(
        { key: 'last_restart' },
        { key: 'last_restart', value: new Date().toISOString() },
        { upsert: true }
      );
      
      req.flash('success', 'سرویس‌ها با موفقیت راه‌اندازی مجدد شدند');
      res.redirect('/admin/settings/maintenance');
    } catch (error) {
      req.flash('error', `خطا در راه‌اندازی مجدد سرویس‌ها: ${error.message}`);
      res.redirect('/admin/settings/maintenance');
    }
  }
};

/**
 * تولید توکن تصادفی
 * @param {number} length طول توکن
 * @returns {string} توکن تصادفی
 */
function generateRandomToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}