# Cursor líquido 1.0.1

Corrige la pérdida del último movimiento pendiente cuando el motor reduce automáticamente la calidad. La corrección es un guard externo; el renderer aprobado y su adaptador conservan exactamente sus bytes. No se alteran shaders, colores, radios ni las protecciones que limpian la entrada al hacer scroll o cambiar el tamaño de ventana. La sobrecarga sostenida sigue apagando el efecto y liberando la GPU.

## Verificación

- 13 pruebas unitarias aprobadas.
- 42 pruebas de navegador aprobadas sobre el bundle final, por file y HTTP. Incluyen entrada táctil nativa de Chromium y desplazamiento sin prevención.
- 8 comparaciones A-B-B-A reproducen la pérdida en el baseline y verifican la recuperación de un movimiento en Mucho y Hardcore, más scroll, resize y parada por presupuesto.
- HTML autocontenido con los dos avisos MIT completos y los cuatro niveles.

Las pruebas usan Chromium con SwiftShader. No certifican GPU físicas ni teléfonos. El caso de reducción de calidad usa un fixture temporal declarado, no una medición de FPS.

## Uso

Descarga el ZIP o los archivos JS/CSS de esta versión. El HTML autocontenido abre sin servidor. Para integrarlo con Juice, usa `LiquidCursor.mount({ followJuice: true })`; Nada/Poquito/Mucho/Hardcore corresponden a off/subtle/full/hard. No exige Moki ni Game Feel para uso independiente.

README con capturas, GIF y video en el repositorio. La corrección conserva el estilo visual aprobado.
