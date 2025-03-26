/**
 * انیمیشن‌های لودینگ سریع و بهینه - نسخه بهبود یافته
 * 
 * این فایل اصلاح شده برای رفع مشکل انیمیشن لودینگ که گاهی اوقات پایان نمی‌یابد
 */

(function() {
    // وضعیت لودینگ
    var isLoading = false;
    
    // متغیر عمومی برای تایمر لودینگ
    var loadingTimer = null;
    var safetyTimer = null;

    // تابع کمکی برای نمایش لودینگ
    function showLoader() {
        if (isLoading) return; // جلوگیری از نمایش مجدد اگر در حال حاضر نمایش داده شده است
        
        isLoading = true;
        var loaderContainer = document.querySelector('.loader-container');
        if (loaderContainer) {
            loaderContainer.classList.remove('d-none');
            
            // اطمینان از مخفی شدن لودر پس از حداکثر 3 ثانیه
            // این یک مکانیزم ایمنی است تا لودر هیچ وقت برای همیشه نمایش داده نشود
            if (safetyTimer) clearTimeout(safetyTimer);
            safetyTimer = setTimeout(function() {
                hideLoader();
            }, 3000);
        }
    }
    
    // تابع کمکی برای مخفی کردن لودینگ
    function hideLoader() {
        var loaderContainer = document.querySelector('.loader-container');
        if (loaderContainer) {
            loaderContainer.classList.add('d-none');
            isLoading = false;
            
            // پاکسازی تایمرها
            if (loadingTimer) {
                clearTimeout(loadingTimer);
                loadingTimer = null;
            }
            if (safetyTimer) {
                clearTimeout(safetyTimer);
                safetyTimer = null;
            }
        }
    }
    
    // آماده‌سازی و تنظیم رویدادها
    function initialize() {
        // مدیریت رویداد انتقال صفحه
        document.addEventListener('pageTransition', function() {
            // نمایش لودینگ
            showLoader();
            
            // کد مرتبط با کلاس‌های body
            document.body.classList.add('pageTransitioning');
            document.body.classList.remove('pageReady');
        });
        
        // مخفی کردن لودینگ بعد از لود کامل صفحه
        window.addEventListener('load', function() {
            hideLoader();
            document.body.classList.remove('pageTransitioning');
            document.body.classList.add('pageReady');
        });
        
        // مخفی کردن لودینگ با تاخیر کوتاه در ابتدای لود
        setTimeout(function() {
            hideLoader();
            document.body.classList.remove('pageTransitioning');
            document.body.classList.add('pageReady');
        }, 50);
        
        // شناسایی کلیک روی لینک‌های داخلی برای نمایش لودینگ - این بخش بهبود یافته است
        document.addEventListener('click', function(event) {
            var target = event.target;
            // پیدا کردن نزدیک‌ترین لینک به المان کلیک شده
            while (target && target !== document) {
                if (target.tagName && target.tagName.toLowerCase() === 'a') {
                    var href = target.getAttribute('href');
                    var targetAttr = target.getAttribute('target');
                    var bypassLoader = target.getAttribute('data-bypass-loader');
                    
                    // اگر لینک داخلی است و نباید لودر را دور بزند
                    if (href && 
                        !href.startsWith('#') && 
                        !href.startsWith('javascript:') && 
                        !targetAttr && 
                        bypassLoader !== 'true') {
                        
                        // این تاخیر کوتاه به مرورگر اجازه می‌دهد ابتدا رویداد کلیک را پردازش کند
                        // و سپس لودینگ نمایش داده شود
                        setTimeout(function() {
                            showLoader();
                        }, 10);
                        
                        // هیچ نیازی به تایمر جدید برای مخفی کردن نیست چون
                        // صفحه جدید لود می‌شود و رویداد load مخفی کردن را انجام می‌دهد
                    }
                    break;
                }
                target = target.parentNode;
            }
        });
        
        // اضافه کردن انیمیشن به المان‌های دارای ویژگی data-loading
        var loadingElements = document.querySelectorAll('[data-loading]');
        loadingElements.forEach(function(element) {
            // گرفتن تاخیر دلخواه
            var delay = parseInt(element.getAttribute('data-loading-delay') || '0');
            
            // پنهان کردن عنصر
            element.style.opacity = '0';
            element.style.transform = 'translateY(10px)';
            
            // نمایش عنصر با انیمیشن پس از تاخیر
            setTimeout(function() {
                element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, delay);
        });
    }
    
    // بررسی آماده بودن DOM و شروع مقداردهی
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // فراهم کردن API عمومی
    window.loadingAnimations = {
        show: showLoader,
        hide: hideLoader,
        reset: function() {
            hideLoader();
            document.body.classList.remove('pageTransitioning');
            document.body.classList.add('pageReady');
        },
        // متد جدید برای بررسی وضعیت فعلی لودینگ
        isLoading: function() {
            return isLoading;
        }
    };
})();