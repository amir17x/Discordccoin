/**
 * Vision UI Dashboard - Theme Switcher Script
 * تغییر پویای طرح رنگی با انتقال‌های نرم
 */

document.addEventListener('DOMContentLoaded', function() {
  initThemeSwitcher();
});

/**
 * راه‌اندازی سیستم تغییر تم
 */
function initThemeSwitcher() {
  // ایجاد دکمه تغییر تم
  createThemeSwitcherButton();
  
  // ایجاد پاپ‌آپ تغییر تم
  createThemeSwitcherPopup();
  
  // بررسی تم ذخیره‌شده در لوکال استوریج
  loadSavedTheme();
  
  // رویدادهای کلیک روی دکمه و پاپ‌آپ
  setupThemeSwitcherEvents();
}

/**
 * ایجاد دکمه تغییر تم
 */
function createThemeSwitcherButton() {
  // بررسی وجود دکمه قبلی
  if (document.querySelector('.theme-switcher-btn')) return;
  
  const button = document.createElement('button');
  button.className = 'theme-switcher-btn';
  button.setAttribute('title', 'تغییر تم');
  button.innerHTML = '<i class="bi bi-brush"></i>';
  
  document.body.appendChild(button);
}

/**
 * ایجاد پاپ‌آپ تغییر تم
 */
function createThemeSwitcherPopup() {
  // بررسی وجود پاپ‌آپ قبلی
  if (document.querySelector('.theme-switcher-popup')) return;
  
  const popup = document.createElement('div');
  popup.className = 'theme-switcher-popup';
  
  popup.innerHTML = `
    <h5>تم داشبورد</h5>
    <div class="theme-options">
      <div class="theme-option dark active" data-theme="dark" title="تم تیره"></div>
      <div class="theme-option light" data-theme="light" title="تم روشن"></div>
      <div class="theme-option purple" data-theme="purple" title="تم بنفش"></div>
      <div class="theme-option blue" data-theme="blue" title="تم آبی"></div>
    </div>
    <div>
      <button class="apply-theme">اعمال</button>
      <button class="close-popup">بستن</button>
    </div>
  `;
  
  document.body.appendChild(popup);
}

/**
 * بارگذاری تم ذخیره شده از لوکال استوریج
 */
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('vui-dashboard-theme');
  
  if (savedTheme) {
    applyTheme(savedTheme);
    
    // فعال کردن گزینه تم مناسب در پاپ‌آپ
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-theme') === savedTheme) {
        option.classList.add('active');
      }
    });
  }
}

/**
 * تنظیم رویدادهای مربوط به تغییر تم
 */
function setupThemeSwitcherEvents() {
  // نمایش/مخفی کردن پاپ‌آپ با کلیک روی دکمه
  const button = document.querySelector('.theme-switcher-btn');
  const popup = document.querySelector('.theme-switcher-popup');
  
  if (button && popup) {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      popup.classList.toggle('show');
    });
    
    // بستن پاپ‌آپ با کلیک روی دکمه بستن
    const closeButton = popup.querySelector('.close-popup');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        popup.classList.remove('show');
      });
    }
    
    // اعمال تم با کلیک روی دکمه اعمال
    const applyButton = popup.querySelector('.apply-theme');
    if (applyButton) {
      applyButton.addEventListener('click', function() {
        const activeOption = popup.querySelector('.theme-option.active');
        if (activeOption) {
          const theme = activeOption.getAttribute('data-theme');
          applyTheme(theme);
          localStorage.setItem('vui-dashboard-theme', theme);
          popup.classList.remove('show');
          
          // نمایش پیام موفقیت
          showToast('تم با موفقیت تغییر کرد', 'success');
        }
      });
    }
    
    // انتخاب تم با کلیک روی گزینه‌ها
    const themeOptions = popup.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.addEventListener('click', function() {
        themeOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
      });
    });
    
    // بستن پاپ‌آپ با کلیک خارج از آن
    document.addEventListener('click', function(e) {
      if (!popup.contains(e.target) && !button.contains(e.target)) {
        popup.classList.remove('show');
      }
    });
  }
  
  // افزودن افکت موج (Ripple) به کارت‌ها
  setupRippleEffect();
}

/**
 * اعمال تم به صفحه
 * @param {string} theme - نام تم (dark, light, purple, blue)
 */
