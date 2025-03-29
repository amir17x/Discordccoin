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
    
    // تولید اعلانات هوشمند شخصی‌سازی شده با هوش مصنوعی
    const getNotifications = async () => {
      try {
        // استفاده از سیستم اعلانات هوشمند و شخصی‌سازی شده با Gemini
        // با بهینه‌سازی جدید، اعلانات از قبل در دیتابیس ذخیره می‌شوند
        // و فقط در صورت نیاز از API هوش مصنوعی استفاده می‌شود
        const { generateUserNotifications } = await import('../utils/aiPersonalNotifications');
        
        // دریافت اعلانات شخصی‌سازی شده بر اساس وضعیت واقعی کاربر
        // این تابع ابتدا اعلانات را از دیتابیس دریافت می‌کند و فقط در صورت نیاز اعلانات جدید تولید می‌کند
        let personalizedNotifications = await generateUserNotifications(interaction.user.id, 3);
        
        // اگر هیچ اعلانی دریافت نشد، از اعلانات پیش‌فرض استفاده می‌کنیم
        if (!personalizedNotifications || personalizedNotifications.length === 0) {
          personalizedNotifications = [
            "امروز روز شانس توئه! 🍀 یه بازی انجام بده!",
            "می‌خوای پولدار بشی؟ 💰 از فروشگاه آیتم بخر!",
            "تو می‌تونی بهترین باشی! 🏆 به تلاشت ادامه بده!"
          ];
        }
        
        // اضافه کردن شماره به ابتدای هر اعلان
        const numberedNotifications = personalizedNotifications.map((notification, index) => 
          `${index + 1}. ${notification}`
        );
        
        // تبدیل آرایه به رشته با جداکننده خط جدید
        return "اعلانیه‌ها:\n" + numberedNotifications.map(text => `\`${text}\``).join("\n");
      } catch (error) {
        console.error('خطا در دریافت اعلانات شخصی‌سازی شده:', error);
        
        // در صورت خطا، از اعلانات هوشمند دست‌ساز استفاده می‌کنیم که نیازی به API هوش مصنوعی ندارند
        // این اعلانات به صورت پویا بر اساس وضعیت کاربر تولید می‌شوند
        const smartNotifications = [];
        
        // اعلانات مربوط به موجودی کاربر
        if (user.wallet < 1000) {
          smartNotifications.push(`فقط ${user.wallet} سکه تو کیف پولت داری! 😱 یه ماموریت انجام بده!`);
        } else if (user.wallet > 5000) {
          smartNotifications.push(`${user.wallet} سکه تو کیف پولت داری! 🤑 یکم سرمایه‌گذاری کن!`);
        }
        
        // اعلانات مربوط به پاداش روزانه
        if (dailyAvailable) {
          smartNotifications.push(`پاداش روزانه‌ات آماده دریافته! 🎁 زود بگیرش!`);
        } else {
          const lastDailyDate = new Date(user.lastDaily || Date.now());
          const nextDaily = new Date(lastDailyDate.getTime() + 24 * 60 * 60 * 1000);
          const hoursRemaining = Math.floor((nextDaily.getTime() - Date.now()) / (60 * 60 * 1000));
          if (hoursRemaining > 0) {
            smartNotifications.push(`${hoursRemaining} ساعت دیگه تا پاداش روزانه بعدیت مونده! ⏰`);
          }
        }
        
        // اعلانات مربوط به استریک
        if (user.dailyStreak > 3) {
          smartNotifications.push(`استریک ${user.dailyStreak} روزه داری! 🔥 فردا هم فراموش نکن!`);
        }
        
        // اعلانات مربوط به کلن
        if (user.clanId) {
          smartNotifications.push(`عضو کلن هستی! 🏰 یادت نره به هم‌تیمی‌هات کمک کنی!`);
        } else {
          smartNotifications.push(`هنوز کلن نداری! 🏯 به یکی بپیوند یا خودت بساز!`);
        }
        
        // اعلانات عمومی پرکاربرد
        smartNotifications.push(`در بازی‌ها شرکت کن و جایزه بگیر! 🎮 امتیازت: ${user.points || 0}`);
        smartNotifications.push(`ماموریت‌های جدید = سکه بیشتر! 🎯 چک کردی امروز؟`);
        smartNotifications.push(`بازار سهام رو یادت نره! 📈 قیمت‌ها دائم تغییر می‌کنن!`);
        
        // انتخاب سه مورد تصادفی
        const selectedNotifications: string[] = [];
        for (let i = 0; i < 3; i++) {
          if (smartNotifications.length === 0) break;
          const randomIndex = Math.floor(Math.random() * smartNotifications.length);
          selectedNotifications.push(smartNotifications[randomIndex]);
          smartNotifications.splice(randomIndex, 1); // حذف مورد انتخاب شده
        }
        
        // اضافه کردن شماره به ابتدای هر اعلان
        const numberedNotifications = selectedNotifications.map((notification, index) => 
          `${index + 1}. ${notification}`
        );
        
        // تبدیل آرایه به رشته با جداکننده خط جدید
        return "اعلانیه‌ها:\n" + numberedNotifications.map(text => `\`${text}\``).join("\n");
      }
    };
    
    // پیام شخصی کاربر
    const personalMessage = getPersonalizedMessage();
    // اعلانات کاربر
    const notifications = await getNotifications();
    
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
            .setCustomId('friends')
            .setLabel('👥 سیستم دوستان')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('🥷 دزدی')
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 3: امکانات بخش دنیای مجازی و ابزارهای ارتباطی
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('notifications_menu')
            .setLabel('🔔 اعلان‌های شخصی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('giveaway_bridge')
            .setLabel('🎮 قرعه‌کشی گیواوی')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('parallel_worlds')
            .setLabel('🌀 جهان‌های موازی')
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 4: امکانات اضافی با اضافه کردن دکمه هوش مصنوعی
      const row4 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pets')
            .setLabel('🐾 پت‌های من')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('ai_assistant')
            .setLabel('🧠 دستیار هوشمند')
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
