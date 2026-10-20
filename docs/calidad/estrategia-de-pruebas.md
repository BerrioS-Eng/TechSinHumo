# Estrategia de pruebas — TechSinHumo

> Plan de pruebas del proyecto: qué se prueba, cómo, con qué herramientas y
> cuándo un cambio se da por terminado. Se modifica por PR, como el código.

## 1. Objetivo y alcance

**Objetivo:** comprobar que el sitio cumple sus historias de usuario (HU) y
requisitos no funcionales (RNF), y que todo cambio que llega a `build` pasa
antes por una verificación automática.

**Dentro del alcance**

- Lógica en TypeScript: `src/data/`, `src/utils/`, `src/scripts/validate-data.ts`.
- Comportamiento en el navegador: portada y funnel.
- Validaciones del endpoint `public/api/lead.php`.
- Datos editables: `public/data/*.json`.
- Rendimiento y accesibilidad del sitio construido.

**Fuera del alcance**

- El funcionamiento interno de Sveltia CMS (herramienta de terceros).
- La infraestructura del hosting (Nominalia) y la base de datos MySQL.
- `src/scripts/generate-post.ts`: herramienta interna de redacción que no se despliega.

## 2. Niveles de prueba

Seguimos la **pirámide de pruebas**: muchas pruebas pequeñas y rápidas en la
base, y pocas lentas y costosas en la cima.

```
            ▲  Performance / carga   (pocas, lentas)
           ▲▲▲ Aceptación E2E
         ▲▲▲▲▲ Integración
      ▲▲▲▲▲▲▲▲ Unitarias             (muchas, rápidas)
  ════════════ Análisis estático     (sin ejecutar el código)
```

| Nivel | Qué verifica | Herramienta | Carpeta | Cuándo corre |
|---|---|---|---|---|
| Estático | Tipos, code smells, complejidad, vulnerabilidades, sin ejecutar el código | `astro check`, SonarCloud | — | Cada PR y cada push a `build` |
| Unitaria | Una función aislada, sin red ni navegador | Vitest + cobertura v8 | `tests/unit/` | Cada PR |
| Integración | Varias piezas juntas (validación + esquemas + JSON) | Vitest | `tests/integration/` | Cada PR |
| Aceptación (E2E) | Los criterios de aceptación, en un navegador real | Playwright | `tests/e2e/` | Cada PR |
| Accesibilidad | Pautas WCAG | `@axe-core/playwright` | `tests/e2e/` | Cada PR |
| Rendimiento web | Core Web Vitals del sitio construido | Lighthouse CI | `tests/perf/` | Cada PR |
| Carga de la API | `lead.php` con usuarios simultáneos | k6 | `tests/perf/` | Manual, solo en local |

## 3. Técnicas de diseño de casos

Los casos de prueba no se inventan: se derivan con técnicas.

| Técnica | En qué consiste | Ejemplo en este proyecto |
|---|---|---|
| Partición de equivalencia | Dividir las entradas en grupos que se comportan igual y probar uno de cada grupo | Teléfono: válido / pocos dígitos / demasiados dígitos / prefijo incorrecto (HU-04) |
| Valores límite | Probar justo en los bordes, donde suelen estar los errores | Importe: 0,99 · 1 · 500 · 500,01 (HU-01). Ahorro anual: 0,04 → "< 1"; 0,05 → "1" (HU-03) |
| Tabla de decisión | Una fila por combinación de condiciones y su resultado esperado | Respuestas de `lead.php`: 405, 400, 422 por campo, 200 (HU-07) |
| Transición de estados | Probar los pasos y cómo se pasa de uno a otro | Funnel: paso 1 → 2 → 3 → resultados → contacto → confirmación; Atrás, Cerrar, Escape (HU-06) |

## 4. Entornos

| Entorno | Para qué | Reglas |
|---|---|---|
| Local | Desarrollar y ejecutar pruebas antes de subir | `pnpm dev` / `pnpm preview`. Las pruebas de carga se hacen aquí, con PHP y MySQL en Docker |
| CI (GitHub Actions) | Verificación automática de cada PR | Node 20, instalación con `--frozen-lockfile`. En E2E, `lead.php` se simula (`page.route`) porque `astro preview` no ejecuta PHP |
| Producción (techsinhumo.com) | Sitio real | **Prohibido** ejecutar E2E o pruebas de carga y crear leads de prueba: escriben en la base de datos real |

