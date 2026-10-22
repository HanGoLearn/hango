# Fase 1 — Auditoría y matriz pedagógica piloto

Fecha: 18/10/2026. Base de código: `359d2ed`, más documentos locales del plan.
Estado: auditoría de repositorio y borrador editorial comprobado estructuralmente;
NO calibración docente ni evaluador nuevo publicado.

## Qué se entregó

- Recorrido técnico, inventario de mediciones y riesgos reproducibles en este documento.
- [Matriz de tres lecciones reales](pilot-matrix.json), sin activación en runtime.
- [Rúbrica y reglas de evidencia](rubric.md), con descriptores por dimensión y ajustes por lección.
- `tests/unit/journey-speaking-quality-baseline.test.ts`: 17 pruebas de caracterización,
  contenido y controles existentes. Casos ficticios, sin API ni acceso a bases.

No se cambian notas, prompts de producción, voz, UI, recompensas o currículo. No se
suben datos privados, ni se generan grabaciones o juicios pagados.

## 1. Recorrido de evidencias a recompensas

| Paso | Implementación principal | Qué llega al siguiente paso / límite |
| --- | --- | --- |
| Preparación | `src/lib/journey-speaking-attempts.ts`, `startJourneySpeakingAttempt` | Usuario/lección autorizados; snapshot de escena, bancos y ejercicios de ese momento |
| Conversación | `src/components/ai-teacher/han-voice-conversation.tsx` | Audio en la sesión de voz; eventos de transcripción y turnos originales; no equivale a grabación acústica archivada |
| Cierre | mismo archivo, `finishConversation` | Detiene reproducción/micrófono; `isolatedJourney` excluye revisión y persistencia acústica del camino anterior |
| Adaptación | `src/lib/journey-speaking-capture.ts`, `buildJourneyAttemptCapture` | Texto original, hipótesis interpretada y confianza si existen; límites de turnos/caracteres y calidad técnica |
| Sellado | `src/lib/journey-speaking-attempts.ts`, `sealJourneySpeakingAttempt` | Propiedad, estado y hashes; datos del intento cerrado, no la conversación global de Han |
| Evaluación | `src/lib/journey-speaking-evaluation-service.ts` | Una petición explícita estructurada con snapshot y turnos claros; uso registrado incluso si el juicio se rechaza |
| Validación/cálculo | `src/lib/journey-speaking-evaluation.ts` | Esquema, referencias, banco, autoría, citas, observación y media ponderada; no valida automáticamente toda la semántica |
| Resultado de lección | `src/lib/journey-lesson-report.ts`, `buildJourneyLessonReport` | Ejercicios verificados más Speaking; pesos globales 20/20/30/30, sin inventar cero para una evaluación faltante |
| Guardado/recompensas | `src/lib/journey-lesson-report-service.ts`, `persistJourneyLessonReport` | Proyección del resultado y transacción de recompensas cuando procede, con controles de carrera y reutilización |
| General Level | mismo servicio → `progressEvidence` → `recomputeGeneralLevelPoints` | Evidencia SPEAKING con resultado `score / 100`; no volver a sumar cada subvariable oral como puntos nuevos |
| Presentación | `src/components/lesson/journey-final-report.tsx` | Resultado guardado y feedback; visitar/leer no debe generar evaluación adicional |

Estas rutas se revisaron en código, no mediante una llamada real al proveedor ni una
prueba de escritura en producción durante esta fase. No se certifica aquí un nuevo
ensayo integral de recompensas.

## 2. Inventario honesto de mediciones

| Capacidad | Estado observado hoy | Evidencia / trabajo pendiente |
| --- | --- | --- |
| Respuestas de cuestionarios | Medición determinista separada | Snapshot/primeras respuestas y denominadores; no prueba de aplicación oral |
| Vocabulario oral | Hallazgos opcionales y criterio global `language` | Producción literal con autoría para INDEPENDENT/ASSISTED; falta una subnota y política de cobertura explícita |
| Gramática oral | Hallazgos opcionales y criterio global `language` | Cita y banco comprobables; no se verifica semánticamente si toda clasificación es correcta |
| Comunicación/interacción/autonomía | Juicio ordinal IA con citas | Cita existente no demuestra que el nivel asignado sea justo |
| Pronunciación/tonos | `NOT_EVALUATED`, `NO_VERIFIED_ACOUSTIC_MEASUREMENT` | Captura nueva no incluye una medición acústica validada; no convertir similitud/confianza STT en nota |
| Fluidez acústica | No medida en el contrato final | No hay tiempos/pausas acústicas suficientes para una subnota contrastada |
| Oportunidades por objetivo | Enunciadas en escena/bancos | No hay inventario obligatorio de oportunidad/intento/resultado que condicione el máximo |
| Feedback e idioma natural | Prompt y campo `locale` | No hay validador semántico suficiente de idioma, elogios fonéticos o consistencia con niveles |
| Calidad técnica | Señales parciales | Detecta turno pendiente/interrupción, no certifica calidad de señal por sí sola |

