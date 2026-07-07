/*
  Ofertas destacadas. El contenido vive en offers.json (editable por el PM
  desde /admin o desde la web de GitHub); aquí solo se valida y se formatea.
*/
import raw from './offers.json';
import { OffersFileSchema, parseOrThrow, type Offer } from './schemas';

export type { Offer };

export const OFFERS: ReadonlyArray<Offer> = parseOrThrow(
  OffersFileSchema,
  raw,
  'src/data/offers.json',
).offers;

const priceFmt = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** precio humano: 21 → "21,00" (coma decimal es-ES) */
export function fmtPrice(n: number): string {
  return priceFmt.format(n);
}

/** ahorro humano: "< 1 €/mes" o "12 €/mes" */
export function fmtSave(n: number): string {
  return (n < 1 ? '< 1' : Math.round(n)) + ' €/mes';
}