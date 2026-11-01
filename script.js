/* ============================================================
   Jana's Interactive Portfolio — Book Flip Logic
   يدعم: النقر على الأسهم، السحب بالزاوية (ماوس ولمس)،
   الانتقال المباشر من الصفحة الأولى، لوحة المفاتيح،
   الظهور التدريجي عند التمرير، وإخفاء أزرار التنقل عند التمرير.
   ============================================================ */

(function () {
  'use strict';

  // علامة تفعيل الجافاسكريبت:
  // عناصر التظاهر مخفية فقط عندما يكون هذا الصنف موجوداً —
  // إذا تعطل الجافاسكريبت يظل كل المحتوى ظاراً وقابلاً للوصول.
  document.documentElement.classList.add('js');

  // ------------------- العناصر -------------------
  const book = document.getElementById('book');
  const turner = document.getElementById('turner');
  const turnFront = turner.querySelector('.turn-front');
  const turnBack = turner.querySelector('.turn-back');
  const turnShadow = turner.querySelector('.turn-shadow');
  const indicator = document.getElementById('indicator');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const hint = document.getElementById('hint');

  if (!book || !turner || !indicator || !btnPrev || !btnNext) {
    console.error('JP: بعض عناصر الكتاب مفقودة في HTML');
    return;
  }

  const TOTAL_PAGES = 4;
  let currentPage = 1;
  let isFlipping = false;

  // تفضيل تقليل الحركة من الجهاز
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------- مدة الحركة -------------------
  const FLIP_DURATION = 650; // مللي ثانية

  // ------------------- إعادة تعيين طبقة التقليب -------------------
  function resetTurner() {
    turner.style.transition = 'none';
    turner.style.transform = 'rotateY(0deg)';
    turner.style.opacity = '0';
    turner.style.pointerEvents = 'none';
    turnShadow.style.opacity = '0';
  }

  // ------------------- إكمال التقليب -------------------
  function finishFlip(currentEl, nextEl, targetPage) {
    currentEl.style.opacity = '0';
    currentEl.classList.remove('page--active');
    currentEl.style.zIndex = '1';

    nextEl.style.opacity = '1';
    nextEl.classList.add('page--active');
    nextEl.style.zIndex = '5';

    resetTurner();

    currentPage = targetPage;
    isFlipping = false;
    updateUI();

    // إظهار أزرار التنقل عند قلب صفحة جديدة
    showNavButtons();

    // إعادة تفعيل مراقبة الظهور التدريجي وإخفاء الأزرار للصفحة الجديدة
    initScrollRevealForPage(nextEl);
    initScrollHideNav();
  }

  // ------------------- عرض صفحة -------------------
  function showPage(targetPage, animate = true) {
    if (isFlipping) {
      console.log('JP: refusing flip — already flipping');
      return;
    }
    if (targetPage < 1 || targetPage > TOTAL_PAGES) {
      console.log('JP: refusing flip — out of bounds', targetPage);
      return;
    }
    if (targetPage === currentPage) {
      console.log('JP: refusing flip — same page', targetPage);
      return;
    }

    const dir = targetPage > currentPage ? 1 : -1;
    const currentEl = document.getElementById('page-' + currentPage);
    const nextEl = document.getElementById('page-' + targetPage);

    if (!currentEl || !nextEl) {
      console.error('JP: page element missing', currentPage, targetPage);
      return;
    }

    // لون خلفية الكتاب يطابق الصفحة القادمة
    book.className = 'book book--p' + targetPage;

    // ألوان وجهي طبقة التقليب
    turnFront.style.backgroundColor = getComputedStyle(currentEl).backgroundColor;
    turnBack.style.backgroundColor = getComputedStyle(nextEl).backgroundColor;

    // تجهيز الصفحة القادمة تحت الطبقة
    nextEl.style.zIndex = '3';
    nextEl.style.opacity = '0';
    nextEl.classList.add('page--active');
    currentEl.classList.remove('page--active');
    currentEl.style.zIndex = '4';

    isFlipping = true;
    turner.style.opacity = '1';
    turner.style.pointerEvents = 'auto';
    turnShadow.style.opacity = '0.7';

    if (animate && !prefersReducedMotion) {
      const deg = dir * 180;
      turner.style.transition = `transform ${FLIP_DURATION}ms cubic-bezier(0.35, 0, 0.65, 1)`;
      turner.style.transform = `rotateY(${deg}deg)`;

      // كشف الصفحة القادمة في منتصف الحركة
      setTimeout(() => {
        nextEl.style.opacity = '1';
        nextEl.style.zIndex = '5';
        currentEl.style.zIndex = '2';
        turnShadow.style.opacity = '0.3';
      }, Math.round(FLIP_DURATION / 2));

      // انتهاء الحركة عبر transitionend مع حماية timeout
      let ended = false;
      const onEnd = () => {
        if (ended) return;
        ended = true;
        turner.removeEventListener('transitionend', onEnd);
        finishFlip(currentEl, nextEl, targetPage);
      };
      turner.addEventListener('transitionend', onEnd, { once: true });

      // حماية: إذا لم يُطلق transitionend لأي سبب، נחפר بعد مدة الحركة + 100ms
      setTimeout(() => {
        if (!ended) {
          ended = true;
          turner.removeEventListener('transitionend', onEnd);
          console.log('JP: fallback flip complete', targetPage);
          finishFlip(currentEl, nextEl, targetPage);
        }
      }, FLIP_DURATION + 100);
    } else {
      // بدون حركة (تقليل حركة أو فوري)
      finishFlip(currentEl, nextEl, targetPage);
      resetTurner();
    }
  }

  // ------------------- تحديث واجهة -------------------
  function updateUI() {
    indicator.textContent =
      String(currentPage).padStart(2, '0') + ' / ' + String(TOTAL_PAGES).padStart(2, '0');

    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= TOTAL_PAGES;

    document.querySelectorAll('.page').forEach((p, i) => {
      p.tabIndex = i + 1 === currentPage ? 0 : -1;
    });
  }

  // ------------------- إظهار/إخفاء أزرار التنقل -------------------
  function showNavButtons() {
    btnPrev.classList.remove('nav-btn-hidden');
    btnNext.classList.remove('nav-btn-hidden');
  }

  function hideNavButtons() {
    btnPrev.classList.add('nav-btn-hidden');
    btnNext.classList.add('nav-btn-hidden');
  }

  // ------------------- أزرار التنقل -------------------
  function setupButtons() {
    btnPrev.addEventListener('click', () => {
      console.log('JP: prev clicked, currentPage =', currentPage);
      showPage(currentPage - 1, true);
    });
    btnNext.addEventListener('click', () => {
      console.log('JP: next clicked, currentPage =', currentPage);
      showPage(currentPage + 1, true);
    });
  }

  // ------------------- روابط المشاريع المباشرة من الصفحة الأولى -------------------
  function setupDirectLinks() {
    document.querySelectorAll('a[data-goto]').forEach((link) => {
      link.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        const target = parseInt(link.getAttribute('data-goto'), 10);
        if (!isNaN(target) && target >= 1 && target <= TOTAL_PAGES) {
          showPage(target, true);
        }
      });
    });
  }

  // ------------------- منع الروابط الخارجية (وميلتوع) من تشغيل التقليب -------------------
  function setupExternalLinks() {
    document.querySelectorAll('a[href^="http"], a[href^="mailto"]').forEach((link) => {
      link.addEventListener('click', (evt) => {
        evt.stopPropagation();
        // الرابط يفتح في تبويب جديد تلقائياً عبر target="_blank"
      });
    });
  }

  // ------------------- لوحة المفاتيح -------------------
  function setupKeyboard() {
    document.addEventListener('keydown', (evt) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      if (evt.key === 'ArrowRight') {
        evt.preventDefault();
        showPage(currentPage + 1, true);
      } else if (evt.key === 'ArrowLeft') {
        evt.preventDefault();
        showPage(currentPage - 1, true);
      }
    });
  }

  // ------------------- سحب الزاوية (ماوس ولمس) -------------------
  let drag = {
    active: false,
    corner: null,
    direction: 0, // 1 = next، -1 = prev
    startX: 0,
    progress: 0,
    targetPage: 0
  };

  // متغير تتبع لحاوية التمرير الحالية لأزرار التنقل
  let currentScrollContainerForNav = null;

  function dragStart(corner, clientX) {
    if (isFlipping) return;
    const page = corner.closest('.page');
    if (!page || !page.classList.contains('page--active')) return;

    const dir = corner.dataset.corner === 'next' ? 1 : -1;
    const target = currentPage + dir;
    if (target < 1 || target > TOTAL_PAGES) return;

    drag.active = true;
    drag.corner = corner;
    drag.direction = dir;
    drag.startX = clientX;
    drag.progress = 0;
    drag.targetPage = target;

    turner.style.transition = 'none';
    // لا تُظهر طبقة التقليب إلا عند أول حركة فعلية،
    // لتجنب وميض الورقة عند الضغط أو النقرة السريعة على الزاوية.
    turner.style.opacity = '0';
    turner.style.pointerEvents = 'none';
    turnShadow.style.opacity = '0';
    drag.startedAt = Date.now();

    turnFront.style.backgroundColor = getComputedStyle(
      document.getElementById('page-' + currentPage)
    ).backgroundColor;
    turnBack.style.backgroundColor = getComputedStyle(
      document.getElementById('page-' + target)
    ).backgroundColor;

    document.getElementById('page-' + target).style.zIndex = '3';
    document.getElementById('page-' + target).style.opacity = '0';
  }

  function dragMove(clientX) {
    if (!drag.active) return;

    const dx = clientX - drag.startX;
    // نقبل السحب في الاتجاهين الأفقيين — المهما اتجاه سحب اليد,
    // الزاوية المضغوطة هي التي تحدد الصفحة (التالي أو السابق).
    const raw = Math.abs(dx);
    const p = Math.max(0, Math.min(1, raw / 150));

    if (p > drag.progress) {
      // إظهار طبقة التقليب عند أول حركة سحب حقيقية فقط
      turner.style.opacity = '1';
      turner.style.pointerEvents = 'auto';
      drag.progress = p;
      const deg = drag.direction * p * 180;
      turner.style.transform = `rotateY(${deg}deg)`;
      turnShadow.style.opacity = 0.7 * p;

      if (p > 0.5) {
        const nextEl = document.getElementById('page-' + drag.targetPage);
        nextEl.style.opacity = '1';
        nextEl.style.zIndex = '5';
        document.getElementById('page-' + currentPage).style.zIndex = '2';
      }
    }
  }

  function dragEnd() {
    if (!drag.active) return;
    const wasActive = drag.active;
    drag.active = false;

    // نقرة/لمسة سريعة بلا سحب → قلب الصفحة بنفس آلية أزرار السابق والتالي
    if (drag.progress === 0 && Date.now() - drag.startedAt < 350) {
      const tp = drag.targetPage;
      drag.corner = null;
      showPage(tp, true);
      return;
    }

    if (drag.progress > 0.42) {
      const targetEl = document.getElementById('page-' + drag.targetPage);
      const currentEl = document.getElementById('page-' + currentPage);
      const deg = drag.direction * 180;
      turner.style.transition = 'transform 300ms cubic-bezier(0.2, 0, 0.3, 1)';
      turner.style.transform = `rotateY(${deg}deg)`;
      isFlipping = true;
      setTimeout(() => finishFlip(currentEl, targetEl, drag.targetPage), 300);
    } else {
      turner.style.transition = 'transform 350ms cubic-bezier(0.3, 1, 0.5, 1)';
      turner.style.transform = 'rotateY(0deg)';
      turnShadow.style.opacity = '0';
      setTimeout(() => {
        turner.style.opacity = '0';
        turner.style.pointerEvents = 'none';
        const tp = drag.targetPage;
        document.getElementById('page-' + tp).style.opacity = '0';
        document.getElementById('page-' + tp).style.zIndex = '1';
      }, 350);
    }
  }

  function setupCorners() {
    document.querySelectorAll('.page-corner').forEach((corner) => {
      // mouse: منع تحديد النص وسلوك السحب الافتراضي أثناء التقليب
      corner.addEventListener('mousedown', (evt) => {
        evt.preventDefault();
        dragStart(corner, evt.clientX);
      });
      corner.addEventListener(
        'touchstart',
        (evt) => {
          evt.preventDefault();
          dragStart(corner, evt.touches[0].clientX);
        },
        { passive: false }
      );
    });

    window.addEventListener('mousemove', (evt) => dragMove(evt.clientX));
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener(
      'touchmove',
      (evt) => {
        if (!drag.active) return;
        evt.preventDefault();
        dragMove(evt.touches[0].clientX);
      },
      { passive: false }
    );
    window.addEventListener('touchend', dragEnd);
  }

  // ------------------- الظهور التدريجي عند التمرير (Scroll Reveal) -------------------
  let revealObserver = null;
  let currentScrollContainer = null;
  // تتبع العناصر التي ظهرت من قبل حتى لا تعاود الاختفاء عند العودة إلى الصفحة
  const revealedOnce = new WeakSet();

  function initScrollRevealForPage(pageEl) {
    // إزالة مراقب التمرير القديم إن وجد
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    // حاوية التمرير هي الصفحة نفسها (.page-inner) أو النافذة إذا لم تكن قابلة للتمرير
    const pageInner = pageEl.querySelector('.page-inner');
    const scrollContainer = pageInner || pageEl;

    // إذا كانت الصفحة هي الحالية، ابدأ المراقبة
    if (!pageEl.classList.contains('page--active')) return;

    currentScrollContainer = scrollContainer;

    // تحديد العناصر التي يجب أن تظهر تدريجياً داخل الصفحة الحالية فقط
    const revealElements = pageEl.querySelectorAll('.reveal');

    // لا حركة لمن يفضّل تقليل الحركة، أو إذا كان المتصفح لا يدعم المراقب
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealElements.forEach((el) => {
        el.classList.add('reveal-active');
        revealedOnce.add(el);
      });
      return;
    }

    const options = {
      root: scrollContainer, // مراقبة التمرير داخل عنصر الصفحة نفسه
      rootMargin: '0px 0px -80px 0px', // الظهور قبل وصول العنصر إلى الأسفل بـ 80px
      threshold: 0.1
    };

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          revealedOnce.add(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, options);

    revealElements.forEach((el) => {
      if (!revealedOnce.has(el)) {
        // يبقى مخفياً حتى يقترب من منطقة الشظية عبر التمرير
        el.classList.remove('reveal-active');
      }
      revealObserver.observe(el);
    });

    // العناصر الموجودة بالفعل داخل منطقة العرض عند فتح الصفحة تظهر بتتابع،
    // والبقية تنتظر تمرير الزائر إليها عبر المراقب أعلاه.
    revealElements.forEach((el) => {
      if (revealedOnce.has(el)) return;
      const rect = el.getBoundingClientRect();
      const cRect = scrollContainer.getBoundingClientRect();
      if (rect.top < cRect.bottom - 30 && rect.bottom > cRect.top + 30) {
        el.classList.add('reveal-active');
        revealedOnce.add(el);
        revealObserver.unobserve(el);
      }
    });
  }

  // ------------------- إخفاء أزرار التنقل عند التمرير -------------------
  let scrollTimeout = null;
  let isScrolling = false;

  function initScrollHideNav() {
    // إزالة مستمع التمرير من الحاوية القديمة إن وجدت
    if (currentScrollContainerForNav) {
      currentScrollContainerForNav.removeEventListener('scroll', handleNavScroll);
      currentScrollContainerForNav = null;
    }

    const pageInner = document.querySelector('.page--active .page-inner');
    if (!pageInner) return;

    currentScrollContainerForNav = pageInner;
    pageInner.addEventListener('scroll', handleNavScroll, { passive: true });
  }

  function handleNavScroll() {
    // إخفاء الأزرار عند بدء التمرير
    if (!isScrolling) {
      isScrolling = true;
      hideNavButtons();
    }

    // إعادة إظهار الأزرار بعد توقف التمرير بفترة قصيرة (يتم الاحتفاظ مخفية أثناء القراءة)
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      // نتركها مخفية كما طلب المستخدم: "لا تُظهر الزرين فوراً؛ اتركهما مختفيين ما دام المستخدم يقرأ المحتوى"
    }, 150);

    // إذا عاد المستخدم إلى أعلى الصفحة (scrollTop === 0)، أظهر الأزرار
    if (currentScrollContainerForNav && currentScrollContainerForNav.scrollTop === 0) {
      showNavButtons();
    }
  }

  // إعادة تفعيل مراقبة التمرير عند قلب الصفحة
  function reinitScrollOnPageChange(newPageEl) {
    // إزالة مستمعي التمرير القديمة إن وجدت
    const oldContainer = document.querySelector('.page-inner.scroll-listener');
    if (oldContainer) {
      oldContainer.classList.remove('scroll-listener');
    }

    const newInner = newPageEl.querySelector('.page-inner');
    if (newInner) {
      newInner.classList.add('scroll-listener');
      initScrollRevealForPage(newPageEl);
      initScrollHideNav();
    }
  }

  // ------------------- تهيئة -------------------
  function init() {
    // تفعيل الصفحة الأولى مباشرة
    const firstPage = document.getElementById('page-1');
    if (firstPage) {
      firstPage.style.opacity = '1';
      firstPage.classList.add('page--active');
      firstPage.style.zIndex = '5';
    }
    book.className = 'book book--p1';
    resetTurner();
    updateUI();
    setupButtons();
    setupCorners();
    setupKeyboard();
    setupDirectLinks();
    setupExternalLinks();

    // بدء مراقبة الظهور التدريجي والتمرير للصفحة الأولى
    initScrollRevealForPage(firstPage);
    initScrollHideNav();

    // تلميح زيارة أولى
    if (!prefersReducedMotion && !sessionStorage.getItem('jp_hint_shown')) {
      sessionStorage.setItem('jp_hint_shown', '1');
      hint.classList.add('show');
      const corner = document.querySelector('.page--active .corner-next');
      if (corner) corner.classList.add('hint-pulse');

      setTimeout(() => {
        hint.classList.remove('show');
        if (corner) corner.classList.remove('hint-pulse');
      }, 4500);
    }

    console.log('JP: portfolio initialized, currentPage =', currentPage);
  }

  // ------------------- التشغيل -------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
