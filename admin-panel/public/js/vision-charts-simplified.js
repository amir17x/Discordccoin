/**
 * Vision UI Dashboard - Charts (Simplified version)
 * نمودارهای پیشرفته و زیبا مطابق با طراحی Vision UI
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("Charts script loaded");
  
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded');
    return;
  }
  
  // Initialize charts
  setupCharts();
});

/**
 * Setup all chart functionality
 */
function setupCharts() {
  // Setup default chart options
  setupDefaultChartOptions();
  
  // Register custom plugins
  registerCustomPlugins();
  
  // Initialize all charts
  initializeAllCharts();
  
  // Setup chart filters
  setupChartFilters();
  
  // Refresh charts periodically
  setInterval(refreshCharts, 60000);
}

/**
 * Setup default chart options
 */
function setupDefaultChartOptions() {
  // Default colors
  var colors = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--chart-primary-color').trim() || '#3461FF',
    info: getComputedStyle(document.documentElement).getPropertyValue('--chart-info-color').trim() || '#2CD9FF',
    success: getComputedStyle(document.documentElement).getPropertyValue('--chart-success-color').trim() || '#01B574',
    warning: getComputedStyle(document.documentElement).getPropertyValue('--chart-warning-color').trim() || '#FFCF5C',
    danger: getComputedStyle(document.documentElement).getPropertyValue('--chart-danger-color').trim() || '#F53939'
  };
  
  // Font settings
  if (Chart.defaults) {
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim();
    Chart.defaults.font = {
      family: 'Vazirmatn, sans-serif',
      size: 12
    };
    
    // Grid settings
    if (Chart.defaults.scale) {
      Chart.defaults.scale.grid = {
        color: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.05)'
      };
      
      if (Chart.defaults.scale.ticks) {
        Chart.defaults.scale.ticks.color = 'rgba(255, 255, 255, 0.5)';
      }
    }
    
    // Legend settings
    if (Chart.defaults.plugins && Chart.defaults.plugins.legend) {
      Chart.defaults.plugins.legend.position = 'bottom';
      Chart.defaults.plugins.legend.align = 'start';
      
      if (Chart.defaults.plugins.legend.labels) {
        Chart.defaults.plugins.legend.labels.boxWidth = 10;
        Chart.defaults.plugins.legend.labels.padding = 15;
      }
      
      if (Chart.defaults.plugins.legend.title) {
        Chart.defaults.plugins.legend.title.display = false;
      }
      
      Chart.defaults.plugins.legend.rtl = true;
    }
    
    // Animation settings
    Chart.defaults.animation = {
      duration: 1500,
      easing: 'easeOutQuart'
    };
    
    // Responsiveness
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.responsive = true;
  }
}

/**
 * Register custom chart plugins
 */
