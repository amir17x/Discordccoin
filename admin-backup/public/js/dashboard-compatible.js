/**
 * فایل اصلی JavaScript برای پنل مدیریت Ccoin
 * نسخه سازگار شده برای تمام مرورگرها
 */

/**
 * انیمیشن اعداد در کارت‌های آماری
 * @param {string} selector سلکتور CSS برای المان‌های عددی
 * @param {number} duration مدت زمان انیمیشن به میلی‌ثانیه
 */
function animateStatNumbers(selector, duration) {
  selector = selector || '.stat-value[data-value]';
  duration = duration || 1500;
  
  var elements = document.querySelectorAll(selector);
  
  for (var j = 0; j < elements.length; j++) {
    (function(el) {
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
    })(elements[j]);
  }
}

/**
 * انیمیشن پیشرفت در نوارهای پیشرفت
 * @param {string} selector سلکتور CSS برای نوارهای پیشرفت
 * @param {number} duration مدت زمان انیمیشن به میلی‌ثانیه
 */
function animateProgressBars(selector, duration) {
  selector = selector || '.progress-bar[data-value]';
  duration = duration || 1200;
  
  var progressBars = document.querySelectorAll(selector);
  
  for (var j = 0; j < progressBars.length; j++) {
    (function(bar) {
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
    })(progressBars[j]);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  try {
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
  } catch (error) {
    console.error('خطا در اجرای اسکریپت داشبورد:', error);
  }
});

/**
 * راه‌اندازی تولتیپ‌ها
 */
function initializeTooltips() {
  var tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltips.length > 0) {
    for (var i = 0; i < tooltips.length; i++) {
      new bootstrap.Tooltip(tooltips[i]);
    }
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
      if (sidebar) {
        sidebar.classList.remove('show');
      }
      if (overlay) {
        overlay.classList.remove('active');
      }
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
  for (var i = 0; i < categoryFilters.length; i++) {
    categoryFilters[i].addEventListener('change', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  }

  // دکمه‌های فیلتر وضعیت
  var statusFilters = document.querySelectorAll('.status-filter-btn');
  for (var i = 0; i < statusFilters.length; i++) {
    statusFilters[i].addEventListener('click', function() {
      var filterButtons = this.parentNode.querySelectorAll('.status-filter-btn');
      for (var j = 0; j < filterButtons.length; j++) {
        filterButtons[j].classList.remove('active');
      }
      this.classList.add('active');
      applyFilters(this.getAttribute('data-table'));
    });
  }

  // جستجو
  var searchInputs = document.querySelectorAll('.search-filter');
  for (var i = 0; i < searchInputs.length; i++) {
    searchInputs[i].addEventListener('keyup', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  }

  // دکمه‌های بازنشانی فیلتر
  var resetButtons = document.querySelectorAll('.reset-filters');
  for (var i = 0; i < resetButtons.length; i++) {
    resetButtons[i].addEventListener('click', function() {
      resetFilters(this.getAttribute('data-table'));
    });
  }
}

/**
 * راه‌اندازی نمودارهای داشبورد
 */
function setupDashboardCharts() {
  try {
    setupUserActivityChart();
    setupGamesChart();
    setupTransactionsChart();
    setupEconomyPieChart();
  } catch (error) {
    console.error('خطا در راه‌اندازی نمودارها:', error);
  }
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
    
    var userData = window.chartData && window.chartData.userActivity ? 
                   window.chartData.userActivity : 
                   [120, 115, 130, 125, 150, 170, 160];
    
    var data = {
      labels: labels,
      datasets: [{
        label: 'کاربران فعال',
        data: userData,
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
    if (chartElement && chartElement.parentNode) {
      chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
    }
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
    var gameLabels = ['سکه شیر یا خط', 'سنگ کاغذ قیچی', 'حدس عدد', 'بازی تاس', 'چرخ شانس'];
    var gameData = window.chartData && window.chartData.games ? 
                   window.chartData.games : 
                   [45, 25, 15, 10, 5];
    
    var data = {
      labels: gameLabels,
      datasets: [{
        data: gameData,
        backgroundColor: [
          'rgba(255, 205, 86, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgb(255, 205, 86)',
          'rgb(54, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1,
        hoverOffset: 6
      }]
    };
    
    var config = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: 'Vazirmatn',
                size: 12
              },
              color: 'rgba(255, 255, 255, 0.7)',
              padding: 15,
              usePointStyle: true
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
                var value = context.raw;
                var sum = 0;
                for (var i = 0; i < context.dataset.data.length; i++) {
                  sum += context.dataset.data[i];
                }
                var percentage = Math.round((value * 100) / sum) + '%';
                return context.label + ': ' + percentage;
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
    if (chartElement && chartElement.parentNode) {
      chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
    }
  }
}

/**
 * نمودار تراکنش‌های مالی
 */
function setupTransactionsChart() {
  var chartElement = document.getElementById('transactionsChart');
  if (!chartElement || typeof Chart === 'undefined') return;

  try {
    // ...محتوای این تابع پیاده‌سازی خواهد شد
  } catch (error) {
    console.error('خطا در رسم نمودار تراکنش‌ها:', error);
    if (chartElement && chartElement.parentNode) {
      chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
    }
  }
}

/**
 * نمودار دایره‌ای وضعیت اقتصادی
 */
function setupEconomyPieChart() {
  var chartElement = document.getElementById('economyPieChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    // ...محتوای این تابع پیاده‌سازی خواهد شد
  } catch (error) {
    console.error('خطا در رسم نمودار وضعیت اقتصادی:', error);
    if (chartElement && chartElement.parentNode) {
      chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
    }
  }
}

/**
 * تنظیم رویدادهای مربوط به کاربران
 */
function setupUserEvents() {
  // پیاده‌سازی در صورت نیاز
}

/**
 * تنظیم رویدادهای مربوط به آیتم‌ها
 */
function setupItemEvents() {
  // پیاده‌سازی در صورت نیاز
}

/**
 * تنظیم رویدادهای مربوط به کلن‌ها
 */
function setupClanEvents() {
  // پیاده‌سازی در صورت نیاز
}

/**
 * تنظیم رویدادهای مربوط به کوئست‌ها
 */
function setupQuestEvents() {
  // پیاده‌سازی در صورت نیاز
}

/**
 * تنظیم رویدادهای مربوط به تنظیمات
 */
function setupSettingsEvents() {
  // پیاده‌سازی در صورت نیاز
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

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
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
  }

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
    for (var i = 0; i < statusFilters.length; i++) {
      statusFilters[i].classList.remove('active');
    }
    if (allStatusBtn) allStatusBtn.classList.add('active');
  }

  var table = document.getElementById(tableId);
  if (table) {
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) {
      rows[i].style.display = '';
    }
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
  var visibleCount = 0;
  var rows = table.querySelectorAll('tbody tr');
  
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].style.display !== 'none') {
      visibleCount++;
    }
  }
  
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
  if (dataTables.length > 0 && typeof $.fn !== 'undefined' && typeof $.fn.DataTable !== 'undefined') {
    for (var i = 0; i < dataTables.length; i++) {
      try {
        $(dataTables[i]).DataTable({
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
      } catch (error) {
        console.error('خطا در راه‌اندازی DataTable:', error);
      }
    }
  }
}

/**
 * بررسی اعتبارسنجی فرم‌ها
 */
function handleFormValidation() {
  var forms = document.querySelectorAll('.needs-validation');
  
  for (var i = 0; i < forms.length; i++) {
    (function(form) {
      form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        form.classList.add('was-validated');
      }, false);
    })(forms[i]);
  }
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

