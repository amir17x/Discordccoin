// اسکریپت اصلی پنل مدیریت Ccoin

// اجرای اسکریپت بعد از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
  // فعال‌سازی آیکون‌های Feather
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
  
  // تنظیم توست‌ها
  setupToasts();
  
  // ایجاد دکمه بروزرسانی
  setupRefreshButton();
  
  // ست‌آپ آپلود تصویر
  setupImageUpload();
  
  // فعال‌سازی تولتیپ‌ها
  setupTooltips();
  
  // مدیریت تب‌ها با استفاده از هش URL
  handleTabsFromHash();
});

// فعال‌سازی توست‌ها
function setupToasts() {
  var toastElements = document.querySelectorAll('.toast');
  if (toastElements.length > 0 && typeof bootstrap !== 'undefined') {
    toastElements.forEach(function(toastEl) {
      new bootstrap.Toast(toastEl).show();
    });
  }
}

// ست‌آپ دکمه بروزرسانی صفحه
function setupRefreshButton() {
  const refreshButton = document.getElementById('refreshData');
  if (refreshButton) {
    refreshButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // نمایش آیکون لودینگ
      const icon = refreshButton.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-sync-alt');
        icon.classList.add('fa-spinner', 'fa-spin');
      }
      
      // بروزرسانی صفحه بعد از 1 ثانیه تاخیر (برای نمایش انیمیشن)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }
}

// ست‌آپ آپلود تصویر با پیش‌نمایش
function setupImageUpload() {
  const imageInputs = document.querySelectorAll('.image-upload');
  
  imageInputs.forEach(input => {
    const preview = document.getElementById(input.dataset.preview);
    
    if (input && preview) {
      input.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          
          reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove('d-none');
          };
          
          reader.readAsDataURL(this.files[0]);
        }
      });
    }
  });
}

// فعال‌سازی تولتیپ‌ها
function setupTooltips() {
  if (typeof bootstrap !== 'undefined') {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

// مدیریت تب‌ها با هش URL
function handleTabsFromHash() {
  const hash = window.location.hash;
  if (hash) {
    const tabId = hash.replace('#', '');
    const tabElement = document.querySelector(`a[data-bs-toggle="tab"][href="#${tabId}"]`);
    
    if (tabElement && typeof bootstrap !== 'undefined') {
      new bootstrap.Tab(tabElement).show();
    }
  }
}

// فانکشن کانفیرم حذف
function confirmDelete(itemName, deleteUrl) {
  if (window.confirm(`آیا از حذف ${itemName || 'این آیتم'} اطمینان دارید؟`)) {
    window.location.href = deleteUrl;
  }
}

// کپی متن در کلیپ‌بورد
function copyToClipboard(text, elementId) {
  navigator.clipboard.writeText(text).then(function() {
    const element = document.getElementById(elementId);
    if (element) {
      const originalText = element.innerHTML;
      element.innerHTML = 'کپی شد!';
      
      setTimeout(() => {
        element.innerHTML = originalText;
      }, 2000);
    }
  });
}

// ست‌آپ لود داینامیک (AJAX) برای صفحات
function loadContentDynamic(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  
  target.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-3x"></i><p class="mt-3">در حال بارگذاری...</p></div>';
  
  fetch(url)
    .then(response => response.text())
    .then(html => {
      target.innerHTML = html;
    })
    .catch(error => {
      target.innerHTML = `<div class="alert alert-danger">خطا در بارگذاری: ${error.message}</div>`;
    });
}

// فانکشن فرمت کردن اعداد به فرمت پول
function formatMoney(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// فانکشن تبدیل تاریخ به فرمت شمسی
function toJalali(date) {
  // کد تبدیل تاریخ میلادی به شمسی
  // این بخش نیاز به کتابخانه‌ی تبدیل تاریخ دارد
  return date; // فعلا تاریخ را بدون تغییر برمی‌گرداند
}