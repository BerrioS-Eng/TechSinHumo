/*
  schemas.ts — contratos de los datos editables (public/data/*.json).

  Única fuente de verdad de la validación: la usan los módulos que consumen
  los JSON en build (offers.ts, services.ts, provider.ts) y el script de CI
  `pnpm validate:data`. Un dato inválido rompe el build ANTES de desplegar.
*/
import { z } from 'zod';
import { es } from 'zod/locales';

// Mensajes de zod en español: los lee el PM en el log de GitHub Actions.
z.config(es());

/** id estable en kebab-case; lead.php valida contra estos mismos archivos */
const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'usa solo minúsculas, números y guiones (ej. "fibra-movil")');

const NonEmpty = z.string().trim().min(1);

export const OfferSchema = z
  .strictObject({
    /** nombre comercial del operador, tal como se muestra */
    op: NonEmpty,
    /** id del servicio que cubre la oferta (debe existir en services.json) */
    service: Id,
    /** precio mensual en € (número; el formato es-ES se aplica al renderizar) */
    price: z.number().min(1).max(500),
    /** ahorro estimado en €/mes frente a la factura del usuario */
    save: z.number().gt(0).max(500),
    /** componentes incluidos; deja vacío el que no aplique a la oferta */
    fibre: z.string().trim().default(''),
    mobile: z.string().trim().default(''),
    tv: z.string().trim().default(''),
    perm: NonEmpty,
  })
  .refine((o) => o.fibre !== '' || o.mobile !== '' || o.tv !== '', {
    message: 'la oferta debe incluir al menos uno de: fibra, móvil o TV',
  });

export const OffersFileSchema = z.strictObject({ offers: z.array(OfferSchema).min(1) });

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