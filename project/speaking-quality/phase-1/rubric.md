# Rúbrica editorial piloto — evidencias antes que porcentajes

Versión: `journey-quality-pilot-2026-10-18-v1`.
Estado: borrador editorial, sin activación ni calibración humana externa.
Aplicación piloto: únicamente las tres lecciones de [pilot-matrix.json](pilot-matrix.json).

## 1. Contrato de una observación

Cada registro futuro deberá vincular: intento y versión, dimensión, objetivo o
recurso curricular, oportunidad real, intervención del personaje si es pertinente,
respuesta original del estudiante, ayuda ofrecida/aplicada, resultado observado,
severidad/recurrencia y fuente. Para audio: referencia privada del segmento,
condiciones de señal y capacidad del analizador validada. No es una modificación
del esquema actual ni permiso de grabación adicional.

El estado del hallazgo y el nivel son distintos:

| Estado                 | Qué significa                                               | No permite afirmar                                                |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Correcto independiente | Aplicación pertinente sin modelo inmediato determinante     | Dominio de toda la lección por una frase                          |
| Correcto asistido      | Uso tras ayuda/modelo identificado                          | Que nunca pueda usarlo de forma independiente                     |
| Autocorrección         | El estudiante detecta y repara su formulación               | Que la primera formulación nunca existió o que el fallo persistió |
| Error confirmado       | Problema lingüístico respaldado por evidencia interpretable | Diagnóstico tonal desde texto                                     |
| Comprendido            | Respuesta contextual demuestra comprensión                  | Producción propia de cada palabra del personaje                   |
| No observado           | No se dispone de aplicación pertinente                      | Error, incapacidad o dominio                                      |
| Sin oportunidad        | La escena no permitió observarlo                            | Penalización por el fallo del diseño/personaje                    |
| No evaluable           | Señal/datos/capacidad de medición insuficientes             | Sustituirlo por cero o por máximo                                 |

No etiquetar automáticamente como independiente una repetición inmediata del
modelo. Tampoco considerar «copia» cualquier saludo o patrón común. Valorar la
aplicación posterior pertinente. Pedir ayuda puede demostrar una estrategia de
interacción; la estructura aplicada con ayuda queda asistida hasta observar otra
aplicación independiente.

## 2. Anclas por dimensión (propuestas 0–4)

Un nivel solo se asigna cuando existe oportunidad y evidencia suficiente para
distinguirlo. 0 no significa «no habló/no sé»; significa dificultad observada tras
apoyo apropiado. Los ejemplos son editoriales, no etiquetas docentes validadas.

### Comunicación

| Nivel | Descriptor observable                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | No logra comunicar una intención pertinente después de apoyo adecuado; se descarta previamente un fallo técnico o una consigna incomprensible.                            |
| 1     | Solo comunica fragmentos aislados; el interlocutor necesita reconstruir repetidamente la intención, con evidencias de malentendido.                                       |
| 2     | Logra parte de los actos pertinentes con aclaraciones/apoyo frecuentes; quedan necesidades comunicativas sin resolver pese a oportunidad.                                 |
| 3     | Consigue los actos principales y repara alguna imprecisión local; existe un límite concreto respecto al descriptor máximo.                                                |
| 4     | Realiza de forma clara y apropiada los actos centrales del contrato de esta lección, responde al contexto y no deja dificultades confirmadas incompatibles con ese logro. |

Una paráfrasis correcta puede lograr el acto sin demostrar una estructura exacta.
No ampliar objetivos a todos los temas que el personaje introdujo por iniciativa.

### Vocabulario en conversación

| Nivel | Descriptor observable                                                                                                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | No consigue seleccionar recursos léxicos básicos para la intención observada ni aplicarlos con apoyo accesible.                                                                                 |
| 1     | Recursos aislados o selecciones erróneas recurrentes dificultan el sentido; depende de palabras que el personaje proporciona.                                                                   |
| 2     | Selección funcional pero restringida/asistida en oportunidades pertinentes; errores de significado o combinaciones requieren reparación.                                                        |
| 3     | Selección y combinación adecuadas para el objetivo, con una limitación local confirmada o dependencia puntual que impide el máximo.                                                             |
| 4     | Usa de forma propia, pertinente y suficientemente variada para esta tarea los recursos prioritarios que la escena permite observar; sin errores léxicos pendientes incompatibles con el máximo. |

No exigir sinónimos a un principiante ni premiar rareza léxica. Registrar por
separado qué palabras concretas se demostraron y qué quedó no observado. Un objetivo
léxico central sin oportunidad se declara limitación; no se certifica automáticamente.

### Gramática en conversación

