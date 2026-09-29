# HanGo — Plan de ejecución para la beta cerrada (Fase 1)

Estado: preparado para aprobación

Fecha de referencia: 2026-09-19

## 1. Resultado esperado

Publicar una versión web móvil de HanGo para una primera cohorte de 10 a 30
personas invitadas. Cada participante abrirá una URL HTTPS en Chrome o Safari,
sin instalar una aplicación ni descargar un APK. La beta tendrá datos aislados
del desarrollo local, acceso controlado, costos limitados y una forma clara de
observar errores, aprendizaje y feedback.

Esta fase no es un lanzamiento público. Su objetivo es comprobar con usuarios
reales si HanGo entrega valor educativo, si los flujos principales se entienden
y cuánto cuesta operar el producto antes de ampliar el acceso.

## 2. Límites explícitos

- No modificar la personalidad, pedagogía, prompts, voz o transcripción de Han.
- Mantener separados Han Tutor, Han Companion, Speaking de Learning Journey y
  Speaking Lab.
- No desarrollar PWA, APK, pagos, suscripciones ni un registro público.
- No incorporar contenido curricular nuevo ni rediseñar la interfaz general.
- No activar RLS ni cambiar la arquitectura completa de autenticación para esta
  cohorte.
- No copiar datos personales del entorno actual al entorno de beta.
- No desplegar desde un árbol de trabajo ambiguo o sin una línea base aprobada.

## 3. Base ya disponible y que debe reutilizarse

HanGo ya cuenta con:

- autenticación, verificación de correo y recuperación de contraseña;
- rate limiting de autenticación e inicio de sesión con honeypot;
- aislamiento de recursos por usuario y pruebas IDOR;
- validación profunda de audio e imágenes;
- retención configurable, borrado de cuenta y outbox de borrado de objetos;
- límites diarios de IA por función y excepciones por usuario;
- registro de costo y resultado operativo de llamadas de IA;
- dashboard de activación, actividad, retención y uso por superficie;
- anuncios mostrados al iniciar HanGo y confirmación de lectura;
- mensajes y otorgamiento administrativo de HanCoins;
- CI con base PostgreSQL vacía, migraciones, seed, build y pruebas;
- escaneo local y en CI de secretos y dependencias.

No se reconstruirán estas capacidades. Se cerrarán únicamente sus dependencias
operativas para una beta real.

## 4. Arquitectura mínima de la beta

| Componente | Decisión recomendada                                   | Regla de aislamiento                                |
| ---------- | ------------------------------------------------------ | --------------------------------------------------- |
| Aplicación | Proyecto de despliegue exclusivo para la beta          | No compartir variables con local                    |
| Cliente    | Web móvil responsive en Chrome y Safari                | Sin instalación, offline ni caché de datos privados |
| Dominio    | Subdominio HTTPS de beta                               | No indexable por buscadores                         |
| PostgreSQL | Base exclusiva en el proveedor elegido                 | Sin usuarios reales previos                         |
| Archivos   | Bucket cloud privado mediante el adaptador existente   | Nunca usar URLs públicas permanentes                |
| Correo     | Resend, cuyo adaptador ya existe                       | Dominio/remitente de beta verificado                |
| IA         | Proyecto o clave de OpenAI para beta                   | Presupuesto externo bajo y límites internos         |
| Cron       | Secreto exclusivo de alta entropía                     | Solo tareas autenticadas                            |
| Errores    | Proveedor de monitorización o canal operativo acordado | Sin prompts, tokens, audio ni PII en eventos        |

Los secretos se cargarán directamente en el proveedor de despliegue. No se
enviarán por chat, no se guardarán en archivos del repositorio y no se
reutilizarán entre entornos.

## 5. División de responsabilidades Codex / Claude

La división se organiza por propiedad técnica para evitar que ambos asistentes
modifiquen simultáneamente los mismos archivos. Claude no recibe esta asignación
automáticamente: debe leer este documento al comenzar cada bloque.

