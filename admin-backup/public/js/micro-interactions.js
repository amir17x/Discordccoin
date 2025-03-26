/**
 * Vision UI Dashboard - Micro Interactions
 * تعاملات کوچک و ظریف برای بهبود تجربه کاربری
 */

document.addEventListener('DOMContentLoaded', function() {
  // راه‌اندازی افکت‌های متن
  initTextEffects();
  
  // راه‌اندازی تعاملات کارت‌ها
  initCardInteractions();
  
  // راه‌اندازی افکت‌های هاور
  initHoverEffects();
  
  // راه‌اندازی انیمیشن‌های اسکرول
  initScrollAnimations();
  
  // راه‌اندازی افکت‌های دکمه
  initButtonEffects();
  
  // راه‌اندازی تعاملات فرم
  initFormInteractions();
  
  // راه‌اندازی افکت‌های منو و سایدبار
  initMenuInteractions();
  
  // راه‌اندازی افکت‌های پس‌زمینه
  initBackgroundEffects();
  
  // راه‌اندازی افکت‌های مودال
  initModalEffects();
  
  // راه‌اندازی عملکرد دراگ و دراپ
  initDragAndDrop();
});

/**
 * راه‌اندازی افکت‌های متن
 */
function initTextEffects() {
  // افکت نوشتن متن برای المان‌های با کلاس typewriter
  const typewriterElements = document.querySelectorAll('.typewriter');
  
  typewriterElements.forEach(element => {
    const text = element.textContent;
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.textContent = '|';
    
    // خالی کردن متن برای تایپ مجدد
    element.textContent = '';
    element.appendChild(cursor);
    
    // تایپ کردن کاراکتر به کاراکتر
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
        i++;
      } else {
        clearInterval(typeInterval);
        // اضافه کردن کلاس برای چشمک زدن نشانگر در پایان
        cursor.classList.add('blink');
      }
    }, 50);
  });
  
  // افکت فید این برای متن‌های طولانی
  const fadeTextElements = document.querySelectorAll('.text-fade-in');
  
  fadeTextElements.forEach(element => {
    // تقسیم متن به پاراگراف‌ها
    const paragraphs = element.innerHTML.split('</p>');
    element.innerHTML = '';
    
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph.trim()) return;
      
      // اضافه کردن تگ p در صورت نیاز
      if (!paragraph.includes('<p>')) {
        paragraph = `<p>${paragraph}`;
      }
      
      // ایجاد المان پاراگراف
      const p = document.createElement('div');
      p.innerHTML = paragraph;
      p.style.opacity = '0';
      p.style.transform = 'translateY(20px)';
      p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      p.style.transitionDelay = `${index * 0.2}s`;
      
      element.appendChild(p);
      
      // نمایش پاراگراف با تاخیر
      setTimeout(() => {
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
      }, 100);
    });
  });
  
  // افکت برجسته کردن متن
  const highlightElements = document.querySelectorAll('.text-highlight');
  
  highlightElements.forEach(element => {
    const originalText = element.textContent;
    const highlightColor = element.dataset.highlightColor || 'var(--vui-primary)';
    
    // جایگزینی با اسپن‌های دارای کلاس برای انیمیشن
    element.innerHTML = originalText.split('').map(char => {
      return char === ' ' ? ' ' : `<span class="highlight-char">${char}</span>`;
    }).join('');
    
    // انیمیشن برجسته شدن کاراکترها
    const chars = element.querySelectorAll('.highlight-char');
    chars.forEach((char, index) => {
      setTimeout(() => {
        char.style.color = highlightColor;
        char.style.textShadow = `0 0 5px ${highlightColor}40`;
      }, index * 50);
    });
  });
  
  // افکت گرادینت شناور برای متن
  const gradientTextElements = document.querySelectorAll('.gradient-text');
  
  gradientTextElements.forEach(element => {
    if (!element.dataset.animated) {
      element.dataset.animated = 'true';
      
      // اضافه کردن انیمیشن CSS
      const style = document.createElement('style');
      style.textContent = `
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .gradient-text {
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          text-fill-color: transparent;
          -webkit-text-fill-color: transparent;
          animation: gradientFlow 3s ease infinite;
        }
        
        .gradient-text-primary {
          background-image: var(--vui-primary-gradient);
        }
        
        .gradient-text-info {
          background-image: var(--vui-info-gradient);
        }
        
        .gradient-text-success {
          background-image: var(--vui-success-gradient);
        }
      `;
      document.head.appendChild(style);
    }
  });
}

