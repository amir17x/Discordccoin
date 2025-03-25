import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { storage } from '../../storage';

/**
 * سیستم تورنمنت‌های Ccoin
 * امکان شرکت در تورنمنت‌های هفتگی با جوایز ویژه
 */
export async function tournamentsMenu(
  interaction: MessageComponentInteraction
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ 
            content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
            embeds: [], 
            components: [] 
          });
        } catch (e) {
          await interaction.reply({ 
            content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
            ephemeral: true 
          });
        }
      } else {
        await interaction.reply({ 
          content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
          ephemeral: true 
        });
      }
      return;
    }
    
    // لیست تورنمنت‌های فعال
    // توجه: در پیاده‌سازی واقعی، این موارد از دیتابیس خوانده می‌شوند
    const tournaments = [
      {
        id: 'weekly_1',
        name: 'تورنمنت هفتگی سنگ کاغذ قیچی',
        description: 'در این تورنمنت هفتگی شرکت کنید و با بازی سنگ کاغذ قیچی شانس خود را برای بردن جایزه ویژه امتحان کنید!',
        entryFee: 500,
        prize: 10000,
        participants: 12,
        maxParticipants: 32,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // شروع از 2 روز قبل
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 روز دیگر
        status: 'active',
        userParticipated: false,
        gameType: 'rps'
      },
      {
        id: 'weekly_2',
        name: 'تورنمنت پرتاب تاس',
        description: 'تورنمنت هیجان‌انگیز پرتاب تاس! هر کسی که بالاترین امتیاز را داشته باشد، برنده جایزه بزرگ می‌شود.',
        entryFee: 750,
        prize: 15000,
        participants: 8,
        maxParticipants: 16,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // شروع از 1 روز قبل
        endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 روز دیگر
        status: 'active',
        userParticipated: false,
        gameType: 'dice'
      },
      {
        id: 'special_1',
        name: 'تورنمنت ویژه شب یلدا',
        description: 'تورنمنت ویژه مناسبت شب یلدا با جوایز استثنایی! فرصتی منحصر به فرد برای کسب کریستال و آیتم‌های کمیاب.',
        entryFee: 1000,
        prize: 25000,
        participants: 20,
        maxParticipants: 64,
        startTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 روز دیگر
        endTime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(), // 22 روز دیگر
        status: 'upcoming',
        userParticipated: false,
        gameType: 'mixed'
      }
    ];
    
    // ایجاد Embed برای نمایش تورنمنت‌ها
    const embed = new EmbedBuilder()
      .setColor('#FF9900')
      .setTitle('🏆 تورنمنت‌های Ccoin')
      .setDescription('در تورنمنت‌های هفتگی Ccoin شرکت کنید و برنده جوایز ارزشمند شوید!')
      .setThumbnail('https://img.icons8.com/fluency/96/trophy.png')
      .addFields(
        { 
          name: '👛 موجودی شما',
          value: `سکه: ${user.wallet.toLocaleString()} | بانک: ${user.bank.toLocaleString()} | کریستال: ${user.crystals.toLocaleString()}`,
          inline: false
        }
      );
    
    // افزودن اطلاعات هر تورنمنت
    tournaments.forEach(tournament => {
      const timeRemaining = getTimeRemaining(tournament.endTime);
      const statusText = tournament.status === 'active' 
        ? `🟢 در حال برگزاری (${timeRemaining})`
        : tournament.status === 'upcoming' 
          ? '⏳ به زودی' 
          : '🔴 به پایان رسیده';
      
      const participantsText = `شرکت‌کنندگان: ${tournament.participants}/${tournament.maxParticipants}`;
      
      embed.addFields({
        name: `${tournament.name} - ${statusText}`,
        value: `${tournament.description}\n💰 ورودی: ${tournament.entryFee} سکه | 🏅 جایزه: ${tournament.prize} سکه\n👥 ${participantsText}`,
        inline: false
      });
    });
    
    // دکمه‌های تعاملی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`join_tournament_${tournaments[0].id}`)
          .setLabel(`شرکت در ${tournaments[0].name}`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(tournaments[0].status !== 'active' || tournaments[0].userParticipated),
        new ButtonBuilder()
          .setCustomId(`join_tournament_${tournaments[1].id}`)
          .setLabel(`شرکت در ${tournaments[1].name}`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(tournaments[1].status !== 'active' || tournaments[1].userParticipated)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`join_tournament_${tournaments[2].id}`)
          .setLabel(`شرکت در ${tournaments[2].name}`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(tournaments[2].status !== 'active' || tournaments[2].userParticipated),
        new ButtonBuilder()
          .setCustomId('tournaments_leaderboard')
          .setLabel('🏅 جدول رده‌بندی')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tournaments_history')
          .setLabel('📜 تاریخچه تورنمنت‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('tournaments_help')
          .setLabel('❓ راهنمای تورنمنت‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
    
    const row4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
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
          components: [row1, row2, row3, row4] 
        });
      } catch (e) {
        // اگر بروزرسانی با خطا مواجه شد، پیام جدید ارسال کن
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2, row3, row4], 
            ephemeral: true 
          });
        } else {
          await interaction.followUp({ 
            embeds: [embed], 
            components: [row1, row2, row3, row4], 
            ephemeral: true 
          });
        }
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          embeds: [embed], 
          components: [row1, row2, row3, row4], 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          embeds: [embed], 
          components: [row1, row2, row3, row4], 
          ephemeral: true 
        });
      }
    }
    
  } catch (error) {
    console.error('Error in tournaments menu:', error);
    
    try {
      const errorMessage = 'خطایی در نمایش منوی تورنمنت‌ها رخ داد! لطفاً دوباره تلاش کنید.';
      
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
      console.error('Error handling tournaments menu failure:', e);
    }
  }
}

