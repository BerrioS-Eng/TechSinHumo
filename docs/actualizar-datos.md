# Actualizar los datos del comparador

Guía para editar **ofertas, servicios y operadores** sin tocar código.
Solo hace falta una cuenta de GitHub con acceso de escritura al repositorio
`BerrioS-Eng/TechSinHumo`. 

## Qué se puede editar

| Archivo | Qué controla | Libertad |
| --- | --- | --- |
| `public/data/offers.json` | Tabla de ofertas de la portada y resultados del funnel (precios, ahorros, etiquetas) | Total: edita cuando quieras |
| `public/data/services.json` | Botones del paso 3 del funnel («¿Qué servicio tienes?») | Total: añadir, editar y borrar |
| `public/data/providers.json` | Botones del paso 2 del funnel («¿Con quién estás ahora?») | Total: añadir, editar y borrar |

El backend que guarda los leads lee estos mismos archivos, así que un
servicio u operador nuevo queda aceptado automáticamente al publicar: no hay
que avisar a desarrollo. Única precaución: el campo `id` (minúsculas y
guiones) identifica cada opción — una vez publicado, mejor no renombrarlo;
si necesitas cambiar el texto visible, cambia solo `name`.

## Qué pasa al guardar

Cada guardado dispara el workflow **Build & Deploy a Nominalia**
(pestaña **Actions** del repositorio):

- **Verde** → el cambio está publicado en techsinhumo.com.
- **Rojo** → la validación encontró un error y **el sitio publicado NO
  cambió**. Abre el run, mira el paso *Validar datos editables*: el mensaje
  dice qué archivo y campo corregir. Corrige y vuelve a guardar.

## Reglas que comprueba la validación

- `price`: número entre 1 y 500 (€/mes). `save`: mayor que 0, hasta 500.
- Ningún campo de texto puede quedar vacío.
- Exactamente **una** oferta con `rec: true` (la recomendada).
- Ids de servicios/operadores: minúsculas, números y guiones, sin duplicados.
  Siempre debe quedar al menos una oferta, un servicio y un operador.

## Cómo deshacer un cambio

En GitHub: **History** del archivo → abre el commit → **Revert**. Eso genera
el commit inverso y redespliega la versión anterior. Si algo se complica,
avisa a desarrollo: todo cambio queda registrado con autor, fecha y contenido.

## Para desarrollo

- Los JSON viven en `public/data/`: se importan en build (validados con los
  esquemas zod de `src/data/schemas.ts`) y se despliegan tal cual a
  `www/data/`, de donde `public/api/lead.php` los lee en runtime para
  validar leads — una única fuente de verdad, sin mapas duplicados en PHP.
  Si los archivos faltan o están corruptos en el servidor, `lead.php`
  responde `500 {"error":"config"}` (fallo cerrado, no acepta ids sin validar).
- `pnpm validate:data` ejecuta en local la misma validación que CI.
- Los módulos `src/data/*.ts` validan los JSON también en build: datos
  inválidos rompen `pnpm build` antes de llegar al FTP.