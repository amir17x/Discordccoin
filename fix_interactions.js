/**
 * این اسکریپت به ما کمک می‌کند تا تمام interaction.reply ها را به interaction.update تبدیل کنیم
 * همچنین بررسی می‌کند که آیا مشکلی در تبدیل وجود دارد یا خیر
 */

const fs = require('fs');
const path = require('path');

// لیست فایل‌هایی که باید بررسی شوند
const filesToFix = [
  'server/discord/components/economyMenu.ts',
  'server/discord/components/robberyMenu.ts',
  'server/discord/components/mainMenu.ts',
  'server/discord/components/gamesMenu.ts',
  'server/discord/components/investmentMenu.ts',
  'server/discord/handlers/buttonHandler.ts',
  'server/discord/handlers/modalHandler.ts',
];

// الگوی جستجو برای یافتن interaction.reply
const replyPattern = /await\s+interaction\.reply\s*\(/g;

// الگوی جایگزینی
const replacePattern = `
if ('update' in interaction && typeof interaction.update === 'function') {
  try {
    await interaction.update(`;

const replacePatternEnd = `);
  } catch (e) {
    await interaction.reply(`;

const replacePatternFinal = `);
  }
} else {
  await interaction.reply(`;

// تابع اصلی برای بررسی و اصلاح فایل‌ها
function processFiles() {
  filesToFix.forEach(filePath => {
    try {
      console.log(`بررسی فایل: ${filePath}`);
      
      // خواندن محتوای فایل
      const content = fs.readFileSync(filePath, 'utf8');
      
      // شمارش تعداد interaction.reply در فایل
      const matches = content.match(replyPattern);
      const count = matches ? matches.length : 0;
      
      console.log(`تعداد interaction.reply یافت شده: ${count}`);
      
      if (count > 0) {
        console.log(`وارد بخش اصلاح فایل ${filePath} می‌شویم...`);
        // این قسمت را برای ایجاد اسکریپت دستی به کار می‌بریم
        console.log(`دستورات دستی برای اصلاح:`);
        
        // خطوط فایل را جدا می‌کنیم
        const lines = content.split('\n');
        
        // شماره خط‌های حاوی interaction.reply را پیدا می‌کنیم
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('await interaction.reply(')) {
            console.log(`خط ${i+1}: ${lines[i].trim()}`);
            
            // بررسی می‌کنیم آیا این یک بلوک کامل است یا ادامه دارد
            let j = i;
            let openBraces = 0;
            let closeBraces = 0;
            let block = [];
            
            // شروع بلوک را پیدا می‌کنیم
            while (j < lines.length) {
              block.push(lines[j]);
              
              // شمارش آکولاد‌های باز و بسته
              for (let char of lines[j]) {
                if (char === '{') openBraces++;
                if (char === '}') closeBraces++;
              }
              
              // اگر تعداد آکولاد‌های باز و بسته برابر شد، از حلقه خارج می‌شویم
              if (openBraces > 0 && openBraces === closeBraces) {
                break;
              }
              
              j++;
            }
            
            console.log(`بلوک کامل (${block.length} خط):`);
            console.log(block.join('\n'));
            console.log('----------------------------------------');
          }
        }
      }
      
    } catch (error) {
      console.error(`خطا در بررسی فایل ${filePath}:`, error);
    }
  });
}

// اجرای اسکریپت
processFiles();