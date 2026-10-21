# Roadmap

Nada de esta página está implementado en 1.0.0. Son ideas, sin fecha.

## Propuesta: nivel Legendario

Un quinto nivel por encima de Hardcore. Solo propuesta: no existe en el código, `mount({ intensity: 'legendario' })` lanza error y la versión estable sigue con cuatro niveles (Nada, Poquito, Mucho, Hardcore).

Antes de implementarlo haría falta:

- aprobación explícita del comportamiento visual,
- decidir si cabe en el motor actual sin tocarlo (por ejemplo, otro radio a través del adaptador) o si requiere un motor nuevo con su propio hash dorado y su propia aprobación,
- pruebas físicas de salida (color localizado, sin mancha blanca, campo finito) igual que los niveles actuales,
- publicarlo como versión menor nueva, sin cambiar los cuatro niveles existentes.

## Otros pendientes

- Demo pública en GitHub Pages a partir de `demo/index.html`.
- Descargas versionadas en GitHub Releases.
- Paquete en npm, cuando exista el registro.
- Build de módulo ES además del script clásico.
- Pruebas en GPUs, navegadores y teléfonos físicos. Hoy solo hay Chromium headless con WebGL por software.
- Paleta de fluido configurable para otras marcas, sin cambiar el motor aprobado del modo por defecto.