| Lote    | Codex                                                                                                | Claude                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `P1-00` | Reconciliar árbol, ejecutar gate, mantener tablero y crear punto de recuperación autorizado          | No modificar código; revisar el plan y declarar cualquier trabajo previo no integrado         |
| `P1-01` | Modelo, migración, enforcement de invitaciones en credenciales/OAuth, administración y pruebas       | Revisar claridad de los mensajes de beta por invitación, sin tocar autenticación              |
| `P1-02` | Consentimiento versionado, enforcement, persistencia y pruebas                                       | Redactar privacidad, términos, aviso de IA y aviso de beta en ES/EN; revisar UX de aceptación |
| `P1-03` | Hosting técnico, DB, storage, correo, cron, secretos, backups, migraciones y pruebas                 | Revisar instrucciones no técnicas para participantes; no modificar infraestructura            |
| `P1-04` | Corregir problemas técnicos de media, permisos, red, seguridad y performance; pruebas automatizables | Auditar e implementar responsive visual acordado; ejecutar recorridos Android/iPhone          |
| `P1-05` | Presupuesto global, reservas atómicas, kill switches, administración y pruebas                       | Revisar que los estados bloqueados sean comprensibles para una persona no técnica             |
| `P1-06` | Modelo, actions, autorización y bandeja administrativa de feedback                                   | Diseñar la experiencia, textos de bienvenida, formulario, soporte y guía de participantes     |
| `P1-07` | Errores, health checks, alertas, privacidad de logs, runbooks y rollback                             | Revisar que mensajes de error y soporte orienten al usuario sin exponer información técnica   |
| `P1-08` | Seguridad, aislamiento A/B, automatización y gate final                                              | QA manual visual, bilingüe y móvil; reporte reproducible con evidencia                        |
| `P1-09` | Métricas, costos, incidentes y decisión técnica de ampliar/pausar                                    | Entrevistas, síntesis cualitativa y recomendaciones de experiencia                            |

### Propiedad exclusiva de Codex

- `prisma/schema.prisma`, migraciones y seeds;
- autenticación, invitaciones, autorización y seguridad;
- `src/lib/env/server.ts`, `.env.example`, storage y proveedores;
- límites, contabilidad y proveedores de IA;
- APIs, cron, despliegue, CI, dependencias y configuración;
- pruebas unitarias, de integración, seguridad y smoke;
- `project/TASKS.md` y el estado de este plan.

### Propiedad de Claude

- borradores legales y operativos para revisión del usuario;
- auditoría visual móvil y especificación de problemas reproducibles;
- correcciones responsive expresamente asignadas después de `P1-00`;
- copy de beta, bienvenida, feedback, soporte y entrevistas;
- QA manual en dispositivos y reporte cualitativo.

Entregas documentales recibidas, todavía sin implementación:

- [`beta-p1-02-textos-legales-borrador.md`](beta-p1-02-textos-legales-borrador.md):
  borradores ES/EN con campos de decisión jurídica y operativa pendientes.
- [`beta-p1-04-auditoria-movil-borrador.md`](beta-p1-04-auditoria-movil-borrador.md):
  auditoría inicial de código; confirma tres hallazgos compartidos y declara la
  revisión ruta por ruta y en dispositivos reales como pendiente.

Claude no modificará la personalidad, pedagogía, prompts, voz, transcripción o
comportamiento de Han. Tampoco mezclará Han Tutor, Han Companion, Speaking de
Learning Journey o Speaking Lab.

### Protocolo para trabajar sin sobrescribirse

1. Hasta cerrar `P1-00`, Claude solo puede auditar y redactar fuera del código.
2. Después de una línea base autorizada se crearán worktrees distintos:
   `codex/beta-platform` y `claude/beta-mobile`.
3. Cada entrega será un commit pequeño con un único propósito y evidencia de
   verificación. Ningún asistente hará commits en el worktree del otro.
4. Codex integrará una entrega a la vez y repetirá el gate correspondiente.
5. Si un archivo necesario pertenece al otro responsable, se detiene ese cambio
   y se deja un handoff; no se edita de forma concurrente.
6. Las decisiones de producto, proveedor, presupuesto o texto legal vuelven al
   usuario antes de considerarse cerradas.

## 6. Lotes de ejecución

Cada lote debe ser pequeño, probado y aprobado antes de comenzar el siguiente.

### P1-00 — Línea base segura

Objetivo: saber exactamente qué versión se desplegará.

