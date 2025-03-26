/**
 * اسکریپت داشبورد با سازگاری بالا
 * 
 * این نسخه بهینه شده از اسکریپت داشبورد برای سازگاری بهتر با مرورگرهای مختلف طراحی شده است
 * از template literals و سایر ویژگی‌های ES6 استفاده نمی‌کند تا سازگاری بهتری داشته باشد
 */

(function() {
    // تابع کمکی برای فرمت اعداد با جداکننده هزارگان
    function formatNumber(num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }
    
    // تابع کمکی برای ایجاد آواتار با حروف اول نام
    function createInitialsAvatar(name, containerSelector) {
        if (!name) return;
        
        var container = document.querySelector(containerSelector);
        if (!container) return;
        
        // گرفتن حروف اول نام
        var initials = '';
        var parts = name.split(' ');
        
        if (parts.length >= 2) {
            initials = parts[0].charAt(0) + parts[1].charAt(0);
        } else if (parts.length === 1) {
            initials = parts[0].charAt(0);
        }
        
        // اگر حروف اول خالی بود یا فقط فاصله بود
        if (!initials.trim()) {
            initials = 'VU'; // یک مقدار پیش‌فرض
        }
        
        // ایجاد آواتار
        container.innerHTML = initials.toUpperCase();
    }
    
    // رویداد آماده‌سازی صفحه
    document.addEventListener('DOMContentLoaded', function() {
        // ایجاد آواتارهای کاربر با حروف اول
        var fullName = document.querySelector('.user-name') ? 
                        document.querySelector('.user-name').textContent : '';
        
        createInitialsAvatar(fullName, '.user-avatar');
        
        // فعال‌سازی تمام tooltips
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
        
        // فعال‌سازی تمام popovers
        if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
            var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
            var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl);
            });
        }
        
        // بررسی و مقداردهی کارت‌های آمار
        var statCards = document.querySelectorAll('.stat-card[data-stat-url]');
        statCards.forEach(function(card) {
            var url = card.getAttribute('data-stat-url');
            var valueElement = card.querySelector('.stat-value');
            var loadingElement = card.querySelector('.stat-loading');
            
            if (url && valueElement) {
                // نمایش حالت بارگذاری
                if (loadingElement) loadingElement.style.display = 'block';
                if (valueElement) valueElement.style.display = 'none';
                
                // درخواست داده از API
                fetch(url)
                    .then(function(response) { return response.json(); })
                    .then(function(data) {
                        // نمایش مقدار
                        if (valueElement) {
                            valueElement.textContent = formatNumber(data.value || 0);
                            valueElement.style.display = 'block';
                        }
                        
                        // پنهان کردن لودینگ
                        if (loadingElement) loadingElement.style.display = 'none';
                    })
                    .catch(function(error) {
                        console.error('خطا در دریافت داده:', error);
                        
                        // نمایش مقدار خطا
                        if (valueElement) {
                            valueElement.textContent = 'خطا!';
                            valueElement.style.display = 'block';
                        }
                        
                        // پنهان کردن لودینگ
                        if (loadingElement) loadingElement.style.display = 'none';
                    });
            }
        });
        
        // بررسی و مقداردهی جدول‌های داده
        var dataTables = document.querySelectorAll('.vui-data-table[data-table-url]');
        dataTables.forEach(function(table) {
            var url = table.getAttribute('data-table-url');
            var tableBody = table.querySelector('tbody');
            var loadingElement = table.querySelector('.table-loading');
            var emptyMessage = table.querySelector('.table-empty-message');
            
            if (url && tableBody) {
                // نمایش حالت بارگذاری
                if (loadingElement) loadingElement.style.display = 'block';
                if (emptyMessage) emptyMessage.style.display = 'none';
                
                // درخواست داده از API
                fetch(url)
                    .then(function(response) { return response.json(); })
                    .then(function(data) {
                        // پاک کردن محتوای فعلی
                        tableBody.innerHTML = '';
                        
                        // اگر داده‌ها خالی بود
                        if (!data || !data.length) {
                            if (emptyMessage) emptyMessage.style.display = 'block';
                            if (loadingElement) loadingElement.style.display = 'none';
                            return;
                        }
                        
                        // پر کردن جدول با داده‌ها
                        data.forEach(function(item) {
                            var row = document.createElement('tr');
                            
                            // بررسی ستون‌های جدول
                            var columns = table.querySelectorAll('thead th[data-field]');
                            columns.forEach(function(column) {
                                var field = column.getAttribute('data-field');
                                var cell = document.createElement('td');
                                
                                // اگر فیلد ویژه بود
                                if (field === '_actions') {
                                    cell.innerHTML = '<div class="d-flex">' +
                                                    '<a href="/admin/users/' + item.id + '" class="btn btn-sm btn-info me-1" data-bs-toggle="tooltip" title="مشاهده"><i class="bi bi-eye"></i></a>' +
                                                    '<a href="/admin/users/' + item.id + '/edit" class="btn btn-sm btn-primary me-1" data-bs-toggle="tooltip" title="ویرایش"><i class="bi bi-pencil"></i></a>' +
                                                    '<a href="/admin/users/' + item.id + '/delete" class="btn btn-sm btn-danger" data-bs-toggle="tooltip" title="حذف"><i class="bi bi-trash"></i></a>' +
                                                    '</div>';
                                }
                                else if (field === '_status') {
                                    var status = item.status || 'inactive';
                                    var statusClasses = {
                                        active: 'active',
                                        pending: 'pending',
                                        inactive: 'inactive'
                                    };
                                    var statusTexts = {
                                        active: 'فعال',
                                        pending: 'در انتظار',
                                        inactive: 'غیرفعال'
                                    };
                                    var statusIcons = {
                                        active: 'bi-check-circle',
                                        pending: 'bi-hourglass-split',
                                        inactive: 'bi-x-circle'
                                    };
                                    
                                    cell.innerHTML = '<span class="status-badge ' + statusClasses[status] + '">' +
                                                    '<i class="bi ' + statusIcons[status] + '"></i> ' +
                                                    statusTexts[status] + '</span>';
                                }
                                else if (field === '_avatar') {
                                    // ایجاد آواتار برای کاربر
                                    var userName = item.name || item.username || '';
                                    var initials = '';
                                    var parts = userName.split(' ');
                                    
                                    if (parts.length >= 2) {
                                        initials = parts[0].charAt(0) + parts[1].charAt(0);
                                    } else if (parts.length === 1) {
                                        initials = parts[0].charAt(0);
                                    }
                                    
                                    cell.innerHTML = '<div class="table-avatar">' + initials.toUpperCase() + '</div>';
                                }
                                else {
                                    // فیلدهای معمولی
                                    cell.textContent = item[field] || '';
                                }
                                
                                row.appendChild(cell);
                            });
                            
                            tableBody.appendChild(row);
                        });
                        
                        // پنهان کردن لودینگ
                        if (loadingElement) loadingElement.style.display = 'none';
                        
                        // فعال‌سازی مجدد tooltips
                        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                            var newTooltips = [].slice.call(tableBody.querySelectorAll('[data-bs-toggle="tooltip"]'));
                            newTooltips.forEach(function(element) {
                                new bootstrap.Tooltip(element);
                            });
                        }
                    })
                    .catch(function(error) {
                        console.error('خطا در دریافت داده‌های جدول:', error);
                        
                        // نمایش پیام خطا
                        tableBody.innerHTML = '<tr><td colspan="' + table.querySelectorAll('thead th').length + 
                                            '" class="text-center text-danger">خطا در دریافت اطلاعات!</td></tr>';
                        
                        // پنهان کردن لودینگ
                        if (loadingElement) loadingElement.style.display = 'none';
                    });
            }
        });
        
        // بررسی فرم‌های با اعتبارسنجی
        var forms = document.querySelectorAll('.vui-form[data-validate="true"]');
        forms.forEach(function(form) {
            form.addEventListener('submit', function(event) {
                // بررسی اعتبار فرم
                if (!this.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                this.classList.add('was-validated');
            });
        });
    });
})();