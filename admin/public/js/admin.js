/**
 * CCOIN Admin Panel JavaScript
 * Main administrative interface functions
 */

document.addEventListener('DOMContentLoaded', function() {
  // تنظیم وضعیت سایدبار
  setupSidebar();
  
  // منوی کاربر
  setupUserMenu();
  
  // پنهان کردن پیام‌های خطا و موفقیت پس از مدتی
  setupAlertDismiss();
  
  // فعال‌سازی tooltip‌ها
  setupTooltips();
  
  // تنظیم رویدادهای اختصاصی برای صفحات
  setupPageSpecificEvents();
  
  // تنظیم نمودارها (در صورت وجود)
  setupCharts();
});

/**
 * تنظیم رفتار سایدبار
 */
function setupSidebar() {
  // دکمه باز و بسته کردن سایدبار در موبایل
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });
    
    // بستن سایدبار با کلیک بیرون از آن
    document.addEventListener('click', function(event) {
      if (window.innerWidth <= 768 && 
          sidebar.classList.contains('active') && 
          !sidebar.contains(event.target) && 
          event.target !== sidebarToggle) {
        sidebar.classList.remove('active');
      }
    });
  }
  
  // باز و بسته کردن سایدبار در تبلت
  const expandToggle = document.getElementById('expand-toggle');
  
  if (expandToggle && sidebar) {
    expandToggle.addEventListener('click', function() {
      sidebar.classList.toggle('expanded');
    });
  }
  
  // مشخص کردن لینک فعال
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath === href || (href !== '/admin' && currentPath.startsWith(href))) {
      link.classList.add('active');
      
      // باز کردن منوی والد در صورت وجود
      const parentSection = link.closest('.section-submenu');
      if (parentSection) {
        parentSection.classList.add('open');
      }
    }
  });
  
  // باز و بسته کردن زیرمنو
  const submenuToggles = document.querySelectorAll('.submenu-toggle');
  
  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const submenu = this.nextElementSibling;
      submenu.classList.toggle('open');
      this.querySelector('i:last-child').classList.toggle('fa-angle-down');
      this.querySelector('i:last-child').classList.toggle('fa-angle-left');
    });
  });
}

/**
 * تنظیم منوی کاربر
 */
function setupUserMenu() {
  const userMenuBtn = document.querySelector('.user-menu-btn');
  const userMenuDropdown = document.querySelector('.user-menu-dropdown');
  
  if (userMenuBtn && userMenuDropdown) {
    userMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      userMenuDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', function(e) {
      if (!userMenuBtn.contains(e.target)) {
        userMenuDropdown.classList.remove('show');
      }
    });
  }
}

/**
 * پنهان کردن پیام‌های خطا و موفقیت پس از مدتی
 */
function setupAlertDismiss() {
  const alerts = document.querySelectorAll('.alert');
  
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      setTimeout(() => {
        alert.style.display = 'none';
      }, 500);
    }, 5000);
    
    // دکمه بستن
    const closeBtn = alert.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.style.display = 'none';
        }, 500);
      });
    }
  });
}

/**
 * فعال‌سازی tooltip‌ها
 */
function setupTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(el => {
    el.addEventListener('mouseover', function() {
      const tooltipText = this.getAttribute('data-tooltip');
      
      const tooltip = document.createElement('div');
      tooltip.classList.add('tooltip');
      tooltip.textContent = tooltipText;
      
      document.body.appendChild(tooltip);
      
      const rect = this.getBoundingClientRect();
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
      
      tooltip.classList.add('show');
      
      this.addEventListener('mouseout', function() {
        tooltip.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(tooltip);
        }, 300);
      }, { once: true });
    });
  });
}

/**
 * تنظیم رویدادهای اختصاصی برای صفحات
 */
function setupPageSpecificEvents() {
  // خالی کردن فیلتر فرم‌ها
  const resetFilterBtns = document.querySelectorAll('.reset-filter');
  
  resetFilterBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const form = this.closest('form');
      
      if (form) {
        const inputs = form.querySelectorAll('input:not([type=submit]), select');
        inputs.forEach(input => {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
          } else {
            input.value = '';
          }
        });
        
        form.submit();
      }
    });
  });
  
  // اکشن‌های جدول
  setupTableActions();
  
  // فرم‌های با تأیید
  setupConfirmForms();
}

/**
 * تنظیم اکشن‌های جدول
 */
