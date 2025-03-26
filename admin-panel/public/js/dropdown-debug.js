/**
 * اسکریپت دیباگ کشویی
 * این فایل برای اشکال‌زدایی منوهای کشویی مشکل‌دار استفاده می‌شود
 */

console.log('Dropdown debugger loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing dropdown debugger');
    
    // بررسی تمام دکمه‌های کشویی در صفحه
    var allDropdownToggles = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    console.log('Found ' + allDropdownToggles.length + ' dropdown toggles');
    
    // ثبت اطلاعات دکمه‌های اکشن کاربر
    var userActionButtons = document.querySelectorAll('.user-actions-button');
    console.log('Found ' + userActionButtons.length + ' user action buttons');
    
    // چک کردن لود شدن اسکریپت‌های مورد نیاز
    if (window.vuiUserActions) {
        console.log('User actions script is loaded properly');
    } else {
        console.error('User actions script is NOT loaded properly');
    }
    
    if (window.dropdownFixes) {
        console.log('Dropdown fixes script is loaded properly');
    } else {
        console.error('Dropdown fixes script is NOT loaded properly');
    }
    
    // بهبود عملکرد دکمه‌های اکشن کاربر
    userActionButtons.forEach(function(button, index) {
        console.log('Processing user action button #' + (index + 1));
        
        // نمایش اطلاعات دکمه
        var userId = button.getAttribute('data-user-id');
        console.log('Button user ID:', userId);
        
        // افزودن رویداد کلیک مجدد به صورت مستقیم
        button.addEventListener('click', function(e) {
            console.log('User action button clicked for user ID:', userId);
            e.preventDefault();
            e.stopPropagation();
            
            // نمایش منوی کشویی به صورت مستقیم
            showDebugActionsDropdown(button, userId);
        });
    });
    
    // تست کلیک برای همه دکمه‌های کشویی
    allDropdownToggles.forEach(function(toggle, index) {
        // اطلاعات دیباگ
        console.log('Dropdown toggle #' + (index + 1) + ':', toggle.outerHTML);
        
        // تست کلیک مصنوعی
        setTimeout(function() {
            console.log('Testing dropdown toggle:', toggle);
            // اضافه کردن مستمع کلیک دیباگ
            toggle.addEventListener('click', function() {
                console.log('Dropdown toggle clicked:', this);
                setTimeout(function() {
                    var menu = toggle.nextElementSibling;
                    if (!menu || !menu.classList.contains('dropdown-menu')) {
                        menu = toggle.parentElement.querySelector('.dropdown-menu');
                    }
                    
                    if (menu) {
                        console.log('Dropdown menu state:', menu.classList.contains('show') ? 'OPEN' : 'CLOSED');
                    } else {
                        console.log('No dropdown menu found for this toggle');
                    }
                }, 50);
            });
        }, 1000 + (index * 100));
    });
});

/**
 * نمایش منوی کشویی اکشن‌های کاربر به صورت دیباگ
 */