- [x] Reconciliar los cambios locales actuales de Codex, Claude y el usuario.
- [x] Confirmar que no se perdió ni sobrescribió trabajo de otra sesión.
- [x] Ejecutar typecheck, lint, build, unit, component, integration, smoke,
      auditoría de dependencias y escaneo de secretos.
- [x] Registrar el resultado y las migraciones incluidas.
- [x] Crear un punto de recuperación en Git únicamente con autorización
      explícita del usuario.
- [ ] Hacer dos ejecuciones verdes de CI desde una base vacía.

Evidencia local del 2026-09-19:

- TypeScript, ESLint y build de producción: correctos; 57 páginas generadas.
- Unit: 699/699; component: 69/69; integration: 292/292; smoke: 1/1.
- PostgreSQL efímero: 64/64 migraciones aplicadas desde una base vacía, seed
  curricular, banco placement y fixtures ES correctos.
- Escaneo de secretos: 23 commits y árbol no ignorado sin hallazgos probables.
- Dependencias: gate aprobado con la excepción temporal exacta del CLI de
  Prisma, que vence el 2026-10-16.
- Prettier global no es parte del gate actual: su script intenta recorrer un
  directorio temporal inaccesible y, al limitarlo a código, expone deuda
  histórica de formato en 107 archivos. No se hizo un reformateo masivo para
  evitar mezclar o sobrescribir trabajo compartido.
- El build advierte que la próxima versión de `pg` cambiará la semántica de
  ciertos modos SSL. `P1-03` debe fijar explícitamente `sslmode=verify-full`
  para conservar la verificación fuerte en la conexión de beta.

Pendiente para cerrar por completo `P1-00`: publicar la línea base en una rama
remota y observar dos ejecuciones verdes de CI. No se hará push sin autorización
separada del usuario.

Criterio de salida: existe una revisión identificable, reproducible y verde; no
se despliega directamente el árbol local sin confirmar.

### P1-01 — Acceso cerrado por invitación

Objetivo: impedir registros no autorizados sin necesitar CAPTCHA en esta fase.

- [x] Crear una allowlist administrativa de correos para la beta, con estado,
      cohorte, fecha de invitación, activación y revocación.
- [x] Añadir administración para autorizar, revocar y consultar invitaciones.
- [x] Aplicar la allowlist tanto a credenciales como a Google OAuth.
- [x] Normalizar el correo y evitar respuestas que permitan enumerar cuentas.
- [x] Mantener acceso de administrador y una ruta de recuperación comprobada.
- [x] Bloquear el registro público; la pantalla debe explicar que es una beta
      por invitación.
- [x] Probar invitado, no invitado, invitación revocada, correo duplicado,
      mayúsculas/minúsculas y OAuth.

Criterio de salida: únicamente un correo autorizado puede crear y activar una
cuenta; revocar una invitación impide una activación futura sin borrar datos.

Implementado el 27 de septiembre de 2026 con
`HANGO_BETA_ACCESS_MODE=INVITE_ONLY` como valor seguro y `OPEN` como reversión
sin cambios de código. La administración vive en `/admin/invitations`. Las
pruebas cubren el registro real con PostgreSQL y la autorización OAuth; la
prueba de Google contra el dominio HTTPS definitivo permanece dentro de
`P1-03`, porque requiere las credenciales y callbacks del entorno de beta.

### P1-02 — Consentimiento y privacidad mínima real

Objetivo: explicar qué se procesa antes de recoger voz y conversaciones.

- [ ] Publicar en español e inglés: aviso de beta, privacidad, términos y aviso
      de uso de IA.
- [ ] Explicar voz, transcripción, conversaciones, analítica mínima, proveedores,
      retención configurable, borrado de cuenta y copias de seguridad.
- [ ] Registrar consentimiento versionado con usuario, versión, fecha e idioma.
- [ ] Solicitar nueva aceptación si cambia una versión obligatoria.
- [ ] Incorporar aceptación en credenciales y OAuth sin casillas premarcadas.
- [ ] Mostrar un contacto de soporte y privacidad.

Criterio de salida: ningún nuevo usuario entra a la aplicación sin aceptar la
versión vigente y el administrador puede demostrar qué versión aceptó.

