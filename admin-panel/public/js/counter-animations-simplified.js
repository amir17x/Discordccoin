/**
 * Vision UI Dashboard - Counter Animations (Simplified version)
 * انیمیشن‌های شمارنده برای اعداد آماری
 */

document.addEventListener('DOMContentLoaded', function() {
  // راه‌اندازی شمارنده‌ها
  initCounters();
  
  // راه‌اندازی intersection observer برای شمارنده‌های داخل اسکرول
  initIntersectionObserver();
});

/**
 * راه‌اندازی شمارنده‌های آماری
 * این تابع همه المان‌های با کلاس counter را پیدا کرده و انیمیشن شمارش را روی آنها اعمال می‌کند
 */
function initCounters() {
  // شناسایی تمام شمارنده‌های موجود در صفحه
  const counters = document.querySelectorAll('.counter:not([data-counted="true"])');
  
  counters.forEach(counter => {
    // نشانه‌گذاری تا از شمارش مجدد جلوگیری شود
    counter.setAttribute('data-counted', 'true');
    
    // شمارش فوری (بدون تاخیر)
    countUp(counter);
  });
}

/**
 * راه‌اندازی Intersection Observer برای شروع شمارش هنگام نمایش عناصر
 */
function initIntersectionObserver() {
  // بررسی پشتیبانی مرورگر از Intersection Observer
  if (!('IntersectionObserver' in window)) {
    // در صورت عدم پشتیبانی، همه شمارنده‌ها را یکباره فعال می‌کنیم
    initCounters();
    return;
  }
  
  // شناسایی شمارنده‌های با کلاس .counter-on-scroll
  const scrollCounters = document.querySelectorAll('.counter-on-scroll:not([data-counted="true"])');
  
  // تنظیم آبزرور
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // شروع شمارش هنگام نمایش عنصر
      if (entry.isIntersecting) {
        const counter = entry.target;
        counter.setAttribute('data-counted', 'true');
        
        // شروع شمارش با تاخیر کوتاه
        setTimeout(function() {
          countUp(counter);
        }, 300);
        
        // حذف از آبزرور پس از شمارش
        observer.unobserve(counter);
      }
    });
  }, {
    threshold: 0.1, // المان حداقل 10% نمایان باشد
    rootMargin: '0px 0px -10% 0px' // حاشیه مجازی برای تشخیص
  });
  
  // افزودن المان‌ها به آبزرور
  scrollCounters.forEach(counter => {
    observer.observe(counter);
  });
}

/**
 * انیمیشن شمارش صعودی
 * @param {HTMLElement} counterElement - المان شمارنده
 */
