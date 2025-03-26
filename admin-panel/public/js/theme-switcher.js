/**
 * Vision UI Dashboard - Theme Switcher
 * سوییچر تم با قابلیت تغییر حالت تاریک/روشن و رنگ اصلی
 */

document.addEventListener('DOMContentLoaded', function() {
  // راه‌اندازی سوییچر تم
  initThemeSwitcher();
  
  // راه‌اندازی پنل تنظیمات تم
  initThemeSettings();
  
  // بارگذاری تنظیمات ذخیره شده
  loadSavedTheme();
});

/**
 * راه‌اندازی سوییچر تم ساده
 */
function initThemeSwitcher() {
  // جستجوی المان سوییچر در صفحه
  const themeSwitcher = document.querySelector('.theme-switcher');
  
  if (themeSwitcher) {
    // اضافه کردن ایونت کلیک
    themeSwitcher.addEventListener('click', function() {
      toggleTheme();
    });
    
    // ایجاد آیکون‌های تم تاریک/روشن اگر وجود ندارند
    if (!themeSwitcher.querySelector('.theme-icon')) {
      const themeIcon = document.createElement('div');
      themeIcon.className = 'theme-icon';
      
      themeIcon.innerHTML = `
        <span class="theme-icon-dark"><i class="bi bi-moon-stars-fill"></i></span>
        <span class="theme-icon-light"><i class="bi bi-sun-fill"></i></span>
      `;
      
      themeSwitcher.appendChild(themeIcon);
    }
  }
}

/**
 * راه‌اندازی پنل تنظیمات تم
 */
