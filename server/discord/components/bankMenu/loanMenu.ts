import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction } from 'discord.js';
import { storage } from '../../../storage';
import { formatNumber, formatDate, formatRelativeTime, createProgressBar } from '../../utils/formatter';
import { Loan } from '../../../../shared/schema';
import { economyMenu } from '../economyMenu';
import { v4 as uuidv4 } from 'uuid';

// تنظیمات وام
const LOAN_INTEREST_RATE = 0.05; // 5% سود
const LOAN_DURATION_DAYS = 14; // 14 روز مهلت بازپرداخت
const LOAN_MAX_RATIO = 0.5; // حداکثر 50% موجودی بانکی
const LOAN_MIN_CREDIT_SCORE = 30; // حداقل امتیاز اعتباری
const LOAN_CREDIT_BOOST_ON_REPAY = 10; // افزایش امتیاز اعتباری بر اثر بازپرداخت
const LOAN_CREDIT_PENALTY_ON_OVERDUE = 20; // کاهش امتیاز اعتباری بر اثر دیرکرد
const LOAN_OVERDUE_PENALTY_RATE = 0.1; // 10% جریمه دیرکرد

/**
 * منوی اصلی سیستم وام
 * @param interaction تعامل کاربر
 * @param isUpdate آیا به‌روزرسانی است؟
 */
