/**
 * فایل اصلی JavaScript برای پنل مدیریت Ccoin - نسخه سازگار
 * این فایل شامل رفع مشکلات سازگاری برای مرورگرهای قدیمی‌تر است
 */

/**
 * انیمیشن اعداد در کارت‌های آماری
 * @param {string} selector سلکتور CSS برای المان‌های عددی
 * @param {number} duration مدت زمان انیمیشن به میلی‌ثانیه
 */
function animateStatNumbers(selector, duration) {
  if (!selector) selector = '.stat-value[data-value]';
  if (!duration) duration = 1500;
  
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
  if (!selector) selector = '.progress-bar[data-value]';
  if (!duration) duration = 1200;
  
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
  if (tooltips.length > 0 && typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
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
      if (sidebar) {
        sidebar.classList.remove('show');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  }
  
  // بررسی سایز در ابتدای لود
  handleResize();
  
  // اضافه کردن ایونت ریسایز
  window.addEventListener('resize', handleResize);
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
    
    var chartData = [120, 115, 130, 125, 150, 170, 160];
    if (window.chartData && window.chartData.userActivity) {
      chartData = window.chartData.userActivity;
    }
    
    var data = {
      labels: labels,
      datasets: [{
        label: 'کاربران فعال',
        data: chartData,
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
    if (chartElement.parentNode) {
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
    var chartData = [35, 25, 20, 15, 5];
    if (window.chartData && window.chartData.games) {
      chartData = window.chartData.games;
    }
    
    var data = {
      labels: ['سکه شیر یا خط', 'سنگ کاغذ قیچی', 'حدس عدد', 'بازی تاس', 'چرخ شانس'],
      datasets: [{
        data: chartData,
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
    
    var config = {
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
    if (chartElement.parentNode) {
      chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
    }
  }
}

/**
 * نمودار تراکنش‌های انجام شده
 */
function setupTransactionsChart() {
  var chartElement = document.getElementById('transactionsChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    var depositData = [500, 700, 550, 800, 950, 700, 600];
    var withdrawalData = [300, 450, 400, 600, 700, 500, 400];
    
    if (window.chartData && window.chartData.deposits) {
      depositData = window.chartData.deposits;
    }
    
    if (window.chartData && window.chartData.withdrawals) {
      withdrawalData = window.chartData.withdrawals;
    }
    
    var data = {
      labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
      datasets: [
        {
          label: 'واریز',
          data: depositData,
          backgroundColor: 'rgba(1, 181, 116, 0.2)',
          borderColor: 'rgba(1, 181, 116, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'برداشت',
          data: withdrawalData,
          backgroundColor: 'rgba(236, 64, 122, 0.2)',
          borderColor: 'rgba(236, 64, 122, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };
    
    var config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              padding: 20,
              font: {
                family: 'Vazirmatn',
                size: 12
              },
              boxWidth: 12,
              usePointStyle: true
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
                return context.dataset.label + ': ' + context.raw.toLocaleString() + ' Ccoin';
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
              },
              callback: function(value) {
                return value.toLocaleString();
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
    if (chartElement.parentNode) {
      chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
    }
  }
}

/**
 * نمودار پای وضعیت اقتصادی
 */
function setupEconomyPieChart() {
  var chartElement = document.getElementById('economyPieChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  try {
    var chartData = [40, 30, 15, 10, 5];
    if (window.chartData && window.chartData.economy) {
      chartData = window.chartData.economy;
    }
    
    var data = {
      labels: ['کیف پول', 'بانک', 'بازی‌ها', 'آیتم‌ها', 'سایر'],
      datasets: [{
        data: chartData,
        backgroundColor: [
          'rgba(1, 181, 116, 0.8)',
          'rgba(57, 184, 255, 0.8)',
          'rgba(236, 64, 122, 0.8)',
          'rgba(255, 181, 71, 0.8)',
          'rgba(67, 24, 255, 0.8)'
        ],
        borderColor: [
          'rgba(1, 181, 116, 1)',
          'rgba(57, 184, 255, 1)',
          'rgba(236, 64, 122, 1)',
          'rgba(255, 181, 71, 1)',
          'rgba(67, 24, 255, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 6
      }]
    };
    
    var config = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
    if (window.economyPieChart) {
      window.economyPieChart.destroy();
    }
    
    // ساخت چارت جدید
    window.economyPieChart = new Chart(chartElement, config);
  } catch (error) {
    console.error('خطا در رسم نمودار اقتصادی:', error);
    if (chartElement.parentNode) {
      chartElement.parentNode.innerHTML = '<div class="alert alert-danger">خطا در بارگذاری نمودار</div>';
    }
  }
}

/**
 * تنظیم رویدادهای مربوط به کاربران
 */
function setupUserEvents() {
  // عملیات‌های مدیریت کاربر
  var banButtons = document.querySelectorAll('.ban-user-btn');
  var unbanButtons = document.querySelectorAll('.unban-user-btn');
  var resetButtons = document.querySelectorAll('.reset-user-btn');
  var addCoinsForm = document.getElementById('add-coins-form');
  
  banButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (!confirm('آیا مطمئن هستید که می‌خواهید این کاربر را مسدود کنید؟')) {
        e.preventDefault();
      }
    });
  });
  
  unbanButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (!confirm('آیا مطمئن هستید که می‌خواهید مسدودیت این کاربر را بردارید؟')) {
        e.preventDefault();
      }
    });
  });
  
  resetButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (!confirm('آیا مطمئن هستید که می‌خواهید تنظیمات این کاربر را بازنشانی کنید؟ این عملیات غیرقابل بازگشت است.')) {
        e.preventDefault();
      }
    });
  });
  
  if (addCoinsForm) {
    addCoinsForm.addEventListener('submit', function(e) {
      var amount = document.getElementById('coin-amount').value;
      var reason = document.getElementById('coin-reason').value;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        alert('لطفاً مقدار معتبری وارد کنید.');
        e.preventDefault();
        return;
      }
      
      if (!reason || reason.trim() === '') {
        alert('لطفاً دلیل افزایش موجودی را وارد کنید.');
        e.preventDefault();
      }
    });
  }
}

