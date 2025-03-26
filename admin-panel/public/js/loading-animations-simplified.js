/**
 * Vision UI Dashboard - Loading Animations (Simplified version)
 * انیمیشن‌های بارگذاری برای حالت‌های مختلف
 */

document.addEventListener('DOMContentLoaded', function() {
  // راه‌اندازی لودر اصلی صفحه
  initMainLoader();
  
  // راه‌اندازی لودرهای درون صفحه‌ای
  initComponentLoaders();
  
  // اضافه کردن رویدادها به دکمه‌های دارای لودر
  initLoadingButtons();
});

/**
 * راه‌اندازی و مدیریت لودر اصلی صفحه
 */
function initMainLoader() {
  const mainLoader = document.querySelector('.loader-container');
  if (!mainLoader) return;
  
  // نمایش لودر در هنگام بارگذاری صفحه
  showMainLoader();
  
  // مخفی کردن لودر پس از بارگذاری کامل صفحه
  window.addEventListener('load', function() {
    hideMainLoader();
  });
  
  // رویداد برای نمایش لودر هنگام انتقال بین صفحات
  document.addEventListener('pageTransition', function() {
    showMainLoader();
  });
  
  // مخفی کردن لودر پس از بارگذاری صفحه جدید
  document.addEventListener('pageLoaded', function() {
    hideMainLoader();
  });
  
  // ایجاد لودر پیشرفته اگر وجود نداشته باشد
  createAdvancedLoader();
}

/**
 * ایجاد لودر پیشرفته با انیمیشن و متن
 */
function createAdvancedLoader() {
  const simpleLoader = document.querySelector('.loader-container .loader');
  if (!simpleLoader) return;
  
  // ایجاد لودر پیشرفته با انیمیشن
  const advancedLoader = document.createElement('div');
  advancedLoader.className = 'vui-loader';
  
  // افزودن لوگو (اگر وجود داشته باشد)
  let logoSrc = '/img/logo.png';
  const logoImg = document.querySelector('link[rel="icon"]');
  if (logoImg && logoImg.href) {
    logoSrc = logoImg.href;
  }
  
  // افزودن محتوای لودر
  advancedLoader.innerHTML = '<div class="vui-loader-logo">' +
    '<img src="' + logoSrc + '" alt="Logo" onerror="this.src=\'/img/coin.svg\'; this.onerror=null;">' +
    '</div>' +
    '<div class="vui-loader-spinner"></div>' +
    '<div class="vui-loader-text">در حال بارگذاری...</div>' +
    '<div class="progress-loader">' +
    '<div class="progress-bar" style="width: 0%"></div>' +
    '</div>';
  
  // جایگزینی لودر ساده با لودر پیشرفته
  simpleLoader.parentNode.replaceChild(advancedLoader, simpleLoader);
  
  // شبیه‌سازی پیشرفت بارگذاری
  simulateLoadingProgress();
}

/**
 * شبیه‌سازی پیشرفت بارگذاری
 */
function simulateLoadingProgress() {
  const progressBar = document.querySelector('.progress-bar');
  if (!progressBar) return;
  
  let progress = 0;
  
  // افزایش پیشرفت با سرعت نامنظم برای شبیه‌سازی بارگذاری واقعی
  const interval = setInterval(function() {
    // محاسبه میزان افزایش (کندتر در نزدیکی 100%)
    const increment = progress < 70 ? 
      Math.random() * 10 : // پیشرفت سریع‌تر در ابتدا
      Math.random() * 3;   // پیشرفت کندتر در انتها
    
    progress = Math.min(progress + increment, 99);
    progressBar.style.width = progress + '%';
    
    // توقف در 99% تا بارگذاری کامل صفحه
    if (progress >= 99) {
      clearInterval(interval);
    }
  }, 200);
  
  // تکمیل پیشرفت پس از بارگذاری صفحه
  window.addEventListener('load', function() {
    clearInterval(interval);
    progressBar.style.width = '100%';
  });
}

/**
 * نمایش لودر اصلی صفحه
 */
function showMainLoader() {
  const loaderContainer = document.querySelector('.loader-container');
  if (!loaderContainer) return;
  
  // حذف کلاس d-none با تاخیر برای اعمال انیمیشن
  setTimeout(function() {
    loaderContainer.classList.remove('d-none');
  }, 0);
}

/**
 * مخفی کردن لودر اصلی صفحه با انیمیشن
 */
