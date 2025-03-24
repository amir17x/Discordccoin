import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';
import { log } from '../../vite';
import { getLogger, LogType } from '../utils/logger';

/**
 * سیستم سرمایه‌گذاری برای کاربران
 * امکان سرمایه‌گذاری در موارد مختلف با ریسک و سود متفاوت
 */
export async function investmentMenu(
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
    
    // بررسی کنیم که آیا کاربر سرمایه‌گذاری فعالی دارد یا خیر
    const hasActiveInvestment = user.investments && user.investments.length > 0;
    const activeInvestments = user.investments || [];
    
    // محاسبه کل سرمایه‌گذاری شده
    const totalInvested = activeInvestments.reduce((total, investment) => total + investment.amount, 0);
    
    // ایجاد امبد برای نمایش اطلاعات سرمایه‌گذاری
    const embed = new EmbedBuilder()
      .setColor('#9370DB')
      .setTitle('📈 سیستم سرمایه‌گذاری Ccoin')
      .setDescription('در اینجا می‌توانید سرمایه خود را در طرح‌های مختلف سرمایه‌گذاری کنید و سود دریافت کنید.')
      .addFields(
        { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '🏦 موجودی بانک', value: `${user.bank} Ccoin`, inline: true },
        { name: '💹 کل سرمایه‌گذاری فعال', value: `${totalInvested} Ccoin`, inline: true }
      );

    // اضافه کردن اطلاعات سرمایه‌گذاری‌های فعال
    if (hasActiveInvestment) {
      embed.addFields({ name: '🔍 سرمایه‌گذاری‌های فعال', value: '───────────────' });
      
      activeInvestments.forEach((investment, index) => {
        const startDate = new Date(investment.startDate).toLocaleDateString('fa-IR');
        const endDate = new Date(investment.endDate).toLocaleDateString('fa-IR');
        const daysLeft = Math.ceil((new Date(investment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        embed.addFields({ 
          name: `${index + 1}. ${investment.type === 'low_risk' ? '🔵 کم ریسک' : 
                        investment.type === 'medium_risk' ? '🟡 ریسک متوسط' : '🔴 پرریسک'}`, 
          value: `مبلغ: ${investment.amount} Ccoin\nسود: ${investment.expectedReturn - investment.amount} Ccoin (${Math.round((investment.expectedReturn/investment.amount - 1) * 100)}%)\nتاریخ شروع: ${startDate}\nتاریخ پایان: ${endDate}\nروز باقیمانده: ${daysLeft}`,
          inline: true 
        });
      });
    } else {
      embed.addFields({ 
        name: '💡 راهنمای سرمایه‌گذاری', 
        value: 'شما در حال حاضر هیچ سرمایه‌گذاری فعالی ندارید. می‌توانید از طرح‌های زیر یکی را انتخاب کنید:' 
      });
    }
    
    // اطلاعات طرح‌های سرمایه‌گذاری
    embed.addFields(
      { 
        name: '🔵 سرمایه‌گذاری کم ریسک', 
        value: 'سود: 5% در 7 روز\nحداقل سرمایه: 500 Ccoin\nریسک از دست دادن سرمایه: 0%', 
        inline: true 
      },
      { 
        name: '🟡 سرمایه‌گذاری با ریسک متوسط', 
        value: 'سود: 15% در 10 روز\nحداقل سرمایه: 1000 Ccoin\nریسک از دست دادن سرمایه: 5%', 
        inline: true 
      },
      { 
        name: '🔴 سرمایه‌گذاری پرریسک', 
        value: 'سود: 50% در 14 روز\nحداقل سرمایه: 2000 Ccoin\nریسک از دست دادن سرمایه: 20%', 
        inline: true 
      }
    );
    
    // دکمه‌های سرمایه‌گذاری
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('invest_low')
          .setLabel('🔵 سرمایه‌گذاری کم ریسک')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet < 500),
        new ButtonBuilder()
          .setCustomId('invest_medium')
          .setLabel('🟡 سرمایه‌گذاری متوسط')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet < 1000),
        new ButtonBuilder()
          .setCustomId('invest_high')
          .setLabel('🔴 سرمایه‌گذاری پرریسک')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(user.wallet < 2000)
      );
    
    // دکمه‌های مدیریت سرمایه‌گذاری
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('investment_history')
          .setLabel('📋 تاریخچه سرمایه‌گذاری')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('investment_withdraw')
          .setLabel('💰 برداشت از سرمایه‌گذاری')
          .setStyle(ButtonStyle.Success)
          .setDisabled(!hasActiveInvestment),
        new ButtonBuilder()
          .setCustomId('bank_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // منوی سرمایه‌گذاری کم ریسک
    const lowRiskOptions = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('invest:low_risk')
          .setPlaceholder('مقدار سرمایه‌گذاری کم ریسک را انتخاب کنید')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('500 Ccoin')
              .setValue('500')
              .setDescription('سود: 25 Ccoin در 7 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('1000 Ccoin')
              .setValue('1000')
              .setDescription('سود: 50 Ccoin در 7 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('2000 Ccoin')
              .setValue('2000')
              .setDescription('سود: 100 Ccoin در 7 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('5000 Ccoin')
              .setValue('5000')
              .setDescription('سود: 250 Ccoin در 7 روز')
              .setEmoji('💰')
          )
          .setDisabled(user.wallet < 500)
      );
    
    // منوی سرمایه‌گذاری با ریسک متوسط
    const mediumRiskOptions = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('invest:medium_risk')
          .setPlaceholder('مقدار سرمایه‌گذاری با ریسک متوسط را انتخاب کنید')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('1000 Ccoin')
              .setValue('1000')
              .setDescription('سود: 150 Ccoin در 10 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('2000 Ccoin')
              .setValue('2000')
              .setDescription('سود: 300 Ccoin در 10 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('5000 Ccoin')
              .setValue('5000')
              .setDescription('سود: 750 Ccoin در 10 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('10000 Ccoin')
              .setValue('10000')
              .setDescription('سود: 1500 Ccoin در 10 روز')
              .setEmoji('💰')
          )
          .setDisabled(user.wallet < 1000)
      );
    
    // منوی سرمایه‌گذاری پرریسک
    const highRiskOptions = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('invest:high_risk')
          .setPlaceholder('مقدار سرمایه‌گذاری پرریسک را انتخاب کنید')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('2000 Ccoin')
              .setValue('2000')
              .setDescription('سود: 1000 Ccoin در 14 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('5000 Ccoin')
              .setValue('5000')
              .setDescription('سود: 2500 Ccoin در 14 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('10000 Ccoin')
              .setValue('10000')
              .setDescription('سود: 5000 Ccoin در 14 روز')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('20000 Ccoin')
              .setValue('20000')
              .setDescription('سود: 10000 Ccoin در 14 روز')
              .setEmoji('💰')
          )
          .setDisabled(user.wallet < 2000)
      );
    
    // تعیین حالت منو بر اساس دکمه‌ای که کاربر کلیک کرده
    let state = 'main';
    
    if (interaction.isButton()) {
      if (interaction.customId === 'invest_low') {
        state = 'low_risk';
      } else if (interaction.customId === 'invest_medium') {
        state = 'medium_risk';
      } else if (interaction.customId === 'invest_high') {
        state = 'high_risk';
      }
    }
    
    // نمایش منوی مناسب بر اساس حالت
    if (state === 'low_risk') {
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [lowRiskOptions, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [lowRiskOptions, row2] });
      }
    } else if (state === 'medium_risk') {
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [mediumRiskOptions, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [mediumRiskOptions, row2] });
      }
    } else if (state === 'high_risk') {
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [highRiskOptions, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [highRiskOptions, row2] });
      }
    } else {
      // منوی اصلی سرمایه‌گذاری
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [row1, row2] });
      }
    }
    
  } catch (error) {
    console.error('Error in investment menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: '❌ متأسفانه در نمایش منوی سرمایه‌گذاری خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ متأسفانه در نمایش منوی سرمایه‌گذاری خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling investment menu failure:', e);
    }
  }
}