## 3. Hallazgos reproducibles

Las seis pruebas G01–G06 pasan cuando se reproduce la limitación actual. Que pasen
NO significa que el comportamiento sea aceptable: su función es demostrar por qué
una validación íntegra no equivale a una evaluación calibrada.

| ID | Caso ficticio reproducido | Resultado actual | Requisito del sistema futuro |
| --- | --- | --- | --- |
| G01 | Cuatro máximos citando una respuesta, con `evidence: []` y sin demostrar todos los actos | Acepta 100, pronunciación no evaluada | Verificar alcance y cobertura de objetivos antes de una nota integral |
| G02 | Juicio declara ERROR gramatical con cita y corrección, pero `language=4` y demás máximos | Acepta 100 | Reconciliar severidad/error y descriptor; impedir máximo incompatible con el propio informe |
| G03 | Autonomía 4 con razón «solo repite tras ayuda constante; no hubo transferencia» | Acepta 100 | Detectar contradicción entre nivel y justificación; no rebajar por pedir ayuda sin más |
| G04 | Resumen afirma pronunciación/tonos perfectos, sin evaluación acústica | Acepta texto y marca pronunciación no evaluada | Prohibir afirmaciones fonéticas sin evidencia y coherencia de alcance en UI |
| G05 | `locale=es`, resumen completamente en inglés | Acepta metadatos y prosa | Verificar idioma de las explicaciones, sin rechazar citas chinas o nombres propios |
| G06 | Misma conversación/citas; candidato A todo 4, candidato B todo 0 | Ambos pasan su validación estructural | Referencias docentes y estabilidad; no confundir esto con variabilidad medida del proveedor |

G02 utiliza `我叫是小林。` como caso editorial de control, no una frase atribuida al
usuario. Los ejemplos no recibieron evaluación docente externa en esta fase.

### Controles que deben conservarse

Pruebas de la misma suite comprueban rechazo de cita inexistente, corrección sin
ERROR correspondiente y asistencia sin modelo real. También verifican nota parcial
por criterio no observado, captura técnica sin nota completa y ausencia de un nivel
de reemplazo inventado para reconocimiento incierto.

No se propone solucionar G01–G06 relajando esas guardas ni con más reintentos de pago.

### Integración con General Level: dos límites adicionales observados

En `persistJourneyLessonReport`, cada competencia vinculada al paso recibe el mismo
resultado agregado de Speaking. No son subnotas independientes de pronunciación,
gramática o vocabulario. Además, `normalizeDifficulty("SPEAKING", null)` produce
el valor 3; ese peso no utiliza la dificultad BEGINNER/ADVANCED del snapshot.

Esto no demuestra un fallo en el cálculo de puntos ni autoriza cambiarlo ahora:
documenta una decisión anterior que deberá revisarse cuando haya mediciones más
precisas. Una nota relativa a una primera lección no equivale al mismo dominio que
un máximo avanzado. Antes de mapear subvariables a competencias se necesita una
política de comparabilidad, no multiplicar los puntos actuales por seis ni aplicar
una dificultad arbitraria. No se ha simulado una liquidación de premios en esta fase.

## 4. Currículo y selección piloto

Fuente: inventario LOCAL versionado `project/curriculum-audit-2026-10-10/final/matriz.json`.
Es una instantánea curricular, no una consulta a la base actual de Vercel.

- 164 lecciones del inventario; 164 planes de banco.
- 0 lecciones sin plan; 0 bancos con `reviewIssues` de core en la comprobación offline.
- Esto certifica alineación estructural con esa instantánea, no naturalidad pedagógica
  ni calidad acústica de las 164 lecciones.

Piloto:

1. Saludos y presentaciones — `foundations-greetings-and-introductions`, BEGINNER.
2. Entrar y pedir — `restaurant-entering-and-ordering`, INTERMEDIATE.
3. Revisión de las condiciones del contrato — `negotiating-job-contract-reviewing-contract-terms`, ADVANCED.

