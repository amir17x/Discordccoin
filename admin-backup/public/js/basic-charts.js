/**
 * تنظیمات ساده‌سازی شده برای راه‌اندازی نمودارها
 * نسخه سازگار با مرورگرهای قدیمی و Chart.js v2.9.4
 */

// نمودارهای اصلی
var userActivityChart = null;
var gamesChart = null;

// داده‌های پیش‌فرض نمودارها
var defaultChartData = {
  userActivity: [120, 115, 130, 125, 150, 170, 160],
  games: [45, 25, 15, 10, 5]
};

// راه‌اندازی نمودارها
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    try {
      initializeCharts();
    } catch(error) {
      console.error('خطا در راه‌اندازی نمودارها:', error);
    }
  }, 1000);
});

// تابع اصلی راه‌اندازی نمودارها
function initializeCharts() {
  setupUserActivityChart();
  setupGamesChart();
}

// نمودار فعالیت کاربران
function setupUserActivityChart() {
  var chartElement = document.getElementById('userActivityChart');
  if (!chartElement) return;
  
  try {
    // بررسی وجود کتابخانه Chart.js
    if (typeof Chart === 'undefined') {
      showChartError(chartElement, 'کتابخانه Chart.js بارگذاری نشده است');
      return;
    }
    
    // داده‌های نمودار
    var chartData = window.chartData || defaultChartData;
    var userData = chartData.userActivity || defaultChartData.userActivity;
    
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
          data: userData,
          backgroundColor: gradient,
          borderColor: 'rgba(67, 24, 255, 1)',
          borderWidth: 2,
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
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFontFamily: 'Vazirmatn',
          bodyFontFamily: 'Vazirmatn'
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            },
            ticks: {
              fontColor: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'Vazirmatn'
            }
          }],
          yAxes: [{
            gridLines: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              fontColor: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'Vazirmatn'
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

// نمودار دایره‌ای بازی‌ها
function setupGamesChart() {
  var chartElement = document.getElementById('gamesChart');
  if (!chartElement) return;
  
  try {
    // بررسی وجود کتابخانه Chart.js
    if (typeof Chart === 'undefined') {
      showChartError(chartElement, 'کتابخانه Chart.js بارگذاری نشده است');
      return;
    }
    
    // داده‌های نمودار
    var chartData = window.chartData || defaultChartData;
    var gamesData = chartData.games || defaultChartData.games;
    
    // برچسب‌های نمودار
    var labels = ['سکه شیر یا خط', 'سنگ کاغذ قیچی', 'حدس عدد', 'بازی تاس', 'چرخ شانس'];
    
    // رنگ‌های نمودار
    var backgroundColors = [
      'rgba(255, 205, 86, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)'
    ];
    
    var borderColors = [
      'rgb(255, 205, 86)',
      'rgb(54, 162, 235)',
      'rgb(255, 99, 132)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)'
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
          data: gamesData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutoutPercentage: 70,
        legend: {
          position: 'right',
          labels: {
            fontFamily: 'Vazirmatn',
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 15,
            usePointStyle: true
          }
        },
        tooltips: {
          titleFontFamily: 'Vazirmatn',
          bodyFontFamily: 'Vazirmatn',
          backgroundColor: 'rgba(22, 24, 39, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
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

// نمایش خطا در نمودار
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

// بروزرسانی نمودارها با داده‌های جدید
function updateCharts(newData) {
  if (!newData) return;
  
  window.chartData = newData;
  
  if (userActivityChart && newData.userActivity) {
    userActivityChart.data.datasets[0].data = newData.userActivity;
    userActivityChart.update();
  }
  
  if (gamesChart && newData.games) {
    gamesChart.data.datasets[0].data = newData.games;
    gamesChart.update();
  }
}