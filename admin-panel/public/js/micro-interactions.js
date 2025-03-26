/**
 * Vision UI Dashboard - Micro Interactions
 * میکرو-تعاملات برای افزایش تعامل کاربر
 */

document.addEventListener('DOMContentLoaded', function() {
  initMicroInteractions();
});

/**
 * راه‌اندازی تمام میکرو-تعاملات
 */
function initMicroInteractions() {
  // افکت‌های هاور روی کارت‌ها
  setupCardHoverEffects();
  
  // افکت‌های کلیک روی دکمه‌ها
  setupButtonClickEffects();
  
  // افکت‌های معیارهای سرور
  setupServerMetricInteractions();
  
  // افکت‌های تعاملی آیکون‌ها
  setupIconInteractions();
  
  // افکت‌های تعاملی روی المان‌های مختلف
  setupMiscInteractions();
}

/**
 * افکت‌های هاور روی کارت‌ها
 */
function setupCardHoverEffects() {
  // یافتن تمام کارت‌ها
  var cards = document.querySelectorAll('.vui-card, .vui-stat-card-advanced, .card');
  
  for (var i = 0; i < cards.length; i++) {
    // باید از تابع بیرونی استفاده کنیم تا از مشکل کلوژر در حلقه جلوگیری شود
    (function(card) {
      // اضافه کردن افکت موج (Ripple) هنگام هاور
      card.addEventListener('mousemove', function(e) {
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        
        this.style.setProperty('--x', x + 'px');
        this.style.setProperty('--y', y + 'px');
      });
      
      // اضافه کردن کلاس برای هاور
      card.addEventListener('mouseenter', function() {
        this.classList.add('is-hovered');
      });
      
      card.addEventListener('mouseleave', function() {
        this.classList.remove('is-hovered');
      });
    })(cards[i]);
  }
}

/**
 * افکت‌های کلیک روی دکمه‌ها
 */
function setupButtonClickEffects() {
  // یافتن تمام دکمه‌ها
  var buttons = document.querySelectorAll('.vui-btn, .btn, button:not(.close)');
  
  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    // حذف رویداد قبلی برای جلوگیری از تکرار
    button.removeEventListener('click', createRippleEffect);
    button.addEventListener('click', createRippleEffect);
  }
}

/**
 * ایجاد افکت موج (Ripple) هنگام کلیک روی دکمه
 */
function createRippleEffect(e) {
  // بررسی وجود کلاس ripple
  if (!this.classList.contains('vui-btn') && !this.classList.contains('btn')) {
    return;
  }
  
  // حذف ریپل‌های قبلی
  var ripples = this.querySelectorAll('.ripple');
  for (var i = 0; i < ripples.length; i++) {
    var ripple = ripples[i];
    if (ripple) {
      ripple.remove();
    }
  }
  
  // ایجاد المان موج جدید
  var ripple = document.createElement('span');
  ripple.className = 'ripple';
  this.appendChild(ripple);
  
  // تنظیم موقعیت و اندازه موج
  var rect = this.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  
  ripple.style.width = size + 'px';
  ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  
  // حذف موج بعد از پایان انیمیشن
  var button = this;
  setTimeout(function() {
    if (ripple && ripple.parentNode === button) {
      ripple.remove();
    }
  }, 600);
}

/**
 * افکت‌های معیارهای سرور
 */
function setupServerMetricInteractions() {
  // یافتن تمام معیارهای سرور
  var serverMetrics = document.querySelectorAll('.status-item, .server-metric');
  
  for (var i = 0; i < serverMetrics.length; i++) {
    (function(metric) {
      // اضافه کردن تولتیپ اگر وجود ندارد
      if (metric.hasAttribute('data-metric') && !metric.hasAttribute('data-tooltip')) {
        var metricName = metric.getAttribute('data-metric');
        var tooltipText = '';
        
        switch (metricName) {
          case 'cpu':
            tooltipText = 'میزان استفاده از CPU سرور';
            break;
          case 'memory':
            tooltipText = 'میزان استفاده از حافظه سرور';
            break;
          case 'disk':
            tooltipText = 'میزان استفاده از دیسک سرور';
            break;
          case 'network':
            tooltipText = 'میزان استفاده از شبکه سرور';
            break;
          default:
            tooltipText = 'معیار ' + metricName;
        }
        
        metric.setAttribute('data-tooltip', tooltipText);
      }
      
      // ایجاد پاپ‌آپ نمودار اگر وجود ندارد
      if (!metric.querySelector('.server-metric-popup')) {
        var metricName = metric.getAttribute('data-metric') || '';
        var metricValue = metric.getAttribute('data-value') || '0';
        
        var popup = document.createElement('div');
        popup.className = 'server-metric-popup';
        popup.innerHTML = '<h6>روند ' + metricName + ' در ۲۴ ساعت گذشته</h6>' +
          '<div class="server-metric-popup-chart" id="chart-' + metricName + '"></div>';
        
        metric.appendChild(popup);
        
        // ایجاد نمودار مینی برای پاپ‌آپ (در صورت وجود Chart.js)
        setTimeout(function() {
          if (window.Chart && document.getElementById('chart-' + metricName)) {
            createMiniChart('chart-' + metricName, metricName);
          }
        }, 100);
      }
    })(serverMetrics[i]);
  }
}

