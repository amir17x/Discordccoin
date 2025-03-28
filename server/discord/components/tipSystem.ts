/**
 * سیستم نکات و راهنمایی‌ها - Ccoin
 * این ماژول برای ارسال نکات و راهنمایی‌ها به کانال‌های دیسکورد در زمان‌های مشخص استفاده می‌شود
 */

import { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from 'discord.js';
import { storage } from '../../storage';
import { v4 as uuidv4 } from 'uuid';
import { TipChannelModel } from '../../database';
import { generateAITip, tipTopics } from '../utils/aiTips';

// برای ذخیره تایمرهای نکات فعال
const tipTimers: Map<string, NodeJS.Timeout> = new Map();

// برای ذخیره نکات و راهنمایی‌ها
const tips: Map<string, string[]> = new Map();

// تنظیمات کانال نکات
export interface TipChannelSettings {
  guildId: string;
  channelId: string;
  interval: number; // به میلی‌ثانیه
  lastTipTime?: number;
  isActive: boolean;
}

// آرایه‌ای از نکات پیش‌فرض
const defaultTips = [
  "برای دریافت سکه روزانه خود از دستور `/daily` استفاده کنید.",
  "سکه‌های خود را در بانک با دستور `/bank deposit` ذخیره کنید تا امن بمانند.",
  "می‌توانید با استفاده از دستور `/shop` آیتم‌های مختلف خریداری کنید.",
  "برای مشاهده موجودی خود از دستور `/balance` استفاده کنید.",
  "با دستور `/leaderboard` می‌توانید برترین کاربران را مشاهده کنید.",
  "با استفاده از دستور `/profile` اطلاعات پروفایل خود را ببینید.",
  "دستور `/help` لیست تمام دستورات را نمایش می‌دهد.",
  "سکه‌های ذخیره شده در بانک هر ساعت سود دریافت می‌کنند.",
  "با شرکت در مسابقات و چالش‌ها می‌توانید سکه‌های بیشتری به دست آورید.",
  "با انجام ماموریت‌ها با دستور `/quests` پاداش دریافت کنید.",
  "با استفاده از دستور `/clan` می‌توانید به یک کلن بپیوندید یا کلن جدید ایجاد کنید.",
  "با افزایش سطح خود امکانات بیشتری را آزاد می‌کنید.",
  "با ارسال هدیه به دوستان خود می‌توانید روابط دوستی را تقویت کنید.",
  "می‌توانید با استفاده از دستور `/wheel` شانس خود را در چرخ شانس امتحان کنید.",
  "برای دیدن وضعیت دوستان خود از دستور `/friends` استفاده کنید.",
  "با دستور `/inventory` می‌توانید آیتم‌های خود را مدیریت کنید.",
  "با فعال کردن استریک روزانه پاداش‌های بیشتری دریافت می‌کنید.",
  "با استفاده از کریستال‌ها می‌توانید آیتم‌های ویژه خریداری کنید.",
  "برای تبدیل سکه به کریستال از دستور `/convert` استفاده کنید.",
  "با دستور `/settings` می‌توانید تنظیمات شخصی خود را تغییر دهید."
];

/**
 * راه‌اندازی سیستم نکات
 * @param client کلاینت دیسکورد
 */
export function setupTipSystem(client: Client) {
  if (!client || !client.isReady()) {
    console.error("خطا: کلاینت دیسکورد برای راه‌اندازی سیستم نکات آماده نیست.");
    return;
  }

  console.log("🔍 در حال راه‌اندازی سیستم نکات...");

  // افزودن نکات پیش‌فرض
  tips.set("general", defaultTips);

  // اضافه کردن دسته‌های دیگر نکات
  tips.set("economy", [
    "با استفاده از دستور `/work` می‌توانید کار کنید و سکه دریافت کنید.",
    "با سرمایه‌گذاری در بازار سهام می‌توانید درآمد بیشتری کسب کنید.",
    "قیمت سهام هر ۶ ساعت یکبار تغییر می‌کند.",
    "با ارتقای مهارت‌های کاری می‌توانید درآمد بیشتری کسب کنید.",
    "سود بانکی بر اساس میزان موجودی شما محاسبه می‌شود."
  ]);

  tips.set("social", [
    "با ارسال پیام خصوصی به دوستان خود می‌توانید ارتباط برقرار کنید.",
    "دوستان نزدیک امکانات ویژه‌ای مانند ارسال هدیه دارند.",
    "با افزایش سطح دوستی، امکانات بیشتری باز می‌شوند.",
    "می‌توانید دوستان خود را به بازی‌های دو نفره دعوت کنید.",
    "با انجام فعالیت‌های مشترک با دوستان تجربه بیشتری دریافت می‌کنید."
  ]);

  tips.set("games", [
    "در بازی دوئل می‌توانید با دیگر کاربران رقابت کنید.",
    "بازی‌های شانسی مانند چرخ شانس و قرعه‌کشی جوایز ارزشمندی دارند.",
    "با شرکت در رویدادهای ویژه می‌توانید جوایز منحصر به فرد کسب کنید.",
    "هر هفته چالش‌های جدیدی به بازی اضافه می‌شود.",
    "با ارتقای سطح می‌توانید به بازی‌های پیشرفته‌تر دسترسی پیدا کنید."
  ]);

  // بارگذاری کانال‌های نکات فعال از دیتابیس
  loadActiveTipChannels(client);

  console.log("✅ سیستم نکات با موفقیت راه‌اندازی شد.");
}

/**
 * بارگذاری تمام کانال‌های نکات فعال از دیتابیس
 * @param client کلاینت دیسکورد
 */
async function loadActiveTipChannels(client: Client) {
  try {
    console.log("🔄 در حال بارگذاری کانال‌های نکات فعال...");
    
    // دریافت همه کانال‌های نکات فعال
    const activeChannels = await storage.getAllActiveTipChannelSettings();
    console.log(`📊 ${activeChannels.length} کانال نکات فعال یافت شد.`);

    // راه‌اندازی تایمر برای هر کانال
    for (const channelSettings of activeChannels) {
      setupTipTimer(client, channelSettings);
    }
  } catch (error) {
    console.error("❌ خطا در بارگذاری کانال‌های نکات فعال:", error);
  }
}

/**
 * تنظیم تایمر برای ارسال نکات به یک کانال
 * @param client کلاینت دیسکورد
 * @param settings تنظیمات کانال نکات
 */
function setupTipTimer(client: Client, settings: TipChannelSettings) {
  try {
    // اگر تایمر قبلی وجود دارد، آن را پاک می‌کنیم
    if (tipTimers.has(settings.guildId)) {
      clearTimeout(tipTimers.get(settings.guildId)!);
      tipTimers.delete(settings.guildId);
    }

    // اگر کانال فعال نیست، کاری نمی‌کنیم
    if (!settings.isActive) {
      console.log(`⏸️ کانال نکات برای سرور ${settings.guildId} غیرفعال است.`);
      return;
    }

    // محاسبه زمان ارسال نکته بعدی
    let nextTipTime = settings.interval;
    
    if (settings.lastTipTime) {
      const timeSinceLastTip = Date.now() - settings.lastTipTime;
      nextTipTime = Math.max(0, settings.interval - timeSinceLastTip);
    }

    console.log(`⏱️ تنظیم تایمر نکات برای سرور ${settings.guildId} - ارسال بعدی در ${Math.floor(nextTipTime / 60000)} دقیقه دیگر`);

    // تنظیم تایمر جدید
    const timerId = setTimeout(() => {
      sendTip(client, settings);
    }, nextTipTime);

    // ذخیره تایمر
    tipTimers.set(settings.guildId, timerId);
  } catch (error) {
    console.error(`❌ خطا در تنظیم تایمر نکات برای سرور ${settings.guildId}:`, error);
  }
}

/**
 * ارسال یک نکته به کانال مشخص شده
 * @param client کلاینت دیسکورد
 * @param settings تنظیمات کانال نکات
 */
async function sendTip(client: Client, settings: TipChannelSettings) {
  try {
    // دریافت کانال
    const channel = await client.channels.fetch(settings.channelId) as TextChannel;
    
    if (!channel || !channel.isTextBased()) {
      console.error(`❌ کانال نکات ${settings.channelId} در سرور ${settings.guildId} یافت نشد یا متنی نیست.`);
      return;
    }

    // تعیین اینکه آیا از هوش مصنوعی استفاده شود (افزایش احتمال به 60%)
    const useAI = Math.random() < 0.6;
    
    let tipText = '';
    let category = '';
    let randomTopic = ''; // برای نگهداری موضوع اتفاقی نکته
    
    if (useAI) {
      // استفاده از هوش مصنوعی برای تولید نکته
      try {
        // انتخاب یک موضوع اتفاقی برای نمایش در امبد
        randomTopic = tipTopics[Math.floor(Math.random() * tipTopics.length)];
        
        tipText = await generateAITip();
        category = 'ai';
        console.log(`🤖 نکته هوشمند با استفاده از Hugging Face تولید شد.`);
      } catch (aiError) {
        console.error(`❌ خطا در تولید نکته هوشمند: ${aiError}. استفاده از نکات معمولی.`);
        // در صورت خطا، استفاده از نکات معمولی
        const categories = Array.from(tips.keys());
        category = categories[Math.floor(Math.random() * categories.length)];
        const categoryTips = tips.get(category) || defaultTips;
        tipText = categoryTips[Math.floor(Math.random() * categoryTips.length)];
      }
    } else {
      // استفاده از نکات از پیش تعریف شده
      const categories = Array.from(tips.keys());
      category = categories[Math.floor(Math.random() * categories.length)];
      const categoryTips = tips.get(category) || defaultTips;
      tipText = categoryTips[Math.floor(Math.random() * categoryTips.length)];
    }

    // ایجاد امبد برای نمایش نکته - با طراحی جذاب‌تر برای نکات هوش مصنوعی
    const embed = new EmbedBuilder()
      .setColor(useAI ? '#8A2BE2' : '#0099ff') // رنگ متفاوت برای نکات هوشمند
      .setTitle(useAI ? '🧠 نکته هوشمند Ccoin' : '💡 نکته روز')
      .setDescription(tipText);
    
    // اضافه کردن فیلد‌های بیشتر برای نکته‌های هوشمند
    if (useAI) {
      embed.addFields([
        {
          name: '🔍 موضوع',
          value: randomTopic || category,
          inline: true
        },
        {
          name: '🤖 منبع',
          value: 'هوش مصنوعی پیشرفته',
          inline: true
        }
      ]);
    }
    
    // اضافه کردن پاورقی
    embed.setFooter({ 
      text: `دسته: ${getCategoryDisplayName(category)} | ${useAI ? 'با قدرت هوش مصنوعی پیشرفته' : ''} | دستور /admin برای تنظیمات` 
    })
    .setTimestamp();

    // ارسال پیام
    await channel.send({ embeds: [embed] });
    
    console.log(`✅ نکته به کانال ${settings.channelId} در سرور ${settings.guildId} ارسال شد.`);

    // به‌روزرسانی زمان آخرین ارسال نکته
    const updatedSettings: TipChannelSettings = {
      ...settings,
      lastTipTime: Date.now()
    };

    // ذخیره تنظیمات به‌روزرسانی شده
    await storage.setTipChannelSettings(updatedSettings);

    // تنظیم مجدد تایمر برای نکته بعدی
    setupTipTimer(client, updatedSettings);
  } catch (error) {
    console.error(`❌ خطا در ارسال نکته به کانال ${settings.channelId} در سرور ${settings.guildId}:`, error);

    // در صورت خطا، تنظیم مجدد تایمر با تنظیمات فعلی
    setupTipTimer(client, settings);
  }
}

/**
 * تبدیل کلید دسته به نام نمایشی
 * @param category کلید دسته
 * @returns نام نمایشی دسته
 */
function getCategoryDisplayName(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'general': 'عمومی',
    'economy': 'اقتصادی',
    'social': 'اجتماعی',
    'games': 'بازی‌ها',
    'ai': 'هوش مصنوعی'
  };

  return categoryMap[category] || 'عمومی';
}

