/*
  Operadores del paso 2 del funnel. El contenido vive en public/data/providers.json
  (editable desde /admin).
*/
import raw from '../../public/data/providers.json';
import { ProvidersFileSchema, parseOrThrow, type Provider } from './schemas';

export type { Provider };

export const PROVIDERS: ReadonlyArray<Provider> = parseOrThrow(
  ProvidersFileSchema,
  raw,
  'public/data/providers.json',
).providers;

export const PROVIDER_IDS: ReadonlySet<string> = new Set(PROVIDERS.map((p) => p.id));