/**
 * پردازش سرمایه‌گذاری جدید
 * @param interaction برهم‌کنش کاربر
 * @param type نوع سرمایه‌گذاری (کم ریسک، متوسط، پرریسک)
 * @param amount مقدار سرمایه‌گذاری
 */
export async function processInvestment(
  interaction: MessageComponentInteraction,
  type: 'low_risk' | 'medium_risk' | 'high_risk',
  amount: number
) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه کاربر به اندازه کافی سکه دارد
    if (user.wallet < amount) {
      await interaction.reply({
        content: `❌ موجودی کیف پول شما کافی نیست! شما به ${amount - user.wallet} سکه بیشتر نیاز دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // محاسبه مشخصات سرمایه‌گذاری
    let durationDays = 0;
    let expectedReturnRate = 0;
    let riskRate = 0;
    
    switch (type) {
      case 'low_risk':
        durationDays = 7;
        expectedReturnRate = 0.05; // 5%
        riskRate = 0; // ریسک صفر
        break;
      case 'medium_risk':
        durationDays = 10;
        expectedReturnRate = 0.15; // 15%
        riskRate = 0.05; // 5% ریسک
        break;
      case 'high_risk':
        durationDays = 14;
        expectedReturnRate = 0.5; // 50%
        riskRate = 0.2; // 20% ریسک
        break;
    }
    
    // محاسبه تاریخ پایان سرمایه‌گذاری
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    
    // محاسبه سود مورد انتظار
    const expectedReturn = Math.floor(amount * (1 + expectedReturnRate));
    
    // ایجاد رکورد سرمایه‌گذاری جدید
    const newInvestment = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      amount,
      expectedReturn,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      riskRate,
      status: 'active' as 'active' | 'completed' | 'failed' // تعیین نوع دقیق برای status
    };
    
    // اضافه کردن سرمایه‌گذاری به حساب کاربر
    if (!user.investments) {
      user.investments = [];
    }
    
    (user.investments as any).push(newInvestment);
    
    // کسر مبلغ سرمایه‌گذاری از کیف پول
    user.wallet -= amount;
    
    // ذخیره تغییرات
    await storage.updateUser(user.id, { 
      wallet: user.wallet,
      investments: user.investments
    });
    
    // لاگ سرمایه‌گذاری
    const logger = getLogger(interaction.client);
    logger.logTransaction(
      interaction.user.id,
      interaction.user.username,
      'investment',
      -amount,
      `یک سرمایه‌گذاری ${type === 'low_risk' ? 'کم ریسک' : type === 'medium_risk' ? 'با ریسک متوسط' : 'پرریسک'} انجام داد`,
      [
        { name: '📈 سود مورد انتظار', value: `${expectedReturn - amount} Ccoin`, inline: true },
        { name: '📆 مدت زمان', value: `${durationDays} روز`, inline: true },
        { name: '📊 نرخ ریسک', value: `${riskRate * 100}%`, inline: true }
      ]
    );
    
    // ارسال پیام موفقیت
    await interaction.reply({
      content: `✅ سرمایه‌گذاری شما با موفقیت انجام شد!\n\n💰 مبلغ: ${amount} Ccoin\n📈 سود مورد انتظار: ${expectedReturn - amount} Ccoin\n📆 تاریخ پایان: ${endDate.toLocaleDateString('fa-IR')}\n\n⚠️ توجه: این سرمایه‌گذاری تا پایان مدت قابل برداشت نیست.`,
      ephemeral: true
    });
    
    // نمایش منوی سرمایه‌گذاری بعد از 3 ثانیه
    setTimeout(async () => {
      try {
        await investmentMenu(interaction, true);
      } catch (error) {
        console.error('Error showing investment menu after investment:', error);
      }
    }, 3000);
    
  } catch (error) {
    console.error('Error processing investment:', error);
    await interaction.reply({
      content: '❌ در پردازش سرمایه‌گذاری خطایی رخ داد!',
      ephemeral: true
    });
  }
}

/**
 * بررسی و پرداخت سود سرمایه‌گذاری‌های سررسید شده
 * @param client کلاینت دیسکورد
 */
export async function processInvestmentReturns(client: any) {
  try {
    log('Checking for completed investments...', 'discord');
    
    // دریافت همه کاربران
    const users = await storage.getAllUsers();
    const now = new Date();
    let completedCount = 0;
    
    for (const user of users) {
      if (!user.investments || user.investments.length === 0) continue;
      
      // پیدا کردن سرمایه‌گذاری‌های سررسید شده
      const completedInvestments = user.investments.filter(inv => 
        inv.status === 'active' && new Date(inv.endDate) <= now
      );
      
      if (completedInvestments.length === 0) continue;
      
      // پردازش هر سرمایه‌گذاری سررسید شده
      for (const investment of completedInvestments) {
        // محاسبه اینکه آیا سرمایه‌گذاری سود می‌کند یا خسارت
        let success = true;
        
        // شانس شکست بر اساس نرخ ریسک
        if (investment.riskRate > 0) {
          success = Math.random() > investment.riskRate;
        }
        
        // مبلغ نهایی پرداختی به کاربر
        let finalAmount = 0;
        
        if (success) {
          // سرمایه‌گذاری موفق - پرداخت کل سود
          finalAmount = investment.expectedReturn;
        } else {
          // سرمایه‌گذاری ناموفق - بازگشت اصل سرمایه
          finalAmount = Math.floor(investment.amount * 0.7); // 30% ضرر
        }
        
        // به‌روزرسانی وضعیت سرمایه‌گذاری
        investment.status = success ? 'completed' : 'failed';
        
        // افزودن مبلغ به کیف پول کاربر
        const updatedUser = await storage.addToWallet(user.id, finalAmount);
        
        // لاگ کردن نتیجه سرمایه‌گذاری
        if (updatedUser) {
          const logger = getLogger(client);
          logger.logTransaction(
            user.discordId,
            user.username,
            success ? 'investment_return' : 'investment_loss',
            finalAmount,
            success ? 'سود سرمایه‌گذاری دریافت کرد' : 'در سرمایه‌گذاری متحمل ضرر شد',
            [
              { name: '💰 سرمایه اولیه', value: `${investment.amount} Ccoin`, inline: true },
              { name: success ? '📈 سود' : '📉 ضرر', value: `${success ? finalAmount - investment.amount : investment.amount - finalAmount} Ccoin`, inline: true },
              { name: '📊 نوع سرمایه‌گذاری', value: investment.type === 'low_risk' ? 'کم ریسک' : investment.type === 'medium_risk' ? 'ریسک متوسط' : 'پرریسک', inline: true }
            ]
          );
          
          // ارسال پیام به کاربر در صورت امکان
          try {
            const discordUser = await client.users.fetch(user.discordId);
            const embed = new EmbedBuilder()
              .setColor(success ? '#2ECC71' : '#E74C3C')
              .setTitle(success ? '📈 سرمایه‌گذاری موفق!' : '📉 سرمایه‌گذاری ناموفق!')
              .setDescription(success ? 
                `سرمایه‌گذاری شما با موفقیت به پایان رسید و سود آن به کیف پول شما واریز شد.` :
                `متأسفانه سرمایه‌گذاری شما موفقیت‌آمیز نبود و بخشی از سرمایه شما از دست رفت.`)
              .addFields(
                { name: '💰 سرمایه اولیه', value: `${investment.amount} Ccoin`, inline: true },
                { name: success ? '📈 سود خالص' : '📉 ضرر', value: `${success ? finalAmount - investment.amount : investment.amount - finalAmount} Ccoin`, inline: true },
                { name: '💸 مبلغ واریزی', value: `${finalAmount} Ccoin`, inline: true },
                { name: '📊 نوع سرمایه‌گذاری', value: investment.type === 'low_risk' ? 'کم ریسک' : investment.type === 'medium_risk' ? 'ریسک متوسط' : 'پرریسک', inline: true },
                { name: '📆 تاریخ شروع', value: new Date(investment.startDate).toLocaleDateString('fa-IR'), inline: true },
                { name: '📆 تاریخ پایان', value: new Date(investment.endDate).toLocaleDateString('fa-IR'), inline: true }
              )
              .setFooter({ text: `شما اکنون ${updatedUser.wallet} سکه در کیف پول خود دارید.` })
              .setTimestamp();
              
            await discordUser.send({ embeds: [embed] });
          } catch (dmError) {
            console.error(`Could not send DM to user ${user.username}:`, dmError);
          }
        }
        
        completedCount++;
      }
      
      // به‌روزرسانی لیست سرمایه‌گذاری‌های کاربر
      await storage.updateUser(user.id, { investments: user.investments });
    }
    
    if (completedCount > 0) {
      log(`Processed ${completedCount} completed investments`, 'discord');
    }
    
  } catch (error) {
    console.error('Error processing investment returns:', error);
  }
}