/**
 * افزودن یک کانال نکات جدید
 * @param guildId شناسه سرور
 * @param channelId شناسه کانال
 * @param interval فاصله زمانی ارسال نکات (به دقیقه)
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export async function addTipChannel(guildId: string, channelId: string, interval: number = 60): Promise<boolean> {
  try {
    // تبدیل فاصله زمانی از دقیقه به میلی‌ثانیه
    const intervalMs = interval * 60 * 1000;

    // ایجاد تنظیمات جدید
    const newSettings: TipChannelSettings = {
      guildId,
      channelId,
      interval: intervalMs,
      isActive: true
    };

    // ذخیره تنظیمات در دیتابیس
    const success = await storage.setTipChannelSettings(newSettings);

    if (success) {
      console.log(`✅ کانال نکات جدید برای سرور ${guildId} اضافه شد.`);
    } else {
      console.error(`❌ خطا در افزودن کانال نکات برای سرور ${guildId}.`);
    }

    return success;
  } catch (error) {
    console.error(`❌ خطا در افزودن کانال نکات برای سرور ${guildId}:`, error);
    return false;
  }
}

/**
 * حذف یک کانال نکات
 * @param guildId شناسه سرور
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export async function removeTipChannel(guildId: string): Promise<boolean> {
  try {
    // حذف تایمر فعلی اگر وجود دارد
    if (tipTimers.has(guildId)) {
      clearTimeout(tipTimers.get(guildId)!);
      tipTimers.delete(guildId);
    }

    // حذف تنظیمات کانال از دیتابیس
    await TipChannelModel.deleteOne({ guildId });
    
    console.log(`✅ کانال نکات برای سرور ${guildId} حذف شد.`);
    return true;
  } catch (error) {
    console.error(`❌ خطا در حذف کانال نکات برای سرور ${guildId}:`, error);
    return false;
  }
}

/**
 * فعال یا غیرفعال کردن کانال نکات
 * @param guildId شناسه سرور
 * @param active وضعیت فعال بودن
 * @param client کلاینت دیسکورد
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export async function toggleTipChannel(guildId: string, active: boolean, client: Client): Promise<boolean> {
  try {
    // دریافت تنظیمات فعلی
    const currentSettings = await storage.getTipChannelSettings(guildId);

    if (!currentSettings) {
      console.error(`❌ تنظیمات کانال نکات برای سرور ${guildId} یافت نشد.`);
      return false;
    }

    // به‌روزرسانی وضعیت فعال بودن
    const updatedSettings: TipChannelSettings = {
      ...currentSettings,
      isActive: active
    };

    // ذخیره تنظیمات به‌روزرسانی شده
    const success = await storage.setTipChannelSettings(updatedSettings);

    if (success) {
      // اگر فعال شد، تایمر را تنظیم کنید
      if (active) {
        setupTipTimer(client, updatedSettings);
        console.log(`✅ کانال نکات برای سرور ${guildId} فعال شد.`);
      } else {
        // اگر غیرفعال شد، تایمر را حذف کنید
        if (tipTimers.has(guildId)) {
          clearTimeout(tipTimers.get(guildId)!);
          tipTimers.delete(guildId);
        }
        console.log(`⏸️ کانال نکات برای سرور ${guildId} غیرفعال شد.`);
      }
    } else {
      console.error(`❌ خطا در تغییر وضعیت کانال نکات برای سرور ${guildId}.`);
    }

    return success;
  } catch (error) {
    console.error(`❌ خطا در تغییر وضعیت کانال نکات برای سرور ${guildId}:`, error);
    return false;
  }
}

/**
 * تغییر کانال نکات
 * @param guildId شناسه سرور
 * @param newChannelId شناسه کانال جدید
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export async function updateTipChannel(guildId: string, newChannelId: string): Promise<boolean> {
  try {
    // دریافت تنظیمات فعلی
    const currentSettings = await storage.getTipChannelSettings(guildId);

    if (!currentSettings) {
      console.error(`❌ تنظیمات کانال نکات برای سرور ${guildId} یافت نشد.`);
      return false;
    }

    // به‌روزرسانی شناسه کانال
    const updatedSettings: TipChannelSettings = {
      ...currentSettings,
      channelId: newChannelId
    };

    // ذخیره تنظیمات به‌روزرسانی شده
    const success = await storage.setTipChannelSettings(updatedSettings);

    if (success) {
      console.log(`✅ کانال نکات برای سرور ${guildId} به ${newChannelId} تغییر یافت.`);
    } else {
      console.error(`❌ خطا در تغییر کانال نکات برای سرور ${guildId}.`);
    }

    return success;
  } catch (error) {
    console.error(`❌ خطا در تغییر کانال نکات برای سرور ${guildId}:`, error);
    return false;
  }
}

/**
 * تغییر فاصله زمانی ارسال نکات
 * @param guildId شناسه سرور
 * @param newInterval فاصله زمانی جدید (به دقیقه)
 * @param client کلاینت دیسکورد
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export async function updateTipInterval(guildId: string, newInterval: number, client: Client): Promise<boolean> {
  try {
    // تبدیل فاصله زمانی از دقیقه به میلی‌ثانیه
    const intervalMs = newInterval * 60 * 1000;

    // دریافت تنظیمات فعلی
    const currentSettings = await storage.getTipChannelSettings(guildId);

    if (!currentSettings) {
      console.error(`❌ تنظیمات کانال نکات برای سرور ${guildId} یافت نشد.`);
      return false;
    }

    // به‌روزرسانی فاصله زمانی
    const updatedSettings: TipChannelSettings = {
      ...currentSettings,
      interval: intervalMs
    };

    // ذخیره تنظیمات به‌روزرسانی شده
    const success = await storage.setTipChannelSettings(updatedSettings);

    if (success) {
      console.log(`✅ فاصله زمانی نکات برای سرور ${guildId} به ${newInterval} دقیقه تغییر یافت.`);
      
      // تنظیم مجدد تایمر با فاصله زمانی جدید
      if (updatedSettings.isActive) {
        setupTipTimer(client, updatedSettings);
      }
    } else {
      console.error(`❌ خطا در تغییر فاصله زمانی نکات برای سرور ${guildId}.`);
    }

    return success;
  } catch (error) {
    console.error(`❌ خطا در تغییر فاصله زمانی نکات برای سرور ${guildId}:`, error);
    return false;
  }
}

/**
 * ارسال فوری یک نکته به کانال مشخص شده
 * @param guildId شناسه سرور
 * @param client کلاینت دیسکورد
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export async function sendImmediateTip(guildId: string, client: Client): Promise<boolean> {
  try {
    // دریافت تنظیمات کانال
    const settings = await storage.getTipChannelSettings(guildId);

    if (!settings) {
      console.error(`❌ تنظیمات کانال نکات برای سرور ${guildId} یافت نشد.`);
      return false;
    }

    // ارسال نکته
    await sendTip(client, settings);
    
    return true;
  } catch (error) {
    console.error(`❌ خطا در ارسال فوری نکته برای سرور ${guildId}:`, error);
    return false;
  }
}

/**
 * افزودن یک نکته جدید به سیستم
 * @param category دسته نکته
 * @param tipText متن نکته
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export function addTip(category: string, tipText: string): boolean {
  try {
    // اگر دسته وجود ندارد، آن را ایجاد کنید
    if (!tips.has(category)) {
      tips.set(category, []);
    }

    // افزودن نکته به دسته
    tips.get(category)!.push(tipText);
    
    console.log(`✅ نکته جدید به دسته ${category} اضافه شد.`);
    return true;
  } catch (error) {
    console.error(`❌ خطا در افزودن نکته به دسته ${category}:`, error);
    return false;
  }
}

/**
 * حذف یک نکته از سیستم
 * @param category دسته نکته
 * @param index شاخص نکته
 * @returns آیا عملیات موفقیت‌آمیز بود
 */
