/**
 * @file تابع‌های کمکی برای مدیریت و نمایش تاریخچه تراکنش‌ها
 */

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ITransaction } from '../../models/Transaction';
import { getTransactionTypeInfo, formatTransactionAmount, formatNumber, formatDate } from './formatters';

/**
 * ساخت یک امبد نمایش تاریخچه تراکنش‌ها
 * @param transactions لیست تراکنش‌ها
 * @param title عنوان امبد
 * @param description توضیحات امبد
 * @param thumbnailUrl آدرس تصویر بندانگشتی
 * @param username نام کاربری
 * @param filter فیلتر اختیاری برای نوع تراکنش‌ها
 * @param formatOptions تنظیمات فرمت نمایش
 * @returns امبد آماده نمایش
 */
export function createTransactionHistoryEmbed(
  transactions: ITransaction[],
  title: string,
  description: string,
  thumbnailUrl: string,
  username: string,
  filter?: (tx: ITransaction) => boolean,
  formatOptions: {
    showFee?: boolean;
    showDescription?: boolean;
    showDetails?: boolean;
    showId?: boolean;
    showTimestamp?: boolean;
    maxTransactions?: number;
    customFormatter?: (tx: ITransaction) => { name: string; value: string };
  } = {}
): EmbedBuilder {
  // تنظیمات پیش‌فرض
  const options = {
    showFee: true,
    showDescription: true,
    showDetails: true,
    showId: true,
    showTimestamp: true,
    maxTransactions: 10,
    ...formatOptions
  };

  // فیلتر کردن تراکنش‌ها در صورت وجود فیلتر
  const filteredTransactions = filter ? transactions.filter(filter) : transactions;
  // انتخاب آخرین تراکنش‌ها تا سقف تعیین شده
  const recentTransactions = filteredTransactions.slice(0, options.maxTransactions);
  
  // ایجاد اِمبد
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(title)
    .setThumbnail(thumbnailUrl)
    .setFooter({ text: `${username} | صفحه 1` })
    .setTimestamp();
    
  // بررسی وجود تراکنش
  if (recentTransactions.length === 0) {
    embed.setDescription(description || 'هیچ تراکنشی یافت نشد.');
    return embed;
  }
  
  // افزودن توضیحات
  if (description) {
    embed.setDescription(description);
  }
  
  // افزودن فیلدهای تراکنش
  recentTransactions.forEach((tx: ITransaction) => {
    // اگر فرمت‌کننده سفارشی وجود دارد از آن استفاده می‌کنیم
    if (options.customFormatter) {
      const formattedField = options.customFormatter(tx);
      embed.addFields(formattedField);
      return;
    }
    
    // دریافت اطلاعات نمایشی تراکنش
    const typeInfo = getTransactionTypeInfo(tx.type);
    
    // فرمت کردن تاریخ و زمان
    const date = new Date(tx.timestamp).toLocaleDateString('fa-IR');
    const time = new Date(tx.timestamp).toLocaleTimeString('fa-IR');
    
    // فرمت کردن مبلغ
    const amountStr = formatTransactionAmount(tx.amount, tx.type);
    
    // ایجاد عنوان فیلد
    let fieldName = `${typeInfo.emoji} ${typeInfo.label}`;
    if (options.showTimestamp) {
      fieldName += ` - ${date} ${time}`;
    }
    
    // ایجاد محتوای فیلد
    let fieldValue = `${typeInfo.color} **${amountStr}**`;
    
    // افزودن کارمزد در صورت وجود
    if (options.showFee && tx.fee && tx.fee > 0) {
      fieldValue += ` (کارمزد: ${formatNumber(tx.fee)}-)`;
    }
    
    // افزودن توضیحات در صورت وجود
    if (options.showDescription && tx.description && tx.description.trim()) {
      fieldValue += `\n**توضیحات:** ${tx.description}`;
    }
    
    // افزودن جزئیات اضافی بر اساس نوع تراکنش
    if (options.showDetails) {
      if (tx.type === 'transfer_sent' && tx.recipientName) {
        fieldValue += `\n**گیرنده:** ${tx.recipientName}`;
      } else if (tx.type === 'transfer_received' && tx.senderName) {
        fieldValue += `\n**فرستنده:** ${tx.senderName}`;
      } else if (tx.type === 'stock_buy' || tx.type === 'stock_sell') {
        const metadata = tx.metadata as Record<string, any> | undefined;
        if (metadata) {
          if (metadata.stockSymbol) {
            fieldValue += `\n**نماد:** ${metadata.stockSymbol}`;
          }
          if (metadata.quantity) {
            fieldValue += `\n**تعداد سهام:** ${metadata.quantity}`;
          }
          if (metadata.price) {
            fieldValue += `\n**قیمت واحد:** ${formatNumber(metadata.price)}`;
          }
        }
      } else if (tx.type === 'loan_received' || tx.type === 'loan_repayment') {
        const metadata = tx.metadata as Record<string, any> | undefined;
        if (metadata) {
          if (metadata.loanId) {
            fieldValue += `\n**شناسه وام:** ${metadata.loanId}`;
          }
          if (metadata.interestRate) {
            fieldValue += `\n**نرخ سود:** %${metadata.interestRate}`;
          }
          if (metadata.remainingAmount !== undefined) {
            fieldValue += `\n**مانده بدهی:** ${formatNumber(metadata.remainingAmount)}`;
          }
        }
      }
    }
    
    // افزودن شناسه تراکنش
    if (options.showId && tx.id) {
      fieldValue += `\n**شناسه تراکنش:** ${tx.id}`;
    }
    
    // افزودن فیلد به امبد
    embed.addFields({ name: fieldName, value: fieldValue, inline: false });
  });
  
  return embed;
}

