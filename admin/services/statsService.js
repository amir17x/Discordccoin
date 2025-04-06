/**
 * سرویس آمارگیری
 */

import * as userService from './userService.js';
import * as economyService from './economyService.js';
import { commonService } from './commonService.js';

/**
 * دریافت آمار بازی‌ها
 * @returns {Promise<Object>} آمار بازی‌ها
 */
export async function getGamesStats() {
  try {
    // TODO: پیاده‌سازی واقعی آمار بازی‌ها
    return {
      totalGamesPlayed: 15423,
      dailyGamesPlayed: 237,
      topGames: [
        { name: 'اسلات', count: 4281, winRate: 0.48 },
        { name: 'بلک جک', count: 3729, winRate: 0.51 },
        { name: 'پوکر', count: 2845, winRate: 0.32 },
        { name: 'رولت', count: 2301, winRate: 0.47 },
        { name: 'دوئل', count: 1293, winRate: 0.5 },
      ],
      coinsSpent: 3245000,
      coinsPrized: 3100000,
      houseEdge: 145000,
      houseEdgePercentage: 4.47,
    };
  } catch (error) {
    console.error('خطا در دریافت آمار بازی‌ها:', error);
    return {};
  }
}

/**
 * دریافت آمار بازی‌های یک کاربر
 * @param {String} userId شناسه کاربر
 * @returns {Promise<Object>} آمار بازی‌های کاربر
 */
export async function getUserGamesStats(userId) {
  try {
    // TODO: پیاده‌سازی واقعی آمار بازی‌های کاربر
    return {
      totalGamesPlayed: 124,
      gamesWon: 56,
      gamesLost: 68,
      winRate: 0.45,
      totalCoinsWon: 12500,
      totalCoinsLost: 14200,
      netProfit: -1700,
      favoriteGame: 'اسلات',
      mostProfitableGame: 'بلک جک',
      biggestWin: 2500,
      biggestLoss: 3000,
      games: {
        'اسلات': { played: 45, won: 22, lost: 23, winRate: 0.49, totalWon: 5200, totalLost: 5500 },
        'بلک جک': { played: 32, won: 18, lost: 14, winRate: 0.56, totalWon: 4300, totalLost: 3200 },
        'پوکر': { played: 28, won: 10, lost: 18, winRate: 0.36, totalWon: 2000, totalLost: 3700 },
        'رولت': { played: 19, won: 6, lost: 13, winRate: 0.32, totalWon: 1000, totalLost: 1800 },
      },
    };
  } catch (error) {
    console.error(`خطا در دریافت آمار بازی‌های کاربر ${userId}:`, error);
    return {};
  }
}

/**
 * دریافت آمار سیستم
 * @returns {Promise<Object>} آمار سیستم
 */
export async function getSystemStats() {
  try {
    // TODO: پیاده‌سازی واقعی آمار سیستم
    return {
      users: await userService.getUsersStats(),
      economy: await economyService.getEconomyStats(),
      performance: {
        uptime: 15.2, // روز
        ramUsage: 68, // درصد
        cpuUsage: 42, // درصد
        ping: 24, // میلی‌ثانیه
        requestsPerMinute: 23,
      },
      games: await getGamesStats(),
    };
  } catch (error) {
    console.error('خطا در دریافت آمار سیستم:', error);
    return {};
  }
}

/**
 * دریافت آمار سیستم برای گزارش‌گیری
 * @param {Date} startDate تاریخ شروع
 * @param {Date} endDate تاریخ پایان
 * @returns {Promise<Object>} آمار سیستم
 */
export async function getSystemStatsForReport(startDate, endDate) {
  try {
    // TODO: پیاده‌سازی واقعی آمار سیستم برای گزارش‌گیری
    return {
      users: {
        newUsers: 125,
        activeUsers: 421,
        inactiveUsers: 78,
        bannedUsers: 12,
        totalUsers: 536,
      },
      economy: {
        totalTransactions: 1523,
        totalVolume: 1250000,
        avgTransactionValue: 821,
        topTransactionValue: 25000,
        bankDeposits: 350000,
        bankWithdrawals: 275000,
        shopPurchases: 420000,
        directTransfers: 205000,
      },
      games: {
        totalGamesPlayed: 3425,
        uniquePlayers: 213,
        topGame: 'بلک جک',
        totalBets: 850000,
        totalPrizes: 820000,
        houseEdge: 30000,
        mostProfitableGame: 'اسلات',
        mostPopularGame: 'بلک جک',
      },
    };
  } catch (error) {
    console.error('خطا در دریافت آمار سیستم برای گزارش‌گیری:', error);
    return {};
  }
}

/**
 * گزارش‌گیری از آمار سیستم
 * @param {Object} options تنظیمات گزارش‌گیری
 * @returns {Promise<Object>} گزارش
 */