function applyTheme(theme) {
  const body = document.body;
  
  // حذف کلاس‌های تم قبلی
  body.classList.remove('light-theme', 'purple-theme', 'blue-theme');
  
  // اضافه کردن کلاس تم جدید
  switch (theme) {
    case 'light':
      body.classList.add('light-theme');
      break;
    case 'purple':
      body.classList.add('purple-theme');
      // تنظیم متغیرهای CSS برای تم بنفش
      document.documentElement.style.setProperty('--vui-primary-gradient', 'linear-gradient(310deg, #7928ca, #ff0080)');
      document.documentElement.style.setProperty('--vui-info-gradient', 'linear-gradient(310deg, #2152ff, #21d4fd)');
      break;
    case 'blue':
      body.classList.add('blue-theme');
      // تنظیم متغیرهای CSS برای تم آبی
      document.documentElement.style.setProperty('--vui-primary-gradient', 'linear-gradient(310deg, #2152ff, #21d4fd)');
      document.documentElement.style.setProperty('--vui-success-gradient', 'linear-gradient(310deg, #21d4fd, #01b574)');
      break;
    default: // dark
      // بازگرداندن متغیرهای CSS به حالت پیش‌فرض
      document.documentElement.style.setProperty('--vui-primary-gradient', 'linear-gradient(310deg, #4318ff, #9f7aea)');
      document.documentElement.style.setProperty('--vui-info-gradient', 'linear-gradient(310deg, #2152ff, #21d4fd)');
      document.documentElement.style.setProperty('--vui-success-gradient', 'linear-gradient(310deg, #01b574, #82d616)');
      break;
  }
  
  // به‌روزرسانی آیکون دکمه تغییر تم
  const themeButton = document.querySelector('.theme-switcher-btn i');
  if (themeButton) {
    themeButton.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
  }
}

/**
 * راه‌اندازی افکت موج (Ripple) برای کارت‌ها
 */
function setupRippleEffect() {
  const cards = document.querySelectorAll('.vui-card, .vui-stat-card-advanced');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.style.setProperty('--x', `${x}px`);
      this.style.setProperty('--y', `${y}px`);
    });
  });
  
  // افزودن افکت موج (Ripple) به دکمه‌ها
  const buttons = document.querySelectorAll('.vui-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // حذف موج‌های قبلی
      const existingRipples = this.querySelectorAll('.ripple');
      existingRipples.forEach(ripple => ripple.remove());
      
      // ایجاد المان موج جدید
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      this.appendChild(ripple);
      
      // تنظیم موقعیت و اندازه موج
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      
      // حذف موج بعد از پایان انیمیشن
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

/**
 * نمایش پیام (Toast)
 * @param {string} message - متن پیام
 * @param {string} type - نوع پیام (success, error, info)
 */
function showToast(message, type = 'info') {
  // بررسی وجود کانتینر toast قبلی
  let toastContainer = document.querySelector('.vui-toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'vui-toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.left = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  // ایجاد toast جدید
  const toast = document.createElement('div');
  toast.className = `vui-toast ${type}`;
  toast.style.backgroundColor = 'var(--card-bg)';
  toast.style.color = 'var(--text-primary)';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.marginTop = '10px';
  toast.style.boxShadow = 'var(--card-shadow)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.animationName = 'fadeIn';
  toast.style.animationDuration = '0.3s';
  toast.style.borderLeft = `4px solid ${type === 'success' ? '#01b574' : type === 'error' ? '#f53939' : '#2152ff'}`;
  
  // آیکون مناسب برای هر نوع toast
  let icon = '';
  if (type === 'success') icon = '<i class="bi bi-check-circle-fill" style="color:#01b574;margin-right:8px;"></i>';
  else if (type === 'error') icon = '<i class="bi bi-x-circle-fill" style="color:#f53939;margin-right:8px;"></i>';
  else icon = '<i class="bi bi-info-circle-fill" style="color:#2152ff;margin-right:8px;"></i>';
  
  toast.innerHTML = `${icon} ${message}`;
  
  // افزودن به کانتینر
  toastContainer.appendChild(toast);
  
  // حذف بعد از 3 ثانیه
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20px)';
    toast.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      toast.remove();
      
      // حذف کانتینر اگر خالی است
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300);
  }, 3000);
}