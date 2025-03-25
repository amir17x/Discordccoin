/**
 * اسکریپت‌های صفحه داشبورد پنل مدیریت Ccoin
 * این فایل شامل کدهای جاوااسکریپت برای داشبورد اصلی پنل مدیریت است
 */

document.addEventListener('DOMContentLoaded', function() {
  // راه‌اندازی نمودارها
  initCharts();
  
  // راه‌اندازی ویجت‌های قابل جابجایی
  initDraggableWidgets();
  
  // راه‌اندازی بروزرسانی زنده
  initLiveUpdates();
  
  // راه‌اندازی تولتیپ‌های کمکی
  initHelpTooltips();
  
  // راه‌اندازی انیمیشن‌های ورود
  initEntranceAnimations();
});

/**
 * راه‌اندازی نمودارهای داشبورد با Chart.js
 */
function initCharts() {
  // نمودار کاربران فعال
  initActiveUsersChart();
  
  // نمودار بازی‌ها
  initGamesChart();
  
  // نمودار اقتصاد
  initEconomyChart();
  
  // نمودار فعالیت‌ها
  initActivityChart();
}

/**
 * نمودار کاربران فعال
 */
function initActiveUsersChart() {
  const ctx = document.getElementById('activeUsersChart');
  if (!ctx) return;
  
  // تنظیمات بهتر برای نمودار
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(67, 97, 238, 0.3)');
  gradient.addColorStop(1, 'rgba(67, 97, 238, 0.0)');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: activeUsersData.labels,
      datasets: [{
        label: 'کاربران فعال',
        data: activeUsersData.values,
        borderColor: '#4361ee',
        backgroundColor: gradient,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4361ee',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
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
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            size: 16,
            family: 'Vazirmatn'
          },
          bodyFont: {
            size: 14,
            family: 'Vazirmatn'
          },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
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
      }
    }
  });
}

/**
 * نمودار بازی‌ها (دونات)
 */
function initGamesChart() {
  const ctx = document.getElementById('gamesChart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: gamesData.labels,
      datasets: [{
        data: gamesData.values,
        backgroundColor: [
          'rgba(67, 97, 238, 0.7)',    // آبی
          'rgba(114, 9, 183, 0.7)',    // بنفش
          'rgba(76, 201, 240, 0.7)',   // آبی روشن
          'rgba(249, 199, 79, 0.7)',   // زرد
          'rgba(72, 149, 239, 0.7)'    // آبی آسمانی
        ],
        borderColor: [
          'rgba(67, 97, 238, 1)',
          'rgba(114, 9, 183, 1)',
          'rgba(76, 201, 240, 1)',
          'rgba(249, 199, 79, 1)',
          'rgba(72, 149, 239, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 20,
            font: {
              family: 'Vazirmatn',
              size: 14
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            size: 16,
            family: 'Vazirmatn'
          },
          bodyFont: {
            size: 14,
            family: 'Vazirmatn'
          },
          padding: 12,
          cornerRadius: 8
        }
      }
    }
  });
}

/**
 * نمودار اقتصاد (خطی مقایسه‌ای)
 */