function hideMainLoader() {
  const loaderContainer = document.querySelector('.loader-container');
  if (!loaderContainer) return;
  
  // تکمیل پیشرفت نوار بارگذاری
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = '100%';
  }
  
  // تاخیر برای نمایش 100% قبل از مخفی شدن
  setTimeout(function() {
    loaderContainer.classList.add('d-none');
    
    // تغییر متن لودر برای دفعه بعد
    const loaderText = document.querySelector('.vui-loader-text');
    if (loaderText) {
      const texts = [
        'در حال بارگذاری...',
        'لطفاً صبر کنید...',
        'در حال دریافت اطلاعات...',
        'آماده‌سازی داشبورد...'
      ];
      
      // انتخاب تصادفی متن
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      loaderText.textContent = randomText;
    }
  }, 500);
}

/**
 * راه‌اندازی لودرهای کامپوننت‌ها
 */
function initComponentLoaders() {
  // المان‌هایی که باید با تاخیر بارگذاری شوند
  const lazyLoadElements = document.querySelectorAll('[data-loading="true"]');
  
  lazyLoadElements.forEach(function(element) {
    // ایجاد وضعیت بارگذاری
    showComponentLoader(element);
    
    // شبیه‌سازی زمان بارگذاری تصادفی
    const loadTime = Math.random() * 2000 + 500; // 0.5 تا 2.5 ثانیه
    
    // مخفی کردن لودر پس از بارگذاری
    setTimeout(function() {
      hideComponentLoader(element);
    }, loadTime);
  });
  
  // بارگذاری با اسکرول
  initLazyLoading();
}

/**
 * راه‌اندازی بارگذاری تنبل برای المان‌ها
 */
function initLazyLoading() {
  // بررسی پشتیبانی مرورگر از Intersection Observer
  if (!('IntersectionObserver' in window)) return;
  
  // المان‌هایی که باید با اسکرول بارگذاری شوند
  const lazyElements = document.querySelectorAll('[data-lazy-load="true"]');
  
  // تنظیم آبزرور
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // بارگذاری المان
        showComponentLoader(element);
        
        // زمان بارگذاری تصادفی
        const loadTime = Math.random() * 1500 + 500; // 0.5 تا 2 ثانیه
        
        setTimeout(function() {
          hideComponentLoader(element);
          
          // حذف از آبزرور پس از بارگذاری
          observer.unobserve(element);
        }, loadTime);
      }
    });
  }, {
    threshold: 0.1, // المان حداقل 10% نمایان باشد
    rootMargin: '0px 0px 100px 0px' // بارگذاری کمی زودتر از رسیدن به المان
  });
  
  // افزودن المان‌ها به آبزرور
  lazyElements.forEach(function(element) {
    observer.observe(element);
  });
}

/**
 * نمایش لودر برای یک کامپوننت
 * @param {HTMLElement} element - المان کامپوننت
 */
function showComponentLoader(element) {
  // اضافه کردن کلاس loading
  element.classList.add('loading');
  
  // در صورت وجود ویژگی data-skeleton، استفاده از اسکلتون
  if (element.hasAttribute('data-skeleton')) {
    const skeletonType = element.getAttribute('data-skeleton');
    createSkeleton(element, skeletonType);
  } else {
    // ایجاد لودر ساده
    createSimpleLoader(element);
  }
}

/**
 * مخفی کردن لودر از یک کامپوننت
 * @param {HTMLElement} element - المان کامپوننت
 */
function hideComponentLoader(element) {
  // حذف کلاس loading
  element.classList.remove('loading');
  
  // حذف اسکلتون
  const skeleton = element.querySelector('.skeleton-container');
  if (skeleton) {
    // افکت محو شدن اسکلتون
    skeleton.style.opacity = '0';
    
    // حذف پس از پایان انیمیشن
    setTimeout(function() {
      skeleton.remove();
      
      // نمایش محتوای اصلی
      showElementContent(element);
    }, 300);
  }
  
  // حذف لودر ساده
  const loader = element.querySelector('.chart-loader');
  if (loader) {
    loader.remove();
    
    // نمایش محتوای اصلی
    showElementContent(element);
  }
}

/**
 * نمایش محتوای اصلی المان با افکت
 * @param {HTMLElement} element - المان هدف
 */
function showElementContent(element) {
  // بررسی و اضافه کردن کلاس‌های انیمیشن
  if (!element.classList.contains('fade-in') && 
      !element.classList.contains('slide-in-up') && 
      !element.classList.contains('slide-in-right')) {
    
    // انتخاب افکت بر اساس ویژگی data-animation
    const animation = element.getAttribute('data-animation') || 'fade-in';
    element.classList.add(animation);
    
    // حذف کلاس انیمیشن پس از اتمام
    setTimeout(function() {
      element.classList.remove(animation);
    }, 1000);
  }
}

/**
 * ایجاد لودر ساده برای یک المان
 * @param {HTMLElement} element - المان هدف
 */
