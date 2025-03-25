/**
 * توابع کمکی برای پنل مدیریت Ccoin
 */

/**
 * فرمت کردن اعداد به صورت سه رقمی با جداکننده
 * @param {number} number عدد مورد نظر
 * @return {string} رشته فرمت شده
 */
function formatNumber(number) {
  if (number === undefined || number === null) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * فرمت کردن تاریخ به شمسی
 * @param {string|Date} dateString تاریخ به صورت رشته یا شئ تاریخ
 * @return {string} تاریخ شمسی
 */
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  // تبدیل به تاریخ شمسی با استفاده از API داخلی جاوااسکریپت
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return new Intl.DateTimeFormat('fa-IR', options).format(date);
  } catch (e) {
    // اگر تبدیل با خطا مواجه شد، فرمت استاندارد را برگردان
    return date.toLocaleDateString();
  }
}

/**
 * فرمت کردن تاریخ به همراه زمان
 * @param {string|Date} dateString تاریخ به صورت رشته یا شئ تاریخ
 * @return {string} تاریخ و زمان شمسی
 */
function formatDateTime(dateString) {
  if (!dateString) return '';
  
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  // تبدیل به تاریخ و زمان شمسی
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat('fa-IR', options).format(date);
  } catch (e) {
    // اگر تبدیل با خطا مواجه شد، فرمت استاندارد را برگردان
    return date.toLocaleString();
  }
}

/**
 * نمایش زمان نسبی (مثلاً "3 دقیقه پیش")
 * @param {string|Date} dateString تاریخ به صورت رشته یا شئ تاریخ
 * @return {string} زمان نسبی
 */
function timeAgo(dateString) {
  if (!dateString) return '';
  
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  // اگر زمان آینده باشد
  if (seconds < 0) {
    return 'به زودی';
  }
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval + ' سال پیش';
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval + ' ماه پیش';
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval + ' روز پیش';
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + ' ساعت پیش';
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval + ' دقیقه پیش';
  }
  
  if (seconds < 10) {
    return 'همین الان';
  }
  
  return Math.floor(seconds) + ' ثانیه پیش';
}

/**
 * کوتاه کردن رشته‌های طولانی و افزودن ... به انتهای آن
 * @param {string} text متن ورودی
 * @param {number} maxLength حداکثر طول مجاز
 * @return {string} متن کوتاه شده
 */
function truncateText(text, maxLength = 100) {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * تبدیل مسیر نسبی فایل به URL کامل
 * @param {string} path مسیر نسبی فایل
 * @return {string} URL کامل
 */
function assetUrl(path) {
  if (!path) return '';
  
  // اگر مسیر با https یا http شروع شود، آن را به عنوان URL کامل برگردان
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // در غیر این صورت، آن را به عنوان مسیر نسبی در نظر بگیر
  // مسیر را از اسلش شروع کن تا از ریشه سایت شروع شود
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  return '/admin' + path;
}

/**
 * نمایش اندازه فایل به صورت خوانا (KB, MB, etc.)
 * @param {number} bytes حجم فایل به بایت
 * @param {number} decimals تعداد ارقام اعشار
 * @return {string} اندازه فایل به صورت خوانا
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 بایت';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت', 'ترابایت'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * تبدیل رشته‌های json به format شده
 * @param {object} obj شیء جاوااسکریپت
 * @return {string} JSON فرمت شده
 */
function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return '';
  }
}

/**
 * ایجاد نوار پیشرفت
 * @param {number} percent درصد پیشرفت
 * @param {string} type نوع پیشرفت (success, info, warning, danger)
 * @return {string} HTML نوار پیشرفت
 */
function progressBar(percent, type = 'primary') {
  const validPercent = Math.min(100, Math.max(0, percent));
  return `<div class="progress">
    <div class="progress-bar bg-${type}" role="progressbar" style="width: ${validPercent}%" 
      aria-valuenow="${validPercent}" aria-valuemin="0" aria-valuemax="100">${validPercent}%</div>
  </div>`;
}

