/**
 * رفع مشکل دکمه‌های تایید در مودال‌ها
 * این فایل مشکل عدم کارکرد دکمه‌های تایید در مودال‌های پنل مدیریت را رفع می‌کند
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Modal confirmation fix loaded');
    
    // فعال‌سازی مجدد رویدادهای مودال
    fixModalConfirmation();
    
    // مدیریت رویدادهای مودال‌های ساخته شده به صورت پویا
    observeModalCreation();
});

/**
 * رفع مشکل دکمه‌های تایید در مودال‌ها
 */
function fixModalConfirmation() {
    // ثبت مجدد رویدادها روی دکمه‌های تایید
    document.addEventListener('click', function(e) {
        // بررسی آیا کلیک روی دکمه تایید در مودال بوده است
        if (e.target && e.target.matches('.modal .btn-primary')) {
            console.log('Modal confirmation button clicked:', e.target);
            
            // مشخص کردن مودال مربوطه
            var modal = e.target.closest('.modal');
            if (!modal) return;
            
            console.log('Modal found:', modal);
            
            // یافتن فرم‌ها در مودال
            var form = modal.querySelector('form');
            if (form) {
                console.log('Form found in modal:', form);
                
                // بررسی اعتبارسنجی فرم
                if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
                    console.log('Form validation failed');
                    form.reportValidity();
                    return;
                }
                
                // جمع‌آوری داده‌های فرم
                var formData = new FormData(form);
                var formObject = {};
                for (var pair of formData.entries()) {
                    formObject[pair[0]] = pair[1];
                }
                
                console.log('Form data collected:', formObject);
                
                // اجرای پردازش مخصوص برای هر نوع مودال
                processModalAction(modal, formObject);
            } else {
                console.log('No form found, processing direct action');
                // مودال‌هایی که فرم ندارند (مثلاً تایید حذف)
                processModalAction(modal, {});
            }
        }
    });
}

/**
 * نظارت بر ساخت مودال‌های جدید
 */
function observeModalCreation() {
    // ناظر جهش DOM برای تشخیص مودال‌های جدید
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList && node.classList.contains('modal')) {
                    console.log('New modal detected:', node);
                    
                    // اضافه کردن رویداد به دکمه تایید
                    var confirmBtn = node.querySelector('.btn-primary');
                    if (confirmBtn) {
                        console.log('Enhancing confirmation button in new modal:', confirmBtn);
                        
                        // حذف رویدادهای قبلی برای جلوگیری از دوتایی شدن
                        var newConfirmBtn = confirmBtn.cloneNode(true);
                        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                        
                        // اضافه کردن آیدی به دکمه برای شناسایی بهتر
                        newConfirmBtn.id = newConfirmBtn.id || 'modal-confirm-' + Date.now();
                        
                        // اضافه کردن کلاس برای شناسایی
                        newConfirmBtn.classList.add('enhanced-confirm-btn');
                        
                        // ساختن یک رویداد جدید برای دکمه
                        newConfirmBtn.addEventListener('click', function(e) {
                            console.log('Enhanced confirm button clicked:', this);
                            
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // مشخص کردن مودال مربوطه
                            var modal = this.closest('.modal');
                            if (!modal) return;
                            
                            // یافتن فرم‌ها در مودال
                            var form = modal.querySelector('form');
                            if (form) {
                                // بررسی اعتبارسنجی فرم
                                if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
                                    form.reportValidity();
                                    return;
                                }
                                
                                // جمع‌آوری داده‌های فرم
                                var formData = new FormData(form);
                                var formObject = {};
                                for (var pair of formData.entries()) {
                                    formObject[pair[0]] = pair[1];
                                }
                                
                                // اجرای پردازش مخصوص برای هر نوع مودال
                                processModalAction(modal, formObject);
                            } else {
                                // مودال‌هایی که فرم ندارند (مثلاً تایید حذف)
                                processModalAction(modal, {});
                            }
                        });
                    }
                }
            });
        });
    });
    
    // شروع نظارت بر تمام تغییرات در بدنه سند
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * پردازش عملیات مودال براساس نوع مودال
 * @param {HTMLElement} modal - المان مودال
 * @param {Object} data - داده‌های جمع‌آوری شده
 */
