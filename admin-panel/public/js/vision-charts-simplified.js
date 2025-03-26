/**
 * Vision UI Dashboard - Charts (Simplified version)
 * نمودارهای پیشرفته و زیبا مطابق با طراحی Vision UI
 */

document.addEventListener('DOMContentLoaded', function() {
  // تنظیم گزینه‌های پیش‌فرض Chart.js
  initChartDefaults();
  
  // راه‌اندازی نمودارها
  initializeCharts();
  
  // راه‌اندازی رویدادهای فیلتر
  initChartFilters();
});

/**
 * تنظیم گزینه‌های پیش‌فرض برای تمام نمودارها
 */
function initChartDefaults() {
  // بررسی وجود Chart.js
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded');
    return;
  }
  
  // تنظیم پالت رنگ‌های پیش‌فرض
  const primaryGradient = createGradientConfig('primary');
  const infoGradient = createGradientConfig('info');
  const successGradient = createGradientConfig('success');
  const warningGradient = createGradientConfig('warning');
  const dangerGradient = createGradientConfig('danger');
  
  // تنظیم فونت‌ها و رنگ‌ها
  Chart.defaults.font.family = 'Vazirmatn, Tahoma, sans-serif';
  Chart.defaults.font.size = 11;
  Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';
  
  // تنظیم سایه برای متن‌ها
  Chart.defaults.plugins.tooltip.titleFont = { weight: 'normal', size: 12 };
  Chart.defaults.plugins.tooltip.bodyFont = { weight: 'normal', size: 11 };
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 8;
  Chart.defaults.plugins.tooltip.position = 'nearest';
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.enabled = true;
  Chart.defaults.plugins.tooltip.mode = 'index';
  Chart.defaults.plugins.tooltip.intersect = false;
  Chart.defaults.plugins.tooltip.rtl = true;
  
  // تنظیم عنوان‌ها
  Chart.defaults.plugins.title.font = { weight: 'normal', size: 14 };
  Chart.defaults.plugins.title.color = 'rgba(255, 255, 255, 0.9)';
  Chart.defaults.plugins.title.align = 'start';
  Chart.defaults.plugins.title.padding = { top: 0, bottom: 20 };
  
  // تنظیم محورها
  Chart.defaults.scales.linear.grid = { 
    color: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    tickColor: 'rgba(255, 255, 255, 0.1)'
  };
  
  Chart.defaults.scales.category.grid = { 
    display: false
  };
  
  // تنظیم لجندها
  Chart.defaults.plugins.legend.position = 'bottom';
  Chart.defaults.plugins.legend.align = 'start';
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.padding = 15;
  Chart.defaults.plugins.legend.title.display = false;
  Chart.defaults.plugins.legend.rtl = true;
  
  // ایجاد وضعیت پیش‌فرض برای انیمیشن
  Chart.defaults.animation = {
    duration: 1500,
    easing: 'easeOutQuart',
    delay: function(context) {
      return context.dataIndex * 50 + context.datasetIndex * 100;
    }
  };
  
  // تنظیم استایل برای دستگاه‌های موبایل
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.responsive = true;
  
  // تنظیم موقعیت دقیق‌تر تولتیپ‌ها
  const tooltipHandler = Chart.Tooltip.prototype.handleEvent;
  Chart.Tooltip.prototype.handleEvent = function(e) {
    const result = tooltipHandler.call(this, e);
    const position = this.chart.canvas.getBoundingClientRect();
    
    if (e.type === 'mousemove') {
      this._active = this._chart.getElementsAtEventForMode(e, 'nearest', {
        intersect: false
      }, false);
      
      this._lastEvent = e;
    }
    
    return result;
  };
  
  // پلاگین سفارشی برای نمایش متن وسط نمودارهای دایره‌ای
  Chart.register({
    id: 'centerTextPlugin',
    beforeDraw: function(chart) {
      if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
        if (chart.config.options.elements && chart.config.options.elements.center) {
          const centerConfig = chart.config.options.elements.center;
          
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          
          ctx.save();
          
          if (centerConfig.image) {
            const img = new Image();
            img.src = centerConfig.image;
            
            const x = (chartArea.left + chartArea.right) / 2;
            const y = (chartArea.top + chartArea.bottom) / 2;
            const radius = centerConfig.radius || 30;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(
              img, 
              x - radius, 
              y - radius, 
              radius * 2, 
              radius * 2
            );
          }
          
          if (centerConfig.text) {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            
            // تنظیم استایل متن
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            
            // اگر چند خط متن وجود داشته باشد
            const textLines = centerConfig.text.split('\n');
            
            for (let i = 0; i < textLines.length; i++) {
              ctx.font = centerConfig.fontStyle || 'normal 16px Vazirmatn';
              ctx.fillStyle = centerConfig.fontColor || '#fff';
              
              const lineHeight = centerConfig.lineHeight || 25;
              const offset = (textLines.length - 1) * lineHeight / 2;
              
              ctx.fillText(
                textLines[i], 
                centerX, 
                centerY - offset + (i * lineHeight)
              );
            }
          }
          
          ctx.restore();
        }
      }
    }
  });
  
  // پلاگین سفارشی برای نمایش گرادینت در نمودارها
  Chart.register({
    id: 'chartGradientPlugin',
    beforeRender: function(chart) {
      const ctx = chart.ctx;
      
      if (chart.config.type === 'line' || chart.config.type === 'bar' || chart.config.type === 'radar') {
        const datasets = chart.config.data.datasets;
        const chartArea = chart.chartArea;
        
        for (let i = 0; i < datasets.length; i++) {
          const dataset = datasets[i];
          
          if (dataset.gradient) {
            const gradientType = dataset.gradient.type || 'linear';
            let gradient;
            
            if (gradientType === 'linear') {
              // گرادینت خطی
              gradient = ctx.createLinearGradient(
                chartArea.left, chartArea.bottom,
                chartArea.left, chartArea.top
              );
            } else if (gradientType === 'radial') {
              // گرادینت شعاعی
              const centerX = (chartArea.left + chartArea.right) / 2;
              const centerY = (chartArea.top + chartArea.bottom) / 2;
              const radius = Math.max(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
              
              gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
              );
            }
            
            // اضافه کردن توقف‌های رنگی به گرادینت
            if (gradient) {
              dataset.gradient.stops.forEach(function(stop) {
                gradient.addColorStop(stop.offset, stop.color);
              });
              
              if (dataset.backgroundColor) {
                dataset.backgroundColor = gradient;
              }
              
              if (dataset.borderColor && !dataset.gradient.bordersOnly) {
                dataset.borderColor = gradient;
              }
            }
          }
        }
      }
    }
  });
}

