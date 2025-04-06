/**
 * اسکریپت‌های Fluent UI
 * 
 * این فایل شامل اسکریپت‌های لازم برای کارکرد صحیح رابط کاربری Fluent UI است.
 */

document.addEventListener('DOMContentLoaded', function() {
    // بارگذاری آیکون‌های Feather
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // فعال‌سازی منوی کاربر
    setupUserDropdown();

    // فعال‌سازی منوی موبایل
    setupMobileMenu();

    // فعال‌سازی تب‌ها
    setupTabs();

    // فعال‌سازی آکاردیون‌ها
    setupAccordions();

    // رسم نمودارها اگر ChartJS موجود باشد
    if (typeof Chart !== 'undefined') {
        renderCharts();
    }
});

/**
 * فعال‌سازی منوی کاربر
 */
function setupUserDropdown() {
    const userMenu = document.querySelector('.fluent-user-info');
    const dropdownMenu = document.querySelector('.fluent-dropdown-menu');
    
    if (userMenu && dropdownMenu) {
        userMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('active');
        });
    }
}

/**
 * فعال‌سازی منوی موبایل
 */
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    const sidebar = document.querySelector('.fluent-sidebar');
    
    if (menuToggle && closeSidebarBtn && backdrop && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        closeSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        backdrop.addEventListener('click', function() {
            sidebar.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

/**
 * فعال‌سازی تب‌ها
 */
function setupTabs() {
    const tabContainers = document.querySelectorAll('.fluent-tabs');
    
    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.fluent-tab-button');
        const tabPanels = container.querySelectorAll('.fluent-tab-panel');
        
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                // غیرفعال کردن همه تب‌ها
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // فعال کردن تب انتخاب شده
                button.classList.add('active');
                tabPanels[index].classList.add('active');
            });
        });
    });
}

/**
 * فعال‌سازی آکاردیون‌ها
 */
function setupAccordions() {
    const accordionHeaders = document.querySelectorAll('.fluent-accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.closest('.fluent-accordion-item');
            accordionItem.classList.toggle('expanded');
            
            // نمایش/پنهان کردن بخش محتوا
            const content = accordionItem.querySelector('.fluent-accordion-content');
            
            if (accordionItem.classList.contains('expanded')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = null;
            }
        });
    });
}

/**
 * رسم نمودارها با ChartJS
 */
function renderCharts() {
    // نمودار تراکنش‌ها
    const transactionsCtx = document.getElementById('transactionsChart');
    if (transactionsCtx) {
        new Chart(transactionsCtx, {
            type: 'line',
            data: {
                labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
                datasets: [{
                    label: 'تراکنش‌ها',
                    data: [1200, 1900, 2300, 1800, 2500, 3000, 2800, 3200, 3500, 3800, 4000, 4200],
                    borderColor: 'rgb(0, 120, 212)',
                    backgroundColor: 'rgba(0, 120, 212, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // نمودار کاربران
    const usersCtx = document.getElementById('usersChart');
    if (usersCtx) {
        new Chart(usersCtx, {
            type: 'bar',
            data: {
                labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
                datasets: [{
                    label: 'کاربران جدید',
                    data: [65, 80, 91, 76, 85, 99],
                    backgroundColor: 'rgb(0, 120, 212)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // نمودار شاخص بازار سهام
    const stocksCtx = document.getElementById('stockMarketChart');
    if (stocksCtx) {
        new Chart(stocksCtx, {
            type: 'line',
            data: {
                labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
                datasets: [{
                    label: 'شاخص بازار',
                    data: [1000, 1040, 1020, 1080, 1070, 1110, 1150],
                    borderColor: 'rgb(16, 124, 16)',
                    backgroundColor: 'rgba(16, 124, 16, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    // نمودار توزیع بازی‌ها
    const gamesCtx = document.getElementById('gamesDistributionChart');
    if (gamesCtx) {
        new Chart(gamesCtx, {
            type: 'doughnut',
            data: {
                labels: ['جنگ خانوادگی', 'پابجی', 'قرعه‌کشی', 'جنگ', 'مافیا', 'گرگینه'],
                datasets: [{
                    label: 'بازی‌ها',
                    data: [30, 25, 15, 10, 10, 10],
                    backgroundColor: [
                        'rgb(0, 120, 212)',
                        'rgb(16, 124, 16)',
                        'rgb(209, 52, 56)',
                        'rgb(216, 59, 1)',
                        'rgb(135, 100, 184)',
                        'rgb(232, 178, 36)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

/**
 * به‌روزرسانی نمودارها با داده‌های جدید
 * @param {Object} data داده‌های جدید
 */
function updateCharts(data) {
    // در این قسمت می‌توانید کد به‌روزرسانی نمودارها را قرار دهید
    console.log('Updating charts with new data:', data);
}

/**
 * نمایش اعلان‌ها
 * @param {string} message پیام اعلان
 * @param {string} type نوع اعلان (success, error, info)
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fluent-toast ${type}`;
    toast.innerHTML = `
        <div class="fluent-toast-icon">
            <i class="${type === 'success' ? 'fa-solid fa-check-circle' : 
                       type === 'error' ? 'fa-solid fa-exclamation-circle' : 
                       'fa-solid fa-info-circle'}"></i>
        </div>
        <div class="fluent-toast-content">
            <p>${message}</p>
        </div>
        <button class="fluent-toast-close"><i class="fa-solid fa-times"></i></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
    
    const closeButton = toast.querySelector('.fluent-toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}