function registerCustomPlugins() {
  if (typeof Chart.register === 'function') {
    // Background color plugin
    var bgColorPlugin = {
      id: 'backgroundColor',
      beforeDraw: function(chart) {
        var ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        
        if (chart.config && chart.config.options && 
            chart.config.options.plugins && 
            chart.config.options.plugins.backgroundColor) {
          ctx.fillStyle = chart.config.options.plugins.backgroundColor;
          ctx.fillRect(0, 0, chart.width, chart.height);
        }
        
        ctx.restore();
      }
    };
    
    // Center text plugin for doughnut/pie charts
    var centerTextPlugin = {
      id: 'centerTextPlugin',
      beforeDraw: function(chart) {
        if ((chart.config.type === 'doughnut' || chart.config.type === 'pie') && 
            chart.config.options && 
            chart.config.options.elements && 
            chart.config.options.elements.center) {
          
          var centerConfig = chart.config.options.elements.center;
          var ctx = chart.ctx;
          var chartArea = chart.chartArea;
          
          ctx.save();
          
          if (centerConfig.text) {
            // Text settings
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            var centerX = (chartArea.left + chartArea.right) / 2;
            var centerY = (chartArea.top + chartArea.bottom) / 2;
            
            // Handle multiline text
            var textLines = centerConfig.text.split('\n');
            
            for (var i = 0; i < textLines.length; i++) {
              ctx.font = centerConfig.fontStyle || 'normal 16px Vazirmatn';
              ctx.fillStyle = centerConfig.fontColor || '#fff';
              
              var lineHeight = centerConfig.lineHeight || 25;
              var offset = (textLines.length - 1) * lineHeight / 2;
              
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
    };
    
    // Register the plugins
    Chart.register(bgColorPlugin);
    Chart.register(centerTextPlugin);
  }
}

/**
 * Initialize all charts
 */
function initializeAllCharts() {
  initRevenueCharts();
  initUserCharts();
  initItemCharts();
  initGameCharts();
  initEconomyCharts();
  initClanCharts();
  initQuizCharts();
  initQuestCharts();
}

/**
 * Setup chart filter event handlers
 */
function setupChartFilters() {
  var filterButtons = document.querySelectorAll('.vui-chart-filters button');
  
  for (var i = 0; i < filterButtons.length; i++) {
    filterButtons[i].addEventListener('click', function() {
      var chartId = this.closest('.vui-chart-card').dataset.chartId;
      var filter = this.dataset.filter;
      var chart = getChartById(chartId);
      
      if (!chart) return;
      
      // Remove active class from all buttons
      var buttons = this.parentNode.querySelectorAll('button');
      for (var j = 0; j < buttons.length; j++) {
        buttons[j].classList.remove('active');
      }
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Apply filter
      applyChartFilter(chart, filter);
    });
  }
}

/**
 * Get chart by ID
 */
function getChartById(chartId) {
  return Chart.getChart(chartId);
}

/**
 * Apply filter to chart
 */
function applyChartFilter(chart, filter) {
  // Show loader
  var chartContainer = chart.canvas.parentNode;
  if (chartContainer) {
    var loader = document.createElement('div');
    loader.className = 'chart-loader';
    chartContainer.appendChild(loader);
  }
  
  // Simulate data fetch with delay
  setTimeout(function() {
    // Remove loader
    if (chartContainer) {
      var loader = chartContainer.querySelector('.chart-loader');
      if (loader) loader.parentNode.removeChild(loader);
    }
    
    // Update data based on filter
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
    
    // Update chart
    chart.update();
  }, 500);
}

/**
 * Update chart data for today
 */
function updateChartDataForToday(chart) {
  var chartId = chart.canvas.id;
  
  if (chartId === 'revenueChart') {
    chart.data.labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    chart.data.datasets[0].data = [12, 19, 13, 25, 32, 28, 34, 42];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    chart.data.datasets[0].data = [55, 67, 73, 82, 95, 102, 89, 76];
  }
  
  // Other charts...
}

/**
 * Update chart data for week
 */
function updateChartDataForWeek(chart) {
  var chartId = chart.canvas.id;
  
  if (chartId === 'revenueChart') {
    chart.data.labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    chart.data.datasets[0].data = [82, 96, 114, 125, 138, 157, 178];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    chart.data.datasets[0].data = [312, 287, 342, 298, 387, 425, 392];
  }
  
  // Other charts...
}

/**
 * Update chart data for month
 */
function updateChartDataForMonth(chart) {
  var chartId = chart.canvas.id;
  var days = [];
  for (var i = 1; i <= 30; i++) {
    days.push(i.toString());
  }
  
  if (chartId === 'revenueChart') {
    chart.data.labels = days;
    chart.data.datasets[0].data = [];
    for (var i = 0; i < 30; i++) {
      chart.data.datasets[0].data.push(Math.floor(Math.random() * 500 + 1000));
    }
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = days;
    chart.data.datasets[0].data = [];
    for (var i = 0; i < 30; i++) {
      chart.data.datasets[0].data.push(Math.floor(Math.random() * 200 + 300));
    }
  }
  
  // Other charts...
}

/**
 * Update chart data for year
 */
function updateChartDataForYear(chart) {
  var chartId = chart.canvas.id;
  var months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  
  if (chartId === 'revenueChart') {
    chart.data.labels = months;
    chart.data.datasets[0].data = [2500, 3200, 2800, 3800, 4200, 3900, 4600, 5100, 4800, 5500, 6200, 5800];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = months;
    chart.data.datasets[0].data = [850, 920, 980, 1050, 1120, 1180, 1250, 1320, 1380, 1450, 1520, 1600];
  }
  
  // Other charts...
}

/**
 * Update chart data for all time
 */
function updateChartDataForAll(chart) {
  var chartId = chart.canvas.id;
  var years = ['1399', '1400', '1401', '1402', '1403'];
  
  if (chartId === 'revenueChart') {
    chart.data.labels = years;
    chart.data.datasets[0].data = [35000, 48000, 62000, 78000, 95000];
  }
  else if (chartId === 'userActivityChart') {
    chart.data.labels = years;
    chart.data.datasets[0].data = [5400, 7800, 9300, 12600, 15200];
  }
  
  // Other charts...
}

/**
 * Refresh all charts periodically
 */
function refreshCharts() {
  var activeCharts = Chart.instances;
  
  if (activeCharts && activeCharts.length > 0) {
    for (var i = 0; i < activeCharts.length; i++) {
      var chart = activeCharts[i];
      var chartElement = chart.canvas.parentNode;
      var chartCard = chartElement.closest('.vui-chart-card');
      
      if (chartCard) {
        var activeFilterButton = chartCard.querySelector('.vui-chart-filters button.active');
        
        if (activeFilterButton) {
          var activeFilter = activeFilterButton.dataset.filter;
          applyChartFilter(chart, activeFilter);
        }
      }
    }
  }
}

// Chart initialization stubs
function initRevenueCharts() {
  console.log('Revenue charts initialized');
}

function initUserCharts() {
  console.log('User charts initialized');
}

function initItemCharts() {
  console.log('Item charts initialized');
}

function initGameCharts() {
  console.log('Game charts initialized');
}

function initEconomyCharts() {
  console.log('Economy charts initialized');
}

function initClanCharts() {
  console.log('Clan charts initialized');
}

function initQuizCharts() {
  console.log('Quiz charts initialized');
}

function initQuestCharts() {
  console.log('Quest charts initialized');
}