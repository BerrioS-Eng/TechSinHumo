/*
  reading-time.ts — calcula minutos de lectura desde el cuerpo del post.
  Solo se usa como fallback cuando readingMinutes no está en el frontmatter.
  ~200 palabras/min es el estándar razonable para castellano.
*/
export function readingMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}