function setupTableActions() {
  // دکمه‌های تغییر وضعیت
  const toggleBtns = document.querySelectorAll('.toggle-status');
  
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      const url = this.getAttribute('data-url');
      const status = this.getAttribute('data-status');
      const newStatus = status === 'true' ? 'false' : 'true';
      const itemName = this.getAttribute('data-name') || 'این آیتم';
      
      if (confirm(`آیا از ${status === 'true' ? 'غیرفعال' : 'فعال'} کردن ${itemName} اطمینان دارید؟`)) {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: `enabled=${newStatus}`
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // تغییر وضعیت دکمه
            this.setAttribute('data-status', newStatus);
            
            if (newStatus === 'true') {
              this.innerHTML = '<i class="fas fa-toggle-on"></i>';
              this.classList.remove('btn-danger');
              this.classList.add('btn-success');
            } else {
              this.innerHTML = '<i class="fas fa-toggle-off"></i>';
              this.classList.remove('btn-success');
              this.classList.add('btn-danger');
            }
            
            // نمایش پیام
            showToast('عملیات با موفقیت انجام شد', 'success');
          } else {
            showToast(data.error || 'خطا در انجام عملیات', 'error');
          }
        })
        .catch(error => {
          showToast('خطا در برقراری ارتباط با سرور', 'error');
          console.error('Error:', error);
        });
      }
    });
  });
}

/**
 * تنظیم فرم‌های با تأیید
 */
function setupConfirmForms() {
  const confirmForms = document.querySelectorAll('form[data-confirm]');
  
  confirmForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const confirmMessage = this.getAttribute('data-confirm');
      
      if (!confirm(confirmMessage)) {
        e.preventDefault();
      }
    });
  });
}

/**
 * نمایش پیام toast
 * @param {string} message متن پیام
 * @param {string} type نوع پیام (success, error, warning, info)
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  toast.innerHTML = `
    <div class="toast-header">
      <i class="fas fa-${type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : (type === 'warning' ? 'exclamation-triangle' : 'info-circle'))}"></i>
      <button class="toast-close">&times;</button>
    </div>
    <div class="toast-body">${message}</div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 5000);
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', function() {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  });
}

/**
 * تنظیم نمودارهای داشبورد
 */
function setupCharts() {
  // بررسی وجود کتابخانه Chart.js
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Charts will not be displayed.');
    return;
  }
  
  // نمودار فعالیت کاربران
  const userActivityChart = document.getElementById('userActivityChart');
  if (userActivityChart) {
    new Chart(userActivityChart, {
      type: 'line',
      data: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        datasets: [{
          label: 'کاربران فعال',
          backgroundColor: 'rgba(0, 255, 157, 0.2)',
          borderColor: 'rgba(0, 255, 157, 1)',
          data: [65, 78, 90, 82, 96, 110],
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  // نمودار اقتصادی
  const economyChart = document.getElementById('economyChart');
  if (economyChart) {
    new Chart(economyChart, {
      type: 'bar',
      data: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        datasets: [{
          label: 'سکه‌های وارد شده',
          backgroundColor: 'rgba(0, 255, 157, 0.5)',
          borderColor: 'rgba(0, 255, 157, 1)',
          borderWidth: 1,
          data: [12000, 19000, 15000, 21000, 25000, 18000]
        }, {
          label: 'سکه‌های خارج شده',
          backgroundColor: 'rgba(255, 82, 82, 0.5)',
          borderColor: 'rgba(255, 82, 82, 1)',
          borderWidth: 1,
          data: [8000, 14000, 11000, 16000, 19000, 15000]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  // نمودار بازی‌ها
  const gamesChart = document.getElementById('gamesChart');
  if (gamesChart) {
    new Chart(gamesChart, {
      type: 'pie',
      data: {
        labels: ['قمار', 'رولت', 'اسلات', 'حکم', 'بلک جک', 'سایر'],
        datasets: [{
          backgroundColor: [
            'rgba(0, 255, 157, 0.7)',
            'rgba(41, 182, 246, 0.7)',
            'rgba(255, 170, 0, 0.7)', 
            'rgba(156, 39, 176, 0.7)',
            'rgba(244, 67, 54, 0.7)',
            'rgba(158, 158, 158, 0.7)'
          ],
          borderColor: '#2A2A2A',
          borderWidth: 2,
          data: [35, 20, 15, 10, 15, 5]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }
}