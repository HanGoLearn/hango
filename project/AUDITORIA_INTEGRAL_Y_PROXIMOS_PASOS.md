# HanGo — Auditoría integral y próximos pasos

Fecha de corte: 2026-09-14  
Estado auditado: `master` en `9185495`, alineado con `origin/master`  
Propósito: convertir el estado real del producto en un programa de trabajo verificable para una beta web móvil segura, estable y medible.

## 1. Decisión ejecutiva

HanGo ya es un MVP funcional y considerablemente más completo que una demo. Tiene un recorrido educativo extenso, producto bilingüe, interacción por texto y voz, gamificación, administración, límites de uso de IA, persistencia de progreso y una base automatizada de pruebas. Está en condiciones de seguir siendo probado internamente.

**Todavía no debe abrirse como beta pública.** Hay bloqueadores concretos antes de entregar acceso a usuarios externos:

1. La vulnerabilidad crítica de Next.js ya fue cerrada con `16.3.5`. Queda una excepción temporal y acotada del CLI de Prisma, controlada por CI y con vencimiento el 2026-10-16; no corresponde a código importado por el servidor de HanGo.
2. La parte escrita del examen de ubicación ya verifica propiedad, estado, bloque vigente y replays en el servidor.
3. La parte oral ya tiene intentos, nivel, evaluación normalizada, resultado y crédito controlados por el servidor. Aún falta sustituir la transcripción/confianza enviada por el navegador por evidencia recibida mediante una conexión confiable del proveedor Realtime.
4. El avance de lecciones y el grading de Vocabulary/Quiz ya se reconstruyen desde datos canónicos del servidor. Todavía deben endurecerse las referencias curriculares y la procedencia de contexto/evidencia de Speaking/Realtime que afectan reflexión o puntos.
5. Usuarios con email sin verificar pueden iniciar sesión y consumir funciones de IA; además no existe limitación persistente de intentos para login, registro y recuperación de contraseña.
6. La retención y el borrado físico de grabaciones privadas ya están implementados localmente con cola durable y reintentos. Falta validar el proveedor cloud/monitorización en staging y publicar una Política de Privacidad que defina también el ciclo de backups.
7. La integración local completa ya es determinista y autosuficiente; falta confirmar dos ejecuciones remotas verdes y proteger `master`.
8. Faltan piezas de operación pública: proveedor real de email, almacenamiento privado en la nube, HTTPS/dominio, CSP final en el dominio real, backups probados, observabilidad y documentación legal/privacidad.

La recomendación es realizar primero una **fase de cierre pre-beta**, luego una beta cerrada web móvil. PWA y APK deben evaluarse después de observar uso real; no son requisito para la primera prueba.

## 2. Límites y reglas de este plan

- Han Tutor lateral, Speaking de Learning Journey y Speaking Lab son tres sistemas diferentes y deben seguir tratándose por separado.
- No se cambiará la personalidad, pedagogía, voz, transcripción, prompts ni experiencia conversacional de Han. Las tareas de seguridad relacionadas con voz se limitan a autenticación, procedencia de datos, persistencia y autorización.
- No se reemplazará trabajo existente sin revisar el estado actual y los cambios sin confirmar.
- Los cambios de base de datos deberán ser aditivos, migrables y con rollback o recuperación documentada.
- Ninguna fase se considerará terminada solo porque compile; cada tarea tiene criterios de aceptación observables.

## 3. Evidencia y alcance de la auditoría

Se revisaron el estado de Git, `project/TASKS.md`, configuración, rutas, Server Actions, API routes, autenticación, esquema Prisma, almacenamiento, límites de IA, examen de ubicación, internacionalización, CI, pruebas y activos públicos.

Comprobaciones realizadas en este corte:

| Área                             | Resultado                                                                                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repositorio                      | `master` y `origin/master` en `9185495`; solo `.dev-server-restart.log` sin seguimiento, preservado                                                                  |
| Prisma                           | esquema válido; 64 migraciones; base de desarrollo al día                                                                                                            |
| Traducción curricular ES         | 100% en las 22 áreas medidas; 41 escenarios y 31.996 unidades                                                                                                        |
| TypeScript                       | pasa                                                                                                                                                                 |
| ESLint sobre código del producto | pasa                                                                                                                                                                 |
| `npm run lint` global            | pasa desde la raíz; las carpetas temporales y artefactos no forman parte del análisis                                                                                |
| Build de producción              | pasa con Next.js `16.3.5`; compila y genera las 57 páginas estáticas previstas                                                                                       |
| Pruebas locales ya verificadas   | 699 unitarias, 69 de componentes, 292 de integración y 1 smoke pasan; la integración se ejecuta desde cero sobre PostgreSQL 17 efímero y elimina la base al terminar |
| GitHub Actions                   | pipeline autocontenido corregido y reproducido localmente; falta confirmar una ejecución remota verde antes de proteger `master`                                     |
| Dependencias                     | 0 críticas; las únicas 4 altas son la misma cadena de tooling de Prisma CLI y están bajo excepción exacta, temporal y bloqueante para cualquier hallazgo nuevo       |
| Activos públicos                 | 78 archivos, ~49,2 MB originales; avatar ~31,0 MB y mascota ~15,6 MB                                                                                                 |

Esta auditoría es una revisión técnica y de preparación de producto, no un pentest externo ni una opinión legal. Aún se necesitan pruebas adversariales, dispositivos reales, escaneo completo del historial Git y revisión legal según los países de lanzamiento.

## 4. Lo que HanGo ya tiene

### 4.1 Producto y aprendizaje

- Landing de marketing orientada tanto a personas que empiezan desde cero como a quienes desean perfeccionar su chino.
- Registro, login, Google Sign-In opcional, recuperación de contraseña y onboarding.
- Learning Journey con 9 dominios, 41 escenarios, 164 lecciones y 984 pasos.
- Currículo desde nivel inicial hasta contenido avanzado, con chino, pinyin, significado, diálogo, gramática, ejercicios, quiz, misión, reflexión y progreso.
- Interfaz de usuario en español e inglés; traducción española explícita al 100% en el currículo medido.
- Han Tutor lateral y Han Companion con texto, voz y memoria controlada.
- Speaking de Learning Journey y Speaking Lab como experiencias independientes.
- Writing Lab, incluyendo evaluación de texto y escritura fotografiada.
- Examen de ubicación HSK 1–9 y aplicación de créditos de ubicación.
- Han Vocabulary con resultados por idioma de interfaz y caché persistente compartida para evitar pagar repetidamente por la misma consulta.
- Progreso, repaso, logros, avatar configurable, HanCoins, tienda y leaderboard semanal.

### 4.2 Administración y control de costos

- Back-office exclusivo para el administrador con visión general, usuarios, analítica, operaciones de IA, comunicaciones y límites.
- Anuncios a usuarios y otorgamiento idempotente de HanCoins con mensaje.
- Límites diarios globales por operación de IA y excepciones configurables por usuario.
- Registro de consumo, costo estimado y estado de operaciones de IA.
- Cachés de audio y vocabulario para reutilizar resultados y reducir costo.
- Autorización administrativa fuerte: se comprueba en base de datos el usuario actual, su rol y el email administrativo, no solo el rol almacenado en el token.

