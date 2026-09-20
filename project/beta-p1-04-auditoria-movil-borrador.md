# P1-04 — Auditoría de experiencia web móvil (borrador)

Estado: **auditoría de código, sin implementar correcciones**
Responsable: Claude (P1-04, `PLAN_BETA_CERRADA_FASE_1.md`)
Fecha: 2026-09-19

## Limitación importante que debes conocer antes de leer esto

**No tengo herramienta de navegador/captura de pantalla en este entorno**
(a diferencia de la sesión de Codex que sí usó una herramienta de control del
navegador anteriormente). No puedo renderizar la app en 360/390/430/768px ni
abrir Android Chrome/iPhone Safari reales para confirmar visualmente nada.

Lo que sí hice: leer el código fuente real (clases de Tailwind, CSS, límites
de altura/ancho, manejo de posición fija, estados de permisos) de los
componentes compartidos con mayor superficie de impacto, y razonar sobre qué
se rompería en un viewport pequeño. Esto encuentra una clase real de
problemas (falta de `max-height`, márgenes que desaparecen en `w-full`,
tamaños de touch target) con alta confianza, pero **no reemplaza confirmarlo
en un teléfono real** — algunas cosas (comportamiento del teclado al abrir,
zonas seguras reales del notch, si un formato de audio realmente graba en
Safari) solo se ven en vivo.

Propongo dos caminos, y puedo seguir cualquiera de los dos según lo que
decidas:

1. Te preparo un guion de verificación manual (lista paso a paso, por ruta y
   por breakpoint) para que tú o alguien del equipo lo ejecute en un
   teléfono real o en las DevTools de Chrome (que sí simulan 360/390/430px
   con bastante fidelidad, aunque no reemplazan Safari real en iOS), y yo
   reviso los resultados/capturas que me compartas.
2. Sigo profundizando la auditoría de código (ruta por ruta, no solo los
   componentes compartidos) mientras Codex termina `P1-00`, para tener la
   lista más completa posible antes de la primera verificación en vivo.

## Inventario de rutas de la beta (P1-04, primer punto del checklist)

Todas bajo `app/[locale]/`:

**Públicas/auth:**
`/`, `/login`, `/register`, `/forgot-password`, `/reset-password`,
`/post-login`

**Onboarding:** `/onboarding`

**Aprendizaje (core):**
`/dashboard`, `/learning-journey`, `/learning-journey/[slug]`,
`/lesson/[slug]`, `/placement-exam`, `/welcome-to-chinese`

**Laboratorios/superficies de Han (las 4 deben verse por separado, por
instrucción explícita del plan):**
`/han` (Han Tutor + Han Companion comparten esta superficie),
`/speaking-lab` (Speaking Lab), Speaking de Learning Journey vive dentro de
`/lesson/[slug]` (paso de tipo speaking), `/writing-lab`

**Progreso/cuenta:** `/achievements`, `/leaderboard`, `/progress`,
`/settings`, `/tienda`

**Ruta QA temporal:** `/speaking-test` — el plan de auditoría integral
(`AUDITORIA_INTEGRAL_Y_PROXIMOS_PASOS.md`, P2-05/BETA-07) ya marcó esta ruta
para retirar antes de la beta; la excluyo de la auditoría de producción por
esa razón, pero la señalo por si sigue accesible.

**Administración** (`app/(admin)/admin/**`): fuera del alcance de "web móvil
para la beta" según el plan (la cohorte no es administradora), pero listo
que existe por si se decide auditar el acceso de emergencia desde móvil.

## Hallazgos confirmados en código (alta confianza, sin necesitar dispositivo)

### 🔴 1. El modal base no cabe en pantallas chicas con contenido largo

`src/components/ui/modal.tsx` (`ModalContent`), usado por **9 componentes**
incluyendo el centro de anuncios (se muestra a cada usuario en cuanto entra a
la app) y la pantalla de resultados de cada lección (se ve después de
*cada* lección completada):

```
"fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 ..."
```

Problemas concretos:

- **Sin margen horizontal.** `w-full` en un elemento `fixed` se mide contra
  el viewport, no contra un contenedor con padding — el modal toca los
  bordes izquierdo y derecho de la pantalla directamente. Ningún consumidor
  (`announcement-center.tsx`, `lesson-results-view.tsx`,
  `delete-account-button.tsx`, etc.) agrega un margen que lo compense.
- **Sin límite de alto ni scroll.** No hay `max-h-[...]` ni
  `overflow-y-auto`. Si el contenido (texto largo de un anuncio, o el
  formulario de "eliminar cuenta" con su confirmación) es más alto que la
  pantalla — algo más probable todavía con el teclado abierto reduciendo el
  alto visible — la parte inferior del modal (a veces el botón de acción
  principal) queda fuera de la pantalla sin ninguna forma de llegar a él.

