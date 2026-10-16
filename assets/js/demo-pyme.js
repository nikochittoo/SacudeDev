/* =============================================
   SACUDE DEVS — Demo conceptual: Web para PyMEs (reserva de turnos)
   Todo ocurre en el navegador: no hay servidor ni se guarda nada.
   El sitio del salón y la agenda comparten el mismo estado.
   ============================================= */
(function () {
  'use strict';

  const isNarrow = () => window.matchMedia('(max-width: 1079px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────── Fechas y horas (todo pasa por acá) ─────────── */
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const SLOT = 30; // minutos por casillero de la agenda

  const ahora = () => new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromISO = (s) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  const hoyISO = () => toISO(ahora());
  const ahoraMin = () => { const d = ahora(); return d.getHours() * 60 + d.getMinutes(); };
  const hhmm = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);

  function etiquetaDia(iso) {
    const hoy = hoyISO();
    if (iso === hoy) return 'Hoy';
    if (iso === toISO(addDays(fromISO(hoy), 1))) return 'Mañana';
    const d = fromISO(iso);
    return DIAS_CORTO[d.getDay()] + ' ' + d.getDate();
  }
  function fechaLarga(iso) {
    const d = fromISO(iso);
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()];
  }

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
  const scrollEl = $('pyScroll');
  const modalEl = $('pyModal');
  const toastEl = $('pyToast');
  const paneAgenda = $('paneAgenda');
  const paneServicios = $('paneServicios');
  const paneEquipo = $('paneEquipo');


  /* ─────────── Datos de la demo (negocio ficticio) ─────────── */
  const SERVICIOS_INICIAL = [
    { id: 'corte',    emoji: '✂️', nombre: 'Corte y lavado',  corto: 'Corte',    dur: 60, precio: 9500,  pros: ['lu', 'mati', 'cami'], desc: 'Corte a tu medida, con lavado y peinado.' },
    { id: 'barba',    emoji: '🧔', nombre: 'Arreglo de barba', corto: 'Barba',    dur: 30, precio: 5500,  pros: ['mati'],               desc: 'Perfilado y cuidado con toalla caliente.' },
    { id: 'color',    emoji: '🎨', nombre: 'Color o mechas',   corto: 'Color',    dur: 90, precio: 24000, pros: ['lu', 'cami'],         desc: 'Coloración profesional con tratamiento.' },
    { id: 'brushing', emoji: '💨', nombre: 'Brushing',         corto: 'Brushing', dur: 60, precio: 8500,  pros: ['lu', 'cami'],         desc: 'Peinado con secador para cualquier ocasión.' },
    { id: 'manos',    emoji: '💅', nombre: 'Manicura',         corto: 'Manos',    dur: 60, precio: 7800,  pros: ['cami'],               desc: 'Cuidado de manos y esmaltado.' }
  ];
  const PROS_INICIAL = [
    { id: 'lu',   nombre: 'Lu',   rol: 'Colorista',         emoji: '👩‍🦰' },
    { id: 'mati', nombre: 'Mati', rol: 'Barbero',           emoji: '👨‍🦱' },
    { id: 'cami', nombre: 'Cami', rol: 'Estilista y manos', emoji: '👩' }
  ];
  const AJUSTES_INICIAL = { apertura: 600, cierre: 1140, dias: [false, true, true, true, true, true, true] }; // domingo cerrado
  const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

  const ESTADO_TXT = { pendiente: 'Por confirmar', confirmado: 'Confirmado', atendido: 'Atendido', cancelado: 'Cancelado' };
  const PILL = { pendiente: 'nuevo', confirmado: 'listo', atendido: 'entregado', cancelado: 'entregado' };


  /* ─────────── Estado compartido ─────────── */
  let servicios, pros, ajustes, turnos, seq, bk, miTurno, agendaDia, selId;

  const srv = (id) => servicios.find((s) => s.id === id);
  const pro = (id) => pros.find((p) => p.id === id);

  const diaAbierto = (iso) => ajustes.dias[fromISO(iso).getDay()];
  function abiertos(n) {
    const out = [];
    for (let i = 0; out.length < n && i < 60; i++) {
      const iso = toISO(addDays(fromISO(hoyISO()), i));
      if (diaAbierto(iso)) out.push(iso);
    }
    return out;
  }

  const vivos = (fecha, proId) => turnos.filter((t) => t.fecha === fecha && t.pro === proId && t.estado !== 'cancelado');
  const libre = (fecha, proId, start, dur) => !vivos(fecha, proId).some((t) => start < t.start + t.dur && t.start < start + dur);
  const elegibles = (s, proSel) => pros.filter((p) => p.activo && s.pros.includes(p.id) && (proSel === 'any' || proSel === p.id));

  function slotsDe(fecha, s, proSel) {
    const res = [];
    const esHoy = fecha === hoyISO();
    const ahoraM = ahoraMin();
    const cands = elegibles(s, proSel);
    for (let t = ajustes.apertura; t + s.dur <= ajustes.cierre; t += SLOT) {
      if (esHoy && t < ahoraM + 30) continue;
      const p = cands.find((c) => libre(fecha, c.id, t, s.dur));
      if (p) res.push({ start: t, pro: p.id });
    }
    return res;
  }

  function proximoLibre() {
    const s = servicios.find((x) => x.visible);
    if (!s) return null;
    const dias = abiertos(14);
    for (let i = 0; i < dias.length; i++) {
      const sl = slotsDe(dias[i], s, 'any');
      if (sl.length) return { fecha: dias[i], start: sl[0].start, pro: sl[0].pro, s: s };
    }
    return null;
  }

  function initState() {
    servicios = SERVICIOS_INICIAL.map((s) => Object.assign({}, s, { pros: s.pros.slice(), visible: true }));
    pros = PROS_INICIAL.map((p) => Object.assign({}, p, { activo: true }));
    ajustes = { apertura: AJUSTES_INICIAL.apertura, cierre: AJUSTES_INICIAL.cierre, dias: AJUSTES_INICIAL.dias.slice() };
    turnos = [];
    seq = 1;
    bk = freshBooking();
    miTurno = null;
    selId = null;
    seedTurnos();
    agendaDia = abiertos(1)[0];
  }

  /* Turnos de ejemplo, repartidos en los próximos días abiertos */
  function seedTurnos() {
    const dias = abiertos(4);
    const plan = [
      [0, 600, 'lu', 'color', 'Marina'],
      [0, 660, 'mati', 'corte', 'Joaquín'],
      [0, 720, 'cami', 'manos', 'Paula'],
      [0, 930, 'mati', 'barba', 'Tomás'],
      [0, 990, 'lu', 'brushing', 'Sofía'],
      [1, 630, 'cami', 'corte', 'Ana'],
      [1, 840, 'lu', 'color', 'Carla', 'pendiente'],
      [1, 1020, 'mati', 'corte', 'Ezequiel'],
      [2, 690, 'mati', 'barba', 'Nico'],
      [2, 900, 'cami', 'brushing', 'Valeria'],
      [3, 600, 'lu', 'corte', 'Julián']
    ];
    plan.forEach((r) => {
      const fecha = dias[r[0]];
      if (!fecha) return;
      const s = srv(r[3]);
      const pasado = fecha === hoyISO() && r[1] + s.dur <= ahoraMin();
      turnos.push({ id: 'T' + (seq++), tipo: 'turno', fecha: fecha, start: r[1], dur: s.dur, pro: r[2], servicio: r[3],
        cliente: r[4], nota: '', precio: s.precio, estado: r[5] || (pasado ? 'atendido' : 'confirmado') });
    });
  }


  /* ─────────── Aviso breve ─────────── */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2600);
  }
  let panelToastTimer = null;
  function panelToast(msg) { clearTimeout(panelToastTimer); panelToastTimer = setTimeout(() => toast(msg), 450); }


  /* ─────────── Sitio del salón ─────────── */
  function renderServiciosSitio() {
    const vis = servicios.filter((s) => s.visible);
    $('pyServices').replaceChildren(...(vis.length ? vis.map((s) => el('article', { class: 'py-service', 'data-srv': s.id },
      el('span', { class: 'emo', 'aria-hidden': 'true', text: s.emoji }),
      el('h3', { text: s.nombre }),
      el('p', { text: s.desc }),
      el('div', { class: 'py-meta' }, el('span', { text: '⏱ ' + s.dur + ' min' }), el('strong', { text: fmt(s.precio) })),
      el('button', { type: 'button', class: 'py-cta is-ghost', 'data-reservar': s.id, 'aria-label': 'Reservar ' + s.nombre, text: 'Reservar' })
    )) : [el('p', { class: 'py-noslots', style: 'grid-column:1/-1', text: 'Por ahora no hay servicios disponibles.' })]));
  }

  function flashServicio(id) {
    const card = $('pyServices').querySelector('[data-srv="' + id + '"]');
    if (!card) return;
    card.classList.add('is-flash');
    setTimeout(() => card.classList.remove('is-flash'), 1500);
  }

  function renderEquipoSitio() {
    $('pyTeam').replaceChildren(...pros.map((p) => el('article', { class: 'py-pro' + (p.activo ? '' : ' is-off') },
      el('div', { class: 'avatar', 'aria-hidden': 'true', text: p.emoji }),
      el('strong', { text: p.nombre }),
      el('small', { text: p.rol }),
      p.activo ? null : el('div', null, el('span', { class: 'tag', text: 'De vacaciones' }))
    )));
  }

  function renderHorariosSitio() {
    const hoyDia = ahora().getDay();
    $('pyHours').replaceChildren(...ORDEN_DIAS.map((d) => {
      const abierto = ajustes.dias[d];
      return el('li', { class: d === hoyDia ? 'is-today' : null },
        el('span', { text: DIAS[d][0].toUpperCase() + DIAS[d].slice(1) }),
        el('span', { class: abierto ? null : 'closed', text: abierto ? hhmm(ajustes.apertura) + ' a ' + hhmm(ajustes.cierre) : 'Cerrado' }));
    }));
  }

  function renderProximo() {
    const box = $('pyNext');
    const n = proximoLibre();
    if (!n) { box.replaceChildren(el('span', { text: 'Sin horarios disponibles por ahora' })); return; }
    box.replaceChildren(el('i', { 'aria-hidden': 'true' }),
      el('span', null, 'Próximo turno libre: ', el('strong', { text: etiquetaDia(n.fecha) + ' ' + hhmm(n.start) }), ' con ' + pro(n.pro).nombre));
  }

  function renderStatus() {
    const box = $('pyStatus');
    const t = turnos.find((x) => x.id === miTurno);
    box.hidden = !t;
    if (!t) return;
    const s = srv(t.servicio);
    const detalle = s.nombre + ' · ' + fechaLarga(t.fecha) + ' · ' + hhmm(t.start) + ' con ' + pro(t.pro).nombre;
    const msgs = {
      pendiente: ['⏳ Turno pendiente de confirmación', detalle + '. El salón lo confirma en breve.'],
      confirmado: ['✅ ¡Turno confirmado!', detalle + '. Te esperamos.'],
      atendido: ['💖 ¡Gracias por venir!', detalle + '.'],
      cancelado: ['⚠️ El salón canceló tu turno', detalle + '. Podés elegir otro horario.']
    };
    const m = msgs[t.estado];
    const close = el('button', { type: 'button', class: 'py-close', 'aria-label': 'Ocultar aviso', text: '×' });
    close.addEventListener('click', () => { miTurno = null; renderStatus(); });
    box.replaceChildren(el('strong', { text: m[0] }), el('span', { text: m[1] }),
      t.estado === 'cancelado' ? el('button', { type: 'button', class: 'py-cta', 'data-reservar': t.servicio, text: 'Reservar de nuevo' }) : null,
      close);
    box.setAttribute('role', 'status');
  }

  /* Navegación interna del sitio (sin mover la página de la demo) */
  scrollEl.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      const target = $(go.dataset.go);
      if (target) scrollEl.scrollTo({ top: target.offsetTop - $('pyNav').offsetHeight + 1, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    const reservar = e.target.closest('[data-reservar]');
    if (reservar) openBooking(reservar.dataset.reservar || null, reservar);
  });


  /* ─────────── Reserva de turno ─────────── */
  const PASOS = ['Servicio', 'Profesional', 'Día y hora', 'Tus datos'];
  let opener = null;

  function freshBooking() { return { step: 0, servicio: null, pro: 'any', fecha: null, hora: null, proAsignado: null, nombre: '', nota: '', aviso: '' }; }

  function openBooking(servicioId, from) {
    bk = freshBooking();
    const s = servicioId ? srv(servicioId) : null;
    if (s && s.visible) { bk.servicio = s.id; bk.step = 1; }
    opener = from || null;
    modalEl.hidden = false;
    scrollEl.inert = true;
    renderBooking();
    focusTitle();
  }

  function closeBooking(returnFocus) {
    modalEl.hidden = true;
    scrollEl.inert = false;
    if (returnFocus !== false && opener && document.contains(opener)) opener.focus();
  }

  function focusTitle() { const t = $('pyBody').querySelector('.py-title'); if (t) t.focus({ preventScroll: true }); }

  $('pyClose').addEventListener('click', () => closeBooking());
  modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeBooking(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modalEl.hidden) closeBooking(); });

  /* Si el panel cambió algo mientras se reservaba, acomoda la selección */
  function fixBooking() {
    if (bk.step === 4) return;
    if (bk.servicio && !(srv(bk.servicio) && srv(bk.servicio).visible)) { bk.servicio = null; bk.step = 0; bk.fecha = null; bk.hora = null; }
    if (bk.pro !== 'any' && !(pro(bk.pro) && pro(bk.pro).activo && srv(bk.servicio) && srv(bk.servicio).pros.includes(bk.pro))) bk.pro = 'any';
    if (bk.servicio) {
      const dias = abiertos(7);
      if (!bk.fecha || !dias.includes(bk.fecha)) bk.fecha = null;
      if (bk.step >= 2 && !bk.fecha) bk.fecha = dias.find((d) => slotsDe(d, srv(bk.servicio), bk.pro).length) || dias[0] || null;
      if (bk.fecha && bk.hora != null && !slotsDe(bk.fecha, srv(bk.servicio), bk.pro).some((x) => x.start === bk.hora)) {
        bk.hora = null;
        bk.proAsignado = null;
        if (bk.step >= 3) { bk.step = 2; bk.aviso = 'Ese horario ya no está disponible. Elegí otro.'; }
      }
      // sin horario válido no se puede estar en el paso de datos
      if (bk.step === 3 && (bk.hora == null || !bk.proAsignado)) { bk.step = 2; }
    }
  }

  function opt(name, value, checked, kids) {
    const input = el('input', { type: 'radio', name: name, value: value });
    input.checked = checked;
    return el('label', { class: 'py-opt' }, input, el('span', null, kids));
  }
  function chip(name, value, checked, kids) {
    const input = el('input', { type: 'radio', name: name, value: value });
    input.checked = checked;
    return el('label', { class: 'py-chip' }, input, el('span', null, kids));
  }
  const title = (t, hint) => [el('h3', { class: 'py-title serif', id: 'pyTitle', tabindex: '-1', text: t }), el('p', { class: 'py-hint', text: hint })];

  function stepServicio() {
    const vis = servicios.filter((s) => s.visible);
    return el('div', null, title('¿Qué te querés hacer?', 'Elegí un servicio.'),
      vis.length
        ? el('div', { class: 'py-opts', role: 'radiogroup', 'aria-labelledby': 'pyTitle' }, vis.map((s) =>
            opt('bk-serv', s.id, bk.servicio === s.id, [
              el('span', null, el('b', { text: s.emoji + ' ' + s.nombre }), el('small', { text: s.dur + ' min · ' + s.desc })),
              el('span', { class: 'price', text: fmt(s.precio) })])))
        : el('p', { class: 'py-noslots', text: 'Por ahora no hay servicios disponibles para reservar.' }));
  }

  function stepPro() {
    const s = srv(bk.servicio);
    const lista = elegibles(s, 'any');
    return el('div', null, title('¿Con quién?', 'Podés elegir profesional o dejar que asignemos al primero disponible.'),
      lista.length
        ? el('div', { class: 'py-opts', role: 'radiogroup', 'aria-labelledby': 'pyTitle' }, [
            opt('bk-pro', 'any', bk.pro === 'any', [el('span', null, el('b', { text: '✨ Cualquiera disponible' }), el('small', { text: 'Más horarios para elegir' }))])
          ].concat(lista.map((p) => opt('bk-pro', p.id, bk.pro === p.id, [el('span', null, el('b', { text: p.emoji + ' ' + p.nombre }), el('small', { text: p.rol }))]))))
        : el('p', { class: 'py-noslots', text: 'Por ahora nadie del equipo atiende este servicio. Probá con otro.' }));
  }

  function stepFecha() {
    const s = srv(bk.servicio);
    const dias = abiertos(7);
    const slots = bk.fecha ? slotsDe(bk.fecha, s, bk.pro) : [];
    return el('div', null, title('¿Cuándo?', 'Elegí el día y el horario que mejor te quede.'),
      bk.aviso ? el('p', { class: 'py-alert', role: 'alert', text: bk.aviso }) : null,
      el('div', { class: 'py-group' },
        el('p', { class: 'py-label', id: 'pyLblDia', text: 'Día' }),
        el('div', { class: 'py-chips', role: 'radiogroup', 'aria-labelledby': 'pyLblDia' }, dias.map((d) =>
          chip('bk-fecha', d, bk.fecha === d, etiquetaDia(d))))),
      el('div', { class: 'py-group' },
        el('p', { class: 'py-label', id: 'pyLblHora', text: 'Horario' }),
        slots.length
          ? el('div', { class: 'py-chips py-slots', role: 'radiogroup', 'aria-labelledby': 'pyLblHora' }, slots.map((x) =>
              chip('bk-hora', String(x.start), bk.hora === x.start,
                bk.pro === 'any' ? [hhmm(x.start), el('small', { class: 'py-pro-tag', text: pro(x.pro).nombre })] : hhmm(x.start))))
          : el('p', { class: 'py-noslots', text: 'No quedan horarios libres ese día. Probá con otro.' })));
  }

  function stepDatos() {
    const s = srv(bk.servicio);
    const p = pro(bk.proAsignado);
    const nombre = el('input', { class: 'py-input', type: 'text', id: 'pyNombre', maxlength: '40', autocomplete: 'off', placeholder: 'Ej: Lucía', 'aria-describedby': 'pyNombreErr' });
    nombre.value = bk.nombre;
    nombre.addEventListener('input', () => {
      bk.nombre = nombre.value;
      if (nombre.value.trim().length >= 2) { nombre.removeAttribute('aria-invalid'); const er = $('pyBody').querySelector('#pyNombreErr'); if (er) er.hidden = true; }
    });
    nombre.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nextStep(); } });
    const nota = el('textarea', { class: 'py-input', id: 'pyNota', maxlength: '120', placeholder: 'Ej: quiero el mismo corte de la última vez' });
    nota.value = bk.nota;
    nota.addEventListener('input', () => { bk.nota = nota.value; });
    return el('div', null, title('Último paso', 'Revisá tu turno y dejanos tu nombre.'),
      el('dl', { class: 'py-summary' },
        el('div', null, el('dt', { text: 'Servicio' }), el('dd', { text: s.emoji + ' ' + s.nombre })),
        el('div', null, el('dt', { text: 'Cuándo' }), el('dd', { text: fechaLarga(bk.fecha) + ' · ' + hhmm(bk.hora) + ' a ' + hhmm(bk.hora + s.dur) })),
        el('div', null, el('dt', { text: 'Con' }), el('dd', { text: p.emoji + ' ' + p.nombre })),
        el('div', null, el('dt', { text: 'Precio' }), el('dd', { text: fmt(s.precio) }))),
      el('p', { class: 'py-demo-note', text: 'Es una demo: no ingreses datos reales. Nada se envía ni se guarda.' }),
      el('div', { class: 'py-field' }, el('label', { for: 'pyNombre', text: 'Tu nombre' }), nombre,
        el('p', { class: 'py-err', id: 'pyNombreErr', role: 'alert', hidden: true, text: 'Decinos tu nombre para anotar el turno.' })),
      el('div', { class: 'py-field' }, el('label', { for: 'pyNota' }, 'Nota para el salón (opcional)'), nota));
  }

  function stepListo() {
    const t = turnos.find((x) => x.id === miTurno);
    const s = srv(t.servicio);
    return el('div', { class: 'py-done' },
      el('div', { class: 'icon', 'aria-hidden': 'true', text: '🎉' }),
      el('h3', { class: 'serif py-title', id: 'pyTitle', tabindex: '-1', text: '¡Turno reservado, ' + t.cliente + '!' }),
      el('p', { text: s.nombre + ' · ' + fechaLarga(t.fecha) + ' · ' + hhmm(t.start) + ' con ' + pro(t.pro).nombre + '. El salón lo va a confirmar: acá abajo del menú vas a ver el estado.' }),
      el('div', { class: 'py-actions', style: 'justify-content:center' },
        el('button', { type: 'button', class: 'py-primary', 'data-action': 'gopanel', text: 'Ver cómo llega a la agenda' }),
        el('button', { type: 'button', class: 'py-secondary', 'data-action': 'cerrar', text: 'Cerrar' })));
  }

  function canNext() {
    if (bk.step === 0) return !!bk.servicio;
    if (bk.step === 1) return elegibles(srv(bk.servicio), 'any').length > 0;
    if (bk.step === 2) return bk.hora != null;
    return true;
  }

  function renderBooking() {
    fixBooking();
    const onDone = bk.step === 4;
    $('pyStepLabel').textContent = onDone ? 'Listo' : 'Paso ' + (bk.step + 1) + ' de 4';
    $('pyStepName').textContent = onDone ? '' : PASOS[bk.step];
    const done = onDone ? 4 : bk.step + 1;
    $('pyBarFill').style.width = (done / 4 * 100) + '%';
    $('pyBar').setAttribute('aria-valuenow', String(done));

    $('pyBody').replaceChildren([stepServicio, stepPro, stepFecha, stepDatos, stepListo][bk.step]());

    const foot = $('pyFoot');
    foot.hidden = onDone;
    if (!onDone) {
      const back = el('button', { type: 'button', class: 'py-secondary', 'data-action': 'back', text: 'Volver' });
      back.hidden = bk.step === 0;
      foot.replaceChildren(back, el('button', { type: 'button', class: 'py-primary', 'data-action': 'next', disabled: !canNext(), text: bk.step === 3 ? 'Confirmar turno' : 'Siguiente' }));
      if (bk.step === 0) foot.style.justifyContent = 'flex-end'; else foot.style.justifyContent = 'space-between';
    }
  }

  function nextStep() {
    if (!canNext()) return;
    if (bk.step === 3) { confirmarTurno(); return; }
    bk.step++;
    if (bk.step === 2 && !bk.fecha) bk.fecha = null; // fixBooking elige el primer día con lugar
    renderBooking();
    focusTitle();
  }

  function confirmarTurno() {
    if (bk.nombre.trim().length < 2) {
      const n = $('pyBody').querySelector('#pyNombre');
      const er = $('pyBody').querySelector('#pyNombreErr');
      if (er) er.hidden = false;
      if (n) { n.setAttribute('aria-invalid', 'true'); n.focus(); }
      return;
    }
    const s = srv(bk.servicio);
    // el horario pudo ocuparse desde el panel mientras se completaba
    if (!libre(bk.fecha, bk.proAsignado, bk.hora, s.dur) || !pro(bk.proAsignado).activo) {
      bk.hora = null; bk.proAsignado = null; bk.step = 2; bk.aviso = 'Ese horario ya no está disponible. Elegí otro.';
      renderBooking();
      focusTitle();
      return;
    }
    const t = { id: 'T' + (seq++), tipo: 'turno', fecha: bk.fecha, start: bk.hora, dur: s.dur, pro: bk.proAsignado, servicio: s.id,
      cliente: bk.nombre.trim(), nota: bk.nota.trim(), precio: s.precio, estado: 'pendiente', nuevo: true };
    turnos.push(t);
    miTurno = t.id;
    bk.step = 4;
    renderBooking();
    focusTitle();
    renderStatus();
    renderProximo();
    renderAgenda();
    renderKpis();
    track('demo_pyme_turno');
  }

  $('pyBody').addEventListener('change', (e) => {
    const t = e.target;
    bk.aviso = '';
    if (t.name === 'bk-serv') { bk.servicio = t.value; bk.pro = 'any'; bk.fecha = null; bk.hora = null; bk.proAsignado = null; }
    else if (t.name === 'bk-pro') { bk.pro = t.value; bk.hora = null; bk.proAsignado = null; }
    else if (t.name === 'bk-fecha') { bk.fecha = t.value; bk.hora = null; bk.proAsignado = null; }
    else if (t.name === 'bk-hora') {
      bk.hora = Number(t.value);
      const sl = slotsDe(bk.fecha, srv(bk.servicio), bk.pro).find((x) => x.start === bk.hora);
      bk.proAsignado = sl ? sl.pro : null;
    } else return;
    renderBooking();
    const again = $('pyBody').querySelector('input[name="' + t.name + '"][value="' + t.value + '"]');
    if (again) again.focus();
  });

  $('pyModal').addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === 'next') nextStep();
    else if (a === 'back') { bk.step = Math.max(0, bk.step - 1); renderBooking(); focusTitle(); }
    else if (a === 'cerrar') closeBooking();
    else if (a === 'gopanel') {
      const t = turnos.find((x) => x.id === miTurno);
      closeBooking(false);
      if (t) { agendaDia = t.fecha; selId = t.id; }
      setPanelTab('agenda');
      renderAgenda();
      if (isNarrow()) setView('local');
      $('tabAgenda').focus({ preventScroll: !isNarrow() });
    }
  });


  /* ─────────── Panel del salón: resumen ─────────── */
  function renderKpis() {
    const hoy = hoyISO();
    const deHoy = turnos.filter((t) => t.tipo === 'turno' && t.fecha === hoy && t.estado !== 'cancelado');
    const pend = turnos.filter((t) => t.tipo === 'turno' && t.estado === 'pendiente').length;
    $('kpiHoy').textContent = String(deHoy.length);
    $('kpiPend').textContent = String(pend);
    $('kpiIng').textContent = fmt(deHoy.reduce((n, t) => n + t.precio, 0));
    ['pnBadge', 'swBadge'].forEach((id) => { const b = $(id); b.textContent = String(pend); b.hidden = pend === 0; });
  }


  /* ─────────── Panel del salón: agenda ─────────── */
  function renderAgenda() {
    const dias = abiertos(7);
    if (!dias.includes(agendaDia)) agendaDia = dias[0];
    const sel = turnos.find((t) => t.id === selId && t.fecha === agendaDia && t.estado !== 'cancelado');
    if (!sel) selId = null;

    const days = el('div', { class: 'ag-days', role: 'group', 'aria-label': 'Día de la agenda' }, dias.map((d) => {
      const n = turnos.filter((t) => t.tipo === 'turno' && t.fecha === d && t.estado !== 'cancelado').length;
      return el('button', { type: 'button', class: 'ag-day', 'data-dia': d, 'aria-pressed': String(d === agendaDia) }, etiquetaDia(d), n ? el('span', { class: 'n', text: String(n) }) : null);
    }));

    paneAgenda.replaceChildren(days,
      selId ? detalleNode(turnos.find((t) => t.id === selId)) : el('p', { class: 'ag-hint', text: 'Tocá un turno para ver el detalle, o un casillero libre para bloquear ese horario.' }),
      gridNode(agendaDia));
    turnos.forEach((t) => { t.nuevo = false; });
  }

  function gridNode(fecha) {
    const ts = turnos.filter((t) => t.fecha === fecha && t.estado !== 'cancelado');
    let ini = ajustes.apertura, fin = ajustes.cierre;
    ts.forEach((t) => { ini = Math.min(ini, t.start); fin = Math.max(fin, t.start + t.dur); });
    ini = Math.floor(ini / SLOT) * SLOT;
    fin = Math.ceil(fin / SLOT) * SLOT;
    const filas = Math.max(1, (fin - ini) / SLOT);
    const esHoy = fecha === hoyISO();
    const ahoraM = ahoraMin();

    const grid = el('div', { class: 'ag-grid', role: 'group', 'aria-label': 'Agenda del ' + fechaLarga(fecha),
      style: 'grid-template-columns:42px repeat(' + pros.length + ',minmax(0,1fr));grid-template-rows:38px repeat(' + filas + ',30px)' });
    grid.append(el('div'));
    pros.forEach((p, i) => grid.append(el('div', { class: 'ag-pro' + (p.activo ? '' : ' is-off'), style: 'grid-column:' + (i + 2) + ';grid-row:1' },
      el('div', null, p.emoji + ' ' + p.nombre, el('small', { text: p.activo ? p.rol : 'Vacaciones' })))));
    for (let r = 0; r < filas; r++) {
      grid.append(el('div', { class: 'ag-time', style: 'grid-column:1;grid-row:' + (r + 2), text: r % 2 === 0 ? hhmm(ini + r * SLOT) : '' }));
    }

    pros.forEach((p, i) => {
      const col = i + 2;
      const tp = ts.filter((t) => t.pro === p.id);
      const cubierto = {};
      tp.forEach((t) => {
        const r0 = (t.start - ini) / SLOT;
        const n = Math.max(1, Math.ceil(t.dur / SLOT));
        for (let k = 0; k < n; k++) cubierto[r0 + k] = true;
        const pos = 'grid-column:' + col + ';grid-row:' + (r0 + 2) + ' / span ' + n;
        if (t.tipo === 'bloqueo') {
          grid.append(el('button', { type: 'button', class: 'ag-block', style: pos, 'data-block': t.id, 'aria-label': 'Horario bloqueado ' + hhmm(t.start) + ' con ' + p.nombre + ': tocá para liberar', text: 'Bloqueado' }));
        } else {
          grid.append(el('button', { type: 'button', class: 'ag-appt' + (t.id === selId ? ' is-sel' : '') + (t.nuevo ? ' is-new' : ''), style: pos, 'data-estado': t.estado, 'data-appt': t.id,
            'aria-label': t.cliente + ', ' + srv(t.servicio).nombre + ', ' + hhmm(t.start) + ' con ' + p.nombre + ', ' + ESTADO_TXT[t.estado] },
            el('b', { text: t.cliente }), el('span', { text: srv(t.servicio).corto + ' · ' + hhmm(t.start) })));
        }
      });
      for (let r = 0; r < filas; r++) {
        if (cubierto[r]) continue;
        const start = ini + r * SLOT;
        const pasado = esHoy && start < ahoraM;
        grid.append(el('button', { type: 'button', class: 'ag-free', style: 'grid-column:' + col + ';grid-row:' + (r + 2), 'data-free': p.id + '|' + start,
          disabled: !p.activo || pasado, 'aria-label': 'Bloquear ' + hhmm(start) + ' con ' + p.nombre, text: '＋' }));
      }
    });
    return grid;
  }

  function detalleNode(t) {
    const s = srv(t.servicio);
    const p = pro(t.pro);
    const acciones = [];
    if (t.estado === 'pendiente') acciones.push(el('button', { type: 'button', class: 'ag-btn is-primary', 'data-set': 'confirmado', text: 'Confirmar turno' }));
    if (t.estado === 'confirmado') acciones.push(el('button', { type: 'button', class: 'ag-btn is-primary', 'data-set': 'atendido', text: 'Marcar atendido' }));
    if (t.estado === 'pendiente' || t.estado === 'confirmado') acciones.push(el('button', { type: 'button', class: 'ag-btn is-danger', 'data-set': 'cancelado', text: 'Cancelar turno' }));
    acciones.push(el('button', { type: 'button', class: 'ag-btn', 'data-set': 'cerrar', text: 'Cerrar' }));
    return el('div', { class: 'ag-detail' },
      el('div', { class: 'ag-detail-top' }, el('strong', { text: t.cliente }), el('span', { class: 'pn-pill pn-pill-' + PILL[t.estado], text: ESTADO_TXT[t.estado] })),
      el('p', { text: s.emoji + ' ' + s.nombre + ' · ' + fmt(t.precio) }),
      el('p', { text: fechaLarga(t.fecha) + ' · ' + hhmm(t.start) + ' a ' + hhmm(t.start + t.dur) + ' · con ' + p.nombre }),
      t.nota ? el('p', { text: '📝 ' + t.nota }) : null,
      el('div', { class: 'ag-detail-actions' }, acciones));
  }

  function setEstado(id, estado) {
    const t = turnos.find((x) => x.id === id);
    if (!t) return;
    t.estado = estado;
    if (estado === 'cancelado') selId = null;
    renderAgenda();
    renderKpis();
    renderStatus();
    renderProximo();
    if (id === miTurno) toast(estado === 'confirmado' ? '✅ El salón confirmó tu turno' : estado === 'cancelado' ? '⚠️ El salón canceló tu turno' : '💖 Gracias por venir');
    trackOnce('demo_pyme_panel');
  }

  function afterAgendaChange(focusSel) {
    renderAgenda();
    renderProximo();
    if (!modalEl.hidden) renderBooking();
    if (focusSel) { const f = paneAgenda.querySelector(focusSel); if (f) f.focus(); }
  }

  paneAgenda.addEventListener('click', (e) => {
    const day = e.target.closest('[data-dia]');
    const appt = e.target.closest('[data-appt]');
    const free = e.target.closest('[data-free]');
    const block = e.target.closest('[data-block]');
    const set = e.target.closest('[data-set]');
    if (day) { agendaDia = day.dataset.dia; selId = null; renderAgenda(); const f = paneAgenda.querySelector('[data-dia="' + agendaDia + '"]'); if (f) f.focus(); return; }
    if (appt) { selId = appt.dataset.appt; renderAgenda(); const f = paneAgenda.querySelector('[data-appt="' + selId + '"]'); if (f) f.focus(); return; }
    if (set) {
      const v = set.dataset.set;
      if (v === 'cerrar') { selId = null; renderAgenda(); return; }
      setEstado(selId, v);
      const f = paneAgenda.querySelector('.ag-detail [data-set]') || paneAgenda.querySelector('[data-dia="' + agendaDia + '"]');
      if (f) f.focus();
      return;
    }
    if (free && !free.disabled) {
      const parts = free.dataset.free.split('|');
      turnos.push({ id: 'T' + (seq++), tipo: 'bloqueo', fecha: agendaDia, start: Number(parts[1]), dur: SLOT, pro: parts[0], estado: 'activo' });
      afterAgendaChange('[data-block]:last-of-type');
      toast('🔒 Horario bloqueado: ' + hhmm(Number(parts[1])) + ' con ' + pro(parts[0]).nombre + ' (ya no se puede reservar)');
      trackOnce('demo_pyme_panel');
      return;
    }
    if (block) {
      const t = turnos.find((x) => x.id === block.dataset.block);
      turnos.splice(turnos.indexOf(t), 1);
      afterAgendaChange();
      toast('🔓 Horario liberado: ' + hhmm(t.start) + ' con ' + pro(t.pro).nombre);
      trackOnce('demo_pyme_panel');
    }
  });


  /* ─────────── Panel del salón: servicios ─────────── */
  function buildPanelServicios() {
    paneServicios.replaceChildren(
      el('div', { class: 'pa-cols', 'aria-hidden': 'true' }, el('span'), el('span', { text: 'Servicio' }), el('span', { text: 'Dura' }), el('span', { text: 'Precio' }), el('span', { text: 'Visible' })),
      ...servicios.map((s) => el('div', { class: 'pa-row', 'data-row': s.id },
        el('span', { class: 'pn-emoji', 'aria-hidden': 'true', text: s.emoji }),
        el('div', { class: 'pa-name' }, el('strong', { text: s.nombre }), el('small', { text: 'Atienden: ' + s.pros.map((id) => pro(id).nombre).join(', ') })),
        (() => {
          const sel = el('select', { class: 'pa-select', 'aria-label': 'Duración de ' + s.nombre, 'data-dur': s.id }, [30, 60, 90, 120].map((m) => el('option', { value: String(m), text: m + ' min' })));
          sel.value = String(s.dur);
          return sel;
        })(),
        el('label', { class: 'pn-price' }, '$', el('input', { type: 'number', min: '0', step: '500', inputmode: 'numeric', value: String(s.precio), 'aria-label': 'Precio de ' + s.nombre, 'data-precio': s.id })),
        el('button', { type: 'button', class: 'pn-switch', role: 'switch', 'aria-checked': String(s.visible), 'aria-label': s.nombre + ': ' + (s.visible ? 'visible' : 'oculto'), 'data-vis': s.id }, el('span'))
      )));
  }

  function afterServicioChange(s, msg) {
    renderServiciosSitio();
    flashServicio(s.id);
    renderProximo();
    if (!modalEl.hidden) renderBooking();
    paneServicios.querySelector('[data-row="' + s.id + '"]').classList.toggle('is-off', !s.visible);
    panelToast(msg);
    trackOnce('demo_pyme_panel');
  }

  paneServicios.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-precio]');
    if (!inp) return;
    const s = srv(inp.dataset.precio);
    const v = Number(inp.value);
    if (inp.value === '' || !isFinite(v) || v < 0) return;
    s.precio = Math.round(v);
    afterServicioChange(s, 'Precio actualizado: ' + s.nombre + ' → ' + fmt(s.precio));
  });
  paneServicios.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-dur]');
    if (!sel) return;
    const s = srv(sel.dataset.dur);
    s.dur = Number(sel.value);
    afterServicioChange(s, s.nombre + ': ahora dura ' + s.dur + ' min (cambian los horarios disponibles)');
  });
  paneServicios.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-vis]');
    if (!sw) return;
    const s = srv(sw.dataset.vis);
    s.visible = !s.visible;
    sw.setAttribute('aria-checked', String(s.visible));
    sw.setAttribute('aria-label', s.nombre + ': ' + (s.visible ? 'visible' : 'oculto'));
    afterServicioChange(s, s.nombre + (s.visible ? ': visible en el sitio' : ': oculto del sitio'));
  });


  /* ─────────── Panel del salón: equipo y horarios ─────────── */
  function buildPanelEquipo() {
    const horas = (desde, hasta) => { const o = []; for (let h = desde; h <= hasta; h++) o.push(el('option', { value: String(h * 60), text: pad(h) + ':00' })); return o; };
    const apertura = el('select', { class: 'pa-select', 'aria-label': 'Hora de apertura', 'data-hora': 'apertura' }, horas(7, 13));
    const cierre = el('select', { class: 'pa-select', 'aria-label': 'Hora de cierre', 'data-hora': 'cierre' }, horas(15, 22));
    apertura.value = String(ajustes.apertura);
    cierre.value = String(ajustes.cierre);
    paneEquipo.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Equipo' }),
        el('p', { text: 'Quien está de vacaciones deja de recibir reservas nuevas.' }),
        ...pros.map((p) => el('div', { class: 'st-row' },
          el('span', null, p.emoji + ' ' + p.nombre + ' · ', el('span', { style: 'color:var(--muted)', text: p.rol })),
          el('button', { type: 'button', class: 'pn-switch', role: 'switch', 'aria-checked': String(p.activo), 'aria-label': p.nombre + ': ' + (p.activo ? 'atiende' : 'de vacaciones'), 'data-pro': p.id }, el('span'))))),
      el('section', { class: 'st-card' },
        el('h3', { text: 'Horario de atención' }),
        el('p', { text: 'Define cuándo se pueden reservar turnos.' }),
        el('div', { class: 'st-row' }, el('span', { text: 'Apertura' }), el('span', { class: 'st-sel' }, apertura)),
        el('div', { class: 'st-row' }, el('span', { text: 'Cierre' }), el('span', { class: 'st-sel' }, cierre)),
        el('p', { style: 'margin:.8rem 0 .3rem', text: 'Días de atención' }),
        el('div', { class: 'st-days', role: 'group', 'aria-label': 'Días de atención' }, ORDEN_DIAS.map((d) =>
          el('button', { type: 'button', class: 'st-day', 'data-dia-sem': String(d), 'aria-pressed': String(ajustes.dias[d]), text: DIAS_CORTO[d] }))))
    );
  }

  function afterHorarioChange(msg) {
    renderHorariosSitio();
    renderEquipoSitio();
    renderProximo();
    renderAgenda();
    renderKpis();
    if (!modalEl.hidden) renderBooking();
    panelToast(msg);
    trackOnce('demo_pyme_panel');
  }

  paneEquipo.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-pro]');
    const dia = e.target.closest('[data-dia-sem]');
    if (sw) {
      const p = pro(sw.dataset.pro);
      p.activo = !p.activo;
      sw.setAttribute('aria-checked', String(p.activo));
      sw.setAttribute('aria-label', p.nombre + ': ' + (p.activo ? 'atiende' : 'de vacaciones'));
      afterHorarioChange(p.nombre + (p.activo ? ': vuelve a recibir turnos' : ': de vacaciones, ya no recibe reservas'));
    } else if (dia) {
      const d = Number(dia.dataset.diaSem);
      if (ajustes.dias[d] && ajustes.dias.filter(Boolean).length === 1) { toast('Tiene que quedar al menos un día abierto'); return; }
      ajustes.dias[d] = !ajustes.dias[d];
      dia.setAttribute('aria-pressed', String(ajustes.dias[d]));
      afterHorarioChange(DIAS[d][0].toUpperCase() + DIAS[d].slice(1) + (ajustes.dias[d] ? ': abierto' : ': cerrado'));
    }
  });
  paneEquipo.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-hora]');
    if (!sel) return;
    ajustes[sel.dataset.hora] = Number(sel.value);
    afterHorarioChange('Horario de atención: ' + hhmm(ajustes.apertura) + ' a ' + hhmm(ajustes.cierre));
  });


  /* ─────────── Pestañas, vistas y reinicio ─────────── */
  function setPanelTab(which) {
    [['agenda', 'tabAgenda', paneAgenda], ['servicios', 'tabServicios', paneServicios], ['equipo', 'tabEquipo', paneEquipo]].forEach((x) => {
      $(x[1]).setAttribute('aria-selected', String(x[0] === which));
      x[2].hidden = x[0] !== which;
    });
  }
  $('tabAgenda').addEventListener('click', () => setPanelTab('agenda'));
  $('tabServicios').addEventListener('click', () => setPanelTab('servicios'));
  $('tabEquipo').addEventListener('click', () => setPanelTab('equipo'));

  function setView(which) {
    stage.dataset.view = which;
    $('swCliente').setAttribute('aria-selected', String(which === 'cliente'));
    $('swLocal').setAttribute('aria-selected', String(which === 'local'));
  }
  $('swCliente').addEventListener('click', () => setView('cliente'));
  $('swLocal').addEventListener('click', () => setView('local'));

  function renderAll() {
    renderServiciosSitio();
    renderEquipoSitio();
    renderHorariosSitio();
    renderProximo();
    renderStatus();
    renderAgenda();
    renderKpis();
  }

  function resetDemo() {
    initState();
    modalEl.hidden = true;
    scrollEl.inert = false;
    buildPanelServicios();
    buildPanelEquipo();
    renderAll();
    setPanelTab('agenda');
    setView('cliente');
    scrollEl.scrollTop = 0;
    toast('Demo reiniciada');
  }
  $('pnReset').addEventListener('click', resetDemo);


  /* ─────────── Inicio ─────────── */
  initState();
  buildPanelServicios();
  buildPanelEquipo();
  renderAll();
  if (isNarrow()) $('introSteps').removeAttribute('open');
})();