### 4.3 Ingeniería

- Next.js 16, React 19, TypeScript, Prisma/PostgreSQL y Auth.js.
- Variables privadas separadas del navegador mediante módulos `server-only`; los archivos `.env` reales están ignorados.
- No se encontraron consultas SQL crudas; Prisma parametriza las operaciones actuales.
- La mayoría de Server Actions y rutas privadas autentican al usuario; los flujos públicos sin autenticación corresponden principalmente a login, registro, recuperación y verificación.
- Existen pruebas de aislamiento entre usuarios para quiz, misiones, Speaking y Writing.
- Las imágenes manuscritas se decodifican y re-encodean con límites de cantidad, tamaño, píxeles y dimensiones; se corrige orientación y se eliminan metadatos.
- React escapa el contenido del usuario; los únicos usos actuales de `dangerouslySetInnerHTML` contienen un script estático de tema, no datos del usuario.
- Las grabaciones privadas de Speaking se entregan mediante una ruta autenticada con comprobación de propiedad.

## 5. Hallazgos priorizados

### P0 — bloquean la beta pública

#### P0-01. Actualizar dependencias vulnerables

La aplicación usaba Next.js `16.3.0`. La auditoría de dependencias informó vulnerabilidades críticas corregidas desde `16.3.3`, además de dependencias transitivas de severidad alta (`sharp`, `nanoid`, `fast-uri`, `deepmerge-ts`, `mysql2` dentro de cadenas de Next/Prisma/tooling).

Acción:

- Actualizar Next.js y `eslint-config-next` como mínimo a una versión que incluya todas las correcciones aplicables.
- Actualizar el lockfile de forma controlada y revisar qué alertas son runtime y cuáles solo tooling.
- Ejecutar typecheck, lint, suite completa, build y recorrido autenticado tras la actualización.
- Añadir auditoría automática de dependencias y actualización revisada, sin desplegar automáticamente una actualización mayor.

Criterio de aceptación:

- Cero vulnerabilidades críticas o altas explotables en producción, o excepción escrita con análisis, mitigación y fecha de vencimiento.
- Build y pruebas verdes en local y CI.

Estado al 2026-09-16:

- Next.js y `eslint-config-next` quedaron en `16.3.5`; `sharp`, `nanoid`, `fast-uri`, `js-yaml` y Vitest quedaron en versiones corregidas.
- Prisma Client, adapter y CLI quedaron alineados en `7.10.0`; no se usó `npm audit fix --force` ni se degradó Prisma a la versión 6.
- `npm run security:audit` bloquea toda alerta crítica/alta inesperada. La única excepción aceptada corresponde exactamente a `prisma@7.10.0`, `@prisma/config@7.10.0`, `deepmerge-ts@7.1.5` y `mysql2@3.15.3`, en sus rutas únicas actuales.
- Alcance de la excepción: Prisma está declarado como dependencia de desarrollo; HanGo usa PostgreSQL y el código de la aplicación no importa `mysql2` ni `deepmerge-ts`. npm incluye la cadena al resolver el peer opcional de Prisma Client, pero no aparece en el bundle de servidor producido por Next.
- Riesgo residual: un archivo de configuración recursivo no confiable podría agotar la pila de `deepmerge-ts`; una conexión MySQL hostil podría activar los avisos de `mysql2`. El pipeline no procesa configuración Prisma enviada por usuarios y HanGo no conecta a MySQL.
- Mitigación: versiones y rutas están fijadas en el control; cualquier cambio o nueva alerta falla CI. La excepción vence el **2026-10-16** y debe eliminarse en cuanto Prisma publique una cadena corregida compatible.
- Verificación posterior: Prisma generate/schema, typecheck, lint, 699 unitarias, 69 de componentes, 292 de integración, 1 smoke y build de producción pasan.

#### P0-02. Corregir propiedad y orden del examen de ubicación

Las acciones autentican que existe un usuario, pero `submitPlacementAnswer`, `recordPlacementTimeout`, el envío por bloques y parte del avance consultan `PlacementSession` por `id` sin exigir `userId`. Tampoco verifican de manera autoritativa que la pregunta enviada sea la siguiente pregunta o bloque permitido para esa sesión.

Riesgo:

- Un usuario autenticado podría actuar sobre otra sesión cuyo identificador conozca.
- Un cliente modificado podría responder preguntas arbitrarias, repetirlas o saltarse el orden y el temporizador.

Acción:

- Pasar `userId` a toda operación de ubicación y consultar siempre por `{ id, userId, status: IN_PROGRESS }`.
- Calcular en el servidor la pregunta o bloque vigente y rechazar cualquier `questionId` fuera de ese conjunto.
- Entregar audio de Listening solo para la sesión activa y la pregunta/bloque vigente; hoy basta un `questionId` y cualquier usuario autenticado puede solicitarlo.
- Hacer los envíos idempotentes y transaccionales; impedir duplicados y replays.
- No confiar en el temporizador del navegador para determinar validez.

Criterio de aceptación:

- Pruebas de otro usuario, sesión inexistente, sesión terminada, pregunta fuera de orden, bloque parcial, duplicado, replay y solicitudes concurrentes.
- Ningún intento no autorizado cambia resultados, créditos ni puntos.

Estado al 2026-09-16: completado. Todas las operaciones escritas exigen propiedad y estado, el servidor calcula el bloque vigente y la restricción única de base de datos evita replays concurrentes. Listening solo entrega audio para la pregunta vigente de la sesión propia. Las pruebas adversariales pasan sobre PostgreSQL real efímero.

#### P0-03. Hacer autoritativa la evaluación oral de ubicación

El navegador envía transcripción, confidencias, puntuaciones y `speakingCreditedLevel`; el servidor limita el formato, pero luego usa esos valores para evaluación y crédito. Un usuario puede fabricar el resultado mediante una llamada directa.

Acción:

- Crear una sesión/intento oral emitido por el servidor, ligado a usuario, sesión de ubicación, nivel y estado.
- Persistir transcript/evidencia recibida durante la sesión, respuesta del evaluador y resultado normalizado.
- Derivar el nivel acreditado únicamente desde registros guardados por el servidor.
- Cambiar la aplicación de créditos para que reciba un ID de intento o solo `sessionId`; nunca puntuaciones del cliente.
- Firmar o vincular la sesión Realtime y bloquear replays.

Criterio de aceptación:

- Alterar transcript, puntuaciones o nivel en DevTools no cambia el crédito.
- Pruebas de propiedad, procedencia, replay, concurrencia y fallo parcial.
- La conversación, voz, prompts y pedagogía de Han permanecen iguales.

Estado al 2026-09-16 — fase A completada, fase B pendiente:

