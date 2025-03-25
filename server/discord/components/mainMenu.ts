import { 
  ButtonInteraction, 
  CommandInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  Message,
  ChatInputCommandInteraction,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the main menu
export async function mainMenu(
  interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction,
  showOther: boolean = false
) {
  try {
    // راه‌اندازی پاسخ با تاخیر (defer) تا از خطای تایم‌اوت جلوگیری شود
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
    
    // Check if user exists, create if not
    let user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      user = await storage.createUser({
        discordId: interaction.user.id,
        username: interaction.user.username,
      });
    }
    
    // متغیرهای لازم برای اطلاعات پیشرفته
    const totalMoney = user.wallet + user.bank;
    const experienceNeeded = (user.level || 1) * 100;
    const currentProgress = (user.experience || 0) % experienceNeeded;
    const progressPercent = Math.floor((currentProgress / experienceNeeded) * 100);
    
    // ساخت نوار پیشرفت برای تجربه
    const getProgressBar = (percent: number) => {
      const barLength = 10;
      const filledBars = Math.floor((percent * barLength) / 100);
      const emptyBars = barLength - filledBars;
      const filledBar = '█'.repeat(filledBars);
      const emptyBar = '░'.repeat(emptyBars);
      return `${filledBar}${emptyBar} ${percent}%`;
    };
    
    // بررسی وضعیت کلن کاربر
    const clanStatus = user.clanId 
      ? `عضو کلن 🏰` 
      : 'بدون کلن ⚔️';
    
    // بررسی آیا پاداش روزانه قابل دریافت است
    const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
    const now = new Date();
    const dailyAvailable = !lastDaily || (now.getTime() - lastDaily.getTime() > 24 * 60 * 60 * 1000);
    
    // تولید پیام‌های شخصی بر اساس وضعیت کاربر
    const getPersonalizedMessage = () => {
      // بررسی موجودی کیف پول
      if (user.wallet === 0) {
        return "کیف پولت خالیه! 😅 یه دزدی بکن! 🖐️";
      } else if (user.wallet > 1000) {
        return "کیف پولت پره! 🤑 یه کم خرج کن! 🛒";
      }
      
      // بررسی پاداش روزانه
      if (dailyAvailable) {
        return "پاداش روزانه‌ات منتظرته! 🎁 برو بگیرش!";
      }
      
      // پیام‌های عادی تصادفی اگر هیچکدام از شرایط بالا برقرار نباشد
      const randomMessages = [
        "امروز روز شانس توئه! 🍀 یه بازی انجام بده!",
        "می‌خوای پولدار بشی؟ 💰 سهام بخر!",
        "تو می‌تونی بهترین باشی! 🏆 به تلاشت ادامه بده!",
        "یادت نره هر روز پاداش روزانه بگیری! ⏰",
        "از فروشگاه آیتم‌های جدید بخر! 🛍️"
      ];
      
      return randomMessages[Math.floor(Math.random() * randomMessages.length)];
    };
    
    // تولید اعلانات پویا و طنزآمیز برای کاربر
    const getNotifications = () => {
      // آرایه‌های اعلانات با اولویت‌های مختلف
      const priorityHighNotifications = []; // اولویت 1: رویدادهای زمان‌دار
      const priorityMediumNotifications = []; // اولویت 2: ماموریت‌ها و پاداش روزانه
      const priorityLowNotifications = []; // اولویت 3: وضعیت پت، دزدی‌ها، و سایر فعالیت‌ها
      
      // اولویت 1: رویدادهای زمان‌دار
      
      // وار کلن (فرض می‌کنیم اگر کاربر عضو کلن است، امکان وار فعال هم وجود دارد)
      if (user.clanId && Math.random() > 0.6) {
        priorityHighNotifications.push("وضعیت: وار کلن شما داره تموم می‌شه! ⚔️ تنبلی نکن!");
      }
      
      // تورنمنت (به صورت تصادفی)
      if (Math.random() > 0.7) {
        const tournamentTypes = [
          "حدس عدد", "سنگ کاغذ قیچی", "بلک‌جک", "پوکر"
        ];
        const randomTournament = tournamentTypes[Math.floor(Math.random() * tournamentTypes.length)];
        priorityHighNotifications.push(`وضعیت: تورنمنت ${randomTournament} تا ${Math.floor(Math.random() * 5) + 1} ساعت دیگه تمومه! 🏆`);
      }
      
      // فصل (به صورت تصادفی)
      if (Math.random() > 0.8) {
        priorityHighNotifications.push("وضعیت: فصل جاری داره تموم می‌شه! 🏆 نفر اول باش!");
      }
      
      // اولویت 2: ماموریت‌ها و پاداش روزانه
      
      // پاداش روزانه
      if (dailyAvailable) {
        priorityMediumNotifications.push("وضعیت: پاداش روزانه‌ات منتظرته! 🎁 چرا معطلی؟");
      }
      
      // ماموریت روزانه (به صورت تصادفی)
      if (Math.random() > 0.6) {
        priorityMediumNotifications.push("وضعیت: ماموریت روزانه رو انجام بده! 🎯 تنبل نشو!");
      }
      
      // ماموریت کلن
      if (user.clanId && Math.random() > 0.5) {
        priorityMediumNotifications.push("وضعیت: ماموریت کلن شما فعاله! 🏰 کمک کن!");
      }
      
      // اولویت 3: وضعیت پت، دزدی‌ها، و سایر فعالیت‌ها
      
      // وضعیت پت (به صورت تصادفی)
      if (Math.random() > 0.6) {
        const petActions = [
          "گرسنشه", "حوصلش سر رفته", "غرغر می‌کنه", "منتظر بازیه", "دلش برات تنگ شده"
        ];
        const randomAction = petActions[Math.floor(Math.random() * petActions.length)];
        priorityLowNotifications.push(`وضعیت: پت شما ${randomAction}! 🐶 یه کم باهاش وقت بگذرون!`);
      }
      
      // دزدی موفق (به صورت تصادفی)
      if (Math.random() > 0.8) {
        priorityLowNotifications.push("وضعیت: دزدی اخیرت موفق بود! 🖐️ آفرین سارق!");
      }
      
      // دزدی ناموفق (به صورت تصادفی)
      if (Math.random() > 0.8) {
        priorityLowNotifications.push("وضعیت: دزدی اخیرت خراب شد! 🚨 بیشتر تمرین کن!");
      }
      
      // موجودی کم در کیف پول
      if (user.wallet < 100) {
        priorityLowNotifications.push("وضعیت: کیف پولت خالیه! 😅 یه کم Ccoin جمع کن!");
      }
      
      // موجودی زیاد در کیف پول
      if (user.wallet > 5000) {
        priorityLowNotifications.push("وضعیت: کیف پولت پره! 🤑 برو فروشگاه خرج کن!");
      }
      
      // سرمایه‌گذاری (به صورت تصادفی)
      if (user.bank > 3000 && Math.random() > 0.6) {
        priorityLowNotifications.push("وضعیت: پول‌هات رو سرمایه‌گذاری کن! 💹 پول پول میاره!");
      }
      
      // قرعه‌کشی (به صورت تصادفی)
      if (Math.random() > 0.7) {
        priorityLowNotifications.push("وضعیت: قرعه‌کشی هفتگی داره انجام میشه! 🎲 شانست رو امتحان کن!");
      }
      
      // ادغام اعلانات با حفظ اولویت و محدودیت به حداکثر 3 اعلان
      const allNotifications = [
        ...priorityHighNotifications, 
        ...priorityMediumNotifications, 
        ...priorityLowNotifications
      ].slice(0, 3);
      
      // اگر هیچ اعلانی وجود نداشت، یک پیام پیش‌فرض طنزآمیز نمایش داده می‌شود
      if (allNotifications.length === 0) {
        allNotifications.push("وضعیت: انگار همه چی آرومه! 😎 یه بازی کن!");
      }
      
      return allNotifications.join("\n");
    };
    
    // پیام شخصی کاربر
    const personalMessage = getPersonalizedMessage();
    // اعلانات کاربر
    const notifications = getNotifications();
    
    // Create the main embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700') // رنگ طلایی برای حس لوکس بودن
      .setTitle('✨ خوش آمدید به دنیای Ccoin ✨')
      .setDescription(`🎮 **${interaction.user.username}** عزیز، به مرکز فرماندهی خود خوش آمدید! 🏆\n\n💬 **${personalMessage}**\n\n📢 **اعلانات:**\n${notifications}\n\n📊 **وضعیت اکانت شما**:`)
      .addFields(
        { name: '💰 کیف پول', value: `\`${user.wallet.toLocaleString('fa-IR')} Ccoin\``, inline: true },
        { name: '🏦 بانک', value: `\`${user.bank.toLocaleString('fa-IR')} Ccoin\``, inline: true },
        { name: '💵 مجموع دارایی', value: `\`${totalMoney.toLocaleString('fa-IR')} Ccoin\``, inline: true },
        { name: '💎 کریستال', value: `\`${user.crystals.toLocaleString('fa-IR')}\``, inline: true },
        { name: '🏆 امتیاز', value: `\`${(user.points || 0).toLocaleString('fa-IR')}\``, inline: true },
        { name: '📊 وضعیت کلن', value: `\`${clanStatus}\``, inline: true },
        { name: `🌟 سطح ${user.level || 1} | تجربه ${(user.experience || 0).toLocaleString('fa-IR')}/${(experienceNeeded).toLocaleString('fa-IR')}`, value: `\`${getProgressBar(progressPercent)}\``, inline: false },
        { name: '🎁 پاداش روزانه', value: dailyAvailable ? '`✅ آماده دریافت`' : '`⏳ قبلاً دریافت شده`', inline: true },
        { name: '🔄 استریک روزانه', value: `\`${user.dailyStreak || 0} روز\``, inline: true },
      )
      .setFooter({ 
        text: `🎮 Ccoin Bot v1.5 | ${new Date().toLocaleDateString('fa-IR')} | لذت بازی و کسب درآمد واقعی!`, 
        iconURL: interaction.client.user?.displayAvatarURL() 
      })
      .setThumbnail('https://img.icons8.com/fluency/48/menu--v1.png') // آیکون menu--v1 برای منوی اصلی
      .setTimestamp();
    
    let components = [];
    
    if (!showOther) {
      // منوی اصلی - دکمه‌های با اولویت بالاتر
      
      // حالت اول: نمایش دکمه پاداش روزانه اگر قابل دریافت باشد
      if (dailyAvailable) {
        // Row 1: پاداش روزانه و گزینه‌های اصلی
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('daily')
              .setLabel('🎁 دریافت پاداش روزانه')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('economy')
              .setLabel('💰 اقتصاد')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🎮 بازی‌ها')
              .setStyle(ButtonStyle.Danger),
          );
        
        // Row 2: ویژگی‌های مهم و پرکاربرد دوم
        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('shop')
              .setLabel('🛒 فروشگاه')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('profile')
              .setLabel('👤 پروفایل')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('inventory')
              .setLabel('🎒 کوله‌پشتی')
              .setStyle(ButtonStyle.Danger),
          );
        
        // Row 3: ویژگی‌های مهم ردیف سوم
        const row3 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('quests')
              .setLabel('🎯 ماموریت‌ها')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🏰 کلن‌ها')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('wheel')
              .setLabel('🎡 چرخ شانس')
              .setStyle(ButtonStyle.Danger),
          );
        
        // Row 4: ویژگی‌های بیشتر و متفرقه
        const row4 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stocks')
              .setLabel('📈 سهام')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('help')
              .setLabel('📜 راهنما')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('other_options')
              .setLabel('✨ موارد دیگر')
              .setStyle(ButtonStyle.Secondary),
          );
        
        components = [row1, row2, row3, row4];
      }
      else {
        // Row 1: اصلی‌ترین ویژگی‌ها با بیشترین کاربرد
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('economy')
              .setLabel('💰 اقتصاد')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🎮 بازی‌ها')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('shop')
              .setLabel('🛒 فروشگاه')
              .setStyle(ButtonStyle.Danger),
          );
        
        // Row 2: ویژگی‌های مهم و پرکاربرد دوم
        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('profile')
              .setLabel('👤 پروفایل')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('inventory')
              .setLabel('🎒 کوله‌پشتی')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('quests')
              .setLabel('🎯 ماموریت‌ها')
              .setStyle(ButtonStyle.Danger),
          );
        
        // Row 3: ویژگی‌های مهم ردیف سوم
        const row3 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🏰 کلن‌ها')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('wheel')
              .setLabel('🎡 چرخ شانس')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('stocks')
              .setLabel('📈 سهام')
              .setStyle(ButtonStyle.Danger),
          );
        
        // Row 4: ویژگی‌های بیشتر و متفرقه
        const row4 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('lottery')
              .setLabel('🎟️ قرعه‌کشی')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('help')
              .setLabel('📜 راهنما')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('other_options')
              .setLabel('✨ موارد دیگر')
              .setStyle(ButtonStyle.Secondary),
          );
        
        components = [row1, row2, row3, row4];
      }
    } else {
      // منوی موارد دیگر - با طراحی جدید و دسته‌بندی بهتر

      // بروزرسانی Embed برای منوی امکانات بیشتر
      embed.setTitle('✨ امکانات بیشتر Ccoin ✨')
        .setDescription(`**${interaction.user.username}** عزیز، به صفحه امکانات پیشرفته Ccoin خوش آمدید!\n\nدر این بخش می‌توانید به ویژگی‌های بیشتری دسترسی داشته باشید و از قابلیت‌های پیشرفته‌تر ربات استفاده کنید.`)
        .setThumbnail('https://img.icons8.com/fluency/48/menu--v1.png');  // آیکون menu--v1 از Fluency برای منوی امکانات بیشتر

      // Row 1: امکانات بخش سرگرمی و رقابت
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('lottery')
            .setLabel('🎟️ قرعه‌کشی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('tournaments')
            .setLabel('🏆 تورنمنت‌ها')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('achievements')
            .setLabel('🎖️ دستاوردها')
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 2: امکانات بخش مدیریت و پیشرفت
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('investments')
            .setLabel('💹 سرمایه‌گذاری')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('marketplace')
            .setLabel('🏪 بازار کاربران')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('🥷 دزدی')
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 3: امکانات بخش دنیای مجازی
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('giveaway_bridge')
            .setLabel('🎮 قرعه‌کشی گیواوی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('seasons')
            .setLabel('📅 فصل‌ها')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('parallel_worlds')
            .setLabel('🌀 جهان‌های موازی')
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 4: امکانات اضافی
      const row4 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pets')
            .setLabel('🐾 پت‌های من')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('blackjack')
            .setLabel('🃏 بلک‌جک')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('donate')
            .setLabel('❤️ حمایت از ربات')
            .setStyle(ButtonStyle.Secondary),
        );
      
      // Row 5: دکمه بازگشت
      const row5 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت به منوی اصلی')
            .setStyle(ButtonStyle.Primary),
        );
      
      components = [row1, row2, row3, row4, row5];
    }
    
    // Send or update the message - همیشه به صورت ephemeral (فقط برای کاربر قابل مشاهده)
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: components });
    } else if (interaction instanceof ChatInputCommandInteraction) {
      if (!interaction.replied) {
        await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
      } else {
        await interaction.followUp({ embeds: [embed], components: components, ephemeral: true });
      }
    } else if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ embeds: [embed], components: components });
      } catch (e) {
        // If update fails (might be due to deferred interaction), send a new message
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], components: components, ephemeral: true });
        }
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
      } else {
        await interaction.followUp({ embeds: [embed], components: components, ephemeral: true });
      }
    }
    
  } catch (error) {
    console.error('Error in main menu:', error);
    
    try {
      const errorMessage = 'خطایی در نمایش منو رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling main menu failure:', e);
    }
  }
}
