/*
  validate-data.ts — valida los datos editables antes de construir/desplegar.

  1. Cada JSON de public/data/ debe cumplir su esquema (los mismos que usa el build).

  Uso: pnpm validate:data   (CI lo ejecuta antes de `pnpm build`)
  Sale con código 1.
*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';
import {
  OffersFileSchema,
  ProvidersFileSchema,
  ServicesFileSchema,
} from '../data/schemas';

const root = fileURLToPath(new URL('../../', import.meta.url));
let failed = false;

const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const fail = (msg: string) => {
  failed = true;
  console.error(`  ✗ ${msg}`);
};

function validateFile<S extends z.ZodType>(schema: S, rel: string): z.output<S> | undefined {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(root + rel, 'utf8'));
  } catch (e) {
    fail(`${rel}: JSON malformado — ${(e as Error).message}`);
    return undefined;
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    fail(`${rel}:`);
    for (const issue of result.error.issues) {
      console.error(`      · ${issue.path.length ? issue.path.join('.') : '(raíz)'}: ${issue.message}`);
    }
    return undefined;
  }
  ok(rel);
  return result.data;
}

console.log('Validando datos editables (public/data/*.json)…');
const offers = validateFile(OffersFileSchema, 'public/data/offers.json');
const services = validateFile(ServicesFileSchema, 'public/data/services.json');
const providers = validateFile(ProvidersFileSchema, 'public/data/providers.json');
if (offers) ok(`offers: ${offers.offers.length} ofertas, recomendada: ${offers.offers.find((o) => o.rec)?.op}`);
if (services) ok(`services: ${services.services.length} servicios`);
if (providers) ok(`providers: ${providers.providers.length} operadores`);

if (failed) {
  console.error('\nValidación FALLIDA: el despliegue se detiene y el sitio publicado NO cambia.');
  console.error('Guía de edición: docs/actualizar-datos.md');
  process.exit(1);
}
console.log('\nValidación correcta: los datos están listos para desplegar.');