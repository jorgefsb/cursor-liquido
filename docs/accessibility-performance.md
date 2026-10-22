# Accesibilidad y rendimiento

Español · [English](accessibility-performance.en.md)

Lo que hace el código de la versión 1.0.1, y lo que no se promete.

## Accesibilidad

- **Puntero nativo intacto.** El paquete no toca `cursor` ni oculta el puntero del sistema.
- **Sin captura de entrada.** Las capas tienen `pointer-events: none` y `aria-hidden="true"`. Clics, selección, foco, teclado y scroll llegan a la página igual que sin el efecto (lo cubren las pruebas de navegador: teclado, tecleo con acentos, clics y enlaces).
- **Sin cambiar texto.** El efecto no inserta texto. Los puntitos de Poquito son elementos `<i>` vacíos dentro de un contenedor `aria-hidden`.
- **Movimiento reducido.** Con `prefers-reduced-motion: reduce`:
  - al cargar, Poquito no genera puntitos y el motor de fluido no se crea,
  - si la preferencia cambia a reducido, se destruye el motor y se borran los puntitos,
  - si cambia de vuelta, el motor se vuelve a crear en el siguiente movimiento,
  - el CSS además oculta las capas.
- **Sobre controles.** El fluido no emite sobre enlaces, botones, campos, `[contenteditable]`, `iframe` ni `.jz-panel`, para no tapar lo que el usuario lee o escribe.
- **Tacto.** Apagado por defecto (`touch: false`). El dedo hace scroll normal. Actívalo solo si lo pide el dueño de la página.
- **Contraste.** El fluido usa `mix-blend-mode: screen`: suma luz sobre fondos oscuros. No lo pongas sobre texto que dependa de un contraste justo.

## Rendimiento

- **Sin trabajo en reposo.** Poquito solo anima mientras hay puntitos vivos (máximo 29, uno cada 38 ms como mucho, 480 ms de vida). El fluido detiene su `requestAnimationFrame` 4.5 s después del último movimiento.
- **Pausas.** El fluido se detiene y limpia al hacer scroll, con la pestaña oculta y al perder el contexto WebGL.
- **Tope de frames.** 60 fps como máximo, 30 en modo `economy` o `reduced`.
- **Presupuesto.** Si llegan 12 frames seguidos de más de 45 ms, la calidad pasa a `reduced` (simulación más chica, menos iteraciones). Si luego llegan 24 de más de 65 ms, el fluido se pausa (`budget-paused`) y libera la GPU.
- **Equipos modestos.** Puntero grueso, `Save-Data` o 4 núcleos o menos arrancan en calidad `economy`.
- **Sin WebGL2.** Si falta WebGL2 o `EXT_color_buffer_float`, `fluid.state` es `unsupported`, Mucho y Hardcore no dibujan nada y la página y Poquito siguen funcionando.
- **Peso.** `dist/cursor-liquido.js` pesa unos 42 KB sin minificar ni comprimir. Cero dependencias en runtime.

## Lo que no se promete

- Las pruebas corren en Chromium headless con WebGL por software (ANGLE SwiftShader). No certifican ninguna GPU, navegador o sistema físico.
- No se probó en teléfonos ni tabletas físicos. La emulación móvil de Playwright solo revisa que no haya desbordamiento horizontal.
- El fluido puede verse distinto según GPU, controlador y navegador. Si una plataforma falla, el plan de salida está en [rollback.md](rollback.md).