## 5. Datos de prueba

- Las pruebas usan **datos propios** (fixtures) en `tests/fixtures/`.
- No dependen de `public/data/*.json`: el PM edita esos archivos y una prueba
  no debe romperse porque cambie una oferta.
- Única excepción: `pnpm validate:data`, cuyo objetivo es precisamente validar
  los datos reales.

## 6. Criterios de entrada y salida

**Definición de Listo (DoR)**: una historia pasa a *Ready* cuando:

- [ ] Tiene el formato Como / Quiero / Para.
- [ ] Todos sus criterios de aceptación se pueden convertir en pruebas.
- [ ] No tiene preguntas abiertas (sin etiqueta `ask-po`).
- [ ] Está estimada y asignada a su épica.

**Definición de Hecho (DoD)**: un PR se fusiona cuando:

- [ ] El título sigue Conventional Commits y el PR está vinculado a su issue.
- [ ] Tiene pruebas nuevas o actualizadas, y la matriz de trazabilidad está al día.
- [ ] El CI está en verde.
- [ ] El Quality Gate de SonarCloud está en verde.
- [ ] No empeora el presupuesto de Lighthouse.
- [ ] La documentación está actualizada si cambia el comportamiento.

## 7. Métricas y umbrales

| Métrica | Umbral | Dónde se mide | Requisito |
|---|---|---|---|
| Cobertura del código nuevo | ≥ 80 % | SonarCloud | RNF-04 |
| Duplicación del código nuevo | ≤ 3 % | SonarCloud | RNF-04 |
| Complejidad cognitiva | ≤ 15 por función | SonarCloud (regla S3776) | RNF-04 |
| Notas de fiabilidad, seguridad y mantenibilidad | A | SonarCloud | RNF-04, RNF-05 |
| Security Hotspots revisados | 100 % | SonarCloud | RNF-05 |
| Dependencias con vulnerabilidad alta o crítica | 0 | `pnpm audit` | RNF-05 |
| Lighthouse Performance (móvil) | ≥ 90 | Lighthouse CI | RNF-01 |
| LCP / CLS / TBT | ≤ 2,5 s / ≤ 0,1 / ≤ 200 ms | Lighthouse CI | RNF-01 |
| `lead.php`: p95 y errores con 20 usuarios | ≤ 500 ms y < 1 % | k6 | RNF-02 |
| Violaciones de accesibilidad graves o críticas | 0 | axe | RNF-03 |

Son umbrales iniciales. Si se cambia alguno, se justifica en el PR que lo modifica.

## 8. Gestión de defectos

1. Se detecta un fallo y se crea un issue con la plantilla **Bug**.
2. Se asigna la **severidad**, el impacto técnico (la decide QA), y la
   **prioridad**, la urgencia de negocio (la decide el PO en el tablero).
3. El bug se marca como *blocked by* en la historia afectada: la historia no
   llega a *Done* con el bug abierto.
4. Se crea una rama `fix/…` y **primero se escribe una prueba que reproduce el
   fallo** (en rojo).
5. Se corrige el código y la prueba pasa a verde.
6. El PR incluye `Closes #<bug>`. La prueba se queda para siempre como
   **prueba de regresión**: si el fallo vuelve, el CI lo detecta.

## 9. Trazabilidad

- Cada requisito se enlaza con sus pruebas en la
  [matriz de trazabilidad](./matriz-trazabilidad.md).
- Convención: el nombre de cada prueba empieza por el ID del requisito y del
  criterio, por ejemplo `HU-04 · CA-1 rechaza teléfonos de 8 dígitos`. Así,
  buscar `HU-04` en el repo muestra todas sus pruebas.

## 10. Riesgos y decisiones

| Riesgo | Decisión |
|---|---|
| SonarCloud no analiza bien los archivos `.astro` | La lógica del funnel se extrae a `.ts` para que se pueda medir y probar (T-05) |
| `lead.php` no tiene cobertura medida | Se excluye de la cobertura de Sonar y su comportamiento se cubre con la tabla de decisión de HU-07. Revisable más adelante con PHPUnit |
| Pruebas E2E frágiles | Seleccionar elementos por rol, texto o `data-testid`, nunca por clases CSS |
| Los datos cambian sin pasar por desarrollo | Validación con zod en build y en CI (`pnpm validate:data`) |