La redacción será operativa para la prueba y deberá recibir revisión jurídica
antes de un lanzamiento público.

### P1-03 — Servicios persistentes y despliegue aislado

Objetivo: ejecutar los flujos reales sin depender del disco local.

- [ ] Crear el proyecto de despliegue y la base PostgreSQL exclusivos de beta.
- [ ] Configurar variables privadas y validar que el bundle del navegador no
      contenga secretos.
- [ ] Configurar la conexión PostgreSQL de beta con validación TLS explícita
      (`sslmode=verify-full`) y comprobar rechazo de certificados inválidos.
- [x] Implementar un proveedor cloud compatible con la interfaz
      `StorageProvider` actual.
- [ ] Mantener el bucket privado y la descarga mediada por el backend con
      comprobación de propiedad.
- [ ] Conectar la outbox de retención y borrado al proveedor cloud.
- [ ] Configurar Resend, remitente verificado, entrega, fallo y recuperación.
- [ ] Configurar Google OAuth para el dominio, si se habilitará en la cohorte.
- [ ] Ejecutar migraciones con `migrate deploy`; separar migración y runtime.
- [ ] Cargar contenido mediante un procedimiento documentado e idempotente.
- [ ] Proteger cron con un secreto exclusivo y comprobar rechazo sin secreto.
- [ ] Confirmar HTTPS, cookies seguras y cabeceras en el dominio real.
- [ ] Activar copias de seguridad administradas de PostgreSQL.

Criterio de salida: reiniciar o volver a desplegar la aplicación no pierde
archivos ni datos; ningún objeto privado es accesible por otro usuario.

Preparación técnica iniciada el 27 de septiembre de 2026: se añadió el proveedor
privado de Vercel Blob, producción rechaza el disco local, se separaron la URL
pooled de runtime y `DIRECT_URL` de migraciones, y el pool serverless quedó
limitado. La compilación y las pruebas focalizadas pasan. El procedimiento,
matriz de variables, gate y pendientes externos están en
[`beta-p1-03-despliegue-runbook.md`](beta-p1-03-despliegue-runbook.md). P1-03
continúa abierto: faltan crear los recursos reales y probar contra el Blob real
la carga directa ya implementada para audios mayores de 4.5 MB. También faltan
Resend/OAuth, migrar/cargar la base nueva, backups y el ensayo completo en el
dominio HTTPS.

### P1-04 — Web móvil lista para la beta

Objetivo: que HanGo se sienta diseñado para un teléfono aunque siga siendo una
página web abierta mediante un enlace.

- [ ] Inventariar todas las rutas públicas, de autenticación, onboarding,
      aprendizaje, laboratorios, configuración y administración que usará la
      beta.
- [ ] Revisar cada ruta en anchos representativos de 360, 390, 430 y 768 px,
      tanto en orientación vertical como horizontal cuando corresponda.
- [ ] Corregir desbordamiento horizontal, contenido cortado, superposiciones,
      elementos fijos y modales que no quepan en el viewport.
- [ ] Verificar que Han Tutor no tape navegación, campos, botones ni contenido;
      este trabajo solo afecta disposición responsive, no su comportamiento.
- [ ] Adaptar navegación, tablas, tarjetas y acciones administrativas para
      interacción táctil, con objetivos de toque suficientes y sin depender de
      hover.
- [ ] Probar formularios con el teclado abierto: desplazamiento al campo,
      botones visibles, tipos de teclado apropiados y mensajes de error legibles.
- [ ] Respetar safe areas, notch, barras dinámicas del navegador, zoom del
      usuario y tamaños de texto accesibles.
- [ ] Solicitar micrófono y cámara únicamente después de una acción explícita y
      explicar cómo recuperarse cuando el permiso sea denegado.
- [ ] Detectar en tiempo de ejecución los formatos de grabación admitidos; probar
      grabar, pausar, reanudar, enviar y reproducir en iPhone Safari y Android
      Chrome.
- [ ] Manejar interrupciones: cambio de pestaña, pantalla bloqueada, llamada,
      pérdida de red, subida cancelada y reintento sin duplicar intentos ni gasto.
- [ ] Verificar las cuatro superficies por separado: Han Tutor, Han Companion,
      Speaking de Learning Journey y Speaking Lab.