- La migración `20260916153000_add_server_owned_placement_speaking` está aplicada. Persiste un intento por nivel con estado `PENDING`/`GRADING`/`COMPLETED`, transcript visible, confidencias, rúbrica, evaluación, proveedor/modelo y resultado.
- El servidor deriva el nivel inicial desde las cuatro habilidades escritas, emite el siguiente nivel, bloquea propiedad/replay/concurrencia, calcula aprobado/fallido y persiste el nivel acreditable/diagnóstico. El navegador ya no envía nivel, puntuación ni crédito.
- `applyPlacementCredit` recibe únicamente `sessionId` y usa el resultado y puntuaciones persistidos. Alterar un nivel o score en DevTools ya no modifica el crédito.
- Pruebas reales cubren acceso entre usuarios, nivel derivado, doble claim concurrente, replay, escalada, fallo y crédito limitado por Speaking. La suite completa pasa con 288 pruebas de integración.
- **Pendiente para cerrar SEC-03:** la transcripción y las confidencias aún llegan desde el navegador. Deben capturarse por una conexión sideband/monitoring autenticada del proveedor y un proceso durable, vinculadas al intento emitido por el servidor. Hasta entonces no se puede afirmar procedencia autoritativa del audio y SEC-03 permanece abierto.
- No se cambió `HanVoiceConversation`, sus prompts, voz, cierre, pedagogía ni transcripción; solo se endureció el estado que rodea al placement oral.

#### P0-04. Hacer autoritativos todos los flujos que producen progreso o puntos

La revisión encontró varias fronteras de confianza adicionales:

- `advanceLessonStepAction` recibe desde el cliente el arreglo `steps` que se usa para decidir si una lección terminó. El servidor no debe permitir que el navegador defina el currículo ni el paso final.
- Vocabulary persiste `questionKey` e `isCorrect` enviados por el cliente y no vuelve a calcular la respuesta ni comprueba suficientemente la relación item/lección.
- Quiz comprueba que el intento pertenece al usuario, pero no que `quizQuestionId` pertenezca al quiz del intento; tampoco exige en `complete` que estén contestadas exactamente las preguntas requeridas.
- Speaking permite crear una sesión con `prompt`, `lessonId`, `scenarioId` y tipo de actividad enviados por el cliente. Un usuario puede intentar asociar una práctica fabricada a otra lección o invocar una actividad bloqueada en UI.
- Parte de la evidencia Realtime y del contexto de lección llega desde el navegador y se sanea por forma, pero no siempre se reconstruye a partir de IDs y estado del servidor.

Acción:

- Cargar pasos, preguntas, opciones, vocabulario, prompts, permisos y referencias directamente desde el servidor.
- Validar acceso a la lección, paso vigente y transición permitida; `goToLessonStep` solo puede volver a un paso completado de esa misma lección.
- Recalcular Vocabulary y Quiz en el servidor; comprobar pertenencia pregunta→quiz e item→lección, exactitud del conjunto y estado del intento.
- En Speaking, distinguir explícitamente una práctica libre de una práctica curricular. Solo el servidor puede adjuntar una lección/escenario, resolver el prompt y habilitar tipos de actividad.
- Emitir una sesión de conversación desde el servidor con usuario, superficie, lección/escenario y objetivos permitidos.
- Resolver el contexto educativo desde IDs estables del servidor, no desde objetos completos enviados por el cliente.
- Separar transcript visible de evidencia autoritativa; no premiar datos que solo existan en el navegador.
- Normalizar errores del proveedor antes de responder al cliente y registrar el detalle saneado solo en servidor.

Criterio de aceptación:

- El cliente no puede otorgarse targets, objetivos, scores ni contexto ajeno.
- Pruebas de pasos fabricados, Vocabulary con `isCorrect` alterado, pregunta de otro quiz, quiz incompleto, actividad bloqueada y referencias curriculares falsificadas.
- Suite de integridad para Learning Journey Speaking, Speaking Lab y Han Tutor por separado.
- Sin cambios al comportamiento conversacional de Han.

Estado al 2026-09-16 — avance parcial de SEC-04:

- El navegador ya no envía el arreglo de pasos que determina la finalización. El servidor carga `LessonStep`, exige el paso vigente, sanea IDs guardados y solo permite volver al paso actual o a uno ya completado.
- Quiz exige que la pregunta pertenezca al quiz del intento, que el intento sea propio y siga abierto, y que estén contestadas exactamente todas las preguntas antes de calcular el score. Un intento terminado no puede mutarse y completar de nuevo es idempotente.
- Vocabulary dejó de aceptar `isCorrect`. El cliente entrega opción/tokens; el servidor reconstruye la pregunta determinista desde lección, dificultad, vocabulario y ejemplos canónicos, valida pertenencia/plan/opciones y calcula lo que se persiste. Preguntas inventadas, palabras ajenas y duplicados de lote se rechazan.
- Se añadieron pruebas adversariales y se corrigió el ejecutor PostgreSQL efímero para terminar explícitamente con error si falla Vitest; no puede imprimir `FAILED` y dejar verde el comando.
- **Pendiente para cerrar SEC-04:** sesión y referencias curriculares server-issued para Speaking de Learning Journey/Speaking Lab, y procedencia confiable del contexto/evidencia Realtime que alimenta reflexión o puntos. Estos sistemas se auditarán por separado sin cambiar a Han.

#### P0-05. Cerrar abuso de cuentas y autenticación

El registro genera un email de verificación, pero `verifyCredentials` no exige `emailVerified`. El proveedor de email es un stub que imprime links con tokens en logs. No hay rate limiting persistente para login, registro o recuperación; crear muchas cuentas permite multiplicar límites de IA por usuario.

Acción:

- Integrar un proveedor real de email; en producción la aplicación debe fallar al arrancar si sigue usando el stub.
- Dejar de registrar URLs o tokens de verificación y recuperación.
- Normalizar email con `trim` y minúsculas, y controlar la carrera del índice único.
- Exigir email verificado antes de acceso completo o, como mínimo, antes de cualquier función costosa, con flujo de reenvío seguro.
- Aplicar límites distribuidos por IP y por identidad normalizada a login, registro, reenvío y recuperación.
- Usar protección anti-bot progresiva, por ejemplo Turnstile, en registro/recuperación o al detectar riesgo. No usar CAPTCHA como única defensa.
- Mitigar enumeración por respuesta y tiempo, incluida comparación con hash ficticio cuando el usuario no existe.
- Validar en el servidor una aceptación explícita y versionada de Términos/Privacidad para credenciales y OAuth. El checkbox actual solo deshabilita el botón en React, no llega al servidor, no se persiste y Google Sign-In no pasa por él.

Criterio de aceptación:

- Un email no verificado no consume IA ni completa onboarding protegido.
- Rate limits sobreviven reinicios y varias instancias.
- Pruebas de enumeración, bursts, múltiples IP/identidades, reenvío y proveedor fallido.

Estado al 2026-09-19 — endurecimiento local completado, activación operativa pendiente:

