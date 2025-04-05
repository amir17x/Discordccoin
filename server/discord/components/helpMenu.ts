import { 
  ButtonInteraction, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { log } from '../../vite';

/**
 * منوی راهنمای جامع با دسته‌بندی
 * @param interaction تعامل کاربر
 * @param category دسته‌بندی (اختیاری)
 */
export async function helpMenu(
  interaction: ButtonInteraction | ChatInputCommandInteraction | StringSelectMenuInteraction, 
  category?: string
) {
  // لاگ اطلاعات عیب‌یابی
  log(`helpMenu called with category: ${category || 'undefined'}`, 'info');
  log(`Interaction type: ${interaction.constructor.name}, customId: ${(interaction as any).customId || 'N/A'}`, 'info');
  try {
    // ایجاد منوی انتخاب دسته‌بندی
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('🔍 دسته‌بندی مورد نظر را انتخاب کنید')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('راهنمای کلی')
          .setDescription('اطلاعات کلی درباره ربات و فرمان‌های اصلی')
          .setValue('general')
          .setEmoji('🏠'),
        new StringSelectMenuOptionBuilder()
          .setLabel('سیستم اقتصادی')
          .setDescription('راهنمای بانک، انتقال پول، کسب درآمد و خرید و فروش')
          .setValue('economy')
          .setEmoji('💰'),
        new StringSelectMenuOptionBuilder()
          .setLabel('بازی‌ها و سرگرمی')
          .setDescription('راهنمای بازی‌های مختلف و نحوه کسب جایزه')
          .setValue('games')
          .setEmoji('🎮'),
        new StringSelectMenuOptionBuilder()
          .setLabel('کلن‌ها و گروه‌ها')
          .setDescription('راهنمای ساخت و مدیریت کلن‌ها و فعالیت‌های گروهی')
          .setValue('clans')
          .setEmoji('🏰'),
        new StringSelectMenuOptionBuilder()
          .setLabel('سیستم دوستی')
          .setDescription('راهنمای سیستم دوستی، فعالیت‌های مشترک و مدیریت دوستان')
          .setValue('friends')
          .setEmoji('👥'),
        new StringSelectMenuOptionBuilder()
          .setLabel('مأموریت‌ها و جوایز')
          .setDescription('راهنمای مأموریت‌های روزانه، هفتگی و دستاوردها')
          .setValue('quests')
          .setEmoji('🎯'),
        new StringSelectMenuOptionBuilder()
          .setLabel('فروشگاه و آیتم‌ها')
          .setDescription('راهنمای فروشگاه، کوله‌پشتی و استفاده از آیتم‌ها')
          .setValue('shop')
          .setEmoji('🛒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('هوش مصنوعی CCOIN AI')
          .setDescription('راهنمای استفاده از قابلیت‌های هوش مصنوعی بات')
          .setValue('ai')
          .setEmoji('🧠'),
        new StringSelectMenuOptionBuilder()
          .setLabel('سیستم سهام و بازار')
          .setDescription('راهنمای خرید و فروش سهام، تحلیل بازار و سرمایه‌گذاری')
          .setValue('stocks')
          .setEmoji('📈'),
        new StringSelectMenuOptionBuilder()
          .setLabel('بازار معاملات کاربران')
          .setDescription('راهنمای خرید و فروش بین کاربران، مزایده و معاملات')
          .setValue('market')
          .setEmoji('💹'),
        new StringSelectMenuOptionBuilder()
          .setLabel('رویدادها و قرعه‌کشی‌ها')
          .setDescription('راهنمای شرکت در رویدادها، قرعه‌کشی‌ها و جوایز ویژه')
          .setValue('events')
          .setEmoji('🎟️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('سیستم شخصی‌سازی')
          .setDescription('راهنمای شخصی‌سازی پروفایل، اعلان‌ها و تنظیمات')
          .setValue('profile')
          .setEmoji('⚙️'),
      );
      
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(categorySelect);
    
    let embed = new EmbedBuilder()
      .setColor('#8A2BE2') // رنگ بنفش تیره برای هماهنگی با منوی اصلی
      .setFooter({ 
        text: 'از Ccoin Bot با هوش مصنوعی اختصاصی CCOIN AI لذت ببرید! | برای مشاهده منوی اصلی از /menu استفاده کنید', 
        iconURL: interaction.client.user?.displayAvatarURL() 
      })
      .setTimestamp();
    
    // نمایش دسته‌بندی انتخاب شده یا دسته‌بندی پیش‌فرض
    if (category === 'economy') {
      embed = createEconomyHelpEmbed(embed);
    } else if (category === 'games') {
      embed = createGamesHelpEmbed(embed);
    } else if (category === 'clans') {
      embed = createClansHelpEmbed(embed);
    } else if (category === 'friends') {
      embed = createFriendsHelpEmbed(embed);
    } else if (category === 'quests') {
      embed = createQuestsHelpEmbed(embed);
    } else if (category === 'shop') {
      embed = createShopHelpEmbed(embed);
    } else if (category === 'ai') {
      embed = createAIHelpEmbed(embed);
    } else if (category === 'stocks') {
      embed = createStocksHelpEmbed(embed);
    } else if (category === 'market') {
      embed = createMarketHelpEmbed(embed);
    } else if (category === 'events') {
      embed = createEventsHelpEmbed(embed);
    } else if (category === 'profile') {
      embed = createProfileHelpEmbed(embed);
    } else {
      // دسته‌بندی پیش‌فرض: راهنمای کلی
      embed = createGeneralHelpEmbed(embed);
    }
    
    // دکمه‌های ناوبری
    const navButtonsRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('منوی اصلی')
          .setEmoji('🏠')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('feedback')
          .setLabel('ارسال بازخورد')
          .setEmoji('💬')
          .setStyle(ButtonStyle.Danger)
      );
    
    // ارسال پاسخ با لاگ بیشتر برای دیباگ
    if (interaction.deferred) {
      log(`Interaction is deferred, using editReply`, 'info');
      await interaction.editReply({
        embeds: [embed],
        components: [selectRow, navButtonsRow]
      }).catch((err: Error) => {
        log(`Error in editReply: ${err.message}`, 'error');
      });
    } else if ('update' in interaction && typeof interaction.update === 'function') {
      log(`Interaction has update function, using update method`, 'info');
      try {
        // نکته مهم: در اینجا تایپ را به StringSelectMenuInteraction تبدیل می‌کنیم و از متد update استفاده می‌کنیم
        const selectMenuInteraction = interaction as StringSelectMenuInteraction;
        await selectMenuInteraction.update({
          embeds: [embed],
          components: [selectRow, navButtonsRow]
        }).catch((err: Error) => {
          log(`Error in update: ${err.message}`, 'error');
          throw err; // بازپخش خطا برای پردازش در بلوک catch بعدی
        });
      } catch (e) {
        log(`Falling back to reply due to error: ${e}`, 'warn');
        if (!interaction.replied) {
          await interaction.reply({
            embeds: [embed],
            components: [selectRow, navButtonsRow],
            ephemeral: true
          }).catch((err: Error) => {
            log(`Error in reply fallback: ${err.message}`, 'error');
          });
        }
      }
    } else {
      log(`Using regular reply`, 'info');
      if (!interaction.replied) {
        await interaction.reply({
          embeds: [embed],
          components: [selectRow, navButtonsRow],
          ephemeral: true
        }).catch((err: Error) => {
          log(`Error in regular reply: ${err.message}`, 'error');
        });
      }
    }
  } catch (error) {
    console.error('Error in helpMenu:', error);
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ خطایی در نمایش راهنما رخ داد.' });
    } else if (!interaction.replied) {
      await interaction.reply({ content: '❌ خطایی در نمایش راهنما رخ داد.', ephemeral: true });
    }
  }
}

