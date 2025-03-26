/**
 * فایل اصلی JavaScript برای پنل مدیریت Ccoin
 * نسخه ساده‌سازی شده و سازگار با تمام مرورگرها
 */

/**
 * انیمیشن اعداد در کارت‌های آماری
 * @param {string} selector سلکتور CSS برای المان‌های عددی
 * @param {number} duration مدت زمان انیمیشن به میلی‌ثانیه
 */
function animateStatNumbers(selector, duration) {
  if (selector === undefined) selector = '.stat-value[data-value]';
  if (duration === undefined) duration = 1500;
  
  var elements = document.querySelectorAll(selector);
  
  elements.forEach(function(el) {
    var targetValue = parseFloat(el.getAttribute('data-value'));
    if (isNaN(targetValue)) return;
    
    var isInteger = Number.isInteger(targetValue);
    var isPercentage = el.classList.contains('percentage');
    var isCurrency = el.classList.contains('currency');
    var decimalPlaces = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
    var startValue = 0;
    
    var currentValue = startValue;
    var startTime = performance.now();
    
    function updateValue(currentTime) {
      var elapsedTime = currentTime - startTime;
      if (elapsedTime >= duration) {
        // انیمیشن به پایان رسیده
        currentValue = targetValue;
      } else {
        // محاسبه مقدار فعلی بر اساس زمان سپری شده
        var progress = elapsedTime / duration;
        // استفاده از تابع easeOutQuad برای انیمیشن نرم‌تر
        var easeProgress = 1 - (1 - progress) * (1 - progress);
        currentValue = startValue + (targetValue - startValue) * easeProgress;
      }
      
      // فرمت عدد بر اساس نوع
      var formattedValue;
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
function animateProgressBars(selector, duration) {
  if (selector === undefined) selector = '.progress-bar[data-value]';
  if (duration === undefined) duration = 1200;
  
  var progressBars = document.querySelectorAll(selector);
  
  progressBars.forEach(function(bar) {
    var targetValue = parseFloat(bar.getAttribute('data-value'));
    if (isNaN(targetValue)) return;
    
    var startValue = 0;
    var startTime = performance.now();
    
    function updateProgress(currentTime) {
      var elapsedTime = currentTime - startTime;
      if (elapsedTime >= duration) {
        // انیمیشن به پایان رسیده
        bar.style.width = targetValue + '%';
        if (bar.textContent.trim() !== '') {
          bar.textContent = targetValue + '%';
        }
      } else {
        // محاسبه مقدار فعلی بر اساس زمان سپری شده
        var progress = elapsedTime / duration;
        // استفاده از تابع easeOutQuart برای انیمیشن نرم‌تر
        var easeProgress = 1 - Math.pow(1 - progress, 4);
        var currentValue = startValue + (targetValue - startValue) * easeProgress;
        
        bar.style.width = currentValue + '%';
        if (bar.textContent.trim() !== '') {
          bar.textContent = Math.round(currentValue) + '%';
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
  setTimeout(function() {
    animateStatNumbers();
    animateProgressBars();
  }, 300);
});

/**
 * راه‌اندازی تولتیپ‌ها
 */
function initializeTooltips() {
  var tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltips.length > 0) {
    tooltips.forEach(function(tooltip) {
      new bootstrap.Tooltip(tooltip);
    });
  }
}

/**
 * مدیریت منوی کناری با استایل Vision UI
 */
function handleSidebarToggle() {
  var mobileToggle = document.getElementById('mobile-toggle');
  var sidebarCloseBtn = document.querySelector('.btn-sidebar-close');
  var sidebar = document.querySelector('.vui-sidebar');
  var contentWrapper = document.querySelector('.vui-content-wrapper');
  var overlay = document.createElement('div');
  
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
  var categoryFilters = document.querySelectorAll('.category-filter');
  categoryFilters.forEach(function(filter) {
    filter.addEventListener('change', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // دکمه‌های فیلتر وضعیت
  var statusFilters = document.querySelectorAll('.status-filter-btn');
  statusFilters.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var filterButtons = this.parentNode.querySelectorAll('.status-filter-btn');
      filterButtons.forEach(function(button) { button.classList.remove('active'); });
      this.classList.add('active');
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // جستجو
  var searchInputs = document.querySelectorAll('.search-filter');
  searchInputs.forEach(function(input) {
    input.addEventListener('keyup', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // دکمه‌های بازنشانی فیلتر
  var resetButtons = document.querySelectorAll('.reset-filters');
  resetButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      resetFilters(this.getAttribute('data-table'));
    });
  });
}

/**
 * اعمال فیلترها به جدول
 */
function applyFilters(tableId) {
  var table = document.getElementById(tableId);
  if (!table) return;

  var rows = table.querySelectorAll('tbody tr');
  var searchInput = document.querySelector('.search-filter[data-table="' + tableId + '"]');
  var categoryFilter = document.querySelector('.category-filter[data-table="' + tableId + '"]');
  var statusFilter = document.querySelector('.status-filter-btn.active[data-table="' + tableId + '"]');

  var searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  var category = categoryFilter ? categoryFilter.value : 'all';
  var status = statusFilter ? statusFilter.getAttribute('data-status') : 'all';

  rows.forEach(function(row) {
    var showRow = true;

    // اعمال فیلتر جستجو
    if (searchTerm) {
      var text = row.textContent.toLowerCase();
      showRow = text.includes(searchTerm);
    }

    // اعمال فیلتر دسته‌بندی
    if (showRow && category !== 'all') {
      var rowCategory = row.getAttribute('data-category');
      showRow = rowCategory === category;
    }

    // اعمال فیلتر وضعیت
    if (showRow && status !== 'all') {
      var rowStatus = row.getAttribute('data-status');
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
  var searchInput = document.querySelector('.search-filter[data-table="' + tableId + '"]');
  var categoryFilter = document.querySelector('.category-filter[data-table="' + tableId + '"]');
  var statusFilters = document.querySelectorAll('.status-filter-btn[data-table="' + tableId + '"]');
  var allStatusBtn = document.querySelector('.status-filter-btn[data-table="' + tableId + '"][data-status="all"]');

  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = 'all';
  
  if (statusFilters.length > 0) {
    statusFilters.forEach(function(btn) { btn.classList.remove('active'); });
    if (allStatusBtn) allStatusBtn.classList.add('active');
  }

  var table = document.getElementById(tableId);
  if (table) {
    var rows = table.querySelectorAll('tbody tr');
    rows.forEach(function(row) {
      row.style.display = '';
    });
  }

  updateFilterCounts(tableId);
}

/**
 * بروزرسانی تعداد آیتم‌های فیلتر شده
 */
function updateFilterCounts(tableId) {
  var table = document.getElementById(tableId);
  if (!table) return;

  var totalCount = table.querySelectorAll('tbody tr').length;
  var visibleCount = table.querySelectorAll('tbody tr[style=""]').length;
  var countDisplay = document.querySelector('.filter-count[data-table="' + tableId + '"]');
  
  if (countDisplay) {
    countDisplay.textContent = 'نمایش ' + visibleCount + ' از ' + totalCount;
  }
}

/**
 * راه‌اندازی DataTables برای جداول
 */
function initializeDataTables() {
  var dataTables = document.querySelectorAll('.datatable');
  if (dataTables.length > 0 && typeof $.fn.DataTable !== 'undefined') {
    dataTables.forEach(function(table) {
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
  var forms = document.querySelectorAll('.needs-validation');
  
  Array.from(forms).forEach(function(form) {
    form.addEventListener('submit', function(event) {
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
  var themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  var currentTheme = localStorage.getItem('admin-theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggle.checked = currentTheme === 'dark';
  
  themeToggle.addEventListener('change', function() {
    var theme = this.checked ? 'dark' : 'light';
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
  var chartElement = document.getElementById('userActivityChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // تنظیمات برای نمودار کاربران فعال
    var labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    
    // محاسبه عرض gradient برای canvas
    var ctx = chartElement.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(67, 24, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(67, 24, 255, 0.2)');
    
    var data = {
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
    
    var config = {
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
                return context.dataset.label + ': ' + context.raw + ' کاربر';
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
  var chartElement = document.getElementById('gamesChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // تنظیمات برای نمودار بازی‌ها
    var data = {
      labels: ['سکه شیر یا خط', 'سنگ کاغذ قیچی', 'حدس عدد', 'بازی تاس', 'چرخ شانس'],
      datasets: [{
        label: 'تعداد بازی',
        data: window.chartData && window.chartData.games ? window.chartData.games : [250, 220, 180, 150, 120],
        backgroundColor: [
          'rgba(94, 114, 228, 0.7)',
          'rgba(45, 206, 137, 0.7)',
          'rgba(251, 99, 64, 0.7)',
          'rgba(17, 205, 239, 0.7)',
          'rgba(245, 54, 92, 0.7)'
        ],
        borderColor: [
          'rgba(94, 114, 228, 1)',
          'rgba(45, 206, 137, 1)',
          'rgba(251, 99, 64, 1)',
          'rgba(17, 205, 239, 1)',
          'rgba(245, 54, 92, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    var config = {
      type: 'bar',
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
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.raw + ' بار';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
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
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                family: 'Vazirmatn'
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
 * نمودار تراکنش‌های مالی
 */
function setupTransactionsChart() {
  var chartElement = document.getElementById('transactionsChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // داده‌های تراکنش‌ها بر اساس ماه
    var months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    
    var deposits = window.chartData && window.chartData.transactions && window.chartData.transactions.deposits ? 
                  window.chartData.transactions.deposits : 
                  [15000, 18000, 22000, 25000, 28000, 30000, 35000, 38000, 42000, 45000, 50000, 52000];
                  
    var withdrawals = window.chartData && window.chartData.transactions && window.chartData.transactions.withdrawals ? 
                     window.chartData.transactions.withdrawals : 
                     [12000, 14000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000];
    
    var data = {
      labels: months,
      datasets: [
        {
          label: 'واریز',
          data: deposits,
          backgroundColor: 'rgba(45, 206, 137, 0.5)',
          borderColor: 'rgba(45, 206, 137, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(45, 206, 137, 1)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          fill: true
        },
        {
          label: 'برداشت',
          data: withdrawals,
          backgroundColor: 'rgba(245, 54, 92, 0.5)',
          borderColor: 'rgba(245, 54, 92, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(245, 54, 92, 1)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          fill: true
        }
      ]
    };
    
    var config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: 'Vazirmatn'
              },
              color: 'rgba(255, 255, 255, 0.8)'
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
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.raw.toLocaleString('fa-IR') + ' Ccoin';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
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
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              callback: function(value) {
                return value.toLocaleString('fa-IR');
              },
              font: {
                family: 'Vazirmatn'
              }
            }
          }
        },
        tension: 0.3
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
 * نمودار دایره‌ای اقتصاد
 */
function setupEconomyPieChart() {
  var chartElement = document.getElementById('economyPieChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    var data = {
      labels: ['سکه در گردش', 'سکه در بانک', 'سکه در بازی‌ها', 'سکه در آیتم‌ها', 'سکه در جوایز'],
      datasets: [{
        data: window.chartData && window.chartData.economy ? window.chartData.economy : [40, 30, 15, 10, 5],
        backgroundColor: [
          'rgba(94, 114, 228, 0.8)',
          'rgba(45, 206, 137, 0.8)',
          'rgba(251, 99, 64, 0.8)',
          'rgba(17, 205, 239, 0.8)',
          'rgba(245, 54, 92, 0.8)'
        ],
        borderColor: [
          'rgba(94, 114, 228, 1)',
          'rgba(45, 206, 137, 1)',
          'rgba(251, 99, 64, 1)',
          'rgba(17, 205, 239, 1)',
          'rgba(245, 54, 92, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    var config = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: 'Vazirmatn'
              },
              color: 'rgba(255, 255, 255, 0.8)',
              padding: 10
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
            callbacks: {
              label: function(context) {
                var label = context.label || '';
                var value = context.raw;
                var total = context.dataset.data.reduce(function(acc, item) { return acc + item; }, 0);
                var percentage = Math.round(value / total * 100);
                return label + ': ' + percentage + '%';
              }
            }
          }
        },
        cutout: '70%',
        animation: {
          animateScale: true,
          animateRotate: true
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
    console.error('خطا در رسم نمودار اقتصاد:', error);
    chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
  }
}

/**
 * پیاده‌سازی عملیات‌های مربوط به کاربران
 */
function setupUserEvents() {
  // دکمه افزایش موجودی کاربر
  var addCoinsForm = document.getElementById('add-coins-form');
  if (addCoinsForm) {
    addCoinsForm.addEventListener('submit', function(event) {
      // اعتبارسنجی پیش از ارسال
      var userId = document.getElementById('coinsUserId').value;
      var amount = document.getElementById('coinsAmount').value;
      
      if (!userId || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
        event.preventDefault();
        showAlert('لطفاً مقادیر معتبر وارد کنید.', 'danger');
      }
    });
  }
  
  // دکمه‌های مسدودسازی کاربر
  var banButtons = document.querySelectorAll('.ban-user-btn');
  if (banButtons.length > 0) {
    banButtons.forEach(function(btn) {
      btn.addEventListener('click', function(event) {
        if (!confirm('آیا از مسدودسازی این کاربر اطمینان دارید؟')) {
          event.preventDefault();
        }
      });
    });
  }
  
  // دکمه‌های رفع مسدودیت
  var unbanButtons = document.querySelectorAll('.unban-user-btn');
  if (unbanButtons.length > 0) {
    unbanButtons.forEach(function(btn) {
      btn.addEventListener('click', function(event) {
        if (!confirm('آیا از رفع مسدودیت این کاربر اطمینان دارید؟')) {
          event.preventDefault();
        }
      });
    });
  }
}

/**
 * پیاده‌سازی عملیات‌های مربوط به آیتم‌ها
 */
function setupItemEvents() {
  // فرم ایجاد آیتم جدید
  var createItemForm = document.getElementById('create-item-form');
  if (createItemForm) {
    createItemForm.addEventListener('submit', function(event) {
      // اعتبارسنجی پیش از ارسال
      var name = document.getElementById('itemName').value;
      var price = document.getElementById('itemPrice').value;
      
      if (!name || !price || isNaN(price) || parseFloat(price) < 0) {
        event.preventDefault();
        showAlert('لطفاً مقادیر معتبر وارد کنید.', 'danger');
      }
    });
  }
  
  // اضافه کردن آیتم به کاربر
  var addItemForm = document.getElementById('add-item-form');
  if (addItemForm) {
    addItemForm.addEventListener('submit', function(event) {
      // اعتبارسنجی پیش از ارسال
      var itemId = document.getElementById('itemId').value;
      
      if (!itemId) {
        event.preventDefault();
        showAlert('لطفاً یک آیتم انتخاب کنید.', 'danger');
      }
    });
  }
}

/**
 * پیاده‌سازی عملیات‌های مربوط به کلن‌ها
 */
function setupClanEvents() {
  // فرم ایجاد کلن جدید
  var createClanForm = document.getElementById('create-clan-form');
  if (createClanForm) {
    createClanForm.addEventListener('submit', function(event) {
      // اعتبارسنجی پیش از ارسال
      var name = document.getElementById('clanName').value;
      var ownerId = document.getElementById('clanOwnerId').value;
      
      if (!name || !ownerId) {
        event.preventDefault();
        showAlert('لطفاً مقادیر معتبر وارد کنید.', 'danger');
      }
    });
  }
}

/**
 * پیاده‌سازی عملیات‌های مربوط به کوئست‌ها
 */
function setupQuestEvents() {
  // فرم ایجاد کوئست جدید
  var createQuestForm = document.getElementById('create-quest-form');
  if (createQuestForm) {
    createQuestForm.addEventListener('submit', function(event) {
      // اعتبارسنجی پیش از ارسال
      var title = document.getElementById('questTitle').value;
      var description = document.getElementById('questDescription').value;
      var reward = document.getElementById('questReward').value;
      
      if (!title || !description || !reward || isNaN(reward) || parseFloat(reward) <= 0) {
        event.preventDefault();
        showAlert('لطفاً مقادیر معتبر وارد کنید.', 'danger');
      }
    });
  }
  
  // دکمه حذف کوئست
  var deleteQuestButtons = document.querySelectorAll('.delete-quest-btn');
  if (deleteQuestButtons.length > 0) {
    deleteQuestButtons.forEach(function(btn) {
      btn.addEventListener('click', function(event) {
        if (!confirm('آیا از حذف این کوئست اطمینان دارید؟')) {
          event.preventDefault();
        }
      });
    });
  }
}

/**
 * پیاده‌سازی عملیات‌های مربوط به تنظیمات
 */
function setupSettingsEvents() {
  // فرم تنظیمات اصلی
  var mainSettingsForm = document.getElementById('main-settings-form');
  if (mainSettingsForm) {
    mainSettingsForm.addEventListener('submit', function(event) {
      // اعتبارسنجی پیش از ارسال (در صورت نیاز)
    });
  }
}

/**
 * نمایش پیام هشدار
 * @param {string} message متن پیام
 * @param {string} type نوع پیام (success, danger, warning, info)
 */
function showAlert(message, type) {
  var alertContainer = document.getElementById('alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '9999';
    document.body.appendChild(alertContainer);
  }
  
  var alertBox = document.createElement('div');
  alertBox.className = 'alert alert-' + type + ' alert-dismissible fade show';
  alertBox.role = 'alert';
  
  var alertMessage = document.createElement('span');
  alertMessage.textContent = message;
  
  var closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-bs-dismiss', 'alert');
  closeButton.setAttribute('aria-label', 'بستن');
  
  alertBox.appendChild(alertMessage);
  alertBox.appendChild(closeButton);
  alertContainer.appendChild(alertBox);
  
  // حذف خودکار بعد از 5 ثانیه
  setTimeout(function() {
    alertBox.classList.remove('show');
    setTimeout(function() {
      alertContainer.removeChild(alertBox);
    }, 150);
  }, 5000);
}