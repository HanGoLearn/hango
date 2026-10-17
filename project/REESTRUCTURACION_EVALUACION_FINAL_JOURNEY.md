# Journey — reestructuración real de evaluación y feedback

Fecha: 11 de octubre de 2026. Autorización del usuario: implementar la propuesta
completa por partes y reiniciar cuentas/puntajes en **local y producción**,
conservando únicamente al administrador. Este documento sustituye la restricción
anterior de conservar puntajes históricos para ese reinicio concreto; no autoriza
un reset completo del currículo, secretos o infraestructura.

## Resultado objetivo

Una práctica identificable por intento, independiente de Han Tutor/Companion/Lab,
con banco y rúbrica versionados, evidencia trazable, nota calculada en servidor,
feedback corto ES/EN y una sola evaluación final de IA por intento como objetivo.
No evaluar pronunciación/tonos/ritmo desde texto ni convertir silencio o un fallo
de reconocimiento en un error de idioma. No exigir cobertura de todas las palabras.

## Partes y aceptación

| Parte | Trabajo                                 | Condición de aceptación                                                                                                                                            | Estado                                                                          |
| ----- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| EV-01 | Intento independiente y captura sellada | Usuario/lección/solicitud aislados, banco y objetivo del servidor, transcripción acotada y sin mezcla de sesiones                                                  | Base y cableado de captura probados; activación pendiente                       |
| EV-02 | Rúbrica y evidencia                     | Comunicación 40 %, idioma 30 %, interacción 20 %, autonomía 10 %; seis estados de evidencia; citas verificadas; faltantes no son cero                              | Contrato y evaluador preparados; calibración pendiente                          |
| EV-03 | Evaluación final única y validación     | Resultado estructurado, sin instrucciones del alumno, concurrencia/caché/errores controlados y sin regenerar al visualizar                                         | Backend y captura cableados/probados; activación pendiente                      |
| EV-04 | Informe ES/EN e integración             | Un logro, una mejora prioritaria y siguiente paso; nota/estado coherentes con ejercicios, puntos, estrellas y HanCoins; sin duplicar recompensas                   | Informe/UI, guardado y liquidación condicional preparados; activación pendiente |
| EV-05 | Pruebas, transición y reinicio          | Casos simulados e integración; aceptación real separada; respaldo y verificación de ambas bases; solo administrador; currículo y acceso administrativo conservados | Pendiente                                                                       |

Los pesos nuevos se aplican al componente Speaking, no cambian implícitamente
los pesos globales 20/20/30/30 ni los umbrales de General Level. No otorgar una
nota global completa si faltan dimensiones esenciales; mostrar resultado parcial
o pendiente, no promediar faltantes para inflar la nota.

## Contrato pedagógico

- Producción autónoma, uso con apoyo, comprensión observada, error confirmado,
  no observado y sin oportunidad son estados distintos. No convertir una
  respuesta genérica afirmativa en comprensión de todo el vocabulario.
- Pregunta estándar + respuesta adecuada no equivale a copiar un modelo.
  Repetición explícita después de una ayuda sí debe identificarse como asistida.
- Principiante: respuestas breves y pausas normales; avanzado: precisión y
  adecuación, no más palabras por sí mismas. Nivel relativo a la ficha, no puntos.
- Paráfrasis y desviaciones breves pertinentes son válidas. Objetivo comunicativo,
  no guion ni cuota léxica. Autocorrección aporta evidencia positiva.
- Un mismo problema no se descuenta repetidamente entre criterios. Pedir ayuda
  ES/EN no genera penalización general. Fallos del personaje limitan la evaluación.
- Evidencia insuficiente o técnica: nota nula con estado explícito; nunca inventar
  precisión acústica, un error, consenso, logro o dominio de todos los ítems.
- Feedback: resumen honesto, logro con cita, prioridad con cita y ejemplo chino
  con pinyin/traducción cuando corresponda, próximo paso concreto. Sin errores
  fiables, ampliar práctica sin inventar una corrección. Detalles fuera de la
  conversación, dentro del informe existente, no paneles en vivo nuevos.

## Arquitectura y límites de confianza

- IDs de intento y turno, autor, sesión, banco, idioma y rúbrica. Los títulos
  traducidos no son identificadores. No consultar la conversación global de Han
  para reconstruir o certificar un intento nuevo.
- El servidor obtiene usuario, lección publicada, permisos y bancos. El cliente
  no envía notas ni elige el banco/objetivo que debe evaluar el servidor.
