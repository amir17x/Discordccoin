/**
 * سیستم محاسبه وضعیت اقتصادی کاربران
 * این سیستم براساس گردش مالی، خوش‌حسابی در پرداخت وام‌ها و فعالیت‌های شغلی
 * وضعیت اقتصادی کاربران را مشخص می‌کند
 */

import { IUser } from '../../models/User';
import { storage } from '../../storage';
import { log } from './logger';

// Logger wrapper to match the expected format in this file
const logger = {
  error: (message: string, error?: any) => {
    log(message + (error ? ` - ${error.message || error}` : ''), 'error', 'ECONOMY');
  },
  info: (message: string) => {
    log(message, 'info', 'ECONOMY');
  }
};

/**
 * سطوح مختلف وضعیت اقتصادی
 */
export enum EconomicStatus {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  PROFESSIONAL = 'professional',
  WEALTHY = 'wealthy'
}

/**
 * الزامات هر سطح اقتصادی
 */
interface EconomicLevelRequirements {
  minScore: number;         // حداقل امتیاز کلی
  minTransactionVolume: number;  // حداقل گردش مالی
  minPunctualityRate: number;    // حداقل درصد خوش‌حسابی
  minTasksCompleted: number;     // حداقل تعداد کارهای شغلی انجام‌شده
}

/**
 * تعریف الزامات هر سطح اقتصادی
 * هر سطح بالاتر نیازمند مقادیر بیشتری است
 */
const ECONOMIC_LEVEL_REQUIREMENTS: Record<EconomicStatus, EconomicLevelRequirements> = {
  [EconomicStatus.BEGINNER]: {
    minScore: 0,
    minTransactionVolume: 0,
    minPunctualityRate: 0,
    minTasksCompleted: 0
  },
  [EconomicStatus.INTERMEDIATE]: {
    minScore: 100,
    minTransactionVolume: 10000,
    minPunctualityRate: 60,
    minTasksCompleted: 10
  },
  [EconomicStatus.PROFESSIONAL]: {
    minScore: 500,
    minTransactionVolume: 100000,
    minPunctualityRate: 80,
    minTasksCompleted: 50
  },
  [EconomicStatus.WEALTHY]: {
    minScore: 2000,
    minTransactionVolume: 1000000,
    minPunctualityRate: 95,
    minTasksCompleted: 200
  }
};

/**
 * محاسبه امتیاز اقتصادی کاربر براساس فاکتورهای متنوع
 * @param user کاربر
 * @returns امتیاز اقتصادی
 */
export function calculateEconomicScore(user: IUser): number {
  try {
    // مقادیر پایه
    const baseWalletScore = user.wallet * 0.0005;
    const baseBankScore = user.bank * 0.001;
    
    // امتیاز حجم تراکنش - تراکنش بیشتر، امتیاز بیشتر
    const transactionVolumeScore = (user.transactionVolume || 0) * 0.0002;
    
    // امتیاز خوش‌حسابی در بازپرداخت وام‌ها
    let loanPunctualityScore = 0;
    if (user.loanRepaymentHistory && user.loanRepaymentHistory.totalLoans > 0) {
      const punctualityRate = user.loanRepaymentHistory.punctualityRate || 0;
      loanPunctualityScore = punctualityRate * 0.5; // هر 1% خوش‌حسابی، 0.5 امتیاز
    }
    
    // امتیاز فعالیت‌های شغلی
    let jobActivityScore = 0;
    if (user.jobActivity) {
      jobActivityScore = (user.jobActivity.totalTasksCompleted || 0) * 0.5;
      jobActivityScore += (user.jobActivity.totalJobEarnings || 0) * 0.0002;
    }
    
    // امتیاز سطح کاربر
    const levelScore = (user.level || 1) * 5;
    
    // جمع کل امتیازات
    const totalScore = 
      baseWalletScore + 
      baseBankScore + 
      transactionVolumeScore + 
      loanPunctualityScore + 
      jobActivityScore +
      levelScore;
    
    return Math.round(totalScore);
  } catch (error) {
    logger.error('خطا در محاسبه امتیاز اقتصادی کاربر:', error);
    return 0;
  }
}

/**
 * تعیین وضعیت اقتصادی کاربر براساس معیارها
 * @param user کاربر
 * @returns وضعیت اقتصادی جدید
 */
