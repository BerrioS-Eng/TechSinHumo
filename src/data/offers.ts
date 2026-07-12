/*
  Ofertas destacadas. El contenido vive en offers.json (editable por el PM
  desde /admin o desde la web de GitHub); aquí solo se valida y se formatea.
*/
import raw from '../../public/data/offers.json';
import { OffersFileSchema, parseOrThrow, type Offer } from './schemas';

export type { Offer };

export const OFFERS: ReadonlyArray<Offer> = parseOrThrow(
  OffersFileSchema,
  raw,
  'public/data/offers.json',
).offers;

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