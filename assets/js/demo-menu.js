/* =============================================
   SACUDE DEVS — Demo conceptual: Menú Web (QR)
   Todo ocurre en el navegador: no hay servidor ni se guarda nada.
   El menú del cliente y el panel del local comparten el mismo estado.
   ============================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 959px)').matches;

  /* ─────────── Datos de la demo (negocio ficticio) ─────────── */
  const CATEGORIAS = [
    { id: 'cafes',      nombre: 'Cafés',      emoji: '☕', g: ['#8B5E3C', '#C98A5A'] },
    { id: 'frios',      nombre: 'Fríos',      emoji: '🧊', g: ['#3B82A0', '#7CC6D8'] },
    { id: 'pasteleria', nombre: 'Pastelería', emoji: '🥐', g: ['#D98E4A', '#F2C879'] },
    { id: 'brunch',     nombre: 'Brunch',     emoji: '🥑', g: ['#5E8C4A', '#A8C97A'] }
  ];

  const TAGS = { popular: '⭐ Popular', vegano: '🌱 Vegano', sintacc: '🌾 Sin TACC' };

  const MENU_INICIAL = [
    { id: 'espresso',   cat: 'cafes', nombre: 'Espresso',       desc: 'Doble, de tueste medio.',                          precio: 2800, emoji: '☕', tags: ['vegano', 'sintacc'] },
    { id: 'cortado',    cat: 'cafes', nombre: 'Cortado',        desc: 'Espresso con un toque de leche.',                  precio: 3200, emoji: '☕', tags: ['sintacc'] },
    { id: 'flatwhite',  cat: 'cafes', nombre: 'Flat white',     desc: 'Doble espresso y leche texturizada.',              precio: 4600, emoji: '🥛', tags: ['popular', 'sintacc'] },
    { id: 'capuccino',  cat: 'cafes', nombre: 'Cappuccino',     desc: 'Espresso, leche vaporizada y espuma cremosa.',     precio: 4400, emoji: '☕', tags: ['sintacc'] },
    { id: 'latteavena', cat: 'cafes', nombre: 'Latte de avena', desc: 'Con leche de avena, sin lácteos.',                 precio: 4900, emoji: '🌾', tags: ['vegano'] },
    { id: 'v60',        cat: 'cafes', nombre: 'Filtrado V60',   desc: 'Café de origen, preparado a mano.',                precio: 5200, emoji: '🫖', tags: ['vegano', 'sintacc'] },

    { id: 'coldbrew',   cat: 'frios', nombre: 'Cold brew',                    desc: 'Infusionado 16 horas, servido con hielo.',   precio: 4800, emoji: '🧊', tags: ['vegano', 'sintacc'] },
    { id: 'limonada',   cat: 'frios', nombre: 'Limonada de menta y jengibre', desc: 'Fresca, con hojas de menta.',                precio: 4200, emoji: '🍋', tags: ['popular', 'vegano', 'sintacc'] },
    { id: 'licuado',    cat: 'frios', nombre: 'Licuado de frutos rojos',      desc: 'Con agua o con leche vegetal.',              precio: 5400, emoji: '🍓', tags: ['vegano', 'sintacc'] },
    { id: 'teheleado',  cat: 'frios', nombre: 'Té helado de durazno',         desc: 'Infusión casera, apenas endulzada.',         precio: 3900, emoji: '🍑', tags: ['vegano', 'sintacc'] },

    { id: 'medialunas', cat: 'pasteleria', nombre: 'Medialunas (x3)',        desc: 'De manteca, recién horneadas.',            precio: 4500, emoji: '🥐', tags: ['popular'] },
    { id: 'budin',      cat: 'pasteleria', nombre: 'Budín de limón',         desc: 'Con glaseado cítrico.',                    precio: 3800, emoji: '🍋', tags: [] },
    { id: 'cookie',     cat: 'pasteleria', nombre: 'Cookie de chocolate',    desc: 'Con chips de chocolate semiamargo.',       precio: 3200, emoji: '🍪', tags: [] },
    { id: 'tostado',    cat: 'pasteleria', nombre: 'Tostado de jamón y queso', desc: 'En pan de miga artesanal.',              precio: 6900, emoji: '🥪', tags: [] },
    { id: 'zanahoria',  cat: 'pasteleria', nombre: 'Torta de zanahoria',     desc: 'Con frosting de queso crema.',             precio: 5600, emoji: '🥕', tags: [] },

    { id: 'palta',      cat: 'brunch', nombre: 'Tostada de palta y huevo', desc: 'Pan de masa madre, palta y huevo pochado.', precio: 8900, emoji: '🥑', tags: ['popular'] },
    { id: 'tvegana',    cat: 'brunch', nombre: 'Tostada vegana',           desc: 'Palta, tomate confitado y semillas.',       precio: 8400, emoji: '🥑', tags: ['vegano'] },
    { id: 'bowl',       cat: 'brunch', nombre: 'Bowl de yogur y granola',  desc: 'Frutas de estación y miel.',                precio: 6800, emoji: '🥣', tags: [] },
    { id: 'ensalada',   cat: 'brunch', nombre: 'Ensalada tibia',           desc: 'Verdes, quinoa y vegetales asados.',        precio: 9500, emoji: '🥗', tags: ['vegano', 'sintacc'] }
  ];

  const ESTADOS = {
    nuevo:       { cliente: 'Enviado al local',            emoji: '📨', boton: 'Empezar a preparar', siguiente: 'preparando' },
    preparando:  { cliente: 'En preparación',              emoji: '👩‍🍳', boton: 'Marcar listo',        siguiente: 'listo' },
    listo:       { cliente: '¡Listo! Ya sale a tu mesa',   emoji: '✅', boton: 'Marcar entregado',   siguiente: 'entregado' },
    entregado:   { cliente: 'Entregado. ¡Buen provecho!',  emoji: '🍽️', boton: null,                 siguiente: null }
  };
  const ESTADO_TXT = { nuevo: 'Nuevo', preparando: 'Preparando', listo: 'Listo', entregado: 'Entregado' };

  /* ─────────── Utilidades ─────────── */
  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }
  const tracked = {};
  function trackOnce(name) { if (!tracked[name]) { tracked[name] = true; track(name); } }

  function el(tag, props) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value === false || value == null) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : value);
    });
    for (let i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach((child) => { if (child != null) node.append(child); });
    }
    return node;
  }

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const scrollEl = $('cmScroll');
  const catsEl = $('cmCats');
  const filtersEl = $('cmFilters');
  const listEl = $('cmList');
  const statusEl = $('cmStatus');
  const cartbar = $('cmCartbar');
  const toastEl = $('cmToast');
  const sheet = $('cmSheet');
  const sheetPanel = $('cmSheetPanel');
  const mesaSel = $('cmMesa');
  const paneMenu = $('paneMenu');
  const panePedidos = $('panePedidos');


  /* ─────────── Estado compartido ─────────── */
  let menu, cart, orders, orderSeq, filtros, mesa, lastOrderId, notaValue, sheetMode, lastSent, lastCat;

  function initState() {
    menu = MENU_INICIAL.map((it) => Object.assign({}, it, { tags: it.tags.slice(), disponible: true }));
    cart = {};
    orders = [];
    orderSeq = 101;
    filtros = { vegano: false, sintacc: false };
    mesa = 7;
    lastOrderId = null;
    notaValue = '';
    sheetMode = 'cart';
    lastSent = null;
    lastCat = null;
  }

  const byId = (id) => menu.find((it) => it.id === id);
  const cartIds = () => Object.keys(cart);
  const cartCount = () => cartIds().reduce((n, id) => n + cart[id], 0);
  const cartTotal = () => cartIds().reduce((t, id) => t + cart[id] * byId(id).precio, 0);


  /* ─────────── Aviso breve dentro del celular ─────────── */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2300);
  }


  /* ─────────── Menú del cliente ─────────── */
  function buildStatic() {
    mesaSel.replaceChildren(...Array.from({ length: 12 }, (_, i) => {
      const o = el('option', { value: String(i + 1), text: String(i + 1) });
      return o;
    }));
    mesaSel.value = String(mesa);

    catsEl.replaceChildren(...CATEGORIAS.map((c) =>
      el('button', { type: 'button', class: 'cm-cat', 'data-cat': c.id, text: c.emoji + ' ' + c.nombre })));

    filtersEl.replaceChildren(
      el('button', { type: 'button', class: 'cm-filter', 'data-filter': 'vegano', 'aria-pressed': 'false', text: '🌱 Vegano' }),
      el('button', { type: 'button', class: 'cm-filter', 'data-filter': 'sintacc', 'aria-pressed': 'false', text: '🌾 Sin TACC' })
    );
  }

  const visible = (it) => (!filtros.vegano || it.tags.includes('vegano')) && (!filtros.sintacc || it.tags.includes('sintacc'));

  function stepper(id, qty, nombre, prefix) {
    return el('div', { class: 'cm-step', role: 'group', 'aria-label': 'Cantidad de ' + nombre },
      el('button', { type: 'button', 'data-action': prefix + 'dec', 'data-id': id, 'aria-label': 'Quitar uno de ' + nombre, text: '−' }),
      el('span', { class: 'cm-qty', text: String(qty) }),
      el('button', { type: 'button', 'data-action': prefix + 'inc', 'data-id': id, 'aria-label': 'Agregar uno de ' + nombre, text: '+' })
    );
  }

  function itemNode(it) {
    const cat = CATEGORIAS.find((c) => c.id === it.cat);
    const qty = cart[it.id] || 0;
    let control;
    if (!it.disponible) control = el('span', { class: 'cm-agotado', text: 'Agotado hoy' });
    else if (!qty) control = el('button', { type: 'button', class: 'cm-add', 'data-action': 'add', 'data-id': it.id, 'aria-label': 'Agregar ' + it.nombre + ' al pedido', text: '+ Agregar' });
    else control = stepper(it.id, qty, it.nombre, '');

    return el('article', { class: 'cm-item' + (it.disponible ? '' : ' is-off'), 'data-item': it.id },
      el('div', { class: 'cm-pic', style: '--g1:' + cat.g[0] + ';--g2:' + cat.g[1], 'aria-hidden': 'true', text: it.emoji }),
      el('div', { class: 'cm-item-body' },
        el('h4', { class: 'cm-item-name', text: it.nombre }),
        el('p', { class: 'cm-item-desc', text: it.desc }),
        it.tags.length ? el('p', { class: 'cm-tags' }, it.tags.map((t) => el('span', { class: 'cm-tag cm-tag-' + t, text: TAGS[t] }))) : null,
        el('div', { class: 'cm-item-row' }, el('span', { class: 'cm-price', text: fmt(it.precio) }), control)
      )
    );
  }

  function renderList() {
    listEl.replaceChildren();
    let any = false;
    CATEGORIAS.forEach((cat) => {
      const items = menu.filter((it) => it.cat === cat.id && visible(it));
      if (!items.length) return;
      any = true;
      listEl.append(el('section', { class: 'cm-sec', 'data-cat': cat.id, 'aria-label': cat.nombre },
        el('h3', { class: 'cm-sec-title', text: cat.nombre }),
        el('div', { class: 'cm-items' }, items.map((it) => itemNode(it)))
      ));
    });
    if (!any) listEl.append(el('p', { class: 'cm-empty', text: 'No hay opciones con esos filtros.' }));
    updateActiveCat();
  }

  function refreshItem(id, flash) {
    const old = listEl.querySelector('[data-item="' + id + '"]');
    if (!old) return;
    const fresh = itemNode(byId(id));
    old.replaceWith(fresh);
    if (flash) {
      fresh.classList.add('is-flash');
      setTimeout(() => fresh.classList.remove('is-flash'), 1400);
    }
  }

  function updateActiveCat() {
    const secs = Array.from(listEl.querySelectorAll('.cm-sec'));
    if (!secs.length) return;
    const top = scrollEl.scrollTop + catsEl.offsetHeight + 12;
    let current = secs[0];
    secs.forEach((s) => { if (s.offsetTop <= top) current = s; });
    catsEl.querySelectorAll('.cm-cat').forEach((b) => {
      const on = b.dataset.cat === current.dataset.cat;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      if (on && lastCat !== b.dataset.cat) {
        lastCat = b.dataset.cat;
        catsEl.scrollTo({ left: b.offsetLeft - (catsEl.clientWidth - b.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  let spyTick = false;
  scrollEl.addEventListener('scroll', () => {
    if (spyTick) return;
    spyTick = true;
    requestAnimationFrame(() => { updateActiveCat(); spyTick = false; });
  }, { passive: true });

  catsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.cm-cat');
    if (!b) return;
    const sec = listEl.querySelector('.cm-sec[data-cat="' + b.dataset.cat + '"]');
    if (!sec) return;
    scrollEl.scrollTo({ top: sec.offsetTop - catsEl.offsetHeight + 1, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  filtersEl.addEventListener('click', (e) => {
    const b = e.target.closest('.cm-filter');
    if (!b) return;
    const key = b.dataset.filter;
    filtros[key] = !filtros[key];
    b.setAttribute('aria-pressed', String(filtros[key]));
    renderList();
  });

  mesaSel.addEventListener('change', () => { mesa = Number(mesaSel.value); if (!sheet.hidden) renderSheet(); });

  /* Agregar / quitar desde la lista */
  function setQty(id, q) {
    if (q <= 0) delete cart[id]; else cart[id] = q;
    refreshItem(id);
    renderCartbar();
    if (!sheet.hidden && sheetMode === 'cart') renderSheet();
  }

  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const id = b.dataset.id;
    const it = byId(id);
    if (!it || !it.disponible) return;
    const before = cart[id] || 0;
    const action = b.dataset.action;
    const after = action === 'dec' ? before - 1 : before + 1;
    setQty(id, after);
    if (action === 'add') toast(it.nombre + ' agregado al pedido');
    // devolver el foco al control del mismo producto, para seguir con teclado
    const target = after <= 0 ? 'add' : (action === 'dec' ? 'dec' : 'inc');
    const next = listEl.querySelector('[data-item="' + id + '"] [data-action="' + target + '"]');
    if (next) next.focus();
  });

  function renderCartbar() {
    const n = cartCount();
    cartbar.hidden = n === 0;
    if (!n) return;
    cartbar.setAttribute('aria-label', 'Ver pedido: ' + n + (n === 1 ? ' producto' : ' productos') + ', total ' + fmt(cartTotal()));
    cartbar.replaceChildren(
      el('span', { class: 'cm-cartbar-l' }, el('span', { class: 'cm-cartbar-n', text: String(n) }), 'Ver pedido'),
      el('strong', { text: fmt(cartTotal()) })
    );
  }

  /* Estado del último pedido (lo actualiza el panel del local) */
  function renderStatus() {
    const order = orders.find((o) => o.id === lastOrderId);
    statusEl.hidden = !order;
    if (!order) return;
    const st = ESTADOS[order.estado];
    const close = el('button', { type: 'button', 'aria-label': 'Ocultar estado del pedido', text: '×' });
    close.addEventListener('click', () => { lastOrderId = null; renderStatus(); });
    statusEl.replaceChildren(
      el('strong', { text: st.emoji + ' Pedido ' + order.id + ' · Mesa ' + order.mesa }),
      el('span', { text: st.cliente }),
      close
    );
    statusEl.setAttribute('role', 'status');
  }


  /* ─────────── Hoja "Tu pedido" ─────────── */
  let lastOpener = null;

  function openSheet() {
    sheetMode = 'cart';
    lastOpener = cartbar;
    sheet.hidden = false;
    scrollEl.inert = true;
    cartbar.inert = true;
    renderSheet();
    const first = sheetPanel.querySelector('[data-action="close"]');
    if (first) first.focus();
  }

  function closeSheet() {
    sheet.hidden = true;
    scrollEl.inert = false;
    cartbar.inert = false;
    if (lastOpener && !lastOpener.hidden) lastOpener.focus();
  }

  cartbar.addEventListener('click', openSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

  function renderSheet() {
    if (sheetMode === 'done' && lastSent) {
      const o = lastSent;
      sheetPanel.replaceChildren(
        el('div', { class: 'cm-done' },
          el('div', { class: 'cm-done-icon', 'aria-hidden': 'true', text: '🎉' }),
          el('h3', { text: '¡Pedido enviado!' }),
          el('p', { text: 'Pedido ' + o.id + ' · Mesa ' + o.mesa + ' · ' + fmt(o.total) + '. El local ya lo recibió: en esta demo lo ves en el panel, y el estado se actualiza acá.' })
        ),
        el('button', { type: 'button', class: 'cm-primary', 'data-action': 'gopanel', text: 'Ver cómo llega al local' }),
        el('button', { type: 'button', class: 'cm-secondary', 'data-action': 'close', text: 'Seguir mirando el menú' })
      );
      return;
    }

    const ids = cartIds();
    const nota = el('textarea', { id: 'cmNota', maxlength: '120', placeholder: 'Ej: sin azúcar, leche tibia…' });
    nota.value = notaValue;
    nota.addEventListener('input', () => { notaValue = nota.value; });

    sheetPanel.replaceChildren(
      el('div', { class: 'cm-sheet-head' },
        el('h3', { class: 'cm-sheet-title', text: 'Tu pedido' }),
        el('button', { type: 'button', class: 'cm-sheet-close', 'data-action': 'close', 'aria-label': 'Cerrar', text: '✕' })
      ),
      ids.length
        ? el('ul', { class: 'cm-lines' }, ids.map((id) => {
            const it = byId(id);
            return el('li', { class: 'cm-line' },
              el('div', null, el('strong', { text: it.nombre }), el('small', { text: fmt(it.precio) + ' c/u' })),
              el('span', { class: 'cm-line-total', text: fmt(it.precio * cart[id]) }),
              stepper(id, cart[id], it.nombre, 's')
            );
          }))
        : el('p', { class: 'cm-empty', text: 'Tu pedido está vacío.' }),
      el('div', { class: 'cm-nota' }, el('label', { for: 'cmNota', text: 'Nota para la cocina (opcional)' }), nota),
      el('div', { class: 'cm-total' }, el('span', { text: 'Total · Mesa ' + mesa }), el('span', { text: fmt(cartTotal()) })),
      ids.length ? el('button', { type: 'button', class: 'cm-primary', 'data-action': 'send', text: 'Enviar pedido' }) : null
    );
  }

  sheetPanel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === 'close') closeSheet();
    else if (a === 'send') sendOrder();
    else if (a === 'gopanel') { closeSheet(); goToOrders(); }
    else if (a === 'sinc' || a === 'sdec') {
      const id = b.dataset.id;
      setQty(id, (cart[id] || 0) + (a === 'sinc' ? 1 : -1));
      const again = sheetPanel.querySelector('[data-id="' + id + '"][data-action="' + a + '"]');
      if (again) again.focus();
      else if (!cartIds().length) { const c = sheetPanel.querySelector('[data-action="close"]'); if (c) c.focus(); }
    }
  });

  function sendOrder() {
    const ids = cartIds();
    if (!ids.length) return;
    const order = {
      id: 'A-' + orderSeq++,
      mesa: mesa,
      lines: ids.map((id) => ({ nombre: byId(id).nombre, qty: cart[id], precio: byId(id).precio })),
      total: cartTotal(),
      nota: notaValue.trim(),
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      estado: 'nuevo'
    };
    orders.unshift(order);
    lastOrderId = order.id;
    lastSent = order;
    cart = {};
    notaValue = '';
    sheetMode = 'done';
    renderList();
    renderCartbar();
    renderStatus();
    renderSheet();
    renderOrders();
    const btn = sheetPanel.querySelector('[data-action="gopanel"]');
    if (btn) btn.focus();
    track('demo_menu_pedido');
  }


  /* ─────────── Panel del local ─────────── */
  function buildPanelMenu() {
    paneMenu.replaceChildren();
    CATEGORIAS.forEach((cat) => {
      paneMenu.append(el('h3', { class: 'pn-group', text: cat.emoji + ' ' + cat.nombre }));
      menu.filter((it) => it.cat === cat.id).forEach((it) => {
        paneMenu.append(el('div', { class: 'pn-row', 'data-row': it.id },
          el('span', { class: 'pn-emoji', 'aria-hidden': 'true', text: it.emoji }),
          el('div', { class: 'pn-name' }, el('strong', { text: it.nombre }), el('small', { text: 'Disponible' })),
          el('label', { class: 'pn-price' }, '$',
            el('input', { type: 'number', min: '0', step: '100', inputmode: 'numeric', value: String(it.precio), 'aria-label': 'Precio de ' + it.nombre, 'data-price': it.id })),
          el('button', { type: 'button', class: 'pn-switch', role: 'switch', 'aria-checked': 'true', 'aria-label': it.nombre + ': disponible', 'data-avail': it.id }, el('span'))
        ));
      });
    });
  }

  let priceToastTimer = null;
  paneMenu.addEventListener('input', (e) => {
    const input = e.target.closest('[data-price]');
    if (!input) return;
    const it = byId(input.dataset.price);
    const value = Number(input.value);
    if (!it || input.value === '' || !isFinite(value) || value < 0) return;
    it.precio = Math.round(value);
    refreshItem(it.id, true);
    renderCartbar();
    if (!sheet.hidden && sheetMode === 'cart') renderSheet();
    clearTimeout(priceToastTimer);
    priceToastTimer = setTimeout(() => toast('Precio actualizado: ' + it.nombre + ' → ' + fmt(it.precio)), 450);
    trackOnce('demo_menu_panel');
  });

  paneMenu.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-avail]');
    if (!sw) return;
    const it = byId(sw.dataset.avail);
    it.disponible = !it.disponible;
    sw.setAttribute('aria-checked', String(it.disponible));
    sw.setAttribute('aria-label', it.nombre + ': ' + (it.disponible ? 'disponible' : 'agotado'));
    const row = sw.closest('.pn-row');
    row.classList.toggle('is-off', !it.disponible);
    row.querySelector('small').textContent = it.disponible ? 'Disponible' : 'Agotado';
    if (!it.disponible && cart[it.id]) {
      delete cart[it.id];
      toast('Se agotó ' + it.nombre + ': se quitó del pedido');
    } else {
      toast(it.nombre + (it.disponible ? ': disponible otra vez' : ': marcado como agotado'));
    }
    refreshItem(it.id, true);
    renderCartbar();
    if (!sheet.hidden && sheetMode === 'cart') renderSheet();
    trackOnce('demo_menu_panel');
  });

  function orderNode(o) {
    const st = ESTADOS[o.estado];
    const foot = el('div', { class: 'pn-order-foot' }, el('strong', { text: fmt(o.total) }));
    if (st.boton) foot.append(el('button', { type: 'button', class: 'pn-advance', 'data-order': o.id, text: st.boton }));
    return el('article', { class: 'pn-order' + (o.estado === 'nuevo' ? ' is-new' : ''), 'data-order-card': o.id },
      el('div', { class: 'pn-order-top' },
        el('div', null, el('strong', { text: 'Pedido ' + o.id + ' · Mesa ' + o.mesa }), ' ', el('small', { text: o.hora })),
        el('span', { class: 'pn-pill pn-pill-' + o.estado, text: ESTADO_TXT[o.estado] })
      ),
      el('ul', { class: 'pn-lines' }, o.lines.map((l) => el('li', null, el('span', { text: l.qty + ' × ' + l.nombre }), el('span', { text: fmt(l.qty * l.precio) })))),
      o.nota ? el('p', { class: 'pn-nota', text: 'Nota: ' + o.nota }) : null,
      foot
    );
  }

  function renderOrders() {
    const nuevos = orders.filter((o) => o.estado === 'nuevo').length;
    ['pnBadge', 'swBadge'].forEach((id) => { const b = $(id); b.textContent = String(nuevos); b.hidden = nuevos === 0; });
    panePedidos.replaceChildren();
    if (!orders.length) {
      panePedidos.append(el('div', { class: 'pn-empty' }, el('strong', { text: 'Todavía no hay pedidos' }), 'Hacé un pedido desde el menú del celular y aparece acá al instante.'));
      return;
    }
    orders.forEach((o) => panePedidos.append(orderNode(o)));
  }

  panePedidos.addEventListener('click', (e) => {
    const b = e.target.closest('[data-order]');
    if (!b) return;
    const o = orders.find((x) => x.id === b.dataset.order);
    if (!o || !ESTADOS[o.estado].siguiente) return;
    o.estado = ESTADOS[o.estado].siguiente;
    renderOrders();
    renderStatus();
    const again = panePedidos.querySelector('[data-order="' + o.id + '"]');
    if (again) again.focus();
    if (o.id === lastOrderId) toast(ESTADOS[o.estado].emoji + ' ' + ESTADOS[o.estado].cliente);
    trackOnce('demo_menu_panel');
  });

  /* Pestañas del panel y selector Cliente / Local (celular) */
  function setPanelTab(which) {
    const menuOn = which === 'menu';
    $('tabMenu').setAttribute('aria-selected', String(menuOn));
    $('tabPedidos').setAttribute('aria-selected', String(!menuOn));
    paneMenu.hidden = !menuOn;
    panePedidos.hidden = menuOn;
  }
  $('tabMenu').addEventListener('click', () => setPanelTab('menu'));
  $('tabPedidos').addEventListener('click', () => setPanelTab('pedidos'));

  function setView(which) {
    stage.dataset.view = which;
    $('swCliente').setAttribute('aria-selected', String(which === 'cliente'));
    $('swLocal').setAttribute('aria-selected', String(which === 'local'));
  }
  $('swCliente').addEventListener('click', () => setView('cliente'));
  $('swLocal').addEventListener('click', () => setView('local'));

  function goToOrders() {
    setPanelTab('pedidos');
    if (isMobile()) setView('local');
    $('tabPedidos').focus({ preventScroll: !isMobile() });
  }


  /* ─────────── Reiniciar ─────────── */
  function resetDemo() {
    initState();
    sheet.hidden = true;
    scrollEl.inert = false;
    cartbar.inert = false;
    buildStatic();
    buildPanelMenu();
    renderList();
    renderCartbar();
    renderStatus();
    renderOrders();
    setPanelTab('menu');
    setView('cliente');
    scrollEl.scrollTop = 0;
    toast('Demo reiniciada');
  }
  $('pnReset').addEventListener('click', resetDemo);


  /* ─────────── Inicio ─────────── */
  initState();
  buildStatic();
  buildPanelMenu();
  renderList();
  renderCartbar();
  renderStatus();
  renderOrders();
  if (isMobile()) $('introSteps').removeAttribute('open');
})();