/**
 * راه‌اندازی تعاملات کارت‌ها
 */
function initCardInteractions() {
  // افکت هاور کارت‌ها
  const cards = document.querySelectorAll('.vui-card');
  
  cards.forEach(card => {
    // افکت‌های ظریف هنگام هاور
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    });
    
    // افکت کلیک
    card.addEventListener('click', function() {
      if (this.classList.contains('card-clickable')) {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 150);
      }
    });
  });
  
  // افکت شناور کارت‌های آمار
  const statCards = document.querySelectorAll('.vui-stat-card');
  
  statCards.forEach(card => {
    // ایجاد افکت شناور بودن با حرکت موس
    card.addEventListener('mousemove', function(e) {
      if (!card.classList.contains('no-tilt')) {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // محاسبه میزان چرخش بر اساس فاصله از مرکز
        const rotateY = (mouseX - cardCenterX) * 0.02; // تا 5 درجه
        const rotateX = (cardCenterY - mouseY) * 0.02; // تا 5 درجه
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    });
    
    // بازگشت به حالت اولیه
    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
  
  // افکت پارالاکس برای هدرهای کارت
  const cardHeaders = document.querySelectorAll('.vui-card-header');
  
  cardHeaders.forEach(header => {
    if (header.classList.contains('parallax-header')) {
      const headerImage = header.querySelector('.header-background');
      if (headerImage) {
        // حرکت پس‌زمینه با اسکرول
        window.addEventListener('scroll', () => {
          const scrollPosition = window.scrollY;
          const headerRect = header.getBoundingClientRect();
          
          if (headerRect.top < window.innerHeight && headerRect.bottom > 0) {
            const scrollPercent = (headerRect.top / window.innerHeight);
            headerImage.style.transform = `translateY(${scrollPercent * 50}px)`;
          }
        });
      }
    }
  });
}

/**
 * راه‌اندازی افکت‌های هاور
 */
function initHoverEffects() {
  // افکت رپل (موج دایره‌ای) برای دکمه‌ها
  const rippleButtons = document.querySelectorAll('.btn-ripple');
  
  rippleButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      // ایجاد المان موج
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      
      // تنظیم موقعیت و اندازه موج
      const buttonRect = this.getBoundingClientRect();
      const size = Math.max(buttonRect.width, buttonRect.height);
      const x = e.clientX - buttonRect.left - size / 2;
      const y = e.clientY - buttonRect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      // اضافه کردن موج به دکمه
      this.appendChild(ripple);
      
      // حذف موج پس از پایان انیمیشن
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // هاور افکت متریال برای کارت‌ها
  const materialCards = document.querySelectorAll('.card-material');
  
  materialCards.forEach(card => {
    const highlight = document.createElement('div');
    highlight.classList.add('card-highlight');
    card.appendChild(highlight);
    
    card.addEventListener('mousemove', function(e) {
      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;
      
      highlight.style.opacity = '0.1';
      highlight.style.transform = `translate(${x}px, ${y}px)`;
    });
    
    card.addEventListener('mouseleave', function() {
      highlight.style.opacity = '0';
    });
  });
  
  // افکت هاور برای آیکون‌ها
  const hoverIcons = document.querySelectorAll('.icon-hover');
  
  hoverIcons.forEach(icon => {
    icon.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.2)';
      this.style.filter = 'drop-shadow(0 0 5px var(--vui-primary))';
    });
    
    icon.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.filter = 'none';
    });
  });
}

/**
 * راه‌اندازی انیمیشن‌های اسکرول
 */
