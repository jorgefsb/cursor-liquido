# API · Cursor líquido 1.0.0

Todo lo de esta página sale del código en `src/`. Si algo no aparece aquí, el paquete no lo hace.

## Carga

`dist/cursor-liquido.js` es un script clásico (no módulo ES) que concatena, sin cambios y en este orden:

1. `src/approved-fluid-v3.1.js`: el motor de fluido aprobado (`window.FluidCursor`). Su sha256 es `3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230` y no se modifica.
2. `src/approved-engine-adapter.js`: adaptador de radio y ciclo de vida (`window.FluidEngine`).
3. `src/liquid-cursor.js`: la API pública (`window.LiquidCursor`).

`dist/cursor-liquido.css` define las capas. Sin el CSS el efecto sigue funcionando (las capas llevan estilos inline de seguridad), pero pierdes `--liquid-cursor-z`, el modo `screen` del fluido y el apagado por CSS con movimiento reducido.

## `LiquidCursor.mount(options)`

Crea la instancia y la devuelve. Solo hay una instancia viva por página: llamar `mount` otra vez destruye la anterior primero, así que capas y listeners nunca se duplican.

### De dónde sale la intensidad

En este orden:

1. `followJuice: true`: lee `<html data-jz-level>`. Si el atributo falta o tiene un valor desconocido, usa `intensity` como respaldo, y si tampoco hay, `nada`. En ese caso `stats.sourcePending` es `true`.
2. `intensity`: valor fijo.
3. `<html data-liquid-intensity="…">`: se lee al montar y se sigue observando.
4. Ninguno de los tres: `mount` lanza `Error('LiquidCursor.mount: pass intensity …')`.

El módulo nunca escribe esos atributos, solo los lee.

### Opciones

| Opción | Default | Efecto real |
|---|---|---|
| `intensity` | ninguno | `'nada'`, `'poquito'`, `'mucho'` o `'hardcore'`. También acepta `'off'`, `'subtle'`, `'full'`, `'hard'`. Sin distinguir mayúsculas, recorta espacios. Un valor desconocido lanza error. |
| `followJuice` | `false` | Sigue `<html data-jz-level>`, ver arriba. |
| `touch` | `false` | Si es `false`, los eventos de puntero `touch` no generan puntitos ni fluido. Mouse y lápiz siempre cuentan. |
| `color` | `--liquid-cursor-color` de `<html>`, si no `#FF6B35` | Color principal de los puntitos de Poquito. No cambia el fluido. |
| `obstacleSelector` | `'[data-liquid-obstacle]'` | Selector CSS de los bloques que el fluido rodea y contra los que choca. |
| `container` | `document.body` | Elemento donde se agregan las capas. Las capas son `position: fixed` y cubren el viewport. |

No hay otras opciones. Los parámetros internos del motor (fuerza, curl, paleta, opacidad) no se exponen por `mount`.

### Paleta de Poquito

Cada puntito toma un color de `[color, '#22211F', '#F4E8D5']` según el momento en que nace (ciclo de 38 ms). Con el default eso es naranja, casi negro y crema. No es todo naranja.

### Color del fluido

El motor elige un tono saturado al azar cada 100 ms (modo `arcade`). `color` no lo afecta. Por eso el fluido se ve multicolor.

### Obstáculos

- Por defecto solo cuenta `data-liquid-obstacle`.
- El motor tiene su propio default que incluye `[data-fluid-obstacle]`, pero `mount` lo reemplaza. Si tu página ya usa `data-fluid-obstacle`, pasa ambos: `obstacleSelector: '[data-liquid-obstacle], [data-fluid-obstacle]'`.
- Máximo 12 obstáculos visibles en pantalla. Se ignoran los que tienen tamaño cero, `display: none` o `visibility: hidden`. Se respetan las esquinas redondeadas (`border-radius`).
- Los obstáculos se vuelven a medir en cada frame mientras el fluido está activo. En reposo no se mide nada.

### Dónde no emite

El fluido no emite cuando el puntero está sobre `a, button, input, select, textarea, [contenteditable], iframe, .jz-panel`. Los puntitos de Poquito sí aparecen en cualquier parte. En ambos casos las capas tienen `pointer-events: none` y no tapan clics, selección de texto ni scroll.

## La instancia

| Miembro | Qué hace |
|---|---|
| `setIntensity(value)` | Cambia la intensidad. Mismos valores que `intensity`. Lanza error con un valor desconocido. Devuelve la instancia. |
| `stop()` | Borra los puntitos vivos y limpia el fluido. No cambia la intensidad. |
| `destroy()` | Quita capas y listeners y libera WebGL. Idempotente. |
| `stats` | Foto del estado, ver abajo. |
| `intensity` | Nombre actual. |
| `engine` | Instancia del motor, o `null` si no se creó (Poquito, Nada, movimiento reducido). |

### `stats`

```js
{
  intensity: 'mucho', layer: 'fluid', radius: 10,
  source: 'option' | 'data-jz-level' | 'data-liquid-intensity',
  sourcePending: false, color: '#FF6B35', touch: false,
  dots: { state, alive, spawned, frames, max },
  fluid: { state, frames, splats, impacts, wallCount, error, quality, play, radius, … }
}
```

`fluid.state` puede ser `not-created`, `engine-missing`, `waiting`, `ready`, `running`, `idle`, `disabled`, `disabled-play`, `unsupported` (sin WebGL2 o sin `EXT_color_buffer_float`), `failed`, `context-lost`, `budget-paused` o `destroyed`. `fluid.quality` es `normal`, `economy` o `reduced`.

## `LiquidCursor`

| Miembro | Qué es |
|---|---|
| `version` | `'1.0.0'` |
| `intensities` | Tabla congelada `{ nada, poquito, mucho, hardcore }` con `layer` y `radius`. |
| `juiceLevels` | `{ off: 'nada', subtle: 'poquito', full: 'mucho', hard: 'hardcore' }` |
| `normalize(value)` | Nombre canónico o `null`. |
| `current` | Instancia viva o `null`. |
| `mount(options)` | Ver arriba. |
| `DotTrail` | Clase interna de Poquito, expuesta para pruebas. |

## Globales extra del bundle

- `window.FluidCursor`: el motor sin adaptar. Úsalo solo a través de `LiquidCursor`. Sus nombres internos `subtle/full` equivalen a 10/18 px, y un valor `hard` lo trata como `subtle`.
- `window.FluidEngine`: el adaptador.
- El motor se monta solo sobre un elemento con `id="fluid-canvas"` si existe. No uses ese id junto con Cursor líquido, tendrías dos dueños del cursor.
- `?fluid=off` en la URL desactiva el motor de fluido (útil para soporte).

## CSS

| Variable o regla | Uso |
|---|---|
| `--liquid-cursor-z` | `z-index` de las capas, default `30`. La capa de puntitos usa `z-index: 30` inline. |
| `--liquid-cursor-color` | Color principal de Poquito si no pasas `color`. Se lee al montar. |
| `[data-liquid-layer="fluid"]` | `mix-blend-mode: screen`. El fluido suma luz: se ve en fondos oscuros y casi nada sobre fondos claros. |
| `prefers-reduced-motion: reduce` | Oculta las capas. |
