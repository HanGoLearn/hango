# HanGo — matriz curricular y progresión de los diez niveles personales

Auditoría inicial: 10 de octubre de 2026. Actualización local: 11 de octubre.
Estado actual: contrato conversacional, tiempos/cierre y bancos de
**164/164 lecciones** integrados localmente en Journey Speaking. Aceptación
oral, rúbrica, revisión especializada y cortes de puntos siguen pendientes.
Cobertura de bancos no significa matriz completa. No publicado; ver sección 9.

## 1. Resultado y alcance

La consulta descrita a continuación corresponde a la auditoría inicial CUR-01,
no a todas las fases posteriores. Los bancos integrados después sí leen los
pasos de progreso del usuario autenticado para resolver exposición, sin escribir
progreso ni crear memoria de Han. Las capturas históricas no se reescribieron.

Se consultó la base configurada en `.env.local`, con una conexión PostgreSQL
de solo lectura. No se consultaron usuarios, grabaciones ni conversaciones.
No se modificaron lecciones, puntos, roles, bloqueos, límites de IA o la base.
No se llamó a OpenAI, ni se hizo commit, push o despliegue. Vercel no se auditó.

Entregables:

- [Informe completo: fichas de las 164 lecciones](curriculum-audit-2026-10-10/final/informe.md).
- [Matriz reutilizable con IDs y referencias](curriculum-audit-2026-10-10/final/matriz.json).
- Este documento: objetivos propuestos, criterio de aprendizaje, hallazgos y
  pasos de implementación. Distingue propuestas, código local aplicado y
  aceptación real pendiente; no presenta toda la matriz como terminada.

La primera captura sin frases se conserva en el directorio padre; el corte
`final/` añade las frases reales de los diálogos. Las cifras de inventario
coinciden. Cada captura identifica la fecha UTC y la huella del contenido.

## 2. Lo que existe realmente

| Inventario publicado y vinculado a las lecciones         | Cantidad |
| -------------------------------------------------------- | -------: |
| Escenarios                                               |       41 |
| Lecciones                                                |      164 |
| Registros/vínculos de vocabulario                        |     1592 |
| Formas chinas distintas, normalizadas por espacios/NFC   |     1304 |
| Registros/vínculos de gramática                          |      480 |
| Estructuras literalmente distintas                       |      464 |
| Formas de vocabulario que aparecen en más de una lección |      222 |
| Estructuras literales que aparecen en más de una lección |       15 |

Estos números describen contenido vinculado, no el total de filas de todas
las tablas de contenido ni la cantidad dominada por un estudiante. Una misma
forma puede tener varios sentidos; una misma función gramatical puede tener
estructuras escritas de manera diferente. No se han fusionado registros ni
declarado que las 464 estructuras sean 464 conceptos gramaticales distintos.

La agrupación **actual** de Journey es 60 lecciones/15 escenarios en
Fundamentos, 60/15 en Vida cotidiana y 44/11 en Situaciones avanzadas.
Se usa el capítulo que el código asigna al escenario, no el reparto 14/17/10
de documentos antiguos. Los niveles de dificultad de un escenario mixto
se conservan. Auditar todo el contenido no elimina los límites de la beta.

Las 164 lecciones tienen objetivo, título y objetivo ES, vocabulario y
gramática publicados, ejemplos, ejercicios de gramática publicados, paso
Speaking, diálogo publicado y una misión publicada con ambos roles.
Ninguna de las comprobaciones estructurales seleccionadas dio una alerta.
**Eso no valida cada traducción, explicación, ejemplo o diálogo lingüísticamente.**

## 3. Qué significa el mapa por nivel

Los diez nombres y sus umbrales se mantienen exactamente. No se sustituye
la escala ni se equipara a diez niveles HSK oficiales.

Hay dos capas separadas:

1. **Inventario comprobado:** palabra/estructura → ID → lección → escenario.
2. **Asignación propuesta:** ordenar una ruta y relacionar su contenido con
   los tramos de los diez niveles. Hace falta revisión pedagógica de los cortes.

La segunda capa usa una simulación secuencial a notas perfectas con las
fórmulas de presupuesto actuales; no presupone que todos los alumnos sigan
ese orden, ni incluye placement o puntos de Labs. El orden es capítulo,
dominio, escenario, dificultad y lección; los empates se resuelven de forma
estable por slug. **No es una cadena de requisitos ni un clasificador de dominio.**

El informe contiene las listas exactas; el JSON relaciona cada tramo con
`proposedLessonSlugs`, y cada lección conserva todos los IDs, palabras,
pinyin, significados ES/EN, estructuras y frases reales del diálogo.
`priorLessonSlugs` representa contenido anterior en esta ruta propuesta,
no contenido conocido por el alumno. Las listas de los niveles no son
disjuntas: una palabra se puede reciclar y no se deben sumar sus conteos.

## 4. Matriz pedagógica propuesta

Las siguientes son **metas para trabajar dentro del tramo**, no capacidades
que se atribuyan a alguien por entrar en él. Se verifican con evidencia;
los puntos se mantienen como señal de progreso, no como prueba léxica.