/**
 * ایجاد نمودار مینی برای پاپ‌آپ معیارهای سرور
 */
function createMiniChart(chartId, metricType) {
  var ctx = document.getElementById(chartId);
  if (!ctx) return;
  
  // ایجاد داده‌های تصادفی برای نمودار (به عنوان نمونه)
  var labels = [];
  for (var i = 0; i < 24; i++) {
    labels.push(i + ':00');
  }
  
  var data = generateSampleData(metricType, 24);
  var borderColor = '#4318ff';
  
  switch (metricType) {
    case 'cpu':
      borderColor = '#4318ff';
      break;
    case 'memory':
      borderColor = '#2152ff';
      break;
    case 'disk':
      borderColor = '#01b574';
      break;
    case 'network':
      borderColor = '#fbcf33';
      break;
  }
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: metricType,
        data: data,
        borderColor: borderColor,
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      tooltips: {
        enabled: true,
        mode: 'index',
        intersect: false
      },
      scales: {
        xAxes: [{
          display: false
        }],
        yAxes: [{
          display: false,
          ticks: {
            min: 0,
            max: 100
          }
        }]
      }
    }
  });
}

/**
 * تولید داده‌های نمونه برای نمودار
 */
function generateSampleData(type, length) {
  var data = [];
  var baseline = 0;
  
  switch (type) {
    case 'cpu':
      baseline = 30;
      break;
    case 'memory':
      baseline = 50;
      break;
    case 'disk':
      baseline = 70;
      break;
    case 'network':
      baseline = 40;
      break;
    default:
      baseline = 50;
  }
  
  for (var i = 0; i < length; i++) {
    // ایجاد تغییرات تصادفی حول مقدار پایه
    var value = baseline + (Math.random() * 20 - 10);
    
    // محدود کردن مقدار بین 0 تا 100
    value = Math.max(0, Math.min(100, value));
    
    data.push(value);
  }
  
  return data;
}

/**
 * افکت‌های تعاملی آیکون‌ها
 */
function setupIconInteractions() {
  // اضافه کردن کلاس interactive-icon به آیکون‌های مختلف
  var icons = document.querySelectorAll('.bi, .icon, .action-icon, .nav-icon');
  
  for (var i = 0; i < icons.length; i++) {
    (function(icon) {
      // اضافه کردن کلاس تعاملی فقط به آیکون‌هایی که داخل دکمه نیستند
      if (!icon.closest('button') && !icon.closest('a') && !icon.closest('.btn')) {
        icon.classList.add('interactive-icon');
      }
      
      // آیکون‌های رفرش
      if (icon.classList.contains('bi-arrow-clockwise')) {
        icon.addEventListener('click', function() {
          var self = this;
          self.style.transform = 'rotate(180deg)';
          setTimeout(function() {
            self.style.transform = 'rotate(360deg)';
          }, 300);
        });
      }
    })(icons[i]);
  }
}

/**
 * افکت‌های تعاملی روی المان‌های مختلف
 */
function setupMiscInteractions() {
  // آواتارها
  setupAvatarInteractions();
  
  // فیلترهای چارت
  setupChartFilterInteractions();
  
  // جداول
  setupTableInteractions();
  
  // افزودن کلاس‌های انیمیشن آبشاری
  setupCascadeAnimations();
}

/**
 * افکت‌های تعاملی روی آواتارها
 */
function setupAvatarInteractions() {
  var avatars = document.querySelectorAll('.table-avatar, .user-avatar, .profile-avatar');
  
  for (var i = 0; i < avatars.length; i++) {
    (function(avatar) {
      avatar.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(5deg)';
      });
      
      avatar.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
      });
    })(avatars[i]);
  }
}

