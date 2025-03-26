/**
 * Vision UI Dashboard - نمودارهای سازگار با Chart.js v2.9.4
 * این فایل تمام کدهای مربوط به نمودارها را در یک فایل جمع‌آوری کرده 
 * و از تداخل بین اسکریپت‌های مختلف جلوگیری می‌کند
 */

// متغیرهای نمودارها
var userActivityChart = null;
var gamesChart = null;
var transactionsChart = null;
var economyPieChart = null;

// مقادیر پیش‌فرض نمودارها برای زمانی که داده واقعی موجود نیست
var defaultChartData = {
  userActivity: [120, 115, 130, 125, 150, 170, 160],
  games: [35, 25, 20, 15, 5],
  deposits: [500, 700, 550, 800, 950, 700, 600],
  withdrawals: [300, 450, 400, 600, 700, 500, 400],
  economy: [65, 20, 15]
};

// متغیر برای نگهداری داده‌های واقعی
window.chartData = window.chartData || {};

// راه‌اندازی تمام نمودارها
document.addEventListener('DOMContentLoaded', function() {
  // تاخیر کوتاه برای اطمینان از لود کامل DOM
  setTimeout(function() {
    initializeVisionCharts();
  }, 500);
});

/**
 * راه‌اندازی تمام نمودارهای Vision UI
 */
function initializeVisionCharts() {
  try {
    // بررسی وجود کتابخانه Chart.js
    if (typeof Chart === 'undefined') {
      console.error('کتابخانه Chart.js بارگذاری نشده است');
      return;
    }
    
    // فونت پیش‌فرض برای تمام نمودارها
    Chart.defaults.global.defaultFontFamily = 'Vazirmatn';
    
    // ساخت نمودارها
    setupUserActivityChart();
    setupGamesChart();
    setupTransactionsChart();
    setupEconomyPieChart();
    
    console.log('نمودارهای Vision UI با موفقیت راه‌اندازی شدند');
  } catch (error) {
    console.error('خطا در راه‌اندازی نمودارها:', error);
  }
}

/**
 * نمودار فعالیت کاربران
 */
function setupUserActivityChart() {
  var chartElement = document.getElementById('userActivityChart');
  if (!chartElement) return;
  
  try {
    // داده‌های نمودار: استفاده از داده واقعی یا پیش‌فرض
    var chartData = window.chartData.userActivity || defaultChartData.userActivity;
    
    // برچسب‌های محور افقی
    var labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    
    // نابودی نمودار قبلی اگر وجود داشته باشد
    if (userActivityChart instanceof Chart) {
      userActivityChart.destroy();
    }
    
    // ایجاد gradient برای پس‌زمینه نمودار
    var ctx = chartElement.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(67, 24, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(67, 24, 255, 0.2)');
    
    // تنظیمات نمودار - سازگار با نسخه 2.9.4
    var config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'کاربران فعال',
          data: chartData,
          backgroundColor: gradient,
          borderColor: 'rgba(67, 24, 255, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(67, 24, 255, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          lineTension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(22, 24, 39, 0.8)',
          titleFontColor: '#fff',
          bodyFontColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          xPadding: 10,
          yPadding: 10,
          displayColors: false,
          caretPadding: 6,
          callbacks: {
            label: function(tooltipItem, data) {
              return 'کاربران فعال: ' + tooltipItem.yLabel.toLocaleString('fa-IR');
            }
          }
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false,
              drawBorder: false
            },
            ticks: {
              fontColor: 'rgba(255, 255, 255, 0.7)'
            }
          }],
          yAxes: [{
            gridLines: {
              borderDash: [5, 5],
              color: 'rgba(255, 255, 255, 0.1)',
              drawBorder: false
            },
            ticks: {
              fontColor: 'rgba(255, 255, 255, 0.7)',
              padding: 10
            }
          }]
        }
      }
    };
    
    // ایجاد نمودار
    userActivityChart = new Chart(chartElement, config);
    
  } catch (error) {
    console.error('خطا در رسم نمودار فعالیت کاربران:', error);
    showChartError(chartElement, 'خطا در رسم نمودار فعالیت کاربران');
  }
}

/**
 * نمودار دایره‌ای بازی‌ها
 */
