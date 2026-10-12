# Costos y presupuestos compartidos por experiencia — 2026-10-10

## Estado vigente: activado y verificado en localhost

El usuario aprobó unificar los topes técnicos dentro de cada experiencia y
exigió que Límites de IA, Usuarios y Analítica usaran la misma clasificación.
Este diseño sustituye los topes independientes descritos más abajo; esos
apartados se conservan como registro de las etapas anteriores.

| Presupuesto | Operaciones que comparten el saldo |
| --- | --- |
| Han Tutor (burbuja) | Realtime, chat escrito, grabaciones y lectura TTS |
| Han Companion | Realtime, chat, grabaciones, lectura y extracción de hechos de Companion |
| Speaking de Learning Journey | Conversación con personaje y comprobaciones del objetivo |
| Speaking Lab | Conversación, escenarios, grabaciones y evaluaciones del laboratorio |
| HanVocabulary | Búsquedas nuevas; reutilizaciones sin llamada IA |
| Reflexión final de la lección | Evaluación y lectura opcional del resultado |
| Writing Lab | Corrección de texto y escritura a mano |
| Examen de nivel | Conversación oral, comprobaciones y evaluación |
| Misiones | Chat y evaluación final |
| Generación de contenido compartido | Generación inicial de audios guardados para todos |

US$2 para Tutor son **US$2 totales** entre sus operaciones, no US$2 para cada
una. Tutor no comparte conversación ni memoria con Companion. La referencia
de voz sigue siendo US$0.05 por inicio de sesión; texto/audio adicionales
conservan su registro de costo y descuentan del mismo saldo.

`src/lib/ai-experiences.ts` es la fuente de verdad de las diez experiencias.
Los editores usan claves `experience:…`. El servidor suma sus registros del
día UTC, con prioridad de excepción individual sobre límite general. Cero
bloquea **nuevas llamadas**, no una sesión WebRTC ya abierta. El presupuesto
global y sus interruptores de emergencia siguen actuando por encima.

Las rutas compartidas transportan un origen validado, guardado en
`AiUsageLog.experience` y `AiOperationLog.experience`. Una lectura de Reflexión
descuenta de Reflexión, no de Tutor; una comprobación de Journey no descuenta
de Lab. Límites, ficha 360°, tabla de costos y alertas suman las mismas
operaciones una vez. El desglose técnico queda solo lectura, sin repartir
presupuesto entre botones. Engagement sigue describiendo actividades:
Learning Journey comprende Speaking y Reflexión, que el reporte financiero
desglosa por separado. No sumar nuevamente esas tarjetas al total financiero.

### Transición y verificaciones

`20261010140000_shared_ai_experience_budgets` añade columnas e índice y copia
una sola vez el **menor tope explícito** entre las operaciones del grupo.
No suma/multiplica los importes y conserva bloqueos de cero. Una política
antigua de TTS/STT compartida se conserva en todas las experiencias a las
que podía aplicar: revisar el nuevo importe antes de ampliarlo. Los topes
nuevos ya configurados no se sobrescriben. Las políticas técnicas anteriores
quedan archivadas. Sin política previa explícita se utiliza US$1/día.

Solo se completa el origen histórico de claves inequívocas. TTS/STT genérico
y chat/voz mixtos anteriores se conservan en el total sin atribuirlos por
suposición. A petición del usuario, Analítica ya no muestra el apartado
«Histórico anterior sin separar» ni sus filas: solo aclara junto al total que
incluye consumo anterior no desglosado, cuando existe. Es un cambio de
presentación; no elimina registros ni modifica importes, límites o reservas.

62 pruebas unitarias/de componentes pasan, además de typecheck, lint focalizado
y compilación de producción. La integración aislada pasó 67/68 inicialmente;
el único fallo era una expectativa de redondeo. Tras corregirlo, las cuatro
pruebas nuevas de presupuesto y cinco de back-office pasaron (9/9). La
migración completa se aplicó en dos bases temporales. Se verificaron saldo
compartido, separación entre sistemas/usuarios, bloqueos, historia e
idempotencia de la copia y conciliación con Analítica. Sin consumo de OpenAI.

La revisión de autorización inicialmente no pudo ejecutar ni `migrate status`
por un límite de uso; no se eludió esa revisión. En la continuación del
2026-10-10 volvió a estar disponible: status confirmó que solo faltaba la
tercera migración, y deploy la aplicó a la base Prisma de desarrollo usada por
localhost. La auditoría de lectura confirma las tres migraciones, diez topes,
cero claves desconocidas/orígenes inválidos y conciliación exacta de los 93
registros existentes (US$5.8075195 estimados), sin cambiar sus importes.

