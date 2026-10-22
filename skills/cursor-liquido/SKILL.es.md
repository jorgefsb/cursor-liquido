---
name: cursor-liquido-es
description: "Instrucciones en español para integrar, probar o quitar Cursor líquido."
version: 1.0.1
license: MIT
author: Jorge Suárez
---

# Cursor líquido

Español · [English](SKILL.md)

Instrucciones portables para agentes con shell, navegador y este repositorio. Fuente: `https://github.com/jorgefsb/cursor-liquido`; la disponibilidad remota no se verificó aquí, prefiere la copia local.

## Qué hace

Una estela detrás del puntero nativo. `nada` (`off`): nada. `poquito` (`subtle`): puntitos DOM de 7 px, color principal por defecto `#FF6B35` alternado con `#22211F` y `#F4E8D5`, sin WebGL. `mucho` (`full`): fluido multicolor de 10 px CSS. `hardcore` (`hard`): 18 px CSS. No hay quinto nivel; Legendario es propuesta en [roadmap](../../docs/roadmap.md). No lo implementes ni anuncies.

## Antes de cambiar una página

1. Lee estilos y scripts existentes. Identifica cualquier estela anterior y apágala con su interruptor documentado. Sin interruptor, pregunta; nunca parches vendor para esconder duplicados.
2. Lee [API](../../docs/api.md). Solo existen `intensity`, `followJuice`, `touch`, `color`, `obstacleSelector` y `container`.
3. Acuerda la intensidad con el dueño. Sin control Juega visible, usa `intensity` o `<html data-liquid-intensity>`. Nunca un `prompt()` ni elección forzada al visitante.

## Integrar

```html
<link rel="stylesheet" href="/vendor/cursor-liquido/cursor-liquido.css">
<script src="/vendor/cursor-liquido/cursor-liquido.js"></script>
<script>
  LiquidCursor.mount({ intensity: 'poquito' })
</script>
```

Copia `dist/` al sitio y verifica contra `dist/manifest.json`. No hay paquete npm: no recomiendes `npm install cursor-liquido`. Marca sólidos con `data-liquid-obstacle`; `data-fluid-obstacle` solo cuenta si lo incluyes en `obstacleSelector`.

Con Juice usa `LiquidCursor.mount({ followJuice: true })`. Nunca pases `data-jz-level` directo a `FluidCursor`: su tabla `subtle/full` equivale a 10/18 px y trata `hard` como `subtle`. No uses `id="fluid-canvas"`, donde el motor se monta automáticamente y duplica dueños. `color` solo modifica Poquito, no el fluido.

## Nunca

No cambies el motor aprobado ni sus shaders. Su hash debe seguir `3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230`. En documentación también conserva el adaptador y todo runtime byte-idénticos. No reescribas el renderer para pasar pruebas: reporta fallos con evidencia. No escondas el puntero, captures clics ni bloquees scroll. No prometas render idéntico en GPU, navegador o teléfono. No añadas Moki ni ninguna mascota: no es dependencia.

## Verificar

Ejecuta `npm test`, `npm run test:browser` y `npm run test:quality`. En el sitio comprueba cada nivel expuesto; movimiento reducido inicial y dinámico; foco de teclado, campos, clics y enlaces; scroll táctil (efecto apagado salvo `touch: true`); captura o video real con color localizado y sin mancha blanca/gris. Destruir y remontar deja exactamente dos `.liquid-cursor-layer`. La emulación no prueba dispositivos físicos: informa solo lo ejecutado.

## Entregar

Si piden descargar y probar, entrega primero HTML sin red. Integrar en producción o publicar requiere aprobación separada. Registra versión, SHA-256 del bundle y [rollback](../../docs/rollback.md).

## Skills hermanas

Game Feel (`https://github.com/jorgefsb/game-feel`) es genérica y no requiere mascota. Papacito Juice (`https://github.com/jorgefsb/papacito-juice`) es el perfil personal e incluye Moki autorizado. Sus recursos no forman parte de este repositorio ni de MIT. No se verificó aquí su publicación. Cursor líquido funciona sin ambos.
