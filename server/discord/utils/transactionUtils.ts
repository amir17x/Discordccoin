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
  targetId?: string;
  ref?: string;
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
    const { userId, amount, type, description, targetId, ref } = transaction;
    
    // دریافت اطلاعات کاربر
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, message: 'کاربر یافت نشد.' };
    }
    
    // بررسی نوع تراکنش و اعمال تغییرات مالی
    switch (type) {
      case 'deposit': // واریز به کیف پول
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        break;
        
      case 'withdraw': // برداشت از کیف پول
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount
        });
        break;
        
      case 'bank_deposit': // واریز به حساب بانکی
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کیف پول کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount,
          bank: user.bank + amount
        });
        break;
        
      case 'bank_withdraw': // برداشت از حساب بانکی
        if (user.bank < amount) {
          return { success: false, message: 'موجودی حساب بانکی کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount,
          bank: user.bank - amount
        });
        break;
        
      case 'achievement_reward': // پاداش دستاورد
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        break;
        
      case 'quest_reward': // پاداش ماموریت
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        break;
        
      case 'game_win': // برد در بازی
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet + amount
        });
        break;
        
      case 'game_loss': // باخت در بازی
        if (user.wallet < amount) {
          return { success: false, message: 'موجودی کافی نیست.' };
        }
        await storage.updateUser(parseInt(userId), {
          wallet: user.wallet - amount
        });
        break;
        
      // سایر انواع تراکنش‌ها
      default:
        return { success: false, message: 'نوع تراکنش نامعتبر است.' };
    }
    
    // ثبت تراکنش در پایگاه داده
    if (storage.saveTransaction) {
      await storage.saveTransaction({
        userId,
        amount,
        type,
        description: description || '',
        targetId,
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
        type: 'transfer_out',
        description: `ارسال ${amount} سکه به ${receiver.username}`,
        targetId: receiverId,
        timestamp: new Date()
      });
      
      // ثبت تراکنش برای گیرنده
      await storage.saveTransaction({
        userId: receiverId,
        amount: amount,
        type: 'transfer_in',
        description: `دریافت ${amount} سکه از ${sender.username}`,
        targetId: senderId,
        timestamp: new Date()
      });
    }
    
    return { success: true, message: `${amount} سکه با موفقیت به ${receiver.username} ارسال شد.` };
  } catch (error) {
    console.error('Error transferring coins:', error);
    return { success: false, message: 'خطا در ارسال سکه.' };
  }
}