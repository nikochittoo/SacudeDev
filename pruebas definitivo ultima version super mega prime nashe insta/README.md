# Sacude Devs

Landing page de Sacude Devs, hecha con HTML, CSS y JavaScript puro (sin frameworks ni dependencias).

## Estructura

```
/
├── index.html           Página principal
├── 404.html             Página de error (la sirve el hosting en cualquier URL inexistente)
├── privacidad.html      Política de privacidad
├── demos/               Demos conceptuales interactivas (negocios ficticios)
│   ├── menu-qr.html     Menú Web (QR): menú del cliente + panel del local
│   ├── tienda.html      E-commerce: tienda con carrito y checkout + panel de la tienda
│   └── pyme.html        Web para PyMEs: sitio con reserva de turnos + agenda del negocio
├── equipo/              Perfiles individuales del equipo
│   ├── Niko.html
│   ├── Gabi.html
│   └── Valen.html
├── assets/
│   ├── css/
│   │   ├── style.css    Estilos de la página principal
│   │   ├── equipo.css   Estilos de las páginas de equipo
│   │   ├── efectos.css  Animaciones y efectos (progreso de scroll, link activo, spotlight, tilt, tipeo)
│   │   ├── cotizador.css Estilos del cotizador (solo index)
│   │   ├── 404.css      Estilos de la página 404
│   │   ├── demo-base.css Marco común de las demos (barra, intro, panel del negocio)
│   │   ├── demo-menu.css Estilos de la demo del menú QR
│   │   ├── demo-tienda.css Estilos de la demo de la tienda
│   │   ├── demo-pyme.css Estilos de la demo de PyMEs
│   │   ├── legal.css    Estilos de las páginas legales
│   │   └── asistente.css Estilos del asistente flotante (solo index)
│   ├── js/
│   │   ├── app.js       Navbar, menú mobile, FAQ, scroll reveal, parallax (todas las páginas)
│   │   ├── servicios.js Cards de servicios que se expanden (solo index)
│   │   ├── efectos.js   Efectos: cada uno se saltea solo si el elemento no existe en la página
│   │   ├── demo-menu.js Lógica de la demo del menú QR
│   │   ├── demo-tienda.js Lógica de la demo de la tienda
│   │   ├── demo-pyme.js Lógica de la demo de PyMEs
│   │   ├── cotizador.js Cotizador: armador de consulta sin precios (solo index)
│   │   └── asistente.js Asistente guiado: chat flotante con respuestas armadas (solo index)
│   └── img/             Imágenes (usar .webp para las de contenido)
│       └── logo/        Logos de Sacude Devs
├── pruebas/             Copia de trabajo para probar cambios (index-pruebas.html)
└── legacy/              Versión anterior de la academia (sin usar actualmente)
```

## Cómo verla localmente

No requiere instalación ni build. Alguna de estas dos opciones:

- Abrir `index.html` directamente en el navegador.
- Usar la extensión **Live Server** de VS Code (clic derecho sobre `index.html` → "Open with Live Server").

## Efectos (efectos.js / efectos.css)

- Barra de progreso de scroll (todas las páginas).
- Link activo en la navbar según la sección visible.
- Count-up de las stats del hero: se configura con `data-count`, `data-prefix` y `data-suffix` en `.stat-num`.
- Tipeo en los snippets de código del hero (`.code-float`).
- Spotlight en cards de servicios y del equipo, y tilt 3D solo en las del equipo.
- Todo respeta `prefers-reduced-motion`; spotlight y tilt solo funcionan con mouse.

## Cotizador (cotizador.js)

Armador de consulta en 4 pasos + resumen. No muestra precios: el cliente elige servicio, extras, plazo, presupuesto (solo una intención, sin números) y deja su nombre e idea. Al final se genera un mensaje listo para WhatsApp o mail.

- Todo lo editable (servicios, extras, plazos, presupuestos, número de WhatsApp y mail) está en el objeto `CONFIG` al principio de `cotizador.js`.
- Los botones "Consultar →" de cada card de servicio llevan al cotizador con ese servicio preseleccionado (atributo `data-servicio`).
- Si hay Google Analytics, registra los eventos `cotizador_preseleccion`, `cotizador_resumen` y `cotizador_enviar` (con canal y servicio, nunca datos personales).

## Asistente guiado (asistente.js)

Chat flotante abajo a la derecha. No usa servidor ni IA: responde con botones de respuesta rápida y, si la persona escribe, reconoce palabras clave. Si no entiende, la deriva a WhatsApp.

- **No duplica contenido:** lee servicios, tiempos, WhatsApp y mail de `CONFIG` en `cotizador.js` (expuesto como `window.SacudeConfig`), y las respuestas de proceso, qué preparar y soporte directo de la FAQ del HTML. Por eso `cotizador.js` tiene que cargarse antes que `asistente.js`.
- Para agregar un tema nuevo: sumar un `intent(id, [palabras clave], () => respuesta)` en `asistente.js`. Las palabras clave van sin tildes y con `*` si es prefijo (`cotiz*`).
- Descripciones cortas por servicio: objeto `DESC` al principio de `asistente.js`.
- Eventos de Analytics: `asistente_abrir`, `asistente_tema` (qué tema consultan), `asistente_sin_respuesta` (sin guardar el texto escrito) y `asistente_contacto`. Sirve para ver qué preguntan más y qué falta responder.

