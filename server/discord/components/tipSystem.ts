import { 
  Client, 
  TextChannel, 
  EmbedBuilder, 
  Guild,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { storage } from '../../storage';
import { getLogger } from '../utils/logger';
import { botConfig } from '../utils/config';

// دسته‌بندی نکات
enum TipCategory {
  ECONOMY = 'economy',
  GAMES = 'games',
  SOCIAL = 'social',
  CLANS = 'clans',
  INVENTORY = 'inventory',
  GENERAL = 'general'
}

// ساختار هر نکته
interface Tip {
  id: number;
  category: TipCategory;
  title: string;
  content: string;
  emoji: string;
  imageUrl?: string;
}

// مجموعه نکات پیش‌فرض
const defaultTips: Tip[] = [
  // نکات اقتصادی
  {
    id: 101,
    category: TipCategory.ECONOMY,
    title: 'محافظت از سکه‌ها',
    content: 'سکه‌های خود را در بانک نگهداری کنید تا از دزدی در امان باشند! علاوه بر این، سود 2% ماهانه نیز دریافت خواهید کرد.',
    emoji: '🏦'
  },
  {
    id: 102,
    category: TipCategory.ECONOMY,
    title: 'جایزه روزانه را فراموش نکنید',
    content: 'هر روز با دستور `/daily` سکه رایگان دریافت کنید. اگر 7 روز متوالی این کار را انجام دهید، 200 سکه اضافی دریافت خواهید کرد!',
    emoji: '🎁'
  },
  {
    id: 103,
    category: TipCategory.ECONOMY,
    title: 'سرمایه‌گذاری بدون ریسک',
    content: 'برای افزایش اتوماتیک سکه‌های خود، در سرمایه‌گذاری کم‌ریسک شرکت کنید! با سود تضمین شده 5% و بدون نیاز به فعالیت اضافی.',
    emoji: '📈'
  },
  
  // نکات بازی‌ها
  {
    id: 201,
    category: TipCategory.GAMES,
    title: 'افزایش شانس در بازی‌ها',
    content: 'با خرید نقش‌های VIP، افسانه‌ای یا پادشاه، می‌توانید به ترتیب 5%، 10% و 15% شانس بیشتری در تمام بازی‌ها داشته باشید!',
    emoji: '🎯'
  },
  {
    id: 202,
    category: TipCategory.GAMES,
    title: 'شرکت در تورنمنت‌ها',
    content: 'در تورنمنت‌های هفتگی شرکت کنید تا شانس برنده شدن جوایز بزرگ را داشته باشید. نفر اول: 5000 سکه، نفر دوم: 3000 سکه و نفر سوم: 1000 سکه!',
    emoji: '🏆'
  },
  {
    id: 203,
    category: TipCategory.GAMES,
    title: 'سنگ کاغذ قیچی با دوستان',
    content: 'بازی سنگ کاغذ قیچی را با دوستان خود تجربه کنید و شانس برد خود را افزایش دهید! این بازی با شرط 20 سکه، در صورت برد 40 سکه به شما می‌دهد.',
    emoji: '✂️'
  },
  
  // نکات اجتماعی
  {
    id: 301,
    category: TipCategory.SOCIAL,
    title: 'افزایش سطح دوستی',
    content: 'با انجام فعالیت‌های مشترک با دوستان خود، XP دوستی به دست آورید و از مزایای ویژه مانند تخفیف در انتقال سکه بهره‌مند شوید!',
    emoji: '👥'
  },
  {
    id: 302,
    category: TipCategory.SOCIAL,
    title: 'هدیه روزانه به دوستان',
    content: 'هر روز به دوستان خود هدیه‌ای رایگان بفرستید تا هم آنها سکه دریافت کنند و هم سطح دوستی شما افزایش یابد.',
    emoji: '🎁'
  },
  {
    id: 303,
    category: TipCategory.SOCIAL,
    title: 'چت خصوصی امن',
    content: 'با استفاده از سیستم چت خصوصی Ccoin، می‌توانید با دوستان خود به صورت امن و ناشناس گفتگو کنید!',
    emoji: '💬'
  },
  
  // نکات کلن‌ها
  {
    id: 401,
    category: TipCategory.CLANS,
    title: 'مزایای عضویت در کلن',
    content: 'با عضویت در کلن، از مزایایی مانند تخفیف در فروشگاه، فعالیت‌های گروهی و دسترسی به آیتم‌های انحصاری بهره‌مند شوید!',
    emoji: '🏰'
  },
  {
    id: 402,
    category: TipCategory.CLANS,
    title: 'کسب درآمد از جزیره کلن',
    content: 'با ارتقای جزیره کلن، می‌توانید روزانه 100 سکه × سطح جزیره برای خزانه کلن درآمدزایی کنید!',
    emoji: '🏝️'
  },
  {
    id: 403,
    category: TipCategory.CLANS,
    title: 'وار کلن و جوایز بزرگ',
    content: 'در وار کلن شرکت کنید و با پیروزی، 10,000 سکه و مقدار قابل توجهی XP برای کلن خود به دست آورید!',
    emoji: '⚔️'
  },
  
  // نکات کوله‌پشتی
  {
    id: 501,
    category: TipCategory.INVENTORY,
    title: 'مدیریت آیتم‌های کوله‌پشتی',
    content: 'آیتم‌های غیرضروری خود را در بازار بفروشید تا هم فضای کوله‌پشتی آزاد شود و هم سکه به دست آورید!',
    emoji: '🎒'
  },
  {
    id: 502,
    category: TipCategory.INVENTORY,
    title: 'استفاده از جعبه‌های شانس',
    content: 'جعبه‌های شانس، شانس دریافت آیتم‌های نادر و کمیاب را به شما می‌دهند. جعبه الماس با 60% شانس آیتم نادر بهترین انتخاب است!',
    emoji: '📦'
  },
  {
    id: 503,
    category: TipCategory.INVENTORY,
    title: 'ارتقای ظرفیت کوله‌پشتی',
    content: 'با افزایش سطح کاربری، ظرفیت کوله‌پشتی شما افزایش می‌یابد. در سطح 50، ظرفیت به 100 آیتم می‌رسد!',
    emoji: '⬆️'
  },
  
  // نکات عمومی
  {
    id: 601,
    category: TipCategory.GENERAL,
    title: 'افزایش سریع سطح',
    content: 'برای افزایش سریع سطح کاربری، مأموریت‌های روزانه و هفتگی را انجام دهید، در چت‌ها فعال باشید و در بازی‌های مختلف شرکت کنید!',
    emoji: '⭐'
  },
  {
    id: 602,
    category: TipCategory.GENERAL,
    title: 'منوی راهنمای جامع',
    content: 'با استفاده از دستور `/help` به منوی راهنمای جامع دسترسی پیدا کنید و با تمامی امکانات ربات آشنا شوید!',
    emoji: '❓'
  },
  {
    id: 603,
    category: TipCategory.GENERAL,
    title: 'امنیت حساب کاربری',
    content: 'برای حفظ امنیت حساب خود، از حالت مخفی استفاده کنید و مراقب افرادی که درخواست سکه‌های زیاد دارند باشید!',
    emoji: '🔒'
  }
];

// تنظیمات کانال‌های نکته
interface TipChannelSettings {
  guildId: string;
  channelId: string;
  interval: string; // cron expression
  lastTipId?: number;
  categories: TipCategory[];
  enabled: boolean;
}

// کلاس مدیریت سیستم نکات
export class TipSystem {
  private client: Client;
  private scheduler: typeof scheduleJob;
  private scheduledJobs: Map<string, any> = new Map();
  private tips: Tip[] = [...defaultTips];
  private channels: Map<string, TipChannelSettings> = new Map();
  private logger = getLogger('tip-system');
  
  constructor(client: Client) {
    this.client = client;
    this.scheduler = scheduleJob;
    this.logger.info('Tip system initialized');
  }
  
  /**
   * راه‌اندازی سیستم نکات
   */
  async initialize() {
    try {
      // بارگذاری کانال‌های نکته از دیتابیس
      await this.loadTipChannels();
      
      // تنظیم زمان‌بندی برای هر کانال
      for (const [channelKey, settings] of this.channels.entries()) {
        if (settings.enabled) {
          this.scheduleTips(channelKey, settings);
        }
      }
      
      this.logger.info(`Tip scheduler initialized with ${this.scheduledJobs.size} active channels`);
    } catch (error) {
      this.logger.error('Failed to initialize tip system:', error);
    }
  }
  
  /**
   * بارگذاری کانال‌های نکته از دیتابیس
   */
  private async loadTipChannels() {
    try {
      const tipChannels = await storage.getTipChannels();
      
      if (tipChannels && tipChannels.length > 0) {
        for (const channel of tipChannels) {
          const key = `${channel.guildId}-${channel.channelId}`;
          this.channels.set(key, channel);
        }
        this.logger.info(`Loaded ${tipChannels.length} tip channels from database`);
      } else {
        this.logger.info('No tip channels found in database');
      }
    } catch (error) {
      this.logger.error('Failed to load tip channels:', error);
    }
  }
  
  /**
   * زمان‌بندی ارسال نکات برای یک کانال
   */
  private scheduleTips(channelKey: string, settings: TipChannelSettings) {
    try {
      // اگر از قبل برای این کانال زمان‌بندی وجود دارد، آن را لغو کنید
      if (this.scheduledJobs.has(channelKey)) {
        this.scheduledJobs.get(channelKey).cancel();
      }
      
      // ایجاد زمان‌بندی جدید
      const job = this.scheduler(settings.interval, async () => {
        await this.sendTipToChannel(settings);
      });
      
      this.scheduledJobs.set(channelKey, job);
      this.logger.info(`Scheduled tips for channel ${settings.channelId} with interval ${settings.interval}`);
    } catch (error) {
      this.logger.error(`Failed to schedule tips for channel ${settings.channelId}:`, error);
    }
  }
  
  /**
   * ارسال یک نکته به کانال مشخص
   */
  private async sendTipToChannel(settings: TipChannelSettings) {
    try {
      // بررسی دسترسی به کانال و گیلد
      const guild = this.client.guilds.cache.get(settings.guildId);
      if (!guild) {
        this.logger.warn(`Guild ${settings.guildId} not found for tip channel ${settings.channelId}`);
        return;
      }
      
      let channel: TextChannel | null = null;
      try {
        channel = await guild.channels.fetch(settings.channelId) as TextChannel;
      } catch (error) {
        this.logger.warn(`Channel ${settings.channelId} not found in guild ${settings.guildId}`);
        return;
      }
      
      if (!channel || channel.type !== ChannelType.GuildText) {
        this.logger.warn(`Channel ${settings.channelId} is not a text channel`);
        return;
      }
      
      // انتخاب یک نکته تصادفی از دسته‌بندی‌های انتخاب شده
      const filteredTips = this.tips.filter(tip => settings.categories.includes(tip.category));
      if (filteredTips.length === 0) {
        this.logger.warn(`No tips found for categories ${settings.categories.join(', ')}`);
        return;
      }
      
      // انتخاب نکته (اگر آخرین نکته وجود دارد، نکته متفاوتی انتخاب کنید)
      let selectedTip: Tip;
      if (settings.lastTipId) {
        const availableTips = filteredTips.filter(tip => tip.id !== settings.lastTipId);
        selectedTip = availableTips[Math.floor(Math.random() * availableTips.length)];
      } else {
        selectedTip = filteredTips[Math.floor(Math.random() * filteredTips.length)];
      }
      
      // ساخت Embed نکته
      const tipEmbed = new EmbedBuilder()
        .setColor('#FFD700') // رنگ طلایی
        .setTitle(`${selectedTip.emoji} نکته طلایی: ${selectedTip.title}`)
        .setDescription(selectedTip.content)
        .setFooter({ 
          text: `دسته‌بندی: ${this.getCategoryName(selectedTip.category)} | برای اطلاعات بیشتر از دستور /help استفاده کنید`, 
          iconURL: this.client.user?.displayAvatarURL() 
        })
        .setTimestamp();
      
      // اضافه کردن تصویر اگر وجود دارد
      if (selectedTip.imageUrl) {
        tipEmbed.setImage(selectedTip.imageUrl);
      }
      
      // افزودن هاله سیاه برای بهبود خوانایی (در قالب یک فایل تصویری)
      tipEmbed.setThumbnail('https://img.icons8.com/fluency/96/light-on.png');
      
      // دکمه‌های اضافی
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`tip_more_${selectedTip.category}`)
            .setLabel('نکات بیشتر')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💡'),
          new ButtonBuilder()
            .setCustomId(`help_view_${selectedTip.category}`)
            .setLabel('راهنمای کامل')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📖')
        );
      
      // ارسال نکته به کانال
      await channel.send({ embeds: [tipEmbed], components: [row] });
      
      // به‌روزرسانی آخرین نکته ارسال شده
      settings.lastTipId = selectedTip.id;
      await storage.updateTipChannel(settings.guildId, settings.channelId, { lastTipId: selectedTip.id });
      
      this.logger.info(`Sent tip ${selectedTip.id} to channel ${settings.channelId} in guild ${settings.guildId}`);
    } catch (error) {
      this.logger.error(`Failed to send tip to channel ${settings.channelId}:`, error);
    }
  }
  
  /**
   * افزودن یک کانال جدید به سیستم نکات
   */
  async addTipChannel(guildId: string, channelId: string, interval: string = '0 12 * * *', categories: TipCategory[] = Object.values(TipCategory)) {
    try {
      const key = `${guildId}-${channelId}`;
      const settings: TipChannelSettings = {
        guildId,
        channelId,
        interval,
        categories,
        enabled: true
      };
      
      // ذخیره در دیتابیس
      await storage.addTipChannel(settings);
      
      // افزودن به لیست کانال‌ها
      this.channels.set(key, settings);
      
      // تنظیم زمان‌بندی
      this.scheduleTips(key, settings);
      
      this.logger.info(`Added tip channel ${channelId} in guild ${guildId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add tip channel ${channelId} in guild ${guildId}:`, error);
      return false;
    }
  }
  
  /**
   * به‌روزرسانی تنظیمات یک کانال
   */
  async updateTipChannel(guildId: string, channelId: string, updates: Partial<TipChannelSettings>) {
    try {
      const key = `${guildId}-${channelId}`;
      const settings = this.channels.get(key);
      
      if (!settings) {
        this.logger.warn(`Tip channel ${channelId} in guild ${guildId} not found for update`);
        return false;
      }
      
      // اعمال تغییرات
      const updatedSettings = { ...settings, ...updates };
      
      // ذخیره در دیتابیس
      await storage.updateTipChannel(guildId, channelId, updates);
      
      // به‌روزرسانی لیست کانال‌ها
      this.channels.set(key, updatedSettings);
      
      // اگر فاصله زمانی یا وضعیت فعال بودن تغییر کرده، زمان‌بندی را به‌روزرسانی کنید
      if (updates.interval || updates.enabled !== undefined) {
        if (updatedSettings.enabled) {
          this.scheduleTips(key, updatedSettings);
        } else if (this.scheduledJobs.has(key)) {
          this.scheduledJobs.get(key).cancel();
          this.scheduledJobs.delete(key);
        }
      }
      
      this.logger.info(`Updated tip channel ${channelId} in guild ${guildId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update tip channel ${channelId} in guild ${guildId}:`, error);
      return false;
    }
  }
  
  /**
   * حذف یک کانال از سیستم نکات
   */
  async removeTipChannel(guildId: string, channelId: string) {
    try {
      const key = `${guildId}-${channelId}`;
      
      // حذف از دیتابیس
      await storage.removeTipChannel(guildId, channelId);
      
      // لغو زمان‌بندی
      if (this.scheduledJobs.has(key)) {
        this.scheduledJobs.get(key).cancel();
        this.scheduledJobs.delete(key);
      }
      
      // حذف از لیست کانال‌ها
      this.channels.delete(key);
      
      this.logger.info(`Removed tip channel ${channelId} in guild ${guildId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove tip channel ${channelId} in guild ${guildId}:`, error);
      return false;
    }
  }
  
  /**
   * ارسال دستی یک نکته به کانال
   */
  async sendManualTip(guildId: string, channelId: string, tipId?: number) {
    try {
      const key = `${guildId}-${channelId}`;
      const settings = this.channels.get(key);
      
      if (!settings) {
        this.logger.warn(`Tip channel ${channelId} in guild ${guildId} not found for manual tip`);
        return false;
      }
      
      // اگر شناسه نکته مشخص شده، آن را به‌روزرسانی کنید
      if (tipId) {
        settings.lastTipId = tipId;
      }
      
      // ارسال نکته
      await this.sendTipToChannel(settings);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send manual tip to channel ${channelId} in guild ${guildId}:`, error);
      return false;
    }
  }
  
  /**
   * افزودن یک نکته جدید
   */
  async addTip(tip: Omit<Tip, 'id'>) {
    try {
      // ایجاد شناسه جدید (بالاترین شناسه + 1)
      const maxId = Math.max(...this.tips.map(t => t.id), 0);
      const newTip: Tip = { ...tip, id: maxId + 1 };
      
      // افزودن به لیست نکات
      this.tips.push(newTip);
      
      // ذخیره در دیتابیس
      await storage.addTip(newTip);
      
      this.logger.info(`Added new tip with ID ${newTip.id}`);
      return newTip.id;
    } catch (error) {
      this.logger.error('Failed to add new tip:', error);
      return null;
    }
  }
  
  /**
   * حذف یک نکته
   */
  async removeTip(tipId: number) {
    try {
      // حذف از لیست نکات
      this.tips = this.tips.filter(tip => tip.id !== tipId);
      
      // حذف از دیتابیس
      await storage.removeTip(tipId);
      
      this.logger.info(`Removed tip with ID ${tipId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove tip with ID ${tipId}:`, error);
      return false;
    }
  }
  
  /**
   * دریافت لیست تمام نکات
   */
  getAllTips(): Tip[] {
    return [...this.tips];
  }
  
  /**
   * دریافت نکات بر اساس دسته‌بندی
   */
  getTipsByCategory(category: TipCategory): Tip[] {
    return this.tips.filter(tip => tip.category === category);
  }
  
  /**
   * دریافت لیست کانال‌های نکته
   */
  getTipChannels(): TipChannelSettings[] {
    return Array.from(this.channels.values());
  }
  
  /**
   * دریافت نام فارسی دسته‌بندی
   */
  private getCategoryName(category: TipCategory): string {
    switch (category) {
      case TipCategory.ECONOMY:
        return 'اقتصادی';
      case TipCategory.GAMES:
        return 'بازی‌ها';
      case TipCategory.SOCIAL:
        return 'اجتماعی';
      case TipCategory.CLANS:
        return 'کلن‌ها';
      case TipCategory.INVENTORY:
        return 'کوله‌پشتی';
      case TipCategory.GENERAL:
        return 'عمومی';
      default:
        return 'نامشخص';
    }
  }
}

// نمونه سیستم نکات
let tipSystem: TipSystem | null = null;

/**
 * راه‌اندازی سیستم نکات
 */
export async function initializeTipSystem(client: Client) {
  try {
    tipSystem = new TipSystem(client);
    await tipSystem.initialize();
    return tipSystem;
  } catch (error) {
    console.error('Failed to initialize tip system:', error);
    return null;
  }
}

/**
 * دسترسی به نمونه سیستم نکات
 */
export function getTipSystem(): TipSystem | null {
  return tipSystem;
}

// منوی مدیریت نکات برای ادمین‌ها
export async function tipManagementMenu(interaction: any) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // دسترسی به سیستم نکات
    const tipSys = getTipSystem();
    if (!tipSys) {
      await interaction.reply({
        content: '❌ سیستم نکات در حال حاضر در دسترس نیست.',
        ephemeral: true
      });
      return;
    }
    
    // دریافت لیست کانال‌های نکته برای این سرور
    const guildId = interaction.guild?.id;
    const tipChannels = tipSys.getTipChannels().filter(ch => ch.guildId === guildId);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💡 مدیریت سیستم نکات')
      .setDescription('در این بخش می‌توانید سیستم نکات را مدیریت کنید و کانال‌های ارسال نکته را تنظیم نمایید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/96/light-on.png')
      .setTimestamp();
    
    // اضافه کردن اطلاعات کانال‌های فعلی
    if (tipChannels.length > 0) {
      const channelsField = tipChannels.map((ch, idx) => {
        const channel = interaction.guild?.channels.cache.get(ch.channelId);
        const channelName = channel ? `#${channel.name}` : ch.channelId;
        const status = ch.enabled ? '✅ فعال' : '❌ غیرفعال';
        const schedule = ch.interval === '0 12 * * *' ? 'روزانه (ظهر)' : 
                         ch.interval === '0 18 * * *' ? 'روزانه (عصر)' : 
                         ch.interval === '0 0 * * 0' ? 'هفتگی' : ch.interval;
        const categories = ch.categories.map(c => 
          c === 'economy' ? 'اقتصادی' : 
          c === 'games' ? 'بازی‌ها' : 
          c === 'social' ? 'اجتماعی' : 
          c === 'clans' ? 'کلن‌ها' : 
          c === 'inventory' ? 'کوله‌پشتی' : 'عمومی'
        ).join(', ');
        
        return `**${idx + 1}.** ${channelName}\n• وضعیت: ${status}\n• زمان‌بندی: ${schedule}\n• دسته‌بندی‌ها: ${categories}`;
      }).join('\n\n');
      
      embed.addFields({ name: '📢 کانال‌های فعال', value: channelsField, inline: false });
    } else {
      embed.addFields({ name: '📢 کانال‌های فعال', value: 'هیچ کانالی برای ارسال نکته در این سرور تنظیم نشده است.', inline: false });
    }
    
    // ایجاد منوی انتخاب کانال برای افزودن
    const channels = interaction.guild?.channels.cache
      .filter((ch: any) => ch.type === ChannelType.GuildText)
      .map((ch: any) => ({ id: ch.id, name: ch.name }));
    
    if (channels && channels.length > 0) {
      const channelSelect = new StringSelectMenuBuilder()
        .setCustomId('tip_add_channel')
        .setPlaceholder('🔍 یک کانال برای ارسال نکات انتخاب کنید')
        .addOptions(
          channels.slice(0, 25).map((ch: any) => 
            new StringSelectMenuOptionBuilder()
              .setLabel(`#${ch.name}`)
              .setDescription(`افزودن کانال ${ch.name} به سیستم نکات`)
              .setValue(ch.id)
          )
        );
      
      const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(channelSelect);
      
      // دکمه‌های مدیریت
      const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('tip_send_now')
            .setLabel('ارسال نکته اکنون')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💡'),
          new ButtonBuilder()
            .setCustomId('tip_configure')
            .setLabel('تنظیمات پیشرفته')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚙️'),
          new ButtonBuilder()
            .setCustomId('admin_menu')
            .setLabel('بازگشت')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );
      
      // ارسال پاسخ با منوی انتخاب
      if (interaction.deferred) {
        await interaction.editReply({ 
          embeds: [embed], 
          components: [selectRow, buttonRow]
        });
      } else {
        await interaction.reply({ 
          embeds: [embed], 
          components: [selectRow, buttonRow],
          ephemeral: true
        });
      }
    } else {
      // دکمه‌های مدیریت (بدون منوی انتخاب کانال)
      const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('tip_send_now')
            .setLabel('ارسال نکته اکنون')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💡'),
          new ButtonBuilder()
            .setCustomId('admin_menu')
            .setLabel('بازگشت')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );
      
      // ارسال پاسخ بدون منوی انتخاب
      if (interaction.deferred) {
        await interaction.editReply({ 
          embeds: [embed], 
          components: [buttonRow]
        });
      } else {
        await interaction.reply({ 
          embeds: [embed], 
          components: [buttonRow],
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error('Error in tipManagementMenu:', error);
    
    try {
      const errorMessage = 'متأسفانه در نمایش منوی مدیریت نکات خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

// صدور توابع مورد نیاز
export { TipCategory };