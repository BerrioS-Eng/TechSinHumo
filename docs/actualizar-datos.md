# Actualizar los datos del comparador

Guía para editar **ofertas, servicios y operadores** sin tocar código.
Solo hace falta una cuenta de GitHub con acceso de escritura al repositorio
`BerrioS-Eng/TechSinHumo`. **Nunca** se usan las credenciales de Nominalia
(FTP, gestor de archivos, phpMyAdmin) para esto.

## Qué se puede editar

| Archivo | Qué controla | Libertad |
| --- | --- | --- |
| `src/data/offers.json` | Tabla de ofertas de la portada y resultados del funnel (precios, ahorros, etiquetas) | Total: edita cuando quieras |
| `src/data/services.json` | Botones del paso 3 del funnel («¿Qué servicio tienes?») | Cambiar `name`, libre. Añadir/quitar/renombrar `id`: **coordinar con desarrollo** |
| `src/data/providers.json` | Botones del paso 2 del funnel («¿Con quién estás ahora?») | Igual que servicios |

¿Por qué la restricción de los `id`? El backend que guarda los leads
(`public/api/lead.php`) solo acepta ids que conoce. La validación automática
bloquea el despliegue si los ids del JSON y los del PHP no coinciden, para
que nunca se pierdan leads en silencio.

## Opción A — Panel de edición `/admin` (recomendada)

1. Abre `https://techsinhumo.com/admin/`.
2. Pulsa **Sign In Using Access Token** (solo la primera vez; el token queda
   guardado en tu navegador).
3. Para crear el token (una vez): en GitHub, **Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token**.
   - *Resource owner*: `BerrioS-Eng` · *Repository access*: **Only select
     repositories** → `TechSinHumo`.
   - *Permissions → Repository permissions → Contents*: **Read and write**
     (Metadata se marca sola). Nada más.
   - Expiración: 90 días está bien; cuando caduque, generas otro.
   - Copia el token y pégalo en el panel.
4. Entra en **Datos del comparador → Ofertas destacadas**, edita los campos
   y pulsa **Guardar**. Eso crea un commit en la rama `build` y el sitio se
   reconstruye y publica solo (~2–3 minutos).

El token solo da acceso a este repositorio y se puede revocar en cualquier
momento desde GitHub. No lo compartas ni lo guardes en documentos.

## Opción B — Editar el JSON en GitHub (alternativa sin panel)

1. Abre el archivo en GitHub, por ejemplo
   `https://github.com/BerrioS-Eng/TechSinHumo/blob/build/src/data/offers.json`.
2. Pulsa el lápiz (**Edit this file**), haz el cambio y **Commit changes**
   directamente a `build`.
3. GitHub muestra el diff antes de confirmar: revísalo.

Formato de una oferta (los números van **sin comillas** y con **punto**
decimal; el sitio ya los muestra con coma):

```json
{
  "op": "Digi",
  "price": 21,
  "save": 12,
  "fibre": "1 Gb sim.",
  "mobile": "30 GB + ilim.",
  "perm": "Sin permanencia",
  "tag": "Mejor valor",
  "rec": true
}
```

## Qué pasa al guardar

Cada guardado dispara el workflow **Build & Deploy a Nominalia**
(pestaña **Actions** del repositorio):

- **Verde** → el cambio está publicado en techsinhumo.com.
- **Rojo** → la validación encontró un error y **el sitio publicado NO
  cambió**. Abre el run, mira el paso *Validar datos editables*: el mensaje
  (en español) dice qué archivo y campo corregir. Corrige y vuelve a guardar.

## Reglas que comprueba la validación

- `price`: número entre 1 y 500 (€/mes). `save`: mayor que 0, hasta 500.
- Ningún campo de texto puede quedar vacío.
- Exactamente **una** oferta con `rec: true` (la recomendada).
- Ids de servicios/operadores: minúsculas, números y guiones, sin duplicados,
  y con entrada correspondiente en `lead.php`.

## Cómo deshacer un cambio

En GitHub: **History** del archivo → abre el commit → **Revert**. Eso genera
el commit inverso y redespliega la versión anterior. Si algo se complica,
avisa a desarrollo: todo cambio queda registrado con autor, fecha y contenido.

## Para desarrollo

- `pnpm validate:data` ejecuta en local la misma validación que CI
  (esquemas zod de `src/data/schemas.ts` + correspondencia con `lead.php`).
- Los módulos `src/data/*.ts` validan los JSON también en build: datos
  inválidos rompen `pnpm build` antes de llegar al FTP.
- El panel es Sveltia CMS (`@sveltia/cms`, versión fijada en package.json,
  empaquetado en build — sin CDN). Configuración: `public/admin/config.yml`.
- Endurecimiento opcional: Basic Auth sobre `/admin` vía `.htaccess` en
  Nominalia. No es imprescindible: la página no contiene secretos y toda
  operación exige el token de GitHub.