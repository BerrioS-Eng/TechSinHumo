// WhatsApp del consultor: número, mensaje y enlace del CTA del funnel.
// Fuente única para SSR (frontmatter) y para el script cliente.
// TODO(contacto): sustituir por el número real del consultor (formato internacional sin +).
export const WHATSAPP_NUMBER = "34600000000";

/** Mensaje prellenado; si se ha elegido una oferta, la menciona. */
export function waMessage(offer?: string): string {
  return offer
    ? `Hola, vengo de TechSinHumo. Me interesa la oferta de ${offer} y quiero activarla con un consultor.`
    : "Hola, vengo de TechSinHumo y quiero activar una oferta con un consultor.";
}

/** Enlace wa.me con el mensaje ya codificado. */
export function waUrl(offer?: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage(offer))}`;
}