/**
 * ایجاد پیکربندی گرادینت برای رنگ‌های مختلف
 * @param {string} colorType - نوع رنگ (primary, info, success, warning, danger)
 * @param {boolean} isBgOnly - آیا فقط برای پس زمینه استفاده می‌شود
 * @return {object} پیکربندی گرادینت
 */
function createGradientConfig(colorType, isBgOnly) {
  if (isBgOnly === undefined) isBgOnly = false;
  
  return {
    gradient: {
      type: 'linear',
      bordersOnly: isBgOnly,
      stops: [
        { offset: 0, color: 'var(--chart-' + colorType + '-gradient-start)' },
        { offset: 1, color: 'var(--chart-' + colorType + '-gradient-stop)' }
      ]
    },
    backgroundColor: 'var(--chart-' + colorType + '-color)',
    borderColor: 'var(--chart-' + colorType + '-color)'
  };
}

/**
 * راه‌اندازی همه نمودارها
 */
function initializeCharts() {
  // نمودارهای درآمد
  initRevenueCharts();
  
  // نمودارهای کاربران
  initUserCharts();
  
  // نمودارهای آیتم
  initItemCharts();
  
  // نمودارهای بازی
  initGameCharts();
  
  // نمودارهای اقتصادی
  initEconomyCharts();
  
  // نمودارهای صفحات دیگر
  initClanCharts();
  initQuizCharts();
  initQuestCharts();
  
  // رفرش‌کردن نمودارها هر 60 ثانیه
  setInterval(refreshCharts, 60000);
}