function initThemeSettings() {
  // بررسی وجود دکمه تنظیمات در صفحه
  let themeSettingsButton = document.querySelector('.theme-settings-button');
  
  // اگر دکمه وجود ندارد، ایجاد می‌کنیم
  if (!themeSettingsButton) {
    themeSettingsButton = document.createElement('div');
    themeSettingsButton.className = 'theme-settings-button';
    themeSettingsButton.innerHTML = '<i class="bi bi-gear-fill"></i>';
    document.body.appendChild(themeSettingsButton);
  }
  
  // بررسی وجود پنل تنظیمات در صفحه
  let themeSettingsPanel = document.querySelector('.theme-settings-panel');
  let themeSettingsOverlay = document.querySelector('.theme-settings-overlay');
  
  // اگر پنل وجود ندارد، ایجاد می‌کنیم
  if (!themeSettingsPanel) {
    // ایجاد اورلی (پس‌زمینه تیره)
    themeSettingsOverlay = document.createElement('div');
    themeSettingsOverlay.className = 'theme-settings-overlay';
    document.body.appendChild(themeSettingsOverlay);
    
    // ایجاد پنل تنظیمات
    themeSettingsPanel = document.createElement('div');
    themeSettingsPanel.className = 'theme-settings-panel';
    
    // محتوای پنل
    themeSettingsPanel.innerHTML = `
      <div class="theme-settings-header">
        <h5 class="theme-settings-title">تنظیمات ظاهری</h5>
        <button class="theme-settings-close">&times;</button>
      </div>
      <div class="theme-settings-body">
        <div class="theme-settings-section">
          <h6 class="theme-settings-section-title">حالت نمایش</h6>
          <div class="theme-mode-toggle">
            <span class="theme-mode-label">حالت تاریک</span>
            <div class="theme-switcher">
              <div class="theme-icon">
                <span class="theme-icon-dark"><i class="bi bi-moon-stars-fill"></i></span>
                <span class="theme-icon-light"><i class="bi bi-sun-fill"></i></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="theme-settings-section">
          <h6 class="theme-settings-section-title">رنگ اصلی</h6>
          <div class="theme-color-options">
            <div class="theme-color-option theme-color-purple active" data-color="purple"></div>
            <div class="theme-color-option theme-color-blue" data-color="blue"></div>
            <div class="theme-color-option theme-color-teal" data-color="teal"></div>
            <div class="theme-color-option theme-color-green" data-color="green"></div>
            <div class="theme-color-option theme-color-red" data-color="red"></div>
            <div class="theme-color-option theme-color-orange" data-color="orange"></div>
          </div>
        </div>
        
        <div class="theme-settings-section">
          <h6 class="theme-settings-section-title">افکت‌های ویژه</h6>
          
          <div class="theme-settings-option">
            <span class="theme-settings-label">افکت گلس مورفیسم</span>
            <div class="theme-settings-toggle active" data-setting="glassmorphism"></div>
          </div>
          
          <div class="theme-settings-option">
            <span class="theme-settings-label">انیمیشن‌های ظریف</span>
            <div class="theme-settings-toggle active" data-setting="animations"></div>
          </div>
          
          <div class="theme-settings-option">
            <span class="theme-settings-label">افکت‌های هاور</span>
            <div class="theme-settings-toggle active" data-setting="hover-effects"></div>
          </div>
          
          <label class="theme-settings-label">میزان شفافیت (برای گلس مورفیسم)</label>
          <input type="range" min="0" max="20" value="10" class="blur-intensity-slider">
          <div class="blur-preview">متن آزمایشی</div>
        </div>
        
        <button class="theme-settings-reset">بازگشت به تنظیمات پیش‌فرض</button>
      </div>
    `;
    
    document.body.appendChild(themeSettingsPanel);
    
    // فعال کردن سوییچر تم داخل پنل
    const panelThemeSwitcher = themeSettingsPanel.querySelector('.theme-switcher');
    if (panelThemeSwitcher) {
      panelThemeSwitcher.addEventListener('click', function() {
        toggleTheme();
      });
    }
    
    // رویداد برای بستن پنل
    const closeButton = themeSettingsPanel.querySelector('.theme-settings-close');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        closeThemeSettings();
      });
    }
    
    // رویداد برای انتخاب رنگ
    const colorOptions = themeSettingsPanel.querySelectorAll('.theme-color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', function() {
        const color = this.dataset.color;
        
        // حذف کلاس active از همه گزینه‌ها
        colorOptions.forEach(opt => opt.classList.remove('active'));
        
        // اضافه کردن کلاس active به گزینه انتخاب شده
        this.classList.add('active');
        
        // تغییر رنگ اصلی تم
        setColorTheme(color);
      });
    });
    
    // رویداد برای تاگل‌های تنظیمات
    const settingToggles = themeSettingsPanel.querySelectorAll('.theme-settings-toggle');
    settingToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        this.classList.toggle('active');
        
        const setting = this.dataset.setting;
        const isActive = this.classList.contains('active');
        
        toggleSetting(setting, isActive);
      });
    });
    
    // رویداد برای اسلایدر شفافیت
    const blurSlider = themeSettingsPanel.querySelector('.blur-intensity-slider');
    const blurPreview = themeSettingsPanel.querySelector('.blur-preview');
    
    if (blurSlider && blurPreview) {
      blurSlider.addEventListener('input', function() {
        const value = this.value;
        
        // به‌روزرسانی پیش‌نمایش
        blurPreview.style.backdropFilter = `blur(${value}px)`;
        blurPreview.style.webkitBackdropFilter = `blur(${value}px)`;
        
        // ذخیره تنظیمات
        saveThemeSettings('blurIntensity', value);
        
        // اعمال به همه المان‌های گلس‌مورفیک
        applyBlurIntensity(value);
      });
    }
    
    // رویداد برای دکمه ریست
    const resetButton = themeSettingsPanel.querySelector('.theme-settings-reset');
    if (resetButton) {
      resetButton.addEventListener('click', function() {
        resetThemeSettings();
      });
    }
  }
  
  // رویداد برای اورلی
  if (themeSettingsOverlay) {
    themeSettingsOverlay.addEventListener('click', function() {
      closeThemeSettings();
    });
  }
  
  // رویداد برای دکمه تنظیمات
  themeSettingsButton.addEventListener('click', function() {
    openThemeSettings();
  });
}

/**
 * باز کردن پنل تنظیمات تم
 */
function openThemeSettings() {
  const panel = document.querySelector('.theme-settings-panel');
  const overlay = document.querySelector('.theme-settings-overlay');
  
  if (panel && overlay) {
    panel.classList.add('open');
    overlay.classList.add('visible');
  }
}

/**
 * بستن پنل تنظیمات تم
 */
function closeThemeSettings() {
  const panel = document.querySelector('.theme-settings-panel');
  const overlay = document.querySelector('.theme-settings-overlay');
  
  if (panel && overlay) {
    panel.classList.remove('open');
    overlay.classList.remove('visible');
  }
}

/**
 * تغییر وضعیت تم بین حالت تاریک و روشن
 */