| Nivel | Descriptor observable                                                                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | No consigue formular una relación básica requerida por la tarea incluso con apoyo pertinente; hay ejemplos interpretables, no solo silencio.                                                   |
| 1     | Desorden, elementos o relaciones incorrectas recurrentes impiden construir significados esenciales, con dependencia constante del modelo.                                                      |
| 2     | Aplica parcialmente las relaciones necesarias, de forma asistida o con errores repetidos que necesitan aclaración.                                                                             |
| 3     | Aplica las estructuras pertinentes con eficacia, pero hay un error local pendiente o ayuda puntual que constituye una limitación comprobada.                                                   |
| 4     | Controla de manera independiente las relaciones y estructuras observadas necesarias para la tarea; no contiene un error gramatical confirmado pendiente incompatible con el descriptor máximo. |

No considerar incorrecta una elipsis natural: `两位` es una respuesta completa en
contexto a `几位`. No afirmar dominio de 吗 o 把 si no aparecieron, aunque otro recurso
haya logrado la intención. No exigir una estructura extra por parecer más avanzada.

### Pronunciación y tonos

Solo aplicable después de validar la medición acústica con personas y de contar
con audio apto. Texto limpio o STT de alta confianza no habilitan esta dimensión.

| Nivel | Descriptor observable futuro, sujeto a audio y revisión                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Los segmentos evaluables no permiten reconocer intenciones elementales por dificultades fonéticas observadas incluso tras apoyo; no por ruido o recorte.                                 |
| 1     | Problemas recurrentes de articulación/tonos generan ambigüedad importante y múltiples reparaciones del interlocutor.                                                                     |
| 2     | Gran parte resulta comprensible; problemas fonéticos específicos y repetidos requieren esfuerzo o alguna aclaración.                                                                     |
| 3     | Habla inteligible para la tarea; existe un problema localizado de sílaba, tono o prosodia confirmado que merece práctica.                                                                |
| 4     | Control fonológico sólido para el nivel y la tarea en una muestra suficiente; no se detectan dificultades respaldadas incompatibles con el descriptor, sin afirmar perfección universal. |

Separar sonidos y tonos en los hallazgos para que una corrección sea útil. Las
realizaciones contextuales aceptables, tono neutro y cambios tonales no se comparan
ciega y literalmente con el pinyin de diccionario. No castigar altura de voz,
identidad/acento o diferencias de micrófono. Revisar las reglas específicas con un
docente antes de convertirlas en detección o penalización automática.

### Interacción y autonomía

| Nivel | Descriptor observable                                                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | No consigue responder o aplicar apoyo de forma pertinente después de oportunidades accesibles y sin impedimento técnico.                                                                               |
| 1     | Depende continuamente de modelos y no adapta respuestas a lo que el interlocutor acaba de decir.                                                                                                       |
| 2     | Sostiene parte del intercambio, pero requiere dirección frecuente o aún no transfiere el modelo a una oportunidad diferente.                                                                           |
| 3     | Responde/adapta de forma propia y maneja ayuda puntual; hay una limitación concreta respecto al máximo.                                                                                                |
| 4     | Conduce su parte del intercambio con respuestas, iniciativas o aclaraciones apropiadas a su rol/nivel y demuestra aplicación propia suficiente; pedir ayuda legítima no invalida por sí solo el nivel. |

No exigir preguntas en cada turno ni volverse al guion cuando una pregunta fue
respondida. Evaluar alumno y personaje en conjunto para no atribuir al alumno el
estancamiento provocado por preguntas repetidas de la IA.

### Fluidez funcional

Solo calificable con evidencia temporal/acústica fiable. Los tiempos de red,
respuestas del modelo y tiempo entre pulsaciones no prueban vacilación lingüística.

| Nivel | Descriptor observable futuro                                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0     | No consigue producir una unidad elemental de sentido por interrupciones del habla observadas tras apoyo; no por captura incompleta. |
| 1     | Fragmentación persistente rompe unidades necesarias para el nivel y dificulta seguir la intención.                                  |
| 2     | Produce unidades comprensibles con interrupciones recurrentes que exigen reconstrucción; puede usar ayuda para continuar.           |
| 3     | Continuidad y segmentación funcionales, con una dificultad localizada que afecta alguna unidad respecto al nivel esperado.          |
| 4     | Continuidad, pausas y segmentación apropiadas a esta tarea y etapa; no requiere velocidad nativa ni ausencia de reflexión.          |

## 3. Modificadores específicos de los tres pilotos

### Saludos y presentaciones

- Recursos centrales existentes: 你好, 叫, 名字, 认识, 哪, 国; patrones de nombre y 呢.
- La construcción con 吗 está publicada como apoyo. Si se utiliza, su control se
  observa; no forzar preguntas de identidad ya respondidas.
- Una presentación correcta, pregunta recíproca y respuesta sobre origen son
  evidencia funcional; no hay que añadir una historia personal larga.
