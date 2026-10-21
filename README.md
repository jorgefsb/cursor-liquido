# Cursor líquido

Una estela para el puntero web: puntitos ligeros o un fluido WebGL2 que choca con los bloques de tu página. El cursor del sistema no cambia, la capa decorativa no intercepta clics y no hay dependencias en runtime.

Si te gustan los efectos de las páginas de Jorge, aquí tienes este cursor gratis para usarlo en la tuya. Elige la intensidad, adáptalo a tu proyecto y disfrútalo. Código abierto con licencia MIT.

![Cursor líquido en Hardcore, captura animada de una grabación real](docs/media/cursor-liquido-demo.gif)

Versión 1.0.0 · MIT · [video MP4 de la grabación](docs/media/cursor-liquido-restaurado-real.mp4)

## Cuatro intensidades

| Intensidad | `data-jz-level` (Juice) | Qué dibuja |
|---|---|---|
| `nada` | `off` | Nada. |
| `poquito` | `subtle` | Puntitos de 7 px que caen y se apagan en 480 ms. Alternan el color principal (naranja `#FF6B35` por defecto) con oscuro `#22211F` y crema `#F4E8D5`. Sin WebGL. |
| `mucho` | `full` | Fluido WebGL2 multicolor, radio de 10 px CSS. |
| `hardcore` | `hard` | Fluido WebGL2 multicolor, radio de 18 px CSS. |

El fluido usa colores saturados que cambian solos. La opción `color` solo cambia el color principal de Poquito. Detalle en [docs/api.md](docs/api.md).

| Poquito | Mucho | Hardcore | Choque con obstáculo |
|---|---|---|---|
| ![Poquito](docs/media/poquito-real.png) | ![Mucho](docs/media/mucho-real.png) | ![Hardcore](docs/media/hardcore-real.png) | ![Contacto](docs/media/contact-real.png) |

Capturas y video: demo aprobada (mismo motor y mismo wrapper que esta versión), Chromium headless con WebGL por software (SwiftShader), puntero real de Playwright, viewport de 1000×850. Sin retoque. No son prueba de cómo se ve en cada GPU o teléfono.

## Inicio rápido

Copia `dist/` a tu sitio como `/vendor/cursor-liquido/` y agrega:

```html
<link rel="stylesheet" href="/vendor/cursor-liquido/cursor-liquido.css">
<script src="/vendor/cursor-liquido/cursor-liquido.js"></script>
<script>
  LiquidCursor.mount({ intensity: 'poquito' })
</script>
```

Marca los bloques sólidos que el fluido debe rodear:

```html
<aside data-liquid-obstacle>…</aside>
```

Descarga la [versión 1.0.0](https://github.com/jorgefsb/cursor-liquido/releases/tag/v1.0.0) o clona este repositorio. Usa `dist/` y compara sus hashes con `dist/manifest.json`. No hay paquete publicado en npm: no uses `npm install cursor-liquido`.

### Sin menú visible

Elige la intensidad tú, al integrar: `mount({ intensity: 'mucho' })`, o `<html data-liquid-intensity="mucho">` y `mount()`. No se le pregunta nada al visitante y no se fuerza ningún selector. Sin intensidad explícita, `mount()` lanza un error en vez de adivinar.

### Con un control Juega / Juice

```js
LiquidCursor.mount({ followJuice: true })
```

Lee `<html data-jz-level>` (solo lectura) y traduce `off/subtle/full/hard` a `nada/poquito/mucho/hardcore`. Nunca pases esos valores directo a un `FluidCursor` antiguo. Ver [docs/integrations.md](docs/integrations.md).

## Demo local

Abre `demo/index.html` en el navegador (funciona sin servidor y sin red). Carga el `dist/` empaquetado. La página aprobada original está archivada sin cambios en `examples/cursor-liquido.html`. Una demo pública en GitHub Pages es posible más adelante, hoy no hay URL publicada.

## Accesibilidad y rendimiento

Con `prefers-reduced-motion: reduce` no hay efecto, al cargar y si la preferencia cambia después. El fluido se detiene en reposo, al hacer scroll y con la pestaña oculta, baja de calidad o se pausa si los frames llegan lentos, y no emite sobre enlaces, botones ni campos. Sin WebGL2, Mucho y Hardcore quedan apagados y Poquito sigue. El tacto está apagado salvo `touch: true`. Ver [docs/accessibility-performance.md](docs/accessibility-performance.md).

Probado en Chromium headless con WebGL por software. No se promete el mismo resultado en todo hardware ni se probó en teléfonos físicos. Las capturas de regresión pausan la animación después de recibir entrada real para que el codificado de PNG no borre la estela por inactividad; no son mediciones de FPS.

## Pruebas

```sh
npm ci
npm test               # hash del motor, build determinista, manifest, sintaxis, privacidad
npm run test:browser   # navegador real sobre dist/ (file:// y HTTP), 40 casos
```

Para reutilizar un Playwright ya instalado: `PLAYWRIGHT_MODULE=/ruta/a/node_modules/playwright npm run test:browser`. El último resultado está en [reports/browser-test-report.json](reports/browser-test-report.json).

## English usage

Cursor líquido draws a pointer trail behind the native cursor: light dots (`poquito`) or a WebGL2 fluid (`mucho`, 10 CSS px, `hardcore`, 18 CSS px) that flows around elements marked `data-liquid-obstacle`. No runtime dependencies. Layers never take input.

```html
<link rel="stylesheet" href="/vendor/cursor-liquido/cursor-liquido.css">
<script src="/vendor/cursor-liquido/cursor-liquido.js"></script>
<script>
  LiquidCursor.mount({ intensity: 'poquito' }) // 'nada' | 'poquito' | 'mucho' | 'hardcore'
  // or follow a Juice control: LiquidCursor.mount({ followJuice: true })
</script>
```

Options: `touch` (default `false`), `color` (Poquito's main dot colour, default `#FF6B35`), `obstacleSelector` (default `[data-liquid-obstacle]`), `container` (default `document.body`). Reduced motion disables the effect. Not published to npm yet. Copy `dist/` and verify it against `dist/manifest.json`. Full API: [docs/api.md](docs/api.md).

## Más

- [docs/api.md](docs/api.md): API, opciones reales y `stats`.
- [docs/integrations.md](docs/integrations.md): Juice, Game Feel, Papacito Juice, un solo dueño del cursor.
- [docs/rollback.md](docs/rollback.md): cómo apagar o volver a la versión anterior.
- [docs/roadmap.md](docs/roadmap.md): ideas futuras, incluida la propuesta Legendario (no implementada).
- [skills/cursor-liquido/SKILL.md](skills/cursor-liquido/SKILL.md): instrucciones para agentes (Claude, Codex, ChatGPT).
- [CHANGELOG.md](CHANGELOG.md) · [CONTRIBUTING.md](CONTRIBUTING.md)

## Licencia

Código MIT, (c) 2026 Jorge Suárez ([LICENSE](LICENSE)). El sombreado del fluido está adaptado de WebGL Fluid Simulation de Pavel Dobryakov (MIT), ver [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES). Este repositorio no incluye ni licencia a Moki ni otros recursos de marca.

Fuente: [jorgefsb/cursor-liquido](https://github.com/jorgefsb/cursor-liquido).
