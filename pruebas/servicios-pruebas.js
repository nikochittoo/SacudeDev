/* Cards de servicios: se expanden, tapan al resto y muestran ejemplos */
(function () {
  const grid = document.querySelector('.servicios-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.servicio-card'));
  const mobile = () => window.matchMedia('(max-width: 768px)').matches;
  let active = null;

  cards.forEach(card => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');

    card.addEventListener('click', e => {
      if (e.target.closest('.servicio-close')) { close(); return; }
      if (e.target.closest('a')) return;          // "Consultar →" sigue funcionando
      if (!active) open(card);
    });
    card.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === card && !active) {
        e.preventDefault();
        open(card);
      }
    });
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && active) close(); });
  window.addEventListener('resize', () => { if (active) reset(active); });

  /* ---------- ABRIR ---------- */
  function open(card) {
    active = card;
    card.setAttribute('aria-expanded', 'true');
    mobile() ? openMobile(card) : openDesktop(card);
  }

  function openDesktop(card) {
    const g = grid.getBoundingClientRect();
    const r = card.getBoundingClientRect();
    card._from = { top: r.top - g.top, left: r.left - g.left, width: r.width, height: r.height };

    grid.style.height = g.height + 'px';           // el grid no colapsa al sacar la card del flujo

    // Placeholder: mantiene el hueco de la card para que las otras no se corran
    const ph = document.createElement('div');
    ph.className = 'servicio-placeholder';
    ph.style.height = r.height + 'px';
    card.before(ph);
    card._ph = ph;
    setBox(card, card._from);
    card.classList.add('moving');
    cards.forEach(c => { if (c !== card) c.classList.add('hide'); });

    card.offsetWidth;                              // fuerza reflow
    card.classList.add('open');
    setBox(card, { top: 0, left: 0, width: g.width, height: g.height });
  }

  function openMobile(card) {
    const from = card.offsetHeight;
    card.classList.add('mobile-open', 'open');
    card.style.height = 'auto';
    const to = card.offsetHeight;                  // altura natural con ejemplos
    card.style.height = from + 'px';
    cards.forEach(c => { if (c !== card) c.style.display = 'none'; });
    card.offsetWidth;
    card.style.height = to + 'px';
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- CERRAR ---------- */
  function close() {
    const card = active;
    if (!card) return;
    card.classList.remove('open');
    card.setAttribute('aria-expanded', 'false');

    if (mobile() || !card._from) { reset(card); return; }

    setBox(card, card._from);                      // las otras siguen ocultas hasta que termine

    let finished = false;
    const done = () => { if (!finished) { finished = true; reset(card); } };
    card.addEventListener('transitionend', function h(e) {
      if (e.propertyName === 'height') { card.removeEventListener('transitionend', h); done(); }
    });
    setTimeout(done, 900);                         // por si no se dispara transitionend
  }

  /* Deja todo como al principio */
  function reset(card) {
    if (card._ph) { card._ph.remove(); card._ph = null; }
    card.classList.remove('open', 'moving', 'mobile-open', 'hide');
    card.removeAttribute('style');
    card.setAttribute('aria-expanded', 'false');
    cards.forEach(c => { c.classList.remove('hide'); c.style.display = ''; });
    grid.style.height = '';
    active = null;
  }

  function setBox(el, b) {
    el.style.top = b.top + 'px';
    el.style.left = b.left + 'px';
    el.style.width = b.width + 'px';
    el.style.height = b.height + 'px';
  }
})();
