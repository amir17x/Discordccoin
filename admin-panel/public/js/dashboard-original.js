/**
 * فایل اصلی JavaScript برای پنل مدیریت Ccoin
 */

/**
 * انیمیشن اعداد در کارت‌های آماری
 * @param {string} selector سلکتور CSS برای المان‌های عددی
 * @param {number} duration مدت زمان انیمیشن به میلی‌ثانیه
 */
function animateStatNumbers(selector = '.stat-value[data-value]', duration = 1500) {
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(el => {
    const targetValue = parseFloat(el.getAttribute('data-value'));
    if (isNaN(targetValue)) return;
    
    const isInteger = Number.isInteger(targetValue);
    const isPercentage = el.classList.contains('percentage');
    const isCurrency = el.classList.contains('currency');
    const decimalPlaces = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
    const startValue = 0;
    
    let currentValue = startValue;
    const startTime = performance.now();
    
    function updateValue(currentTime) {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime >= duration) {
        // انیمیشن به پایان رسیده
        currentValue = targetValue;
      } else {
        // محاسبه مقدار فعلی بر اساس زمان سپری شده
        const progress = elapsedTime / duration;
        // استفاده از تابع easeOutQuad برای انیمیشن نرم‌تر
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        currentValue = startValue + (targetValue - startValue) * easeProgress;
      }
      
      // فرمت عدد بر اساس نوع
      let formattedValue;
      if (isPercentage) {
        formattedValue = currentValue.toFixed(decimalPlaces) + '%';
      } else if (isCurrency) {
        formattedValue = currentValue.toLocaleString('fa-IR');
      } else if (isInteger) {
        formattedValue = Math.round(currentValue).toLocaleString('fa-IR');
      } else {
        formattedValue = currentValue.toFixed(decimalPlaces).toLocaleString('fa-IR');
      }
      
      el.textContent = formattedValue;
      
      if (elapsedTime < duration) {
        requestAnimationFrame(updateValue);
      }
    }
    
    requestAnimationFrame(updateValue);
  });
}

/**
 * انیمیشن پیشرفت در نوارهای پیشرفت
 * @param {string} selector سلکتور CSS برای نوارهای پیشرفت
 * @param {number} duration مدت زمان انیمیشن به میلی‌ثانیه
 */
function animateProgressBars(selector = '.progress-bar[data-value]', duration = 1200) {
  const progressBars = document.querySelectorAll(selector);
  
  progressBars.forEach(bar => {
    const targetValue = parseFloat(bar.getAttribute('data-value'));
    if (isNaN(targetValue)) return;
    
    const startValue = 0;
    const startTime = performance.now();
    
    function updateProgress(currentTime) {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime >= duration) {
        // انیمیشن به پایان رسیده
        bar.style.width = `${targetValue}%`;
        if (bar.textContent.trim() !== '') {
          bar.textContent = `${targetValue}%`;
        }
      } else {
        // محاسبه مقدار فعلی بر اساس زمان سپری شده
        const progress = elapsedTime / duration;
        // استفاده از تابع easeOutQuart برای انیمیشن نرم‌تر
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeProgress;
        
        bar.style.width = `${currentValue}%`;
        if (bar.textContent.trim() !== '') {
          bar.textContent = `${Math.round(currentValue)}%`;
        }
        
        requestAnimationFrame(updateProgress);
      }
    }
    
    requestAnimationFrame(updateProgress);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // ----- تنظیمات عمومی -----
  initializeTooltips();
  handleSidebarToggle();
  setupFilterTables();
  initializeDataTables();
  handleFormValidation();
  setupThemeToggle();
  
  // ----- عملیات‌های اختصاصی صفحات -----
  setupDashboardCharts();
  setupUserEvents();
  setupItemEvents();
  setupClanEvents();
  setupQuestEvents();
  setupSettingsEvents();
  
  // ----- انیمیشن‌های Vision UI -----
  setTimeout(() => {
    animateStatNumbers();
    animateProgressBars();
  }, 300);
});