export async function generateSystemReport(options = {}) {
  try {
    const defaultOptions = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 روز قبل
      endDate: new Date(),
      includeUsers: true,
      includeEconomy: true,
      includeGames: true,
      includePerformance: true,
      format: 'json', // json, csv, html
    };
    
    const reportOptions = { ...defaultOptions, ...options };
    
    // دریافت آمار سیستم
    const stats = await getSystemStatsForReport(reportOptions.startDate, reportOptions.endDate);
    
    // ساخت گزارش بر اساس فرمت درخواستی
    switch (reportOptions.format) {
      case 'csv':
        return generateCSVReport(stats, reportOptions);
      case 'html':
        return generateHTMLReport(stats, reportOptions);
      case 'json':
      default:
        return generateJSONReport(stats, reportOptions);
    }
  } catch (error) {
    console.error('خطا در گزارش‌گیری از آمار سیستم:', error);
    return { error: 'خطایی در گزارش‌گیری رخ داده است' };
  }
}

/**
 * ساخت گزارش JSON
 * @param {Object} stats آمار
 * @param {Object} options تنظیمات
 * @returns {Object} گزارش JSON
 */
function generateJSONReport(stats, options) {
  // فیلتر کردن آمار بر اساس تنظیمات
  const report = {
    reportGeneratedAt: new Date(),
    period: {
      startDate: options.startDate,
      endDate: options.endDate,
    },
    data: {},
  };
  
  if (options.includeUsers) {
    report.data.users = stats.users;
  }
  
  if (options.includeEconomy) {
    report.data.economy = stats.economy;
  }
  
  if (options.includeGames) {
    report.data.games = stats.games;
  }
  
  if (options.includePerformance) {
    report.data.performance = stats.performance;
  }
  
  return report;
}

/**
 * ساخت گزارش CSV
 * @param {Object} stats آمار
 * @param {Object} options تنظیمات
 * @returns {String} گزارش CSV
 */
function generateCSVReport(stats, options) {
  const csvParts = [];
  const reportDate = new Date().toISOString().split('T')[0];
  
  if (options.includeUsers && stats.users) {
    const usersData = [
      { category: 'کاربران', title: 'کاربران جدید', value: stats.users.newUsers },
      { category: 'کاربران', title: 'کاربران فعال', value: stats.users.activeUsers },
      { category: 'کاربران', title: 'کاربران غیرفعال', value: stats.users.inactiveUsers },
      { category: 'کاربران', title: 'کاربران مسدود شده', value: stats.users.bannedUsers },
      { category: 'کاربران', title: 'کل کاربران', value: stats.users.totalUsers },
    ];
    
    csvParts.push(commonService.arrayToCSV(usersData, ['category', 'title', 'value']));
  }
  
  if (options.includeEconomy && stats.economy) {
    const economyData = [
      { category: 'اقتصاد', title: 'تعداد تراکنش‌ها', value: stats.economy.totalTransactions },
      { category: 'اقتصاد', title: 'حجم تراکنش‌ها', value: stats.economy.totalVolume },
      { category: 'اقتصاد', title: 'میانگین تراکنش', value: stats.economy.avgTransactionValue },
      { category: 'اقتصاد', title: 'بیشترین تراکنش', value: stats.economy.topTransactionValue },
      { category: 'اقتصاد', title: 'سپرده‌های بانکی', value: stats.economy.bankDeposits },
      { category: 'اقتصاد', title: 'برداشت‌های بانکی', value: stats.economy.bankWithdrawals },
      { category: 'اقتصاد', title: 'خریدهای فروشگاه', value: stats.economy.shopPurchases },
      { category: 'اقتصاد', title: 'انتقال مستقیم', value: stats.economy.directTransfers },
    ];
    
    csvParts.push(commonService.arrayToCSV(economyData, ['category', 'title', 'value']));
  }
  
  if (options.includeGames && stats.games) {
    const gamesData = [
      { category: 'بازی‌ها', title: 'تعداد بازی‌ها', value: stats.games.totalGamesPlayed },
      { category: 'بازی‌ها', title: 'بازیکنان یکتا', value: stats.games.uniquePlayers },
      { category: 'بازی‌ها', title: 'محبوب‌ترین بازی', value: stats.games.topGame },
      { category: 'بازی‌ها', title: 'مجموع شرط‌ها', value: stats.games.totalBets },
      { category: 'بازی‌ها', title: 'مجموع جوایز', value: stats.games.totalPrizes },
      { category: 'بازی‌ها', title: 'سود سیستم', value: stats.games.houseEdge },
      { category: 'بازی‌ها', title: 'سودآورترین بازی', value: stats.games.mostProfitableGame },
      { category: 'بازی‌ها', title: 'پرطرفدارترین بازی', value: stats.games.mostPopularGame },
    ];
    
    csvParts.push(commonService.arrayToCSV(gamesData, ['category', 'title', 'value']));
  }
  
  return csvParts.join('\n');
}

