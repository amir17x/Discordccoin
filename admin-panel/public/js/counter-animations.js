/**
 * Vision UI Dashboard - Counter Animation Functions
 * برای انیمیشن اعداد آماری در داشبورد
 */

// تابع اجرای انیمیشن شمارنده برای یک المان
function animateCounter(element, finalValue, duration = 1500, formatter = null) {
  if (!element) return;
  
  // مقدار اولیه
  let startValue = 0;
  let startTime = null;
  
  // تنظیم فرمتر پیش‌فرض
  if (!formatter) {
    formatter = (val) => val.toLocaleString();
  }
  
  // تابع انیمیشن
  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    
    // محاسبه زمان سپری‌شده
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // محاسبه مقدار فعلی با استفاده از تابع easeOutQuart برای حرکت طبیعی‌تر
    const currentValue = startValue + (easeOutQuart(progress) * (finalValue - startValue));
    
    // نمایش مقدار با فرمت مناسب
    element.textContent = formatter(Math.floor(currentValue));
    
    // ادامه انیمیشن تا پایان
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // تنظیم مقدار نهایی دقیق در انتهای انیمیشن
      element.textContent = formatter(finalValue);
    }
  }
  
  // شروع انیمیشن
  requestAnimationFrame(animate);
}

// تابع easeOutQuart برای حرکت طبیعی‌تر انیمیشن
function easeOutQuart(x) {
  return 1 - Math.pow(1 - x, 4);
}

// تابع فرمت‌کننده اعداد به صورت پول
function currencyFormatter(val) {
  return val.toLocaleString();
}

// تابع شروع انیمیشن برای همه کارت‌های آماری در صفحه
function initStatCardAnimations() {
  // اجرای با تاخیر برای اطمینان از رندر کامل المان‌ها
  setTimeout(() => {
    // انتخاب همه المان‌های دارای مقدار آماری
    const statValueElements = document.querySelectorAll('.stat-value');
    
    statValueElements.forEach(element => {
      const finalValue = parseInt(element.getAttribute('data-value'), 10);
      
      if (element.classList.contains('currency')) {
        animateCounter(element, finalValue, 2000, currencyFormatter);
      } else {
        animateCounter(element, finalValue);
      }
    });
    
    // انیمیشن برای عناصر فرعی که نیاز به شمارش دارند
    const subStatElements = document.querySelectorAll('.stat-sub span[data-value]');
    
    subStatElements.forEach(element => {
      const finalValue = parseInt(element.getAttribute('data-value'), 10);
      
      if (element.classList.contains('currency')) {
        animateCounter(element, finalValue, 1500, currencyFormatter);
      } else {
        animateCounter(element, finalValue, 1200);
      }
    });
    
  }, 300);
}

// شروع انیمیشن‌ها بعد از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
  initStatCardAnimations();
});