# TechSinHumo — sitio en Astro

Versión en **Astro** (estática, sin framework de UI) de la landing del comparador
TechSinHumo. Portada desde el prototipo en React/Babel: misma estética
minimalista tipo Apple, mismo sistema de tokens y los mismos eventos de conversión.

## Arranque

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/ (estático)
npm run preview  # sirve dist/ localmente
```

Requiere Node 18.20+ / 20.3+ / 22+.

## Estructura

```
src/
├─ pages/
│  └─ index.astro            # única página: ensambla la landing
├─ layouts/
│  └─ BaseLayout.astro       # <html>, <head> SEO, observer de .reveal
├─ components/
│  ├─ primitives/            # Button, Icon, Badge, Field, LinkArrow
│  ├─ landing/               # Header, Hero, HowItWorks, FeaturedComparison,
│  │                         #   Methodology, Blog, FinalCTA, Footer
│  └─ funnel/
│     └─ Funnel.astro        # overlay de 4 pasos (estado en JS vanilla)
├─ data/
│  ├─ offers.ts              # ofertas + fmtSave()  (placeholder, ver TODO)
│  └─ provider.ts            # operadores del paso 2
└─ styles/
   ├─ tokens.css             # API de diseño (color, tipografía, ritmo, motion)
   └─ global.css             # reset, tipografía base, primitivos compartidos
public/
└─ favicon.svg
```

Cada sección lleva sus estilos en un `<style>` *scoped*. Lo verdaderamente
compartido (botones, input, badges, tipografía, `.reveal`) vive en `global.css`.
Todo el color y el espaciado salen de las variables de `tokens.css`: cambia el
acento o la densidad ahí y se propaga al sitio entero.

## Abrir el funnel

El overlay escucha dos cosas; ambas convergen en la misma apertura:

1. **Atributo** — cualquier elemento con `data-open-funnel` lo abre al hacer clic.
   - `data-step="2"` para saltar a un paso concreto (0–3).
   - `data-paid="42"` para precargar la factura.
2. **Evento global** — para abrir desde tu propio JS:

   ```js
   window.dispatchEvent(new CustomEvent('funnel:open', {
     detail: { paid: '42', step: 1 },
   }));
   ```

El formulario del hero usa el evento; el header, la tabla de ofertas y el CTA
final usan el atributo.

## Eventos de conversión

Se conservan los `data-conversion-event` del prototipo
(`cta_hero_click`, `funnel_step_complete`, `funnel_provider_selected`,
`funnel_lead_submit`, `funnel_offer_click`, `cta_final_click`). Engánchalos a tu
analítica con un listener delegado sobre `[data-conversion-event]`.

## Datos

`src/data/offers.ts` y `provider.ts` están **hardcodeados** como placeholder.
Cuando se decida el origen (endpoint, scraping, CMS), mover `OFFERS` a una
función `getOffers({ paid, provider })` y consumirla desde los componentes.