export function determineEconomicStatus(user: IUser): EconomicStatus {
  try {
    // محاسبه امتیاز اقتصادی کاربر
    const economicScore = user.economyScore || calculateEconomicScore(user);
    
    // مقادیر دیگر معیارها
    const transactionVolume = user.transactionVolume || 0;
    
    // نرخ خوش‌حسابی در پرداخت وام‌ها
    let punctualityRate = 0;
    if (user.loanRepaymentHistory) {
      punctualityRate = user.loanRepaymentHistory.punctualityRate || 0;
    }
    
    // تعداد کارهای شغلی انجام شده
    let tasksCompleted = 0;
    if (user.jobActivity) {
      tasksCompleted = user.jobActivity.totalTasksCompleted || 0;
    }
    
    // بررسی معیارهای هر سطح از بالاترین به پایین‌ترین
    if (
      economicScore >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.WEALTHY].minScore &&
      transactionVolume >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.WEALTHY].minTransactionVolume &&
      punctualityRate >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.WEALTHY].minPunctualityRate &&
      tasksCompleted >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.WEALTHY].minTasksCompleted
    ) {
      return EconomicStatus.WEALTHY;
    } else if (
      economicScore >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.PROFESSIONAL].minScore &&
      transactionVolume >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.PROFESSIONAL].minTransactionVolume &&
      punctualityRate >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.PROFESSIONAL].minPunctualityRate &&
      tasksCompleted >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.PROFESSIONAL].minTasksCompleted
    ) {
      return EconomicStatus.PROFESSIONAL;
    } else if (
      economicScore >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.INTERMEDIATE].minScore &&
      transactionVolume >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.INTERMEDIATE].minTransactionVolume &&
      punctualityRate >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.INTERMEDIATE].minPunctualityRate &&
      tasksCompleted >= ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.INTERMEDIATE].minTasksCompleted
    ) {
      return EconomicStatus.INTERMEDIATE;
    } else {
      return EconomicStatus.BEGINNER;
    }
  } catch (error) {
    logger.error('خطا در تعیین وضعیت اقتصادی کاربر:', error);
    return EconomicStatus.BEGINNER;
  }
}

/**
 * محاسبه درصد پیشرفت به سطح بعدی
 * @param user کاربر
 * @returns اطلاعات پیشرفت به سطح بعدی
 */
export function calculateNextLevelProgress(user: IUser): {
  nextStatus: EconomicStatus | null;
  scoreProgress: { current: number; required: number; percentage: number };
  transactionProgress: { current: number; required: number; percentage: number };
  punctualityProgress: { current: number; required: number; percentage: number };
  tasksProgress: { current: number; required: number; percentage: number };
} {
  try {
    // وضعیت فعلی کاربر
    const currentStatus = (user.economyStatus as EconomicStatus) || EconomicStatus.BEGINNER;
    
    // مقادیر فعلی
    const economicScore = user.economyScore || calculateEconomicScore(user);
    const transactionVolume = user.transactionVolume || 0;
    
    // نرخ خوش‌حسابی در پرداخت وام‌ها
    let punctualityRate = 0;
    if (user.loanRepaymentHistory) {
      punctualityRate = user.loanRepaymentHistory.punctualityRate || 0;
    }
    
    // تعداد کارهای شغلی انجام شده
    let tasksCompleted = 0;
    if (user.jobActivity) {
      tasksCompleted = user.jobActivity.totalTasksCompleted || 0;
    }
    
    // تعیین سطح بعدی
    let nextStatus: EconomicStatus | null = null;
    let nextLevelRequirements: EconomicLevelRequirements | null = null;
    
    if (currentStatus === EconomicStatus.BEGINNER) {
      nextStatus = EconomicStatus.INTERMEDIATE;
      nextLevelRequirements = ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.INTERMEDIATE];
    } else if (currentStatus === EconomicStatus.INTERMEDIATE) {
      nextStatus = EconomicStatus.PROFESSIONAL;
      nextLevelRequirements = ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.PROFESSIONAL];
    } else if (currentStatus === EconomicStatus.PROFESSIONAL) {
      nextStatus = EconomicStatus.WEALTHY;
      nextLevelRequirements = ECONOMIC_LEVEL_REQUIREMENTS[EconomicStatus.WEALTHY];
    } else {
      // در بالاترین سطح هستیم، سطح بعدی وجود ندارد
      return {
        nextStatus: null,
        scoreProgress: { current: economicScore, required: 0, percentage: 100 },
        transactionProgress: { current: transactionVolume, required: 0, percentage: 100 },
        punctualityProgress: { current: punctualityRate, required: 0, percentage: 100 },
        tasksProgress: { current: tasksCompleted, required: 0, percentage: 100 }
      };
    }
    
    // محاسبه درصد پیشرفت در هر فاکتور
    const scorePercentage = Math.min(100, (economicScore / nextLevelRequirements.minScore) * 100);
    const transactionPercentage = Math.min(100, (transactionVolume / nextLevelRequirements.minTransactionVolume) * 100);
    const punctualityPercentage = Math.min(100, (punctualityRate / nextLevelRequirements.minPunctualityRate) * 100);
    const tasksPercentage = Math.min(100, (tasksCompleted / nextLevelRequirements.minTasksCompleted) * 100);
    
    return {
      nextStatus,
      scoreProgress: {
        current: economicScore,
        required: nextLevelRequirements.minScore,
        percentage: Math.round(scorePercentage)
      },
      transactionProgress: {
        current: transactionVolume,
        required: nextLevelRequirements.minTransactionVolume,
        percentage: Math.round(transactionPercentage)
      },
      punctualityProgress: {
        current: punctualityRate,
        required: nextLevelRequirements.minPunctualityRate,
        percentage: Math.round(punctualityPercentage)
      },
      tasksProgress: {
        current: tasksCompleted,
        required: nextLevelRequirements.minTasksCompleted,
        percentage: Math.round(tasksPercentage)
      }
    };
  } catch (error) {
    logger.error('خطا در محاسبه پیشرفت به سطح بعدی:', error);
    return {
      nextStatus: null,
      scoreProgress: { current: 0, required: 0, percentage: 0 },
      transactionProgress: { current: 0, required: 0, percentage: 0 },
      punctualityProgress: { current: 0, required: 0, percentage: 0 },
      tasksProgress: { current: 0, required: 0, percentage: 0 }
    };
  }
}

