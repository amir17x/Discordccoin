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
    
    // تولید پیام‌های شخصی بر اساس وضعیت کاربر (سیستم داخلی سریع)
    const getPersonalizedMessage = () => {
      // پیام‌های بر اساس موجودی
      if (user.wallet === 0) {
        const brokeMessages = [
          "کیف پولت خالیه! 😅 یه دزدی بکن یا ماموریت‌ها رو انجام بده!",
          "خالی مثل کویر! 🏜️ برو یه کم سکه جمع کن با مینی گیم‌ها!", 
          "جیبت خالیه رفیق! 🕳️ چطوره برای دریافت پاداش روزانه اقدام کنی؟"
        ];
        return brokeMessages[Math.floor(Math.random() * brokeMessages.length)];
      } else if (user.wallet < 1000) {
        return `فقط ${user.wallet.toLocaleString('fa-IR')} سکه داری! 😱 یه ماموریت انجام بده!`;
      } else if (user.wallet > 100000) {
        return "تو یه میلیونری! 🤑 انقدر پول داری که می‌تونی کل سرور رو بخری!";
      } else if (user.bank > user.wallet * 5) {
        return "بانکت پر از سکه‌ست! 🏦 تو یه سرمایه‌گذار حرفه‌ای هستی!";
      }
      
      // پیام‌های بر اساس پاداش روزانه
      if (dailyAvailable) {
        return "پاداش روزانه‌ات منتظرته! 🎁 برو بگیرش!";
      }
      
      // پیام‌های بر اساس استریک
      if (user.dailyStreak && user.dailyStreak > 10) {
        return `${user.dailyStreak} روز استریک! 🔥 تو واقعاً مداومی!`;
      }
      
      // پیام‌های عادی تصادفی
      const randomMessages = [
        "امروز روز شانس توئه! 🍀 یه بازی انجام بده!",
        "می‌خوای پولدار بشی؟ 💰 سهام بخر!",
        "تو می‌تونی بهترین باشی! 🏆 به تلاشت ادامه بده!",
        "یادت نره هر روز پاداش روزانه بگیری! ⏰",
        "از فروشگاه آیتم‌های جدید بخر! 🛍️"
      ];
      
      return randomMessages[Math.floor(Math.random() * randomMessages.length)];
    };
    
    // تولید اعلانات داخلی شخصی‌سازی شده (سریع و بدون import)
    const getNotifications = () => {
      const smartNotifications: string[] = [];
      
      // اعلانات مربوط به موجودی کاربر (اولویت بالا)
      if (user.wallet < 1000) {
        smartNotifications.push(`فقط ${user.wallet.toLocaleString('fa-IR')} سکه تو کیف پولت داری! 😱 یه ماموریت انجام بده!`);
      } else if (user.wallet > 50000) {
        smartNotifications.push(`${user.wallet.toLocaleString('fa-IR')} سکه داری! 🤑 یکم سرمایه‌گذاری کن!`);
      }
      
      // اعلانات مربوط به پاداش روزانه (اولویت بالا)
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
      if (user.dailyStreak && user.dailyStreak > 3) {
        smartNotifications.push(`استریک ${user.dailyStreak} روزه داری! 🔥 فردا هم فراموش نکن!`);
      }
      
      // اعلانات مربوط به کلن
      if (user.clanId) {
        smartNotifications.push(`عضو کلن هستی! 🏰 یادت نره به هم‌تیمی‌هات کمک کنی!`);
      } else {
        smartNotifications.push(`هنوز کلن نداری! 🏯 به یکی بپیوند یا خودت بساز!`);
      }
      
      // اعلانات مربوط به بانک
      if (user.bank === 0 && user.wallet > 5000) {
        smartNotifications.push(`بانکت خالیه! 🏦 یکم پول توش بریز تا سود بگیری!`);
      }
      
      // اعلانات مربوط به کریستال
      if (user.crystals === 0) {
        smartNotifications.push(`کریستال نداری! 💎 از بازی‌ها کریستال بگیر!`);
      } else if (user.crystals > 100) {
        smartNotifications.push(`${user.crystals.toLocaleString('fa-IR')} کریستال داری! ✨ از فروشگاه ویژه خرید کن!`);
      }
      
      // اعلانات عمومی پرکاربرد
      smartNotifications.push(`در بازی‌ها شرکت کن و جایزه بگیر! 🎮 امتیازت: ${(user.points || 0).toLocaleString('fa-IR')}`);
      smartNotifications.push(`ماموریت‌های جدید = سکه بیشتر! 🎯 چک کردی امروز؟`);
      smartNotifications.push(`بازار سهام رو یادت نره! 📈 قیمت‌ها دائم تغییر می‌کنن!`);
      
      // انتخاب سه مورد بر اساس اولویت
      const selectedNotifications: string[] = [];
      
      // اولویت بالا: موجودی کم، پاداش روزانه
      if (user.wallet < 1000 || dailyAvailable) {
        selectedNotifications.push(smartNotifications.find(n => n.includes('سکه تو کیف پولت') || n.includes('پاداش روزانه‌ات آماده')) || smartNotifications[0]);
      }
      
      // اولویت متوسط: کلن، استریک، بانک، کریستال
      const mediumPriority = smartNotifications.filter(n => 
        n.includes('کلن') || n.includes('استریک') || n.includes('بانکت') || n.includes('کریستال')
      );
      if (mediumPriority.length > 0 && selectedNotifications.length < 3) {
        selectedNotifications.push(mediumPriority[0]);
      }
      
      // پر کردن باقی با اعلانات عمومی
      while (selectedNotifications.length < 3) {
        const generalNotifications = smartNotifications.filter(n => 
          !selectedNotifications.includes(n) && (n.includes('بازی‌ها') || n.includes('ماموریت') || n.includes('سهام'))
        );
        if (generalNotifications.length > 0) {
          selectedNotifications.push(generalNotifications[Math.floor(Math.random() * generalNotifications.length)]);
        } else {
          selectedNotifications.push(smartNotifications[Math.floor(Math.random() * smartNotifications.length)]);
        }
      }
      
      // اضافه کردن شماره به ابتدای هر اعلان
      const numberedNotifications = selectedNotifications.slice(0, 3).map((notification, index) => 
        `${index + 1}. ${notification}`
      );
      
      // تبدیل آرایه به رشته با جداکننده خط جدید
      return "اعلانیه‌ها:\n" + numberedNotifications.map(text => `\`${text}\``).join("\n");
    };
    
    // پیام شخصی کاربر
    const personalMessage = getPersonalizedMessage();
    // اعلانات کاربر
    const notifications = getNotifications();
    
    // انتخاب یک رنگ تصادفی برای نمایش در هر بار استفاده
    const themeColors = [
      '#FFD700', // طلایی کلاسیک
      '#4A90E2', // آبی آسمانی
      '#7B68EE', // بنفش سلطنتی
      '#FF6B6B', // قرمز گلی
      '#50C878', // سبز زمردی
      '#FF8C00', // نارنجی تیره
      '#9932CC', // بنفش عمیق
      '#FF1493'  // صورتی گرم
    ];
    
    // انتخاب تصادفی رنگ
    const randomColor = themeColors[Math.floor(Math.random() * themeColors.length)];
    
    // ایجاد عنوان پویا بر اساس زمان روز
    const currentHour = new Date().getHours();
    let greetingTitle = '✨ خوش آمدید به دنیای Ccoin ✨';
    
    if (currentHour >= 5 && currentHour < 12) {
      greetingTitle = '🌅 صبح بخیر! خوش آمدید به دنیای Ccoin ✨';
    } else if (currentHour >= 12 && currentHour < 17) {
      greetingTitle = '☀️ ظهر بخیر! خوش آمدید به دنیای Ccoin ✨';
    } else if (currentHour >= 17 && currentHour < 22) {
      greetingTitle = '🌆 عصر بخیر! خوش آمدید به دنیای Ccoin ✨';
    } else {
      greetingTitle = '🌙 شب بخیر! خوش آمدید به دنیای Ccoin ✨';
    }
    
    // Create the main embed with رنگ‌های پویا و عنوان متناسب با زمان روز
    const embed = new EmbedBuilder()
      .setColor(randomColor)
      .setTitle(greetingTitle)
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
              .setCustomId('market_menu')
              .setLabel('🛒 بازار')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('other_options')
              .setLabel('✨ موارد دیگر')
              .setStyle(ButtonStyle.Secondary),
          );
          
        const row5 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('help')
              .setLabel('📜 راهنما')
              .setStyle(ButtonStyle.Primary),
          );
        
        components = [row1, row2, row3, row4, row5];
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
              .setCustomId('market_menu')
              .setLabel('🛒 بازار')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('help')
              .setLabel('📚 راهنما')
              .setStyle(ButtonStyle.Danger),
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
            .setCustomId('ccoin_ai')
            .setLabel('🤖 CCOIN AI')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setLabel('❤️ حمایت از ربات')
            .setStyle(ButtonStyle.Link)
            .setURL('https://hamibash.com/discordccoinbot'),
        );
        
      // Row 5: AI Assistant و دستاوردها - حذف این بخش و استفاده از row4 برای CCOIN AI
      
      // Row 5: دکمه بازگشت
      const row5 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت به منوی اصلی')
            .setStyle(ButtonStyle.Primary),
        );
      
      // Discord only allows up to 5 ActionRow components
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