function initEconomyChart() {
  const ctx = document.getElementById('economyChart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: economyData.labels,
      datasets: [
        {
          label: 'کیف پول',
          data: economyData.wallet,
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          fill: false
        },
        {
          label: 'بانک',
          data: economyData.bank,
          borderColor: '#7209b7',
          backgroundColor: 'rgba(114, 9, 183, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              family: 'Vazirmatn',
              size: 14
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            size: 16,
            family: 'Vazirmatn'
          },
          bodyFont: {
            size: 14,
            family: 'Vazirmatn'
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatNumber(context.raw)} Ccoin`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: 'Vazirmatn'
            },
            callback: function(value) {
              return formatNumber(value);
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
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

/**
 * نمودار فعالیت‌ها (نمودار میله‌ای)
 */
function initActivityChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: activityData.labels,
      datasets: [{
        label: 'فعالیت‌ها',
        data: activityData.values,
        backgroundColor: 'rgba(67, 97, 238, 0.7)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        borderRadius: 5,
        maxBarThickness: 30
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            size: 16,
            family: 'Vazirmatn'
          },
          bodyFont: {
            size: 14,
            family: 'Vazirmatn'
          },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
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
      }
    }
  });
}

/**
 * راه‌اندازی ویجت‌های قابل جابجایی
 */
function initDraggableWidgets() {
  const dragContainer = document.getElementById('draggable-widgets');
  if (!dragContainer) return;
  
  // بررسی اگر کتابخانه Sortable وجود دارد
  if (typeof Sortable !== 'undefined') {
    Sortable.create(dragContainer, {
      animation: 150,
      handle: '.widget-handle',
      ghostClass: 'widget-ghost',
      onEnd: function() {
        // ذخیره ترتیب جدید ویجت‌ها
        saveWidgetOrder();
      }
    });
  }
  
  // راه‌اندازی دکمه‌های تنظیمات ویجت
  setupWidgetControls();
}

/**
 * راه‌اندازی کنترل‌های ویجت (مانند مخفی/نمایش)
 */
function setupWidgetControls() {
  const widgetControls = document.querySelectorAll('.widget-control');
  
  widgetControls.forEach(control => {
    control.addEventListener('click', function(e) {
      e.preventDefault();
      
      const action = this.getAttribute('data-action');
      const widgetId = this.closest('.dashboard-widget').getAttribute('id');
      
      switch (action) {
        case 'collapse':
          toggleWidgetCollapse(widgetId);
          break;
        case 'remove':
          removeWidget(widgetId);
          break;
        case 'refresh':
          refreshWidget(widgetId);
          break;
      }
    });
  });
}

/**
 * تغییر وضعیت نمایش/مخفی ویجت
 */
function toggleWidgetCollapse(widgetId) {
  const widget = document.getElementById(widgetId);
  const body = widget.querySelector('.widget-body');
  const icon = widget.querySelector('[data-action="collapse"] i');
  
  body.classList.toggle('d-none');
  
  if (icon) {
    if (body.classList.contains('d-none')) {
      icon.classList.remove('fa-minus');
      icon.classList.add('fa-plus');
    } else {
      icon.classList.remove('fa-plus');
      icon.classList.add('fa-minus');
    }
  }
  
  // ذخیره وضعیت در localStorage
  const collapsedWidgets = JSON.parse(localStorage.getItem('collapsedWidgets') || '[]');
  
  if (body.classList.contains('d-none')) {
    if (!collapsedWidgets.includes(widgetId)) {
      collapsedWidgets.push(widgetId);
    }
  } else {
    const index = collapsedWidgets.indexOf(widgetId);
    if (index !== -1) {
      collapsedWidgets.splice(index, 1);
    }
  }
  
  localStorage.setItem('collapsedWidgets', JSON.stringify(collapsedWidgets));
}

/**
 * حذف ویجت از داشبورد
 */
function removeWidget(widgetId) {
  if (confirm('آیا از حذف این ویجت اطمینان دارید؟')) {
    const widget = document.getElementById(widgetId);
    
    // انیمیشن حذف
    widget.style.transition = 'all 0.3s ease';
    widget.style.transform = 'scale(0.8)';
    widget.style.opacity = '0';
    
    setTimeout(() => {
      widget.remove();
      
      // ذخیره لیست ویجت‌های حذف شده
      const removedWidgets = JSON.parse(localStorage.getItem('removedWidgets') || '[]');
      if (!removedWidgets.includes(widgetId)) {
        removedWidgets.push(widgetId);
        localStorage.setItem('removedWidgets', JSON.stringify(removedWidgets));
      }
      
      // نمایش دکمه بازگرداندن ویجت‌های حذف شده
      document.getElementById('restore-widgets-btn').classList.remove('d-none');
      
    }, 300);
  }
}

/**
 * بروزرسانی یک ویجت
 */
function refreshWidget(widgetId) {
  const widget = document.getElementById(widgetId);
  const body = widget.querySelector('.widget-body');
  const spinner = document.createElement('div');
  
  // نمایش اسپینر در مرکز ویجت
  spinner.className = 'widget-spinner';
  spinner.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i>';
  body.appendChild(spinner);
  
  // شبیه‌سازی درخواست به سرور
  setTimeout(() => {
    // در اینجا می‌توانید یک درخواست Ajax به سرور بفرستید
    
    // حذف اسپینر
    spinner.remove();
    
    // نمایش پیام موفقیت
    showToast('ویجت با موفقیت بروزرسانی شد', 'success');
    
    // افکت تازه‌سازی
    widget.style.transition = 'none';
    widget.style.boxShadow = '0 0 0 2px var(--primary-color)';
    
    setTimeout(() => {
      widget.style.transition = 'box-shadow 0.5s ease';
      widget.style.boxShadow = 'var(--card-shadow)';
    }, 50);
    
  }, 1500);
}

/**
 * ذخیره ترتیب ویجت‌ها
 */
function saveWidgetOrder() {
  const container = document.getElementById('draggable-widgets');
  const widgets = container.querySelectorAll('.dashboard-widget');
  
  const order = Array.from(widgets).map(widget => widget.id);
  
  // ذخیره در localStorage
  localStorage.setItem('widgetOrder', JSON.stringify(order));
  
  // نمایش پیام موفقیت
  showToast('چیدمان ویجت‌ها ذخیره شد', 'success');
}

/**
 * بازگرداندن ویجت‌های حذف شده
 */
function restoreRemovedWidgets() {
  const removedWidgets = JSON.parse(localStorage.getItem('removedWidgets') || '[]');
  
  if (removedWidgets.length === 0) {
    showToast('ویجت حذف شده‌ای وجود ندارد', 'info');
    return;
  }
  
  // درخواست بازگرداندن ویجت‌ها
  fetch('/dashboard/restore-widgets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ widgets: removedWidgets }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // ریلود صفحه برای نمایش ویجت‌های بازگردانده شده
      localStorage.removeItem('removedWidgets');
      window.location.reload();
    }
  })
  .catch(() => {
    // در صورت خطا، بازگرداندن از localStorage
    localStorage.removeItem('removedWidgets');
    window.location.reload();
  });
}

/**
 * راه‌اندازی بروزرسانی زنده داشبورد
 */
function initLiveUpdates() {
  // در صورت وجود کتابخانه Socket.io
  if (typeof io !== 'undefined') {
    const socket = io();
    
    socket.on('connect', function() {
      console.log('اتصال به سرور برقرار شد');
      showToast('اتصال به سرور برقرار شد', 'success');
    });
    
    socket.on('dashboard-update', function(data) {
      updateDashboardStats(data);
    });
    
    socket.on('new-user', function(data) {
      showToast(`کاربر جدید: ${data.username}`, 'info');
      updateUserCounter(data.totalUsers);
    });
    
    socket.on('large-transaction', function(data) {
      showToast(`تراکنش بزرگ: ${formatNumber(data.amount)} Ccoin از ${data.from} به ${data.to}`, 'warning');
    });
    
    socket.on('disconnect', function() {
      console.log('اتصال به سرور قطع شد');
      showToast('اتصال به سرور قطع شد. در حال تلاش برای اتصال مجدد...', 'error');
    });
  } else {
    // استفاده از Polling در صورت عدم وجود Socket.io
    setInterval(fetchDashboardUpdates, 30000); // هر 30 ثانیه
  }
}

/**
 * درخواست بروزرسانی‌های داشبورد
 */
function fetchDashboardUpdates() {
  fetch('/dashboard/updates')
    .then(response => response.json())
    .then(data => {
      updateDashboardStats(data);
    })
    .catch(error => {
      console.error('خطا در دریافت بروزرسانی‌ها:', error);
    });
}

/**
 * بروزرسانی آمارهای داشبورد
 */
function updateDashboardStats(data) {
  // بروزرسانی تعداد کاربران
  if (data.totalUsers) {
    updateUserCounter(data.totalUsers);
  }
  
  // بروزرسانی آمار کلن‌ها
  if (data.totalClans) {
    updateStatElement('totalClans', data.totalClans);
  }
  
  // بروزرسانی موجودی کل Ccoin
  if (data.totalCcoin) {
    updateStatElement('totalCcoin', formatNumber(data.totalCcoin));
  }
  
  // بروزرسانی سایر آمارها
  if (data.activeQuests) {
    updateStatElement('activeQuests', data.activeQuests);
  }
  
  // بروزرسانی لیست کاربران فعال اخیر
  if (data.recentUsers && data.recentUsers.length > 0) {
    updateRecentUsersList(data.recentUsers);
  }
  
  // بروزرسانی لیست رویدادهای اخیر
  if (data.recentEvents && data.recentEvents.length > 0) {
    updateRecentEventsList(data.recentEvents);
  }
}

/**
 * بروزرسانی شمارنده کاربران با انیمیشن
 */
function updateUserCounter(newValue) {
  const counterElement = document.getElementById('totalUsers');
  if (!counterElement) return;
  
  const currentValue = parseInt(counterElement.getAttribute('data-value') || counterElement.innerText);
  const difference = newValue - currentValue;
  
  if (difference === 0) return;
  
  // انیمیشن افزایش/کاهش شمارنده
  const duration = 1500; // مدت زمان انیمیشن به میلی‌ثانیه
  const steps = 60;
  const increment = difference / steps;
  let currentStep = 0;
  let currentCount = currentValue;
  
  // نمایش جهت تغییر
  const changeIndicator = document.getElementById('userChangeIndicator');
  if (changeIndicator) {
    if (difference > 0) {
      changeIndicator.innerHTML = `<i class="fas fa-arrow-up text-success"></i> +${difference}`;
      changeIndicator.className = 'text-success ms-2';
    } else {
      changeIndicator.innerHTML = `<i class="fas fa-arrow-down text-danger"></i> ${difference}`;
      changeIndicator.className = 'text-danger ms-2';
    }
    
    // حذف نشانگر بعد از چند ثانیه
    setTimeout(() => {
      changeIndicator.innerHTML = '';
      changeIndicator.className = '';
    }, 5000);
  }
  
  const updateCounter = () => {
    currentStep++;
    currentCount += increment;
    
    if (currentStep >= steps) {
      currentCount = newValue; // اطمینان از صحت مقدار نهایی
    }
    
    counterElement.innerText = Math.round(currentCount);
    counterElement.setAttribute('data-value', newValue);
    
    if (currentStep < steps) {
      requestAnimationFrame(updateCounter);
    }
  };
  
  requestAnimationFrame(updateCounter);
}

/**
 * بروزرسانی یک المان آماری
 */
function updateStatElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = value;
    
    // افکت تأکید
    element.classList.add('highlight-update');
    setTimeout(() => {
      element.classList.remove('highlight-update');
    }, 1500);
  }
}

/**
 * بروزرسانی لیست کاربران فعال اخیر
 */
function updateRecentUsersList(users) {
  const container = document.getElementById('recentUsersList');
  if (!container) return;
  
  let html = '';
  
  users.forEach((user, index) => {
    html += `
      <tr>
        <th scope="row">${index + 1}</th>
        <td>
          <a href="/users/${user.id}" class="text-decoration-none">
            ${user.username}
            ${user.isBanned ? '<span class="badge bg-danger ms-1">مسدود</span>' : ''}
            ${user.isPremium ? '<span class="badge bg-warning text-dark ms-1">ویژه</span>' : ''}
          </a>
        </td>
        <td>${formatTimeAgo(user.lastSeen)}</td>
        <td>${formatNumber(user.wallet + user.bank)} Ccoin</td>
      </tr>
    `;
  });
  
  // نمایش با انیمیشن محو شدن و ظاهر شدن
  container.style.opacity = '0';
  setTimeout(() => {
    container.innerHTML = html;
    container.style.opacity = '1';
  }, 300);
}

/**
 * بروزرسانی لیست رویدادهای اخیر
 */
function updateRecentEventsList(events) {
  const container = document.getElementById('recentEventsList');
  if (!container) return;
  
  let html = '';
  
  events.forEach((event, index) => {
    let badgeClass = 'bg-secondary';
    
    switch (event.type) {
      case 'user':
        badgeClass = 'bg-primary';
        break;
      case 'transaction':
        badgeClass = 'bg-success';
        break;
      case 'game':
        badgeClass = 'bg-warning text-dark';
        break;
      case 'clan':
        badgeClass = 'bg-info';
        break;
      case 'system':
        badgeClass = 'bg-dark';
        break;
    }
    
    html += `
      <tr>
        <th scope="row">${index + 1}</th>
        <td>
          <span class="badge ${badgeClass}">${event.type}</span>
        </td>
        <td>${event.message}</td>
        <td>${formatTimeAgo(event.timestamp)}</td>
      </tr>
    `;
  });
  
  // نمایش با انیمیشن محو شدن و ظاهر شدن
  container.style.opacity = '0';
  setTimeout(() => {
    container.innerHTML = html;
    container.style.opacity = '1';
  }, 300);
}

/**
 * راه‌اندازی تولتیپ‌های کمکی
 */
function initHelpTooltips() {
  const helpIcons = document.querySelectorAll('.help-tooltip');
  
  helpIcons.forEach(icon => {
    const tooltipText = icon.getAttribute('data-tooltip');
    
    // در صورت وجود Bootstrap Tooltip
    if (typeof bootstrap !== 'undefined' && tooltipText) {
      new bootstrap.Tooltip(icon, {
        title: tooltipText,
        placement: 'top',
        html: true,
        template: '<div class="tooltip custom-tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
      });
    } else {
      // تولتیپ ساده برای مرورگرهای قدیمی
      icon.setAttribute('title', tooltipText);
    }
  });
}

/**
 * راه‌اندازی انیمیشن‌های ورود برای المان‌های داشبورد
 */
function initEntranceAnimations() {
  const elements = document.querySelectorAll('.animated-element');
  
  elements.forEach((element, index) => {
    // تأخیر برای هر المان بعدی
    const delay = index * 100;
    
    setTimeout(() => {
      element.classList.add('fade-in');
    }, delay);
  });
}

/**
 * نمایش پیام توست
 */
function showToast(message, type = 'info') {
  // برای استفاده از توست‌های بوت‌استرپ
  if (typeof bootstrap !== 'undefined') {
    // ایجاد المان توست
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} align-items-center border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // تعیین رنگ پس‌زمینه بر اساس نوع
    let bgClass = 'bg-info';
    let icon = 'info-circle';
    
    switch (type) {
      case 'success':
        bgClass = 'bg-success';
        icon = 'check-circle';
        break;
      case 'warning':
        bgClass = 'bg-warning';
        icon = 'exclamation-triangle';
        break;
      case 'error':
        bgClass = 'bg-danger';
        icon = 'times-circle';
        break;
    }
    
    toast.classList.add(bgClass, 'text-white');
    
    // محتوای توست
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-${icon} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // افزودن به کانتینر توست‌ها
    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);
      
      // نمایش توست
      const bsToast = new bootstrap.Toast(toast, {
        delay: 5000,
        animation: true
      });
      
      bsToast.show();
      
      // حذف از DOM پس از مخفی شدن
      toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
      });
    }
  } else {
    // روش جایگزین برای مرورگرهای قدیمی
    alert(message);
  }
}

/**
 * فرمت کردن اعداد به صورت سه رقمی با جداکننده
 */
function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

/**
 * تبدیل تاریخ به فرمت "چند زمان پیش"
 */
function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000); // تفاوت به ثانیه
  
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
  if (diff < 604800) return Math.floor(diff / 86400) + ' روز پیش';
  if (diff < 2592000) return Math.floor(diff / 604800) + ' هفته پیش';
  if (diff < 31536000) return Math.floor(diff / 2592000) + ' ماه پیش';
  return Math.floor(diff / 31536000) + ' سال پیش';
}