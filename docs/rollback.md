# Rollback

## Apagar ya, sin desplegar

En la consola del navegador o desde tu propio código:

```js
LiquidCursor.current && LiquidCursor.current.destroy()
```

Para soporte, `?fluid=off` en la URL desactiva el motor de fluido en esa carga. Poquito no se ve afectado.

## Quitar el paquete

Borra las dos etiquetas (`<link>` del CSS y `<script>` del JS), la llamada a `mount` y, si lo agregaste, el conductor de Juice. Los atributos `data-liquid-obstacle` y `data-liquid-intensity` pueden quedarse, no hacen nada sin el paquete.

## Volver a una versión anterior

1. Publica cada versión en su propia carpeta, por ejemplo `/vendor/cursor-liquido/1.0.0/`, y no la sobrescribas.
2. Para volver, apunta las dos etiquetas a la carpeta anterior.
3. Verifica lo que realmente se sirve contra el `manifest.json` de esa versión:

```sh
curl -s https://tu-sitio.example/vendor/cursor-liquido/1.0.0/cursor-liquido.js | sha256sum
# compara con files["dist/cursor-liquido.js"].sha256 del manifest
```

## Antes de cada integración

- Guarda la versión anterior de la página y de su carpeta de vendor.
- Anota la versión del paquete y el sha256 de `dist/cursor-liquido.js`.
- Prueba con la intensidad que vas a usar, con movimiento reducido y con teclado.

## Si el fluido se ve como una mancha gris o blanca

Ese fue el síntoma de la regresión corregida antes de 1.0.0 (ver [CHANGELOG](../CHANGELOG.md)). Primero confirma que el sha256 del motor dentro del bundle sea `3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230` (`npm test` lo revisa). Si coincide y el problema sigue en una GPU concreta, baja a `poquito` en esa página y abre un issue con navegador, sistema y GPU.