Se regeneró Prisma Client y se reiniciaron únicamente los procesos verificados
del servidor HanGo en localhost:3000. El error `Expected
AiUsageLogScalarFieldEnum` era el cliente que permanecía en memoria desde el
día anterior, sin el campo `experience`. Además faltaba la columna en la base;
regenerar/reiniciar sin aplicar la migración no habría bastado. Las consultas
reales de Analítica para 30 días ahora pasan, y la página autenticada se
comprobó en el navegador: renderiza normalmente, sin el error, y muestra los
diez presupuestos junto al histórico. No se modificaron autenticación, prompts,
conversaciones, contadores de reserva ni importes anteriores. No hubo consumo
de OpenAI. GitHub y Vercel siguen sin actualizarse en este lote.

Son topes sobre **estimaciones**, no garantías de la factura OpenAI. Llamadas
simultáneas o una última operación de costo variable pueden superar el saldo
personal: no se añadió reserva personal atómica. La reserva global sí es
atómica, pero controla exposición autorizada, no facturación. Falta medir
tokens Realtime y conciliarlos con el proveedor.

## Registro de implementación anterior

## Cambio autorizado

Las sesiones nuevas ya no se agrupan en `han-realtime-session`. Se registran
y limitan por separado:

| Sistema                      | Clave                               | Estimación por sesión |
| ---------------------------- | ----------------------------------- | --------------------- |
| Han Tutor (burbuja)          | `han-tutor-realtime-session`        | US$0.05               |
| Han Companion                | `han-companion-realtime-session`    | US$0.05               |
| Speaking de Learning Journey | `journey-speaking-realtime-session` | US$0.05               |
| Speaking Lab                 | `speaking-lab-realtime-session`     | US$0.05               |
| Examen oral de nivel         | `placement-realtime-session`        | US$0.05               |

La misma constante alimenta el registro al abrir la sesión, la referencia en
Analítica y la reserva preventiva global. Los límites diarios individuales y
generales se siguen expresando en dólares; no se reducen sus importes configurados.
Si solo se usa voz, US$1 permite aproximadamente 20 sesiones contabilizadas a
US$0.05; chat y otras operaciones reducen ese número dentro del saldo compartido.
El presupuesto global sigue sumando todas las funciones de IA.

## Alcance y precisión

US$0.05 es una estimación aprobada por el usuario basada en una prueba corta de
Han Tutor (~3 minutos), no una tarifa fija de OpenAI ni un máximo garantizado.
No se ha medido esa cifra independientemente en Companion, Lab, Journey o examen.
La API factura los tokens de entrada/salida, audio/texto/caché; la transcripción
tiene un costo adicional. El servidor solo observa el inicio WebRTC y aún no
recoge la facturación de los turnos. No afirmar que estos límites son límites
exactos del gasto real. Bajar la reserva aumenta el número de sesiones autorizadas.

No se cambia el precio de entrada por millón de tokens de gpt-5-mini (US$0.25):
es una tarifa distinta, necesaria para HanVocabulary y otras funciones de texto.
HanVocabulary conserva su cálculo por tokens y caché compartido; US$0.0007 es
solamente la referencia de búsqueda nueva mostrada en Analítica.

## Historial y migración

Los registros antiguos conservan su valor y la etiqueta «histórico compartido
(sin separar)». No existe evidencia suficiente para redistribuirlos por sistema,
ni para sustituir retroactivamente US$0.25 por US$0.05 como si fuera costo medido.
Las reservas globales ya autorizadas tampoco se reducen ni se reinician.

La migración `20261010120000_separate_realtime_usage_limits` copia una sola vez
los límites generales y excepciones individuales de la clave compartida a las
cinco nuevas claves. Conserva bloqueos de cero, importes y políticas originales;
`ON CONFLICT DO NOTHING` evita sobrescribir cualquier ajuste nuevo existente.
Al quedar independientes, cada categoría recibe ese importe completo, no una
quinta parte: revisar cada una en `/admin/limits` y Usuarios → Límites
personalizados de IA antes de ampliar la beta. La clave antigua queda solo lectura.

Publicar requiere aplicar esta migración en la base de datos del despliegue
antes de habilitar el código nuevo. No publicar solo el código sin trasladar las
políticas. No se modifican conversaciones, prompts ni memorias pedagógicas.
Las nuevas sesiones fallan de forma segura si la migración no figura aplicada,
para no perder un bloqueo existente por ausencia de una nueva fila.

La base que usa localhost está alojada en Prisma (`db.prisma.io`); no es una base
física local. Auto-review bloqueó el primer intento; después de la autorización
explícita del usuario del 2026-10-10 se aplicó la migración de voz allí con éxito.
No se modificó el despliegue ni la base de Vercel.

## Revisión del catálogo de costos y administración

`src/lib/ai-feature-catalog.ts` es la fuente compartida de nombres, claves,
familias, secciones del reporte y controles de límites. El administrador ve:

