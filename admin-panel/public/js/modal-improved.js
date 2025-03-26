/**
 * سیستم مودال بهبود یافته
 * - رفع مشکل کارنکردن دکمه‌های تأیید
 * - رفع مشکل خطای object Object
 * - پشتیبانی از فرم‌های داخل مودال
 */

(function() {
    // متغیرهای سراسری
    var activeModal = null;
    var isModalVisible = false;
    var modalBackdrop = null;
    
    // پیش‌بارگذاری کتابخانه‌های مورد نیاز
    ensureLibraries();
    
    /**
     * اطمینان از وجود کتابخانه‌های مورد نیاز
     */
    function ensureLibraries() {
        // اگر کتابخانه jQuery وجود نداشته باشد، لود شود
        if (typeof jQuery === 'undefined') {
            console.warn('jQuery not found, trying to load it');
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';
            script.onload = function() {
                console.log('jQuery loaded successfully');
            };
            document.head.appendChild(script);
        }
    }
    
    /**
     * نمایش مودال
     * @param {string} htmlContent - محتوای HTML مودال
     * @param {Function} callback - تابع فراخوانی بعد از نمایش مودال
     * @param {Object} options - تنظیمات اضافی
     */
    window.showModalImproved = function(htmlContent, callback, options = {}) {
        console.log('Opening improved modal with callback');
        
        // بستن مودال قبلی اگر باز است
        if (activeModal) {
            closeModalImproved();
        }
        
        // ایجاد backdrop
        modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'vui-modal-backdrop';
        modalBackdrop.style.position = 'fixed';
        modalBackdrop.style.top = '0';
        modalBackdrop.style.left = '0';
        modalBackdrop.style.width = '100%';
        modalBackdrop.style.height = '100%';
        modalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalBackdrop.style.zIndex = '1040';
        modalBackdrop.style.display = 'block';
        
        // اضافه کردن به DOM
        document.body.appendChild(modalBackdrop);
        
        // ایجاد کانتینر مودال
        activeModal = document.createElement('div');
        activeModal.className = 'vui-modal-container';
        activeModal.innerHTML = htmlContent;
        activeModal.style.position = 'fixed';
        activeModal.style.top = '0';
        activeModal.style.left = '0';
        activeModal.style.width = '100%';
        activeModal.style.height = '100%';
        activeModal.style.display = 'flex';
        activeModal.style.alignItems = 'center';
        activeModal.style.justifyContent = 'center';
        activeModal.style.zIndex = '1050';
        
        // اضافه کردن به DOM
        document.body.appendChild(activeModal);
        
        // فعال‌سازی اسکرول‌بار مودال
        var modalDialogs = activeModal.querySelectorAll('.modal-dialog');
        modalDialogs.forEach(function(dialog) {
            dialog.style.maxHeight = '90vh';
            dialog.style.overflowY = 'auto';
        });
        
        // اضافه کردن کلاس‌های فعال به مودال
        var modalElements = activeModal.querySelectorAll('.modal');
        modalElements.forEach(function(modal) {
            modal.classList.add('show');
            modal.style.display = 'block';
            
            // اضافه کردن ویژگی‌های اضافی
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            
            // اضافه کردن شناسه به مودال اگر ندارد
            if (!modal.hasAttribute('id')) {
                modal.id = 'vui-modal-' + Math.floor(Math.random() * 1000000);
            }
        });
        
        // حل مشکل چک‌باکس‌ها و رادیو باتن‌ها
        var inputs = activeModal.querySelectorAll('input[type="checkbox"], input[type="radio"]');
        inputs.forEach(function(input) {
            input.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
        
        // اضافه کردن رویداد بستن برای دکمه close
        var closeButtons = activeModal.querySelectorAll('[data-bs-dismiss="modal"], [data-dismiss="modal"], .close');
        closeButtons.forEach(function(button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                closeModalImproved();
            });
        });
        
        // اضافه کردن رویداد بستن برای کلیک روی backdrop
        modalBackdrop.addEventListener('click', function() {
            if (options.static !== true) {
                closeModalImproved();
            } else {
                // افکت استاتیک (تکان خوردن)
                modalElements.forEach(function(modal) {
                    modal.classList.add('modal-static');
                    setTimeout(function() {
                        modal.classList.remove('modal-static');
                    }, 300);
                });
            }
        });
        
        // اضافه کردن رویداد کلید Escape
        var escapeHandler = function(e) {
            if (e.key === 'Escape' && options.static !== true) {
                closeModalImproved();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // جلوگیری از نشر رویداد در محتوای مودال
        var modalContents = activeModal.querySelectorAll('.modal-content');
        modalContents.forEach(function(content) {
            content.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
        
        // به روزرسانی وضعیت نمایش
        isModalVisible = true;
        
        // اجرای callback بعد از نمایش مودال
        if (typeof callback === 'function') {
            // استفاده از تایمر برای اطمینان از اینکه DOM به‌روز شده است
            setTimeout(function() {
                callback(activeModal);
            }, 100);
        }
        
        // برای فرم‌های داخل مودال
        setupFormHandlers(activeModal);
        
        // برگرداندن مودال برای استفاده خارجی
        return activeModal;
    };
    
    /**
     * بستن مودال فعال
     */
    window.closeModalImproved = function() {
        console.log('Closing improved modal');
        
        if (!activeModal) return;
        
        // اعمال افکت خروج
        var modalElements = activeModal.querySelectorAll('.modal');
        modalElements.forEach(function(modal) {
            modal.classList.remove('show');
        });
        
        // تایمر برای حذف المان‌ها پس از پایان انیمیشن
        setTimeout(function() {
            if (modalBackdrop && modalBackdrop.parentNode) {
                modalBackdrop.parentNode.removeChild(modalBackdrop);
            }
            
            if (activeModal && activeModal.parentNode) {
                activeModal.parentNode.removeChild(activeModal);
            }
            
            activeModal = null;
            modalBackdrop = null;
            isModalVisible = false;
            
            // فعال کردن اسکرول بدنه
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 300);
    };
    
    /**
     * راه‌اندازی مدیریت فرم‌های داخل مودال
     * @param {HTMLElement} modalContainer - کانتینر مودال
     */
    function setupFormHandlers(modalContainer) {
        if (!modalContainer) return;
        
        // پیدا کردن تمام فرم‌ها
        var forms = modalContainer.querySelectorAll('form');
        
        forms.forEach(function(form) {
            // اگر فرم method و action داشته باشد
            if (form.getAttribute('method') && form.getAttribute('action')) {
                // فرم معمولی با ارسال به سرور
                form.addEventListener('submit', function(e) {
                    // بدون نیاز به کد خاصی، فرم به صورت عادی ارسال می‌شود
                });
            } else {
                // فرم‌های بدون method یا action به صورت AJAX پردازش می‌شوند
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // یافتن دکمه submit فرم
                    var submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton) {
                        // شبیه‌سازی کلیک روی دکمه تأیید مودال
                        var confirmId = submitButton.getAttribute('data-confirm-id');
                        if (confirmId) {
                            var confirmButton = document.getElementById(confirmId);
                            if (confirmButton) {
                                confirmButton.click();
                            }
                        }
                    }
                });
            }
        });
        
        // کنترل دکمه‌های تأیید مودال
        var confirmButtons = modalContainer.querySelectorAll('[data-role="confirm"]');
        confirmButtons.forEach(function(button) {
            button.addEventListener('click', function(e) {
                // اگر دکمه مرتبط با فرمی است
                var formId = button.getAttribute('data-form-id');
                if (formId) {
                    var form = document.getElementById(formId);
                    if (form) {
                        // ارسال فرم به جای اجرای عملیات مستقیم
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
    }
    
    // اضافه کردن تابع به window برای دسترسی خارجی
    window.isModalVisibleImproved = function() {
        return isModalVisible;
    };
    
    console.log('Modal improved system loaded successfully');
})();