export async function loanMenu(
  interaction: MessageComponentInteraction,
  isUpdate: boolean = false
) {
  try {
    // دریافت اطلاعات کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد. لطفاً ابتدا یک حساب ایجاد کنید!',
        ephemeral: true
      });
      return;
    }
    
    // دریافت وام‌های فعال کاربر
    const userLoans = await storage.getUserLoans(user.id);
    const activeLoans = userLoans.filter(loan => loan.status === 'active');
    const overdueLoans = userLoans.filter(loan => loan.status === 'overdue');
    
    // محاسبه حداکثر مقدار وام قابل پرداخت بر اساس اعتبار و موجودی بانکی
    const maxLoanAmount = user.creditScore < LOAN_MIN_CREDIT_SCORE
      ? 1000 // محدودیت برای اعتبار پایین
      : Math.floor(user.bank * LOAN_MAX_RATIO);
    
    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('🏦 سیستم وام و بدهی')
      .setDescription(`${interaction.user.username} عزیز، به سیستم وام و بدهی بانک Ccoin خوش آمدید!`)
      .setThumbnail(interaction.user.displayAvatarURL());
    
    // افزودن فیلدهای اطلاعاتی
    embed.addFields(
      { name: '💰 موجودی بانکی', value: `${formatNumber(user.bank)} Ccoin`, inline: true },
      { name: '📊 امتیاز اعتباری', value: `${user.creditScore}/100`, inline: true },
      { name: '💳 حداکثر وام قابل پرداخت', value: `${formatNumber(maxLoanAmount)} Ccoin`, inline: true }
    );
    
    // اضافه کردن اطلاعات وام‌های فعال
    if (activeLoans.length > 0) {
      const activeLoan = activeLoans[0]; // فعلاً فقط یک وام فعال پشتیبانی می‌شود
      const daysLeft = Math.ceil((activeLoan.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      embed.addFields(
        { name: '🔄 وضعیت وام فعال', value: '\u200B' },
        { name: '💸 مقدار وام', value: `${formatNumber(activeLoan.amount)} Ccoin`, inline: true },
        { name: '📈 سود', value: `${formatNumber(activeLoan.interest)} Ccoin`, inline: true },
        { name: '⏳ زمان باقی‌مانده', value: `${daysLeft} روز`, inline: true },
        { name: '💵 مقدار بازپرداخت', value: `${formatNumber(activeLoan.remainingAmount)} Ccoin`, inline: true }
      );
    } else if (overdueLoans.length > 0) {
      const overdueLoan = overdueLoans[0];
      const daysOverdue = Math.ceil((new Date().getTime() - overdueLoan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const penalty = Math.floor(overdueLoan.amount * LOAN_OVERDUE_PENALTY_RATE);
      
      embed.addFields(
        { name: '⚠️ وام سررسید شده', value: '\u200B' },
        { name: '💸 مقدار وام', value: `${formatNumber(overdueLoan.amount)} Ccoin`, inline: true },
        { name: '📈 سود', value: `${formatNumber(overdueLoan.interest)} Ccoin`, inline: true },
        { name: '⏰ روزهای تأخیر', value: `${daysOverdue} روز`, inline: true },
        { name: '🚫 جریمه تأخیر', value: `${formatNumber(penalty)} Ccoin`, inline: true },
        { name: '💵 مبلغ قابل پرداخت', value: `${formatNumber(overdueLoan.remainingAmount + penalty)} Ccoin`, inline: true }
      );
    } else {
      embed.addFields(
        { name: '📝 اطلاعات وام', value: 'در حال حاضر شما هیچ وام فعالی ندارید.\nبا کلیک بر روی دکمه "درخواست وام" می‌توانید وام جدید دریافت کنید.' }
      );
    }
    
    // اضافه کردن توضیحات
    embed.addFields(
      { name: '📋 شرایط وام', value: `- نرخ سود: ${LOAN_INTEREST_RATE * 100}% برای هر دوره ${LOAN_DURATION_DAYS} روزه\n- حداکثر وام: ${LOAN_MAX_RATIO * 100}% از موجودی بانکی\n- جریمه دیرکرد: ${LOAN_OVERDUE_PENALTY_RATE * 100}% اضافه بر مبلغ وام\n- بازپرداخت به موقع: +${LOAN_CREDIT_BOOST_ON_REPAY} امتیاز اعتباری\n- دیرکرد: ${LOAN_CREDIT_PENALTY_ON_OVERDUE}-  امتیاز اعتباری` }
    );
    
    // ساخت دکمه‌ها بر اساس وضعیت وام‌های کاربر
    const row1 = new ActionRowBuilder<ButtonBuilder>();
    
    if (activeLoans.length > 0 || overdueLoans.length > 0) {
      // اگر وام فعال یا سررسید شده داشته باشد
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId('loan_repay')
          .setLabel('💵 بازپرداخت وام')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('loan_status')
          .setLabel('📊 وضعیت وام')
          .setStyle(ButtonStyle.Primary)
      );
    } else {
      // اگر وام فعال نداشته باشد
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId('loan_request')
          .setLabel('📝 درخواست وام')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('loan_calculator')
          .setLabel('🧮 محاسبه وام')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    // دکمه‌های عمومی
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('loan_history')
          .setLabel('📜 تاریخچه وام‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('bank')
          .setLabel('🏦 بازگشت به بانک')
          .setStyle(ButtonStyle.Danger)
      );
    
    // ارسال یا به‌روزرسانی پیام
    if (isUpdate) {
      await interaction.update({
        embeds: [embed],
        components: [row1, row2]
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        components: [row1, row2],
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in loan menu:', error);
    
    await interaction.reply({
      content: '❌ خطایی در بارگذاری منوی وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * پردازش درخواست وام
 * @param interaction تعامل کاربر
 */
export async function handleLoanRequest(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی امتیاز اعتباری
    if (user.creditScore < LOAN_MIN_CREDIT_SCORE) {
      await interaction.reply({
        content: `❌ امتیاز اعتباری شما (${user.creditScore}) کمتر از حداقل مورد نیاز (${LOAN_MIN_CREDIT_SCORE}) است. لطفاً ابتدا اعتبار خود را افزایش دهید.`,
        ephemeral: true
      });
      return;
    }
    
    // بررسی وام‌های فعال
    const userLoans = await storage.getUserLoans(user.id);
    const activeLoans = userLoans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
    
    if (activeLoans.length > 0) {
      await interaction.reply({
        content: '❌ شما در حال حاضر یک وام فعال یا سررسید شده دارید. ابتدا آن را تسویه کنید.',
        ephemeral: true
      });
      return;
    }
    
    // محاسبه حداکثر مقدار وام
    const maxLoanAmount = Math.floor(user.bank * LOAN_MAX_RATIO);
    
    if (maxLoanAmount <= 0) {
      await interaction.reply({
        content: '⚠️ موجودی بانکی شما برای درخواست وام کافی نیست. حداقل باید مقداری سکه در حساب بانکی خود داشته باشید.',
        ephemeral: true
      });
      return;
    }
    
    // ساخت امبد درخواست وام
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('📝 درخواست وام')
      .setDescription(`${interaction.user.username} عزیز، لطفاً مقدار وام درخواستی خود را انتخاب کنید:`)
      .addFields(
        { name: '💰 موجودی بانکی', value: `${formatNumber(user.bank)} Ccoin`, inline: true },
        { name: '💳 حداکثر وام', value: `${formatNumber(maxLoanAmount)} Ccoin`, inline: true },
        { name: '📊 امتیاز اعتباری', value: `${user.creditScore}/100`, inline: true },
        { name: '📈 نرخ سود', value: `${LOAN_INTEREST_RATE * 100}%`, inline: true },
        { name: '⏳ مدت بازپرداخت', value: `${LOAN_DURATION_DAYS} روز`, inline: true }
      );
    
    // ساخت دکمه‌های مقادیر وام
    const row1 = new ActionRowBuilder<ButtonBuilder>();
    const row2 = new ActionRowBuilder<ButtonBuilder>();
    
    // سه گزینه برای مقدار وام
    const option1 = Math.floor(maxLoanAmount * 0.25); // 25%
    const option2 = Math.floor(maxLoanAmount * 0.5);  // 50%
    const option3 = Math.floor(maxLoanAmount * 0.75); // 75%
    const option4 = maxLoanAmount;                    // 100%
    
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`loan_confirm_${option1}`)
        .setLabel(`${formatNumber(option1)} Ccoin`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`loan_confirm_${option2}`)
        .setLabel(`${formatNumber(option2)} Ccoin`)
        .setStyle(ButtonStyle.Primary)
    );
    
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(`loan_confirm_${option3}`)
        .setLabel(`${formatNumber(option3)} Ccoin`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`loan_confirm_${option4}`)
        .setLabel(`${formatNumber(option4)} Ccoin`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('loan_cancel')
        .setLabel('❌ لغو')
        .setStyle(ButtonStyle.Danger)
    );
    
    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in loan request:', error);
    
    await interaction.reply({
      content: '❌ خطایی در پردازش درخواست وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * تأیید نهایی و ایجاد وام
 * @param interaction تعامل کاربر
 * @param amount مقدار وام
 */
export async function handleLoanConfirmation(
  interaction: MessageComponentInteraction,
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
    
    // محاسبه سود
    const interest = Math.floor(amount * LOAN_INTEREST_RATE);
    const totalRepayment = amount + interest;
    
    // تاریخ سررسید
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);
    
    // ساخت امبد تأیید نهایی
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('✅ تأیید نهایی وام')
      .setDescription(`${interaction.user.username} عزیز، آیا از درخواست این وام اطمینان دارید؟`)
      .addFields(
        { name: '💰 مقدار وام', value: `${formatNumber(amount)} Ccoin`, inline: true },
        { name: '📈 سود', value: `${formatNumber(interest)} Ccoin`, inline: true },
        { name: '💸 مبلغ بازپرداخت', value: `${formatNumber(totalRepayment)} Ccoin`, inline: true },
        { name: '📅 تاریخ سررسید', value: formatDate(dueDate), inline: true }
      );
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`loan_approve_${amount}`)
          .setLabel('✅ تأیید نهایی و دریافت وام')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('loan_cancel')
          .setLabel('❌ لغو')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  } catch (error) {
    console.error('Error in loan confirmation:', error);
    
    await interaction.reply({
      content: '❌ خطایی در تأیید وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * ثبت نهایی وام و واریز به حساب
 * @param interaction تعامل کاربر
 * @param amount مقدار وام
 */
export async function handleLoanApproval(
  interaction: MessageComponentInteraction,
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
    
    // محاسبه سود
    const interest = Math.floor(amount * LOAN_INTEREST_RATE);
    const totalRepayment = amount + interest;
    
    // تاریخ سررسید
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);
    
    // ایجاد وام جدید
    const loanId = uuidv4();
    const newLoan: Loan = {
      id: loanId,
      userId: user.id,
      amount: amount,
      interest: interest,
      dueDate: dueDate,
      status: 'active',
      requestDate: new Date(),
      remainingAmount: totalRepayment
    };
    
    // ذخیره وام در دیتابیس
    await storage.createLoan(newLoan);
    
    // واریز مبلغ وام به کیف پول کاربر
    await storage.addToWallet(user.id, amount, 'loan_received', { loanId });
    
    // ساخت امبد تأیید نهایی
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('🎉 وام با موفقیت پرداخت شد')
      .setDescription(`${interaction.user.username} عزیز، وام شما با موفقیت پرداخت شد و به کیف پول شما واریز گردید.`)
      .addFields(
        { name: '💰 مقدار وام', value: `${formatNumber(amount)} Ccoin`, inline: true },
        { name: '📈 سود', value: `${formatNumber(interest)} Ccoin`, inline: true },
        { name: '💸 مبلغ بازپرداخت', value: `${formatNumber(totalRepayment)} Ccoin`, inline: true },
        { name: '📅 تاریخ سررسید', value: formatDate(dueDate), inline: true },
        { name: '📝 یادآوری مهم', value: 'لطفاً تا قبل از سررسید، وام خود را بازپرداخت کنید تا امتیاز اعتباری شما افزایش یابد.' }
      );
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('bank')
          .setLabel('🏦 بازگشت به بانک')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('main_menu')
          .setLabel('🏠 منوی اصلی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
    // ارسال پیام خصوصی یادآوری
    try {
      const reminderEmbed = new EmbedBuilder()
        .setColor('#47A992')
        .setTitle('💰 وام دریافت شد')
        .setDescription('وام شما با موفقیت تأیید و پرداخت شد!')
        .addFields(
          { name: '💸 مبلغ وام', value: `${formatNumber(amount)} Ccoin`, inline: true },
          { name: '📅 تاریخ سررسید', value: formatDate(dueDate), inline: true },
          { name: '📝 یادآوری', value: 'یک روز قبل از سررسید به شما یادآوری خواهیم کرد.' }
        );
      
      await interaction.user.send({ embeds: [reminderEmbed] });
    } catch (dmError) {
      console.error('Could not send DM to user:', dmError);
    }
  } catch (error) {
    console.error('Error in loan approval:', error);
    
    await interaction.reply({
      content: '❌ خطایی در پرداخت وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * نمایش وضعیت وام فعلی
 * @param interaction تعامل کاربر
 */
export async function handleLoanStatus(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // دریافت وام‌های فعال کاربر
    const userLoans = await storage.getUserLoans(user.id);
    const activeLoans = userLoans.filter(loan => loan.status === 'active');
    const overdueLoans = userLoans.filter(loan => loan.status === 'overdue');
    
    if (activeLoans.length === 0 && overdueLoans.length === 0) {
      await interaction.reply({
        content: '📝 شما در حال حاضر هیچ وام فعال یا سررسید شده‌ای ندارید.',
        ephemeral: true
      });
      return;
    }
    
    // اولویت با وام‌های سررسید شده است
    const currentLoan = overdueLoans.length > 0 ? overdueLoans[0] : activeLoans[0];
    const isOverdue = currentLoan.status === 'overdue';
    
    // محاسبات زمانی
    const now = new Date();
    const daysDiff = Math.ceil((currentLoan.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // محاسبه جریمه در صورت سررسید شدن
    const penalty = isOverdue 
      ? Math.floor(currentLoan.amount * LOAN_OVERDUE_PENALTY_RATE) 
      : 0;
    
    const totalRepayment = currentLoan.remainingAmount + penalty;
    
    // درصد زمان باقی‌مانده
    const totalDays = LOAN_DURATION_DAYS;
    const elapsedDays = isOverdue 
      ? totalDays + Math.abs(daysDiff)
      : totalDays - daysDiff;
    const progressPercentage = Math.min(100, Math.floor((elapsedDays / totalDays) * 100));
    
    // ساخت امبد وضعیت وام
    const embed = new EmbedBuilder()
      .setColor(isOverdue ? '#E94560' : '#47A992')
      .setTitle(isOverdue ? '⚠️ وضعیت وام سررسید شده' : '📊 وضعیت وام فعال')
      .setDescription(`${interaction.user.username} عزیز، اطلاعات وام ${isOverdue ? 'سررسید شده' : 'فعال'} شما به شرح زیر است:`)
      .addFields(
        { name: '💰 مقدار اصلی وام', value: `${formatNumber(currentLoan.amount)} Ccoin`, inline: true },
        { name: '📈 سود', value: `${formatNumber(currentLoan.interest)} Ccoin`, inline: true },
        { name: '📅 تاریخ درخواست', value: formatDate(currentLoan.requestDate), inline: true },
        { name: '⏳ تاریخ سررسید', value: formatDate(currentLoan.dueDate), inline: true }
      );
    
    if (isOverdue) {
      embed.addFields(
        { name: '⏰ تأخیر', value: `${Math.abs(daysDiff)} روز`, inline: true },
        { name: '🚫 جریمه تأخیر', value: `${formatNumber(penalty)} Ccoin`, inline: true },
        { name: '💸 مبلغ کل قابل پرداخت', value: `${formatNumber(totalRepayment)} Ccoin`, inline: false },
        { name: '⚠️ هشدار', value: 'لطفاً هر چه سریع‌تر نسبت به تسویه وام خود اقدام کنید تا از کاهش بیشتر امتیاز اعتباری جلوگیری شود.' }
      );
    } else {
      embed.addFields(
        { name: '⏳ زمان باقی‌مانده', value: `${daysDiff} روز`, inline: true },
        { name: '💸 مبلغ قابل پرداخت', value: `${formatNumber(totalRepayment)} Ccoin`, inline: true },
        { name: '📊 وضعیت زمانی', value: `${createProgressBar(progressPercentage)} ${progressPercentage}%`, inline: false }
      );
    }
    
    // ساخت دکمه‌ها
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('loan_repay')
          .setLabel('💵 بازپرداخت وام')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('loan_menu')
          .setLabel('🔙 بازگشت به منوی وام')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in loan status:', error);
    
    await interaction.reply({
      content: '❌ خطایی در نمایش وضعیت وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * منوی بازپرداخت وام
 * @param interaction تعامل کاربر
 */
export async function handleLoanRepayment(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // دریافت وام‌های فعال کاربر
    const userLoans = await storage.getUserLoans(user.id);
    const activeLoans = userLoans.filter(loan => loan.status === 'active');
    const overdueLoans = userLoans.filter(loan => loan.status === 'overdue');
    
    if (activeLoans.length === 0 && overdueLoans.length === 0) {
      await interaction.reply({
        content: '📝 شما در حال حاضر هیچ وام فعال یا سررسید شده‌ای ندارید.',
        ephemeral: true
      });
      return;
    }
    
    // اولویت با وام‌های سررسید شده است
    const currentLoan = overdueLoans.length > 0 ? overdueLoans[0] : activeLoans[0];
    const isOverdue = currentLoan.status === 'overdue';
    
    // محاسبه جریمه در صورت سررسید شدن
    const penalty = isOverdue 
      ? Math.floor(currentLoan.amount * LOAN_OVERDUE_PENALTY_RATE) 
      : 0;
    
    const totalRepayment = currentLoan.remainingAmount + penalty;
    
    // بررسی موجودی کیف پول
    if (user.wallet < totalRepayment) {
      await interaction.reply({
        content: `⚠️ موجودی کیف پول شما (${formatNumber(user.wallet)} Ccoin) برای بازپرداخت کامل وام (${formatNumber(totalRepayment)} Ccoin) کافی نیست. لطفاً ابتدا موجودی خود را افزایش دهید.`,
        ephemeral: true
      });
      return;
    }
    
    // ساخت امبد بازپرداخت
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('💵 بازپرداخت وام')
      .setDescription(`${interaction.user.username} عزیز، آیا مایل به بازپرداخت کامل وام خود هستید؟`)
      .addFields(
        { name: '💰 موجودی کیف پول', value: `${formatNumber(user.wallet)} Ccoin`, inline: true },
        { name: '💸 مبلغ قابل پرداخت', value: `${formatNumber(totalRepayment)} Ccoin`, inline: true }
      );
    
    if (isOverdue) {
      embed.addFields(
        { name: '⚠️ توجه', value: 'این وام سررسید شده است و شامل جریمه تأخیر می‌باشد.' }
      );
    } else {
      embed.addFields(
        { name: '✅ نکته', value: 'بازپرداخت به موقع باعث افزایش امتیاز اعتباری شما می‌شود.' }
      );
    }
    
    // ساخت دکمه‌ها
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`loan_repay_confirm_${currentLoan.id}`)
          .setLabel('✅ بازپرداخت کامل')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('loan_menu')
          .setLabel('❌ لغو')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in loan repayment:', error);
    
    await interaction.reply({
      content: '❌ خطایی در پردازش بازپرداخت وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * انجام عملیات بازپرداخت وام
 * @param interaction تعامل کاربر
 * @param loanId شناسه وام
 */
export async function handleLoanRepaymentConfirmation(
  interaction: MessageComponentInteraction,
  loanId: string
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
    
    // دریافت اطلاعات وام
    const loan = await storage.getLoanById(loanId);
    
    if (!loan || loan.userId !== user.id) {
      await interaction.reply({
        content: '❌ وام موردنظر یافت نشد یا متعلق به شما نیست!',
        ephemeral: true
      });
      return;
    }
    
    // محاسبه جریمه در صورت سررسید شدن
    const isOverdue = loan.status === 'overdue';
    const penalty = isOverdue 
      ? Math.floor(loan.amount * LOAN_OVERDUE_PENALTY_RATE) 
      : 0;
    
    const totalRepayment = loan.remainingAmount + penalty;
    
    // بررسی موجودی کیف پول
    if (user.wallet < totalRepayment) {
      await interaction.reply({
        content: `⚠️ موجودی کیف پول شما (${formatNumber(user.wallet)} Ccoin) برای بازپرداخت کامل وام کافی نیست.`,
        ephemeral: true
      });
      return;
    }
    
    // انجام بازپرداخت
    await storage.updateLoanStatus(loanId, 'repaid', new Date());
    
    // کسر مبلغ از کیف پول
    await storage.addToWallet(user.id, -totalRepayment, 'loan_repayment', { loanId });
    
    // بروزرسانی امتیاز اعتباری
    const creditScoreChange = isOverdue 
      ? -LOAN_CREDIT_PENALTY_ON_OVERDUE 
      : LOAN_CREDIT_BOOST_ON_REPAY;
    
    const newCreditScore = Math.max(0, Math.min(100, user.creditScore + creditScoreChange));
    await storage.updateUser(user.id, { creditScore: newCreditScore });
    
    // ساخت امبد تأیید بازپرداخت
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('✅ بازپرداخت وام موفقیت‌آمیز')
      .setDescription(`${interaction.user.username} عزیز، وام شما با موفقیت بازپرداخت شد.`)
      .addFields(
        { name: '💰 مبلغ پرداخت شده', value: `${formatNumber(totalRepayment)} Ccoin`, inline: true },
        { name: '📊 تغییر امتیاز اعتباری', value: `${creditScoreChange > 0 ? '+' : ''}${creditScoreChange}`, inline: true },
        { name: '📈 امتیاز اعتباری جدید', value: `${newCreditScore}/100`, inline: true }
      );
    
    if (isOverdue) {
      embed.addFields(
        { name: '📝 توضیحات', value: 'به دلیل تأخیر در بازپرداخت، امتیاز اعتباری شما کاهش یافت. سعی کنید در وام‌های بعدی به موقع بازپرداخت کنید.' }
      );
    } else {
      embed.addFields(
        { name: '🎉 تبریک', value: 'به دلیل بازپرداخت به موقع، امتیاز اعتباری شما افزایش یافت. با افزایش امتیاز اعتباری، در آینده می‌توانید وام‌های بیشتری دریافت کنید.' }
      );
    }
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('loan_menu')
          .setLabel('🏦 بازگشت به منوی وام')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('bank')
          .setLabel('🏦 بازگشت به بانک')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
    // ارسال پیام خصوصی تأیید
    try {
      const repaymentEmbed = new EmbedBuilder()
        .setColor('#47A992')
        .setTitle('✅ بازپرداخت وام')
        .setDescription('وام شما با موفقیت بازپرداخت شد.')
        .addFields(
          { name: '💸 مبلغ بازپرداخت', value: `${formatNumber(totalRepayment)} Ccoin`, inline: true },
          { name: '📊 امتیاز اعتباری جدید', value: `${newCreditScore}/100`, inline: true }
        );
      
      await interaction.user.send({ embeds: [repaymentEmbed] });
    } catch (dmError) {
      console.error('Could not send DM to user:', dmError);
    }
  } catch (error) {
    console.error('Error in loan repayment confirmation:', error);
    
    await interaction.reply({
      content: '❌ خطایی در انجام بازپرداخت وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * نمایش تاریخچه وام‌ها
 * @param interaction تعامل کاربر
 */
export async function handleLoanHistory(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // دریافت همه وام‌های کاربر
    const userLoans = await storage.getUserLoans(user.id);
    
    if (userLoans.length === 0) {
      await interaction.reply({
        content: '📝 شما تاکنون هیچ وامی دریافت نکرده‌اید.',
        ephemeral: true
      });
      return;
    }
    
    // مرتب‌سازی وام‌ها بر اساس تاریخ درخواست (جدیدترین اول)
    userLoans.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
    
    // ساخت امبد تاریخچه وام‌ها
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('📜 تاریخچه وام‌های شما')
      .setDescription(`${interaction.user.username} عزیز، تاریخچه وام‌های شما به شرح زیر است:`);
    
    // نمایش 5 وام آخر
    const recentLoans = userLoans.slice(0, 5);
    
    recentLoans.forEach((loan, index) => {
      const statusEmoji = loan.status === 'active' 
        ? '🟢' 
        : loan.status === 'repaid' 
          ? '✅' 
          : '🔴';
      
      const statusText = loan.status === 'active' 
        ? 'فعال' 
        : loan.status === 'repaid' 
          ? 'بازپرداخت شده' 
          : 'سررسید شده';
      
      embed.addFields({
        name: `${statusEmoji} وام #${index + 1}`,
        value: `💰 مبلغ: ${formatNumber(loan.amount)} Ccoin\n` +
               `📈 سود: ${formatNumber(loan.interest)} Ccoin\n` +
               `📅 تاریخ درخواست: ${formatDate(loan.requestDate)}\n` +
               `⏳ تاریخ سررسید: ${formatDate(loan.dueDate)}\n` +
               `🔄 وضعیت: ${statusText}\n` +
               (loan.repaymentDate ? `✅ تاریخ بازپرداخت: ${formatDate(loan.repaymentDate)}\n` : '')
      });
    });
    
    // اضافه کردن آمار کلی
    const totalLoans = userLoans.length;
    const repaidLoans = userLoans.filter(loan => loan.status === 'repaid').length;
    const overdueLoans = userLoans.filter(loan => loan.status === 'overdue').length;
    const activeLoans = userLoans.filter(loan => loan.status === 'active').length;
    
    const totalBorrowed = userLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalInterest = userLoans.reduce((sum, loan) => sum + loan.interest, 0);
    
    embed.addFields(
      { name: '📊 آمار کلی وام‌های شما', value: '\u200B' },
      { name: '🔢 تعداد کل وام‌ها', value: `${totalLoans}`, inline: true },
      { name: '✅ وام‌های بازپرداخت شده', value: `${repaidLoans}`, inline: true },
      { name: '🔴 وام‌های سررسید شده', value: `${overdueLoans}`, inline: true },
      { name: '🟢 وام‌های فعال', value: `${activeLoans}`, inline: true },
      { name: '💰 کل مبلغ دریافتی', value: `${formatNumber(totalBorrowed)} Ccoin`, inline: true },
      { name: '📈 کل سود پرداختی', value: `${formatNumber(totalInterest)} Ccoin`, inline: true }
    );
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('loan_menu')
          .setLabel('🏦 بازگشت به منوی وام')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in loan history:', error);
    
    await interaction.reply({
      content: '❌ خطایی در نمایش تاریخچه وام‌ها رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * ماژول محاسبه وام
 * @param interaction تعامل کاربر
 */
export async function handleLoanCalculator(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // محاسبه حداکثر مقدار وام
    const maxLoanAmount = Math.floor(user.bank * LOAN_MAX_RATIO);
    
    // ساخت امبد محاسبه‌گر وام
    const embed = new EmbedBuilder()
      .setColor('#47A992')
      .setTitle('🧮 محاسبه‌گر وام')
      .setDescription(`${interaction.user.username} عزیز، با استفاده از این ابزار می‌توانید سود و مبلغ بازپرداخت وام را محاسبه کنید:`)
      .addFields(
        { name: '💰 موجودی بانکی', value: `${formatNumber(user.bank)} Ccoin`, inline: true },
        { name: '💳 حداکثر وام', value: `${formatNumber(maxLoanAmount)} Ccoin`, inline: true },
        { name: '📊 امتیاز اعتباری', value: `${user.creditScore}/100`, inline: true },
        { name: '📈 نرخ سود', value: `${LOAN_INTEREST_RATE * 100}%`, inline: true },
        { name: '⏳ مدت بازپرداخت', value: `${LOAN_DURATION_DAYS} روز`, inline: true }
      );
    
    // چند نمونه محاسبه
    const examples = [
      { amount: Math.floor(maxLoanAmount * 0.25), label: '25%' },
      { amount: Math.floor(maxLoanAmount * 0.5), label: '50%' },
      { amount: Math.floor(maxLoanAmount * 0.75), label: '75%' },
      { amount: maxLoanAmount, label: '100%' }
    ];
    
    examples.forEach(example => {
      const interest = Math.floor(example.amount * LOAN_INTEREST_RATE);
      const totalRepayment = example.amount + interest;
      
      embed.addFields({
        name: `📝 نمونه ${example.label} از حداکثر وام`,
        value: `مبلغ وام: ${formatNumber(example.amount)} Ccoin\n` +
               `سود: ${formatNumber(interest)} Ccoin\n` +
               `مبلغ بازپرداخت: ${formatNumber(totalRepayment)} Ccoin`
      });
    });
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('loan_request')
          .setLabel('📝 درخواست وام')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('loan_menu')
          .setLabel('🔙 بازگشت به منوی وام')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in loan calculator:', error);
    
    await interaction.reply({
      content: '❌ خطایی در محاسبه‌گر وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * لغو درخواست وام
 * @param interaction تعامل کاربر
 */
export async function handleLoanCancel(interaction: MessageComponentInteraction) {
  try {
    await loanMenu(interaction, true);
  } catch (error) {
    console.error('Error cancelling loan:', error);
    
    await interaction.reply({
      content: '❌ خطایی در لغو درخواست وام رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}