/**
 * اسکریپت اصلاح مدل‌های مونگوس
 * 
 * این اسکریپت همه فایل‌های مدل در پوشه admin/models را اصلاح می‌کند 
 * به طوری که از تعریف مجدد مدل‌ها جلوگیری شود.
 */

import fs from 'fs';
import path from 'path';

// چون اسکریپت در admin/scripts اجرا می‌شود، به یک سطح بالاتر می‌رویم
const modelsDir = path.join(process.cwd(), '..', 'models');

// الگوی RegExp برای یافتن خط export const
const exportPattern = /export\s+const\s+(\w+)\s*=\s*mongoose\.model\(['"](\w+)['"]/;

// الگوی اصلاح شده
const replacementTemplate = (modelName) => 
  `export const ${modelName} = mongoose.models.${modelName} || mongoose.model('${modelName}'`;

// پردازش همه فایل‌های JS در پوشه models
function processModelsDirectory() {
  fs.readdir(modelsDir, (err, files) => {
    if (err) {
      console.error('خطا در خواندن پوشه مدل‌ها:', err);
      return;
    }

    // فیلتر کردن فقط فایل‌های JS
    const jsFiles = files.filter(file => file.endsWith('.js'));

    let changedCount = 0;

    jsFiles.forEach(file => {
      const filePath = path.join(modelsDir, file);
      
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`خطا در خواندن فایل ${file}:`, err);
          return;
        }

        // جستجو برای الگوی export const
        const match = data.match(exportPattern);
        if (match) {
          const modelVarName = match[1];
          const modelName = match[2];
          
          // ساخت الگوی جایگزینی دقیق
          const exactExportPattern = new RegExp(`export\\s+const\\s+${modelVarName}\\s*=\\s*mongoose\\.model\\(['"]${modelName}['"]`, 'g');
          
          // جایگزینی با الگوی اصلاح شده
          const newContent = data.replace(
            exactExportPattern, 
            `export const ${modelVarName} = mongoose.models.${modelName} || mongoose.model('${modelName}'`
          );

          // اگر محتوا تغییر کرده باشد، فایل را به‌روزرسانی می‌کنیم
          if (newContent !== data) {
            fs.writeFile(filePath, newContent, 'utf8', (err) => {
              if (err) {
                console.error(`خطا در نوشتن فایل ${file}:`, err);
                return;
              }
              console.log(`✅ فایل ${file} اصلاح شد.`);
              changedCount++;
            });
          } else {
            console.log(`⏩ فایل ${file} نیازی به اصلاح ندارد.`);
          }
        } else {
          console.log(`⚠️ الگوی مورد نظر در فایل ${file} یافت نشد.`);
        }
      });
    });

    console.log(`📝 تعداد کل فایل‌های JS: ${jsFiles.length}`);
    console.log(`✅ تعداد فایل‌های اصلاح شده: ${changedCount}`);
  });
}

// اجرای اصلی
processModelsDirectory();