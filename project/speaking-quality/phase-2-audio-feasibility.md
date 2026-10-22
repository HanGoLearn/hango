# Entrega 2 — Viabilidad acústica y contrato experimental

Fecha: 18/10/2026. Estado: estudio técnico y prototipo offline; captura adicional,
analizador, corpus humano y notas acústicas NO activados.

## 1. Conclusión y decisión propuesta

Para un piloto de calidad contrastable, preparar audio del alumno por intervención,
ligado al intento y al turno, con permiso específico y acceso privado. Conservar
la conversación de voz actual para dialogar; analizar después sin convertir al
personaje en examinador ni alterar la conversación de Han burbuja/Companion/Lab.

Motivo: permite escuchar/revisar el mismo segmento, comparar sistemas y contrastar
hallazgos con docentes. Una revisión dentro de Realtime es una alternativa viable
de experimentación, pero el contexto temporal de una sesión no es un archivo de
audio reproducible ni prueba de detección tonal fiable.

No se selecciona un proveedor nuevo, cambia un modelo, cobra una operación o
concede permiso de grabación mediante este documento. La comparación de precisión,
coste y latencia necesita una muestra real y presupuesto autorizado.

## 2. Lo que existe hoy en HanGo

| Componente | Observado en código | Consecuencia |
| --- | --- | --- |
| Micrófono actual | `getUserMedia`, cancelación de eco, supresión de ruido y ganancia automática; tracks inicialmente deshabilitados | Configuración de captura, no garantía de señal perfecta ni métricas fonéticas |
| Envío de voz | WebRTC añade los tracks al peer; pulsación controla el envío del usuario | La sesión recibe audio, pero la captura Journey sellada no contiene sus binarios |
| Cierre de Journey | La ruta `isolatedJourney` no ejecuta ni guarda la revisión acústica anterior | No basta con mostrar los antiguos campos de pronunciación |
| Revisión anterior | Instrucciones de revisar audio en contexto y JSON libre con confianza declarada; límite de 20 turnos, timeout de 8s | No hay prueba aquí de calibración, cobertura, segmentos auditables o confiabilidad del porcentaje declarado |
| Captura final Journey | Texto original/interpretado y calidad; no referencia acústica por turno | Las sesiones históricas solo con texto no permiten reconstruir tonos |
| Subidas privadas existentes | `speaking-upload.ts` y ruta de upload autorizan por `SpeakingSession`, formato y objeto propio | Son infraestructura de otro flujo; NO reutilizar un ID Journey como si fuera una sesión de Lab |
| Validación de medios | `media-validation.ts` comprueba contenedor, duración, canales, sample rate y ausencia de vídeo | Se puede reutilizar el validador sin compartir sesiones, notas o permisos entre productos |
| Retención privada existente | Referencias a `speakingAttempt` y namespace de speaking | No presupone que un nuevo audio Journey ya tenga borrado/retención correctos |

No se inspeccionaron binarios privados ni bases de datos. La ausencia de audio se
refiere al contrato actual de captura de Journey, no a todos los productos de HanGo.

## 3. Alternativas contrastadas

| Alternativa | Ventaja | Riesgo / limitación | Uso propuesto |
| --- | --- | --- | --- |
| Solo transcripción | Ya disponible; útil para análisis lingüístico | No certifica tonos, articulación ni fluidez acústica | Mantener para contenido con alcance explícito |
| Revisión en sesión Realtime | Usa audio presente sin requerir por sí misma un archivo adicional | Depende del contexto disponible, cierre/conexión y correlación real por turnos; difícil repetir exactamente sin archivo | Candidato de comparación, no única prueba de precisión |
| Audio privado por intervención | Permite auditoría, segmentos y comparación reproducible | Requiere captura, permisos, espacio, retención, vinculación y coste adicional de análisis | Arquitectura recomendada para piloto autorizado |
| Motor especializado en pronunciación | Puede proporcionar señales fonéticas específicas | Hay que verificar mandarín, habla espontánea, variantes contextuales y calibración; lectura guiada no equivale a conversación | Evaluar solo si los candidatos iniciales no cumplen calidad |

