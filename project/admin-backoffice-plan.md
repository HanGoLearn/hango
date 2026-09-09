# HanGo Admin Back-Office

Estado: aprobado para implementación por entregas (2026-09-05).

## Principios

- El administrador vive fuera del shell del alumno y nunca carga Han, la
  navegación educativa, celebraciones ni recompensas diarias.
- Solo la cuenta administradora autorizada puede entrar. El rol se confirma
  contra la base de datos; el JWT sirve como señal optimista, no como la
  autoridad final.
- Los costos de IA se presentan como estimaciones internas, no como factura
  real del proveedor.
- Actividad, progreso educativo y costo son indicadores diferentes.
- Las consultas devuelven DTOs mínimos, se paginan y evitan N+1.
- Toda mutación administrativa valida permisos e inputs en el servidor.

## Entrega 1 — MVP administrativo

Rutas: `/admin`, `/admin/users`, `/admin/users/[userId]`,
`/admin/communications` y `/admin/limits`.

Incluye un shell administrativo propio; resumen de usuarios, activación,
aprendizaje, HanCoins y gasto estimado; buscador y perfil resumido de
usuarios; los límites de IA por función; anuncios globales programables; y premios
individuales de HanCoins con mensaje y auditoría.

Los anuncios aparecen una vez por alumno, después del onboarding, durante su
ventana activa. Se crean como borrador o se publican/programan, se pueden
finalizar y se archivan sin reescribir lo ya comunicado. Cada visualización y
confirmación queda registrada.

Los premios administrativos son positivos, individuales, idempotentes e
inmutables. Una transacción crea el movimiento real de `CoinLedgerEntry` y el
registro `AdminCoinGrant`. El mensaje se muestra en una notificación especial
que requiere confirmación; las recompensas normales mantienen su toast breve.

Fuera de alcance: impersonación, edición de roles, eliminación/suspensión de
usuarios, premios masivos, retiros directos de monedas y segmentación compleja.

## Entrega 2 — Inteligencia de producto

Repriorizada el 2026-09-06 para responder primero las preguntas que permiten
mejorar activación y engagement. Añade `/admin/analytics` con periodos de 7,
30 y 90 días; embudo registro → verificación → onboarding → primera lección
→ primer escenario; retención D1/D7/D30; pulso diario; señales de retorno,
personalización, achievements y leaderboard; economía; eficiencia de IA;
alertas; y uso diferenciado de Learning Journey, Han Tutor, Han Companion,
Speaking Lab, Writing Lab, Missions, HanVocabulary y Placement.

Las métricas actuales usan eventos reales ya persistidos. `daily_login` se
declara expresamente como proxy de acceso y nunca como tiempo estudiado.
`han-speech`, compartido por Han Tutor y Han Companion, no se atribuye a uno
de ellos; Learning Journey Speaking tampoco se mezcla con Speaking Lab sin
un marcador de origen independiente.

## Entrega 2B — Trazabilidad histórica del costo de IA

Completada el 2026-09-06. `AiUsageLog` conserva ahora el método de cálculo,
las tarifas históricas de entrada/salida por millón de tokens o la tarifa por
minuto, la duración de audio utilizada y su origen. Los registros previos a
esta ampliación se identifican como `LEGACY_ESTIMATE`; no se reconstruyen
tarifas o duraciones que nunca fueron guardadas.

Las llamadas de texto y visión registran el snapshot de tarifas del modelo.
Speaking Lab registra la duración medida por la grabación; la transcripción
de Han usa una aproximación por tamaño del archivo; TTS usa una aproximación
por longitud del texto porque la respuesta actual no entrega metadatos de
uso. `/admin/analytics` expone método, evidencia y tarifa histórica por
función/proveedor/modelo, manteniendo el costo como estimación interna.

## Entrega 3 — Actividad y retención

Completada el 2026-09-06. Añade sesiones de actividad reales con heartbeat
acumulativo cada 15 segundos, únicamente cuando la pestaña está visible y
hubo interacción durante el último minuto. Treinta minutos sin interacción
inician una sesión lógica nueva. Los totales y secuencias son monotónicos para
que reintentos o respuestas fuera de orden no dupliquen tiempo.

