/**
 * فایل اصلی JavaScript برای پنل مدیریت Ccoin
 */

document.addEventListener('DOMContentLoaded', function() {
  // ----- تنظیمات عمومی -----
  initializeTooltips();
  handleSidebarToggle();
  setupFilterTables();
  initializeDataTables();
  handleFormValidation();
  setupThemeToggle();
  
  // ----- عملیات‌های اختصاصی صفحات -----
  setupDashboardCharts();
  setupUserEvents();
  setupItemEvents();
  setupClanEvents();
  setupQuestEvents();
  setupSettingsEvents();
});

/**
 * راه‌اندازی تولتیپ‌ها
 */
function initializeTooltips() {
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltips.length > 0) {
    tooltips.forEach(tooltip => {
      new bootstrap.Tooltip(tooltip);
    });
  }
}

/**
 * مدیریت منوی کناری
 */
function handleSidebarToggle() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebarCloseBtn = document.querySelector('.btn-sidebar-close');
  const sidebar = document.querySelector('.sidebar');
  const contentWrapper = document.querySelector('.content-wrapper');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', function() {
      sidebar.classList.add('show');
      if (contentWrapper) contentWrapper.classList.add('blur');
      document.body.style.overflow = 'hidden';
    });
  }

  if (sidebarCloseBtn && sidebar) {
    sidebarCloseBtn.addEventListener('click', function() {
      sidebar.classList.remove('show');
      if (contentWrapper) contentWrapper.classList.remove('blur');
      document.body.style.overflow = '';
    });
  }

  document.addEventListener('click', function(event) {
    if (sidebar && sidebar.classList.contains('show') && 
        !sidebar.contains(event.target) && 
        mobileToggle && !mobileToggle.contains(event.target)) {
      sidebar.classList.remove('show');
      if (contentWrapper) contentWrapper.classList.remove('blur');
      document.body.style.overflow = '';
    }
  });
}

/**
 * راه‌اندازی فیلترهای جدول
 */