function showDebugActionsDropdown(button, userId) {
    console.log('Showing debug actions dropdown for user ID:', userId);
    
    // ایجاد منوی کشویی
    var dropdown = document.createElement('div');
    dropdown.className = 'vui-actions-dropdown show';
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '1050';
    dropdown.style.background = 'var(--vui-card-bg)';
    dropdown.style.border = '1px solid var(--vui-border-color)';
    dropdown.style.borderRadius = '0.5rem';
    dropdown.style.padding = '0.5rem 0';
    dropdown.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    dropdown.style.minWidth = '200px';
    
    // اضافه کردن آیتم‌های منو
    dropdown.innerHTML = `
        <div class="vui-dropdown-item" onclick="showDebugModal('add_coins', '${userId}')">
            <i class="bi bi-coin me-2"></i> افزایش موجودی
        </div>
        <div class="vui-dropdown-item" onclick="showDebugModal('remove_coins', '${userId}')">
            <i class="bi bi-dash-circle me-2"></i> کاهش موجودی
        </div>
        <div class="vui-dropdown-item" onclick="showDebugModal('add_item', '${userId}')">
            <i class="bi bi-box-seam me-2"></i> افزودن آیتم
        </div>
        <div class="vui-dropdown-item" onclick="showDebugModal('ban_user', '${userId}')">
            <i class="bi bi-slash-circle me-2"></i> مسدودسازی کاربر
        </div>
        <div class="vui-dropdown-item" onclick="showDebugModal('reset_user', '${userId}')">
            <i class="bi bi-arrow-clockwise me-2"></i> بازنشانی کاربر
        </div>
    `;
    
    // استایل آیتم‌های منو
    var items = dropdown.querySelectorAll('.vui-dropdown-item');
    for (var i = 0; i < items.length; i++) {
        items[i].style.padding = '0.5rem 1rem';
        items[i].style.cursor = 'pointer';
        items[i].style.transition = 'background 0.2s';
        
        items[i].addEventListener('mouseover', function() {
            this.style.background = 'var(--vui-dropdown-hover-bg)';
        });
        
        items[i].addEventListener('mouseout', function() {
            this.style.background = 'transparent';
        });
    }
    
    // تنظیم موقعیت منو
    var rect = button.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    
    // بررسی جهت متن
    var isRTL = document.dir === 'rtl' || 
               document.documentElement.getAttribute('dir') === 'rtl';
    
    if (isRTL) {
        dropdown.style.right = (rect.right - rect.width + window.scrollX) + 'px';
    } else {
        dropdown.style.left = (rect.left + window.scrollX) + 'px';
    }
    
    // اضافه کردن به DOM
    document.body.appendChild(dropdown);
    
    // بستن منو با کلیک خارج از آن
    setTimeout(function() {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== button) {
                if (dropdown.parentNode) {
                    dropdown.parentNode.removeChild(dropdown);
                }
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 10);
    
    console.log('Dropdown created and added to DOM');
}

/**
 * نمایش مودال دیباگ
 */
function showDebugModal(action, userId) {
    console.log('Showing debug modal for action:', action, 'user ID:', userId);
    
    // متن مودال بر اساس اکشن
    var modalTitle, modalBody, modalAction;
    
    switch (action) {
        case 'add_coins':
            modalTitle = 'افزایش موجودی کاربر';
            modalBody = `
                <div class="mb-3">
                    <label class="form-label">میزان افزایش (Ccoin)</label>
                    <input type="number" id="debug-coins-amount" class="form-control" value="1000" min="1">
                </div>
                <div class="mb-3">
                    <label class="form-label">توضیحات</label>
                    <textarea id="debug-coins-reason" class="form-control" rows="2" placeholder="دلیل افزایش موجودی"></textarea>
                </div>
            `;
            modalAction = 'addCoins';
            break;
            
        case 'remove_coins':
            modalTitle = 'کاهش موجودی کاربر';
            modalBody = `
                <div class="mb-3">
                    <label class="form-label">میزان کاهش (Ccoin)</label>
                    <input type="number" id="debug-coins-amount" class="form-control" value="500" min="1">
                </div>
                <div class="mb-3">
                    <label class="form-label">توضیحات</label>
                    <textarea id="debug-coins-reason" class="form-control" rows="2" placeholder="دلیل کاهش موجودی"></textarea>
                </div>
            `;
            modalAction = 'removeCoins';
            break;
            
        case 'add_item':
            modalTitle = 'افزودن آیتم به کاربر';
            modalBody = `
                <div class="mb-3">
                    <label class="form-label">انتخاب آیتم</label>
                    <select id="debug-item-id" class="form-select">
                        <option value="1">آیتم شماره ۱</option>
                        <option value="2">آیتم شماره ۲</option>
                        <option value="3">آیتم شماره ۳</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">تعداد</label>
                    <input type="number" id="debug-item-quantity" class="form-control" value="1" min="1">
                </div>
                <div class="mb-3">
                    <label class="form-label">توضیحات</label>
                    <textarea id="debug-item-reason" class="form-control" rows="2" placeholder="دلیل افزودن آیتم"></textarea>
                </div>
            `;
            modalAction = 'addItem';
            break;
            
        case 'ban_user':
            modalTitle = 'مسدودسازی کاربر';
            modalBody = `
                <div class="mb-3">
                    <label class="form-label">دلیل مسدودسازی</label>
                    <textarea id="debug-ban-reason" class="form-control" rows="3" placeholder="دلیل مسدودسازی کاربر"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">مدت زمان مسدودیت</label>
                    <select id="debug-ban-duration" class="form-select">
                        <option value="1">۱ روز</option>
                        <option value="7">۷ روز</option>
                        <option value="30">۳۰ روز</option>
                        <option value="0">دائمی</option>
                    </select>
                </div>
            `;
            modalAction = 'banUser';
            break;
            
        case 'reset_user':
            modalTitle = 'بازنشانی کاربر';
            modalBody = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    هشدار: این عملیات تمام اطلاعات کاربر را به حالت اولیه برمی‌گرداند و غیرقابل بازگشت است.
                </div>
                <div class="mb-3">
                    <label class="form-label">تایید بازنشانی</label>
                    <div class="form-check">
                        <input type="checkbox" id="debug-reset-confirm" class="form-check-input">
                        <label class="form-check-label" for="debug-reset-confirm">
                            من تایید می‌کنم که می‌خواهم این کاربر را بازنشانی کنم.
                        </label>
                    </div>
                </div>
            `;
            modalAction = 'resetUser';
            break;
            
        default:
            modalTitle = 'عملیات ناشناخته';
            modalBody = '<div class="alert alert-danger">خطا در شناسایی عملیات</div>';
            modalAction = null;
    }
    
    // ساخت مودال
    var modal = document.createElement('div');
    modal.className = 'modal fade debug-modal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content" style="background-color: var(--vui-card-bg); color: var(--vui-text-color);">
                <div class="modal-header" style="border-bottom-color: var(--vui-border-color);">
                    <h5 class="modal-title">${modalTitle}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${modalBody}
                </div>
                <div class="modal-footer" style="border-top-color: var(--vui-border-color);">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                    <button type="button" class="btn btn-primary debug-confirm-btn">تایید</button>
                </div>
            </div>
        </div>
    `;
    
    // اضافه کردن به DOM
    document.body.appendChild(modal);
    
    // راه‌اندازی مودال
    var modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // بستن مودال با کلیک روی دکمه انصراف
    var cancelBtn = modal.querySelector('.btn-secondary');
    cancelBtn.addEventListener('click', function() {
        modalInstance.hide();
        setTimeout(function() {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    });
    
    // عملیات تایید
    if (modalAction) {
        var confirmBtn = modal.querySelector('.debug-confirm-btn');
        confirmBtn.addEventListener('click', function() {
            // انجام عملیات بر اساس نوع اکشن
            switch (modalAction) {
                case 'addCoins':
                    var amount = document.getElementById('debug-coins-amount').value;
                    var reason = document.getElementById('debug-coins-reason').value;
                    
                    console.log('Debug action - Add coins:', {
                        userId: userId,
                        amount: amount,
                        reason: reason
                    });
                    
                    // اجرای عملیات
                    processDebugAction('/admin/users/add-coins', {
                        userId: userId,
                        amount: amount,
                        reason: reason
                    }, 'موجودی کاربر با موفقیت افزایش یافت');
                    break;
                    
                case 'removeCoins':
                    var amount = document.getElementById('debug-coins-amount').value;
                    var reason = document.getElementById('debug-coins-reason').value;
                    
                    console.log('Debug action - Remove coins:', {
                        userId: userId,
                        amount: amount,
                        reason: reason
                    });
                    
                    // اجرای عملیات
                    processDebugAction('/admin/users/remove-coins', {
                        userId: userId,
                        amount: amount,
                        reason: reason
                    }, 'موجودی کاربر با موفقیت کاهش یافت');
                    break;
                    
                case 'addItem':
                    var itemId = document.getElementById('debug-item-id').value;
                    var quantity = document.getElementById('debug-item-quantity').value;
                    var reason = document.getElementById('debug-item-reason').value;
                    
                    console.log('Debug action - Add item:', {
                        userId: userId,
                        itemId: itemId,
                        quantity: quantity,
                        reason: reason
                    });
                    
                    // اجرای عملیات
                    processDebugAction('/admin/users/' + userId + '/add-item', {
                        itemId: itemId,
                        quantity: quantity,
                        reason: reason
                    }, 'آیتم با موفقیت به کاربر اضافه شد');
                    break;
                    
                case 'banUser':
                    var reason = document.getElementById('debug-ban-reason').value;
                    var duration = document.getElementById('debug-ban-duration').value;
                    
                    console.log('Debug action - Ban user:', {
                        userId: userId,
                        reason: reason,
                        duration: duration
                    });
                    
                    // اجرای عملیات
                    processDebugAction('/admin/users/' + userId + '/ban', {
                        reason: reason,
                        duration: duration
                    }, 'کاربر با موفقیت مسدود شد');
                    break;
                    
                case 'resetUser':
                    var confirmed = document.getElementById('debug-reset-confirm').checked;
                    
                    if (!confirmed) {
                        alert('لطفاً تایید کنید که می‌خواهید این کاربر را بازنشانی کنید.');
                        return;
                    }
                    
                    console.log('Debug action - Reset user:', {
                        userId: userId
                    });
                    
                    // اجرای عملیات
                    processDebugAction('/admin/users/' + userId + '/reset', {}, 'کاربر با موفقیت بازنشانی شد');
                    break;
            }
            
            // بستن مودال پس از انجام عملیات
            modalInstance.hide();
            setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });
    }
    
    console.log('Modal created and displayed');
}

/**
 * پردازش اکشن دیباگ
 */
function processDebugAction(url, data, successMessage) {
    console.log('Processing debug action:', {url, data});
    
    // نمایش نوتیفیکیشن موفقیت
    var notification = document.createElement('div');
    notification.className = 'vui-notification vui-notification-success';
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="bi bi-check-circle"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">عملیات موفق</div>
            <div class="notification-message">${successMessage}</div>
        </div>
    `;
    
    // استایل نوتیفیکیشن
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.background = 'linear-gradient(to right, #00a389, #0087a3)';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.style.transform = 'translateY(100px)';
    notification.style.opacity = '0';
    notification.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    
    // اضافه کردن به DOM
    document.body.appendChild(notification);
    
    // انیمیشن ورود
    setTimeout(function() {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // حذف بعد از چند ثانیه
    setTimeout(function() {
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // اجرای درخواست واقعی در صورت امکان
    if (window.vuiUserActions && typeof window.vuiUserActions.showNotification === 'function') {
        window.vuiUserActions.showNotification(successMessage, 'success');
    }
    
    // بروزرسانی صفحه بعد از انجام عملیات
    setTimeout(function() {
        location.reload();
    }, 1000);
    
    console.log('Debug action completed successfully');
}

// اعلام آمادگی اسکریپت دیباگ
console.log('Dropdown debug utilities are ready');

// ایجاد متغیر عمومی برای دسترسی از کنسول مرورگر
window.vuiDropdownDebug = {
    showDebugActionsDropdown: showDebugActionsDropdown,
    showDebugModal: showDebugModal,
    processDebugAction: processDebugAction
};