- Se sustituyó el stub por un adaptador transaccional de Resend con mensajes ES/EN, timeout y fallo cerrado en producción. La aplicación ya no imprime URLs ni bearer tokens; sin proveedor configurado solo suprime el envío en desarrollo/test.
- Nuevos tokens de verificación y recuperación se guardan como SHA-256 con prefijo de versión, se consumen una sola vez y las mutaciones relacionadas son transaccionales. El valor almacenado no puede presentarse como bearer; existe una compatibilidad temporal de 24 horas solo para enlaces emitidos por el código anterior.
- Los correos de registro/recuperación/login se normalizan y las búsquedas protegen cuentas históricas con mayúsculas. La carrera de registro se captura también en el índice único.
- Producción siempre rechaza credenciales locales no verificadas. Desarrollo/test solo omiten esa barrera cuando no existe proveedor de correo, para no bloquear el entorno local.
- Login, registro, recuperación y reset consumen contadores atómicos persistentes por identidad e IP. Las claves usan HMAC con `AUTH_SECRET`; ni correo ni IP se almacenan en claro. Los límites sobreviven procesos y reinicios.
- Los cuatro formularios incluyen honeypot no visible como primera barrera de automatización. Recuperación conserva exactamente la misma respuesta pública para cuentas inexistentes, limitadas o atendidas.
- Restablecer contraseña incrementa `User.sessionVersion`, invalida todos los enlaces pendientes y hace que los JWT anteriores sean rechazados en la siguiente comprobación backend.
- Las migraciones `20260919110000_add_user_session_version` y `20260919123000_add_auth_rate_limit_buckets` están aplicadas; pruebas específicas de token, límite, normalización y revocación pasan.
- **Pendiente para cerrar SEC-05/06/07:** configurar y comprobar dominio/API key de Resend en staging; añadir reenvío seguro de verificación; activar Turnstile u otro desafío administrado según riesgo; comparación con hash ficticio para uniformar costo; aceptación versionada de Términos/Privacidad (incluido OAuth); y cerrar la política avanzada de password, duración/reautenticación de sesión y tokens OAuth.

#### P0-06. Cumplir retención y borrado real de datos

Estado al 2026-09-19 — implementación local completada, cierre operativo/legal pendiente:

- `recordingRetentionDays` ya se ejecuta para 0/7/30/90/365 días o conservación indefinida. El audio se elimina; transcripción y feedback permanecen.
- Un cron diario autenticado encola vencidos, detecta huérfanos timestamped con 24 horas de gracia y procesa una outbox PostgreSQL idempotente.
- El borrado de cuenta inventaría los objetos privados en la misma transacción que elimina al usuario; la outbox sobrevive a los cascades y reintenta con backoff.
- Una protección de namespace admite únicamente audio Speaking con extensión validada bajo `speaking/{userId}/`; los audios compartidos de curso, Han, vocabulario, diálogo y placement quedan fuera.
- Los fallos guardan estado, número de intentos, próximo intento y error saneado sin contenido del alumno. Las filas completadas se purgan a los 30 días.
- Las pruebas cubren 7/30/90 días, “no conservar”, indefinido, archivo reciente, fallo/reintento, huérfano, borrado individual y borrado de cuenta.

Pendiente para el cierre público:

- Validar borrado, listado y permisos con el proveedor cloud privado elegido, y conectar alertas al contador de fallos pendientes.
- Definir y publicar la Política de Privacidad, incluidos backups, plazos de recuperación y solicitudes regulatorias.

Acción:

- Crear un proceso idempotente de retención que enumere y elimine grabaciones vencidas.
- Implementar borrado de cuenta con inventario de objetos, borrado o cola/outbox reintentable y confirmación final.
- Añadir limpieza de objetos huérfanos y registro de auditoría sin guardar contenido sensible.
- Definir qué ocurre con logs de IA, mensajes, fotos, facts, analítica y backups después del borrado.

Criterio de aceptación:

- Pruebas con retención de 7/30/90 días y “no conservar”.
- Al eliminar la cuenta no quedan archivos accesibles; fallos del proveedor se reintentan y quedan visibles operativamente.
- Política de privacidad coincide con el comportamiento real.

#### P0-07. Lograr una CI determinista y obligatoria

La última ejecución de GitHub Actions (`34909881421`) pasó 265 pruebas de integración y falló 6. Las causas observadas son datos no portables o ausentes en la base efímera:

- Dos pruebas de admin dependen de la cuenta administrativa real.
- Dos pruebas esperan traducciones cuyos paquetes están acoplados a IDs generados en otra base.
- Una prueba por lotes presupone una segunda opción/ejercicio que el seed limpio no garantiza.
- Existe además una sexta aserción dentro de los mismos cinco archivos fallidos.

Acción:

- Crear fixtures propios para admin y no depender de cuentas reales.
- Hacer portables las traducciones mediante claves estables o generar/importar fixtures localizados compatibles con la base efímera.
- Hacer explícito el contenido mínimo requerido por cada prueba.
- Aislar datos por prueba y evitar colisiones bajo concurrencia.
- Añadir build, auditoría de dependencias y chequeo de migraciones al pipeline.
- Alinear y fijar la versión de Node para desarrollo, CI y producción; hoy README acepta 20.9+ mientras CI ejecuta Node 24.
- Proteger `master`: no fusionar si CI está roja.

Criterio de aceptación:

- Dos ejecuciones consecutivas desde base vacía pasan sin excepciones ni tests ignorados.
- CI no necesita acceso a la base de desarrollo ni a un usuario real.

#### P0-08. Crear una base de producción segura y recuperable

Acción:

- Elegir hosting, región, dominio, proveedor Postgres y almacenamiento privado de objetos.
- Separar desarrollo, staging y producción con secretos distintos.
- Usar HTTPS; activar HSTS solo cuando todo el dominio funcione permanentemente por HTTPS.
- Usar una cuenta DB de runtime con mínimo privilegio y otra cuenta controlada para migraciones.
- Configurar backups automáticos/PITR y ejecutar un simulacro real de restauración.
- Configurar error monitoring, logs saneados, métricas, alertas y health checks.
- Ejecutar migraciones y seeds por un procedimiento repetible; nunca desde una petición web.

Criterio de aceptación:

- Staging replica producción sin datos reales.
- Backup restaurado en un entorno aislado y evidencia registrada.
- Rollback de aplicación y plan de migraciones probado.

#### P0-09. Añadir cabeceras y política web de seguridad

`next.config.ts` no define cabeceras de seguridad. La aplicación usa micrófono, cámara/fotos, audio, Google OAuth y un script inline de tema, por lo que una CSP genérica puede romper funciones.

Acción:

- Diseñar Content Security Policy específica; desplegar primero en `Report-Only`, corregir violaciones y luego aplicar.
- Añadir `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy` compatible con micrófono/cámara necesarios.
- Desactivar `x-powered-by`.
- Revisar `Cache-Control` de HTML/API privados y cookies de Auth.js en el dominio HTTPS.
- Usar nonce o hash para el script de tema si la CSP lo exige.

Criterio de aceptación:

- Escáner de cabeceras satisfactorio sin romper login, Google OAuth, Realtime, grabación, fotos ni audio.
- Cookies de sesión `Secure`, `HttpOnly` y `SameSite` apropiadas en producción.

### P1 — necesarias para una beta controlada y sostenible

#### P1-01. Límites distribuidos y presupuesto global de IA

Los límites cortos usan `Map` en memoria: se reinician con el proceso y no se comparten entre instancias. Los límites diarios consultan consumo previo antes de la llamada, lo que permite overshoot bajo concurrencia. No existe un freno presupuestario global de la plataforma.

Tareas:

- Implementar rate limiting atómico en Redis/DB/edge por usuario, IP y operación.
- Reservar presupuesto antes de llamar al proveedor y conciliar uso real después.
- Añadir techo diario/mensual global, kill switch por feature y alertas de anomalía.
- Definir degradación: caché, cola, función no disponible o mock seguro; nunca gasto ilimitado.