- Un estudiante que habla de forma avanzada no recibe el máximo por longitud:
  se examina si resolvió esta tarea, y las ampliaciones son evidencia adicional.
- `我叫是小林。` es caso editorial de error de presentación; no puede convivir
  sin explicación con un máximo de control gramatical del mismo recurso.
- `你呢？` puede realizar una pregunta recíproca; `我是秘鲁人。` puede responder
  sobre origen sin producir literalmente todos los recursos de la pregunta.
- Pronunciación: comprobar contexto de 你好 y recursos realmente dichos; no
  exigir pronunciar palabras nunca utilizadas ni adjudicar errores por su pinyin.

### Entrar y pedir

- Primero tamaño del grupo y pedido, con espacio para una aclaración pertinente.
- 几位 puede ser input del camarero, no producción obligatoria del cliente.
- A-no-A tiene evidencia si el alumno lo aplica (`辣不辣？`); una pregunta con 吗
  puede ser válida para el objetivo sin probar esa estructura concreta.
- No obligar a pedir 宫保鸡丁 ni penalizar rechazar picante, no tener preferencia
  o elegir otro plato. No inventar necesidades médicas/alergias.
- Para el máximo no basta repetir un nombre de plato sugerido: la evidencia
  debe mostrar elección/petición propia y gestión pertinente del intercambio.

### Revisión de condiciones del contrato

- Evidencia de precisión: identificar una condición ficticia, preguntar su
  alcance/plazo/criterios y actuar sobre la respuesta con una aclaración pertinente.
- La petición de constancia escrita puede lograrse mediante paráfrasis; separar
  logro del acto y aplicación real de 把 / 写进.
- No es obligatorio elegir no competencia; 竞业限制 está como opcional en el banco.
- No calificar corrección jurídica, conocimientos empresariales ni postura frente
  a una cláusula como competencia lingüística. No afirmar que una regla ficticia
  es ley, ni pedir documentos o datos laborales reales.
- La exigencia avanzada es precisión y adecuación de formulación, no producir
  tecnicismos ajenos a la escena ni hablar de manera interminable.

## 4. Oportunidad, cobertura y elegibilidad de resultado

Para cada objetivo: se ofreció oportunidad / no se ofreció / fue interrumpida;
hubo intento / aplicación asistida / aplicación independiente / no observado.
Exigir evidencias adecuadas a los objetivos, no un número fijo de turnos o una
cuota de palabras. La cobertura no es una nueva penalización por omitir cada palabra.

Si falta un objetivo central por diseño o corte, se muestra la limitación y la
práctica puede finalizar. Definir una recuperación/repetición voluntaria y la
política de premios antes de hacer obligatoria la nueva nota integral; no atrapar
al estudiante esperando una medición imposible.

Matriz de notas:

- Nota de ejercicios de vocabulario ≠ uso de vocabulario al conversar.
- Nota de ejercicios de gramática ≠ aplicación oral de estructuras.
- Pronunciación no evaluada ≠ pronunciación sin errores.
- Acto logrado por paráfrasis ≠ dominio de todos los patrones alternativos.
- Conjunto de citas válido ≠ ordinal pedagógico correcto.

## 5. Coherencia de hallazgos y feedback

Priorizar impacto comunicativo, recurrencia, relación con la lección y utilidad de
la práctica. No restar por cantidad ilimitada de repeticiones del mismo fallo.
Una autocorrección es información positiva de control, no ocultamiento del intento
inicial ni penalización repetida automática.

Antes de aceptar un informe nuevo, comprobar conceptualmente:

1. Ningún máximo contradice el error/ayuda que su propia justificación declara.
2. Ningún comentario afirma tonos perfectos o un defecto tonal sin audio válido.
3. Ninguna corrección atribuye palabras no dichas al alumno ni usa una hipótesis
   de reconocimiento como producción literal certificada.
4. No hay prioridad gramatical/léxica sin hallazgo confirmado correspondiente.
5. Explicaciones en ES/EN según configuración, conservando citas chinas.
6. Una limitación técnica no desaparece para hacer la nota completa ni se vuelve
   error del estudiante.

Estas reglas son requisitos de la implementación posterior; las seis brechas
G01–G06 documentan por qué todavía no están todas garantizadas en runtime.

## 6. Verificación docente pendiente

Los ejemplos no son un corpus de alumnos ni una referencia humana calibrada. Antes
de activar pesos/umbrales, revisar variantes válidas, severidad, ayudas y anclas
con docentes. Reservar conversaciones nuevas para comprobar los ajustes sin
entrenarse para estos pocos ejemplos. No convertir las pruebas sintéticas de fase 1
en un supuesto estudio de precisión de pronunciación.
