/**
 * کلاس متودهای فرمت‌دهی برای پنل مدیریت
 * - فرمت عدد به صورت سه رقم سه رقم
 * - فرمت تاریخ به صورت شمسی
 * - فرمت اشیاء به رشته
 * - فرمت پول
 * - فرمت زمان نسبی
 */

/**
 * فرمت‌کننده عمومی مقادیر
 * این تابع انواع مختلف داده را تشخیص می‌دهد و فرمت مناسب را اعمال می‌کند
 * 
 * @param {any} value - مقدار برای فرمت شدن
 * @param {string} type - نوع فرمت (اختیاری: 'number', 'date', 'currency', 'relative', 'percent')
 * @param {Object} options - تنظیمات اضافی
 * @returns {string} - مقدار فرمت شده
 */
function format(value, type, options = {}) {
    if (value === null || value === undefined) {
        return '-';
    }
    
    // تشخیص نوع داده اگر نوع مشخص نشده باشد
    if (!type) {
        if (typeof value === 'number') {
            type = 'number';
        } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
            type = 'date';
        } else if (typeof value === 'object') {
            return formatObject(value);
        }
    }
    
    // اعمال فرمت مناسب
    switch (type) {
        case 'number':
            return formatNumber(value, options);
        case 'date':
            return formatDate(value, options);
        case 'currency':
            return formatCurrency(value, options);
        case 'relative':
            return formatRelativeTime(value);
        case 'percent':
            return formatPercent(value, options);
        default:
            // اگر رشته باشد و بیش از 100 کاراکتر، کوتاه می‌کنیم
            if (typeof value === 'string' && value.length > 100 && !options.fullText) {
                return value.substring(0, 100) + '...';
            }
            return String(value);
    }
}

/**
 * فرمت‌دهی اعداد با جداکننده هزارگان
 * 
 * @param {number} num - عدد
 * @param {Object} options - تنظیمات
 * @returns {string} - عدد فرمت شده
 */
function formatNumber(num, options = {}) {
    if (isNaN(num)) return '-';
    
    const precision = options.precision !== undefined ? options.precision : 0;
    const useGrouping = options.useGrouping !== undefined ? options.useGrouping : true;
    
    try {
        return Number(num).toLocaleString('fa-IR', {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
            useGrouping: useGrouping
        });
    } catch (e) {
        // پشتیبانی از مرورگرهای قدیمی
        const parts = Number(num).toFixed(precision).toString().split('.');
        if (useGrouping) {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        return parts.join('.');
    }
}

/**
 * فرمت‌دهی مقدار پولی
 * 
 * @param {number} amount - مقدار
 * @param {Object} options - تنظیمات
 * @returns {string} - مقدار پولی فرمت شده
 */
function formatCurrency(amount, options = {}) {
    if (isNaN(amount)) return '-';
    
    const precision = options.precision !== undefined ? options.precision : 0;
    const currency = options.currency || 'Ccoin';
    const position = options.position || 'after';
    
    const formattedAmount = formatNumber(amount, { precision });
    
    return position === 'before' 
        ? `${currency} ${formattedAmount}`
        : `${formattedAmount} ${currency}`;
}

/**
 * فرمت درصد
 * 
 * @param {number} value - مقدار (0 تا 1 یا بزرگتر)
 * @param {Object} options - تنظیمات
 * @returns {string} - درصد فرمت شده
 */
function formatPercent(value, options = {}) {
    if (isNaN(value)) return '-';
    
    const precision = options.precision !== undefined ? options.precision : 1;
    
    // تبدیل به درصد اگر بین 0 و 1 باشد
    const percentValue = value > 0 && value < 1 ? value * 100 : value;
    
    return formatNumber(percentValue, { precision }) + '%';
}

/**
 * فرمت‌دهی تاریخ به شمسی یا میلادی
 * 
 * @param {Date|string} date - تاریخ
 * @param {Object} options - تنظیمات
 * @returns {string} - تاریخ فرمت شده
 */
function formatDate(date, options = {}) {
    if (!date) return '-';
    
    try {
        let dateObj = date;
        if (!(date instanceof Date)) {
            dateObj = new Date(date);
        }
        
        if (isNaN(dateObj.getTime())) {
            return 'تاریخ نامعتبر';
        }
        
        const format = options.format || 'short';
        const calendar = options.calendar || 'persian';
        const includeTime = options.includeTime !== undefined ? options.includeTime : true;
        
        if (calendar === 'persian') {
            try {
                // استفاده از کتابخانه جلالی برای تاریخ شمسی
                return formatPersianDate(dateObj, format, includeTime);
            } catch (e) {
                console.error('Error formatting Persian date:', e);
                // بازگشت به فرمت عادی در صورت خطا
                return formatGregorianDate(dateObj, format, includeTime);
            }
        } else {
            return formatGregorianDate(dateObj, format, includeTime);
        }
    } catch (e) {
        console.error('Error in formatDate:', e);
        return 'خطا در فرمت تاریخ';
    }
}

/**
 * فرمت تاریخ میلادی
 * 
 * @param {Date} date - تاریخ
 * @param {string} format - فرمت (short, medium, long)
 * @param {boolean} includeTime - شامل زمان باشد
 * @returns {string} - تاریخ فرمت شده
 */
function formatGregorianDate(date, format, includeTime) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // فرمت‌های مختلف
    let result = '';
    switch (format) {
        case 'short':
            result = `${year}/${month}/${day}`;
            break;
        case 'medium':
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            result = `${day} ${monthNames[date.getMonth()]} ${year}`;
            break;
        case 'long':
            const longMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                   'July', 'August', 'September', 'October', 'November', 'December'];
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            result = `${weekdays[date.getDay()]}, ${day} ${longMonthNames[date.getMonth()]} ${year}`;
            break;
        default:
            result = `${year}/${month}/${day}`;
    }
    
    // اضافه کردن زمان
    if (includeTime) {
        result += ` ${hours}:${minutes}`;
    }
    
    return result;
}

