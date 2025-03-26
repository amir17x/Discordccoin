/**
 * انیمیشن‌های لودینگ سریع و بهینه
 * 
 * این فایل انیمیشن‌های لودینگ را پیاده‌سازی می‌کند که سریعتر و قبل از محتوا ظاهر می‌شوند
 */

(function() {
    // تابع کمکی برای نمایش لودینگ
    function showLoader() {
        var loaderContainer = document.querySelector('.loader-container');
        if (loaderContainer) {
            loaderContainer.classList.remove('d-none');
        }
    }
    
    // تابع کمکی برای مخفی کردن لودینگ
    function hideLoader() {
        var loaderContainer = document.querySelector('.loader-container');
        if (loaderContainer) {
            loaderContainer.classList.add('d-none');
        }
    }
    
    // آماده‌سازی و تنظیم رویدادها
    document.addEventListener('DOMContentLoaded', function() {
        // مدیریت رویداد انتقال صفحه (تغییر صفحه)
        document.addEventListener('pageTransition', function() {
            // نمایش لودینگ
            showLoader();
            
            // اضافه کردن کلاس transitioning به بدنه صفحه
            document.body.classList.add('pageTransitioning');
            
            // حذف کلاس آماده از بدنه صفحه
            document.body.classList.remove('pageReady');
        });
        
        // ثبت رویداد برای مخفی کردن لودینگ هنگام بارگذاری کامل صفحه
        window.addEventListener('load', function() {
            // اطمینان از مخفی شدن لودر پس از بارگذاری کامل
            hideLoader();
            
            // حذف کلاس transitioning و اضافه کردن کلاس ready
            document.body.classList.remove('pageTransitioning');
            document.body.classList.add('pageReady');
        });
        
        // مخفی کردن لودینگ با تاخیر کوتاه برای جلوگیری از فلش محتوا
        setTimeout(function() {
            hideLoader();
            
            // حذف کلاس transitioning و اضافه کردن کلاس ready
            document.body.classList.remove('pageTransitioning');
            document.body.classList.add('pageReady');
        }, 50);
        
        // دریافت همه افکت‌های لودینگ در صفحه
        var loadingElements = document.querySelectorAll('[data-loading]');
        loadingElements.forEach(function(element) {
            // گرفتن تاخیر دلخواه از طریق ویژگی data-loading-delay
            var delay = element.getAttribute('data-loading-delay') || 0;
            
            // پنهان کردن عنصر
            element.style.opacity = '0';
            element.style.transform = 'translateY(10px)';
            
            // نمایش عنصر با انیمیشن پس از تاخیر
            setTimeout(function() {
                element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, parseInt(delay));
        });
    });
    
    // فراهم کردن API عمومی برای کنترل انیمیشن‌ها
    window.loadingAnimations = {
        show: showLoader,
        hide: hideLoader
    };
})();