function initScrollAnimations() {
  // انیمیشن fade-in هنگام اسکرول
  const fadeElements = document.querySelectorAll('.fade-on-scroll');
  
  // اگر Intersection Observer پشتیبانی شود
  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(element => {
      element.classList.add('invisible');
      fadeObserver.observe(element);
    });
  } else {
    // Fallback برای مرورگرهای قدیمی
    fadeElements.forEach(element => {
      element.classList.add('visible');
    });
  }
  
  // انیمیشن slide-in از راست یا چپ
  const slideElements = document.querySelectorAll('.slide-on-scroll');
  
  if ('IntersectionObserver' in window) {
    const slideObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('slide-from-right')) {
            entry.target.classList.add('slide-in-right');
          } else {
            entry.target.classList.add('slide-in-left');
          }
          slideObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    slideElements.forEach(element => {
      if (element.classList.contains('slide-from-right')) {
        element.classList.add('start-right');
      } else {
        element.classList.add('start-left');
      }
      slideObserver.observe(element);
    });
  }
  
  // پارالاکس اسکرول
  const parallaxElements = document.querySelectorAll('.parallax-scroll');
  
  window.addEventListener('scroll', () => {
    parallaxElements.forEach(element => {
      const scrollPosition = window.scrollY;
      const elementTop = element.getBoundingClientRect().top + scrollPosition;
      const elementVisible = 150;
      const speed = element.dataset.speed || 0.5;
      
      if (scrollPosition > elementTop - window.innerHeight + elementVisible) {
        const distance = (scrollPosition - elementTop + window.innerHeight - elementVisible) * speed;
        element.style.transform = `translateY(${distance * -1}px)`;
      }
    });
  });
}

/**
 * راه‌اندازی افکت‌های دکمه
 */