/**
 * فرمت تاریخ شمسی
 * 
 * @param {Date} date - تاریخ
 * @param {string} format - فرمت (short, medium, long)
 * @param {boolean} includeTime - شامل زمان باشد
 * @returns {string} - تاریخ شمسی فرمت شده
 */
function formatPersianDate(date, format, includeTime) {
    // تبدیل تاریخ میلادی به شمسی (ساده)
    function toJalaali(gy, gm, gd) {
        var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var jy = (gy <= 1600) ? 0 : 979;
        gy -= (gy <= 1600) ? 621 : 1600;
        var gy2 = (gm > 2) ? (gy + 1) : gy;
        var days = (365 * gy) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) + (parseInt((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
        jy += 33 * (parseInt(days / 12053));
        days %= 12053;
        jy += 4 * (parseInt(days / 1461));
        days %= 1461;
        jy += parseInt((days - 1) / 365);
        if (days > 365) days = (days - 1) % 365;
        var jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
        var jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        return [jy, jm, jd];
    }
    
    // تبدیل تاریخ میلادی به شمسی
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();
    const persian = toJalaali(gy, gm, gd);
    const jy = persian[0];
    const jm = persian[1];
    const jd = persian[2];
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // ساخت رشته‌های فارسی اعداد
    const toPersianNum = (num) => {
        const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/[0-9]/g, c => persian[parseInt(c)]);
    };
    
    const jyStr = toPersianNum(jy);
    const jmStr = toPersianNum(jm);
    const jdStr = toPersianNum(jd);
    const hoursStr = toPersianNum(hours);
    const minutesStr = toPersianNum(minutes);
    
    // فرمت‌های مختلف
    let result = '';
    switch (format) {
        case 'short':
            result = `${jyStr}/${jmStr}/${jdStr}`;
            break;
        case 'medium':
            const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
                               'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            result = `${jdStr} ${monthNames[jm - 1]} ${jyStr}`;
            break;
        case 'long':
            const longMonthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
                                   'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            // محاسبه روز هفته
            const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
            result = `${weekdays[date.getDay()]}, ${jdStr} ${longMonthNames[jm - 1]} ${jyStr}`;
            break;
        default:
            result = `${jyStr}/${jmStr}/${jdStr}`;
    }
    
    // اضافه کردن زمان
    if (includeTime) {
        result += ` - ${hoursStr}:${minutesStr}`;
    }
    
    return result;
}

/**
 * فرمت زمان نسبی (مثل "3 دقیقه پیش")
 * 
 * @param {Date|string} date - تاریخ
 * @returns {string} - زمان نسبی فرمت شده
 */
function formatRelativeTime(date) {
    if (!date) return '-';
    
    try {
        let dateObj = date;
        if (!(date instanceof Date)) {
            dateObj = new Date(date);
        }
        
        if (isNaN(dateObj.getTime())) {
            return 'زمان نامعتبر';
        }
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - dateObj) / 1000);
        
        // واحدهای زمانی به فارسی
        if (diffInSeconds < 60) {
            return 'همین الان';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} دقیقه پیش`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ساعت پیش`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} روز پیش`;
        } else if (diffInSeconds < 2592000) {
            const weeks = Math.floor(diffInSeconds / 604800);
            return `${weeks} هفته پیش`;
        } else if (diffInSeconds < 31536000) {
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months} ماه پیش`;
        } else {
            const years = Math.floor(diffInSeconds / 31536000);
            return `${years} سال پیش`;
        }
    } catch (e) {
        console.error('Error in formatRelativeTime:', e);
        return 'خطا در محاسبه زمان';
    }
}

