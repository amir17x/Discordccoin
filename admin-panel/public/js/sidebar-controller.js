/**
 * کنترل‌کننده سایدبار
 * این اسکریپت امکان جمع/باز کردن سایدبار را فراهم می‌کند
 */

document.addEventListener('DOMContentLoaded', function() {
    // تنظیم اولیه سایدبار
    initSidebar();
    
    // اضافه کردن دکمه جمع/باز کردن سایدبار
    addSidebarToggleButton();
    
    // حفظ وضعیت سایدبار در localStorage
    loadSidebarState();
    
    // فعال‌سازی منوهای آکاردئونی
    setupAccordionMenus();
    
    // فعال کردن منوی فعلی بر اساس URL
    highlightCurrentPage();
});

/**
 * تنظیم اولیه سایدبار
 */
function initSidebar() {
    var sidebar = document.querySelector('.vui-sidebar');
    if (!sidebar) return;
    
    // اضافه کردن کلاس‌های نیاز برای انیمیشن
    sidebar.classList.add('sidebar-transition');
    
    // تنظیم عرض اولیه
    sidebar.style.width = '260px';
    
    // تنظیم transition برای انیمیشن نرم
    sidebar.style.transition = 'width 0.3s ease, transform 0.3s ease';
}

/**
 * اضافه کردن دکمه جمع/باز کردن سایدبار
 */
function addSidebarToggleButton() {
    var sidebar = document.querySelector('.vui-sidebar');
    if (!sidebar) return;
    
    // ایجاد دکمه
    var toggleButton = document.createElement('button');
    toggleButton.className = 'sidebar-toggle-btn';
    toggleButton.setAttribute('title', 'جمع کردن/بازکردن منو');
    toggleButton.innerHTML = '<i class="bi bi-arrow-bar-left"></i>';
    
    // اضافه کردن دکمه به سایدبار
    sidebar.appendChild(toggleButton);
    
    // اضافه کردن رویداد کلیک
    toggleButton.addEventListener('click', function() {
        toggleSidebar();
    });
}

/**
 * جمع/باز کردن سایدبار
 */
function toggleSidebar() {
    var sidebar = document.querySelector('.vui-sidebar');
    var content = document.querySelector('.vui-content-wrapper');
    var isCollapsed = sidebar.classList.contains('collapsed');
    
    if (isCollapsed) {
        // باز کردن سایدبار
        sidebar.classList.remove('collapsed');
        sidebar.style.width = '260px';
        
        // تغییر آیکون دکمه
        var toggleButton = sidebar.querySelector('.sidebar-toggle-btn i');
        if (toggleButton) toggleButton.className = 'bi bi-arrow-bar-left';
        
        // تنظیم فاصله محتوا
        if (content) content.style.marginRight = '260px';
        
        // نمایش متن منوها
        showMenuTexts();
    } else {
        // جمع کردن سایدبار
        sidebar.classList.add('collapsed');
        sidebar.style.width = '70px';
        
        // تغییر آیکون دکمه
        var toggleButton = sidebar.querySelector('.sidebar-toggle-btn i');
        if (toggleButton) toggleButton.className = 'bi bi-arrow-bar-right';
        
        // تنظیم فاصله محتوا
        if (content) content.style.marginRight = '70px';
        
        // پنهان کردن متن منوها
        hideMenuTexts();
    }
    
    // ذخیره وضعیت سایدبار
    saveSidebarState(!isCollapsed);
}

/**
 * نمایش متن منوهای سایدبار
 */
function showMenuTexts() {
    var menuItems = document.querySelectorAll('.vui-sidebar .nav-link span');
    menuItems.forEach(function(span) {
        span.style.display = 'inline';
        span.style.opacity = '1';
        span.style.width = 'auto';
    });
    
    // نمایش لوگو
    var logoText = document.querySelector('.vui-sidebar .sidebar-brand-text');
    if (logoText) logoText.style.display = 'block';
}

/**
 * پنهان کردن متن منوهای سایدبار
 */
function hideMenuTexts() {
    var menuItems = document.querySelectorAll('.vui-sidebar .nav-link span');
    menuItems.forEach(function(span) {
        span.style.display = 'none';
        span.style.opacity = '0';
        span.style.width = '0';
    });
    
    // پنهان کردن لوگو
    var logoText = document.querySelector('.vui-sidebar .sidebar-brand-text');
    if (logoText) logoText.style.display = 'none';
}

/**
 * ذخیره وضعیت سایدبار در localStorage
 */
function saveSidebarState(isExpanded) {
    try {
        localStorage.setItem('vui-sidebar-expanded', isExpanded ? 'true' : 'false');
    } catch (e) {
        console.log('خطا در ذخیره وضعیت سایدبار:', e);
    }
}

/**
 * بازیابی وضعیت سایدبار از localStorage
 */
function loadSidebarState() {
    try {
        var isExpanded = localStorage.getItem('vui-sidebar-expanded');
        
        if (isExpanded === 'false') {
            // اگر قبلاً جمع شده بود، دوباره جمع شود
            var sidebar = document.querySelector('.vui-sidebar');
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                toggleSidebar();
            }
        }
    } catch (e) {
        console.log('خطا در بازیابی وضعیت سایدبار:', e);
    }
}

/**
 * راه‌اندازی منوهای آکاردئونی سایدبار
 */
function setupAccordionMenus() {
    var accordionToggles = document.querySelectorAll('.vui-sidebar [data-bs-toggle="collapse"]');
    
    accordionToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            var target = this.getAttribute('data-bs-target') || this.getAttribute('href');
            if (!target) return;
            
            // جلوگیری از بسته شدن منو در حالت جمع شده سایدبار
            var sidebar = document.querySelector('.vui-sidebar');
            if (sidebar.classList.contains('collapsed')) {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar(); // باز کردن سایدبار
                
                // با تأخیر منو را باز کن
                setTimeout(function() {
                    var targetElement = document.querySelector(target);
                    if (targetElement && !targetElement.classList.contains('show')) {
                        var bsCollapse = new bootstrap.Collapse(targetElement, {
                            toggle: true
                        });
                    }
                }, 300);
            }
        });
    });
}

/**
 * هایلایت کردن منوی فعال بر اساس URL صفحه
 */
function highlightCurrentPage() {
    var currentPath = window.location.pathname;
    var menuItems = document.querySelectorAll('.vui-sidebar .nav-link');
    
    menuItems.forEach(function(item) {
        var href = item.getAttribute('href');
        if (!href || href === '#') return;
        
        // بررسی آیا لینک با مسیر فعلی مطابقت دارد
        if (currentPath === href || 
            (href !== '/admin' && currentPath.startsWith(href))) {
            item.classList.add('active');
            
            // باز کردن والد آکاردئونی اگر وجود داشته باشد
            var parent = item.closest('.collapse');
            if (parent) {
                parent.classList.add('show');
                var trigger = document.querySelector('[data-bs-target="#' + parent.id + '"]') || 
                             document.querySelector('[href="#' + parent.id + '"]');
                if (trigger) {
                    trigger.classList.remove('collapsed');
                    trigger.setAttribute('aria-expanded', 'true');
                    
                    // فعال کردن والد منو
                    var parentItem = trigger.closest('.nav-item');
                    if (parentItem) {
                        var parentLink = parentItem.querySelector('.nav-link');
                        if (parentLink) parentLink.classList.add('active');
                    }
                }
            }
        } else {
            item.classList.remove('active');
        }
    });
}