function countUp(counterElement) {
  // دریافت مقدار نهایی از متن المان یا ویژگی data-target
  let target = counterElement.getAttribute('data-target');
  
  // اگر ویژگی data-target تعریف نشده، از متن المان استفاده می‌کنیم
  if (!target) {
    target = counterElement.textContent.replace(/,/g, '');
  }
  
  // تبدیل به عدد
  target = parseFloat(target.replace(/[^\d.-]/g, ''));
  
  // اگر مقدار نامعتبر است، از شمارش صرف نظر می‌کنیم
  if (isNaN(target)) {
    console.warn('Counter value is not a valid number:', counterElement.textContent);
    return;
  }
  
  // دریافت تنظیمات از ویژگی‌های data
  const duration = counterElement.getAttribute('data-duration') || 2000; // مدت زمان انیمیشن (میلی‌ثانیه)
  const decimals = counterElement.getAttribute('data-decimals') || 0; // تعداد ارقام اعشار
  const useGrouping = counterElement.getAttribute('data-grouping') !== 'false'; // استفاده از جداکننده هزارگان
  const separator = counterElement.getAttribute('data-separator') || ','; // جداکننده هزارگان
  const decimal = counterElement.getAttribute('data-decimal') || '.'; // جداکننده اعشار
  const prefix = counterElement.getAttribute('data-prefix') || ''; // پیشوند
  const suffix = counterElement.getAttribute('data-suffix') || ''; // پسوند
  
  // مقدار شروع (معمولاً صفر مگر اینکه مقدار دیگری تعیین شده باشد)
  let startValue = parseFloat(counterElement.getAttribute('data-start') || 0);
  
  // مقدار فعلی شمارنده
  let currentValue = startValue;
  
  // تنظیم متن اولیه
  counterElement.textContent = formatNumber(
    startValue,
    parseInt(decimals),
    useGrouping,
    separator,
    decimal,
    prefix,
    suffix
  );
  
  // زمان شروع
  const startTime = performance.now();
  
  // تابع قالب‌بندی اعداد با پشتیبانی از جداکننده هزارگان
  function formatNumber(num, decimals, useGrouping, separator, decimal, prefix, suffix) {
    const neg = num < 0 ? '-' : '';
    const result = Math.abs(num).toFixed(decimals);
    
    if (!useGrouping) {
      return prefix + neg + result + suffix;
    }
    
    const parts = result.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? decimal + parts[1] : '';
    
    // اضافه کردن جداکننده هزارگان
    let formattedInt = '';
    for (let i = 0; i < integerPart.length; i++) {
      if (i > 0 && (integerPart.length - i) % 3 === 0) {
        formattedInt += separator;
      }
      formattedInt += integerPart[i];
    }
    
    return prefix + neg + formattedInt + decimalPart + suffix;
  }
  
  // تابع انیمیشن با easeOutExpo
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }
  
  // تابع به‌روزرسانی مقدار در هر فریم
  function updateCounter(timestamp) {
    // محاسبه زمان سپری شده
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // محاسبه مقدار فعلی با تابع easing
    const easedProgress = easeOutExpo(progress);
    currentValue = startValue + easedProgress * (target - startValue);
    
    // به‌روزرسانی متن
    counterElement.textContent = formatNumber(
      currentValue,
      parseInt(decimals),
      useGrouping,
      separator,
      decimal,
      prefix,
      suffix
    );
    
    // ادامه انیمیشن تا اتمام زمان
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      // پس از اتمام انیمیشن، مقدار نهایی دقیق را نمایش می‌دهیم
      counterElement.textContent = formatNumber(
        target,
        parseInt(decimals),
        useGrouping,
        separator,
        decimal,
        prefix,
        suffix
      );
      
      // تغییر کلاس برای افکت تکمیل
      counterElement.classList.add('counter-complete');
      
      // رویداد کامل شدن شمارش
      if (typeof window.CustomEvent === 'function') {
        counterElement.dispatchEvent(new CustomEvent('countComplete', {
          bubbles: true,
          detail: { target: target }
        }));
      }
    }
  }
  
  // شروع انیمیشن
  requestAnimationFrame(updateCounter);
}

/**
 * شمارنده معکوس (نزولی)
 * @param {HTMLElement} counterElement - المان شمارنده
 */
function countDown(counterElement) {
  // دریافت مقدار هدف (مقدار پایانی) از ویژگی data-target
  let target = parseFloat(counterElement.getAttribute('data-target') || 0);
  
  // دریافت مقدار شروع از ویژگی data-start یا از متن المان
  let startValue = counterElement.getAttribute('data-start');
  if (!startValue) {
    startValue = counterElement.textContent.replace(/[^\d.-]/g, '');
  }
  startValue = parseFloat(startValue);
  
  // اگر مقادیر نامعتبر هستند، از شمارش صرف نظر می‌کنیم
  if (isNaN(target) || isNaN(startValue)) {
    console.warn('Invalid counter values for countdown');
    return;
  }
  
  // برای شمارش معکوس، مقادیر را مبادله می‌کنیم
  const temp = target;
  target = startValue;
  startValue = temp;
  
  // دریافت سایر تنظیمات
  const duration = counterElement.getAttribute('data-duration') || 2000;
  const decimals = counterElement.getAttribute('data-decimals') || 0;
  const useGrouping = counterElement.getAttribute('data-grouping') !== 'false';
  const separator = counterElement.getAttribute('data-separator') || ',';
  const decimal = counterElement.getAttribute('data-decimal') || '.';
  const prefix = counterElement.getAttribute('data-prefix') || '';
  const suffix = counterElement.getAttribute('data-suffix') || '';
  
  // اجرای شمارش با مقادیر جابجا شده
  counterElement.setAttribute('data-start', startValue);
  counterElement.setAttribute('data-target', target);
  counterElement.setAttribute('data-counted', 'false');
  
  // شروع شمارش معکوس
  countUp(counterElement);
}

/**
 * شمارش تصادفی (مقادیر متغیر)
 * مناسب برای نمایش اعداد در حال تغییر مثل بیت‌کوین
 * @param {HTMLElement} counterElement - المان شمارنده
 */