function createSimpleLoader(element) {
  // بررسی وجود لودر قبلی
  if (element.querySelector('.chart-loader')) return;
  
  // ایجاد لودر
  const loader = document.createElement('div');
  loader.className = 'chart-loader';
  
  // اضافه کردن به المان
  element.appendChild(loader);
}

/**
 * ایجاد اسکلتون بر اساس نوع المان
 * @param {HTMLElement} element - المان هدف
 * @param {string} type - نوع اسکلتون
 */
function createSkeleton(element, type) {
  // بررسی وجود اسکلتون قبلی
  if (element.querySelector('.skeleton-container')) return;
  
  // ایجاد کانتینر اسکلتون
  const skeletonContainer = document.createElement('div');
  skeletonContainer.className = 'skeleton-container';
  skeletonContainer.style.position = 'absolute';
  skeletonContainer.style.top = '0';
  skeletonContainer.style.left = '0';
  skeletonContainer.style.width = '100%';
  skeletonContainer.style.height = '100%';
  skeletonContainer.style.zIndex = '5';
  skeletonContainer.style.borderRadius = 'inherit';
  skeletonContainer.style.overflow = 'hidden';
  skeletonContainer.style.transition = 'opacity 0.3s ease';
  
  // ایجاد HTML اسکلتون بر اساس نوع
  let skeletonHTML = '';
  
  switch(type) {
    case 'stat-card':
      skeletonHTML = '<div class="stat-card-skeleton">' +
        '<div class="stat-card-header-skeleton">' +
        '<div class="stat-card-icon-skeleton skeleton-loader"></div>' +
        '<div class="stat-card-actions-skeleton skeleton-loader"></div>' +
        '</div>' +
        '<div class="stat-card-title-skeleton skeleton-loader"></div>' +
        '<div class="stat-card-value-skeleton skeleton-loader"></div>' +
        '<div class="stat-card-meta-skeleton skeleton-loader"></div>' +
        '<div class="stat-card-progress-skeleton skeleton-loader"></div>' +
        '</div>';
      break;
    
    case 'chart':
      skeletonHTML = '<div class="chart-skeleton">' +
        '<div class="chart-header-skeleton">' +
        '<div class="chart-title-skeleton skeleton-loader"></div>' +
        '<div class="chart-filters-skeleton">' +
        '<div class="chart-filter-skeleton skeleton-loader"></div>' +
        '<div class="chart-filter-skeleton skeleton-loader"></div>' +
        '<div class="chart-filter-skeleton skeleton-loader"></div>' +
        '</div>' +
        '</div>' +
        '<div class="chart-body-skeleton skeleton-loader"></div>' +
        '</div>';
      break;
    
    case 'table':
      skeletonHTML = '<div class="table-skeleton">' +
        '<div class="table-header-skeleton">' +
        '<div class="table-header-item-skeleton skeleton-loader"></div>' +
        '<div class="table-header-item-skeleton skeleton-loader"></div>' +
        '<div class="table-header-item-skeleton skeleton-loader"></div>' +
        '</div>';
      
      // Add 5 rows
      for (var i = 0; i < 5; i++) {
        skeletonHTML += '<div class="table-row-skeleton">' +
          '<div class="table-cell-skeleton skeleton-loader"></div>' +
          '<div class="table-cell-skeleton skeleton-loader"></div>' +
          '<div class="table-cell-skeleton skeleton-loader"></div>' +
          '</div>';
      }
      
      skeletonHTML += '</div>';
      break;
    
    case 'activity':
      skeletonHTML = '<div class="activity-feed-skeleton">' +
        '<div class="activity-header-skeleton">' +
        '<div class="activity-title-skeleton skeleton-loader"></div>' +
        '<div class="activity-action-skeleton skeleton-loader"></div>' +
        '</div>';
      
      // Add 3 activity items
      for (var i = 0; i < 3; i++) {
        skeletonHTML += '<div class="activity-item-skeleton">' +
          '<div class="activity-icon-skeleton skeleton-loader"></div>' +
          '<div class="activity-content-skeleton">' +
          '<div class="activity-title-item-skeleton skeleton-loader"></div>' +
          '<div class="activity-desc-skeleton skeleton-loader"></div>' +
          '<div class="activity-time-skeleton skeleton-loader"></div>' +
          '</div>' +
          '</div>';
      }
      
      skeletonHTML += '</div>';
      break;
    
    default:
      // اسکلتون پیش‌فرض
      skeletonHTML = '<div style="padding: 20px;">' +
        '<div class="skeleton-loader" style="height: 20px; margin-bottom: 15px;"></div>' +
        '<div class="skeleton-loader" style="height: 100px; margin-bottom: 15px;"></div>' +
        '<div class="skeleton-loader" style="height: 15px; width: 70%; margin-bottom: 10px;"></div>' +
        '<div class="skeleton-loader" style="height: 15px; width: 50%;"></div>' +
        '</div>';
  }
  
  // تنظیم محتوای اسکلتون
  skeletonContainer.innerHTML = skeletonHTML;
  
  // اضافه کردن اسکلتون به المان
  element.style.position = 'relative';
  element.appendChild(skeletonContainer);
  
  // پنهان کردن فرزندان برای جلوگیری از تداخل با اسکلتون
  Array.from(element.children).forEach(function(child) {
    if (child !== skeletonContainer) {
      child.style.visibility = 'hidden';
    }
  });
}

