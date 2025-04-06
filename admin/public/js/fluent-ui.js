/**
 * اسکریپت‌های مربوط به رابط کاربری Fluent UI برای پنل مدیریت CCOIN
 */

document.addEventListener('DOMContentLoaded', function() {
    // اجرای آیکون‌های Feather
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // باز و بسته کردن منوی موبایل
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebar = document.querySelector('.fluent-sidebar');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (backdrop) {
        backdrop.addEventListener('click', function() {
            sidebar.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // تنظیم ارتفاع نمودارها
    const resizeCharts = function() {
        const chartContainers = document.querySelectorAll('.fluent-chart-container');
        chartContainers.forEach(container => {
            if (container.dataset.autoHeight === 'true') {
                const card = container.closest('.fluent-card');
                if (card) {
                    const header = card.querySelector('.fluent-card-header');
                    const cardPadding = 32; // پدینگ کارت
                    let height = card.clientHeight;
                    
                    if (header) {
                        height -= header.clientHeight;
                    }
                    
                    height -= cardPadding;
                    container.style.height = `${height}px`;
                }
            }
        });
    };
    
    // اجرای تنظیم ارتفاع نمودارها در ابتدا و با تغییر اندازه پنجره
    resizeCharts();
    window.addEventListener('resize', resizeCharts);
    
    // فعال‌سازی تولتیپ‌ها
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            const tooltipText = this.dataset.tooltip;
            
            // ایجاد المان تولتیپ
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'fluent-tooltip';
            tooltipEl.textContent = tooltipText;
            document.body.appendChild(tooltipEl);
            
            // تنظیم موقعیت تولتیپ
            const rect = this.getBoundingClientRect();
            const tooltipRect = tooltipEl.getBoundingClientRect();
            
            let top = rect.top - tooltipRect.height - 8;
            if (top < 0) {
                top = rect.bottom + 8;
            }
            
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            if (left < 8) left = 8;
            if (left + tooltipRect.width > window.innerWidth - 8) {
                left = window.innerWidth - tooltipRect.width - 8;
            }
            
            tooltipEl.style.top = `${top + window.scrollY}px`;
            tooltipEl.style.left = `${left}px`;
            tooltipEl.classList.add('active');
            
            // حذف تولتیپ با برداشتن موس
            this.addEventListener('mouseleave', function() {
                tooltipEl.remove();
            }, { once: true });
        });
    });
    
    // فعال‌سازی دراپ‌داون‌ها
    const dropdownToggles = document.querySelectorAll('[data-toggle="dropdown"]');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const target = document.getElementById(this.dataset.target);
            if (target) {
                target.classList.toggle('active');
                
                // بستن دراپ‌داون با کلیک روی هر جای دیگر
                document.addEventListener('click', function closeDropdown() {
                    target.classList.remove('active');
                    document.removeEventListener('click', closeDropdown);
                });
            }
        });
    });
    
    // فعال‌سازی تب‌ها
    const tabLinks = document.querySelectorAll('[data-toggle="tab"]');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            // غیرفعال کردن همه تب‌ها
            const tabContainer = this.closest('.fluent-tabs');
            const activeTabLinks = tabContainer.querySelectorAll('.fluent-tab-link.active');
            const activeTabPanes = document.querySelectorAll('.fluent-tab-pane.active');
            
            activeTabLinks.forEach(activeLink => activeLink.classList.remove('active'));
            activeTabPanes.forEach(activePane => activePane.classList.remove('active'));
            
            // فعال کردن تب کلیک شده
            this.classList.add('active');
            const targetTab = document.getElementById(this.dataset.target);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
    
    // مدیریت ارسال فرم‌ها
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const submitButton = form.querySelector('[type="submit"]');
        
        if (submitButton) {
            form.addEventListener('submit', function() {
                // بررسی اعتبار فرم
                if (form.checkValidity()) {
                    // نمایش وضعیت بارگذاری
                    submitButton.classList.add('loading');
                    submitButton.disabled = true;
                    
                    // تغییر متن دکمه
                    const originalText = submitButton.innerHTML;
                    submitButton.innerHTML = '<span class="spinner"></span> در حال پردازش...';
                    
                    // ارسال فرم به صورت عادی
                    return true;
                }
            });
        }
    });
    
    // بستن پیام‌های هشدار
    const alertCloseButtons = document.querySelectorAll('.fluent-alert .close');
    alertCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.closest('.fluent-alert');
            if (alert) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.style.display = 'none';
                }, 300);
            }
        });
    });
    
    // نمایش/مخفی کردن فیلد رمز عبور
    const passwordToggles = document.querySelectorAll('.fluent-password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input && input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else if (input) {
                input.type = 'password';
                this.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    });
    
    // فعال‌سازی مودال‌ها
    const modalTriggers = document.querySelectorAll('[data-toggle="modal"]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(event) {
            event.preventDefault();
            
            const modalId = this.dataset.target;
            const modal = document.getElementById(modalId);
            
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // بستن مودال با کلیک روی دکمه بستن یا خارج از محتوا
                const closeButtons = modal.querySelectorAll('[data-dismiss="modal"], .fluent-modal-close');
                closeButtons.forEach(button => {
                    button.addEventListener('click', closeModal);
                });
                
                const modalDialog = modal.querySelector('.fluent-modal-dialog');
                modal.addEventListener('click', function(e) {
                    if (e.target === modal && !modalDialog.contains(e.target)) {
                        closeModal();
                    }
                });
                
                // بستن مودال با کلید Escape
                document.addEventListener('keydown', function escKeyPress(e) {
                    if (e.key === 'Escape') {
                        closeModal();
                        document.removeEventListener('keydown', escKeyPress);
                    }
                });
                
                function closeModal() {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    closeButtons.forEach(button => {
                        button.removeEventListener('click', closeModal);
                    });
                }
            }
        });
    });
    
    // کلیک روی تمامی ردیف‌های جدول
    const tableRowLinks = document.querySelectorAll('.fluent-table tr[data-href]');
    tableRowLinks.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function(event) {
            // اگر کلیک روی لینک یا دکمه نبود
            if (!event.target.closest('a, button, .fluent-table-actions')) {
                window.location.href = this.dataset.href;
            }
        });
    });
    
    // اجرای جستجوی زنده در جداول
    const tableSearchInputs = document.querySelectorAll('.fluent-table-search');
    tableSearchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const tableId = this.dataset.table;
            const table = document.getElementById(tableId);
            
            if (table) {
                const term = this.value.trim().toLowerCase();
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    const show = text.includes(term);
                    
                    row.style.display = show ? '' : 'none';
                });
                
                // نمایش پیام "موردی یافت نشد" اگر هیچ ردیفی نمایش داده نشود
                const tbody = table.querySelector('tbody');
                let noResultsRow = table.querySelector('.fluent-no-results');
                const visibleRows = tbody.querySelectorAll('tr:not([style*="display: none"])');
                
                if (visibleRows.length === 0) {
                    if (!noResultsRow) {
                        noResultsRow = document.createElement('tr');
                        noResultsRow.className = 'fluent-no-results';
                        const cell = document.createElement('td');
                        cell.colSpan = table.querySelector('thead tr').children.length;
                        cell.className = 'text-center';
                        cell.textContent = 'موردی یافت نشد';
                        noResultsRow.appendChild(cell);
                        tbody.appendChild(noResultsRow);
                    }
                } else if (noResultsRow) {
                    noResultsRow.remove();
                }
            }
        });
    });
    
    // دکمه‌های اسکرول به بالا
    const scrollTopButtons = document.querySelectorAll('.fluent-scroll-top');
    scrollTopButtons.forEach(button => {
        // نمایش/مخفی کردن دکمه بر اساس موقعیت اسکرول
        window.addEventListener('scroll', function() {
            if (window.scrollY > 200) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        });
        
        // اسکرول به بالا با کلیک روی دکمه
        button.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
});