/**
 * ایجاد Embed راهنمای کلی
 */
function createGeneralHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('📖 راهنمای جامع ربات Ccoin 🌟')
    .setDescription('به دنیای مجازی اقتصاد و سرگرمی Ccoin خوش آمدید! در این بخش با اطلاعات کلی و دستورات اصلی ربات آشنا می‌شوید.')
    .setThumbnail('https://img.icons8.com/fluency/48/help.png')
    .addFields(
      { 
        name: '🔑 **دستورات اصلی**', 
        value: '`/menu` - نمایش منوی اصلی و دسترسی به همه بخش‌ها\n' +
              '`/help` - نمایش همین راهنمای جامع\n' +
              '`/daily` - دریافت جایزه روزانه\n' +
              '`/profile` - مشاهده پروفایل خود\n' +
              '`/balance` - مشاهده موجودی حساب\n' +
              '`/shop` - دسترسی به فروشگاه\n' +
              '`/inventory` - دسترسی به کوله‌پشتی و آیتم‌ها',
        inline: false
      },
      { 
        name: '🔰 **شروع کار با ربات**', 
        value: '1️⃣ با دستور `/menu` اولین حساب کاربری خود را ایجاد کنید\n' +
              '2️⃣ جایزه روزانه خود را با دستور `/daily` دریافت کنید\n' +
              '3️⃣ برای کسب درآمد بیشتر در مأموریت‌ها و بازی‌ها شرکت کنید\n' +
              '4️⃣ از دستور `/help` برای اطلاع از بخش‌های مختلف استفاده کنید',
        inline: false
      },
      { 
        name: '🤔 **سوالات متداول**', 
        value: '**چگونه پول کسب کنم؟**\n' +
              'از طریق دریافت جایزه روزانه، شرکت در مأموریت‌ها، برد در بازی‌ها و فعالیت در سرور\n\n' +
              '**چگونه سکه‌هایم را ذخیره کنم؟**\n' +
              'با استفاده از بخش بانک در منوی اقتصاد می‌توانید سکه‌ها را به صورت امن نگهداری کنید\n\n' +
              '**آیا می‌توانم با دوستانم بازی کنم؟**\n' +
              'بله، بازی‌های دو نفره و گروهی، سیستم دوستی و کلن‌ها برای همین منظور طراحی شده‌اند',
        inline: false
      }
    );
}

/**
 * ایجاد Embed راهنمای اقتصادی
 */
function createEconomyHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('💰 راهنمای سیستم اقتصادی Ccoin')
    .setDescription('آشنایی با مدیریت سکه‌ها، کسب درآمد، بانک‌داری و سایر ویژگی‌های اقتصادی ربات')
    .setThumbnail('https://img.icons8.com/fluency/48/money-bag.png')
    .addFields(
      { 
        name: '💲 **مفاهیم پایه**', 
        value: '**سکه (Ccoin)**: واحد پول اصلی در ربات\n' +
              '**کیف پول**: محل نگهداری سکه‌ها برای خرج کردن (در معرض دزدی)\n' +
              '**بانک**: محل نگهداری امن سکه‌ها با سود مشخص (ایمن در برابر دزدی)\n' +
              '**کریستال**: ارز ویژه و نادر برای خرید آیتم‌های خاص',
        inline: false
      },
      { 
        name: '🏦 **سیستم بانکی**', 
        value: '**واریز به بانک**: انتقال سکه از کیف پول به بانک (کارمزد: 1%)\n' +
              '**برداشت از بانک**: انتقال سکه از بانک به کیف پول (بدون کارمزد)\n' +
              '**سود بانکی**: 2% ماهانه به صورت خودکار\n' +
              '**حداکثر موجودی**: سقف بانک و کیف پول با افزایش سطح، افزایش می‌یابد',
        inline: false
      },
      { 
        name: '💸 **روش‌های کسب درآمد**', 
        value: '**جایزه روزانه**: 50 سکه پایه + بونوس حضور متوالی (هر 7 روز: +200 سکه)\n' +
              '**بازی‌ها**: شرکت و برد در بازی‌های مختلف (شیر یا خط، حدس عدد و...)\n' +
              '**مأموریت‌ها**: انجام مأموریت‌های روزانه و هفتگی\n' +
              '**سرمایه‌گذاری**: سرمایه‌گذاری با ریسک‌های مختلف و سودهای متفاوت\n' +
              '**فروش آیتم**: فروش آیتم‌های کوله‌پشتی در بازار\n' +
              '**شرکت در قرعه‌کشی**: شانس برنده شدن جوایز بزرگ',
        inline: false
      },
      { 
        name: '🔄 **انتقال پول و تراکنش‌ها**', 
        value: '**انتقال به کاربران**: ارسال سکه به دوستان (کارمزد: 5%)\n' +
              '**تبدیل سکه به کریستال**: 1000 سکه = 10 کریستال (کارمزد: 5%)\n' +
              '**محدودیت انتقال روزانه**: 5000 سکه\n' +
              '**تاریخچه تراکنش‌ها**: قابل مشاهده در منوی پروفایل',
        inline: false
      }
    );
}

/**
 * ایجاد Embed راهنمای بازی‌ها
 */
function createGamesHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('🎮 راهنمای بازی‌ها و سرگرمی‌های Ccoin')
    .setDescription('آشنایی با انواع بازی‌ها، نحوه شرط‌بندی، شانس برد و جوایز مختلف')
    .setThumbnail('https://img.icons8.com/fluency/48/game-controller.png')
    .addFields(
      { 
        name: '🎲 **بازی‌های تک‌نفره**', 
        value: '**شیر یا خط**: شرط 20 سکه، برد = 40 سکه (شانس: 50%)\n' +
              '**حدس عدد**: شرط 30 سکه، برد = 100 سکه (حدس عدد 1-10، شانس: 10%)\n' +
              '**گردونه شانس**: هزینه 50 سکه، جوایز متنوع (مقدار سکه، آیتم، کریستال)',
        inline: false
      },
      { 
        name: '⚔️ **بازی‌های رقابتی**', 
        value: '**دوئل**: چالش مستقیم با کاربر دیگر (هزینه: 100 سکه برای هر نفر)\n' +
              '**تاس دو نفره**: برد = مجموع عدد بزرگتر (هزینه: 30 سکه برای هر نفر)\n' +
              '**سنگ کاغذ قیچی**: مسابقه نفر به نفر (هزینه: 20 سکه برای هر نفر)\n' +
              '**مسابقه تایپ**: رقابت در تایپ سریع (ورودی: 50 سکه، پاداش: 150 سکه)',
        inline: false
      },
      { 
        name: '👥 **بازی‌های گروهی**', 
        value: '**مافیا**: بازی گروهی 5+ نفره\n' +
              '**حکم**: بازی 4 نفره با شریک\n' +
              '**اتاق فرار**: معماهای گروهی (3-6 نفر)\n' +
              '**قرعه‌کشی**: شرکت با خرید بلیط (500 سکه) و شانس برنده شدن جکپات',
        inline: false
      },
      { 
        name: '🏆 **تورنمنت‌ها و رویدادها**', 
        value: '**تورنمنت هفتگی**: رقابت در انواع بازی‌ها (هزینه ورود: 200 سکه)\n' +
              '**جوایز تورنمنت**: نفر اول: 5000 سکه | دوم: 3000 سکه | سوم: 1000 سکه\n' +
              '**رویدادهای فصلی**: رویدادهای ویژه با جوایز خاص\n' +
              '**چالش‌های هفتگی**: چالش‌های خاص با پاداش‌های منحصر به فرد',
        inline: false
      },
      { 
        name: '🎯 **نکات مهم بازی‌ها**', 
        value: '• حداقل شرط‌بندی: 20 سکه\n' +
              '• حداکثر شرط‌بندی: 5000 سکه\n' +
              '• قابلیت مشاهده آمار و سابقه بازی‌ها در پروفایل\n' +
              '• امکان ایجاد لابی خصوصی برای بازی با دوستان\n' +
              '• نقش‌های ویژه می‌توانند شانس برد را افزایش دهند',
        inline: false
      }
    );
}

