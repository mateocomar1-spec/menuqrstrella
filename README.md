# La Piccolina · Menú QR

Primera versión para un único local: menú público, búsqueda y categorías, precios por tamaño, selección de 6/12/18 empanadas, carrito y pedido por WhatsApp. Panel en `/#admin` con edición masiva de precios, productos, fotos, disponibilidad, categorías, estado del local, avisos y costo de envío.

## Desarrollo

Node 22.12+ (validado con Node 24). Desde la raíz del repositorio:

```sh
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
npm test
npm run build
```

Sin variables de Supabase funciona en **modo demostración**, claramente indicado: los cambios solo viven en memoria y se pierden al recargar; el checkout muestra un mensaje de prueba y no abre WhatsApp. El panel de demostración no tiene contraseña. No usar este modo como menú operativo.

## Conexión de producción

1. Crear un proyecto Supabase y ejecutar `supabase/schema.sql` en su editor SQL. Es repetible: tablas y bucket conservan los datos; las políticas se recrean.
2. Ejecutar `supabase/seed.sql`. Carga el catálogo inicial únicamente si aún no existe. Nunca sobrescribe ediciones del dueño.
3. En Authentication, deshabilitar el registro público y crear el usuario del dueño. Asignarle acceso ejecutando `insert into public.menu_admins(user_id) values ('UUID-REAL-DEL-USUARIO');`. La cuenta de STRELLA puede autorizarse de la misma manera. No compartir contraseñas en chat.
4. Copiar `.env.example` a `.env.local`, sin reemplazar un archivo existente, y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL del proyecto y su clave **pública** anon/publishable. Nunca usar `service_role`, claves secretas ni contraseñas en variables `VITE_*`, porque se incluyen en el navegador.
5. Reiniciar Vite. En producción ejecutar `npm run build` después de configurar las variables: se incorporan durante la compilación. Publicar el contenido de `dist/` en el hosting estático actual, conservando el dominio exacto `lapiccolina.strellaestudio.com.ar` y HTTPS. El panel usa hash routing y no necesita reescrituras.
6. Antes de reemplazar el menú vigente, probar con una cuenta del dueño: login, guardar y recargar precios, subir foto, agotar un sabor y comprobar el menú público desde otra sesión. Confirmar que un visitante sin sesión no pueda actualizar `menus` ni subir fotos. Verificar los importes, número de WhatsApp, horario manual y costo de envío con el local. Hacer un respaldo del sitio anterior para poder volver atrás.

La base de datos permite lectura pública del catálogo y solo escritura a usuarios autorizados en `menu_admins`. No hay registro público en la aplicación. El guardado usa una versión para detectar ediciones simultáneas y evitar sobreescrituras silenciosas. Las imágenes aceptan JPG/PNG/WebP hasta 5 MB. Para activar fotos hace falta configurar el bucket con el SQL incluido.

El catálogo se consulta al cargar la página y de nuevo antes de preparar un pedido; los clientes que ya tengan la página abierta verán cambios del catálogo al recargar. WhatsApp prepara el mensaje: el cliente debe enviarlo y el local confirmar el pedido. No se almacenan pedidos ni datos personales en la base de datos. No incluye pagos, gestión de cocina ni múltiples locales.

## Datos importados

83 productos, 6 categorías, importados del Excel entregado. El script `scripts/import_excel.py` permite regenerar `public/menu.json` usando Python 3 sin dependencias. Esto reemplaza el catálogo inicial local: no ejecutarlo contra una exportación de trabajo sin respaldo. Si se regenera, actualizar también el seed antes de una nueva instalación.

**Dato pendiente:** `p41`, Pizza Mitad y Mitad, venía sin precio y con categoría inexistente. Se conservó en Pizzas, no disponible y con precio pendiente. El dueño debe definir su modalidad e importe antes de habilitarla. No se dedujo una regla de precios.

El costo de envío inicial ($6.500) se tomó del HTML original y queda editable. El estado abierto/cerrado es manual. No se incluyó el aviso antiguo de nieve. No se copió el enlace temporal del logo de Instagram: se usa una marca tipográfica e ilustración decorativa de pizza, sin presentarla como fotografía del producto. Se requieren fotos reales para completar la identidad del local.

## Validación

`npm test` comprueba precios, importación, docenas, sabores agotados, cierre del local, dirección de delivery y cambios de precios antes del pedido. `npm run build` genera producción. Se verificó en Chromium: vista de 390 px sin desborde, 83 productos, pizza chica, carrito, mensaje de prueba, edición de precios y búsqueda, sin errores JavaScript. La autenticación, almacenamiento y políticas SQL requieren un proyecto Supabase real; no se presentan como validados en producción.

## Publicación de prueba en Netlify

El archivo `netlify.toml` configura Node 24, comando `npm run build:production` y carpeta `dist`. Este comando rechaza una configuración incompleta o una clave privada. Cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en las variables del sitio de Netlify antes de compilar; usar los mismos valores públicos configurados en el entorno. No copiar `.env.local` a Git.

Crear primero un sitio de prueba separado o un Deploy Preview. No cambiar el dominio actual hasta validar login y guardado del dueño. Netlify puede publicar automáticamente la rama de producción: confirmar la rama configurada antes de vincularla o enviar cambios a ella. El sitio de prueba usa la base real y cualquier edición autorizada se guarda en ella; realizar la comprobación con un cambio reversible y restaurarlo.

Verificación remota realizada: catálogo de 83 productos/6 categorías accesible, función de administrador devuelve `false` sin sesión, lista de administradores rechaza acceso anónimo, y una actualización anónima al mismo valor actual no afecta filas. La autorización efectiva del dueño, su login y el guardado autenticado siguen pendientes. En Authentication de Supabase deshabilitar el registro público si todavía está habilitado: la aplicación no necesita altas abiertas. Los usuarios nuevos nunca se autorizan automáticamente como administradores.