/**
 * افزایش حجم تراکنش کاربر پس از هر تراکنش مالی
 * @param userId شناسه کاربر
 * @param amount مقدار تراکنش
 */
export async function updateTransactionVolume(userId: string | number, amount: number): Promise<void> {
  try {
    // دریافت اطلاعات کاربر
    const user = await storage.getUserById(String(userId));
    if (!user) return;
    
    // به‌روزرسانی حجم تراکنش
    const currentVolume = user.transactionVolume || 0;
    const newVolume = currentVolume + Math.abs(amount);
    
    // ذخیره مقدار جدید
    await storage.updateUser(user.id, { transactionVolume: newVolume });
    
    // بررسی و به‌روزرسانی وضعیت اقتصادی در صورت نیاز
    await checkEconomicStatusUpgrade(userId);
  } catch (error) {
    logger.error('خطا در به‌روزرسانی حجم تراکنش کاربر:', error);
  }
}

/**
 * به‌روزرسانی تاریخچه پرداخت وام
 * @param userId شناسه کاربر
 * @param onTimePayment آیا پرداخت به موقع انجام شده است
 */
export async function updateLoanRepaymentHistory(userId: string | number, onTimePayment: boolean): Promise<void> {
  try {
    // دریافت اطلاعات کاربر
    const user = await storage.getUserById(String(userId));
    if (!user) return;
    
    // سابقه فعلی یا ایجاد سابقه جدید
    const loanHistory = user.loanRepaymentHistory || {
      onTimePayments: 0,
      latePayments: 0,
      totalLoans: 0,
      punctualityRate: 0
    };
    
    // به‌روزرسانی آمار
    if (onTimePayment) {
      loanHistory.onTimePayments++;
    } else {
      loanHistory.latePayments++;
    }
    
    loanHistory.totalLoans = loanHistory.onTimePayments + loanHistory.latePayments;
    
    // محاسبه نرخ خوش‌حسابی
    loanHistory.punctualityRate = Math.round((loanHistory.onTimePayments / loanHistory.totalLoans) * 100);
    
    // ذخیره اطلاعات به‌روزرسانی شده
    await storage.updateUser(user.id, { loanRepaymentHistory: loanHistory });
    
    // بررسی و به‌روزرسانی وضعیت اقتصادی در صورت نیاز
    await checkEconomicStatusUpgrade(userId);
  } catch (error) {
    logger.error('خطا در به‌روزرسانی تاریخچه پرداخت وام کاربر:', error);
  }
}

/**
 * به‌روزرسانی اطلاعات فعالیت شغلی
 * @param userId شناسه کاربر
 * @param tasksCompleted تعداد کارهای جدید انجام‌شده
 * @param earnings درآمد کسب‌شده
 */