/**
 * راه‌اندازی تولتیپ‌ها
 */
function initializeTooltips() {
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltips.length > 0) {
    tooltips.forEach(tooltip => {
      new bootstrap.Tooltip(tooltip);
    });
  }
}

/**
 * مدیریت منوی کناری با استایل Vision UI
 */
function handleSidebarToggle() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebarCloseBtn = document.querySelector('.btn-sidebar-close');
  const sidebar = document.querySelector('.vui-sidebar');
  const contentWrapper = document.querySelector('.vui-content-wrapper');
  const overlay = document.createElement('div');
  
  // اضافه کردن اورلی برای حالت موبایل
  overlay.className = 'vui-sidebar-overlay';
  document.body.appendChild(overlay);

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', function() {
      sidebar.classList.add('show');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (sidebarCloseBtn && sidebar) {
    sidebarCloseBtn.addEventListener('click', function() {
      sidebar.classList.remove('show');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  overlay.addEventListener('click', function() {
    if (sidebar && sidebar.classList.contains('show')) {
      sidebar.classList.remove('show');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // بستن سایدبار با کلیک خارج از آن
  document.addEventListener('click', function(event) {
    if (sidebar && sidebar.classList.contains('show') && 
        !sidebar.contains(event.target) && 
        mobileToggle && !mobileToggle.contains(event.target)) {
      sidebar.classList.remove('show');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  // اضافه کردن کلاس ریسپانسیو به لیوت در هنگام ریسایز
  function handleResize() {
    if (window.innerWidth <= 992) {
      document.body.classList.add('vui-mobile');
    } else {
      document.body.classList.remove('vui-mobile');
      // بستن سایدبار در صورت تغییر به دسکتاپ
      sidebar.classList.remove('show');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  
  // بررسی سایز در ابتدای لود
  handleResize();
  
  // اضافه کردن ایونت ریسایز
  window.addEventListener('resize', handleResize);
}

/**
 * راه‌اندازی فیلترهای جدول
 */
function setupFilterTables() {
  // انتخاب‌کننده دسته‌بندی
  const categoryFilters = document.querySelectorAll('.category-filter');
  categoryFilters.forEach(filter => {
    filter.addEventListener('change', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // دکمه‌های فیلتر وضعیت
  const statusFilters = document.querySelectorAll('.status-filter-btn');
  statusFilters.forEach(btn => {
    btn.addEventListener('click', function() {
      const filterButtons = this.parentNode.querySelectorAll('.status-filter-btn');
      filterButtons.forEach(button => button.classList.remove('active'));
      this.classList.add('active');
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // جستجو
  const searchInputs = document.querySelectorAll('.search-filter');
  searchInputs.forEach(input => {
    input.addEventListener('keyup', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // دکمه‌های بازنشانی فیلتر
  const resetButtons = document.querySelectorAll('.reset-filters');
  resetButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      resetFilters(this.getAttribute('data-table'));
    });
  });
}

/**
 * اعمال فیلترها به جدول
 */
function applyFilters(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  const searchInput = document.querySelector(`.search-filter[data-table="${tableId}"]`);
  const categoryFilter = document.querySelector(`.category-filter[data-table="${tableId}"]`);
  const statusFilter = document.querySelector(`.status-filter-btn.active[data-table="${tableId}"]`);

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const category = categoryFilter ? categoryFilter.value : 'all';
  const status = statusFilter ? statusFilter.getAttribute('data-status') : 'all';

  rows.forEach(row => {
    let showRow = true;

    // اعمال فیلتر جستجو
    if (searchTerm) {
      const text = row.textContent.toLowerCase();
      showRow = text.includes(searchTerm);
    }

    // اعمال فیلتر دسته‌بندی
    if (showRow && category !== 'all') {
      const rowCategory = row.getAttribute('data-category');
      showRow = rowCategory === category;
    }

    // اعمال فیلتر وضعیت
    if (showRow && status !== 'all') {
      const rowStatus = row.getAttribute('data-status');
      showRow = rowStatus === status;
    }

    row.style.display = showRow ? '' : 'none';
  });

  updateFilterCounts(tableId);
}

/**
 * بازنشانی فیلترهای جدول
 */
function resetFilters(tableId) {
  const searchInput = document.querySelector(`.search-filter[data-table="${tableId}"]`);
  const categoryFilter = document.querySelector(`.category-filter[data-table="${tableId}"]`);
  const statusFilters = document.querySelectorAll(`.status-filter-btn[data-table="${tableId}"]`);
  const allStatusBtn = document.querySelector(`.status-filter-btn[data-table="${tableId}"][data-status="all"]`);

  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = 'all';
  
  if (statusFilters.length > 0) {
    statusFilters.forEach(btn => btn.classList.remove('active'));
    if (allStatusBtn) allStatusBtn.classList.add('active');
  }

  const table = document.getElementById(tableId);
  if (table) {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.style.display = '';
    });
  }

  updateFilterCounts(tableId);
}

/**
 * بروزرسانی تعداد آیتم‌های فیلتر شده
 */
function updateFilterCounts(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const totalCount = table.querySelectorAll('tbody tr').length;
  const visibleCount = table.querySelectorAll('tbody tr[style=""]').length;
  const countDisplay = document.querySelector(`.filter-count[data-table="${tableId}"]`);
  
  if (countDisplay) {
    countDisplay.textContent = `نمایش ${visibleCount} از ${totalCount}`;
  }
}

/**
 * راه‌اندازی DataTables برای جداول
 */
function initializeDataTables() {
  const dataTables = document.querySelectorAll('.datatable');
  if (dataTables.length > 0 && typeof $.fn.DataTable !== 'undefined') {
    dataTables.forEach(table => {
      $(table).DataTable({
        "responsive": true,
        "language": {
          "search": "جستجو:",
          "lengthMenu": "نمایش _MENU_ مورد در هر صفحه",
          "zeroRecords": "موردی یافت نشد",
          "info": "نمایش _START_ تا _END_ از _TOTAL_ مورد",
          "infoEmpty": "هیچ موردی موجود نیست",
          "infoFiltered": "(فیلتر شده از _MAX_ مورد)",
          "paginate": {
            "first": "اولین",
            "last": "آخرین",
            "next": "بعدی",
            "previous": "قبلی"
          }
        }
      });
    });
  }
}

/**
 * بررسی اعتبارسنجی فرم‌ها
 */
function handleFormValidation() {
  const forms = document.querySelectorAll('.needs-validation');
  
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * تنظیم کلید تغییر تم روشن/تاریک
 */
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  const currentTheme = localStorage.getItem('admin-theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggle.checked = currentTheme === 'dark';
  
  themeToggle.addEventListener('change', function() {
    const theme = this.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  });
}

/**
 * راه‌اندازی نمودارهای داشبورد
 */
function setupDashboardCharts() {
  setupUserActivityChart();
  setupGamesChart();
  setupTransactionsChart();
  setupEconomyPieChart();
}

/**
 * نمودار فعالیت کاربران
 */
function setupUserActivityChart() {
  const chartElement = document.getElementById('userActivityChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // تنظیمات برای نمودار کاربران فعال
    const labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    
    // محاسبه عرض gradient برای canvas
    const ctx = chartElement.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(67, 24, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(67, 24, 255, 0.2)');
    
    const data = {
      labels: labels,
      datasets: [{
        label: 'کاربران فعال',
        data: window.chartData && window.chartData.userActivity ? window.chartData.userActivity : [120, 115, 130, 125, 150, 170, 160],
        fill: true,
        backgroundColor: gradient,
        borderColor: 'rgba(67, 24, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(67, 24, 255, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4
      }]
    };
    
    const config = {
      type: 'line',
      data: data,
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
            titleFont: {
              family: 'Vazirmatn'
            },
            bodyFont: {
              family: 'Vazirmatn'
            },
            backgroundColor: 'rgba(22, 24, 39, 0.8)',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            boxPadding: 5,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw} کاربر`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                family: 'Vazirmatn'
              }
            }
          },
          y: {
            grid: {
              borderDash: [5, 5],
              color: 'rgba(255, 255, 255, 0.1)',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              padding: 10,
              font: {
                family: 'Vazirmatn'
              }
            }
          }
        }
      }
    };
    
    // اگر چارت قبلاً ساخته شده بود، آن را نابود کنیم
    if (window.userActivityChart) {
      window.userActivityChart.destroy();
    }
    
    // ساخت چارت جدید
    window.userActivityChart = new Chart(chartElement, config);
  } catch (error) {
    console.error('خطا در رسم نمودار فعالیت کاربران:', error);
    chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
  }
}

/**
 * نمودار بازی‌های انجام شده
 */
function setupGamesChart() {
  const chartElement = document.getElementById('gamesChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // تنظیمات برای نمودار بازی‌ها
    const data = {
      labels: ['سکه شیر یا خط', 'سنگ کاغذ قیچی', 'حدس عدد', 'بازی تاس', 'چرخ شانس'],
      datasets: [{
        data: window.chartData && window.chartData.games ? window.chartData.games : [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(67, 24, 255, 0.8)',
          'rgba(57, 184, 255, 0.8)',
          'rgba(1, 181, 116, 0.8)',
          'rgba(255, 181, 71, 0.8)',
          'rgba(236, 64, 122, 0.8)'
        ],
        borderColor: [
          'rgba(67, 24, 255, 1)',
          'rgba(57, 184, 255, 1)',
          'rgba(1, 181, 116, 1)',
          'rgba(255, 181, 71, 1)',
          'rgba(236, 64, 122, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 6
      }]
    };
    
    const config = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              padding: 20,
              font: {
                family: 'Vazirmatn',
                size: 12
              }
            }
          },
          tooltip: {
            titleFont: {
              family: 'Vazirmatn'
            },
            bodyFont: {
              family: 'Vazirmatn'
            },
            backgroundColor: 'rgba(22, 24, 39, 0.8)',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            boxPadding: 5,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const sum = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value * 100) / sum) + '%';
                return `${context.label}: ${percentage}`;
              }
            }
          }
        }
      }
    };
    
    // اگر چارت قبلاً ساخته شده بود، آن را نابود کنیم
    if (window.gamesChart) {
      window.gamesChart.destroy();
    }
    
    // ساخت چارت جدید
    window.gamesChart = new Chart(chartElement, config);
  } catch (error) {
    console.error('خطا در رسم نمودار بازی‌ها:', error);
    chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
  }
}

/**
 * نمودار تراکنش‌ها
 */
function setupTransactionsChart() {
  const chartElement = document.getElementById('transactionsChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // تنظیمات برای نمودار تراکنش‌ها
    const labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    
    // داده‌های نمودار - از سرور لود می‌شود یا از داده‌های پیش‌فرض استفاده می‌کنیم
    const depositData = window.chartData && window.chartData.deposits ? window.chartData.deposits : [500, 700, 550, 800, 950, 700, 600];
    const withdrawalData = window.chartData && window.chartData.withdrawals ? window.chartData.withdrawals : [300, 450, 400, 600, 700, 500, 400];
    
    const data = {
      labels: labels,
      datasets: [
        {
          label: 'واریز',
          data: depositData,
          backgroundColor: 'rgba(1, 181, 116, 0.2)',
          borderColor: 'rgba(1, 181, 116, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(1, 181, 116, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'برداشت',
          data: withdrawalData,
          backgroundColor: 'rgba(236, 64, 122, 0.2)',
          borderColor: 'rgba(236, 64, 122, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(236, 64, 122, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
    
    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                family: 'Vazirmatn'
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            titleFont: {
              family: 'Vazirmatn'
            },
            bodyFont: {
              family: 'Vazirmatn'
            },
            backgroundColor: 'rgba(22, 24, 39, 0.8)',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            boxPadding: 5,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toLocaleString()} Ccoin`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                family: 'Vazirmatn'
              }
            }
          },
          y: {
            grid: {
              borderDash: [5, 5],
              color: 'rgba(255, 255, 255, 0.1)',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              padding: 10,
              callback: function(value) {
                return value.toLocaleString();
              },
              font: {
                family: 'Vazirmatn'
              }
            }
          }
        }
      }
    };
    
    // اگر چارت قبلاً ساخته شده بود، آن را نابود کنیم
    if (window.transactionsChart) {
      window.transactionsChart.destroy();
    }
    
    // ساخت چارت جدید
    window.transactionsChart = new Chart(chartElement, config);
  } catch (error) {
    console.error('خطا در رسم نمودار تراکنش‌ها:', error);
    chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
  }
}

/**
 * نمودار توزیع اقتصادی
 */
function setupEconomyPieChart() {
  const chartElement = document.getElementById('economyPieChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // داده‌های نمودار توزیع اقتصادی
    const data = {
      labels: ['موجودی کیف پول', 'موجودی بانک', 'در گردش (بازار)', 'سرمایه‌گذاری شده', 'لاتاری'],
      datasets: [{
        data: window.chartData && window.chartData.economy ? window.chartData.economy : [40, 30, 15, 10, 5],
        backgroundColor: [
          'rgba(67, 24, 255, 0.7)',
          'rgba(57, 184, 255, 0.7)',
          'rgba(1, 181, 116, 0.7)',
          'rgba(255, 181, 71, 0.7)',
          'rgba(236, 64, 122, 0.7)'
        ],
        borderColor: 'rgba(22, 24, 39, 0.8)',
        borderWidth: 2,
        hoverOffset: 10
      }]
    };
    
    const config = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              padding: 15,
              font: {
                family: 'Vazirmatn',
                size: 12
              }
            }
          },
          tooltip: {
            titleFont: {
              family: 'Vazirmatn'
            },
            bodyFont: {
              family: 'Vazirmatn'
            },
            backgroundColor: 'rgba(22, 24, 39, 0.8)',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            boxPadding: 5,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const sum = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value * 100) / sum) + '%';
                return `${context.label}: ${percentage}`;
              }
            }
          }
        }
      }
    };
    
    // اگر چارت قبلاً ساخته شده بود، آن را نابود کنیم
    if (window.economyPieChart) {
      window.economyPieChart.destroy();
    }
    
    // ساخت چارت جدید
    window.economyPieChart = new Chart(chartElement, config);
  } catch (error) {
    console.error('خطا در رسم نمودار توزیع اقتصادی:', error);
    chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
  }
}

/**
 * تنظیم رویدادهای صفحه کاربران
 */
function setupUserEvents() {
  // دکمه‌های مدیریت کاربر
  setupUserActionButtons();
  
  // فرم افزودن موجودی
  setupAddCoinsForm();
  
  // نمودار فعالیت کاربر
  setupUserActivityChart();
}

/**
 * تنظیم دکمه‌های عملیات کاربر
 */
function setupUserActionButtons() {
  // دکمه مسدودیت
  const banButtons = document.querySelectorAll('.ban-user-btn');
  banButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      const username = this.getAttribute('data-username');
      
      if (confirm(`آیا از مسدود کردن کاربر "${username}" اطمینان دارید؟`)) {
        // ارسال درخواست به سرور
        // این بخش به پیاده‌سازی API نیاز دارد
      }
    });
  });
  
  // دکمه رفع مسدودیت
  const unbanButtons = document.querySelectorAll('.unban-user-btn');
  unbanButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      const username = this.getAttribute('data-username');
      
      if (confirm(`آیا از رفع مسدودیت کاربر "${username}" اطمینان دارید؟`)) {
        // ارسال درخواست به سرور
        // این بخش به پیاده‌سازی API نیاز دارد
      }
    });
  });
}

