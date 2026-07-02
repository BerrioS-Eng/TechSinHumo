/*
  generate-post.ts — genera un borrador de artículo con IA.

  Uso:
    ANTHROPIC_API_KEY=... npx tsx scripts/generate-post.ts "tema del post" "Categoría"

  Qué hace y qué NO hace:
    - SÍ: redacta un borrador con voz humana a partir de un tema + datos proporcionados, 
      y lo escribe como .mdx con draft: true.
    - NO: decide solo qué publicar, ni inventa datos de precios, ni pone draft:false.
      Eso es trabajo de la revisión humana. A propósito.

  El flujo honesto es: este script PROPONE, un humano DISPONE. El post nace como
  borrador y solo un cambio manual de `draft: false` lo lleva a producción.
*/

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// 1) Entrada
// ---------------------------------------------------------------------------
const tema = process.argv[2];
const categoria = process.argv[3] ?? 'Guía';

if (!tema) {
  console.error('Falta el tema. Uso: npx tsx scripts/generate-post.ts "tema" "Categoría"');
  process.exit(1);
}

const CATEGORIAS_VALIDAS = ['Permanencia', 'Análisis', 'Guía', 'Actualidad'];
if (!CATEGORIAS_VALIDAS.includes(categoria)) {
  console.error(`Categoría inválida. Usa una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2) DATOS FRESCOS
//    Aquí es donde entra la "veracidad". El modelo usará estos datos como
//    fuente; sin esto, escribirá generalidades o se inventará cifras.
//    Ideas de origen: tu propio offers.json, Google Trends, ADSLZone, Xataka
//    Móvil, Bandaancha, o las dudas frecuentes que dejan tus leads.
// ---------------------------------------------------------------------------
const DATOS_FRESCOS = `
(Pega aquí datos verificados y actuales relevantes al tema. Ejemplos:
 - Precios reales del mes de los operadores implicados.
 - Cambios regulatorios recientes y su fecha.
 - Cifras concretas (velocidades, GB, plazos legales).
Si dejas esto vacío, el borrador será más genérico y habrá que añadir datos a mano.)
`.trim();

// ---------------------------------------------------------------------------
// 3) System prompt — la diferencia entre "texto de IA" y "texto humano".
//    Casi todo el realismo se juega aquí: voz, prohibiciones explícitas,
//    ritmo de frase, exigencia de concreción.
// ---------------------------------------------------------------------------
const SYSTEM = `Eres redactor del blog "Sin Humo" de TechSinHumo, un comparador independiente de fibra y móvil en España. Tu trabajo es escribir artículos que ayudan a la gente a decidir sin que se sientan engañados.

VOZ DE LA MARCA:
- Directa, honesta, anti-letra-pequeña. El gancho de la marca es la transparencia.
- Hablas de tú al lector. Como alguien que sabe del tema y te lo cuenta sin venderte nada.
- Tienes opinión editorial: dices cuándo algo es marketing y cuándo vale la pena.
- Español de España (castellano peninsular): "móvil", "ordenador", "factura", vocabulario y giros de España.

REGLAS DE REDACCIÓN HUMANA (críticas):
- PROHIBIDO usar muletillas de IA: nada de "en el vertiginoso mundo de", "es importante destacar/señalar/mencionar", "en resumen", "en conclusión", "sin duda", "cabe destacar", "en la era digital", "navegar por el panorama".
- Varía la longitud de las frases. Algunas cortas. Otras más largas que desarrollan una idea con detalle antes de cerrar. El ritmo monótono delata a la máquina.
- Usa ejemplos concretos con cifras reales (de los datos que se te dan), no abstracciones.
- No abuses de listas. Prosa que fluye, con alguna lista solo si aporta de verdad.
- Nada de relleno. Si una frase no añade información o criterio, fuera.
- Puedes empezar de formas distintas a "En el mundo de...". Entra directo al grano o con una observación afilada.

REGLAS DE VERACIDAD (innegociables):
- Solo afirmas datos concretos (precios, velocidades, plazos) si están en los DATOS FRESCOS que se te proporcionan. Si no los tienes, hablas en términos generales o dejas un marcador [VERIFICAR: ...] para que el revisor humano lo complete. NUNCA inventes una cifra.
- En temas legales o contractuales (permanencias, penalizaciones, derechos), sé prudente: explica qué preguntar y dónde mirar, y recuerda que la respuesta exacta depende del contrato y la normativa vigente. No des por hecho un derecho concreto sin matizar.

FORMATO DE SALIDA:
Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto antes ni después, sin backticks. Estructura:
{
  "title": "string, 10-90 caracteres, con gancho pero sin clickbait",
  "description": "string, 20-160 caracteres, resumen para la tarjeta y el SEO",
  "cover": "ink" | "surface" | "accent",
  "readingMinutes": número entero,
  "bodyMarkdown": "string con el cuerpo del artículo en Markdown. Usa ## para subtítulos. NO incluyas el título H1 (va en el frontmatter). Incluye [VERIFICAR: ...] donde falten datos."
}`;

const USER = `Escribe un artículo para la categoría "${categoria}" sobre este tema:

${tema}

DATOS FRESCOS DISPONIBLES (úsalos como fuente de verdad para cualquier cifra):
${DATOS_FRESCOS}

Recuerda: devuelve solo el JSON, nada más.`;

// ---------------------------------------------------------------------------
// 4) Llamada al modelo + validación de la salida
// ---------------------------------------------------------------------------
const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

async function main() {
  console.log(`Generando borrador sobre: "${tema}" (${categoria})…`);

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: SYSTEM,
    messages: [{ role: 'user', content: USER }],
  });

  const raw = msg.content.find((b) => b.type === 'text')?.text ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();

  let data: any;
  try {
    data = JSON.parse(clean);
  } catch {
    console.error('La IA no devolvió JSON válido. Respuesta cruda:\n', raw);
    process.exit(1);
  }

  // Validación mínima antes de escribir nada.
  for (const field of ['title', 'description', 'bodyMarkdown']) {
    if (!data[field] || typeof data[field] !== 'string') {
      console.error(`Falta el campo "${field}" en la respuesta de la IA.`);
      process.exit(1);
    }
  }

  const slug = slugify(data.title);
  const outPath = join('src', 'content', 'blog', `${slug}.mdx`);

  if (existsSync(outPath)) {
    console.error(`Ya existe ${outPath}. Renombra el tema o borra el archivo.`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const cover = ['ink', 'surface', 'accent'].includes(data.cover) ? data.cover : 'surface';

  // El frontmatter SIEMPRE nace con draft: true y reviewedBy vacío.
  // Esto es lo que hace obligatoria la revisión humana.
  const frontmatter = `---
title: ${JSON.stringify(data.title)}
description: ${JSON.stringify(data.description)}
category: "${categoria}"
cover: "${cover}"
pubDate: ${today}
draft: true
author: "Redacción TechSinHumo"
aiAssisted: true
reviewedBy:
${data.readingMinutes ? `readingMinutes: ${data.readingMinutes}\n` : ''}---

{/*
  BORRADOR GENERADO POR IA — PENDIENTE DE REVISIÓN HUMANA.
  Checklist antes de poner draft: false
  [ ] Resolver todos los marcadores [VERIFICAR: ...]
  [ ] Verificar cada cifra contra fuente real
  [ ] Confirmar que nada legal/contractual induce a error
  [ ] Leerlo en voz alta: ¿suena a persona o a plantilla?
  [ ] Rellenar reviewedBy con tu nombre
*/}

`;

  writeFileSync(outPath, frontmatter + data.bodyMarkdown + '\n', 'utf-8');

  console.log(`\n✓ Borrador creado: ${outPath}`);
  console.log('  Está en draft: true — NO se publicará hasta que lo revises y cambies el flag.');
  console.log('  Previsualízalo con `pnpm dev` (los borradores se ven en desarrollo).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});