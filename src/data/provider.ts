/*
  Operadores del paso 2 del funnel. El contenido vive en providers.json
  (editable desde /admin); los ids están acoplados a public/api/lead.php —
  `pnpm validate:data` comprueba esa correspondencia.
*/
import raw from './providers.json';
import { ProvidersFileSchema, parseOrThrow, type Provider } from './schemas';

export type { Provider };

export const PROVIDERS: ReadonlyArray<Provider> = parseOrThrow(
  ProvidersFileSchema,
  raw,
  'src/data/providers.json',
).providers;

export const PROVIDER_IDS: ReadonlySet<string> = new Set(PROVIDERS.map((p) => p.id));