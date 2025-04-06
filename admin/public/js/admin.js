/**
 * فایل اصلی جاوااسکریپت پنل ادمین
 */

document.addEventListener('DOMContentLoaded', function() {
  // نمایش/مخفی‌سازی منوی کناری در حالت موبایل
  const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', function() {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.toggle('show');
        
        // ایجاد/حذف backdrop برای منوی کناری
        let backdrop = document.querySelector('.sidebar-backdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'sidebar-backdrop';
          document.body.appendChild(backdrop);
          
          backdrop.addEventListener('click', function() {
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
          });
        }
        
        if (sidebar.classList.contains('show')) {
          setTimeout(() => {
            backdrop.classList.add('show');
          }, 10);
        } else {
          backdrop.classList.remove('show');
        }
      }
    });
  }
  
  // ذخیره حالت جمع‌شده/بازشده منوی کناری در localStorage
  const sidebarCollapseBtn = document.querySelector('.sidebar-collapse');
  if (sidebarCollapseBtn) {
    const savedState = localStorage.getItem('sidebarCollapsed');
    const adminLayout = document.querySelector('.admin-layout');
    
    if (savedState === 'true' && adminLayout) {
      adminLayout.classList.add('sidebar-collapsed');
    }
    
    sidebarCollapseBtn.addEventListener('click', function() {
      if (adminLayout) {
        adminLayout.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', adminLayout.classList.contains('sidebar-collapsed'));
      }
    });
  }
  
  // ایجاد tooltip برای المان‌های دارای data-tooltip
  const tooltips = document.querySelectorAll('[data-tooltip]');
  tooltips.forEach(el => {
    const tooltipText = document.createElement('span');
    tooltipText.className = 'tooltip-text';
    tooltipText.textContent = el.getAttribute('data-tooltip');
    el.classList.add('tooltip');
    el.appendChild(tooltipText);
  });
  
  // تنظیم کلاس active برای لینک فعلی در منوی کناری
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // بررسی اینکه آیا مسیر فعلی با مسیر لینک شروع می‌شود
    if (href && currentPath.startsWith(href)) {
      // اگر لینک مربوط به داشبورد است، فقط برای مسیر دقیق فعال شود
      if (href === '/admin/dashboard' && currentPath !== '/admin/dashboard') {
        return;
      }
      
      link.classList.add('active');
      
      // پیدا کردن والد dropdown اگر وجود دارد
      const parentDropdown = link.closest('.sidebar-dropdown');
      if (parentDropdown) {
        parentDropdown.classList.add('show');
      }
    }
  });
  
  // مدیریت dropdownهای منوی کناری
  const dropdownToggles = document.querySelectorAll('.sidebar-dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      
      const parent = this.parentElement;
      const dropdown = this.nextElementSibling;
      
      if (parent && dropdown) {
        parent.classList.toggle('show');
        
        // تنظیم ارتفاع برای انیمیشن
        if (parent.classList.contains('show')) {
          dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
        } else {
          dropdown.style.maxHeight = '0px';
        }
      }
    });
    
    // باز کردن dropdown اگر یکی از زیرمنوها فعال است
    const parent = toggle.parentElement;
    const dropdown = toggle.nextElementSibling;
    
    if (parent && dropdown && parent.querySelector('a.active')) {
      parent.classList.add('show');
      dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
    }
  });
  
  // تنظیم حداکثر ارتفاع برای سایدبار در دستگاه‌های با صفحه کوچک
  function adjustSidebarHeight() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth < 992) {
      sidebar.style.maxHeight = window.innerHeight + 'px';
    } else if (sidebar) {
      sidebar.style.maxHeight = '';
    }
  }
  
  adjustSidebarHeight();
  window.addEventListener('resize', adjustSidebarHeight);
  
  // نمایش پیام‌های موفقیت/خطا به مدت محدود
  const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
  if (alerts.length > 0) {
    setTimeout(() => {
      alerts.forEach(alert => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          alert.remove();
        }, 300);
      });
    }, 5000);
  }
  
  // تابع کمکی برای فرمت‌بندی اعداد به فرمت پول
  window.formatCurrency = function(amount, decimals = 0) {
    if (typeof amount !== 'number') {
      amount = parseInt(amount || 0);
    }
    
    return amount.toLocaleString('fa-IR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // تابع کمکی برای فرمت‌بندی تاریخ‌ها
  window.formatDate = function(dateStr, includeTime = false) {
    if (!dateStr) return '-';
    
    const date = new Date(dateStr);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    try {
      return date.toLocaleDateString('fa-IR', options);
    } catch (e) {
      return dateStr;
    }
  };
  
  // تابع کمکی برای زمان نسبی (مثلاً "۳ دقیقه پیش")
  window.timeAgo = function(dateStr) {
    if (!dateStr) return '-';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 30) {
      return formatDate(dateStr);
    } else if (diffDay > 0) {
      return `${diffDay} روز پیش`;
    } else if (diffHour > 0) {
      return `${diffHour} ساعت پیش`;
    } else if (diffMin > 0) {
      return `${diffMin} دقیقه پیش`;
    } else {
      return 'چند لحظه پیش';
    }
  };
  
  // پیمایش موقعیت اسکرول در صفحه
  const scrollPos = sessionStorage.getItem('adminScrollPos_' + window.location.pathname);
  if (scrollPos) {
    window.scrollTo(0, parseInt(scrollPos));
    sessionStorage.removeItem('adminScrollPos_' + window.location.pathname);
  }
  
  // ذخیره موقعیت اسکرول قبل از ناوبری
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && !e.target.getAttribute('target')) {
      sessionStorage.setItem('adminScrollPos_' + window.location.pathname, window.scrollY);
    }
  });
  
  // مدیریت درخواست‌های AJAX با نمایش loading
  window.ajaxRequest = function(url, method = 'GET', data = null, callback = null) {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'ajax-loading';
    loadingEl.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingEl);
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        loadingEl.remove();
        if (callback) callback(null, data);
      })
      .catch(error => {
        loadingEl.remove();
        console.error('Error:', error);
        if (callback) callback(error, null);
      });
  };
  
  // مدیریت مدال‌ها (پنجره‌های modal)
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    const modalId = modal.id;
    
    // دکمه‌های باز کردن مدال
    const modalTriggers = document.querySelectorAll(`[data-modal="${modalId}"]`);
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        openModal(modalId);
      });
    });
    
    // دکمه‌های بستن مدال
    const closeBtns = modal.querySelectorAll('.modal-close, .modal-cancel');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        closeModal(modalId);
      });
    });
    
    // بستن با کلیک روی backdrop
    const backdrop = modal.closest('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) {
          closeModal(modalId);
        }
      });
    }
  });
  
  // تابع‌های باز و بسته کردن مدال
  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const backdrop = modal.closest('.modal-backdrop');
      if (backdrop) {
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    }
  };
  
  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const backdrop = modal.closest('.modal-backdrop');
      if (backdrop) {
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
      }
    }
  };
  
  // تابع برای آپدیت آمار real-time
  function updateRealtimeStats() {
    const statsContainers = document.querySelectorAll('[data-realtime-stats]');
    if (statsContainers.length === 0) return;
    
    fetch('/admin/api/realtime-stats')
      .then(response => response.json())
      .then(data => {
        statsContainers.forEach(container => {
          for (const key in data) {
            const elements = container.querySelectorAll(`[data-stat="${key}"]`);
            elements.forEach(el => {
              if (el) {
                if (el.tagName === 'PROGRESS') {
                  el.value = data[key];
                } else {
                  el.textContent = typeof data[key] === 'number' ? formatCurrency(data[key]) : data[key];
                }
              }
            });
          }
        });
      })
      .catch(error => console.error('Error fetching realtime stats:', error));
  }
  
  // اگر کانتینر آمار real-time وجود داشت، به‌روزرسانی را شروع کن
  if (document.querySelector('[data-realtime-stats]')) {
    updateRealtimeStats(); // اجرای اولیه
    setInterval(updateRealtimeStats, 10000); // به‌روزرسانی هر 10 ثانیه
  }
  
  // تبدیل تمام input های date به datepicker فارسی
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    // این قسمت نیاز به کتابخانه datepicker فارسی دارد
    // در صورت نیاز پیاده‌سازی شود
  });
  
  // تبدیل تمام textarea های دارای کلاس rich-editor به ویرایشگر متن غنی
  const richEditors = document.querySelectorAll('textarea.rich-editor');
  richEditors.forEach(textarea => {
    // این قسمت نیاز به کتابخانه ویرایشگر متن غنی دارد
    // در صورت نیاز پیاده‌سازی شود
  });
  
  // پیاده‌سازی لینک‌های تایید (confirmation links)
  const confirmLinks = document.querySelectorAll('a[data-confirm]');
  confirmLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const message = this.getAttribute('data-confirm') || 'آیا از انجام این عملیات اطمینان دارید؟';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });
  
  // پیاده‌سازی فرم‌های تایید (confirmation forms)
  const confirmForms = document.querySelectorAll('form[data-confirm]');
  confirmForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const message = this.getAttribute('data-confirm') || 'آیا از ارسال این فرم اطمینان دارید؟';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });
  
  // پیاده‌سازی دکمه‌های کپی (copy buttons)
  const copyButtons = document.querySelectorAll('[data-copy]');
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const text = this.getAttribute('data-copy');
      const originalText = this.textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        this.textContent = 'کپی شد!';
        setTimeout(() => {
          this.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
    });
  });
  
  // پیاده‌سازی دکمه‌های کپی با استفاده از سلکتور (copy selector buttons)
  const copySelectorButtons = document.querySelectorAll('[data-copy-selector]');
  copySelectorButtons.forEach(button => {
    button.addEventListener('click', function() {
      const selector = this.getAttribute('data-copy-selector');
      const element = document.querySelector(selector);
      const originalText = this.textContent;
      
      if (element) {
        navigator.clipboard.writeText(element.value || element.textContent).then(() => {
          this.textContent = 'کپی شد!';
          setTimeout(() => {
            this.textContent = originalText;
          }, 2000);
        }).catch(err => {
          console.error('Could not copy text: ', err);
        });
      }
    });
  });
});
