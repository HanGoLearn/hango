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
usuarios; los 20 límites de IA; anuncios globales programables; y premios
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

Añade sesiones de actividad reales, con heartbeat espaciado y solo cuando la
pestaña está visible y hubo interacción. Habilita DAU/WAU/MAU, duración
mediana, cohortes D1/D7/D30, embudos de activación y retorno, y comparaciones
entre experiencias. No se confunde tiempo de pestaña, aprendizaje, grabación
ni audio facturable.

## Futuro posterior

Reconciliación con facturas reales, fallos y bloqueos de IA, exportaciones,
alertas externas, analítica anónima de landing, cohortes avanzadas, ajustes
compensatorios de HanCoins y un `AdminAuditLog` general cuando existan más
mutaciones o administradores.