#### P1-02. Centralizar autorización y acceso a datos

La mayoría de rutas está protegida, pero la vulnerabilidad de placement muestra que autenticar no equivale a autorizar el recurso.

Tareas:

- Crear una capa `server-only` de acceso por dominio que reciba `userId` y devuelva DTOs mínimos.
- Inventariar cada Server Action y API con actor, recurso, ownership, mutación, límite y prueba IDOR.
- Evitar aceptar objetos de dominio completos desde el navegador cuando basta un ID.
- Agregar pruebas negativas a todas las operaciones con IDs de usuario/sesión/intento.

Auditoría `SEC-10` cerrada el 2026-09-19:

| Superficie inventariada                           | Actor y regla efectiva                                                                                                    | Evidencia adversarial                                                                                                            | Resultado                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 23 archivos de Server Actions del alumno          | La identidad siempre nace de `auth()`; ningún action recibe un `userId` del navegador                                     | Tests A/B de placement escrito/oral, quiz, misión, Writing y Speaking; filtros explícitos para achievements, HanCoins y anuncios | Sin IDOR abierto                |
| 7 actions públicas de autenticación/sesión/locale | No acceden a recursos privados por un ID de usuario suministrado                                                          | Tokens opacos hasheados y tests de autenticación/recuperación                                                                    | Sin IDOR aplicable              |
| 2 archivos de actions administrativas             | `requireAdministrator()` revalida en DB tanto rol como email exacto del propietario                                       | Tests negativos de no administrador y acciones admin                                                                             | Sin bypass observado            |
| 11 Route Handlers                                 | 6 exigen sesión, 2 secreto de cron, 2 token/limpieza de sesión y 1 delega a Auth.js                                       | Nueva prueba de audio privado: anónimo 401, usuario B 404 sin tocar storage, propietario 200                                     | Sin IDOR abierto                |
| Server Components privados                        | El layout del alumno autentica en servidor y deriva `userId` de la sesión; el layout admin exige `requireAdministrator()` | No existen rutas learner con `userId` privado en parámetros; los IDs de lección/escenario son catálogo compartido                | Sin acceso horizontal observado |

Familias con identificadores privados revisadas: Placement Session/Attempt,
Placement Speaking Attempt, Quiz Attempt, Mission Attempt, Writing Attempt,
Speaking Session/Attempt/audio, Achievement, CoinLedgerEntry y
AnnouncementReceipt. Los identificadores de diálogo, gramática, vocabulario,
lección, escenario y review son referencias a catálogo compartido; toda
mutación derivada sigue usando el usuario autenticado. La capa de autorización
continúa distribuida por dominio, por lo que una nueva action o ruta debe
incorporarse a esta matriz y traer su prueba A/B antes de fusionarse.

#### P1-03. Fortalecer contraseñas, tokens y sesiones

- Migrar preferentemente a Argon2id o documentar bcrypt cost 12 y aplicar explícitamente el límite de 72 bytes para evitar truncación ambigua.
- Guardar hash de tokens de verificación/reset, no el token utilizable en texto plano.
- Hacer creación/consumo de tokens transaccional, de un solo uso y con limpieza periódica.
- Invalidar sesiones existentes al restablecer contraseña, cambiar credenciales o desactivar cuenta mediante `sessionVersion` o sesión persistente revocable.
- Definir duración absoluta, rotación y política de reautenticación para acciones sensibles.
- Revisar si los tokens OAuth guardados por el adaptador se necesitan; reducir scope y protegerlos en reposo.

#### P1-04. Endurecer uploads y media

- Para audio, validar firma/contenedor y decodificar de forma segura, no solo confiar en `audio/*` y tamaño.
- Limitar duración real, frecuencia, canales y recursos de procesamiento.
- En imágenes, decodificar/re-encodear para eliminar contenido extraño/metadatos y aplicar límites de píxeles contra decompression bombs.
- Usar nombres generados por servidor, bucket privado, antivirus si se admiten formatos más amplios y URLs firmadas de corta duración.
- Adaptar la ruta `/api/audio` al proveedor abstracto; hoy lee directamente el filesystem local.

Estado al 2026-09-19: completado para las dos superficies actuales de archivos
del alumno, sin modificar Han. Speaking Lab valida firma y contenedor,
decodifica el audio, limita a 15 MiB/5 minutos/8–96 kHz/1–2 canales y registra
la duración derivada por el servidor como `SERVER_DECODED`; admite WebM, Ogg,
M4A y WAV con extensión canónica generada por el servidor. El grabador se
detiene en el límite y la ruta privada de reproducción ya usa la abstracción de
storage con autorización por propietario. Writing manuscrito limita el cuerpo,
cantidad, tamaño, dimensiones y 20 MP; decodifica, auto-orienta y re-encodea
JPG/PNG/WebP sin metadatos ni redimensionamiento antes de enviarlos al evaluador.
Malware scanning queda como requisito previo únicamente si en el futuro se
habilitan documentos, archivos comprimidos, video o uploads comunitarios.

#### P1-05. Privacidad, legal y gobierno de datos

- Inventario de datos: cuenta, perfil, progreso, conversaciones, learner facts, voz, fotos, evaluaciones, analítica, IP/anti-bot y logs.
- Base legal/consentimiento y edad mínima según mercados; consulta legal antes de lanzamiento.
- Términos, Política de Privacidad y aviso de IA reales y enlazados. El checkbox actual no sustituye los documentos.
- Registrar de forma mínima la versión aceptada, fecha y vía de consentimiento; ofrecer reaceptación cuando exista un cambio material.
- Retención específica por categoría, exportación/borrado, contacto de privacidad y proceso de incidentes.
- Minimizar datos enviados a proveedores de IA y evitar contenido sensible en analítica/logs.
- Cifrado TLS en tránsito y del proveedor en reposo. Aplicar cifrado de campo solo a secretos/datos especialmente sensibles donde aporte valor y exista gestión segura de llaves.

#### P1-06. Base de datos y RLS

HanGo no usa una “clave pública de base de datos”: Prisma corre solo en el servidor y `DATABASE_URL` debe permanecer privada. No debe introducirse una clave DB en el navegador.

RLS no está configurado. Recomendación:

- Primero centralizar ownership y usar un rol runtime de mínimo privilegio.
- Diseñar RLS como defensa adicional solo si se puede establecer el `userId` por transacción de forma segura con el pool de conexiones.
- Probar que nunca se reutiliza contexto de un usuario en la conexión de otro.
- Si no se puede garantizar ese contrato, no activar RLS parcialmente; documentar la decisión y reforzar autorización de aplicación.
- Habilitar métricas de conexiones, consultas lentas, errores, crecimiento, locks y capacidad.
- Corregir la advertencia futura de SSL especificando la semántica deseada, preferiblemente verificación completa del certificado.

#### P1-07. Observabilidad y operación

- Error tracking con release, entorno y source maps protegidos.
- Logs estructurados con request/correlation ID y redacción de email, tokens, prompts sensibles y contenido de voz.
- Métricas: uptime, latencia p50/p95/p99, tasa de error, proveedor de IA, DB, storage, email y cron.
- Alertas accionables con dueño, umbral y runbook.
- Panel de estado interno, rotación de secretos y procedimiento de incidente/rollback.
- Verificar que el payout semanal sea idempotente y monitoreado.

