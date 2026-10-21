# Changelog

Formato basado en Keep a Changelog. Versionado semántico.

## 1.0.0 · 2026-10-21

Primera versión pública.

### Incluye

- `dist/cursor-liquido.js`: el motor de fluido aprobado, sin cambios (sha256 `3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230`), el adaptador de radio y ciclo de vida, y la API `LiquidCursor`, concatenados en ese orden.
- `dist/cursor-liquido.css` y `dist/manifest.json` con el sha256 de cada archivo publicado.
- Cuatro intensidades: Nada, Poquito (puntitos), Mucho (fluido de 10 px CSS) y Hardcore (fluido de 18 px CSS).
- `followJuice` para seguir `<html data-jz-level>` con la tabla off/subtle/full/hard → nada/poquito/mucho/hardcore.
- La página aprobada archivada sin cambios en `examples/cursor-liquido.html`, y una demo que carga `dist/`.
- Pruebas: hash del motor, build determinista, manifest, sintaxis, privacidad y una suite de navegador real sobre `dist/`.

### Corregido

- **Mancha blanca en Mucho y Hardcore.** Un empaquetado previo reescribió el renderer y dejó dos samplers del paso de advección en la misma unidad de textura. En algunos equipos el fluido cubría la página con un campo gris o blanco en vez de la estela de color. Esta versión restaura el renderer aprobado byte por byte y agrega pruebas que exigen color localizado y rechazan un campo neutro de pantalla completa.
- **Poquito** vuelve a la estela de referencia: puntitos de 7 px, 480 ms, caída de 14 px, máximo 29.
- **Movimiento reducido** se respeta también cuando la preferencia cambia con la página abierta.

### Cambios respecto al prototipo 0.1.1

Solo metadatos: el número de versión en el comentario de cabecera, en `LiquidCursor.version` y en el CSS. El comportamiento es el de la versión aprobada.

## 0.1.1 · 2026-10-21

Prototipo offline de recuperación. No publicado como paquete. Es la página archivada en `examples/`.

## 0.1.0

Prototipo interno retirado por la regresión de mancha blanca. No se distribuye.