## Demos conceptuales (demos/)

Mockups interactivos para mostrar cómo funciona cada servicio **sin proyectos de clientes reales**. Regla del sitio: siempre se presentan como **demo conceptual** con un negocio ficticio (nada de logos ni testimonios inventados).

- **menu-qr.html** (Café Aurora): a la izquierda el menú que ve el cliente (categorías, filtros, pedido, estado del pedido) y a la derecha el panel del local (cambiar precios, marcar agotado, recibir y avanzar pedidos). Ambos comparten el mismo estado en el navegador: no hay servidor ni se guarda nada. En celular se alterna entre las dos vistas.
- Los datos del menú están en `MENU_INICIAL` al principio de `assets/js/demo-menu.js`.
- **tienda.html** (Brote, tienda de plantas ficticia, en un marco de navegador): catálogo con búsqueda, categorías y orden; ficha con variantes (cada una suma un extra al precio base); carrito con cupón y barra de envío gratis; checkout con entrega y forma de pago (efectivo solo con retiro); y el panel de la tienda con ventas, stock, precios, visibilidad, pedidos y ajustes de cupón y envíos. El stock baja con cada compra y todo se refleja al instante en ambos lados. Datos en `PRODUCTOS_INICIAL` y `AJUSTES_INICIAL` de `assets/js/demo-tienda.js`. No procesa pagos ni guarda nada.
- **pyme.html** (Salón Marfil, peluquería ficticia): sitio con servicios, equipo y horarios, y un asistente de reserva en 4 pasos (servicio → profesional → día y hora → datos). La disponibilidad se calcula en vivo: respeta la duración del servicio, los turnos existentes, los bloqueos, las vacaciones del equipo y el horario de atención. Del otro lado, la agenda del negocio (grilla por profesional, confirmar, cancelar, marcar atendido, bloquear horarios) con pestañas de Servicios (precio, duración, visibilidad) y Equipo y horarios. Si el negocio bloquea un horario mientras el cliente reserva, el cliente vuelve al paso de horarios con un aviso. Los turnos de ejemplo se reparten sobre los próximos días abiertos (`seedTurnos` en `assets/js/demo-pyme.js`), y el sitio se adapta al ancho de su marco con consultas de contenedor (`@container`).
- Las demos comparten `demo-base.css`: cambios en la barra superior, la introducción o el panel del negocio se hacen ahí una sola vez.
- El botón "Quiero un menú así" vuelve al cotizador con el servicio ya elegido (`index.html?servicio=menu#cotizador`). Esa preselección por URL funciona con cualquier id de servicio del cotizador.
- Para sumar otra demo (mini tienda, landing): crear `demos/<nombre>.html`, enlazarla desde el bloque de ejemplos de su card en `index.html` y, si querés, mencionarla en el asistente.
- Las vistas previas de la card (`assets/img/demo-menu-*.webp`) son capturas de la demo: regenerarlas si cambia el diseño.

## Páginas 404 y privacidad

- **404.html** usa rutas absolutas (`/assets/...`, `/`) porque el hosting la muestra en cualquier URL, a cualquier profundidad. Funciona con dominio propio o sitio de usuario; si se publica en una subcarpeta (ej: `usuario.github.io/repo/`) hay que anteponer esa carpeta. GitHub Pages, Netlify y Cloudflare Pages la toman solos si el archivo se llama `404.html` en la raíz. Registra el evento `pagina_no_encontrada` en Analytics para detectar links rotos.
- **privacidad.html** describe lo que el sitio hace hoy: Google Analytics, Google Fonts, cotizador y asistente sin servidor. **Hay que actualizarla si se agrega algo** (formulario con backend, pixel de Meta, chat con IA, etc.). Tiene un comentario al inicio con los puntos a revisar antes de publicar; borrarlo después. No es asesoramiento legal.

## Convenciones

- Imágenes: nombres en minúscula, sin espacios (`nasa-desktop.webp`), formato WebP y del tamaño real con el que se muestran.
- Rutas: desde `index.html` se escribe `assets/...`; desde `equipo/` se escribe `../assets/...`.
- Los eventos de Google Analytics (gtag) van dentro del `<head>`.

## Pendiente

- Agregar `og:url`, `og:image` y `canonical` cuando esté el dominio final.
- Completar el link "Visitar sitio" del ejemplo NASA en `index.html` (está comentado con un TODO).

## Equipo

- **Nicolás Brito Pedrocca** — CEO
- **Valentín Saldaño** — COO
- **Gabriel Dagna** — CTO
