# Bancos de Speaking de Journey: primer lote

Estado: implementación local; no publicado. Versión `pilot-2026-10-10-v1`.
Alcance: seis lecciones, no las 164 ni toda la matriz.

Nota de continuidad: este documento conserva la evidencia del primer lote.
La implementación vigente ya amplía estas seis selecciones a las 60 lecciones
de Fundamentos con versión `foundations-2026-10-10-v2`; ver
[alcance y fichas actuales](BANCOS_SPEAKING_JOURNEY_FUNDAMENTOS.md).
La consulta vigente carga la lección actual y hasta ocho candidatas, no el
capítulo completo. Los pendientes históricos de este documento no sustituyen
el estado actualizado de TASKS y de la matriz.

## 1. Qué cambia y qué no

El personaje dispone de tres bancos internos, sin nuevos botones o paneles:

- **Núcleo:** palabras/patrones que ayudan a resolver la situación. Son
  prioridades comunicativas, no una cuota, guion ni lista de preguntas.
- **Apoyo:** resto del contenido útil de esta lección y una selección acotada
  de contenido relacionado de este piloto con pasos completados por el alumno.
- **Ampliación:** material opcional o un pequeño desvío relacionado. Se activa
  por petición, iniciativa temática del alumno o varios intercambios adecuados;
  no por puntos, tiempo transcurrido o una frase avanzada aislada.

Se mantienen tiempos y cierre aprobados. No se cambian las notas, denominadores
de cobertura, resultados históricos ni límites de IA. No hay nueva memoria de
Han Tutor, cambios de Companion/Lab/Placement ni migración de base de datos.

## 2. Selección revisada por lección

Selecciones exactas del inventario existente; la aplicación resuelve sus IDs,
significados y pinyin desde los registros publicados, no desde una copia de
los datos de usuarios ni un texto proporcionado por el navegador.

| Lección                       | Vocabulario núcleo               | Gramática núcleo                                                 | Apoyo actual                                       | Ampliación opcional                                                          |
| ----------------------------- | -------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Saludos y presentaciones      | 你好, 叫, 名字, 认识, 哪, 国     | `Subject + 叫 + Name`; `Noun/Pronoun + 呢？`                     | 高兴, 学生, 学习, 再见; `Statement + 吗？`         | 喝/咖啡 desde Números: solo si surge ese tema, sin iniciar una lección nueva |
| Números, hora y fechas        | 现在, 点, 今天, 明天, 号, 想     | `Subject + Time word + Verb Phrase`; `几 + Measure word (点/号)` | 忙, 喝, 咖啡, 早上; `Subject + 想 + Verb Phrase`   | No hace falta material adicional por defecto                                 |
| Colores y artículos sencillos | 买, 件, 颜色, 蓝色, 红色, 试     | `Number + 件 + Clothing item`; `有没有 + Adjective/Color + 的？` | 试衣间, 慢慢, 不错; `Verb + Verb`                  | 流行; 合适/中号 desde Tallas si son pertinentes                              |
| Tallas y preferencias         | 衣服, 小, 大, 中号, 合适, 大小   | `Adjective + 一点儿`                                             | 穿着, 适合, 款式, 明白                             | `Verb + 着`; `比较 + Adjective`; 多少钱 si el alumno pregunta por precio     |
| Preguntar el precio           | 多少钱, 块, 贵, 便宜, 付钱       | `Item + 多少钱？`; `能 + Verb Phrase + 吗？`                     | 现金, 刷卡, 袋子, 给; `Option A + 还是 + Option B` | 惠顾: expresión formal del dependiente, nunca producción exigida al alumno   |
| Devolver un artículo          | 退, 问题, 尺寸, 收据, 退款, 换货 | `Subject + 想 + Verb Phrase`; `大/小 + Number + 号`              | 号, 新, 换, 帮助; `Option A + 还是 + Option B`     | No hace falta una nueva negociación por defecto                              |

Los 60 registros de vocabulario y 18 de gramática actuales siguen representados
entre los tres bancos. No se elimina contenido de las lecciones o del reporte.
Las ampliaciones entre lecciones añaden solamente registros publicados y
conservan la etiqueta real de exposición, incluso cuando no fue observada.

### Familias y prerrequisitos pedagógicos del lote

- **Nombres/intercambio:** 叫 permite presentarse; 呢 retoma solo un dato aún
  desconocido. 吗 apoya preguntas simples, sin repetir la ocupación ya declarada.
- **Tiempo/cantidad:** tiempo antes del verbo y 几 para cantidades pequeñas.
  El diálogo aporta números/mes/día de semana: solo se etiqueta como expuesto
  cuando se registró su paso, sin asumir dominio de todos los números.
- **Deseo:** `Subject + 想 + Verb Phrase` aparece en Números y Devoluciones.
  Es un candidato de repaso funcional; se conservan ambos registros y contextos.
- **Selección:** 件/colores y 有没有 sirven para elegir. Antes de ampliar a
  talla/precio, conviene resolver la elección básica; no es un bloqueo nuevo.
- **Ajuste/preferencia:** 大/小 y 一点儿 antes de complicar con 着/比较.
  Estos últimos están en el currículo, pero no se fuerzan en el principiante.