### P2 — optimización, experiencia y crecimiento

#### P2-01. Rendimiento de imágenes y carga móvil

Los originales públicos suman ~49,2 MB. `next/image` reduce parte del tráfico entregado, pero los archivos fuente siguen siendo excesivos para build, almacenamiento y transformación; algunos iconos de ~24 px parten de PNG de más de 1 MB.

Tareas:

- Generar variantes WebP/AVIF o PNG optimizado con las mismas dimensiones visuales y transparencia.
- Mantener los originales fuera del bundle público si se necesitan como fuente.
- Comparación visual automatizada y manual antes/después; no aceptar degradación visible.
- Medir LCP, INP, CLS, JavaScript, imágenes transferidas y uso de memoria en móvil lento.
- Revisar precarga/prioridad solo en imágenes above-the-fold.

#### P2-02. QA real de móvil y navegador

- Android Chrome y WebView/PWA; iPhone Safari.
- Permisos, denegación y recuperación de micrófono/cámara.
- Realtime con auriculares, altavoz, red lenta, interrupción, pantalla bloqueada y cambio de app.
- MediaRecorder/STT/TTS/audio seeking.
- Teclado móvil, safe areas, orientación, zoom, contraste y reduced motion.
- Sesión expirada, back/forward, recarga y reconexión.
- Flujos ES/EN completos y cambio de idioma.

#### P2-03. PWA y posible APK

- Añadir manifest, iconos, theme color, instalación y estrategia offline mínima solo después del QA web móvil.
- No almacenar contenido privado o audio sensible en caches del service worker.
- Medir instalación y recurrencia en beta.
- Considerar wrapper con Capacitor/Trusted Web Activity solo si los usuarios realmente necesitan instalación, notificaciones o mejor acceso nativo.
- Google Play closed testing después de validar el producto web; mantener una sola lógica de negocio.

#### P2-04. Calidad educativa y contenido

- Revisión humana profesional de chino, pinyin, naturalidad, dificultad y español de una muestra estratificada y luego del currículo completo.
- QA de adherencia de vocabulario HSK 1–2 en Speaking de Learning Journey con audio real.
- Calibrar examen de ubicación con datos reales: duración, abandono, precisión, distribución de niveles y falsos positivos.
- Mostrar de forma clara al alumno el nivel adaptativo y cómo se obtuvo, sin convertirlo en una etiqueta rígida.
- Mantener separados los criterios de Han Tutor, Speaking de lección y Speaking Lab.

#### P2-05. Limpieza de producto y documentación

- Retirar la ruta QA `/speaking-test` y su entrada cuando deje de ser necesaria.
- Decidir si Shadowing y Scenario Role Play siguen bloqueados o se liberan con criterios completos.
- Corregir afirmaciones obsoletas del README y documentación, incluida la descripción “HSK 3–9” y el estado de voz/Realtime.
- Reconciliar los 51 checkboxes abiertos de `TASKS.md`: varios ya fueron superados por implementaciones posteriores.
- Excluir `.codex-tmp`, artefactos de oficina y logs locales de las herramientas que escanean todo el repo.
- Mover artefactos WAV pesados de QA fuera de documentación versionada si no son fixtures indispensables; conservar evidencia reproducible de menor tamaño.

#### P2-06. Analítica de producto, beta y engagement

El dashboard administrativo ya contiene una base sólida, pero las métricas solo se vuelven útiles con usuarios reales y definiciones consistentes.

- Definir eventos y denominadores antes de capturar: visita → registro → verificación → onboarding → primera lección → primera producción → regreso D1/D7.
- Métricas primarias: activación, lección terminada, primera práctica oral, D1/D7, costo por usuario activo y evidencia de aprendizaje.
- Segmentar por idioma, nivel inicial, fuente de adquisición y dispositivo sin crear perfiles invasivos.
- Invitación controlada, welcome announcement, canal de feedback y proceso de soporte.
- Entrevistas cualitativas y revisión de sesiones con consentimiento; no depender solo de dashboards.
- Definir umbrales para ampliar o detener la beta.

#### P2-07. Negocio, adquisición y ciclo de vida

- Declarar la beta cerrada como gratuita y con cupos/límites transparentes mientras se valida valor y costo.
- El rol `PREMIUM_LEARNER` existe, pero no hay billing, suscripción ni entitlement completo. No cobrar hasta definir producto, cancelación, impuestos, soporte y control de acceso de extremo a extremo.
- Verificar SEO técnico de la landing bilingüe: `robots`, sitemap, canonical/hreflang, OG y preview social. Metadata, alternates y `og.png` ya ofrecen una base.
- Diseñar email de bienvenida, verificación, recuperación y mensajes de retorno con consentimiento y baja cuando corresponda.
- Medir fuente de adquisición y conversión sin instalar trackers invasivos antes de definir privacidad.
- Crear un backlog posterior a beta para pricing, planes, referidos, notificaciones y comunidades basado en evidencia de retención.

## 6. Matriz de seguridad solicitada

| Control                              | Estado actual                                                                            | Próximo paso                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Ocultar claves API                   | Bien encaminado: módulos `server-only`, solo variables públicas `NEXT_PUBLIC_*`          | Secret manager por entorno, rotación y prueba de no exposición en bundles/logs                        |
| 1. Eliminar secretos de Git          | 23 commits + árbol no ignorado escaneados sin hallazgos probables; `.env.local` ignorado | Mantener gate redacted en CI y activar secret scanning del proveedor Git                              |
| 2. Usar una clave pública de DB      | No aplica a Prisma server-only                                                           | Mantener `DATABASE_URL` privada; rol runtime mínimo y rol separado de migración                       |
| 3. Activar RLS                       | No implementado                                                                          | Diseño posterior a la centralización de ownership; probar contexto por transacción/pool               |
| 4. Cifrar datos sensibles            | TLS/hosting aún sin cerrar                                                               | Cifrado del proveedor en reposo, TLS con validación, KMS y cifrado selectivo de tokens/datos críticos |
| 5. Forzar autenticación del servidor | Implementado en el inventario actual                                                     | Mantener el gate al agregar actions/rutas; cerrar procedencia Realtime por integridad                 |
| 6. Restringir acceso a registros     | Auditoría IDOR completa; sin acceso horizontal abierto                                   | Mantener matriz y prueba usuario A/usuario B en cada recurso nuevo                                    |
| 7. Bloquear manipulación de campos   | Parcial                                                                                  | El servidor debe derivar scoring, nivel, objetivos y contexto; no aceptar resultados del cliente      |
| 8. Proteger cookies de sesión        | Auth.js + `sessionVersion` revocable                                                     | Verificar flags reales en HTTPS, duración, rotación y reautenticación sensible                        |
| 9. Hashear contraseñas               | bcrypt cost 12; tokens hasheados y sesiones invalidadas al reset                         | Argon2id o política avanzada documentada; revisar OAuth                                               |
| 10. Limitar intentos de login        | Contadores PostgreSQL atómicos por identidad/IP                                          | Prueba multi-instancia, métricas, alertas y limpieza operativa                                        |
| 11. Protección contra bots           | Honeypot silencioso implementado                                                         | Turnstile/alternativa administrada de activación progresiva                                           |
| 12. Monitorizar consultas DB         | Falta en producción                                                                      | Métricas de latencia, errores, locks, pool, capacidad y consultas lentas                              |
| 13. Validar todas las entradas       | Bastante avanzado, no completo                                                           | Esquemas consistentes y validación semántica/ownership, no solo tipo y longitud                       |
| 14. Escapar contenido del usuario    | React lo hace; HTML peligroso actual es estático                                         | Mantener prohibición de HTML arbitrario y añadir pruebas si aparece contenido enriquecido             |
| 15. Restringir subida de archivos    | Completo para Speaking Lab y Writing manuscrito                                          | QA móvil WebM/M4A y malware scan antes de admitir formatos más amplios                                |
| 16. Limitar respuesta/API            | Hay límites de tamaño y output en varias features                                        | Límite global de body, timeouts, paginación, errores normalizados y no reenviar body del proveedor    |
| 17. Cabeceras de seguridad           | Baseline global aplicado y probado                                                       | Afinar CSP final y cookies en el dominio HTTPS real                                                   |
| 18. Forzar HTTPS                     | Pendiente de despliegue                                                                  | Dominio HTTPS, redirects y luego HSTS                                                                 |
| 19. Escanear dependencias            | Gate CI bloqueante; excepción Prisma CLI exacta hasta 2026-10-16                         | Retirar excepción al existir cadena corregida y mantener SCA recurrente                               |

