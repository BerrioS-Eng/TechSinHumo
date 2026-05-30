export interface Provider {
  id: string;
  name: string;
  note?: string;
}

// TODO(data): si en el futuro hay una API/CMS de operadores, mover aquí.
export const PROVIDERS: ReadonlyArray<Provider> = [
  { id: 'movistar',  name: 'Movistar', note: 'ex-Telefónica' },
  { id: 'vodafone',  name: 'Vodafone' },
  { id: 'orange',    name: 'Orange' },
  { id: 'masmovil',  name: 'MásMóvil' },
  { id: 'digi',      name: 'Digi' },
  { id: 'o2',        name: 'O2' },
  { id: 'yoigo',     name: 'Yoigo' },
  { id: 'pepephone', name: 'Pepephone' },
  { id: 'lowi',      name: 'Lowi' },
  { id: 'simyo',     name: 'Simyo' },
  { id: 'finetwork', name: 'Finetwork' },
  { id: 'otra',      name: 'Otra…' },
];

export const PROVIDER_IDS: ReadonlySet<string> = new Set(PROVIDERS.map((p) => p.id));
