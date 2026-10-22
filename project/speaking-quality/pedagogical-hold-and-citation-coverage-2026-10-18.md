# Revisión pedagógica offline y cobertura de citas

## Alcance de esta entrega

Continuación sin consumo adicional. Se añade una auditoría independiente del
contrato de respuesta: **aceptación técnica no equivale a aprobación docente**.
No hay cambios al prompt, esquema enviado, versión del candidato, clave de
despacho, autorización de gasto ni límites. No se corrige silenciosamente la
respuesta comprada ni se convierten sus ordinales en porcentajes.

`journey-speaking-quality-pedagogy.ts` no importa red, base, proveedores,
configuración privada o contabilidad. Los lectores legacy y de selección de
evidencias lo ejecutan solamente después de pasar sus controles estructurales.
La capa devuelve `HOLD`, `studentReady=false`, `score=null`. No existe una ruta
automática de aprobación ni un nuevo botón de evaluación.

## Correspondencia entre acto y evidencia

Primera regla editorial acotada: objetivo «Ask their name» (y dos etiquetas ES
exactas) de `foundations-greetings-and-introductions`. No depende de IDs de una
base concreta ni aplica búsquedas aproximadas sobre cualquier objetivo.

- Detecta que una presentación propia sencilla no respalda preguntar el nombre.
  Señala una inconsistencia del juicio, no un error lingüístico del estudiante.
- Reconoce algunos patrones directos y `你呢` en contexto de presentación del
  interlocutor inmediatamente anterior. No toma preguntas del personaje como
  producción del alumno, ni contexto futuro o separado por turnos ausentes.
- Reciprocidad sobre nacionalidad u otro tema no se da por pregunta de nombre.
- Formas complejas, paráfrasis no cubiertas, discurso referido y otros actos van
  a `NEEDS_REVIEW`, **no a ERROR, cero o falta de dominio**. La coincidencia de un
  patrón es solo `PATTERN_SUPPORTED`, nunca certificación semántica completa.

Esto es un control editorial limitado, no un evaluador semántico universal ni
una validación por profesor nativo. Los demás actos y la prosa de motivos siguen
necesitando revisión/calibración independiente. No se cambian los niveles para
forzar que una conversación básica deje de tener máximos.

## Cobertura honesta

Se cuentan intervenciones originales del alumno, no fragmentos duplicados:
citada, sin citar o excluida por reconocimiento dudoso. Una cita válida cuenta
una sola vez aunque aparezca en varias dimensiones/hallazgos.

«3 de 5 citadas» **no es nota, precisión del modelo ni prueba de que no leyó las
otras dos**. Tampoco implica que todo un turno citado haya sido correctamente
evaluado. Es un indicador auditable de respaldo documental. No citar no genera
penalización, llamada adicional o corrección ficticia.

`required=0` se señala como configuración editorial no seleccionada, no como
cobertura obligatoria perfecta. No se convierte todo el banco léxico en cuota.
Las afirmaciones `NO_OPPORTUNITY` quedan pendientes de revisión contextual:
ausencia de una palabra no prueba ausencia de oportunidad. No se reetiquetan los
hallazgos comprados ni se confunde una alternativa válida con error.

## Pantalla privada

La pantalla local mantiene niveles originales e historial, pero separa el
resultado técnico de la retención pedagógica. Incluye cobertura y enlaces a
intervenciones sin cita/excluidas. Los avisos están escritos en español por el
servidor; la prosa del modelo queda en un detalle rotulado como **sin aprobación
docente**, no como una nueva nota de Han. No se publica una narrativa reformulada
que pudiera esconder errores del motivo original.

El lector conserva autenticación, propiedad, desarrollo exclusivo y verificación
de captura/solicitud. Esta entrega no importa la conversación de producción a la
lista local: la revisión real se conserva como auditoría privada de archivo.

## Reutilización del tercer ensayo pagado

`audit-paid-journey-pedagogy-offline.ts` relee el export y la tercera respuesta,
verifica pins/hash y el mismo mensaje preparado; bloquea fetch y escribe un
artefacto nuevo privado con creación exclusiva. No sobrescribe respuesta,
inspección, claim o resumen. Resultado observado:

- Formato técnico: `VALIDATED_CANDIDATE`; decisión pedagógica: `HOLD`.
- Señala f3: cita de presentación propia para el acto de preguntar nombre.
- 3 de 5 intervenciones claras citadas; un turno dudoso excluido.
- Tres afirmaciones de falta de oportunidad pendientes de contexto.
- Objetivos obligatorios no configurados y prosa sin aprobación explícitos.
- Hashes originales intactos; cero intentos de red, llamadas o escrituras de BD.
- Niveles del proveedor, nota de producción, General Level y premios intactos.

## Verificación y pendientes

Pruebas sintéticas cubren autoría, pregunta directa, reciprocidad, contexto
incorrecto/futuro/ausente, paráfrasis sin penalización, duplicados, incertidumbre,
identidad, configuración y ausencia de mutación/red; hay pruebas de integración
entre los lectores y la pantalla privada, incluida accesibilidad automatizada.
No se ha realizado una nueva comprobación visual en navegador en este bloque.

Regresión completa: **1.922/1.922 pruebas en 167 archivos**; tipos, lint dirigido,
formato y diff correctos. Comparación adicional de la solicitud completa (instrucciones, datos,
esquema y versión) idéntica al ensayo pagado; la auditoría final coincide con el
artefacto privado conservado, sin otra escritura ni intento de red.

Pendiente: ampliar reglas editoriales por acto, motivos fieles y localizados
aprobados, corpus reservado y revisión docente independiente, estabilidad de
juicios y medición acústica validada. No basta esta regla para afirmar que se
resolvieron los errores semánticos o la calibración de todos los speaking.

Sin build, migraciones, cambios de cuentas, commit, push o despliegue. Vercel
conserva el evaluador activo anterior.

Referencia consultada: [OpenAI Docs: Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
El esquema delimita el formato; sigue siendo necesario verificar su contenido.