La documentación oficial permite respuestas fuera de banda y contexto personalizado
en Realtime. Eso ayuda a separar revisión y conversación, pero no implica gratuidad,
precisión tonal garantizada o conservación permanente del audio. El modelo actual
acepta audio; esa capacidad no lo convierte en un evaluador docente validado.

## 4. Diseño del piloto de captura (no implementado)

1. Verificar entorno y activación explícita solo para participantes autorizados.
2. Explicar qué se captura, para qué y durante cuánto tiempo. Consentimiento/permisos
   nuevos no se deducen de que antes se permitiera usar el micrófono para conversar.
3. Capturar solo la entrada del alumno durante mantener presionado; no iniciar
   grabación de la voz remota ni del dispositivo completo. Probar que no se añaden
   intervalos fuera de la pulsación y que los inicios/finales no se recortan.
4. Crear fragmentos técnicamente reproducibles: `MediaRecorder`/contenedores y
   codecs por navegador o alternativa de PCM si hace falta. No asumir que un chunk
   arbitrario de WebM es un archivo independiente válido.
5. Vincular turno, secuencia, referencia privada, duración real e integridad en el
   servidor. La hora de la pulsación o un texto reconocido no son esa vinculación.
6. Medir señal y separar silencio, clipping, eco, ruido, voz del personaje filtrada
   al micrófono y captura incompleta. Los umbrales necesitan pruebas, no se inventan.
7. Sellar el manifiesto de audio junto al intento, sin sustituir texto original ni
   inventar una frase esperada para hacer coincidir lo pronunciado.
8. Analizar únicamente cuando el presupuesto/autorización permiten una operación.
   Cancelar/cerrar debe detener la captura inmediatamente; no seguir escuchando para
   terminar el informe. Fallos del audio no pierden las evidencias de texto.

Debe comprobarse en Safari/iPhone, Chrome/Android y escritorio; permisos denegados,
llamada entrante, segundo plano, soltar fuera del botón, cancelación, interrupciones,
red lenta y cierre durante el último turno. No se ha ejecutado ese ensayo físico.

## 5. Contrato experimental añadido

Archivo: `src/lib/journey-speaking-acoustic-candidate.ts`.
No tiene consumidores de aplicación; únicamente su suite de prueba. No registra,
sube, descarga, reproduce o analiza audio ni invoca proveedores/DB.

Recibe un candidato acotado y un contexto que deberá ensamblar el servidor desde
evidencia verificada. No aceptar ese contexto del navegador/modelo como afirmación
de propiedad, permiso, calidad o duración. Los flags no comprueban audio por sí solos.

- Liga intento e idioma.
- Solo permite turnos del estudiante y referencias de audio coincidentes.
- Requiere autorización específica de revisión y evidencia verificada.
- Bloquea texto como única fuente, señal desconocida/inutilizable, ausencia de voz,
  duración inválida y fragmentos incompletos.
- Acota tiempos dentro del turno, campos y número de candidatos; excluye duplicados.
- Rechaza notas y porcentajes de confianza añadidos por el proveedor al esquema.
- Distingue inválido, no evaluable y revisable por personas.
- Siempre devuelve `score: null` y `eligibleForScoring: false`, aun con candidatos
  correctos estructuralmente o sin errores propuestos. Vacío no significa perfecto.

No certifica idioma de la prosa, verdad del hallazgo, tono real, calidad de señal,
autenticidad de una subida ni que un target coincida con el sonido. Es una puerta
de preparación para calibración manual, NO una guardia suficiente para producción.

## 6. Corpus de referencia pendiente

El piloto inicial del plan propone 24 intentos humanos. Aún no existen grabaciones
recogidas ni revisión docente para este lote. Las pruebas usan metadatos ficticios.

Ficha mínima por intento autorizado:

