import { TextChannel } from 'discord.js';
import { storage } from '../../storage';

// آرایه نکات آموزشی و طنز
const tipsList = [
  // نکات اقتصادی
  "💰 **نکته اقتصادی**: سپرده‌گذاری در بانک بهترین راه برای افزایش ثروت مداوم است. سود روزانه 2% در طولانی مدت تاثیر زیادی دارد!",
  "💰 **نکته اقتصادی**: کوئست‌های روزانه را فراموش نکنید. با انجام آنها می‌توانید تا 150 Ccoin در روز درآمد اضافی کسب کنید!",
  "💰 **نکته اقتصادی**: معامله با دوستان کارمزد کمتری (3% به جای 5%) نسبت به معامله با کاربران دیگر دارد.",
  
  // ترفندهای بازی‌ها
  "🎮 **ترفند بازی**: در دوئل، شروع با حمله قوی همیشه بهترین استراتژی نیست. گاهی دفاع قوی و حمله در زمان مناسب بهتر جواب می‌دهد!",
  "🎮 **ترفند بازی**: در بازی تاس، استراتژی ریسک بیشتر برای بازیکنانی که عقب هستند توصیه می‌شود - شانس برد را افزایش می‌دهد!",
  "🎮 **ترفند بازی**: در مسابقات تایپ، دقت مهم‌تر از سرعت است. اشتباهات تایپی امتیاز شما را کاهش می‌دهند!",
  
  // مدیریت سرمایه
  "🏦 **مدیریت سرمایه**: موجودی خود را به سه بخش تقسیم کنید: خرج روزانه (30%)، پس‌انداز (50%) و سرمایه‌گذاری (20%) - روش حرفه‌ای‌ها!",
  "🏦 **مدیریت سرمایه**: هرگز بیش از 30% دارایی خود را در یک مورد سرمایه‌گذاری نکنید. تنوع سرمایه‌گذاری ریسک را کاهش می‌دهد!",
  "🏦 **مدیریت سرمایه**: هزینه کردن برای ارتقای ظرفیت‌ها سرمایه‌گذاری بلندمدت محسوب می‌شود و بازگشت سرمایه خوبی دارد.",
  
  // راهکارهای کلن
  "🏰 **راهکار کلن**: عضویت در کلن‌های فعال می‌تواند درآمد روزانه شما را تا 30% افزایش دهد!",
  "🏰 **راهکار کلن**: قبل از جنگ کلن‌ها، منابع خود را ذخیره کنید تا بتوانید به موقع از آنها استفاده کنید.",
  "🏰 **راهکار کلن**: برای پیشرفت سریع‌تر کلن، بخشی از درآمد روزانه را به خزانه اهدا کنید. موفقیت کلن به نفع همه اعضاست!",
  
  // نکات سرقت و دفاع
  "🔒 **نکته امنیتی**: سکه‌های خود را در بانک نگهداری کنید تا از سرقت محافظت شوند. سارقان نمی‌توانند به حساب بانکی دسترسی پیدا کنند!",
  "🔒 **نکته امنیتی**: ارتقای سیستم‌های امنیتی خانه هزینه‌بر است اما از سرقت‌های پی در پی جلوگیری می‌کند و در بلندمدت به صرفه است.",
  "🔒 **نکته امنیتی**: آیتم «قفل نامرئی» باعث می‌شود خانه شما برای سارقان قابل مشاهده نباشد - یک سرمایه‌گذاری عالی برای افراد ثروتمند!",
  
  // نکات طنزآمیز
  "😄 **نکته طنزآمیز**: آیا می‌دانستید کاربرانی که در بانک سپرده‌گذاری می‌کنند، کمتر دچار سرقت می‌شوند؟ سارقان هم ترجیح می‌دهند کارشان راحت باشد! 🦹‍♂️",
  "😄 **نکته طنزآمیز**: بیشترین تقلب در بازی تاس، فوت کردن روی تاس‌هاست! خوب شد دیسکورد قابلیت فوت کردن ندارد! 🎲",
  "😄 **نکته طنزآمیز**: برخی کاربران آنقدر در بانک پول دارند که رئیس بانک را استخدام کرده‌اند تا پول‌هایشان را بشمارد! 💸",
  "😄 **نکته طنزآمیز**: سرقت از یک سارق، جرم نیست؛ یک سرویس خدماتی محسوب می‌شود! 🤣",
  "😄 **نکته طنزآمیز**: اگر صد بار در بازی شیر یا خط ببازید، سکه شما خراب است نه شانستان! 🪙",
  
  // نکات مربوط به ارتقاء
  "⭐ **نکته ارتقاء**: ارتقاء سطح کاربری می‌تواند دسترسی شما به قابلیت‌های بیشتر را فراهم کند. سطح 10 دسترسی به حساب طلایی بانک می‌دهد!",
  "⭐ **نکته ارتقاء**: آیتم‌های بوستر XP را در زمان تکمیل کوئست‌های بزرگ استفاده کنید تا تجربه دو برابری دریافت کنید!",
  "⭐ **نکته ارتقاء**: چالش‌های دستاورد «سخت» وقت‌گیر هستند اما پاداش فوق‌العاده‌ای دارند. آنها را نادیده نگیرید!",
  
  // نکات دوستی و اجتماعی
  "👥 **نکته اجتماعی**: ارسال هدیه به دوستان باعث افزایش سطح دوستی می‌شود و در سطوح بالاتر مزایای بیشتری دارد!",
  "👥 **نکته اجتماعی**: بهترین زمان برای یافتن رقیب در بازی‌ها، ساعت‌های شلوغی سرور (7 تا 11 شب) است!",
  "👥 **نکته اجتماعی**: کمک به کاربران تازه‌وارد باعث دریافت XP اضافی و افتخار «راهنمای نوآموزان» می‌شود!",
  
  // نکات پیشرفته
  "🧠 **نکته پیشرفته**: استفاده همزمان از آیتم‌های بوستر مختلف اثر تجمعی دارد و می‌تواند پیشرفت شما را چند برابر کند!",
  "🧠 **نکته پیشرفته**: استفاده از آیتم «کریستال آنالیز» در بازار سهام الگوهای قیمتی را به شما نشان می‌دهد - یک مزیت رقابتی عالی!",
  "🧠 **نکته پیشرفته**: هماهنگی با هم‌کلنی‌ها برای استفاده از بوسترهای کلن در یک زمان، بهره‌وری را تا 50% افزایش می‌دهد!"
];

