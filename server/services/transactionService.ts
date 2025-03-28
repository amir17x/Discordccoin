import { Transaction, ITransaction, User } from '../models';

/**
 * ایجاد یک تراکنش جدید
 * @param transaction اطلاعات تراکنش
 * @returns تراکنش ذخیره شده
 */
export const createTransaction = async (
  transactionData: Partial<ITransaction>
): Promise<ITransaction> => {
  try {
    // بررسی وجود کاربر
    const user = await User.findOne({ discordId: transactionData.userId });
    if (!user) {
      throw new Error(`User not found with Discord ID: ${transactionData.userId}`);
    }

    // ایجاد تراکنش جدید
    const transaction = new Transaction({
      ...transactionData,
      timestamp: new Date(),
      balance: user.wallet, // ثبت موجودی فعلی کاربر
      isSuccess: true
    });

    // ذخیره تراکنش در دیتابیس
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error in createTransaction:', error);
    throw error;
  }
};

/**
 * دریافت لیست تراکنش‌های یک کاربر
 * @param userId شناسه کاربر در دیسکورد
 * @param limit محدودیت تعداد نتایج
 * @param skip تعداد رکوردهای نادیده گرفته شده
 * @returns لیست تراکنش‌ها
 */
export const getUserTransactions = async (
  userId: string,
  limit = 10,
  skip = 0
): Promise<ITransaction[]> => {
  try {
    const transactions = await Transaction.find({ userId })
      .sort({ timestamp: -1 }) // مرتب‌سازی بر اساس زمان، جدیدترین اول
      .skip(skip)
      .limit(limit);
    
    return transactions;
  } catch (error) {
    console.error('Error in getUserTransactions:', error);
    throw error;
  }
};

/**
 * دریافت آمار تراکنش‌های یک کاربر
 * @param userId شناسه کاربر در دیسکورد
 * @returns آمار تراکنش‌ها
 */
export const getUserTransactionStats = async (
  userId: string
): Promise<{ income: number; expenses: number; count: number }> => {
  try {
    // محاسبه جمع درآمدها
    const incomeResult = await Transaction.aggregate([
      { $match: { userId, amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // محاسبه جمع هزینه‌ها
    const expensesResult = await Transaction.aggregate([
      { $match: { userId, amount: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // محاسبه تعداد کل تراکنش‌ها
    const count = await Transaction.countDocuments({ userId });
    
    const income = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const expenses = expensesResult.length > 0 ? Math.abs(expensesResult[0].total) : 0;
    
    return { income, expenses, count };
  } catch (error) {
    console.error('Error in getUserTransactionStats:', error);
    throw error;
  }
};