La analítica usa estas sesiones para DAU/WAU/MAU, duración activa mediana,
tiempo total, D1/D7/D30, retorno, reactivación y pulso diario. También compara
usuarios, sesiones, interacciones y tiempo entre Learning Journey, Han Tutor,
Han Companion, Speaking Lab, Writing Lab, Missions, HanVocabulary y Placement.
Han Tutor se identifica dentro de su panel lateral o vista propia; el hub `/han`
no se atribuye a Companion; Learning Journey Speaking permanece separado de
Speaking Lab.

La medición no es retroactiva y comienza con la primera interacción posterior
al despliegue. Tiempo visible/interactuado, actividades completadas, duración
de grabación y minutos facturables siguen siendo métricas diferentes.

## Entrega 4 — Ficha operativa 360° del usuario

Completada el 2026-09-06. La ficha individual evoluciona de un resumen a una
vista de diagnóstico: actividad real de los últimos 30 días y acumulada,
racha de estudio, preferencias pedagógicas, nivel declarado y demostrado,
progreso por tipo de actividad, Placement, logros y economía de HanCoins.

El tiempo se desglosa sin mezclar Learning Journey, Han Tutor, Han Companion,
Speaking Lab, Writing Lab, Missions, HanVocabulary y Placement. El listado de
usuarios también toma ahora su último acceso de las sesiones reales, no del
premio `daily_login`.

El costo individual del mes se agrupa por función y muestra solicitudes,
tokens, minutos facturables registrados y costo estimado. Las llamadas
recientes conservan proveedor, modelo, método, tarifa histórica y origen de
la duración. El historial reciente de texto de Han permanece cerrado por
defecto y excluye las prácticas orales. Como Tutor y Companion comparten hoy
un mismo hilo persistido, se presenta honestamente como historial compartido
y no se atribuye artificialmente a uno de los dos.

No requiere nuevas tablas ni migraciones: utiliza los registros construidos
en las Entregas 1, 2B y 3. Las consultas retornan solo los campos necesarios
para la vista administrativa.

## Entrega 5 — Confiabilidad y operaciones de IA

Completada el 2026-09-08. Añade `/admin/operations` con periodos de 7, 30 y
90 días; tasa de éxito; errores de proveedor; bloqueos por límite diario;
latencias p50/p95; usuarios afectados; pulso diario; desglose por función,
proveedor y modelo; códigos de error normalizados; alertas accionables; e
incidentes recientes enlazados a la ficha 360° del usuario.

`AiUsageLog` conserva su significado contable: una fila representa una
llamada completada con costo estimado. La tabla separada `AiOperationLog`
representa intentos exitosos, fallos y bloqueos, incluso cuando no existe un
costo confiable que registrar. La medición cubre las superficies pagadas de
Han, Placement, lecciones, Missions, Speaking Lab, Writing Lab,
HanVocabulary, audio y la extracción de memoria de Han Companion.

La telemetría es deliberadamente mínima: función, proveedor/modelo cuando se
conocen, resultado, código de error normalizado, latencia y fecha. Nunca
guarda prompts, respuestas, conversaciones, transcripciones, audio ni
mensajes crudos del proveedor. El registro es best-effort y no puede convertir
una operación correcta del estudiante en un error. La medición no es
retroactiva y comienza con las operaciones posteriores al despliegue.

## Entrega 5B — Límites personalizados por usuario

Completada el 2026-09-08. Los límites generales por función permanecen como
base para todos los estudiantes, pero la ficha 360° permite ahora definir una
excepción por usuario y función: heredar el límite general, usar un monto
diario personalizado o bloquear la función. La resolución siempre prioriza la
excepción individual y nunca modifica a los demás usuarios.

`AiUsageUserCap` guarda únicamente las excepciones. Un valor cero representa
un bloqueo explícito; un valor positivo sustituye el límite general; la
ausencia de fila hereda `AiUsageCap` o el valor predeterminado. El control
diario añade una lectura indexada en paralelo a cada operación pagada. La
interfaz muestra consumo de hoy, límite general y límite efectivo, y los
nombres técnicos de las funciones se presentan en español.

## Futuro posterior

Reconciliación con facturas reales, exportaciones, alertas externas, analítica
anónima de landing, cohortes avanzadas, ajustes compensatorios de HanCoins y
un `AdminAuditLog` general cuando existan más mutaciones o administradores.