/**
 * تبدیل رنگ هگز به RGB
 * @param {string} hex کد رنگ هگز
 * @return {object} اجزای RGB
 */
function hexToRgb(hex) {
  // حذف # از ابتدای کد رنگ
  hex = hex.replace(/^#/, '');
  
  // تبدیل کد رنگ کوتاه به فرمت کامل
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // استخراج مقادیر RGB
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * رندر آیکون با فونت‌آوسم
 * @param {string} icon نام آیکون
 * @param {string} style سبک آیکون (solid, regular, brands)
 * @param {string} size اندازه آیکون (xs, sm, lg, etc.)
 * @return {string} HTML آیکون
 */
function renderIcon(icon, style = 'fas', size = '') {
  const sizeClass = size ? `fa-${size}` : '';
  return `<i class="${style} fa-${icon} ${sizeClass}"></i>`;
}

/**
 * تولید رنگ برای نمودارها
 * @param {number} index شماره رنگ
 * @param {number} alpha شفافیت (0-1)
 * @return {string} رنگ RGBA
 */
function generateChartColor(index, alpha = 0.8) {
  const colors = [
    '114, 76, 255',     // بنفش (primary)
    '40, 167, 69',      // سبز (success)
    '23, 162, 184',     // آبی روشن (info)
    '255, 193, 7',      // زرد (warning)
    '220, 53, 69',      // قرمز (danger)
    '108, 117, 125',    // خاکستری (secondary)
    '38, 198, 218',     // فیروزه‌ای
    '156, 39, 176',     // بنفش تیره
    '233, 30, 99',      // صورتی
    '0, 150, 136',      // سبز تیره
    '255, 87, 34',      // نارنجی
    '121, 85, 72'       // قهوه‌ای
  ];
  
  const colorIndex = index % colors.length;
  return `rgba(${colors[colorIndex]}, ${alpha})`;
}

/**
 * اعتبارسنجی ایمیل
 * @param {string} email آدرس ایمیل
 * @return {boolean} آیا ایمیل معتبر است
 */
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * بررسی امن بودن رمز عبور
 * @param {string} password رمز عبور
 * @return {object} نتیجه بررسی امنیت
 */
function checkPasswordStrength(password) {
  let strength = 0;
  const result = { 
    strength: 0, 
    message: '', 
    isStrong: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    isLongEnough: false
  };
  
  if (!password) return result;
  
  // بررسی طول رمز عبور
  if (password.length >= 8) {
    strength += 1;
    result.isLongEnough = true;
  }
  
  // بررسی وجود حروف بزرگ
  if (/[A-Z]/.test(password)) {
    strength += 1;
    result.hasUpper = true;
  }
  
  // بررسی وجود حروف کوچک
  if (/[a-z]/.test(password)) {
    strength += 1;
    result.hasLower = true;
  }
  
  // بررسی وجود اعداد
  if (/[0-9]/.test(password)) {
    strength += 1;
    result.hasNumber = true;
  }
  
  // بررسی وجود کاراکترهای ویژه
  if (/[^A-Za-z0-9]/.test(password)) {
    strength += 1;
    result.hasSpecial = true;
  }
  
  result.strength = strength;
  
  // تعیین پیام مناسب
  if (strength < 2) {
    result.message = 'ضعیف';
  } else if (strength < 4) {
    result.message = 'متوسط';
  } else {
    result.message = 'قوی';
    result.isStrong = true;
  }
  
  return result;
}

// صادر کردن توابع
module.exports = {
  formatNumber,
  formatDate,
  formatDateTime,
  timeAgo,
  truncateText,
  assetUrl,
  formatBytes,
  prettyJson,
  progressBar,
  hexToRgb,
  renderIcon,
  generateChartColor,
  validateEmail,
  checkPasswordStrength
};