/**
 * افکت‌های تعاملی روی فیلترهای چارت
 */
function setupChartFilterInteractions() {
  var chartFilters = document.querySelectorAll('.vui-chart-filters button, .chart-filter');
  
  for (var i = 0; i < chartFilters.length; i++) {
    (function(filter) {
      filter.addEventListener('click', function(e) {
        // اضافه کردن افکت کلیک روی فیلتر
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        
        // ایجاد افکت موج هنگام کلیک
        if (!this.querySelector('.filter-effect')) {
          var effect = document.createElement('span');
          effect.className = 'filter-effect';
          effect.style.left = x + 'px';
          effect.style.top = y + 'px';
          this.appendChild(effect);
          
          var self = this;
          setTimeout(function() {
            effect.remove();
          }, 400);
        }
        
        // تغییر وضعیت فعال
        var siblings = Array.from(this.parentElement.children);
        for (var j = 0; j < siblings.length; j++) {
          siblings[j].classList.remove('active');
        }
        this.classList.add('active');
      });
    })(chartFilters[i]);
  }
}

/**
 * افکت‌های تعاملی روی جداول
 */
function setupTableInteractions() {
  var tableRows = document.querySelectorAll('.vui-data-table tbody tr, .table tbody tr');
  
  for (var i = 0; i < tableRows.length; i++) {
    (function(row) {
      row.addEventListener('mouseenter', function() {
        this.style.transform = 'translateX(5px)';
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      });
      
      row.addEventListener('mouseleave', function() {
        this.style.transform = 'translateX(0)';
        this.style.backgroundColor = '';
      });
    })(tableRows[i]);
  }
}

/**
 * افزودن انیمیشن‌های آبشاری به المان‌ها
 */
function setupCascadeAnimations() {
  // افزودن کلاس‌های انیمیشن به کارت‌های آمار
  var statCards = document.querySelectorAll('.vui-stat-card-advanced, .stat-card');
  for (var i = 0; i < statCards.length; i++) {
    var card = statCards[i];
    card.classList.add('fade-in');
    card.classList.add('delay-' + (i + 1));
  }
  
  // افزودن کلاس‌های انیمیشن به چارت‌ها
  var charts = document.querySelectorAll('.chart-card, .chart-container');
  for (var i = 0; i < charts.length; i++) {
    var chart = charts[i];
    chart.classList.add('slide-in-up');
    chart.classList.add('delay-' + (i + 1));
  }
  
  // افزودن کلاس‌های انیمیشن به آیتم‌های فعالیت
  var activityItems = document.querySelectorAll('.vui-activity-item, .activity-item');
  for (var i = 0; i < activityItems.length; i++) {
    var item = activityItems[i];
    item.classList.add('slide-in-right');
    item.classList.add('delay-' + (i + 1));
  }
}

/**
 * ایجاد تولتیپ سفارشی
 * @param {string} text - متن تولتیپ
 * @param {number} x - موقعیت افقی
 * @param {number} y - موقعیت عمودی
 */
function showTooltip(text, x, y) {
  // حذف تولتیپ قبلی اگر وجود دارد
  var existingTooltip = document.querySelector('.vui-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  var tooltip = document.createElement('div');
  tooltip.className = 'vui-tooltip';
  tooltip.textContent = text;
  
  document.body.appendChild(tooltip);
  
  // تنظیم موقعیت
  var tooltipRect = tooltip.getBoundingClientRect();
  
  // جلوگیری از خروج تولتیپ از صفحه
  if (x + tooltipRect.width > window.innerWidth) {
    x = window.innerWidth - tooltipRect.width - 10;
  }
  
  if (y + tooltipRect.height > window.innerHeight) {
    y = y - tooltipRect.height - 10;
  }
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  
  // نمایش تولتیپ با انیمیشن
  setTimeout(function() {
    tooltip.classList.add('show');
  }, 10);
  
  // حذف تولتیپ بعد از 2 ثانیه
  setTimeout(function() {
    tooltip.classList.remove('show');
    setTimeout(function() {
      tooltip.remove();
    }, 300);
  }, 2000);
}

// API عمومی
window.visionUiMicroInteractions = {
  createRippleEffect: createRippleEffect,
  showTooltip: showTooltip,
  attachRippleEffect: function(element) {
    if (element) {
      element.addEventListener('click', createRippleEffect);
    }
  },
  detachRippleEffect: function(element) {
    if (element) {
      element.removeEventListener('click', createRippleEffect);
    }
  }
};