export async function updateJobActivity(userId: string | number, tasksCompleted: number = 0, earnings: number = 0): Promise<void> {
  try {
    // دریافت اطلاعات کاربر
    const user = await storage.getUserById(String(userId));
    if (!user) return;
    
    // اطلاعات فعالیت شغلی فعلی یا ایجاد جدید
    const jobActivity = user.jobActivity || {
      totalTasksCompleted: 0,
      lastJobLevelUp: null,
      totalJobsHeld: 0,
      totalJobEarnings: 0
    };
    
    // به‌روزرسانی آمار
    jobActivity.totalTasksCompleted += tasksCompleted;
    jobActivity.totalJobEarnings += earnings;
    
    // ذخیره اطلاعات به‌روزرسانی شده
    await storage.updateUser(user.id, { jobActivity });
    
    // بررسی و به‌روزرسانی وضعیت اقتصادی در صورت نیاز
    await checkEconomicStatusUpgrade(userId);
  } catch (error) {
    logger.error('خطا در به‌روزرسانی فعالیت شغلی کاربر:', error);
  }
}

/**
 * بررسی و به‌روزرسانی وضعیت اقتصادی کاربر در صورت واجد شرایط بودن
 * @param userId شناسه کاربر
 * @returns وضعیت اقتصادی جدید یا همان وضعیت قبلی
 */
export async function checkEconomicStatusUpgrade(userId: string | number): Promise<{
  oldStatus: EconomicStatus;
  newStatus: EconomicStatus;
  upgraded: boolean;
}> {
  try {
    // دریافت اطلاعات کاربر
    const user = await storage.getUserById(String(userId));
    if (!user) {
      throw new Error(`کاربر با شناسه ${userId} یافت نشد`);
    }
    
    // وضعیت فعلی کاربر
    const oldStatus = (user.economyStatus as EconomicStatus) || EconomicStatus.BEGINNER;
    
    // محاسبه امتیاز اقتصادی جدید
    const economicScore = calculateEconomicScore(user);
    
    // به‌روزرسانی امتیاز اقتصادی کاربر
    await storage.updateUser(user.id, { economyScore: economicScore });
    
    // دریافت اطلاعات به‌روز شده کاربر
    const updatedUser = await storage.getUserById(String(userId));
    if (!updatedUser) {
      throw new Error(`کاربر با شناسه ${userId} پس از به‌روزرسانی یافت نشد`);
    }
    
    // تعیین وضعیت اقتصادی جدید
    const newStatus = determineEconomicStatus(updatedUser);
    
    // بررسی آیا ارتقا صورت گرفته است
    const upgraded = isStatusUpgrade(oldStatus, newStatus);
    
    // اگر وضعیت تغییر کرده، آن را به‌روزرسانی کنیم
    if (oldStatus !== newStatus) {
      await storage.updateUser(user.id, { 
        economyStatus: newStatus,
        economyLevel: getEconomyLevelFromStatus(newStatus)
      });
      
      // اگر ارتقا بوده، اطلاع‌رسانی انجام دهیم
      if (upgraded) {
        await sendEconomicStatusUpgradeNotification(userId, oldStatus, newStatus);
      }
    }
    
    return {
      oldStatus,
      newStatus,
      upgraded
    };
  } catch (error) {
    logger.error('خطا در بررسی ارتقای وضعیت اقتصادی کاربر:', error);
    return {
      oldStatus: EconomicStatus.BEGINNER,
      newStatus: EconomicStatus.BEGINNER,
      upgraded: false
    };
  }
}

/**
 * بررسی می‌کند آیا تغییر وضعیت، ارتقا محسوب می‌شود یا خیر
 * @param oldStatus وضعیت قبلی
 * @param newStatus وضعیت جدید
 * @returns آیا ارتقا اتفاق افتاده است
 */
function isStatusUpgrade(oldStatus: EconomicStatus, newStatus: EconomicStatus): boolean {
  const statusLevels = {
    [EconomicStatus.BEGINNER]: 0,
    [EconomicStatus.INTERMEDIATE]: 1,
    [EconomicStatus.PROFESSIONAL]: 2,
    [EconomicStatus.WEALTHY]: 3
  };
  
  return statusLevels[newStatus] > statusLevels[oldStatus];
}

/**
 * تبدیل وضعیت اقتصادی به سطح عددی
 * @param status وضعیت اقتصادی
 * @returns سطح عددی
 */
function getEconomyLevelFromStatus(status: EconomicStatus): number {
  switch (status) {
    case EconomicStatus.BEGINNER:
      return 1;
    case EconomicStatus.INTERMEDIATE:
      return 2;
    case EconomicStatus.PROFESSIONAL:
      return 3;
    case EconomicStatus.WEALTHY:
      return 4;
    default:
      return 1;
  }
}

