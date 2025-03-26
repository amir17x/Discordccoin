/**
 * Vision UI Dashboard - Charts
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
        if (chart.config.options.elements?.center) {
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
              dataset.gradient.stops.forEach(stop => {
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
function createGradientConfig(colorType, isBgOnly = false) {
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
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const chartId = this.closest('.vui-chart-card').dataset.chartId;
      const filter = this.dataset.filter;
      const chart = getChartById(chartId);
      
      if (!chart) return;
      
      // حذف کلاس active از همه دکمه‌ها
      this.parentNode.querySelectorAll('button').forEach(btn => {
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
  setTimeout(() => {
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
  const days = Array.from({length: 30}, (_, i) => (i+1).toString());
  
  if (chartId === 'revenueChart') {
    chart.data.labels = days;
    chart.data.datasets[0].data = Array.from({length: 30}, () => Math.floor(Math.random() * 500 + 1000));
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = days;
    chart.data.datasets[0].data = Array.from({length: 30}, () => Math.floor(Math.random() * 200 + 300));
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
    activeCharts.forEach(chart => {
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

/**
 * نمودارهای اختصاصی درآمد و هزینه
 */
function initRevenueCharts() {
  // نمودار درآمد کلی
  const revenueChartEl = document.getElementById('revenueChart');
  if (revenueChartEl) {
    const revenueChart = new Chart(revenueChartEl, {
      type: 'line',
      data: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
        datasets: [{
          label: 'درآمد (Ccoin)',
          data: [2500, 3200, 2800, 3800, 4200, 3900, 4600, 5100, 4800, 5500, 6200, 5800],
          ...createGradientConfig('primary'),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'white',
          pointBorderColor: 'var(--vui-primary)',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'white',
          pointHoverBorderColor: 'var(--vui-primary)',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} Ccoin`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
  
  // نمودار مقایسه‌ای درآمد و هزینه
  const incomeExpenseChartEl = document.getElementById('incomeExpenseChart');
  if (incomeExpenseChartEl) {
    const incomeExpenseChart = new Chart(incomeExpenseChartEl, {
      type: 'bar',
      data: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        datasets: [
          {
            label: 'درآمد',
            data: [2500, 3200, 2800, 3800, 4200, 3900],
            ...createGradientConfig('success'),
            borderWidth: 0,
            borderRadius: 4
          },
          {
            label: 'هزینه',
            data: [1800, 2100, 1700, 2300, 2700, 2400],
            ...createGradientConfig('danger'),
            borderWidth: 0,
            borderRadius: 4
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} Ccoin`;
              }
            }
          }
        }
      }
    });
  }
  
  // نمودار توزیع هزینه‌ها
  const expenseDistributionChartEl = document.getElementById('expenseDistributionChart');
  if (expenseDistributionChartEl) {
    const expenseDistributionChart = new Chart(expenseDistributionChartEl, {
      type: 'doughnut',
      data: {
        labels: ['بازی‌ها', 'خرید آیتم', 'انتقال سکه', 'خرید لاتاری', 'سرمایه‌گذاری'],
        datasets: [{
          data: [35, 25, 15, 15, 10],
          backgroundColor: [
            'var(--vui-primary)',
            'var(--vui-info)',
            'var(--vui-success)',
            'var(--vui-warning)',
            'var(--vui-danger)'
          ],
          borderColor: [
            'rgba(67, 24, 255, 1)',
            'rgba(57, 184, 255, 1)',
            'rgba(1, 181, 116, 1)',
            'rgba(255, 181, 71, 1)',
            'rgba(236, 64, 122, 1)'
          ],
          borderWidth: 1,
          hoverOffset: 5
        }]
      },
      options: {
        cutout: '70%',
        elements: {
          center: {
            text: '100%\nCcoin',
            fontStyle: 'bold 18px Vazirmatn',
            fontColor: 'white',
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * نمودارهای اختصاصی کاربران
 */
function initUserCharts() {
  // نمودار فعالیت کاربران
  const userActivityChartEl = document.getElementById('userActivityChart');
  if (userActivityChartEl) {
    const userActivityChart = new Chart(userActivityChartEl, {
      type: 'line',
      data: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
        datasets: [{
          label: 'تعداد کاربران فعال',
          data: [850, 920, 980, 1050, 1120, 1180, 1250, 1320, 1380, 1450, 1520, 1600],
          ...createGradientConfig('info'),
          borderWidth: 2,
          fill: 'start',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'white',
          pointBorderColor: 'var(--vui-info)',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'white',
          pointHoverBorderColor: 'var(--vui-info)',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} کاربر`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
  
  // نمودار جنسیت کاربران
  const userGenderChartEl = document.getElementById('userGenderChart');
  if (userGenderChartEl) {
    const userGenderChart = new Chart(userGenderChartEl, {
      type: 'pie',
      data: {
        labels: ['مرد', 'زن', 'نامشخص'],
        datasets: [{
          data: [62, 32, 6],
          backgroundColor: [
            'var(--vui-primary)',
            'var(--vui-info)',
            'var(--vui-warning)'
          ],
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          hoverOffset: 5
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
  }
  
  // نمودار سنی کاربران
  const userAgeChartEl = document.getElementById('userAgeChart');
  if (userAgeChartEl) {
    const userAgeChart = new Chart(userAgeChartEl, {
      type: 'bar',
      data: {
        labels: ['13-17', '18-24', '25-34', '35-44', '45+'],
        datasets: [{
          label: 'توزیع سنی',
          data: [12, 38, 35, 10, 5],
          ...createGradientConfig('primary'),
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `${value}%`;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * نمودارهای اختصاصی آیتم‌ها
 */
function initItemCharts() {
  // نمودار آیتم‌های فروخته شده
  const itemSalesChartEl = document.getElementById('itemSalesChart');
  if (itemSalesChartEl) {
    const itemSalesChart = new Chart(itemSalesChartEl, {
      type: 'bar',
      data: {
        labels: ['آیتم 1', 'آیتم 2', 'آیتم 3', 'آیتم 4', 'آیتم 5'],
        datasets: [{
          label: 'فروش آیتم‌ها',
          data: [483, 421, 375, 289, 256],
          ...createGradientConfig('success'),
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.x.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * نمودارهای اختصاصی بازی‌ها
 */
function initGameCharts() {
  // نمودار آمار بازی‌ها
  const gameStatsChartEl = document.getElementById('gameStatsChart');
  if (gameStatsChartEl) {
    const gameStatsChart = new Chart(gameStatsChartEl, {
      type: 'radar',
      data: {
        labels: ['شیر یا خط', 'سنگ کاغذ قیچی', 'حدس عدد', 'چرخ شانس', 'دزدی'],
        datasets: [{
          label: 'تعداد بازی',
          data: [85, 72, 65, 92, 78],
          borderColor: 'var(--vui-primary)',
          backgroundColor: 'rgba(67, 24, 255, 0.2)',
          pointBackgroundColor: 'white',
          pointBorderColor: 'var(--vui-primary)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        scales: {
          r: {
            angleLines: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            pointLabels: {
              font: {
                size: 12
              }
            },
            ticks: {
              backdropColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        }
      }
    });
  }
}

/**
 * نمودارهای اختصاصی اقتصادی
 */
function initEconomyCharts() {
  // نمودار اقتصادی عرضه پول
  const economyChartEl = document.getElementById('economyChart');
  if (economyChartEl) {
    const economyChart = new Chart(economyChartEl, {
      type: 'line',
      data: {
        labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        datasets: [
          {
            label: 'عرضه کل',
            data: [1200000, 1350000, 1450000, 1580000, 1750000, 1900000],
            borderColor: 'var(--vui-primary)',
            backgroundColor: 'rgba(67, 24, 255, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: 'موجودی بانکی',
            data: [850000, 950000, 1020000, 1150000, 1280000, 1400000],
            borderColor: 'var(--vui-info)',
            backgroundColor: 'rgba(57, 184, 255, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: 'موجودی کیف پول',
            data: [350000, 400000, 430000, 430000, 470000, 500000],
            borderColor: 'var(--vui-success)',
            backgroundColor: 'rgba(1, 181, 116, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return `${(value / 1000000).toLocaleString()}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toLocaleString()}K`;
                }
                return value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} Ccoin`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * نمودارهای اختصاصی کلن‌ها
 */
function initClanCharts() {
  // نمودار مقایسه کلن‌ها (امتیاز)
  const clanScoreChartEl = document.getElementById('clanScoreChart');
  if (clanScoreChartEl) {
    const clanScoreChart = new Chart(clanScoreChartEl, {
      type: 'bar',
      data: {
        labels: ['کلن 1', 'کلن 2', 'کلن 3', 'کلن 4', 'کلن 5'],
        datasets: [{
          label: 'امتیاز کلن',
          data: [1250, 980, 850, 720, 650],
          ...createGradientConfig('primary'),
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.x.toLocaleString()} امتیاز`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * نمودارهای اختصاصی کوئیزها
 */
function initQuizCharts() {
  // نمودار نتایج کوئیزها
  const quizResultsChartEl = document.getElementById('quizResultsChart');
  if (quizResultsChartEl) {
    const quizResultsChart = new Chart(quizResultsChartEl, {
      type: 'pie',
      data: {
        labels: ['پاسخ‌های درست', 'پاسخ‌های نادرست', 'بی‌پاسخ'],
        datasets: [{
          data: [68, 27, 5],
          backgroundColor: [
            'var(--vui-success)',
            'var(--vui-danger)',
            'var(--vui-warning)'
          ],
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          hoverOffset: 5
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * نمودارهای اختصاصی کوئست‌ها
 */
function initQuestCharts() {
  // نمودار پیشرفت کوئست‌ها
  const questProgressChartEl = document.getElementById('questProgressChart');
  if (questProgressChartEl) {
    const questProgressChart = new Chart(questProgressChartEl, {
      type: 'bar',
      data: {
        labels: ['کوئست 1', 'کوئست 2', 'کوئست 3', 'کوئست 4', 'کوئست 5'],
        datasets: [{
          label: 'پیشرفت',
          data: [85, 62, 45, 93, 27],
          ...createGradientConfig('info'),
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return `${value}%`;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}%`;
              }
            }
          }
        }
      }
    });
  }
}

// نمایش پیام‌های خطا در کنسول
window.addEventListener('error', function(e) {
  console.error('Chart.js Error:', e.message);
});

// افزودن متدها به window برای دسترسی مستقیم
window.visionUiCharts = {
  initChartDefaults: initChartDefaults,
  initializeCharts: initializeCharts,
  refreshCharts: refreshCharts,
  applyChartFilter: applyChartFilter,
  getChartById: getChartById,
  createGradientConfig: createGradientConfig
};