// اضافه کردن توابع کمکی دیگر در صورت نیاز به اینجا...

/**
 * بروزرسانی آمار داشبورد
 */
function refreshStats() {
  try {
    // نمایش لودر
    document.querySelector('.loader-container').classList.remove('d-none');
    
    // درخواست به سرور برای دریافت آمار جدید
    fetch('/admin/api/stats')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        // بروزرسانی مقادیر در داشبورد
        var statElements = document.querySelectorAll('.stat-value');
        for (var i = 0; i < statElements.length; i++) {
          var key = statElements[i].dataset.key;
          if (key && data[key]) {
            statElements[i].textContent = data[key];
            statElements[i].dataset.value = data[key];
          }
        }
        
        // فراخوانی تابع انیمیشن اعداد
        animateStatNumbers();
        
        // بروزرسانی چارت‌ها
        if (data.chartData) {
          window.chartData = data.chartData;
          setupDashboardCharts();
        }
        
        // نمایش پیام موفقیت
        showToast('موفقیت', 'آمار با موفقیت بروزرسانی شد', 'success');
      })
      .catch(function(error) {
        console.error('خطا در بروزرسانی آمار:', error);
        showToast('خطا', 'مشکلی در بروزرسانی آمار رخ داد', 'error');
      })
      .finally(function() {
        // مخفی کردن لودر
        document.querySelector('.loader-container').classList.add('d-none');
      });
  } catch (error) {
    console.error('خطا در اجرای تابع refreshStats:', error);
    document.querySelector('.loader-container').classList.add('d-none');
  }
}

/**
 * نمایش پیام toast
 */
function showToast(title, message, type) {
  var toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  var toast = document.createElement('div');
  toast.className = 'toast show vui-toast vui-toast-' + (type || 'info');
  toast.innerHTML = 
    '<div class="toast-header">' +
      '<strong class="me-auto">' + title + '</strong>' +
      '<button type="button" class="btn-close" onclick="this.parentNode.parentNode.remove()"></button>' +
    '</div>' +
    '<div class="toast-body">' +
      message +
    '</div>';
  
  toastContainer.appendChild(toast);
  
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 500);
  }, 5000);
}