/**
 * ساخت گزارش HTML
 * @param {Object} stats آمار
 * @param {Object} options تنظیمات
 * @returns {String} گزارش HTML
 */
function generateHTMLReport(stats, options) {
  // ساخت گزارش HTML
  let html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>گزارش سیستم CCOIN</title>
      <style>
        body {
          font-family: Tahoma, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .report-section {
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
          text-align: right;
        }
        th {
          background-color: #f2f2f2;
        }
        .period {
          font-size: 14px;
          color: #666;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>گزارش سیستم CCOIN</h1>
        <p class="period">دوره گزارش: ${new Date(options.startDate).toLocaleDateString('fa-IR')} تا ${new Date(options.endDate).toLocaleDateString('fa-IR')}</p>
        <p>تاریخ تولید گزارش: ${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR')}</p>
      </div>
  `;
  
  // بخش کاربران
  if (options.includeUsers && stats.users) {
    html += `
      <div class="report-section">
        <h2>آمار کاربران</h2>
        <table>
          <tr>
            <th>عنوان</th>
            <th>مقدار</th>
          </tr>
          <tr>
            <td>کاربران جدید</td>
            <td>${stats.users.newUsers}</td>
          </tr>
          <tr>
            <td>کاربران فعال</td>
            <td>${stats.users.activeUsers}</td>
          </tr>
          <tr>
            <td>کاربران غیرفعال</td>
            <td>${stats.users.inactiveUsers}</td>
          </tr>
          <tr>
            <td>کاربران مسدود شده</td>
            <td>${stats.users.bannedUsers}</td>
          </tr>
          <tr>
            <td>کل کاربران</td>
            <td>${stats.users.totalUsers}</td>
          </tr>
        </table>
      </div>
    `;
  }
  
  // بخش اقتصاد
  if (options.includeEconomy && stats.economy) {
    html += `
      <div class="report-section">
        <h2>آمار اقتصادی</h2>
        <table>
          <tr>
            <th>عنوان</th>
            <th>مقدار</th>
          </tr>
          <tr>
            <td>تعداد تراکنش‌ها</td>
            <td>${stats.economy.totalTransactions}</td>
          </tr>
          <tr>
            <td>حجم تراکنش‌ها</td>
            <td>${stats.economy.totalVolume.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>میانگین تراکنش</td>
            <td>${stats.economy.avgTransactionValue.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>بیشترین تراکنش</td>
            <td>${stats.economy.topTransactionValue.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>سپرده‌های بانکی</td>
            <td>${stats.economy.bankDeposits.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>برداشت‌های بانکی</td>
            <td>${stats.economy.bankWithdrawals.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>خریدهای فروشگاه</td>
            <td>${stats.economy.shopPurchases.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>انتقال مستقیم</td>
            <td>${stats.economy.directTransfers.toLocaleString()} CC</td>
          </tr>
        </table>
      </div>
    `;
  }
  
  // بخش بازی‌ها
  if (options.includeGames && stats.games) {
    html += `
      <div class="report-section">
        <h2>آمار بازی‌ها</h2>
        <table>
          <tr>
            <th>عنوان</th>
            <th>مقدار</th>
          </tr>
          <tr>
            <td>تعداد بازی‌ها</td>
            <td>${stats.games.totalGamesPlayed}</td>
          </tr>
          <tr>
            <td>بازیکنان یکتا</td>
            <td>${stats.games.uniquePlayers}</td>
          </tr>
          <tr>
            <td>محبوب‌ترین بازی</td>
            <td>${stats.games.topGame}</td>
          </tr>
          <tr>
            <td>مجموع شرط‌ها</td>
            <td>${stats.games.totalBets.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>مجموع جوایز</td>
            <td>${stats.games.totalPrizes.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>سود سیستم</td>
            <td>${stats.games.houseEdge.toLocaleString()} CC</td>
          </tr>
          <tr>
            <td>سودآورترین بازی</td>
            <td>${stats.games.mostProfitableGame}</td>
          </tr>
          <tr>
            <td>پرطرفدارترین بازی</td>
            <td>${stats.games.mostPopularGame}</td>
          </tr>
        </table>
      </div>
    `;
  }
  
  // پایان گزارش
  html += `
      <div class="footer">
        <p>این گزارش به صورت خودکار توسط سیستم CCOIN تولید شده است.</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

// آمار مبتنی بر زمان
export const statsService = {
  getGamesStats,
  getUserGamesStats,
  getSystemStats,
  getSystemStatsForReport,
  generateSystemReport,
};