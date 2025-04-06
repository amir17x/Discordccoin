/**
 * Fluent UI JavaScript برای پنل مدیریت CCoin
 */

// مقدار اولیه عناصر UI
document.addEventListener('DOMContentLoaded', function() {
  // تنظیم رفتار تاگل منو در دستگاه‌های موبایل
  const menuToggle = document.getElementById('fluent-menu-toggle');
  const sidebar = document.querySelector('.fluent-sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
    });
  }
  
  // تنظیم رفتار کلیک بیرون از منو برای بستن منو در موبایل
  document.addEventListener('click', function(event) {
    if (sidebar && sidebar.classList.contains('show') && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
      sidebar.classList.remove('show');
    }
  });
  
  // تنظیم Tooltips
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseenter', function() {
      const tooltipText = this.getAttribute('data-tooltip');
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'fluent-tooltip';
      tooltipEl.textContent = tooltipText;
      
      document.body.appendChild(tooltipEl);
      
      const rect = this.getBoundingClientRect();
      tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
      tooltipEl.style.left = `${rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2)}px`;
      tooltipEl.classList.add('show');
      
      this.addEventListener('mouseleave', function() {
        tooltipEl.remove();
      }, { once: true });
    });
  });
  
  // تنظیم اعلان‌ها
  const alerts = document.querySelectorAll('.fluent-alert');
  
  alerts.forEach(alert => {
    const closeBtn = alert.querySelector('.fluent-alert-close');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.remove();
        }, 300);
      });
    }
  });
  
  // تنظیم مودال‌ها
  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal-target');
      const modal = document.getElementById(modalId);
      
      if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        const closeBtn = modal.querySelector('.fluent-modal-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
            document.body.style.overflow = '';
          });
        }
        
        modal.addEventListener('click', function(event) {
          if (event.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
          }
        });
      }
    });
  });
  
  // تنظیم تب‌ها
  const tabLists = document.querySelectorAll('.fluent-tabs');
  
  tabLists.forEach(tabList => {
    const tabs = tabList.querySelectorAll('.fluent-tab');
    const tabContents = document.querySelectorAll(`.fluent-tab-content[data-tab-group="${tabList.getAttribute('data-tab-group')}"]`);
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab-target');
        
        // فعال‌سازی تب
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // نمایش محتوای تب
        tabContents.forEach(content => {
          if (content.id === tabId) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
  });
  
  // تنظیم آکاردیون‌ها
  const accordionItems = document.querySelectorAll('.fluent-accordion-item');
  
  accordionItems.forEach(item => {
    const header = item.querySelector('.fluent-accordion-header');
    const content = item.querySelector('.fluent-accordion-content');
    
    if (header && content) {
      header.addEventListener('click', function() {
        item.classList.toggle('active');
        
        if (item.classList.contains('active')) {
          content.style.maxHeight = `${content.scrollHeight}px`;
        } else {
          content.style.maxHeight = '0';
        }
      });
    }
  });
  
  // تنظیم دراپ‌داون‌ها
  const dropdowns = document.querySelectorAll('.fluent-dropdown');
  
  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.fluent-dropdown-toggle');
    const menu = dropdown.querySelector('.fluent-dropdown-menu');
    
    if (trigger && menu) {
      trigger.addEventListener('click', function(event) {
        event.stopPropagation();
        menu.classList.toggle('show');
      });
      
      document.addEventListener('click', function(event) {
        if (!dropdown.contains(event.target)) {
          menu.classList.remove('show');
        }
      });
    }
  });
  
  // تنظیم مقدار انتخاب‌کننده‌ها
  const selects = document.querySelectorAll('.fluent-form-select');
  
  selects.forEach(select => {
    const valueElement = select.querySelector('.fluent-form-select-value');
    const options = select.querySelectorAll('.fluent-form-select-option');
    
    options.forEach(option => {
      option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        const text = this.textContent;
        
        options.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        
        if (valueElement) {
          valueElement.textContent = text;
          
          const input = select.querySelector('input[type="hidden"]');
          if (input) {
            input.value = value;
            
            // ایجاد رویداد تغییر برای فیلد مخفی
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
          }
        }
        
        select.classList.remove('open');
      });
    });
  });
});

/**
 * تابع نمایش پیغام‌های سیستمی
 * 
 * @param {string} message متن پیام
 * @param {string} type نوع پیام (success, warning, danger, info)
 * @param {number} duration مدت زمان نمایش به میلی‌ثانیه (اختیاری)
 */
