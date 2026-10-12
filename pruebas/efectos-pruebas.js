/* =====================================================================
   EFECTOS (pruebas)
   1 Partículas · 2 Frase que se escribe · 4 Contadores
   5 Revelado con variantes · 7 Botones magnéticos · 8 Código que se escribe
   (3 y 6 son solo CSS)
   ===================================================================== */
(() => {
  'use strict';

  const reduce      = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hero        = document.getElementById('hero');
  const sleep       = ms => new Promise(r => setTimeout(r, ms));
  const rand        = (a, b) => a + Math.random() * (b - a);

  /* ---------- Visibilidad del hero (pausa lo que no se ve) ---------- */
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

  /* =================================================================
     1. PARTÍCULAS FLOTANTES
     ================================================================= */
  function initParticles() {
    const canvas = document.getElementById('heroParticles');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    const COLORS = ['249,115,22', '247,201,72', '192,132,252', '124,58,237'];
    const LINK_DIST = 110;                       // distancia para unir puntos con líneas
    let w = 0, h = 0, parts = [], raf = null, last = 0;

    const make = () => ({
      x: rand(0, w), y: rand(0, h),
      r: rand(.6, 2.2),
      vx: rand(-8, 8), vy: rand(-14, -3),        // px por segundo (deriva hacia arriba)
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      a: rand(.3, .85), t: rand(0, 6.28), ts: rand(.5, 1.4)
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(70, Math.round((w * h) / (w < 768 ? 26000 : 17000)));
      while (parts.length < target) parts.push(make());
      parts.length = target;
      parts.forEach(p => { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); });
      if (reduce) draw(0);
    }

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.t += p.ts * dt;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        const alpha = p.a * (.6 + .4 * Math.sin(p.t));
        ctx.fillStyle = `rgba(${p.c},${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        if (p.r > 1.5) {                          // halo suave en las más grandes
          ctx.fillStyle = `rgba(${p.c},${alpha * .12})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.2832); ctx.fill();
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            ctx.strokeStyle = `rgba(192,132,252,${(1 - d / LINK_DIST) * .11})`;
            ctx.beginPath(); ctx.moveTo(parts[i].x, parts[i].y); ctx.lineTo(parts[j].x, parts[j].y); ctx.stroke();
          }
        }
      }
    }

    function frame(now) {
      draw(Math.min((now - last) / 1000, .05));
      last = now;
      raf = requestAnimationFrame(frame);
    }
    const start = () => { if (raf || reduce) return; last = performance.now(); raf = requestAnimationFrame(frame); };
    const stop  = () => { cancelAnimationFrame(raf); raf = null; };

    resize();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(resize, 150); });
    heroListeners.push(v => (v ? start() : stop()));
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : (heroVisible && start())));
    start();
  }

  /* =================================================================
     2. FRASE DEL HERO QUE SE ESCRIBE
     ================================================================= */
  async function initHeroTyping() {
    const el = document.getElementById('typedText');
    if (!el || reduce) return;                    // sin movimiento: queda la frase fija del HTML
    const phrases = [
      'Desarrollamos soluciones digitales',
      'Diseñamos webs a medida',
      'Llevamos tu marca al siguiente nivel'
    ];
    el.textContent = '';
    await sleep(1000);                            // espera a que aparezca la línea (delay-2)
    let i = 0;
    for (;;) {
      for (const ch of phrases[i]) {
        await untilVisible();
        el.textContent += ch;
        await sleep(rand(45, 95));
      }
      await sleep(2200);
      while (el.textContent.length) {
        await untilVisible();
        el.textContent = el.textContent.slice(0, -1);
        await sleep(22);
      }
      await sleep(350);
      i = (i + 1) % phrases.length;
    }
  }

  /* =================================================================
     4. CONTADORES ANIMADOS  (lee "+20", "100%", "+15" directo del HTML)
     ================================================================= */
  function initCounters() {
    const els = document.querySelectorAll('.stat-num');
    if (!els.length || reduce || !('IntersectionObserver' in window)) return;
    const DURATION = 1600;
    const ease = t => 1 - Math.pow(1 - t, 3);     // easeOutCubic

    const items = [];
    els.forEach(el => {
      const original = el.textContent.trim();
      const m = original.match(/^(\D*)(\d+)(\D*)$/);
      if (!m) return;
      el.textContent = m[1] + '0' + m[3];
      items.push({ el, original, pre: m[1], n: parseInt(m[2], 10), suf: m[3] });
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(async entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const it = items.find(x => x.el === entry.target);
        const idx = items.indexOf(it);
        // espera a que termine el fade-in de las estadísticas (~1.9 s desde la carga)
        await sleep(Math.max(0, 1900 - performance.now()) + idx * 120);
        const t0 = performance.now();
        (function tick(now) {
          const p = Math.min((now - t0) / DURATION, 1);
          it.el.textContent = it.pre + Math.round(it.n * ease(p)) + it.suf;
          if (p < 1) requestAnimationFrame(tick); else it.el.textContent = it.original;
        })(t0);
      });
    }, { threshold: .6 });
    items.forEach(it => obs.observe(it.el));
  }

  /* =================================================================
     5. REVELADO CON VARIANTES (.reveal-left / -right / -zoom / -up)
     ================================================================= */
  function initRevealVariants() {
    const els = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-zoom, .reveal-up');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('visible')); return; }

    const count = new Map();                      // delay escalonado entre hermanos
    els.forEach(el => {
      const n = count.get(el.parentElement) || 0;
      count.set(el.parentElement, n + 1);
      el.style.setProperty('--rv-delay', (n * .12).toFixed(2) + 's');
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
  }

  /* =================================================================
     7. BOTONES MAGNÉTICOS (solo mouse, no en pantallas táctiles)
     ================================================================= */
  function initMagnetic() {
    if (reduce || !finePointer) return;
    const btns = Array.from(document.querySelectorAll('.hero-actions .btn, .cta-buttons .btn, .btn-nav'))
      .filter(b => !b.closest('.mobile-menu'));
    if (!btns.length) return;

    const RADIUS = 70, STRENGTH = .28, MAX = 10;   // alcance, fuerza y desplazamiento máximo (px)
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    let mx = 0, my = 0, raf = null;

    btns.forEach(b => { b.classList.add('is-magnetic'); b._tx = 0; b._ty = 0; });

    const setPos = (b, x, y) => {
      b._tx = x; b._ty = y;
      b.style.setProperty('--mx', x.toFixed(1) + 'px');
      b.style.setProperty('--my', y.toFixed(1) + 'px');
    };
    function update() {
      raf = null;
      btns.forEach(b => {
        if (!b.offsetParent) return;
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width / 2 - b._tx;   // centro "real", sin el desplazamiento actual
        const cy = r.top + r.height / 2 - b._ty;
        const dx = mx - cx, dy = my - cy;
        const near = Math.abs(dx) < r.width / 2 + RADIUS && Math.abs(dy) < r.height / 2 + RADIUS;
        near ? setPos(b, clamp(dx * STRENGTH, MAX), clamp(dy * STRENGTH, MAX)) : (b._tx || b._ty) && setPos(b, 0, 0);
      });
    }
    window.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    document.addEventListener('mouseleave', () => btns.forEach(b => setPos(b, 0, 0)));
  } 

  /* =================================================================
     8. CÓDIGO QUE SE ESCRIBE SOLO (.code-float-1 y .code-float-2)
     Cada snippet es HTML con tus clases de color (c-key, c-var, c-str, c-fn).
     ================================================================= */
  function initCodeTyping() {
    if (reduce) return;
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

  /* ---------- Arranque ---------- */
  initParticles();
  initHeroTyping();
  initCounters();
  initRevealVariants();
  /*initMagnetic();*/
  initCodeTyping();
})();
