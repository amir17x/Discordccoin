/**
 * توابع کمکی برای مدیریت تراکنش‌های مالی
 */

import { storage } from '../../storage';
import { getUserById } from './userUtils';

/**
 * ساختار تراکنش
 */
interface TransactionData {
  userId: string;
  amount: number;
  type: string;
  description?: string;
  senderName?: string;
  senderDiscordId?: string;
  recipientName?: string;
  recipientId?: string;
  itemId?: string;
  itemName?: string;
  itemQuantity?: number;
  balance?: number;
  guildId?: string;
  channelId?: string;
  isSuccess?: boolean;
  currency?: 'coins' | 'crystals' | 'items';
  metadata?: Record<string, any>;
}

/**
 * ایجاد تراکنش جدید و به‌روزرسانی موجودی کاربر
 * @param transaction اطلاعات تراکنش
 * @returns نتیجه تراکنش
 */
export async function createTransaction(
  transaction: TransactionData
): Promise<{ success: boolean; message?: string }> {
  try {
    const { 
      userId, 
      amount, 
      type, 
      description, 
      recipientId, 
      recipientName,
      senderName,
      senderDiscordId,
      currency = 'coins',
      guildId,
      channelId,
      itemId,
      itemName,
      itemQuantity,
      metadata
    } = transaction;
    
    // دریافت اطلاعات کاربر
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, message: 'کاربر یافت نشد.' };
    }
    
    let updatedBalance = 0;
    let isSuccess = true;
    
    // بررسی نوع تراکنش و اعمال تغییرات مالی
    switch (type) {
      case 'deposit': // واریز به حساب بانکی
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کیف پول کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount,
          bank: user.bank + amount
        });
        updatedBalance = user.bank + amount;
        break;
        
      case 'withdraw': // برداشت از حساب بانکی
        if (user.bank < amount) {
          return { success: false, message: 'موجودی حساب بانکی کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount,
          bank: user.bank - amount
        });
        updatedBalance = user.wallet + amount;
        break;
        
      case 'bank_interest': // سود بانکی
        await storage.updateUser(parseInt(userId), {
          bank: user.bank + amount
        });
        updatedBalance = user.bank + amount;
        break;
        
      case 'transfer_sent': // ارسال سکه به کاربر دیگر
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کیف پول کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount
        });
        updatedBalance = user.wallet - amount;
        break;
        
      case 'transfer_received': // دریافت سکه از کاربر دیگر
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        updatedBalance = user.wallet + amount;
        break;
        
      case 'achievement_reward': // پاداش دستاورد
      case 'quest_reward': // پاداش ماموریت
      case 'game_win': // برد در بازی
      case 'daily': // دریافت روزانه
      case 'weekly': // دریافت هفتگی
      case 'monthly': // دریافت ماهانه
      case 'work': // انجام کار
      case 'job_income': // درآمد شغلی
      case 'clan_reward': // پاداش کلن
      case 'friend_bonus': // پاداش دوستی
      case 'lottery_win': // برد در لاتاری
      case 'wheel_spin': // چرخش چرخ شانس
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        updatedBalance = user.wallet + amount;
        break;
        
      case 'game_bet': // شرط‌بندی در بازی
      case 'game_loss': // باخت در بازی
      case 'lottery_ticket': // خرید بلیط لاتاری
      case 'steal_failed': // شکست در دزدی
      case 'tax': // مالیات
      case 'penalty': // جریمه
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount
        });
        updatedBalance = user.wallet - amount;
        break;
        
      case 'steal_success': // موفقیت در دزدی
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        updatedBalance = user.wallet + amount;
        break;
        
      case 'robbed': // دزدیده شدن از کاربر
        if (user.wallet < amount) {
          await storage.updateUser(parseInt(userId), {
            wallet: 0
          });
          updatedBalance = 0;
        } else {
          await storage.updateUser(parseInt(userId), {
            wallet: user.wallet - amount
          });
          updatedBalance = user.wallet - amount;
        }
        break;
        
      case 'shop_purchase': // خرید از فروشگاه
      case 'market_purchase': // خرید از بازار
        if (currency === 'coins') {
          if (user.wallet < amount) {
            return { success: false, message: 'موجودی کیف پول کافی نیست.' };
          }
          await storage.updateUser(parseInt(userId), {
            wallet: user.wallet - amount
          });
          updatedBalance = user.wallet - amount;
        } else if (currency === 'crystals') {
          if (user.crystals < amount) {
            return { success: false, message: 'موجودی کریستال کافی نیست.' };
          }
          await storage.updateUser(parseInt(userId), {
            crystals: user.crystals - amount
          });
          updatedBalance = user.crystals - amount;
        }
        break;
        
      case 'shop_sale': // فروش به فروشگاه
      case 'market_sale': // فروش در بازار
        if (currency === 'coins') {
          await storage.updateUser(parseInt(userId), {
            wallet: user.wallet + amount
          });
          updatedBalance = user.wallet + amount;
        } else if (currency === 'crystals') {
          await storage.updateUser(parseInt(userId), {
            crystals: user.crystals + amount
          });
          updatedBalance = user.crystals + amount;
        }
        break;
        
      case 'investment': // سرمایه‌گذاری
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کیف پول کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount
        });
        updatedBalance = user.wallet - amount;
        break;
        
      case 'investment_return': // بازگشت سرمایه‌گذاری
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        updatedBalance = user.wallet + amount;
        break;
        
      case 'stock_buy': // خرید سهام
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کیف پول کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount
        });
        updatedBalance = user.wallet - amount;
        break;
        
      case 'stock_sell': // فروش سهام
      case 'stock_dividend': // سود سهام
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        updatedBalance = user.wallet + amount;
        break;
        
      case 'loan': // دریافت وام
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        updatedBalance = user.wallet + amount;
        break;
        
      case 'loan_repayment': // بازپرداخت وام
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کیف پول کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount
        });
        updatedBalance = user.wallet - amount;
        break;
        
      // سایر انواع تراکنش‌ها
      default:
        console.warn(`نوع تراکنش نامعتبر: ${type}`);
        if (amount > 0) {
          await storage.updateUser(parseInt(userId), {
            wallet: user.wallet + amount
          });
          updatedBalance = user.wallet + amount;
        } else if (amount < 0) {
          if (user.wallet < Math.abs(amount)) {
            return { success: false, message: 'موجودی کافی نیست.' };
          }
          await storage.updateUser(parseInt(userId), {
            wallet: user.wallet + amount // amount منفی است
          });
          updatedBalance = user.wallet + amount;
        }
    }
    
    // ثبت تراکنش در پایگاه داده
    if (storage.saveTransaction) {
      await storage.saveTransaction({
        userId,
        amount,
        type,
        description: description || '',
        senderName,
        senderDiscordId,
        recipientName,
        recipientId,
        itemId,
        itemName,
        itemQuantity,
        balance: updatedBalance,
        guildId,
        channelId,
        isSuccess: transaction.isSuccess !== undefined ? transaction.isSuccess : isSuccess,
        currency,
        metadata,
        timestamp: new Date()
      });
    } else {
      console.warn('saveTransaction method not implemented in storage');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, message: 'خطا در ایجاد تراکنش.' };
  }
}

