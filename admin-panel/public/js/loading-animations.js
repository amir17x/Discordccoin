/**
 * Vision UI Dashboard - Loading Animations
 * انیمیشن‌های بارگذاری جذاب برای عناصر داشبورد
 */

document.addEventListener('DOMContentLoaded', function() {
  initLoadingSystem();
});

/**
 * راه‌اندازی سیستم انیمیشن‌های بارگذاری
 */
function initLoadingSystem() {
  // ایجاد لودر اصلی برای صفحه
  createMainLoader();
  
  // ایجاد اسکلتون‌ها برای محتوای در حال بارگذاری
  createContentSkeletons();
  
  // هندل کردن انیمیشن‌های لودینگ عناصر مختلف
  setupDynamicLoading();
  
  // پنهان کردن لودر اصلی بعد از آماده شدن صفحه
  // این تایمر برای شبیه‌سازی بارگذاری است
  setTimeout(hideMainLoader, 1000);
}

/**
 * ایجاد لودر اصلی برای صفحه
 */
function createMainLoader() {
  // بررسی وجود لودر قبلی
  if (document.querySelector('.loader-container')) return;
  
  const loaderContainer = document.createElement('div');
  loaderContainer.className = 'loader-container';
  
  loaderContainer.innerHTML = `
    <div class="vui-loader">
      <div class="vui-loader-logo">
        <img src="/img/ccoin-logo.png" alt="CCoin" onerror="this.src = '/img/logo.png'; this.onerror=null;">
      </div>
      <div class="vui-loader-spinner"></div>
      <div class="vui-loader-text">در حال بارگذاری داشبورد</div>
      <div class="progress-loader">
        <div class="progress-bar" id="mainProgressBar"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(loaderContainer);
  
  // شبیه‌سازی پیشرفت بارگذاری
  simulateLoadingProgress();
}

/**
 * شبیه‌سازی پیشرفت بارگذاری
 */
function simulateLoadingProgress() {
  const progressBar = document.getElementById('mainProgressBar');
  if (!progressBar) return;
  
  let width = 0;
  const interval = setInterval(function() {
    if (width >= 100) {
      clearInterval(interval);
    } else {
      // افزایش سرعت در مراحل مختلف
      if (width < 30) {
        width += 2;
      } else if (width < 60) {
        width += 1;
      } else if (width < 80) {
        width += 0.5;
      } else {
        width += 0.2;
      }
      progressBar.style.width = width + '%';
    }
  }, 30);
}

/**
 * پنهان کردن لودر اصلی
 */
function hideMainLoader() {
  const loaderContainer = document.querySelector('.loader-container');
  if (loaderContainer) {
    // تضمین 100% شدن نوار پیشرفت
    const progressBar = document.getElementById('mainProgressBar');
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    
    // پنهان کردن لودر با تاخیر کوتاه
    setTimeout(() => {
      loaderContainer.classList.add('d-none');
      
      // حذف لودر از DOM بعد از اتمام انیمیشن
      setTimeout(() => {
        loaderContainer.remove();
      }, 500);
    }, 300);
  }
}

/**
 * ایجاد اسکلتون‌ها برای محتوای در حال بارگذاری
 */
function createContentSkeletons() {
  // ایجاد اسکلتون برای کارت‌های آمار
  createStatCardSkeletons();
  
  // ایجاد اسکلتون برای چارت‌ها
  createChartSkeletons();
  
  // ایجاد اسکلتون برای جدول‌ها
  createTableSkeletons();
  
  // ایجاد اسکلتون برای فید فعالیت‌ها
  createActivityFeedSkeletons();
}

/**
 * ایجاد اسکلتون برای کارت‌های آمار
 */
function createStatCardSkeletons() {
  // پیدا کردن کانتینر کارت‌های آمار
  const statContainers = document.querySelectorAll('.stat-cards-container, .dashboard-stats-row');
  
  statContainers.forEach(container => {
    // پنهان کردن موقت کارت‌های فعلی
    const existingCards = container.querySelectorAll('.vui-card, .vui-stat-card-advanced, .card');
    existingCards.forEach(card => {
      card.style.display = 'none';
    });
    
    // تعیین تعداد کارت‌های اسکلتون
    const skeletonCount = existingCards.length || 4;
    
    // ایجاد اسکلتون‌ها
    for (let i = 0; i < skeletonCount; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'stat-card-skeleton skeleton-loader';
      skeleton.innerHTML = `
        <div class="stat-card-header-skeleton">
          <div class="stat-card-icon-skeleton skeleton-loader"></div>
          <div class="stat-card-actions-skeleton skeleton-loader"></div>
        </div>
        <div class="stat-card-title-skeleton skeleton-loader"></div>
        <div class="stat-card-value-skeleton skeleton-loader"></div>
        <div class="stat-card-meta-skeleton skeleton-loader"></div>
        <div class="stat-card-progress-skeleton skeleton-loader"></div>
      `;
      
      // اضافه کردن تاخیر برای انیمیشن آبشاری
      skeleton.style.animationDelay = `${i * 0.1}s`;
      
      container.appendChild(skeleton);
    }
  });
}

/**
 * ایجاد اسکلتون برای چارت‌ها
 */
function createChartSkeletons() {
  // پیدا کردن کانتینر چارت‌ها
  const chartContainers = document.querySelectorAll('.chart-container, .dashboard-charts-row');
  
  chartContainers.forEach(container => {
    // پنهان کردن موقت چارت‌های فعلی
    const existingCharts = container.querySelectorAll('.vui-card, .chart-card, .card');
    existingCharts.forEach(chart => {
      chart.style.display = 'none';
    });
    
    // تعیین تعداد چارت‌های اسکلتون
    const skeletonCount = existingCharts.length || 2;
    
    // ایجاد اسکلتون‌ها
    for (let i = 0; i < skeletonCount; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'chart-skeleton';
      skeleton.innerHTML = `
        <div class="chart-header-skeleton">
          <div class="chart-title-skeleton skeleton-loader"></div>
          <div class="chart-filters-skeleton">
            <div class="chart-filter-skeleton skeleton-loader"></div>
            <div class="chart-filter-skeleton skeleton-loader"></div>
            <div class="chart-filter-skeleton skeleton-loader"></div>
          </div>
        </div>
        <div class="chart-body-skeleton skeleton-loader"></div>
      `;
      
      // اضافه کردن تاخیر برای انیمیشن آبشاری
      skeleton.style.animationDelay = `${i * 0.2}s`;
      
      container.appendChild(skeleton);
    }
  });
}

/**
 * ایجاد اسکلتون برای جدول‌ها
 */
function createTableSkeletons() {
  // پیدا کردن کانتینر جدول‌ها
  const tableContainers = document.querySelectorAll('.table-container, .dashboard-tables-row');
  
  tableContainers.forEach(container => {
    // پنهان کردن موقت جدول‌های فعلی
    const existingTables = container.querySelectorAll('.vui-card, .table-card, .card, .vui-data-table');
    existingTables.forEach(table => {
      table.style.display = 'none';
    });
    
    // ایجاد اسکلتون
    const skeleton = document.createElement('div');
    skeleton.className = 'table-skeleton';
    
    // هدر جدول
    let tableHeader = `
      <div class="table-header-skeleton">
        <div class="table-avatar-skeleton skeleton-loader"></div>
    `;
    
    // ایجاد ستون‌های هدر
    for (let i = 0; i < 4; i++) {
      tableHeader += `<div class="table-header-item-skeleton skeleton-loader"></div>`;
    }
    
    tableHeader += `</div>`;
    
    // ردیف‌های جدول
    let tableRows = '';
    for (let i = 0; i < 5; i++) {
      tableRows += `
        <div class="table-row-skeleton">
          <div class="table-avatar-skeleton skeleton-loader"></div>
      `;
      
      // ایجاد سلول‌های ردیف
      for (let j = 0; j < 4; j++) {
        tableRows += `<div class="table-cell-skeleton skeleton-loader"></div>`;
      }
      
      tableRows += `</div>`;
    }
    
    skeleton.innerHTML = tableHeader + tableRows;
    
    container.appendChild(skeleton);
  });
}

/**
 * ایجاد اسکلتون برای فید فعالیت‌ها
 */
function createActivityFeedSkeletons() {
  // پیدا کردن کانتینر فید فعالیت‌ها
  const activityContainers = document.querySelectorAll('.activity-container, .dashboard-activity-row');
  
  activityContainers.forEach(container => {
    // پنهان کردن موقت فید‌های فعلی
    const existingFeeds = container.querySelectorAll('.vui-card, .activity-card, .card, .vui-activity-feed');
    existingFeeds.forEach(feed => {
      feed.style.display = 'none';
    });
    
    // ایجاد اسکلتون
    const skeleton = document.createElement('div');
    skeleton.className = 'activity-feed-skeleton';
    
    // هدر فید
    let feedHeader = `
      <div class="activity-header-skeleton">
        <div class="activity-title-skeleton skeleton-loader"></div>
        <div class="activity-action-skeleton skeleton-loader"></div>
      </div>
    `;
    
    // آیتم‌های فید
    let feedItems = '';
    for (let i = 0; i < 5; i++) {
      feedItems += `
        <div class="activity-item-skeleton">
          <div class="activity-icon-skeleton skeleton-loader"></div>
          <div class="activity-content-skeleton">
            <div class="activity-title-item-skeleton skeleton-loader"></div>
            <div class="activity-time-skeleton skeleton-loader"></div>
            <div class="activity-desc-skeleton skeleton-loader"></div>
          </div>
        </div>
      `;
    }
    
    skeleton.innerHTML = feedHeader + feedItems;
    
    container.appendChild(skeleton);
  });
}

/**
 * تنظیم انیمیشن‌های لودینگ پویا برای اجزای مختلف
 */
function setupDynamicLoading() {
  // انیمیشن لودینگ برای دکمه‌ها هنگام کلیک
  setupButtonLoadingAnimation();
  
  // لودینگ برای بخش‌های محتوا هنگام بروزرسانی
  setupContentLoadingAnimation();
}

/**
 * تنظیم انیمیشن لودینگ برای دکمه‌ها هنگام کلیک
 */
function setupButtonLoadingAnimation() {
  // یافتن تمام دکمه‌هایی که نیاز به انیمیشن لودینگ دارند
  const buttons = document.querySelectorAll('.vui-btn, .btn-primary, .btn-info, .btn-success, .btn-warning');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // بررسی اینکه آیا دکمه نیاز به انیمیشن لودینگ دارد یا خیر
      if (this.hasAttribute('data-loading') && this.getAttribute('data-loading') === 'true') {
        e.preventDefault();
        
        // اضافه کردن اسپینر به دکمه
        if (!this.querySelector('.btn-spinner')) {
          const text = this.innerHTML;
          this.setAttribute('data-original-text', text);
          
          // فعال کردن حالت لودینگ
          this.innerHTML = `<span class="btn-spinner"></span> در حال پردازش...`;
          this.classList.add('disabled');
          this.disabled = true;
          
          // شبیه‌سازی زمان بارگذاری
          const originalButton = this;
          setTimeout(function() {
            originalButton.innerHTML = originalButton.getAttribute('data-original-text');
            originalButton.classList.remove('disabled');
            originalButton.disabled = false;
            
            // اجرای عملیات بعد از بارگذاری
            if (originalButton.hasAttribute('data-success-message')) {
              const successMsg = originalButton.getAttribute('data-success-message');
              showToast(successMsg, 'success');
            }
          }, 2000);
        }
      }
    });
  });
}

/**
 * تنظیم انیمیشن لودینگ برای بخش‌های محتوا هنگام بروزرسانی
 */
function setupContentLoadingAnimation() {
  // یافتن تمام دکمه‌های رفرش
  const refreshButtons = document.querySelectorAll('[data-refresh-target]');
  
  refreshButtons.forEach(button => {
    button.addEventListener('click', function() {
      // دریافت هدف رفرش
      const targetId = this.getAttribute('data-refresh-target');
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // فعال کردن حالت لودینگ
        targetElement.classList.add('loading');
        
        // شبیه‌سازی زمان بارگذاری
        setTimeout(function() {
          // پایان حالت لودینگ
          targetElement.classList.remove('loading');
          
          // نمایش پیام موفقیت
          showToast('محتوا با موفقیت به‌روزرسانی شد', 'success');
        }, 1500);
      }
    });
  });
}

/**
 * جایگزینی اسکلتون‌ها با محتوای واقعی
 */
function replaceSkeleton() {
  // حذف اسکلتون‌های کارت‌های آمار
  const statCardSkeletons = document.querySelectorAll('.stat-card-skeleton');
  statCardSkeletons.forEach(skeleton => {
    skeleton.style.opacity = '0';
    setTimeout(() => {
      skeleton.remove();
    }, 300);
  });
  
  // حذف اسکلتون‌های چارت‌ها
  const chartSkeletons = document.querySelectorAll('.chart-skeleton');
  chartSkeletons.forEach(skeleton => {
    skeleton.style.opacity = '0';
    setTimeout(() => {
      skeleton.remove();
    }, 300);
  });
  
  // حذف اسکلتون‌های جدول‌ها
  const tableSkeletons = document.querySelectorAll('.table-skeleton');
  tableSkeletons.forEach(skeleton => {
    skeleton.style.opacity = '0';
    setTimeout(() => {
      skeleton.remove();
    }, 300);
  });
  
  // حذف اسکلتون‌های فید فعالیت‌ها
  const activitySkeletons = document.querySelectorAll('.activity-feed-skeleton');
  activitySkeletons.forEach(skeleton => {
    skeleton.style.opacity = '0';
    setTimeout(() => {
      skeleton.remove();
    }, 300);
  });
  
  // نمایش مجدد محتوای اصلی
  const hiddenElements = document.querySelectorAll('[style*="display: none"]');
  hiddenElements.forEach(element => {
    element.style.display = '';
    element.style.opacity = '0';
    element.style.transform = 'translateY(10px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 100);
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

// زمان‌بندی برای نمایش مجدد محتوای اصلی بعد از اتمام لودینگ
setTimeout(replaceSkeleton, 1500);

// API عمومی
window.visionUiLoading = {
  showLoader: function(targetElement) {
    if (typeof targetElement === 'string') {
      targetElement = document.getElementById(targetElement);
    }
    
    if (targetElement) {
      targetElement.classList.add('loading');
    }
  },
  hideLoader: function(targetElement) {
    if (typeof targetElement === 'string') {
      targetElement = document.getElementById(targetElement);
    }
    
    if (targetElement) {
      targetElement.classList.remove('loading');
    }
  },
  showButtonLoading: function(button, loadingText = 'در حال پردازش...') {
    if (typeof button === 'string') {
      button = document.getElementById(button);
    }
    
    if (button) {
      const text = button.innerHTML;
      button.setAttribute('data-original-text', text);
      button.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
      button.classList.add('disabled');
      button.disabled = true;
    }
  },
  hideButtonLoading: function(button) {
    if (typeof button === 'string') {
      button = document.getElementById(button);
    }
    
    if (button && button.hasAttribute('data-original-text')) {
      button.innerHTML = button.getAttribute('data-original-text');
      button.classList.remove('disabled');
      button.disabled = false;
    }
  },
  createSkeletonLoader: function(type, count = 1) {
    const container = document.createElement('div');
    
    switch (type) {
      case 'stat-card':
        for (let i = 0; i < count; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'stat-card-skeleton skeleton-loader';
          skeleton.innerHTML = `
            <div class="stat-card-header-skeleton">
              <div class="stat-card-icon-skeleton skeleton-loader"></div>
              <div class="stat-card-actions-skeleton skeleton-loader"></div>
            </div>
            <div class="stat-card-title-skeleton skeleton-loader"></div>
            <div class="stat-card-value-skeleton skeleton-loader"></div>
            <div class="stat-card-meta-skeleton skeleton-loader"></div>
            <div class="stat-card-progress-skeleton skeleton-loader"></div>
          `;
          container.appendChild(skeleton);
        }
        break;
      
      case 'table-row':
        for (let i = 0; i < count; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'table-row-skeleton';
          skeleton.innerHTML = `
            <div class="table-avatar-skeleton skeleton-loader"></div>
            <div class="table-cell-skeleton skeleton-loader"></div>
            <div class="table-cell-skeleton skeleton-loader"></div>
            <div class="table-cell-skeleton skeleton-loader"></div>
            <div class="table-cell-skeleton skeleton-loader"></div>
          `;
          container.appendChild(skeleton);
        }
        break;
      
      case 'activity-item':
        for (let i = 0; i < count; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'activity-item-skeleton';
          skeleton.innerHTML = `
            <div class="activity-icon-skeleton skeleton-loader"></div>
            <div class="activity-content-skeleton">
              <div class="activity-title-item-skeleton skeleton-loader"></div>
              <div class="activity-time-skeleton skeleton-loader"></div>
              <div class="activity-desc-skeleton skeleton-loader"></div>
            </div>
          `;
          container.appendChild(skeleton);
        }
        break;
    }
    
    return container;
  }
};