/**
 * راه‌اندازی رویدادهای فیلتر نمودارها
 */
function initChartFilters() {
  // دکمه‌های فیلتر نمودارها
  const filterButtons = document.querySelectorAll('.vui-chart-filters button');
  
  filterButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const chartId = this.closest('.vui-chart-card').dataset.chartId;
      const filter = this.dataset.filter;
      const chart = getChartById(chartId);
      
      if (!chart) return;
      
      // حذف کلاس active از همه دکمه‌ها
      this.parentNode.querySelectorAll('button').forEach(function(btn) {
        btn.classList.remove('active');
      });
      
      // اضافه کردن کلاس active به دکمه انتخاب شده
      this.classList.add('active');
      
      // اعمال فیلتر
      applyChartFilter(chart, filter);
    });
  });
}

/**
 * دریافت نمودار با شناسه
 * @param {string} chartId - شناسه نمودار
 * @return {Chart|null} آبجکت نمودار یا null
 */
function getChartById(chartId) {
  return Chart.getChart(chartId);
}

/**
 * اعمال فیلتر به نمودار
 * @param {Chart} chart - آبجکت نمودار
 * @param {string} filter - فیلتر (today, week, month, year)
 */
function applyChartFilter(chart, filter) {
  // نمایش لودر
  const chartContainer = chart.canvas.parentNode;
  if (chartContainer) {
    const loader = document.createElement('div');
    loader.className = 'chart-loader';
    chartContainer.appendChild(loader);
  }
  
  // شبیه‌سازی دریافت داده با تاخیر
  setTimeout(function() {
    // حذف لودر
    if (chartContainer) {
      const loader = chartContainer.querySelector('.chart-loader');
      if (loader) loader.remove();
    }
    
    // بروزرسانی داده‌ها بر اساس فیلتر
    switch(filter) {
      case 'today':
        updateChartDataForToday(chart);
        break;
      case 'week':
        updateChartDataForWeek(chart);
        break;
      case 'month':
        updateChartDataForMonth(chart);
        break;
      case 'year':
        updateChartDataForYear(chart);
        break;
      case 'all':
        updateChartDataForAll(chart);
        break;
    }
    
    // بروزرسانی نمودار
    chart.update();
  }, 500);
}

/**
 * بروزرسانی داده‌های نمودار برای امروز
 * @param {Chart} chart - آبجکت نمودار
 */
function updateChartDataForToday(chart) {
  // بسته به نوع نمودار، داده‌های مختلفی را برگشت می‌دهیم
  const chartId = chart.canvas.id;
  
  // اینجا می‌توانید داده‌های واقعی را از سرور دریافت کنید
  // فعلاً داده‌های تستی برمی‌گردانیم
  
  // بررسی اینکه کدام نمودار است و داده‌های مناسب را به‌روزرسانی کنیم
  if (chartId === 'revenueChart') {
    chart.data.labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    chart.data.datasets[0].data = [12, 19, 13, 25, 32, 28, 34, 42];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    chart.data.datasets[0].data = [55, 67, 73, 82, 95, 102, 89, 76];
  }
  
  // و سایر نمودارها...
}

/**
 * بروزرسانی داده‌های نمودار برای هفته جاری
 * @param {Chart} chart - آبجکت نمودار
 */
function updateChartDataForWeek(chart) {
  const chartId = chart.canvas.id;
  
  if (chartId === 'revenueChart') {
    chart.data.labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    chart.data.datasets[0].data = [82, 96, 114, 125, 138, 157, 178];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    chart.data.datasets[0].data = [312, 287, 342, 298, 387, 425, 392];
  }
  
  // و سایر نمودارها...
}

/**
 * بروزرسانی داده‌های نمودار برای ماه جاری
 * @param {Chart} chart - آبجکت نمودار
 */