## 7. Plan de ejecución recomendado

### Entrega 0 — congelar la línea base y sanear el tablero

- [x] `BASE-01` Registrar este documento como fuente de verdad del programa pre-beta.
- [x] `BASE-02` Reconciliar `TASKS.md`: cerrar tareas ya superadas y mover historia a `TASKS_ARCHIVE.md` solo cuando se verifique en código.
- [x] `BASE-03` Corregir exclusiones de lint y hacer que `npm run lint` funcione desde la raíz.
- [x] `BASE-04` Capturar baseline: typecheck, lint, tests, build, cobertura i18n, auditoría de dependencias y tamaños.
- [x] `BASE-05` Ejecutar integración local sobre PostgreSQL efímero/local; eliminar la dependencia de latencia o estado de la DB remota que dejó colgada la repetición de esta auditoría.

Salida: tablero limpio, números reproducibles y ninguna ambigüedad sobre qué está pendiente.

### Entrega 1 — seguridad e integridad del producto

- [x] `SEC-01` Actualizar Next.js/dependencias y cerrar alertas críticas/altas (con excepción temporal de tooling Prisma documentada arriba).
- [x] `SEC-02` Corregir ownership, estado y orden del examen de ubicación.
- [ ] `SEC-03` Persistir evaluación oral y derivar crédito solo en servidor. **Fase A completada:** intento, nivel, score, resultado y crédito son server-owned. **Fase B pendiente:** transcript/confidencias con procedencia autenticada desde Realtime sideband/monitoring.
- [ ] `SEC-04` Hacer server-owned el avance de lección, grading de Vocabulary/Quiz, referencias de Speaking y contexto/evidencia Realtime que afectan reflexión o puntos. **Completado:** pasos, Vocabulary y Quiz. **Pendiente:** referencias y evidencia de las superficies de Speaking/Realtime, tratadas por separado.
- [ ] `SEC-05` Implementar email real, verificación obligatoria, reenvío y logs sin tokens. **Código completado:** adaptador Resend, fallo cerrado en producción, verificación obligatoria y cero links/tokens en logs. **Pendiente:** credenciales/dominio de staging, prueba de entrega y reenvío seguro.
- [ ] `SEC-06` Añadir rate limiting distribuido y anti-bot a autenticación. **Completado:** contadores PostgreSQL atómicos por identidad/IP y honeypot. **Pendiente:** desafío administrado progresivo (Turnstile) y prueba multi-instancia en staging.
- [ ] `SEC-07` Hash de tokens, política de password y revocación de sesiones. **Completado:** hash, consumo único, transacciones y `sessionVersion`. **Pendiente:** política avanzada de contraseña, duración/reautenticación y revisión de tokens OAuth.
- [ ] `SEC-08` Retención real, borrado de objetos y limpieza de huérfanos. **Código y pruebas locales completados:** preferencias 0/7/30/90/365/indefinida, cron, outbox reintentable, account deletion y huérfanos. **Pendiente:** proveedor cloud + alertas en staging y política pública/backups.
- [x] `SEC-09` Validación profunda de audio/imágenes. **Completado para las superficies actuales:** Speaking Lab y Writing manuscrito validan y decodifican contenido real en servidor; Han permanece fuera de este cambio.
- [x] `SEC-10` Auditoría IDOR completa de Server Actions y APIs. **Cerrada:** 32 archivos de actions, 11 handlers y layouts privados inventariados; matrices y pruebas A/B no dejaron accesos horizontales abiertos.
- [x] `SEC-11` Escaneo del historial Git y rotación de secretos si corresponde. **Cerrado localmente:** 23 commits y todo el árbol no ignorado pasan un escáner redacted de claves de proveedores, private keys, URLs con credenciales y literales sensibles; no hubo valores que rotar. CI usa `fetch-depth: 0` y repite el gate. Pendiente operacional: activar secret scanning del proveedor Git como segunda línea independiente.

Salida: ningún usuario o navegador controla datos que afecten nivel, puntos, propiedad, consumo o información ajena.

### Entrega 2 — calidad automatizada y cadena de entrega

- [x] `QA-01` Fixtures de admin autocontenidos.
- [x] `QA-02` Traducciones portables entre bases/IDs o fixtures ES deterministas.
- [x] `QA-03` Seed mínimo explícito para ejercicios y demás supuestos de integración.
- [x] `QA-04` Aislar pruebas concurrentes y datos temporales.
- [x] `QA-05` CI con typecheck, lint, unit, component, integration, smoke, build, Prisma y SCA.
- [ ] `QA-06` Branch protection y dos ejecuciones verdes desde cero.
- [ ] `QA-07` Agregar casos de seguridad de Entrega 1.

Salida: cada cambio demuestra que funciona sobre una base vacía sin depender del entorno personal.

### Entrega 3 — plataforma de staging/producción

- [ ] `OPS-01` Elegir y documentar hosting, Postgres, storage, email y regiones.
- [ ] `OPS-02` Separar secretos/dev/staging/prod y aplicar mínimo privilegio DB.
- [ ] `OPS-03` Adaptador cloud storage y URLs privadas; migración de audio necesaria.
- [ ] `OPS-04` HTTPS, dominio, OAuth callbacks y cron autenticado.
- [ ] `OPS-05` Cabeceras y CSP sin romper voz, audio, fotos ni OAuth.
- [ ] `OPS-06` Backups/PITR y simulacro de restauración.
- [ ] `OPS-07` Observabilidad, alertas, runbooks, rollback y status operativo.
- [ ] `OPS-08` Presupuesto global de IA, reservas atómicas y kill switches.
- [ ] `OPS-09` Política de despliegue de migraciones y seeds.

Salida: staging y producción son privadas, repetibles, observables y recuperables.