/**
 * تنظیم رویدادهای مربوط به آیتم‌ها
 */
function setupItemEvents() {
  var deleteItemButtons = document.querySelectorAll('.delete-item-btn');
  var itemForm = document.getElementById('item-form');
  
  deleteItemButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (!confirm('آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟')) {
        e.preventDefault();
      }
    });
  });
  
  if (itemForm) {
    itemForm.addEventListener('submit', function(e) {
      var name = document.getElementById('item-name').value;
      var price = document.getElementById('item-price').value;
      var crystalPrice = document.getElementById('item-crystal-price').value;
      
      if (!name || name.trim() === '') {
        alert('لطفاً نام آیتم را وارد کنید.');
        e.preventDefault();
        return;
      }
      
      if ((!price || isNaN(price) || price < 0) && (!crystalPrice || isNaN(crystalPrice) || crystalPrice < 0)) {
        alert('لطفاً حداقل یک قیمت معتبر (سکه یا کریستال) وارد کنید.');
        e.preventDefault();
      }
    });
  }
}

/**
 * تنظیم رویدادهای مربوط به کلن‌ها
 */
function setupClanEvents() {
  var deleteClanButtons = document.querySelectorAll('.delete-clan-btn');
  
  deleteClanButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (!confirm('آیا مطمئن هستید که می‌خواهید این کلن را حذف کنید؟ تمام داده‌های مرتبط نیز حذف خواهد شد.')) {
        e.preventDefault();
      }
    });
  });
}

/**
 * تنظیم رویدادهای مربوط به کوئست‌ها
 */
function setupQuestEvents() {
  var deleteQuestButtons = document.querySelectorAll('.delete-quest-btn');
  var questForm = document.getElementById('quest-form');
  
  deleteQuestButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (!confirm('آیا مطمئن هستید که می‌خواهید این کوئست را حذف کنید؟')) {
        e.preventDefault();
      }
    });
  });
  
  if (questForm) {
    questForm.addEventListener('submit', function(e) {
      var title = document.getElementById('quest-title').value;
      var reward = document.getElementById('quest-reward').value;
      var target = document.getElementById('quest-target').value;
      
      if (!title || title.trim() === '') {
        alert('لطفاً عنوان کوئست را وارد کنید.');
        e.preventDefault();
        return;
      }
      
      if (!reward || isNaN(reward) || reward <= 0) {
        alert('لطفاً مقدار پاداش معتبری وارد کنید.');
        e.preventDefault();
        return;
      }
      
      if (!target || isNaN(target) || target <= 0) {
        alert('لطفاً مقدار هدف معتبری وارد کنید.');
        e.preventDefault();
      }
    });
  }
}

/**
 * تنظیم رویدادهای مربوط به تنظیمات
 */
function setupSettingsEvents() {
  var settingsForm = document.getElementById('settings-form');
  var resetButton = document.getElementById('reset-settings');
  
  if (resetButton) {
    resetButton.addEventListener('click', function(e) {
      if (!confirm('آیا مطمئن هستید که می‌خواهید تنظیمات را به حالت پیش‌فرض بازنشانی کنید؟')) {
        e.preventDefault();
      }
    });
  }
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