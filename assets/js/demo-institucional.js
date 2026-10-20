/* =============================================
   SACUDE DEVS — Demo conceptual: Web institucional (colegio privado)
   Todo ocurre en el navegador: no hay servidor ni se guarda nada.
   El sitio del colegio y su panel comparten el mismo estado.
   ============================================= */
(function () {
  'use strict';

  const isNarrow = () => window.matchMedia('(max-width: 1079px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────── Fechas ─────────── */
  const DIAS_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromISO = (s) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  const hoyISO = () => toISO(new Date());
  const enDias = (n) => toISO(addDays(fromISO(hoyISO()), n));
  const diasHasta = (iso) => Math.round((fromISO(iso).getTime() - fromISO(hoyISO()).getTime()) / 86400000);

  function fechaCorta(iso) {
    const n = diasHasta(iso);
    if (n === 0) return 'Hoy';
    if (n === -1) return 'Ayer';
    const d = fromISO(iso);
    return d.getDate() + ' ' + MESES[d.getMonth()];
  }
  function cuando(iso) {
    const n = diasHasta(iso);
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    return 'en ' + n + ' días';
  }

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
  const scrollEl = $('esScroll');
  const modalEl = $('esModal');
  const modalPanel = $('esModalPanel');
  const toastEl = $('esToast');
  const paneCom = $('paneCom');
  const paneCal = $('paneCal');
  const paneAdm = $('paneAdm');
  const paneGal = $('paneGal');
  const paneEq = $('paneEq');
  const paneFam = $('paneFam');


  /* ─────────── Datos de la demo (institución ficticia) ─────────── */
  const rango = (prefijo, desde, hasta, sufijo) => { const o = []; for (let i = desde; i <= hasta; i++) o.push(prefijo ? prefijo + i + sufijo : i + sufijo); return o; };

  const NIVELES = [
    { id: 'inicial', nombre: 'Nivel Inicial', emoji: '🧸', edades: '3 a 5 años',
      lema: 'Jugar, explorar y crecer en comunidad.',
      desc: 'Un primer paso cuidado: salas reducidas, el juego como forma de aprender y un acompañamiento cercano a cada familia.',
      puntos: ['Salas de 3, 4 y 5 años', 'Turno mañana o tarde', 'Música y expresión corporal', 'Taller de inglés inicial'],
      grados: ['Sala de 3', 'Sala de 4', 'Sala de 5'] },
    { id: 'primario', nombre: 'Nivel Primario', emoji: '📚', edades: '6 a 11 años',
      lema: 'Aprender a aprender, con proyectos y valores.',
      desc: 'Una propuesta integral que combina las áreas básicas con proyectos, tecnología, deportes y trabajo en equipo.',
      puntos: ['Jornada extendida opcional', 'Inglés intensivo', 'Robótica y educación digital', 'Deportes y arte'],
      grados: rango('', 1, 6, '° grado') },
    { id: 'secundario', nombre: 'Nivel Secundario', emoji: '🔬', edades: '12 a 17 años',
      lema: 'Orientaciones para elegir con criterio.',
      desc: 'Formación académica sólida con orientaciones, tutorías y experiencias fuera del aula para proyectar el futuro.',
      puntos: ['Orientación en Ciencias, Economía o Comunicación', 'Tutorías y acompañamiento', 'Intercambios y salidas educativas', 'Prácticas en organizaciones'],
      grados: rango('', 1, 6, '° año') }
  ];
  const nivel = (id) => NIVELES.find((n) => n.id === id);

  const CATS = { institucional: 'Institucional', inicial: 'Inicial', primario: 'Primario', secundario: 'Secundario' };
  const NIVEL_EV = { todos: 'Todos los niveles', inicial: 'Inicial', primario: 'Primario', secundario: 'Secundario' };
  const TIPOS = {
    acto:    { emoji: '🎤', nombre: 'Acto' },
    reunion: { emoji: '👥', nombre: 'Reunión' },
    muestra: { emoji: '🔬', nombre: 'Muestra' },
    visita:  { emoji: '🏫', nombre: 'Puertas abiertas' },
    feriado: { emoji: '🏖️', nombre: 'Sin clases' },
    otro:    { emoji: '📌', nombre: 'Otro' }
  };
  const CONTACTO = { whatsapp: 'WhatsApp', email: 'email', telefono: 'teléfono' };

  const ESTADOS = {
    nueva:      { pill: 'Nueva',             cls: 'nuevo',      boton: 'Marcar contactada', sig: 'contactada',
                  cliente: (s) => ['📨 Recibimos tu solicitud', 'Pronto nos comunicamos con vos por ' + CONTACTO[s.contacto] + '.'] },
    contactada: { pill: 'Contactada',        cls: 'preparando', boton: 'Agendar visita',    sig: 'visita',
                  cliente: (s) => ['📞 Ya te contactamos', 'Revisá tu ' + CONTACTO[s.contacto] + ': conversamos sobre la propuesta para ' + s.alumno + '.'] },
    visita:     { pill: 'Visita agendada',   cls: 'listo',      boton: 'Confirmar vacante', sig: 'vacante',
                  cliente: (s) => ['🏫 Visita agendada', 'Te esperamos para conocer el colegio junto a ' + s.alumno + '.'] },
    vacante:    { pill: 'Vacante confirmada', cls: 'vacante',   boton: null,                sig: null,
                  cliente: (s) => ['🎉 ¡Vacante confirmada!', 'Bienvenidos a la comunidad del colegio, ' + s.alumno + '.'] }
  };


  /* ─────────── Ampliación: galería, equipo, familias y cuotas ─────────── */
  const ALBUMS = { actos: 'Actos', ciencias: 'Ciencias', deportes: 'Deportes', arte: 'Arte' };
  const ALBUM_GRAD = { actos: ['#1F4E8C', '#4A8AD4'], ciencias: ['#1D7F6E', '#5CC2A6'], deportes: ['#D9822B', '#F2B134'], arte: ['#8E3A86', '#D777A8'] };
  const ESCENAS = [['🎤', 'Acto'], ['🎖️', 'Reconocimientos'], ['🔬', 'Ciencias'], ['🤖', 'Robótica'], ['⚽', 'Fútbol'], ['🏊', 'Natación'], ['🎨', 'Arte'], ['🎶', 'Música'], ['📚', 'Biblioteca'], ['🌳', 'Huerta']];
  const MATERIAS = {
    primario: ['Lengua', 'Matemática', 'Ciencias Naturales', 'Ciencias Sociales', 'Inglés', 'Educación Física'],
    secundario: ['Lengua y Literatura', 'Matemática', 'Física', 'Historia', 'Inglés', 'Biología']
  };
  const OBS = [
    'Se integra con entusiasmo y colabora con sus compañeros en las propuestas del grupo.',
    'Muestra curiosidad e iniciativa. Sigue creciendo en autonomía y participación.',
    'Trabaja con responsabilidad y cumple con sus tareas. Se lo ve cómodo en el aula.'
  ];
  const FAMILIAS = [
    { id: 'rojas', nombre: 'Familia Rojas', hijos: [
      { id: 'benja', nombre: 'Benja', nivel: 'primario', grado: '3° grado' },
      { id: 'emma', nombre: 'Emma', nivel: 'inicial', grado: 'Sala de 4' }] },
    { id: 'perez', nombre: 'Familia Pérez', hijos: [
      { id: 'valentina', nombre: 'Valentina', nivel: 'secundario', grado: '2° año' }] }
  ];
  const METODOS = { tarjeta: 'Tarjeta de crédito o débito', transferencia: 'Transferencia bancaria' };
  const CUOTA_VENCE = 10; // día del mes
  const money = (n) => '$' + Number(n).toLocaleString('es-AR');
  const hashStr = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; };


  /* ─────────── Estado compartido ─────────── */
  let vacantes, comunicados, eventos, solicitudes, seq;
  let filtroNews, filtroCal, nivelTab, miSolicitud, leyendo, form, formDone, lastSent;
  let galeria, equipo, boletines, cuotasCfg, pagos, portal, filtroAlbum, filtroEq;
  let modalKind, lightIdx, lightList, payCtx;

  function initState() {
    vacantes = { inicial: 4, primario: 2, secundario: 0 };
    seq = { com: 1, ev: 1, sol: 1, gal: 1, eq: 1, pago: 1 };
    comunicados = [];
    eventos = [];
    solicitudes = [];
    filtroNews = 'todos';
    filtroCal = 'todos';
    nivelTab = 'inicial';
    miSolicitud = null;
    leyendo = null;
    formDone = false;
    lastSent = null;
    form = freshForm();

    addCom('Reunión de padres de Primario: confirmá tu asistencia', 'primario', -1, true,
      'Te invitamos a la reunión de padres de Nivel Primario, donde presentaremos los proyectos del segundo semestre.\nPor favor, confirmá tu asistencia con la secretaría del colegio para organizar mejor el encuentro.');
    addCom('Semana de la ciencia: abren las inscripciones a los talleres', 'institucional', -3, false,
      'Del lunes al viernes realizaremos talleres abiertos para todos los niveles, con experimentos, robótica y muestras de proyectos.\nLas inscripciones están abiertas para estudiantes y familias.');
    addCom('Salida educativa de 4° año al museo de ciencias', 'secundario', -5, false,
      'Los estudiantes de 4° año visitarán el museo de ciencias como parte del proyecto interdisciplinario del trimestre.\nRecordá enviar la autorización firmada antes de la salida.');
    addCom('Taller de música para familias de Nivel Inicial', 'inicial', -8, false,
      'Un encuentro para cantar, jugar y compartir con los más chicos. Las familias de salas de 3, 4 y 5 están invitadas.');

    addEv('Reunión de padres · Primario', 3, 'primario', 'reunion');
    addEv('Muestra de ciencias', 8, 'todos', 'muestra');
    addEv('Acto institucional', 12, 'todos', 'acto');
    addEv('Jornada de puertas abiertas', 18, 'todos', 'visita');
    addEv('Día sin clases', 25, 'todos', 'feriado');
    addEv('Entrega de boletines · Secundario', 30, 'secundario', 'otro');

    addSol('Mateo', 'primario', '3° grado', 'Carolina', 'whatsapp', true, 'nueva', 'Hace 1 h');
    addSol('Lola', 'inicial', 'Sala de 4', 'Diego', 'email', false, 'contactada', 'Ayer');
    miSolicitud = null;
    seedExtra();
  }

  function addCom(titulo, cat, dias, importante, texto) {
    const c = { id: 'C' + seq.com, orden: seq.com, titulo: titulo, cat: cat, fecha: enDias(dias), importante: !!importante, texto: texto, nuevo: false };
    seq.com++;
    comunicados.push(c);
    return c;
  }
  function addEv(titulo, dias, nivelId, tipo) {
    const e = { id: 'E' + seq.ev, titulo: titulo, fecha: enDias(dias), nivel: nivelId, tipo: tipo, nuevo: false };
    seq.ev++;
    eventos.push(e);
    return e;
  }
  function addSol(alumno, nivelId, grado, adulto, contacto, visita, estado, hora) {
    const s = { id: 'S' + seq.sol, num: 100 + seq.sol, alumno: alumno, nivel: nivelId, grado: grado, adulto: adulto, contacto: contacto, visita: visita, estado: estado, hora: hora, espera: vacantes[nivelId] <= 0, nuevo: false };
    seq.sol++;
    solicitudes.unshift(s);
    return s;
  }

  function freshForm() { return { alumno: '', nivel: '', grado: '', adulto: '', contacto: 'whatsapp', visita: false }; }

  const publicados = () => comunicados.slice().sort((a, b) => (b.importante - a.importante) || (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0) || (b.orden - a.orden));
  const proximos = () => eventos.filter((e) => e.fecha >= hoyISO()).sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  const totalVacantes = () => vacantes.inicial + vacantes.primario + vacantes.secundario;


  /* ─────────── Aviso breve (en el sitio) ─────────── */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2600);
  }
  let panelToastTimer = null;
  function panelToast(msg) { clearTimeout(panelToastTimer); panelToastTimer = setTimeout(() => toast(msg), 450); }

  function flash(selector) {
    const node = scrollEl.querySelector(selector);
    if (!node) return;
    node.classList.add('is-flash');
    setTimeout(() => node.classList.remove('is-flash'), 1700);
  }

  function vacTag(id) {
    const v = vacantes[id];
    return el('span', { class: 'es-tag ' + (v > 0 ? 'is-ok' : 'is-wait'), text: v > 0 ? v + (v === 1 ? ' vacante' : ' vacantes') : 'Lista de espera' });
  }


  /* ─────────── Sitio: portada, propuesta ─────────── */
  function renderHero() {
    const e = proximos()[0];
    $('esNext').replaceChildren(e
      ? el('span', null, TIPOS[e.tipo].emoji + ' Próximo evento: ', el('strong', { text: e.titulo }), ' · ' + cuando(e.fecha))
      : el('span', { text: 'Sin eventos próximos' }));
  }

  function renderNiveles() {
    $('esTabs').replaceChildren(...NIVELES.map((n) => el('button', { type: 'button', class: 'es-tab', role: 'tab', id: 'esTab-' + n.id, 'data-nivel-tab': n.id,
      'aria-selected': String(n.id === nivelTab), 'aria-controls': 'esLevel', text: n.emoji + ' ' + n.nombre.replace('Nivel ', '') })));
    const n = nivel(nivelTab);
    const box = $('esLevel');
    box.setAttribute('aria-labelledby', 'esTab-' + n.id);
    box.replaceChildren(el('div', { class: 'es-level' },
      el('div', null,
        el('h3', { class: 'serif', text: n.nombre }),
        el('div', { class: 'es-tags' }, el('span', { class: 'es-tag', text: n.edades }), vacTag(n.id)),
        el('p', { text: n.lema + ' ' + n.desc }),
        el('button', { type: 'button', class: 'es-btn', 'data-preinscribir': n.id, text: 'Pre-inscribir en ' + n.nombre.replace('Nivel ', '') })),
      el('ul', { class: 'es-points' }, n.puntos.map((p) => el('li', { text: p })))));
  }

  /* ─────────── Sitio: novedades ─────────── */
  function renderNewsChips() {
    $('esNewsChips').replaceChildren(
      el('button', { type: 'button', class: 'es-chip', 'data-filtro-news': 'todos', 'aria-pressed': String(filtroNews === 'todos'), text: 'Todos' }),
      ...Object.keys(CATS).map((k) => el('button', { type: 'button', class: 'es-chip', 'data-filtro-news': k, 'aria-pressed': String(filtroNews === k), text: CATS[k] })));
  }

  function newsCard(c) {
    const primero = c.texto.split('\n')[0];
    return el('article', { class: 'es-card' + (c.importante ? ' is-pinned' : ''), 'data-com': c.id },
      el('div', { class: 'es-meta' }, el('span', { text: fechaCorta(c.fecha) + ' · ' + CATS[c.cat] }), c.importante ? el('span', { class: 'es-pin', text: '📌 Importante' }) : null),
      el('h3', { text: c.titulo }),
      el('p', { text: primero }),
      el('button', { type: 'button', class: 'es-more', 'data-leer': c.id, 'aria-label': 'Leer el comunicado: ' + c.titulo, text: 'Leer comunicado →' }));
  }

  function renderNews() {
    const lista = publicados().filter((c) => filtroNews === 'todos' || c.cat === filtroNews);
    $('esNews').replaceChildren(...(lista.length ? lista.map(newsCard)
      : [el('div', { class: 'es-empty', text: 'No hay comunicados en esta categoría por ahora.' })]));
    renderNewsChips();
  }

  /* ─────────── Sitio: calendario ─────────── */
  function renderCalChips() {
    $('esCalChips').replaceChildren(
      ...['todos', 'inicial', 'primario', 'secundario'].map((k) => el('button', { type: 'button', class: 'es-chip', 'data-filtro-cal': k, 'aria-pressed': String(filtroCal === k),
        text: k === 'todos' ? 'Todos los niveles' : NIVEL_EV[k] })));
  }

  function renderCal() {
    const lista = proximos().filter((e) => filtroCal === 'todos' || e.nivel === 'todos' || e.nivel === filtroCal);
    const box = $('esCal');
    box.replaceChildren();
    if (!lista.length) { box.append(el('div', { class: 'es-empty', text: 'No hay eventos próximos para este nivel.' })); renderCalChips(); return; }
    let mesActual = '';
    let grupo = null;
    lista.forEach((e) => {
      const d = fromISO(e.fecha);
      const mes = MESES_LARGO[d.getMonth()] + ' ' + d.getFullYear();
      if (mes !== mesActual) {
        mesActual = mes;
        box.append(el('h3', { class: 'es-cal-month', text: mes }));
        grupo = el('div', { class: 'es-events' });
        box.append(grupo);
      }
      grupo.append(el('div', { class: 'es-event', 'data-ev': e.id },
        el('div', { class: 'es-date' }, el('b', { text: String(d.getDate()) }), el('small', { text: DIAS_CORTO[d.getDay()] })),
        el('div', null, el('strong', { text: e.titulo }), el('small', { text: TIPOS[e.tipo].emoji + ' ' + TIPOS[e.tipo].nombre + ' · ' + cuando(e.fecha) })),
        el('span', { class: 'lvl', text: e.nivel === 'todos' ? 'Todos' : NIVEL_EV[e.nivel] })));
    });
    renderCalChips();
  }

  /* ─────────── Sitio: admisión ─────────── */
  function renderVacantes() {
    $('esVac').replaceChildren(...NIVELES.map((n) => el('div', null, el('span', { text: n.emoji + ' ' + n.nombre }), vacTag(n.id))));
  }

  function nivelOptions() {
    return [el('option', { value: '', text: 'Elegí un nivel' })].concat(NIVELES.map((n) =>
      el('option', { value: n.id, text: n.nombre + ' · ' + (vacantes[n.id] > 0 ? vacantes[n.id] + (vacantes[n.id] === 1 ? ' vacante' : ' vacantes') : 'lista de espera') })));
  }
  function gradoOptions() {
    const n = nivel(form.nivel);
    return [el('option', { value: '', text: n ? 'Elegí un grado o sala' : 'Primero elegí un nivel' })].concat(n ? n.grados.map((g) => el('option', { value: g, text: g })) : []);
  }

  function buildForm() {
    const wrap = $('esFormWrap');
    if (formDone) { renderFormDone(); return; }

    const alumno = el('input', { class: 'es-input', type: 'text', id: 'esAlumno', maxlength: '40', autocomplete: 'off', placeholder: 'Ej: Mateo', 'aria-describedby': 'esAlumnoErr' });
    const selNivel = el('select', { class: 'es-select', id: 'esNivel', 'aria-describedby': 'esNivelErr' }, nivelOptions());
    const selGrado = el('select', { class: 'es-select', id: 'esGrado', 'aria-describedby': 'esGradoErr' }, gradoOptions());
    const adulto = el('input', { class: 'es-input', type: 'text', id: 'esAdulto', maxlength: '40', autocomplete: 'off', placeholder: 'Ej: Carolina', 'aria-describedby': 'esAdultoErr' });
    alumno.value = form.alumno; selNivel.value = form.nivel; selGrado.value = form.grado; adulto.value = form.adulto;

    alumno.addEventListener('input', () => { form.alumno = alumno.value; clearErr('esAlumno'); });
    adulto.addEventListener('input', () => { form.adulto = adulto.value; clearErr('esAdulto'); });
    selNivel.addEventListener('change', () => {
      form.nivel = selNivel.value; form.grado = '';
      selGrado.replaceChildren(...gradoOptions());
      selGrado.value = '';
      clearErr('esNivel');
    });
    selGrado.addEventListener('change', () => { form.grado = selGrado.value; clearErr('esGrado'); });

    const field = (id, label, control) => el('div', { class: 'es-field' }, el('label', { for: id, text: label }), control, el('p', { class: 'es-err', id: id + 'Err', role: 'alert', hidden: true }));
    const radio = (value, text) => {
      const input = el('input', { type: 'radio', name: 'esContacto', value: value });
      input.checked = form.contacto === value;
      input.addEventListener('change', () => { form.contacto = value; });
      return el('label', { class: 'es-radio' }, input, el('span', { text: text }));
    };
    const visita = el('input', { type: 'checkbox', id: 'esVisita' });
    visita.checked = form.visita;
    visita.addEventListener('change', () => { form.visita = visita.checked; });
    const enviar = el('button', { type: 'button', class: 'es-btn', id: 'esEnviar', text: 'Enviar pre-inscripción' });
    enviar.addEventListener('click', enviarForm);

    wrap.replaceChildren(el('div', { class: 'es-form' },
      el('h3', { class: 'serif', text: 'Pre-inscripción 2027' }),
      el('p', { text: 'Completá los datos básicos y el colegio se pone en contacto con vos.' }),
      el('p', { class: 'es-note', text: 'Es una demo: no ingreses datos reales. Nada se envía ni se guarda.' }),
      field('esAlumno', 'Nombre del alumno o alumna', alumno),
      el('div', { class: 'es-row2' }, field('esNivel', 'Nivel', selNivel), field('esGrado', 'Grado o sala', selGrado)),
      field('esAdulto', 'Nombre del adulto responsable', adulto),
      el('fieldset', { class: 'es-field' }, el('legend', { text: '¿Cómo preferís que te contactemos?' }),
        el('div', { class: 'es-radios' }, radio('whatsapp', 'WhatsApp'), radio('email', 'Email'), radio('telefono', 'Teléfono'))),
      el('div', { class: 'es-field' }, el('label', { class: 'es-check' }, visita, 'Quiero agendar una visita al colegio')),
      enviar));
  }

  const MSG = { esAlumno: 'Escribí el nombre del alumno o alumna.', esNivel: 'Elegí un nivel.', esGrado: 'Elegí un grado o sala.', esAdulto: 'Escribí el nombre del adulto responsable.' };
  function showErr(id) {
    const input = $(id); const er = $(id + 'Err');
    if (input) input.setAttribute('aria-invalid', 'true');
    if (er) { er.textContent = MSG[id]; er.hidden = false; }
  }
  function clearErr(id) {
    const input = $(id); const er = $(id + 'Err');
    if (input) input.removeAttribute('aria-invalid');
    if (er) er.hidden = true;
  }

  function enviarForm() {
    const faltan = [];
    if (form.alumno.trim().length < 2) faltan.push('esAlumno');
    if (!form.nivel) faltan.push('esNivel');
    if (!form.grado) faltan.push('esGrado');
    if (form.adulto.trim().length < 2) faltan.push('esAdulto');
    ['esAlumno', 'esNivel', 'esGrado', 'esAdulto'].forEach(clearErr);
    if (faltan.length) { faltan.forEach(showErr); $(faltan[0]).focus(); return; }

    const s = addSol(form.alumno.trim(), form.nivel, form.grado, form.adulto.trim(), form.contacto, form.visita, 'nueva',
      new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    s.nuevo = true;
    miSolicitud = s.id;
    lastSent = s;
    formDone = true;
    form = freshForm();
    renderFormDone();
    renderStatus();
    renderPanelAdm();
    renderKpis();
    track('demo_colegio_preinscripcion');
  }

  function renderFormDone() {
    const s = lastSent;
    const wrap = $('esFormWrap');
    const volver = el('button', { type: 'button', class: 'es-btn is-ghost', text: 'Enviar otra solicitud' });
    volver.addEventListener('click', () => { formDone = false; buildForm(); const f = $('esAlumno'); if (f) f.focus(); });
    const ir = el('button', { type: 'button', class: 'es-btn', 'data-action': 'gopanel', text: 'Ver cómo llega al colegio' });
    ir.addEventListener('click', goToAdmision);
    wrap.replaceChildren(el('div', { class: 'es-form' }, el('div', { class: 'es-done' },
      el('div', { class: 'icon', 'aria-hidden': 'true', text: '🎓' }),
      el('h3', { class: 'serif', id: 'esDoneTitle', tabindex: '-1', text: '¡Solicitud enviada!' }),
      el('p', { text: 'Pre-inscripción #' + s.num + ' de ' + s.alumno + ' (' + s.grado + ', ' + nivel(s.nivel).nombre + '). El colegio te contacta por ' + CONTACTO[s.contacto] + '.' +
        (s.espera ? ' Hoy no hay vacantes en ese nivel: quedás en lista de espera.' : '') }),
      el('div', { class: 'es-actions', style: 'justify-content:center' }, ir, volver))));
    const t = $('esDoneTitle'); if (t) t.focus({ preventScroll: true });
  }

  /* Cuando cambian las vacantes se actualizan las opciones sin borrar lo escrito */
  function refreshFormOptions() {
    const sel = $('esNivel');
    if (!sel) return;
    sel.replaceChildren(...nivelOptions());
    sel.value = form.nivel;
  }

  function renderStatus() {
    const box = $('esStatus');
    const s = solicitudes.find((x) => x.id === miSolicitud);
    box.hidden = !s;
    if (!s) return;
    const m = ESTADOS[s.estado].cliente(s);
    const close = el('button', { type: 'button', class: 'es-close', 'aria-label': 'Ocultar aviso', text: '×' });
    close.addEventListener('click', () => { miSolicitud = null; renderStatus(); });
    box.replaceChildren(el('strong', { text: m[0] + ' · Pre-inscripción #' + s.num }), el('span', { text: m[1] }), close);
    box.setAttribute('role', 'status');
  }

  /* ─────────── Sitio: interacción ─────────── */
  function scrollToSection(id) {
    const target = $(id);
    const head = scrollEl.querySelector('.es-head');
    if (target) scrollEl.scrollTo({ top: target.offsetTop - head.offsetHeight + 1, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  scrollEl.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    const tab = e.target.closest('[data-nivel-tab]');
    const fn = e.target.closest('[data-filtro-news]');
    const fc = e.target.closest('[data-filtro-cal]');
    const leer = e.target.closest('[data-leer]');
    const pre = e.target.closest('[data-preinscribir]');
    if (go) { e.preventDefault(); scrollToSection(go.dataset.go); return; }
    if (tab) { nivelTab = tab.dataset.nivelTab; renderNiveles(); const f = $('esTab-' + nivelTab); if (f) f.focus(); return; }
    if (fn) { filtroNews = fn.dataset.filtroNews; renderNews(); const f = scrollEl.querySelector('[data-filtro-news="' + filtroNews + '"]'); if (f) f.focus(); return; }
    if (fc) { filtroCal = fc.dataset.filtroCal; renderCal(); const f = scrollEl.querySelector('[data-filtro-cal="' + filtroCal + '"]'); if (f) f.focus(); return; }
    if (leer) { openNews(leer.dataset.leer, leer); return; }
    if (pre) {
      if (formDone) { formDone = false; buildForm(); }
      form.nivel = pre.dataset.preinscribir; form.grado = '';
      buildForm();
      scrollToSection('es-admision');
      const g = $('esGrado'); if (g) setTimeout(() => g.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
    }
  });

  /* Lectura de un comunicado */
  let opener = null;
  function openNews(id, from) {
    const c = comunicados.find((x) => x.id === id);
    if (!c) return;
    leyendo = id;
    opener = from;
    modalKind = 'news';
    modalPanel.className = 'es-modal';
    modalPanel.replaceChildren(
      el('button', { type: 'button', class: 'es-x', 'aria-label': 'Cerrar', 'data-action': 'cerrar', text: '✕' }),
      el('div', { class: 'es-meta' }, el('span', { text: fechaCorta(c.fecha) + ' · ' + CATS[c.cat] }), c.importante ? el('span', { class: 'es-pin', text: '📌 Importante' }) : null),
      el('h3', { class: 'serif', id: 'esModalTitle', tabindex: '-1', text: c.titulo }),
      el('div', { class: 'body' }, c.texto.split('\n').map((p) => el('p', { text: p }))),
      el('div', { class: 'foot' }, el('button', { type: 'button', class: 'es-btn is-ghost', 'data-action': 'cerrar', text: 'Cerrar' })));
    modalEl.hidden = false;
    scrollEl.inert = true;
    $('esModalTitle').focus({ preventScroll: true });
  }
  function closeNews(returnFocus) {
    modalEl.hidden = true;
    scrollEl.inert = false;
    leyendo = null;
    modalKind = null;
    lightIdx = null;
    payCtx = null;
    if (returnFocus !== false && opener && document.contains(opener)) opener.focus();
  }
  modalEl.addEventListener('click', (e) => { if (e.target === modalEl || e.target.closest('[data-action="cerrar"]')) closeNews(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modalEl.hidden) closeNews(); });


  /* ─────────── Panel: comunicados ─────────── */
  function field(label, control, id) {
    return el('div', { class: 'cp-field' }, el('label', { for: id, text: label }), control);
  }

  function buildPanelCom() {
    const titulo = el('input', { class: 'cp-input', type: 'text', id: 'cpTitulo', maxlength: '90', placeholder: 'Ej: Cambio de horario de ingreso', 'aria-describedby': 'cpTituloErr' });
    const cat = el('select', { class: 'cp-select', id: 'cpCat' }, Object.keys(CATS).map((k) => el('option', { value: k, text: CATS[k] })));
    const texto = el('textarea', { class: 'cp-textarea', id: 'cpTexto', maxlength: '600', placeholder: 'Escribí el comunicado…', 'aria-describedby': 'cpTextoErr' });
    const imp = el('input', { type: 'checkbox', id: 'cpImp' });
    const publicar = el('button', { type: 'button', class: 'cp-btn', text: 'Publicar comunicado' });
    const errTitulo = el('p', { class: 'cp-err', id: 'cpTituloErr', role: 'alert', hidden: true, text: 'Poné un título de al menos 3 letras.' });
    const errTexto = el('p', { class: 'cp-err', id: 'cpTextoErr', role: 'alert', hidden: true, text: 'Escribí el texto del comunicado.' });

    publicar.addEventListener('click', () => {
      const t = titulo.value.trim(); const x = texto.value.trim();
      titulo.removeAttribute('aria-invalid'); texto.removeAttribute('aria-invalid'); errTitulo.hidden = true; errTexto.hidden = true;
      if (t.length < 3) { titulo.setAttribute('aria-invalid', 'true'); errTitulo.hidden = false; titulo.focus(); return; }
      if (x.length < 10) { texto.setAttribute('aria-invalid', 'true'); errTexto.hidden = false; texto.focus(); return; }
      const c = addCom(t, cat.value, 0, imp.checked, x);
      c.nuevo = true;
      titulo.value = ''; texto.value = ''; imp.checked = false;
      filtroNews = 'todos';
      renderNews();
      renderPanelComList();
      renderKpis();
      flash('[data-com="' + c.id + '"]');
      toast('📢 Nuevo comunicado publicado: ' + t);
      trackOnce('demo_colegio_panel');
      titulo.focus();
    });

    paneCom.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Publicar un comunicado' }),
        el('p', { text: 'Aparece en el sitio al instante, sin pedirle nada a nadie.' }),
        field('Título', titulo, 'cpTitulo'), errTitulo,
        field('Categoría', cat, 'cpCat'),
        field('Texto', texto, 'cpTexto'), errTexto,
        el('div', { class: 'cp-field' }, el('label', { class: 'cp-check' }, imp, 'Marcar como importante (queda fijado arriba)')),
        publicar),
      el('h3', { class: 'cp-sub', text: 'Publicados' }),
      el('div', { class: 'cp-list', id: 'cpComList' }));
    renderPanelComList();
  }

  function renderPanelComList() {
    const box = $('cpComList');
    if (!box) return;
    const lista = publicados();
    box.replaceChildren(...(lista.length ? lista.map((c) => el('div', { class: 'cp-item' + (c.nuevo ? ' is-new' : ''), 'data-row-com': c.id },
      el('strong', { text: c.titulo }),
      el('small', { text: fechaCorta(c.fecha) + ' · ' + CATS[c.cat] + (c.importante ? ' · 📌 fijado' : '') }),
      el('div', { class: 'acts' },
        el('button', { type: 'button', class: 'cp-btn is-ghost is-small', 'data-com-pin': c.id, text: c.importante ? 'Quitar fijado' : 'Fijar arriba' }),
        el('button', { type: 'button', class: 'cp-btn is-danger is-small', 'data-com-del': c.id, text: 'Eliminar' })))
      ) : [el('p', { class: 'cp-hint', text: 'No hay comunicados publicados.' })]));
    comunicados.forEach((c) => { c.nuevo = false; });
  }

  paneCom.addEventListener('click', (e) => {
    const pin = e.target.closest('[data-com-pin]');
    const del = e.target.closest('[data-com-del]');
    if (pin) {
      const c = comunicados.find((x) => x.id === pin.dataset.comPin);
      c.importante = !c.importante;
      renderNews(); renderPanelComList();
      flash('[data-com="' + c.id + '"]');
      const f = paneCom.querySelector('[data-com-pin="' + c.id + '"]'); if (f) f.focus();
      toast(c.importante ? '📌 Comunicado fijado arriba' : 'Comunicado sin fijar');
      trackOnce('demo_colegio_panel');
    } else if (del) {
      const c = comunicados.find((x) => x.id === del.dataset.comDel);
      comunicados.splice(comunicados.indexOf(c), 1);
      if (leyendo === c.id) { closeNews(false); toast('Ese comunicado ya no está publicado'); }
      else toast('🗑️ Comunicado eliminado del sitio');
      renderNews(); renderPanelComList(); renderKpis();
      trackOnce('demo_colegio_panel');
    }
  });


  /* ─────────── Panel: calendario ─────────── */
  function buildPanelCal() {
    const titulo = el('input', { class: 'cp-input', type: 'text', id: 'cpEvTitulo', maxlength: '70', placeholder: 'Ej: Acto del Día del Estudiante', 'aria-describedby': 'cpEvErr' });
    const fecha = el('input', { class: 'cp-input', type: 'date', id: 'cpEvFecha', min: hoyISO() });
    fecha.value = enDias(7);
    const selNivel = el('select', { class: 'cp-select', id: 'cpEvNivel' }, Object.keys(NIVEL_EV).map((k) => el('option', { value: k, text: NIVEL_EV[k] })));
    const tipo = el('select', { class: 'cp-select', id: 'cpEvTipo' }, Object.keys(TIPOS).map((k) => el('option', { value: k, text: TIPOS[k].emoji + ' ' + TIPOS[k].nombre })));
    const err = el('p', { class: 'cp-err', id: 'cpEvErr', role: 'alert', hidden: true });
    const agregar = el('button', { type: 'button', class: 'cp-btn', text: 'Agregar al calendario' });

    agregar.addEventListener('click', () => {
      const t = titulo.value.trim();
      titulo.removeAttribute('aria-invalid'); fecha.removeAttribute('aria-invalid'); err.hidden = true;
      if (t.length < 3) { titulo.setAttribute('aria-invalid', 'true'); err.textContent = 'Poné un nombre para el evento.'; err.hidden = false; titulo.focus(); return; }
      if (!fecha.value || fecha.value < hoyISO()) { fecha.setAttribute('aria-invalid', 'true'); err.textContent = 'Elegí una fecha de hoy en adelante.'; err.hidden = false; fecha.focus(); return; }
      const ev = { id: 'E' + seq.ev++, titulo: t, fecha: fecha.value, nivel: selNivel.value, tipo: tipo.value, nuevo: true };
      eventos.push(ev);
      titulo.value = ''; filtroCal = 'todos';
      renderCal(); renderHero(); renderPanelCalList();
      flash('[data-ev="' + ev.id + '"]');
      toast('📅 Evento agregado al calendario: ' + ev.titulo);
      trackOnce('demo_colegio_panel');
      titulo.focus();
    });

    paneCal.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Agregar un evento' }),
        el('p', { text: 'Actos, reuniones, muestras o días sin clases.' }),
        field('Nombre del evento', titulo, 'cpEvTitulo'),
        el('div', { class: 'cp-two' }, field('Fecha', fecha, 'cpEvFecha'), field('Tipo', tipo, 'cpEvTipo')),
        field('Para quién', selNivel, 'cpEvNivel'),
        err, agregar),
      el('h3', { class: 'cp-sub', text: 'Próximos eventos' }),
      el('div', { class: 'cp-list', id: 'cpCalList' }));
    renderPanelCalList();
  }

  function renderPanelCalList() {
    const box = $('cpCalList');
    if (!box) return;
    const lista = proximos();
    box.replaceChildren(...(lista.length ? lista.map((e) => el('div', { class: 'cp-item' + (e.nuevo ? ' is-new' : ''), 'data-row-ev': e.id },
      el('strong', { text: e.titulo }),
      el('small', { text: fechaCorta(e.fecha) + ' · ' + TIPOS[e.tipo].emoji + ' ' + TIPOS[e.tipo].nombre + ' · ' + NIVEL_EV[e.nivel] }),
      el('div', { class: 'acts' }, el('button', { type: 'button', class: 'cp-btn is-danger is-small', 'data-ev-del': e.id, text: 'Eliminar' }))))
      : [el('p', { class: 'cp-hint', text: 'No hay eventos próximos.' })]));
    eventos.forEach((e) => { e.nuevo = false; });
  }

  paneCal.addEventListener('click', (e) => {
    const del = e.target.closest('[data-ev-del]');
    if (!del) return;
    const ev = eventos.find((x) => x.id === del.dataset.evDel);
    eventos.splice(eventos.indexOf(ev), 1);
    renderCal(); renderHero(); renderPanelCalList();
    toast('🗑️ Evento quitado del calendario');
    trackOnce('demo_colegio_panel');
  });


  /* ─────────── Panel: admisión ─────────── */
  function buildPanelAdm() {
    const campo = (n) => {
      return el('div', null,
        el('label', { for: 'cpVac-' + n.id, text: n.emoji + ' ' + n.nombre.replace('Nivel ', '') }),
        el('input', { class: 'cp-input', type: 'number', id: 'cpVac-' + n.id, min: '0', max: '99', step: '1', inputmode: 'numeric', value: String(vacantes[n.id]), 'data-vac': n.id }));
    };
    paneAdm.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Vacantes disponibles' }),
        el('p', { text: 'Se muestran en el sitio. Con 0 vacantes, las familias quedan en lista de espera.' }),
        el('div', { class: 'cp-vac' }, NIVELES.map(campo))),
      el('h3', { class: 'cp-sub', text: 'Solicitudes de pre-inscripción' }),
      el('div', { id: 'cpSolList' }));
    renderPanelAdm();
  }

  function solNode(s) {
    const st = ESTADOS[s.estado];
    const sinCupo = s.estado === 'visita' && vacantes[s.nivel] <= 0;
    const foot = el('div', { class: 'pn-order-foot' }, el('small', { style: 'color:var(--muted)', text: s.hora }));
    if (st.boton) foot.append(el('button', { type: 'button', class: 'pn-advance', 'data-sol': s.id, disabled: sinCupo, text: st.boton }));
    return el('article', { class: 'pn-order' + (s.estado === 'nueva' ? ' is-new' : ''), 'data-row-sol': s.id },
      el('div', { class: 'pn-order-top' },
        el('div', null, el('strong', { text: s.alumno + ' · ' + s.grado }), ' ', el('small', { text: '#' + s.num })),
        el('span', { class: 'pn-pill pn-pill-' + st.cls, text: st.pill })),
      el('ul', { class: 'pn-lines' },
        el('li', null, el('span', { text: nivel(s.nivel).nombre }), el('span', { text: s.espera && s.estado !== 'vacante' ? 'Lista de espera' : '' })),
        el('li', null, el('span', { text: 'Responsable: ' + s.adulto }), el('span', { text: 'Prefiere ' + CONTACTO[s.contacto] }))),
      s.visita ? el('p', { class: 'pn-nota', text: '🏫 Quiere agendar una visita al colegio' }) : null,
      sinCupo ? el('p', { class: 'pn-nota', text: 'Sin vacantes en ' + nivel(s.nivel).nombre + ': subí el cupo para confirmarla.' }) : null,
      foot);
  }

  function renderPanelAdm() {
    const box = $('cpSolList');
    if (!box) return;
    box.replaceChildren(...(solicitudes.length ? solicitudes.map(solNode) : [el('p', { class: 'cp-hint', text: 'Todavía no hay solicitudes. Hacé una pre-inscripción desde el sitio.' })]));
    solicitudes.forEach((s) => { s.nuevo = false; });
  }

  paneAdm.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-vac]');
    if (!inp) return;
    const v = Number(inp.value);
    if (inp.value === '' || !isFinite(v) || v < 0) return;
    const id = inp.dataset.vac;
    vacantes[id] = Math.round(v);
    renderNiveles(); renderVacantes(); refreshFormOptions(); renderPanelAdm(); renderKpis();
    panelToast(nivel(id).nombre + ': ' + (vacantes[id] > 0 ? vacantes[id] + (vacantes[id] === 1 ? ' vacante' : ' vacantes') : 'sin vacantes (lista de espera)'));
    trackOnce('demo_colegio_panel');
  });

  paneAdm.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sol]');
    if (!b || b.disabled) return;
    const s = solicitudes.find((x) => x.id === b.dataset.sol);
    const sig = ESTADOS[s.estado].sig;
    if (!sig) return;
    if (sig === 'vacante') {
      if (vacantes[s.nivel] <= 0) return;
      vacantes[s.nivel]--;
      const inp = paneAdm.querySelector('[data-vac="' + s.nivel + '"]'); if (inp) inp.value = String(vacantes[s.nivel]);
    }
    s.estado = sig;
    renderPanelAdm(); renderKpis(); renderNiveles(); renderVacantes(); refreshFormOptions(); renderStatus();
    const again = paneAdm.querySelector('[data-sol="' + s.id + '"]'); if (again) again.focus();
    if (s.id === miSolicitud) toast(ESTADOS[s.estado].cliente(s)[0]);
    trackOnce('demo_colegio_panel');
  });


  /* ─────────── Ampliación: datos de ejemplo ─────────── */
  function addFoto(album, escena, titulo, alInicio) {
    const f = { id: 'G' + seq.gal++, album: album, escena: escena, titulo: titulo, visible: true };
    if (alInicio) galeria.unshift(f); else galeria.push(f);
    return f;
  }
  function addMiembro(emoji, nombre, rol, nivelId, alInicio) {
    const m = { id: 'Q' + seq.eq++, emoji: emoji, nombre: nombre, rol: rol, nivel: nivelId, visible: true };
    if (alInicio) equipo.unshift(m); else equipo.push(m);
    return m;
  }
  function addPago(familiaId, mes, metodo, estado, hora, monto) {
    const p = { id: 'P' + seq.pago++, familia: familiaId, mes: mes, metodo: metodo, estado: estado, hora: hora, monto: monto };
    pagos.unshift(p);
    return p;
  }

  const hijosDe = (f) => f.hijos;
  const montoFamilia = (f) => f.hijos.reduce((t, h) => t + cuotasCfg[h.nivel], 0);
  const todosLosHijos = () => FAMILIAS.reduce((a, f) => a.concat(f.hijos), []);
  const familiaDe = (hijoId) => FAMILIAS.find((f) => f.hijos.some((h) => h.id === hijoId));

  function mesesCuotas() {
    const hoy = fromISO(hoyISO());
    return [-1, 0, 1].map((off) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() + off, 1);
      return { key: d.getFullYear() + '-' + pad(d.getMonth() + 1), label: MESES_LARGO[d.getMonth()], venc: toISO(new Date(d.getFullYear(), d.getMonth(), CUOTA_VENCE)), vencTxt: CUOTA_VENCE + ' ' + MESES[d.getMonth()] };
    });
  }
  const pagoDe = (f, mesKey) => pagos.find((p) => p.familia === f.id && p.mes === mesKey);
  function estadoCuota(f, mes) {
    const p = pagoDe(f, mes.key);
    if (p) return p.estado;
    return mes.venc < hoyISO() ? 'vencida' : 'pendiente';
  }
  const pendientesDe = (f) => mesesCuotas().filter((m) => { const e = estadoCuota(f, m); return e === 'pendiente' || e === 'vencida'; }).length;

  function seedExtra() {
    galeria = []; equipo = []; pagos = [];
    [['actos', '🎤', 'Acto institucional de apertura'], ['actos', '🎖️', 'Reconocimientos del año'], ['ciencias', '🔬', 'Feria de ciencias'], ['ciencias', '🤖', 'Taller de robótica'],
     ['deportes', '⚽', 'Torneo intercolegial'], ['deportes', '🏊', 'Jornada de natación'], ['arte', '🎨', 'Muestra de arte'], ['arte', '🎶', 'Ensayo del coro']]
      .forEach((x) => addFoto(x[0], x[1], x[2]));
    [['🧑‍🏫', 'Prof. Laura Méndez', 'Dirección general', 'todos'], ['🧑‍💼', 'Prof. Martín Giraldo', 'Coordinación de Nivel Primario', 'primario'],
     ['👩‍🏫', 'Prof. Julia Sosa', 'Maestra de Sala de 4', 'inicial'], ['👨‍🏫', 'Prof. Andrés Paz', 'Matemática', 'secundario'],
     ['👩‍💻', 'Prof. Camila Ríos', 'Inglés', 'todos'], ['🧑‍⚕️', 'Lic. Hernán Cruz', 'Orientación escolar', 'todos']]
      .forEach((x) => addMiembro(x[0], x[1], x[2], x[3]));
    boletines = {};
    todosLosHijos().forEach((h) => { boletines[h.id] = { 1: true, 2: true, 3: false }; });
    cuotasCfg = { inicial: 85000, primario: 95000, secundario: 110000 };
    const meses = mesesCuotas();
    FAMILIAS.forEach((f) => addPago(f.id, meses[0].key, 'tarjeta', 'pagada', 'Mes anterior', montoFamilia(f)));
    addPago('perez', meses[1].key, 'transferencia', 'revision', 'Hoy', montoFamilia(FAMILIAS[1]));
    filtroAlbum = 'todos';
    filtroEq = 'todos';
    portal = { familia: null, hijo: null, tri: 2, tab: 'boletin' };
    modalKind = null; lightIdx = null; lightList = []; payCtx = null;
  }


  /* ─────────── Sitio: equipo docente ─────────── */
  function chipsNode(attr, actual, items) {
    return items.map((k) => el('button', { type: 'button', class: 'es-chip', [attr]: k[0], 'aria-pressed': String(actual === k[0]), text: k[1] }));
  }

  function renderEquipo() {
    $('esEqChips').replaceChildren(...chipsNode('data-filtro-eq', filtroEq, [['todos', 'Todos'], ['inicial', 'Inicial'], ['primario', 'Primario'], ['secundario', 'Secundario']]));
    const lista = equipo.filter((m) => m.visible && (filtroEq === 'todos' || m.nivel === 'todos' || m.nivel === filtroEq));
    $('esEquipo').replaceChildren(...(lista.length ? lista.map((m) => el('article', { class: 'es-member', 'data-eq': m.id },
      el('div', { class: 'avatar', 'aria-hidden': 'true', text: m.emoji }),
      el('h3', { text: m.nombre }),
      el('p', { text: m.rol }),
      el('span', { class: 'es-tag', text: m.nivel === 'todos' ? 'Todos los niveles' : NIVEL_EV[m.nivel] })))
      : [el('div', { class: 'es-empty', text: 'No hay integrantes para este nivel por ahora.' })]));
  }


  /* ─────────── Sitio: galería ─────────── */
  const fotosVisibles = () => galeria.filter((f) => f.visible && (filtroAlbum === 'todos' || f.album === filtroAlbum));

  function renderGaleria() {
    $('esGalChips').replaceChildren(...chipsNode('data-filtro-gal', filtroAlbum, [['todos', 'Todas']].concat(Object.keys(ALBUMS).map((k) => [k, ALBUMS[k]]))));
    const lista = fotosVisibles();
    $('esGaleria').replaceChildren(...(lista.length ? lista.map((f) => el('button', { type: 'button', class: 'es-photo', 'data-foto': f.id,
      style: '--g1:' + ALBUM_GRAD[f.album][0] + ';--g2:' + ALBUM_GRAD[f.album][1], 'aria-label': 'Ver foto: ' + f.titulo },
      el('span', { class: 'emo', 'aria-hidden': 'true', text: f.escena }), el('span', { class: 'cap', text: f.titulo })))
      : [el('div', { class: 'es-empty', text: 'No hay fotos en este álbum por ahora.' })]));
  }

  function openGallery(id, from) {
    lightList = fotosVisibles();
    lightIdx = lightList.findIndex((f) => f.id === id);
    if (lightIdx < 0) return;
    opener = from;
    modalKind = 'galeria';
    renderLight();
    modalEl.hidden = false;
    scrollEl.inert = true;
    const t = $('esModalTitle'); if (t) t.focus({ preventScroll: true });
  }

  function renderLight() {
    const f = lightList[lightIdx];
    modalPanel.className = 'es-modal is-light';
    modalPanel.replaceChildren(
      el('button', { type: 'button', class: 'es-x', 'aria-label': 'Cerrar', 'data-action': 'cerrar', text: '✕' }),
      el('div', { class: 'es-light-pic', style: '--g1:' + ALBUM_GRAD[f.album][0] + ';--g2:' + ALBUM_GRAD[f.album][1], 'aria-hidden': 'true', text: f.escena }),
      el('h3', { class: 'serif', id: 'esModalTitle', tabindex: '-1', text: f.titulo }),
      el('p', { class: 'es-light-meta', text: ALBUMS[f.album] + ' · foto ' + (lightIdx + 1) + ' de ' + lightList.length }),
      el('div', { class: 'es-light-nav' },
        el('button', { type: 'button', class: 'es-btn is-ghost', 'data-light': 'prev', disabled: lightList.length < 2, text: '← Anterior' }),
        el('button', { type: 'button', class: 'es-btn is-ghost', 'data-light': 'next', disabled: lightList.length < 2, text: 'Siguiente →' })));
  }

  function moveLight(delta) {
    if (modalKind !== 'galeria' || lightList.length < 2) return;
    lightIdx = (lightIdx + delta + lightList.length) % lightList.length;
    renderLight();
    const t = $('esModalTitle'); if (t) t.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', (e) => {
    if (modalEl.hidden || modalKind !== 'galeria') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); moveLight(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); moveLight(-1); }
  });


  /* ─────────── Sitio: portal de familias ─────────── */
  const familiaActual = () => FAMILIAS.find((f) => f.id === portal.familia) || null;

  function renderPortal() {
    const box = $('esPortal');
    const f = familiaActual();
    if (!f) { box.replaceChildren(loginNode()); return; }
    const h = f.hijos.find((x) => x.id === portal.hijo) || f.hijos[0];
    portal.hijo = h.id;
    const pend = pendientesDe(f);
    box.replaceChildren(el('div', { class: 'es-portal-card' },
      el('div', { class: 'es-portal-head' },
        el('div', null, el('h3', { class: 'serif', text: 'Hola, ' + f.nombre }), el('small', { text: f.hijos.map((x) => x.nombre).join(' y ') })),
        el('button', { type: 'button', class: 'es-link', 'data-portal': 'logout', text: 'Salir' })),
      el('div', { class: 'es-tabs', role: 'tablist', 'aria-label': 'Secciones del portal' },
        el('button', { type: 'button', class: 'es-tab', role: 'tab', 'data-portal-tab': 'boletin', 'aria-selected': String(portal.tab === 'boletin'), text: '📄 Boletín' }),
        el('button', { type: 'button', class: 'es-tab', role: 'tab', 'data-portal-tab': 'cuotas', 'aria-selected': String(portal.tab === 'cuotas') }, '💳 Cuotas',
          pend ? el('span', { class: 'badge', text: String(pend) }) : null)),
      portal.tab === 'boletin' ? boletinView(f, h) : cuotasView(f)));
  }

  function loginNode() {
    const sel = el('select', { class: 'es-select', id: 'esFamSel', 'aria-describedby': 'esFamErr' },
      [el('option', { value: '', text: 'Elegí una familia de ejemplo' })].concat(FAMILIAS.map((f) =>
        el('option', { value: f.id, text: f.nombre + ' · ' + f.hijos.length + (f.hijos.length === 1 ? ' hijo' : ' hijos') }))));
    return el('div', { class: 'es-portal-card es-login' },
      el('h3', { class: 'serif', text: 'Ingresá a tu cuenta' }),
      el('p', { text: 'Elegí una familia de ejemplo para ver cómo es el portal desde adentro.' }),
      el('p', { class: 'es-note', text: 'En un portal real se ingresa con usuario y contraseña. Acá no se pide ningún dato.' }),
      el('div', { class: 'es-field' }, el('label', { for: 'esFamSel', text: 'Familia' }), sel,
        el('p', { class: 'es-err', id: 'esFamErr', role: 'alert', hidden: true, text: 'Elegí una familia para ingresar.' })),
      el('button', { type: 'button', class: 'es-btn', 'data-portal': 'login', text: 'Ingresar al portal' }));
  }

  function boletinView(f, h) {
    const chips = [];
    if (f.hijos.length > 1) {
      chips.push(el('div', { class: 'es-subchips', role: 'group', 'aria-label': 'Elegí un hijo' }, f.hijos.map((x) =>
        el('button', { type: 'button', class: 'es-chip', 'data-portal-hijo': x.id, 'aria-pressed': String(x.id === h.id), text: x.nombre + ' · ' + x.grado }))));
    }
    chips.push(el('div', { class: 'es-subchips', role: 'group', 'aria-label': 'Elegí un trimestre' }, [1, 2, 3].map((t) =>
      el('button', { type: 'button', class: 'es-chip', 'data-portal-tri': String(t), 'aria-pressed': String(portal.tri === t), text: t + '° trimestre' }))));

    let cuerpo;
    if (!boletines[h.id][portal.tri]) {
      cuerpo = el('div', { class: 'es-wait' }, '📭 El boletín del ' + portal.tri + '° trimestre de ' + h.nombre + ' todavía no está disponible.', el('br'), 'Te avisamos cuando el colegio lo publique.');
    } else {
      const asis = 92 + hashStr(h.id + 'a' + portal.tri) % 8;
      const obs = OBS[hashStr(h.id + 'o' + portal.tri) % OBS.length];
      let tabla = null;
      let promedio = null;
      if (h.nivel !== 'inicial') {
        const base = h.nivel === 'secundario' ? 6 : 7;
        const span = h.nivel === 'secundario' ? 5 : 4;
        const notas = MATERIAS[h.nivel].map((m) => ({ m: m, n: base + hashStr(h.id + m + portal.tri) % span }));
        promedio = (notas.reduce((t, x) => t + x.n, 0) / notas.length).toFixed(1).replace('.', ',');
        tabla = el('table', { class: 'es-grades' },
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Materia' }), el('th', { scope: 'col', text: 'Nota' }))),
          el('tbody', null, notas.map((x) => el('tr', null, el('td', { text: x.m }), el('td', null, el('span', { class: 'es-nota' + (x.n >= 9 ? ' is-hi' : ''), text: String(x.n) }))))));
      }
      cuerpo = el('div', { class: 'es-bol' },
        el('div', { class: 'es-bol-top' }, el('strong', { text: h.nombre + ' · ' + h.grado + ' · ' + portal.tri + '° trimestre' }),
          el('button', { type: 'button', class: 'es-btn is-ghost', 'data-portal-descargar': '1', text: 'Descargar PDF' })),
        tabla,
        el('div', { class: 'es-bol-meta' },
          el('span', { class: 'es-tag', text: 'Asistencia ' + asis + '%' }),
          promedio ? el('span', { class: 'es-tag is-ok', text: 'Promedio ' + promedio }) : el('span', { class: 'es-tag', text: 'Informe cualitativo' })),
        el('p', { class: 'es-obs', text: '📝 ' + obs }));
    }
    return el('div', null, chips, cuerpo);
  }

  function cuotasView(f) {
    const meses = mesesCuotas();
    return el('div', null,
      el('p', { class: 'lead', style: 'margin:0 0 .8rem;font-size:.82rem;color:var(--es-muted)', text: 'Cuota mensual de ' + f.nombre + ': ' + money(montoFamilia(f)) + ' (' + f.hijos.length + (f.hijos.length === 1 ? ' hijo' : ' hijos') + ').' }),
      el('div', { class: 'es-cuotas' }, meses.map((mes) => {
        const est = estadoCuota(f, mes);
        const pago = pagoDe(f, mes.key);
        const pill = { pagada: ['ok', 'Pagada'], revision: ['info', 'Pago en revisión'], pendiente: ['warn', 'Pendiente'], vencida: ['bad', 'Vencida'] }[est];
        return el('div', { class: 'es-cuota', 'data-cuota': mes.key },
          el('div', null, el('strong', { text: 'Cuota de ' + mes.label }), el('small', { text: pago ? (METODOS[pago.metodo] + ' · ' + pago.hora) : 'Vence el ' + mes.vencTxt })),
          el('span', { class: 'monto', text: money(pago ? pago.monto : montoFamilia(f)) }),
          el('div', { class: 'es-cuota-acc' }, el('span', { class: 'es-pill ' + pill[0], text: pill[1] }),
            (est === 'pendiente' || est === 'vencida') ? el('button', { type: 'button', class: 'es-btn', 'data-pagar': mes.key, 'aria-label': 'Pagar la cuota de ' + mes.label, text: 'Pagar' }) : null));
      })));
  }

  /* Pago de una cuota (ventana modal) */
  function openPay(mesKey, from) {
    if (!familiaActual() || !mesesCuotas().some((m) => m.key === mesKey)) return;
    payCtx = { mesKey: mesKey, metodo: 'tarjeta' };
    opener = from;
    modalKind = 'pago';
    renderPay();
    modalEl.hidden = false;
    scrollEl.inert = true;
    $('esModalTitle').focus({ preventScroll: true });
  }

  function renderPay() {
    const f = familiaActual();
    const mes = mesesCuotas().find((m) => m.key === payCtx.mesKey);
    const metodo = (value, sub) => {
      const input = el('input', { type: 'radio', name: 'esMetodo', value: value });
      input.checked = payCtx.metodo === value;
      return el('label', { class: 'es-choice' }, input, el('span', null, METODOS[value], el('small', { text: sub })));
    };
    modalPanel.className = 'es-modal';
    modalPanel.replaceChildren(
      el('button', { type: 'button', class: 'es-x', 'aria-label': 'Cerrar', 'data-action': 'cerrar', text: '✕' }),
      el('h3', { class: 'serif', id: 'esModalTitle', tabindex: '-1', text: 'Pagar la cuota de ' + mes.label }),
      el('ul', { class: 'es-pay-lines' },
        ...f.hijos.map((h) => el('li', null, el('span', { text: h.nombre + ' · ' + h.grado }), el('span', { text: money(cuotasCfg[h.nivel]) }))),
        el('li', { class: 'total' }, el('span', { text: 'Total' }), el('span', { text: money(montoFamilia(f)) }))),
      el('div', { class: 'es-choices', role: 'radiogroup', 'aria-label': 'Forma de pago' },
        metodo('tarjeta', 'Se acredita al instante'), metodo('transferencia', 'El colegio la confirma cuando la recibe')),
      el('p', { class: 'es-note', text: 'Es una demo: no ingreses datos reales ni de tarjetas. No se procesa ningún pago.' }),
      el('div', { class: 'foot', style: 'gap:.5rem' },
        el('button', { type: 'button', class: 'es-btn is-ghost', 'data-action': 'cerrar', text: 'Cancelar' }),
        el('button', { type: 'button', class: 'es-btn', 'data-pay-confirm': '1', text: 'Pagar ' + money(montoFamilia(f)) })));
  }

  function confirmarPago() {
    const f = familiaActual();
    const mes = mesesCuotas().find((m) => m.key === payCtx.mesKey);
    if (!f || !mes || pagoDe(f, mes.key)) { closeNews(false); return; }
    const metodo = payCtx.metodo;
    addPago(f.id, mes.key, metodo, metodo === 'tarjeta' ? 'pagada' : 'revision', new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), montoFamilia(f));
    closeNews(false);
    renderPortal();
    renderPanelFam();
    renderKpis();
    flash('[data-cuota="' + mes.key + '"]');
    toast(metodo === 'tarjeta' ? '💳 Pago aprobado: cuota de ' + mes.label : '🏦 Recibimos tu aviso de pago: el colegio lo confirma en breve');
    track('demo_colegio_pago', { metodo: metodo });
  }

  modalPanel.addEventListener('click', (e) => {
    const light = e.target.closest('[data-light]');
    if (light) { moveLight(light.dataset.light === 'next' ? 1 : -1); const again = modalPanel.querySelector('[data-light="' + light.dataset.light + '"]'); if (again) again.focus(); return; }
    if (e.target.closest('[data-pay-confirm]')) confirmarPago();
  });
  modalPanel.addEventListener('change', (e) => {
    if (e.target.name === 'esMetodo' && payCtx) payCtx.metodo = e.target.value;
  });

  /* Eventos del sitio: filtros, galería y portal */
  scrollEl.addEventListener('click', (e) => {
    const fg = e.target.closest('[data-filtro-gal]');
    const fe = e.target.closest('[data-filtro-eq]');
    const foto = e.target.closest('[data-foto]');
    const pt = e.target.closest('[data-portal]');
    const ptab = e.target.closest('[data-portal-tab]');
    const phijo = e.target.closest('[data-portal-hijo]');
    const ptri = e.target.closest('[data-portal-tri]');
    const pagar = e.target.closest('[data-pagar]');
    const desc = e.target.closest('[data-portal-descargar]');
    if (fg) { filtroAlbum = fg.dataset.filtroGal; renderGaleria(); const f = scrollEl.querySelector('[data-filtro-gal="' + filtroAlbum + '"]'); if (f) f.focus(); return; }
    if (fe) { filtroEq = fe.dataset.filtroEq; renderEquipo(); const f = scrollEl.querySelector('[data-filtro-eq="' + filtroEq + '"]'); if (f) f.focus(); return; }
    if (foto) { openGallery(foto.dataset.foto, foto); return; }
    if (pt) {
      if (pt.dataset.portal === 'login') {
        const sel = $('esFamSel');
        if (!sel.value) { sel.setAttribute('aria-invalid', 'true'); $('esFamErr').hidden = false; sel.focus(); return; }
        portal = { familia: sel.value, hijo: familiaActualPorId(sel.value).hijos[0].id, tri: 2, tab: 'boletin' };
        renderPortal();
        const t = scrollEl.querySelector('.es-portal-card h3'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
        track('demo_colegio_portal');
      } else { portal = { familia: null, hijo: null, tri: 2, tab: 'boletin' }; renderPortal(); const s = $('esFamSel'); if (s) s.focus({ preventScroll: true }); }
      return;
    }
    if (ptab) { portal.tab = ptab.dataset.portalTab; renderPortal(); const f = scrollEl.querySelector('[data-portal-tab="' + portal.tab + '"]'); if (f) f.focus(); return; }
    if (phijo) { portal.hijo = phijo.dataset.portalHijo; renderPortal(); const f = scrollEl.querySelector('[data-portal-hijo="' + portal.hijo + '"]'); if (f) f.focus(); return; }
    if (ptri) { portal.tri = Number(ptri.dataset.portalTri); renderPortal(); const f = scrollEl.querySelector('[data-portal-tri="' + portal.tri + '"]'); if (f) f.focus(); return; }
    if (pagar) { openPay(pagar.dataset.pagar, pagar); return; }
    if (desc) toast('📄 Descarga simulada: en tu sitio real sería el PDF del boletín');
  });
  const familiaActualPorId = (id) => FAMILIAS.find((f) => f.id === id);


  /* ─────────── Panel: galería ─────────── */
  function buildPanelGal() {
    const titulo = el('input', { class: 'cp-input', type: 'text', id: 'cpFotoTitulo', maxlength: '60', placeholder: 'Ej: Torneo de ajedrez', 'aria-describedby': 'cpFotoErr' });
    const album = el('select', { class: 'cp-select', id: 'cpFotoAlbum' }, Object.keys(ALBUMS).map((k) => el('option', { value: k, text: ALBUMS[k] })));
    const escena = el('select', { class: 'cp-select', id: 'cpFotoEscena' }, ESCENAS.map((x) => el('option', { value: x[0], text: x[0] + ' ' + x[1] })));
    const err = el('p', { class: 'cp-err', id: 'cpFotoErr', role: 'alert', hidden: true, text: 'Poné un título para la foto.' });
    const agregar = el('button', { type: 'button', class: 'cp-btn', text: 'Agregar foto de ejemplo' });
    agregar.addEventListener('click', () => {
      const t = titulo.value.trim();
      titulo.removeAttribute('aria-invalid'); err.hidden = true;
      if (t.length < 3) { titulo.setAttribute('aria-invalid', 'true'); err.hidden = false; titulo.focus(); return; }
      const f = addFoto(album.value, escena.value, t, true);
      titulo.value = ''; filtroAlbum = 'todos';
      renderGaleria(); renderPanelGalList();
      flash('[data-foto="' + f.id + '"]');
      toast('📷 Nueva foto en la galería: ' + t);
      trackOnce('demo_colegio_panel');
      titulo.focus();
    });
    paneGal.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Agregar una foto' }),
        el('p', { text: 'En un sitio real subís la imagen desde tu compu; acá elegís una ilustración.' }),
        field('Descripción', titulo, 'cpFotoTitulo'), err,
        el('div', { class: 'cp-two' }, field('Álbum', album, 'cpFotoAlbum'), field('Ilustración', escena, 'cpFotoEscena')),
        agregar),
      el('h3', { class: 'cp-sub', text: 'Fotos publicadas' }),
      el('div', { class: 'cp-list', id: 'cpGalList' }));
    renderPanelGalList();
  }

  function renderPanelGalList() {
    const box = $('cpGalList');
    if (!box) return;
    box.replaceChildren(...galeria.map((f) => el('div', { class: 'cp-item' + (f.visible ? '' : ' is-off') },
      el('div', { class: 'cp-row-top' }, el('strong', null, el('span', { class: 'cp-thumb', 'aria-hidden': 'true', text: f.escena }), f.titulo)),
      el('small', { text: ALBUMS[f.album] + (f.visible ? '' : ' · oculta') }),
      el('div', { class: 'acts' },
        el('button', { type: 'button', class: 'cp-btn is-ghost is-small', 'data-foto-vis': f.id, text: f.visible ? 'Ocultar' : 'Mostrar' }),
        el('button', { type: 'button', class: 'cp-btn is-danger is-small', 'data-foto-del': f.id, text: 'Eliminar' })))));
  }

  paneGal.addEventListener('click', (e) => {
    const vis = e.target.closest('[data-foto-vis]');
    const del = e.target.closest('[data-foto-del]');
    const quitar = (f, msg) => {
      if (modalKind === 'galeria' && lightList[lightIdx] && lightList[lightIdx].id === f.id) { closeNews(false); toast('Esa foto ya no está disponible'); }
      else toast(msg);
    };
    if (vis) {
      const f = galeria.find((x) => x.id === vis.dataset.fotoVis);
      f.visible = !f.visible;
      renderGaleria(); renderPanelGalList();
      const again = paneGal.querySelector('[data-foto-vis="' + f.id + '"]'); if (again) again.focus();
      if (f.visible) { flash('[data-foto="' + f.id + '"]'); toast('📷 Foto visible en la galería'); } else quitar(f, '🙈 Foto oculta de la galería');
      trackOnce('demo_colegio_panel');
    } else if (del) {
      const f = galeria.find((x) => x.id === del.dataset.fotoDel);
      galeria.splice(galeria.indexOf(f), 1);
      renderGaleria(); renderPanelGalList();
      quitar(f, '🗑️ Foto eliminada de la galería');
      trackOnce('demo_colegio_panel');
    }
  });


  /* ─────────── Panel: equipo docente ─────────── */
  function buildPanelEq() {
    const nombre = el('input', { class: 'cp-input', type: 'text', id: 'cpMiNombre', maxlength: '50', placeholder: 'Ej: Prof. Ana Torres', 'aria-describedby': 'cpMiErr' });
    const rol = el('input', { class: 'cp-input', type: 'text', id: 'cpMiRol', maxlength: '60', placeholder: 'Ej: Maestra de 2° grado' });
    const nv = el('select', { class: 'cp-select', id: 'cpMiNivel' }, Object.keys(NIVEL_EV).map((k) => el('option', { value: k, text: NIVEL_EV[k] })));
    const err = el('p', { class: 'cp-err', id: 'cpMiErr', role: 'alert', hidden: true, text: 'Completá el nombre y el cargo.' });
    const agregar = el('button', { type: 'button', class: 'cp-btn', text: 'Sumar al equipo' });
    agregar.addEventListener('click', () => {
      nombre.removeAttribute('aria-invalid'); rol.removeAttribute('aria-invalid'); err.hidden = true;
      if (nombre.value.trim().length < 3) { nombre.setAttribute('aria-invalid', 'true'); err.hidden = false; nombre.focus(); return; }
      if (rol.value.trim().length < 3) { rol.setAttribute('aria-invalid', 'true'); err.hidden = false; rol.focus(); return; }
      const m = addMiembro('🧑‍🏫', nombre.value.trim(), rol.value.trim(), nv.value, true);
      nombre.value = ''; rol.value = ''; filtroEq = 'todos';
      renderEquipo(); renderPanelEqList();
      flash('[data-eq="' + m.id + '"]');
      toast('👋 Se sumó al equipo docente: ' + m.nombre);
      trackOnce('demo_colegio_panel');
      nombre.focus();
    });
    paneEq.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Sumar a una persona' }),
        el('p', { text: 'Aparece en la sección Equipo docente del sitio.' }),
        field('Nombre', nombre, 'cpMiNombre'), field('Cargo o materia', rol, 'cpMiRol'),
        field('Nivel', nv, 'cpMiNivel'), err, agregar),
      el('h3', { class: 'cp-sub', text: 'Equipo docente' }),
      el('div', { class: 'cp-list', id: 'cpEqList' }));
    renderPanelEqList();
  }

  function renderPanelEqList() {
    const box = $('cpEqList');
    if (!box) return;
    box.replaceChildren(...equipo.map((m) => el('div', { class: 'cp-item' + (m.visible ? '' : ' is-off') },
      el('strong', { text: m.nombre }),
      el('small', { text: m.rol + ' · ' + NIVEL_EV[m.nivel] + (m.visible ? '' : ' · oculto') }),
      el('div', { class: 'acts' },
        el('button', { type: 'button', class: 'cp-btn is-ghost is-small', 'data-mi-vis': m.id, text: m.visible ? 'Ocultar' : 'Mostrar' }),
        el('button', { type: 'button', class: 'cp-btn is-danger is-small', 'data-mi-del': m.id, text: 'Eliminar' })))));
  }

  paneEq.addEventListener('click', (e) => {
    const vis = e.target.closest('[data-mi-vis]');
    const del = e.target.closest('[data-mi-del]');
    if (vis) {
      const m = equipo.find((x) => x.id === vis.dataset.miVis);
      m.visible = !m.visible;
      renderEquipo(); renderPanelEqList();
      const again = paneEq.querySelector('[data-mi-vis="' + m.id + '"]'); if (again) again.focus();
      if (m.visible) flash('[data-eq="' + m.id + '"]');
      toast(m.visible ? '👀 ' + m.nombre + ' vuelve a verse en el sitio' : '🙈 ' + m.nombre + ' se oculta del sitio');
      trackOnce('demo_colegio_panel');
    } else if (del) {
      const m = equipo.find((x) => x.id === del.dataset.miDel);
      equipo.splice(equipo.indexOf(m), 1);
      renderEquipo(); renderPanelEqList();
      toast('🗑️ Se quitó del equipo: ' + m.nombre);
      trackOnce('demo_colegio_panel');
    }
  });


  /* ─────────── Panel: familias (boletines y cuotas) ─────────── */
  function buildPanelFam() {
    const head = el('div', { class: 'cp-bol-row cp-bol-head', 'aria-hidden': 'true' }, el('span', { style: 'text-align:left', text: 'Alumno' }), el('span', { text: '1°T' }), el('span', { text: '2°T' }), el('span', { text: '3°T' }));
    const filas = todosLosHijos().map((h) => el('div', { class: 'cp-bol-row' },
      el('span', null, h.nombre, el('small', { text: h.grado })),
      ...[1, 2, 3].map((t) => el('button', { type: 'button', class: 'pn-switch', role: 'switch', 'aria-checked': String(boletines[h.id][t]),
        'aria-label': 'Boletín del ' + t + '° trimestre de ' + h.nombre + ': ' + (boletines[h.id][t] ? 'publicado' : 'sin publicar'), 'data-bol': h.id + '|' + t }, el('span')))));
    paneFam.replaceChildren(
      el('section', { class: 'st-card' },
        el('h3', { text: 'Boletines' }),
        el('p', { text: 'Publicá el boletín de cada trimestre: la familia lo ve al instante en su portal.' }),
        el('div', { class: 'cp-bol' }, head, ...filas)),
      el('section', { class: 'st-card' },
        el('h3', { text: 'Valor de la cuota mensual' }),
        el('p', { text: 'Por hijo, según el nivel. Se aplica a las cuotas que todavía no se pagaron.' }),
        el('div', { class: 'cp-vac' }, NIVELES.map((n) => el('div', null,
          el('label', { for: 'cpCfg-' + n.id, text: n.emoji + ' ' + n.nombre.replace('Nivel ', '') }),
          el('input', { class: 'cp-input', type: 'number', id: 'cpCfg-' + n.id, min: '0', step: '1000', inputmode: 'numeric', value: String(cuotasCfg[n.id]), 'data-cfg': n.id }))))),
      el('h3', { class: 'cp-sub', text: 'Pagos recibidos' }),
      el('div', { class: 'cp-list', id: 'cpPagosList' }));
    renderPanelFam();
  }

  function renderPanelFam() {
    const box = $('cpPagosList');
    if (!box) return;
    const meses = mesesCuotas();
    const lista = pagos.slice().sort((a, b) => (b.estado === 'revision') - (a.estado === 'revision'));
    box.replaceChildren(...(lista.length ? lista.map((p) => {
      const f = FAMILIAS.find((x) => x.id === p.familia);
      const mes = meses.find((m) => m.key === p.mes);
      return el('div', { class: 'cp-item' + (p.estado === 'revision' ? ' is-new' : '') },
        el('div', { class: 'cp-row-top' }, el('strong', { text: f.nombre + ' · ' + (mes ? mes.label : p.mes) }),
          el('span', { class: 'pn-pill pn-pill-' + (p.estado === 'revision' ? 'warn' : 'listo'), text: p.estado === 'revision' ? 'En revisión' : 'Pagada' })),
        el('small', { text: money(p.monto) + ' · ' + METODOS[p.metodo] + ' · ' + p.hora }),
        p.estado === 'revision' ? el('div', { class: 'acts' }, el('button', { type: 'button', class: 'cp-btn is-small', 'data-pago-ok': p.id, text: 'Confirmar pago' })) : null);
    }) : [el('p', { class: 'cp-hint', text: 'Todavía no hay pagos.' })]));
  }

  paneFam.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-bol]');
    const ok = e.target.closest('[data-pago-ok]');
    if (sw) {
      const parts = sw.dataset.bol.split('|');
      const h = todosLosHijos().find((x) => x.id === parts[0]);
      const t = Number(parts[1]);
      boletines[h.id][t] = !boletines[h.id][t];
      sw.setAttribute('aria-checked', String(boletines[h.id][t]));
      sw.setAttribute('aria-label', 'Boletín del ' + t + '° trimestre de ' + h.nombre + ': ' + (boletines[h.id][t] ? 'publicado' : 'sin publicar'));
      renderPortal();
      if (boletines[h.id][t] && portal.familia === familiaDe(h.id).id && portal.hijo === h.id && portal.tri === t) flash('.es-bol');
      toast(boletines[h.id][t] ? '📄 Nuevo boletín disponible: ' + h.nombre + ' · ' + t + '° trimestre' : 'Boletín de ' + h.nombre + ' (' + t + '° trimestre) sin publicar');
      trackOnce('demo_colegio_panel');
    } else if (ok) {
      const p = pagos.find((x) => x.id === ok.dataset.pagoOk);
      p.estado = 'pagada';
      p.hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      renderPanelFam(); renderPortal(); renderKpis();
      flash('[data-cuota="' + p.mes + '"]');
      toast('✅ El colegio acreditó el pago de la cuota');
      trackOnce('demo_colegio_panel');
    }
  });

  paneFam.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-cfg]');
    if (!inp) return;
    const v = Number(inp.value);
    if (inp.value === '' || !isFinite(v) || v < 0) return;
    cuotasCfg[inp.dataset.cfg] = Math.round(v);
    renderPortal();
    panelToast('Cuota de ' + nivel(inp.dataset.cfg).nombre + ': ' + money(cuotasCfg[inp.dataset.cfg]));
    trackOnce('demo_colegio_panel');
  });


  /* ─────────── Panel: resumen, pestañas, vistas, reinicio ─────────── */
  function renderKpis() {
    const nuevas = solicitudes.filter((s) => s.estado === 'nueva').length;
    $('kpiSol').textContent = String(nuevas);
    $('kpiVac').textContent = String(totalVacantes());
    $('kpiCom').textContent = String(comunicados.length);
    const revision = pagos.filter((p) => p.estado === 'revision').length;
    const bs = [['pnBadge', nuevas], ['pnBadgeFam', revision], ['swBadge', nuevas + revision]];
    bs.forEach((x) => { const b = $(x[0]); b.textContent = String(x[1]); b.hidden = x[1] === 0; });
  }

  function setPanelTab(which) {
    [['com', 'tabCom', paneCom], ['cal', 'tabCal', paneCal], ['adm', 'tabAdm', paneAdm], ['gal', 'tabGal', paneGal], ['eq', 'tabEq', paneEq], ['fam', 'tabFam', paneFam]].forEach((x) => {
      $(x[1]).setAttribute('aria-selected', String(x[0] === which));
      x[2].hidden = x[0] !== which;
    });
  }
  [['tabCom', 'com'], ['tabCal', 'cal'], ['tabAdm', 'adm'], ['tabGal', 'gal'], ['tabEq', 'eq'], ['tabFam', 'fam']].forEach((x) => $(x[0]).addEventListener('click', () => setPanelTab(x[1])));

  function setView(which) {
    stage.dataset.view = which;
    $('swCliente').setAttribute('aria-selected', String(which === 'cliente'));
    $('swLocal').setAttribute('aria-selected', String(which === 'local'));
  }
  $('swCliente').addEventListener('click', () => setView('cliente'));
  $('swLocal').addEventListener('click', () => setView('local'));

  function goToAdmision() {
    setPanelTab('adm');
    if (isNarrow()) setView('local');
    $('tabAdm').focus({ preventScroll: !isNarrow() });
  }

  function renderAll() {
    renderHero();
    renderNiveles();
    renderNews();
    renderCal();
    renderVacantes();
    buildForm();
    renderStatus();
    renderEquipo();
    renderGaleria();
    renderPortal();
    renderKpis();
  }

  function resetDemo() {
    initState();
    closeNews(false);
    buildPanelCom();
    buildPanelCal();
    buildPanelAdm();
    buildPanelGal();
    buildPanelEq();
    buildPanelFam();
    renderAll();
    setPanelTab('com');
    setView('cliente');
    scrollEl.scrollTop = 0;
    toast('Demo reiniciada');
  }
  $('pnReset').addEventListener('click', resetDemo);


  /* ─────────── Inicio ─────────── */
  initState();
  buildPanelCom();
  buildPanelCal();
  buildPanelAdm();
  buildPanelGal();
  buildPanelEq();
  buildPanelFam();
  renderAll();
  if (isNarrow()) $('introSteps').removeAttribute('open');
})();