- [ ] Optimizar imágenes y recursos solo cuando la comparación visual confirme
      que no hay una degradación perceptible.
- [ ] Medir carga inicial y respuesta en una conexión móvil limitada; evitar que
      recursos decorativos bloqueen autenticación o la primera lección.
- [ ] Configurar la beta como `noindex` y evitar caché offline de páginas o datos
      privados. PWA e instalación en pantalla de inicio quedan para una fase
      posterior basada en evidencia.

Criterio de salida: una persona puede abrir la URL, registrarse, completar una
actividad con audio y enviar feedback usando solo su teléfono, sin instalar
nada, sin contenido oculto y sin necesitar cambiar a “sitio de escritorio”.

### P1-05 — Presupuesto global y controles de IA

Objetivo: impedir que 10 a 30 personas conviertan un error en gasto abierto.

- [x] Conservar los límites existentes por función y por usuario.
- [x] Añadir un presupuesto diario global del producto, independiente de los
      límites individuales.
- [x] Añadir kill switches por familia: texto, STT, TTS y Realtime, sin alterar
      la configuración pedagógica de Han.
- [x] Hacer atómica la reserva o autorización de gasto para evitar carreras
      entre instancias.
- [x] Mostrar consumo, porcentaje del presupuesto y bloqueos en administración.
- [x] Definir avisos al 50 %, 75 % y 90 % y bloqueo al 100 %.
- [ ] Configurar también un presupuesto bajo en el proveedor de IA.
- [x] Verificar fallbacks comprensibles cuando una función esté bloqueada.

Criterio de salida: una prueba concurrente no supera el límite acordado y el
administrador puede desactivar una familia de IA sin apagar HanGo.

Control interno implementado el 27 de septiembre de 2026. `/admin/limits`
separa el costo completado estimado de la exposición máxima autorizada, permite
editar el valor global (USD 5/día inicialmente) y pausar TEXT, STT, TTS o
Realtime. Cada llamada reserva una cantidad conservadora mediante incremento
condicional atómico en PostgreSQL. Una prueba con diez solicitudes concurrentes
y presupuesto para tres autorizó exactamente tres y bloqueó siete, sin exceder
el límite. Realtime usa una estimación preventiva por sesión porque el audio
posterior al handshake fluye directamente entre navegador y proveedor. Falta
configurar el segundo cinturón de seguridad en la cuenta del proveedor.

### P1-06 — Comunicación, feedback y soporte

Objetivo: poder orientar a la cohorte y entender sus problemas.

- [x] Reutilizar el sistema existente de anuncios para el mensaje de bienvenida,
      mantenimiento y solicitudes de feedback.
- [x] Crear feedback dentro de HanGo con categoría, puntuación opcional,
      mensaje, ruta, idioma y usuario.
- [x] No aceptar archivos adjuntos en la primera cohorte.
- [x] Crear bandeja administrativa con estado: nuevo, revisando, resuelto.
- [x] Definir un correo de soporte y un tiempo de respuesta operativo.
- [x] Preparar una guía breve: qué probar, qué es beta y cómo informar fallos.

Criterio de salida: un usuario puede informar un problema desde móvil en menos
de un minuto y el administrador puede responder o marcarlo como resuelto.

Implementado el 27 de septiembre de 2026. El botón Feedback está disponible en
toda la aplicación autenticada, captura ruta e idioma automáticamente y muestra
al autor su seguimiento y la respuesta administrativa. `/admin/feedback`
permite filtrar y responder; Configuración publica el correo temporal
`arean.mendoza@unmsm.edu.pe` con un compromiso inicial de hasta 2 días hábiles.
Los anuncios existentes ahora admiten destino ES, EN o ambos sin modificar los
anuncios históricos. El formulario no contiene carga de archivos. Antes de la
cohorte aún deben publicarse las dos bienvenidas y hacerse la comprobación
cronometrada en un teléfono físico autenticado.

### P1-07 — Observabilidad mínima

Objetivo: detectar problemas antes de que todos los usuarios los reporten.

- [x] Reutilizar `AiOperationLog`, el dashboard de analítica y las métricas de
      costos existentes.