/**
 * راه‌اندازی دکمه‌های دارای حالت بارگذاری
 */
function initLoadingButtons() {
  const buttons = document.querySelectorAll('.btn[data-loading-text]');
  
  buttons.forEach(function(button) {
    button.addEventListener('click', function(e) {
      // بررسی آیا دکمه غیرفعال است
      if (button.classList.contains('disabled') || button.disabled) {
        e.preventDefault();
        return;
      }
      
      // اگر ویژگی data-prevent-default تنظیم شده باشد، از عملکرد پیش‌فرض جلوگیری می‌کنیم
      if (button.hasAttribute('data-prevent-default')) {
        e.preventDefault();
      }
      
      // نمایش وضعیت بارگذاری
      showButtonLoading(button);
      
      // ذخیره متن اصلی دکمه برای بازیابی بعدی
      if (!button.hasAttribute('data-original-text')) {
        button.setAttribute('data-original-text', button.innerHTML);
      }
      
      // اگر ویژگی data-auto-reset تنظیم شده باشد، وضعیت بارگذاری را با تاخیر حذف می‌کنیم
      if (button.hasAttribute('data-auto-reset')) {
        const resetDelay = parseInt(button.getAttribute('data-auto-reset')) || 2000;
        
        setTimeout(function() {
          hideButtonLoading(button);
        }, resetDelay);
      }
    });
  });
}

/**
 * نمایش وضعیت بارگذاری دکمه
 * @param {HTMLElement} button - دکمه
 */
function showButtonLoading(button) {
  // غیرفعال کردن دکمه
  button.classList.add('disabled');
  button.disabled = true;
  
  // دریافت متن بارگذاری
  const loadingText = button.getAttribute('data-loading-text') || 'در حال پردازش...';
  
  // ایجاد اسپینر
  const spinner = document.createElement('span');
  spinner.className = 'btn-spinner';
  
  // تغییر محتوای دکمه
  button.innerHTML = '';
  button.appendChild(spinner);
  button.appendChild(document.createTextNode(' ' + loadingText));
}

/**
 * حذف وضعیت بارگذاری دکمه
 * @param {HTMLElement} button - دکمه
 */
function hideButtonLoading(button) {
  // فعال کردن دکمه
  button.classList.remove('disabled');
  button.disabled = false;
  
  // بازیابی متن اصلی
  const originalText = button.getAttribute('data-original-text');
  if (originalText) {
    button.innerHTML = originalText;
  }
}

/**
 * نمایش وضعیت "بدون داده" برای نمودارها
 * @param {HTMLElement} chartContainer - کانتینر نمودار
 * @param {string} message - پیام نمایشی
 */
function showNoDataState(chartContainer, message) {
  if (!message) message = 'داده‌ای برای نمایش وجود ندارد';
  
  // حذف لودر قبلی
  const existingLoader = chartContainer.querySelector('.chart-loader');
  if (existingLoader) {
    existingLoader.remove();
  }
  
  // ایجاد وضعیت بدون داده
  const noDataElement = document.createElement('div');
  noDataElement.className = 'chart-no-data';
  
  noDataElement.innerHTML = '<div class="chart-no-data-icon">' +
    '<i class="bi bi-bar-chart"></i>' +
    '</div>' +
    '<div class="chart-no-data-text">' + message + '</div>';
  
  // اضافه کردن به کانتینر
  chartContainer.style.position = 'relative';
  chartContainer.appendChild(noDataElement);
}

/**
 * حذف وضعیت "بدون داده"
 * @param {HTMLElement} chartContainer - کانتینر نمودار
 */
function hideNoDataState(chartContainer) {
  const noDataElement = chartContainer.querySelector('.chart-no-data');
  if (noDataElement) {
    noDataElement.remove();
  }
}

// افزودن متدها به window برای دسترسی مستقیم
window.vuiLoaders = {
  showMainLoader: showMainLoader,
  hideMainLoader: hideMainLoader,
  showComponentLoader: showComponentLoader,
  hideComponentLoader: hideComponentLoader,
  showButtonLoading: showButtonLoading,
  hideButtonLoading: hideButtonLoading,
  showNoDataState: showNoDataState,
  hideNoDataState: hideNoDataState
};