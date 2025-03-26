/**
 * بهبود عملکرد منوهای کشویی - رفع مشکل پروفایل و نوتیفیکیشن
 */

document.addEventListener('DOMContentLoaded', function() {
  // بهبود عملکرد درپ‌داون bootstrap
  initDropdownFixes();
  
  // بهبود عملکرد منوی نوتیفیکیشن
  initNotificationDropdown();
  
  // بهبود عملکرد منوی پروفایل
  initProfileDropdown();
});

/**
 * بهبود عملکرد کلی منوهای کشویی بوت‌استرپ
 */
function initDropdownFixes() {
  // هماهنگ‌سازی با راست‌چین بودن قالب
  document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
    if (menu.classList.contains('dropdown-menu-end')) {
      menu.style.left = 'auto';
      menu.style.right = '0';
    }
  });
  
  // بهبود انیمیشن منوهای کشویی
  const dropdownToggles = document.querySelectorAll('[data-bs-toggle="dropdown"]');
  
  dropdownToggles.forEach(function(toggle) {
    toggle.addEventListener('shown.bs.dropdown', function(e) {
      const dropdown = document.querySelector(`[aria-labelledby="${toggle.id}"]`) || 
                       toggle.nextElementSibling;
                       
      if (dropdown && dropdown.classList.contains('dropdown-menu')) {
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(10px)';
        
        setTimeout(function() {
          dropdown.style.opacity = '1';
          dropdown.style.transform = 'translateY(0)';
          dropdown.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }, 0);
      }
    });
  });
}

/**
 * بهبود عملکرد منوی نوتیفیکیشن
 */
function initNotificationDropdown() {
  const notificationToggle = document.querySelector('.notification-bell button');
  const notificationDropdown = document.querySelector('.notification-dropdown');
  
  if (notificationToggle && notificationDropdown) {
    // اضافه کردن کلاس‌های مورد نیاز
    notificationDropdown.classList.add('dropdown-menu-end');
    
    // اطمینان از مقادیر z-index صحیح
    notificationDropdown.style.zIndex = '1050';
    
    // نمایش نوتیفیکیشن با کلیک
    notificationToggle.addEventListener('click', function(e) {
      if (!notificationDropdown.classList.contains('show-manually')) {
        e.stopPropagation();
        showDropdown(notificationDropdown);
      } else {
        e.stopPropagation();
        hideDropdown(notificationDropdown);
      }
    });
    
    // بستن با کلیک بیرون
    document.addEventListener('click', function(e) {
      if (!notificationDropdown.contains(e.target) && 
          !notificationToggle.contains(e.target) &&
          notificationDropdown.classList.contains('show-manually')) {
        hideDropdown(notificationDropdown);
      }
    });
    
    // بستن با کلیک روی آیتم‌ها
    notificationDropdown.querySelectorAll('a').forEach(function(item) {
      item.addEventListener('click', function() {
        hideDropdown(notificationDropdown);
      });
    });
  }
}

/**
 * بهبود عملکرد منوی پروفایل
 */
function initProfileDropdown() {
  const profileToggle = document.querySelector('.user-dropdown button');
  const profileDropdown = document.querySelector('.user-dropdown .dropdown-menu');
  
  if (profileToggle && profileDropdown) {
    // اضافه کردن کلاس‌های مورد نیاز
    profileDropdown.classList.add('dropdown-menu-end');
    
    // اطمینان از مقادیر z-index صحیح
    profileDropdown.style.zIndex = '1050';
    
    // نمایش پروفایل با کلیک
    profileToggle.addEventListener('click', function(e) {
      if (!profileDropdown.classList.contains('show-manually')) {
        e.stopPropagation();
        showDropdown(profileDropdown);
      } else {
        e.stopPropagation();
        hideDropdown(profileDropdown);
      }
    });
    
    // بستن با کلیک بیرون
    document.addEventListener('click', function(e) {
      if (!profileDropdown.contains(e.target) && 
          !profileToggle.contains(e.target) &&
          profileDropdown.classList.contains('show-manually')) {
        hideDropdown(profileDropdown);
      }
    });
    
    // بستن با کلیک روی آیتم‌ها
    profileDropdown.querySelectorAll('a').forEach(function(item) {
      if (!item.classList.contains('dropdown-item-text')) {
        item.addEventListener('click', function() {
          hideDropdown(profileDropdown);
        });
      }
    });
  }
}

/**
 * نمایش منوی کشویی با انیمیشن
 */
function showDropdown(dropdown) {
  dropdown.classList.add('show', 'show-manually');
  dropdown.style.display = 'block';
  dropdown.style.opacity = '0';
  dropdown.style.transform = 'translateY(10px)';
  
  setTimeout(function() {
    dropdown.style.opacity = '1';
    dropdown.style.transform = 'translateY(0)';
    dropdown.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  }, 10);
}

/**
 * مخفی کردن منوی کشویی با انیمیشن
 */
function hideDropdown(dropdown) {
  dropdown.style.opacity = '0';
  dropdown.style.transform = 'translateY(10px)';
  
  setTimeout(function() {
    dropdown.classList.remove('show', 'show-manually');
    dropdown.style.display = 'none';
  }, 300);
}

/**
 * رفع مشکل رنگ‌های متن و بک‌گراند
 */
document.addEventListener('DOMContentLoaded', function() {
  // رفع مشکل بخش‌های سفید
  document.querySelectorAll('.card, .container-fluid, .white-bg, .light-bg').forEach(function(element) {
    element.style.backgroundColor = 'transparent';
  });
  
  // اطمینان از رنگ متن‌ها
  document.querySelectorAll('.card-title, .card-text, .card-header, .card-body, h1, h2, h3, h4, h5, h6, p, .text-content').forEach(function(element) {
    // بررسی اینکه آیا متن خوانده می‌شود
    const color = window.getComputedStyle(element).color;
    if (color === 'rgb(0, 0, 0)' || color === '#000000' || color === '#000' || color === 'black') {
      element.style.color = 'rgba(255, 255, 255, 0.9)';
    }
  });
});