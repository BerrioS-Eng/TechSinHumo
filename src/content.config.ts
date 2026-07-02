import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
  El schema NO es decorativo: es el guardián. Cualquier .mdx (escrito a mano
  o generado por IA) que no cumpla este contrato rompe el build de forma
  ruidosa. Eso es deliberado: preferimos un build roto a publicar un post
  con un campo inventado o una categoría inexistente.
*/

// Categorías cerradas. Si la IA inventa "Tecnología 2026", el build falla
// y la revisión humana se entera. No usar z.string() libre aquí a propósito.
export const BLOG_CATEGORIES = ['Permanencia', 'Análisis', 'Guía', 'Actualidad'] as const;

// El "cover" tipográfico de tu Blog.astro actual. Mismo set de variantes.
const COVERS = ['ink', 'surface', 'accent'] as const;

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(10).max(90),
    description: z.string().min(20).max(160),
    category: z.enum(BLOG_CATEGORIES),
    cover: z.enum(COVERS).default('surface'),
    pubDate: z.coerce.date(),

    // --- Control de publicación ---
    // La IA SIEMPRE escribe draft: true. Astro filtra los borradores en build.
    // Un post solo sale a producción cuando un humano cambia esto a false.
    draft: z.boolean().default(true),

    // --- Trazabilidad editorial ---
    // Honesto internamente: sabemos qué tocó la IA y qué revisó quién.
    author: z.string().default('Redacción TechSinHumo'),
    aiAssisted: z.boolean().default(false),
    // YAML lee un campo vacío como null; lo aceptamos como "sin revisar aún".
    reviewedBy: z.string().nullish(),

    // Minutos de lectura. Si no se indica, lo calculamos del cuerpo (ver util).
    readingMinutes: z.number().int().positive().optional(),
  }),
});

export const collections = { blog };