- Identificador pseudónimo del participante, lección, nivel y lengua de ayuda.
- Consentimiento/condiciones, origen privado y fecha de expiración del archivo.
- Dispositivo/navegador y condiciones de captura, sin inferir rasgos sensibles.
- Turnos y marcas temporales verificadas; texto reconocido separado de anotación humana.
- Hallazgos de cada docente independientes: recurso, turno/segmento, articulación,
  tono o ritmo, efecto en inteligibilidad y recomendación; opción «no sé/no evaluable».
- Resolución del desacuerdo sin mostrar antes la nota del modelo al revisor.
- División por participante entre ajuste y prueba reservada; no usar esta plantilla
  ni casos sintéticos como supuesto conjunto reservado independiente.

Incluir aciertos, errores reales, variantes aceptables, peticiones de ayuda, ruido y
recortes. Un hablante o una voz sintética no representan a estudiantes reales de
distintos niveles. No recolectar ni contratar personas automáticamente.

## 7. Coste, permisos y retención por decidir antes de activar

No fijar hoy un coste por evaluación como si fuera el real. Registrar por separado
duración de audio, proveedor/modelo, consumo reportado, estimación y fallo. Medir
mediana/p95 de latencia y coste con el lote autorizado. No duplicar el cargo lógico
de conversación ni ocultar solicitudes fallidas/reintentos.

La UI debe reutilizar el informe guardado. Abrir/refrescar/desplegar un segmento no
dispara evaluación. Un fallo no inicia automáticamente otra solicitud pagada.

Decisiones pendientes: participantes, presupuesto máximo del piloto, si se permite
guardar audio temporalmente, periodo de retención, revisión humana y proveedor de
análisis candidato. Propuesta para discutir, NO configuración activada: retención
corta del piloto (por ejemplo 7 días) y borrado verificable; retener hallazgos mínimos
necesarios según política definida, no el audio indefinidamente por defecto.

Los archivos deberán tener autorización por usuario/intento, namespaces separados
de Lab, límite/validación de contenido, URLs privadas con vencimiento y borrado en
cascada/outbox compatible con referencias de Journey. No mezclar la limpieza de
otros `SpeakingAttempt` con nuevos datos porque compartan un nombre parecido.

## 8. Criterios de salida y qué podemos avanzar sin audio nuevo

Hecho en esta entrega: estudio de rutas y documentación oficial; recomendación
arquitectónica; prototipo de contrato sin notas y pruebas offline.

Verificado: 27 pruebas nuevas; lote dirigido 86/86; suite unitaria completa
1.486/1.486 en 116 archivos; tipos, lint dirigido y formato pasan. La búsqueda de
consumidores confirma que solo su prueba importa el prototipo. No se ejecutaron
build, integraciones en bases, grabaciones o llamadas de proveedor en esta entrega.

Pendiente para completar la entrega 2: captura/integridad reales, compatibilidad
de dispositivos, muestra autorizada, presupuesto, comparación de analizadores y
validación humana. No anunciar precisión, corrección tonal o una nueva nota activa.

Mientras tanto puede implementarse en una rama local el contrato lingüístico de
seis dimensiones, la coherencia entre errores y máximos, la cobertura y el formato
de feedback con datos ficticios. Las dimensiones acústicas deben seguir no evaluadas
hasta disponer de evidencia y capacidades contrastadas; no producir otra demo con
100 integral que oculte esa carencia.

## 9. Fuentes consultadas mediante OpenAI Docs

- [Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations):
  respuestas fuera de banda y contexto explícito; no es un contrato de evaluador fonético.
- [GPT-Realtime Mini](https://developers.openai.com/api/docs/models/gpt-realtime-mini):
  soporte de audio y ausencia de Structured Outputs en la ficha consultada. La ficha
  marca la familia como deprecated; eso no establece por sí solo la fecha de cierre
  de la cuenta/snapshot actual. No se cambia modelo ni se migra en esta entrega;
  verificar disponibilidad oficial antes de elegirlo para un piloto nuevo.

No se atribuyen a estas fuentes umbrales de precisión de tonos o soporte docente
que no documentan. No se invocó ninguna API de evaluación durante el estudio.
