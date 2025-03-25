import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageComponentInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the economy menu
// تابع نمایش مودال انتقال سکه به کاربران دیگر
export async function transferUser(interaction: ButtonInteraction) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // اگر کاربر سکه کافی در کیف پول ندارد
    if (user.wallet <= 0) {
      await interaction.reply({
        content: '❌ شما سکه کافی در کیف پول خود ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // ایجاد مودال انتقال سکه
    const modal = new ModalBuilder()
      .setCustomId('transfer_modal')
      .setTitle('💸 انتقال سکه به کاربر دیگر');
    
    // فیلد وارد کردن آی‌دی دیسکورد کاربر مقصد
    const receiverIdInput = new TextInputBuilder()
      .setCustomId('receiver_id')
      .setLabel('آی‌دی دیسکورد کاربر مقصد')
      .setPlaceholder('مثال: 123456789012345678')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(20);
    
    // فیلد وارد کردن مقدار سکه
    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('مقدار سکه (حداکثر 5000 سکه)')
      .setPlaceholder(`حداکثر ${Math.min(user.wallet, 5000)} سکه`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(5);
    
    // فیلد اختیاری پیام
    const messageInput = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('پیام به گیرنده (اختیاری)')
      .setPlaceholder('پیام خود را به کاربر مقصد وارد کنید')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(100);
    
    // اضافه کردن فیلدها به مودال
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(receiverIdInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    
    modal.addComponents(firstRow, secondRow, thirdRow);
    
    // نمایش مودال به کاربر
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error('Error in transfer user modal:', error);
    await interaction.reply({
      content: '❌ متأسفانه در نمایش فرم انتقال سکه خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// تابع پردازش انتقال سکه پس از تکمیل مودال
export async function processTransfer(
  interaction: any,
  receiverId: string,
  amount: number,
  message: string
) {
  try {
    // Check if user exists
    const sender = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!sender) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه کاربر مقصد وجود دارد یا خیر
    const receiver = await storage.getUserByDiscordId(receiverId);
    
    if (!receiver) {
      await interaction.reply({
        content: '❌ کاربر مقصد یافت نشد! لطفاً آی‌دی دیسکورد را به درستی وارد کنید.',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه کاربر به خودش انتقال نمی‌دهد
    if (sender.id === receiver.id) {
      await interaction.reply({
        content: '❌ شما نمی‌توانید به حساب خودتان سکه انتقال دهید!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه مقدار وارد شده معتبر است
    if (isNaN(amount) || amount <= 0) {
      await interaction.reply({
        content: '❌ لطفاً یک مقدار عددی معتبر وارد کنید!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی محدودیت روزانه (5000 سکه)
    if (amount > 5000) {
      await interaction.reply({
        content: '❌ محدودیت روزانه انتقال سکه 5000 Ccoin است!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه کاربر به اندازه کافی سکه دارد
    if (sender.wallet < amount) {
      await interaction.reply({
        content: `❌ موجودی کیف پول شما کافی نیست! موجودی فعلی: ${sender.wallet} Ccoin`,
        ephemeral: true
      });
      return;
    }
    
    // محاسبه کارمزد (1%)
    const fee = Math.ceil(amount * 0.01);
    const transferAmount = amount - fee;
    
    // انجام انتقال
    await storage.transferCoin(sender.id, receiver.id, amount);
    
    // ارسال پاسخ به فرستنده
    await interaction.reply({
      content: `✅ مبلغ ${transferAmount} سکه با موفقیت به ${receiver.username} منتقل شد!\n💸 کارمزد: ${fee} سکه\n📝 پیام: ${message || '-'}`,
      ephemeral: true
    });
    
    // به‌روزرسانی منوی اقتصاد پس از چند ثانیه
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await economyMenu(interaction, true);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error processing transfer:', error);
    await interaction.reply({
      content: '❌ متأسفانه در انتقال سکه خطایی رخ داد! لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

export async function economyMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // تعریف متغیرهای زمانی برای استفاده در تمام بخش‌ها
    const now = new Date();
    
    // Check if daily reward is available
    const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
    const dailyAvailable = !lastDaily || (now.getTime() - lastDaily.getTime() >= 24 * 60 * 60 * 1000);
    
    // متغیرهای لازم برای اطلاعات پیشرفته‌تر
    const totalMoney = user.wallet + user.bank;
    const bankInterestDate = user.lastBankInterest ? new Date(user.lastBankInterest) : null;
    const millisecondsInMonth = 30 * 24 * 60 * 60 * 1000;
    const nextInterestDate = bankInterestDate ? new Date(bankInterestDate.getTime() + millisecondsInMonth) : null;
    const daysUntilInterest = nextInterestDate ? Math.max(0, Math.ceil((nextInterestDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 30;
    const interestAmount = Math.floor(user.bank * 0.02); // محاسبه 2% سود بانکی

    // تعیین رنگ و نماد وضعیت حساب
    let accountStatus = '⚪ عادی';
    let accountColor = 0x2ECC71; // سبز روشن - با فرمت عددی به جای هگز

    if (totalMoney > 50000) {
      accountStatus = '💠 الماس';
      accountColor = 0x9b59b6; // بنفش
    } else if (totalMoney > 20000) {
      accountStatus = '🥇 طلایی';
      accountColor = 0xf1c40f; // زرد طلایی
    } else if (totalMoney > 10000) {
      accountStatus = '🥈 نقره‌ای';
      accountColor = 0x95a5a6; // نقره‌ای
    } else if (totalMoney > 5000) {
      accountStatus = '🥉 برنزی';
      accountColor = 0xe67e22; // نارنجی
    }

    // محاسبه رتبه اقتصادی
    const economicRank = user.economyLevel > 5 ? 'سرمایه‌دار 💼' :
                         user.economyLevel > 3 ? 'ثروتمند 💵' :
                         user.economyLevel > 1 ? 'میانه رو 💱' : 'تازه‌کار 🔰';

    // Create the economy embed with enhanced styling and information
    const embed = new EmbedBuilder()
      .setColor(accountColor)
      .setTitle('💰 سیستم اقتصادی Ccoin')
      .setDescription(`**${interaction.user.username}** عزیز، به سیستم جامع اقتصادی Ccoin خوش آمدید!\n\n✅ در این بخش می‌توانید تمام امور مالی خود را مدیریت کنید، سکه انتقال دهید، از خدمات بانکی استفاده کنید و کریستال‌های ارزشمند را دریافت نمایید.`)
      .setThumbnail('https://img.icons8.com/fluency/48/transaction-list.png') // آیکون transaction-list برای بخش اقتصاد
      .addFields(
        { name: '💵 موجودی حساب‌ها', value: 
          `💳 **کیف پول**: \`${user.wallet.toLocaleString('fa-IR')} Ccoin\`\n` +
          `🏦 **بانک**: \`${user.bank.toLocaleString('fa-IR')} Ccoin\`\n` +
          `💎 **کریستال**: \`${user.crystals.toLocaleString('fa-IR')}\``, inline: true },
        
        { name: '📊 وضعیت اقتصادی', value: 
          `🏆 **رتبه**: \`${economicRank}\`\n` +
          `💹 **سطح**: \`${user.economyLevel}\`\n` +
          `🏅 **وضعیت**: \`${accountStatus}\``, inline: true },
        
        { name: '🏦 اطلاعات بانکی', value: 
          `💰 **کل دارایی**: \`${totalMoney.toLocaleString('fa-IR')} Ccoin\`\n` +
          `📈 **سود بانکی بعدی**: \`${interestAmount.toLocaleString('fa-IR')} Ccoin\`\n` +
          `⏱️ **زمان سود بعدی**: \`${daysUntilInterest} روز دیگر\``, inline: false },
        
        { name: '💡 راهنمای سریع', value: 
          `• برای محافظت از سرقت، پول خود را در بانک نگهداری کنید\n` +
          `• با تبدیل سکه به کریستال، می‌توانید آیتم‌های ویژه خریداری کنید\n` +
          `• سود 2% ماهانه به موجودی بانکی شما تعلق می‌گیرد`
        }
      )
      .setFooter({ 
        text: `رکورد ورود روزانه: ${user.dailyStreak} روز | کارمزد انتقال: 1% | به‌روزرسانی: ${new Date().toLocaleDateString('fa-IR')}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();
    
    // Daily reward button
    const dailyButton = new ButtonBuilder()
      .setCustomId('daily')
      .setLabel('🎁 جایزه روزانه')
      .setStyle(dailyAvailable ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!dailyAvailable);
    
    // Create colorful button rows
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        dailyButton,
        new ButtonBuilder()
          .setCustomId('bank_menu')
          .setLabel('🏦 سیستم بانکی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('transfer_menu')
          .setLabel('💱 انتقال سکه')
          .setStyle(ButtonStyle.Success)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('robbery')
          .setLabel('🕵️‍♂️ سرقت')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('exchange')
          .setLabel('💎 تبدیل سکه')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Create deposit options menu
    const depositOptions = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu:deposit')
          .setPlaceholder('مقدار واریز به بانک را انتخاب کنید')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('100 Ccoin')
              .setValue('100')
              .setDescription('واریز 100 Ccoin به بانک (کارمزد: 1 Ccoin)')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('500 Ccoin')
              .setValue('500')
              .setDescription('واریز 500 Ccoin به بانک (کارمزد: 5 Ccoin)')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('1000 Ccoin')
              .setValue('1000')
              .setDescription('واریز 1000 Ccoin به بانک (کارمزد: 10 Ccoin)')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('تمام موجودی')
              .setValue(`${user.wallet}`)
              .setDescription(`واریز ${user.wallet} Ccoin به بانک (کارمزد: ${Math.ceil(user.wallet * 0.01)} Ccoin)`)
              .setEmoji('💰')
          )
          .setDisabled(user.wallet <= 0)
      );
    
    // Create withdraw options menu
    const withdrawOptions = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu:withdraw')
          .setPlaceholder('مقدار برداشت از بانک را انتخاب کنید')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('100 Ccoin')
              .setValue('100')
              .setDescription('برداشت 100 Ccoin از بانک')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('500 Ccoin')
              .setValue('500')
              .setDescription('برداشت 500 Ccoin از بانک')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('1000 Ccoin')
              .setValue('1000')
              .setDescription('برداشت 1000 Ccoin از بانک')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('تمام موجودی')
              .setValue(`${user.bank}`)
              .setDescription(`برداشت ${user.bank} Ccoin از بانک`)
              .setEmoji('💰')
          )
          .setDisabled(user.bank <= 0)
      );
    
    // Track what state we're in
    let state = 'main';
    
    // Create bank menu with bank building image
    const bankEmbed = new EmbedBuilder()
      .setColor('#4169E1')
      .setTitle('🏦 سیستم بانکی پیشرفته Ccoin')
      .setDescription('مدیریت حساب بانکی و سرمایه‌گذاری‌های خود را انجام دهید')
      .setThumbnail('https://img.icons8.com/fluency/48/bank.png') // آیکون bank برای بخش بانک
      .addFields(
        { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '🏦 موجودی بانک', value: `${user.bank} Ccoin`, inline: true },
        { name: '📈 سود بانکی', value: `2% ماهانه`, inline: true },
        { name: '💸 کارمزد واریز', value: '1%', inline: true },
        { name: '🔐 برداشت بدون کارمزد', value: 'تا 10,000 Ccoin', inline: true },
        { name: '📊 وضعیت حساب', value: user.bank > 10000 ? '🟢 طلایی' : user.bank > 5000 ? '🔵 نقره‌ای' : '⚪ عادی', inline: true },
        { name: '💡 نکته ویژه', value: 'برای محافظت از سرقت، پول خود را در بانک نگهداری کنید! ضمناً با افزایش موجودی بانکی، سطح حساب شما ارتقا می‌یابد و امتیازات ویژه دریافت می‌کنید.' }
      )
      .setFooter({ text: `${interaction.user.username} | تاریخ آخرین سود: ${user.lastBankInterest ? new Date(user.lastBankInterest).toLocaleDateString('fa-IR') : 'هیچ‌وقت'}` })
      .setTimestamp();
    
    // Bank menu buttons
    const bankRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('deposit_menu')
          .setLabel('💸 واریز به بانک')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet <= 0),
        new ButtonBuilder()
          .setCustomId('withdraw_menu')
          .setLabel('💰 برداشت از بانک')
          .setStyle(ButtonStyle.Success)
          .setDisabled(user.bank <= 0),
        new ButtonBuilder()
          .setCustomId('bank_history')
          .setLabel('📋 تاریخچه تراکنش‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
      
    const bankRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('investment_menu')
          .setLabel('📈 سرمایه‌گذاری')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('bank_upgrade')
          .setLabel('⬆️ ارتقای حساب')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.bank < 10000),
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );

    // Create transfer menu with transaction image
    const transferEmbed = new EmbedBuilder()
      .setColor('#32CD32')
      .setTitle('💱 انتقال سکه به کاربران دیگر')
      .setDescription('می‌توانید به کاربران دیگر Ccoin انتقال دهید')
      .setThumbnail('https://img.icons8.com/fluency/48/money-transfer.png') // آیکون money-transfer برای بخش انتقال سکه
      .addFields(
        { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '💸 کارمزد انتقال', value: '1%', inline: true },
        { name: '⚠️ محدودیت روزانه', value: '5000 Ccoin', inline: true },
        { name: '📝 راهنمای انتقال', value: 'برای انتقال سکه، ابتدا کاربر مورد نظر را انتخاب کرده و سپس مقدار سکه را وارد کنید.' },
        { name: '🔐 نکته امنیتی', value: 'برای مبالغ بیش از 1000 سکه، کپچای امنیتی نمایش داده خواهد شد.' }
      )
      .setFooter({ text: `${interaction.user.username} | برای انتقال، از موجودی کیف پول شما کسر می‌شود` })
      .setTimestamp();
      
    // Transfer menu buttons
    const transferRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('transfer_user')
          .setLabel('👤 انتخاب کاربر')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet <= 0),
        new ButtonBuilder()
          .setCustomId('transfer_history')
          .setLabel('📋 تاریخچه انتقال‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
      
    // Exchange menu with crystal image
    const exchangeEmbed = new EmbedBuilder()
      .setColor('#9932CC')
      .setTitle('💎 تبدیل سکه به کریستال')
      .setDescription('کریستال ارز ویژه Ccoin است که با آن می‌توانید آیتم‌های منحصر به فرد خریداری کنید')
      .setThumbnail('https://img.icons8.com/fluency/48/exchange.png') // آیکون exchange برای بخش کریستال
      .addFields(
        { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '💎 موجودی کریستال', value: `${user.crystals}`, inline: true },
        { name: '📊 نرخ تبدیل', value: '1000 Ccoin = 10 کریستال', inline: true },
        { name: '💸 کارمزد تبدیل', value: '5%', inline: true },
        { name: '⚠️ نکته مهم', value: 'تبدیل سکه به کریستال غیرقابل بازگشت است!\nبا کریستال می‌توانید آیتم‌های ویژه از فروشگاه خریداری کنید.' }
      )
      .setFooter({ text: `${interaction.user.username} | کریستال‌ها قابل انتقال به کاربران دیگر نیستند` })
      .setTimestamp();
      
    // Exchange menu buttons
    const exchangeRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('exchange_10')
          .setLabel('💎 تبدیل به 10 کریستال')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet < 1050), // 1000 + 5% fee
        new ButtonBuilder()
          .setCustomId('exchange_50')
          .setLabel('💎 تبدیل به 50 کریستال')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet < 5250), // 5000 + 5% fee
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Check if this is a specific button interaction
    if (interaction.isButton()) {
      if (interaction.customId === 'deposit_menu') {
        state = 'deposit';
      } else if (interaction.customId === 'withdraw_menu') {
        state = 'withdraw';
      } else if (interaction.customId === 'bank_menu') {
        state = 'bank';
      } else if (interaction.customId === 'transfer_menu') {
        state = 'transfer';
      } else if (interaction.customId === 'exchange') {
        state = 'exchange';
      }
    }
    
    // Send the appropriate menu based on the state
    if (state === 'deposit') {
      if (followUp) {
        await interaction.followUp({ embeds: [bankEmbed], components: [depositOptions, bankRow2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [bankEmbed], components: [depositOptions, bankRow2] });
      }
    } else if (state === 'withdraw') {
      if (followUp) {
        await interaction.followUp({ embeds: [bankEmbed], components: [withdrawOptions, bankRow2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [bankEmbed], components: [withdrawOptions, bankRow2] });
      }
    } else if (state === 'bank') {
      if (followUp) {
        await interaction.followUp({ embeds: [bankEmbed], components: [bankRow1, bankRow2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [bankEmbed], components: [bankRow1, bankRow2] });
      }
    } else if (state === 'transfer') {
      if (followUp) {
        await interaction.followUp({ embeds: [transferEmbed], components: [transferRow], ephemeral: true });
      } else {
        await interaction.update({ embeds: [transferEmbed], components: [transferRow] });
      }
    } else if (state === 'exchange') {
      if (followUp) {
        await interaction.followUp({ embeds: [exchangeEmbed], components: [exchangeRow], ephemeral: true });
      } else {
        await interaction.update({ embeds: [exchangeEmbed], components: [exchangeRow] });
      }
    } else {
      // Main economy menu
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [row1, row2] });
      }
    }
    
  } catch (error) {
    console.error('Error in economy menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: '❌ متأسفانه در نمایش منوی اقتصاد خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ متأسفانه در نمایش منوی اقتصاد خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling economy menu failure:', e);
    }
  }
}
