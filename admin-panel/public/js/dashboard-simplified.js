/**
 * اسکریپت بهینه‌سازی داشبورد
 * این فایل نسخه ساده‌سازی شده و سازگار با مرورگرهای قدیمی‌تر است
 */

document.addEventListener('DOMContentLoaded', function() {
    // بهینه‌سازی کارت‌های آمار و بهبود ظاهر آن‌ها
    initializeStatCards();
    
    // بهبود نمودارها و گراف‌ها
    initializeCharts();
    
    // راه‌اندازی جداول
    setupTables();
    
    // بهبود فرم‌ها
    enhanceForms();
    
    // بهینه‌سازی فضای خالی
    optimizeWhitespace();
    
    // افزودن انیمیشن‌های ورودی
    addEntryAnimations();
    
    // بهبود نمایش دکمه‌های عملیات
    enhanceActionButtons();
    
    // نمایش وضعیت ربات دیسکورد
    displayBotStatus();
    
    // فعال‌سازی نمودار فعالیت‌ها
    initializeActivityChart();
    
    // بهبود نمایش پیام‌های خالی
    enhanceEmptyStates();
});

/**
 * بهینه‌سازی کارت‌های آمار
 */
function initializeStatCards() {
    // افزودن آیکون به کارت‌های آمار
    var statCards = document.querySelectorAll('.stat-card');
    
    for (var i = 0; i < statCards.length; i++) {
        var card = statCards[i];
        var icon = card.getAttribute('data-icon');
        var color = card.getAttribute('data-color') || 'primary';
        
        if (icon) {
            // افزودن آیکون با استایل مناسب
            var iconContainer = document.createElement('div');
            iconContainer.className = 'stat-icon bg-' + color + '-transparent';
            iconContainer.innerHTML = '<i class="bi bi-' + icon + '"></i>';
            
            var cardBody = card.querySelector('.card-body');
            if (cardBody) {
                cardBody.insertBefore(iconContainer, cardBody.firstChild);
            }
        }
        
        // افزودن گرادیان به کارت‌ها
        card.classList.add('gradient-border-' + color);
    }
    
    // تقویت اطلاعات آماری
    fetchAndUpdateStats();
}

/**
 * دریافت و بروزرسانی آمار از API
 */
function fetchAndUpdateStats() {
    // دریافت آمار از API
    fetch('/api/stats')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // بروزرسانی کارت‌های آمار
            updateStatCard('total-users', data.totalUsers || 0);
            updateStatCard('total-ccoin', data.totalCcoin || 0);
            updateStatCard('total-crystals', data.totalCrystals || 0);
            updateStatCard('total-quests', data.totalQuests || 0);
            updateStatCard('total-items', data.totalItems || 0);
            updateStatCard('total-games', data.totalGames || 0);
        })
        .catch(function(error) {
            console.log('خطا در دریافت آمار:', error);
        });
}

/**
 * بروزرسانی یک کارت آمار خاص
 */
function updateStatCard(id, value) {
    var element = document.getElementById(id);
    if (!element) return;
    
    // استفاده از انیمیشن برای تغییر مقدار
    if (typeof countUp === 'function') {
        var countUp = new CountUp(element, value, {
            duration: 2,
            separator: ',',
        });
        
        if (!countUp.error) {
            countUp.start();
        } else {
            element.textContent = value.toLocaleString();
        }
    } else {
        // اگر کتابخانه CountUp در دسترس نبود
        element.textContent = value.toLocaleString();
    }
}

/**
 * راه‌اندازی نمودارها
 */
