# Revisión final de Speaking y reflexión integrada — 21/10/2026

## Veredicto

Actualización del 22/10/2026: los tres P1 de este informe se corrigieron localmente
con regresiones; ver `fixes-and-progression-2026-10-22.md`. El diagnóstico original
se conserva a continuación como evidencia histórica. Los P2 y la validación real
de audio/calibración no se dan por resueltos con estas correcciones.

**No aprobar todavía como versión final lista para la prueba de calidad del usuario.**
La integración, fórmulas y persistencia están comprobadas técnicamente, pero la
revisión independiente del plan encontró tres problemas principales y varios
ajustes pendientes. Las pruebas anteriores no cubrían todos estos casos. No se
ha modificado la lógica de la aplicación durante esta auditoría ni se ha usado
OpenAI de pago. Este informe no equivale a haber corregido los hallazgos.

## Comparación con lo definido

| Compromiso del plan | Estado observado |
| --- | --- |
| Una reflexión real con seis variables y evidencias | Integrada para nuevos intentos ADMINISTRATOR; no publicada |
| Separar vocabulario/gramática oral de los ejercicios | Implementado; los cuatro bloques de lección conservan sus notas propias |
| Pesos orales 20/15/20/25/10/10 y globales 20/20/30/30 | Cálculo reproducido; pesos experimentales, no validación docente |
| No inventar cero/100 cuando falta evidencia | Controles implementados; falta de audio/captura o contradicción retiene nota |
| Guardar y reabrir sin otra solicitud pagada | Verificado con proveedor simulado y Postgres desechable |
| Recuperar fallos sin perder una conversación válida | Incompleto: un fallo anterior al envío puede bloquear para siempre ese intento |
| Exigencia apropiada a la lección y nivel | Contexto textual sí; el juez acústico no recibe el contexto curricular concreto |
| Coherencia entre calificación, cobertura y comentario de Han | Incompleta: un acto invalidado puede seguir contado/elogiado |
| Corregir primero lo más importante | No hay jerarquización conjunta por gravedad/impacto; se usa orden de listas |
| Feedback ES/EN coherente | UI localizada; prosa acústica depende del prompt, no de un control de idioma |
| Diseño claro sin duplicaciones | Sin desbordamiento en la revisión aislada; hay citas/logros repetidos |
| Acceso a errores de ejercicios | La nueva vista presenta nota/recuento; no ofrece el detalle de preguntas/errores previsto |
| Calidad de tonos comparable a criterio docente | No comprobada: falta voz real y referencia humana |
| General Level y recompensas de la nota nueva | Desactivados deliberadamente en el ensayo provisional |

## Hallazgos principales

### 1. P1 — Falta el nivel de la lección en la evaluación acústica

Ubicación: [constructor y solicitud de audio](C:/HanGo/src/lib/journey-session-audio-review.ts:139)
y [llamada desde el cierre](C:/HanGo/src/components/ai-teacher/han-voice-conversation.tsx:1142).

El constructor recibe intento, idioma, referencias/transcripciones de audio,
cantidad de turnos y requestId. No recibe dificultad, HSK orientativo, objetivos
ni contexto de la tarea. El prompt exige valorar una muestra suficiente y variada
«para esta tarea», pero no identifica esa tarea o su exigencia. Tampoco ofrece
anclas diferentes para las pausas normales de Foundations y las de un escenario
avanzado.

**Reproducción:** preparar una solicitud con audio ficticio y examinar el payload.
No aparecen lessonSlug, hskReference, successConditions ni una etapa curricular.
Esto no demuestra que cada nota sea errónea; demuestra que falta la adaptación
explícita acordada. El modelo no debe tener que deducir el nivel por las frases.

**Antes de probar:** pasar un contexto mínimo validado por servidor y ligado al
snapshot, con tarea/nivel/anclas pertinentes, sin introducir notas de ejercicios
ni convertir todas las palabras del banco en una cuota.

### 2. P1 — Un intento sin solicitud pagada puede quedar sin recuperación

Ubicación: [retorno de la rama unificada](C:/HanGo/src/lib/journey-speaking-evaluation-service.ts:117).

La rama retorna para cualquier estado no PENDING. Si el proveedor no admite la
salida requerida, falla antes de llamar a la IA: FAILED, requestCount=0, report=null.
Aunque se restablezca el proveedor y se solicite recuperar explícitamente, retorna
el mismo FAILED sin enviar nada. La UI tampoco ofrece recuperación porque exige
que exista una respuesta guardada.

**Reproducción real en Postgres desechable:** nuevo administrador ficticio,
lección 1, intento sellado propio; proveedor simulado no disponible → restaurado;
recuperación explícita. Resultado: FAILED/requestCount=0 y cero llamadas. No es
un problema hipotético de facturación ni una restricción del proveedor.

**Antes de probar:** permitir la primera solicitud explícita cuando se compruebe
que nunca se despachó ninguna, manteniendo presupuesto, propiedad y concurrencia.
Si requestCount>0, conservar la protección contra otra compra automática. Lectura
y guardado deben seguir siendo gratuitos.

### 3. P1 — Se retiene una nota por contradicción, pero Han aún puede elogiarla

Ubicación: [detección de contradicciones](C:/HanGo/src/lib/journey-unified-speaking.ts:209),
[síntesis de Han](C:/HanGo/src/lib/journey-unified-speaking.ts:317) y
[cobertura](C:/HanGo/src/lib/journey-unified-speaking.ts:347).

