# Blog — flujo de trabajo

El blog usa **Astro Content Collections**. Los artículos son archivos `.mdx`
en `src/content/blog/`, validados por el schema de `src/content.config.ts`.

## El principio: la IA propone, un humano dispone

Todo artículo nace como **borrador** (`draft: true`) y solo se publica cuando
una persona lo revisa y cambia ese flag a `false`. No hay forma de saltarse ese
paso: en el build de producción, los borradores se excluyen automáticamente.

## Generar un borrador con IA

```bash
ANTHROPIC_API_KEY=sk-... pnpm blog:new "tu tema aquí" "Categoría"
```

Categorías válidas: `Permanencia`, `Análisis`, `Guía`, `Actualidad`.

Esto crea un `.mdx` en `src/content/blog/` con `draft: true`. **Antes de generar**,
abre `src/scripts/generate-post.ts` y rellena la constante `DATOS_FRESCOS` con
información real y actual (precios del mes, cifras, cambios regulatorios). El
modelo redacta *sobre* esos datos; sin ellos el texto será genérico o incluirá
marcadores `[VERIFICAR: ...]` que tendrás que completar a mano.

## Revisar y publicar

1. `pnpm dev` — en desarrollo SÍ se ven los borradores, para previsualizar.
2. Abre el `.mdx` y completa el checklist del comentario superior:
   - Resolver todos los `[VERIFICAR: ...]`.
   - Verificar cada cifra contra una fuente real.
   - Confirmar que nada legal/contractual induce a error.
   - Leerlo en voz alta: ¿suena a persona o a plantilla?
3. Rellena `reviewedBy:` con tu nombre.
4. Cambia `draft: true` → `draft: false`.
5. `pnpm build` — ahora el post aparece en producción.

## De dónde sacar temas "en tendencia"

El script no sabe qué está de moda hoy (un LLM alucina si se lo preguntas).
Fuentes reales para alimentarlo:

- Las dudas frecuentes que dejan tus propios leads en el funnel.
- Google Trends (paquete `google-trends-api`).
- Prensa del sector: ADSLZone, Xataka Móvil, Bandaancha.
- Tu propio `offers.json` cuando exista (precios reales del mes).

## Archivos clave

- `src/content.config.ts` — schema/guardián de los posts.
- `src/components/landing/Blog.astro` — bloque de la landing (3 últimos).
- `src/pages/blog/index.astro` — listado completo.
- `src/pages/blog/[slug].astro` — detalle del artículo.
- `src/scripts/generate-post.ts` — generador con IA.