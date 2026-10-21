# Contribuir

Gracias por ayudar. Unas reglas cortas, porque este paquete ya tuvo una regresión visual por "mejorar" el renderer.

## El motor no se toca

`src/approved-fluid-v3.1.js` es el renderer aprobado. Su sha256 está fijo en `scripts/build.cjs` y en las pruebas. Ningún PR cambia ese archivo, sus shaders ni su formato. Si algo requiere cambiar el motor, abre primero un issue: sería un motor nuevo, con su propio hash y su propia aprobación visual.

`src/approved-engine-adapter.js` y `src/liquid-cursor.js` sí pueden cambiar, en una versión nueva, con pruebas y una entrada en el CHANGELOG.

## Preparar

```sh
npm ci
npx playwright install chromium   # solo para la suite de navegador
```

Sin red, puedes reutilizar un Playwright instalado: `PLAYWRIGHT_MODULE=/ruta/a/node_modules/playwright`.

## Antes de abrir un PR

```sh
npm run build          # regenera dist/ y dist/manifest.json
npm test               # hash, determinismo, manifest, sintaxis, privacidad
npm run test:browser   # navegador real sobre dist/
```

Sube `dist/` regenerado junto con el cambio. `npm test` falla si `dist/` no coincide con un build nuevo.

## Pruebas visuales

Contar eventos no basta. Un cambio que toque cómo se dibuja debe pasar las pruebas de salida física (color localizado, sin mancha neutra, campo finito) y traer una captura o video real, sin retoque. No subas capturas de otros sitios, de chats ni con datos personales.

## Qué no subir

Rutas absolutas de tu máquina, correos, nombres de hosts internos, credenciales, archivos `.env`, recursos de marca ajenos (incluido Moki). La prueba de privacidad revisa los casos más comunes.

## Estilo

Código y comentarios como el código vecino. Documentación en español con un resumen en inglés cuando sea de uso. Commits con el formato `tipo: descripción` (`feat`, `fix`, `docs`, `test`, `build`, `refactor`).
