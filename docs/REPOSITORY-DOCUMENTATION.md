# Documentación de la familia

Español · [English](REPOSITORY-DOCUMENTATION.en.md)

Para editar documentación de Cursor líquido. Referencia visual pública: [kit oficial de Jorge Suárez](https://brandkit.jorgesuarez.com.mx/). No requiere acceso a sistemas privados.

## Antes de editar

Lee ambas portadas y las guías actuales. Conserva comandos, rutas, identificadores y APIs literales. No cambies código, dist, vendor, pruebas, versiones ni registros históricos para hacer pasar documentación. El motor y adaptador aprobados están congelados.

## Contenido

Mantén README.md en español y README.en.md equivalente, con enlaces mutuos. Cada guía de uso actual necesita su par ES/EN; CHANGELOG y notas históricas se conservan. Contesta qué, para quién, por qué, cómo, cuándo sí/no y dónde probar o descargar; incluye versión, requisitos, ayuda técnica, costos, privacidad, límites y contacto. La primera acción para una persona va antes del setup de desarrollo. No prometas una publicación sin verificarla.

## Diseño y medios

Fondo #0A0A0A, superficie #161616, naranja #FF6B35, ámbar #FFA500, texto #FFFFFF y secundario #B7B3AD. Sobre naranja usa #22211F. Títulos Outfit 700, cuerpo Inter 400, desde las fuentes oficiales. Firma oficial pequeña arriba a la izquierda, título canónico Cursor líquido, beneficio sencillo y espacio a la derecha para una captura real. Sin degradados decorativos ni UI inventada. El panel claro de las capturas pertenece a la demo histórica, no es una nueva paleta de marca.

Publica portadas PNG con fuentes renderizadas y variante móvil. Usa capturas y video reales, procedencia, VTT y explicación ES/EN. Identifica las condiciones de captura; emulación no certifica hardware. No incluyas datos privados. Moki no es dependencia y no se añade al módulo. Respeta el [aviso de recursos](ASSET-NOTICE.md).

## Comprobar y entregar

Valida enlaces locales, seis preguntas, paridad ES/EN, dimensiones, metadatos de video y hashes contra la base. Ejecuta las pruebas existentes sin alterar aserciones. Revisa previews desktop y móvil, sin overflow ni imágenes rotas. Guarda evidencia en `reports/docs-brandkit-verification.json`. Commit local; publicar, release y deploy requieren otra autorización.

## Reproducir la muestra local

Los artefactos ya están incluidos y se pueden abrir sin instalar herramientas. Para regenerarlos necesitas Python con Pillow y Python-Markdown, el snapshot oficial del kit en `BRAND_ASSET_ROOT` y un Playwright instalado en una ruta absoluta. No cambia las dependencias del producto.

```sh
python scripts/docs-render.py "$BRAND_ASSET_ROOT"
PLAYWRIGHT_MODULE="$PLAYWRIGHT_MODULE" node scripts/docs-browser.cjs
PLAYWRIGHT_MODULE="$PLAYWRIGHT_MODULE" python scripts/docs-verify.py "$BRAND_ASSET_ROOT"
```

El informe separa verificación documental de las pruebas del producto. Las pruebas originales tienen dos conflictos con este trabajo: el manifest de release incluye `docs/media/`, por lo que los nuevos medios lo dejan desactualizado; y la lista de privacidad clasifica el dominio público oficial del kit como privado. No se altera dist ni se oculta la URL para aprobarlas. Consulta `reports/docs-brandkit-verification.json` y `reports/docs-existing-tests.json`.