function toggleTheme() {
  // ایجاد افکت انتقال
  createTransitionEffect();
  
  // بررسی وضعیت فعلی تم
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // تغییر به حالت مخالف
  const newTheme = isDarkTheme ? 'light' : 'dark';
  
  // اعمال تم جدید
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // ذخیره تنظیمات
  saveThemeSettings('theme', newTheme);
}

/**
 * ایجاد افکت انتقال هنگام تغییر تم
 */
function createTransitionEffect() {
  // بررسی وجود افکت
  let transitionOverlay = document.querySelector('.theme-transition-overlay');
  
  // ایجاد افکت اگر وجود ندارد
  if (!transitionOverlay) {
    transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'theme-transition-overlay';
    document.body.appendChild(transitionOverlay);
  }
  
  // فعال کردن افکت
  transitionOverlay.classList.add('active');
  
  // حذف افکت پس از پایان انیمیشن
  setTimeout(() => {
    transitionOverlay.classList.remove('active');
  }, 300);
}

/**
 * تغییر رنگ اصلی تم
 * @param {string} color - نام رنگ (blue, teal, green, purple, red, orange)
 */
function setColorTheme(color) {
  // حذف تم رنگی قبلی
  const currentColor = document.documentElement.getAttribute('data-color-theme');
  if (currentColor) {
    document.documentElement.removeAttribute('data-color-theme');
  }
  
  // اعمال تم رنگی جدید
  if (color && color !== 'purple') { // پیش‌فرض بنفش است
    document.documentElement.setAttribute('data-color-theme', color);
  }
  
  // ذخیره تنظیمات
  saveThemeSettings('colorTheme', color);
}

/**
 * فعال/غیرفعال کردن تنظیمات ویژه
 * @param {string} setting - نام تنظیم (glassmorphism, animations, hover-effects)
 * @param {boolean} isActive - وضعیت فعال/غیرفعال
 */
function toggleSetting(setting, isActive) {
  switch(setting) {
    case 'glassmorphism':
      if (isActive) {
        document.body.classList.add('enable-glassmorphism');
        document.body.classList.remove('disable-glassmorphism');
      } else {
        document.body.classList.add('disable-glassmorphism');
        document.body.classList.remove('enable-glassmorphism');
      }
      break;
      
    case 'animations':
      if (isActive) {
        document.body.classList.add('enable-animations');
        document.body.classList.remove('disable-animations');
      } else {
        document.body.classList.add('disable-animations');
        document.body.classList.remove('enable-animations');
      }
      break;
      
    case 'hover-effects':
      if (isActive) {
        document.body.classList.add('enable-hover-effects');
        document.body.classList.remove('disable-hover-effects');
      } else {
        document.body.classList.add('disable-hover-effects');
        document.body.classList.remove('enable-hover-effects');
      }
      break;
  }
  
  // ذخیره تنظیمات
  saveThemeSettings(setting, isActive);
}

/**
 * اعمال میزان شفافیت به المان‌های گلس‌مورفیک
 * @param {number} value - میزان شفافیت (0-20)
 */
function applyBlurIntensity(value) {
  // ایجاد استایل جدید یا به‌روزرسانی استایل موجود
  let style = document.getElementById('blur-intensity-style');
  
  if (!style) {
    style = document.createElement('style');
    style.id = 'blur-intensity-style';
    document.head.appendChild(style);
  }
  
  // تنظیم CSS
  style.textContent = `
    .vui-card,
    .vui-sidebar,
    .vui-header,
    .vui-footer,
    .vui-modal-dialog,
    .theme-settings-panel,
    .glassmorphism,
    [class*="backdrop-filter"] {
      backdrop-filter: blur(${value}px) !important;
      -webkit-backdrop-filter: blur(${value}px) !important;
    }
  `;
}

/**
 * ذخیره تنظیمات تم در localStorage
 * @param {string} key - کلید تنظیم
 * @param {any} value - مقدار تنظیم
 */
