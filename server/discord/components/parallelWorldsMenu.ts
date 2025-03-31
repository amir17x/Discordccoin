import { 
  MessageComponentInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { storage } from '../../storage';

/**
 * سیستم جهان‌های موازی Ccoin
 * امکان ماجراجویی در جهان‌های تخیلی با ماموریت‌های اختصاصی
 * با طراحی بهبودیافته و رابط کاربری جذاب
 */
export async function parallelWorldsMenu(
  interaction: MessageComponentInteraction
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = interaction.user.id;
    const user = await storage.getUserByDiscordId(userId);
    
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ 
            content: '❌ **خطا:** حساب شما در سیستم یافت نشد! لطفاً با ورود به منوی اصلی (`/menu`) ثبت نام کنید.', 
            embeds: [], 
            components: [] 
          });
        } catch (e) {
          await interaction.reply({ 
            content: '❌ **خطا:** حساب شما در سیستم یافت نشد! لطفاً با ورود به منوی اصلی (`/menu`) ثبت نام کنید.', 
            ephemeral: true 
          });
        }
      } else {
        await interaction.reply({ 
          content: '❌ **خطا:** حساب شما در سیستم یافت نشد! لطفاً با ورود به منوی اصلی (`/menu`) ثبت نام کنید.', 
          ephemeral: true 
        });
      }
      return;
    }
    
    // لیست جهان‌های موازی قابل دسترسی
    // در پیاده‌سازی واقعی این اطلاعات از دیتابیس خوانده می‌شود
    const worlds = [
      {
        id: 'cyberpunk',
        name: 'سایبرپانک 2077',
        description: 'شهری پر از فناوری پیشرفته و بی‌عدالتی اجتماعی. جایی که هکرها و شرکت‌های بزرگ تکنولوژی قدرت را به دست گرفته‌اند.',
        entryFee: 1000,
        maxLevel: 50,
        currentPopulation: 128,
        status: 'open',
        rewards: ['سکه', 'کریستال', 'آیتم‌های کمیاب', 'اسکین اختصاصی'],
        userStatus: {
          hasAccess: true,
          currentLevel: 7,
          completedMissions: 3,
          missionTotal: 10
        }
      },
      {
        id: 'medieval',
        name: 'قرون وسطی',
        description: 'دنیایی از جنگجویان، شوالیه‌ها و جادوگران. مبارزه برای افتخار و ثروت در سرزمینی پر از افسانه و خطر.',
        entryFee: 1500,
        maxLevel: 60,
        currentPopulation: 95,
        status: 'open',
        rewards: ['سکه', 'کریستال', 'سپر افسانه‌ای', 'عنوان شوالیه'],
        userStatus: {
          hasAccess: true,
          currentLevel: 3,
          completedMissions: 1,
          missionTotal: 15
        }
      },
      {
        id: 'space',
        name: 'سفر فضایی',
        description: 'اکتشاف در کهکشان‌های دوردست، تجارت با نژادهای فضایی و مبارزه با دزدان فضایی.',
        entryFee: 2000,
        maxLevel: 70,
        currentPopulation: 62,
        status: 'open',
        rewards: ['سکه', 'کریستال', 'سفینه فضایی', 'عنوان فضانورد'],
        userStatus: {
          hasAccess: false,
          currentLevel: 0,
          completedMissions: 0,
          missionTotal: 20
        }
      },
      {
        id: 'apocalypse',
        name: 'پساآخرالزمان',
        description: 'دنیایی که پس از فاجعه‌ای عظیم از هم پاشیده است. بقا در محیطی خطرناک با منابع محدود.',
        entryFee: 2500,
        maxLevel: 80,
        currentPopulation: 34,
        status: 'open',
        rewards: ['سکه', 'کریستال', 'زره ضد تشعشع', 'عنوان بازمانده'],
        userStatus: {
          hasAccess: false,
          currentLevel: 0,
          completedMissions: 0,
          missionTotal: 25
        }
      }
    ];
    
    // ایجاد Embed برای نمایش جهان‌های موازی
    const embed = new EmbedBuilder()
      .setColor('#6600FF')
      .setTitle('🌀 جهان‌های موازی Ccoin')
      .setDescription('به دنیاهای موازی مختلف سفر کنید و در ماموریت‌های منحصر به فرد شرکت کنید تا جوایز ارزشمند دریافت کنید!')
      .setThumbnail('https://img.icons8.com/fluency/96/portal.png')
      .addFields(
        { 
          name: '👛 موجودی شما',
          value: `سکه: ${user.wallet.toLocaleString()} | بانک: ${user.bank.toLocaleString()} | کریستال: ${user.crystals.toLocaleString()}`,
          inline: false
        }
      );
    
    // افزودن فیلد برای هر جهان موازی
    worlds.forEach(world => {
      const accessStatus = world.userStatus.hasAccess ? 
        `✅ شما به این جهان دسترسی دارید (سطح ${world.userStatus.currentLevel}/${world.maxLevel})` : 
        `❌ برای ورود به این جهان نیاز به پرداخت ${world.entryFee} سکه دارید`;
      
      const missionStatus = world.userStatus.hasAccess ? 
        `ماموریت‌ها: ${world.userStatus.completedMissions}/${world.userStatus.missionTotal}` : 
        'ماموریت‌ها: دسترسی ندارید';
      
      embed.addFields({
        name: `${getWorldIcon(world.id)} ${world.name} - ${world.currentPopulation} نفر حاضر`,
        value: `${world.description}\n\n${accessStatus}\n${missionStatus}`,
        inline: false
      });
    });
    
    // دکمه‌های تعاملی برای هر جهان
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`world_enter_${worlds[0].id}`)
          .setLabel(worlds[0].userStatus.hasAccess ? `ورود به ${worlds[0].name}` : `خرید دسترسی (${worlds[0].entryFee} سکه)`)
          .setStyle(worlds[0].userStatus.hasAccess ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`world_enter_${worlds[1].id}`)
          .setLabel(worlds[1].userStatus.hasAccess ? `ورود به ${worlds[1].name}` : `خرید دسترسی (${worlds[1].entryFee} سکه)`)
          .setStyle(worlds[1].userStatus.hasAccess ? ButtonStyle.Success : ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`world_enter_${worlds[2].id}`)
          .setLabel(worlds[2].userStatus.hasAccess ? `ورود به ${worlds[2].name}` : `خرید دسترسی (${worlds[2].entryFee} سکه)`)
          .setStyle(worlds[2].userStatus.hasAccess ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`world_enter_${worlds[3].id}`)
          .setLabel(worlds[3].userStatus.hasAccess ? `ورود به ${worlds[3].name}` : `خرید دسترسی (${worlds[3].entryFee} سکه)`)
          .setStyle(worlds[3].userStatus.hasAccess ? ButtonStyle.Success : ButtonStyle.Primary)
      );
    
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('worlds_leaderboard')
          .setLabel('🏆 برترین ماجراجویان')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت به منوی اصلی')
          .setStyle(ButtonStyle.Danger)
      );
    
    // ارسال یا بروزرسانی پیام
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ 
          embeds: [embed], 
          components: [row1, row2, row3] 
        });
      } catch (e) {
        // اگر بروزرسانی با خطا مواجه شد، پیام جدید ارسال کن
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2, row3], 
            ephemeral: true 
          });
        } else {
          await interaction.followUp({ 
            embeds: [embed], 
            components: [row1, row2, row3], 
            ephemeral: true 
          });
        }
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          embeds: [embed], 
          components: [row1, row2, row3], 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          embeds: [embed], 
          components: [row1, row2, row3], 
          ephemeral: true 
        });
      }
    }
    
  } catch (error) {
    console.error('Error in parallel worlds menu:', error);
    
    try {
      const errorMessage = 'خطایی در نمایش منوی جهان‌های موازی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ content: errorMessage, embeds: [], components: [] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errorMessage, ephemeral: true });
          } else {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        }
      }
    } catch (e) {
      console.error('Error handling parallel worlds menu failure:', e);
    }
  }
}

