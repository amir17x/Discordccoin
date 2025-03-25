/**
 * اسکریپت اصلی پنل مدیریت Ccoin
 * نسخه 1.0
 */

document.addEventListener('DOMContentLoaded', function() {
  // ایجاد نمونه‌های ابزارهای بوت‌استرپ
  initBootstrapTools();
  
  // تنظیم منوی سایدبار
  setupSidebar();
  
  // تنظیم پیام‌های فلش
  setupFlashMessages();
  
  // اضافه کردن تولتیپ‌ها
  setupTooltips();
  
  // تنظیم جدول‌های داده
  setupDataTables();
});

/**
 * راه‌اندازی ابزارهای بوت‌استرپ
 */
function initBootstrapTools() {
  // فعال‌سازی تولتیپ‌ها
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // فعال‌سازی پاپ‌آورها
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
}

/**
 * تنظیم سایدبار
 */
function setupSidebar() {
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const wrapper = document.querySelector('.wrapper');
  
  if (sidebarToggle && wrapper) {
    sidebarToggle.addEventListener('click', function() {
      wrapper.classList.toggle('sidebar-collapsed');
      
      // ذخیره وضعیت در localStorage
      if (wrapper.classList.contains('sidebar-collapsed')) {
        localStorage.setItem('sidebar-collapsed', 'true');
      } else {
        localStorage.setItem('sidebar-collapsed', 'false');
      }
    });
    
    // بررسی وضعیت ذخیره شده در localStorage
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      wrapper.classList.add('sidebar-collapsed');
    }
  }
  
  // مدیریت سایدبار در نمایش موبایل
  const mediaQuery = window.matchMedia('(max-width: 992px)');
  handleSidebarOnMobile(mediaQuery);
  mediaQuery.addEventListener('change', handleSidebarOnMobile);
}

/**
 * مدیریت سایدبار در نمایش موبایل
 */
function handleSidebarOnMobile(mediaQuery) {
  const sidebar = document.querySelector('.sidebar');
  const menuLinks = document.querySelectorAll('.menu-link');
  
  if (mediaQuery.matches) {
    // منوی موبایل
    menuLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (sidebar) {
          sidebar.classList.remove('show');
        }
      });
    });
    
    // دکمه‌ی نمایش منو در موبایل
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('show');
      });
    }
    
    // بستن منو با کلیک خارج از منو
    document.addEventListener('click', function(event) {
      if (sidebar && !sidebar.contains(event.target) && !event.target.closest('#sidebar-toggle')) {
        sidebar.classList.remove('show');
      }
    });
  }
}

/**
 * تنظیم پیام‌های فلش
 */
function setupFlashMessages() {
  // بستن خودکار پیام‌های فلش بعد از 5 ثانیه
  const flashMessages = document.querySelectorAll('.alert-dismissible');
  flashMessages.forEach(function(message) {
    setTimeout(function() {
      const closeBtn = message.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.click();
      }
    }, 5000);
  });
}

/**
 * تنظیم تولتیپ‌های راهنما
 */
function setupTooltips() {
  document.querySelectorAll('.help-tooltip').forEach(function(element) {
    element.addEventListener('mouseover', function() {
      const tooltipText = this.getAttribute('data-tooltip');
      
      // ایجاد تولتیپ
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      tooltip.textContent = tooltipText;
      
      // موقعیت تولتیپ
      const rect = this.getBoundingClientRect();
      tooltip.style.top = rect.bottom + 10 + 'px';
      tooltip.style.left = rect.left + (rect.width / 2) + 'px';
      
      // اضافه کردن به DOM
      document.body.appendChild(tooltip);
      
      // حذف تولتیپ بعد از mouseout
      this.addEventListener('mouseout', function() {
        document.querySelectorAll('.custom-tooltip').forEach(function(t) {
          t.remove();
        });
      }, { once: true });
    });
  });
}

/**
 * تنظیم جدول‌های داده
 */
function setupDataTables() {
  const tables = document.querySelectorAll('.table');
  
  tables.forEach(function(table) {
    // افزودن کلاس‌های مرتب‌سازی به هدر جدول
    const sortableHeaders = table.querySelectorAll('th[data-sortable="true"]');
    sortableHeaders.forEach(function(header) {
      header.classList.add('sortable');
      header.addEventListener('click', function() {
        const sortDirection = this.getAttribute('data-sort-direction') || 'asc';
        const columnIndex = Array.from(this.parentElement.children).indexOf(this);
        
        // مرتب‌سازی جدول
        sortTable(table, columnIndex, sortDirection);
        
        // تغییر جهت مرتب‌سازی برای کلیک بعدی
        this.setAttribute('data-sort-direction', sortDirection === 'asc' ? 'desc' : 'asc');
        
        // به‌روزرسانی آیکون
        updateSortIcons(table, this);
      });
    });
  });
}

/**
 * مرتب‌سازی جدول
 */
function sortTable(table, columnIndex, direction) {
  const tableBody = table.querySelector('tbody');
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  
  rows.sort(function(a, b) {
    const cellA = a.querySelectorAll('td')[columnIndex].textContent.trim();
    const cellB = b.querySelectorAll('td')[columnIndex].textContent.trim();
    
    if (direction === 'asc') {
      return cellA.localeCompare(cellB, 'fa-IR');
    } else {
      return cellB.localeCompare(cellA, 'fa-IR');
    }
  });
  
  // حذف ردیف‌های فعلی
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  
  // افزودن ردیف‌های مرتب شده
  rows.forEach(function(row) {
    tableBody.appendChild(row);
  });
}

/**
 * به‌روزرسانی آیکون‌های مرتب‌سازی
 */
function updateSortIcons(table, activeHeader) {
  const headers = table.querySelectorAll('th[data-sortable="true"]');
  
  headers.forEach(function(header) {
    // حذف کلاس‌های قبلی
    header.classList.remove('sort-asc', 'sort-desc');
    
    // اضافه کردن آیکون به هدر فعال
    if (header === activeHeader) {
      const direction = header.getAttribute('data-sort-direction');
      header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

/**
 * فرمت کردن اعداد به فرمت فارسی با جداکننده هزارگان
 */
function formatNumber(number) {
  return new Intl.NumberFormat('fa-IR').format(number);
}

/**
 * تبدیل تاریخ به فرمت فارسی
 */
function formatDate(date) {
  if (!date) return 'بدون تاریخ';
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString('fa-IR', options);
}

/**
 * نمایش پیام تأیید
 */
function showConfirmation(message, callback) {
  if (confirm(message)) {
    callback();
  }
}