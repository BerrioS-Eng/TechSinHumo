export interface Service {
  id: string;
  name: string;
}

// TODO(data): si en el futuro hay una API/CMS, mover aquí.
export const SERVICES: ReadonlyArray<Service> = [
  { id: 'movil',          name: 'Línea móvil' },
  { id: 'fibra-movil',    name: 'Fibra y línea móvil' },
  { id: 'fibra-movil-tv', name: 'Fibra, línea móvil y TV' },
];

export const SERVICE_IDS: ReadonlySet<string> = new Set(SERVICES.map((s) => s.id));
