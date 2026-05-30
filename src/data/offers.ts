export interface Offer {
  op: string;
  /** precio mensual en € (string ya formateado es-ES) */
  price: string;
  /** ahorro vs gasto del usuario — placeholder. En real será función del pago declarado. */
  save: number;
  fibre: string;
  mobile: string;
  perm: string;
  tag: string;
  /** marca la oferta recomendada (1 por bloque) */
  rec?: boolean;
}

// TODO(data): hardcoded placeholder. Cuando se decida origen (endpoint, scraping, CMS),
// mover a una función `getOffers({ paid, provider })`.
export const OFFERS: ReadonlyArray<Offer> = [
  { op: 'Digi',      price: '21,00', save: 12,   fibre: '1 Gb sim.',   mobile: '30 GB + ilim.', perm: 'Sin permanencia', tag: 'Mejor valor',     rec: true },
  { op: 'Pepephone', price: '26,90', save: 6.1,  fibre: '600 Mb sim.', mobile: '25 GB + ilim.', perm: 'Sin permanencia', tag: 'Atención humana' },
  { op: 'O2',        price: '30,00', save: 3,    fibre: '1 Gb sim.',   mobile: 'Ilimitado',     perm: 'Sin permanencia', tag: '100% online' },
  { op: 'Yoigo',     price: '32,99', save: 0.01, fibre: '600 Mb sim.', mobile: '60 GB + ilim.', perm: '12 meses',        tag: 'Roaming UE' },
];

/** ahorro humano: "< 1 €/mes" o "12 €/mes" */
export function fmtSave(n: number): string {
  return (n < 1 ? '< 1' : Math.round(n)) + ' €/mes';
}