export function removeTip(category: string, index: number): boolean {
  try {
    // بررسی وجود دسته
    if (!tips.has(category)) {
      console.error(`❌ دسته ${category} یافت نشد.`);
      return false;
    }

    const categoryTips = tips.get(category)!;

    // بررسی معتبر بودن شاخص
    if (index < 0 || index >= categoryTips.length) {
      console.error(`❌ شاخص ${index} نامعتبر است. باید بین 0 و ${categoryTips.length - 1} باشد.`);
      return false;
    }

    // حذف نکته
    categoryTips.splice(index, 1);
    
    console.log(`✅ نکته با شاخص ${index} از دسته ${category} حذف شد.`);
    return true;
  } catch (error) {
    console.error(`❌ خطا در حذف نکته با شاخص ${index} از دسته ${category}:`, error);
    return false;
  }
}

/**
 * دریافت تمام نکات یک دسته
 * @param category دسته نکته
 * @returns آرایه‌ای از نکات
 */
export function getTips(category: string): string[] {
  // اگر دسته وجود داشت، نکات آن را برگردانید
  if (tips.has(category)) {
    return [...tips.get(category)!];
  }
  
  // در غیر این صورت، نکات پیش‌فرض را برگردانید
  return [...defaultTips];
}

/**
 * دریافت تمام دسته‌های موجود
 * @returns آرایه‌ای از نام دسته‌ها
 */
export function getTipCategories(): string[] {
  return Array.from(tips.keys());
}

/**
 * پاکسازی تمام تایمرهای فعال
 */
export function clearAllTipTimers(): void {
  for (const [guildId, timerId] of tipTimers.entries()) {
    clearTimeout(timerId);
    console.log(`🔄 تایمر نکات برای سرور ${guildId} پاکسازی شد.`);
  }
  
  tipTimers.clear();
  console.log("🧹 تمام تایمرهای نکات پاکسازی شدند.");
}

/**
 * دریافت تعداد کانال‌های نکات فعال
 * @returns تعداد کانال‌های فعال
 */
export function getActiveTipChannelCount(): number {
  return tipTimers.size;
}