- [x] Incorporar captura centralizada de excepciones del servidor y cliente.
- [x] Eliminar de eventos: tokens, cookies, audio, prompts, transcripciones,
      contraseñas y datos innecesarios del usuario.
- [x] Añadir comprobaciones de salud para aplicación, base, storage, correo y
      cron sin ejecutar operaciones pagadas.
- [x] Alertar por errores críticos, fallos repetidos de proveedor, cron fallido,
      outbox de borrado acumulada y presupuesto cercano al límite.
- [x] Documentar diagnóstico, rollback, pausa de invitaciones y responsable.

Criterio de salida: cada fallo crítico tiene una señal, un responsable y un
procedimiento que no depende de revisar manualmente la base de datos.

Implementado el 27 de septiembre de 2026. `/admin/operations` ahora combina la
telemetría segura de IA con salud de aplicación, base de datos, storage, correo,
cron, presupuesto y cola de borrado; agrupa excepciones de servidor/cliente sin
guardar contenido privado y permite cerrar incidentes. `GET /api/health`
expone únicamente `ok/unavailable`, los cron y el correo conservan su último
resultado normalizado, y las pantallas de error ES/EN permiten recuperarse sin
mostrar detalles técnicos. La migración aditiva
`20260927150000_add_operational_observability` fue aplicada y validada con
pruebas unitarias/de integración, typecheck, lint, build y respuesta real 200
de localhost. Diagnóstico, umbrales, rollback y pausa de invitaciones están en
[`beta-p1-07-observabilidad-runbook.md`](beta-p1-07-observabilidad-runbook.md).
La notificación externa se configurará junto con el hosting real; hasta entonces
el panel, el health check y la revisión diaria son la señal oficial de la beta.

### P1-08 — QA de beta y privacidad

Objetivo: comprobar el producto que realmente recibirán los invitados.

- [x] Probar cuentas A/B y verificar aislamiento de audios, progreso, feedback,
      anuncios, límites y datos administrativos.
- [x] Automatizar registro, verificación, login, recuperación y borrado de
      cuenta contra PostgreSQL temporal, sin servicios pagados.
- [ ] Repetir el flujo de cuenta con email y OAuth reales en el dominio HTTPS.
- [x] Probar onboarding desde cero y examen de ubicación en integración.
- [x] Probar a nivel de componentes y servicios una ruta de Learning Journey,
      Han Tutor, Han Companion, Speaking de Learning Journey, Speaking Lab,
      Writing Lab, Missions y HanVocabulary por separado.
- [ ] Repetir manualmente la ruta completa de Learning Journey, Han Tutor,
      Han Companion,
      Speaking Lab, Writing Lab, Missions y HanVocabulary por separado.
- [x] Probar la localización española e inglesa de los flujos críticos mediante
      componentes y servicios.
- [ ] Probar manualmente español, inglés y cambio de idioma en el dominio.
- [ ] Probar Android Chrome e iPhone Safari con voz, cámara, permisos negados,
      red lenta, interrupción y reanudación.
- [x] Probar retención en 0 días y el procesamiento/reintento de borrados
      pendientes con storage temporal.
- [ ] Repetir retención y borrado contra el bucket privado de beta.
- [ ] Comprobar recuperación de una copia de seguridad en un destino aislado.
- [ ] Ejecutar un smoke final desde una cuenta invitada nueva.

Criterio de salida: cero fallos críticos abiertos, cero acceso cruzado y todos
los flujos esenciales completables en ambos idiomas y dispositivos objetivo.

El gate automatizable y la matriz reproducible quedaron preparados el 27 de
septiembre de 2026. `npm run test:beta` ejecuta la capa estática, crea una base y
un storage temporales, aplica migraciones/seed, recorre los servicios críticos y
termina con smoke. La evidencia, los casos A/B y el checklist físico están en
[`beta-p1-08-qa-matrix.md`](beta-p1-08-qa-matrix.md). La capa automatizada está
verde; P1-08 permanece abierto hasta completar dominio HTTPS, correo/OAuth,
bucket cloud, restore de backup y Android/iPhone reales.

### P1-09 — Apertura gradual de la cohorte

Objetivo: aprender sin incorporar a todos al mismo tiempo.