| Nivel personal existente       | Tramo actual | Foco léxico/gramatical propuesto                                                                   | Qué debería poder hacer con el contenido                                                                              |
| ------------------------------ | ------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Comenzando desde cero          | 0–<100       | Palabras y patrones de identificación, saludos, cantidades y necesidades básicas; preguntas breves | Comprender una intervención sencilla, dar un dato propio y pedir ayuda sin memorizar todo un diálogo                  |
| Comunicándote con lo esencial  | 100–<350     | Rutinas, familia, clase, llamadas y gestiones básicas; tiempo, peticiones y relaciones sencillas   | Sostener intercambios breves, aportar información y responder a una pequeña variación de la escena                    |
| Encontrando tu ritmo           | 350–<700     | Pedidos, transporte, alojamiento y otras transacciones; secuencias y aclaraciones según la lección | Resolver una transacción, preguntar un detalle y reparar una incomprensión con apoyo puntual                          |
| Hablando con soltura           | 700–<900     | Seguimiento, planes, preferencias y problemas cotidianos; explicaciones y conexiones entre ideas   | Desarrollar la conversación, explicar una necesidad y reaccionar a un cambio sin seguir un cuestionario               |
| Haciéndote entender fácilmente | 900–<1150    | Entrada a situaciones profesionales; condiciones, motivos, alternativas y trato apropiado          | Explicar una propuesta, comparar opciones y adaptarse al interlocutor con claridad                                    |
| Resolviendo situaciones reales | 1150–<1500   | Contextos profesionales/especializados existentes; reformulación, matices y argumentación          | Resolver una complicación, justificar decisiones y explicar una idea de varias maneras                                |
| Hablando como profesional      | 1500–<1650   | Transferencia del repertorio anterior a situaciones nuevas; precisión y registro                   | Comunicarse con autonomía fuera del diálogo ensayado; adaptar una explicación al público                              |
| Cerca del dominio              | 1650–<1800   | Consolidación transversal; paráfrasis, organización del discurso y reparación                      | Mantener coherencia al cambiar de tema, responder a imprevistos y reformular sin perder el significado                |
| Fluidez refinada               | 1800–<2000   | Mayor precisión léxica y pragmática; intención, cortesía y matices                                 | Ajustar el tono y el registro, distinguir formulaciones cercanas y sostener argumentos con naturalidad                |
| Dominando el idioma            | 2000         | Consolidación amplia con evidencia sostenida; no una lista artificial adicional                    | Mostrar transferencia consistente entre contextos y habilidades; nombre interno de HanGo, nunca certificación oficial |