/**
 * فرمت‌دهی آبجکت به رشته
 * 
 * @param {Object} obj - آبجکت
 * @returns {string} - رشته فرمت شده
 */
function formatObject(obj) {
    if (!obj) return '-';
    
    try {
        // اگر آبجکت تهی باشد
        if (Object.keys(obj).length === 0) {
            return '{}';
        }
        
        // اگر آرایه باشد
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            
            // نمایش 3 آیتم اول و بقیه را ... می‌کنیم
            const maxItems = 3;
            const items = obj.slice(0, maxItems).map(item => {
                if (typeof item === 'object' && item !== null) {
                    return '{...}';
                }
                return String(item);
            });
            
            if (obj.length > maxItems) {
                items.push('...');
            }
            
            return `[${items.join(', ')}]`;
        }
        
        // معرفی کلاس یا آبجکت
        let className = obj.constructor && obj.constructor.name !== 'Object' 
            ? obj.constructor.name + ' ' 
            : '';
        
        // محدود کردن تعداد پراپرتی‌ها
        const maxProps = 3;
        const props = Object.keys(obj).slice(0, maxProps).map(key => {
            const value = obj[key];
            if (typeof value === 'object' && value !== null) {
                return `${key}: {...}`;
            }
            return `${key}: ${value}`;
        });
        
        if (Object.keys(obj).length > maxProps) {
            props.push('...');
        }
        
        return `${className}{${props.join(', ')}}`;
    } catch (e) {
        console.error('Error in formatObject:', e);
        return String(obj);
    }
}

/**
 * ایجاد نوار پیشرفت متنی
 * 
 * @param {number} percent - درصد پیشرفت (0-100)
 * @param {number} length - طول نوار
 * @returns {string} - نوار پیشرفت با کاراکتر
 */
function createProgressBar(percent, length = 10) {
    if (isNaN(percent)) return '[----------]';
    
    const p = Math.min(100, Math.max(0, percent)); // اطمینان از محدوده بین 0 تا 100
    const filled = Math.round((p / 100) * length);
    const empty = length - filled;
    
    return '[' + '▓'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * تبدیل ثانیه به فرمت زمانی خوانا
 * 
 * @param {number} seconds - ثانیه
 * @returns {string} - زمان فرمت شده
 */
function formatTimeFromSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// صادر کردن توابع
module.exports = {
    format,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    formatPercent,
    formatObject,
    createProgressBar,
    formatTimeFromSeconds
};