/**
 * ایجاد نوتیفیکیشن توست
 * @param {string} message متن پیام
 * @param {string} type نوع پیام (success, error, warning, info)
 * @param {number} duration مدت زمان نمایش به میلی‌ثانیه
 */
function showToast(message, type = 'info', duration = 5000) {
    // حذف توست‌های قبلی با همان پیام
    const existingToasts = document.querySelectorAll('.fluent-toast');
    existingToasts.forEach(toast => {
        if (toast.querySelector('.fluent-toast-message').textContent === message) {
            toast.remove();
        }
    });
    
    // ایجاد کانتینر توست اگر وجود نداشته باشد
    let toastContainer = document.querySelector('.fluent-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'fluent-toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // ایجاد توست جدید
    const toast = document.createElement('div');
    toast.className = `fluent-toast ${type}`;
    
    // آیکون مناسب برای هر نوع
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fa-solid fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fa-solid fa-times-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fa-solid fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fa-solid fa-info-circle"></i>';
    }
    
    // ساختار توست
    toast.innerHTML = `
        <div class="fluent-toast-icon">${icon}</div>
        <div class="fluent-toast-content">
            <div class="fluent-toast-message">${message}</div>
        </div>
        <button class="fluent-toast-close"><i class="fa-solid fa-times"></i></button>
    `;
    
    // افزودن به کانتینر
    toastContainer.appendChild(toast);
    
    // نمایش با انیمیشن
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // دکمه بستن
    const closeButton = toast.querySelector('.fluent-toast-close');
    closeButton.addEventListener('click', () => {
        closeToast(toast);
    });
    
    // بستن خودکار پس از مدت زمان مشخص
    if (duration > 0) {
        setTimeout(() => {
            closeToast(toast);
        }, duration);
    }
    
    // تابع بستن توست با انیمیشن
    function closeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            
            // حذف کانتینر اگر خالی بود
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }
    
    return toast;
}

