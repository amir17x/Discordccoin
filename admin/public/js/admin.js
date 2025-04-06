/**
 * اسکریپت اصلی پنل ادمین CCOIN
 * 
 * این فایل شامل توابع عمومی برای کاربرد در کل پنل ادمین است
 */

document.addEventListener('DOMContentLoaded', function() {
    // تابع باز و بسته کردن منوی کناری در حالت موبایل
    const toggleSidebar = document.querySelector('.toggle-sidebar');
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            const content = document.querySelector('.content-wrapper');
            const header = document.querySelector('.header');
            
            sidebar.classList.toggle('open');
            content.classList.toggle('sidebar-open');
            header.classList.toggle('sidebar-open');
        });
    }
    
    // تابع بستن اعلان‌ها با دکمه X
    const alertCloseButtons = document.querySelectorAll('.alert .close');
    alertCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.parentNode.style.display = 'none';
        });
    });
    
    // اضافه کردن کلاس active به لینک مربوط به صفحه فعلی در منوی کناری
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href || (href !== '/admin' && currentPath.startsWith(href))) {
            link.classList.add('active');
        }
    });
    
    // اجرای توابع مخصوص صفحات خاص
    if (currentPath.includes('/dashboard')) {
        initDashboard();
    } else if (currentPath.includes('/users')) {
        initUsersPage();
    } else if (currentPath.includes('/economy')) {
        initEconomyPage();
    } else if (currentPath.includes('/settings')) {
        initSettingsPage();
    }
});

/**
 * تابع مقداردهی اولیه صفحه داشبورد
 */
