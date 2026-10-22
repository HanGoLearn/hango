# Preparación del juicio candidato y recepción segura

18/10/2026. Preparación offline, sin llamadas pagadas ni activación.

`journey-speaking-quality-review.ts` conecta el adaptador del intento con las
instrucciones de evaluación y el inspector de coherencia. **No genera un juicio
real todavía**: prepara instrucciones/datos/esquema y permite revisar una respuesta.
No contiene SDK, credenciales, modelo, red, base de datos o reintentos.

## Qué prepara

- Contrato versionado derivado del mismo esquema Zod local; formato JSON estricto.
  Se omiten del esquema de transporte ciertas restricciones de tamaño/número,
  pero se mantienen en la validación local. No se afirma compatibilidad con un
  proveedor/modelo real sin la prueba autorizada correspondiente.
- Instrucciones separadas del mensaje de datos. Conversación, objetivos y roles
  se tratan como datos no confiables, no órdenes para asignar una nota.
- Anclas 0–4 por comunicación, vocabulario, gramática e interacción/autonomía;
  ayuda estructurada, oportunidades, transferencia, autocorrección y evidencia.
  Son propuestas editoriales, no calibración docente.
- Datos mínimos del contexto: dificultad de la lección, roles/objetivo, recursos
  con sus significados e IDs, actos seleccionados y turnos claros originales.
  No se incluyen notas/respuestas de ejercicios, el snapshot completo, identidad
  del alumno ni datos de otras conversaciones. Los turnos pueden contener datos
  personales que el usuario haya dicho: no equivale a anonimización automática.
- Turnos de reconocimiento dudoso omitidos del mensaje de evaluación; se indica
  su cantidad. No se envían hipótesis interpretadas como si fueran producción.
  El contexto congelado conserva originales para rechazar citas sobre esa voz
  incierta, no para reconstruirla desde respuestas del personaje.
- Sin nota integral ni recompensas; pronunciación/fluidez NOT_EVALUATED. No se
  deriva fonética, tonos o ritmo de texto o confianza de reconocimiento.

## Qué recibe

El futuro transporte debe distinguir respuesta completa, rechazo e incompleta.
No se intenta recuperar JSON truncado, retirar cercas o corregir niveles. JSON
completo pasa el inspector de identidad, citas y coherencia. Resultado:
VALIDATED_CANDIDATE, REJECTED_CANDIDATE, REFUSED, INCOMPLETE o INVALID_OUTPUT.
Rechazos no incluyen el texto bruto para mostrarlo/loguearlo por accidente.
El contexto usado en validación es una copia congelada respecto a la entrada;
mutar los datos originales después de preparar no altera el criterio de revisión.

El futuro servicio debe conservar respuestas privadas para diagnóstico/recuperación
autorizados antes de validar; este módulo no es almacenamiento, autorización,
reserva de costes, límite de consumo o garantía de idempotencia. No sustituir los
controles actuales de propiedad, presupuesto y despacho único, ni añadir una
segunda llamada automática por cada intento real.

## Evidencia

19 pruebas nuevas. Lote petición/adaptador/candidato: 74/74; todas las unitarias:
1.569/1.569 en 121 archivos. Tipos/lint dirigido/diff pasan. Se comprueban esquema,
idiomas, aislamiento de datos, ausencia de red, límites, originales inciertos,
máximo contradictorio con ERROR, citas inventadas, intento ajeno y respuestas
incompletas. Solo su prueba importa el módulo; v2 activo permanece intacto.

OpenAI Docs se utilizó para verificar formato y limitaciones de
[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
Adherencia al esquema no demuestra exactitud semántica. Los tests no certifican
resistencia completa a inyección, idioma correcto de toda prosa, precisión de
ejemplos/pinyin ni estabilidad de un modelo real.

## Siguiente puerta de integración

Conectar una ejecución explícita al proveedor existente con sus controles de coste
y propiedad, conservar candidato privado versionado, contrastar casos con revisión
docente y decidir fórmula/criterios de activación. Para medir audio hacen falta
captura autorizada y capacidades acústicas validadas. Nada de esto se declara
resuelto por preparar el contrato; no se recalculan resultados históricos.
