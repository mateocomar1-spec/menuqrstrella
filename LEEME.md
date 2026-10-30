# Cómo revisar esta entrega

Descomprimí el ZIP y abrí `abrir-preentrega.html`. Contiene las imágenes, las fuentes y los estilos: no requiere instalar nada ni subir archivos a Netlify.

- `vista-real-*.png`: capturas de la integración real.
- `integracion-menu-qr.patch`: cambios fuente preparados para el repositorio strella-estudio-web.
- `web-preview/`: sitio compilado en modo de revisión; requiere servir esa carpeta como raíz para conservar sus rutas.

No publicar este paquete ni aplicar el parche a producción hasta tu autorización. El archivo local usa el canal real de consulta del sitio: ningún mensaje se envía automáticamente.

---

# Integración de Menú QR · Pendiente de autorización

La propuesta está integrada en el código real de `site/menu-qr/index.html`, para la URL final `https://strellaestudio.com.ar/menu-qr/`.

No se envió esta rama al repositorio remoto de la web ni se ejecutó un despliegue. El sitio público y los DNS no se modificaron. La rama local de trabajo es `draft/menu-qr-panel-preentrega`.

## Contenido

- Presentación de menú digital y panel administrador; retiro y delivery, pedido por WhatsApp y confirmación del local.
- Configuración inicial de $80.000 ARS, por única vez, con carga inicial de hasta 50 productos usando material proporcionado por el cliente, categorías, panel, QR y explicación de uso.
- Abono de $30.000 ARS por mes: hosting, imágenes, dirección web con subdominio, panel, mantenimiento y actualizaciones técnicas.
- 14 preguntas frecuentes, título y descripción nuevos, BreadcrumbList/Service/FAQPage y canonical de `/menu-qr/`.
- Capturas anónimas con marca `TU LOCAL`. No se incorporó el nombre del cliente ni información personal.

La cabecera, el pie, la navegación móvil, el logo y el contacto existentes se conservan. Se usan Montserrat y los colores reales del sitio (#0b1220 / #ff7300). Los estilos nuevos están aislados bajo `.strella-menuqr`; no se modifica el CSS global.

Los CTA usan el WhatsApp ya presente en la web, con un mensaje de consulta por Menú QR. No se envió ningún mensaje durante las verificaciones. No se incluyeron precios en USD, soporte sin alcance definido ni prestaciones adicionales.

## Revisión local

```sh
node verify.mjs --source
node scripts/verify-menu-qr.mjs --source
SITE_PREVIEW_ORIGIN=http://localhost:5190 node build.mjs --preview
node verify.mjs
node scripts/verify-menu-qr.mjs --preview
python3 -m http.server 5190 --directory dist
```

La compilación de prueba conserva las 14 páginas, usa `noindex,nofollow`, robots sin rastreo y cabecera `X-Robots-Tag`; no inyecta Analytics. En el navegador local, revisar la ruta `/menu-qr/` y las capturas de menú/panel.

También se comprobó en Chromium a 320/390/768/1440 px: imágenes, desborde, menú móvil, FAQ, anclas, contacto correcto y ausencia de errores de JavaScript. Cabecera y pie se compararon con el código original y se conservan sin cambios.

## Publicación futura — requiere aprobación expresa

No subir la carpeta de preentrega al sitio de producción ni enviar esta rama al repositorio remoto de la web antes de la aprobación: Netlify está configurado para desplegar automáticamente desde GitHub.

Una vez autorizado, revisar el diff, integrar únicamente los cambios fuente de esta propuesta y recompilar con `node build.mjs --production`. No reutilizar el `dist` de prueba para producción: sus canonical, robots y cabeceras son de revisión. El build productivo mantiene canonical del dominio real y la política de medición existente.

No se editaron otras páginas de servicios, el caso histórico de proyectos ni la portada. Si se aprueba el nuevo alcance, conviene revisar después sus menciones antiguas para mantener coherencia en toda la web.