function initializeCharts() {
    // چک کردن وجود کتابخانه Chart.js
    if (typeof Chart === 'undefined') return;
    
    // رنگ‌های پیش‌فرض تم
    var chartColors = {
        primary: 'rgba(94, 114, 228, 1)',
        primaryLight: 'rgba(94, 114, 228, 0.1)',
        secondary: 'rgba(130, 94, 228, 1)',
        secondaryLight: 'rgba(130, 94, 228, 0.1)',
        success: 'rgba(45, 206, 137, 1)',
        successLight: 'rgba(45, 206, 137, 0.1)',
        info: 'rgba(17, 205, 239, 1)',
        infoLight: 'rgba(17, 205, 239, 0.1)',
        warning: 'rgba(251, 99, 64, 1)',
        warningLight: 'rgba(251, 99, 64, 0.1)',
        danger: 'rgba(245, 54, 92, 1)',
        dangerLight: 'rgba(245, 54, 92, 0.1)',
        dark: 'rgba(32, 32, 48, 1)',
        darkLight: 'rgba(32, 32, 48, 0.1)',
        white: 'rgba(255, 255, 255, 1)',
        whiteLight: 'rgba(255, 255, 255, 0.1)',
        muted: 'rgba(136, 152, 170, 1)',
        mutedLight: 'rgba(136, 152, 170, 0.1)'
    };
    
    // تنظیمات عمومی برای تمام نمودارها
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.font.family = 'Vazirmatn, system-ui, -apple-system, sans-serif';
    
    // نمودار کاربران فعال
    var activeUsersElement = document.getElementById('active-users-chart');
    if (activeUsersElement) {
        var activeUsersChart = new Chart(activeUsersElement, {
            type: 'line',
            data: {
                labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر'],
                datasets: [{
                    label: 'کاربران فعال',
                    data: [15, 30, 55, 45, 70, 65, 85],
                    borderColor: chartColors.primary,
                    backgroundColor: chartColors.primaryLight,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: chartColors.primary,
                    pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(32, 32, 48, 0.9)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                }
            }
        });
    }
    
    // نمودار تراکنش‌ها
    var transactionsElement = document.getElementById('transactions-chart');
    if (transactionsElement) {
        var transactionsChart = new Chart(transactionsElement, {
            type: 'bar',
            data: {
                labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
                datasets: [{
                    label: 'تراکنش‌ها',
                    data: [25, 40, 30, 35, 50, 45, 20],
                    backgroundColor: chartColors.secondary,
                    borderRadius: 5,
                    barThickness: 12,
                    maxBarThickness: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(32, 32, 48, 0.9)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                }
            }
        });
    }
}

/**
 * راه‌اندازی جداول
 */
function setupTables() {
    var tables = document.querySelectorAll('.table');
    
    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        
        // افزودن کلاس‌های لازم
        table.classList.add('vui-table');
        
        // بهبود عملکرد سطرهای جدول
        var rows = table.querySelectorAll('tbody tr');
        for (var j = 0; j < rows.length; j++) {
            rows[j].addEventListener('click', function() {
                // حذف کلاس انتخاب شده از تمام سطرها
                var allRows = this.parentElement.querySelectorAll('tr');
                for (var k = 0; k < allRows.length; k++) {
                    allRows[k].classList.remove('selected-row');
                }
                
                // اضافه کردن کلاس انتخاب شده به سطر کلیک شده
                this.classList.add('selected-row');
            });
        }
        
        // افزودن امکان مرتب‌سازی
        var headers = table.querySelectorAll('th[data-sort]');
        for (var j = 0; j < headers.length; j++) {
            headers[j].addEventListener('click', function() {
                var sortKey = this.getAttribute('data-sort');
                var isAsc = this.classList.contains('sort-asc');
                
                // حذف کلاس‌های مرتب‌سازی از همه هدرها
                var allHeaders = this.parentElement.querySelectorAll('th');
                for (var k = 0; k < allHeaders.length; k++) {
                    allHeaders[k].classList.remove('sort-asc', 'sort-desc');
                }
                
                // تنظیم کلاس‌ مرتب‌سازی جدید
                if (isAsc) {
                    this.classList.add('sort-desc');
                } else {
                    this.classList.add('sort-asc');
                }
                
                // انجام مرتب‌سازی
                sortTable(this.closest('table'), sortKey, !isAsc);
            });
        }
    }
}

/**
 * مرتب‌سازی جدول
 */
function sortTable(table, key, asc) {
    var tbody = table.querySelector('tbody');
    var rows = Array.from(tbody.querySelectorAll('tr'));
    
    // مرتب‌سازی سطرها
    rows.sort(function(a, b) {
        var cellA = a.querySelector('[data-value-' + key + ']');
        var cellB = b.querySelector('[data-value-' + key + ']');
        
        var valueA = cellA ? cellA.getAttribute('data-value-' + key) : '';
        var valueB = cellB ? cellB.getAttribute('data-value-' + key) : '';
        
        if (!isNaN(valueA) && !isNaN(valueB)) {
            return asc ? valueA - valueB : valueB - valueA;
        } else {
            return asc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
    });
    
    // بازسازی جدول با ترتیب جدید
    rows.forEach(function(row) {
        tbody.appendChild(row);
    });
}

/**
 * بهبود فرم‌ها
 */
function enhanceForms() {
    // تقویت فیلدهای ورودی
    var formControls = document.querySelectorAll('.form-control');
    
    for (var i = 0; i < formControls.length; i++) {
        var input = formControls[i];
        
        // افزودن اثر فوکوس بهتر
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    }
    
    // بهبود دکمه‌های فرم
    var formButtons = document.querySelectorAll('.form-action');
    
    for (var i = 0; i < formButtons.length; i++) {
        var button = formButtons[i];
        
        // افزودن افکت ریپل (موج) به دکمه‌ها
        button.addEventListener('click', function(e) {
            var x = e.clientX - e.target.getBoundingClientRect().left;
            var y = e.clientY - e.target.getBoundingClientRect().top;
            
            var ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(function() {
                ripple.remove();
            }, 600);
        });
    }
}

/**
 * بهینه‌سازی فضای خالی
 */
function optimizeWhitespace() {
    // کم کردن فضای خالی در کارت‌های آمار
    var statCards = document.querySelectorAll('.stat-card');
    for (var i = 0; i < statCards.length; i++) {
        var card = statCards[i];
        var cardBody = card.querySelector('.card-body');
        
        if (cardBody) {
            cardBody.style.padding = '15px';
        }
    }
    
    // بهینه‌سازی فضای جداول
    var tables = document.querySelectorAll('.table-responsive');
    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        table.style.maxHeight = '400px';
    }
    
    // بهبود لایوت گرید
    var gridContainers = document.querySelectorAll('.row');
    for (var i = 0; i < gridContainers.length; i++) {
        var container = gridContainers[i];
        container.style.marginBottom = '15px';
    }
}

/**
 * افزودن انیمیشن‌های ورودی
 */
function addEntryAnimations() {
    // افزودن انیمیشن به کارت‌ها
    var cards = document.querySelectorAll('.card');
    
    for (var i = 0; i < cards.length; i++) {
        (function(index) {
            setTimeout(function() {
                cards[index].classList.add('animate-fade-in');
            }, index * 100);
        })(i);
    }
}

/**
 * بهبود نمایش دکمه‌های عملیات
 */
function enhanceActionButtons() {
    // دکمه‌های عملیات در داشبورد
    var actionButtons = document.querySelectorAll('.action-btn');
    
    for (var i = 0; i < actionButtons.length; i++) {
        var button = actionButtons[i];
        
        // افزودن تولتیپ
        var title = button.getAttribute('data-title');
        if (title) {
            button.setAttribute('title', title);
            
            // ایجاد تولتیپ دستی اگر Bootstrap نباشد
            button.addEventListener('mouseenter', function() {
                var title = this.getAttribute('title');
                if (!title) return;
                
                var tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = title;
                
                document.body.appendChild(tooltip);
                
                var rect = this.getBoundingClientRect();
                tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
                
                this.setAttribute('data-tooltip-id', Date.now());
                tooltip.setAttribute('data-for', this.getAttribute('data-tooltip-id'));
            });
            
            button.addEventListener('mouseleave', function() {
                var id = this.getAttribute('data-tooltip-id');
                if (!id) return;
                
                var tooltip = document.querySelector('.custom-tooltip[data-for="' + id + '"]');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        }
    }
}

/**
 * نمایش وضعیت ربات دیسکورد
 */
function displayBotStatus() {
    // دریافت وضعیت ربات از API
    fetch('/api/bot/status')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // بروزرسانی وضعیت ربات
            updateBotStatusUI(data);
        })
        .catch(function(error) {
            console.log('خطا در دریافت وضعیت ربات:', error);
        });
}

/**
 * بروزرسانی UI وضعیت ربات
 */
function updateBotStatusUI(data) {
    // بروزرسانی نشانگر وضعیت
    var statusIndicator = document.querySelector('.bot-status-indicator');
    if (statusIndicator) {
        if (data.status === 'online') {
            statusIndicator.classList.add('online');
            statusIndicator.classList.remove('offline');
        } else {
            statusIndicator.classList.add('offline');
            statusIndicator.classList.remove('online');
        }
    }
    
    // بروزرسانی متن وضعیت
    var statusText = document.querySelector('.bot-status-text');
    if (statusText) {
        statusText.textContent = data.status === 'online' ? 'آنلاین' : 'آفلاین';
    }
    
    // بروزرسانی نسخه
    var versionElement = document.querySelector('.bot-version');
    if (versionElement && data.version) {
        versionElement.textContent = data.version;
    }
    
    // بروزرسانی مدت زمان روشن بودن
    var uptimeElement = document.querySelector('.bot-uptime');
    if (uptimeElement && data.uptime) {
        uptimeElement.textContent = formatUptime(data.uptime);
    }
}

/**
 * فرمت‌دهی مدت زمان فعالیت
 */
function formatUptime(seconds) {
    var days = Math.floor(seconds / 86400);
    var hours = Math.floor((seconds % 86400) / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return days + ' روز، ' + hours + ' ساعت';
    } else if (hours > 0) {
        return hours + ' ساعت، ' + minutes + ' دقیقه';
    } else {
        return minutes + ' دقیقه';
    }
}

/**
 * راه‌اندازی نمودار فعالیت‌ها
 */
function initializeActivityChart() {
    var activityChart = document.getElementById('activity-chart');
    if (!activityChart || typeof Chart === 'undefined') return;
    
    // نمودار فعالیت‌های سیستم
    new Chart(activityChart, {
        type: 'line',
        data: {
            labels: ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
            datasets: [{
                label: 'تراکنش‌ها',
                data: [5, 15, 12, 18, 20, 15, 12],
                borderColor: 'rgba(94, 114, 228, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(94, 114, 228, 1)',
                pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: false,
                tension: 0.4
            }, {
                label: 'ورود کاربران',
                data: [7, 12, 8, 10, 15, 10, 8],
                borderColor: 'rgba(45, 206, 137, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(45, 206, 137, 1)',
                pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(32, 32, 48, 0.9)',
                    titleColor: 'rgba(255, 255, 255, 0.9)',
                    bodyColor: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    usePointStyle: true
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * بهبود نمایش پیام‌های خالی
 */
function enhanceEmptyStates() {
    // جداول خالی
    var emptyTables = document.querySelectorAll('table tbody:empty, table tbody tr:only-child:has(td[colspan])');
    
    for (var i = 0; i < emptyTables.length; i++) {
        var table = emptyTables[i].closest('table');
        var container = table.closest('.table-responsive, .card-body, .container');
        
        // بررسی آیا پیام خالی بودن وجود دارد
        var hasEmptyMessage = container.querySelector('.empty-state-message');
        
        if (!hasEmptyMessage) {
            // ایجاد پیام خالی بودن
            var emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state-message';
            emptyMessage.innerHTML = '<div class="empty-state-icon"><i class="bi bi-inbox"></i></div>' +
                                  '<h5 class="empty-state-title">هیچ داده‌ای یافت نشد</h5>' +
                                  '<p class="empty-state-description">داده‌ای برای نمایش در این بخش وجود ندارد.</p>';
            
            // اضافه کردن پیام خالی بودن بعد از جدول
            if (container) {
                var tableContainer = document.createElement('div');
                tableContainer.className = 'empty-state-container';
                
                // جایگزین کردن جدول با پیام خالی بودن
                table.style.display = 'none';
                container.appendChild(emptyMessage);
            }
        }
    }
}