/**
 * ساخت دکمه‌های کنترل برای تاریخچه تراکنش
 * @param backActionId شناسه اکشن دکمه بازگشت
 * @param backLabel متن دکمه بازگشت
 * @param toggleActionId شناسه اکشن دکمه تغییر حالت نمایش (اختیاری)
 * @param toggleLabel متن دکمه تغییر حالت نمایش (اختیاری)
 * @returns ردیف دکمه‌ها
 */
export function createTransactionControlButtons(
  backActionId: string,
  backLabel: string,
  toggleActionId?: string,
  toggleLabel?: string
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  
  // اگر دکمه تغییر حالت نمایش وجود دارد، آن را اضافه می‌کنیم
  if (toggleActionId && toggleLabel) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(toggleActionId)
        .setLabel(toggleLabel)
        .setStyle(ButtonStyle.Primary)
    );
  }
  
  // دکمه بازگشت
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(backActionId)
      .setLabel(backLabel)
      .setStyle(ButtonStyle.Secondary)
  );
  
  return row;
}

/**
 * دریافت فیلترهای رایج تراکنش‌ها
 */
export const TransactionFilters = {
  // فیلتر تراکنش‌های بانکی
  bankTransactions: (tx: ITransaction) => ['deposit', 'withdraw', 'bank_interest'].includes(tx.type),
  
  // فیلتر تراکنش‌های انتقال وجه
  transferTransactions: (tx: ITransaction) => ['transfer_sent', 'transfer_received', 'transfer_in', 'transfer_out'].includes(tx.type),
  
  // فیلتر تراکنش‌های بازی
  gameTransactions: (tx: ITransaction) => ['game_win', 'game_loss', 'game_bet', 'game_reward'].includes(tx.type),
  
  // فیلتر تراکنش‌های سهام
  stockTransactions: (tx: ITransaction) => ['stock_buy', 'stock_sell', 'stock_dividend'].includes(tx.type),
  
  // فیلتر تراکنش‌های سرمایه‌گذاری
  investmentTransactions: (tx: ITransaction) => ['investment', 'investment_return'].includes(tx.type),
  
  // فیلتر تراکنش‌های وام
  loanTransactions: (tx: ITransaction) => ['loan_received', 'loan_repayment'].includes(tx.type),
  
  // فیلتر تراکنش‌های لاتاری و قرعه‌کشی
  lotteryTransactions: (tx: ITransaction) => ['lottery_ticket', 'lottery_win', 'wheel_spin'].includes(tx.type),
  
  // فیلتر تراکنش‌های خرید و فروش آیتم
  itemTransactions: (tx: ITransaction) => ['item_purchase', 'item_purchase_crystal', 'item_sold'].includes(tx.type),
  
  // فیلتر تراکنش‌های کلن
  clanTransactions: (tx: ITransaction) => ['clan_contribution', 'clan_withdrawal', 'clan_reward'].includes(tx.type),
  
  // فیلتر تراکنش‌های مدیریتی
  adminTransactions: (tx: ITransaction) => ['admin_add', 'admin_remove', 'admin_adjustment'].includes(tx.type)
};

/**
 * دریافت آیکون‌های متداول برای بخش‌های مختلف تراکنش‌ها
 */
export const TransactionIcons = {
  bank: 'https://img.icons8.com/fluency/48/bank-building.png',
  transfer: 'https://img.icons8.com/fluency/48/money-transfer.png',
  game: 'https://img.icons8.com/fluency/48/controller.png',
  stock: 'https://img.icons8.com/fluency/48/stock-market.png',
  investment: 'https://img.icons8.com/fluency/48/investment-portfolio.png',
  loan: 'https://img.icons8.com/fluency/48/refund.png',
  lottery: 'https://img.icons8.com/fluency/48/winning-ticket.png',
  shop: 'https://img.icons8.com/fluency/48/shop.png',
  clan: 'https://img.icons8.com/fluency/48/castle.png',
  admin: 'https://img.icons8.com/fluency/48/admin-settings-male.png',
  all: 'https://img.icons8.com/fluency/48/transaction.png'
};