/**
 * تنظیم کانال برای ارسال خودکار نکات
 * @param guildId آیدی سرور
 * @param channelId آیدی کانال
 * @param interval فاصله زمانی ارسال نکات (به ساعت)
 * @returns پیام موفقیت یا خطا
 */
export async function setTipChannel(guildId: string, channelId: string, interval: number): Promise<string> {
  try {
    // بررسی معتبر بودن مقادیر ورودی
    if (!guildId || !channelId) {
      return '❌ مقادیر ورودی نامعتبر هستند.';
    }
    
    // بررسی معتبر بودن فاصله زمانی
    if (interval < 1 || interval > 24) {
      return '❌ فاصله زمانی باید بین 1 تا 24 ساعت باشد.';
    }
    
    // ذخیره تنظیمات در دیتابیس
    const settings = {
      guildId,
      channelId,
      interval,
      isActive: true,
      lastTipTime: Date.now()
    };
    
    // ذخیره یا به‌روزرسانی تنظیمات
    await storage.setTipChannelSettings(settings);
    
    return `✅ کانال <#${channelId}> با موفقیت برای ارسال نکات هر ${interval} ساعت تنظیم شد.`;
  } catch (error) {
    console.error('Error setting tip channel:', error);
    return '❌ خطا در تنظیم کانال نکات. لطفاً دوباره تلاش کنید.';
  }
}