function setupGamesChart() {
  var chartElement = document.getElementById('gamesChart');
  if (!chartElement) return;
  
  try {
    // داده‌های نمودار
    var chartData = window.chartData.games || defaultChartData.games;
    
    // برچسب‌های نمودار
    var labels = ['سکه شیر یا خط', 'سنگ کاغذ قیچی', 'حدس عدد', 'بازی تاس', 'چرخ شانس'];
    
    // رنگ‌های نمودار به سبک Vision UI
    var backgroundColors = [
      'rgba(67, 24, 255, 0.8)',
      'rgba(57, 184, 255, 0.8)',
      'rgba(1, 181, 116, 0.8)',
      'rgba(255, 181, 71, 0.8)',
      'rgba(236, 64, 122, 0.8)'
    ];
    
    var borderColors = [
      'rgba(67, 24, 255, 1)',
      'rgba(57, 184, 255, 1)',
      'rgba(1, 181, 116, 1)',
      'rgba(255, 181, 71, 1)',
      'rgba(236, 64, 122, 1)'
    ];
    
    // نابودی نمودار قبلی اگر وجود داشته باشد
    if (gamesChart instanceof Chart) {
      gamesChart.destroy();
    }
    
    // تنظیمات نمودار - سازگار با نسخه 2.9.4
    var config = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: chartData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutoutPercentage: 70,
        legend: {
          position: 'right',
          labels: {
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 15,
            boxWidth: 12
          }
        },
        tooltips: {
          backgroundColor: 'rgba(22, 24, 39, 0.8)',
          titleFontColor: '#fff',
          bodyFontColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          xPadding: 10,
          yPadding: 10,
          displayColors: true,
          callbacks: {
            label: function(tooltipItem, data) {
              var dataset = data.datasets[tooltipItem.datasetIndex];
              var total = dataset.data.reduce(function(previousValue, currentValue) {
                return previousValue + currentValue;
              }, 0);
              var currentValue = dataset.data[tooltipItem.index];
              var percentage = Math.floor(((currentValue/total) * 100)+0.5);
              return data.labels[tooltipItem.index] + ': ' + percentage + "%";
            }
          }
        }
      }
    };
    
    // ایجاد نمودار
    gamesChart = new Chart(chartElement, config);
    
  } catch (error) {
    console.error('خطا در رسم نمودار بازی‌ها:', error);
    showChartError(chartElement, 'خطا در رسم نمودار بازی‌ها');
  }
}

/**
 * نمودار تراکنش‌های انجام شده
 */
function setupTransactionsChart() {
  var chartElement = document.getElementById('transactionsChart');
  if (!chartElement) return;
  
  try {
    // داده‌های نمودار
    var depositData = window.chartData.deposits || defaultChartData.deposits;
    var withdrawalData = window.chartData.withdrawals || defaultChartData.withdrawals;
    
    // برچسب‌های محور افقی
    var labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    
    // نابودی نمودار قبلی اگر وجود داشته باشد
    if (transactionsChart instanceof Chart) {
      transactionsChart.destroy();
    }
    
    // تنظیمات نمودار - سازگار با نسخه 2.9.4
    var config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'واریز',
            data: depositData,
            backgroundColor: 'rgba(1, 181, 116, 0.2)',
            borderColor: 'rgba(1, 181, 116, 1)',
            borderWidth: 2,
            fill: true,
            lineTension: 0.4
          },
          {
            label: 'برداشت',
            data: withdrawalData,
            backgroundColor: 'rgba(236, 64, 122, 0.2)',
            borderColor: 'rgba(236, 64, 122, 1)',
            borderWidth: 2,
            fill: true,
            lineTension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 20,
            boxWidth: 12,
            usePointStyle: true
          }
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(22, 24, 39, 0.8)',
          titleFontColor: '#fff',
          bodyFontColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          xPadding: 10,
          yPadding: 10,
          callbacks: {
            label: function(tooltipItem, data) {
              return data.datasets[tooltipItem.datasetIndex].label + ': ' + 
                     tooltipItem.yLabel.toLocaleString('fa-IR') + ' Ccoin';
            }
          }
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false,
              drawBorder: false
            },
            ticks: {
              fontColor: 'rgba(255, 255, 255, 0.7)'
            }
          }],
          yAxes: [{
            gridLines: {
              borderDash: [5, 5],
              color: 'rgba(255, 255, 255, 0.1)',
              drawBorder: false
            },
            ticks: {
              fontColor: 'rgba(255, 255, 255, 0.7)',
              padding: 10,
              callback: function(value) {
                return value.toLocaleString('fa-IR');
              }
            }
          }]
        }
      }
    };
    
    // ایجاد نمودار
    transactionsChart = new Chart(chartElement, config);
  } catch (error) {
    console.error('خطا در رسم نمودار تراکنش‌ها:', error);
    showChartError(chartElement, 'خطا در رسم نمودار تراکنش‌ها');
  }
}

