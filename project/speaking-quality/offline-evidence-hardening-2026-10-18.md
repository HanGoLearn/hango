# Revisión offline del primer juicio candidato

## Alcance y resultado

Autorización: revisar la respuesta conservada y mejorar las reglas sin nuevas
llamadas. Se mantienen separados el contrato candidato v1, el prompt v2 y la
revisión de inspección v2. No cambia el evaluador activo, la calificación anterior,
las recompensas o General Level. No hay publicación, consultas/escrituras de base
ni llamadas de proveedor. Han burbuja, Companion y Speaking Lab no se modifican.

La respuesta original continúa rechazada. La reinspección no repara citas ni
modifica niveles para aceptarla; crea otro artefacto privado, con hash de la
respuesta original y versión del inspector, sin sobrescribir respuesta, claim,
inspección o resumen anteriores. Cambiar el inspector/prompt no cambia la clave
de despacho ni permite otro pago automático. La preparación pagada anterior
queda congelada: el ejecutor rechaza una solicitud que ya no coincide con ella.

## Problemas reproducidos y cambios

| Problema | Instrucción para el siguiente juicio | Control offline |
| --- | --- | --- |
| Afirmar una palabra que no aparece en la cita | Citar el fragmento exacto del alumno que contiene ese recurso, no otra frase de la sesión | Se conserva WORD_NOT_PRODUCED; prueba con palabra presente fuera de la cita |
| Corregir una frase bajo una palabra ajena | Relacionar objetivo, fragmento y corrección; no forzar observaciones fuera del banco bajo IDs de otra cosa | ERROR_TARGET_NOT_GROUNDED si el recurso léxico no figura ni en la cita ni en la corrección |
| Declarar ayuda sin mostrarla | Diferenciar explicación/modelo/corrección de una pregunta normal, identidad del personaje o avance de escena | SUPPORT_WITHOUT_PRECEDING_EVIDENCE en cada dimensión asistida sin cita anterior del personaje y aplicación del alumno |
| Citar al personaje sin relación con la intervención | Incluir pregunta/respuesta o iniciativa/reacción contiguas | MISSING_LINKED_EXCHANGE; no enlazar turnos a través de una intervención omitida |
| Fundamentar vocabulario/gramática con otra evidencia | Citas de la dimensión enlazadas a sus propios hallazgos | DIMENSION_EVIDENCE_NOT_LINKED si los fragmentos no coinciden en turno/contenido |

Se acepta citar la oración completa o un fragmento contenido en ella; no se
exigen citas idénticas byte a byte entre dimensión y hallazgo, pero sí texto
original respaldado en ambos. El contexto de interacción admite cualquiera de
las dos direcciones: personaje → alumno o alumno → personaje. Una sustitución
léxica puede tener el recurso solo en la corrección; no se exige que el alumno
haya producido correctamente la palabra para admitir un error.

## Criterio docente que se explicita en el prompt

- Una respuesta normal a una pregunta no es asistencia por sí misma. Si el
  personaje se presenta y el estudiante se presenta después, eso no prueba copia
  dependiente ni ayuda pedagógica. Hay que examinar la función del turno.
- No imponer penalizaciones para evitar un máximo. Nivel 3 requiere una
  limitación concreta respaldada, no «el personaje ayudó a avanzar».
- Una posible elipsis o intención ambigua no se transforma en error confirmado.
  Una corrección tampoco puede cambiar silenciosamente «otra vez» o los hechos
  del alumno para producir una frase más cómoda.
- Una dificultad sintáctica no se registra como error de una palabra ajena.
  Si no existe un objetivo adecuado en el banco, no se inventa un ID. Solo se
  puede describir una limitación claramente respaldada en la dimensión apropiada;
  las observaciones adicionales fuera de banco requieren un contrato futuro.
- Razones y traducciones en el idioma solicitado. Se mantienen las citas chinas
  y pinyin, sin insertar etiquetas explicativas inglesas en motivos españoles.

## Reinspección de la respuesta real, sin IA

Se conservaron los dos rechazos originales y se detectaron cinco adicionales:
el error léxico bajo un recurso ajeno y cuatro declaraciones de ayuda sin citas
que la respalden. Total: siete incidencias, no siete errores del estudiante.
No se ha aprobado ninguna nota ni generado un feedback nuevo como si procediera
de otro juicio. Se desconoce cómo responderá el modelo al prompt revisado.

## Límites que siguen pendientes

Estas reglas detectan incoherencias verificables, no resuelven toda la semántica.
Un modelo todavía podría citar una pregunta normal y describirla falsamente como
ayuda, o incluir una palabra en una corrección irrelevante. Tampoco se certifica
un patrón gramatical por coincidencia de caracteres. Se requiere contraste docente
para pertinencia de correcciones, cobertura, severidad, apoyos y niveles.

El idioma de toda prosa libre no se detecta automáticamente; se reforzó la
instrucción, no se añadió una heurística que rechace español por contener chino.
Tonos, pronunciación y fluidez siguen sin medirse. Texto reconocido no demuestra
su calidad. No convertir los cuatro niveles lingüísticos en una nota integral
ni anunciar calibración por una sola respuesta o pruebas sintéticas.

## Verificación

- 13 casos nuevos de regresión sintética; ningún dato privado del alumno en tests.
- 136 pruebas dirigidas de candidato/contexto/juicio/importación/despacho/datos/UI
  pasan; proveedor y base simulados. Tipos y lint dirigidos pasan.
- Regresión completa unitaria/componentes: 1.866/1.866 en 165 archivos pasan.
  Sin build, integración de bases, voz real ni llamadas pagadas en este bloque.
- Herramienta offline sin imports de proveedor, credenciales, entorno, base o
  contabilidad. Reutiliza el export con pins independientes y verifica que los
  datos enviados originalmente son idénticos antes de inspeccionar la respuesta.

La revisión de fallos y las pruebas específicas se apoyan en
[OpenAI Docs: Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).
No se ejecutan evaluaciones pagadas ni se sustituye la validación humana.
