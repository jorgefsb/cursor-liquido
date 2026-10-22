# Integraciones

Español · [English](integrations.en.md)

## Regla base: un solo dueño del cursor

Una página tiene una sola estela. Antes de montar Cursor líquido, identifica si la página ya trae otra (un trail de Juice, un `FluidCursor` montado en `#fluid-canvas`, una librería de terceros) y apágala por el interruptor que esa pieza documente. Si no tiene uno, no la parches para esconderla: resuelve primero quién es el dueño. Dentro del paquete, `LiquidCursor.mount` ya garantiza una sola instancia viva.

## Página sola (sin menú)

```html
<link rel="stylesheet" href="/vendor/cursor-liquido/cursor-liquido.css">
<script src="/vendor/cursor-liquido/cursor-liquido.js"></script>
<script>
  LiquidCursor.mount({ intensity: 'mucho' })
</script>
```

O deja la decisión en el HTML y monta sin opciones:

```html
<html data-liquid-intensity="poquito">
…
<script>LiquidCursor.mount()</script>
```

La intensidad la decide el dueño de la página al integrar. No se le muestra un `prompt()` al visitante ni se le obliga a elegir.

## Con Juice (`data-jz-level`)

Juice es el control Juega con cuatro niveles. Escribe `data-jz-level` en `<html>`. Cursor líquido solo lo lee:

| Juega | `data-jz-level` | Cursor líquido | Radio |
|---|---|---|---|
| Nada | `off` | `nada` | 0 |
| Poquito | `subtle` | `poquito` | puntitos |
| Mucho | `full` | `mucho` | 10 px CSS |
| Hardcore | `hard` | `hardcore` | 18 px CSS |

```js
LiquidCursor.mount({ followJuice: true })
```

### No uses el motor antiguo directo

El motor (`FluidCursor`) también lee `data-jz-level` por su cuenta, con otra tabla: `subtle` = 10 px, `full` = 18 px, y un valor desconocido como `hard` lo trata como `subtle`. Con esa tabla Poquito saldría como fluido y Hardcore como 10 px. El adaptador del paquete desconecta esa lectura y aplica la tabla de arriba. Por eso: nunca pases `data-jz-level` a `FluidCursor`, y nunca uses `id="fluid-canvas"` en la misma página.

### Conductor separado, sin tocar archivos publicados

Si la página ya publica Juice (y en el perfil personal, Moki), no edites esos archivos. Agrega un script propio de la página, cargado después de Juice, que haga solo esto:

1. apagar la estela anterior por su interruptor documentado, si existe,
2. llamar `LiquidCursor.mount({ followJuice: true })`.

El cursor no controla a Moki, sonidos, logros ni el desbloqueo de Hardcore. Esos siguen siendo de Juice. Para revertir basta con quitar el conductor y las dos etiquetas del paquete.

## Game Feel y Papacito Juice

Son dos skills hermanas, pensadas para vivir en repositorios propios:

- Game Feel (previsto en `https://github.com/jorgefsb/game-feel`): flujo genérico para dar respuesta a una interfaz. No requiere Moki ni ninguna mascota.
- Papacito Juice (previsto en `https://github.com/jorgefsb/papacito-juice`): perfil de la marca personal. Siempre incluye a Moki, autorizado y desde su biblioteca de marca.

Esos repositorios todavía no están confirmados como publicados. Cursor líquido funciona sin ninguno de los dos y no requiere Moki. Los recursos de Moki no están en este repositorio y la licencia MIT de este código no los cubre.

## Otras marcas

Usa su color principal con `color` o `--liquid-cursor-color` (afecta a Poquito). El fluido es multicolor por diseño en esta versión y no se ajusta a paletas de marca.

## Frameworks

El bundle es un script clásico que define `window.LiquidCursor`. En apps de una sola página, monta en el cliente después de cargar el script y llama `LiquidCursor.current.destroy()` al desmontar la vista si el efecto no debe seguir en la siguiente. No hay build de módulo ES en esta versión.