/**
 * تنظیم فرم افزودن موجودی
 */
function setupAddCoinsForm() {
  const addCoinsForm = document.getElementById('add-coins-form');
  if (!addCoinsForm) return;
  
  addCoinsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userId = this.querySelector('input[name="userId"]').value;
    const amount = this.querySelector('input[name="amount"]').value;
    const reason = this.querySelector('input[name="reason"]').value;
    
    // ارسال درخواست به سرور
    // این بخش به پیاده‌سازی API نیاز دارد
    
    // نمایش پیام موفقیت
    showNotification('موجودی با موفقیت افزوده شد.', 'success');
  });
}

/**
 * تنظیم نمودار فعالیت کاربر
 */
function setupUserActivityChart() {
  const chartElement = document.getElementById('userActivityChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  // اطلاعات نمودار از API یا داده‌های سرور لود می‌شود
  // این بخش به اطلاعات واقعی نیاز دارد
}

/**
 * تنظیم رویدادهای صفحه آیتم‌ها
 */
function setupItemEvents() {
  // فرم ایجاد آیتم جدید
  const createItemForm = document.getElementById('create-item-form');
  if (createItemForm) {
    createItemForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('آیتم جدید با موفقیت ایجاد شد.', 'success');
    });
  }
  
  // دکمه‌های ویرایش آیتم
  const editItemButtons = document.querySelectorAll('.edit-item-btn');
  editItemButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = this.getAttribute('data-item-id');
      
      // لود اطلاعات آیتم و نمایش در مودال
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش مودال ویرایش
      const editModal = document.getElementById('editItemModal');
      if (editModal) {
        const bsModal = new bootstrap.Modal(editModal);
        bsModal.show();
      }
    });
  });
}