Esto es exactamente el problema que `PLAN_BETA_CERRADA_FASE_1.md` P1-04
nombra explícitamente ("modales que no quepan en el viewport"), confirmado
en el componente compartido, no en un caso aislado.

**Componentes afectados** (los 9 que importan `ModalContent`):
`achievement-celebration.tsx`, `admin/announcement-form.tsx`,
`admin/coin-grant-form.tsx`, `announcement-center.tsx`,
`coin-celebration.tsx`, `hancoins-info.tsx`, `words-of-the-day-card.tsx`,
`scenario-completion-summary.tsx`, `lesson-results-view.tsx`,
`delete-account-button.tsx`.

### 🟡 2. Sin manejo de zonas seguras (safe-area) del iPhone

No existe ninguna referencia a `env(safe-area-inset-*)` ni `viewport-fit`
en todo el proyecto (`app/`, `src/`). Los dos elementos flotantes fijos en
la parte inferior de cada pantalla móvil usan offsets fijos, no
conscientes de la zona segura:

- `src/components/shell/bottom-nav.tsx`: `fixed inset-x-0 bottom-0`
- `src/components/shell/ai-teacher-bubble.tsx` (burbuja de Han):
  `fixed right-4 bottom-20`

En iPhones con la barra de inicio (todos los modelos actuales sin botón
físico), Apple recomienda ~34pt de margen inferior para que el contenido no
quede pegado a esa franja. Esto no rompe la funcionalidad (los elementos
siguen siendo tocables), pero sí puede sentirse apretado o parcialmente
tapado por el gesto de inicio del sistema — vale la pena confirmarlo en un
iPhone real antes de decidir si amerita una corrección.

### 🟡 3. Botones solo-ícono por debajo del tamaño táctil recomendado

- `src/components/ui/icon-button.tsx` (componente compartido): `size-9`
  = 36×36px. Cumple el mínimo de WCAG 2.2 AA (24×24px) pero queda por
  debajo de la guía específica de Apple (44×44pt) y Android (48×48dp) que
  el plan pide verificar.
- Botones de cerrar ad-hoc que no usan `IconButton` son más chicos todavía:
  `src/components/ui/modal.tsx` y `src/components/shell/ai-teacher-bubble.tsx`
  usan `p-1` alrededor de un ícono `size-4` (16px) → área tocable real de
  ~24×24px, justo en el límite mínimo de WCAG y notablemente por debajo de
  Apple/Android.

Esto afecta principalmente botones de cerrar en modales/diálogos, que son
además el elemento que un usuario frustrado toca más rápido y con menos
precisión.

## Verificado como correcto (no es un hallazgo, confirmado en código)

- **Zoom del usuario no está bloqueado.** No hay `viewport` personalizado
  en ningún layout — Next.js usa el default (`width=device-width,
  initial-scale=1`), sin `maximum-scale` ni `user-scalable=no`. El plan pide
  explícitamente respetar el zoom del usuario; esto ya lo cumple.
- **La burbuja de Han no tapa la navegación inferior.** El botón flotante de
  Han usa `bottom-20` (5rem) en móvil, específicamente para quedar por
  encima de `BottomNav` (`bottom-0`); en desktop (`md:bottom-4`) no hay
  barra inferior que evitar. El panel de chat abierto usa `bottom-24`,
  dejando espacio también sobre el botón flotante. Diseño ya correcto.
- **El contenido no queda oculto detrás de la barra inferior fija.** El
  `<main>` de `AppShell` usa `pb-20 md:pb-4` — compensa la altura de
  `BottomNav` en móvil.
- **Permiso de micrófono con manejo explícito de estados y alternativa de
  texto.** `src/components/speaking/audio-recorder.tsx` define estados
  `requesting-permission`/`permission-denied` explícitos y (según su propio
  comentario) ofrece entrada de texto como alternativa cuando se niega el
  permiso — exactamente lo que pide el plan ("explicar cómo recuperarse
  cuando el permiso sea denegado"). No confirmé el comportamiento visual en
  vivo, pero el manejo de estado existe y está pensado.

## Lo que falta para cerrar P1-04 (pendiente, no bloqueante para seguir)

- Auditoría ruta por ruta de las 20 páginas listadas arriba (esto fue una
  auditoría de componentes compartidos de alto impacto, no exhaustiva por
  ruta).
- Confirmación en vivo (dispositivo real o guion de verificación que
  ejecutes tú) de: comportamiento del teclado al enfocar un campo, safe
  areas reales, formatos de audio soportados en Safari/Chrome, e
  interrupciones (llamada entrante, pantalla bloqueada, pérdida de red).
- Verificación de tablas/tarjetas de administración para interacción táctil
  — no auditado todavía porque el plan marca admin como fuera del alcance
  directo de la cohorte.

## Qué no toqué

Ningún archivo de código fue modificado. Esto es solo lectura y análisis,
consistente con la instrucción de no implementar hasta que confirmes el
cierre de `P1-00` de Codex.
