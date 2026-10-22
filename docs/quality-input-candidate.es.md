# 1.0.1: conservar entrada al reducir calidad

Español · [English](quality-input-candidate.md)

El motor y el adaptador aprobados permanecen byte-idénticos. Una subclase externa, cargada después del adaptador y antes del wrapper, conserva únicamente un gesto real de puntero en cola durante el primer cambio de tamaño por calidad adaptativa, si el viewport CSS no ha cambiado y el presupuesto aún permite correr.

No conserva campos de simulación, agrega entrada, fuerza calidad, cambia shaders ni evita el paro por rendimiento. Un cambio real de tamaño o el scroll siguen cancelando la entrada.

El archivo histórico `examples/cursor-liquido.html` sigue intacto (0.1.1-recovery). `dist/cursor-liquido-standalone.html` es el candidato construido sin red desde la demo, el CSS y el bundle de cuatro scripts.

Ejecuta `npm run build`, `npm test`, `npm run test:browser` y `npm run test:quality`. La regresión de calidad usa mouse real de Playwright y una condición declarada de frames lentos (11 frames, 116.7ms). No mide FPS ni certifica GPU físicas. La base A y el candidato B se prueban A-B-B-A en Mucho y Hardcore, leyendo tinte flotante. No usa tinte sintético ni conservación del campo de simulación.

## Entrada táctil y regresión de planificación

La comprobación opt-in de tacto espera hasta dos segundos por un splat real del solver y después aplica la aserción positiva original. Una espera fija no garantiza entrega de RAF. `tests/browser/touch-input.cjs` demuestra la falta de sincronización con una condición declarada que retiene el primer RAF: seis entradas reales del handler encolan un gesto, el contador temprano es cero y el RAF nativo consume exactamente un splat con tinte flotante no nulo. No se agrega entrada después de liberar RAF, no se cambian contadores ni campos y no se llama directamente al frame.

Una prueba CDP separada envía eventos táctiles de confianza de Chromium, verifica el render opt-in y arrastra verticalmente. El scroll nativo debe mover la página, emitir `pointercancel` y vaciar entrada pendiente sin `preventDefault`. Es emulación de navegador, no certificación de iPhone o Android físicos.

Las primeras dos ejecuciones completas del candidato fallaron la aserción táctil (39/40). Una ejecución diagnóstica posterior pasó la aserción inmediata sin cambios (40/40). No se capturó la planificación exacta de aquellos fallos, por lo que su causa sigue sin verificarse. La regresión de RAF retenido demuestra un defecto de la espera fija de la prueba, no prueba retroactivamente las trazas históricas. La suite ampliada incluye ambos casos nuevos y todas las aserciones originales de color. CI ejecuta la regresión de calidad y la suite de navegador completa.