/**
 * تنظیم رویدادهای صفحه کلن‌ها
 */
function setupClanEvents() {
  // فرم مدیریت اعضای کلن
  const manageMemebersForm = document.getElementById('manage-clan-members-form');
  if (manageMemebersForm) {
    manageMemebersForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('تغییرات اعضای کلن با موفقیت ذخیره شد.', 'success');
    });
  }
}

/**
 * تنظیم رویدادهای صفحه ماموریت‌ها
 */
function setupQuestEvents() {
  // فرم ایجاد ماموریت جدید
  const createQuestForm = document.getElementById('create-quest-form');
  if (createQuestForm) {
    createQuestForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('ماموریت جدید با موفقیت ایجاد شد.', 'success');
    });
  }
}

/**
 * تنظیم رویدادهای صفحه تنظیمات
 */
function setupSettingsEvents() {
  // فرم تنظیمات عمومی
  const generalSettingsForm = document.getElementById('general-settings-form');
  if (generalSettingsForm) {
    generalSettingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('تنظیمات با موفقیت ذخیره شد.', 'success');
    });
  }
  
  // فرم تنظیمات اقتصادی
  const economySettingsForm = document.getElementById('economy-settings-form');
  if (economySettingsForm) {
    economySettingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('تنظیمات اقتصادی با موفقیت ذخیره شد.', 'success');
    });
  }
}