- La captura WebRTC procede del navegador y se etiqueta como tal: no es una
  transcripción autenticada directamente por el proveedor. Validar su forma y
  aislarla no la convierte en prueba antifraude o examen oficial. No se inventa
  verificación de audio ni confianza acústica.
- Sellar el intento una sola vez; solicitudes repetidas idempotentes. Un intento
  ajeno, de otra lección o ya sellado no admite sustitución de sus turnos.
- Validación de citas, autor, IDs de contenido y límites antes de calcular nota.
  El JSON correcto no certifica juicio semántico: calibración humana pendiente.
- Una evaluación conjunta, agregación determinista y caché; sin llamada por
  criterio, panel o visita. Límites y consumo administrador siguen la experiencia
  de reflexión existente. No cambiar modelo ni precio fijo por inferencia.
- Conservar progreso del estudiante y sistemas independientes durante la
  implementación. El borrado autorizado se realiza como operación separada.

## Reinicio autorizado: local + producción

Ejecutar **al terminar la integración y verificaciones**, no para encubrir errores.

1. Identificar ambas conexiones explícitamente y comprobar que son las bases
   correctas; no deducir producción de `.env.local` o asumir que son iguales.
2. Verificar la cuenta administradora `hango.learn@gmail.com`, rol y acceso en
   cada destino. Si falta o hay discrepancia, detener el borrado, no improvisar.
3. Preparar respaldo recuperable, privado y fuera de Git; proteger secretos de
   autenticación si se incluyen. Registrar destinos y conteos sin contraseñas.
4. Revisar cascadas, grabaciones privadas, invitaciones y consecuencias de quitar
   usuarios. Reiniciar puntajes/progreso sin eliminar currículo, traducciones,
   cachés compartidas, claves, OAuth, permisos o políticas de IA.
5. Preservar o archivar gastos reales de API: reiniciar cuentas/puntos no debe
   confundirse con afirmar que nunca hubo consumo. Determinar efecto de cascadas
   antes de aplicar; el respaldo no sustituye esa decisión operativa.
6. Aplicar de forma transaccional con destino y administrador exactos, verificar
   que queda una sola cuenta y que puede entrar. No duplicar recompensas.

No usar `prisma migrate reset` ni `db push --accept-data-loss`: borrarían material
fuera del alcance. No hay borrado, respaldo realizado ni cambio de producción
por la mera existencia de este plan. Publicación y aceptación oral no se dan por
hechas; se registrará evidencia al completarlas.

## Verificación

Pruebas: mezcla de intentos, otro usuario/lección, payload falsificado, doble
cierre y concurrencia; principiante breve, ayuda/copias/autocorrección, paráfrasis,
alumno avanzado, desvío pertinente, objetivo no intentado, falta de oportunidad,
transcripción dudosa, ruido, salida temprana, fallo del personaje, JSON inválido,
citas ajenas, fallo técnico, idiomas, coste/caché y recompensas idempotentes.