/**
 * نمودار دایره‌ای اقتصاد
 */
function setupEconomyPieChart() {
  var chartElement = document.getElementById('economyPieChart');
  if (!chartElement) return;
  
  try {
    // داده‌های نمودار
    var chartData = window.chartData.economy || defaultChartData.economy;
    
    // برچسب‌های نمودار
    var labels = ['کیف پول کاربران', 'حساب بانکی کاربران', 'خزانه سیستم'];
    
    // رنگ‌های نمودار به سبک Vision UI
    var backgroundColors = [
      'rgba(1, 181, 116, 0.8)',
      'rgba(67, 24, 255, 0.8)',
      'rgba(255, 181, 71, 0.8)'
    ];
    
    var borderColors = [
      'rgba(1, 181, 116, 1)',
      'rgba(67, 24, 255, 1)',
      'rgba(255, 181, 71, 1)'
    ];
    
    // نابودی نمودار قبلی اگر وجود داشته باشد
    if (economyPieChart instanceof Chart) {
      economyPieChart.destroy();
    }
    
    // تنظیمات نمودار - سازگار با نسخه 2.9.4
    var config = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: chartData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'bottom',
          labels: {
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 15,
            boxWidth: 12
          }
        },
        tooltips: {
          backgroundColor: 'rgba(22, 24, 39, 0.8)',
          titleFontColor: '#fff',
          bodyFontColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          xPadding: 10,
          yPadding: 10,
          displayColors: true,
          callbacks: {
            label: function(tooltipItem, data) {
              var dataset = data.datasets[tooltipItem.datasetIndex];
              var total = dataset.data.reduce(function(previousValue, currentValue) {
                return previousValue + currentValue;
              }, 0);
              var currentValue = dataset.data[tooltipItem.index];
              var percentage = Math.floor(((currentValue/total) * 100)+0.5);
              return data.labels[tooltipItem.index] + ': ' + percentage + "%";
            }
          }
        }
      }
    };
    
    // ایجاد نمودار
    economyPieChart = new Chart(chartElement, config);
    
  } catch (error) {
    console.error('خطا در رسم نمودار اقتصاد:', error);
    showChartError(chartElement, 'خطا در رسم نمودار اقتصاد');
  }
}

/**
 * نمایش خطا در نمودار
 */
function showChartError(chartElement, errorMessage) {
  if (!chartElement || !chartElement.parentNode) return;
  
  var errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger text-center my-3';
  errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>' + errorMessage;
  
  chartElement.style.display = 'none';
  
  // حذف پیام خطای قبلی اگر وجود داشته باشد
  var existingErrors = chartElement.parentNode.querySelectorAll('.alert-danger');
  for (var i = 0; i < existingErrors.length; i++) {
    chartElement.parentNode.removeChild(existingErrors[i]);
  }
  
  chartElement.parentNode.appendChild(errorDiv);
}

/**
 * بروزرسانی نمودارها با داده‌های جدید
 */
function updateCharts(newData) {
  if (!newData) return;
  
  // ذخیره داده‌ها در متغیر جهانی
  Object.assign(window.chartData, newData);
  
  // بروزرسانی هر نمودار اگر موجود باشد
  if (userActivityChart && newData.userActivity) {
    userActivityChart.data.datasets[0].data = newData.userActivity;
    userActivityChart.update();
  }
  
  if (gamesChart && newData.games) {
    gamesChart.data.datasets[0].data = newData.games;
    gamesChart.update();
  }
  
  if (transactionsChart) {
    if (newData.deposits) {
      transactionsChart.data.datasets[0].data = newData.deposits;
    }
    if (newData.withdrawals) {
      transactionsChart.data.datasets[1].data = newData.withdrawals;
    }
    if (newData.deposits || newData.withdrawals) {
      transactionsChart.update();
    }
  }
  
  if (economyPieChart && newData.economy) {
    economyPieChart.data.datasets[0].data = newData.economy;
    economyPieChart.update();
  }
}

/**
 * تازه‌سازی آمارها از سرور
 */
function refreshStats() {
  // نمایش لودر
  document.querySelector('.loader-container')?.classList.remove('d-none');
  
  // ارسال درخواست AJAX
  fetch('/admin/api/dashboard-stats')
    .then(response => response.json())
    .then(data => {
      // بروزرسانی آمارها
      updateStatCards(data);
      // بروزرسانی نمودارها
      updateCharts(data.charts);
    })
    .catch(error => {
      console.error('خطا در بارگذاری آمارها:', error);
      // نمایش خطا به کاربر
      showToast('خطا در بارگذاری آمارها. لطفاً دوباره تلاش کنید.', 'error');
    })
    .finally(() => {
      // مخفی کردن لودر
      document.querySelector('.loader-container')?.classList.add('d-none');
    });
}

