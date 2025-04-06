/**
 * مایکروسافت فلوئنت UI - اسکریپت‌های جاوااسکریپت
 * بر اساس مستندات و طراحی فلوئنت UI مایکروسافت
 */

(function() {
  'use strict';

  // تایید وجود دام قبل از اجرای اسکریپت
  document.addEventListener('DOMContentLoaded', function() {
    initFluentUI();
  });

  /**
   * راه‌اندازی اولیه کامپوننت‌های فلوئنت UI
   */
  function initFluentUI() {
    // راه‌اندازی منوی کناری
    initSidebar();
    
    // راه‌اندازی دراپ‌داون‌ها
    initDropdowns();
    
    // راه‌اندازی تب‌ها
    initTabs();
    
    // راه‌اندازی دیالوگ‌ها
    initDialogs();
    
    // راه‌اندازی توست‌ها
    initToasts();
    
    // راه‌اندازی تولتیپ‌ها
    initTooltips();
    
    // راه‌اندازی جدول‌های قابل مرتب‌سازی
    initSortableTables();
    
    // راه‌اندازی اکسپندر درخت منو
    initTreeView();
    
    // راه‌اندازی گروه‌بندی و جمع‌شدن در جدول‌ها
    initTableGroups();
    
    // راه‌اندازی دکمه‌های کپی
    initCopyButtons();
    
    console.log('Fluent UI initialized successfully.');
  }

  /**
   * راه‌اندازی منوی کناری و عملکرد جمع/باز شدن آن
   */
  function initSidebar() {
    const toggleButton = document.querySelector('.fluent-header-toggle');
    const sidebar = document.querySelector('.fluent-sidebar');
    const mainContent = document.querySelector('.fluent-main');
    const mobileMenuBackdrop = document.querySelector('.fluent-mobile-menu-backdrop');
    
    if (!toggleButton || !sidebar) return;
    
    function toggleSidebar() {
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        sidebar.classList.toggle('show');
        if (mobileMenuBackdrop) {
          mobileMenuBackdrop.classList.toggle('show');
        }
      } else {
        sidebar.classList.toggle('fluent-sidebar-collapsed');
        if (mainContent) {
          mainContent.classList.toggle('sidebar-collapsed');
        }
      }
    }
    
    toggleButton.addEventListener('click', toggleSidebar);
    
    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.addEventListener('click', function() {
        sidebar.classList.remove('show');
        mobileMenuBackdrop.classList.remove('show');
      });
    }
    
    // آیتم‌های قابل گسترش در منوی کناری
    const expandableItems = document.querySelectorAll('.fluent-sidebar-item-expandable');
    
    expandableItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        this.classList.toggle('expanded');
      });
    });
    
    // تنظیم اندازه صفحه برای تشخیص موبایل
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768 && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
        if (mobileMenuBackdrop) {
          mobileMenuBackdrop.classList.remove('show');
        }
      }
    });
  }

  /**
   * راه‌اندازی منوهای کشویی
   */
  function initDropdowns() {
    const dropdownToggles = document.querySelectorAll('[data-toggle="dropdown"]');
    
    dropdownToggles.forEach(toggle => {
      const targetId = toggle.getAttribute('data-target');
      const dropdown = document.getElementById(targetId);
      
      if (!dropdown) return;
      
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        dropdown.classList.toggle('show');
        
        // بستن سایر منوهای کشویی
        document.querySelectorAll('.fluent-dropdown.show').forEach(openDropdown => {
          if (openDropdown !== dropdown) {
            openDropdown.classList.remove('show');
          }
        });
      });
    });
    
    // بستن منوهای کشویی با کلیک خارج از منو
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.fluent-dropdown') && !e.target.closest('[data-toggle="dropdown"]')) {
        document.querySelectorAll('.fluent-dropdown.show').forEach(dropdown => {
          dropdown.classList.remove('show');
        });
      }
    });
  }

  /**
   * راه‌اندازی تب‌ها
   */
  function initTabs() {
    const tabElements = document.querySelectorAll('.fluent-tab');
    
    tabElements.forEach(tab => {
      tab.addEventListener('click', function() {
        // یافتن کانتینر تب فعلی
        const tabsContainer = this.closest('.fluent-tabs');
        if (!tabsContainer) return;
        
        // یافتن تمام تب‌ها در این کانتینر
        const tabs = tabsContainer.querySelectorAll('.fluent-tab');
        const tabContents = document.querySelectorAll('.fluent-tab-content');
        const tabId = this.getAttribute('data-tab');
        const tabContent = document.getElementById(tabId);
        
        // برداشتن کلاس active از تمام تب‌ها
        tabs.forEach(t => t.classList.remove('active'));
        
        // افزودن کلاس active به تب فعلی
        this.classList.add('active');
        
        // مخفی کردن تمام محتوای تب‌ها
        tabContents.forEach(content => content.classList.remove('active'));
        
        // نمایش محتوای تب فعلی
        if (tabContent) {
          tabContent.classList.add('active');
        }
      });
    });
  }

  /**
   * راه‌اندازی دیالوگ‌ها و مودال‌ها
   */
  function initDialogs() {
    // نمایش دیالوگ
    const dialogTriggers = document.querySelectorAll('[data-toggle="dialog"]');
    
    dialogTriggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('data-target');
        const dialog = document.getElementById(targetId);
        
        if (dialog) {
          // نمایش دیالوگ
          dialog.style.display = 'flex';
          setTimeout(() => {
            dialog.classList.add('show');
          }, 10);
          
          // غیرفعال کردن اسکرول صفحه
          document.body.style.overflow = 'hidden';
          
          // فوکوس روی اولین عنصر قابل فوکوس درون دیالوگ
          setTimeout(() => {
            const focusableElement = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElement) {
              focusableElement.focus();
            }
          }, 100);
        }
      });
    });
    
    // بستن دیالوگ
    const closeButtons = document.querySelectorAll('[data-dismiss="dialog"]');
    
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const dialog = this.closest('.fluent-dialog-backdrop');
        
        if (dialog) {
          dialog.classList.remove('show');
          
          // مخفی کردن دیالوگ پس از انیمیشن
          setTimeout(() => {
            dialog.style.display = 'none';
            document.body.style.overflow = '';
          }, 300);
        }
      });
    });
    
    // بستن دیالوگ با کلیک روی پس‌زمینه
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('fluent-dialog-backdrop')) {
        const dialog = e.target;
        
        dialog.classList.remove('show');
        
        // مخفی کردن دیالوگ پس از انیمیشن
        setTimeout(() => {
          dialog.style.display = 'none';
          document.body.style.overflow = '';
        }, 300);
      }
    });
    
    // بستن دیالوگ با کلید ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const openDialogs = document.querySelectorAll('.fluent-dialog-backdrop.show');
        
        if (openDialogs.length > 0) {
          const dialog = openDialogs[openDialogs.length - 1];
          
          dialog.classList.remove('show');
          
          // مخفی کردن دیالوگ پس از انیمیشن
          setTimeout(() => {
            dialog.style.display = 'none';
            document.body.style.overflow = '';
          }, 300);
        }
      }
    });
  }

  /**
   * راه‌اندازی توست‌ها
   */
  function initToasts() {
    // این فقط برای نمونه‌های استاتیک موجود در صفحه است
    // برای توست‌های پویا از تابع زیر استفاده می‌شود
    const toastCloseButtons = document.querySelectorAll('.fluent-toast-close');
    
    toastCloseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const toast = this.closest('.fluent-toast');
        
        if (toast) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
          
          // حذف توست پس از انیمیشن
          setTimeout(() => {
            toast.remove();
          }, 300);
        }
      });
    });
    
    // حذف خودکار توست‌ها پس از مدت زمان مشخص
    document.querySelectorAll('.fluent-toast[data-auto-dismiss]').forEach(toast => {
      const dismissTime = parseInt(toast.getAttribute('data-auto-dismiss')) || 3000;
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        
        // حذف توست پس از انیمیشن
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, dismissTime);
    });
  }

  /**
   * نمایش یک توست جدید
   * @param {Object} options گزینه‌های توست
   * @param {string} options.title عنوان توست
   * @param {string} options.message متن پیام
   * @param {string} options.type نوع توست (success, error, warning, info)
   * @param {number} options.duration مدت زمان نمایش (میلی‌ثانیه)
   */
  window.showToast = function(options) {
    const defaults = {
      title: '',
      message: '',
      type: 'info',
      duration: 5000
    };
    
    const settings = Object.assign({}, defaults, options);
    
    // ایجاد کانتینر توست اگر موجود نیست
    let container = document.querySelector('.fluent-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'fluent-toast-container';
      document.body.appendChild(container);
    }
    
    // ایجاد توست
    const toast = document.createElement('div');
    toast.className = `fluent-toast fluent-toast-${settings.type} fluent-animate-slide-up`;
    toast.setAttribute('role', 'alert');
    
    // تعیین آیکون مناسب
    let iconClass = '';
    switch (settings.type) {
      case 'success':
        iconClass = 'check-circle';
        break;
      case 'error':
        iconClass = 'x-circle';
        break;
      case 'warning':
        iconClass = 'alert-triangle';
        break;
      case 'info':
      default:
        iconClass = 'info';
        break;
    }
    
    // ساختار محتوای توست
    toast.innerHTML = `
      <div class="fluent-toast-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-${iconClass}">
          ${iconClass === 'check-circle' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : ''}
          ${iconClass === 'x-circle' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' : ''}
          ${iconClass === 'alert-triangle' ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' : ''}
          ${iconClass === 'info' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>' : ''}
        </svg>
      </div>
      <div class="fluent-toast-content">
        ${settings.title ? `<h4 class="fluent-toast-title">${settings.title}</h4>` : ''}
        ${settings.message ? `<p class="fluent-toast-message">${settings.message}</p>` : ''}
      </div>
      <button class="fluent-toast-close" aria-label="بستن">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    // افزودن توست به کانتینر
    container.appendChild(toast);
    
    // راه‌اندازی دکمه بستن
    const closeButton = toast.querySelector('.fluent-toast-close');
    closeButton.addEventListener('click', function() {
      removeToast(toast);
    });
    
    // حذف خودکار پس از زمان مشخص
    if (settings.duration > 0) {
      setTimeout(() => {
        removeToast(toast);
      }, settings.duration);
    }
    
    // تابع حذف توست
    function removeToast(toastElement) {
      toastElement.style.opacity = '0';
      toastElement.style.transform = 'translateY(10px)';
      
      // حذف توست پس از انیمیشن
      setTimeout(() => {
        toastElement.remove();
        
        // حذف کانتینر اگر خالی است
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }
    
    return toast;
  };

  /**
   * راه‌اندازی تولتیپ‌ها
   */
  function initTooltips() {
    // این برای تولتیپ‌های استاتیک است که در HTML تعریف شده‌اند
    // برای تولتیپ‌های پویا باید از JS استفاده کرد

    // تعیین پوزیشن تولتیپ بر اساس جهت آن
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      element.addEventListener('mouseenter', function() {
        const tooltip = this.querySelector('.fluent-tooltip-content');
        if (!tooltip) return;
        
        const direction = tooltip.getAttribute('data-direction') || 'top';
        const rect = this.getBoundingClientRect();
        
        switch (direction) {
          case 'bottom':
            tooltip.style.top = '100%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%) translateY(8px)';
            break;
          case 'left':
            tooltip.style.top = '50%';
            tooltip.style.right = '100%';
            tooltip.style.transform = 'translateY(-50%) translateX(-8px)';
            break;
          case 'right':
            tooltip.style.top = '50%';
            tooltip.style.left = '100%';
            tooltip.style.transform = 'translateY(-50%) translateX(8px)';
            break;
          case 'top':
          default:
            tooltip.style.bottom = '100%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%) translateY(-8px)';
            break;
        }
      });
    });
  }

  /**
   * راه‌اندازی جدول‌های قابل مرتب‌سازی
   */
  function initSortableTables() {
    const sortableHeaders = document.querySelectorAll('.fluent-table-sortable');
    
    sortableHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const table = this.closest('table');
        const index = Array.from(this.parentNode.children).indexOf(this);
        const currentIsAsc = this.classList.contains('asc');
        
        // حذف کلاس مرتب‌سازی از تمام هدرها
        sortableHeaders.forEach(h => {
          h.classList.remove('asc', 'desc');
        });
        
        // تنظیم جهت مرتب‌سازی
        if (currentIsAsc) {
          this.classList.add('desc');
        } else {
          this.classList.add('asc');
        }
        
        // مرتب‌سازی ردیف‌های جدول
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const sortedRows = rows.sort((rowA, rowB) => {
          const cellA = rowA.querySelectorAll('td')[index].textContent.trim();
          const cellB = rowB.querySelectorAll('td')[index].textContent.trim();
          
          // بررسی اگر محتوا عدد است
          if (!isNaN(cellA) && !isNaN(cellB)) {
            return currentIsAsc ? 
              parseFloat(cellB) - parseFloat(cellA) : 
              parseFloat(cellA) - parseFloat(cellB);
          }
          
          // مرتب‌سازی متنی
          return currentIsAsc ? 
            cellB.localeCompare(cellA, 'fa') : 
            cellA.localeCompare(cellB, 'fa');
        });
        
        // بازسازی جدول با ردیف‌های مرتب‌شده
        sortedRows.forEach(row => {
          tbody.appendChild(row);
        });
      });
    });
  }

  /**
   * راه‌اندازی نمای درختی
   */
  function initTreeView() {
    const treeToggles = document.querySelectorAll('.fluent-tree-toggle');
    
    treeToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const treeItem = this.closest('.fluent-tree-item');
        treeItem.classList.toggle('expanded');
      });
    });
  }

  /**
   * راه‌اندازی گروه‌بندی‌های جدول
   */
  function initTableGroups() {
    const groupHeaders = document.querySelectorAll('.fluent-table-group-header');
    
    groupHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const content = this.nextElementSibling;
        
        if (content && content.classList.contains('fluent-table-group-content')) {
          this.classList.toggle('collapsed');
          content.classList.toggle('collapsed');
        }
      });
    });
  }

  /**
   * راه‌اندازی دکمه‌های کپی
   */
  function initCopyButtons() {
    const copyButtons = document.querySelectorAll('.fluent-table-copy-button');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', function() {
        const textElement = this.closest('.fluent-table-copy').querySelector('.fluent-table-copy-text');
        
        if (textElement) {
          const text = textElement.textContent.trim();
          
          // کپی متن به کلیپ‌بورد
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          
          // نمایش توست موفقیت
          if (window.showToast) {
            window.showToast({
              title: 'کپی شد',
              message: 'متن با موفقیت کپی شد',
              type: 'success',
              duration: 2000
            });
          }
        }
      });
    });
  }

  /**
   * ایجاد یک دیالوگ تاییدیه
   * @param {Object} options گزینه‌های دیالوگ
   * @param {string} options.title عنوان دیالوگ
   * @param {string} options.message متن پیام
   * @param {string} options.confirmText متن دکمه تایید
   * @param {string} options.cancelText متن دکمه لغو
   * @param {Function} options.onConfirm تابع اجرا شونده در صورت تایید
   * @param {Function} options.onCancel تابع اجرا شونده در صورت لغو
   */
  window.fluentConfirm = function(options) {
    const defaults = {
      title: 'تایید',
      message: 'آیا از انجام این عملیات اطمینان دارید؟',
      confirmText: 'تایید',
      cancelText: 'لغو',
      confirmType: 'primary',
      onConfirm: null,
      onCancel: null
    };
    
    const settings = Object.assign({}, defaults, options);
    
    // ایجاد دیالوگ
    const dialog = document.createElement('div');
    dialog.className = 'fluent-dialog-backdrop';
    dialog.style.display = 'flex';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    
    dialog.innerHTML = `
      <div class="fluent-dialog fluent-dialog-confirm">
        <div class="fluent-dialog-header">
          <h3 class="fluent-dialog-title">${settings.title}</h3>
          <button class="fluent-dialog-close" aria-label="بستن" data-dismiss="dialog">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="fluent-dialog-body">
          <p>${settings.message}</p>
        </div>
        <div class="fluent-dialog-footer">
          <button class="fluent-btn" data-dismiss="dialog">${settings.cancelText}</button>
          <button class="fluent-btn fluent-btn-${settings.confirmType}" id="confirmButton">${settings.confirmText}</button>
        </div>
      </div>
    `;
    
    // افزودن به DOM
    document.body.appendChild(dialog);
    
    // نمایش دیالوگ
    setTimeout(() => {
      dialog.classList.add('show');
      
      // غیرفعال کردن اسکرول صفحه
      document.body.style.overflow = 'hidden';
      
      // فوکوس روی دکمه تایید
      const confirmButton = dialog.querySelector('#confirmButton');
      if (confirmButton) {
        confirmButton.focus();
      }
    }, 10);
    
    // رویداد دکمه تایید
    const confirmButton = dialog.querySelector('#confirmButton');
    confirmButton.addEventListener('click', function() {
      if (typeof settings.onConfirm === 'function') {
        settings.onConfirm();
      }
      
      closeDialog();
    });
    
    // رویداد دکمه لغو و بستن
    const closeButtons = dialog.querySelectorAll('[data-dismiss="dialog"]');
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        if (typeof settings.onCancel === 'function') {
          settings.onCancel();
        }
        
        closeDialog();
      });
    });
    
    // بستن دیالوگ با کلیک روی پس‌زمینه
    dialog.addEventListener('click', function(e) {
      if (e.target === dialog) {
        if (typeof settings.onCancel === 'function') {
          settings.onCancel();
        }
        
        closeDialog();
      }
    });
    
    // بستن دیالوگ با کلید ESC
    const handleKeyDown = function(e) {
      if (e.key === 'Escape') {
        if (typeof settings.onCancel === 'function') {
          settings.onCancel();
        }
        
        closeDialog();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // تابع بستن دیالوگ
    function closeDialog() {
      dialog.classList.remove('show');
      
      // مخفی کردن دیالوگ پس از انیمیشن
      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.removeChild(dialog);
        document.removeEventListener('keydown', handleKeyDown);
      }, 300);
    }
  };

  // افزودن به گلوبال برای دسترسی عمومی
  window.fluentUI = {
    initFluentUI: initFluentUI,
    showToast: window.showToast,
    confirm: window.fluentConfirm
  };

})();