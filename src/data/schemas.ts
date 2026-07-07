/*
  schemas.ts — contratos de los datos editables (src/data/*.json).

  Única fuente de verdad de la validación: la usan los módulos que consumen
  los JSON en build (offers.ts, services.ts, provider.ts) y el script de CI
  `pnpm validate:data`. Un dato inválido rompe el build ANTES de desplegar.
*/
import { z } from 'zod';
import { es } from 'zod/locales';

// Mensajes de zod en español: los lee el PM en el log de GitHub Actions.
z.config(es());

/** id estable en kebab-case; acoplado a los mapas de public/api/lead.php */
const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'usa solo minúsculas, números y guiones (ej. "fibra-movil")');

const NonEmpty = z.string().trim().min(1);

export const OfferSchema = z.strictObject({
  /** nombre comercial del operador, tal como se muestra */
  op: NonEmpty,
  /** precio mensual en € (número; el formato es-ES se aplica al renderizar) */
  price: z.number().min(1).max(500),
  /** ahorro estimado en €/mes frente a la factura del usuario */
  save: z.number().gt(0).max(500),
  fibre: NonEmpty,
  mobile: NonEmpty,
  perm: NonEmpty,
  tag: NonEmpty,
  /** marca la oferta recomendada (exactamente 1 por lista) */
  rec: z.boolean().default(false),
});

export const OffersFileSchema = z
  .strictObject({ offers: z.array(OfferSchema).min(1) })
  .superRefine((data, ctx) => {
    const recs = data.offers.filter((o) => o.rec).length;
    if (recs !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['offers'],
        message: `debe haber exactamente UNA oferta recomendada ("rec": true) y hay ${recs}`,
      });
    }
  });

export const ServiceSchema = z.strictObject({ id: Id, name: NonEmpty });
export const ProviderSchema = z.strictObject({ id: Id, name: NonEmpty, note: z.string().optional() });

export const ServicesFileSchema = z
  .strictObject({ services: z.array(ServiceSchema).min(1) })
  .superRefine((data, ctx) => flagDuplicateIds(data.services, 'services', ctx));

export const ProvidersFileSchema = z
  .strictObject({ providers: z.array(ProviderSchema).min(1) })
  .superRefine((data, ctx) => flagDuplicateIds(data.providers, 'providers', ctx));

export type Offer = z.output<typeof OfferSchema>;
export type Service = z.output<typeof ServiceSchema>;
export type Provider = z.output<typeof ProviderSchema>;

function flagDuplicateIds(items: ReadonlyArray<{ id: string }>, key: string, ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  items.forEach((item, i) => {
    if (seen.has(item.id)) {
      ctx.addIssue({ code: 'custom', path: [key, i, 'id'], message: `id duplicado: "${item.id}"` });
    }
    seen.add(item.id);
  });
}

/** parsea o corta el build con un error legible que señala archivo y campo */
export function parseOrThrow<S extends z.ZodType>(schema: S, data: unknown, source: string): z.output<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const detail = result.error.issues
    .map((i) => `  · ${i.path.length ? i.path.join('.') : '(raíz)'}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Datos inválidos en ${source}:\n${detail}\nCorrige el archivo (guía: docs/actualizar-datos.md).`,
  );
}