/**
 * نمایش پیام اعلان به سبک Vision UI Dashboard
 * @param {string} message متن پیام
 * @param {string} type نوع پیام (success, error, warning, info)
 * @param {number} duration مدت زمان نمایش به میلی‌ثانیه
 */
function showNotification(message, type = 'info', duration = 5000) {
  // حذف اعلان‌های قبلی با همان نوع
  const existingToasts = document.querySelectorAll(`.vui-toast.${type}`);
  existingToasts.forEach(toast => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 500);
  });
  
  // تنظیم عنوان اعلان بر اساس نوع
  let title = 'اطلاعات';
  let icon = 'bi-info-circle';
  
  if (type === 'success') {
    title = 'عملیات موفق';
    icon = 'bi-check-circle';
  } else if (type === 'error') {
    title = 'خطا';
    icon = 'bi-exclamation-circle';
  } else if (type === 'warning') {
    title = 'هشدار';
    icon = 'bi-exclamation-triangle';
  }
  
  // ایجاد المان اعلان
  const toast = document.createElement('div');
  toast.className = `vui-toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">
      <i class="bi ${icon}"></i>
      <strong>${title}</strong>
      <button type="button" class="btn-icon ms-auto" onclick="this.parentNode.parentNode.classList.remove('show'); setTimeout(() => this.parentNode.parentNode.remove(), 500);">
        <i class="bi bi-x"></i>
      </button>
    </div>
    <div class="toast-body">${message}</div>
  `;
  
  // اضافه کردن به صفحه
  document.body.appendChild(toast);
  
  // نمایش با انیمیشن
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // حذف اتوماتیک بعد از مدت زمان مشخص
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, duration);
  }
  
  return toast;
}

