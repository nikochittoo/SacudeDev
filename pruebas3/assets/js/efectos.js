/* =============================================
   SACUDE DEVS — Efectos y animaciones
   Cada efecto es independiente: si falta el elemento en la página, se saltea.
   ============================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover     = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const sleep       = ms => new Promise(r => setTimeout(r, ms));
  const rand        = (a, b) => a + Math.random() * (b - a);

  let heroVisible = true;
  const heroListeners = [];
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      heroListeners.forEach(fn => fn(heroVisible));
    }).observe(hero);
  }
  async function untilVisible(el) {
    while (!heroVisible || document.hidden || (el && el.offsetParent === null)) await sleep(300);
  }


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
  function initCodeTyping() {
    if (reduceMotion) return;
    const configs = [
      { sel: '.code-float-1 pre', start: 1700, snippets: [
        '<span class="c-key">const</span> <span class="c-var">idea</span> = <span class="c-str">"única"</span>;',
        '<span class="c-key">def</span> <span class="c-fn">crear_web</span>(marca):',
        '<span class="c-key">&lt;h1&gt;</span>Hola mundo<span class="c-key">&lt;/h1&gt;</span>'
      ]},
      { sel: '.code-float-2 pre', start: 2600, snippets: [
        '<span class="c-fn">eleva</span>(<span class="c-str">"tu marca"</span>);',
        '<span class="c-fn">print</span>(<span class="c-str">"Hola, mundo"</span>)',
        '<span class="c-key">return</span> <span class="c-var">exito</span>;'
      ]}
    ];

    configs.forEach(async cfg => {
      const pre = document.querySelector(cfg.sel);
      if (!pre) return;
      const caret = Object.assign(document.createElement('span'), { className: 'type-caret' });
      caret.setAttribute('aria-hidden', 'true');
      pre.textContent = ''; pre.append(caret);
      await sleep(cfg.start);

      let i = 0;
      for (;;) {
        // Prepara el snippet: vacía cada nodo de texto y los va llenando (así se mantienen los colores)
        const tpl = document.createElement('template');
        tpl.innerHTML = cfg.snippets[i];
        const nodes = [];
        const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
        for (let n; (n = walker.nextNode());) { nodes.push([n, n.data]); n.data = ''; }
        pre.textContent = '';
        pre.append(tpl.content, caret);

        for (const [node, txt] of nodes) {
          for (const ch of txt) { await untilVisible(pre); node.data += ch; await sleep(rand(60, 130)); }
        }
        await sleep(2600);
        for (const [node] of nodes.slice().reverse()) {
          while (node.data.length) { await untilVisible(pre); node.data = node.data.slice(0, -1); await sleep(28); }
        }
        await sleep(400);
        i = (i + 1) % cfg.snippets.length;
      }
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
  initCodeTyping();
  initCardEffects();
})();