- [ ] Ola 0: propietario y dos cuentas de prueba.
- [ ] Ola 1: tres a cinco usuarios; observar durante un ciclo completo.
- [ ] Ola 2: ampliar hasta 10 a 15 si no se cumple un criterio de pausa.
- [ ] Ola 3: llegar como máximo a 30 solo después de revisar costo, errores,
      activación y feedback.
- [ ] Enviar bienvenida, instrucciones y canal de soporte.
- [ ] Revisar resultados en D1 y D7 por cohorte.
- [ ] Entrevistar una muestra con consentimiento; no grabar por defecto.

Criterio de salida: se obtiene evidencia suficiente para ampliar, corregir o
detener la beta, sin convertirla automáticamente en lanzamiento público.

## 7. Métricas de la primera cohorte

Las definiciones deben permanecer estables durante la prueba:

- registro autorizado;
- correo verificado;
- onboarding completado;
- primera lección iniciada y completada;
- primera producción real en chino, oral o escrita;
- primer escenario completado;
- retorno D1 y D7;
- errores por usuario activo y por superficie;
- éxito, latencia y costo de IA por superficie;
- costo total y costo por usuario activado;
- feedback recibido, temas repetidos y severidad;
- motivo declarado para regresar o abandonar.

No se fijarán objetivos comerciales definitivos sin una línea base. La primera
cohorte sirve para crear esa línea base.

## 8. Criterios de pausa inmediata

Se cierran nuevas invitaciones y se evalúa el incidente cuando ocurra uno de
estos eventos:

- acceso de un usuario a datos u objetos de otro;
- secreto expuesto o sospecha de compromiso;
- pérdida o corrupción de datos;
- borrado de cuenta que no pueda completarse o reintentarse;
- presupuesto global agotado o consumo anómalo sin explicación;
- autenticación o flujo principal inutilizable para varios usuarios;
- error crítico repetido sin rollback conocido;
- información de voz, prompts o transcripciones apareciendo en logs externos.

## 9. Definition of Done de la Fase 1

La beta cerrada puede comenzar cuando:

- [ ] existe una línea base verde y recuperable;
- [ ] solo usuarios autorizados pueden registrarse;
- [ ] consentimiento, privacidad y borrado funcionan en ES/EN;
- [ ] app, DB y storage de beta son persistentes y están aislados;
- [ ] la experiencia web móvil funciona mediante una URL, sin instalación,
      desbordamientos, superposiciones ni controles inaccesibles;
- [ ] correo, OAuth habilitado, cron y HTTPS fueron probados en el dominio;
- [ ] audios y archivos son privados y sobreviven a un despliegue;
- [ ] existe presupuesto global y límites por usuario/función;
- [x] anuncios, feedback y soporte están disponibles;
- [ ] errores, costos y borrados pendientes generan señales operativas;
- [ ] una restauración de DB y un rollback fueron ensayados;
- [ ] Android Chrome e iPhone Safari completan los flujos críticos;
- [ ] la ola inicial contiene como máximo cinco invitados.

## 10. Decisiones necesarias del usuario

No requieren compartir secretos, solo elegir o confirmar:

1. Hosting de la beta. Recomendación: Vercel por compatibilidad con el proyecto.
2. Base de datos. Recomendación: una base separada en el proveedor actual.
3. Storage privado. Recomendación: Cloudflare R2 o un S3 compatible.
4. Dominio o subdominio que se usará para la beta y para correo.
5. Si Google OAuth estará activo desde la primera ola.
6. Proveedor/canal de monitorización de errores.
7. Correo público de soporte y privacidad.
8. Presupuesto diario y mensual máximo de IA.
9. Tamaño de la primera ola, recomendado: cinco personas.

## 11. Orden recomendado inmediato

1. Aprobar este alcance.
2. Cerrar `P1-00` y obtener autorización para el punto de recuperación.
3. Implementar juntos `P1-01` y `P1-02`, porque ambos controlan la entrada.
4. Ejecutar `P1-03` antes de incorporar usuarios reales.
5. Cerrar `P1-04` y validar la web móvil antes del QA final.
6. Cerrar `P1-05` a `P1-08` sobre el entorno de beta.
7. Abrir `P1-09` gradualmente y decidir con datos.