function processModalAction(modal, data) {
    console.log('Processing modal action for', modal.id || 'unnamed modal', 'with data:', data);
    
    // تشخیص نوع مودال از طریق شناسه، کلاس یا متن عنوان
    var modalTitle = modal.querySelector('.modal-title');
    var titleText = modalTitle ? modalTitle.textContent.trim() : '';
    
    // حالت 1: مودال افزایش موجودی
    if (modal.id === 'vui-action-modal' && titleText.includes('افزایش موجودی')) {
        processAddCoinsModal(modal, data);
    }
    // حالت 2: مودال کاهش موجودی
    else if (modal.id === 'vui-action-modal' && titleText.includes('کاهش موجودی')) {
        processRemoveCoinsModal(modal, data);
    }
    // حالت 3: مودال افزودن آیتم
    else if (modal.id === 'vui-action-modal' && titleText.includes('افزودن آیتم')) {
        processAddItemModal(modal, data);
    }
    // حالت 4: مودال مسدودسازی کاربر
    else if (modal.id === 'vui-action-modal' && titleText.includes('مسدودسازی')) {
        processBanUserModal(modal, data);
    }
    // حالت 5: مودال بازنشانی کاربر
    else if (modal.id === 'vui-action-modal' && titleText.includes('بازنشانی')) {
        processResetUserModal(modal, data);
    }
    // حالت پیش‌فرض: سعی در اجرای عملیات عمومی
    else {
        console.log('Unknown modal type, trying generic approach');
        processGenericModal(modal, data);
    }
}

/**
 * پردازش مودال افزایش موجودی
 */
