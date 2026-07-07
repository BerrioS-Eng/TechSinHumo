/*
  Servicios del paso 3 del funnel. El contenido vive en services.json
  (editable desde /admin); los ids están acoplados a public/api/lead.php —
  `pnpm validate:data` comprueba esa correspondencia.
*/
import raw from './services.json';
import { ServicesFileSchema, parseOrThrow, type Service } from './schemas';

export type { Service };

export const SERVICES: ReadonlyArray<Service> = parseOrThrow(
  ServicesFileSchema,
  raw,
  'src/data/services.json',
).services;

export const SERVICE_IDS: ReadonlySet<string> = new Set(SERVICES.map((s) => s.id));