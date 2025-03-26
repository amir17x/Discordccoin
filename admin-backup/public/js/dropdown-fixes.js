/**
 * اصلاحات منوهای کشویی
 * این فایل اسکریپت‌های لازم برای رفع مشکلات منوهای کشویی را ارائه می‌دهد
 * نسخه بهبود یافته برای سازگاری با آخرین تغییرات اکشن‌های کاربر
 */

// متغیر عمومی برای دسترسی به توابع از بیرون
window.dropdownFixes = {};

document.addEventListener('DOMContentLoaded', function() {
    // بهبود عملکرد منوهای کشویی
    fixDropdownMenus();
    
    // رفع مشکل منوهای پروفایل و اعلان‌ها
    fixSpecialDropdowns();
    
    // بهبود تعامل با منوهای پروفایل و اعلان‌ها
    enhanceNotificationCenter();
    enhanceProfileDropdown();
    
    // اکسپوز کردن توابع مورد نیاز به عنوان API عمومی
    window.dropdownFixes = {
        positionDropdownMenu: positionDropdownMenu,
        ensureFullVisibility: ensureFullVisibility,
        closeAllDropdowns: closeAllDropdowns
    };
});

/**
 * رفع مشکلات منوهای کشویی عمومی
 */
function fixDropdownMenus() {
    // یافتن تمامی منوهای کشویی
    var dropdownToggles = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    
    // اضافه کردن کلاس‌های لازم و اصلاح موقعیت منوها
    dropdownToggles.forEach(function(toggle) {
        // بررسی وضعیت منوی کشویی
        toggle.addEventListener('click', function(e) {
            // یافتن منوی مربوطه
            var dropdownMenu = this.nextElementSibling;
            if (!dropdownMenu || !dropdownMenu.classList.contains('dropdown-menu')) {
                dropdownMenu = this.parentElement.querySelector('.dropdown-menu');
            }
            
            if (dropdownMenu) {
                // تأخیر کوتاه برای اطمینان از نمایش درست
                setTimeout(function() {
                    // بررسی وضعیت نمایش
                    if (dropdownMenu.classList.contains('show')) {
                        // اطمینان از نمایش کامل
                        dropdownMenu.style.display = 'block';
                        dropdownMenu.style.opacity = '1';
                        dropdownMenu.style.visibility = 'visible';
                        
                        // تنظیم موقعیت صحیح در صفحه
                        positionDropdownMenu(dropdownMenu, toggle);
                    }
                }, 10);
            }
        });
    });
    
    // بستن منوها با کلیک خارج از منو
    document.addEventListener('click', function(e) {
        var target = e.target;
        var isDropdownToggle = target.hasAttribute('data-bs-toggle') && 
                              target.getAttribute('data-bs-toggle') === 'dropdown';
        var isInsideDropdown = target.closest('.dropdown-menu') !== null;
        
        if (!isDropdownToggle && !isInsideDropdown) {
            var openDropdowns = document.querySelectorAll('.dropdown-menu.show');
            openDropdowns.forEach(function(menu) {
                menu.classList.remove('show');
            });
        }
    });
}

/**
 * رفع مشکلات خاص منوهای پروفایل و اعلان‌ها
 */
function fixSpecialDropdowns() {
    // رفع مشکل منوی پروفایل
    var profileDropdown = document.querySelector('.profile-dropdown .dropdown-menu');
    if (profileDropdown) {
        ensureFullVisibility(profileDropdown);
    }
    
    // رفع مشکل منوی اعلان‌ها
    var notificationDropdown = document.querySelector('.notification-center .dropdown-menu');
    if (notificationDropdown) {
        ensureFullVisibility(notificationDropdown);
    }
}

/**
 * اطمینان از نمایش کامل یک منوی کشویی
 */
function ensureFullVisibility(menu) {
    menu.style.maxHeight = '80vh';
    menu.style.overflowY = 'auto';
    menu.style.display = 'block';
    menu.style.opacity = '1';
    menu.style.visibility = 'visible';
    
    // پوزیشن منو
    menu.style.position = 'absolute';
    menu.style.transform = 'none';
    menu.style.top = '100%';
    menu.style.right = '0';
    menu.style.left = 'auto';
    
    // z-index بالا برای رفع مشکلات نمایشی
    menu.style.zIndex = '1050';
}

