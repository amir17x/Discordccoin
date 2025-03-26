/**
 * Vision UI Dashboard - Micro Interactions (Simplified version)
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
  
  typewriterElements.forEach(function(element) {
    const text = element.textContent;
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.textContent = '|';
    
    // خالی کردن متن برای تایپ مجدد
    element.textContent = '';
    element.appendChild(cursor);
    
    // تایپ کردن کاراکتر به کاراکتر
    let i = 0;
    const typeInterval = setInterval(function() {
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
  
  fadeTextElements.forEach(function(element) {
    // تقسیم متن به پاراگراف‌ها
    const paragraphs = element.innerHTML.split('</p>');
    element.innerHTML = '';
    
    paragraphs.forEach(function(paragraph, index) {
      if (!paragraph.trim()) return;
      
      // اضافه کردن تگ p در صورت نیاز
      if (!paragraph.includes('<p>')) {
        paragraph = '<p>' + paragraph;
      }
      
      // ایجاد المان پاراگراف
      const p = document.createElement('div');
      p.innerHTML = paragraph;
      p.style.opacity = '0';
      p.style.transform = 'translateY(20px)';
      p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      p.style.transitionDelay = index * 0.2 + 's';
      
      element.appendChild(p);
      
      // نمایش پاراگراف با تاخیر
      setTimeout(function() {
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
      }, 100);
    });
  });
  
  // افکت برجسته کردن متن
  const highlightElements = document.querySelectorAll('.text-highlight');
  
  highlightElements.forEach(function(element) {
    const originalText = element.textContent;
    const highlightColor = element.dataset.highlightColor || 'var(--vui-primary)';
    
    // جایگزینی با اسپن‌های دارای کلاس برای انیمیشن
    let newHtml = '';
    for (let i = 0; i < originalText.length; i++) {
      const char = originalText[i];
      if (char === ' ') {
        newHtml += ' ';
      } else {
        newHtml += '<span class="highlight-char">' + char + '</span>';
      }
    }
    element.innerHTML = newHtml;
    
    // انیمیشن برجسته شدن کاراکترها
    const chars = element.querySelectorAll('.highlight-char');
    chars.forEach(function(char, index) {
      setTimeout(function() {
        char.style.color = highlightColor;
        char.style.textShadow = '0 0 5px ' + highlightColor + '40';
      }, index * 50);
    });
  });
  
  // افکت گرادینت شناور برای متن
  const gradientTextElements = document.querySelectorAll('.gradient-text');
  
  gradientTextElements.forEach(function(element) {
    if (!element.dataset.animated) {
      element.dataset.animated = 'true';
      
      // اضافه کردن انیمیشن CSS
      const style = document.createElement('style');
      style.textContent = 
        '@keyframes gradientFlow {\n' +
        '  0% { background-position: 0% 50%; }\n' +
        '  50% { background-position: 100% 50%; }\n' +
        '  100% { background-position: 0% 50%; }\n' +
        '}\n' +
        '\n' +
        '.gradient-text {\n' +
        '  background-size: 200% auto;\n' +
        '  background-clip: text;\n' +
        '  -webkit-background-clip: text;\n' +
        '  text-fill-color: transparent;\n' +
        '  -webkit-text-fill-color: transparent;\n' +
        '  animation: gradientFlow 3s ease infinite;\n' +
        '}\n' +
        '\n' +
        '.gradient-text-primary {\n' +
        '  background-image: var(--vui-primary-gradient);\n' +
        '}\n' +
        '\n' +
        '.gradient-text-info {\n' +
        '  background-image: var(--vui-info-gradient);\n' +
        '}\n' +
        '\n' +
        '.gradient-text-success {\n' +
        '  background-image: var(--vui-success-gradient);\n' +
        '}';
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
  
  cards.forEach(function(card) {
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
        setTimeout(function() {
          card.style.transform = 'scale(1)';
        }, 150);
      }
    });
  });
  
  // افکت شناور کارت‌های آمار
  const statCards = document.querySelectorAll('.vui-stat-card');
  
  statCards.forEach(function(card) {
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
        
        card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
      }
    });
    
    // بازگشت به حالت اولیه
    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
  
  // افکت پارالاکس برای هدرهای کارت
  const cardHeaders = document.querySelectorAll('.vui-card-header');
  
  cardHeaders.forEach(function(header) {
    if (header.classList.contains('parallax-header')) {
      const headerImage = header.querySelector('.header-background');
      if (headerImage) {
        // حرکت پس‌زمینه با اسکرول
        window.addEventListener('scroll', function() {
          const scrollPosition = window.scrollY;
          const headerRect = header.getBoundingClientRect();
          
          if (headerRect.top < window.innerHeight && headerRect.bottom > 0) {
            const scrollPercent = (headerRect.top / window.innerHeight);
            headerImage.style.transform = 'translateY(' + scrollPercent * 50 + 'px)';
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
  
  rippleButtons.forEach(function(button) {
    button.addEventListener('click', function(e) {
      // ایجاد المان موج
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      
      // تنظیم موقعیت و اندازه موج
      const buttonRect = this.getBoundingClientRect();
      const size = Math.max(buttonRect.width, buttonRect.height);
      const x = e.clientX - buttonRect.left - size / 2;
      const y = e.clientY - buttonRect.top - size / 2;
      
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      // اضافه کردن موج به دکمه
      this.appendChild(ripple);
      
      // حذف موج پس از پایان انیمیشن
      setTimeout(function() {
        ripple.remove();
      }, 600);
    });
  });
  
  // هاور افکت متریال برای کارت‌ها
  const materialCards = document.querySelectorAll('.card-material');
  
  materialCards.forEach(function(card) {
    const highlight = document.createElement('div');
    highlight.classList.add('card-highlight');
    card.appendChild(highlight);
    
    card.addEventListener('mousemove', function(e) {
      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;
      
      highlight.style.opacity = '0.1';
      highlight.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    });
    
    card.addEventListener('mouseleave', function() {
      highlight.style.opacity = '0';
    });
  });
  
  // افکت هاور برای آیکون‌ها
  const hoverIcons = document.querySelectorAll('.icon-hover');
  
  hoverIcons.forEach(function(icon) {
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
    const fadeObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(function(element) {
      element.classList.add('invisible');
      fadeObserver.observe(element);
    });
  } else {
    // Fallback برای مرورگرهای قدیمی
    fadeElements.forEach(function(element) {
      element.classList.add('visible');
    });
  }
  
  // انیمیشن slide-in از راست یا چپ
  const slideElements = document.querySelectorAll('.slide-on-scroll');
  
  if ('IntersectionObserver' in window) {
    const slideObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
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
    
    slideElements.forEach(function(element) {
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
  
  window.addEventListener('scroll', function() {
    parallaxElements.forEach(function(element) {
      const scrollPosition = window.scrollY;
      const elementTop = element.getBoundingClientRect().top + scrollPosition;
      const elementVisible = 150;
      const speed = element.dataset.speed || 0.5;
      
      if (scrollPosition > elementTop - window.innerHeight + elementVisible) {
        const distance = (scrollPosition - elementTop + window.innerHeight - elementVisible) * speed;
        element.style.transform = 'translateY(' + (distance * -1) + 'px)';
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
  
  floatingButtons.forEach(function(button) {
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
        
        element.style.transform = 'translateY(' + position + 'px)';
        requestAnimationFrame(animate);
      }
      
      animate();
    }
  });
  
  // افکت نئون گلو برای دکمه‌ها
  const neonButtons = document.querySelectorAll('.btn-neon');
  
  neonButtons.forEach(function(button) {
    const color = button.dataset.neonColor || 'var(--vui-primary)';
    
    button.addEventListener('mouseenter', function() {
      this.style.boxShadow = '0 0 15px ' + color + ', 0 0 30px ' + color + '50';
      this.style.textShadow = '0 0 5px ' + color;
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
  waveStyle.textContent = 
    '.btn-wave::before {\n' +
    '  content: \'\';\n' +
    '  position: absolute;\n' +
    '  top: 0;\n' +
    '  left: 0;\n' +
    '  width: 100%;\n' +
    '  height: 100%;\n' +
    '  background: linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 100%);\n' +
    '  transform: translateX(-100%);\n' +
    '  animation-duration: 1.5s;\n' +
    '  animation-timing-function: linear;\n' +
    '}\n' +
    '\n' +
    '@keyframes waveEffect {\n' +
    '  0% { transform: translateX(-100%); }\n' +
    '  100% { transform: translateX(100%); }\n' +
    '}';
  document.head.appendChild(waveStyle);
  
  waveButtons.forEach(function(button) {
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    
    button.addEventListener('mouseenter', function() {
      this.querySelectorAll('::before').forEach(function(el) {
        el.style.animationName = 'waveEffect';
      });
    });
    
    button.addEventListener('mouseleave', function() {
      this.querySelectorAll('::before').forEach(function(el) {
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
  
  formFields.forEach(function(field) {
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
  
  // توابع و قابلیت‌های دیگر فرم‌ها
  initMenuInteractions();
  initBackgroundEffects();
  initModalEffects();
  initDragAndDrop();
}

/**
 * راه‌اندازی افکت‌های منو و سایدبار
 */
function initMenuInteractions() {
  // پیاده‌سازی منوهای کشویی و تعاملات سایدبار
  console.log('Menu interactions initialized');
}

/**
 * راه‌اندازی افکت‌های پس‌زمینه
 */
function initBackgroundEffects() {
  // پیاده‌سازی افکت‌های پس‌زمینه انیمیشنی
  console.log('Background effects initialized');
}

/**
 * راه‌اندازی افکت‌های مودال
 */
function initModalEffects() {
  // پیاده‌سازی افکت‌های نمایش و بستن مودال‌ها
  console.log('Modal effects initialized');
}

/**
 * راه‌اندازی عملکرد دراگ و دراپ
 */
function initDragAndDrop() {
  // پیاده‌سازی قابلیت‌های دراگ و دراپ
  console.log('Drag and drop initialized');
}