function updateChartDataForMonth(chart) {
  const chartId = chart.canvas.id;
  const days = [];
  for (let i = 1; i <= 30; i++) {
    days.push(i.toString());
  }
  
  if (chartId === 'revenueChart') {
    chart.data.labels = days;
    chart.data.datasets[0].data = [];
    for (let i = 0; i < 30; i++) {
      chart.data.datasets[0].data.push(Math.floor(Math.random() * 500 + 1000));
    }
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = days;
    chart.data.datasets[0].data = [];
    for (let i = 0; i < 30; i++) {
      chart.data.datasets[0].data.push(Math.floor(Math.random() * 200 + 300));
    }
  }
  
  // و سایر نمودارها...
}

/**
 * بروزرسانی داده‌های نمودار برای سال جاری
 * @param {Chart} chart - آبجکت نمودار
 */
function updateChartDataForYear(chart) {
  const chartId = chart.canvas.id;
  const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  
  if (chartId === 'revenueChart') {
    chart.data.labels = months;
    chart.data.datasets[0].data = [2500, 3200, 2800, 3800, 4200, 3900, 4600, 5100, 4800, 5500, 6200, 5800];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = months;
    chart.data.datasets[0].data = [850, 920, 980, 1050, 1120, 1180, 1250, 1320, 1380, 1450, 1520, 1600];
  }
  
  // و سایر نمودارها...
}

/**
 * بروزرسانی داده‌های نمودار برای همه زمان‌ها
 * @param {Chart} chart - آبجکت نمودار
 */
function updateChartDataForAll(chart) {
  const chartId = chart.canvas.id;
  const years = ['1399', '1400', '1401', '1402', '1403'];
  
  if (chartId === 'revenueChart') {
    chart.data.labels = years;
    chart.data.datasets[0].data = [35000, 48000, 62000, 78000, 95000];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = years;
    chart.data.datasets[0].data = [5400, 7800, 9300, 12600, 15200];
  }
  
  // و سایر نمودارها...
}

/**
 * به‌روزرسانی دوره‌ای نمودارها
 */
function refreshCharts() {
  // دریافت همه نمودارهای فعال
  const activeCharts = Chart.instances;
  
  if (activeCharts.length > 0) {
    activeCharts.forEach(function(chart) {
      // یافتن دکمه فعال
      const chartElement = chart.canvas.parentNode;
      const chartCard = chartElement.closest('.vui-chart-card');
      
      if (chartCard) {
        const activeFilterButton = chartCard.querySelector('.vui-chart-filters button.active');
        
        if (activeFilterButton) {
          // دریافت فیلتر فعال
          const activeFilter = activeFilterButton.dataset.filter;
          
          // بروزرسانی نمودار با فیلتر فعلی
          applyChartFilter(chart, activeFilter);
        }
      }
    });
  }
}

// پیاده‌سازی توابع نمودارهای مختلف
// برای جلوگیری از طولانی شدن فایل، فقط stub این توابع را قرار می‌دهیم

function initRevenueCharts() {
  console.log('Revenue charts initialized');
  // پیاده‌سازی نمودارهای درآمد
}

function initUserCharts() {
  console.log('User charts initialized');
  // پیاده‌سازی نمودارهای کاربران
}

function initItemCharts() {
  console.log('Item charts initialized');
  // پیاده‌سازی نمودارهای آیتم‌ها
}

function initGameCharts() {
  console.log('Game charts initialized');
  // پیاده‌سازی نمودارهای بازی‌ها
}

function initEconomyCharts() {
  console.log('Economy charts initialized');
  // پیاده‌سازی نمودارهای اقتصادی
}

function initClanCharts() {
  console.log('Clan charts initialized');
  // پیاده‌سازی نمودارهای کلن‌ها
}

function initQuizCharts() {
  console.log('Quiz charts initialized');
  // پیاده‌سازی نمودارهای کوئیز‌ها
}

function initQuestCharts() {
  console.log('Quest charts initialized');
  // پیاده‌سازی نمودارهای ماموریت‌ها
}