/**
 * نمایش جزئیات یک جهان موازی
 */
async function showWorldDetails(
  interaction: MessageComponentInteraction,
  worldId: string
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = interaction.user.id;
    const user = await storage.getUserByDiscordId(userId);
    
    if (!user) {
      await interaction.reply({ 
        content: '❌ **خطا:** حساب شما در سیستم یافت نشد! لطفاً با ورود به منوی اصلی (`/menu`) ثبت نام کنید.', 
        ephemeral: true 
      });
      return;
    }
    
    // در پیاده‌سازی واقعی اطلاعات جهان از دیتابیس دریافت می‌شود
    // اینجا فقط نمونه‌ای هاردکد شده است
    const worlds = {
      'cyberpunk': {
        name: 'سایبرپانک 2077',
        description: 'شهری پر از فناوری پیشرفته و بی‌عدالتی اجتماعی. جایی که هکرها و شرکت‌های بزرگ تکنولوژی قدرت را به دست گرفته‌اند.',
        detailedDescription: 'در این جهان پیشرفته تکنولوژیک، ارتقای سایبری بدن انسان به امری عادی تبدیل شده و مرز بین انسان و ماشین مبهم است. شرکت‌های بزرگ تکنولوژی کنترل جامعه را در دست دارند و هکرها و شورشیان تلاش می‌کنند تا سیستم را بر هم بزنند.\n\nشما می‌توانید به گروه‌های مختلف بپیوندید، مهارت‌های هک خود را توسعه دهید، با ارتقاء‌های سایبری قوی‌تر شوید و در ماموریت‌های مختلف شرکت کنید.',
        missions: [
          { title: 'نفوذ به شرکت آیندکس', reward: '1000 سکه + آیتم هک پیشرفته', completed: true },
          { title: 'دزدی اطلاعات از مرکز داده', reward: '1500 سکه + 15 کریستال', completed: true },
          { title: 'پیدا کردن هکر افسانه‌ای', reward: '2000 سکه + ارتقاء سایبری نادر', completed: true },
          { title: 'نجات گروگان از باند سایبورگ‌ها', reward: '2500 سکه + 25 کریستال', completed: false },
          { title: 'مبارزه با هوش مصنوعی سرکش', reward: '3000 سکه + عنوان "شکارچی AI"', completed: false }
        ],
        stats: {
          level: 7,
          experience: '3500/4000',
          reputation: 'متوسط با هکرها، منفی با شرکت‌ها',
          specialItems: ['ایمپلنت هک سطح 2', 'اسلحه هوشمند', 'دستکش‌های مجازی']
        }
      },
      'medieval': {
        name: 'قرون وسطی',
        description: 'دنیایی از جنگجویان، شوالیه‌ها و جادوگران. مبارزه برای افتخار و ثروت در سرزمینی پر از افسانه و خطر.',
        detailedDescription: 'سرزمینی وسیع پر از قلعه‌های باشکوه، روستاهای کوچک و جنگل‌های مرموز. پادشاهی‌ها برای قدرت با یکدیگر می‌جنگند و موجودات افسانه‌ای در گوشه و کنار دنیا پرسه می‌زنند.\n\nشما می‌توانید مسیر خود را به عنوان یک شوالیه، کماندار، جادوگر یا دزد انتخاب کنید و به ماجراجویی‌های مختلف بروید.',
        missions: [
          { title: 'نجات دهکده از غارتگران', reward: '800 سکه + شمشیر فولادی', completed: true },
          { title: 'پیدا کردن گنج مخفی', reward: '1200 سکه + 10 کریستال', completed: false }
        ],
        stats: {
          level: 3,
          experience: '800/1500',
          reputation: 'مثبت با مردم روستا، خنثی با نگهبانان قلعه',
          specialItems: ['شمشیر فولادی', 'سپر چوبی ساده']
        }
      }
      // سایر جهان‌ها در پیاده‌سازی واقعی اضافه می‌شوند
    };
    
    const world = worlds[worldId as keyof typeof worlds];
    
    if (!world) {
      await interaction.reply({ 
        content: 'این جهان موازی در دسترس نیست!', 
        ephemeral: true 
      });
      return;
    }
    
    // ایجاد Embed برای نمایش جزئیات جهان
    const embed = new EmbedBuilder()
      .setColor('#6600FF')
      .setTitle(`${getWorldIcon(worldId)} ${world.name}`)
      .setDescription(world.detailedDescription)
      .setThumbnail('https://img.icons8.com/fluency/96/portal.png')
      .addFields(
        { name: '📊 وضعیت شما', value: `سطح: ${world.stats.level}\nتجربه: ${world.stats.experience}\nاعتبار: ${world.stats.reputation}`, inline: false },
        { name: '🎒 آیتم‌های ویژه', value: world.stats.specialItems.join('\n') || 'هیچ آیتمی ندارید', inline: false }
      );
    
    // افزودن لیست ماموریت‌ها
    const missionsText = world.missions.map(mission => 
      `${mission.completed ? '✅' : '⬜'} ${mission.title} - جایزه: ${mission.reward}`
    ).join('\n');
    
    embed.addFields({ name: '📋 ماموریت‌ها', value: missionsText, inline: false });
    
    // دکمه‌های تعاملی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`world_mission_${worldId}_${world.missions.findIndex(m => !m.completed)}`)
          .setLabel('شروع ماموریت بعدی')
          .setStyle(ButtonStyle.Success)
          .setDisabled(world.missions.every(m => m.completed)),
        new ButtonBuilder()
          .setCustomId('parallel_worlds')
          .setLabel('🔙 بازگشت به لیست جهان‌ها')
          .setStyle(ButtonStyle.Primary)
      );
    
    // ارسال یا بروزرسانی پیام
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ 
          embeds: [embed], 
          components: [row] 
        });
      } catch (e) {
        // اگر بروزرسانی با خطا مواجه شد، پیام جدید ارسال کن
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            ephemeral: true 
          });
        } else {
          await interaction.followUp({ 
            embeds: [embed], 
            components: [row],
            ephemeral: true 
          });
        }
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          embeds: [embed], 
          components: [row], 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          embeds: [embed], 
          components: [row], 
          ephemeral: true 
        });
      }
    }
    
  } catch (error) {
    console.error(`Error in show world details for ${worldId}:`, error);
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: 'خطایی در نمایش جزئیات جهان رخ داد! لطفاً دوباره تلاش کنید.', 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          content: 'خطایی در نمایش جزئیات جهان رخ داد! لطفاً دوباره تلاش کنید.', 
          ephemeral: true 
        });
      }
    } catch (e) {
      console.error('Error handling world details failure:', e);
    }
  }
}

/**
 * گرفتن آیکون مناسب برای هر جهان
 */
function getWorldIcon(worldId: string): string {
  switch (worldId) {
    case 'cyberpunk':
      return '🏙️';
    case 'medieval':
      return '🏰';
    case 'space':
      return '🚀';
    case 'apocalypse':
      return '☢️';
    default:
      return '🌐';
  }
}