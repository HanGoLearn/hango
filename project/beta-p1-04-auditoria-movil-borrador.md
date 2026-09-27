# P1-04 — Auditoría de experiencia web móvil (borrador)

Estado: **auditoría de código + correcciones visuales/responsive
implementadas (autorizadas explícitamente por el usuario el 2026-09-20),
sin commit todavía**
Responsable: Claude (P1-04, `PLAN_BETA_CERRADA_FASE_1.md`)
Fecha: 2026-09-19 (auditoría) / 2026-09-20 (implementación)

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

## Actualización 2026-09-19 (segunda pasada + una confirmación en vivo)

### 🔴 4. Confirmado en vivo: el mascote de la tarjeta de demo de la portada no es responsive

Mientras probábamos en un celular real, el usuario reportó que la página de
inicio "se ve mal, incompleto". Revisé `src/components/marketing/hero-demo-card.tsx`
y encontré la causa exacta, ya sin necesidad de adivinar:

```
<HanMascot pose={poseForState(tab, selected)} size={340} />
```

Un mascote de **340px de ancho fijo**, sin ninguna variante más chica para
pantallas angostas, dentro de una tarjeta cuyo espacio interno disponible en
un celular de 360px ronda los 280px (después de los paddings de la sección
y de la tarjeta). El mascote es más ancho que el espacio donde vive.

El wrapper de toda la portada (`home-hero.tsx`) tiene `overflow-x-hidden` —
esto significa que, en vez de mostrar una barra de scroll horizontal que
delataría el problema, **el contenido que se sale simplemente se corta en
silencio**. Esto explica exactamente lo que se reportó: no un error visible
obvio, sino contenido que "se ve mal, incompleto".

Esta es la primera vez en esta auditoría que un hallazgo de código se
confirma con un reporte real de uso — sube mi confianza en el resto de los
hallazgos de esta misma naturaleza (problemas de ancho/alto fijo sin
adaptación móvil).

### Confirmado como correcto (segunda pasada)

- **Tipos de teclado correctos en formularios de autenticación.**
  `login-form.tsx`/`register-form.tsx` usan `type="email"`, `type="password"`
  y `autoComplete` apropiado (`email`, `current-password`, `new-password`,
  `name`) — esto activa el teclado correcto en el celular y permite que los
  gestores de contraseñas funcionen. Ya está bien hecho.
- **El asistente de onboarding no pelea con el teclado.** Es contenido en
  flujo normal de la página (no un modal ni algo con posición fija/altura
  fija), así que cuando el teclado se abre, el navegador lo maneja de forma
  nativa sin necesitar ningún ajuste especial.
- **La selección de minutos diarios de estudio usa botones, no un campo de
  texto numérico.** Evita el teclado por completo para ese dato — patrón
  correcto para móvil.

### Pendiente de revisar (no alcanzó esta pasada)

Las tablas de administración (`app/(admin)/admin/**`) no se revisaron a
fondo para interacción táctil — el plan ya marca administración como fuera
del alcance directo de la cohorte de la beta, así que quedó en prioridad
baja, no olvidado.

## Problema de inicio de sesión con Google — evidencia exacta (2026-09-20)

**Corrección importante:** la nota anterior de este documento afirmaba que
esto "coincide con el commit `84ac0d5`" sin evidencia real — era una
suposición, no un hecho verificado. El usuario me pidió corregirlo con
evidencia real en vez de especular. Esto es lo que de verdad se observó,
reproducido dos veces (ventana normal y ventana de incógnito, cuenta
`arean.mendoza@unmsm.edu.pe`, ambas con resultado idéntico — descarta que
sea por una sesión o cookie vieja):

**1. Mensaje mostrado por HanGo:** ninguno — el navegador nunca llegó a
recibir respuesta de HanGo en la URL final, así que la pantalla de error
propia de HanGo (`getAuthErrorMessage`, que sí existe y traduce el código
`Configuration`) nunca se llegó a renderizar.

