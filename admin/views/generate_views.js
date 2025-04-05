/**
 * اسکریپت تولید فایل‌های قالب EJS
 * این اسکریپت فایل‌های متنی را از پوشه temp خوانده و به فایل‌های EJS در پوشه views تبدیل می‌کند
 */

const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(__dirname, 'temp');
const VIEWS_DIR = __dirname;

// بررسی وجود پوشه‌ها
if (!fs.existsSync(TEMP_DIR)) {
  console.error('پوشه temp وجود ندارد. لطفاً آن را ایجاد کنید.');
  process.exit(1);
}

// خواندن همه فایل‌های موجود در پوشه temp
fs.readdir(TEMP_DIR, (err, files) => {
  if (err) {
    console.error('خطا در خواندن پوشه temp:', err);
    return;
  }
  
  // پردازش هر فایل
  files.forEach(file => {
    if (file.endsWith('.txt')) {
      const sourcePath = path.join(TEMP_DIR, file);
      const targetName = file.replace('.txt', '.ejs');
      const targetPath = path.join(VIEWS_DIR, targetName);
      
      // خواندن محتوای فایل
      fs.readFile(sourcePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`خطا در خواندن فایل ${file}:`, err);
          return;
        }
        
        // نوشتن فایل EJS
        fs.writeFile(targetPath, data, 'utf8', err => {
          if (err) {
            console.error(`خطا در ایجاد فایل ${targetName}:`, err);
            return;
          }
          
          console.log(`فایل ${targetName} با موفقیت ایجاد شد.`);
        });
      });
    }
  });
});

console.log('شروع فرآیند تبدیل فایل‌های قالب...');