El filtro quita el acto contradictorio de la lista de logros y retiene el número,
pero la cobertura se copia del perfil previo y la nota de Han utiliza el motivo
de comunicación sin aplicar esa misma invalidación.

**Reproducción con contrato/evidencia reales y texto ficticio:** ante el objetivo
«preguntar su nombre», el alumno dice únicamente 我叫小林。 El auditor identifica
EVIDENCE_MISMATCH y la nota pasa a REVIEW_REQUIRED/null. Sin embargo, la cobertura
independiente sigue en 1 y el comentario conserva «Has preguntado su nombre de
forma independiente». Es precisamente una contradicción que el plan prohibía.

**Antes de probar:** aplicar una interpretación coherente de las evidencias
retenidas a nota, objetivos y narrativa. No inventar una cita nueva para rescatar
el juicio ni afirmar un logro que el propio auditor no respalda.

## Ajustes adicionales

### P2 — Idioma de los comentarios acústicos sin control posterior

[Validación acústica](C:/HanGo/src/lib/journey-session-audio-review.ts:296).
Una respuesta etiquetada es con razones, explicación y práctica enteramente en
inglés pasa los controles de referencias y se presenta tal cual. El prompt pide
español, pero eso no lo garantiza. Reproducido sin IA. Requiere control/respuesta
segura localizada, no traducción pagada al reabrir.

### P2 — Prioridades y repetición todavía no cumplen el plan de feedback

[Construcción de correcciones](C:/HanGo/src/lib/journey-unified-speaking.ts:270)
y [selección de las dos primeras](C:/HanGo/src/components/lesson/journey-unified-reflection.tsx:30).
Los errores textuales se añaden primero y el audio después. Con dos errores
textuales, cualquier corrección tonal queda bajo detalle, independientemente de
su impacto. No hay clasificación conjunta de gravedad/recurrencia/relevancia.

Además, [la unión de referencias tonales y articulatorias](C:/HanGo/src/lib/journey-unified-speaking.ts:153)
puede mostrar dos veces la misma cita en pronunciación. En navegador se vieron
dos tarjetas idénticas de «Intervención 2» al abrir ese criterio. Acto y palabra
pueden producir dos logros con la misma cita; si los motivos de dos dimensiones
coinciden, Han los repite en su síntesis. No basta con limitar a dos elementos.

### P2 — Falta detalle de errores de los ejercicios

[Tarjetas de resultados](C:/HanGo/src/components/lesson/journey-unified-reflection.tsx:126).
Presentan nota y correctas/total, pero no la revisión de preguntas/respuestas
erróneas acordada. Mantener separada esa revisión del juicio oral; abrirla no debe
producir otra evaluación ni reconstruir una respuesta del alumno.

## Comprobaciones realizadas

- Revisión del plan, rúbrica editorial y recorrido de captura, juicio, informe,
  guardado y recompensas. Sin cambios en Han burbuja, Companion o Speaking Lab.
- 102 pruebas existentes dirigidas de evaluación, audio, reflexión, acciones e
  interrupción pasan. Cuatro diagnósticos adicionales reproducen las brechas de
  contexto acústico, contradicción, idioma y orden de prioridades. Son pruebas
  que confirman defectos actuales, no una aprobación de esos comportamientos.
- 37 integraciones existentes de intentos/captura/informe pasan. Un diagnóstico
  adicional reproduce la falta de recuperación con requestCount=0. Se utilizó
  Postgres temporal 127.0.0.1:54329/hango_local_test y proveedor simulado; el runner
  retiró la base al terminar. No se tocaron datos de localhost/producción reales.
- Vista aislada del componente real con datos ficticios, CSS del build existente
  y assets locales: ES/EN, claro/oscuro, 320/390/768/1440px, criterio desplegado y
  resultado parcial. Sin desbordamientos horizontales observados; Han no tapa el
  contenido en esas vistas. Esto no comprueba overlays de toda la app, teclado
  móvil, hidratación de Next, zoom 200%, Safari/iPhone ni autenticación real.
- No se ejecutó una nueva conversación real ni se envió audio a OpenAI. No se
  afirma precisión tonal, calibración docente ni coste real por esta auditoría.
- Las comprobaciones del build completo y 2.089 pruebas pertenecen al lote
  anterior documentado; no se presentan como una repetición completa de esta revisión.

Los scripts/pruebas de diagnóstico fueron temporales y se retiraron al terminar;
no se añadieron rutas de aplicación ni se cambió su lógica. La guía Prisma se usó
para mantener las pruebas en una base desechable, no en las conexiones reales.

## Salida recomendada

1. Corregir los tres P1 y añadir regresiones que exijan su comportamiento correcto.
2. Resolver idioma, prioridades, duplicados y acceso al detalle de ejercicios.
3. Repetir QA técnico y visual sin gasto automático de IA.
4. Ensayo de voz real acotado, con autorización/presupuesto explícitos, antes de
   pedir al usuario otra lección completa. Publicación Vercel es un paso separado.
5. Mantener calificación provisional hasta tener contraste acústico/docente;
   integración técnica no implica haber completado esa validación.

La [documentación oficial de OpenAI sobre Realtime](https://developers.openai.com/api/docs/guides/realtime-conversations)
respalda las respuestas fuera del diálogo y referencias a elementos. No certifica
que una revisión generativa detecte tonos con calidad docente. Este límite se
mantiene explícito; no se sustituye por una promesa de «cero errores».
