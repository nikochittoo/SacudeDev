/* =============================================
   SACUDE DEVS — Demo conceptual: E-commerce (mini tienda)
   Todo ocurre en el navegador: no hay servidor, no se procesa ningún pago
   ni se guarda nada. La tienda y el panel comparten el mismo estado.
   ============================================= */
(function () {
  'use strict';

  const isNarrow = () => window.matchMedia('(max-width: 1079px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────── Datos de la demo (negocio ficticio) ─────────── */
  const CATEGORIAS = [
    { id: 'plantas',    nombre: 'Plantas',    emoji: '🌿', g: ['#3E7C4F', '#8CC58A'] },
    { id: 'macetas',    nombre: 'Macetas',    emoji: '🏺', g: ['#B4573B', '#E6A37F'] },
    { id: 'accesorios', nombre: 'Accesorios', emoji: '🧰', g: ['#3F7CA6', '#94C8E6'] }
  ];

  // precio = precio base; cada variante suma "extra" al precio base
  const PRODUCTOS_INICIAL = [
    { id: 'monstera',   cat: 'plantas', emoji: '🌿', nombre: 'Monstera deliciosa', desc: 'Hojas grandes y perforadas. Ideal para interiores luminosos.', precio: 14500, stock: 8,
      variantes: [{ id: 'ch', nombre: 'Chica · maceta 14', extra: 0 }, { id: 'md', nombre: 'Mediana · maceta 20', extra: 10000 }, { id: 'gr', nombre: 'Grande · maceta 30', extra: 24500 }] },
    { id: 'cactus',     cat: 'plantas', emoji: '🌵', nombre: 'Cactus columnar', desc: 'Resistente, de poco riego y mucho carácter.', precio: 6800, stock: 12,
      variantes: [{ id: 'ch', nombre: 'Chico', extra: 0 }, { id: 'md', nombre: 'Mediano', extra: 5100 }] },
    { id: 'suculentas', cat: 'plantas', emoji: '🪴', nombre: 'Pack de 3 suculentas', desc: 'Variedades surtidas, en macetitas de barro.', precio: 9800, antes: 12000, stock: 15 },
    { id: 'helecho',    cat: 'plantas', emoji: '🌱', nombre: 'Helecho Boston', desc: 'Aporta frescura y humedad al ambiente.', precio: 13200, stock: 5 },
    { id: 'ficus',      cat: 'plantas', emoji: '🌳', nombre: 'Ficus lyrata', desc: 'Hojas en forma de violín. Le encanta la luz indirecta.', precio: 31500, stock: 3,
      variantes: [{ id: 'md', nombre: 'Mediano', extra: 0 }, { id: 'gr', nombre: 'Grande', extra: 20500 }] },
    { id: 'potus',      cat: 'plantas', emoji: '🍃', nombre: 'Potus colgante', desc: 'Fácil de cuidar, perfecto para colgar.', precio: 8900, stock: 20 },

    { id: 'ceramica',   cat: 'macetas', emoji: '🏺', nombre: 'Maceta de cerámica', desc: 'Esmaltada, con plato incluido.', precio: 5400, stock: 10,
      variantes: [{ id: 'ch', nombre: 'Chica · 12 cm', extra: 0 }, { id: 'md', nombre: 'Mediana · 18 cm', extra: 3500 }, { id: 'gr', nombre: 'Grande · 25 cm', extra: 9400 }] },
    { id: 'macrame',    cat: 'macetas', emoji: '🧶', nombre: 'Macetero colgante de macramé', desc: 'Hecho a mano, con cadena para colgar.', precio: 6500, stock: 9 },
    { id: 'soporte',    cat: 'macetas', emoji: '🪵', nombre: 'Soporte de madera', desc: 'Eleva tus plantas y suma estilo.', precio: 12800, stock: 6 },

    { id: 'sustrato',   cat: 'accesorios', emoji: '🪣', nombre: 'Sustrato premium (5 L)', desc: 'Mezcla aireada para plantas de interior.', precio: 4200, stock: 25 },
    { id: 'riego',      cat: 'accesorios', emoji: '💧', nombre: 'Kit de riego', desc: 'Regadera de pico largo y rociador.', precio: 7900, stock: 14 },
    { id: 'fertil',     cat: 'accesorios', emoji: '🧴', nombre: 'Fertilizante líquido', desc: 'Para hojas verdes y plantas fuertes.', precio: 3600, stock: 18 },
    { id: 'tijera',     cat: 'accesorios', emoji: '✂️', nombre: 'Tijera de podar', desc: 'Hoja de acero inoxidable.', precio: 6200, stock: 7 }
  ];

  const AJUSTES_INICIAL = { cuponCodigo: 'BROTE10', cuponActivo: true, cuponPct: 10, envioCosto: 2500, envioGratis: 30000 };

  const ESTADOS = {
    nuevo:      { pill: () => 'Recibido',   emoji: () => '📨', cliente: () => 'Recibimos tu pedido', boton: () => 'Preparar pedido', sig: 'preparando' },
    preparando: { pill: () => 'Preparando', emoji: () => '📦', cliente: () => 'Estamos preparando tu compra', boton: (o) => (o.entrega === 'envio' ? 'Marcar enviado' : 'Marcar listo para retirar'), sig: 'despachado' },
    despachado: { pill: (o) => (o.entrega === 'envio' ? 'Enviado' : 'Para retirar'), emoji: (o) => (o.entrega === 'envio' ? '🚚' : '🛍️'),
                  cliente: (o) => (o.entrega === 'envio' ? 'Tu pedido está en camino' : 'Tu pedido está listo para retirar'), boton: () => 'Marcar entregado', sig: 'entregado' },
    entregado:  { pill: () => 'Entregado',  emoji: () => '🌿', cliente: () => 'Entregado. ¡Que lo disfrutes!', boton: null, sig: null }
  };

  const ENTREGAS = { envio: 'Envío a domicilio', retiro: 'Retiro en el vivero' };
  const PAGOS = { tarjeta: 'Tarjeta', transferencia: 'Transferencia', efectivo: 'Efectivo al retirar' };
  const PAGO_NOTA = {
    tarjeta: 'Pago aprobado (demo: no se procesó ningún pago real).',
    transferencia: 'En una tienda real acá verías los datos para transferir.',
    efectivo: 'Pagás cuando retirás tu pedido.'
  };

  /* ─────────── Utilidades ─────────── */
  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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
  const scrollEl = $('shScroll');
  const grid = $('shGrid');
  const bannerEl = $('shBanner');
  const statusEl = $('shStatus');
  const catsEl = $('shCats');
  const toastEl = $('shToast');
  const cartBtn = $('shCartBtn');
  const cartN = $('shCartN');
  const overlayModal = $('shModal');
  const modalPanel = $('shModalPanel');
  const overlayDrawer = $('shDrawer');
  const drawerPanel = $('shDrawerPanel');
  const paneProductos = $('paneProductos');
  const panePedidos = $('panePedidos');
  const paneAjustes = $('paneAjustes');


  /* ─────────── Estado compartido ─────────── */
  let productos, ajustes, cart, cupon, orders, orderSeq, filtro, lastOrderId, lastSent;
  let drawerStep, checkout, couponText, couponMsg, modal, opener;

  function initState() {
    productos = PRODUCTOS_INICIAL.map((p) => Object.assign({}, p, { publicado: true, variantes: p.variantes ? p.variantes.map((v) => Object.assign({}, v)) : null }));
    ajustes = Object.assign({}, AJUSTES_INICIAL);
    cart = {};
    cupon = null;
    orders = [];
    orderSeq = 1001;
    filtro = { cat: 'todo', q: '', sort: 'rel' };
    lastOrderId = null;
    lastSent = null;
    drawerStep = 'cart';
    checkout = { nombre: '', entrega: 'envio', pago: 'tarjeta' };
    couponText = '';
    couponMsg = null;
    modal = null;
    opener = null;
  }

  const prod = (id) => productos.find((p) => p.id === id);
  const variante = (p, vid) => (p.variantes || []).find((v) => v.id === vid) || null;
  const unit = (p, vid) => p.precio + (variante(p, vid) ? variante(p, vid).extra : 0);
  const keyOf = (pid, vid) => pid + '|' + (vid || '-');
  const parseKey = (k) => { const i = k.indexOf('|'); const v = k.slice(i + 1); return { pid: k.slice(0, i), vid: v === '-' ? null : v }; };
  const qtyOf = (pid) => Object.keys(cart).filter((k) => parseKey(k).pid === pid).reduce((n, k) => n + cart[k], 0);
  const avail = (p) => Math.max(0, p.stock - qtyOf(p.id));
  const cartCount = () => Object.keys(cart).reduce((n, k) => n + cart[k], 0);
  const cat = (id) => CATEGORIAS.find((c) => c.id === id);

  function lines() {
    return Object.keys(cart).map((k) => {
      const { pid, vid } = parseKey(k);
      const p = prod(pid);
      const u = unit(p, vid);
      return { key: k, p: p, v: variante(p, vid), qty: cart[k], unit: u, total: u * cart[k] };
    });
  }
  const subtotal = () => lines().reduce((t, l) => t + l.total, 0);
  const cuponVigente = () => !!cupon && ajustes.cuponActivo && cupon === ajustes.cuponCodigo;
  const descuento = () => (cuponVigente() ? Math.round(subtotal() * ajustes.cuponPct / 100) : 0);
  const baseEnvio = () => subtotal() - descuento();
  const envioDe = (entrega) => (entrega === 'envio' && baseEnvio() < ajustes.envioGratis ? ajustes.envioCosto : 0);
  const totalCon = (entrega) => baseEnvio() + envioDe(entrega);


  /* ─────────── Aviso breve ─────────── */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2400);
  }


  /* ─────────── Tienda: encabezado, banner, filtros ─────────── */
  function renderBanner() {
    const parts = [
      ajustes.envioGratis > 0
        ? el('span', null, '🚚 Envío gratis desde ', el('strong', { text: fmt(ajustes.envioGratis) }))
        : el('span', null, '🚚 ', el('strong', { text: 'Envío gratis' }), ' en todas las compras')
    ];
    if (ajustes.cuponActivo) parts.push(el('span', null, '🏷️ Cupón ', el('strong', { text: ajustes.cuponCodigo }), ' = ' + ajustes.cuponPct + '% off'));
    bannerEl.replaceChildren(...parts);
  }

  function buildToolbar() {
    catsEl.replaceChildren(
      el('button', { type: 'button', class: 'sh-cat', 'data-cat': 'todo', 'aria-pressed': 'true', text: 'Todo' }),
      ...CATEGORIAS.map((c) => el('button', { type: 'button', class: 'sh-cat', 'data-cat': c.id, 'aria-pressed': 'false', text: c.emoji + ' ' + c.nombre }))
    );
    $('shSearch').value = '';
    $('shSort').value = 'rel';
  }

  catsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.sh-cat');
    if (!b) return;
    filtro.cat = b.dataset.cat;
    catsEl.querySelectorAll('.sh-cat').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderGrid();
  });
  $('shSearch').addEventListener('input', (e) => { filtro.q = e.target.value; renderGrid(); });
  $('shSort').addEventListener('change', (e) => { filtro.sort = e.target.value; renderGrid(); });

  function renderCartBtn(bump) {
    const n = cartCount();
    cartN.textContent = String(n);
    cartBtn.setAttribute('aria-label', 'Abrir carrito: ' + n + (n === 1 ? ' producto' : ' productos'));
    if (bump && !reduceMotion) {
      cartN.classList.remove('is-bump');
      void cartN.offsetWidth;
      cartN.classList.add('is-bump');
    }
  }


  /* ─────────── Tienda: productos ─────────── */
  function visibles() {
    let list = productos.filter((p) => p.publicado);
    if (filtro.cat !== 'todo') list = list.filter((p) => p.cat === filtro.cat);
    const q = norm(filtro.q.trim());
    if (q) list = list.filter((p) => norm(p.nombre).includes(q));
    if (filtro.sort === 'asc') list = list.slice().sort((a, b) => a.precio - b.precio);
    if (filtro.sort === 'desc') list = list.slice().sort((a, b) => b.precio - a.precio);
    return list;
  }

  function tileNode(p, badge) {
    const c = cat(p.cat);
    return el('span', { class: 'sh-tile', style: '--g1:' + c.g[0] + ';--g2:' + c.g[1], 'aria-hidden': 'true' },
      el('span', { class: 'sh-emoji', text: p.emoji }),
      badge ? el('span', { class: 'sh-badge sh-badge-' + badge.kind, text: badge.text }) : null);
  }

  function badgeOf(p) {
    if (p.stock <= 0) return { kind: 'agotado', text: 'Sin stock' };
    if (p.stock <= 3) return { kind: 'pocas', text: p.stock === 1 ? '¡Última unidad!' : '¡Últimas ' + p.stock + '!' };
    if (p.antes) return { kind: 'oferta', text: 'Oferta' };
    return null;
  }

  function cardNode(p) {
    const hasVar = !!(p.variantes && p.variantes.length);
    return el('article', { class: 'sh-card' + (p.stock <= 0 ? ' is-off' : ''), 'data-card': p.id },
      el('button', { type: 'button', class: 'sh-card-open', 'data-open': p.id, 'aria-label': 'Ver detalle de ' + p.nombre },
        tileNode(p, badgeOf(p)),
        el('span', { class: 'sh-name', text: p.nombre })),
      el('div', { class: 'sh-price-row' },
        hasVar ? el('small', { text: 'Desde' }) : null,
        el('strong', { text: fmt(p.precio) }),
        p.antes ? el('s', { text: fmt(p.antes) }) : null),
      p.stock <= 0
        ? el('span', { class: 'sh-soldout', text: 'Sin stock' })
        : el('button', { type: 'button', class: 'sh-add', 'data-add': p.id, 'aria-label': (hasVar ? 'Elegir opciones de ' : 'Agregar al carrito: ') + p.nombre, text: hasVar ? 'Elegir opciones' : 'Agregar' })
    );
  }

  function renderGrid() {
    const list = visibles();
    grid.replaceChildren();
    if (!list.length) {
      const clear = el('button', { type: 'button', text: 'Ver todos los productos' });
      clear.addEventListener('click', () => {
        filtro = { cat: 'todo', q: '', sort: 'rel' };
        buildToolbar();
        renderGrid();
      });
      grid.append(el('div', { class: 'sh-empty' }, 'No encontramos productos con ese filtro.', el('br'), clear));
      return;
    }
    list.forEach((p) => grid.append(cardNode(p)));
  }

  function refreshCard(pid, flash) {
    const old = grid.querySelector('[data-card="' + pid + '"]');
    if (!old) return;
    const fresh = cardNode(prod(pid));
    old.replaceWith(fresh);
    if (flash) {
      fresh.classList.add('is-flash');
      setTimeout(() => fresh.classList.remove('is-flash'), 1500);
    }
  }

  grid.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    const add = e.target.closest('[data-add]');
    if (open) { opener = open; openModal(open.dataset.open); return; }
    if (add) {
      const p = prod(add.dataset.add);
      if (p.variantes && p.variantes.length) { opener = add; openModal(p.id); }
      else addToCart(p.id, null, 1);
    }
  });


  /* ─────────── Carrito ─────────── */
  function addToCart(pid, vid, qty) {
    const p = prod(pid);
    if (!p || !p.publicado) return false;
    const can = avail(p);
    if (can <= 0) { toast('No quedan más unidades de ' + p.nombre); return false; }
    const add = Math.min(qty, can);
    cart[keyOf(pid, vid)] = (cart[keyOf(pid, vid)] || 0) + add;
    toast(add < qty ? 'Solo quedaban ' + add + ': las agregamos' : p.nombre + ' agregado al carrito');
    onCartChanged(true);
    return true;
  }

  function setLineQty(key, q) {
    const { pid } = parseKey(key);
    const p = prod(pid);
    const otros = qtyOf(pid) - (cart[key] || 0);
    q = Math.min(q, Math.max(0, p.stock - otros));
    if (q <= 0) delete cart[key]; else cart[key] = q;
    onCartChanged(false);
  }

  function onCartChanged(bump) {
    renderCartBtn(bump);
    if (!overlayDrawer.hidden && drawerStep === 'cart') renderDrawer();
    if (!overlayModal.hidden) renderModal();
  }

  /* Ajusta el carrito si el panel cambió stock o ocultó productos */
  function reconcile() {
    let changed = false;
    Object.keys(cart).forEach((k) => {
      const p = prod(parseKey(k).pid);
      if (!p.publicado || p.stock <= 0) { delete cart[k]; changed = true; }
    });
    productos.forEach((p) => {
      let exceso = qtyOf(p.id) - p.stock;
      if (exceso <= 0) return;
      Object.keys(cart).filter((k) => parseKey(k).pid === p.id).forEach((k) => {
        if (exceso <= 0) return;
        const take = Math.min(cart[k], exceso);
        cart[k] -= take;
        exceso -= take;
        if (cart[k] <= 0) delete cart[k];
      });
      changed = true;
    });
    return changed;
  }

  cartBtn.addEventListener('click', () => { opener = cartBtn; openDrawer('cart'); });


  /* ─────────── Ficha del producto ─────────── */
  function setInert() { scrollEl.inert = !(overlayModal.hidden && overlayDrawer.hidden); }

  function openModal(pid) {
    const p = prod(pid);
    if (!p) return;
    modal = { pid: pid, vid: p.variantes ? p.variantes[0].id : null, qty: 1 };
    overlayModal.hidden = false;
    setInert();
    renderModal();
    const x = modalPanel.querySelector('[data-action="close"]');
    if (x) x.focus();
  }

  function closeModal(returnFocus) {
    overlayModal.hidden = true;
    modal = null;
    setInert();
    if (returnFocus !== false && opener && document.contains(opener)) opener.focus();
  }

  function modalQtyBtn(label, action, text, disabled) {
    return el('button', { type: 'button', 'data-action': action, 'aria-label': label, disabled: disabled, text: text });
  }

  function renderModal() {
    const p = prod(modal.pid);
    const can = avail(p);
    if (modal.qty > can) modal.qty = Math.max(1, can);
    const price = unit(p, modal.vid);
    const hasVar = !!(p.variantes && p.variantes.length);

    const info = el('div', null,
      el('h3', { text: p.nombre }),
      el('p', { class: 'sh-modal-desc', text: p.desc }),
      el('div', { class: 'sh-bigprice' }, el('strong', { text: fmt(price) }), p.antes && !hasVar ? el('s', { text: fmt(p.antes) }) : null)
    );
    if (hasVar) {
      info.append(
        el('p', { class: 'sh-fieldlabel', id: 'shOptLabel', text: 'Elegí una opción' }),
        el('div', { class: 'sh-opts', role: 'radiogroup', 'aria-labelledby': 'shOptLabel' }, p.variantes.map((v) => {
          const input = el('input', { type: 'radio', name: 'shvar', value: v.id });
          input.checked = v.id === modal.vid;
          return el('label', { class: 'sh-opt' }, input, el('span', { text: v.nombre + (v.extra ? ' · ' + fmt(p.precio + v.extra) : ' · ' + fmt(p.precio)) }));
        }))
      );
    }
    info.append(
      el('p', { class: 'sh-stockline' + (p.stock <= 5 ? ' is-low' : ''), text: can <= 0 ? 'Ya tenés en el carrito todo el stock disponible.' : (p.stock <= 5 ? 'Quedan ' + p.stock + ' unidades' : 'Hay stock disponible') }),
      el('div', { class: 'sh-modal-actions' },
        el('div', { class: 'sh-qty', role: 'group', 'aria-label': 'Cantidad' },
          modalQtyBtn('Quitar una unidad', 'mdec', '−', modal.qty <= 1),
          el('span', { text: String(modal.qty), 'aria-live': 'polite' }),
          modalQtyBtn('Agregar una unidad', 'minc', '+', modal.qty >= can)),
        el('button', { type: 'button', class: 'sh-primary', 'data-action': 'madd', disabled: can <= 0, text: 'Agregar al carrito · ' + fmt(price * modal.qty) })
      )
    );

    modalPanel.replaceChildren(
      el('button', { type: 'button', class: 'sh-x', 'data-action': 'close', 'aria-label': 'Cerrar', text: '✕' }),
      el('div', { class: 'sh-modal-grid' }, tileNode(p, badgeOf(p)), info)
    );
  }

  modalPanel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b || !modal) return;
    const a = b.dataset.action;
    if (a === 'close') { closeModal(); return; }
    const p = prod(modal.pid);
    if (a === 'mdec') modal.qty = Math.max(1, modal.qty - 1);
    else if (a === 'minc') modal.qty = Math.min(avail(p), modal.qty + 1);
    else if (a === 'madd') {
      if (addToCart(modal.pid, modal.vid, modal.qty)) closeModal();
      return;
    }
    renderModal();
    const again = modalPanel.querySelector('[data-action="' + a + '"]:not(:disabled)') || modalPanel.querySelector('[data-action="madd"]');
    if (again) again.focus();
  });

  modalPanel.addEventListener('change', (e) => {
    if (e.target.name !== 'shvar' || !modal) return;
    modal.vid = e.target.value;
    renderModal();
    const r = modalPanel.querySelector('input[name="shvar"][value="' + modal.vid + '"]');
    if (r) r.focus();
  });

  overlayModal.addEventListener('click', (e) => { if (e.target === overlayModal) closeModal(); });


  /* ─────────── Carrito lateral y checkout ─────────── */
  function openDrawer(step) {
    if (!overlayModal.hidden) closeModal(false);
    drawerStep = step;
    overlayDrawer.hidden = false;
    setInert();
    renderDrawer();
    const x = drawerPanel.querySelector('[data-action="close"]');
    if (x) x.focus();
  }

  function closeDrawer(returnFocus) {
    overlayDrawer.hidden = true;
    setInert();
    if (returnFocus !== false && opener && document.contains(opener)) opener.focus();
  }

  overlayDrawer.addEventListener('click', (e) => { if (e.target === overlayDrawer) closeDrawer(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!overlayModal.hidden) closeModal();
    else if (!overlayDrawer.hidden) closeDrawer();
  });

  function drawerHead(title, back) {
    const kids = [];
    if (back) kids.push(el('button', { type: 'button', class: 'sh-secondary', 'data-action': 'back', text: '← Volver' }));
    kids.push(el('h3', { text: title }));
    return el('div', { class: 'sh-dr-head' }, el('div', { style: 'display:flex;align-items:center;gap:.7rem' }, kids),
      el('button', { type: 'button', class: 'sh-x', 'data-action': 'close', 'aria-label': 'Cerrar', text: '✕' }));
  }

  function shipProgress() {
    const base = baseEnvio();
    const g = ajustes.envioGratis;
    if (g <= 0) return el('div', { class: 'sh-ship', text: '🚚 ¡Envío gratis en todas las compras!' });
    const falta = Math.max(0, g - base);
    return el('div', { class: 'sh-ship' },
      falta > 0 ? ['🚚 Te faltan ', el('strong', { text: fmt(falta) }), ' para el envío gratis'] : '🎉 ¡Tenés envío gratis!',
      el('div', { class: 'sh-ship-bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.min(100, Math.round(base / g * 100)) + '%' })));
  }

  function totalsNode(entrega) {
    const d = descuento();
    const rows = [el('div', null, el('span', { text: 'Subtotal' }), el('span', { text: fmt(subtotal()) }))];
    if (d > 0) rows.push(el('div', { class: 'is-disc' }, el('span', { text: 'Cupón ' + cupon + ' (−' + ajustes.cuponPct + '%)' }), el('span', { text: '−' + fmt(d) })));
    if (entrega) {
      const env = envioDe(entrega);
      rows.push(el('div', null, el('span', { text: 'Envío' }), el('span', { text: entrega === 'retiro' ? 'Retiro gratis' : (env === 0 ? 'Gratis' : fmt(env)) })));
    }
    rows.push(el('div', { class: 'is-total' }, el('span', { text: 'Total' }), el('span', { text: fmt(entrega ? totalCon(entrega) : baseEnvio()) })));
    return el('div', { class: 'sh-totals' }, rows);
  }

  function renderDrawer() {
    if (drawerStep === 'done') return renderDone();
    if (drawerStep === 'checkout') return renderCheckout();
    renderCart();
  }

  function renderCart() {
    const ls = lines();
    const couponBlock = cuponVigente()
      ? el('div', { class: 'sh-coupon' },
          el('div', { class: 'sh-coupon-msg is-ok', style: 'flex:1;margin:0;align-self:center', text: '🏷️ Cupón ' + cupon + ' aplicado' }),
          el('button', { type: 'button', 'data-action': 'coupon-remove', text: 'Quitar' }))
      : el('div', null,
          el('div', { class: 'sh-coupon' },
            (() => {
              const input = el('input', { type: 'text', id: 'shCoupon', placeholder: 'Código de cupón', 'aria-label': 'Código de cupón', autocomplete: 'off', maxlength: '20' });
              input.value = couponText;
              input.addEventListener('input', () => { couponText = input.value; });
              input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });
              return input;
            })(),
            el('button', { type: 'button', 'data-action': 'coupon-apply', text: 'Aplicar' })),
          couponMsg ? el('p', { class: 'sh-coupon-msg ' + (couponMsg.ok ? 'is-ok' : 'is-err'), role: 'status', text: couponMsg.text }) : null);

    drawerPanel.replaceChildren(
      drawerHead('Tu carrito'),
      el('div', { class: 'sh-dr-body' },
        ls.length ? [shipProgress(),
          el('ul', { class: 'sh-lines' }, ls.map((l) => el('li', { class: 'sh-line' },
            tileNode(l.p, null),
            el('div', null, el('strong', { text: l.p.nombre }), l.v ? el('small', { text: l.v.nombre }) : null, el('small', { text: fmt(l.unit) + ' c/u' })),
            el('span', { class: 'sh-line-total', text: fmt(l.total) }),
            el('div', { class: 'sh-line-ctrl' },
              el('div', { class: 'sh-qty', role: 'group', 'aria-label': 'Cantidad de ' + l.p.nombre },
                el('button', { type: 'button', 'data-action': 'ldec', 'data-key': l.key, 'aria-label': 'Quitar una unidad de ' + l.p.nombre, text: '−' }),
                el('span', { text: String(l.qty) }),
                el('button', { type: 'button', 'data-action': 'linc', 'data-key': l.key, disabled: l.qty >= l.p.stock - (qtyOf(l.p.id) - l.qty), 'aria-label': 'Agregar una unidad de ' + l.p.nombre, text: '+' })),
              el('button', { type: 'button', class: 'sh-rm', 'data-action': 'lrm', 'data-key': l.key, 'aria-label': 'Quitar ' + l.p.nombre + ' del carrito', text: 'Quitar' })))),
          ),
          couponBlock]
        : el('div', { class: 'sh-empty', style: 'padding:3rem 0' }, el('div', { style: 'font-size:2.6rem', 'aria-hidden': 'true', text: '🛒' }), 'Tu carrito está vacío.')
      ),
      el('div', { class: 'sh-dr-foot' },
        ls.length ? totalsNode(null) : null,
        el('div', { class: 'sh-foot-actions' },
          el('button', { type: 'button', class: 'sh-primary', 'data-action': 'checkout', disabled: !ls.length, text: 'Finalizar compra' }),
          el('button', { type: 'button', class: 'sh-secondary', 'data-action': 'close', text: 'Seguir comprando' })))
    );
  }

  function applyCoupon() {
    const code = couponText.trim().toUpperCase();
    if (!code) couponMsg = { ok: false, text: 'Ingresá un código.' };
    else if (code === ajustes.cuponCodigo && ajustes.cuponActivo) { cupon = code; couponMsg = null; couponText = ''; toast('Cupón aplicado: ' + ajustes.cuponPct + '% off'); }
    else couponMsg = { ok: false, text: 'Ese cupón no existe o ya no está activo.' };
    renderDrawer();
    const f = drawerPanel.querySelector('#shCoupon') || drawerPanel.querySelector('[data-action="coupon-remove"]');
    if (f) f.focus();
  }

  function choice(name, value, title, sub, price, disabled) {
    const input = el('input', { type: 'radio', name: name, value: value, disabled: disabled });
    input.checked = checkout[name] === value;
    return el('label', { class: 'sh-choice' }, input,
      el('span', null, el('b', null, title, sub ? el('small', { text: sub }) : null), price != null ? el('b', { text: price }) : null));
  }

  function renderCheckout() {
    const nombre = el('input', { class: 'sh-input', type: 'text', id: 'shNombre', maxlength: '40', autocomplete: 'off', placeholder: 'Ej: Lucía', 'aria-describedby': 'shNombreErr' });
    nombre.value = checkout.nombre;
    nombre.addEventListener('input', () => {
      checkout.nombre = nombre.value;
      if (nombre.value.trim().length >= 2) { nombre.removeAttribute('aria-invalid'); const er = drawerPanel.querySelector('#shNombreErr'); if (er) er.hidden = true; }
    });
    nombre.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmOrder(); } });

    const envio = envioDe('envio');
    drawerPanel.replaceChildren(
      drawerHead('Finalizar compra', true),
      el('div', { class: 'sh-dr-body' },
        el('p', { class: 'sh-demo-note', text: 'Es una demo: no ingreses datos reales ni de tarjetas. Nada se envía ni se guarda.' }),
        el('div', { class: 'sh-field' }, el('label', { for: 'shNombre', text: 'Tu nombre' }), nombre,
          el('p', { class: 'sh-err', id: 'shNombreErr', role: 'alert', hidden: true, text: 'Decinos tu nombre para armar el pedido.' })),
        el('fieldset', { class: 'sh-field' }, el('legend', { text: 'Entrega' }),
          el('div', { class: 'sh-choices' },
            choice('entrega', 'envio', 'Envío a domicilio', 'Llega en 2 a 4 días hábiles', envio === 0 ? 'Gratis' : fmt(envio)),
            choice('entrega', 'retiro', 'Retiro en el vivero', 'Sin costo', 'Gratis'))),
        el('fieldset', { class: 'sh-field' }, el('legend', { text: 'Forma de pago' }),
          el('div', { class: 'sh-choices' },
            choice('pago', 'tarjeta', 'Tarjeta de crédito o débito', null, null),
            choice('pago', 'transferencia', 'Transferencia bancaria', null, null),
            choice('pago', 'efectivo', 'Efectivo al retirar', checkout.entrega === 'envio' ? 'Solo con retiro en el vivero' : null, null, checkout.entrega === 'envio')))
      ),
      el('div', { class: 'sh-dr-foot' },
        totalsNode(checkout.entrega),
        el('div', { class: 'sh-foot-actions' },
          el('button', { type: 'button', class: 'sh-primary', 'data-action': 'confirm', text: 'Confirmar compra · ' + fmt(totalCon(checkout.entrega)) })))
    );
  }

  function renderDone() {
    const o = lastSent;
    drawerPanel.replaceChildren(
      drawerHead('Compra confirmada'),
      el('div', { class: 'sh-dr-body' },
        el('div', { class: 'sh-done' },
          el('div', { class: 'sh-done-icon', 'aria-hidden': 'true', text: '🎉' }),
          el('h3', { text: '¡Gracias por tu compra, ' + o.nombre + '!' }),
          el('p', { text: 'Pedido ' + o.id + ' · ' + fmt(o.total) + ' · ' + ENTREGAS[o.entrega] + '. ' + PAGO_NOTA[o.pago] }),
          el('p', { text: 'En esta demo el pedido ya llegó al panel de la tienda, y el stock bajó solo.' }))),
      el('div', { class: 'sh-dr-foot' },
        el('div', { class: 'sh-foot-actions' },
          el('button', { type: 'button', class: 'sh-primary', 'data-action': 'gopanel', text: 'Ver cómo llega a la tienda' }),
          el('button', { type: 'button', class: 'sh-secondary', 'data-action': 'close', text: 'Seguir comprando' })))
    );
  }

  drawerPanel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    const key = b.dataset.key;
    if (a === 'close') closeDrawer();
    else if (a === 'checkout') { drawerStep = 'checkout'; renderDrawer(); const n = drawerPanel.querySelector('#shNombre'); if (n) n.focus(); }
    else if (a === 'back') { drawerStep = 'cart'; renderDrawer(); const c = drawerPanel.querySelector('[data-action="checkout"]'); if (c) c.focus(); }
    else if (a === 'confirm') confirmOrder();
    else if (a === 'gopanel') { closeDrawer(false); goToOrders(); }
    else if (a === 'coupon-apply') applyCoupon();
    else if (a === 'coupon-remove') { cupon = null; couponMsg = null; renderDrawer(); const f = drawerPanel.querySelector('#shCoupon'); if (f) f.focus(); }
    else if (a === 'linc' || a === 'ldec' || a === 'lrm') {
      setLineQty(key, a === 'linc' ? cart[key] + 1 : a === 'ldec' ? cart[key] - 1 : 0);
      const again = drawerPanel.querySelector('[data-key="' + key + '"][data-action="' + (a === 'lrm' ? 'linc' : a) + '"]:not(:disabled)')
        || drawerPanel.querySelector('[data-action="checkout"]') || drawerPanel.querySelector('[data-action="close"]');
      if (again) again.focus();
    }
  });

  drawerPanel.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name !== 'entrega' && t.name !== 'pago') return;
    checkout[t.name] = t.value;
    if (checkout.entrega === 'envio' && checkout.pago === 'efectivo') checkout.pago = 'tarjeta';
    renderDrawer();
    const again = drawerPanel.querySelector('input[name="' + t.name + '"][value="' + t.value + '"]');
    if (again) again.focus();
  });

  function confirmOrder() {
    const ls = lines();
    if (!ls.length) return;
    if (checkout.nombre.trim().length < 2) {
      const n = drawerPanel.querySelector('#shNombre');
      const er = drawerPanel.querySelector('#shNombreErr');
      if (er) er.hidden = false;
      if (n) { n.setAttribute('aria-invalid', 'true'); n.focus(); }
      return;
    }
    const order = {
      id: '#' + orderSeq++,
      nombre: checkout.nombre.trim(),
      entrega: checkout.entrega,
      pago: checkout.pago,
      lines: ls.map((l) => ({ nombre: l.p.nombre + (l.v ? ' (' + l.v.nombre + ')' : ''), qty: l.qty, total: l.total })),
      subtotal: subtotal(),
      descuento: descuento(),
      envio: envioDe(checkout.entrega),
      total: totalCon(checkout.entrega),
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      estado: 'nuevo'
    };
    ls.forEach((l) => { l.p.stock = Math.max(0, l.p.stock - l.qty); });
    orders.unshift(order);
    lastOrderId = order.id;
    lastSent = order;
    cart = {};
    cupon = null;
    couponText = '';
    couponMsg = null;
    checkout = { nombre: '', entrega: 'envio', pago: 'tarjeta' };
    drawerStep = 'done';
    renderCartBtn(false);
    renderGrid();
    renderStatus();
    renderDrawer();
    renderOrders();
    renderKpis();
    productos.forEach(syncPanelRow);
    const f = drawerPanel.querySelector('[data-action="gopanel"]');
    if (f) f.focus();
    track('demo_tienda_compra');
  }

  /* Estado del último pedido (lo actualiza el panel) */
  function renderStatus() {
    const o = orders.find((x) => x.id === lastOrderId);
    statusEl.hidden = !o;
    if (!o) return;
    const st = ESTADOS[o.estado];
    const close = el('button', { type: 'button', 'aria-label': 'Ocultar estado del pedido', text: '×' });
    close.addEventListener('click', () => { lastOrderId = null; renderStatus(); });
    statusEl.replaceChildren(el('strong', { text: st.emoji(o) + ' Pedido ' + o.id }), el('span', { text: st.cliente(o) }), close);
    statusEl.setAttribute('role', 'status');
  }


  /* ─────────── Panel de la tienda ─────────── */
  function rowSmall(p) {
    const estado = p.stock <= 0 ? 'Sin stock' : (p.stock <= 3 ? 'Últimas ' + p.stock : 'En stock');
    return (p.variantes ? p.variantes.length + ' opciones · ' : '') + (p.publicado ? estado : 'Oculto');
  }

  function syncPanelRow(p) {
    const row = paneProductos.querySelector('[data-row="' + p.id + '"]');
    if (!row) return;
    const price = row.querySelector('[data-price]');
    const stock = row.querySelector('[data-stock]');
    if (document.activeElement !== price) price.value = String(p.precio);
    if (document.activeElement !== stock) stock.value = String(p.stock);
    row.querySelector('small').textContent = rowSmall(p);
    row.classList.toggle('is-off', !p.publicado);
    row.classList.toggle('is-low', p.publicado && p.stock <= 3);
    const sw = row.querySelector('[data-pub]');
    sw.setAttribute('aria-checked', String(p.publicado));
    sw.setAttribute('aria-label', p.nombre + ': ' + (p.publicado ? 'publicado' : 'oculto'));
  }

  function buildPanelProductos() {
    paneProductos.replaceChildren(
      el('div', { class: 'ps-cols', 'aria-hidden': 'true' }, el('span'), el('span', { text: 'Producto' }), el('span', { text: 'Precio' }), el('span', { text: 'Stock' }), el('span', { text: 'Visible' }))
    );
    CATEGORIAS.forEach((c) => {
      paneProductos.append(el('h3', { class: 'pn-group', text: c.emoji + ' ' + c.nombre }));
      productos.filter((p) => p.cat === c.id).forEach((p) => {
        paneProductos.append(el('div', { class: 'ps-row', 'data-row': p.id },
          el('span', { class: 'pn-emoji', 'aria-hidden': 'true', text: p.emoji }),
          el('div', { class: 'ps-name' }, el('strong', { text: p.nombre }), el('small')),
          el('label', { class: 'pn-price' }, '$', el('input', { type: 'number', min: '0', step: '100', inputmode: 'numeric', 'aria-label': 'Precio base de ' + p.nombre, 'data-price': p.id })),
          el('input', { class: 'ps-stock', type: 'number', min: '0', step: '1', inputmode: 'numeric', 'aria-label': 'Stock de ' + p.nombre, 'data-stock': p.id }),
          el('button', { type: 'button', class: 'pn-switch', role: 'switch', 'aria-checked': 'true', 'data-pub': p.id }, el('span'))));
      });
    });
    productos.forEach(syncPanelRow);
  }

  let panelToastTimer = null;
  function panelToast(msg) { clearTimeout(panelToastTimer); panelToastTimer = setTimeout(() => toast(msg), 450); }

  function afterCatalogChange(p, msg) {
    const trimmed = reconcile();
    refreshCard(p.id, true);
    syncPanelRow(p);
    renderCartBtn(false);
    if (!overlayDrawer.hidden && drawerStep === 'cart') renderDrawer();
    if (!overlayModal.hidden) { if (modal && prod(modal.pid).publicado && prod(modal.pid).stock > 0) renderModal(); else closeModal(false); }
    panelToast(trimmed ? 'Stock actualizado: ajustamos tu carrito' : msg);
    trackOnce('demo_tienda_panel');
  }

  paneProductos.addEventListener('input', (e) => {
    const priceIn = e.target.closest('[data-price]');
    const stockIn = e.target.closest('[data-stock]');
    const input = priceIn || stockIn;
    if (!input) return;
    const p = prod((priceIn || stockIn).dataset.price || stockIn.dataset.stock);
    const v = Number(input.value);
    if (!p || input.value === '' || !isFinite(v) || v < 0) return;
    if (priceIn) { p.precio = Math.round(v); afterCatalogChange(p, 'Precio actualizado: ' + p.nombre + ' → ' + fmt(p.precio)); }
    else { p.stock = Math.round(v); afterCatalogChange(p, 'Stock de ' + p.nombre + ': ' + p.stock + (p.stock <= 0 ? ' (sin stock)' : '')); }
  });

  paneProductos.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-pub]');
    if (!sw) return;
    const p = prod(sw.dataset.pub);
    p.publicado = !p.publicado;
    renderGrid();
    afterCatalogChange(p, p.nombre + (p.publicado ? ': visible en la tienda' : ': oculto de la tienda'));
  });

  /* Pedidos */
  function orderNode(o) {
    const st = ESTADOS[o.estado];
    const foot = el('div', { class: 'pn-order-foot' }, el('strong', { text: fmt(o.total) }));
    if (st.boton) foot.append(el('button', { type: 'button', class: 'pn-advance', 'data-order': o.id, text: st.boton(o) }));
    return el('article', { class: 'pn-order' + (o.estado === 'nuevo' ? ' is-new' : '') },
      el('div', { class: 'pn-order-top' },
        el('div', null, el('strong', { text: 'Pedido ' + o.id + ' · ' + o.nombre }), ' ', el('small', { text: o.hora })),
        el('span', { class: 'pn-pill pn-pill-' + (o.estado === 'despachado' ? 'listo' : o.estado), text: st.pill(o) })),
      el('ul', { class: 'pn-lines' }, o.lines.map((l) => el('li', null, el('span', { text: l.qty + ' × ' + l.nombre }), el('span', { text: fmt(l.total) })))),
      el('p', { class: 'pn-nota', text: ENTREGAS[o.entrega] + ' · ' + PAGOS[o.pago] + (o.descuento ? ' · Cupón −' + fmt(o.descuento) : '') + (o.envio ? ' · Envío ' + fmt(o.envio) : '') }),
      foot);
  }

  function renderOrders() {
    const nuevos = orders.filter((o) => o.estado === 'nuevo').length;
    ['pnBadge', 'swBadge'].forEach((id) => { const b = $(id); b.textContent = String(nuevos); b.hidden = nuevos === 0; });
    panePedidos.replaceChildren();
    if (!orders.length) {
      panePedidos.append(el('div', { class: 'pn-empty' }, el('strong', { text: 'Todavía no hay pedidos' }), 'Hacé una compra en la tienda y aparece acá al instante.'));
      return;
    }
    orders.forEach((o) => panePedidos.append(orderNode(o)));
  }

  panePedidos.addEventListener('click', (e) => {
    const b = e.target.closest('[data-order]');
    if (!b) return;
    const o = orders.find((x) => x.id === b.dataset.order);
    if (!o || !ESTADOS[o.estado].sig) return;
    o.estado = ESTADOS[o.estado].sig;
    renderOrders();
    renderStatus();
    const again = panePedidos.querySelector('[data-order="' + o.id + '"]');
    if (again) again.focus();
    if (o.id === lastOrderId) toast(ESTADOS[o.estado].emoji(o) + ' ' + ESTADOS[o.estado].cliente(o));
    trackOnce('demo_tienda_panel');
  });

  function renderKpis() {
    const ventas = orders.reduce((t, o) => t + o.total, 0);
    $('kpiVentas').textContent = fmt(ventas);
    $('kpiPedidos').textContent = String(orders.length);
    $('kpiTicket').textContent = fmt(orders.length ? Math.round(ventas / orders.length) : 0);
  }

  /* Ajustes: cupón y envíos */
  function buildPanelAjustes() {
    const numberField = (key, label) => el('div', { class: 'st-row' }, el('span', { text: label }),
      el('label', { class: 'pn-price' }, '$', el('input', { type: 'number', min: '0', step: '500', inputmode: 'numeric', value: String(ajustes[key]), 'aria-label': label, 'data-set': key })));
    paneAjustes.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Cupón de descuento' }),
        el('p', { text: 'Los clientes lo ingresan en el carrito.' }),
        el('div', { class: 'st-row' }, el('span', null, 'Cupón ', el('span', { class: 'st-code', text: ajustes.cuponCodigo })),
          el('button', { type: 'button', class: 'pn-switch', role: 'switch', 'aria-checked': String(ajustes.cuponActivo), 'aria-label': 'Cupón ' + ajustes.cuponCodigo + ': ' + (ajustes.cuponActivo ? 'activo' : 'inactivo'), 'data-cupon-sw': '1' }, el('span'))),
        el('div', { class: 'st-row' }, el('span', { text: 'Porcentaje de descuento' }),
          el('label', { class: 'pn-price' }, el('input', { type: 'number', min: '1', max: '90', step: '1', inputmode: 'numeric', value: String(ajustes.cuponPct), 'aria-label': 'Porcentaje de descuento del cupón', 'data-set': 'cuponPct' }), '%'))),
      el('section', { class: 'st-card' },
        el('h3', { text: 'Envíos' }),
        el('p', { text: 'Definí cuándo el envío es gratis y cuánto cuesta.' }),
        numberField('envioGratis', 'Envío gratis desde'),
        numberField('envioCosto', 'Costo del envío'))
    );
  }

  function afterSettingsChange(msg) {
    renderBanner();
    if (cupon && !cuponVigente()) { cupon = null; couponMsg = { ok: false, text: 'El cupón ya no está disponible.' }; }
    if (!overlayDrawer.hidden && (drawerStep === 'cart' || drawerStep === 'checkout')) {
      const focusId = document.activeElement && document.activeElement.id;
      renderDrawer();
      if (focusId) { const f = drawerPanel.querySelector('#' + focusId); if (f) f.focus(); }
    }
    panelToast(msg);
    trackOnce('demo_tienda_panel');
  }

  paneAjustes.addEventListener('input', (e) => {
    const input = e.target.closest('[data-set]');
    if (!input) return;
    const key = input.dataset.set;
    let v = Number(input.value);
    if (input.value === '' || !isFinite(v) || v < 0) return;
    v = Math.round(v);
    if (key === 'cuponPct') v = Math.min(90, Math.max(1, v));
    ajustes[key] = v;
    afterSettingsChange(key === 'cuponPct' ? 'Cupón ' + ajustes.cuponCodigo + ': ' + v + '% off' : key === 'envioGratis' ? (v === 0 ? 'Envío gratis en todas las compras' : 'Envío gratis desde ' + fmt(v)) : 'Costo de envío: ' + fmt(v));
  });

  paneAjustes.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-cupon-sw]');
    if (!sw) return;
    ajustes.cuponActivo = !ajustes.cuponActivo;
    sw.setAttribute('aria-checked', String(ajustes.cuponActivo));
    sw.setAttribute('aria-label', 'Cupón ' + ajustes.cuponCodigo + ': ' + (ajustes.cuponActivo ? 'activo' : 'inactivo'));
    afterSettingsChange('Cupón ' + ajustes.cuponCodigo + (ajustes.cuponActivo ? ' activado' : ' desactivado'));
  });


  /* ─────────── Pestañas, vistas y reinicio ─────────── */
  function setPanelTab(which) {
    [['productos', 'tabProductos', paneProductos], ['pedidos', 'tabPedidos', panePedidos], ['ajustes', 'tabAjustes', paneAjustes]].forEach(([id, tab, pane]) => {
      $(tab).setAttribute('aria-selected', String(id === which));
      pane.hidden = id !== which;
    });
  }
  $('tabProductos').addEventListener('click', () => setPanelTab('productos'));
  $('tabPedidos').addEventListener('click', () => setPanelTab('pedidos'));
  $('tabAjustes').addEventListener('click', () => setPanelTab('ajustes'));

  function setView(which) {
    stage.dataset.view = which;
    $('swCliente').setAttribute('aria-selected', String(which === 'cliente'));
    $('swLocal').setAttribute('aria-selected', String(which === 'local'));
  }
  $('swCliente').addEventListener('click', () => setView('cliente'));
  $('swLocal').addEventListener('click', () => setView('local'));

  function goToOrders() {
    setPanelTab('pedidos');
    if (isNarrow()) setView('local');
    $('tabPedidos').focus({ preventScroll: !isNarrow() });
  }

  function renderAll() {
    renderBanner();
    renderGrid();
    renderCartBtn(false);
    renderStatus();
    renderOrders();
    renderKpis();
  }

  function resetDemo() {
    initState();
    overlayModal.hidden = true;
    overlayDrawer.hidden = true;
    setInert();
    buildToolbar();
    buildPanelProductos();
    buildPanelAjustes();
    renderAll();
    setPanelTab('productos');
    setView('cliente');
    scrollEl.scrollTop = 0;
    toast('Demo reiniciada');
  }
  $('pnReset').addEventListener('click', resetDemo);


  /* ─────────── Inicio ─────────── */
  initState();
  buildToolbar();
  buildPanelProductos();
  buildPanelAjustes();
  renderAll();
  if (isNarrow()) $('introSteps').removeAttribute('open');
})();