/**
 * ارسال اعلان ارتقای وضعیت اقتصادی به کاربر از طریق پیام خصوصی (DM)
 * @param userId شناسه کاربر
 * @param oldStatus وضعیت قبلی
 * @param newStatus وضعیت جدید
 */
async function sendEconomicStatusUpgradeNotification(
  userId: string | number, 
  oldStatus: EconomicStatus, 
  newStatus: EconomicStatus
): Promise<void> {
  try {
    // فرض می‌کنیم این تابع از یک کلاینت دیسکورد برای ارسال پیام استفاده می‌کند
    // در پیاده‌سازی واقعی باید به کد ارسال پیام خصوصی (DM) اضافه شود
    
    const statusDetails = {
      [EconomicStatus.BEGINNER]: { emoji: '🟢', name: 'تازه‌کار' },
      [EconomicStatus.INTERMEDIATE]: { emoji: '🟡', name: 'متوسط' },
      [EconomicStatus.PROFESSIONAL]: { emoji: '🟠', name: 'حرفه‌ای' },
      [EconomicStatus.WEALTHY]: { emoji: '💎', name: 'ثروتمند' }
    };
    
    const oldStatusName = statusDetails[oldStatus].name;
    const oldStatusEmoji = statusDetails[oldStatus].emoji;
    const newStatusName = statusDetails[newStatus].name;
    const newStatusEmoji = statusDetails[newStatus].emoji;
    
    // توضیحات مزایا براساس سطح جدید
    const newBenefits = getEconomicStatusBenefits(newStatus);
    
    const message = `🎉 **تبریک!** 🎉\n\n` +
      `شما از سطح اقتصادی ${oldStatusEmoji} **${oldStatusName}** به سطح ${newStatusEmoji} **${newStatusName}** ارتقا یافتید!\n\n` +
      `**مزایای جدید شما:**\n${newBenefits}\n\n` +
      `برای مشاهده جزئیات بیشتر از دستور \`/menu\` و سپس منوی اقتصادی استفاده کنید.`;
    
    // ذخیره این اعلان در بخش اعلانات شخصی کاربر
    const user = await storage.getUserById(String(userId));
    if (user) {
      const personalNotifications = user.personalNotifications || { 
        notifications: [], 
        lastUpdated: new Date() 
      };
      
      personalNotifications.notifications.push(message);
      personalNotifications.lastUpdated = new Date();
      
      await storage.updateUser(user.id, { personalNotifications });
    }
    
    logger.info(`اعلان ارتقای وضعیت اقتصادی برای کاربر ${userId} ارسال شد: ${oldStatusName} -> ${newStatusName}`);
  } catch (error) {
    logger.error('خطا در ارسال اعلان ارتقای وضعیت اقتصادی:', error);
  }
}

/**
 * دریافت توضیحات مزایای هر سطح وضعیت اقتصادی
 * @param status وضعیت اقتصادی
 * @returns متن توضیحات مزایا
 */
function getEconomicStatusBenefits(status: EconomicStatus): string {
  switch (status) {
    case EconomicStatus.INTERMEDIATE:
      return "• سقف تراکنش کیف پول: ۵,۰۰۰ Ccoin\n" +
        "• سود بانکی: ۳٪\n" +
        "• سقف وام: ۲۰,۰۰۰ Ccoin\n" +
        "• دسترسی به شغل‌های سطح متوسط";

    case EconomicStatus.PROFESSIONAL:
      return "• سقف تراکنش کیف پول: ۲۰,۰۰۰ Ccoin\n" +
        "• سود بانکی: ۵٪\n" +
        "• سقف وام: ۱۰۰,۰۰۰ Ccoin\n" +
        "• دسترسی به شغل‌های سطح بالا\n" +
        "• نقش ویژه: \"Professional Trader\"";

    case EconomicStatus.WEALTHY:
      return "• سقف تراکنش کیف پول: ۱۰۰,۰۰۰ Ccoin\n" +
        "• سود بانکی: ۱۰٪\n" +
        "• سقف وام: ۵۰۰,۰۰۰ Ccoin\n" +
        "• دسترسی به تمام شغل‌ها\n" +
        "• نقش ویژه: \"Wealthy Elite\"\n" +
        "• نشان اختصاصی کنار نام";

    default:
      return "• سقف تراکنش کیف پول: ۱,۰۰۰ Ccoin\n" +
        "• سود بانکی: ۱٪\n" +
        "• سقف وام: ۵,۰۰۰ Ccoin\n" +
        "• دسترسی به شغل‌های پایه";
  }
}