/**
 * تنظیم موقعیت منوی کشویی بر اساس موقعیت دکمه
 */
function positionDropdownMenu(menu, toggle) {
    // بررسی آیا منو از صفحه خارج می‌شود
    var rect = menu.getBoundingClientRect();
    var toggleRect = toggle.getBoundingClientRect();
    var windowWidth = window.innerWidth;
    
    // تنظیم موقعیت بر اساس RTL یا LTR
    var isRTL = document.dir === 'rtl' || 
                document.documentElement.getAttribute('dir') === 'rtl';
    
    if (isRTL) {
        // برای قالب‌های RTL
        if (rect.right > windowWidth) {
            menu.style.right = '0';
            menu.style.left = 'auto';
        } else if (rect.left < 0) {
            menu.style.left = '0';
            menu.style.right = 'auto';
        }
    } else {
        // برای قالب‌های LTR
        if (rect.right > windowWidth) {
            menu.style.left = 'auto';
            menu.style.right = '0';
        } else if (rect.left < 0) {
            menu.style.left = '0';
            menu.style.right = 'auto';
        }
    }
    
    // تنظیم برای حالت موبایل
    if (windowWidth <= 768) {
        menu.style.position = 'fixed';
        menu.style.top = (toggleRect.bottom + window.scrollY) + 'px';
        
        if (isRTL) {
            menu.style.right = '10px';
            menu.style.left = '10px';
        } else {
            menu.style.left = '10px';
            menu.style.right = '10px';
        }
        
        menu.style.width = 'calc(100% - 20px)';
        menu.style.maxWidth = '400px';
    }
}

/**
 * بهبود عملکرد مرکز اعلان‌ها
 */
function enhanceNotificationCenter() {
    var notificationToggle = document.querySelector('.notification-center [data-bs-toggle="dropdown"]');
    if (!notificationToggle) return;
    
    notificationToggle.addEventListener('click', function() {
        setTimeout(function() {
            var menu = document.querySelector('.notification-center .dropdown-menu');
            if (menu && menu.classList.contains('show')) {
                // تنظیمات خاص برای منوی اعلان‌ها
                menu.style.width = '320px';
                menu.style.maxHeight = '80vh';
                
                // اسکرول به بالای لیست
                var notificationList = menu.querySelector('.notification-list');
                if (notificationList) {
                    notificationList.scrollTop = 0;
                }
                
                // علامت‌گذاری اعلان‌ها به عنوان خوانده‌شده
                var unreadBadge = document.querySelector('.notification-badge');
                if (unreadBadge) {
                    unreadBadge.style.display = 'none';
                }
            }
        }, 10);
    });
}

/**
 * بهبود عملکرد منوی پروفایل
 */
function enhanceProfileDropdown() {
    var profileToggle = document.querySelector('.profile-dropdown [data-bs-toggle="dropdown"]');
    if (!profileToggle) return;
    
    profileToggle.addEventListener('click', function() {
        setTimeout(function() {
            var menu = document.querySelector('.profile-dropdown .dropdown-menu');
            if (menu && menu.classList.contains('show')) {
                // تنظیمات خاص برای منوی پروفایل
                menu.style.width = '280px';
                menu.style.maxHeight = '80vh';
            }
        }, 10);
    });
}

/**
 * بستن تمام منوهای کشویی باز در صفحه
 * @returns {number} تعداد منوهای بسته شده
 */
function closeAllDropdowns() {
    var openDropdowns = document.querySelectorAll('.dropdown-menu.show');
    var count = openDropdowns.length;
    
    openDropdowns.forEach(function(menu) {
        menu.classList.remove('show');
    });
    
    // بستن هر نوع دراپ‌داون سفارشی دیگر در صفحه
    var customDropdowns = document.querySelectorAll('.vui-actions-dropdown.show');
    customDropdowns.forEach(function(dropdown) {
        if (dropdown.parentNode) {
            dropdown.parentNode.removeChild(dropdown);
        }
    });
    
    return count;
}