function saveThemeSettings(key, value) {
  // دریافت تنظیمات موجود
  let settings = {};
  
  try {
    const savedSettings = localStorage.getItem('themeSettings');
    if (savedSettings) {
      settings = JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error loading theme settings:', error);
  }
  
  // اضافه کردن یا به‌روزرسانی تنظیم
  settings[key] = value;
  
  // ذخیره تنظیمات
  try {
    localStorage.setItem('themeSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving theme settings:', error);
  }
}

/**
 * بارگذاری تنظیمات ذخیره شده از localStorage
 */
function loadSavedTheme() {
  try {
    const savedSettings = localStorage.getItem('themeSettings');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // اعمال تم
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
      }
      
      // اعمال رنگ
      if (settings.colorTheme && settings.colorTheme !== 'purple') {
        document.documentElement.setAttribute('data-color-theme', settings.colorTheme);
        
        // به‌روزرسانی UI
        const colorOptions = document.querySelectorAll('.theme-color-option');
        colorOptions.forEach(option => {
          option.classList.remove('active');
          if (option.dataset.color === settings.colorTheme) {
            option.classList.add('active');
          }
        });
      }
      
      // اعمال تنظیمات دیگر
      ['glassmorphism', 'animations', 'hover-effects'].forEach(setting => {
        if (settings[setting] !== undefined) {
          const toggle = document.querySelector(`.theme-settings-toggle[data-setting="${setting}"]`);
          
          if (toggle) {
            if (settings[setting]) {
              toggle.classList.add('active');
            } else {
              toggle.classList.remove('active');
            }
          }
          
          toggleSetting(setting, settings[setting]);
        }
      });
      
      // اعمال میزان شفافیت
      if (settings.blurIntensity !== undefined) {
        const slider = document.querySelector('.blur-intensity-slider');
        const preview = document.querySelector('.blur-preview');
        
        if (slider) {
          slider.value = settings.blurIntensity;
        }
        
        if (preview) {
          preview.style.backdropFilter = `blur(${settings.blurIntensity}px)`;
          preview.style.webkitBackdropFilter = `blur(${settings.blurIntensity}px)`;
        }
        
        applyBlurIntensity(settings.blurIntensity);
      }
    }
  } catch (error) {
    console.error('Error applying saved theme settings:', error);
  }
}

/**
 * بازنشانی تنظیمات به حالت پیش‌فرض
 */
function resetThemeSettings() {
  // اعمال مقادیر پیش‌فرض
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.removeAttribute('data-color-theme');
  
  document.body.classList.remove('disable-glassmorphism');
  document.body.classList.remove('disable-animations');
  document.body.classList.remove('disable-hover-effects');
  
  document.body.classList.add('enable-glassmorphism');
  document.body.classList.add('enable-animations');
  document.body.classList.add('enable-hover-effects');
  
  // به‌روزرسانی اسلایدر شفافیت
  const slider = document.querySelector('.blur-intensity-slider');
  const preview = document.querySelector('.blur-preview');
  
  if (slider) {
    slider.value = 10;
  }
  
  if (preview) {
    preview.style.backdropFilter = 'blur(10px)';
    preview.style.webkitBackdropFilter = 'blur(10px)';
  }
  
  applyBlurIntensity(10);
  
  // به‌روزرسانی UI
  const colorOptions = document.querySelectorAll('.theme-color-option');
  colorOptions.forEach(option => {
    option.classList.remove('active');
    if (option.dataset.color === 'purple') {
      option.classList.add('active');
    }
  });
  
  const toggles = document.querySelectorAll('.theme-settings-toggle');
  toggles.forEach(toggle => {
    toggle.classList.add('active');
  });
  
  // حذف تنظیمات از localStorage
  try {
    localStorage.removeItem('themeSettings');
  } catch (error) {
    console.error('Error removing theme settings:', error);
  }
  
  // نمایش پیام به کاربر
  showToast('تنظیمات به حالت پیش‌فرض بازگشت');
}

/**
 * نمایش پیام کوتاه به کاربر
 * @param {string} message - متن پیام
 */
function showToast(message) {
  // تلاش برای استفاده از ماژول نوتیفیکیشن اگر وجود داشته باشد
  if (window.VisionNotification) {
    window.VisionNotification.info(message, { position: 'top-left', duration: 3000 });
    return;
  }
  
  // ایجاد توست ساده
  const toast = document.createElement('div');
  toast.className = 'theme-toast';
  toast.innerHTML = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: var(--vui-bg-card);
    color: var(--text-primary);
    padding: 10px 15px;
    border-radius: 5px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    opacity: 0;
    transform: translateX(-20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  // نمایش توست
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // حذف توست پس از نمایش
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// افزودن متدها به window برای دسترسی مستقیم
window.visionUiTheme = {
  toggleTheme: toggleTheme,
  setColorTheme: setColorTheme,
  openThemeSettings: openThemeSettings,
  closeThemeSettings: closeThemeSettings,
  resetThemeSettings: resetThemeSettings
};