function setupFilterTables() {
  // انتخاب‌کننده دسته‌بندی
  const categoryFilters = document.querySelectorAll('.category-filter');
  categoryFilters.forEach(filter => {
    filter.addEventListener('change', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // دکمه‌های فیلتر وضعیت
  const statusFilters = document.querySelectorAll('.status-filter-btn');
  statusFilters.forEach(btn => {
    btn.addEventListener('click', function() {
      const filterButtons = this.parentNode.querySelectorAll('.status-filter-btn');
      filterButtons.forEach(button => button.classList.remove('active'));
      this.classList.add('active');
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // جستجو
  const searchInputs = document.querySelectorAll('.search-filter');
  searchInputs.forEach(input => {
    input.addEventListener('keyup', function() {
      applyFilters(this.getAttribute('data-table'));
    });
  });

  // دکمه‌های بازنشانی فیلتر
  const resetButtons = document.querySelectorAll('.reset-filters');
  resetButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      resetFilters(this.getAttribute('data-table'));
    });
  });
}

/**
 * اعمال فیلترها به جدول
 */
function applyFilters(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  const searchInput = document.querySelector(`.search-filter[data-table="${tableId}"]`);
  const categoryFilter = document.querySelector(`.category-filter[data-table="${tableId}"]`);
  const statusFilter = document.querySelector(`.status-filter-btn.active[data-table="${tableId}"]`);

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const category = categoryFilter ? categoryFilter.value : 'all';
  const status = statusFilter ? statusFilter.getAttribute('data-status') : 'all';

  rows.forEach(row => {
    let showRow = true;

    // اعمال فیلتر جستجو
    if (searchTerm) {
      const text = row.textContent.toLowerCase();
      showRow = text.includes(searchTerm);
    }

    // اعمال فیلتر دسته‌بندی
    if (showRow && category !== 'all') {
      const rowCategory = row.getAttribute('data-category');
      showRow = rowCategory === category;
    }

    // اعمال فیلتر وضعیت
    if (showRow && status !== 'all') {
      const rowStatus = row.getAttribute('data-status');
      showRow = rowStatus === status;
    }

    row.style.display = showRow ? '' : 'none';
  });

  updateFilterCounts(tableId);
}

/**
 * بازنشانی فیلترهای جدول
 */
function resetFilters(tableId) {
  const searchInput = document.querySelector(`.search-filter[data-table="${tableId}"]`);
  const categoryFilter = document.querySelector(`.category-filter[data-table="${tableId}"]`);
  const statusFilters = document.querySelectorAll(`.status-filter-btn[data-table="${tableId}"]`);
  const allStatusBtn = document.querySelector(`.status-filter-btn[data-table="${tableId}"][data-status="all"]`);

  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = 'all';
  
  if (statusFilters.length > 0) {
    statusFilters.forEach(btn => btn.classList.remove('active'));
    if (allStatusBtn) allStatusBtn.classList.add('active');
  }

  const table = document.getElementById(tableId);
  if (table) {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.style.display = '';
    });
  }

  updateFilterCounts(tableId);
}

/**
 * بروزرسانی تعداد آیتم‌های فیلتر شده
 */
function updateFilterCounts(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const totalCount = table.querySelectorAll('tbody tr').length;
  const visibleCount = table.querySelectorAll('tbody tr[style=""]').length;
  const countDisplay = document.querySelector(`.filter-count[data-table="${tableId}"]`);
  
  if (countDisplay) {
    countDisplay.textContent = `نمایش ${visibleCount} از ${totalCount}`;
  }
}

/**
 * راه‌اندازی DataTables برای جداول
 */
function initializeDataTables() {
  const dataTables = document.querySelectorAll('.datatable');
  if (dataTables.length > 0 && typeof $.fn.DataTable !== 'undefined') {
    dataTables.forEach(table => {
      $(table).DataTable({
        "responsive": true,
        "language": {
          "search": "جستجو:",
          "lengthMenu": "نمایش _MENU_ مورد در هر صفحه",
          "zeroRecords": "موردی یافت نشد",
          "info": "نمایش _START_ تا _END_ از _TOTAL_ مورد",
          "infoEmpty": "هیچ موردی موجود نیست",
          "infoFiltered": "(فیلتر شده از _MAX_ مورد)",
          "paginate": {
            "first": "اولین",
            "last": "آخرین",
            "next": "بعدی",
            "previous": "قبلی"
          }
        }
      });
    });
  }
}

/**
 * بررسی اعتبارسنجی فرم‌ها
 */
function handleFormValidation() {
  const forms = document.querySelectorAll('.needs-validation');
  
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * تنظیم کلید تغییر تم روشن/تاریک
 */
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  const currentTheme = localStorage.getItem('admin-theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggle.checked = currentTheme === 'dark';
  
  themeToggle.addEventListener('change', function() {
    const theme = this.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  });
}

/**
 * راه‌اندازی نمودارهای داشبورد
 */
function setupDashboardCharts() {
  setupActiveUsersChart();
  setupGamesChart();
  setupTransactionsChart();
  setupEconomyPieChart();
}

/**
 * نمودار کاربران فعال
 */
function setupActiveUsersChart() {
  const chartElement = document.getElementById('activeUsersChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  // اطلاعات نمودار از API یا داده‌های سرور لود می‌شود
  // این بخش به اطلاعات واقعی نیاز دارد
}

/**
 * نمودار بازی‌های انجام شده
 */
function setupGamesChart() {
  const chartElement = document.getElementById('gamesChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  // اطلاعات نمودار از API یا داده‌های سرور لود می‌شود
  // این بخش به اطلاعات واقعی نیاز دارد
}

/**
 * نمودار تراکنش‌ها
 */
function setupTransactionsChart() {
  const chartElement = document.getElementById('transactionsChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  // اطلاعات نمودار از API یا داده‌های سرور لود می‌شود
  // این بخش به اطلاعات واقعی نیاز دارد
}

/**
 * نمودار توزیع اقتصادی
 */
function setupEconomyPieChart() {
  const chartElement = document.getElementById('economyPieChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  // اطلاعات نمودار از API یا داده‌های سرور لود می‌شود
  // این بخش به اطلاعات واقعی نیاز دارد
}

/**
 * تنظیم رویدادهای صفحه کاربران
 */
function setupUserEvents() {
  // دکمه‌های مدیریت کاربر
  setupUserActionButtons();
  
  // فرم افزودن موجودی
  setupAddCoinsForm();
  
  // نمودار فعالیت کاربر
  setupUserActivityChart();
}

/**
 * تنظیم دکمه‌های عملیات کاربر
 */
function setupUserActionButtons() {
  // دکمه مسدودیت
  const banButtons = document.querySelectorAll('.ban-user-btn');
  banButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      const username = this.getAttribute('data-username');
      
      if (confirm(`آیا از مسدود کردن کاربر "${username}" اطمینان دارید؟`)) {
        // ارسال درخواست به سرور
        // این بخش به پیاده‌سازی API نیاز دارد
      }
    });
  });
  
  // دکمه رفع مسدودیت
  const unbanButtons = document.querySelectorAll('.unban-user-btn');
  unbanButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      const username = this.getAttribute('data-username');
      
      if (confirm(`آیا از رفع مسدودیت کاربر "${username}" اطمینان دارید؟`)) {
        // ارسال درخواست به سرور
        // این بخش به پیاده‌سازی API نیاز دارد
      }
    });
  });
}