Se eligen por contraste de función, longitud y exigencia. UPPER_INTERMEDIATE y las
demás lecciones quedan fuera de esta revisión detallada; el borrador no las declara
validadas. No se desbloquean secciones productivas por pertenecer al piloto.

### Diferencias importantes entre banco y evidencia

- En Saludos, decir `我是秘鲁人` puede demostrar compartir origen sin producir
  literalmente 哪 y 国. La comunicación lograda no prueba todas las palabras.
- En restaurante, 几位 es una expresión natural del camarero: responder `两位`
  puede ser adecuado. No obligar al cliente a pronunciar todas las palabras core.
- Una petición escrita mediante paráfrasis puede lograr el objetivo avanzado sin
  demostrar `能不能把 ... 写进 ...`. Separar objetivo logrado y estructura observada.
- La gramática de apoyo no desaparece por no estar en el core: se evalúa si fue
  utilizada. Los patrones exactos de la matriz se contrastan con los registros.

## 5. Diagnóstico de inflación y límites de esta auditoría

Se demuestra una vía de inflación: un máximo emitido por el modelo no se contrasta
contra cobertura completa ni contra contradicciones semánticas de su propio informe.
La clasificación tiene cuatro bloques amplios; pronunciación y fluidez no participan
en la nota actual aunque la presentación pueda sugerir una valoración oral integral.

No se ha ejecutado un estudio de frecuencia de 100 en cuentas reales. El resultado
recuperado documentado en TASKS es un caso, no una muestra representativa. G06 no
demuestra que OpenAI haya producido extremos: los candidatos se construyeron a mano.

Pendiente para calibración: muestra de intentos autorizados, referencia docente,
audio real y distribución de resultados por versión/contexto. No asignar otra nota
al intento del usuario ni etiquetar su pronunciación desde lo que quedó escrito.

## 6. Prioridades de implementación posteriores

1. Contrato de hallazgos, oportunidad, ayudas y cobertura; separación vocabulario/gramática.
2. Comprobaciones de consistencia entre criterios, feedback y capacidades medidas.
3. Viabilidad/captura acústica y política de privacidad/coste antes de habilitar notas fonéticas.
4. Evaluador candidato con referencias editoriales; después revisión docente y muestra reservada.
5. Perfil parcial honesto y política de recompensas cuando una dimensión requerida no es evaluable.
6. Diseño aprobado usando datos de ejemplo, sin presentar una demo como calibración real.

Los G01–G06 serán entradas para pruebas de aceptación futuras; cuando cambie la
rúbrica se versionará el baseline y se conservará el diagnóstico histórico, en vez
de proteger para siempre el comportamiento defectuoso. No hay cambios productivos
por el simple hecho de añadir estas pruebas.

## 7. Reproducción y aceptación de esta entrega

Ejecutar localmente, sin API:

```powershell
node node_modules/vitest/vitest.mjs run tests/unit/journey-speaking-quality-baseline.test.ts tests/unit/journey-speaking-evaluation.test.ts tests/unit/journey-speaking-capture.test.ts tests/unit/journey-lesson-report.test.ts
```

Resultado comprobado: lote dirigido de 4 archivos y 80 pruebas; después suite
unitaria completa de 115 archivos y 1.459 pruebas, todas pasan. Hay 17 pruebas
nuevas de fase 1. Typecheck global y lint del archivo nuevo también pasan. No se
repitieron build, componentes o integraciones: no se modificó código de aplicación.
El primer intento encontró restricción de archivos temporales del sandbox; se
repitió fuera de esa restricción. Las pruebas nuevas no importan servicios de
DB/proveedores, y el setup elimina las claves de proveedores para pruebas. No hubo
llamadas pagadas ni consultas a las bases para esta auditoría.

Aceptación editorial de esta fase: mapa auditado, matriz de tres lecciones real,
descriptores explícitos, riesgos reproducidos y límites pendientes documentados.
No equivale a aceptación docente ni a un cambio visible en Vercel.

Fuente externa de alcance: [OpenAI, Realtime Eval Guide](https://developers.openai.com/cookbook/examples/realtime_eval_guide),
consultada mediante OpenAI Docs: audio y transcripción no son pruebas equivalentes;
separar controles deterministas de evaluación humana. No valida nuestros umbrales.
