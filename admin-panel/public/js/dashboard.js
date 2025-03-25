/**
 * اسکریپت داشبورد پنل مدیریت Ccoin
 * نسخه 1.0
 */

document.addEventListener('DOMContentLoaded', function() {
  // ایجاد نمودارها
  initCharts();
  
  // تنظیم نوار پیشرفت
  initProgressBars();
  
  // تنظیم گراف‌های آماری
  initStatWidgets();
  
  // تنظیم کانتر اعداد
  initCounters();
});

/**
 * راه‌اندازی نمودارها
 */
function initCharts() {
  // نمودار کاربران فعال
  const activeUsersCtx = document.getElementById('activeUsersChart');
  if (activeUsersCtx) {
    const activeUsersData = JSON.parse(activeUsersCtx.getAttribute('data-stats') || '[]');
    
    // ایجاد آرایه‌های لیبل و داده
    const labels = activeUsersData.map(item => item.date);
    const data = activeUsersData.map(item => item.count);
    
    new Chart(activeUsersCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'کاربران فعال',
          data: data,
          backgroundColor: 'rgba(67, 97, 238, 0.2)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(67, 97, 238, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                family: 'Vazirmatn'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Vazirmatn'
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleFont: {
              family: 'Vazirmatn'
            },
            bodyFont: {
              family: 'Vazirmatn'
            },
            rtl: true,
            padding: 10,
            displayColors: false
          }
        }
      }
    });
  }
  
  // نمودار بازی‌ها
  const gamesChartCtx = document.getElementById('gamesChart');
  if (gamesChartCtx) {
    const gamesData = JSON.parse(gamesChartCtx.getAttribute('data-stats') || '{}');
    
    // ایجاد آرایه‌های لیبل و داده
    const labels = Object.keys(gamesData).map(key => {
      switch(key) {
        case 'coinflip': return 'پرتاب سکه';
        case 'rps': return 'سنگ کاغذ قیچی';
        case 'numberguess': return 'حدس عدد';
        case 'dice': return 'تاس';
        case 'other': return 'سایر';
        default: return key;
      }
    });
    
    const data = Object.values(gamesData);
    const colors = [
      'rgba(67, 97, 238, 0.8)',
      'rgba(76, 175, 80, 0.8)',
      'rgba(255, 152, 0, 0.8)',
      'rgba(33, 150, 243, 0.8)',
      'rgba(156, 39, 176, 0.8)'
    ];
    
    new Chart(gamesChartCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            rtl: true,
            labels: {
              font: {
                family: 'Vazirmatn'
              },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleFont: {
              family: 'Vazirmatn'
            },
            bodyFont: {
              family: 'Vazirmatn'
            },
            rtl: true,
            padding: 10
          }
        }
      }
    });
  }
}

/**
 * راه‌اندازی نوارهای پیشرفت
 */
function initProgressBars() {
  const progressBars = document.querySelectorAll('.progress-bar');
  
  progressBars.forEach(function(bar) {
    const target = parseFloat(bar.getAttribute('data-target') || '0');
    const current = parseFloat(bar.getAttribute('data-current') || '0');
    
    // محاسبه درصد
    let percent = 0;
    if (target > 0) {
      percent = Math.min(100, (current / target) * 100);
    }
    
    // انیمیشن پیشرفت نوار
    let currentWidth = 0;
    const duration = 1500;
    const interval = 10;
    const step = percent / (duration / interval);
    
    const animation = setInterval(function() {
      currentWidth += step;
      bar.style.width = currentWidth + '%';
      
      if (currentWidth >= percent) {
        clearInterval(animation);
        bar.style.width = percent + '%';
      }
    }, interval);
  });
}

/**
 * راه‌اندازی ویجت‌های آماری
 */
function initStatWidgets() {
  // ویجت‌های اعداد متغیر
  const counterElements = document.querySelectorAll('.stat-counter');
  
  counterElements.forEach(function(element) {
    const targetValue = parseInt(element.getAttribute('data-value') || '0');
    let currentValue = 0;
    const duration = 2000;
    const framesPerSecond = 60;
    const totalFrames = duration / 1000 * framesPerSecond;
    const step = targetValue / totalFrames;
    
    const animation = setInterval(function() {
      currentValue += step;
      element.textContent = Math.floor(currentValue).toLocaleString('fa-IR');
      
      if (currentValue >= targetValue) {
        clearInterval(animation);
        element.textContent = targetValue.toLocaleString('fa-IR');
      }
    }, 1000 / framesPerSecond);
  });
}

/**
 * راه‌اندازی کانترها
 */
function initCounters() {
  const countElements = document.querySelectorAll('[data-count]');
  
  countElements.forEach(function(element) {
    const target = parseInt(element.getAttribute('data-count') || '0');
    let current = 0;
    const step = Math.ceil(target / 30);
    
    const interval = setInterval(function() {
      current += step;
      element.textContent = formatNumber(current);
      
      if (current >= target) {
        clearInterval(interval);
        element.textContent = formatNumber(target);
      }
    }, 50);
  });
}

/**
 * فرمت‌کننده اعداد با جداکننده هزارگان فارسی
 */
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/[0-9]/g, function(d) {
    return String.fromCharCode(d.charCodeAt(0) + 1728);
  });
}