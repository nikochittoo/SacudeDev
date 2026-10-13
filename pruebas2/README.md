# Sacude Devs

Landing page de Sacude Devs, hecha con HTML, CSS y JavaScript puro (sin frameworks ni dependencias).

## Estructura

```
/
├── index.html           Página principal
├── 404.html             Página de error (la sirve el hosting en cualquier URL inexistente)
├── privacidad.html      Política de privacidad
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
│   │   ├── legal.css    Estilos de las páginas legales
│   │   └── asistente.css Estilos del asistente flotante (solo index)
│   ├── js/
│   │   ├── app.js       Navbar, menú mobile, FAQ, scroll reveal, parallax (todas las páginas)
│   │   ├── servicios.js Cards de servicios que se expanden (solo index)
│   │   ├── efectos.js   Efectos: cada uno se saltea solo si el elemento no existe en la página
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