- **Precio/alternativas:** 多少钱 y 能...吗 antes de añadir una forma de pago;
  还是 reaparece en devoluciones, ahora entre soluciones, no entre medios de pago.
- **Polisemia:** 号 de día del mes y 号 de talla no son el mismo significado.
  Una exposición anterior a la primera acepción no demuestra conocimiento de la
  segunda. No se deduplican por caracteres ni por una estructura literal común.

Son prerrequisitos recomendados para andamiaje, no nuevas reglas de acceso o
certificación HSK. La revisión del resto del currículo continúa pendiente.

## 3. Evidencia y privacidad

La consulta usa exclusivamente `session.user.id`, el ID actual de la lección
y seis lecciones publicadas. Lee `LearnerLessonProgress.completedStepIds` y
los relaciona con pasos reales de la misma lección:

| Registro                                | Interpretación permitida                                | Interpretación prohibida                                                |
| --------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Paso VOCABULARY completado              | Evidencia indirecta de exposición al contenido del paso | Palabra dominada, uso autónomo o pronunciación correcta                 |
| Paso GRAMMAR completado                 | Evidencia indirecta de exposición a sus estructuras     | Todas las estructuras comprendidas o consolidadas                       |
| Paso DIALOGUE completado                | Frases de referencia disponibles para recombinar        | Copiar el guion o atribuir al alumno el nombre/posesiones del personaje |
| Paso ajeno/no completado o sin progreso | Exposición no observada                                 | Inferir conocimiento por puntos, orden, desbloqueo o otra cuenta        |

El almacenamiento actual no identifica qué versión exacta de cada palabra vio
el usuario ni documenta dominio individual. No se inventa esa información. Si
cambia el contenido, hay que revisar el lote; no se presenta esta exposición a
nivel de paso como evidencia semántica o acústica de cada registro actual.

No hay caché global de bancos por lección que pueda mezclar usuarios. El
navegador no puede declarar conocimiento: cualquier banco entrante se descarta.
El servidor entrega solo su resolución; la sesión cliente la conserva en una
referencia propia, independiente de las re-renderizaciones del panel de Han.
Al terminar se descarta; no se añade a la memoria de Tutor o Companion.

Límites: seis lecciones candidatas; hasta 20 palabras/8 estructuras consultadas
por lección, 16 entradas de apoyo léxico, 6 de apoyo gramatical, 4 ampliaciones
léxicas y 12 frases actuales expuestas. Los seis contenidos auditados tienen
10 palabras y 3 estructuras cada uno. No se carga todo el currículo en cada turno.

## 4. Aperturas y conversación

| Lección      | Apertura del personaje |
| ------------ | ---------------------- |
| Saludos      | 你好。                 |
| Números/hora | 现在几点？             |
| Colores      | 你喜欢什么颜色？       |
| Tallas       | 大小合适吗？           |
| Precio       | 欢迎光临。             |
| Devoluciones | 请问是什么问题？       |

Son elecciones editoriales en personaje, no declaraciones de que el alumno ya
conoce esas frases ni nuevos objetivos evaluados. No usan 我们开始吧 ni imponen
el mismo saludo en todas las situaciones. La referencia curricular no obliga
a reproducir una secuencia. La petición de ayuda ES/EN sigue siendo una excepción
breve antes de volver a la escena, no una plantilla de seis secciones.

La misma representación de bancos alimenta sesión, cada turno y despedida.
Los últimos 20 segundos y el cierre prohíben material nuevo, incluso cuando
la ampliación disponible contiene palabras aún no usadas.

## 5. Verificación y siguientes límites

Pruebas del lote: particiones contra la captura real, IDs/significados/pinyin,
exposición separada por paso, homógrafos y estructuras repetidas, contenido
borrador, topes, aperturas, traspaso servidor/cliente, banco falso, otra lección
y aislamiento de cuenta. La prueba de base real se ejecuta solo en Postgres
desechable local y aborta si su destino no es esa base de prueba.

Esto no certifica obediencia del modelo ni pronunciación: falta prueba oral real
con principiantes y usuarios fluidos. Después se revisa el reporte/rúbrica
(CUR-05), antes de extender los bancos al resto de Fundamentos y a CUR-06/07.
Los puntos y el tratamiento actual de cobertura no se modifican silenciosamente.

Resultado local: 308 pruebas focalizadas en 13 suites y tres pruebas de
integración en Postgres desechable pasan. Estas últimas comprueban los seis
contenidos publicados, aislamiento real de cuenta y ausencia de escrituras de
progreso por el resolvedor. La base desechable fue retirada por el runner; las
bases persistentes de localhost y Vercel no se modificaron.

Fuentes de implementación: skill **Prisma Client API** para filtros y relaciones
por usuario, **Prisma CLI** para pruebas en base desechable, y **OpenAI Docs**
para contexto e instrucciones de voz sin cambiar `gpt-realtime-mini`:
[Prompting Realtime models](https://developers.openai.com/api/docs/guides/voice-prompting).
Captura curricular: [informe completo](curriculum-audit-2026-10-10/final/informe.md).