function randomCounter(counterElement) {
  // تنظیمات پیش‌فرض
  const min = parseFloat(counterElement.getAttribute('data-min') || 0);
  const max = parseFloat(counterElement.getAttribute('data-max') || 1000);
  const decimals = parseInt(counterElement.getAttribute('data-decimals') || 0);
  const useGrouping = counterElement.getAttribute('data-grouping') !== 'false';
  const separator = counterElement.getAttribute('data-separator') || ',';
  const decimal = counterElement.getAttribute('data-decimal') || '.';
  const prefix = counterElement.getAttribute('data-prefix') || '';
  const suffix = counterElement.getAttribute('data-suffix') || '';
  const interval = parseInt(counterElement.getAttribute('data-interval') || 2000);
  
  // مقدار فعلی
  let current = parseFloat(counterElement.textContent.replace(/[^\d.-]/g, '')) || min;
  
  // تابع فرمت‌کننده اعداد (مشابه تابع قبلی)
  function formatNumber(num) {
    const neg = num < 0 ? '-' : '';
    const result = Math.abs(num).toFixed(decimals);
    
    if (!useGrouping) {
      return prefix + neg + result + suffix;
    }
    
    const parts = result.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? decimal + parts[1] : '';
    
    let formattedInt = '';
    for (let i = 0; i < integerPart.length; i++) {
      if (i > 0 && (integerPart.length - i) % 3 === 0) {
        formattedInt += separator;
      }
      formattedInt += integerPart[i];
    }
    
    return prefix + neg + formattedInt + decimalPart + suffix;
  }
  
  // تولید مقدار تصادفی در بازه معین
  function generateRandomValue() {
    // تغییر تصادفی بین -5% تا +5% مقدار فعلی
    const changePercent = (Math.random() * 10 - 5) / 100;
    let newValue = current * (1 + changePercent);
    
    // محدود کردن به بازه مجاز
    newValue = Math.max(min, Math.min(max, newValue));
    
    return newValue;
  }
  
  // نمایش مقدار اولیه
  counterElement.textContent = formatNumber(current);
  
  // بروزرسانی دوره‌ای
  const updateInterval = setInterval(function() {
    const newValue = generateRandomValue();
    const oldValue = current;
    current = newValue;
    
    // تعیین کلاس برای افکت صعودی یا نزولی
    if (newValue > oldValue) {
      counterElement.classList.remove('value-down');
      counterElement.classList.add('value-up');
    } else if (newValue < oldValue) {
      counterElement.classList.remove('value-up');
      counterElement.classList.add('value-down');
    }
    
    // به‌روزرسانی مقدار
    counterElement.textContent = formatNumber(current);
    
    // حذف کلاس پس از مدتی
    setTimeout(function() {
      counterElement.classList.remove('value-up');
      counterElement.classList.remove('value-down');
    }, 1000);
    
  }, interval);
  
  // ذخیره شناسه زمان‌سنج برای توقف بعدی
  counterElement.setAttribute('data-interval-id', updateInterval);
  
  // ارائه دستگیره برای متوقف کردن
  return {
    stop: function() {
      clearInterval(updateInterval);
    }
  };
}

/**
 * انیمیشن تایپ برای نمایش کاراکتر به کاراکتر اعداد
 * مناسب برای نمایش اعداد بزرگ
 * @param {HTMLElement} counterElement - المان شمارنده
 */
function typeCounter(counterElement) {
  // دریافت مقدار نهایی
  const value = counterElement.getAttribute('data-target') || counterElement.textContent;
  const duration = parseInt(counterElement.getAttribute('data-duration') || 1000);
  const cursorChar = counterElement.getAttribute('data-cursor') || '|';
  
  // پاک کردن متن فعلی
  counterElement.textContent = '';
  
  // اضافه کردن نشانگر
  const cursor = document.createElement('span');
  cursor.className = 'counter-cursor';
  cursor.textContent = cursorChar;
  cursor.style.animation = 'blink 1s infinite step-end';
  
  // ایجاد استایل برای چشمک زدن نشانگر
  if (!document.getElementById('counter-cursor-style')) {
    const style = document.createElement('style');
    style.id = 'counter-cursor-style';
    style.textContent = "@keyframes blink { from, to { opacity: 1; } 50% { opacity: 0; } }";
    document.head.appendChild(style);
  }
  
  // اضافه کردن نشانگر به المان
  counterElement.appendChild(cursor);
  
  // زمان بین کاراکترها
  const charDuration = duration / value.length;
  
  // نمایش کاراکترها یکی یکی
  let index = 0;
  
  function typeNextChar() {
    if (index < value.length) {
      // ایجاد یک المان متنی و اضافه کردن آن قبل از نشانگر
      const char = document.createTextNode(value[index]);
      counterElement.insertBefore(char, cursor);
      index++;
      
      // تایپ کاراکتر بعدی با تاخیر
      setTimeout(typeNextChar, charDuration);
    } else {
      // حذف نشانگر در پایان
      setTimeout(function() {
        cursor.remove();
        counterElement.classList.add('counter-complete');
      }, 500);
    }
  }
  
  // شروع تایپ با کمی تاخیر
  setTimeout(typeNextChar, 300);
}