/**
 * تایید عملیات با مودال
 * @param {string} message متن پیام
 * @param {Function} onConfirm تابع اجرا شونده در صورت تایید
 * @param {Object} options تنظیمات اضافی
 */
function confirmAction(message, onConfirm, options = {}) {
    const defaults = {
        title: 'تایید عملیات',
        confirmText: 'تایید',
        cancelText: 'انصراف',
        confirmButtonClass: 'fluent-button-primary',
        onCancel: null
    };
    
    const settings = { ...defaults, ...options };
    
    // ایجاد مودال
    const modalId = 'fluent-confirm-modal-' + Math.random().toString(36).substr(2, 9);
    const modal = document.createElement('div');
    modal.className = 'fluent-modal';
    modal.id = modalId;
    
    modal.innerHTML = `
        <div class="fluent-modal-dialog">
            <div class="fluent-modal-content">
                <div class="fluent-modal-header">
                    <h5 class="fluent-modal-title">${settings.title}</h5>
                    <button type="button" class="fluent-modal-close" data-dismiss="modal">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div class="fluent-modal-body">
                    <p>${message}</p>
                </div>
                <div class="fluent-modal-footer">
                    <button type="button" class="fluent-button fluent-button-secondary" data-dismiss="modal">
                        ${settings.cancelText}
                    </button>
                    <button type="button" class="fluent-button ${settings.confirmButtonClass}" id="${modalId}-confirm">
                        ${settings.confirmText}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // نمایش مودال
    setTimeout(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 10);
    
    // تنظیم رویدادها
    const confirmButton = document.getElementById(`${modalId}-confirm`);
    const closeButtons = modal.querySelectorAll('[data-dismiss="modal"], .fluent-modal-close');
    
    // تایید عملیات
    confirmButton.addEventListener('click', function() {
        closeModal();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    // انصراف
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal();
            if (typeof settings.onCancel === 'function') {
                settings.onCancel();
            }
        });
    });
    
    // بستن با کلیک خارج از مودال
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
            if (typeof settings.onCancel === 'function') {
                settings.onCancel();
            }
        }
    });
    
    // بستن با دکمه Escape
    document.addEventListener('keydown', function escKeyPress(e) {
        if (e.key === 'Escape') {
            closeModal();
            if (typeof settings.onCancel === 'function') {
                settings.onCancel();
            }
            document.removeEventListener('keydown', escKeyPress);
        }
    });
    
    // تابع بستن مودال
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}