function initDashboard() {
    // اگر نمودارها وجود داشته باشند، آنها را مقداردهی کن
    if (typeof Chart !== 'undefined') {
        // نمودار فعالیت کاربران
        const userActivityCtx = document.getElementById('userActivityChart');
        if (userActivityCtx) {
            new Chart(userActivityCtx, {
                type: 'line',
                data: {
                    labels: userActivityData.labels,
                    datasets: [{
                        label: 'فعالیت کاربران',
                        data: userActivityData.values,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
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
        
        // نمودار اقتصاد
        const economyStatsCtx = document.getElementById('economyStatsChart');
        if (economyStatsCtx) {
            new Chart(economyStatsCtx, {
                type: 'bar',
                data: {
                    labels: economyData.labels,
                    datasets: [{
                        label: 'تراکنش‌ها',
                        data: economyData.transactions,
                        backgroundColor: '#2ecc71'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
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
    }
    
    // بروزرسانی آمار لحظه‌ای
    initRealtimeStats();
}

/**
 * تابع بروزرسانی آمار لحظه‌ای
 */
function initRealtimeStats() {
    // هر 30 ثانیه آمار را بروز کن
    setInterval(updateRealtimeStats, 30000);
    
    // اولین بروزرسانی را انجام بده
    updateRealtimeStats();
}

/**
 * دریافت و بروزرسانی آمار لحظه‌ای از سرور
 */
function updateRealtimeStats() {
    fetch('/admin/api/realtime-stats')
        .then(response => response.json())
        .then(data => {
            // بروزرسانی مقادیر آماری
            document.getElementById('onlineUsers').textContent = data.onlineUsers;
            document.getElementById('totalCommands').textContent = data.totalCommands;
            document.getElementById('coinsCirculation').textContent = data.coinsCirculation.toLocaleString();
            document.getElementById('serverLoad').textContent = data.serverLoad + '%';
            
            // اضافه کردن رویدادهای جدید
            const eventsContainer = document.getElementById('recentEvents');
            if (eventsContainer && data.recentEvents && data.recentEvents.length > 0) {
                // کلیر کردن رویدادهای قبلی
                eventsContainer.innerHTML = '';
                
                // اضافه کردن رویدادهای جدید
                data.recentEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event-item';
                    eventElement.innerHTML = `
                        <div class="event-icon ${event.type}">
                            <i class="fas ${getEventIcon(event.type)}"></i>
                        </div>
                        <div class="event-content">
                            <div class="event-title">${event.title}</div>
                            <div class="event-time">${event.time}</div>
                        </div>
                    `;
                    eventsContainer.appendChild(eventElement);
                });
            }
        })
        .catch(error => {
            console.error('خطا در دریافت آمار لحظه‌ای:', error);
        });
}

/**
 * دریافت آیکون مناسب برای هر نوع رویداد
 * @param {string} type نوع رویداد
 * @returns {string} کلاس آیکون
 */
function getEventIcon(type) {
    switch(type) {
        case 'info': return 'fa-info-circle';
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-circle';
    }
}

/**
 * تابع مقداردهی اولیه صفحه کاربران
 */
function initUsersPage() {
    // جستجوی کاربران
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchText = this.value.toLowerCase();
            const userTable = document.getElementById('users-table');
            const userRows = userTable.querySelectorAll('tbody tr');
            
            userRows.forEach(row => {
                const username = row.querySelector('[data-field="username"]').textContent.toLowerCase();
                const userId = row.querySelector('[data-field="id"]').textContent.toLowerCase();
                const email = row.querySelector('[data-field="email"]').textContent.toLowerCase();
                
                if (username.includes(searchText) || userId.includes(searchText) || email.includes(searchText)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // مدیریت مودال‌ها
    const modalButtons = document.querySelectorAll('[data-toggle="modal"]');
    modalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            const modal = document.querySelector(target);
            
            if (modal) {
                modal.style.display = 'block';
                
                // اگر این دکمه برای یک کاربر خاص است، اطلاعات آن را در مودال قرار بده
                const userId = this.getAttribute('data-user-id');
                if (userId) {
                    const userIdInput = modal.querySelector('input[name="userId"]');
                    if (userIdInput) {
                        userIdInput.value = userId;
                    }
                    
                    // برای عملیات‌های خاص، اطلاعات بیشتری نیاز است
                    const username = this.getAttribute('data-username');
                    if (username) {
                        const usernameSpan = modal.querySelector('.username');
                        if (usernameSpan) {
                            usernameSpan.textContent = username;
                        }
                    }
                }
            }
        });
    });
    
    // بستن مودال‌ها
    const closeButtons = document.querySelectorAll('.modal .close, .modal .btn-cancel');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // بستن مودال با کلیک خارج از آن
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * تابع مقداردهی اولیه صفحه اقتصاد
 */
function initEconomyPage() {
    // جستجوی تراکنش‌ها
    const transactionSearchInput = document.getElementById('transaction-search');
    if (transactionSearchInput) {
        transactionSearchInput.addEventListener('keyup', function() {
            const searchText = this.value.toLowerCase();
            const table = document.getElementById('transactions-table');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const userId = row.querySelector('[data-field="userId"]').textContent.toLowerCase();
                const type = row.querySelector('[data-field="type"]').textContent.toLowerCase();
                const amount = row.querySelector('[data-field="amount"]').textContent.toLowerCase();
                
                if (userId.includes(searchText) || type.includes(searchText) || amount.includes(searchText)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // بروزرسانی قیمت سهام
    const stockUpdateForms = document.querySelectorAll('.stock-update-form');
    stockUpdateForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const stockId = this.querySelector('input[name="stockId"]').value;
            const newPrice = this.querySelector('input[name="newPrice"]').value;
            
            fetch('/admin/economy/stocks/update-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stockId,
                    newPrice
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // بروزرسانی UI
                    const stockRow = document.querySelector(`tr[data-stock-id="${stockId}"]`);
                    if (stockRow) {
                        stockRow.querySelector('[data-field="price"]').textContent = newPrice;
                        
                        // نمایش پیام موفقیت
                        alert('قیمت سهام با موفقیت بروزرسانی شد.');
                    }
                } else {
                    alert(`خطا: ${data.message}`);
                }
            })
            .catch(error => {
                console.error('خطا در بروزرسانی قیمت سهام:', error);
                alert('خطا در ارتباط با سرور.');
            });
        });
    });
}

/**
 * تابع مقداردهی اولیه صفحه تنظیمات
 */
function initSettingsPage() {
    // رویداد تغییر در فرم تنظیمات
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        const inputs = settingsForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                // فعال کردن دکمه ذخیره تغییرات
                document.getElementById('save-settings').disabled = false;
            });
        });
    }
}