function initButtonEffects() {
  // افکت دکمه فلوتینگ
  const floatingButtons = document.querySelectorAll('.btn-floating');
  
  floatingButtons.forEach(button => {
    let isFloating = false;
    
    button.addEventListener('mouseenter', function() {
      isFloating = true;
      floatAnimation(button);
    });
    
    button.addEventListener('mouseleave', function() {
      isFloating = false;
    });
    
    function floatAnimation(element) {
      let position = 0;
      let direction = 1;
      
      function animate() {
        if (!isFloating) return;
        
        position += 0.3 * direction;
        
        if (position > 5) direction = -1;
        if (position < -5) direction = 1;
        
        element.style.transform = `translateY(${position}px)`;
        requestAnimationFrame(animate);
      }
      
      animate();
    }
  });
  
  // افکت نئون گلو برای دکمه‌ها
  const neonButtons = document.querySelectorAll('.btn-neon');
  
  neonButtons.forEach(button => {
    const color = button.dataset.neonColor || 'var(--vui-primary)';
    
    button.addEventListener('mouseenter', function() {
      this.style.boxShadow = `0 0 15px ${color}, 0 0 30px ${color}50`;
      this.style.textShadow = `0 0 5px ${color}`;
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.boxShadow = '';
      this.style.textShadow = '';
    });
  });
  
  // افکت دکمه‌های موج‌دار
  const waveButtons = document.querySelectorAll('.btn-wave');
  
  // ایجاد استایل CSS
  const waveStyle = document.createElement('style');
  waveStyle.textContent = `
    .btn-wave::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 100%);
      transform: translateX(-100%);
      animation-duration: 1.5s;
      animation-timing-function: linear;
    }
    
    @keyframes waveEffect {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(waveStyle);
  
  waveButtons.forEach(button => {
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    
    button.addEventListener('mouseenter', function() {
      this.querySelectorAll('::before').forEach(el => {
        el.style.animationName = 'waveEffect';
      });
    });
    
    button.addEventListener('mouseleave', function() {
      this.querySelectorAll('::before').forEach(el => {
        el.style.animationName = 'none';
      });
    });
  });
}

/**
 * راه‌اندازی تعاملات فرم
 */
function initFormInteractions() {
  // افکت گلو برای فیلدهای فرم
  const formFields = document.querySelectorAll('.vui-form-control');
  
  formFields.forEach(field => {
    const inputElement = field.querySelector('input, textarea, select');
    const label = field.querySelector('label');
    
    if (inputElement) {
      // افکت فوکوس
      inputElement.addEventListener('focus', function() {
        field.classList.add('focused');
        if (label) {
          label.classList.add('active');
        }
      });
      
      // حذف افکت در هنگام بلر
      inputElement.addEventListener('blur', function() {
        field.classList.remove('focused');
        if (this.value === '' && label) {
          label.classList.remove('active');
        }
      });
      
      // بررسی وضعیت اولیه
      if (inputElement.value !== '' && label) {
        label.classList.add('active');
      }
    }
  });
  
  // افکت والیدیشن زنده فرم
  const formInputs = document.querySelectorAll('.vui-form input[required], .vui-form select[required], .vui-form textarea[required]');
  
  formInputs.forEach(input => {
    input.addEventListener('input', function() {
      if (this.validity.valid) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      } else {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
      }
    });
  });
  
  // افکت تغییر وضعیت چک‌باکس‌ها
  const checkboxes = document.querySelectorAll('.vui-checkbox');
  
  checkboxes.forEach(checkbox => {
    const input = checkbox.querySelector('input[type="checkbox"]');
    const box = checkbox.querySelector('.checkbox-box');
    
    if (input && box) {
      input.addEventListener('change', function() {
        if (this.checked) {
          box.classList.add('checked');
        } else {
          box.classList.remove('checked');
        }
      });
      
      // تنظیم وضعیت اولیه
      if (input.checked) {
        box.classList.add('checked');
      }
    }
  });
  
  // افکت اسلایدر ریج با مقادیر
  const sliders = document.querySelectorAll('.vui-slider');
  
  sliders.forEach(slider => {
    const input = slider.querySelector('input[type="range"]');
    const valueDisplay = slider.querySelector('.slider-value') || document.createElement('span');
    
    if (!slider.querySelector('.slider-value')) {
      valueDisplay.className = 'slider-value';
      slider.appendChild(valueDisplay);
    }
    
    // بروزرسانی نمایش مقدار
    function updateValue() {
      const min = parseFloat(input.min) || 0;
      const max = parseFloat(input.max) || 100;
      const val = parseFloat(input.value);
      
      // محاسبه درصد برای موقعیت
      const percent = ((val - min) / (max - min)) * 100;
      valueDisplay.textContent = val;
      valueDisplay.style.left = `calc(${percent}% - 15px)`;
    }
    
    if (input) {
      input.addEventListener('input', updateValue);
      
      // تنظیم مقدار اولیه
      updateValue();
    }
  });
}

/**
 * راه‌اندازی افکت‌های منو و سایدبار
 */
function initMenuInteractions() {
  // افکت کلیک آیتم‌های منو
  const menuItems = document.querySelectorAll('.vui-sidebar-nav-item, .vui-nav-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      if (!this.classList.contains('active')) {
        // افکت ریپل برای آیتم منو
        const ripple = document.createElement('span');
        ripple.className = 'menu-item-ripple';
        this.appendChild(ripple);
        
        // حذف ریپل پس از انیمیشن
        setTimeout(() => {
          ripple.remove();
        }, 800);
      }
    });
  });
  
  // توگل سایدبار در موبایل
  const sidebarToggles = document.querySelectorAll('.sidebar-toggle');
  const sidebar = document.querySelector('.vui-sidebar');
  
  if (sidebar) {
    sidebarToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-open');
        
        // افکت انیمیشن همبرگر
        this.classList.toggle('open');
      });
    });
    
    // بستن سایدبار با کلیک خارج از آن در موبایل
    document.addEventListener('click', function(e) {
      if (document.body.classList.contains('sidebar-open') && 
          !e.target.closest('.vui-sidebar') &&
          !e.target.closest('.sidebar-toggle')) {
        document.body.classList.remove('sidebar-open');
        sidebarToggles.forEach(toggle => toggle.classList.remove('open'));
      }
    });
  }
  
  // زیرمنوهای کلیک شونده
  const subMenuToggleButtons = document.querySelectorAll('.submenu-toggle');
  
  subMenuToggleButtons.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = this.closest('.has-submenu');
      
      // توگل کلاس open برای پرنت
      if (parent) {
        parent.classList.toggle('open');
        
        // انیمیشن باز و بسته شدن
        const submenu = parent.querySelector('.submenu');
        if (submenu) {
          if (parent.classList.contains('open')) {
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
          } else {
            submenu.style.maxHeight = '0';
          }
        }
      }
    });
  });
}

/**
 * راه‌اندازی افکت‌های پس‌زمینه
 */
function initBackgroundEffects() {
  // افکت پارتیکل در پس‌زمینه
  const particleContainers = document.querySelectorAll('.particles-background');
  
  particleContainers.forEach(container => {
    if (!container.querySelector('.particles')) {
      // ایجاد کانتینر پارتیکل‌ها
      const particlesEl = document.createElement('div');
      particlesEl.className = 'particles';
      container.appendChild(particlesEl);
      
      // ایجاد پارتیکل‌ها
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // مقادیر تصادفی برای موقعیت و اندازه
        const size = Math.random() * 5 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 20 + 10;
        
        // تنظیم استایل
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        // رنگ تصادفی از تم
        const colors = [
          'var(--vui-primary)',
          'var(--vui-info)',
          'var(--vui-success)',
          'var(--vui-warning)'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = color;
        
        particlesEl.appendChild(particle);
      }
    }
  });
  
  // افکت موج در پس‌زمینه
  const waveContainers = document.querySelectorAll('.wave-background');
  
  waveContainers.forEach(container => {
    if (!container.querySelector('.wave')) {
      // ایجاد چند لایه موج
      for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = `wave wave-${i+1}`;
        container.appendChild(wave);
      }
    }
  });
  
  // افکت گرادینت متحرک
  const gradientBackgrounds = document.querySelectorAll('.gradient-background');
  
  gradientBackgrounds.forEach(element => {
    // اضافه کردن انیمیشن CSS
    element.style.backgroundSize = '400% 400%';
    element.style.animation = 'gradientAnimation 15s ease infinite';
    
    // ایجاد کلاس CSS اگر وجود ندارد
    if (!document.getElementById('gradient-bg-animation')) {
      const style = document.createElement('style');
      style.id = 'gradient-bg-animation';
      style.textContent = `
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `;
      document.head.appendChild(style);
    }
  });
  
  // افکت گلس مورفیسم
  const glassmorphismElements = document.querySelectorAll('.glassmorphism');
  
  glassmorphismElements.forEach(element => {
    // اعمال افکت روی هاور
    element.addEventListener('mouseenter', function() {
      const intensity = this.dataset.intensity || '10';
      this.style.backdropFilter = `blur(${intensity}px)`;
      this.style.webkitBackdropFilter = `blur(${intensity}px)`;
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.backdropFilter = 'blur(5px)';
      this.style.webkitBackdropFilter = 'blur(5px)';
    });
  });
}

/**
 * راه‌اندازی افکت‌های مودال
 */
function initModalEffects() {
  // افکت باز و بسته شدن مودال
  const modalOpenButtons = document.querySelectorAll('[data-toggle="modal"]');
  const modals = document.querySelectorAll('.vui-modal');
  
  // ایجاد backdrop اگر وجود ندارد
  if (!document.querySelector('.modal-backdrop')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
  }
  
  const backdrop = document.querySelector('.modal-backdrop');
  
  // انیمیشن باز کردن مودال
  modalOpenButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const modal = document.querySelector(targetId);
      
      if (modal) {
        // نمایش backdrop با انیمیشن
        backdrop.style.display = 'block';
        setTimeout(() => {
          backdrop.style.opacity = '1';
        }, 10);
        
        // نمایش مودال با انیمیشن
        modal.style.display = 'block';
        setTimeout(() => {
          modal.classList.add('show');
        }, 10);
        
        // اضافه کردن کلاس به body
        document.body.classList.add('modal-open');
      }
    });
  });
  
  // انیمیشن بسته شدن مودال
  const modalCloseButtons = document.querySelectorAll('[data-dismiss="modal"], .vui-modal .close');
  
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.vui-modal');
      
      if (modal) {
        // انیمیشن بسته شدن
        modal.classList.remove('show');
        backdrop.style.opacity = '0';
        
        // مخفی کردن پس از پایان انیمیشن
        setTimeout(() => {
          modal.style.display = 'none';
          backdrop.style.display = 'none';
          document.body.classList.remove('modal-open');
        }, 300);
      }
    });
  });
  
  // بستن مودال با کلیک روی backdrop
  backdrop.addEventListener('click', function() {
    const openModal = document.querySelector('.vui-modal.show');
    
    if (openModal) {
      openModal.classList.remove('show');
      backdrop.style.opacity = '0';
      
      setTimeout(() => {
        openModal.style.display = 'none';
        backdrop.style.display = 'none';
        document.body.classList.remove('modal-open');
      }, 300);
    }
  });
  
  // جلوگیری از بسته شدن مودال با کلیک داخل آن
  modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
        backdrop.style.opacity = '0';
        
        setTimeout(() => {
          this.style.display = 'none';
          backdrop.style.display = 'none';
          document.body.classList.remove('modal-open');
        }, 300);
      }
    });
    
    modal.querySelector('.modal-content')?.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
}

/**
 * راه‌اندازی عملکرد دراگ و دراپ
 */
function initDragAndDrop() {
  const draggableElements = document.querySelectorAll('.draggable');
  
  draggableElements.forEach(element => {
    element.setAttribute('draggable', 'true');
    
    element.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', this.id);
      this.classList.add('dragging');
      
      // تغییر ظاهر المان هنگام درگ
      setTimeout(() => {
        this.style.opacity = '0.5';
      }, 0);
    });
    
    element.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      this.style.opacity = '1';
    });
  });
  
  const dropZones = document.querySelectorAll('.drop-zone');
  
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });
    
    zone.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });
    
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      
      const draggedElementId = e.dataTransfer.getData('text/plain');
      const draggedElement = document.getElementById(draggedElementId);
      
      if (draggedElement && this.classList.contains('accepts-drop')) {
        this.appendChild(draggedElement);
        
        // فراخوانی تابع پیکربندی برای اطلاع از تغییر
        if (window.droppedCallback && typeof window.droppedCallback === 'function') {
          window.droppedCallback(draggedElementId, this.id);
        }
      }
    });
  });
}

/**
 * کلاسی برای ایجاد نوتیفیکیشن‌ها
 */
class VisionNotification {
  /**
   * ایجاد نوتیفیکیشن جدید
   * @param {string} message - پیام نوتیفیکیشن
   * @param {string} type - نوع نوتیفیکیشن (success, error, warning, info)
   * @param {object} options - گزینه‌های اضافی
   */
  constructor(message, type = 'info', options = {}) {
    // تنظیمات پیش‌فرض
    this.options = {
      duration: 3000,
      position: 'top-right',
      closable: true,
      ...options
    };
    
    this.message = message;
    this.type = type;
    
    // ایجاد کانتینر نوتیفیکیشن‌ها اگر وجود ندارد
    this.ensureContainer();
    
    // ایجاد و نمایش نوتیفیکیشن
    this.create();
  }
  
  /**
   * اطمینان از وجود کانتینر برای نوتیفیکیشن‌ها
   */
  ensureContainer() {
    const containerId = `notification-container-${this.options.position}`;
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = `notification-container ${this.options.position}`;
      document.body.appendChild(container);
    }
    
    this.container = container;
  }
  
  /**
   * ایجاد المان نوتیفیکیشن
   */
  create() {
    // ایجاد المان اصلی
    const notification = document.createElement('div');
    notification.className = `vui-notification notification-${this.type}`;
    
    // آیکون مناسب
    let icon = '';
    switch (this.type) {
      case 'success':
        icon = '<i class="bi bi-check-circle-fill"></i>';
        break;
      case 'error':
        icon = '<i class="bi bi-x-circle-fill"></i>';
        break;
      case 'warning':
        icon = '<i class="bi bi-exclamation-triangle-fill"></i>';
        break;
      case 'info':
      default:
        icon = '<i class="bi bi-info-circle-fill"></i>';
        break;
    }
    
    // ساختار داخلی
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">${this.message}</div>
      ${this.options.closable ? '<div class="notification-close"><i class="bi bi-x"></i></div>' : ''}
      <div class="notification-progress"></div>
    `;
    
    // اضافه کردن به کانتینر
    this.container.appendChild(notification);
    this.notificationElement = notification;
    
    // انیمیشن ورود
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // تنظیم تایمر برای حذف اتوماتیک
    if (this.options.duration > 0) {
      const progress = notification.querySelector('.notification-progress');
      progress.style.animationDuration = `${this.options.duration}ms`;
      progress.classList.add('active');
      
      this.timeout = setTimeout(() => {
        this.dismiss();
      }, this.options.duration);
    }
    
    // رویداد برای دکمه بستن
    if (this.options.closable) {
      const closeButton = notification.querySelector('.notification-close');
      closeButton.addEventListener('click', () => {
        this.dismiss();
      });
    }
    
    // توقف تایمر با هاور
    notification.addEventListener('mouseenter', () => {
      if (this.timeout) {
        clearTimeout(this.timeout);
        const progress = notification.querySelector('.notification-progress');
        progress.style.animationPlayState = 'paused';
      }
    });
    
    // ادامه تایمر پس از پایان هاور
    notification.addEventListener('mouseleave', () => {
      if (this.options.duration > 0) {
        const progress = notification.querySelector('.notification-progress');
        progress.style.animationPlayState = 'running';
        
        this.timeout = setTimeout(() => {
          this.dismiss();
        }, this.options.duration / 2);
      }
    });
  }
  
  /**
   * حذف نوتیفیکیشن با انیمیشن
   */
  dismiss() {
    if (this.notificationElement) {
      this.notificationElement.classList.remove('show');
      this.notificationElement.classList.add('hide');
      
      setTimeout(() => {
        if (this.notificationElement && this.notificationElement.parentNode) {
          this.notificationElement.parentNode.removeChild(this.notificationElement);
        }
      }, 300);
    }
    
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
  
  /**
   * ایجاد نوتیفیکیشن موفقیت
   * @param {string} message - پیام نوتیفیکیشن
   * @param {object} options - گزینه‌های اضافی
   */
  static success(message, options = {}) {
    return new VisionNotification(message, 'success', options);
  }
  
  /**
   * ایجاد نوتیفیکیشن خطا
   * @param {string} message - پیام نوتیفیکیشن
   * @param {object} options - گزینه‌های اضافی
   */
  static error(message, options = {}) {
    return new VisionNotification(message, 'error', options);
  }
  
  /**
   * ایجاد نوتیفیکیشن هشدار
   * @param {string} message - پیام نوتیفیکیشن
   * @param {object} options - گزینه‌های اضافی
   */
  static warning(message, options = {}) {
    return new VisionNotification(message, 'warning', options);
  }
  
  /**
   * ایجاد نوتیفیکیشن اطلاعات
   * @param {string} message - پیام نوتیفیکیشن
   * @param {object} options - گزینه‌های اضافی
   */
  static info(message, options = {}) {
    return new VisionNotification(message, 'info', options);
  }
}

// افزودن به window برای دسترسی جهانی
window.VisionNotification = VisionNotification;

// افزودن متدها به window برای دسترسی مستقیم
window.visionUiEffects = {
  initTextEffects: initTextEffects,
  initCardInteractions: initCardInteractions,
  initHoverEffects: initHoverEffects,
  initScrollAnimations: initScrollAnimations,
  initButtonEffects: initButtonEffects,
  initFormInteractions: initFormInteractions,
  initMenuInteractions: initMenuInteractions,
  initBackgroundEffects: initBackgroundEffects,
  initModalEffects: initModalEffects,
  initDragAndDrop: initDragAndDrop
};