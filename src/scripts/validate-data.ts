/*
  validate-data.ts — valida los datos editables antes de construir/desplegar.

  1. Cada JSON de src/data/ debe cumplir su esquema (los mismos que usa el build).
  2. Los ids de services.json y providers.json deben existir en los mapas de
     public/api/lead.php: el backend rechaza leads con ids que no conoce, así
     que un id nuevo sin su entrada PHP perdería leads en silencio.

  Uso: pnpm validate:data   (CI lo ejecuta antes de `pnpm build`)
  Sale con código 1 y mensajes en español si algo no cuadra.
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
const warn = (msg: string) => console.warn(`  ⚠ ${msg}`);
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

/** extrae las claves de un mapa PHP tipo  $NOMBRE = [ 'id' => 'Etiqueta', … ]; */
function phpMapIds(php: string, varName: string): Set<string> | undefined {
  const match = php.match(new RegExp(`\\$${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!match) return undefined;
  return new Set([...match[1].matchAll(/'([^']+)'\s*=>/g)].map((m) => m[1]));
}

function crossCheck(kind: string, jsonIds: string[], phpIds: Set<string>, phpVar: string): void {
  const missing = jsonIds.filter((id) => !phpIds.has(id));
  const stale = [...phpIds].filter((id) => !jsonIds.includes(id));
  if (missing.length) {
    fail(
      `${kind}: ids sin entrada en public/api/lead.php → ${missing.map((s) => `"${s}"`).join(', ')}.\n` +
        `      El backend rechazaría los leads de esos ids. Pide a desarrollo añadirlos al mapa $${phpVar}.`,
    );
  } else {
    ok(`${kind}: ids en correspondencia con lead.php ($${phpVar})`);
  }
  if (stale.length) {
    warn(`${kind}: $${phpVar} tiene entradas que ya no existen en el JSON (${stale.join(', ')}); no bloquea, pero conviene limpiarlas.`);
  }
}

console.log('Validando datos editables (src/data/*.json)…');
const offers = validateFile(OffersFileSchema, 'src/data/offers.json');
const services = validateFile(ServicesFileSchema, 'src/data/services.json');
const providers = validateFile(ProvidersFileSchema, 'src/data/providers.json');
if (offers) ok(`offers: ${offers.offers.length} ofertas, recomendada: ${offers.offers.find((o) => o.rec)?.op}`);

console.log('Comprobando correspondencia con public/api/lead.php…');
let php: string | undefined;
try {
  php = readFileSync(root + 'public/api/lead.php', 'utf8');
} catch {
  fail('no se pudo leer public/api/lead.php');
}
if (php) {
  const servicios = phpMapIds(php, 'SERVICIOS');
  const companias = phpMapIds(php, 'COMPANIAS');
  if (!servicios || !companias) {
    fail('no se encontraron los mapas $SERVICIOS/$COMPANIAS en lead.php (¿cambió el formato?)');
  } else {
    if (services) crossCheck('services', services.services.map((s) => s.id), servicios, 'SERVICIOS');
    if (providers) crossCheck('providers', providers.providers.map((p) => p.id), companias, 'COMPANIAS');
  }
}

if (failed) {
  console.error('\nValidación FALLIDA: el despliegue se detiene y el sitio publicado NO cambia.');
  console.error('Guía de edición: docs/actualizar-datos.md');
  process.exit(1);
}
console.log('\nValidación correcta: los datos están listos para desplegar.');