### Entrega 4 — privacidad, contenido y experiencia móvil

- [ ] `BETA-01` Términos, privacidad, IA, retención, borrado y edad/mercado revisados.
- [ ] `BETA-02` QA Android/iPhone y matriz de navegadores/voz/cámara/red.
- [ ] `BETA-03` Auditoría de accesibilidad con teclado, lector, contraste y reduced motion.
- [ ] `BETA-04` Optimizar imágenes con comparación visual y presupuesto de performance.
- [ ] `BETA-05` Revisión humana curricular ES/ZH/pinyin y muestra completa por nivel.
- [ ] `BETA-06` Calibración de placement y QA de vocabulario HSK con audio real.
- [ ] `BETA-07` Limpiar rutas QA, decisiones de features bloqueadas y documentación obsoleta.

Salida: experiencia mobile-first consistente, comprensible y jurídicamente presentable.

### Entrega 5 — beta cerrada medible

- [ ] `LAUNCH-01` Invitación limitada y cohortes identificables.
- [ ] `LAUNCH-02` Eventos de funnel y aprendizaje con minimización de datos.
- [ ] `LAUNCH-03` Welcome announcement, feedback y soporte.
- [ ] `LAUNCH-04` Smoke de producción y ejercicio de incidente antes de invitar.
- [ ] `LAUNCH-05` Revisiones D1, D7, costo, errores, aprendizaje y entrevistas.
- [ ] `LAUNCH-06` Criterio explícito para ampliar, pausar o corregir.

Salida: evidencia real de activación, retención, valor educativo, estabilidad y costo.

### Entrega 6 — PWA/APK basada en evidencia

- [ ] `APP-01` Manifest e instalación PWA, sin cachear datos privados.
- [ ] `APP-02` Medir demanda y problemas reales de instalación/retorno.
- [ ] `APP-03` Prototipo de wrapper solo si agrega valor claro.
- [ ] `APP-04` Closed testing de Google Play, permisos y actualizaciones.

Salida: decisión de app informada por comportamiento real, no por anticipación.

## 8. Orden estricto de trabajo

1. `BASE-01` a `BASE-05`.
2. `SEC-01` a `SEC-11`; `SEC-02`, `SEC-03`, `SEC-05` y `SEC-08` son los primeros cambios funcionales.
3. `QA-01` a `QA-07` hasta lograr CI verde.
4. `OPS-01` a `OPS-09` en staging.
5. `BETA-01` a `BETA-07` con dispositivos y revisión humana.
6. `LAUNCH-01` a `LAUNCH-06` con una cohorte pequeña.
7. `APP-01` a `APP-04` solo después de evaluar la beta web.

Dependencias importantes:

- No desplegar públicamente antes de `SEC-*`, `QA-*` y los controles obligatorios de `OPS-*`.
- No activar CSP en modo enforce sin completar la prueba de voz/cámara/OAuth.
- No habilitar RLS sin una estrategia segura de contexto por transacción y pool.
- No medir beta antes de definir eventos y privacidad.
- No convertir a APK para evitar arreglar problemas web; ambos compartirían los mismos riesgos del backend.

## 9. Definition of Done para beta pública

La beta se puede abrir únicamente cuando:

- [ ] No quedan vulnerabilidades críticas/altas explotables en runtime.
- [ ] Propiedad, orden y scoring del placement son autoritativos en servidor.
- [ ] Ninguna puntuación, crédito, HanCoin o progreso depende de valores confiados al navegador.
- [ ] Email real, verificación, rate limits y anti-bot funcionan.
- [ ] Secretos no aparecen en repo, historial, bundle, errores ni logs.
- [ ] Cookies, HTTPS, cabeceras y CSP fueron verificadas en el dominio real.
- [ ] Retención y borrado eliminan DB y objetos privados de forma comprobable.
- [ ] Storage privado, backups, restore, monitoreo y rollback están probados.
- [ ] CI pasa dos veces desde base vacía y es obligatoria para `master`.
- [ ] Los flujos críticos pasan en Android Chrome e iPhone Safari.
- [ ] Política de privacidad, términos y aviso de IA reflejan el producto real.
- [ ] Existe límite global de costos y alerta antes de agotar presupuesto.
- [ ] Hay canal de soporte, feedback, responsable de incidentes y criterio para pausar.

## 10. Indicadores de éxito de la beta

No conviene fijar metas definitivas sin baseline real, pero sí medir desde el primer usuario:

- Activación: verificación + onboarding + primer paso educativo completado.
- Tiempo hasta el primer valor: minutos hasta terminar la primera interacción útil.
- Primera producción: usuario que habla o escribe chino, no solo navega.
- Finalización de primera lección y primer escenario.
- Retención D1 y D7 por cohorte.
- Errores y abandono por superficie, idioma y dispositivo.
- Latencia y éxito de STT/TTS/Realtime/IA.
- Costo de IA por usuario activado, por lección y por usuario retenido.
- Mejora educativa observable y comprensión reportada.
- Motivos cualitativos para regresar, abandonar o recomendar.

## 11. Referencias de seguridad

- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP REST Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP Bot Management and Anti-Automation: https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html
- OWASP Cryptographic Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- Next.js security headers: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- Next.js Content Security Policy: https://nextjs.org/docs/app/guides/content-security-policy
- Next.js production checklist: https://nextjs.org/docs/pages/guides/production-checklist
- Next.js advisory GHSA-p293-qw3h-jr36: https://github.com/advisories/GHSA-p293-qw3h-jr36
- Next.js advisory GHSA-2xp9-vwfh-vxw4: https://github.com/advisories/GHSA-2xp9-vwfh-vxw4

## 12. Próximo lote recomendado

El primer lote técnico ya cerró `BASE-01` a `BASE-05`, `SEC-01`, `SEC-02`, la fase A de `SEC-03`, pasos/Vocabulary/Quiz de `SEC-04`, el endurecimiento local de `SEC-05` a `SEC-09` y `QA-01` a `QA-05`. El siguiente lote debe concentrarse en:

1. Terminar `SEC-05` en staging: verificar dominio, configurar Resend, probar entrega/fallo y añadir reenvío seguro sin enumeración.
2. Terminar `SEC-06`/`SEC-07`: Turnstile progresivo, prueba multi-instancia, dummy hash, aceptación legal versionada y política avanzada de contraseña/sesión/OAuth.
3. Cerrar `SEC-08` operacionalmente: probar la outbox contra almacenamiento cloud privado, alertar fallos pendientes y publicar la política de retención/backups.
4. Activar secret scanning del proveedor Git como segunda línea independiente del gate local `security:secrets`.
5. Diseñar `SEC-03B`/`SEC-04B` como una sola capa durable de procedencia Realtime sideband/monitoring, manteniendo separadas las superficies pedagógicas de Han, Learning Journey Speaking y Speaking Lab.
6. `QA-06`: dos ejecuciones remotas verdes y protección de `master`; después ampliar `QA-07` con los casos de autenticación, privacidad y Realtime.

Este lote reduce el riesgo público restante sin mezclar rediseño visual ni cambios en la experiencia conversacional de Han. Debe mantenerse verde el gate local completo y demostrarse luego en GitHub Actions desde una base vacía.
