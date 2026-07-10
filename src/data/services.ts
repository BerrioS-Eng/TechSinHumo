/*
  Servicios del paso 3 del funnel. El contenido vive en public/data/services.json
  (editable desde /admin). El backend de leads (public/api/lead.php) 
  lee ese mismo archivo desplegado en runtime, así que
  añadir/quitar servicios desde el panel no requiere tocar código.
*/
import raw from '../../public/data/services.json';
import { ServicesFileSchema, parseOrThrow, type Service } from './schemas';

export type { Service };

export const SERVICES: ReadonlyArray<Service> = parseOrThrow(
  ServicesFileSchema,
  raw,
  'public/data/services.json',
).services;

export const SERVICE_IDS: ReadonlySet<string> = new Set(SERVICES.map((s) => s.id));