/**
 * نمایش پیام تائید به کاربر
 * @param {string} message متن پیام
 * @param {function} onConfirm تابع اجرا شونده در صورت تائید
 * @param {function} onCancel تابع اجرا شونده در صورت انصراف (اختیاری)
 */
function showConfirmDialog(message, onConfirm, onCancel = null) {
  // حذف دیالوگ‌های قبلی (اگر وجود دارد)
  const existingDialogs = document.querySelectorAll('.vui-confirm-dialog');
  existingDialogs.forEach(dialog => dialog.remove());
  
  // ایجاد دیالوگ تائید
  const dialog = document.createElement('div');
  dialog.className = 'vui-confirm-dialog';
  dialog.innerHTML = `
    <div class="dialog-content vui-card">
      <div class="dialog-header">
        <i class="bi bi-question-circle gradient-text-warning"></i>
        <h4>تائید عملیات</h4>
      </div>
      <div class="dialog-body">
        ${message}
      </div>
      <div class="dialog-footer">
        <button class="vui-btn vui-btn-info confirm-btn">تائید</button>
        <button class="vui-btn cancel-btn">انصراف</button>
      </div>
    </div>
  `;
  
  // اضافه کردن استایل دیالوگ
  const style = document.createElement('style');
  style.textContent = `
    .vui-confirm-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .vui-confirm-dialog.show {
      opacity: 1;
    }
    
    .vui-confirm-dialog .dialog-content {
      max-width: 400px;
      width: 90%;
      margin: 20px;
      padding: 0;
      overflow: hidden;
      transform: translateY(20px);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .vui-confirm-dialog.show .dialog-content {
      transform: translateY(0);
    }
    
    .vui-confirm-dialog .dialog-header {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .vui-confirm-dialog .dialog-header i {
      font-size: 24px;
    }
    
    .vui-confirm-dialog .dialog-header h4 {
      margin: 0;
    }
    
    .vui-confirm-dialog .dialog-body {
      padding: 20px;
      font-size: 16px;
      line-height: 1.6;
    }
    
    .vui-confirm-dialog .dialog-footer {
      padding: 15px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .vui-confirm-dialog .cancel-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: none;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(dialog);
  
  // نمایش با انیمیشن
  setTimeout(() => {
    dialog.classList.add('show');
  }, 10);
  
  // اضافه کردن رویدادها
  const confirmBtn = dialog.querySelector('.confirm-btn');
  const cancelBtn = dialog.querySelector('.cancel-btn');
  
  confirmBtn.addEventListener('click', () => {
    dialog.classList.remove('show');
    setTimeout(() => {
      dialog.remove();
      style.remove();
      if (typeof onConfirm === 'function') onConfirm();
    }, 300);
  });
  
  cancelBtn.addEventListener('click', () => {
    dialog.classList.remove('show');
    setTimeout(() => {
      dialog.remove();
      style.remove();
      if (typeof onCancel === 'function') onCancel();
    }, 300);
  });
  
  return dialog;
}