Skills: Prisma Client API (selecciones, relaciones, transacciones), Prisma CLI
(migración aditiva/cliente y base temporal) y OpenAI Docs (salida estructurada,
validación y separación entre formato correcto y juicio correcto).
Referencia: [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Entrega inicial verificada

- Tres tablas nuevas y tres enumeraciones de Journey, con migración aditiva
  `20261011150000_journey_speaking_evidence_v2`, sin backfill ni cambios de
  notas antiguas. Cliente regenerado; esquema validado.
- Servicios de inicio/lectura/sellado preparados, **sin endpoints, acciones o
  componentes que los activen todavía**. Comprueban publicación, acceso al
  capítulo beta y disponibilidad de lección; bancos del servidor.
- Cuenta/lección/solicitud UUID aislados. Hasta tres intentos activos, captura
  de 80 turnos/24000 caracteres y autores válidos; sin notas enviadas por el
  cliente. Cierre repetido concurrente no duplica turnos, una sustitución se
  rechaza. SHA-256 canónico compatible con JSONB; integridad verificada al leer.
- Contrato de cuatro criterios ordinales y cálculo determinista; cita, autor,
  ID, versión e idioma comprobados. Cobertura no es multiplicador. Si falta
  evidencia esencial, hay limitaciones o fallo técnico, nota nula y estado
  explícito. Sin puntuación acústica inventada. Comprueba forma/trazabilidad,
  no exactitud semántica ni confianza acústica del reconocimiento.
- Incertidumbre de reconocimiento y autocorrecciones deben conectarse a la
  captura real en EV-03; no convertir hipótesis de transcripción en producción
  certificada. **Todavía no se activa esta rúbrica en Reflection.**
- **746 pruebas focalizadas en 19 suites y 13 integraciones reales** en
  Postgres desechable pasan: los 164 bancos, permisos/cuentas, concurrencia,
  límites, integridad, restricciones de nota parcial y ausencia de escrituras
  en progreso/conversación de Han. Tipos/lint/esquema pasan.
- El runner fuerza DATABASE_URL y DIRECT_URL al destino temporal, impidiendo
  que dotenv o una variable heredada dirijan migraciones a una base real.
  Migración probada solo en base desechable, **no aplicada en bases
  persistentes**. Clusters temporales retirados.
- Inspección local de solo lectura: 29 usuarios, un administrador verificado
  `hango.learn@gmail.com`; 46 informes, 54 completados, 23 progresos, 108
  registros de consumo y 164 lecciones publicadas. Conteos de esta inspección,
  no evidencia de producción ni saldo de OpenAI.
- `scripts/inspect-evaluation-reset.ts` exige archivo y etiqueta explícitos
  y conexión de solo lectura; muestra conteos, no secretos. No puede borrar
  ni respaldar. **Producción no inspeccionada; respaldo no realizado y ninguna
  cuenta o puntaje borrados en ningún entorno.**
- Sin API pagada, cambios de modelo/precio, build de producción, aceptación
  oral, commit, push o despliegue. El informe visible sigue siendo el anterior
  hasta completar EV-03/04. **La reestructuración completa no está lista.**

Siguiente bloque: EV-04 informe ES/EN, estado de nota global, recompensas
y activación coherente de EV-03. Después EV-05 transición
y reinicio explícito de ambas bases, con administrador y respaldo verificados.
No usar el borrado para sustituir integración o pruebas.

## EV-03 — evaluador único preparado y verificado

Actualización del 11 de octubre, posterior a la entrega inicial:

- `journey-speaking-evaluation-service.ts` obtiene exclusivamente el intento
  sellado del propietario/lección, comprueba integridad y versiones y guarda
  evaluación/feedback juntos. No consulta el hilo de Han ni el último título.
- Creación idempotente y reclamación atómica: ocho solicitudes concurrentes
  producen una sola invocación. Resultado completo/parcial/fallido se reutiliza;
  no hay regeneración de IA por visita, ni segunda llamada para el resumen.
- Estados explícitos: captura abandonada o solo saludo no consume evaluación.
  Fallo técnico deja nota nula; JSON/citas inválidos, rechazo, truncamiento,
  límite de presupuesto o timeout no se convierten en cero o nota inventada.
- Una sola expedición máxima por intento, también si falla. Sin reintento
  automático del transporte. Worker vencido queda fallido; una respuesta tardía
  registra el gasto si devuelve uso, pero no reemplaza ese resultado. Una
  eventual recuperación manual necesita política explícita: **no implementada**.
- Salida estructurada optativa con el mismo contrato Zod y cálculo local de
  notas; modelo `gpt-5-mini` y comportamiento de los chats existentes conservados.
  Se verifican citas/autor/IDs/idioma declarado/versiones antes de guardar nota.
  Esto no certifica que el juicio semántico o el idioma real de cada frase sean
  perfectos. Calibración y aceptación pedagógica real siguen pendientes.
- Consumo enlazado a la evaluación mediante `usageLogId`, con tokens y tarifas
  existentes bajo `lesson-reflection` / `LESSON_REFLECTION`. Se registra uso
  devuelto incluso si la respuesta resulta inutilizable. Un timeout sin usage
  es gasto desconocido, **no prueba de costo cero**. Mock o proveedor sin soporte
  estructurado nunca fabrican notas del alumno.
- **794 pruebas en 27 suites y 40 integraciones en 4 archivos pasan**. Incluyen
  los 164 bancos, evaluación concurrente, respuesta tardía, permisos, límites,
  contabilidad y regresiones de Han/voz. Tipos y lint focalizado pasan. Pruebas
  con respuestas simuladas y Postgres desechable; clusters retirados.
- Estado de aquella entrega: **backend aún no conectado a Speaking/Reflection**. Faltan acciones
  autenticadas, captura real con incertidumbre/autocorrección, informe ES/EN,
  agregación global y recompensas de EV-04. Ningún cambio de modelo/precio,
  migración persistente, nota real, cuenta, GitHub o producción en esta entrega.
  Reinicio de ambas bases sigue pendiente de EV-05 y respaldo verificado.

Guías usadas: Prisma Client API para reclamaciones atómicas y propietario;
Prisma CLI para aplicar migraciones solo al cluster temporal; OpenAI Docs para
JSON estricto y manejo de rechazo/truncamiento sin ocultar uso.
Fuentes: [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs)
y [soporte del modelo conservado](https://developers.openai.com/api/docs/models/gpt-5-mini).

## EV-03 — captura conectada detrás de activación explícita

Segunda actualización del 11 de octubre:

- Acciones de inicio/sellado autenticadas. El navegador no elige usuario,
  banco, nota ni objetivos. Errores públicos acotados sin filtrar excepciones.
  No invocan proveedores ni recompensas. Los callbacks de Speaking envían un
  intento sellado y pasarán su ID a Reflection a través de la respuesta del paso.
- La conexión Realtime opcional valida el ID del intento **antes** de reservar
  presupuesto o invocar al proveedor. Debe ser propio, activo y de esa lección;
  emplea banco/roles/objetivo congelados del servidor. Un ID inválido o de otro
  sistema no se ignora ni cae al modo antiguo. El navegador comprueba el ID
  devuelto por el handshake. Esto no autentica los posteriores eventos WebRTC.
- Una segunda migración aditiva `20261011170000_journey_speaking_capture_quality`
  añade dos columnas JSON opcionales. No reescribe la migración anterior ni
  notas históricas. Al sellar, el hash incluye transcripción original,
  interpretación/confianza disponible y limitaciones de captura. Alterar estos
  metadatos después del sellado invalida integridad.
- Captura de voz propia conserva texto original completo (hasta sus topes),
  separado de la interpretación contextual, sin el corte de 240 caracteres
  del diagnóstico antiguo. Interpretación distinta/confianza baja no acredita
  producción literal o errores; obliga resultado parcial aunque el modelo
  omita la limitación. Confianza ASR es un indicador heurístico, no un porcentaje
  de pronunciación ni una medición objetiva de tonos/ritmo.
- End, cierre natural, fallo técnico y abandono se distinguen. Audio pendiente
  y reproducción interrumpida se declaran como captura incompleta, sin castigar
  al alumno. Capturas excesivas se acotan con estado técnico explícito, no se
  presentan como completas. Se evita mezclar mensajes/evidencia con Han Tutor,
  Companion o Lab y se elimina la revisión silenciosa adicional en este modo.
- Guardado pendiente/fallido visible ES/EN; no dice “guardado” si falló ni deja
  avanzar mientras falta ese guardado. Reintento reenvía exactamente el mismo
  payload sellado sin nueva sesión/evaluación. En esta modalidad la alternativa
  textual global no se utiliza para fingir una evaluación oral; integración
  del caso sin voz con el informe parcial corresponde a EV-04.
- Desmontar solicita abandono de forma best effort: no garantiza red al cerrar
  el navegador. Intentos activos nunca sellados de más de 20 minutos expiran al
  iniciar uno nuevo, sin alterar informes sellados o currículo. La conexión no
  acepta IDs vencidos. No es límite financiero servidor de duración WebRTC.
- Inicio limitado a 30 intentos nuevos por cuenta en 10 minutos, dentro de la
  transacción serializable. Cancelar no permite acumular intentos sin límite;
  reutilizar la misma solicitud no consume un nuevo intento. Es protección
  operativa de almacenamiento, no un cambio de tarifas o límites de gasto IA.
- QA local (`testMode`) no guarda intentos ni historia general ni solicita la
  revisión silenciosa. Una prueba de voz real iniciada por el usuario aún puede
  consumir Realtime; **estas verificaciones usaron conexiones/IA simuladas**.
- `LessonEngine.journeyEvidenceCapture` / `SpeakingStep.evidenceCapture` están
  **apagados por defecto** y la página real aún no los activa. No habilitarlos
  antes de EV-04 ni de aplicar las migraciones al destino correcto. No se
  introdujo una variable que active solo media reestructuración accidentalmente.
- **813 pruebas en 29 suites y 46 integraciones en 5 archivos pasan**. Incluyen
  captura larga, originales/hipótesis, callback de abandono, caída de conexión,
  reintento de guardado, permisos, expiración, incertidumbre persistida y los
  164 bancos. Tipos, lint focalizado y esquema pasan; migraciones únicamente
  probadas en Postgres desechable, ya retirado.
- Build de Next completo, incluidas 68 páginas estáticas y comprobación de
  tipos. Aviso del driver sobre cambios futuros en aliases de SSL registrado;
  no se cambiaron conexiones o certificados en esta entrega.
- Sin llamadas pagadas, activación de evaluación v2, aceptación oral,
  migraciones persistentes, cambios de notas/recompensas, borrado de cuentas,
  respaldo, GitHub o producción. EV-04 y EV-05 siguen pendientes.

Skills usadas: Prisma Client API/CLI para permisos, metadatos/transacciones y
migración aditiva temporal; OpenAI Docs para separar reconocimiento y captura
de audio verificado. Fuente consultada:
[Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription).

## EV-04A — informe y nota global preparados, sin liquidación ni activación

Entrega posterior del 11 de octubre:

- Cada intento nuevo con progreso real congela una fotografía de los ejercicios
  del servidor: versión, ID/inicio de ese recorrido, fecha de captura, preguntas,
  primer intento y resultado. Snapshot incluido en el hash canónico existente;
  no requiere otra tabla/migración ni envía resultados al evaluador de Speaking.
  Sin progreso real no inventa un recorrido ni evidencia de ejercicios.
- Primer intento por pregunta, ordenado por fecha/ID: correcto, incorrecto,
  enviado sin evaluar y sin respuesta son distintos. Reintentos correctos o
  claves inventadas no inflan la nota. Quick test aprobado sustituye el recorrido
  de esa palabra; quick test fallido requiere preguntas reales de remediación.
  Se excluyen preguntas que el constructor no puede mostrar. Lecturas acotadas
  fallan explícitamente si alcanzan el tope, sin convertir truncamiento en error.
- Gramática sigue los ejercicios publicados de las tarjetas de esa lección;
  comprensión conserva la categoría conjunta comprensión/práctica guiada.
  Los tres resúmenes solo tienen porcentaje al evaluar todas sus preguntas.
  Sin preguntas previstas se declara sin oportunidad, no 0 ni 100.
- Conserva pesos globales 20/20/30/30 y bandas de estrellas actuales. La nota
  global y estrellas son nulas si falta una parte esencial o Speaking es
  parcial/insuficiente/fallido/pendiente; no renormaliza pesos. Elegibilidad de
  recompensas **no significa recompensas otorgadas**: estado NOT_SETTLED.
- `advanceLessonStep` valida el ID opcional v2 antes de guardarlo: solo Speaking,
  propietario/lección, captura sellada (incluido fallo técnico), versión y
  recorrido exacto. Rechaza activos, abandonados, ajenos, recorridos anteriores
  y campos extra como notas. Camino antiguo sin este payload sigue funcionando.
- Lector nuevo obtiene exclusivamente el intento elegido en la respuesta del
  paso Speaking completado del recorrido vigente. Ni título traducido ni última
  sesión ni conversación global. Evalúa versión, hash y citas; vuelve a calcular
  el porcentaje del caché antes de mostrarlo. Resultado manipulado queda fallido
  y nulo; nunca se regenera con IA para ocultar el problema.
- Lectura/polling y generación explícita separados: consultar no dispara IA.
  Generación usa la evaluación conjunta existente, como máximo una expedición
  por intento; no hace traducción pagada ni segunda narrativa. Feedback queda
  en el idioma ES/EN congelado del intento. Cambio de idioma de interfaz no
  autoriza traducir ese informe con otra llamada.
- Componente de informe preparado, **todavía no montado en la página real**:
  nota/estado, datos de ejercicios, un logro, una prioridad, siguiente paso,
  ejemplo chino/pinyin/traducción y evidencia ampliable. Sin reproducción
  automática, porcentajes acústicos, felicitaciones inventadas o panel en vivo.
- La fotografía se toma antes de Speaking y no cambia con respuestas/ediciones
  posteriores. **Antes de activar hay que comprobar de extremo a extremo que
  las respuestas anteriores terminan de guardarse antes de comenzar voz**.
  Un guardado retrasado no se trata como error, pero esta entrega no recupera
  automáticamente la fotografía; recuperación explícita pendiente de integración.
- **837 pruebas en 31 suites y 63 integraciones en 7 archivos pasan**, tipos,
  lint y compilación completa de Next (68 páginas estáticas). Integraciones en
  Postgres desechable, ya retirado; IA/conexiones de prueba simuladas. La base
  recién sembrada no recupera enriquecimientos de gramática previos: el test
  completo añade un ejercicio gramatical explícito exclusivamente temporal.
  No se rellenaron notas por ausencia de ese material. Esto no es auditoría
  de la disponibilidad de ejercicios en las bases persistentes.
- Sigue pendiente guardar el informe v2 de forma compatible con progreso,
  General Level, logros y HanCoins, con liquidación idempotente; también el caso
  sin micrófono, acciones/UI de lectura/generación y activación coherente. El
  informe antiguo sigue activo; esta entrega **no lo sustituye ni recalcula**.
- Sin API pagada, escrituras/migraciones en bases persistentes, aceptación oral,
  cuentas borradas, respaldo, commit/push o despliegue. EV-05 sigue para el final.
  Aviso futuro de aliases SSL del driver permanece; conexiones sin cambios.

Skills Prisma Client API/CLI guiaron selección por propietario/recorrido,
transacciones de snapshot y pruebas temporales. OpenAI Docs guió la separación
de salida válida/inutilizable y lectura sin reintentos pagados:
[Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat).

## EV-04B — conexión preparada con General Level y recompensas

Entrega posterior del 11 de octubre. No modifica pesos, umbrales, presupuesto
por capítulo, modelos, tarifas ni reglas de acceso; no crea otro sistema de puntos.

- Guardado explícito del resultado v2 en `LessonReflectionReport`: sus notas
  verificadas alimentan los lectores existentes de General Level, progreso,
  ranking y logros. `speakingDimensions` utiliza un JSON versionado de procedencia
  (versión, intento y recorrido), **no** dimensiones acústicas antiguas. Criterios,
  citas y feedback se leen y revalidan desde la evaluación del intento propio.
  Reutiliza una columna existente: no añade migración, ni backfill ni sustitución
  de informes anteriores. Un informe legado existente exige redo explícito.
- Transacción serializable: verifica nuevamente propietario, paso seleccionado,
  recorrido, hashes, evaluación y nota; guarda proyección, HanCoins de lección,
  evidencia Speaking, logros de nota/nivel y General Level juntos. Si falla una
  parte se revierte todo, incluido el marcador de recompensas. Reintentos acotados
  de conflictos de serialización solo repiten consultas, nunca llamadas de IA.
  Perfil ausente no se crea silenciosamente ni permite anunciar GP confirmado.
- General Level conserva la fórmula y recalcula desde sus fuentes dentro de esa
  transacción; no incrementa puntos por visita. Lecturas y guardados repetidos no
  añaden evidencia, monedas ni llamadas. HanCoins mantiene `lesson:<id>` una vez
  por lección, incluso después de redo; SETTLED significa cadena procesada, **no**
  otro pago ni que cada redo conceda el número de monedas de sus nuevas estrellas.
- Informes pendientes/parciales guardan nota global nula sin premios o evidencia
  de dominio inventada. El cierre de escenario ahora exige notas finales enteras
  0–100 de todas sus lecciones: un nulo no completa; un cero legítimo sí es nota.
  La cadena de cierre/recompensas de escenario permanece separada y no se afirma
  incluida en la transacción de lección. Su llamada desde resultados/UI queda
  para la siguiente integración; no es un bono adicional de General Level.
- Guardas en ambos lectores antiguos impiden interpretar/regenerar una evaluación
  v2 como la rúbrica antigua o reconstruirla desde el chat global. Una versión
  inválida también queda bloqueada. Si un caché/proyección ya liquidado se altera,
  no confirma recompensas ni lo corrige con otra llamada pagada: requiere revisar
  integridad; no revoca automáticamente gastos, monedas o logros anteriores.
- Redo elimina la aportación anterior a GP y la evidencia Speaking de esa lección,
  conservando otros sistemas y el historial de gasto. Intentos anteriores quedan
  aislados por recorrido; no pueden liquidar el nuevo. HanCoins no se acumula.
- Acciones autenticadas preparadas: lectura sin IA/mutación, generación explícita
  seguida de guardado, y reintento **solo de guardado** sin IA. Aceptan únicamente
  `lessonId`; no identidad, intento escogido, nota o campos adicionales del cliente.
  Respuestas públicas acotadas, sin detalles privados de errores.
- Informe ES/EN preparado distingue recompensas pendientes y procesadas sin
  prometer otro pago. Todavía no se monta en Reflection/Resultados ni se activa
  la captura v2 en la página real. El flujo anterior sin selección v2 sigue activo.
- **155 pruebas en nueve suites y 103 integraciones en once archivos pasan**:
  concurrencia, rollback, redos, lectura/caché, aislamiento, puntos, logros,
  informe antiguo y ambas versiones de captura/evaluación. PostgreSQL temporal,
  eliminado después; proveedores simulados y claves deshabilitadas en pruebas.
  Typecheck, lint dirigido, formato y build completo de Next (68 páginas estáticas)
  pasan. Login local ES/EN responde HTTP 200; esto **no** es aceptación visual/oral
  del informe nuevo, aún no montado. Se conservó el servidor local existente.
  Las integraciones completas mantienen
  el ejercicio gramatical exclusivamente temporal de EV-04A; no certifican
  disponibilidad de preguntas en las bases persistentes.
- Próximo bloque: montar acciones/informe en Reflection y resultados, asegurar
  que todos los ejercicios terminaron de guardar antes del snapshot de voz,
  caso sin micrófono, cierre de escenario y activación coherente tras comprobar
  migraciones/destinos. Calibración humana y prueba oral real siguen pendientes.
  EV-05 permanece al final: no se borró ninguna cuenta, nota o base persistente;
  sin API pagada, commit, push o publicación.

Skills Prisma Client API/CLI: transacciones/reclamaciones y regeneración del
cliente con pruebas de migraciones únicamente en la base desechable. Guía local
de Next 16: acciones de servidor autenticadas y retornos limitados para el cliente.

## EV-04C — interfaz, guardado previo y finalización protegida

Entrega posterior del 11 de octubre; sustituye los pendientes de montaje de
EV-04A/B, no sus límites de activación ni la necesidad de aceptación real.

- Reflection y resultados muestran el informe v2 cuando existe selección propia
  o procedencia versionada, incluso si esta está dañada (sin fallback al chat de
  Han). Las lecciones nuevas siguen con captura v2 apagada por defecto: no se
  consultan sus tablas nuevas sin selección y no se aplican migraciones reales.
- Abrir/reabrir solo lee. Evaluar requiere pulsación explícita; reintentar el
  guardado no llama al modelo. PROCESSING permite comprobar estado; un worker
  vencido se muestra fallido sin mutar ni redisparar IA desde el lector. No hay
  reproducción de audio automática ni traducción pagada del informe congelado.
- Barrera de navegación/Continue espera respuestas de vocabulario, gramática,
  comprensión y secuencia de ejercicios antes del snapshot de Speaking. Los
  lotes siguen agrupados; fallos retienen respuestas y bloquean avance hasta
  reintento, sin duplicar intentos por repetir Finish. Auth ausente no simula un
  guardado exitoso. No recupera automáticamente guardados de una pestaña cerrada
  abruptamente; las evidencias ausentes siguen siendo faltantes, no errores.
- Sin micrófono: acción explícita crea/sella captura técnica vacía del recorrido
  propio sin abrir Realtime ni consumir IA. Reintento conserva intento/payload.
  Resultado insuficiente puede guardarse y volver a la ruta, pero no terminar la
  lección, desbloquear la siguiente ni ganar logros/monedas de finalización.
- Finalizar requiere informe elegible, íntegro y SETTLED, tanto en la interfaz
  como en el servidor. Un cliente no puede retirar la selección v2 para forzar
  nota antigua. Progreso se actualiza contra ID/inicio del recorrido leído.
- Redo por lección con confirmación permite recuperarse de fallo/parcial, sin
  reset silencioso. Refresca/remonta el motor para el nuevo recorrido; conserva
  la política de monedas y gastos anterior. Lecturas tardías no reemplazan otro
  informe ni confirman recompensas. Los paneles muestran aporte a General Level
  y monedas registradas únicamente desde resultado verificado/liquidado, no
  otro pago por revisitar. Fórmula y pesos se mantienen.
- **193 pruebas en 17 suites y 91 integraciones en diez archivos pasan**;
  typecheck, lint dirigido, formato y build completo (68 páginas) pasan. Base
  temporal retirada, proveedores simulados: sin API pagada, migraciones en
  bases persistentes, borrado de usuarios, commit/push o publicación.
- Servidor local existente conservado: login ES/EN y ruta de lección responden
  HTTP 200 sin error Prisma visible; acceso no autenticado redirige al login.
  Esto no certifica la vista del informe ni la conversación con micrófono real.

Siguiente bloque: verificar destinos y planes de preguntas reales, aplicar las
dos migraciones aditivas al entorno correcto y activar coherentemente captura,
informe y recompensas en lecciones nuevas. Después, prueba visual/oral del
recorrido completo y cierre de escenario; calibración pedagógica con evidencia
real antes de declarar la matriz terminada. EV-05 sigue pendiente: respaldo y
verificación de administrador/datos/gastos en ambas bases antes del reinicio.

Skills Prisma Client API/CLI guiaron la comprobación dentro de la transacción y
las migraciones solo en Postgres desechable. Guía local de Next 16: `refresh()`
tras guardado/evaluación para no dejar saldos de servidor obsoletos, nunca al leer.

## EV-04D — correcciones de diálogo y transición local preparada

Se revisó el caso real comunicado por el usuario: informe anterior con Speaking
nulo, total 70/100 y narrativa obligada a inglés. El nulo antiguo contribuía
cero al total: no equivale a demostrar mala expresión oral. El resultado antiguo
no se convierte en evidencia v2 ni se regenera desde el hilo global de Han.

- Dificultad y gramática permanecen junto a los bancos (también en cierre), no
  son sustituidas por ellos. Se conserva diálogo natural y detours relacionados,
  con conexión accesible al tema/patrones de la lección, sin guion obligatorio.
- Decir no entiendo/no entendí/I don't understand, pedir traducción o idioma
  pausa inmersión: ayuda breve ES/EN, sin añadir otra pregunta china. Preguntas
  de significado en chino no cambian el idioma ES/EN de ayuda de la sesión.
  Ayuda pendiente al cierre tampoco se ignora. Criterios de evaluación separan
  solicitud de ayuda y errores lingüísticos; exceso de dificultad del personaje
  se considera limitación, no culpa del alumno. Son reglas probadas con mocks,
  no garantía de obediencia semántica del modelo o de precisión acústica.
- Un informe con resumen de categorías y un único feedback; conteos y criterios
  se despliegan bajo un solo detalle. Razón técnica/sin habla diferenciada, sin
  solicitar mecánicamente una conversación más larga ni asignar nota cero.
- `HANGO_JOURNEY_EVALUATION_V2=local` solo se acepta como opt-in de ruta en
  development. Production/test no se activan aunque el valor exista. Faltan
  tablas/columnas: aviso explícito, no fallback al informe antiguo. Resultados
  antiguos o Speaking ya cerrado sin selección v2 requieren redo por lección
  confirmado por el usuario; no cambia cuentas ni otras lecciones al visitar.
- Preflight de `.env.local`, solo lectura: huella 9a6e66deb06483ee, 29 usuarios,
  46 informes. Primera lección HSK 1 con 10 palabras, tres estructuras, seis
  preguntas gramaticales y cinco ejercicios publicados; no se fabricó contenido.
  `scripts/activate-local-journey.ts` fija esa configuración mediante argumento,
  rechaza pendientes distintos de las dos migraciones v2 y nunca hace reset/seed.
- **Activación aún no ejecutada**. La base usada por localhost está en Prisma
  nube; no se verificó que sea distinta de Vercel. Revisión automática rechazó
  la escritura del esquema y la exportación de secretos de producción. Sin
  exportación ni bypass. Se pidió confirmar separación o autorizar exactamente
  esta base; no se cambia el flag hasta resolverlo. No afirmar que la medición
  completa está lista para probar por tener tests/compilación en verde.
- Verificación: 251 pruebas en doce suites, 91 integraciones en diez archivos,
  tipos/lint dirigidos y compilación de 68 páginas pasan. Postgres temporal
  retirado; no aceptación visual/oral con modelo real. El servidor local previo
  se conserva, sin modificar su configuración ni activar el flag.

OpenAI Docs guió instrucciones explícitas de idioma/prioridades:
[Realtime Prompting Guide](https://developers.openai.com/cookbook/examples/realtime_prompting_guide).
Prisma Client API/CLI guiaron guardas, consultas y preflight/migraciones en
Postgres temporal. No se llamó a API pagada, se borraron cuentas, se aplicaron
migraciones persistentes ni se publicaron cambios.

## EV-04E — vista previa sin tocar cuentas ni base

El usuario rechazó aplicar las dos migraciones y luego aclaró que quiere ver la
experiencia de Speaking, resultado y feedback. Esa negativa se conserva; no
reintentar migraciones por una petición genérica de continuar o probar.

Se creó `/es/speaking-preview` (también EN), disponible solo en development,
fuera del shell de Han y sin dependencias de acciones/servicios de IA/base de
datos. Presenta una conversación preparada que avanza con mantener/soltar,
ejemplo de ayuda al no entender y el **mismo componente** del informe nuevo.
Todas las notas/frases están marcadas como ejemplos; no se escucha ni evalúa al
usuario. Ejemplo completo: resto 100 y Speaking 75 → global redondeado 93;
ejemplo sin captura: nota global nula y razón técnica, no cero. Pie de informe
de demostración suprime promesas de guardado/recompensas.

15 pruebas en tres suites y tipos/lint pasan. Página y resultado verificados
en el navegador local y dejados abiertos; servidor previo conservado. Sin
migración, cuentas leídas/listadas, reset, API pagada o publicación. La vista
permite revisar diseño/flujo, **no** medir una conversación real ni dar por
terminada la aceptación oral de la matriz. Esa medición sigue apagada.