/**
 * پردازش شرکت در تورنمنت
 */
export async function processJoinTournament(
  interaction: MessageComponentInteraction,
  tournamentId: string
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      await interaction.reply({ 
        content: 'حساب شما در سیستم یافت نشد!', 
        ephemeral: true 
      });
      return;
    }
    
    // در پیاده‌سازی واقعی، اطلاعات تورنمنت از دیتابیس خوانده می‌شود
    // اینجا فقط برای نمونه، تورنمنت‌ها را هاردکد می‌کنیم
    const tournaments = {
      'weekly_1': {
        name: 'تورنمنت هفتگی سنگ کاغذ قیچی',
        entryFee: 500,
        prize: 10000
      },
      'weekly_2': {
        name: 'تورنمنت پرتاب تاس',
        entryFee: 750,
        prize: 15000
      },
      'special_1': {
        name: 'تورنمنت ویژه شب یلدا',
        entryFee: 1000,
        prize: 25000
      }
    };
    
    const tournament = tournaments[tournamentId as keyof typeof tournaments];
    
    if (!tournament) {
      await interaction.reply({ 
        content: 'این تورنمنت دیگر در دسترس نیست!', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی موجودی کافی
    if (user.wallet < tournament.entryFee) {
      await interaction.reply({ 
        content: `موجودی سکه شما کافی نیست! شما به ${tournament.entryFee} سکه نیاز دارید.`, 
        ephemeral: true 
      });
      return;
    }
    
    // پردازش ثبت‌نام در تورنمنت
    // در پیاده‌سازی واقعی، این بخش با دیتابیس تعامل می‌کند
    await storage.addToWallet(userId, -tournament.entryFee);
    
    // پاسخ به کاربر
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ ثبت‌نام در تورنمنت')
      .setDescription(`شما با موفقیت در ${tournament.name} ثبت‌نام کردید!`)
      .setThumbnail('https://img.icons8.com/fluency/96/trophy.png')
      .addFields(
        { name: '💰 هزینه ثبت‌نام', value: `${tournament.entryFee} سکه`, inline: true },
        { name: '🏆 جایزه تورنمنت', value: `${tournament.prize} سکه`, inline: true },
        { name: '📑 راهنما', value: 'نتایج تورنمنت پس از پایان آن اعلام خواهد شد.\nشما می‌توانید وضعیت خود را در بخش «جدول رده‌بندی» مشاهده کنید.' }
      );
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tournaments')
          .setLabel('🔙 بازگشت به لیست تورنمنت‌ها')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [row], 
      ephemeral: true 
    });
    
  } catch (error) {
    console.error('Error in join tournament:', error);
    
    await interaction.reply({ 
      content: 'خطایی در ثبت‌نام شما رخ داد! لطفاً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * محاسبه زمان باقی‌مانده تا پایان تورنمنت
 */
function getTimeRemaining(endTimeStr: Date | string): string {
  const endTime = new Date(endTimeStr).getTime();
  const now = Date.now();
  
  const timeRemaining = endTime - now;
  if (timeRemaining <= 0) return 'پایان یافته';
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} روز و ${hours} ساعت`;
  } else {
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعت و ${minutes} دقیقه`;
  }
}