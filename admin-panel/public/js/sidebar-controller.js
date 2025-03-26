/**
 * Vision UI Dashboard - Sidebar Controller
 * کنترل‌کننده سایدبار با قابلیت جمع و باز شدن
 */

document.addEventListener('DOMContentLoaded', function() {
  // راه‌اندازی کنترل‌کننده سایدبار
  initSidebarController();
  
  // بررسی وضعیت ذخیره شده سایدبار
  loadSidebarState();
});

/**
 * راه‌اندازی کنترل‌کننده سایدبار
 */
function initSidebarController() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  if (sidebarToggle) {
    // رویداد کلیک روی دکمه جمع/باز کردن
    sidebarToggle.addEventListener('click', function() {
      toggleSidebar();
    });
    
    // رویداد کلیک روی بخش‌های سایدبار برای موبایل
    const sidebarItems = document.querySelectorAll('.vui-sidebar-nav-item a');
    
    sidebarItems.forEach(item => {
      item.addEventListener('click', function() {
        if (window.innerWidth <= 992) {
          document.body.classList.remove('sidebar-open');
        }
      });
    });
    
    // دکمه منوی موبایل
    const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
    
    if (mobileToggle) {
      mobileToggle.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-open');
      });
    }
    
    // اضافه کردن دکمه موبایل اگر وجود نداشته باشد
    else {
      const header = document.querySelector('.vui-header');
      
      if (header) {
        const mobileBtn = document.createElement('div');
        mobileBtn.className = 'mobile-sidebar-toggle';
        mobileBtn.innerHTML = '<i class="bi bi-list"></i>';
        
        header.insertBefore(mobileBtn, header.firstChild);
        
        mobileBtn.addEventListener('click', function() {
          document.body.classList.toggle('sidebar-open');
        });
      }
    }
    
    // پیاده‌سازی زیرمنوها
    const submenuItems = document.querySelectorAll('.vui-sidebar-nav-item.has-submenu');
    
    submenuItems.forEach(item => {
      const submenuToggle = item.querySelector('.vui-sidebar-nav-text');
      
      if (submenuToggle) {
        submenuToggle.addEventListener('click', function(e) {
          e.preventDefault();
          item.classList.toggle('open');
        });
      }
    });
    
    // بستن سایدبار با کلیک بیرون از آن (برای موبایل)
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 992) {
        const sidebar = document.querySelector('.vui-sidebar');
        const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
        
        if (sidebar && mobileToggle) {
          if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target) && document.body.classList.contains('sidebar-open')) {
            document.body.classList.remove('sidebar-open');
          }
        }
      }
    });
    
    // گوش دادن به تغییر سایز صفحه
    window.addEventListener('resize', function() {
      if (window.innerWidth > 992) {
        document.body.classList.remove('sidebar-open');
      }
    });
  }
}

/**
 * تغییر وضعیت سایدبار بین حالت جمع و باز
 */
function toggleSidebar() {
  document.body.classList.toggle('sidebar-collapsed');
  
  // ذخیره وضعیت
  saveSidebarState();
  
  // ایجاد رویداد سفارشی برای مطلع کردن سایر اسکریپت‌ها
  const event = new CustomEvent('sidebarToggle', {
    detail: { collapsed: document.body.classList.contains('sidebar-collapsed') }
  });
  
  document.dispatchEvent(event);
}

/**
 * ذخیره وضعیت سایدبار در localStorage
 */
function saveSidebarState() {
  const collapsed = document.body.classList.contains('sidebar-collapsed');
  
  try {
    localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
  } catch (error) {
    console.error('Error saving sidebar state:', error);
  }
}

/**
 * بارگذاری وضعیت ذخیره شده سایدبار از localStorage
 */
function loadSidebarState() {
  try {
    const collapsed = localStorage.getItem('sidebar-collapsed');
    
    if (collapsed === 'true') {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  } catch (error) {
    console.error('Error loading sidebar state:', error);
  }
}

// افزودن متدها به window برای دسترسی مستقیم
window.sidebarController = {
  toggle: toggleSidebar,
  collapse: function() {
    document.body.classList.add('sidebar-collapsed');
    saveSidebarState();
  },
  expand: function() {
    document.body.classList.remove('sidebar-collapsed');
    saveSidebarState();
  }
};