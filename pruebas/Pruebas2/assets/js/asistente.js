/* =============================================
   SACUDE DEVS — Asistente guiado
   Chat flotante con respuestas armadas (sin servidor ni IA): botones de
   respuesta rápida + reconocimiento de palabras clave si escriben.
   Lee servicios y contactos de la config del cotizador, y las respuestas
   de la FAQ directo de la página, así no hay que mantener textos duplicados.
   ============================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  const BASE = window.SacudeConfig || { whatsapp: '5493516345090', email: 'sacudedevs@gmail.com', servicios: [] };
  const SERVICIOS = (BASE.servicios || []).filter((s) => s.id !== 'asesoria');
  const WA_URL = 'https://wa.me/' + BASE.whatsapp;

  // Descripciones cortas por servicio (resumen de las cards de la página)
  const DESC = {
    landing:       'Páginas de aterrizaje optimizadas para captar clientes, lanzar productos o campañas.',
    website:       'Sitios web completos y profesionales para presentar tu marca, tus servicios y tu historia.',
    menu:          'Cartas digitales para restaurantes, bares y cafés: actualizás precios y platos al instante, sin reimprimir códigos QR.',
    ecommerce:     'Tiendas online autogestionables, con medios de pago y envíos.',
    institucional: 'Webs formales para empresas, organizaciones o estudios que necesitan transmitir solidez y confianza.',
    pyme:          'Webs para comercios y PyMEs que quieren digitalizarse y llegar a más clientes.'
  };

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  /* Texto de una respuesta de la FAQ (fuente única: el HTML de la página) */
  function faq(id, fallback) {
    const node = document.getElementById(id);
    const text = node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
    return text || fallback;
  }


  /* ─────────── Acciones y chips ─────────── */
  const goto = (label, hash) => ({ label: label, href: hash, close: true });
  const waAction = (label, text) => ({
    label: label, external: true, style: 'is-whatsapp', track: 'whatsapp',
    href: WA_URL + '?text=' + encodeURIComponent(text || 'Hola Sacude Devs! Vengo de la web y quería hacer una consulta.')
  });
  const mailAction = (label) => ({
    label: label, style: 'is-email', track: 'mail',
    href: 'mailto:' + BASE.email + '?subject=' + encodeURIComponent('Consulta desde la web')
  });

  const CHIP_LABELS = {
    cotizar: 'Quiero cotizar', servicios: 'Qué servicios hacen', precio: 'Cuánto cuesta',
    tiempos: 'Cuánto tardan', contacto: 'Contacto', humano: 'Hablar con una persona',
    mas: 'Más preguntas', proceso: 'Cómo trabajan', preparar: 'Qué necesito tener',
    soporte: 'Soporte y mantenimiento', equipo: 'Quiénes son', ejemplos: 'Ver ejemplos', inicio: 'Volver al inicio'
  };
  const chips = (...ids) => ids.map((id) => ({ label: CHIP_LABELS[id], intent: id }));
  const MENU = chips('cotizar', 'servicios', 'precio', 'tiempos', 'contacto', 'humano', 'mas');


  /* ─────────── Intents: palabras clave (sin tildes; * = prefijo) + respuesta ─────────── */
  const INTENTS = [];
  function intent(id, kw, reply, weight) { INTENTS.push({ id: id, kw: kw, reply: reply, w: weight || 1 }); }

  // Un intent por cada servicio
  const SRV_KW = {
    landing: ['landing*', 'aterrizaje'],
    website: ['web site', 'website', 'sitio web', 'sitio completo'],
    menu: ['menu*', 'carta*', 'qr', 'restaurante*', 'bar', 'bares', 'cafe', 'cafes', 'gastronom*'],
    ecommerce: ['ecommerce', 'e commerce', 'tienda*', 'vender online', 'vender por internet', 'venta online', 'ventas online', 'carrito'],
    institucional: ['institucional*', 'empresa*', 'estudio', 'corporativ*', 'organizacion*'],
    pyme: ['pyme*', 'comercio*', 'negocio*', 'emprendimiento*']
  };
  SERVICIOS.forEach((s) => {
    intent('srv:' + s.id, SRV_KW[s.id] || [], () => ({
      text: [s.icono + ' ' + s.nombre, DESC[s.id] || '', 'Tiempo estimado: ' + s.detalle + '.'].filter(Boolean),
      actions: [{ label: 'Consultar por ' + s.nombre, href: '#cotizador', servicio: s.id, close: true }],
      chips: chips('servicios', 'precio', 'humano')
    }), 2);   // peso doble: "quiero una tienda" tiene que ir a E-commerce y no al genérico "cotizar"
  });

  intent('humano', ['persona', 'humano', 'asesor*', 'alguien', 'hablar con', 'atencion'], () => ({
    text: ['¡Claro! Escribinos por WhatsApp y te responde una persona del equipo.'],
    actions: [waAction('Hablar por WhatsApp')],
    chips: chips('cotizar', 'servicios', 'precio')
  }));

  intent('precio', ['precio*', 'cuanto cuesta', 'cuanto sale', 'cuanto cobran', 'cuanto vale', 'costo*', 'valor*', 'tarifa*', 'presupuesto*', 'plata'], () => ({
    text: [
      'Cada proyecto se cotiza a medida: no es lo mismo una landing page que una tienda online con medios de pago.',
      'Contanos tu idea con el cotizador y te respondemos con una propuesta pensada para tu caso.'
    ],
    actions: [goto('Ir al cotizador', '#cotizador')],
    chips: chips('tiempos', 'servicios', 'humano')
  }));

  intent('tiempos', ['cuanto tard*', 'tiempo*', 'demora*', 'plazo*', 'cuando estar*', 'semana*', 'entrega*'], () => ({
    text: ['Los tiempos son estimados y se ajustan a cada proyecto:'],
    list: SERVICIOS.map((s) => s.icono + ' ' + s.nombre + ': ' + s.detalle),
    chips: chips('cotizar', 'precio', 'humano')
  }));

  intent('contacto', ['contacto*', 'whatsapp', 'wsp', 'mail', 'correo', 'email', 'telefono', 'numero', 'escribir*', 'comunicar*', 'llamar'], () => ({
    text: ['Podés escribirnos directo por WhatsApp o por mail:', BASE.email],
    actions: [waAction('Escribir por WhatsApp'), mailAction('Enviar un mail')],
    chips: chips('cotizar', 'servicios', 'precio')
  }));

  intent('cotizar', ['cotiz*', 'contratar', 'quiero una', 'quiero un', 'necesito una', 'necesito un', 'quiero hacer', 'armar'], () => ({
    text: ['¡Dale! Con el cotizador armás tu consulta en un minuto: elegís qué necesitás y nos llega todo ordenado por WhatsApp o mail.'],
    actions: [goto('Ir al cotizador', '#cotizador')],
    chips: chips('precio', 'tiempos', 'humano')
  }));

  intent('servicios', ['servicio*', 'que hacen', 'que ofrecen', 'ofrecen', 'trabajan con', 'hacen'], () => ({
    text: ['Estos son nuestros servicios (tocá uno para saber más):'],
    list: SERVICIOS.map((s) => s.icono + ' ' + s.nombre),
    actions: [goto('Ver servicios', '#servicios')],
    chips: SERVICIOS.map((s) => ({ label: s.nombre, intent: 'srv:' + s.id })).concat(chips('precio'))
  }));

  intent('equipo', ['equipo', 'quienes', 'programador*', 'desarrollador*', 'fundador*', 'nico', 'niko', 'valen', 'gabi', 'nicolas', 'valentin', 'gabriel'], () => ({
    text: [
      'Somos un equipo de tres: Nicolás Brito Pedrocca (fundador), Valentín Saldaño y Gabriel Dagna (co-fundadores).',
      'En la sección Programadores podés ver el perfil de cada uno.'
    ],
    actions: [goto('Ver programadores', '#programadores')],
    chips: chips('cotizar', 'contacto', 'mas')
  }));

  intent('proceso', ['proceso', 'como trabajan', 'como empiezo', 'como empezar', 'como es trabajar', 'pasos'], () => ({
    text: [faq('faq-a1', 'Nos contás tu idea, armamos una propuesta a medida y, una vez que la aceptás, arrancamos con el diseño y el desarrollo.')],
    actions: [goto('Ver preguntas frecuentes', '#faq')],
    chips: chips('cotizar', 'preparar', 'tiempos')
  }));

  intent('preparar', ['preparar*', 'necesito tener', 'que necesito', 'logo', 'referencia*', 'material*'], () => ({
    text: [faq('faq-a4', 'Con una idea clara de lo que querés transmitir, tu logo (si ya lo tenés) y ejemplos de páginas que te gusten alcanza.')],
    actions: [goto('Ver preguntas frecuentes', '#faq')],
    chips: chips('cotizar', 'proceso', 'soporte')
  }));

  intent('soporte', ['soporte', 'mantenimiento', 'actualizar*', 'modificar*', 'cambiar*', 'despues de', 'garantia'], () => ({
    text: [faq('faq-a5', 'Te dejamos las herramientas listas, te acompañamos en el lanzamiento y ofrecemos planes de mantenimiento y soporte.')],
    actions: [goto('Ver preguntas frecuentes', '#faq')],
    chips: chips('cotizar', 'proceso', 'precio')
  }));

  intent('ejemplos', ['ejemplo*', 'portfolio', 'portafolio', 'trabajos', 'muestra*', 'nasa'], () => ({
    text: ['Cada servicio tiene ejemplos de trabajos: abrí la card que te interese en la sección Servicios.'],
    actions: [goto('Ir a Servicios', '#servicios')],
    chips: chips('servicios', 'cotizar', 'humano')
  }));

  intent('gracias', ['gracias', 'genial', 'perfecto', 'buenisimo', 'excelente', 'joya'], () => ({
    text: ['¡De nada! Si te queda alguna duda, acá estoy. 😊'],
    chips: MENU
  }));

  intent('saludo', ['hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'que tal'], () => ({
    text: ['¡Hola! 👋 ¿En qué te puedo ayudar?'],
    chips: MENU
  }));

  // Intents que se llegan solo con botones
  intent('mas', [], () => ({
    text: ['Esto es lo que más nos preguntan:'],
    chips: chips('proceso', 'preparar', 'soporte', 'equipo', 'ejemplos', 'inicio')
  }));
  intent('inicio', [], () => ({ text: ['¿Qué querés saber?'], chips: MENU }));

  const WELCOME = {
    text: [
      '¡Hola! 👋 Soy el asistente de Sacude Devs. Respondo de forma automática para ayudarte a encontrar lo que buscás en la página.',
      '¿Qué querés saber?'
    ],
    chips: MENU
  };

  const FALLBACK = (times) => ({
    text: [
      times > 1
        ? 'Parece que no logro ayudarte con eso 😅. Lo mejor es que hables directo con una persona del equipo.'
        : 'No estoy seguro de haber entendido 🤔. Probá con alguna de estas opciones, o escribinos y te responde una persona.'
    ],
    actions: [waAction('Escribir por WhatsApp')],
    chips: MENU
  });


  /* ─────────── Reconocimiento de lo que escribe la persona ─────────── */
  function normalize(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function scoreFor(text, keywords) {
    let score = 0;
    keywords.forEach((kw) => {
      const prefix = kw.endsWith('*');
      const word = prefix ? kw.slice(0, -1) : kw;
      if (new RegExp('(^| )' + word + (prefix ? '' : '( |$)')).test(text)) score += word.length;
    });
    return score;
  }

  function matchIntent(raw) {
    const text = normalize(raw);
    let best = null;
    let bestScore = 0;
    INTENTS.forEach((it) => {
      const sc = scoreFor(text, it.kw) * it.w;
      if (sc > bestScore) { best = it; bestScore = sc; }
    });
    return best;
  }


  /* ─────────── Interfaz ─────────── */
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

  const ICON_CHAT  = '<svg class="asist-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/></svg>';
  const ICON_CLOSE = '<svg class="asist-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const ICON_SEND  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';

  const launcher = el('button', { type: 'button', class: 'asist-launcher', 'aria-label': 'Abrir asistente', 'aria-expanded': 'false', 'aria-controls': 'asistPanel' });
  launcher.innerHTML = ICON_CHAT + ICON_CLOSE;

  const log = el('div', { class: 'asist-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversación con el asistente' });
  const chipsBox = el('div', { class: 'asist-chips', role: 'group', 'aria-label': 'Respuestas rápidas' });
  const input = el('input', { class: 'asist-input', type: 'text', maxlength: '200', autocomplete: 'off', placeholder: 'Escribí tu consulta…', 'aria-label': 'Escribí tu consulta' });
  const sendBtn = el('button', { type: 'submit', class: 'asist-send', 'aria-label': 'Enviar' });
  sendBtn.innerHTML = ICON_SEND;
  const form = el('form', { class: 'asist-form' }, input, sendBtn);

  const closeBtn = el('button', { type: 'button', class: 'asist-close', 'aria-label': 'Cerrar asistente', text: '×' });
  const panel = el('section', { class: 'asist-panel', id: 'asistPanel', role: 'dialog', 'aria-label': 'Asistente de Sacude Devs', tabindex: '-1' },
    el('header', { class: 'asist-head' },
      el('div', { class: 'asist-avatar' }, el('img', { src: 'assets/img/logo/Naranja.webp', alt: '', width: '24', height: '15' })),
      el('div', { class: 'asist-head-text' },
        el('p', { class: 'asist-title', text: 'Asistente Sacude Devs' }),
        el('p', { class: 'asist-sub', text: 'Respuestas automáticas' })),
      closeBtn),
    log, chipsBox, form
  );
  panel.inert = true;

  const root = el('div', { class: 'asist' }, launcher, panel);
  document.body.append(root);


  /* ─────────── Conversación ─────────── */
  let queue = Promise.resolve();
  let started = false;
  let misses = 0;

  function scrollLog() { log.scrollTop = log.scrollHeight; }

  function addUser(text) {
    log.append(el('div', { class: 'asist-msg is-user', text: text }));
    scrollLog();
  }

  function actionNode(a) {
    const link = el('a', { class: 'asist-action' + (a.style ? ' ' + a.style : ''), href: a.href, text: a.label });
    if (a.external) { link.target = '_blank'; link.rel = 'noopener'; }
    if (a.servicio) link.dataset.servicio = a.servicio;   // el cotizador lo preselecciona
    link.addEventListener('click', () => {
      if (a.track) track('asistente_contacto', { canal: a.track });
      if (a.close) closePanel(false);
    });
    return link;
  }

  function addBot(r) {
    const bubble = el('div', { class: 'asist-msg' }, (r.text || []).map((t) => el('p', { text: t })));
    if (r.list && r.list.length) bubble.append(el('ul', { class: 'asist-list' }, r.list.map((t) => el('li', { text: t }))));
    if (r.actions && r.actions.length) bubble.append(el('div', { class: 'asist-actions' }, r.actions.map(actionNode)));
    log.append(bubble);
    scrollLog();
  }

  function setChips(list) {
    chipsBox.replaceChildren();
    (list || []).forEach((c) => {
      const btn = el('button', { type: 'button', class: 'asist-chip', text: c.label });
      btn.addEventListener('click', () => ask(c.intent, c.label));
      chipsBox.append(btn);
    });
    chipsBox.hidden = !(list && list.length);
    scrollLog();
  }

  function botSay(r) {
    queue = queue.then(() => new Promise((resolve) => {
      setChips([]);
      const typing = el('div', { class: 'asist-msg asist-typing', 'aria-hidden': 'true' }, el('span'), el('span'), el('span'));
      log.append(typing);
      scrollLog();
      const size = (r.text || []).join('').length + (r.list || []).join('').length;
      const delay = reduceMotion ? 0 : Math.min(950, 380 + size * 3);
      setTimeout(() => {
        typing.remove();
        addBot(r);
        // Todas las respuestas ofrecen "Volver al inicio" para no quedar encerrado en un tema
        const next = r.chips || MENU;
        setChips(next === MENU || next.some((c) => c.intent === 'inicio') ? next : next.concat(chips('inicio')));
        scrollLog();   // los chips le sacan alto al historial: reajusta para que el último mensaje quede a la vista
        resolve();
      }, delay);
    }));
  }

  /* Pregunta resuelta por botón (intent conocido) */
  function ask(intentId, label) {
    const it = INTENTS.find((i) => i.id === intentId);
    if (!it) return;
    if (label) addUser(label);
    misses = 0;
    track('asistente_tema', { tema: intentId.split(':')[0] === 'srv' ? 'servicio_' + intentId.split(':')[1] : intentId });
    botSay(it.reply());
  }

  /* Pregunta escrita a mano */
  function askText(raw) {
    const text = raw.trim().slice(0, 200);
    if (!text) return;
    addUser(text);
    const it = matchIntent(text);
    if (it) {
      misses = 0;
      track('asistente_tema', { tema: it.id.startsWith('srv:') ? 'servicio_' + it.id.slice(4) : it.id });
      botSay(it.reply());
    } else {
      misses++;
      track('asistente_sin_respuesta');   // sin el texto escrito: no se envían datos de la persona
      botSay(FALLBACK(misses));
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    askText(value);
  });


  /* ─────────── Abrir / cerrar ─────────── */
  function openPanel() {
    hideNudge();
    panel.inert = false;
    panel.classList.add('is-open');
    root.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Cerrar asistente');
    if (!started) {
      started = true;
      botSay(WELCOME);
      track('asistente_abrir');
    }
    // En celular no se enfoca el input para que no salte el teclado de entrada
    (coarsePointer ? panel : input).focus({ preventScroll: true });
  }

  function closePanel(returnFocus) {
    panel.classList.remove('is-open');
    root.classList.remove('is-open');
    panel.inert = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Abrir asistente');
    if (returnFocus !== false) launcher.focus({ preventScroll: true });
  }

  launcher.addEventListener('click', () => (panel.classList.contains('is-open') ? closePanel() : openPanel()));
  closeBtn.addEventListener('click', () => closePanel());
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });


  /* ─────────── Globito de invitación (una sola vez por visita) ─────────── */
  let nudge = null;

  function hideNudge() { if (nudge) { nudge.remove(); nudge = null; } }

  function showNudge() {
    if (panel.classList.contains('is-open')) return;
    nudge = el('div', { class: 'asist-nudge', role: 'status', text: '¿Te ayudo a encontrar algo?' });
    const x = el('button', { type: 'button', 'aria-label': 'Cerrar mensaje', text: '×' });
    x.addEventListener('click', (e) => { e.stopPropagation(); hideNudge(); });
    nudge.append(x);
    nudge.addEventListener('click', openPanel);
    root.append(nudge);
    setTimeout(hideNudge, 8000);
    try { sessionStorage.setItem('asistNudge', '1'); } catch (e) { /* sin storage: no pasa nada */ }
  }

  let seen = false;
  try { seen = sessionStorage.getItem('asistNudge') === '1'; } catch (e) { /* idem */ }
  if (!seen) setTimeout(showNudge, 12000);
})();