/**
 * بروزرسانی کارت‌های آماری با مقادیر جدید
 */
function updateStatCards(data) {
  if (!data) return;
  
  // بروزرسانی کاربران
  updateStatValue('usersCount', data.usersCount);
  updateStatMeta('newUsersCount', data.newUsersCount, true);
  updateStatProgress('usersProgress', Math.min(((data.usersCount || 0) / 1000) * 100, 100));
  
  // بروزرسانی کلن‌ها
  updateStatValue('clansCount', data.clansCount);
  updateStatMeta('newClansCount', data.newClansCount, true);
  updateStatProgress('clansProgress', Math.min(((data.clansCount || 0) / 100) * 100, 100));
  
  // بروزرسانی سی‌کوین
  updateStatValue('totalCcoin', data.totalCcoin);
  updateStatMeta('ccoinGrowth', data.ccoinGrowth, data.ccoinGrowth > 0);
  updateStatProgress('ccoinProgress', Math.min(((data.totalCcoin || 0) / 1000000) * 100, 100));
  
  // بروزرسانی کریستال
  updateStatValue('totalCrystal', data.totalCrystal);
  updateStatMeta('crystalGrowth', data.crystalGrowth, data.crystalGrowth > 0);
  updateStatProgress('crystalProgress', Math.min(((data.totalCrystal || 0) / 100000) * 100, 100));
}

/**
 * بروزرسانی مقدار یک کارت آماری
 */
function updateStatValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    // ذخیره مقدار برای انیمیشن
    element.setAttribute('data-value', value);
    // اعمال مقدار با انیمیشن
    animateStatNumber(element, value);
  }
}

/**
 * بروزرسانی متا یک کارت آماری
 */
function updateStatMeta(id, value, isPositive = true) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
    element.parentElement?.classList.remove('up', 'down');
    element.parentElement?.classList.add(isPositive ? 'up' : 'down');
    
    const iconElement = element.parentElement?.querySelector('i');
    if (iconElement) {
      iconElement.className = isPositive ? 'bi bi-arrow-up-right' : 'bi bi-arrow-down-right';
    }
  }
}

/**
 * بروزرسانی نوار پیشرفت یک کارت آماری
 */
function updateStatProgress(id, percentage) {
  const element = document.getElementById(id);
  if (element) {
    // ذخیره مقدار برای انیمیشن
    element.setAttribute('data-value', percentage);
    // اعمال مقدار با انیمیشن
    animateProgressBar(element, percentage);
  }
}

/**
 * انیمیشن تغییر عدد
 */
function animateStatNumber(element, targetValue, duration = 1000) {
  if (!element) return;
  
  const startValue = parseFloat(element.textContent.replace(/,/g, '')) || 0;
  const startTime = performance.now();
  
  function updateValue(currentTime) {
    const elapsedTime = currentTime - startTime;
    
    if (elapsedTime >= duration) {
      element.textContent = Number(targetValue).toLocaleString('fa-IR');
    } else {
      const progress = elapsedTime / duration;
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const currentValue = startValue + (targetValue - startValue) * ease;
      element.textContent = Math.round(currentValue).toLocaleString('fa-IR');
      requestAnimationFrame(updateValue);
    }
  }
  
  requestAnimationFrame(updateValue);
}

/**
 * انیمیشن نوار پیشرفت
 */
function animateProgressBar(element, targetValue, duration = 1000) {
  if (!element) return;
  
  const startValue = parseFloat(element.style.width) || 0;
  const startTime = performance.now();
  
  function updateValue(currentTime) {
    const elapsedTime = currentTime - startTime;
    
    if (elapsedTime >= duration) {
      element.style.width = targetValue + '%';
    } else {
      const progress = elapsedTime / duration;
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const currentValue = startValue + (targetValue - startValue) * ease;
      element.style.width = currentValue + '%';
      requestAnimationFrame(updateValue);
    }
  }
  
  requestAnimationFrame(updateValue);
}

/**
 * نمایش پیام به کاربر
 */
function showToast(message, type = 'info') {
  // اگر قبلاً تابع توست وجود داشته باشد از آن استفاده می‌کنیم
  if (typeof showVuiToast === 'function') {
    showVuiToast(message, type);
    return;
  }
  
  // در غیر این صورت از آلرت استفاده می‌کنیم
  alert(message);
}