/**
 * ارسال سکه به کاربر دیگر
 * @param senderId شناسه فرستنده
 * @param receiverId شناسه گیرنده
 * @param amount مقدار سکه
 * @returns نتیجه تراکنش
 */
export async function transferCoins(
  senderId: string,
  receiverId: string,
  amount: number
): Promise<{ success: boolean; message?: string }> {
  try {
    if (senderId === receiverId) {
      return { success: false, message: 'نمی‌توانید به خودتان سکه ارسال کنید.' };
    }
    
    if (amount <= 0) {
      return { success: false, message: 'مقدار سکه باید بیشتر از صفر باشد.' };
    }
    
    // دریافت اطلاعات فرستنده
    const sender = await getUserById(senderId);
    if (!sender) {
      return { success: false, message: 'فرستنده یافت نشد.' };
    }
    
    // دریافت اطلاعات گیرنده
    const receiver = await getUserById(receiverId);
    if (!receiver) {
      return { success: false, message: 'گیرنده یافت نشد.' };
    }
    
    // بررسی موجودی فرستنده
    if (sender.wallet < amount) {
      return { success: false, message: 'موجودی کافی نیست.' };
    }
    
    // کم کردن سکه از فرستنده
    await storage.updateUser(parseInt(senderId), {
      wallet: sender.wallet - amount
    });
    
    // اضافه کردن سکه به گیرنده
    await storage.updateUser(parseInt(receiverId), {
      wallet: receiver.wallet + amount
    });
    
    // ثبت تراکنش برای فرستنده
    if (storage.saveTransaction) {
      await storage.saveTransaction({
        userId: senderId,
        amount: -amount,
        type: 'transfer_sent',
        description: `ارسال ${amount} سکه به ${receiver.username}`,
        recipientId: receiverId,
        recipientName: receiver.username,
        balance: sender.wallet - amount,
        timestamp: new Date(),
        currency: 'coins',
        isSuccess: true
      });
      
      // ثبت تراکنش برای گیرنده
      await storage.saveTransaction({
        userId: receiverId,
        amount: amount,
        type: 'transfer_received',
        description: `دریافت ${amount} سکه از ${sender.username}`,
        senderDiscordId: senderId,
        senderName: sender.username,
        balance: receiver.wallet + amount,
        timestamp: new Date(),
        currency: 'coins',
        isSuccess: true
      });
    }
    
    return { success: true, message: `${amount} سکه با موفقیت به ${receiver.username} ارسال شد.` };
  } catch (error) {
    console.error('Error transferring coins:', error);
    return { success: false, message: 'خطا در ارسال سکه.' };
  }
}