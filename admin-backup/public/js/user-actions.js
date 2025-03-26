/**
 * مدیریت اکشن‌های کاربر در پنل مدیریت
 * این فایل برای مدیریت درخواست‌های افزایش سکه، حذف سکه، و سایر اکشن‌های کاربری استفاده می‌شود
 * نسخه اصلاح شده با راه‌حل پایدار ۱۴۰۳/۰۱/۰۷
 */

(function() {
    // امکان دسترسی به فانکشن‌های این فایل از خارج
    window.vuiUserActions = {};
    
    // متغیرهای کلی
    var modalContainer = null;
    var activeDropdown = null;
    var activeUserId = null;
    
    // افزودن نمایش debugger
    console.log("User Actions Module Initialized");

    /**
     * راه‌اندازی اولیه سیستم نوتیفیکیشن‌ها
     */
    function initializeNotifications() {
        // کانتینر نوتیفیکیشن‌ها را ایجاد می‌کنیم اگر وجود نداشته باشد
        var notificationContainer = document.getElementById('vui-notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'vui-notification-container';
            document.body.appendChild(notificationContainer);
        }
    }

    /**
     * نمایش نوتیفیکیشن
     * @param {string} message - متن پیام
     * @param {string} type - نوع پیام (success, error, warning, info)
     * @param {number} duration - مدت زمان نمایش (میلی‌ثانیه)
     */
    function showNotification(message, type, duration) {
        type = type || 'info';
        duration = duration || 3000;
        
        // آیکون مناسب برای هر نوع پیام
        var icons = {
            'success': 'bi bi-check-circle-fill',
            'error': 'bi bi-x-circle-fill',
            'warning': 'bi bi-exclamation-triangle-fill',
            'info': 'bi bi-info-circle-fill'
        };
        
        // ایجاد المان نوتیفیکیشن
        var notification = document.createElement('div');
        notification.className = 'vui-notification vui-notification-' + type;
        notification.innerHTML = `
            <div class="vui-notification-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="vui-notification-content">
                ${message}
            </div>
            <button class="vui-notification-close">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        // اضافه کردن به DOM
        document.body.appendChild(notification);
        
        // نمایش با انیمیشن
        setTimeout(function() {
            notification.classList.add('show');
        }, 10);
        
        // دکمه بستن
        var closeButton = notification.querySelector('.vui-notification-close');
        closeButton.addEventListener('click', function() {
            closeNotification(notification);
        });
        
        // بستن خودکار بعد از مدت زمان مشخص
        setTimeout(function() {
            closeNotification(notification);
        }, duration);
    }
    
    /**
     * بستن نوتیفیکیشن با انیمیشن
     * @param {HTMLElement} notification - المان نوتیفیکیشن
     */
    function closeNotification(notification) {
        notification.classList.remove('show');
        
        // حذف از DOM بعد از اتمام انیمیشن
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    /**
     * نمایش دراپ‌داون اکشن‌های کاربر
     * @param {HTMLElement} button - دکمه‌ای که کلیک شده
     * @param {number} userId - شناسه کاربر
     */
    function showUserActionsDropdown(button, userId) {
        console.log('Opening user actions dropdown for user ID:', userId);
        
        // بستن دراپ‌داون قبلی اگر باز است
        if (activeDropdown) {
            if (activeDropdown.parentNode) {
                activeDropdown.parentNode.removeChild(activeDropdown);
            }
            activeDropdown = null;
        }
        
        // ذخیره شناسه کاربر فعال
        activeUserId = userId;
        
        // حذف هر منوی اکشن موجود قبلی
        var existingDropdowns = document.querySelectorAll('.vui-actions-dropdown');
        for (var i = 0; i < existingDropdowns.length; i++) {
            if (existingDropdowns[i].parentNode) {
                existingDropdowns[i].parentNode.removeChild(existingDropdowns[i]);
            }
        }
        
        // ایجاد دراپ‌داون
        var dropdown = document.createElement('div');
        dropdown.className = 'vui-actions-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.zIndex = '1050';
        dropdown.style.background = 'var(--vui-card-bg, #1a1f37)';
        dropdown.style.border = '1px solid var(--vui-border-color, rgba(226, 232, 240, 0.1))';
        dropdown.style.borderRadius = '0.5rem';
        dropdown.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        
        dropdown.innerHTML = `
            <div class="vui-dropdown-arrow"></div>
            <ul class="vui-dropdown-menu" style="list-style: none; padding: 0.5rem 0; margin: 0;">
                <li><button class="vui-dropdown-item" data-action="add-coins" style="width: 100%; text-align: right; padding: 0.5rem 1rem; background: none; border: none; color: var(--vui-text-color, #fff); cursor: pointer;"><i class="bi bi-plus-circle me-2"></i> افزایش موجودی</button></li>
                <li><button class="vui-dropdown-item" data-action="remove-coins" style="width: 100%; text-align: right; padding: 0.5rem 1rem; background: none; border: none; color: var(--vui-text-color, #fff); cursor: pointer;"><i class="bi bi-dash-circle me-2"></i> کاهش موجودی</button></li>
                <li><button class="vui-dropdown-item" data-action="add-item" style="width: 100%; text-align: right; padding: 0.5rem 1rem; background: none; border: none; color: var(--vui-text-color, #fff); cursor: pointer;"><i class="bi bi-gift me-2"></i> افزودن آیتم</button></li>
                <li><button class="vui-dropdown-item" data-action="ban-user" style="width: 100%; text-align: right; padding: 0.5rem 1rem; background: none; border: none; color: var(--vui-text-color, #fff); cursor: pointer;"><i class="bi bi-slash-circle me-2"></i> مسدودسازی کاربر</button></li>
                <li><button class="vui-dropdown-item" data-action="reset-user" style="width: 100%; text-align: right; padding: 0.5rem 1rem; background: none; border: none; color: var(--vui-text-color, #fff); cursor: pointer;"><i class="bi bi-arrow-counterclockwise me-2"></i> بازنشانی کاربر</button></li>
            </ul>
        `;
        
        // اضافه کردن به DOM
        document.body.appendChild(dropdown);
        
        // محاسبه موقعیت دراپ‌داون
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
        
        console.log('Dropdown added to DOM');
        
        // نمایش با انیمیشن
        setTimeout(function() {
            dropdown.classList.add('show');
        }, 10);
        
        // ذخیره دراپ‌داون فعال
        activeDropdown = dropdown;
        
        // اضافه کردن رویدادها به آیتم‌های دراپ‌داون با امنیت بیشتر
        var items = dropdown.querySelectorAll('.vui-dropdown-item');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                var action = this.getAttribute('data-action');
                console.log('Action clicked:', action);
                
                // فراخوانی تابع معمولی
                handleDropdownItemClick.call(this, event);
            });
            
            // افزودن افکت‌های بصری
            items[i].addEventListener('mouseover', function() {
                this.style.backgroundColor = 'var(--vui-dropdown-hover-bg, rgba(255, 255, 255, 0.1))';
            });
            
            items[i].addEventListener('mouseout', function() {
                this.style.backgroundColor = 'transparent';
            });
        }
        
        // بستن دراپ‌داون با کلیک بیرون از آن
        setTimeout(function() {
            document.addEventListener('click', handleOutsideClick);
        }, 10);
    }
    
    /**
     * مدیریت کلیک روی آیتم‌های دراپ‌داون
     * @param {Event} e - رویداد کلیک
     */
    function handleDropdownItemClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var action = this.getAttribute('data-action');
        console.log('Dropdown action clicked:', action, 'for user ID:', activeUserId);
        
        // بستن دراپ‌داون
        if (activeDropdown) {
            if (activeDropdown.parentNode) {
                activeDropdown.parentNode.removeChild(activeDropdown);
            }
            activeDropdown = null;
            
            // حذف رویداد کلیک خارج
            document.removeEventListener('click', handleOutsideClick);
        }
        
        // اطمینان از وجود activeUserId
        if (!activeUserId) {
            console.error('No active user ID found');
            showNotification('خطا: شناسه کاربر یافت نشد', 'error');
            return;
        }
        
        // اجرای اکشن مناسب - با مدیریت خطا
        try {
            console.log('Executing action:', action);
            
            switch (action) {
                case 'add-coins':
                    console.log('Showing add coins modal for user:', activeUserId);
                    showAddCoinsModal(activeUserId);
                    break;
                case 'remove-coins':
                    console.log('Showing remove coins modal for user:', activeUserId);
                    showRemoveCoinsModal(activeUserId);
                    break;
                case 'add-item':
                    console.log('Showing add item modal for user:', activeUserId);
                    showAddItemModal(activeUserId);
                    break;
                case 'ban-user':
                    console.log('Showing ban user modal for user:', activeUserId);
                    showBanUserModal(activeUserId);
                    break;
                case 'reset-user':
                    console.log('Showing reset user confirmation for user:', activeUserId);
                    showResetUserConfirmation(activeUserId);
                    break;
                default:
                    console.log('Unknown action:', action);
                    showNotification('عملیات مورد نظر پشتیبانی نمی‌شود', 'warning');
            }
        } catch (error) {
            console.error('Error executing dropdown action:', error);
            showNotification('خطا در اجرای عملیات: ' + (error.message || 'خطای ناشناخته'), 'error');
            
            // اگر از بین این توابع هرکدام که تعریف نشده باشند را به عنوان یک تابع خالی تعریف می‌کنیم
            if (typeof showAddCoinsModal !== 'function') {
                window.showAddCoinsModal = function(id) { 
                    console.error('showAddCoinsModal is not defined'); 
                    alert('عملیات افزایش موجودی در حال حاضر در دسترس نیست');
                };
            }
            
            if (typeof showRemoveCoinsModal !== 'function') {
                window.showRemoveCoinsModal = function(id) { 
                    console.error('showRemoveCoinsModal is not defined'); 
                    alert('عملیات کاهش موجودی در حال حاضر در دسترس نیست');
                };
            }
            
            if (typeof showAddItemModal !== 'function') {
                window.showAddItemModal = function(id) { 
                    console.error('showAddItemModal is not defined'); 
                    alert('عملیات افزودن آیتم در حال حاضر در دسترس نیست');
                };
            }
            
            if (typeof showBanUserModal !== 'function') {
                window.showBanUserModal = function(id) { 
                    console.error('showBanUserModal is not defined'); 
                    alert('عملیات مسدودسازی کاربر در حال حاضر در دسترس نیست');
                };
            }
            
            if (typeof showResetUserConfirmation !== 'function') {
                window.showResetUserConfirmation = function(id) { 
                    console.error('showResetUserConfirmation is not defined'); 
                    alert('عملیات بازنشانی کاربر در حال حاضر در دسترس نیست');
                };
            }
        }
    }
    
    /**
     * مدیریت کلیک بیرون از دراپ‌داون
     * @param {Event} e - رویداد کلیک
     */
    function handleOutsideClick(e) {
        console.log('Outside click detected');
        
        // اگر کلیک خارج از دراپ‌داون باشد
        if (activeDropdown && !activeDropdown.contains(e.target)) {
            // اطمینان از اینکه روی دکمه اکشن هم کلیک نشده باشد
            var clickedActionButton = e.target.classList.contains('user-actions-button') || 
                                    e.target.closest('.user-actions-button');
                                    
            if (!clickedActionButton) {
                console.log('Closing dropdown due to outside click');
                
                // حذف دراپ‌داون از DOM
                if (activeDropdown.parentNode) {
                    activeDropdown.parentNode.removeChild(activeDropdown);
                }
                activeDropdown = null;
                
                // حذف این رویداد پس از استفاده
                document.removeEventListener('click', handleOutsideClick);
                
                // جلوگیری از انتشار بیشتر کلیک
                e.stopPropagation();
            } else {
                console.log('Click on action button, not closing dropdown');
            }
        }
    }
    
    /**
     * نمایش مودال افزایش موجودی
     * @param {number} userId - شناسه کاربر
     */
    function showAddCoinsModal(userId) {
        var modalHtml = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">افزایش موجودی کاربر</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-coins-form">
                            <div class="mb-3">
                                <label for="coin-amount" class="form-label">میزان Ccoin:</label>
                                <input type="number" class="form-control" id="coin-amount" placeholder="مثال: 1000" min="1" required>
                            </div>
                            <div class="mb-3">
                                <label for="coin-to" class="form-label">اضافه به:</label>
                                <select class="form-select" id="coin-to" required>
                                    <option value="wallet">کیف پول</option>
                                    <option value="bank">حساب بانکی</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="coin-reason" class="form-label">توضیحات:</label>
                                <textarea class="form-control" id="coin-reason" rows="2" placeholder="دلیل افزایش موجودی..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                        <button type="button" class="btn btn-primary" id="add-coins-confirm">افزایش موجودی</button>
                    </div>
                </div>
            </div>
        `;
        
        showModal(modalHtml, function(modal) {
            // رویداد تایید افزایش موجودی
            var confirmBtn = modal.querySelector('#add-coins-confirm');
            confirmBtn.addEventListener('click', function() {
                var amount = document.getElementById('coin-amount').value;
                var destination = document.getElementById('coin-to').value;
                var reason = document.getElementById('coin-reason').value;
                
                if (!amount || isNaN(amount) || amount <= 0) {
                    showNotification('لطفاً مقدار صحیحی وارد کنید', 'error');
                    return;
                }
                
                // ارسال درخواست افزایش موجودی
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
                        try {
                            var bsModal = bootstrap.Modal.getInstance(modal);
                            if (bsModal) {
                                bsModal.hide();
                            } else {
                                console.warn('Modal instance not found, trying to hide directly');
                                $(modal).modal('hide');
                            }
                        } catch (e) {
                            console.error('Error hiding modal:', e);
                            if (modal && modal.classList) {
                                modal.classList.remove('show');
                                setTimeout(function() {
                                    if (modal.parentNode) {
                                        modal.parentNode.removeChild(modal);
                                    }
                                }, 300);
                            }
                        }
                        
                        // نمایش پیام موفقیت
                        showNotification('موجودی کاربر با موفقیت افزایش یافت', 'success');
                        
                        // بروزرسانی اطلاعات صفحه
                        if (typeof refreshUserData === 'function') {
                            refreshUserData();
                        } else {
                            // در صورت نیاز به رفرش کل صفحه
                            // setTimeout(function() {
                            //     location.reload();
                            // }, 1000);
                        }
                    },
                    error: function(xhr) {
                        var message = 'خطا در افزایش موجودی';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            message = xhr.responseJSON.message;
                        }
                        showNotification(message, 'error');
                    }
                });
            });
        });
    }
    
    /**
     * نمایش مودال کاهش موجودی
     * @param {number} userId - شناسه کاربر
     */
    function showRemoveCoinsModal(userId) {
        var modalHtml = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">کاهش موجودی کاربر</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
                    </div>
                    <div class="modal-body">
                        <form id="remove-coins-form">
                            <div class="mb-3">
                                <label for="coin-amount" class="form-label">میزان Ccoin:</label>
                                <input type="number" class="form-control" id="coin-amount" placeholder="مثال: 500" min="1" required>
                            </div>
                            <div class="mb-3">
                                <label for="coin-from" class="form-label">برداشت از:</label>
                                <select class="form-select" id="coin-from" required>
                                    <option value="wallet">کیف پول</option>
                                    <option value="bank">حساب بانکی</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="coin-reason" class="form-label">توضیحات:</label>
                                <textarea class="form-control" id="coin-reason" rows="2" placeholder="دلیل کاهش موجودی..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                        <button type="button" class="btn btn-danger" id="remove-coins-confirm">کاهش موجودی</button>
                    </div>
                </div>
            </div>
        `;
        
        showModal(modalHtml, function(modal) {
            // رویداد تایید کاهش موجودی
            var confirmBtn = modal.querySelector('#remove-coins-confirm');
            confirmBtn.addEventListener('click', function() {
                var amount = document.getElementById('coin-amount').value;
                var source = document.getElementById('coin-from').value;
                var reason = document.getElementById('coin-reason').value;
                
                if (!amount || isNaN(amount) || amount <= 0) {
                    showNotification('لطفاً مقدار صحیحی وارد کنید', 'error');
                    return;
                }
                
                // ارسال درخواست کاهش موجودی
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
                        try {
                            var bsModal = bootstrap.Modal.getInstance(modal);
                            if (bsModal) {
                                bsModal.hide();
                            } else {
                                console.warn('Modal instance not found, trying to hide directly');
                                $(modal).modal('hide');
                            }
                        } catch (e) {
                            console.error('Error hiding modal:', e);
                            if (modal && modal.classList) {
                                modal.classList.remove('show');
                                setTimeout(function() {
                                    if (modal.parentNode) {
                                        modal.parentNode.removeChild(modal);
                                    }
                                }, 300);
                            }
                        }
                        
                        // نمایش پیام موفقیت
                        showNotification('موجودی کاربر با موفقیت کاهش یافت', 'success');
                        
                        // بروزرسانی اطلاعات صفحه
                        if (typeof refreshUserData === 'function') {
                            refreshUserData();
                        } else {
                            // در صورت نیاز به رفرش کل صفحه
                            // setTimeout(function() {
                            //     location.reload();
                            // }, 1000);
                        }
                    },
                    error: function(xhr) {
                        var message = 'خطا در کاهش موجودی';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            message = xhr.responseJSON.message;
                        }
                        showNotification(message, 'error');
                    }
                });
            });
        });
    }
    
    /**
     * نمایش مودال افزودن آیتم
     * @param {number} userId - شناسه کاربر
     */
    function showAddItemModal(userId) {
        // ابتدا لیست آیتم‌ها را دریافت می‌کنیم
        $.ajax({
            url: '/api/items',
            type: 'GET',
            success: function(items) {
                var itemOptions = '';
                if (items && items.length > 0) {
                    items.forEach(function(item) {
                        itemOptions += `<option value="${item.id}">${item.name} (${item.price} Ccoin)</option>`;
                    });
                } else {
                    itemOptions = '<option value="">هیچ آیتمی یافت نشد</option>';
                }
                
                var modalHtml = `
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">افزودن آیتم به کاربر</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-item-form">
                                    <div class="mb-3">
                                        <label for="item-id" class="form-label">انتخاب آیتم:</label>
                                        <select class="form-select" id="item-id" required>
                                            ${itemOptions}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="item-quantity" class="form-label">تعداد:</label>
                                        <input type="number" class="form-control" id="item-quantity" placeholder="مثال: 1" min="1" value="1" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="item-reason" class="form-label">توضیحات:</label>
                                        <textarea class="form-control" id="item-reason" rows="2" placeholder="دلیل افزودن آیتم..."></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                                <button type="button" class="btn btn-primary" id="add-item-confirm">افزودن آیتم</button>
                            </div>
                        </div>
                    </div>
                `;
                
                showModal(modalHtml, function(modal) {
                    // رویداد تایید افزودن آیتم
                    var confirmBtn = modal.querySelector('#add-item-confirm');
                    confirmBtn.addEventListener('click', function() {
                        var itemId = document.getElementById('item-id').value;
                        var quantity = document.getElementById('item-quantity').value;
                        var reason = document.getElementById('item-reason').value;
                        
                        if (!itemId) {
                            showNotification('لطفاً یک آیتم انتخاب کنید', 'error');
                            return;
                        }
                        
                        if (!quantity || isNaN(quantity) || quantity <= 0) {
                            showNotification('لطفاً تعداد صحیحی وارد کنید', 'error');
                            return;
                        }
                        
                        // ارسال درخواست افزودن آیتم
                        $.ajax({
                            url: `/admin/users/${userId}/add-item`,
                            type: 'POST',
                            data: {
                                itemId: itemId,
                                quantity: quantity,
                                reason: reason
                            },
                            success: function(response) {
                                // بستن مودال
                                try {
                                    var bsModal = bootstrap.Modal.getInstance(modal);
                                    if (bsModal) {
                                        bsModal.hide();
                                    } else {
                                        console.warn('Modal instance not found, trying to hide directly');
                                        $(modal).modal('hide');
                                    }
                                } catch (e) {
                                    console.error('Error hiding modal:', e);
                                    if (modal && modal.classList) {
                                        modal.classList.remove('show');
                                        setTimeout(function() {
                                            if (modal.parentNode) {
                                                modal.parentNode.removeChild(modal);
                                            }
                                        }, 300);
                                    }
                                }
                                
                                // نمایش پیام موفقیت
                                showNotification('آیتم با موفقیت به کاربر اضافه شد', 'success');
                                
                                // بروزرسانی اطلاعات صفحه
                                if (typeof refreshUserInventory === 'function') {
                                    refreshUserInventory();
                                } else {
                                    // در صورت نیاز به رفرش کل صفحه
                                    // setTimeout(function() {
                                    //     location.reload();
                                    // }, 1000);
                                }
                            },
                            error: function(xhr) {
                                var message = 'خطا در افزودن آیتم';
                                if (xhr.responseJSON && xhr.responseJSON.message) {
                                    message = xhr.responseJSON.message;
                                }
                                showNotification(message, 'error');
                            }
                        });
                    });
                });
            },
            error: function() {
                showNotification('خطا در دریافت لیست آیتم‌ها', 'error');
            }
        });
    }
    
    /**
     * نمایش مودال مسدودسازی کاربر
     * @param {number} userId - شناسه کاربر
     */
    function showBanUserModal(userId) {
        var modalHtml = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">مسدودسازی کاربر</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
                    </div>
                    <div class="modal-body">
                        <form id="ban-user-form">
                            <div class="mb-3">
                                <label for="ban-reason" class="form-label">دلیل مسدودسازی:</label>
                                <textarea class="form-control" id="ban-reason" rows="3" placeholder="دلیل مسدودسازی کاربر..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="ban-duration" class="form-label">مدت زمان مسدودی:</label>
                                <select class="form-select" id="ban-duration">
                                    <option value="1">1 روز</option>
                                    <option value="3">3 روز</option>
                                    <option value="7">7 روز</option>
                                    <option value="30">30 روز</option>
                                    <option value="0">دائمی</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                        <button type="button" class="btn btn-danger" id="ban-user-confirm">مسدودسازی</button>
                    </div>
                </div>
            </div>
        `;
        
        showModal(modalHtml, function(modal) {
            // رویداد تایید مسدودسازی
            var confirmBtn = modal.querySelector('#ban-user-confirm');
            confirmBtn.addEventListener('click', function() {
                var reason = document.getElementById('ban-reason').value;
                var duration = document.getElementById('ban-duration').value;
                
                // ارسال درخواست مسدودسازی
                $.ajax({
                    url: `/admin/users/${userId}/ban`,
                    type: 'POST',
                    data: {
                        reason: reason,
                        duration: duration
                    },
                    success: function(response) {
                        // بستن مودال
                        try {
                            var bsModal = bootstrap.Modal.getInstance(modal);
                            if (bsModal) {
                                bsModal.hide();
                            } else {
                                console.warn('Modal instance not found, trying to hide directly');
                                $(modal).modal('hide');
                            }
                        } catch (e) {
                            console.error('Error hiding modal:', e);
                            if (modal && modal.classList) {
                                modal.classList.remove('show');
                                setTimeout(function() {
                                    if (modal.parentNode) {
                                        modal.parentNode.removeChild(modal);
                                    }
                                }, 300);
                            }
                        }
                        
                        // نمایش پیام موفقیت
                        showNotification('کاربر با موفقیت مسدود شد', 'success');
                        
                        // بروزرسانی اطلاعات صفحه
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    },
                    error: function(xhr) {
                        var message = 'خطا در مسدودسازی کاربر';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            message = xhr.responseJSON.message;
                        }
                        showNotification(message, 'error');
                    }
                });
            });
        });
    }
    
    /**
     * نمایش تایید بازنشانی کاربر
     * @param {number} userId - شناسه کاربر
     */
    function showResetUserConfirmation(userId) {
        var modalHtml = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">بازنشانی کاربر</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            این عملیات تمام داده‌های کاربر را به حالت اولیه برمی‌گرداند و غیرقابل بازگشت است.
                        </div>
                        <p>آیا مطمئن هستید که می‌خواهید این کاربر را بازنشانی کنید؟</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
                        <button type="button" class="btn btn-danger" id="reset-user-confirm">بازنشانی</button>
                    </div>
                </div>
            </div>
        `;
        
        showModal(modalHtml, function(modal) {
            // رویداد تایید بازنشانی
            var confirmBtn = modal.querySelector('#reset-user-confirm');
            confirmBtn.addEventListener('click', function() {
                // ارسال درخواست بازنشانی
                $.ajax({
                    url: `/admin/users/${userId}/reset`,
                    type: 'POST',
                    success: function(response) {
                        // بستن مودال
                        try {
                            var bsModal = bootstrap.Modal.getInstance(modal);
                            if (bsModal) {
                                bsModal.hide();
                            } else {
                                console.warn('Modal instance not found, trying to hide directly');
                                $(modal).modal('hide');
                            }
                        } catch (e) {
                            console.error('Error hiding modal:', e);
                            if (modal && modal.classList) {
                                modal.classList.remove('show');
                                setTimeout(function() {
                                    if (modal.parentNode) {
                                        modal.parentNode.removeChild(modal);
                                    }
                                }, 300);
                            }
                        }
                        
                        // نمایش پیام موفقیت
                        showNotification('کاربر با موفقیت بازنشانی شد', 'success');
                        
                        // بروزرسانی اطلاعات صفحه
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    },
                    error: function(xhr) {
                        var message = 'خطا در بازنشانی کاربر';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            message = xhr.responseJSON.message;
                        }
                        showNotification(message, 'error');
                    }
                });
            });
        });
    }
    
    /**
     * نمایش مودال عمومی
     * @param {string} html - محتوای HTML مودال
     * @param {Function} callback - تابع فراخوانی بعد از ایجاد مودال
     */
    function showModal(html, callback) {
        console.log('Opening modal with callback', !!callback);
        
        // حذف مودال قبلی اگر وجود داشته باشد
        if (modalContainer) {
            try {
                var oldModal = bootstrap.Modal.getInstance(modalContainer);
                if (oldModal) {
                    oldModal.hide();
                }
            } catch (e) {
                console.error('Error hiding previous modal:', e);
            }

            if (modalContainer.parentNode) {
                modalContainer.parentNode.removeChild(modalContainer);
            }
            modalContainer = null;
        }
        
        // ایجاد کانتینر مودال
        modalContainer = document.createElement('div');
        modalContainer.className = 'modal fade';
        modalContainer.id = 'vui-action-modal';
        modalContainer.setAttribute('tabindex', '-1');
        modalContainer.setAttribute('aria-hidden', 'true');
        modalContainer.setAttribute('data-fixed', 'true'); // نشانگر اصلاح شده
        modalContainer.innerHTML = html;
        
        // اضافه کردن به DOM
        document.body.appendChild(modalContainer);
        
        // ثبت مستقیم رویدادها روی دکمه تایید و انصراف
        var confirmBtn = modalContainer.querySelector('.btn-primary');
        var cancelBtn = modalContainer.querySelector('.btn-secondary[data-bs-dismiss="modal"]');
        
        if (confirmBtn) {
            console.log('Found confirm button:', confirmBtn);
            // حذف رویداد‌های قبلی احتمالی با کلون کردن
            var newConfirmBtn = confirmBtn.cloneNode(true);
            if (confirmBtn.parentNode) {
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            }
            
            // ثبت رویداد جدید
            newConfirmBtn.addEventListener('click', function(e) {
                console.log('Confirm button clicked');
                e.preventDefault();
                e.stopPropagation();
                
                // جمع‌آوری داده‌های فرم اگر وجود داشته باشد
                var form = modalContainer.querySelector('form');
                var formData = {};
                
                if (form) {
                    // بررسی اعتبارسنجی فرم
                    if (form.checkValidity && !form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }
                    
                    // جمع‌آوری داده‌ها
                    var elements = form.elements;
                    for (var i = 0; i < elements.length; i++) {
                        var element = elements[i];
                        if (element.name) {
                            formData[element.name] = element.value;
                        } else if (element.id) {
                            formData[element.id] = element.value;
                        }
                    }
                }
                
                console.log('Form data collected:', formData);
                
                // اگر callback تعریف شده باشد، آن را فراخوانی کن
                if (typeof callback === 'function') {
                    try {
                        // دیگر منتظر callback نمی‌مانیم و مستقیماً فرم را ارسال می‌کنیم
                        if (form && form.id) {
                            console.log('Direct form processing for:', form.id);
                            
                            // بررسی نوع فرم و ارسال مستقیم
                            switch(form.id) {
                                case 'add-coins-form':
                                    console.log('Processing add coins form directly');
                                    processAddCoinsForm(form, modalContainer);
                                    break;
                                case 'remove-coins-form':
                                    console.log('Processing remove coins form directly');
                                    processRemoveCoinsForm(form, modalContainer);
                                    break;
                                case 'add-item-form':
                                    console.log('Processing add item form directly');
                                    processAddItemForm(form, modalContainer);
                                    break;
                                case 'ban-user-form':
                                    console.log('Processing ban user form directly');
                                    processBanUserForm(form, modalContainer);
                                    break;
                                case 'reset-user-form':
                                    console.log('Processing reset user form directly');
                                    processResetUserForm(form, modalContainer);
                                    break;
                                default:
                                    // همچنان callback را صدا می‌زنیم
                                    console.log('Default: calling callback for unknown form:', form.id);
                                    callback(modalContainer);
                            }
                        } else {
                            // اگر فرم تشخیص داده نشد، callback را صدا می‌زنیم
                            console.log('No form found, calling original callback');
                            callback(modalContainer);
                        }
                    } catch (e) {
                        console.error('Error in modal callback or form processing:', e);
                        showNotification('خطا در پردازش درخواست: ' + e.message, 'error');
                    }
                } else {
                    console.warn('No callback defined for modal confirmation');
                    
                    // تلاش برای پردازش فرم حتی بدون callback
                    if (form && form.id) {
                        try {
                            // پردازش خودکار فرم
                            console.log('Auto-processing form:', form.id);
                            
                            switch(form.id) {
                                case 'add-coins-form':
                                    processAddCoinsForm(form, modalContainer);
                                    break;
                                case 'remove-coins-form':
                                    processRemoveCoinsForm(form, modalContainer);
                                    break;
                                case 'add-item-form':
                                    processAddItemForm(form, modalContainer);
                                    break;
                                case 'ban-user-form':
                                    processBanUserForm(form, modalContainer);
                                    break;
                                case 'reset-user-form':
                                    processResetUserForm(form, modalContainer);
                                    break;
                                default:
                                    console.warn('Unknown form type:', form.id);
                                    // بستن مودال و بروزرسانی صفحه
                                    closeModalAndReload(modalContainer);
                            }
                        } catch (e) {
                            console.error('Error in auto-processing form:', e);
                            showNotification('خطا در پردازش خودکار فرم: ' + e.message, 'error');
                            closeModalAndReload(modalContainer);
                        }
                    } else {
                        // بستن مودال و بروزرسانی صفحه اگر فرم وجود نداشت
                        closeModalAndReload(modalContainer);
                    }
                }
            });
        }
        
        // اطمینان از کارکرد دکمه بستن
        if (cancelBtn) {
            var newCancelBtn = cancelBtn.cloneNode(true);
            if (cancelBtn.parentNode) {
                cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            }
            
            newCancelBtn.addEventListener('click', function() {
                try {
                    var bsModal = bootstrap.Modal.getInstance(modalContainer);
                    if (bsModal) {
                        bsModal.hide();
                    }
                } catch (e) {
                    console.error('Error in cancel button:', e);
                    
                    // روش جایگزین برای بستن مودال
                    modalContainer.classList.remove('show');
                    modalContainer.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    
                    var backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop && backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                }
            });
        }
        
        // ایجاد و نمایش مودال
        try {
            var bsModal = new bootstrap.Modal(modalContainer);
            bsModal.show();
            
            console.log('Modal shown successfully');
            
            // حذف مودال از DOM بعد از بسته شدن
            modalContainer.addEventListener('hidden.bs.modal', function() {
                if (modalContainer && modalContainer.parentNode) {
                    modalContainer.parentNode.removeChild(modalContainer);
                    modalContainer = null;
                }
            });
        } catch (e) {
            console.error('Error showing modal:', e);
            showNotification('خطا در نمایش پنجره', 'error');
        }
    }
    
    /**
     * بستن مودال و بروزرسانی صفحه
     */
    function closeModalAndReload(modal) {
        try {
            var bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
            
            setTimeout(function() {
                location.reload();
            }, 500);
        } catch (e) {
            console.error('Error closing modal:', e);
            
            // روش جایگزین برای بستن مودال
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            
            var backdrop = document.querySelector('.modal-backdrop');
            if (backdrop && backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
            
            setTimeout(function() {
                location.reload();
            }, 500);
        }
    }
    
    /**
     * پردازش فرم افزایش موجودی
     */
    function processAddCoinsForm(form, modal) {
        console.log('Processing add coins form');
        var userId = activeUserId || modal.getAttribute('data-user-id');
        var amount = document.getElementById('coin-amount').value;
        var destination = document.getElementById('coin-to').value;
        var reason = document.getElementById('coin-reason') ? document.getElementById('coin-reason').value : '';
        
        if (!userId) {
            showNotification('خطا: شناسه کاربر یافت نشد', 'error');
            return;
        }
        
        if (!amount || isNaN(amount) || amount <= 0) {
            showNotification('لطفاً مقدار صحیحی وارد کنید', 'error');
            return;
        }
        
        // ارسال درخواست افزایش موجودی
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
                closeModalAndReload(modal);
                
                // نمایش پیام موفقیت
                showNotification('موجودی کاربر با موفقیت افزایش یافت', 'success');
            },
            error: function(xhr) {
                var message = 'خطا در افزایش موجودی';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showNotification(message, 'error');
            }
        });
    }
    
    /**
     * پردازش فرم کاهش موجودی
     */
    function processRemoveCoinsForm(form, modal) {
        console.log('Processing remove coins form');
        var userId = activeUserId || modal.getAttribute('data-user-id');
        var amount = document.getElementById('coin-amount').value;
        var source = document.getElementById('coin-from').value;
        var reason = document.getElementById('coin-reason') ? document.getElementById('coin-reason').value : '';
        
        if (!userId) {
            showNotification('خطا: شناسه کاربر یافت نشد', 'error');
            return;
        }
        
        if (!amount || isNaN(amount) || amount <= 0) {
            showNotification('لطفاً مقدار صحیحی وارد کنید', 'error');
            return;
        }
        
        // ارسال درخواست کاهش موجودی
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
                closeModalAndReload(modal);
                
                // نمایش پیام موفقیت
                showNotification('موجودی کاربر با موفقیت کاهش یافت', 'success');
            },
            error: function(xhr) {
                var message = 'خطا در کاهش موجودی';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showNotification(message, 'error');
            }
        });
    }
    
    /**
     * پردازش فرم افزودن آیتم
     */
    function processAddItemForm(form, modal) {
        console.log('Processing add item form');
        var userId = activeUserId || modal.getAttribute('data-user-id');
        var itemId = document.getElementById('item-id').value;
        var quantity = document.getElementById('item-quantity').value;
        
        if (!userId) {
            showNotification('خطا: شناسه کاربر یافت نشد', 'error');
            return;
        }
        
        if (!itemId) {
            showNotification('لطفاً یک آیتم انتخاب کنید', 'error');
            return;
        }
        
        if (!quantity || isNaN(quantity) || quantity <= 0) {
            showNotification('لطفاً تعداد صحیحی وارد کنید', 'error');
            return;
        }
        
        // ارسال درخواست افزودن آیتم
        $.ajax({
            url: '/admin/users/' + userId + '/add-item',
            type: 'POST',
            data: {
                itemId: itemId,
                quantity: quantity
            },
            success: function(response) {
                // بستن مودال
                closeModalAndReload(modal);
                
                // نمایش پیام موفقیت
                showNotification('آیتم با موفقیت به کاربر اضافه شد', 'success');
            },
            error: function(xhr) {
                var message = 'خطا در افزودن آیتم';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showNotification(message, 'error');
            }
        });
    }
    
    /**
     * پردازش فرم مسدودسازی کاربر
     */
    function processBanUserForm(form, modal) {
        console.log('Processing ban user form');
        var userId = activeUserId || modal.getAttribute('data-user-id');
        var reason = document.getElementById('ban-reason').value;
        
        if (!userId) {
            showNotification('خطا: شناسه کاربر یافت نشد', 'error');
            return;
        }
        
        if (!reason) {
            showNotification('لطفاً دلیل مسدودسازی را وارد کنید', 'error');
            return;
        }
        
        // ارسال درخواست مسدودسازی کاربر
        $.ajax({
            url: '/admin/users/' + userId + '/ban',
            type: 'POST',
            data: {
                reason: reason
            },
            success: function(response) {
                // بستن مودال
                closeModalAndReload(modal);
                
                // نمایش پیام موفقیت
                showNotification('کاربر با موفقیت مسدود شد', 'success');
            },
            error: function(xhr) {
                var message = 'خطا در مسدودسازی کاربر';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showNotification(message, 'error');
            }
        });
    }
    
    /**
     * پردازش فرم بازنشانی کاربر
     */
    function processResetUserForm(form, modal) {
        console.log('Processing reset user form');
        var userId = activeUserId || modal.getAttribute('data-user-id');
        var confirmed = document.getElementById('reset-confirm') ? 
                        document.getElementById('reset-confirm').checked : false;
        
        if (!userId) {
            showNotification('خطا: شناسه کاربر یافت نشد', 'error');
            return;
        }
        
        if (!confirmed) {
            showNotification('لطفاً تایید کنید که قصد بازنشانی کاربر را دارید', 'error');
            return;
        }
        
        // ارسال درخواست بازنشانی کاربر
        $.ajax({
            url: '/admin/users/' + userId + '/reset',
            type: 'POST',
            success: function(response) {
                // بستن مودال
                closeModalAndReload(modal);
                
                // نمایش پیام موفقیت
                showNotification('کاربر با موفقیت بازنشانی شد', 'success');
            },
            error: function(xhr) {
                var message = 'خطا در بازنشانی کاربر';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showNotification(message, 'error');
            }
        });
    }
    
    /**
     * راه‌اندازی رویدادهای دکمه‌های اکشن کاربر
     */
    function setupUserActionButtons() {
        // پیدا کردن دکمه‌های اکشن در صفحه
        var actionButtons = document.querySelectorAll('.user-actions-button');
        
        // اضافه کردن رویداد کلیک به هر دکمه
        for (var i = 0; i < actionButtons.length; i++) {
            (function(button) {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var userId = button.getAttribute('data-user-id');
                    if (userId) {
                        showUserActionsDropdown(button, userId);
                    }
                });
            })(actionButtons[i]);
        }
    }
    
    /**
     * راه‌اندازی اولیه
     */
    function initialize() {
        // راه‌اندازی سیستم نوتیفیکیشن‌ها
        initializeNotifications();
        
        // راه‌اندازی دکمه‌های اکشن کاربر
        setupUserActionButtons();
        
        // اکسپوز کردن فانکشن‌های مورد نیاز به عنوان API عمومی
        window.vuiUserActions = {
            showNotification: showNotification,
            showAddCoinsModal: showAddCoinsModal,
            showRemoveCoinsModal: showRemoveCoinsModal,
            showAddItemModal: showAddItemModal,
            showBanUserModal: showBanUserModal,
            showResetUserConfirmation: showResetUserConfirmation
        };
    }
    
    // بررسی آماده بودن DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();