/**
 * غیرفعال کردن ارسال خودکار نکات
 * @param guildId آیدی سرور
 * @returns پیام موفقیت یا خطا
 */
export async function disableTipChannel(guildId: string): Promise<string> {
  try {
    // بررسی وجود تنظیمات
    const settings = await storage.getTipChannelSettings(guildId);
    
    if (!settings) {
      return '❌ هیچ کانال نکاتی برای این سرور تنظیم نشده است.';
    }
    
    // غیرفعال کردن ارسال نکات
    settings.isActive = false;
    await storage.setTipChannelSettings(settings);
    
    return '✅ ارسال خودکار نکات با موفقیت غیرفعال شد.';
  } catch (error) {
    console.error('Error disabling tip channel:', error);
    return '❌ خطا در غیرفعال کردن کانال نکات. لطفاً دوباره تلاش کنید.';
  }
}

/**
 * ارسال یک نکته تصادفی به کانال
 * @param channel کانال متنی
 */
export async function sendRandomTip(channel: TextChannel): Promise<void> {
  try {
    // انتخاب یک نکته تصادفی
    const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)];
    
    // ارسال به کانال
    await channel.send({
      content: `${randomTip}\n\n*این نکته به صورت خودکار توسط Ccoin Bot ارسال شده است* 🤖`
    });
    
    console.log(`Tip sent to channel ${channel.name} (${channel.id})`);
  } catch (error) {
    console.error(`Error sending tip to channel ${channel.id}:`, error);
  }
}

/**
 * بررسی و ارسال نکات در صورت نیاز
 * این تابع باید در فواصل زمانی منظم (مثلاً هر 5 دقیقه) فراخوانی شود
 * @param client کلاینت دیسکورد
 */
export async function checkAndSendTips(client: any): Promise<void> {
  try {
    // دریافت همه تنظیمات کانال‌های نکات فعال
    const allSettings = await storage.getAllActiveTipChannelSettings();
    
    if (!allSettings || allSettings.length === 0) {
      return; // هیچ کانال فعالی وجود ندارد
    }
    
    const currentTime = Date.now();
    
    // بررسی هر کانال
    for (const settings of allSettings) {
      // اگر کانال غیرفعال است، آن را نادیده بگیر
      if (!settings.isActive) continue;
      
      // محاسبه زمان گذشته از آخرین ارسال (به میلی‌ثانیه)
      const timeSinceLastTip = settings.lastTipTime 
        ? currentTime - settings.lastTipTime 
        : settings.interval * 3600000 + 1; // اگر آخرین زمان وجود ندارد، فرض کن زمان رسیده
      
      // تبدیل فاصله زمانی از ساعت به میلی‌ثانیه
      const intervalMs = settings.interval * 3600000;
      
      // اگر زمان ارسال نکته بعدی رسیده است
      if (timeSinceLastTip >= intervalMs) {
        try {
          // دریافت کانال
          const guild = client.guilds.cache.get(settings.guildId);
          
          if (!guild) {
            console.log(`Guild ${settings.guildId} not found, skipping tip`);
            continue;
          }
          
          const channel = guild.channels.cache.get(settings.channelId) as TextChannel;
          
          // بررسی نوع کانال: باید کانال متنی باشد
          // ChannelType.GuildText = 0 در دیسکورد جدید
          if (!channel || (channel.type !== 0 && channel.type !== 'GUILD_TEXT')) {
            console.log(`Channel ${settings.channelId} not found or not text channel, skipping tip`);
            continue;
          }
          
          // ارسال نکته
          await sendRandomTip(channel);
          
          // به‌روزرسانی زمان آخرین ارسال
          settings.lastTipTime = currentTime;
          await storage.setTipChannelSettings(settings);
          
        } catch (channelError) {
          console.error(`Error processing tip for channel ${settings.channelId}:`, channelError);
        }
      }
    }
  } catch (error) {
    console.error('Error in checking and sending tips:', error);
  }
}