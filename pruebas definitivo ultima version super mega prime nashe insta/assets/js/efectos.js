/* =============================================
   SACUDE DEVS — Efectos y animaciones
   Cada efecto es independiente: si falta el elemento en la página, se saltea.
   ============================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover     = window.matchMedia('(hover: hover) and (pointer: fine)').matches;


  /* ── 1) Barra de progreso de scroll ── */
  function initScrollProgress() {
    const wrap = document.createElement('div');
    wrap.className = 'scroll-progress';
    wrap.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('span');
    bar.className = 'scroll-progress__bar';
    wrap.appendChild(bar);
    document.body.prepend(wrap);

    let ticking = false;

    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }


  /* ── 2) Link activo en la navbar ── */
  function initActiveNav() {
    const links = Array.from(document.querySelectorAll('.nav-links .nav-link, .mobile-menu .nav-link'));
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if (!links.length || !sections.length) return;

    function setActive(id) {
      links.forEach((link) => {
        const active = link.getAttribute('href') === '#' + id;
        link.classList.toggle('active-link', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    // Una franja fina al 40–45% del alto de la pantalla: la sección que la cruza es la activa
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach((section) => observer.observe(section));
  }


  /* ── 3) Count-up de las stats del hero ── */
  function initCountUp() {
    const nums = Array.from(document.querySelectorAll('.stat-num[data-count]'));
    if (!nums.length || reduceMotion) return; // sin JS o con "reducir movimiento" queda el valor final

    const items = nums.map((el) => {
      const stat = el.closest('.stat');
      if (stat) stat.style.minWidth = stat.offsetWidth + 'px'; // el ancho no "salta" mientras cuenta
      const item = {
        el: el,
        to: Number(el.dataset.count),
        prefix: el.dataset.prefix || '',
        suffix: el.dataset.suffix || ''
      };
      el.textContent = item.prefix + '0' + item.suffix;
      return item;
    });

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const DURATION = 2000;

    function run() {
      const start = performance.now();
      function frame(now) {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = easeOutCubic(t);
        items.forEach((item) => {
          item.el.textContent = item.prefix + Math.round(item.to * eased) + item.suffix;
        });
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    const target = document.querySelector('.hero-stats');
    if (!target || !('IntersectionObserver' in window)) { run(); return; }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        setTimeout(run, 650); // espera a que termine el fade-in del hero
      }
    }, { threshold: 0.6 });
    observer.observe(target);
  }


  /* ── 4) Tipeo en los snippets de código del hero ── */
  function initTyping() {
    if (reduceMotion) return;
    const boxes = Array.from(document.querySelectorAll('.code-float'))
      .filter((box) => getComputedStyle(box).display !== 'none' && box.querySelector('pre'));
    if (!boxes.length) return;

    // Prepara cada snippet: guarda el texto, lo vacía y fija el tamaño final de la caja
    const snippets = boxes.map((box) => {
      const pre = box.querySelector('pre');
      box.style.minWidth = box.offsetWidth + 'px';
      box.style.minHeight = box.offsetHeight + 'px';
      const parts = [];
      const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        parts.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
      }
      parts.forEach((p) => { p.node.nodeValue = ''; });
      return { pre: pre, parts: parts };
    });

    function type(snippet) {
      return new Promise((resolve) => {
        snippet.pre.classList.add('is-typing');
        let part = 0;
        let chars = 0;
        function step() {
          if (part >= snippet.parts.length) { resolve(); return; }
          const p = snippet.parts[part];
          chars++;
          p.node.nodeValue = p.text.slice(0, chars);
          if (chars >= p.text.length) { part++; chars = 0; }
          setTimeout(step, 55 + Math.random() * 70);
        }
        step();
      });
    }

    // Uno después del otro; el cursor queda parpadeando solo en el último
    let chain = new Promise((resolve) => setTimeout(resolve, 1400)); // después del fade-in del hero
    snippets.forEach((snippet, i) => {
      chain = chain
        .then(() => type(snippet))
        .then(() => new Promise((resolve) => setTimeout(resolve, 350)))
        .then(() => { if (i < snippets.length - 1) snippet.pre.classList.remove('is-typing'); });
    });
  }


  /* ── 5) Spotlight en las cards + tilt 3D en las del equipo ── */
  function initCardEffects() {
    if (!canHover || reduceMotion) return;

    document.querySelectorAll('.servicio-card, .programador-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });

    const MAX_TILT = 5; // grados
    document.querySelectorAll('.programador-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * MAX_TILT * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * MAX_TILT * 2).toFixed(2) + 'deg');
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }


  initScrollProgress();
  initActiveNav();
  initCountUp();
  initTyping();
  initCardEffects();
})();