function showMessage(message, type = 'info', duration = 5000) {
  const container = document.getElementById('fluent-messages-container');
  
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.id = 'fluent-messages-container';
    document.body.appendChild(newContainer);
  }
  
  const messageElement = document.createElement('div');
  messageElement.className = `fluent-message fluent-message-${type}`;
  messageElement.innerHTML = `
    <div class="fluent-message-content">${message}</div>
    <button class="fluent-message-close">&times;</button>
  `;
  
  document.getElementById('fluent-messages-container').appendChild(messageElement);
  
  setTimeout(() => {
    messageElement.classList.add('show');
  }, 10);
  
  if (duration > 0) {
    setTimeout(() => {
      hideMessage(messageElement);
    }, duration);
  }
  
  const closeButton = messageElement.querySelector('.fluent-message-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      hideMessage(messageElement);
    });
  }
}

/**
 * تابع مخفی کردن پیغام سیستمی
 * 
 * @param {Element} messageElement عنصر پیام
 */
function hideMessage(messageElement) {
  messageElement.classList.remove('show');
  
  setTimeout(() => {
    messageElement.remove();
    
    // حذف کانتینر اگر خالی است
    const container = document.getElementById('fluent-messages-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, 300);
}

/**
 * تابع نمایش دیالوگ تایید
 * 
 * @param {string} title عنوان دیالوگ
 * @param {string} message متن پیام
 * @param {Function} confirmCallback تابع فراخوانی در صورت تایید
 * @param {Function} cancelCallback تابع فراخوانی در صورت لغو (اختیاری)
 */
function showConfirmDialog(title, message, confirmCallback, cancelCallback = null) {
  const dialogId = 'fluent-confirm-dialog-' + Date.now();
  
  const dialogHTML = `
    <div id="${dialogId}" class="fluent-modal">
      <div class="fluent-modal-dialog">
        <div class="fluent-modal-header">
          <h3 class="fluent-modal-title">${title}</h3>
          <button type="button" class="fluent-modal-close">&times;</button>
        </div>
        <div class="fluent-modal-body">
          <p>${message}</p>
        </div>
        <div class="fluent-modal-footer">
          <button type="button" class="fluent-btn fluent-btn-outline fluent-confirm-cancel">انصراف</button>
          <button type="button" class="fluent-btn fluent-btn-primary fluent-confirm-ok">تایید</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', dialogHTML);
  
  const dialog = document.getElementById(dialogId);
  const closeBtn = dialog.querySelector('.fluent-modal-close');
  const cancelBtn = dialog.querySelector('.fluent-confirm-cancel');
  const confirmBtn = dialog.querySelector('.fluent-confirm-ok');
  
  function removeDialog() {
    document.body.style.overflow = '';
    dialog.classList.remove('show');
    
    setTimeout(() => {
      dialog.remove();
    }, 300);
  }
  
  closeBtn.addEventListener('click', function() {
    removeDialog();
    if (cancelCallback) cancelCallback();
  });
  
  cancelBtn.addEventListener('click', function() {
    removeDialog();
    if (cancelCallback) cancelCallback();
  });
  
  confirmBtn.addEventListener('click', function() {
    removeDialog();
    if (confirmCallback) confirmCallback();
  });
  
  dialog.addEventListener('click', function(event) {
    if (event.target === dialog) {
      removeDialog();
      if (cancelCallback) cancelCallback();
    }
  });
  
  setTimeout(() => {
    document.body.style.overflow = 'hidden';
    dialog.classList.add('show');
    confirmBtn.focus();
  }, 10);
}

/**
 * تابع پر کردن فرم با داده‌های API
 * 
 * @param {string} formSelector سلکتور CSS فرم
 * @param {Object} data داده‌های فرم
 */
function fillFormData(formSelector, data) {
  const form = document.querySelector(formSelector);
  
  if (!form || !data) return;
  
  // پر کردن ورودی‌ها
  const inputs = form.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    const name = input.name;
    
    if (name && data.hasOwnProperty(name)) {
      if (input.type === 'checkbox') {
        input.checked = Boolean(data[name]);
      } else if (input.type === 'radio') {
        input.checked = input.value === String(data[name]);
      } else if (input.tagName === 'SELECT') {
        for (let i = 0; i < input.options.length; i++) {
          if (input.options[i].value === String(data[name])) {
            input.options[i].selected = true;
            break;
          }
        }
      } else {
        input.value = data[name] || '';
      }
    }
  });
}