/**
 * ایجاد Embed راهنمای کلن‌ها
 */
function createClansHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('🏰 راهنمای کلن‌ها و گروه‌های Ccoin')
    .setDescription('آشنایی با نحوه ساخت و مدیریت کلن‌ها، رتبه‌بندی اعضا، مزایا و فعالیت‌های گروهی')
    .setThumbnail('https://img.icons8.com/fluency/48/castle.png')
    .addFields(
      { 
        name: '🛡️ **مبانی کلن**', 
        value: '**کلن چیست؟**: گروهی از کاربران با اهداف مشترک\n' +
              '**هزینه ساخت کلن**: 5000 سکه\n' +
              '**ظرفیت اولیه**: 15 عضو (قابل افزایش تا 30 عضو)\n' +
              '**سطح کلن**: با انجام فعالیت‌های گروهی افزایش می‌یابد\n' +
              '**بانک کلن**: محل جمع‌آوری سرمایه گروهی',
        inline: false
      },
      { 
        name: '👑 **رده‌بندی کلن**', 
        value: '**رهبر (Leader)**: سازنده کلن - قدرت کامل\n' +
              '**معاون (Co-Leader)**: منصوب شده توسط رهبر - قدرت بالا\n' +
              '**ارشد (Elder)**: اعضای ارتقا یافته - قدرت متوسط\n' +
              '**عضو (Member)**: اعضای عادی - قدرت محدود',
        inline: false
      },
      { 
        name: '🏯 **ساختمان‌های کلن**', 
        value: '**مقر اصلی (HQ)**: ارتقای ظرفیت کلن\n' +
              '**خزانه‌داری (Treasury)**: افزایش محدودیت بانک کلن\n' +
              '**سربازخانه (Barracks)**: ارتقای قدرت در وار کلن\n' +
              '**مرکز تحقیقات (Research Center)**: دسترسی به فناوری‌های جدید\n' +
              '**برج دیده‌بانی (Watchtower)**: بهبود دفاع در برابر حملات',
        inline: false
      },
      { 
        name: '⚔️ **وار کلن‌ها**', 
        value: '**وار چیست؟**: رقابت 48 ساعته بین دو کلن\n' +
              '**هزینه شرکت**: 5000 سکه از بانک کلن\n' +
              '**جایزه**: 10,000 سکه + XP قابل توجه\n' +
              '**نحوه شرکت**: تنها توسط رهبر یا معاون\n' +
              '**نحوه امتیازگیری**: انجام حملات و کسب امتیاز توسط اعضا',
        inline: false
      },
      { 
        name: '🏝️ **جزیره کلن**', 
        value: '**کارکرد**: منبع درآمد غیرفعال برای کلن\n' +
              '**هزینه ارتقا**: 5000 سکه از بانک کلن\n' +
              '**درآمد روزانه**: 100 سکه × سطح جزیره\n' +
              '**محدودیت سطح**: حداکثر برابر با سطح کلن',
        inline: false
      }
    );
}

/**
 * ایجاد Embed راهنمای دوستی
 */
function createFriendsHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('👥 راهنمای سیستم دوستی Ccoin')
    .setDescription('آشنایی با سیستم دوستی، مدیریت دوستان، سطوح دوستی و فعالیت‌های مشترک')
    .setThumbnail('https://img.icons8.com/fluency/48/group.png')
    .addFields(
      { 
        name: '🤝 **مبانی سیستم دوستی**', 
        value: '**افزودن دوست**: از طریق منوی دوستان یا پروفایل کاربر\n' +
              '**ظرفیت لیست دوستان**: 20 نفر (قابل افزایش با ارتقای سطح)\n' +
              '**سطح دوستی**: با انجام فعالیت‌های مشترک افزایش می‌یابد\n' +
              '**تجربه دوستی (XP)**: معیار پیشرفت سطح دوستی',
        inline: false
      },
      { 
        name: '⭐ **سطوح دوستی و مزایا**', 
        value: '**سطح 1**: امکان چت خصوصی و هدیه روزانه (25 سکه)\n' +
              '**سطح 5**: کاهش کارمزد انتقال (4% به جای 5%)\n' +
              '**سطح 10**: افزایش هدیه روزانه (50 سکه) و تخفیف گروهی\n' +
              '**سطح 20**: قابلیت انتقال بدون کارمزد (1 بار در روز)\n' +
              '**سطح 50**: دریافت نشان دوست صمیمی و جایزه ویژه',
        inline: false
      },
      { 
        name: '🎁 **فعالیت‌های مشترک**', 
        value: '**هدیه روزانه**: ارسال هدیه رایگان به دوستان\n' +
              '**بازی دوستانه**: XP بیشتر در بازی‌های دو نفره\n' +
              '**دعوت به لابی**: ایجاد گروه بازی خصوصی\n' +
              '**چالش دوستانه**: رقابت مستقیم با جایزه\n' +
              '**مأموریت‌های مشترک**: مأموریت‌های ویژه دو نفره',
        inline: false
      },
      { 
        name: '💬 **چت خصوصی**', 
        value: '**نحوه دسترسی**: از طریق منوی دوستان\n' +
              '**امکانات**: ارسال پیام، استیکر و فایل\n' +
              '**تاریخچه پیام‌ها**: 100 پیام اخیر\n' +
              '**حریم خصوصی**: پیام‌ها تنها برای دو طرف قابل مشاهده است',
        inline: false
      },
      { 
        name: '🚫 **مدیریت و امنیت**', 
        value: '**مسدودسازی**: جلوگیری از ارتباط با کاربر خاص\n' +
              '**گزارش**: گزارش کاربر متخلف به تیم پشتیبانی\n' +
              '**حذف دوست**: پایان دادن به رابطه دوستی\n' +
              '**حالت مخفی**: عدم نمایش وضعیت آنلاین به دیگران',
        inline: false
      }
    );
}

