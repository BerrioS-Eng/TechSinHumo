/*
  Catálogo completo de ofertas. El contenido vive en offers.json (editable por
  el PM desde /admin o desde la web de GitHub); aquí solo se valida y formatea.
  Cada oferta pertenece a un servicio de services.json: la portada destaca la
  mejor (mayor ahorro) de cada servicio y el funnel filtra por el elegido.
*/
import raw from '../../public/data/offers.json';
import { OffersFileSchema, parseOrThrow, type Offer } from './schemas';
import { SERVICE_IDS } from './services';

export type { Offer };

export const OFFERS: ReadonlyArray<Offer> = parseOrThrow(
  OffersFileSchema,
  raw,
  'public/data/offers.json',
).offers;

// Toda oferta debe apuntar a un servicio existente: mejor romper el build
// que publicar una oferta que el funnel nunca mostraría.
for (const o of OFFERS) {
  if (!SERVICE_IDS.has(o.service)) {
    throw new Error(
      `public/data/offers.json: la oferta "${o.op}" usa el servicio "${o.service}", ` +
        `que no existe en services.json. Corrige el id o añade el servicio.`,
    );
  }
}

/** qué incluye la oferta, listo para mostrar: "1 Gb sim. · Ilimitado · TV" */
export function offerIncludes(o: Offer): string {
  return [o.fibre, o.mobile, o.tv].filter(Boolean).join(' · ');
}

/** la mejor oferta de un servicio: mayor ahorro y, a igualdad, menor precio */
export function bestOffer(serviceId: string): Offer | undefined {
  return [...OFFERS]
    .filter((o) => o.service === serviceId)
    .sort((a, b) => b.save - a.save || a.price - b.price)[0];
}

const priceFmt = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** precio humano: 21 → "21,00" (coma decimal es-ES) */
export function fmtPrice(n: number): string {
  return priceFmt.format(n);
}

/** ahorro anual a partir del mensual guardado en offers.json: 12.4 → 149 */
function saveYear(n: number): number {
  return Math.round(n * 12);
}

/** cifra del ahorro anual, siempre en positivo: 12.4 → "149", 0.01 → "< 1" */
export function fmtSaveYearNum(n: number): string {
  const y = saveYear(n);
  return y < 1 ? '< 1' : String(y);
}

/** ahorro anual humano: 12.4 → "149 €/año" */
export function fmtSaveYear(n: number): string {
  return fmtSaveYearNum(n) + ' €/año';
}