| Categoría                                                      | Qué incluye y qué no                                                                                                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversación de voz en vivo con Han                            | Tutor Realtime, con el chat escrito de Tutor en su desglose, cobrado por tokens aparte. No se convierte cada respuesta escrita en una nueva sesión de US$0.05. |
| Chat de Han Companion                                          | Solo la nueva clave `han-companion-chat`; nunca lee costos de Tutor ni de personajes.                                                                          |
| Búsqueda de HanVocabulary                                      | Generación de información nueva; caché compartido por palabra normalizada + HSK + ES/EN + versión del prompt.                                                  |
| Reflexión final de la lección                                  | Evaluación de texto; su lectura oral opcional usa TTS aparte.                                                                                                  |
| Lectura de respuestas en voz (TTS, no Realtime)                | La ruta `/api/han/speech`, usada por el botón de escuchar en chat, Reflexión y ejemplos. Incluye reescritura oral y síntesis; Realtime no la utiliza.          |
| Companion, Journey Speaking, Speaking Lab, examen oral por voz | Cinco claves de voz independientes incluyendo Tutor, como en la tabla inicial.                                                                                 |
| Evaluaciones, grabaciones y otras funciones                    | Conservan su propia clave y método real. La evaluación textual del objetivo del role-play es otra llamada, no parte medida dentro de la estimación de US$0.05. |
| Generación de contenido compartido (caché)                     | Audios de vocabulario/ejemplos, diálogos, gramática, introducción y Listening de Placement. Se presentan aparte del consumo recurrente.                        |
| Histórico anterior sin separar                                 | Claves antiguas de voz/chat; se conservan sin atribuirlas a un producto único.                                                                                 |

La migración de texto `20261010130000_separate_han_text_usage_limits` copia
políticas de `ai-teacher-chat` a Tutor, Companion y personaje con la misma
protección de conflictos que la migración de voz. El historial viejo permanece
sin cambios. En esa etapa el agrupamiento visual de Tutor aún no unificaba sus
dos topes. La implementación vigente descrita al inicio sí los sustituye por
un saldo compartido; los controles anteriores quedan archivados.
Esta migración también quedó aplicada en la base de desarrollo autorizada.
Una comprobación de solo lectura confirmó ambas migraciones finalizadas, cero
claves desconocidas en los registros existentes y conciliación exacta de los
totales internos. No se han publicado estos cambios en GitHub/Vercel.

## Comprobaciones del caché

- Vocabulario y ejemplos consultan primero `audioFilePath` y luego la clave del
  contenido en almacenamiento. Al reutilizar un archivo existente no llaman al
  proveedor ni registran consumo de IA ni reservan un nuevo presupuesto.
- Una prueba de integración con dos usuarios distintos confirma una sola
  generación y un único registro de costo para el primer usuario; el segundo no
  recibe ningún registro de generación.
- HanVocabulary confirma reutilización entre usuarios incluso tras vaciar la
  caché del proceso; un nivel, idioma o versión diferente puede requerir otra
  generación.
- TTS de respuestas usa texto + voz + idioma + estilo para su clave; texto o
  voz diferentes no son el mismo recurso.
- No prometer «nunca vuelve a costar» sin condiciones: cambiar el contenido,
  borrar el archivo, regenerarlo o sufrir carreras de primera generación entre
  procesos puede ocasionar otra llamada. El almacenamiento/transferencia tiene
  costos propios no incluidos en el consumo OpenAI.
- La reutilización requiere el mismo almacenamiento/archivo accesible o la misma
  base de caché. Localhost y Vercel pueden usar almacenes o bases diferentes;
  generar algo localmente no significa que ya exista en producción.

## Conciliación de la vista

El total mostrado suma exactamente una vez uso interactivo + generación
compartida + histórico. No se recorta el reporte a 20 combinaciones de modelo,
porque eso omitía filas del desglose. Se conserva también cualquier clave
desconocida para no ocultar importes. Categorías principales aparecen incluso
con cero uso, sin inventar operaciones para ellas.

La página de Analítica incluye costos del administrador (sus pruebas también
pueden gastar), pero no su actividad en las métricas de engagement. Las alertas
de límites usan los topes individuales antes que los generales y el mismo día
UTC que el control de consumo. El selector 7/30/90 días de Analítica usa Bogotá;
por eso comparar el período o cohortes diferentes no implica duplicación.

Estos son importes internos estimados, no una conciliación exacta con la factura
de OpenAI: falta capturar de forma fiable los tokens Realtime, la transcripción,
el caché y usos fallidos/parciales que puedan haber sido facturados.

## Pendiente

- Recolector fiable de uso Realtime por turno/sesión y transcripción.
- Conciliación con el consumo oficial y eventual reserva ajustada por duración.
- Comprobación oral con usuario real (no ejecutar llamadas pagadas en pruebas).