/**
 * ایجاد Embed راهنمای ماموریت‌ها
 */
function createQuestsHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('🎯 راهنمای مأموریت‌ها و دستاوردهای Ccoin')
    .setDescription('آشنایی با انواع مأموریت‌ها، پاداش‌ها، دستاوردها و نحوه تکمیل آنها')
    .setThumbnail('https://img.icons8.com/fluency/48/trophy.png')
    .addFields(
      { 
        name: '📆 **مأموریت‌های روزانه**', 
        value: '**نحوه دسترسی**: از طریق منوی مأموریت‌ها\n' +
              '**تعداد مأموریت‌ها**: 3 مأموریت در روز\n' +
              '**پاداش**: 50-100 سکه برای هر مأموریت\n' +
              '**نوع فعالیت‌ها**: ارسال پیام، انجام بازی، استفاده از امکانات ربات\n' +
              '**مثال**: «10 پیام در سرور ارسال کنید» یا «3 بار بازی شیر یا خط انجام دهید»',
        inline: false
      },
      { 
        name: '🗓️ **مأموریت‌های هفتگی**', 
        value: '**نحوه دسترسی**: از طریق منوی مأموریت‌ها (بخش هفتگی)\n' +
              '**تعداد مأموریت‌ها**: 2 مأموریت در هفته\n' +
              '**پاداش**: 200-500 سکه برای هر مأموریت\n' +
              '**نوع فعالیت‌ها**: فعالیت‌های پیچیده‌تر و زمان‌برتر\n' +
              '**مثال**: «5 بار در بازی دوئل برنده شوید» یا «3000 سکه در بانک ذخیره کنید»',
        inline: false
      },
      { 
        name: '📅 **مأموریت‌های ماهانه**', 
        value: '**نحوه دسترسی**: از طریق منوی مأموریت‌ها (بخش ماهانه)\n' +
              '**تعداد مأموریت‌ها**: 1 مأموریت در ماه\n' +
              '**پاداش**: 1000-2000 سکه + آیتم ویژه\n' +
              '**نوع فعالیت‌ها**: چالش‌های بزرگ و مستمر\n' +
              '**مثال**: «به 50 کاربر مختلف سکه انتقال دهید» یا «15 روز متوالی آنلاین باشید»',
        inline: false
      },
      { 
        name: '🏅 **دستاوردها**', 
        value: '**نحوه دسترسی**: از طریق منوی پروفایل (بخش دستاوردها)\n' +
              '**پاداش**: سکه، نشان ویژه، عناوین مخصوص\n' +
              '**دسته‌بندی‌ها**: اقتصادی، بازی، اجتماعی، حرفه‌ای\n' +
              '**پیشرفت تدریجی**: هر دستاورد چندین سطح دارد که به تدریج باز می‌شوند\n' +
              '**مثال**: «سرمایه‌دار» (داشتن 10,000 سکه در بانک) یا «قهرمان بازی‌ها» (100 برد)',
        inline: false
      },
      { 
        name: '🔄 **سیستم پیشرفت**', 
        value: '**نوار پیشرفت**: نمایش میزان پیشرفت در هر مأموریت یا دستاورد\n' +
              '**اطلاع‌رسانی**: اعلان در هنگام تکمیل مأموریت یا دستاورد\n' +
              '**پاداش خودکار**: واریز پاداش به محض تکمیل\n' +
              '**آمار کلی**: نمایش درصد کل مأموریت‌ها و دستاوردهای تکمیل شده',
        inline: false
      }
    );
}

/**
 * ایجاد Embed راهنمای فروشگاه
 */
function createShopHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('🛒 راهنمای فروشگاه و آیتم‌های Ccoin')
    .setDescription('آشنایی با انواع آیتم‌ها، نحوه خرید و فروش، مدیریت کوله‌پشتی و استفاده از آیتم‌ها')
    .setThumbnail('https://img.icons8.com/fluency/48/shopping-cart.png')
    .addFields(
      { 
        name: '🏬 **ساختار فروشگاه**', 
        value: '**دسته‌بندی‌ها**: مصرفی، تجهیزات، نقش‌ها، زیبایی، ویژه\n' +
              '**ارز خرید**: سکه (Ccoin) یا کریستال (ارز ویژه)\n' +
              '**نحوه دسترسی**: از طریق دستور `/shop` یا منوی اصلی\n' +
              '**تخفیف‌ها**: تخفیف‌های دوره‌ای و ویژه اعضای کلن‌ها و VIP',
        inline: false
      },
      { 
        name: '📦 **انواع آیتم‌ها**', 
        value: '**مصرفی**: آیتم‌های یک‌بار مصرف مانند جعبه شانس، بلیط قرعه‌کشی\n' +
              '**تجهیزات**: آیتم‌های دائمی مانند اسلحه، زره (برای بازی‌ها و دوئل)\n' +
              '**نقش‌ها**: VIP، افسانه‌ای (مزایای خاص مانند تخفیف و پاداش بیشتر)\n' +
              '**زیبایی**: پروفایل کاستوم، کارت‌های نمایشی، قاب\n' +
              '**ویژه**: پت‌ها، آیتم‌های محدود و کمیاب',
        inline: false
      },
      { 
        name: '🎁 **جعبه‌های شانس**', 
        value: '**جعبه برنزی**: قیمت: 500 سکه - شانس آیتم نادر: 5%\n' +
              '**جعبه نقره‌ای**: قیمت: 1000 سکه - شانس آیتم نادر: 15%\n' +
              '**جعبه طلایی**: قیمت: 2000 سکه - شانس آیتم نادر: 30%\n' +
              '**جعبه الماس**: قیمت: 20 کریستال - شانس آیتم نادر: 60%',
        inline: false
      },
      { 
        name: '🎭 **نقش‌های ویژه**', 
        value: '**VIP**: 1000 سکه (7 روز) - مزایا: 5% تخفیف، 5% شانس بیشتر، 10% پاداش بیشتر\n' +
              '**افسانه‌ای**: 50 کریستال (14 روز) - مزایا: 10% تخفیف، 10% شانس بیشتر، 20% پاداش بیشتر\n' +
              '**پادشاه**: 100 کریستال (30 روز) - مزایا: 15% تخفیف، 15% شانس بیشتر، 30% پاداش بیشتر',
        inline: false
      },
      { 
        name: '🎒 **مدیریت کوله‌پشتی**', 
        value: '**نحوه دسترسی**: از طریق دستور `/inventory` یا منوی اصلی\n' +
              '**ظرفیت**: 20 آیتم (قابل افزایش با ارتقای سطح)\n' +
              '**استفاده از آیتم**: انتخاب آیتم و کلیک روی دکمه «استفاده»\n' +
              '**فروش آیتم**: فروش آیتم‌های غیرفعال با 70% قیمت اصلی\n' +
              '**انتقال آیتم**: ارسال آیتم به دوستان (برخی آیتم‌ها غیرقابل انتقال هستند)',
        inline: false
      }
    );
}

/**
 * ایجاد Embed راهنمای هوش مصنوعی CCOIN AI
 */
function createAIHelpEmbed(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setTitle('🧠 راهنمای هوش مصنوعی CCOIN AI')
    .setDescription('آشنایی با قابلیت‌های هوش مصنوعی اختصاصی و بهینه‌سازی شده ربات، نحوه استفاده و کاربردهای مختلف آن')
    .setThumbnail('https://img.icons8.com/fluency/48/artificial-intelligence.png')
    .addFields(
      { 
        name: '🔮 **معرفی CCOIN AI**', 
        value: '**CCOIN AI چیست؟**: هوش مصنوعی اختصاصی ربات Ccoin برای ارائه خدمات هوشمند\n' +
              '**مبتنی بر**: فناوری پیشرفته هوش مصنوعی با بهینه‌سازی و آموزش اختصاصی\n' +
              '**زبان‌های پشتیبانی شده**: فارسی و انگلیسی با دقت بالا\n' +
              '**سرعت پاسخگویی**: بهینه‌سازی شده تا 65% سریع‌تر از نسخه‌های قبلی\n' +
              '**آموزش سفارشی**: مجهز به Fine-tuning برای پاسخگویی دقیق‌تر به کاربران',
        inline: false
      },
      { 
        name: '⚡ **دستورات اصلی**', 
        value: '**`/askai`**: گفتگوی مستقیم با هوش مصنوعی CCOIN AI\n' +
              '**`/image-analyze`**: تحلیل و توصیف تصاویر آپلود شده\n' +
              '**`/content-generate`**: تولید محتوای متنی اختصاصی\n' +
              '**`/code-assistant`**: کمک در نوشتن و دیباگ کد برنامه‌نویسی\n' +
              '**`/learn`**: دریافت آموزش در موضوعات مختلف\n' +
              '**`/ping`**: بررسی وضعیت اتصال و پینگ هوش مصنوعی',
        inline: false
      },
      { 
        name: '🎯 **قابلیت‌های اصلی**', 
        value: '**گفتگوی هوشمند**: پاسخگویی به سوالات و مکالمه طبیعی با فهم دقیق بافت\n' +
              '**تحلیل تصویر**: شناسایی اجزای تصویر، توصیف محتوا و استخراج متن\n' +
              '**تولید محتوا**: ایجاد متن‌های خلاقانه، داستان، شعر و محتوای آموزشی\n' +
              '**کمک برنامه‌نویسی**: نوشتن، دیباگ و توضیح کد به زبان‌های مختلف\n' +
              '**آموزش**: توضیح مفاهیم پیچیده به زبان ساده و ارائه مثال‌های کاربردی',
        inline: false
      },
      { 
        name: '🚀 **فناوری‌های پیشرفته**', 
        value: '**انتخاب هوشمند مدل**: انتخاب خودکار مدل مناسب براساس پیچیدگی درخواست\n' +
              '**مدل‌های بهینه‌سازی شده**: سه مدل مختلف برای پاسخگویی سریع و دقیق\n' +
              '**مدل Flash**: برای پاسخ‌های سریع به سوالات ساده (315-400ms)\n' +
              '**مدل Pro**: برای پاسخ‌های عمیق‌تر به سوالات پیچیده (450-550ms)\n' +
              '**مدل Tuned**: مدل آموزش‌دیده اختصاصی برای پاسخگویی دقیق به سوالات مرتبط با Ccoin',
        inline: false
      },
      { 
        name: '⚙️ **تنظیمات و شخصی‌سازی**', 
        value: '**تنظیم زبان**: انتخاب زبان پیش‌فرض برای تعامل با AI\n' +
              '**سطح جزئیات**: تنظیم میزان توضیحات در پاسخ‌ها (کوتاه، متوسط، مفصل)\n' +
              '**حالت خلاقیت**: تنظیم میزان خلاقیت و تنوع در پاسخ‌های تولید شده\n' +
              '**ذخیره پاسخ‌ها**: امکان ذخیره پاسخ‌های مفید برای استفاده بعدی',
        inline: false
      },
      { 
        name: '💡 **نکات استفاده بهینه**', 
        value: '**سوالات دقیق**: هر چه سوال شما دقیق‌تر باشد، پاسخ بهتری دریافت می‌کنید\n' +
              '**استفاده از فرمت‌ها**: برای محتوای ساختاریافته، فرمت مورد نظر را مشخص کنید\n' +
              '**محدودیت‌ها**: برخی درخواست‌ها مانند تولید محتوای نامناسب پذیرفته نمی‌شود\n' +
              '**ارسال بازخورد**: با ارسال بازخورد به ما کمک کنید هوش مصنوعی را بهبود دهیم',
        inline: false
      },
      {
        name: '📊 **کاربردهای پیشرفته**',
        value: '**تحلیل داده**: تحلیل و تفسیر داده‌های آماری و اطلاعاتی\n' +
              '**ترجمه متون**: ترجمه دقیق بین زبان‌های فارسی و انگلیسی\n' +
              '**خلاصه‌سازی**: خلاصه کردن متون طولانی با حفظ نکات کلیدی\n' +
              '**طراحی ایده**: ایده‌پردازی برای پروژه‌ها و محتوای خلاقانه\n' +
              '**حل مسائل**: کمک در حل مسائل علمی، ریاضی و منطقی',
        inline: false
      }
    );
}