/**
 * تنظیم فرم افزودن موجودی
 */
function setupAddCoinsForm() {
  const addCoinsForm = document.getElementById('add-coins-form');
  if (!addCoinsForm) return;
  
  addCoinsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userId = this.querySelector('input[name="userId"]').value;
    const amount = this.querySelector('input[name="amount"]').value;
    const reason = this.querySelector('input[name="reason"]').value;
    
    // ارسال درخواست به سرور
    // این بخش به پیاده‌سازی API نیاز دارد
    
    // نمایش پیام موفقیت
    showNotification('موجودی با موفقیت افزوده شد.', 'success');
  });
}

/**
 * تنظیم نمودار فعالیت کاربر
 */
function setupUserActivityChart() {
  const chartElement = document.getElementById('userActivityChart');
  if (!chartElement || typeof Chart === 'undefined') return;
  
  // اطلاعات نمودار از API یا داده‌های سرور لود می‌شود
  // این بخش به اطلاعات واقعی نیاز دارد
}

/**
 * تنظیم رویدادهای صفحه آیتم‌ها
 */
function setupItemEvents() {
  // فرم ایجاد آیتم جدید
  const createItemForm = document.getElementById('create-item-form');
  if (createItemForm) {
    createItemForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('آیتم جدید با موفقیت ایجاد شد.', 'success');
    });
  }
  
  // دکمه‌های ویرایش آیتم
  const editItemButtons = document.querySelectorAll('.edit-item-btn');
  editItemButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = this.getAttribute('data-item-id');
      
      // لود اطلاعات آیتم و نمایش در مودال
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش مودال ویرایش
      const editModal = document.getElementById('editItemModal');
      if (editModal) {
        const bsModal = new bootstrap.Modal(editModal);
        bsModal.show();
      }
    });
  });
}

/**
 * تنظیم رویدادهای صفحه کلن‌ها
 */
function setupClanEvents() {
  // فرم مدیریت اعضای کلن
  const manageMemebersForm = document.getElementById('manage-clan-members-form');
  if (manageMemebersForm) {
    manageMemebersForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('تغییرات اعضای کلن با موفقیت ذخیره شد.', 'success');
    });
  }
}

/**
 * تنظیم رویدادهای صفحه ماموریت‌ها
 */
function setupQuestEvents() {
  // فرم ایجاد ماموریت جدید
  const createQuestForm = document.getElementById('create-quest-form');
  if (createQuestForm) {
    createQuestForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('ماموریت جدید با موفقیت ایجاد شد.', 'success');
    });
  }
}

/**
 * تنظیم رویدادهای صفحه تنظیمات
 */
function setupSettingsEvents() {
  // فرم تنظیمات عمومی
  const generalSettingsForm = document.getElementById('general-settings-form');
  if (generalSettingsForm) {
    generalSettingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('تنظیمات با موفقیت ذخیره شد.', 'success');
    });
  }
  
  // فرم تنظیمات اقتصادی
  const economySettingsForm = document.getElementById('economy-settings-form');
  if (economySettingsForm) {
    economySettingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جمع‌آوری اطلاعات فرم
      const formData = new FormData(this);
      
      // ارسال درخواست به سرور
      // این بخش به پیاده‌سازی API نیاز دارد
      
      // نمایش پیام موفقیت
      showNotification('تنظیمات اقتصادی با موفقیت ذخیره شد.', 'success');
    });
  }
}

/**
 * نمایش پیام اعلان
 * @param {string} message متن پیام
 * @param {string} type نوع پیام (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  // نمایش پیام با استفاده از توست بوت‌استرپ
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    // ایجاد کانتینر توست اگر وجود ندارد
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }
  
  const toastId = 'toast-' + Date.now();
  const toastHTML = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header bg-${type} text-white">
        <strong class="me-auto">${type === 'success' ? 'موفقیت' : type === 'error' ? 'خطا' : type === 'warning' ? 'هشدار' : 'اطلاعات'}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;
  
  document.getElementById('toast-container').insertAdjacentHTML('beforeend', toastHTML);
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
  toast.show();
  
  // حذف توست پس از بسته شدن
  toastElement.addEventListener('hidden.bs.toast', function() {
    this.remove();
  });
}