function processAddCoinsModal(modal, data) {
    console.log('Processing add coins modal with data:', data);
    
    // جمع‌آوری داده‌ها از مودال
    var amount = document.getElementById('coin-amount').value;
    var destination = document.getElementById('coin-to').value;
    var reason = document.getElementById('coin-reason').value;
    var userId = modal.getAttribute('data-user-id') || getActiveUserId();
    
    if (!amount || isNaN(amount) || amount <= 0) {
        showModalError(modal, 'لطفاً مقدار صحیحی وارد کنید');
        return;
    }
    
    // ارسال درخواست به سرور
    $.ajax({
        url: '/admin/users/add-coins',
        type: 'POST',
        data: {
            userId: userId,
            amount: amount,
            destination: destination,
            reason: reason
        },
        success: function(response) {
            // بستن مودال
            closeModal(modal);
            
            // نمایش پیام موفقیت
            if (window.vuiUserActions && typeof window.vuiUserActions.showNotification === 'function') {
                window.vuiUserActions.showNotification('موجودی کاربر با موفقیت افزایش یافت', 'success');
            } else {
                alert('موجودی کاربر با موفقیت افزایش یافت');
            }
            
            // بروزرسانی صفحه در صورت نیاز
            setTimeout(function() {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            var message = 'خطا در افزایش موجودی';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showModalError(modal, message);
        }
    });
}

/**
 * پردازش مودال کاهش موجودی
 */
function processRemoveCoinsModal(modal, data) {
    console.log('Processing remove coins modal with data:', data);
    
    // جمع‌آوری داده‌ها از مودال
    var amount = document.getElementById('coin-amount').value;
    var source = document.getElementById('coin-from').value;
    var reason = document.getElementById('coin-reason').value;
    var userId = modal.getAttribute('data-user-id') || getActiveUserId();
    
    if (!amount || isNaN(amount) || amount <= 0) {
        showModalError(modal, 'لطفاً مقدار صحیحی وارد کنید');
        return;
    }
    
    // ارسال درخواست به سرور
    $.ajax({
        url: '/admin/users/remove-coins',
        type: 'POST',
        data: {
            userId: userId,
            amount: amount,
            source: source,
            reason: reason
        },
        success: function(response) {
            // بستن مودال
            closeModal(modal);
            
            // نمایش پیام موفقیت
            if (window.vuiUserActions && typeof window.vuiUserActions.showNotification === 'function') {
                window.vuiUserActions.showNotification('موجودی کاربر با موفقیت کاهش یافت', 'success');
            } else {
                alert('موجودی کاربر با موفقیت کاهش یافت');
            }
            
            // بروزرسانی صفحه در صورت نیاز
            setTimeout(function() {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            var message = 'خطا در کاهش موجودی';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showModalError(modal, message);
        }
    });
}

/**
 * پردازش مودال افزودن آیتم
 */
function processAddItemModal(modal, data) {
    console.log('Processing add item modal with data:', data);
    
    // جمع‌آوری داده‌ها از مودال
    var itemId = document.getElementById('item-id').value;
    var quantity = document.getElementById('item-quantity').value;
    var userId = modal.getAttribute('data-user-id') || getActiveUserId();
    
    if (!itemId) {
        showModalError(modal, 'لطفاً یک آیتم انتخاب کنید');
        return;
    }
    
    if (!quantity || isNaN(quantity) || quantity <= 0) {
        showModalError(modal, 'لطفاً تعداد صحیحی وارد کنید');
        return;
    }
    
    // ارسال درخواست به سرور
    $.ajax({
        url: '/admin/users/' + userId + '/add-item',
        type: 'POST',
        data: {
            itemId: itemId,
            quantity: quantity
        },
        success: function(response) {
            // بستن مودال
            closeModal(modal);
            
            // نمایش پیام موفقیت
            if (window.vuiUserActions && typeof window.vuiUserActions.showNotification === 'function') {
                window.vuiUserActions.showNotification('آیتم با موفقیت به کاربر اضافه شد', 'success');
            } else {
                alert('آیتم با موفقیت به کاربر اضافه شد');
            }
            
            // بروزرسانی صفحه در صورت نیاز
            setTimeout(function() {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            var message = 'خطا در افزودن آیتم';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showModalError(modal, message);
        }
    });
}

/**
 * پردازش مودال مسدودسازی کاربر
 */
function processBanUserModal(modal, data) {
    console.log('Processing ban user modal with data:', data);
    
    // جمع‌آوری داده‌ها از مودال
    var reason = document.getElementById('ban-reason').value;
    var userId = modal.getAttribute('data-user-id') || getActiveUserId();
    
    if (!reason) {
        showModalError(modal, 'لطفاً دلیل مسدودسازی را وارد کنید');
        return;
    }
    
    // ارسال درخواست به سرور
    $.ajax({
        url: '/admin/users/' + userId + '/ban',
        type: 'POST',
        data: {
            reason: reason
        },
        success: function(response) {
            // بستن مودال
            closeModal(modal);
            
            // نمایش پیام موفقیت
            if (window.vuiUserActions && typeof window.vuiUserActions.showNotification === 'function') {
                window.vuiUserActions.showNotification('کاربر با موفقیت مسدود شد', 'success');
            } else {
                alert('کاربر با موفقیت مسدود شد');
            }
            
            // بروزرسانی صفحه در صورت نیاز
            setTimeout(function() {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            var message = 'خطا در مسدودسازی کاربر';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showModalError(modal, message);
        }
    });
}

/**
 * پردازش مودال بازنشانی کاربر
 */
function processResetUserModal(modal, data) {
    console.log('Processing reset user modal with data:', data);
    
    // جمع‌آوری داده‌ها از مودال
    var confirmed = document.getElementById('reset-confirm').checked;
    var userId = modal.getAttribute('data-user-id') || getActiveUserId();
    
    if (!confirmed) {
        showModalError(modal, 'لطفاً تایید کنید که قصد بازنشانی کاربر را دارید');
        return;
    }
    
    // ارسال درخواست به سرور
    $.ajax({
        url: '/admin/users/' + userId + '/reset',
        type: 'POST',
        success: function(response) {
            // بستن مودال
            closeModal(modal);
            
            // نمایش پیام موفقیت
            if (window.vuiUserActions && typeof window.vuiUserActions.showNotification === 'function') {
                window.vuiUserActions.showNotification('کاربر با موفقیت بازنشانی شد', 'success');
            } else {
                alert('کاربر با موفقیت بازنشانی شد');
            }
            
            // بروزرسانی صفحه در صورت نیاز
            setTimeout(function() {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            var message = 'خطا در بازنشانی کاربر';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showModalError(modal, message);
        }
    });
}

/**
 * پردازش مودال عمومی (برای انواع ناشناخته)
 */
function processGenericModal(modal, data) {
    console.log('Processing generic modal with data:', data);
    
    // تلاش برای پیدا کردن آدرس درخواست
    var form = modal.querySelector('form');
    var action = form ? form.getAttribute('action') : null;
    
    if (!action) {
        // اگر مسیر مشخصی وجود نداشت
        console.warn('No form action found, closing modal');
        closeModal(modal);
        return;
    }
    
    // ارسال درخواست عمومی به سرور
    $.ajax({
        url: action,
        type: 'POST',
        data: data,
        success: function(response) {
            // بستن مودال
            closeModal(modal);
            
            // نمایش پیام موفقیت
            if (window.vuiUserActions && typeof window.vuiUserActions.showNotification === 'function') {
                window.vuiUserActions.showNotification('عملیات با موفقیت انجام شد', 'success');
            } else {
                alert('عملیات با موفقیت انجام شد');
            }
            
            // بروزرسانی صفحه در صورت نیاز
            setTimeout(function() {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            var message = 'خطا در انجام عملیات';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showModalError(modal, message);
        }
    });
}

/**
 * نمایش پیام خطا در مودال
 */
function showModalError(modal, message) {
    console.log('Showing modal error:', message);
    
    // بررسی وجود کانتینر خطا
    var errorContainer = modal.querySelector('.modal-error');
    
    // اگر وجود نداشت، ایجاد کن
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'modal-error alert alert-danger mt-3';
        
        // پیدا کردن بهترین محل برای قرار دادن پیام خطا
        var modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.appendChild(errorContainer);
        }
    }
    
    // نمایش پیام خطا
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // انیمیشن لرزش مودال برای جلب توجه
    modal.classList.add('modal-shake');
    setTimeout(function() {
        modal.classList.remove('modal-shake');
    }, 500);
}

/**
 * بستن مودال با استفاده از API بوت‌استرپ
 */
function closeModal(modal) {
    console.log('Closing modal:', modal);
    
    try {
        // روش 1: استفاده از API بوت‌استرپ
        var bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        } else {
            // روش 2: استفاده از jQuery
            $(modal).modal('hide');
        }
    } catch (e) {
        console.error('Error closing modal:', e);
        
        // روش 3: بستن دستی
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // حذف backdrop
        var backdrop = document.querySelector('.modal-backdrop');
        if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
    }
}

/**
 * دریافت شناسه کاربر فعال از متغیر سراسری یا المان‌های صفحه
 */
function getActiveUserId() {
    // تلاش 1: بررسی متغیر سراسری
    if (window.activeUserId) {
        return window.activeUserId;
    }
    
    // تلاش 2: بررسی المان‌های مربوط به کاربر در صفحه
    var userIdElement = document.querySelector('[data-user-id]');
    if (userIdElement) {
        return userIdElement.getAttribute('data-user-id');
    }
    
    // تلاش 3: بررسی URL صفحه
    var match = location.pathname.match(/\/admin\/users\/(\d+)/);
    if (match && match[1]) {
        return match[1];
    }
    
    // هیچ شناسه‌ای پیدا نشد
    console.error('Could not determine active user ID');
    return null;
}

// اضافه کردن استایل برای انیمیشن لرزش
var style = document.createElement('style');
style.textContent = `
    @keyframes modalShake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
    }
    .modal-shake .modal-content {
        animation: modalShake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

console.log('Modal confirmation fix utilities are ready');