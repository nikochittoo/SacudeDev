/* =============================================
   SACUDE DEVS — Cotizador (armador de consulta)
   No muestra precios: el cliente elige qué necesita y se arma un mensaje
   ordenado para WhatsApp o mail. Todo lo editable está en CONFIG.
   ============================================= */
(function () {
  'use strict';

  const root = document.getElementById('cotizadorApp');
  if (!root) return;

  /* ─────────── CONFIG: editá acá textos, opciones y contactos ─────────── */
  const CONFIG = {
    whatsapp: '5493516345090',
    email: 'sacudedevs@gmail.com',

    servicios: [
      { id: 'landing',       icono: '🚀',  nombre: 'Landing Page',      detalle: '1-2 semanas' },
      { id: 'website',       icono: '💻',  nombre: 'Web Site',          detalle: '2-3 semanas' },
      { id: 'menu',          icono: '📱',  nombre: 'Menú Web (QR)',     detalle: '1 semana' },
      { id: 'ecommerce',     icono: '🛒',  nombre: 'E-commerce',        detalle: '3-4 semanas' },
      { id: 'institucional', icono: '🏛️', nombre: 'Web Institucional', detalle: '3 semanas' },
      { id: 'pyme',          icono: '📈',  nombre: 'Web para PyMEs',    detalle: '2 semanas' },
      { id: 'asesoria',      icono: '💬',  nombre: 'Todavía no sé',     detalle: 'Que me orienten', ancho: true,
        mensaje: 'Todavía no sé qué necesito y quiero que me orienten' }
    ],

    extras: [
      { id: 'dominio',       nombre: 'Dominio y hosting' },
      { id: 'whatsapp',      nombre: 'Botón de WhatsApp' },
      { id: 'formulario',    nombre: 'Formulario de contacto' },
      { id: 'pagos',         nombre: 'Medios de pago' },
      { id: 'panel',         nombre: 'Panel autogestionable' },
      { id: 'turnos',        nombre: 'Reservas o turnos online' },
      { id: 'textos',        nombre: 'Ayuda con textos e imágenes' },
      { id: 'mantenimiento', nombre: 'Soporte y mantenimiento' }
    ],

    plazos: [
      { id: 'ya',      nombre: 'Lo antes posible' },
      { id: 'mes',     nombre: 'En 1 mes' },
      { id: 'sinapuro', nombre: 'Sin apuro' },
      { id: 'nose',    nombre: 'No lo tengo claro' }
    ],

    presupuestos: [
      { id: 'definido', nombre: 'Ya tengo un presupuesto definido' },
      { id: 'orienten', nombre: 'Prefiero que me orienten' },
      { id: 'nodefinido', nombre: 'Todavía no lo definí' }
    ]
  };

  window.SacudeConfig = CONFIG;   // el asistente (asistente.js) lee servicios y contactos de acá

  const STEPS = [
    { name: 'Servicio',
      title: '¿Qué necesitás?',
      hint: 'Elegí lo que más se parezca a tu proyecto. Si no estás seguro, hay una opción para eso.' },
    { name: 'Extras',
      title: '¿Querés sumarle algo?',
      hint: 'Marcá lo que te interese. Es opcional.' },
    { name: 'Plazo y presupuesto',
      title: 'Plazo y presupuesto',
      hint: 'Nos ayuda a proponerte algo realista. Podés dejar lo que no sepas.' },
    { name: 'Tu idea',
      title: 'Contanos de vos y de tu proyecto',
      hint: 'Con esto armamos una propuesta pensada para tu caso.' }
  ];
  const TOTAL = STEPS.length;            // pasos con datos; el resumen es el paso TOTAL
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ─────────── Estado ─────────── */
  const freshState = () => ({
    step: 0, servicio: null, extras: [], plazo: null, presupuesto: null,
    nombre: '', negocio: '', idea: ''
  });
  let state = freshState();

  const find = (list, id) => list.find((item) => item.id === id) || null;

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }


  /* ─────────── Helper para crear nodos (sin innerHTML) ─────────── */
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


  /* ─────────── Armado de la interfaz ─────────── */
  const stepLabel = el('span', { class: 'cotiz-step-label', 'aria-live': 'polite' });
  const stepName  = el('span', { class: 'cotiz-step-name' });
  const barFill   = el('span', { class: 'cotiz-bar-fill' });
  const bar = el('div', {
    class: 'cotiz-bar', role: 'progressbar', 'aria-label': 'Progreso de tu consulta',
    'aria-valuemin': '0', 'aria-valuemax': String(TOTAL)
  }, barFill);

  const contextLines = [];
  function contextLine() {
    const p = el('p', { class: 'cotiz-context' });
    contextLines.push(p);
    return p;
  }

  function heading(step, index) {
    return [
      el('h3', { class: 'cotiz-title', tabindex: '-1', id: 'cotiz-titulo-' + index, text: step.title }),
      el('p', { class: 'cotiz-hint', text: step.hint })
    ];
  }

  function radio(name, item, wrapperClass, bodyClass, body) {
    const input = el('input', { type: 'radio', name: name, value: item.id });
    input.addEventListener('change', () => { state[name.replace('cotiz-', '')] = item.id; refresh(); });
    return el('label', { class: wrapperClass + (item.ancho ? ' is-wide' : '') }, input, el('span', { class: bodyClass }, body));
  }

  /* Paso 1 — servicio */
  const panelServicio = el('div', { class: 'cotiz-panel' },
    heading(STEPS[0], 0),
    el('div', { class: 'cotiz-tiles', role: 'radiogroup', 'aria-labelledby': 'cotiz-titulo-0' },
      CONFIG.servicios.map((s) => radio('cotiz-servicio', s, 'cotiz-tile', 'cotiz-tile-body', [
        el('span', { class: 'cotiz-tile-icon', 'aria-hidden': 'true', text: s.icono }),
        el('strong', { text: s.nombre }),
        el('small', { text: s.detalle })
      ]))
    )
  );

  /* Paso 2 — extras */
  const panelExtras = el('div', { class: 'cotiz-panel' },
    heading(STEPS[1], 1), contextLine(),
    el('div', { class: 'cotiz-chips', role: 'group', 'aria-labelledby': 'cotiz-titulo-1' },
      CONFIG.extras.map((x) => {
        const input = el('input', { type: 'checkbox', name: 'cotiz-extra', value: x.id });
        input.addEventListener('change', () => {
          state.extras = CONFIG.extras.map((e) => e.id).filter((id) =>
            id === x.id ? input.checked : state.extras.includes(id));
        });
        return el('label', { class: 'cotiz-chip' }, input, el('span', { class: 'cotiz-chip-body', text: x.nombre }));
      })
    )
  );

  /* Paso 3 — plazo y presupuesto */
  function chipGroup(labelText, labelId, name, list) {
    return el('div', { class: 'cotiz-group' },
      el('p', { class: 'cotiz-group-label', id: labelId, text: labelText }),
      el('div', { class: 'cotiz-chips', role: 'radiogroup', 'aria-labelledby': labelId },
        list.map((item) => radio(name, item, 'cotiz-chip', 'cotiz-chip-body', item.nombre))
      )
    );
  }
  const panelPlazo = el('div', { class: 'cotiz-panel' },
    heading(STEPS[2], 2), contextLine(),
    chipGroup('¿Para cuándo lo necesitás?', 'cotiz-lbl-plazo', 'cotiz-plazo', CONFIG.plazos),
    chipGroup('¿Ya pensaste un presupuesto?', 'cotiz-lbl-presupuesto', 'cotiz-presupuesto', CONFIG.presupuestos)
  );

  /* Paso 4 — datos e idea */
  const inNombre  = el('input',    { class: 'cotiz-input', type: 'text', id: 'cotiz-nombre', autocomplete: 'name', maxlength: '60',
                                      placeholder: 'Tu nombre', 'aria-required': 'true', 'aria-describedby': 'cotiz-nombre-error' });
  const errNombre = el('p',        { class: 'cotiz-error', id: 'cotiz-nombre-error', role: 'alert', hidden: true, text: 'Decinos cómo te llamás para poder responderte.' });
  const inNegocio = el('input',    { class: 'cotiz-input', type: 'text', id: 'cotiz-negocio', autocomplete: 'organization', maxlength: '80',
                                      placeholder: 'Ej: Panadería Los Álamos' });
  const inIdea    = el('textarea', { class: 'cotiz-input', id: 'cotiz-idea', rows: '4', maxlength: '600',
                                      placeholder: 'Qué hace tu negocio, qué querés lograr con la web, si tenés páginas de referencia que te gusten…' });

  inNombre.addEventListener('input',  () => { state.nombre  = inNombre.value;  if (inNombre.value.trim().length >= 2) clearNombreError(); });
  inNegocio.addEventListener('input', () => { state.negocio = inNegocio.value; });
  inIdea.addEventListener('input',    () => { state.idea    = inIdea.value; });

  const panelDatos = el('div', { class: 'cotiz-panel' },
    heading(STEPS[3], 3), contextLine(),
    el('div', { class: 'cotiz-fields' },
      el('div', { class: 'cotiz-field' }, el('label', { for: 'cotiz-nombre', text: 'Tu nombre' }), inNombre, errNombre),
      el('div', { class: 'cotiz-field' },
        el('label', { for: 'cotiz-negocio' }, 'Tu negocio o proyecto ', el('span', { class: 'cotiz-opcional', text: '(opcional)' })), inNegocio),
      el('div', { class: 'cotiz-field' },
        el('label', { for: 'cotiz-idea' }, 'Contanos tu idea ', el('span', { class: 'cotiz-opcional', text: '(opcional)' })), inIdea)
    ),
    el('p', { class: 'cotiz-privacy' },
      'Estos datos solo se usan para armar tu mensaje: no se envían a ningún servidor nuestro hasta que vos lo mandás. Más info en la ',
      el('a', { href: 'privacidad.html', target: '_blank', rel: 'noopener', text: 'política de privacidad' }), '.')
  );

  /* Paso 5 — resumen (se vuelve a armar cada vez que se entra) */
  const panelResumen = el('div', { class: 'cotiz-panel' });

  const panels = [panelServicio, panelExtras, panelPlazo, panelDatos, panelResumen];

  const btnBack = el('button', { type: 'button', class: 'btn btn-ghost', text: 'Volver' });
  const btnNext = el('button', { type: 'button', class: 'btn btn-primary', text: 'Siguiente' });
  const nav = el('div', { class: 'cotiz-nav' }, btnBack, btnNext);

  root.append(
    el('div', { class: 'cotiz-progress' },
      el('div', { class: 'cotiz-progress-top' }, stepLabel, stepName), bar),
    ...panels,
    nav
  );


  /* ─────────── Lógica ─────────── */
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }

  function syncInputs() {
    root.querySelectorAll('input[name="cotiz-servicio"]').forEach((i) => { i.checked = i.value === state.servicio; });
    root.querySelectorAll('input[name="cotiz-extra"]').forEach((i) => { i.checked = state.extras.includes(i.value); });
    root.querySelectorAll('input[name="cotiz-plazo"]').forEach((i) => { i.checked = i.value === state.plazo; });
    root.querySelectorAll('input[name="cotiz-presupuesto"]').forEach((i) => { i.checked = i.value === state.presupuesto; });
    inNombre.value = state.nombre;
    inNegocio.value = state.negocio;
    inIdea.value = state.idea;
  }

  function refresh() {
    const onSummary = state.step === TOTAL;
    setText(stepLabel, onSummary ? 'Último paso' : 'Paso ' + (state.step + 1) + ' de ' + TOTAL);
    setText(stepName, onSummary ? 'Revisá y enviá' : STEPS[state.step].name);
    const done = onSummary ? TOTAL : state.step + 1;
    barFill.style.width = (done / TOTAL * 100) + '%';
    bar.setAttribute('aria-valuenow', String(done));

    btnBack.hidden = state.step === 0;
    btnNext.hidden = onSummary;
    setText(btnNext, state.step === TOTAL - 1 ? 'Ver resumen' : 'Siguiente');
    btnNext.disabled = state.step === 0 && !state.servicio;

    const s = find(CONFIG.servicios, state.servicio);
    contextLines.forEach((p) => {
      p.hidden = !s;
      p.replaceChildren('Consulta por: ', el('strong', { text: s ? s.nombre : '' }));
    });
  }

  function ensureVisible() {
    const top = root.getBoundingClientRect().top;
    if (top < 70 || top > window.innerHeight * 0.6) {
      root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function go(index, opts) {
    opts = opts || {};
    state.step = Math.max(0, Math.min(TOTAL, index));
    panels.forEach((panel, i) => {
      const on = i === state.step;
      panel.hidden = !on;
      if (on && !opts.silent) {
        panel.classList.remove('is-entering');
        void panel.offsetWidth;
        panel.classList.add('is-entering');
      }
    });
    if (state.step === TOTAL) renderSummary();
    refresh();
    if (opts.focus) {
      const title = panels[state.step].querySelector('.cotiz-title');
      if (title) title.focus({ preventScroll: true });
      ensureVisible();
    }
  }

  function clearNombreError() {
    errNombre.hidden = true;
    inNombre.removeAttribute('aria-invalid');
  }

  function datosValidos() {
    if (state.nombre.trim().length >= 2) return true;
    errNombre.hidden = false;
    inNombre.setAttribute('aria-invalid', 'true');
    inNombre.focus();
    return false;
  }

  function next() {
    if (state.step === 0 && !state.servicio) return;
    if (state.step === TOTAL - 1 && !datosValidos()) return;
    go(state.step + 1, { focus: true });
  }

  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', () => go(state.step - 1, { focus: true }));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
      e.preventDefault();
      next();
    }
  });


  /* ─────────── Mensaje y resumen ─────────── */
  function buildMessage() {
    const s = find(CONFIG.servicios, state.servicio);
    const nombre = state.nombre.trim();
    const negocio = state.negocio.trim();
    const idea = state.idea.trim();
    const extras = state.extras.map((id) => find(CONFIG.extras, id).nombre);
    const plazo = find(CONFIG.plazos, state.plazo);
    const presupuesto = find(CONFIG.presupuestos, state.presupuesto);

    const lines = [
      'Hola Sacude Devs! 👋 Soy ' + nombre + (negocio ? ' (' + negocio + ')' : '') + '.',
      '',
      'Quiero consultar por: *' + (s.mensaje || s.nombre) + '*'
    ];
    if (extras.length) lines.push('Extras: ' + extras.join(', '));
    if (plazo) lines.push('Plazo: ' + plazo.nombre);
    if (presupuesto) lines.push('Presupuesto: ' + presupuesto.nombre);
    if (idea) lines.push('', 'Mi idea:', idea);
    lines.push('', 'Consulta armada desde el cotizador de la web.');
    return lines.join('\n');
  }

  function renderSummary() {
    const s = find(CONFIG.servicios, state.servicio);
    const message = buildMessage();
    const plazo = find(CONFIG.plazos, state.plazo);
    const presupuesto = find(CONFIG.presupuestos, state.presupuesto);
    const nombre = state.nombre.trim();
    const negocio = state.negocio.trim();
    const idea = state.idea.trim();

    const rows = [
      ['Servicio', s.nombre],
      ['Extras', state.extras.length ? state.extras.map((id) => find(CONFIG.extras, id).nombre).join(', ') : 'Ninguno por ahora'],
      ['Plazo', plazo ? plazo.nombre : 'Sin definir'],
      ['Presupuesto', presupuesto ? presupuesto.nombre : 'Sin definir'],
      ['Nombre', nombre + (negocio ? ' — ' + negocio : '')]
    ];
    if (idea) rows.push(['Tu idea', idea]);

    const waUrl   = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(message);
    const mailUrl = 'mailto:' + CONFIG.email +
      '?subject=' + encodeURIComponent('Consulta: ' + s.nombre + ' — ' + nombre) +
      '&body=' + encodeURIComponent(message);

    const status = el('p', { class: 'cotiz-status', 'aria-live': 'polite' });
    const textarea = el('textarea', { class: 'cotiz-input', readonly: true, rows: '8', 'aria-label': 'Mensaje que se va a enviar' });
    textarea.value = message;

    const wa = el('a', { class: 'btn btn-whatsapp', href: waUrl, target: '_blank', rel: 'noopener', text: 'Enviar por WhatsApp' });
    const mail = el('a', { class: 'btn btn-email', href: mailUrl, text: 'Enviar por mail' });
    const copy = el('button', { type: 'button', class: 'btn btn-ghost', text: 'Copiar mensaje' });
    const restart = el('button', { type: 'button', class: 'cotiz-restart', text: 'Empezar de nuevo' });

    wa.addEventListener('click', () => {
      setText(status, 'Se abrió WhatsApp con tu mensaje listo. Solo te falta enviarlo.');
      track('cotizador_enviar', { canal: 'whatsapp', servicio: s.id });
    });
    mail.addEventListener('click', () => {
      setText(status, 'Se abrió tu app de mail con el mensaje listo. Solo te falta enviarlo.');
      track('cotizador_enviar', { canal: 'mail', servicio: s.id });
    });
    copy.addEventListener('click', () => {
      const done = () => setText(status, 'Mensaje copiado. Pegalo donde prefieras.');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(message).then(done, () => { textarea.select(); document.execCommand('copy'); done(); });
      } else {
        textarea.closest('details').open = true;
        textarea.select();
        try { document.execCommand('copy'); done(); } catch (e) { setText(status, 'Seleccioná el texto y copialo manualmente.'); }
      }
      track('cotizador_enviar', { canal: 'copiar', servicio: s.id });
    });
    restart.addEventListener('click', () => {
      state = freshState();
      syncInputs();
      clearNombreError();
      go(0, { focus: true });
    });

    panelResumen.replaceChildren(
      el('h3', { class: 'cotiz-title', tabindex: '-1', id: 'cotiz-titulo-resumen', text: 'Revisá tu consulta' }),
      el('p', { class: 'cotiz-hint', text: 'Se envía por WhatsApp o mail con todo ordenado. Después te respondemos para ver tu proyecto en detalle y pasarte una propuesta.' }),
      el('dl', { class: 'cotiz-resumen' },
        rows.map((r) => el('div', { class: 'cotiz-resumen-row' }, el('dt', { text: r[0] }), el('dd', { text: r[1] })))
      ),
      el('details', { class: 'cotiz-preview' }, el('summary', { text: 'Ver el mensaje que se va a enviar' }), textarea),
      el('div', { class: 'cotiz-actions' }, wa, mail, copy),
      status,
      el('p', null, restart)
    );
    track('cotizador_resumen', { servicio: s.id, extras: state.extras.length });
  }


  /* ─────────── "Consultar" en las cards de servicios → preselecciona ─────────── */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-servicio]');
    if (!link || !find(CONFIG.servicios, link.dataset.servicio)) return;
    state.servicio = link.dataset.servicio;
    syncInputs();
    go(1);
    track('cotizador_preseleccion', { servicio: state.servicio });
  });


  syncInputs();
  go(0, { silent: true });
})();