La tabla es un diseño propio, no una reproducción ni equivalencia de niveles
ACTFL/CEFR. La orientación hacia tareas con propósito y autonomía está en
línea con el [enfoque orientado a la acción del Consejo de Europa](https://www.coe.int/en/web/common-european-framework-reference-languages/action-orientation-in-the-classroom).
Separar una frase ensayada de un desempeño espontáneo responde al enfoque
comunicativo descrito en los [recursos de ACTFL](https://www.actfl.org/educator-resources).
Ninguna de esas fuentes establece los cortes o conteos propios de HanGo.

### Anclajes reales de la propuesta, no vocabulario inventado

| Tramo de la simulación | Lección real de ejemplo                                  | Algunos objetivos léxicos reales                                              | Estructuras reales de ejemplo                                                  |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0                      | `foundations-greetings-and-introductions`                | 你好、叫、名字、高兴、认识                                                    | `Subject + 叫 + Name`; `Statement + 吗？`; `Noun/Pronoun + 呢？`               |
| 1                      | `phone-leaving-a-message`                                | 经理、不好意思、回来、留言、回电话                                            | `什么时候 + Verb Phrase？`; `请 + Person + Verb Phrase`                        |
| 2                      | `getting-around-asking-for-directions`                   | 打扰、邮局、路口、红绿灯、拐                                                  | `从 + Place + 走`; `第 + Number + Measure word + Noun`                         |
| 3                      | `post-office-tracking-a-package`                         | 查、快递单号、运输、途中、预计                                                | `在 + noun + 途中`; `预计 + time + verb phrase`                                |
| 4                      | `job-interview-basics-discussing-salary-expectations`    | 薪资、期望、税前、行业、平均水平                                              | `根据 + basis，statement`; `如果 + condition，我可以考虑`                      |
| 5                      | `media-interview-expert-simplifying-a-technical-concept` | 通俗、算法、原理、想象、分拣员                                                | `可以把它想象成 + everyday thing`; `换句话说，就是 + restatement + 的意思吗？` |
| 6–9                    | Transferencia del repertorio previo mediante Labs        | Selección contextual del inventario anterior; no nuevos listados certificados | Reutilización con más autonomía, precisión, intención y variedad               |

No se debe exigir toda la lista de un tramo en una sola conversación.
La asignación nominal puede cortar un escenario por la mitad. Antes de
convertirla en currículo normativo se revisarán progresión, carga,
requisitos gramaticales y utilidad de cada objetivo; un corte por puntos
no sustituye esa revisión.

## 5. Cómo acompañaría cada lección

La ficha offline ya tiene objetivo, escena, banco de vocabulario y gramática,
pinyin, frases del diálogo, primeras apariciones y candidatos a repaso.
La próxima integración usaría tres bancos separados:

1. **Núcleo actual:** objetivos publicados de la lección. Distribuir las
   oportunidades entre las actividades, no forzar todos en un solo Speaking.
2. **Apoyo contextual:** formas funcionales presentes en los diálogos de la
   lección y objetivos relevantes con evidencia de estudio/práctica previa.
   No asumir que algo anterior por orden ya se domina. Comprobar significado.
3. **Ampliación opcional:** expresión útil seleccionada explícitamente,
   introducida con apoyo cuando el alumno la necesite. No se usa como objetivo
   obligatorio de nota si no se enseñó.

Las coincidencias literales detectadas son candidatos, no un banco de apoyo
final. Deben seleccionarse por relación con la escena, sentido y evidencia
del alumno. No enviar a la IA las 1304 formas ni todo el historial.

### Ejemplo: Saludos y presentaciones

El núcleo real es 你好 (nǐ hǎo), 叫 (jiào), 名字 (míngzi), 高兴 (gāoxìng),
认识 (rènshi), 哪 (nǎ), 国 (guó), 学生 (xuésheng), 学习 (xuéxí) y
再见 (zàijiàn). La gramática real es 叫 para nombres, 吗 en preguntas
de sí/no y 呢 en una pregunta de seguimiento.

El objetivo de la escena es saludar, intercambiar nombres y nacionalidad.
El personaje puede modelar las estructuras y responder a lo que el alumno
diga. Si el alumno se identifica como profesor, ese dato no se invalida
porque 学生 aparezca en la lista: no se vuelve a preguntar si es estudiante.
Las expresiones nuevas que aporte el alumno se aceptan sin inventar que
ya se enseñaron o convertirlas automáticamente en objetivos evaluados.

La ficha propuesta puede acompañar la preparación de la lección en ES/EN
con caracteres, pinyin y significado. No se ha añadido una pantalla,
feedback visual ni botones nuevos en esta entrega.

## 6. Evidencia: estudiado, comprendido y utilizado

Estos estados son un contrato propuesto, no nuevas columnas creadas:

| Estado                  | Evidencia necesaria                                                                        | Lo que NO basta                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Estudiado/expuesto      | Interacción o actividad real con el objetivo                                               | Tener puntos suficientes, que exista en una lección anterior o que lo pronuncie solo el personaje |
| Comprendido             | Respuesta/acción pertinente que demuestre comprensión, o ejercicio de significado correcto | Coincidencia de caracteres sin contexto; continuar la pantalla                                    |
| Utilizado con apoyo     | Producción del alumno después de una pista o modelo                                        | Atribuirlo como producción autónoma                                                               |
| Utilizado con autonomía | Uso contextual atribuible al alumno sin respuesta suministrada inmediatamente antes        | Repetir literalmente a la IA o contar el texto generado por ella                                  |
| Consolidado             | Evidencia positiva separada en el tiempo y transferida a otra situación                    | Un intento afortunado o una sola nota global                                                      |

El audio transcrito no demuestra precisión tonal. Un turno inaudible,
silencio o transcripción dudosa no genera evidencia de dominio ni error
gramatical inventado. La comprensión y la producción se registran por
separado: responder adecuadamente puede demostrar comprensión sin demostrar
que el alumno sabe producir todas las palabras de la pregunta.

La app ya guarda quizzes, ejercicios, reflexión, competencias y revisiones.
Se reutilizarán esas señales sin afirmar que ya existe un mapa completo de
dominio por objetivo. El indicador actual de escenario «mastered» usa una
heurística de competencias globales: no prueba cada palabra de ese escenario.

No hay memoria nueva para Han Tutor. El repertorio pedagógico propuesto
pertenece al contexto de Journey y se filtra por usuario en el servidor.
Companion y Speaking Lab no recibirán el historial de la conversación de
Journey. Los datos temporales de una escena y el aprendizaje individual
deben permanecer claramente separados.

## 7. Reglas propuestas para el futuro Speaking de Journey

- Apertura en el papel del personaje, según la escena; no `你好` universal.
- El núcleo da oportunidades comunicativas, no una lista de preguntas a agotar.
- Responder al último turno; conservar datos declarados durante la escena;
  no repetir una pregunta respondida ni ignorar un cambio razonable de tema.
- Empezar con el nivel lingüístico de la lección y apoyo adecuado. Los puntos
  personales son señal adicional, nunca licencia para asumir vocabulario conocido.
- Aumentar variedad cuando hay comprensión demostrada; reducir complejidad
  cuando hay confusión. No subir dificultad solo porque pasó tiempo.
- Mantener el objetivo de practicar chino; permitir pedir aclaración en ES/EN
  sin transformar la escena en una explicación interminable ni imponer chino
  cuando el alumno pidió ayuda en su idioma.
- Si hace falta corregir para entender, reformulación corta y seguir.
  Guardar los errores no impeditivos para el reporte final.
- Separar conversar de evaluar. El personaje no sabe que debe «hacer usar»
  cada objetivo para completar un checklist ni rellenar un temporizador.
- Distinguir «no observado», «no hubo oportunidad», «uso con apoyo» y «error».
  Revisar la rúbrica antes de aplicar una nota nueva: la fórmula actual todavía
  tiene un factor de cobertura que puede entrar en conflicto con esta propuesta.
- La evidencia será de ese alumno y esa escena; no atribuirle las palabras de
  la IA. No crear sesiones extra, calificaciones duplicadas ni costes ocultos.

### 7.1 Contrato aprobado: reglas comunes y ficha por lección

El usuario aprobó incorporar este contrato a la matriz el 10 de octubre
de 2026. **Aprobado y documentado no significa integrado en el Speaking real.**
Las reglas comunes tendrán una sola definición; cada ficha de lección
aportará su contenido y perfil inicial, sin copiar instrucciones contradictorias.
La captura JSON de la auditoría se conserva como inventario histórico; este
contrato complementa la matriz y no reescribe sus datos o asignaciones.

| Apartado de la ficha        | Contenido que deberá aportar                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Escena y personaje          | Contexto, roles, objetivo comunicativo y apertura adecuada a esa situación; no un saludo universal                               |
| Núcleo, apoyo y ampliación  | IDs y sentidos concretos de vocabulario/gramática, frases de referencia y evidencia requerida para reutilizar contenido anterior |
| Perfil inicial de respuesta | Longitud orientativa, complejidad, cantidad de novedades y ritmo de voz, según la lección                                        |
| Preguntas permitidas        | Preguntas breves y contestables con el repertorio disponible; no un listado obligatorio a completar                              |
| Desviaciones del tema       | Cómo seguir asuntos cercanos y ofrecer conexiones accesibles sin imponer el guion                                                |
| Adaptación individual       | Señales de comprensión/confusión y reglas para aumentar o reducir dificultad, extensión y ritmo por separado                     |
| Ayuda y corrección          | Aclaración breve ES/EN cuando se solicite y reformulación para reparar incomprensión, sin interrumpir por cada error             |
| Evidencia final             | Comprensión, uso con apoyo, producción autónoma, no observado y falta de oportunidad, separados                                  |
| Casos de aceptación         | Conversaciones esperadas y comportamientos que deben rechazarse, incluidas preguntas repetidas y saltos de dificultad            |

### 7.2 Protección de un estudiante inicial

- Normalmente una o dos frases cortas, con una idea principal. Una reacción
  breve también puede completar el turno: no añadir otra explicación por rutina.
- Como máximo una pregunta por turno y siempre opcional. No preguntar por
  obligación tras cada respuesta, ni encadenar dos peticiones en una sola pregunta.
- Priorizar patrones y palabras del núcleo y del apoyo disponible. Introducir
  como máximo una expresión nueva por turno, solo si hace falta para conversar
  o el alumno la pide. No introducir novedades en todos los turnos ni acumular
  vocabulario nuevo que el alumno aún no puede seguir.
- Evitar preguntas abstractas, hipotéticas, especializadas o que exijan varias
  razones a la vez si no hay evidencia de que el alumno pueda responderlas.
- Las restricciones son objetivos de generación y no recortes por caracteres
  o un límite universal de 45 palabras. Nunca cortar una frase a la mitad.
- Una aclaración en ES/EN debe dejar una expresión utilizable y espacio al
  alumno para continuar; no convertirse en una explicación gramatical extensa
  no solicitada. Si pide más detalle, atenderlo en fragmentos manejables.
- No elogiar, corregir o hacer una pregunta por rutina. Reaccionar de manera
  pertinente al contenido del turno, conservando la personalidad del personaje.

Estas reglas pertenecen al personaje de Journey. No restringen las
explicaciones amplias de gramática de Han Tutor ni añaden botones o feedback visual.

### 7.3 Velocidad y complejidad: progresión orientativa, no aceleración automática

En las primeras lecciones, la voz deberá ser pausada y clara, con pausas
entre ideas. No deformar los tonos del mandarín, separar artificialmente
cada sílaba ni dar una entonación infantil. Hablar más lento no autoriza a
decir una frase más complicada o un monólogo más largo.

| Perfil propuesto | Punto de partida                                     | Ritmo y carga esperados                                                                                 |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Inicial          | Primeras lecciones; perfil inicial de los tramos 0–1 | Pausado y natural; turnos breves, una idea y oportunidades claras para responder                        |
| En desarrollo    | Progresión orientativa de los tramos 2–3             | Un poco más continuo; conexiones sencillas sin encadenar muchas novedades                               |
| Autónomo         | Progresión orientativa de los tramos 4–5             | Ritmo conversacional claro; más variedad cuando el alumno sostiene la comprensión                       |
| Refinamiento     | Perfil orientativo de los tramos 6–9                 | Ritmo natural y registro acorde al personaje; matices sin aumentar velocidad como dificultad artificial |

Los tramos son referencias de diseño, no una equivalencia oficial ni prueba
de dominio. La lección marca el comienzo; el comportamiento demostrado y
las preferencias del alumno ajustan el ritmo real durante la escena.

Reglas de adaptación:

1. Aumentar gradualmente solo ante varios intercambios comprensibles y
   pertinentes; una frase avanzada aislada podría ser ensayada o copiada.
2. Si un usuario avanzado hace la primera lección, permitir un ritmo y una
   complejidad mayores cuando los demuestre o solicite; no mantenerlo
   artificialmente en nivel cero ni atribuirle de inmediato un nivel completo.
3. Cambiar de forma independiente velocidad, vocabulario, estructuras y
   extensión. Evitar aumentar todos a la vez; poder hablar rápido no equivale
   a comprender una gramática más difícil y viceversa.
4. Si pide hablar más despacio o muestra confusión, reducir el ritmo,
   simplificar la formulación y dejar espacio. Primero reutilizar lenguaje
   conocido, no agregar una larga explicación con más palabras desconocidas.
5. No acelerar solo porque cambió de lección, ganó puntos, pasó tiempo o
   repitió una frase. Las lecciones posteriores pueden empezar con un perfil
   más natural, pero siguen admitiendo apoyo y reducción de ritmo.
6. No confundir silencio con falta de dominio o un turno de voz descartado
   con respuesta incorrecta. Esperar al alumno sin completar sus palabras.

No se fijan todavía porcentajes, velocidades de reproducción ni tasas de
palabras por minuto: habría que comprobar la voz disponible y la comprensión
en una prueba real antes de elegir parámetros técnicos. No se alteran
temporizadores, audio compartido, notas ni puntos en esta entrega documental.

### 7.4 Desviación de tema y continuidad sin preguntas inventadas

Una desviación pequeña no es un error. Seguirla con lenguaje comprensible
y reutilizar estructuras de la lección cuando encajen naturalmente. No
obligar al alumno a volver al diálogo escrito ni penalizarlo automáticamente.
Si el tema requiere demasiadas novedades, responder de manera accesible y
ofrecer una conexión suave con la escena, sin convertir la charla en otra
lección completa. Si el alumno elige otro tema, no arrastrarlo a la fuerza.

No repetir información ya proporcionada, inferir hechos no declarados,
atribuir al alumno la identidad del personaje ni ignorar la última pregunta
para continuar un cuestionario. Un mensaje dudoso requiere aclarar solo
la parte dudosa, no inventar una frase completa o un significado distinto.

Ejemplo de aceptación en Saludos y presentaciones:

- Si dice que le gustan los gatos, el personaje puede reaccionar; no supone
  que tiene uno. Después de confirmar que tiene un gato, puede preguntar
  cómo se llama y practicar naturalmente `叫` y `名字`.
- No preguntar cómo afecta tener una mascota a su bienestar emocional a
  un principiante que solo está presentándose.
- Si pregunta cómo decir que al gato le gusta dormir, ofrecer
  `它喜欢睡觉。` (Tā xǐhuan shuìjiào) y una aclaración breve. Esa ampliación
  solicitada no se convierte automáticamente en contenido dominado o
  en objetivo obligatorio de nota.
- Si dice que es profesor, conservar ese dato y continuar; no insistir
  preguntando si es estudiante porque `学生` esté en el núcleo de la lección.
- Una respuesta puede ser solo una reacción pertinente. No existe obligación
  de terminar cada turno con una pregunta ni volver al tema por un contador.

### 7.5 Prioridad de reglas y separación de evaluación

Para resolver posibles contradicciones: responder al último turno y respetar
los datos declarados, mantener la comprensión y luego ofrecer oportunidades
del núcleo cuando encajen. La cobertura nunca justifica ignorar al alumno,
repetir preguntas o subir la dificultad fuera de su alcance.

El objetivo conversacional y las listas orientan al personaje; el evaluador
analiza después la evidencia. Lo que pronunció únicamente la IA no acredita
producción del alumno. Falta de oportunidad, contenido no observado, ayuda
y error son estados distintos. No modificar la rúbrica o las notas existentes
hasta completar CUR-05 y sus pruebas.

### 7.6 Casos obligatorios antes de integrar y dar por aceptado el contrato

- Principiante con respuestas cortas: voz pausada, turnos breves y preguntas
  contestables; sin monólogos o temas abstractos añadidos por el personaje.
- Principiante que se desvía hacia un tema cercano: continuidad, lenguaje
  accesible y aprovechamiento natural de estructuras sin retorno forzado.
- Petición de ayuda en español o inglés: aclaración en el idioma solicitado,
  expresión breve para continuar y sin cambiar involuntariamente toda la escena.
- Usuario avanzado en la primera lección: adaptación gradual y pertinente;
  no repetir preguntas resueltas ni aumentar nivel por una sola frase.
- Identidad/ocupación declarada: no confundir alumno y personaje, ni volver
  a solicitar los mismos datos tras una respuesta clara.
- Petición de hablar más despacio a mitad de una escena: ajustar el ritmo
  y la carga, no repetir mecánicamente toda la conversación ni añadir novedades.
- Turno largo o difícil aislado, silencio o transcripción dudosa: sin salto
  de nivel, hechos inventados o evaluación de tonos basada solo en texto.
- Prueba de voz real además de pruebas automatizadas: confirmar ritmo,
  naturalidad, longitud y comprensión. Los mocks no certifican ese resultado.

### 7.7 Condiciones adicionales para que la conversación produzca aprendizaje

Aprobadas por el usuario junto con la reducción de tiempos. Las reglas de
ayuda y conversación están integradas en el contrato local y los bancos;
su aceptación oral sigue pendiente. El feedback y la rúbrica final todavía
requieren CUR-05:

- **Ayuda progresiva:** reformular con palabras conocidas; si no basta,
  ofrecer una pista; dar una frase modelo solo cuando siga siendo necesaria
  o el alumno la solicite. No resolver todas las intervenciones por él.
- **Uso después de la ayuda:** dejar espacio para que emplee la expresión
  recién aclarada. No exigir una repetición ni convertir Journey en un
  ejercicio de pronunciación después de cada explicación.
- **Reciclaje significativo:** reutilizar una estructura en otro contexto
  pertinente, no repetir la misma pregunta. No hace falta recorrer cada
  objetivo para agotar el tiempo.
- **Respuestas acordes al nivel:** aceptar palabras o frases incompletas
  comprensibles de un principiante, sin atribuirles mayor precisión que la
  observada. Si no está claro el mensaje, pedir aclaración puntual.
- **Feedback final acotado:** aprovechar la Reflexión existente para un logro
  específico y una mejora prioritaria con ejemplo, sin una lista abrumadora
  de errores o nuevos paneles. Ajustar el reporte exige CUR-05; no se modifican
  sus cálculos o resultados históricos en esta entrega.
- **Separar aprendizaje y problemas técnicos:** silencio, audio dudoso,
  desconexión o cierre por límite no son errores de chino ni evidencia de
  dominio. Conservar lo válido y no presentar un fallo como escena completada
  satisfactoriamente.

### 7.8 Duraciones aprobadas: reducir 45 segundos en cada ventana de Journey

La selección sigue usando la referencia interna de dificultad de la
**lección**, no directamente los diez niveles personales ni el número de
turnos. Un usuario avanzado en la primera lección puede adaptar ritmo y
complejidad sin alargar automáticamente la sesión.

| Grupo de lección / referencia interna | Ventana anterior | Ventana aplicada localmente | Ventana más reserva de cierre de 12 s |
| ------------------------------------- | ---------------- | --------------------------- | ------------------------------------- |
| Más iniciales / ≤1                    | 2:00 (120 s)     | 1:15 (75 s)                 | 1:27 (87 s)                           |
| Siguiente grupo / 2                   | 2:40 (160 s)     | 1:55 (115 s)                | 2:07 (127 s)                          |
| Intermedias / 3–4                     | 4:00 (240 s)     | 3:15 (195 s)                | 3:27 (207 s)                          |
| Más avanzadas / ≥5                    | 5:00 (300 s)     | 4:15 (255 s)                | 4:27 (267 s)                          |

Fuente de la implementación: `src/lib/speaking-session-timing.ts`. La referencia
nula sigue correspondiendo al grupo intermedio según el fallback actual.
**Reducción aplicada localmente.** Speaking Lab comparte el helper, pero pasa
su propia superficie para conservar 120/160/240/300 s; Tutor, Companion y
Placement no adoptan estos tiempos. No publicado en GitHub/Vercel.

Estas son ventanas de sesión: incluyen hablar, escuchar y pensar, no solo
tiempo de producción del alumno. No se exige una cantidad fija de palabras
o preguntas para llenarlas. La reserva de 12 segundos se mantiene separada;
es un margen acotado de cierre, no otros 12 segundos de temas nuevos ni una
garantía de que cualquier intervención larga pueda terminar sin corte.
La evaluación posterior se trata aparte y no prolonga la conversación oral.

### 7.9 Fase de cierre natural, explícita y acotada

Contrato de cierre integrado localmente; aceptación de voz real pendiente:

1. **Práctica:** conversación accesible y pertinente; no rellenar el reloj
   con objetivos pendientes o preguntas innecesarias.
2. **Preparación de cierre:** en los últimos 15–20 segundos orientativos de
   la ventana aprobada, dejar de introducir temas, vocabulario o preguntas
   nuevos. Resolver el intercambio actual sin ignorar una duda pendiente.
   Este tramo está dentro de la ventana, no se suma a ella. Para 75 segundos,
   comenzaría aproximadamente entre los segundos 55 y 60.
3. **Despedida:** una frase o dos muy breves, comprensibles y acordes al
   personaje y lo sucedido. Sin una pregunta final, corrección, nota o
   explicación de que «se acabó el tiempo». No confirmar un acuerdo, pedido
   o logro que no esté realmente establecido.
4. **Fin técnico:** esperar la reproducción efectiva de la despedida dentro
   del margen disponible; detener captura y reproducción, liberar micrófono
   y conexión, conservar el intercambio válido y continuar al flujo propio
   de Journey. No abrir Han Tutor, Companion ni una interfaz antigua.

Ejemplo para presentaciones: `很高兴认识你。再见！`
(Hěn gāoxìng rènshi nǐ. Zàijiàn! — Encantado de conocerte. ¡Adiós!).
Es un ejemplo contextual, no una despedida universal ni una frase obligatoria.

Reglas de frontera:

- Si está manteniendo presionado y hablando al llegar al cierre previsto,
  permitir terminar el turno y responder brevemente dentro del margen
  disponible. No desactivar inmediatamente el micrófono por llegar al umbral
  de práctica. El límite de seguridad sigue siendo finito: no prometer
  extensiones indefinidas o inmunidad a cortes por fallo o agotamiento del margen.
- Si la IA ya está respondiendo, no superponerle otra despedida. Coordinar
  generación y reproducción; si quedan pocos segundos, no abrir otra pregunta.
- Una intención clara del alumno de terminar antes debe respetarse; una
  cita o práctica de `再见` no demuestra por sí sola que quiera finalizar.
- Pulsar **End** detiene la sesión sin obligarle a escuchar una despedida.
  Conservar evidencia parcial sin inventar cobertura, nota o éxito.
- No terminar al primer objetivo cumplido mientras el alumno quiera seguir
  practicando; tampoco obligarlo a seguir porque falten objetivos o segundos.
- Desconexión y límite de seguridad son motivos técnicos, distintos del cierre
  natural. No anunciar «todo completado» o fabricar una despedida del personaje.

### 7.10 Conflictos del código actual y pruebas adicionales

El contrato exige **reemplazar**, no acumular, instrucciones de rellenar el
temporizador buscando vocabulario/gramática pendientes. Para Journey se
reemplazaron en `src/lib/ai-context.ts` y `src/lib/han-realtime.ts` por el
contrato compartido de `src/lib/journey-speaking-policy.ts`. Otras superficies
conservan sus reglas. También se excluye la plantilla genérica de Practice
de seis secciones y se permite una ayuda ES/EN mínima cuando es necesaria;
Journey transcribe esos idiomas sin cambiar la inmersión por defecto.

En Journey, `han-voice-conversation.tsx` espera un turno ya presionado o
confirmado pendiente de transcripción, y la reproducción del personaje, antes
de pedir una única despedida contextual. El turno final puede responder una
pregunta pendiente y no presume objetivos cumplidos. La preparación se evalúa
por tiempo de reloj en cada respuesta durante los últimos 20 s. End corta
audio/captura sin pedir despedida o revisión adicional. El máximo dispone de
timeout, chequeo periódico de 500 ms y comprobación al volver a la pestaña;
también limita la revisión de evidencia si estaba pendiente. Son controles
del cliente, no un límite financiero del servidor ni una garantía al milisegundo
en una pestaña suspendida. La prueba de micrófono y modelo reales sigue pendiente.

Añadir a las pruebas de CUR-04:

- Verificar los cuatro tiempos nuevos, fallback nulo y reserva independiente.
- No iniciar una pregunta nueva durante la preparación/despedida.
- Alumno hablando, IA reproduciendo audio y pregunta pendiente al cruzar el
  umbral: sin silenciamiento prematuro normal, audio superpuesto o cierre doble;
  límite de seguridad acotado en todos los casos.
- End, intención verbal de terminar, práctica de la palabra `再见`, desconexión,
  pestaña suspendida y falta de audio: motivos diferenciados y recursos liberados.
- Despedida apropiada al contexto, sin afirmaciones falsas de éxito, acuerdos
  o pedidos, y sin navegación o historial compartidos con otras experiencias.
- La menor duración no justifica hablar más rápido, comprimir el contenido o
  penalizar automáticamente por no usar todas las palabras. Revisar la rúbrica
  con los tiempos nuevos antes de afirmar aceptación pedagógica completa.

Verificación local de esta integración: 281 pruebas en 12 suites, typecheck,
lint dirigido y revisión de whitespace pasan. Se incluyen aislamiento de
superficies, ayuda ES/EN, turnos pendientes, cancelación fuera de orden, End,
playback, silencio, límite/revisión de evidencia y despertar de pestaña.
Son pruebas simuladas, sin llamadas pagadas ni validación acústica real.
El manejo de generación frente a reproducción se revisó con **OpenAI Docs**:
[Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations).
No se cambió el modelo, no se crearon migraciones y no se publicó esta entrega.

## 8. Hallazgos que impiden afirmar que el mapa está certificado

### 8.1 Presupuestos de capítulos no cuadran exactamente con su agrupación

La fórmula actual usa el capítulo del escenario para asignar su presupuesto,
pero suma el denominador por la dificultad de cada lección. En escenarios
mixtos los dos criterios difieren. El caso está reconocido en los comentarios
de `src/lib/curriculum-weights.ts`; se comprobó con el currículo actual:

| Capítulo              | Presupuesto declarado | Proyección curricular a 100% |
| --------------------- | --------------------: | ---------------------------: |
| Fundamentos           |                   350 |                     374.1379 |
| Vida cotidiana        |                   550 |                     555.7895 |
| Situaciones avanzadas |                   600 |                     582.7338 |
| Total                 |                  1500 |                    1512.6612 |

Las lecciones mixtas son dos de `getting-around` y dos de `health`.
La simulación mantiene las cifras reales y acumula los puntos de forma
continua; no reinicia artificialmente un capítulo en 350 o 900.
No se recalcularon puntos de ningún alumno. Cambiar esta fórmula necesita
su propia decisión, pruebas de compatibilidad y revisión de puntos existentes.
No bloquea preparar bancos por lección, pero sí tratar los cortes como
fronteras académicas exactas.

### 8.2 Los últimos niveles no tienen listas propias verificadas

En la ruta simulada, las lecciones se asignan a los tramos 0–5; los tramos
6–9 no reciben lecciones nuevas. Los últimos nombres describen refinamiento
mediante Labs, no cuatro paquetes adicionales de palabras ya implementados.
Faltan tareas y criterios explícitos de transferencia para esos tramos.

### 8.3 El máximo de 2000 no tiene un camino completo implementado

El código reserva 150 puntos de Reading Lab que todavía no son ganables.
La constante de máximo actual declara 1850. La desviación curricular anterior
significa que tampoco debe presentarse esa constante como un máximo real
reconciliado sin una auditoría de puntuación aparte. No se promete acceso al
tramo de 2000 con las funciones existentes ni se propone inflar puntos.

### 8.4 Coincidencia literal no equivale a progresión académica revisada

La auditoría detecta reapariciones, no la equivalencia de todas las variantes
gramaticales ni el reciclaje dentro de ejemplos. Hay que revisar manualmente
familias de gramática, prerrequisitos, carga de novedades y claridad de las
traducciones antes de afirmar cobertura completa o asignaciones definitivas.
Las etiquetas HSK se auditan aquí como metadata interna, no contra un listado
oficial externo. No se promete cobertura oficial de un nivel.

## 9. Plan por entregas y condiciones de aceptación

| ID     | Entrega                                                                                               | Estado                                                      | Criterio para cerrarla                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| CUR-01 | Inventario comprobable por lección, repeticiones y matriz provisional de diez tramos                  | Hecho local                                                 | 41 escenarios/164 lecciones; conteos reconciliados; IDs y frases reales; sin escrituras a la base ni IA                                |
| CUR-02 | Revisar cortes, familias gramaticales y prerrequisitos; elegir núcleo/apoyo/ampliación de Fundamentos | Selecciones de Fundamentos 60/60 locales; cortes pendientes | Bancos y familias sugeridas revisados; no certifica cortes por puntos ni equivalencia oficial; aceptación oral pendiente               |
| CUR-03 | Integrar banco de Journey filtrado por evidencia del alumno                                           | 164/164 bancos locales por pasos                            | Consulta actual + candidatas; contexto acotado y aislamiento comprobados; exposición no es dominio; aceptación oral pendiente          |
| CUR-04 | Separar diálogo natural y evaluación; adaptar dificultades y aplicar tiempos/cierre                   | Parcial local: contrato, tiempos y cierre                   | Comprobar adaptación y ritmo con voz real además de mocks; rúbrica pendiente; no declarar todo 7.1–7.10 certificado                    |
| CUR-05 | Ajustar evidencia y rúbrica antes de certificar objetivos                                             | EV-01/02 + backend EV-03 preparados, sin activar            | Conectar captura real, informe ES/EN, puntuación/recompensas y calibración; reset de cuentas/puntos autorizado como operación aparte   |
| CUR-06 | Revisión pedagógica de Vida cotidiana y Situaciones avanzadas                                         | Bancos 60/60 + 44/44 locales; validación pendiente          | Selecciones por escena y familias sugeridas; aceptación oral y revisión especializada del contenido pendientes; no certifica currículo |
| CUR-07 | Definir tareas de refinamiento 6–9 y resolver límites de puntuación                                   | Pendiente, decisión aparte                                  | Sin equivalencia oficial; camino de puntos verificable; no dar 2000 hasta que exista evidencia y funcionalidad necesarias              |

El primer lote autorizado de CUR-02/03 ya cubre Saludos y presentaciones,
Números/hora/fechas y las cuatro lecciones de Compras básicas. Ver
[selección, familias y reglas de evidencia](BANCOS_SPEAKING_JOURNEY_PILOTO.md).
Conserva los 60 registros de vocabulario y 18 de gramática entre bancos; los
IDs, significados y pinyin se resuelven desde contenido publicado. Se prueban
seis aperturas en personaje, sin el mismo saludo genérico para todas.

La exposición se obtiene de pasos reales completados por el usuario autenticado,
no de puntos, orden o disponibilidad. No es dominio individual ni evidencia por
versión de cada palabra. El apoyo previo se limita a material relacionado de
este piloto; no se carga todo el currículo ni se usan memorias de Han Tutor.
El servidor descarta bancos del navegador; el banco resuelto llega a sesión,
turno y cierre. Las consultas no escriben progreso ni requieren migración.

Verificación del piloto: 308 pruebas focalizadas en 13 suites y tres pruebas de
integración en Postgres local desechable, sin API real ni escrituras a las bases
de desarrollo o producción.

Ampliación autorizada posterior: **Fundamentos 60/60** (54 lecciones adicionales),
con 600 registros léxicos y 180 gramaticales preservados. Ver
[fichas, familias y alcance vigente](BANCOS_SPEAKING_JOURNEY_FUNDAMENTOS.md).
Las selecciones del piloto se conservan. El servidor consulta solo la lección
actual y hasta ocho candidatas; el contrato compartido de voz no importa el
catálogo editorial completo. Exposición y memoria de Han siguen separadas.
Se mantienen dificultades mixtas y bloqueos actuales, sin tocar notas o puntos.

Verificación al cierre de Fundamentos: 434 pruebas focalizadas en 14 suites, tipos y lint dirigido
pasan; tres integraciones reales verifican las 60 fichas en Postgres desechable,
aislamiento por usuario y ausencia de cambios de progreso. No se publicaron
cambios ni se llamó a la API pagada. La aceptación oral, CUR-05 y las 104
lecciones de los otros capítulos siguen pendientes; esto no completa toda la
matriz ni certifica la obediencia del modelo.

Ampliación posterior autorizada: **Vida cotidiana 60/60**, con 552 registros
léxicos y 168 gramaticales preservados; total integrado **120/164 lecciones**.
Ver [selecciones y límites](BANCOS_SPEAKING_JOURNEY_VIDA_COTIDIANA.md).
Conserva las selecciones de Fundamentos y las dos lecciones de salud con
dificultad avanzada dentro del capítulo cotidiano. No cambia accesos o puntos.
Las simulaciones explicitan no inventar tratamientos, cifras incompatibles,
despachos, reservas, acuerdos o reembolsos reales; los problemas del contenido
fuente detectados quedan documentados, no corregidos ni certificados aquí.

Al cierre de Vida cotidiana quedaban 44 lecciones de Situaciones avanzadas, CUR-04 oral/adaptación verificable,
CUR-05 evaluación y CUR-07 puntuación/refinamiento. No se modifican resultados
históricos. La cobertura de bancos por lección no completa esos entregables.

Resultado al cierre de Vida cotidiana: **558 pruebas focalizadas en 15 suites y cuatro integraciones
en Postgres desechable** pasan, además de tipos y lint dirigido. Se verifican
las 120 fichas, cada ID de contenido publicado y el aislamiento por cuenta/paso,
sin cambios de progreso. La base desechable fue retirada; no hubo API pagada,
migraciones nuevas, escrituras en bases persistentes, commit o publicación.

Ampliación autorizada del **11 de octubre de 2026: Situaciones avanzadas 44/44**,
11 escenarios, 440 registros léxicos y 132 gramaticales preservados. Total de
bancos: **164/164**, con 1592 registros léxicos y 480 gramaticales. Versionado
`advanced-2026-10-11-v4`. Ver
[fichas y límites](BANCOS_SPEAKING_JOURNEY_SITUACIONES_AVANZADAS.md).
Se mantienen las 120 selecciones anteriores, metadata, accesos, tiempos,
rúbrica, notas, puntos, modelos, tarifas y productos independientes. Reciclaje
solo por pasos propios; la etiqueta avanzada no impone discursos extensos.

Aperturas desde el personaje correcto, sin inventar testimonios, historia,
consenso o compromisos de ausentes. Consulta médica explícitamente ficticia,
sin atención clínica; notaría, contrato y panel financiero son práctica de
idioma, no asesoría real. Las orientaciones no convierten cifras, condiciones,
referencias o garantías del diálogo fuente en hechos verificados. Se documentan
los riesgos del material publicado, sin reescribirlo ni certificarlo.

Verificación vigente: **651 pruebas focalizadas en 16 suites y cinco
integraciones reales en Postgres desechable** pasan; tipos, lint y formato
dirigidos pasan. Se resuelven las 164 fichas publicadas, cada ID actual y
exposición por cuenta/paso, sin crear o modificar progreso. Base temporal
retirada; sin API pagada, migraciones nuevas, bases persistentes o publicación.

Siguiente entrega: **CUR-05 rúbrica y feedback final por evidencia**. Siguen
pendientes CUR-04 voz/adaptación real, cortes de CUR-02, revisión lingüística
y especializada del material fuente, CUR-07 puntos/refinamiento. No se
recalcularon resultados históricos ni se declara la matriz 100 % terminada.

Actualización posterior del 11 de octubre: el usuario autoriza la reestructuración
completa por partes y reinicio de cuentas/puntajes en **local y producción**,
conservando al administrador. Ver
[plan y estado de implementación](REESTRUCTURACION_EVALUACION_FINAL_JOURNEY.md).
Base EV-01/02 preparada: intentos independientes, captura sellada y contrato de
evidencia/nota sin multiplicadores. Todavía no activada en voz/Reflection;
evaluación conjunta backend preparada; captura real, informe ES/EN y recompensas
pendientes. Migración probada
solo en Postgres desechable. No se borraron datos ni se modificó producción;
respaldo y administrador de ambas bases se verifican antes del reinicio.

EV-03 posterior: evaluador estructurado único, captura autenticada/cableada y
caché/reclamación concurrente preparados; consumo enlazado al informe y
experiencia de reflexión existente.
Sin reintentos automáticos en fallos ni notas inventadas; respuesta tardía no
reemplaza resultado vencido. Original STT separado de interpretación; captura
incompleta/incierta impide nota completa. 813 pruebas y 46 integraciones en base
desechable pasan. Modalidad de captura/evaluación no activada todavía; no se
infiere calibración semántica/acústica
ni se cambia vocabulario/gramática por nivel, notas, recompensas o producción.

EV-04A posterior: fotografía de ejercicios por recorrido, asociación validada
del intento elegido en Speaking y agregación global preparados. Faltantes y
respuestas sin evaluar no son errores; pesos 20/20/30/30 conservados, nota global
y estrellas nulas si falta evidencia esencial. Informe breve ES/EN con pinyin
preparado, caché y citas verificados, sin otra llamada al leer ni traducción
pagada. 837 pruebas y 63 integraciones temporales, tipos/lint/build pasan.
**No activado ni montado**; liquidación/persistencia de recompensas, guardado
de ejercicios anterior a voz, caso sin micrófono y aceptación real pendientes.
No se han reiniciado usuarios ni publicado los cambios.

EV-04B posterior: proyección versionada de la nota v2 para los lectores existentes
de General Level, con transacción conjunta de monedas de lección, evidencia y
logros de nota/nivel. No cambia fórmula ni pesos; visitas/concurrencia/redo no
acumulan puntos o HanCoins. Pendientes/parciales no completan escenario ni
premian; lectores antiguos no regeneran v2. Acciones autenticadas separan lectura,
evaluación y reintento de guardado sin otra llamada. 155 pruebas y 103 integraciones
temporales pasan, tipos/lint/formato/build y login local ES/EN HTTP 200.
**Todavía no montado ni activado**; faltan
guardado previo a voz, caso sin micrófono, integración UI/cierre y verificación de
migraciones antes de activar. Sin API pagada, datos reales borrados o publicación.

EV-04C posterior: informe/acciones montados condicionalmente para recorridos v2;
lectura sin IA/audio automático y guardado sin evaluación repetida. Barrera de
ejercicios previa a voz, sin micrófono con resultado parcial, redo confirmado y
guardas de finalización en servidor: solo informe elegible/SETTLED completa la
lección. General Level conserva fórmula/pesos y muestra aporte verificado, no
bono por visita. 193 pruebas y 91 integraciones temporales, tipos/lint/formato/build
pasan. **Activación de lecciones nuevas sigue pendiente** de destinos/migraciones
y disponibilidad real de ejercicios; también aceptación visual/oral/calibración
y reinicio con respaldo. Ningún borrado persistente, API pagada o publicación.

EV-04D posterior: restricciones de nivel y gramática se conservan junto a los
bancos, no son reemplazadas; ancla temática flexible y ayuda ES/EN al no entender,
también tras pregunta china/al cierre. Informe compacto y ruta local preparada
con aviso explícito para resultados antiguos y redo confirmado. 251 pruebas y
91 integraciones temporales, tipos/lint/build pasan. Preflight real de primera
lección HSK 1 confirma ejercicios existentes; no se fabricó contenido. Activación
pendiente: destino de localhost es Prisma en nube y no se confirmó separación de
Vercel; migración bloqueada por revisión de seguridad. Flag apagado, sin cambios
persistentes, borrados, API pagada ni publicación; no certificar aún voz real.

## 10. Verificación y reproducción

La herramienta `scripts/audit-curriculum-progression.ts` consulta únicamente
contenido. No importa módulos de generación de IA ni accede a tablas de
usuarios. La conexión fuerza transacciones de solo lectura. El directorio
de salida debe ser nuevo y estar dentro de `project/`; no sobreescribe trabajo.

```powershell
node node_modules/tsx/dist/cli.mjs scripts/audit-curriculum-progression.ts
node node_modules/tsx/dist/cli.mjs scripts/audit-curriculum-progression.ts --output-dir project/curriculum-audit-nuevo
```

Las pruebas cubren los diez umbrales, deduplicación sin borrar significados,
orden estable, presupuestos, escenarios mixtos, contenido no publicado,
carencias estructurales, documentación/pinyin y ausencia de inferencia de dominio.
La auditoría no inicia conversaciones ni reproduce audios. La aceptación del
comportamiento real de Speaking sigue pendiente de la siguiente entrega.

Verificación final: 101 pruebas pasan en cuatro archivos (auditoría,
puntos, Journey y escenas), además de typecheck y lint focalizado. Las 164
lecciones aparecen una sola vez en la asignación; las 164 fichas del informe,
1592 vínculos léxicos, 480 vínculos gramaticales y 1646 frases cuadran con
el JSON. Se siguió la skill local `prisma-client-api` para consultas,
selecciones y relaciones de solo lectura; no se usó el cliente de la app
para generar evidencia individual o escribir datos.