**2. URL final y su `?error=`:**
```
http://0.0.0.0:3000/login?error=Configuration
```
El navegador muestra su propio error genérico ("This site can't be
reached... ERR_ADDRESS_INVALID") porque `0.0.0.0` no es una dirección a la
que un navegador pueda conectarse — es la dirección de "escuchar en todas
las interfaces" que yo mismo usé para exponer el servidor a un celular en
la misma red. Esta parte específica (el `0.0.0.0` en la URL) es efecto de
mi configuración de prueba, no necesariamente del código de la app — no lo
afirmo con certeza porque no lo aislé más a fondo, y no me corresponde
seguir investigando la causa exacta dentro de la configuración de Auth.js.

**3. Error real del servidor durante el retorno de Google** (capturado en
la terminal, en el momento exacto de la reproducción):

```
[auth][error] CallbackRouteError
[auth][cause]: ResponseBodyError: server responded with an error in the response body
[auth][details]: {
  "error": "invalid_request",
  "error_description": "You can't sign in to this app because it doesn't
    comply with Google's OAuth 2.0 policy for keeping apps secure. You can
    let the app developer know that this app doesn't comply with one or
    more Google validation rules.",
  "provider": "google"
}
```

Esto ocurre en `GET /api/auth/callback/google?...` — es decir, **después**
de que el usuario se autentica correctamente en Google y Google redirige de
vuelta a HanGo con un código válido. El rechazo (`invalid_request`) viene
del propio servidor de Google al intentar canjear ese código por un token,
no de una validación que haga el código de HanGo.

**4. ¿Sucede en ventana privada, sin sesión previa?** Sí, exactamente igual
— mismo error, misma URL final, en ambos casos.

**Conclusión (sin especular más allá de la evidencia):** el rechazo venía
literalmente de Google ("doesn't comply with Google's OAuth 2.0 policy"),
no de un `CallbackRouteError` genérico de la app. Esto apuntaba a la
configuración del proyecto/consentimiento OAuth de HanGo en Google Cloud
Console (estado de verificación, scopes solicitados, o URIs de redirección
autorizadas) — algo que se administra fuera del repositorio, no en el
código que yo pueda leer o tocar.

### Resuelto — 2026-09-20

El usuario confirmó la causa real: la prueba anterior entraba por
`http://0.0.0.0:3000/...` (mi propia configuración para exponer el
servidor a un celular en la misma red), no por `http://localhost:3000/`.
Al entrar por `http://localhost:3000/es/login` con el botón de Google y la
misma cuenta (`arean.mendoza@unmsm.edu.pe`), el inicio de sesión funcionó
correctamente. Esto confirma la advertencia del punto 2 de arriba (que
sospechaba de `0.0.0.0` sin poder confirmarlo): Google Cloud Console tiene
registrado `http://localhost:3000` como origen/redirect autorizado, pero
no `http://0.0.0.0:3000` — por eso Google rechazaba el intercambio de
token solo en esa forma de acceder, no por un problema real de
configuración OAuth ni de código de HanGo.

**Estado: incidente cerrado en PC.** No se modificó autenticación,
variables OAuth, Prisma ni Google Cloud Console — no hacía falta, no era
un bug.

**Pendiente para celulares:** cuando se pruebe desde un celular real, no
se puede usar ni `localhost` (el celular no puede resolverlo) ni `0.0.0.0`
(rechazado por Google, como se documentó arriba). La verificación de
Google Sign-In desde un celular queda pendiente hasta que exista un
dominio HTTPS real de la beta (ej. un subdominio de `vercel.app` o el
dominio final) — ese dominio también tendría que estar registrado como
origen/redirect autorizado en Google Cloud Console. Esto es una decisión
de despliegue/infraestructura, no algo que yo deba o pueda resolver desde
aquí. Mientras tanto, correo/contraseña sigue siendo la vía de prueba
viable en celular.

## Actualización 2026-09-19 (tercera pasada: pasos de lección)

### 🟢 Confirmado como correcto

- **El panel de ayuda de Speaking (`speaking-step.tsx`) sí tiene límite de
  alto y scroll** (`max-h-[40rem] overflow-y-auto`) — a diferencia del modal
  base, este SÍ está bien construido para no salirse de la pantalla. En
  móvil, cuando se abre la ayuda, se apila verticalmente debajo de la
  conversación en vez de generar una columna angosta — comportamiento
  correcto.

### 🟢 Sugerencia menor (no es un bug, es una mejora posible)

- **Captura de fotos para Writing Lab** (`handwritten-paragraph.tsx`): el
  input de archivo no tiene el atributo `capture="environment"`. La mayoría
  de navegadores móviles modernos igual ofrecen la opción de "Tomar foto"
  en el selector nativo aunque falte este atributo, así que no debería estar
  roto — pero agregarlo haría que el botón vaya directo a la cámara en vez
  de mostrar primero el selector genérico. Prioridad baja, confirmar en
  dispositivo real antes de decidir si vale la pena.

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

## Implementación 2026-09-20 — 4 correcciones visuales/responsive

El usuario autorizó explícitamente implementar únicamente estas 4
correcciones ya identificadas arriba, sin esperar a `P1-00`, mientras el
resto de la auditoría (rutas no revisadas, confirmación en dispositivo
real) sigue pendiente. Ningún archivo de autenticación, Prisma,
migraciones, `package.json`/CI, ni de Han (Tutor/Companion/Speaking Lab o
sus prompts) fue tocado — se verificó con `git diff --stat` al terminar.

### Archivos cambiados

- `app/[locale]/layout.tsx` — se agregó `export const viewport` con
  `viewportFit: "cover"` (además de `width`/`initialScale`, que ya eran el
  comportamiento por defecto de Next.js). Sin esto, `env(safe-area-inset-*)`
  en CSS siempre vale `0px` en Safari/iOS, así que era un prerequisito para
  el punto de zonas seguras. **No se tocó `maximumScale` ni
  `userScalable`** — el hallazgo previo de que el zoom no estaba bloqueado
  sigue intacto.
- `src/components/ui/modal.tsx` (`ModalContent`, usado por los 9
  consumidores listados en la auditoría original):
  - `w-full` → `w-[calc(100%-2rem)]`: en desktop, `max-w-md` (28rem) sigue
    siendo el límite real (28rem < cualquier `calc(100%-2rem)` de una
    pantalla de escritorio), así que el ancho en desktop no cambia. En
    móvil, esto deja un margen de 1rem (16px) a cada lado en vez de tocar
    borde a borde.
  - Se agregó `max-h-[85vh] overflow-y-auto`: el modal nunca excede 85% del
    alto de la ventana y hace scroll interno si el contenido es más largo.
    En desktop, el contenido típico de estos modales (confirmaciones,
    formularios cortos) no llega a 85vh, así que no debería notarse ningún
    cambio visual ahí — solo actúa como red de seguridad.
  - Botón de cerrar: `p-1` (área táctil ~24×24px) → `p-3.5` (14px de
    padding alrededor del ícono de 16px = ~44×44px), manteniendo
    `top-4 right-4` sin cambios para que el ícono siga anclado visualmente
    en la misma esquina.
- `src/components/shell/ai-teacher-bubble.tsx` (envoltorio/launcher de Han,
  no su lógica de conversación — `AiTeacherChat`/`HanVoiceConversation` no
  se tocaron):
  - Botón de disparo (burbuja flotante): `bottom-20` → móvil
    `bottom-[calc(5rem+env(safe-area-inset-bottom))]`, desktop `md:bottom-4`
    sin cambios.
  - Panel del chat: `top-20`/`bottom-24` (móvil) → se sumó
    `env(safe-area-inset-top)`/`env(safe-area-inset-bottom)` a esos mismos
    valores; los valores `sm:` y superiores (desktop/tablet) quedaron
    idénticos.
  - Botón de cerrar del panel: mismo patrón `p-1` → `p-3.5` que en
    `modal.tsx`, con `-m-2` para que el área táctil crezca sin empujar la
    fila del encabezado (donde vive junto al título "Han").
- `src/components/shell/bottom-nav.tsx` — se agregó
  `pb-[env(safe-area-inset-bottom)]` a la barra (que ya es `md:hidden`, o
  sea solo afecta móvil). En un teléfono sin zona segura (Android típico,
  iPhone sin notch/home indicator) este valor es `0px` y no cambia nada.
- `src/components/shell/app-shell.tsx` — el `<main>` que compensa la altura
  de `BottomNav` con `pb-20`: se cambió a
  `pb-[calc(5rem+env(safe-area-inset-bottom))]` (solo móvil, `md:pb-4` sin
  cambios) para que el último contenido de la página no quede tapado
  cuando `BottomNav` crece por la zona segura.
- `src/components/marketing/hero-demo-card.tsx` — el mascote de la portada
  (`<HanMascot size={340} />`) desbordaba en móvil porque `size` es un
  ancho fijo en píxeles, no una clase responsive. Se envolvió con
  `scale-[0.55] sm:scale-100`: `transform: scale()` no cambia el tamaño de
  layout que usa el contenedor flex para centrar, pero sí el tamaño
  pintado/visible, así que dejó de desbordar sin tocar el componente
  compartido `HanMascot` (usado en 12 lugares más) ni su prop `size`. En
  `sm:` y superiores, `scale-100` es un no-op — el desktop se renderiza
  exactamente igual que antes.

### No se tocó (aunque se encontró en esta pasada)

- `src/components/marketing/home-sections.tsx:374` — otro `<HanMascot
  size={390} />` (sección "Han" de la portada) con el mismo problema de
  ancho fijo, dentro de un contenedor con `overflow-hidden` que también lo
  recortaría en móvil. No estaba en la lista de 4 correcciones que
  autorizaste, así que lo dejo señalado aquí como hallazgo nuevo en vez de
  corregirlo — queda pendiente de tu autorización si quieres que lo
  incluya.
- El componente compartido `IconButton` (`src/components/ui/icon-button.tsx`,
  `size-9` = 36×36px) sigue por debajo de 44px, pero se usa en muchas
  pantallas que no son "botones de cerrar" — la instrucción pedía
  específicamente botones de cierre, así que no lo amplié para no cambiar
  el tamaño de botones de otras pantallas sin que me lo pidas.

### Verificaciones ejecutadas (todas en verde)

- `npm run typecheck` — sin errores.
- `npm run lint` — sin errores.
- `npm run build` (build de producción con Turbopack) — compiló y generó
  las 57 páginas estáticas/dinámicas sin errores.
- `npm run test:component` — 69/69 tests pasaron (17 archivos).
- `npm run test:a11y` — 9/9 tests pasaron.

No corrí `npm run test:integration` porque no toca lógica de servidor ni de
base de datos — estos cambios son solo clases de Tailwind y un export de
`viewport`.

### Asuntos todavía pendientes (no resueltos en esta pasada)

- **Confirmación visual real**: seguí sin herramienta de navegador/captura
  en mi entorno. Estas correcciones están razonadas desde el CSS/Tailwind
  con alta confianza (y el build/tests las validan a nivel técnico), pero
  no las vi renderizadas en un teléfono real ni en DevTools. Cuando puedas
  probar en tu celular otra vez, lo que más quiero que confirmes es: (1) el
  mascote de la portada ya no se ve cortado/incompleto, (2) los modales
  (por ejemplo, al eliminar una cuenta o ver un logro) se pueden cerrar
  cómodamente con el dedo y no tapan contenido, (3) la burbuja de Han y la
  barra inferior no quedan pegadas al borde físico del iPhone si tienes uno
  con notch/Dynamic Island.
- ~~El error de Google al iniciar sesión sigue sin resolverse~~ — **resuelto
  2026-09-20**, ver sección de evidencia arriba: era `0.0.0.0` vs.
  `localhost`, no un bug. Pendiente solo para celulares, ligado a tener un
  dominio HTTPS real de la beta.
- ~~`home-sections.tsx` con el mismo problema de mascote fijo~~ —
  **corregido 2026-09-20**, ver sección de implementación siguiente.
- El resto de "Lo que falta para cerrar P1-04" (auditoría ruta por ruta
  completa, verificación de teclado/audio en vivo) sigue igual de pendiente
  que antes de esta pasada.

## Implementación 2026-09-20 — segunda pasada (4 pendientes de P1-04)

Continuación de la pasada anterior, misma autorización explícita del
usuario, mismo alcance: sin tocar autenticación, variables OAuth, Prisma,
Google Cloud, ni Han (Tutor/Companion/Speaking Lab, prompts, voz,
transcripción, pedagogía). Sin commit.

### 1. Segundo mascote fijo (`home-sections.tsx`)

`src/components/marketing/home-sections.tsx` — el `<HanMascot size={390} />`
de la sección "Han" de la portada tenía el mismo problema que ya se había
corregido en `HeroDemoCard`: ancho fijo en píxeles más ancho que la
pantalla disponible en móvil, recortado en silencio por el
`overflow-hidden` de su propio contenedor. Misma solución aplicada:
envolver en un `<div className="scale-[0.55] sm:scale-100">` — no cambia
el tamaño de layout que usa `items-center justify-center` para centrar,
solo el tamaño pintado, y `sm:scale-100` es un no-op que deja el desktop
exactamente igual. No se tocó el componente compartido `HanMascot` (usado
en 13 lugares en total, contando este).

### 2. Modal: `dvh` en vez de `vh`

`src/components/ui/modal.tsx` — `max-h-[85vh]` → `max-h-[85dvh]`. `vh` es
un valor fijo del *layout viewport* que no se reduce cuando el navegador
móvil oculta/muestra su barra de direcciones o cuando aparece el teclado;
`dvh` (dynamic viewport height) sí seguía el área realmente visible. Esto
ya era un patrón existente en el código: `admin/announcement-form.tsx` ya
usaba `max-h-[90dvh]` en su propio override, así que esto lo hace
consistente con lo que ya existía, no introduce un patrón nuevo.

También encontré y actualicé `src/components/avatar/hancoins-info.tsx`,
que tenía su propio override `max-h-[85vh]` (heredado de mi primera pasada,
antes de tener `dvh` como base) — lo cambié a `max-h-[85dvh]` por la misma
razón.

**Límite honesto de este cambio:** `dvh` mejora el seguimiento de la altura
de la ventana visible en general (barra de direcciones, orientación), pero
no todos los navegadores garantizan que se recalcule exactamente cuando se
abre el teclado en pantalla — el comportamiento real con teclado abierto
solo se puede confirmar en un dispositivo real, no leyendo CSS. Lo dejo
como pendiente de confirmación en vivo, no como "ya resuelto".

### 3. Verificación de que el botón de cerrar (44px) no tapa títulos

Revisé los 9 consumidores de `ModalContent` uno por uno, viendo la
posición real del `ModalTitle` respecto a la esquina superior derecha
(donde vive el botón de cerrar, ahora con una caja de toque de ~44×44px
en vez de ~24×24px):

- **Sin riesgo, confirmado por estructura** (el título aparece bien abajo
  de la zona del botón, o el modal es lo bastante ancho): `achievement-
  celebration.tsx`, `coin-celebration.tsx` (mascote/monto antes del
  título), `announcement-center.tsx` (icono + etiqueta antes del título),
  `announcement-form.tsx` (`max-w-2xl`, mucho más ancho que el texto),
  `coin-grant-form.tsx`, `scenario-completion-summary.tsx`,
  `delete-account-button.tsx` (títulos cortos, "¿Eliminar tu cuenta?"),
  `words-of-the-day-card.tsx` (título `sr-only`, no se renderiza
  visualmente).
- **Riesgo real encontrado y corregido — `hancoins-info.tsx`:** tiene un
  encabezado de color a todo el ancho (`p-0` en `ModalContent`, sin el
  padding de 24px que en los demás consumidores ya alejaba el contenido
  del botón). Le agregué `pr-16` (64px) al bloque flexible del título para
  garantizar que el texto nunca entre en la zona de toque del botón
  (que alcanza 60px desde la esquina).
- **Riesgo moderado encontrado y corregido — `lesson-results-view.tsx`:**
  el título en español ("¿Quieres repetir esta lección?", 31 caracteres) es
  lo bastante largo para acercarse al borde del modal en su ancho por
  defecto (`max-w-md`). Le agregué `pr-10` al `ModalTitle` de ese modal
  específico.

No apliqué el `padding` al componente compartido `ModalTitle` en general
porque varios consumidores lo usan centrado (`text-center`) — agregarle
padding ahí habría desplazado visualmente el texto del centro real del
modal en esos casos. Preferí corregir los dos casos concretos de riesgo en
vez de un cambio global con un efecto secundario distinto.

Esto es análisis de estructura/CSS, no una captura de pantalla — no puedo
confirmar visualmente que quedó perfecto en los 9 casos, solo que la
lógica de posición (distancias, anchos de texto conocidos) no indica
colisión.

### 4. Continuación de la auditoría estática (360/390/430/768px)

**Importante:** todo lo de esta sección es lectura de código y razonamiento
sobre CSS, igual que el resto de este documento — no rendericé nada, no
hay captura de pantalla, no estoy afirmando "lo vi funcionar en un
teléfono".

Barrido adicional sobre `app/` y `src/components/` (fuera de lo ya cubierto
en las pasadas anteriores):

- **Anchos fijos en píxeles (`w-[Npx]`, `min-w-[Npx]`):** el único lugar
  donde aparecen es en tablas del panel de administración (`admin/
  communications`, `admin/analytics`, `admin/users`, `admin/operations`,
  `admin/limits`) — 10 tablas con `min-w-[520px]` a `min-w-[1080px]`. El
  plan marca admin como fuera del alcance directo de la cohorte de beta,
  así que no las audité a fondo (no confirmé si están envueltas en un
  contenedor con `overflow-x-auto`), solo dejo registrado que existen.
  Ninguna ruta de aprendizaje (`app/[locale]/(app)/...` fuera de admin)
  tiene este patrón.
- **`overflow-x-hidden`:** solo existe en `home-hero.tsx` (el que ya
  investigué a fondo por el mascote). No hay otro lugar en el código donde
  contenido pueda estar siendo recortado en silencio de la misma forma.
- **Grids de múltiples columnas en móvil** (`animal-grid.tsx`,
  `word-reveal-grid.tsx`, `tone-demo.tsx`, `journey-chapters.tsx`): todos
  usan 2-3 columnas en móvil y escalan hacia arriba en `sm:`, ya es el
  patrón correcto (menos columnas en pantallas chicas) — no encontré un
  grid con columnas fijas que ignore el tamaño de pantalla.
- **Nuevo hallazgo, no corregido (fuera de las 4 correcciones
  autorizadas):** `src/components/avatar/coin-celebration.tsx:112` — un
  toast fijo (`fixed inset-x-0 bottom-20 ... md:bottom-6`) con el mismo
  patrón que `BottomNav`/`AiTeacherBubble` tenían antes de esta pasada
  (posición fija cerca del borde inferior, sin `env(safe-area-inset-
  bottom)`). No lo corregí porque no estaba en la lista de 4 correcciones
  que autorizaste; queda documentado para que decidas si lo incluyes en
  una próxima pasada.
- **`IconButton` compartido** (`src/components/ui/icon-button.tsx`,
  36×36px, usado en 7 archivos): sigue sin llegar a 44px. Como ya se
  documentó antes, no lo amplié porque tu instrucción fue específicamente
  sobre "botones de cierre", y ampliar este componente afectaría pantallas
  que no son de cierre sin que me lo hayas pedido.
- Rutas que aún no revisé línea por línea en esta pasada (siguen abiertas
  para una próxima ronda si quieres profundizar más antes de una prueba en
  vivo): `speaking-lab`, `writing-lab`, `placement-exam`, `speaking-test`,
  `progress`, `leaderboard`, `tienda`, `settings` — revisé sus componentes
  compartidos de más alto riesgo (grids, anchos fijos, `overflow-x-hidden`)
  pero no cada archivo de cada ruta en detalle.

### Archivos cambiados en esta segunda pasada

- `src/components/marketing/home-sections.tsx`
- `src/components/ui/modal.tsx`
- `src/components/avatar/hancoins-info.tsx`
- `src/components/lesson/lesson-results-view.tsx`
- `project/beta-p1-04-auditoria-movil-borrador.md` (este documento, incluida
  la actualización de la sección de Google como resuelta)

### Verificaciones ejecutadas en esta segunda pasada (todas en verde)

- `npm run typecheck` — sin errores.
- `npm run lint` — sin errores.
- `npm run build` (Turbopack, producción) — sin errores.
- `npm run test:component` — 69/69 tests pasaron.
- `npm run test:a11y` — 9/9 tests pasaron.

## Qué no se tocó (acumulado, ambas pasadas y revisión de Codex)

En total, entre las dos pasadas de implementación, los archivos de código
modificados son: `app/[locale]/layout.tsx`, `src/components/ui/modal.tsx`,
`src/components/shell/ai-teacher-bubble.tsx`,
`src/components/shell/bottom-nav.tsx`, `src/components/shell/app-shell.tsx`,
`src/components/marketing/hero-demo-card.tsx`,
`src/components/marketing/home-sections.tsx`,
`src/components/avatar/coin-celebration.tsx`,
`src/components/avatar/hancoins-info.tsx`,
`src/components/lesson/lesson-results-view.tsx`. Nada de autenticación,
variables OAuth, Prisma, migraciones, Google Cloud Console,
`package.json`/`vercel.json`/CI, ni de la personalidad/pedagogía/prompts/
voz/transcripción de Han (Tutor, Companion, Speaking de Learning Journey,
Speaking Lab) fue tocado. No se hizo commit ni push — queda pendiente de tu
confirmación y de que Codex haga la revisión visual e integración, según tu
instrucción.

## Revisión visual de Codex — 2026-09-20

Codex revisó la portada real servida desde `localhost` con viewports de 360,
390, 430 y 768 px. La revisión combinó capturas renderizadas y mediciones del
viewport/documento; no se limitó a leer clases CSS.

- Los dos mascotes corregidos se ven completos y centrados en móvil. Las tres
  pestañas de la demostración (`Contexto`, `Práctica`, `Misión`) se probaron
  de forma interactiva a 360 px y conservaron contenido legible.
- La pantalla de inicio de sesión se comprobó a 360 px sin desbordamiento ni
  controles cortados.
- Se encontró un problema adicional real: el wrapper de `HeroDemoCard`
  conservaba un ancho mínimo implícito por su contenido. A 360 px, la rejilla
  disponible medía 305 px pero la tarjeta y sus pestañas medían 382/380 px,
  quedando recortadas por `overflow-x-hidden`. Se agregó `min-w-0` al wrapper.
  Después de la corrección, tarjeta y pestañas miden 305/303 px y permanecen
  dentro del viewport. El documento no presenta scroll horizontal en ninguno
  de los cuatro anchos comprobados.
- El toast de `coin-celebration.tsx` documentado por Claude recibió la misma
  compensación de `safe-area-inset-bottom` que la navegación y la burbuja
  lateral, manteniendo intacto su offset de escritorio.

Pendiente de dispositivo real: el notch/Dynamic Island, el teclado virtual y
los permisos/interrupciones de audio no se pueden reproducir de forma fiable
con un viewport de escritorio. Los modales autenticados también requieren una
sesión de prueba dentro del navegador de QA para su comprobación visual final;
su estructura, límites dinámicos y espacios para el cierre sí quedaron
revisados en código y cubiertos por el gate automatizado documentado arriba.

## Auditoría de solo lectura — rutas pendientes (2026-09-20, Claude)

Por instrucción explícita del usuario: **solo lectura de código, ninguna
corrección implementada en esta pasada** — Codex está integrando el lote
anterior y no quería más archivos en movimiento a la vez. Cubre las 7 rutas
que quedaban sin revisar de P1-04: Speaking Lab, Writing Lab, Placement
Exam, Progress, Leaderboard, Tienda, Settings.

**Método y su límite honesto:** no es una lectura línea por línea de cada
archivo de cada ruta. Fue un barrido dirigido (`grep`) sobre los
componentes principales de cada ruta buscando los mismos patrones de
riesgo que ya dieron hallazgos reales en pasadas anteriores — anchos
fijos, `overflow-hidden`, grids sin variante responsive, texto de usuario
sin `truncate`/`min-w-0` en un contenedor flex, botones solo-ícono
pequeños — y luego leí el contexto completo de cada coincidencia relevante
para decidir si era un riesgo real o un falso positivo. No vi nada
renderizado; no hay captura de pantalla; todo lo de abajo es una
predicción fundada en cómo se comporta el CSS, no una confirmación visual.

### 🔴 Crítico

Ninguno encontrado en esta pasada. Ninguna de las 7 rutas tiene un ancho
fijo en píxeles, un `overflow-hidden` recortando contenido, o un grid sin
variante responsive — los mismos patrones que sí produjeron hallazgos
críticos reales en `HeroDemoCard`/`home-sections.tsx` (mascotes) y en
`modal.tsx` en pasadas anteriores no aparecen aquí.

### 🟡 Importante

**Leaderboard — nombre de usuario sin truncar puede chocar con el puntaje
(`app/[locale]/(app)/leaderboard/page.tsx:130`):**

```tsx
<span className="flex-1 font-interface text-body font-medium text-text-primary">
  @{entry.accountName}
  ...
</span>
```

Esta fila usa `flex items-center gap-3` con una insignia de posición (36px),
opcionalmente un avatar (36px), este `span` de nombre con `flex-1`, y el
puntaje al final. El `span` no tiene `truncate`, `min-w-0` ni
`overflow-hidden`. Por defecto CSS, un ítem flex no se encoge por debajo
del ancho natural de su contenido (`min-width: auto`) a menos que se le
diga explícitamente — así que si `accountName` (elegido libremente por
cada usuario al crear su cuenta, no una lista acotada) es largo, en un
teléfono angosto (360px) el nombre puede empujar el puntaje fuera de la
fila en vez de cortarse con "...". No pasa con nombres cortos, así que no
es un bloqueo general, pero sí es plausible con cualquier cohorte real
donde la gente elige su propio nombre de cuenta.

**Corregido — 2026-09-20** (autorizado explícitamente por el usuario,
fuera de la instrucción original de "solo lectura" de esta pasada): se
agregó `min-w-0 truncate` al `span`. Verificado con typecheck, lint,
build y `test:component` (69/69) — todos en verde. Sin captura de
pantalla, sigue pendiente de confirmación visual en vivo con un nombre de
cuenta largo real.

### 🟢 Mejora opcional

Nada encontrado con seguridad suficiente para listarlo como una mejora
concreta en esta pasada — los botones "Volver" con ícono+texto en Speaking
Lab/Writing Lab, los grids de opciones de Speaking Lab (`grid-cols-2
sm:grid-cols-3`), y las secciones de Settings (avatar, nombre, retención de
grabación) no mostraron el mismo patrón de riesgo que ya se corrigió en
otros lugares. Esto no es lo mismo que "confirmado sin problemas" — solo
que el barrido dirigido no encontró nada que valga la pena señalar todavía;
una lectura más profunda o una prueba en vivo podría encontrar algo que
este método no ve (por ejemplo, comportamiento del teclado al escribir en
Writing Lab, o del temporizador del examen de ubicación bajo presión de
tiempo — ninguno de los dos es visible leyendo clases de Tailwind).

### Resumen para decidir el siguiente paso

Un solo hallazgo real (`leaderboard`), de severidad moderada, no crítico —
ya corregido (ver arriba). El resto de las 7 rutas no mostró la misma
clase de problemas que sí se encontraron y corrigieron en el resto de la
app — pero esto refleja los límites del
método (grep dirigido, no lectura exhaustiva ni dispositivo real), no una
garantía de que estén perfectas.

## Revisión de integración del lote ampliado — 2026-09-20, Codex

La entrega pendiente ya no contenía únicamente ajustes responsive: también
reorganizaba Dashboard, navegación, onboarding, Progress y la presentación de
recompensas al terminar una lección. Codex revisó ese alcance adicional antes
de combinarlo con la plataforma de beta.

- Se confirmó que Learning Journey Speaking, Speaking Lab, Writing Lab y los
  sistemas de Han continúan siendo superficies distintas; solo cambió su
  agrupación visual en la navegación.
- El Dashboard había retirado visualmente los resúmenes de competencias,
  leaderboard, logros y avatar, pero `getDashboardData` todavía ejecutaba todas
  sus consultas. Se eliminaron esas lecturas y campos ya no consumidos, sin
  cambiar el diseño ni los datos de Progress, Leaderboard, Achievements o
  Tienda.
- Se corrigió el comentario de `LessonRewardsPanel`: avatar y rango sí se
  reutilizan mediante caché por solicitud, mientras que el resumen de logros y
  el asiento de monedas se consultan una sola vez al mostrar el resultado.
- TypeScript y ESLint pasan. La prueba real del Dashboard pasó 3/3 contra una
  base PostgreSQL temporal creada desde cero con las 64 migraciones del árbol
  principal y el currículo completo.

Esta revisión no hace commit, no mezcla todavía `codex/beta-platform` y no
modifica personalidad, prompts, pedagogía, voz ni transcripción de Han.