/**
 * جستجو در راهنما براساس کلیدواژه
 * @param interaction تعامل کاربر
 * @param query کلیدواژه جستجو
 */
export async function searchHelp(interaction: ButtonInteraction | ChatInputCommandInteraction, query: string) {
  try {
    // پردازش کلیدواژه جستجو
    const searchTerm = query.trim().toLowerCase();
    
    if (searchTerm.length < 2) {
      if (interaction.deferred) {
        await interaction.editReply({ content: '⚠️ لطفاً حداقل 2 حرف برای جستجو وارد کنید.' });
      } else {
        await interaction.reply({ content: '⚠️ لطفاً حداقل 2 حرف برای جستجو وارد کنید.', ephemeral: true });
      }
      return;
    }
    
    // ایجاد امبد نتیجه جستجو با طراحی جدید
    const embed = new EmbedBuilder()
      .setColor('#8A2BE2') // رنگ بنفش تیره برای هماهنگی با منوی اصلی
      .setTitle(`🔍 نتایج جستجو برای: "${query}"`)
      .setDescription('موارد زیر در راهنمای ربات یافت شد:')
      .setThumbnail('https://img.icons8.com/fluency/48/search.png')
      .setFooter({ 
        text: 'از Ccoin Bot با هوش مصنوعی اختصاصی CCOIN AI لذت ببرید! | برای مشاهده منوی اصلی از /menu استفاده کنید', 
        iconURL: interaction.client.user?.displayAvatarURL() 
      })
      .setTimestamp();
    
    // جستجو در بخش‌های مختلف راهنما
    const results: { category: string; title: string; content: string; }[] = [
      // فقط چند نمونه برای تست
    ];
    
    // بررسی عبارت در راهنمای کلی
    if (searchTerm.includes('راهنما') || searchTerm.includes('کمک') || 
        searchTerm.includes('دستور') || searchTerm.includes('کوین') || 
        searchTerm.includes('سکه') || searchTerm.includes('بات') ||
        searchTerm.includes('منو') || searchTerm.includes('صفحه') ||
        searchTerm.includes('بخش')) {
      results.push({
        category: 'general',
        title: '🏠 راهنمای کلی',
        content: 'راهنمای جامع ربات، دستورات اصلی و نحوه شروع کار'
      });
    }
    
    // بررسی عبارت در راهنمای اقتصادی
    if (searchTerm.includes('بانک') || searchTerm.includes('سکه') || 
        searchTerm.includes('اقتصاد') || searchTerm.includes('پول') || 
        searchTerm.includes('انتقال') || searchTerm.includes('کیف پول') ||
        searchTerm.includes('کریستال')) {
      results.push({
        category: 'economy',
        title: '💰 سیستم اقتصادی',
        content: 'مدیریت سکه‌ها، بانک، انتقال پول و کسب درآمد'
      });
    }
    
    // بررسی عبارت در راهنمای بازی‌ها
    if (searchTerm.includes('بازی') || searchTerm.includes('شرط') || 
        searchTerm.includes('دوئل') || searchTerm.includes('تورنمنت') || 
        searchTerm.includes('جایزه') || searchTerm.includes('مسابقه') ||
        searchTerm.includes('گردونه') || searchTerm.includes('مافیا') || 
        searchTerm.includes('گرگ نما')) {
      results.push({
        category: 'games',
        title: '🎮 بازی‌ها و سرگرمی',
        content: 'انواع بازی‌های تک‌نفره، رقابتی و گروهی'
      });
    }
    
    // بررسی عبارت در راهنمای کلن‌ها
    if (searchTerm.includes('کلن') || searchTerm.includes('گروه') || 
        searchTerm.includes('رهبر') || searchTerm.includes('عضو') || 
        searchTerm.includes('جنگ') || searchTerm.includes('وار') ||
        searchTerm.includes('اتحاد')) {
      results.push({
        category: 'clans',
        title: '🏰 کلن‌ها و گروه‌ها',
        content: 'ساخت و مدیریت کلن، رده‌بندی اعضا و فعالیت‌های گروهی'
      });
    }
    
    // بررسی عبارت در راهنمای دوستی
    if (searchTerm.includes('دوست') || searchTerm.includes('رفیق') || 
        searchTerm.includes('چت') || searchTerm.includes('پیام') || 
        searchTerm.includes('مسدود') || searchTerm.includes('ارتباط')) {
      results.push({
        category: 'friends',
        title: '👥 سیستم دوستی',
        content: 'افزودن دوست، چت خصوصی و فعالیت‌های مشترک'
      });
    }
    
    // بررسی عبارت در راهنمای مأموریت‌ها
    if (searchTerm.includes('ماموریت') || searchTerm.includes('مأموریت') || 
        searchTerm.includes('دستاورد') || searchTerm.includes('جایزه') || 
        searchTerm.includes('هفتگی') || searchTerm.includes('روزانه') ||
        searchTerm.includes('کوییست') || searchTerm.includes('چالش')) {
      results.push({
        category: 'quests',
        title: '🎯 مأموریت‌ها و دستاوردها',
        content: 'انواع مأموریت‌های روزانه، هفتگی و ماهانه'
      });
    }
    
    // بررسی عبارت در راهنمای فروشگاه
    if (searchTerm.includes('فروشگاه') || searchTerm.includes('خرید') || 
        searchTerm.includes('آیتم') || searchTerm.includes('کوله') || 
        searchTerm.includes('جعبه') || searchTerm.includes('نقش') ||
        searchTerm.includes('کیف') || searchTerm.includes('بک‌پک') ||
        searchTerm.includes('فروش')) {
      results.push({
        category: 'shop',
        title: '🛒 فروشگاه و آیتم‌ها',
        content: 'خرید و فروش آیتم‌ها، مدیریت کوله‌پشتی'
      });
    }
    
    // افزودن نتایج به امبد
    if (results.length > 0) {
      results.forEach((result, index) => {
        embed.addFields({
          name: `${index + 1}. ${result.title}`,
          value: `${result.content}\n*برای مشاهده کامل این بخش، از دکمه زیر استفاده کنید.*`,
          inline: false
        });
      });
    } else {
      embed.setDescription('⚠️ هیچ نتیجه‌ای برای جستجوی شما یافت نشد. لطفاً از کلیدواژه‌های دیگری استفاده کنید یا به منوی راهنمای اصلی مراجعه کنید.');
    }
    
    // ایجاد دکمه‌های نتایج
    const buttonRows: ActionRowBuilder<ButtonBuilder>[] = [];
    
    if (results.length > 0) {
      const resultButtons = new ActionRowBuilder<ButtonBuilder>();
      
      results.slice(0, Math.min(5, results.length)).forEach((result, index) => {
        const emoji = result.title.split(' ')[0]; // استخراج ایموجی از عنوان
        resultButtons.addComponents(
          new ButtonBuilder()
            .setCustomId(`help_view_${result.category}`)
            .setLabel(`${result.title.split(' ')[1]}`) // حذف شماره گذاری برای زیبایی بیشتر
            .setEmoji(emoji) // افزودن ایموجی به دکمه
            .setStyle(ButtonStyle.Primary)
        );
      });
      
      buttonRows.push(resultButtons);
    }
    
    // دکمه‌های منو با طراحی جدید
    const menuButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help')
          .setLabel('بازگشت به راهنما')
          .setEmoji('🔙')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('منوی اصلی')
          .setEmoji('🏠')
          .setStyle(ButtonStyle.Primary)
      );
    
    buttonRows.push(menuButtons);
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({
        embeds: [embed],
        components: buttonRows
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        components: buttonRows,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in searchHelp:', error);
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ خطایی در جستجوی راهنما رخ داد.' });
    } else if (!interaction.replied) {
      await interaction.reply({ content: '❌ خطایی در جستجوی راهنما رخ داد.', ephemeral: true });
    }
  }
}