/**
 * شمارش به سمت نزدیکترین تایم استمپ آینده
 * مناسب برای نمایش شمارش معکوس رویدادها
 * @param {HTMLElement} timerElement - المان تایمر
 */
function countdownTimer(timerElement) {
  // دریافت زمان هدف از ویژگی data-target-date
  const targetDateStr = timerElement.getAttribute('data-target-date');
  if (!targetDateStr) {
    console.warn('No target date specified for countdown timer');
    return;
  }
  
  // تبدیل به آبجکت Date
  const targetDate = new Date(targetDateStr);
  
  // بررسی معتبر بودن تاریخ
  if (isNaN(targetDate.getTime())) {
    console.warn('Invalid target date for countdown timer:', targetDateStr);
    return;
  }
  
  // فرمت نمایش (پیش‌فرض: HH:MM:SS)
  const format = timerElement.getAttribute('data-format') || 'hms';
  
  // متن نمایش برای پایان شمارش
  const endText = timerElement.getAttribute('data-end-text') || 'پایان!';
  
  // شناسه زمان‌سنج برای متوقف کردن در پایان
  let timerId;
  
  // تابع به‌روزرسانی تایمر
  function updateTimer() {
    // زمان فعلی
    const now = new Date();
    
    // زمان باقی‌مانده (به میلی‌ثانیه)
    let timeRemaining = targetDate - now;
    
    // اگر زمان به پایان رسیده
    if (timeRemaining <= 0) {
      clearInterval(timerId);
      timerElement.textContent = endText;
      timerElement.classList.add('timer-ended');
      
      // رویداد پایان زمان
      if (typeof window.CustomEvent === 'function') {
        timerElement.dispatchEvent(new CustomEvent('timerEnded', {
          bubbles: true
        }));
      }
      
      return;
    }
    
    // محاسبه روز، ساعت، دقیقه و ثانیه
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    // تنظیم متن بر اساس فرمت درخواستی
    let timerText = '';
    
    if (format.includes('d') && days > 0) {
      timerText += days + ' روز ';
    }
    
    if (format.includes('h')) {
      timerText += hours.toString().padStart(2, '0') + ':';
    }
    
    if (format.includes('m')) {
      timerText += minutes.toString().padStart(2, '0') + ':';
    }
    
    if (format.includes('s')) {
      timerText += seconds.toString().padStart(2, '0');
    }
    
    // حذف : اضافی در انتها
    timerText = timerText.replace(/:$/, '');
    
    // نمایش زمان باقی‌مانده
    timerElement.textContent = timerText;
    
    // افزودن کلاس برای هر پالس
    timerElement.classList.add('timer-pulse');
    setTimeout(function() {
      timerElement.classList.remove('timer-pulse');
    }, 200);
  }
  
  // فراخوانی اولیه
  updateTimer();
  
  // به‌روزرسانی هر ثانیه
  timerId = setInterval(updateTimer, 1000);
  
  // ذخیره شناسه برای توقف احتمالی بعدی
  timerElement.setAttribute('data-timer-id', timerId);
  
  // ارائه دستگیره برای متوقف کردن
  return {
    stop: function() {
      clearInterval(timerId);
    }
  };
}

// افزودن متدها به window برای دسترسی مستقیم
window.visionUiCounters = {
  countUp: countUp,
  countDown: countDown,
  randomCounter: randomCounter,
  typeCounter: typeCounter,
  countdownTimer: countdownTimer,
  initCounters: initCounters
};