# HanGo — Informe Académico

## Sistema de Enseñanza, Evaluación y Alineación con el Marco HSK

**Versión:** 1.1
**Fecha:** Agosto 2026
**Preparado para:** presentación institucional / evaluación académica externa

**Registro de cambios — 24 de agosto de 2026:** tras el cotejo verificado de la Sección 10, HanGo dejó de presentar el Nivel General como una equivalencia literal a un número HSK oficial, tanto en la aplicación como en Han. Esto se implementó y se documenta en tres lugares de este informe:

- **Sección 3.3** — el Nivel General (0-2000) ahora se muestra con nombres de nivel en lenguaje llano (p. ej. "Te Entienden Bien") en vez de un número HSK, tanto para el estudiante como para Han. Los umbrales de puntos y el número de dificultad interno (0-9) que controla el ritmo de las conversaciones de Han no cambiaron — solo la etiqueta.
- **Sección 8.2** — el selector manual de nivel en "Practicar con Han" (Speaking Lab) ahora muestra siete niveles en lenguaje llano (Beginner a Expert) en vez de "HSK 1" a "HSK 7-9"; el valor técnico que controla la dificultad real de la conversación no cambió.
- **Sección 10.9** (nueva) — desglose de la comparación HSK verificada por Dominio interno de contenido (9 dominios), no solo por los 3 capítulos visibles — incluye una corrección a una afirmación anterior sobre el escenario Work & Office.

---

## Índice

1. Resumen Ejecutivo
2. ¿Qué es Han? — El Profesor de Inteligencia Artificial
3. Sistema de Puntuación y Nivelación
4. Estructura del Learning Journey (Camino de Aprendizaje)
5. Foundations — Los 14 Escenarios (HSK 1–2)
6. Everyday Life — Los 17 Escenarios (HSK 3–4)
7. Advanced Situations — Los 10 Escenarios (HSK 5–9)
8. Speaking Lab (Laboratorio de Conversación)
9. Writing Lab (Laboratorio de Escritura)
10. Comparación con el Marco Oficial HSK (los 9 niveles)
11. Conclusión

---

# 1. Resumen Ejecutivo

HanGo es una plataforma de aprendizaje de chino mandarín impulsada por inteligencia artificial, diseñada para desarrollar competencia comunicativa real — no memorización de listas de vocabulario ni preparación mecánica para un examen.

El currículo de HanGo utiliza el marco **HSK (Hanyu Shuiping Kaoshi)** como referencia curricular — el estándar internacional de proficiencia en chino mandarín — pero organiza la enseñanza alrededor de **situaciones comunicativas reales** (pedir comida en un restaurante, presentarse en una entrevista de trabajo, negociar un contrato) en lugar de listas léxicas aisladas. El vocabulario y la gramática de cada nivel HSK se distribuyen dentro de estos escenarios según su utilidad comunicativa real, no según el orden de un libro de texto.

Este informe documenta, con precisión verificada contra la implementación real de la plataforma (no como aspiración de diseño), los tres pilares que sostienen la propuesta educativa de HanGo:

1. **Cómo se mide el progreso** — un sistema de dos niveles: un puntaje de sesión (0-100) inmediato por cada lección, y un **Nivel General** acumulativo (0-2000) que se muestra como un nivel con nombre propio en lenguaje llano — no como un número HSK certificado, tras el cotejo verificado de la Sección 10 — y que constituye la señal de competencia real del estudiante, tanto para el propio estudiante como para el profesor de IA, Han.
2. **Cómo está organizado el contenido de enseñanza** — la jerarquía Capítulo → Dominio → Escenario → Nivel de Dificultad → Lección, con el detalle completo de los tres capítulos del currículo: **Foundations** (HSK 1-2, 14 escenarios), **Everyday Life** (HSK 3-4, 17 escenarios) y **Advanced Situations** (HSK 5-9, 10 escenarios) — 41 escenarios en total, cada uno con su vocabulario exacto enseñado (chino, pinyin e inglés), su gramática, y cómo se evalúan la comprensión y la expresión oral.
3. **Cómo se compara con el estándar oficial HSK** — un cotejo **verificado, palabra por palabra**, de las 1,590 entradas de vocabulario del currículo contra la lista oficial de 9 niveles del estándar 国际中文教育中文水平等级标准 (2021), capítulo por capítulo, para comprobar si la progresión de dificultad declarada por HanGo corresponde a la realidad del vocabulario oficial de cada nivel.

---

# 2. ¿Qué es Han? — El Profesor de Inteligencia Artificial

**Han** es el profesor de IA que acompaña al estudiante en toda la plataforma. No es un chatbot genérico ni un asistente de preguntas y respuestas: es un compañero pedagógico permanente, disponible en cada pantalla de la aplicación a través de una burbuja flotante no intrusiva, que el estudiante puede abrir en cualquier momento sin perder su lugar en la lección.

## 2.1 Modalidades de interacción

El estudiante elige, desde su configuración, cómo quiere comunicarse con Han:

- **Texto y audio** — una conversación de chat normal, donde cada respuesta puede además escucharse en voz alta.
- **Solo audio** (modalidad predeterminada) — el texto de las respuestas de Han se oculta y cada respuesta se reproduce automáticamente en voz, imitando una conversación hablada real en lugar de un historial de chat leído.

Adicionalmente, Han ofrece **conversación de voz bidireccional en tiempo real**: el estudiante habla y Han responde por voz de inmediato, sin necesidad de escribir ni de tocar un botón de reproducción — una experiencia de conversación genuina, no una serie de mensajes de voz pregrabados.

## 2.2 Qué hace Han

Han opera como un único asistente continuo cuyo comportamiento se adapta a lo que el estudiante está haciendo, en lugar de exponer distintos "modos" separados que el estudiante deba elegir manualmente:

- **Tutoría y explicación** — el estudiante puede preguntar a Han cualquier duda de gramática o vocabulario ("¿Por qué se usa 了 aquí?", "¿Cuál es la diferencia entre 刚 y 刚才?"), y Han responde en chino, inglés o español, según el nivel del estudiante.
- **Compañero de conversación** — dentro del paso de Speaking (Expresión Oral) de cada lección, o en el modo libre "Practicar con Han" del Speaking Lab, Han sostiene una conversación real en el personaje correspondiente al escenario (un mesero, un entrevistador, un amigo), construida a partir del contexto real de ese escenario — no una charla genérica.
- **Corrección y retroalimentación** — después de un intento de expresión oral o de escritura, la retroalimentación de Han cubre gramática, uso de vocabulario, naturalidad y (en el caso de Speaking) pronunciación y fluidez, evaluadas con la misma rúbrica documentada en la Sección 3 de este informe.
- **Conciencia de contexto** — Han sabe en qué página o lección se encuentra el estudiante, el contenido específico de vocabulario/gramática/diálogo de esa lección cuando es relevante, y el progreso real y ganado del estudiante (ver 2.3). Preguntas como "¿qué debería estudiar hoy?" o "¿por qué me cuesta este tema?" se responden a partir de este mismo contexto real.

## 2.3 La señal de habilidad real: el Nivel General, no el nivel autodeclarado

Cuando un estudiante se registra, declara un nivel inicial aproximado. Pero esa autodeclaración **no es la señal que Han usa a largo plazo**. La señal más precisa y confiable es el **Nivel General** del estudiante — el puntaje acumulado 0-2000 descrito en la Sección 3, ganado únicamente a través de desempeño demostrado, no declarado.

Cuando el Nivel General y el nivel autodeclarado no coinciden, **Han prioriza el Nivel General**: la dificultad del vocabulario, los ejemplos y el estilo de corrección se ajustan de forma continua a ese puntaje real, no solo a su nivel nombrado más cercano — un estudiante con 340 puntos y otro con 950 puntos están ambos "cerca de un límite" de nivel, pero en direcciones distintas, y Han los trata de forma correspondientemente distinta. Han ve directamente el nombre del nivel (por ejemplo, "Te Entienden Bien"), nunca un número HSK.

Un estudiante completamente nuevo, con 0 puntos ganados, recibe por defecto el chino más simple posible, independientemente de lo que haya autodeclarado al registrarse.

Por diseño y por política de privacidad, Han nunca recibe el nombre, correo electrónico ni ningún otro dato de identificación personal del estudiante — únicamente su estado pedagógico (nivel, competencias, historial de aciertos y errores).

---

# 3. Sistema de Puntuación y Nivelación

HanGo mide el progreso en **dos niveles independientes**, deliberadamente separados:

1. **Puntaje de sesión (Reflection)** — de 0 a 100, retroalimentación inmediata sobre una sola lección.
2. **Nivel General** — de 0 a 2000, la competencia acumulada y real del estudiante, mostrada como un nivel con nombre propio (no un número HSK — ver la nota de la Sección 3.3).

## 3.1 Principio rector: un puntaje perfecto en una lección no sube el Nivel General por sí solo

Un puntaje de sesión perfecto le dice al estudiante cómo le fue *en esa lección*. No incrementa automáticamente su Nivel General — el Nivel General solo aumenta a través de la contribución ponderada que se describe en la Sección 3.3. Esto es intencional: ningún intento aislado, por muy bueno que sea, puede inflar artificialmente el nivel real de un estudiante.

Del mismo modo, si un estudiante repite un escenario ya completado, su nuevo puntaje **reemplaza** al anterior — nunca se suman ni se promedian intentos repetidos. Esto premia la mejora genuina sin permitir que la repetición "granjee" puntos extra.

## 3.2 Puntaje de sesión (Reflection, 0–100)

Al finalizar cada lección, el estudiante recibe un puntaje de 0 a 100 en la pantalla de Reflection (Reflexión), compuesto así:

| Paso de la lección | Puntos | Se califica a partir de |
|---|---|---|
| Vocabulario | 20 | Precisión real en el quiz (no solo cobertura, ver fórmula abajo) |
| Gramática | 20 | Precisión real en los ejercicios de gramática de la lección |
| Comprensión | 30 | Precisión real en los ejercicios de comprensión |
| Expresión Oral (Speaking) | 30 | Rúbrica de IA con 5 métricas (ver 3.2.3) |
| Situación | 0 | Paso presentacional, no calificado — prepara Comprensión y Expresión Oral |

**Puntaje mínimo de aprobación: 70 / 100.**

### 3.2.1 Vocabulario y Gramática — puntos por pregunta

**Comprensión**: siempre 5 ejercicios por lección → **6 puntos por respuesta correcta**, fijo.

**Gramática**: casi siempre 6 ejercicios por lección (3 puntos gramaticales × 2 ejercicios cada uno) → **3.33 puntos por respuesta correcta**. Las excepciones son los dominios de Vida Diaria y Viajes, con 4 ejercicios por lección → 5 puntos por respuesta correcta ahí.

**Vocabulario**: varía por lección, porque el número de preguntas del quiz por palabra depende de la dificultad del escenario (Principiante = 4 preguntas por palabra, Intermedio/Intermedio Alto = 5, Avanzado = 6) y de la cantidad de palabras enseñadas (6 o 10, según el dominio). La mezcla de preguntas por palabra incluye: reconocimiento de significado, traducción inversa (de inglés a caracteres chinos), 1-3 preguntas de completar el espacio en blanco (según la dificultad), y una pregunta de "ordenar la oración".

| Contexto curricular | Palabras × preguntas/palabra | Total de preguntas | Puntos por pregunta |
|---|---|---|---|
| Foundations (Principiante) | 10 × 4 | 40 | 0.50 |
| Vida Diaria / Viajes (Intermedio) | 6 × 5 | 30 | 0.667 |
| Movilidad / Vida Cotidiana / Amistades (Intermedio) | 10 × 5 | 50 | 0.40 |
| Salud / Trabajo / Situaciones Avanzadas | 10 × 6 | 60 | 0.333 |

### 3.2.2 Expresión Oral (30 puntos) — una fórmula deliberadamente estricta

A diferencia de Vocabulario, Gramática y Comprensión, el puntaje de Expresión Oral **no es un promedio** de sus componentes — es un **producto multiplicativo**. Un promedio permitiría que una pronunciación fuerte compensara un uso débil de vocabulario; multiplicar no lo permite.

```
promedio_base = (pronunciación + fluidez + precisión + complejidad + efectividad_comunicativa) / 5   [0-100]
speaking_0_100 = promedio_base × factor_vocabulario × factor_objetivo
puntos_speaking = (speaking_0_100 / 100) × 30
```

- **promedio_base**: la misma rúbrica de 5 métricas de IA que usa Speaking Lab (ver Sección 8.3).
- **factor_vocabulario** (0-1): qué tanto del vocabulario específico enseñado en esa lección usó realmente el estudiante durante la conversación. Una palabra cuenta si el estudiante la usó directamente, **o** si el personaje de IA la usó primero y la siguiente intervención del estudiante muestra una respuesta contextualmente adecuada y comprendida — no exige repetir la palabra de forma mecánica, reflejando cómo hablaría naturalmente un hablante fluido.
- **factor_objetivo** (0-1): qué tan completamente se logró el objetivo comunicativo del escenario (por ejemplo, "lograr reservar una mesa para dos a las 8pm").

Como los tres factores se multiplican, **un desempeño débil en cualquiera de ellos limita el puntaje total** — no puede compensarse promediando con fortalezas en otra área.

**Ejemplo resuelto**: las métricas de IA promedian 83.6 (una conversación genuinamente buena), pero solo se usó el 70% del vocabulario objetivo y el objetivo se cumplió al 90%:

```
83.6 × 0.70 × 0.90 = 52.7   →   15.8 / 30 puntos
```

Acercarse a 30/30 exige un desempeño cercano al 100% en gramática, uso de vocabulario **y** cumplimiento del objetivo simultáneamente — difícil, pero no imposible.

## 3.3 Nivel General (0–2000)

**Nota de actualización (24 de agosto de 2026)**: a partir del cotejo verificado contra el estándar oficial documentado en la Sección 10 de este mismo informe, HanGo dejó de presentar el Nivel General como una equivalencia literal a un número HSK específico — ni al estudiante, ni a Han. Los 10 umbrales de puntos originales se mantienen exactamente iguales (así como el número interno 0-9 que sigue controlando el ritmo y la complejidad de las conversaciones de Han en tiempo real), pero cada umbral ahora muestra un nombre de nivel en lenguaje llano en lugar de un número HSK. El HSK sigue existiendo puertas adentro, únicamente como referencia de calibración de diseño — nunca como una afirmación de certificación.

### 3.3.1 Por qué 3 capítulos, no 9 dominios

Internamente, la base de datos organiza el contenido en 9 "Dominios" con fines de autoría de contenido (Foundations, Vida Diaria, Viajes, Movilidad, Amistades, Salud, Trabajo y Oficina, Vida Cotidiana, Situaciones Avanzadas). **El estudiante nunca ve esta lista** — la pantalla del Learning Journey agrupa todos los escenarios en exactamente **3 capítulos visibles**, según el nivel de dificultad:

| Capítulo (lo que ve el estudiante) | Dificultad de escenario | Dominios internos que contiene |
|---|---|---|
| **Foundations** | Principiante | Foundations |
| **Everyday Life** (Vida Cotidiana) | Intermedio + Intermedio Alto | Vida Diaria, Viajes, Movilidad, Amistades, Salud, Trabajo y Oficina, Vida Cotidiana |
| **Advanced Situations** (Situaciones Avanzadas) | Avanzado | Situaciones Avanzadas |

### 3.3.2 Tabla de niveles del Nivel General

| Puntos | Nombre del nivel | Se alcanza en |
|---|---|---|
| 0 | Recién Llegado *(Just Starting Out)* | Estudiante nuevo |
| 100 | Ya Te Defiendes *(Getting By)* | Dentro de Foundations |
| **350** | **Te Mueves Solo** *(Finding Your Footing)* | Foundations completado |
| 700 | Hablas con Soltura *(Speaking with Ease)* | Dentro del capítulo Everyday Life |
| **900** | **Te Entienden Bien** *(Easily Understood)* | Everyday Life completado |
| 1150 | Manejas Situaciones *(Handling Real Situations)* | Dentro de Advanced Situations |
| **1500** | **Hablas como Profesional** *(Speaking Like a Professional)* | Advanced Situations completado |
| 1650 | Por Dominar el Idioma *(Nearing Mastery)* | Solo mediante Writing Lab / Speaking Lab |
| 1800 | Fluidez Casi Completa *(Refined Fluency)* | Solo mediante Writing Lab / Speaking Lab |
| **2000** | **Dominas el Idioma** *(Mastering the Language)* | Máximo |

Los umbrales de puntos (0/100/350/700/900/1150/1500/1650/1800/2000) son exactamente los mismos que sostenían la tabla anterior — nada del cálculo de puntos cambió. La aplicación real usa los nombres en inglés (columna en cursiva) por consistencia con el resto del código; la columna en español es la traducción de referencia para este informe.

### 3.3.3 Presupuesto de puntos por capítulo (acumulativo)

| Capítulo | Añade | Total acumulado |
|---|---|---|
| Foundations | 350 | 350 |
| Everyday Life | +550 | 900 |
| Advanced Situations | +600 | 1500 |
| Writing Lab + Speaking Lab | +500 | 2000 |

### 3.3.4 Cómo se calcula el puntaje de cada lección y escenario

El peso de cada lección **no se asigna a mano** — se deriva automáticamente del nivel HSK real (`hskReference`, un valor de 1 a 9) que ya tiene cada una de las 164 lecciones de la plataforma en la base de datos (verificado 2026-09-05 contra `prisma/seed.ts`: 41 escenarios × 4 lecciones cada uno; la cifra de "~224" que circulaba antes era una meta aspiracional, no el dato real). Esto mantiene el sistema consistente sin necesidad de juicios manuales lección por lección.

```
puntos_escenario = (suma_hsk_del_escenario / suma_hsk_del_capítulo) × presupuesto_del_capítulo
puntos_lección    = (hsk_de_la_lección / suma_hsk_del_escenario) × puntos_escenario
```

**Puntos realmente ganados**: al completar un escenario, el estudiante gana `puntos_escenario × (promedio ponderado de los puntajes de Reflection de ese escenario ÷ 100)`.

**Ejemplo resuelto**: un escenario que vale 46.4 puntos, completado con un promedio ponderado de Reflection del 78.5%, otorga al estudiante `46.4 × 0.785 ≈ 36.4` puntos hacia su Nivel General.

### 3.3.5 Puntos por escenario — currículo actual completo

**Foundations — presupuesto 350 puntos**

| Escenario | Puntos |
|---|---|
| Getting Started (Primeros Pasos) | 16.9 |
| Family (Familia) | 16.9 |
| Weather & Seasons (Clima y Estaciones) | 16.9 |
| Daily Life & Feelings (Vida Diaria y Sentimientos) | 16.9 |
| Around the House (En Casa) | 16.9 |
| Basic Shopping (Compras Básicas) | 16.9 |
| Phone & Communication (Teléfono y Comunicación) | 16.9 |
| School & Classroom (Escuela y Salón de Clases) | 25.3 |
| Hobbies & Free Time (Pasatiempos y Tiempo Libre) | 29.5 |
| Body & Feeling Unwell — Basics (Cuerpo y Malestar Básico) | 29.5 |
| Asking About Places & Opening Hours (Preguntar por Lugares y Horarios) | 29.5 |
| Money, Banking & Simple Transactions (Dinero, Banco y Transacciones Simples) | 33.7 |
| Opinions, Comparisons & Preferences (Opiniones, Comparaciones y Preferencias) | 38.0 |
| Making Plans & Talking About Time (Hacer Planes y Hablar del Tiempo) | 46.4 |

*(Ver Sección 5 para el desglose pedagógico completo de estos 14 escenarios — vocabulario, gramática y contexto de cada uno.)*

**Everyday Life — presupuesto 550 puntos**

| Dominio interno | Escenario | Puntos |
|---|---|---|
| Movilidad | Getting Around (Moverse por la Ciudad) | 25.2 |
| Vida Cotidiana | Grocery Shopping & Meal Planning (Supermercado y Planificación de Comidas) | 25.2 |
| Vida Cotidiana | Coffee Shop & Casual Meetups (Cafetería y Encuentros Casuales) | 27.8 |
| Vida Diaria | Restaurant (Restaurante) | 30.3 |
| Vida Diaria | Shopping (Compras) | 30.3 |
| Viajes | Hotel | 30.3 |
| Amistades | Making Friends (Hacer Amigos) | 30.3 |
| Vida Cotidiana | Gym & Fitness Classes (Gimnasio y Clases de Ejercicio) | 30.3 |
| Vida Cotidiana | Social Events & Small Talk with Strangers (Eventos Sociales y Charla con Desconocidos) | 30.3 |
| Vida Cotidiana | Renting an Apartment (Rentar un Departamento) | 32.8 |
| Vida Cotidiana | Post Office & Mailing Packages (Correo y Envío de Paquetes) | 32.8 |
| Vida Cotidiana | Online Shopping & Delivery Problems (Compras en Línea y Problemas de Entrega) | 37.8 |
| Salud | Health (Salud) | 35.3 |
| Vida Cotidiana | Weather, Plans & Rescheduling (Clima, Planes y Reprogramación) | 35.3 |
| Vida Cotidiana | Roommate & Neighbor Issues (Problemas con Compañeros de Piso y Vecinos) | 35.3 |
| Trabajo y Oficina | Work & Office (Trabajo y Oficina) | 40.4 |
| Vida Cotidiana | Job Interview Basics (Entrevista de Trabajo Básica) | 40.4 |

**Advanced Situations — presupuesto 600 puntos**

| Escenario | Puntos |
|---|---|
| Negotiating a Job Contract (Negociar un Contrato Laboral) | 47.2 |
| Debating a Current Issue (Debatir un Tema de Actualidad) | 47.2 |
| Academic Seminar Discussion (Discusión en Seminario Académico) | 52.0 |
| Resolving a Complex Workplace Conflict (Resolver un Conflicto Laboral Complejo) | 52.0 |
| Media Interview as an Expert (Entrevista como Experto en Medios) | 52.0 |
| Legal and Notarial Procedures (Trámites Legales y Notariales) | 61.4 |
| Formal Speech and Toast at an Event (Discurso Formal y Brindis en un Evento) | 61.4 |
| Specialist Medical Consultation (Consulta Médica Especializada) | 70.9 |
| Diplomatic and Culturally Sensitive Negotiation (Negociación Diplomática y Culturalmente Sensible) | 75.6 |
| Tech and Finance Expert Panel (Panel de Expertos en Tecnología y Finanzas) | 80.3 |

## 3.4 Puntos de Laboratorio — los últimos 500 puntos (HSK 7–9)

Alcanzar HSK 7-9 debe ser genuinamente difícil y genuinamente lento — no alcanzable solo terminando el currículo guiado, ni tampoco en pocas semanas de esfuerzo concentrado. La fluidez real en este nivel toma meses de práctica sostenida, no solo volumen.

### 3.4.1 Reparto del presupuesto

| Habilidad | Puntos | Estado |
|---|---|---|
| Speaking Lab | 200 | En funcionamiento |
| Writing Lab | 150 | En funcionamiento |
| Reading Lab | 150 | Planeado — aún no construido |
| **Total** | **500** | |

Mientras Reading Lab no exista, el máximo honesto que un estudiante puede alcanzar hoy es **1850 / 2000**, no 2000. La plataforma no infla temporalmente Speaking/Writing para cubrir ese vacío, porque eso obligaría a bajar retroactivamente el puntaje de estudiantes existentes cuando Reading se lance — algo que el diseño del sistema evita explícitamente.

### 3.4.2 Fórmula

Cada habilidad calcula sus puntos de forma independiente, con la misma estructura:

```
puntos_habilidad = presupuesto_habilidad × factor_dominio × factor_volumen × factor_tiempo × factor_consistencia
```

Los cuatro factores están limitados al rango [0, 1]. Como se multiplican entre sí, **cualquier factor en 0 anula el resultado completo** — esto es intencional: un estudiante no puede compensar "demasiado nuevo, demasiado rápido" con un par de intentos excelentes.

- **factor_dominio** (calidad del puntaje): `(promedio_reciente - 70) / 30`. Nada por debajo de un promedio del 70% cuenta.
- **factor_volumen** (evidencia distinta, no repeticiones): `(intentos_distintos - 20) / 40`. Se necesitan 20 intentos calificados distintos solo para empezar a contar, y el peso completo solo se alcanza a partir de 60.
- **factor_tiempo** (distribuido en el tiempo real — la palanca clave contra el "farmeo"): `(semanas_activas_distintas - 2) / 10`. Se necesita práctica distribuida en al menos 2 semanas calendario para empezar a contar, y el peso completo solo después de 12 semanas (~3 meses) de actividad. Esto es lo que impide que un estudiante concentre 60 intentos en una sola semana intensa y alcance el máximo — el mismo volumen distribuido en un fin de semana frente a tres meses no puede puntuar igual.
- **factor_consistencia** (confiabilidad, no un solo pico de suerte): `1 - (desviación_estándar_de_puntajes_recientes / 100)`.

**Ejemplo resuelto**: un estudiante con 65 envíos distintos en Writing Lab, distribuidos en 12 semanas calendario, con un promedio del 88% y una desviación estándar de 8:

```
factor_dominio      = (88-70)/30  = 0.60
factor_volumen       = (65-20)/40  = 1.00
factor_tiempo        = (12-2)/10   = 1.00
factor_consistencia  = 1 - 8/100   = 0.92

puntos = 150 × 0.60 × 1.00 × 1.00 × 0.92 ≈ 82.8 / 150  (55%)
```

Tres meses de práctica genuinamente buena y consistente alcanzan apenas poco más de la mitad. Acercarse al máximo de 150 exige un promedio sostenido en los 90 altos — apropiadamente difícil para HSK 7-9.

## 3.5 Panel de Progreso

La pantalla de Progreso del estudiante muestra:

- **Nivel General**: `X / 2000`, con su nombre de nivel según la tabla de la Sección 3.3.2.
- **Promedio ponderado del Learning Journey** (cómo le va al estudiante a través de los escenarios completados).
- **Puntajes por habilidad** (0-100): Escucha, Expresión Oral, Lectura, Escritura y Comunicación Diaria.

---

# 4. Estructura del Learning Journey (Camino de Aprendizaje)

## 4.1 Jerarquía real de contenido

```
Capítulo  →  Dominio  →  Escenario  →  Nivel de Dificultad  →  Lección
```

- El estudiante ve exactamente **3 capítulos** en la pantalla del Learning Journey: **Foundations, Everyday Life, Advanced Situations** — agrupados por nivel de dificultad, no por los 9 Dominios internos detrás de ellos.
- Cada Dominio contiene uno o más **Escenarios** (una situación real: Restaurante, Entrevista de Trabajo, Negociar un Contrato).
- Cada Escenario tiene uno o más **Niveles de Dificultad** (Principiante, Intermedio, Intermedio Alto, Avanzado), cada uno con varias **Lecciones**.
- A diferencia de un diseño donde cada escenario recorrería los tres niveles de dificultad con un ejemplo ascendente, en el currículo real **cada escenario solo tiene el o los niveles de dificultad con los que realmente fue creado**: la mayoría existen en un solo nivel (por ejemplo, todos los escenarios de Foundations son exclusivamente Principiante; Restaurante es exclusivamente Intermedio), y un puñado abarca dos niveles (Salud tiene lecciones Intermedias y Avanzadas; Movilidad tiene Principiante e Intermedio). Ningún escenario actual abarca los cuatro niveles a la vez.

## 4.2 Flujo real de una lección — 6 pasos

> **Nota de auditoría (2026-09-05):** el orden de abajo (Gramática antes de
> Situación) es el que sigue la única lección escrita a mano
> (`seedRestaurantLesson`), no el real de las otras 163 lecciones (el
> 99% del contenido), que usa el helper `createFullLesson()`. Ese helper
> genera el orden **Vocabulario → Situación → Comprensión → Gramática →
> Expresión Oral → Reflection** — Gramática va *después* de Comprensión,
> no antes de Situación. Se corrige la numeración abajo para reflejar el
> caso real y mayoritario.

Cada lección publicada sigue un flujo fijo y consistente de **6 pasos**, en este orden (163 de 164 lecciones):

1. **Vocabulario** — se enseña antes de que el estudiante lo encuentre en contexto. Cada palabra incluye caracteres chinos, pinyin, significado en inglés, categoría gramatical y 1-3 oraciones de ejemplo, cada una con su propio audio. El estudiante es evaluado con un quiz por palabra (ver Sección 3.2.1).
2. **Situación** (incluye el diálogo) — Han presenta la escena y los objetivos comunicativos numerados de la lección, y luego el diálogo modelo completo entre dos personajes (un mesero y un cliente, un entrevistador y un candidato, etc.), con audio generado de sonido natural para toda la conversación.
3. **Comprensión** — el estudiante escucha de nuevo la conversación completa antes de ver las preguntas o el texto en chino. 5 preguntas de comprensión por lección, verificando la comprensión real del diálogo escuchado.
4. **Gramática** — cada punto gramatical incluye su significado, estructura, un ejemplo resuelto y una nota sobre errores comunes, seguido de ejercicios.
5. **Expresión Oral (Speaking)** — una conversación real con Han, en personaje, construida a partir del escenario, vocabulario y gramática específicos de esa lección. Evaluada con la rúbrica de 5 métricas descrita en la Sección 8.3, limitada por cuánto del vocabulario objetivo se usó y cuán completamente se cumplió el objetivo del escenario (ver fórmula en 3.2.2).
6. **Reflection (Reflexión)** — la pantalla final de resultados de la lección: el puntaje ponderado 0-100 descrito en la Sección 3.2.

La única excepción es la lección 1 (Restaurante), escrita a mano antes de
existir el helper, que sigue Vocabulario → Gramática → Situación →
Comprensión → Expresión Oral → Reflection.

### Contenido que existe fuera del flujo de 6 pasos

- **Misión** — cada *escenario* (no cada lección) tiene una misión: una tarea abierta y práctica del mundo real ("pedir comida sin ayuda", "explicar un problema"), completada como un juego de rol libre con IA una vez terminadas sus lecciones.
- **Escritura (Writing)** — cada lección puede tener asociada una tarea de escritura de un párrafo (ver Sección 9), a la que se accede desde Writing Lab, no como un paso dentro de la lección.

## 4.3 Examen de Colocación (Placement Exam)

Para un estudiante que ya sabe algo de chino, empezar literalmente en la primera lección de Foundations sería un desperdicio de tiempo. El Examen de Colocación es un diagnóstico adaptativo, disponible antes de entrar a Learning Journey, que mide dónde está realmente el estudiante — sin asumir que tiene que empezar desde cero.

**Cinco habilidades, cinco niveles independientes.** El examen evalúa Vocabulario, Gramática, Lectura, Escucha y Expresión Oral por separado, y cada una llega a su propio nivel (0-9) — nunca un solo número. Esto es una decisión de diseño deliberada: reconocer y producir chino son habilidades distintas, y un estudiante puede, por ejemplo, leer con soltura pero hablar con más dificultad.

**Una única mecánica para las cuatro habilidades escritas (Vocabulario, Gramática, Lectura y Escucha).** Cada nivel plantea un conjunto fijo de preguntas, en una sola pasada, sin reintentos, y hace falta acertar al menos el 80% para subir al siguiente nivel. El examen corta apenas el resultado de un nivel queda matemáticamente decidido — ya sea que el estudiante vaya camino a aprobarlo o a reprobarlo — en vez de seguir preguntando hasta agotar todo el banco disponible; esto evita tanto hacer perder el tiempo a quien ya demostró el nivel como seguir insistiendo con un estudiante que claramente no llega. En Lectura y Escucha, donde el banco real de preguntas por nivel es más chico (solo 2 en los niveles superiores), el criterio de aprobación en esa banda es más exigente — hace falta acertar ambas — coherente con la misma regla de no relajar el corte redondeando para abajo.

- **Cada pregunta tiene un límite de tiempo**, escalado según la dificultad del nivel: desde 10 segundos para una pregunta de opción múltiple en los niveles iniciales, hasta 25 segundos en los niveles más avanzados; ordenar una oración (Gramática) y los bloques de Lectura o Escucha reciben ventanas más generosas, pensadas para leer un pasaje completo o escuchar un audio antes de responder todas sus preguntas juntas.
- **El audio de Escucha se reproduce una sola vez**, sin posibilidad de repetirlo — la misma condición que un examen de comprensión auditiva real.
- **Expresión Oral** solo empieza una vez que las cuatro habilidades escritas alcanzan al menos nivel 3, y luego escala de forma independiente a través de una conversación real con Han, evaluada con la misma rúbrica de 5 métricas de la Sección 8.3 — tope en nivel 7 (los escenarios de examen oral solo llegan hasta ahí). Un solo intento por nivel: si el estudiante no lo pasa, el examen de Expresión Oral termina ahí, sin ofrecer un nivel más difícil.
- **Los niveles 7, 8 y 9 son solo de referencia**, nunca otorgan colocación ni puntos reales — coherente con el mismo principio de la Sección 3.4: esos niveles solo se ganan con evidencia sostenida en los Labs, nunca por un examen puntual.

Los resultados usan exactamente los mismos nombres de nivel que el resto de la aplicación (Sección 3.3) — no un número HSK aparte.

**Estado actual: el examen ya otorga crédito real, con un alcance deliberadamente acotado.** Completar el examen no solo le muestra al estudiante dónde se ubicaría — además acredita automáticamente puntos de Nivel General por las lecciones que ya domina, sin necesidad de rehacerlas una por una:

- Cada lección cuya dificultad (`hskReference`) sea igual o menor al **más bajo** de los niveles colocados (incluyendo Expresión Oral cuando se rindió) se acredita automáticamente — nunca el más alto, el mismo principio de "nunca colocar por encima de la habilidad más débil".
- Esa acreditación no es cosmética: crea un registro de finalización real, con los mismos 4 sub-puntajes (vocabulario, gramática, comprensión, expresión oral) que usaría una Reflection genuina — poblados con el desempeño real del examen en el nivel de esa lección específica — y alimenta exactamente la misma fórmula de Nivel General de la Sección 3.3.4, sin ninguna fórmula nueva.
- Las lecciones de nivel HSK7-9 quedan excluidas del crédito automático, consistente con la regla de "solo vía Lab".
- **El alcance es deliberadamente solo puntos de Nivel General** — una colocación automática no salta pasos de lección ni cambia qué está disponible o bloqueado, y **se distingue visiblemente de una lección hecha de verdad** con una insignia ("Colocado por examen" en vez de "Completado") y una invitación explícita a hacerla de verdad si el estudiante quiere confirmar o mejorar su puntaje. Si la hace, el resultado real reemplaza al de colocación, usando el mismo mecanismo de "rehacer" que ya existe en toda la plataforma (Sección 3.1).

---

# 5. Foundations — Los 14 Escenarios (HSK 1–2)

Foundations es el capítulo de entrada del currículo: 14 escenarios, 56 lecciones en total (4 lecciones por escenario), pensados para un estudiante que empieza desde cero. Cada escenario enseña entre 38 y 40 palabras de vocabulario y 12 puntos gramaticales (3 por lección), distribuidos en 4 lecciones que siguen el flujo de 6 pasos descrito en la Sección 4.2.

**Nota sobre el conteo**: el número de escenarios verificado directamente contra el contenido real de la base de datos es **14, no 15**. (Aparte, tres escenarios adicionales — Restaurant, Hotel, Shopping — están técnicamente asignados al mismo "Dominio" interno que Foundations por razones históricas de organización de contenido, pero llevan `hskReference: 3` en todas sus lecciones y pertenecen, en la experiencia real del estudiante, al capítulo **Everyday Life** — ver Sección 3.3.1. No se cuentan aquí.)

**Comprensión y Expresión Oral — mecánica común a los 14 escenarios**: el paso de Comprensión siempre consta de 5 preguntas sobre el diálogo de la lección, escuchado dos veces antes de mostrar el texto en chino (ver Sección 4.2). El paso de Expresión Oral siempre es una conversación real con Han, en el personaje que corresponde al escenario (por ejemplo, un compañero de clase en *School & Classroom*, un empleado bancario en *Money, Banking & Simple Transactions*, un vendedor en *Basic Shopping*), evaluada con la misma rúbrica de 5 métricas de la Sección 8.3 y limitada por el uso real del vocabulario objetivo y el cumplimiento del objetivo del escenario (fórmula de la Sección 3.2.2). Por ello, en lugar de repetirse en cada uno de los 14 escenarios, esta mecánica se documenta una sola vez aquí; lo que cambia escenario a escenario es el vocabulario, la gramática y el contexto del diálogo, detallados a continuación.

---

## 5.1 Getting Started (Primeros Pasos)

**Descripción:** Empezar el chino desde cero: saludos, números y hora, pedir ayuda básica, y direcciones simples.
**Lecciones:** Greetings and Introductions (Saludos e Introducciones) · Numbers, Time and Dates (Números, Hora y Fechas) · Basic Needs (Necesidades Básicas) · Simple Directions (Direcciones Simples)
**Nivel HSK:** 1 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 你好 | nǐ hǎo | hello |
| 叫 | jiào | to be called; to call |
| 名字 | míngzi | name |
| 高兴 | gāoxìng | happy, glad |
| 认识 | rènshi | to know, to meet |
| 哪 | nǎ | which |
| 国 | guó | country |
| 学生 | xuésheng | student |
| 学习 | xuéxí | to study |
| 再见 | zàijiàn | goodbye |
| 现在 | xiànzài | now |
| 点 | diǎn | o'clock |
| 今天 | jīntiān | today |
| 忙 | máng | busy |
| 想 | xiǎng | to want, to think |
| 明天 | míngtiān | tomorrow |
| 喝 | hē | to drink |
| 咖啡 | kāfēi | coffee |
| 早上 | zǎoshang | morning |
| 号 | hào | day of the month |
| 请问 | qǐngwèn | excuse me, may I ask |
| 洗手间 | xǐshǒujiān | bathroom |
| 哪儿 | nǎr | where |
| 走 | zǒu | to walk, to go |
| 水 | shuǐ | water |
| 等 | děng | to wait |
| 舒服 | shūfu | comfortable, well |
| 疼 | téng | to hurt, painful |
| 需要 | xūyào | to need |
| 帮助 | bāngzhù | help |
| 图书馆 | túshūguǎn | library |
| 银行 | yínháng | bank |
| 旁边 | pángbiān | next to, beside |
| 一直 | yìzhí | straight, continuously |
| 往 | wǎng | towards |
| 前 | qián | front, ahead |
| 转 | zhuǎn | to turn |
| 远 | yuǎn | far |
| 分钟 | fēnzhōng | minute |
| 附近 | fùjìn | nearby |

**Gramática:** 叫 para nombres (Sujeto + 叫 + Nombre) · 吗 para preguntas de sí/no · 呢 para preguntas de seguimiento · palabras de tiempo antes del verbo · 想 + verbo ("querer") · 几 para preguntar números pequeños · 请问 para preguntas corteses · 在哪儿 para ubicación · 我可以...吗 para peticiones corteses · 在 + Lugar · 往 + Dirección + Verbo · X不X para preguntas de sí/no.

---

## 5.2 Family (Familia)

**Descripción:** Hablar de la familia: quién la compone, cómo son, dónde viven, y qué hacen juntos.
**Lecciones:** Introducing Your Family (Presentar a tu Familia) · Describing Family Members (Describir a la Familia) · Where Your Family Lives (Dónde Vive tu Familia) · Family Activities (Actividades Familiares)
**Nivel HSK:** 1 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 家 | jiā | family, home |
| 口 | kǒu | measure word for family members |
| 爸爸 | bàba | dad |
| 妈妈 | māma | mom |
| 哥哥 | gēge | older brother |
| 姐姐 | jiějie | older sister |
| 弟弟 | dìdi | younger brother |
| 妹妹 | mèimei | younger sister |
| 工作 | gōngzuò | work, job |
| 老师 | lǎoshī | teacher |
| 多大 | duō dà | how old |
| 岁 | suì | years old |
| 长 | zhǎng | to look, to grow |
| 头发 | tóufa | hair |
| 高 | gāo | tall |
| 短 | duǎn | short |
| 性格 | xìnggé | personality |
| 聪明 | cōngming | smart |
| 关系 | guānxi | relationship |
| 经常 | jīngcháng | often |
| 住 | zhù | to live |
| 城市 | chéngshì | city |
| 离 | lí | from, distance from |
| 坐 | zuò | to take, to ride |
| 飞机 | fēijī | airplane |
| 小时 | xiǎoshí | hour |
| 多久 | duōjiǔ | how long, how often |
| 回家 | huí jiā | go home |
| 想家 | xiǎng jiā | miss home |
| 生活 | shēnghuó | life |
| 周末 | zhōumò | weekend |
| 一般 | yìbān | usually |
| 电影 | diànyǐng | movie |
| 决定 | juédìng | to decide |
| 轮流 | lúnliú | to take turns |
| 除了 | chúle | besides, except |
| 做饭 | zuòfàn | to cook |
| 公园 | gōngyuán | park |
| 散步 | sànbù | to take a walk |
| 幸福 | xìngfú | happy, fortunate |

**Gramática:** 有 para posesión/existencia · 几口人 para tamaño familiar · 或者 ("o") · 多 + adjetivo para preguntar el grado · edad con 岁 · adjetivos como predicado · 离 para distancia entre lugares · duración con 要 · frecuencia con 一年...次 · 然后 para secuencia · 除了...还... ("además de X, también Y") · 有时候 para hábitos ocasionales.

---

## 5.3 Weather & Seasons (Clima y Estaciones)

**Descripción:** Hablar del clima, las estaciones, qué ponerse, y hacer planes según el pronóstico.
**Lecciones:** Asking About Today's Weather (Preguntar por el Clima de Hoy) · Seasons and Preferences (Estaciones y Preferencias) · Weather and Clothing (Clima y Ropa) · Planning Around Weather (Planear según el Clima)
**Nivel HSK:** 1 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 天气 | tiānqì | weather |
| 冷 | lěng | cold |
| 刮风 | guāfēng | windy |
| 下雨 | xiàyǔ | to rain |
| 可能 | kěnéng | maybe, possibly |
| 伞 | sǎn | umbrella |
| 度 | dù | degree |
| 大概 | dàgài | approximately |
| 穿 | chuān | to wear |
| 外套 | wàitào | coat |
| 季节 | jìjié | season |
| 秋天 | qiūtiān | autumn |
| 夏天 | xiàtiān | summer |
| 冬天 | dōngtiān | winter |
| 春天 | chūntiān | spring |
| 比较 | bǐjiào | relatively, comparatively |
| 游泳 | yóuyǒng | to swim |
| 可是 | kěshì | but |
| 花 | huā | flower |
| 漂亮 | piàoliang | pretty |
| 毛衣 | máoyī | sweater |
| 别 | bié | don't |
| 忘 | wàng | to forget |
| 戴 | dài | to wear (accessories) |
| 帽子 | màozi | hat |
| 手套 | shǒutào | gloves |
| 短袖 | duǎnxiù | short sleeve |
| 短裤 | duǎnkù | shorts |
| 雨鞋 | yǔxié | rain boots |
| 感冒 | gǎnmào | to catch a cold |
| 爬山 | páshān | to hike, climb a mountain |
| 查 | chá | to check |
| 晴天 | qíngtiān | sunny day |
| 风 | fēng | wind |
| 如果 | rúguǒ | if |
| 改天 | gǎitiān | another day, reschedule |
| 重要 | zhòngyào | important |
| 出发 | chūfā | to depart |
| 大 | dà | big, strong (of wind) |
| 但是 | dànshì | but |

**Gramática:** 会 para posibilidad futura · 应该 ("debería") · 怎么样 para preguntar sobre un tema · 不...也不... ("ni...ni...") · 最 para superlativos · 太...了 ("demasiado X") · 别 + Verbo para órdenes negativas · 穿 vs 戴 (ropa de cuerpo vs. accesorios) · 因为 para dar una razón · 如果...就... ("si...entonces...") · 了 para acciones completadas · 那 como "entonces".

---

## 5.4 Daily Life & Feelings (Vida Diaria y Sentimientos)

**Descripción:** Hablar de cómo te sientes, tu rutina diaria, y tu fin de semana.
**Lecciones:** Basic Feelings (Sentimientos Básicos) · Your Daily Routine (Tu Rutina Diaria) · How You Feel About Your Day (Cómo te Sientes con tu Día) · Weekend Routine (Rutina de Fin de Semana)
**Nivel HSK:** 1 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 累 | lèi | tired |
| 昨晚 | zuówǎn | last night |
| 睡 | shuì | to sleep |
| 饿 | è | hungry |
| 渴 | kě | thirsty |
| 请 | qǐng | to treat, to invite |
| 茶 | chá | tea |
| 开心 | kāixīn | happy |
| 希望 | xīwàng | to hope |
| 关心 | guānxīn | care, concern |
| 每天 | měitiān | every day |
| 起床 | qǐchuáng | get up |
| 刷牙 | shuāyá | brush teeth |
| 洗脸 | xǐliǎn | wash face |
| 早饭 | zǎofàn | breakfast |
| 上班 | shàngbān | go to work |
| 下班 | xiàbān | get off work |
| 运动 | yùndòng | to exercise |
| 半 | bàn | half |
| 睡觉 | shuìjiào | sleep, go to bed |
| 过 | guò | to spend, to pass (time) |
| 充实 | chōngshí | fulfilling |
| 发生 | fāshēng | to happen |
| 完成 | wánchéng | to finish, complete |
| 项目 | xiàngmù | project |
| 成就感 | chéngjiùgǎn | sense of accomplishment |
| 一定 | yídìng | surely, definitely |
| 不过 | búguò | however |
| 打算 | dǎsuàn | to plan to |
| 晚安 | wǎn'ān | good night |
| 早起 | zǎoqǐ | get up early |
| 晚 | wǎn | late |
| 看书 | kànshū | read books |
| 出去 | chūqù | go out |
| 跑步 | pǎobù | run |
| 平时 | píngshí | usually, on weekdays |
| 一样 | yíyàng | same |
| 轻松 | qīngsōng | relaxed |
| 打扫 | dǎsǎo | to clean |
| 房间 | fángjiān | room |

**Gramática:** X不X para preguntas de sí/no · 有点儿 + adjetivo ("un poco") · 会...的 para tranquilizar · 先...然后... ("primero...luego...") · Hora + 半 para medias horas · X以后 ("después de X") · 过得怎么样 para preguntar cómo fue el tiempo · 打算 + Verbo para planes · 不过 vs 但是 · 到 como complemento de resultado · 和...不一样 para comparación · 还要 ("también hace falta").

---

## 5.5 Around the House (En Casa)

**Descripción:** Describir tu casa, sus habitaciones y muebles, las tareas del hogar, y tu vecindario.
**Lecciones:** Rooms in Your House (Habitaciones de tu Casa) · Furniture and Objects (Muebles y Objetos) · Household Activities (Actividades del Hogar) · Describing Your Neighborhood (Describir tu Vecindario)
**Nivel HSK:** 1 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 房间 | fángjiān | room |
| 客厅 | kètīng | living room |
| 卧室 | wòshì | bedroom |
| 厨房 | chúfáng | kitchen |
| 卫生间 | wèishēngjiān | bathroom |
| 房子 | fángzi | house |
| 沙发 | shāfā | sofa |
| 电视 | diànshì | TV |
| 里 | lǐ | inside |
| 温馨 | wēnxīn | cozy |
| 家具 | jiājù | furniture |
| 床 | chuáng | bed |
| 衣柜 | yīguì | wardrobe |
| 桌子 | zhuōzi | desk, table |
| 电脑 | diànnǎo | computer |
| 整洁 | zhěngjié | tidy |
| 乱 | luàn | messy |
| 底下 | dǐxia | underneath |
| 箱子 | xiāngzi | box |
| 书架 | shūjià | bookshelf |
| 家务 | jiāwù | housework |
| 简单 | jiǎndān | simple |
| 菜 | cài | dish |
| 洗碗 | xǐwǎn | wash dishes |
| 谁 | shéi | who |
| 洗衣服 | xǐ yīfu | do laundry |
| 星期 | xīngqī | week |
| 必须 | bìxū | must |
| 一点儿 | yìdiǎnr | a little |
| 打扫 | dǎsǎo | to clean |
| 附近 | fùjìn | nearby |
| 超市 | chāoshì | supermarket |
| 公园 | gōngyuán | park |
| 地铁站 | dìtiězhàn | subway station |
| 对面 | duìmiàn | across from |
| 小区 | xiǎoqū | neighborhood, residential area |
| 安静 | ānjìng | quiet |
| 挺 | tǐng | quite, pretty |
| 搬 | bān | to move |
| 年 | nián | year |

**Gramática:** 有 para existencia con ubicación · 个 como medidor general · 只有 ("solo tener") · medidores 张/台 para objetos planos/máquinas · 上/下/里 después de sustantivos para ubicación · 也许 ("tal vez") · 会 para habilidad aprendida · frecuencia (Periodo + Verbo + Número + 次) · 必须 para obligación · 有没有 para preguntas de existencia · Duración + 了 ("llevar haciendo algo") · 就在 para ubicación exacta.

---

## 5.6 Basic Shopping (Compras Básicas)

**Descripción:** Comprar un artículo simple: preguntar por color y talla, preguntar el precio, pagar, y devolver o cambiar el artículo si es necesario.
**Lecciones:** Colors and Simple Items (Colores y Artículos Simples) · Sizes and Preferences (Tallas y Preferencias) · Asking the Price (Preguntar el Precio) · Returning an Item (Devolver un Artículo)
**Nivel HSK:** 1 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 买 | mǎi | to buy |
| 件 | jiàn | measure word for clothes |
| 颜色 | yánsè | color |
| 蓝色 | lánsè | blue |
| 红色 | hóngsè | red |
| 流行 | liúxíng | popular |
| 试 | shì | to try |
| 试衣间 | shìyījiān | fitting room |
| 慢慢 | mànman | slowly, take your time |
| 不错 | búcuò | not bad, pretty good |
| 衣服 | yīfu | clothes |
| 小 | xiǎo | small |
| 中号 | zhōnghào | medium size |
| 大小 | dàxiǎo | size |
| 合适 | héshì | fitting, suitable |
| 穿着 | chuānzhe | wearing |
| 适合 | shìhé | to suit |
| 款式 | kuǎnshì | style |
| 明白 | míngbai | to understand |
| 大 | dà | big |
| 多少钱 | duōshǎo qián | how much |
| 块 | kuài | yuan (unit of currency) |
| 贵 | guì | expensive |
| 便宜 | piányi | cheap |
| 付钱 | fùqián | to pay |
| 现金 | xiànjīn | cash |
| 刷卡 | shuākǎ | pay by card |
| 袋子 | dàizi | bag |
| 给 | gěi | to give |
| 惠顾 | huìgù | patronage (polite, "thanks for your business") |
| 退 | tuì | to return |
| 问题 | wèntí | problem |
| 尺寸 | chǐcùn | size |
| 收据 | shōujù | receipt |
| 退款 | tuìkuǎn | refund |
| 换货 | huànhuò | exchange |
| 号 | hào | size number |
| 新 | xīn | new |
| 换 | huàn | to exchange, change |
| 帮助 | bāngzhù | help |

**Gramática:** 件 como medidor de ropa · reduplicación verbal para un tono casual · 有没有 + descripción + 的 · Adjetivo + 一点儿 ("un poco más") · 着 para un estado en curso · 比较 + adjetivo para preferencia · 多少钱 para preguntar el precio · 能...吗 para posibilidad cortés · A还是B para preguntas de opción · 想 + Verbo para deseo · Número + 号 como incremento de talla · A还是B en un nuevo marco.

---

## 5.7 Phone & Communication (Teléfono y Comunicación)

**Descripción:** Hacer llamadas telefónicas, dejar mensajes, enviar mensajes de texto, y concertar citas.
**Lecciones:** Making a Phone Call (Hacer una Llamada) · Leaving a Message (Dejar un Mensaje) · Texting Basics (Mensajes de Texto Básicos) · Making an Appointment by Phone (Concertar una Cita por Teléfono)
**Nivel HSK:** 1 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 喂 | wéi | hello (on the phone) |
| 哪位 | nǎ wèi | who (polite) |
| 记得 | jìde | to remember |
| 好久不见 | hǎojiǔ bú jiàn | long time no see |
| 打电话 | dǎ diànhuà | make a phone call |
| 问 | wèn | to ask |
| 事 | shì | matter, thing |
| 有空 | yǒu kòng | free, available |
| 怎么了 | zěnme le | what's wrong, what's up |
| 没问题 | méi wèntí | no problem |
| 经理 | jīnglǐ | manager |
| 不好意思 | bù hǎoyìsi | sorry, excuse me |
| 回来 | huílái | come back |
| 留言 | liúyán | leave a message |
| 回电话 | huí diànhuà | call back |
| 称呼 | chēnghu | to address, to call someone |
| 姓 | xìng | surname |
| 号码 | hàomǎ | number |
| 转告 | zhuǎngào | to relay a message |
| 什么时候 | shénme shíhou | when |
| 收到 | shōudào | to receive |
| 短信 | duǎnxìn | text message |
| 看懂 | kàndǒng | understand (by reading) |
| 打字 | dǎzì | to type |
| 错 | cuò | wrong |
| 没关系 | méi guānxi | no problem, it's okay |
| 见面 | jiànmiàn | to meet up |
| 发 | fā | to send |
| 地址 | dìzhǐ | address |
| 马上 | mǎshàng | right away |
| 预约 | yùyuē | to make an appointment |
| 约 | yuē | to schedule, arrange |
| 已经 | yǐjīng | already |
| 贵姓 | guìxìng | your surname (polite) |
| 先生 | xiānsheng | Mr. |
| 开头 | kāitóu | to start with |
| 手机 | shǒujī | mobile phone |
| 安排 | ānpái | to arrange |
| 好了 | hǎo le | all set, done |
| 时间 | shíjiān | time |

**Gramática:** 喂 como saludo telefónico · 我就是 para confirmar identidad · 有空 para disponibilidad · 什么时候 para preguntar "cuándo" · 请 + Persona + Verbo para petición cortés a un tercero · 怎么称呼 para preguntar un nombre cortésmente · Verbo + 懂 como complemento de resultado (comprensión) · Verbo + 错 como complemento de resultado (error) · 以后 ("después de [un momento]") · 已经...了 ("ya") · 贵姓 para preguntar cortésmente un apellido · complemento de resultado 好了 ("todo listo").

---

## 5.8 School & Classroom (Escuela y Salón de Clases)

**Descripción:** Hablar de lo que estudias, pedir objetos del salón de clases, y describir un día escolar.
**Lecciones:** Talking About Your Studies — HSK1 (Hablar de tus Estudios) · Classroom Objects & Requests — HSK1 (Objetos del Salón y Peticiones) · Asking About Schedules — HSK2 (Preguntar por Horarios) · Describing a Typical School Day — HSK2 (Describir un Día Escolar Típico)
**Nivel HSK:** 1, 1, 2, 2 — el primer escenario de nivel mixto del capítulo

| Chino | Pinyin | Inglés |
|---|---|---|
| 学校 | xuéxiào | school |
| 大学 | dàxué | university |
| 上学 | shàngxué | to attend school |
| 专业 | zhuānyè | major, field of study |
| 历史 | lìshǐ | history |
| 年级 | niánjí | grade, year (of study) |
| 同学 | tóngxué | classmate |
| 图书馆 | túshūguǎn | library |
| 学习 | xuéxí | to study |
| 真的 | zhēn de | really |
| 借 | jiè | to borrow, to lend |
| 笔 | bǐ | pen |
| 本子 | běnzi | notebook |
| 黑板 | hēibǎn | blackboard |
| 作业 | zuòyè | homework |
| 清楚 | qīngchu | clear |
| 书 | shū | book |
| 拿 | ná | to take, to hold |
| 互相 | hùxiāng | each other, mutually |
| 帮助 | bāngzhù | to help |
| 课 | kè | class, lesson |
| 开始 | kāishǐ | to start |
| 下课 | xiàkè | class ends |
| 节 | jié | measure word for classes/lessons |
| 星期 | xīngqī | week, day of the week |
| 次 | cì | time(s), occurrence |
| 下午 | xiàwǔ | afternoon |
| 迟到 | chídào | to be late |
| 请问 | qǐngwèn | excuse me, may I ask |
| 那 | nà | then, in that case |
| 先 | xiān | first |
| 然后 | ránhòu | then, afterward |
| 最后 | zuìhòu | finally, in the end |
| 中午 | zhōngwǔ | noon |
| 食堂 | shítáng | cafeteria |
| 回家 | huí jiā | go home |
| 做完 | zuò wán | to finish doing |
| 晚上 | wǎnshang | evening |
| 充实 | chōngshí | fulfilling, full (of a day) |
| 不过 | búguò | however |

**Gramática:** 在 + lugar + verbo · 几 para números pequeños en preguntas · 也 ("también") · 可以 para pedir permiso · 了 para un cambio de estado · 之间 ("entre") · 几点 para preguntar la hora · 次 como medidor de frecuencia · 那 ("entonces") · 先...然后...最后 para secuenciar · 了 para acciones completadas · 还没有 ("todavía no").

---

## 5.9 Hobbies & Free Time (Pasatiempos y Tiempo Libre)

**Descripción:** Hablar de tus pasatiempos, deportes, y qué te gusta hacer en tu tiempo libre.
**Lecciones:** Talking About Hobbies — HSK1 (Hablar de Pasatiempos) · Sports and Activities — HSK2 (Deportes y Actividades) · Music, Movies & Books — HSK2 (Música, Películas y Libros) · Comparing Free Time Preferences — HSK2 (Comparar Preferencias de Tiempo Libre)
**Nivel HSK:** 1, 2, 2, 2

| Chino | Pinyin | Inglés |
|---|---|---|
| 爱好 | àihào | hobby |
| 画画儿 | huàhuàr | to draw/paint |
| 唱歌 | chànggē | to sing |
| 多久 | duō jiǔ | how long, how often |
| 常常 | chángcháng | often |
| 几乎 | jīhū | almost |
| 小时候 | xiǎoshíhou | childhood, when young |
| 机会 | jīhuì | chance, opportunity |
| 画 | huà | painting, drawing |
| 下次 | xiàcì | next time |
| 打篮球 | dǎ lánqiú | to play basketball |
| 得 | de | particle linking a verb to how it's done |
| 怎么样 | zěnmeyàng | how (is it), how about |
| 周末 | zhōumò | weekend |
| 运动 | yùndòng | sport, to exercise |
| 跑步 | pǎobù | to run, jogging |
| 游泳 | yóuyǒng | to swim |
| 精神 | jīngshen | energy, spirit |
| 除了 | chúle | besides, except |
| 没关系 | méi guānxi | it's okay, no problem |
| 电影 | diànyǐng | movie |
| 过 | guò | particle marking past experience |
| 觉得 | juéde | to feel, to think |
| 推荐 | tuījiàn | to recommend |
| 故事 | gùshi | story |
| 小说 | xiǎoshuō | novel |
| 音乐 | yīnyuè | music |
| 歌 | gē | song |
| 首 | shǒu | measure word for songs/poems |
| 当然 | dāngrán | of course |
| 比 | bǐ | compared to, than |
| 安静 | ānjìng | quiet |
| 跟 | gēn | with, and (comparing) |
| 一样 | yíyàng | same, alike |
| 比较 | bǐjiào | relatively, comparatively |
| 累 | lèi | tired |
| 那么 | nàme | so, that (degree) |
| 重要 | zhòngyào | important |
| 对方 | duìfāng | the other party/person |
| 主意 | zhǔyi | idea |

**Gramática:** 平时 ("normalmente") · 从...就 ("desde entonces") · 有机会 ("cuando haya oportunidad") · verbo + 得 + adverbio/adjetivo para describir cómo · 除了...还 ("además de...también") · 让 ("hacer que alguien sienta/haga") · 过 para experiencia pasada · 觉得 para opiniones · 首 como medidor de canciones · A 比 B + adjetivo para comparación · A 没有 B 那么 + adjetivo para comparación negativa · 跟...不一样 ("diferente de").

---

## 5.10 Body & Feeling Unwell — Basics (Cuerpo y Malestar Básico)

**Descripción:** Nombrar partes básicas del cuerpo, describir síntomas simples, y tener una primera visita a la farmacia.
**Lecciones:** Parts of the Body — HSK1 (Partes del Cuerpo) · Simple Symptoms — HSK2 (Síntomas Simples) · Basic Pharmacy Visit — HSK2 (Visita Básica a la Farmacia) · Giving Simple Advice — HSK2 (Dar Consejos Simples)
**Nivel HSK:** 1, 2, 2, 2

| Chino | Pinyin | Inglés |
|---|---|---|
| 头 | tóu | head |
| 疼 | téng | to hurt, painful |
| 肚子 | dùzi | stomach, belly |
| 眼睛 | yǎnjing | eyes |
| 手 | shǒu | hand |
| 抖 | dǒu | to shake, tremble |
| 脚 | jiǎo | foot |
| 应该 | yīnggāi | should |
| 休息 | xiūxi | to rest |
| 关心 | guānxīn | care, concern |
| 咳嗽 | késou | to cough |
| 嗓子 | sǎngzi | throat |
| 发烧 | fāshāo | fever |
| 身体 | shēntǐ | body, health |
| 热 | rè | hot |
| 症状 | zhèngzhuàng | symptom |
| 看医生 | kàn yīshēng | to see a doctor |
| 喝水 | hē shuǐ | to drink water |
| 提醒 | tíxǐng | to remind |
| 好像 | hǎoxiàng | seems like |
| 帮助 | bāngzhù | help |
| 药 | yào | medicine |
| 对...有效 | duì...yǒuxiào | effective for... |
| 饭后 | fàn hòu | after meals |
| 副作用 | fùzuòyòng | side effect |
| 困 | kùn | drowsy, sleepy |
| 如果 | rúguǒ | if |
| 医院 | yīyuàn | hospital |
| 明白 | míngbai | to understand |
| 可能 | kěnéng | maybe, possibly |
| 脸色 | liǎnsè | complexion, facial color |
| 最好 | zuìhǎo | had best, ideally |
| 睡觉 | shuìjiào | to sleep |
| 知道 | zhīdào | to know |
| 健康 | jiànkāng | health, healthy |
| 咖啡 | kāfēi | coffee |
| 听 | tīng | to listen, to heed |
| 要是 | yàoshi | if |
| 建议 | jiànyì | suggestion, advice |
| 没事 | méishì | it's nothing, I'm fine |

**Gramática:** 怎么了 ("¿qué te pasa?") · parte del cuerpo + 有点/不 + 疼 para síntomas · 应该 ("debería") · 多久了 para preguntar duración · 好像 ("parece que") · 之前 ("antes de") · 对...有效 ("efectivo para") · 如果...要 para condicionales simples · 可能会 para un resultado posible · 最好 ("lo mejor sería") · 别...了 ("deja de hacer") · 要是...就 para condicionales.

---

## 5.11 Money, Banking & Simple Transactions (Dinero, Banco y Transacciones Simples)

**Descripción:** Gestionar operaciones bancarias básicas: abrir una cuenta, usar un cajero automático, pagar recibos, y hablar de presupuestos.
**Lecciones:** At the Bank (En el Banco) · Using an ATM (Usar un Cajero Automático) · Paying Bills (Pagar Recibos) · Talking About Prices & Budgeting (Hablar de Precios y Presupuesto)
**Nivel HSK:** 2 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 银行 | yínháng | bank |
| 账户 | zhànghù | account |
| 开 | kāi | to open (an account) |
| 护照 | hùzhào | passport |
| 存 | cún | to deposit |
| 钱 | qián | money |
| 填 | tián | to fill out |
| 表 | biǎo | form |
| 银行卡 | yínhángkǎ | bank card |
| 业务 | yèwù | business, service (at a counter) |
| 机器 | jīqì | machine |
| 坏了 | huài le | broken |
| 插卡 | chā kǎ | to insert a card |
| 反应 | fǎnyìng | response, reaction |
| 旁边 | pángbiān | next to, beside |
| 取钱 | qǔ qián | to withdraw money |
| 输入 | shūrù | to enter, to input |
| 密码 | mìmǎ | password, PIN |
| 成功 | chénggōng | successful |
| 试试 | shìshi | to try |
| 付 | fù | to pay |
| 电费 | diànfèi | electricity fee |
| 账单 | zhàngdān | bill |
| 一共 | yígòng | in total |
| 刷卡 | shuākǎ | to pay by card |
| 手机支付 | shǒujī zhīfù | mobile payment |
| 扫 | sǎo | to scan |
| 二维码 | èrwéimǎ | QR code |
| 付款 | fùkuǎn | to make a payment |
| 收据 | shōujù | receipt |
| 花 | huā | to spend (money) |
| 大概 | dàgài | approximately |
| 房租 | fángzū | rent |
| 存钱 | cún qián | to save money |
| 习惯 | xíguàn | habit |
| 预算 | yùsuàn | budget |
| 算 | suàn | to calculate |
| 更多 | gèng duō | more (comparative) |
| 有用 | yǒuyòng | useful |
| 每个月 | měi gè yuè | every month |

**Gramática:** 想 + verbo ("me gustaría") · 多少 para preguntas abiertas de cantidad · 不需要了 ("ya no hace falta") · verbo + 了, 但是 para un contraste · reduplicación verbal (试试) · 就可以了 ("con eso basta") · 一共 para totales · 也可以 para ofrecer una alternativa · verbo + 好了 ("ya está hecho") · 花 + cantidad + verbo · 比...多了 para una diferencia grande · 有没有 para preguntas de sí/no sobre acciones.

*Nota de alineación verificada (Sección 10.3): 业务 es oficialmente HSK5, 反应 es HSK3, y 预算 es HSK7 — los tres muy por encima de las cuatro lecciones, etiquetadas `hskReference: 2`.*

---

## 5.12 Asking About Places & Opening Hours (Preguntar por Lugares y Horarios)

**Descripción:** Preguntar dónde están los lugares, cuándo abren, y describir tu vecindario usando puntos de referencia.
**Lecciones:** Asking Where Things Are — HSK1 (Preguntar Dónde Están las Cosas) · Opening and Closing Hours — HSK2 (Horarios de Apertura y Cierre) · Describing a Neighborhood — HSK2 (Describir un Vecindario) · Giving Directions with Landmarks — HSK2 (Dar Direcciones con Puntos de Referencia)
**Nivel HSK:** 1, 2, 2, 2

| Chino | Pinyin | Inglés |
|---|---|---|
| 邮局 | yóujú | post office |
| 前面 | qiánmiàn | in front, ahead |
| 远 | yuǎn | far |
| 分钟 | fēnzhōng | minute |
| 超市 | chāoshì | supermarket |
| 对面 | duìmiàn | across from |
| 方便 | fāngbiàn | convenient |
| 一带 | yídài | area, this general vicinity |
| 近 | jìn | close, near |
| 好运 | hǎoyùn | good luck |
| 开门 | kāimén | to open (a shop/place) |
| 关门 | guānmén | to close (a shop/place) |
| 早上 | zǎoshang | morning |
| 晚上 | wǎnshang | night, evening |
| 到 | dào | to, until |
| 时间 | shíjiān | time |
| 不一样 | bù yíyàng | different, not the same |
| 现在 | xiànzài | now |
| 着 | zhe | particle marking an ongoing state |
| 欢迎 | huānyíng | welcome |
| 小区 | xiǎoqū | residential neighborhood |
| 附近 | fùjìn | nearby |
| 公园 | gōngyuán | park |
| 噪音 | zàoyīn | noise |
| 交通 | jiāotōng | transportation, traffic |
| 地铁站 | dìtiězhàn | subway station |
| 地方 | dìfang | place |
| 唯一 | wéiyī | only, sole |
| 租金 | zūjīn | rent (amount) |
| 值得 | zhíde | worth it |
| 经过 | jīngguò | to pass by |
| 一直 | yìzhí | straight, continuously |
| 红绿灯 | hónglǜdēng | traffic light |
| 右转 | yòu zhuǎn | turn right |
| 左边 | zuǒbiān | left side |
| 好找 | hǎo zhǎo | easy to find |
| 多久 | duōjiǔ | how long |
| 明白 | míngbai | to understand |
| 这样 | zhèyàng | like this, this way |
| 火车站 | huǒchēzhàn | train station |

**Gramática:** 在 + lugar para ubicación · 走 + tiempo + 就到了 para distancia caminando · 这一带 ("esta zona") · 从...到 para un rango de tiempo · 着 para un estado en curso · 不过 para un contraste leve · 挺...的 ("bastante") · 听起来 ("suena a") · 唯一的问题是 ("el único problema es") · 从...到 + 怎么走 para pedir una ruta · 经过 para pasar por un punto de referencia · 就在...，很好找 para tranquilizar.

*Nota de alineación verificada (Sección 10.3): 唯一 es oficialmente HSK5, 租金 es HSK6, y 噪音 es HSK7 — muy por encima de la etiqueta HSK1-2 de este escenario. 值得 es HSK3, algo menos extremo.*

---

## 5.13 Opinions, Comparisons & Preferences (Opiniones, Comparaciones y Preferencias)

**Descripción:** Expresar gustos y disgustos, comparar dos cosas, estar de acuerdo o en desacuerdo, y explicar tus razones.
**Lecciones:** Likes and Dislikes — HSK2 (Gustos y Disgustos) · Comparing Two Things — HSK2 (Comparar Dos Cosas) · Agreeing and Disagreeing — HSK2 (Estar de Acuerdo y en Desacuerdo) · Giving Reasons — HSK3 (Dar Razones)
**Nivel HSK:** 2, 2, 2, 3

| Chino | Pinyin | Inglés |
|---|---|---|
| 最 | zuì | most |
| 季节 | jìjié | season |
| 秋天 | qiūtiān | autumn |
| 舒服 | shūfu | comfortable |
| 夏天 | xiàtiān | summer |
| 对...来说 | duì...lái shuō | as for..., for... |
| 想法 | xiǎngfǎ | way of thinking, opinion |
| 运动 | yùndòng | sport |
| 才 | cái | only then (would make sense) |
| 热 | rè | hot |
| 好吃 | hǎochī | delicious |
| 贵 | guì | expensive |
| 服务 | fúwù | service |
| 一样 | yíyàng | the same |
| 差不多 | chàbuduō | about the same, almost |
| 两家 | liǎng jiā | both places/shops |
| 不错 | búcuò | pretty good |
| 定 | dìng | to decide, to settle |
| 餐厅 | cāntīng | restaurant |
| 多少 | duōshǎo | how much |
| 计划 | jìhuà | plan |
| 同意 | tóngyì | to agree |
| 为什么 | wèishénme | why |
| 安排 | ānpái | to arrange |
| 道理 | dàolǐ | reason, sense |
| 愿意 | yuànyì | willing to |
| 意见 | yìjiàn | opinion |
| 重要 | zhòngyào | important |
| 原 | yuán | original |
| 按 | àn | according to |
| 因为 | yīnwèi | because |
| 所以 | suǒyǐ | so, therefore |
| 效率 | xiàolǜ | efficiency |
| 容易 | róngyì | easy |
| 虽然 | suīrán | although |
| 但是 | dànshì | but |
| 好处 | hǎochu | advantage, benefit |
| 有时候 | yǒushíhou | sometimes |
| 情况 | qíngkuàng | situation |
| 考试 | kǎoshì | exam |

**Gramática:** 最 para superlativos · 对...来说 ("desde la perspectiva de X") · 才对 ("eso tendría sentido") · A 比 B + adjetivo + cantidad para comparación exacta · 差不多一样 ("casi igual") · 没有...那么 + 吧 para una comparación negativa tentativa · 我不太同意 para desacuerdo cortés · 也有道理 para reconocer un punto válido · 按 + sustantivo + 来 ("según") · 因为...所以 para causa y efecto · 虽然...但是 para un contraste matizado · 看情况 ("depende").

*Nota de alineación verificada (Sección 10.3): 效率 es oficialmente HSK4, por encima de este escenario (HSK2-3). 好处, en cambio, resultó ser HSK2 — dentro del rango declarado, corrigiendo la lectura cualitativa original que lo señalaba como demasiado avanzado.*

---

## 5.14 Making Plans & Talking About Time (Hacer Planes y Hablar del Tiempo)

**Descripción:** Hablar de experiencias pasadas, planes futuros, cambios de planes, y contar una historia simple en orden.
**Lecciones:** Past Experiences — HSK2 (Experiencias Pasadas) · Future Plans — HSK3 (Planes Futuros) · Making and Changing Plans — HSK3 (Hacer y Cambiar Planes) · Telling a Simple Story — HSK3 (Contar una Historia Simple)
**Nivel HSK:** 2, 3, 3, 3 — el escenario de mayor nivel del capítulo

| Chino | Pinyin | Inglés |
|---|---|---|
| 去过 | qùguò | have been to (before) |
| 去年 | qùnián | last year |
| 烤鸭 | kǎoyā | roast duck |
| 还没 | hái méi | not yet |
| 餐厅 | cāntīng | restaurant |
| 真正 | zhēnzhèng | real, genuine |
| 味道 | wèidao | taste, flavor |
| 打算 | dǎsuàn | to plan to |
| 明年 | míngnián | next year |
| 推荐 | tuījiàn | to recommend |
| 毕业 | bìyè | to graduate |
| 要 | yào | will, going to |
| 城市 | chéngshì | city |
| 机会 | jīhuì | opportunity |
| 顺利 | shùnlì | smoothly |
| 找到 | zhǎodào | to find (successfully) |
| 厉害 | lìhai | amazing, impressive |
| 出发 | chūfā | to depart |
| 生活 | shēnghuó | life |
| 本来 | běnlái | originally |
| 说好 | shuō hǎo | to agree on (a plan) |
| 突然 | tūrán | suddenly |
| 改 | gǎi | to change |
| 合适 | héshì | suitable |
| 准时 | zhǔnshí | on time |
| 定 | dìng | to settle, to fix (a plan) |
| 变化 | biànhuà | change |
| 提前 | tíqián | in advance |
| 理解 | lǐjiě | understanding |
| 旅行 | lǚxíng | trip, to travel |
| 坐飞机 | zuò fēijī | to take a flight |
| 以前 | yǐqián | before, previously |
| 第一次 | dì yī cì | the first time |
| 礼物 | lǐwù | gift |
| 棒 | bàng | great, excellent |
| 再 | zài | again |
| 跟我说说 | gēn wǒ shuōshuo | tell me about |
| 这次 | zhè cì | this time |
| 非常 | fēicháng | extremely |

**Gramática:** 过 vs. 了 para referencia al pasado (experiencia vs. evento puntual completado) · 还没...过 ("todavía no...nunca") · 在...的 para describir dónde se hizo algo · 打算 vs. 要 vs. 会 para planes futuros (planear / decidido / predicción-promesa) · 应该会 para una predicción probable · 会 + verbo + 的 para una promesa tranquilizadora · 本来...还是 para verificar un plan original · 改到 para cambiar un plan a una nueva hora · 一定会的 para una confirmación firme · 先...然后...最后 para una secuencia narrativa completa · 第一次 + verbo (+过) ("la primera vez que...") · 再 + verbo + 一次 ("hacer X de nuevo").

---

# 6. Everyday Life — Los 17 Escenarios (HSK 3–4)

Everyday Life es el segundo capítulo del currículo: 17 escenarios repartidos en 7 dominios internos (ver Sección 3.3.1), 68 lecciones en total, que llevan al estudiante de la supervivencia básica de Foundations a la comunicación cotidiana real — restaurantes, hoteles, compras, transporte, amistades, salud y el entorno laboral. La mecánica de Comprensión y Expresión Oral es la misma descrita en la Sección 4.2 y en la nota de la Sección 5; lo que cambia es el vocabulario, la gramática y el contexto de cada escenario, detallados a continuación.

---

## 6.1 Restaurant (Restaurante)

**Descripción:** Aprender a pedir comida, preguntar por los ingredientes, expresar preferencias, y resolver problemas comunes.
**Lecciones:** Entering and Ordering (Entrar y Pedir) · Ingredients and Preferences (Ingredientes y Preferencias) · Requests and Problems (Peticiones y Problemas) · Payment and Conversation (Pago y Conversación)
**Nivel HSK:** 3 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 欢迎光临 | huānyíng guānglín | Welcome (to customers) |
| 几位 | jǐ wèi | how many people |
| 点菜 | diǎn cài | to order food |
| 宫保鸡丁 | Gōngbǎo Jīdīng | Kung Pao Chicken |
| 辣 | là | spicy |
| 清淡 | qīngdàn | light / mild (flavor) |
| 推荐 | tuījiàn | to recommend |
| 受欢迎 | shòu huānyíng | popular |
| 过敏 | guòmǐn | allergic |
| 花生 | huāshēng | peanut |
| 喜欢 | xǐhuan | to like |
| 香菜 | xiāngcài | cilantro |
| 筷子 | kuàizi | chopsticks |
| 麻烦 | máfan | to trouble (someone); troublesome |
| 弄错 | nòngcuò | to make a mistake, to get wrong |
| 换 | huàn | to change, to swap |
| 不好意思 | bùhǎoyìsi | excuse me; sorry (mild) |
| 抱歉 | bàoqiàn | to apologize, sorry |
| 买单 | mǎidān | to ask for the bill |
| 一共 | yígòng | in total |
| 刷信用卡 | shuā xìnyòngkǎ | to pay by credit card |
| 手机支付 | shǒujī zhīfù | mobile payment |
| 分开付 | fēnkāi fù | to split the bill |
| 满意 | mǎnyì | satisfied |

**Gramática:** 我要... para pedir algo · A不A para preguntas de sí/no · 对...过敏 para declarar una alergia · (不)喜欢 + Verbo/Sustantivo · 麻烦你... para introducir una petición cortés · 好像... para suavizar una observación · 可以...吗？ para pedir permiso · 也可以... para ofrecer una alternativa.

*Nota de alineación verificada (Sección 10.6): 喜欢 es oficialmente HSK1, reaparece aquí como vocabulario "nuevo" en una lección HSK3 — probable redundancia con Foundations.*

---

## 6.2 Hotel

**Descripción:** Aprender a hacer una reservación, hacer el check-in, preguntar por las instalaciones, reportar problemas en la habitación, y hacer el check-out.
**Lecciones:** Reservation and Check-In (Reservación y Check-In) · Facilities and Services (Instalaciones y Servicios) · Reporting Problems (Reportar Problemas) · Extending and Checking Out (Extender la Estancia y Check-Out)
**Nivel HSK:** 3 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 预订 | yùdìng | to reserve, to book |
| 双人房 | shuāngrénfáng | double room |
| 护照 | hùzhào | passport |
| 房卡 | fángkǎ | room key card |
| 免费 | miǎnfèi | free (of charge) |
| 电梯 | diàntī | elevator |
| 健身房 | jiànshēnfáng | gym |
| 密码 | mìmǎ | password |
| 出租车 | chūzūchē | taxi |
| 叫醒服务 | jiàoxǐng fúwù | wake-up call service |
| 开放 | kāifàng | to be open (of a facility) |
| 安排 | ānpái | to arrange |
| 空调 | kōngtiáo | air conditioner |
| 坏了 | huài le | broken |
| 维修 | wéixiū | to repair |
| 换房间 | huàn fángjiān | to change rooms |
| 行李 | xíngli | luggage |
| 抱歉 | bàoqiàn | to apologize, sorry |
| 续住 | xùzhù | to extend one's stay |
| 空 | kòng | vacant, available |
| 退房 | tuìfáng | to check out |
| 客房服务 | kèfáng fúwù | room service |
| 账单 | zhàngdān | bill |
| 收据 | shōujù | receipt |

**Gramática:** 我姓... para dar cortésmente el apellido · 从...到... para un rango de tiempo/lugar · 可以帮我...吗？ para pedir un favor · 需要 + Verbo/Sustantivo · ...坏了 para reportar algo roto · 如果..., 我们可以... para ofrecer una solución condicional · 多 + Verbo + 一 + Medidor ("uno más") · ...前 para expresar un plazo.

---

## 6.3 Shopping (Compras)

**Descripción:** Aprender a encontrar un producto, comparar opciones, verificar tallas y colores, y completar una compra.
**Lecciones:** Finding a Product (Encontrar un Producto) · Price and Comparison (Precio y Comparación) · Size, Color, and Testing (Talla, Color y Probarse) · Payment, Exchange, and Return (Pago, Cambio y Devolución)
**Nivel HSK:** 3 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 外套 | wàitào | jacket, coat |
| 款 | kuǎn | style |
| 区域 | qūyù | section, area |
| 架子 | jiàzi | rack, shelf |
| 材质 | cáizhì | material |
| 棉 | mián | cotton |
| 便宜 | piányi | cheap |
| 区别 | qūbié | difference |
| 纯棉 | chúnmián | pure cotton |
| 暖和 | nuǎnhuo | warm |
| 打折 | dǎzhé | to discount |
| 更 | gèng | even more |
| 大一号 | dà yí hào | one size bigger |
| 试穿 | shìchuān | to try on |
| 试衣间 | shìyījiān | fitting room |
| 紧 | jǐn | tight |
| 合适 | héshì | to fit, suitable |
| 深蓝色 | shēnlánsè | dark blue |
| 收据 | shōujù | receipt |
| 换货 | huànhuò | to exchange goods |
| 退货 | tuìhuò | to return goods |
| 凭 | píng | based on, with (as proof) |
| 拉链 | lāliàn | zipper |
| 处理 | chǔlǐ | to handle, to deal with |

**Gramática:** 你们有卖...吗？ para preguntar si una tienda vende algo · 比较 + Adjetivo ("relativamente") · A比B + Adjetivo para comparar · 打 + Número + 折 para descuentos · 有点 + Adjetivo (negativo leve) · 正 + Adjetivo para enfatizar que algo es exactamente correcto · 凭 + Sustantivo + 可以... para indicar qué comprobante autoriza algo · 如果..., 可以...吗？ para preguntar sobre una política condicional.

*Nota de alineación verificada (Sección 10.6): 凭 ("con base en, como comprobante") es oficialmente HSK5, dos niveles por encima de este escenario (HSK3).*

---

## 6.4 Getting Around (Moverse por la Ciudad)

**Descripción:** Moverse en taxi, autobús y metro, pedir direcciones, y reservar boletos de viaje.
**Lecciones:** Taking a Taxi — HSK2 (Tomar un Taxi) · Public Transport: Bus & Subway — HSK2 (Transporte Público: Autobús y Metro) · Asking for Directions in the City — HSK3 (Pedir Direcciones en la Ciudad) · Booking Travel — HSK3 (Reservar un Viaje)
**Nivel HSK:** 2, 2, 3, 3

| Chino | Pinyin | Inglés |
|---|---|---|
| 师傅 | shīfu | sir, master (address for a driver/worker) |
| 火车站 | huǒchēzhàn | train station |
| 上车 | shàngchē | get in a vehicle |
| 堵车 | dǔchē | traffic jam |
| 麻烦 | máfan | trouble, please (polite request) |
| 赶 | gǎn | to rush, to catch |
| 尽量 | jǐnliàng | to try one's best |
| 打表 | dǎbiǎo | use the meter |
| 左右 | zuǒyòu | approximately |
| 一共 | yígòng | in total |
| 路 | lù | bus route number |
| 车 | chē | vehicle, bus |
| 地铁 | dìtiě | subway |
| 线 | xiàn | line |
| 换乘 | huànchéng | to transfer |
| 站 | zhàn | stop, station |
| 广场 | guǎngchǎng | square (public space) |
| 感谢 | gǎnxiè | to thank |
| 帮忙 | bāngmáng | to help |
| 玩 | wán | to play, have fun |
| 打扰 | dǎrǎo | to disturb, excuse me |
| 邮局 | yóujú | post office |
| 路口 | lùkǒu | intersection |
| 红绿灯 | hónglǜdēng | traffic light |
| 拐 | guǎi | to turn |
| 拐弯 | guǎiwān | to turn a corner |
| 看到 | kàndào | to see |
| 复杂 | fùzá | complicated |
| 路线 | lùxiàn | route |
| 记不住 | jì bú zhù | can't remember |
| 订 | dìng | to book, reserve |
| 火车票 | huǒchēpiào | train ticket |
| 班 | bān | scheduled trip |
| 高铁 | gāotiě | high-speed rail |
| 二等座 | èrděng zuò | second class seat |
| 一等座 | yīděng zuò | first class seat |
| 张 | zhāng | measure word for tickets |
| 车票 | chēpiào | ticket |
| 旅途 | lǚtú | journey |
| 出发 | chūfā | to depart |

**Gramática:** ...的话 para condicionales · 要 + Verbo para indicar destino · 左右 para aproximación · 坐 + Vehículo/Ruta para tomar transporte · 在 + Lugar + Verbo · Número + 站 para contar paradas · 从...走 para el punto de partida · 第 + Número para ordinales · Verbo + 得住/不住 para capacidad/retención (p. ej. 记不住) · 哪天 para preguntar qué día · A还是B para elegir entre opciones · 祝 + Persona + Deseo.

*Nota de alineación verificada (Sección 10.6): las lecciones 1-2 están etiquetadas HSK2, pero 尽量 y 左右 son oficialmente HSK3, y 打表 (un coloquialismo específico de taxis) no aparece en ningún nivel de la lista oficial — el desajuste más claro de todo el capítulo entre el nivel declarado y el contenido real.*

---

## 6.5 Making Friends (Hacer Amigos)

**Descripción:** Conocer gente nueva socialmente, hacer plática casual, invitar a alguien a salir, e intercambiar información de contacto.
**Lecciones:** Introducing Yourself Socially (Presentarte Socialmente) · Small Talk & Hobbies (Plática Casual y Pasatiempos) · Making Plans / Inviting Someone (Hacer Planes / Invitar a Alguien) · Exchanging Contact Info (Intercambiar Información de Contacto)
**Nivel HSK:** 3 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 好像 | hǎoxiàng | seems like |
| 软件工程师 | ruǎnjiàn gōngchéngshī | software engineer |
| 自由撰稿人 | zìyóu zhuàngǎorén | freelance writer |
| 文章 | wénzhāng | article |
| 有意思 | yǒu yìsi | interesting |
| 主要 | zhǔyào | mainly |
| 旅行 | lǚxíng | to travel |
| 美食 | měishí | cuisine, fine food |
| 共同 | gòngtóng | common, shared |
| 爱好 | àihào | hobby |
| 摄影 | shèyǐng | photography |
| 巧 | qiǎo | coincidental |
| 感兴趣 | gǎn xìngqù | to be interested in |
| 拍 | pāi | to shoot, take a photo |
| 风景 | fēngjǐng | landscape |
| 更 | gèng | more |
| 人像 | rénxiàng | portrait |
| 相机 | xiàngjī | camera |
| 单反 | dānfǎn | DSLR camera |
| 一言为定 | yìyánwéidìng | it's a deal (idiom) |
| 要不要 | yào bu yào | how about, want or not |
| 部 | bù | measure word for films |
| 科幻片 | kēhuànpiàn | sci-fi movie |
| 评价 | píngjià | review, rating |
| 场次 | chǎngcì | showtime |
| 电影院 | diànyǐngyuàn | cinema |
| 门口 | ménkǒu | entrance |
| 提前 | tíqián | in advance, early |
| 到时候 | dào shíhou | when the time comes |
| 新 | xīn | new |
| 加 | jiā | to add |
| 微信 | wēixìn | WeChat |
| 扫 | sǎo | to scan |
| 二维码 | èrwéimǎ | QR code |
| 约 | yuē | to arrange, schedule |
| 保持 | bǎochí | to maintain |
| 联系 | liánxì | contact |
| 账号 | zhànghào | account |
| 关注 | guānzhù | to follow |
| 直接 | zhíjiē | directly |

**Gramática:** 是...的 para enfatizar un detalle · 什么样的 + Sustantivo ("qué tipo de") · 好像 para una impresión tentativa · 对...感兴趣 para interés en algo · 更 comparativo · 一起 + Verbo para una actividad conjunta · 要不要 para una sugerencia casual · 部 como medidor de películas · 提前 ("con anticipación") · Verbo + 上 como complemento de logro · 直接 ("directamente") · 会...的 como promesa social tranquilizadora.

*Nota de alineación verificada (Sección 10.6): 自由撰稿人 ("escritor freelance") y 一言为定 (un modismo de cuatro caracteres) no aparecen en ningún nivel de la lista oficial HSK 1-9 — no son "HSK5", están completamente fuera del marco oficial.*

---

## 6.6 Health (Salud)

**Descripción:** Describir síntomas en la farmacia, visitar al médico, manejar una emergencia, y lidiar con seguros y citas de seguimiento.
**Lecciones:** Pharmacy — Describing Symptoms — HSK3 (Farmacia — Describir Síntomas) · Doctor's Visit — HSK3 (Visita al Médico) · Emergency Situations — HSK4 (Situaciones de Emergencia) · Follow-up & Insurance — HSK4 (Seguimiento y Seguro)
**Nivel HSK:** 3, 3, 4, 4

| Chino | Pinyin | Inglés |
|---|---|---|
| 感冒药 | gǎnmào yào | cold medicine |
| 症状 | zhèngzhuàng | symptom |
| 咳嗽 | késou | to cough |
| 开始 | kāishǐ | to start |
| 饭后 | fàn hòu | after meals |
| 副作用 | fùzuòyòng | side effect |
| 困 | kùn | drowsy |
| 照顾 | zhàogù | to take care of |
| 自己 | zìjǐ | oneself |
| 发烧 | fāshāo | fever |
| 头疼 | tóuténg | headache |
| 恶心 | ěxin | nauseous |
| 药物 | yàowù | medication |
| 过敏 | guòmǐn | allergic |
| 青霉素 | qīngméisù | penicillin |
| 检查 | jiǎnchá | examination |
| 严重 | yánzhòng | serious |
| 压力 | yālì | stress, pressure |
| 开 | kāi | to prescribe |
| 药 | yào | medicine |
| 救命 | jiùmìng | help, save my life |
| 晕倒 | yūndǎo | to faint |
| 冷静 | lěngjìng | calm |
| 救护车 | jiùhùchē | ambulance |
| 意识 | yìshí | consciousness |
| 脸色 | liǎnsè | complexion, facial color |
| 躺 | tǎng | to lie down |
| 挂电话 | guà diànhuà | hang up the phone |
| 担心 | dānxīn | to worry |
| 陪 | péi | to accompany |
| 复诊 | fùzhěn | follow-up visit |
| 保险卡 | bǎoxiǎnkǎ | insurance card |
| 报销 | bàoxiāo | to reimburse |
| 费用 | fèiyòng | cost, fee |
| 发票 | fāpiào | invoice, receipt |
| 取药 | qǔ yào | pick up medicine |
| 才 | cái | only then |
| 位 | wèi | polite measure word for people |
| 病人 | bìngrén | patient |
| 等 | děng | to wait |

**Gramática:** 从...开始的 para el inicio de un síntoma/evento · frecuencia para dosis (Periodo + Verbo + Número + 次) · 可能会 para un efecto posible e incierto · 对...过敏 (registro médico) · 给 + Persona + Verbo para hacer algo en nombre de alguien · 就会 ("entonces sucederá") · 让 + Persona + Verbo (causativo) · Tiempo + 内 ("dentro de") · 不要 para una orden negativa urgente · Verbo + 完 como complemento de finalización · ...以后才能... ("solo después de X se puede Y") · 位 como medidor cortés para personas.

*Nota de alineación verificada (Sección 10.6): 青霉素 ("penicilina") y 复诊 ("cita de seguimiento") no aparecen en ningún nivel de la lista oficial — terminología médica especializada fuera del marco HSK. 报销 ("reembolsar") sí aparece, pero como HSK7 — tres niveles por encima de la lección HSK4 donde se enseña. 等 ("esperar"), en cambio, es oficialmente HSK1, reintroducido aquí como "nuevo" en una lección HSK4.*

---

## 6.7 Work & Office (Trabajo y Oficina)

**Descripción:** Presentarte profesionalmente, participar en una reunión simple, pedir tiempo libre, y hacer plática casual en el trabajo.
**Lecciones:** Introducing Yourself Professionally (Presentarte Profesionalmente) · Simple Meetings (Reuniones Simples) · Asking for Time Off (Pedir Tiempo Libre) · Workplace Small Talk (Plática Casual en el Trabajo)
**Nivel HSK:** 4 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 产品经理 | chǎnpǐn jīnglǐ | product manager |
| 市场部 | shìchǎngbù | marketing department |
| 公司 | gōngsī | company |
| 了解 | liǎojiě | to understand, know about |
| 随时 | suíshí | anytime |
| 负责 | fùzé | to be in charge of |
| 开发 | kāifā | development |
| 挑战性 | tiǎozhànxìng | challenging |
| 确实 | quèshí | indeed |
| 顺利 | shùnlì | smoothly |
| 开会 | kāihuì | to have a meeting |
| 议题 | yìtí | agenda item |
| 讨论 | tǎolùn | to discuss |
| 推广 | tuīguǎng | promotion |
| 社交媒体 | shèjiāo méitǐ | social media |
| 宣传 | xuānchuán | to publicize |
| 按照 | ànzhào | according to |
| 调研 | diàoyán | research |
| 交给 | jiāo gěi | to hand over to |
| 汇报 | huìbào | to report |
| 请假 | qǐngjià | to ask for leave |
| 原因 | yuányīn | reason |
| 医院 | yīyuàn | hospital |
| 填 | tián | to fill out |
| 请假单 | qǐngjiàdān | leave form |
| 代班 | dàibān | to cover a shift |
| 考虑 | kǎolǜ | to consider |
| 周到 | zhōudào | thoughtful |
| 理解 | lǐjiě | understanding |
| 完全 | wánquán | completely |
| 加班 | jiābān | to work overtime |
| 项目 | xiàngmù | project |
| 结束 | jiéshù | to end |
| 计划 | jìhuà | plan |
| 休假 | xiūjià | to take vacation |
| 放松 | fàngsōng | to relax |
| 虽然 | suīrán | although |
| 接受 | jiēshòu | to accept |
| 注意 | zhùyì | to pay attention to |
| 身体 | shēntǐ | body, health |

**Gramática:** 负责 ("estar a cargo de") · 对...了解 ("saber sobre X") · 随时 ("en cualquier momento") · 按照 ("según") · 交给 + Persona + 负责 para delegar una tarea · 具体怎么做 para llevar una idea vaga hacia lo concreto · 请 + Duración + 假 para pedir una cantidad específica de días libres · 因为 para justificación formal · Verbo + 得 + Adjetivo (complemento de grado) · 虽然...但是... · 快...了 ("está por suceder") · 应该 como consejo suave en el entorno laboral.

*Nota de alineación verificada (Sección 10.6): 调研 es oficialmente HSK6 y 周到 es HSK7 — ambos muy por encima de la etiqueta HSK4 del escenario. 挑战性 no aparece en la lista oficial. 汇报, en cambio, resultó ser exactamente HSK4 — dentro del rango, corrigiendo la lectura cualitativa original que lo agrupaba con los demás como "elevado". **Importante — ver Sección 10.9**: estas palabras son reales, pero no representativas del escenario completo — el desglose por dominio muestra que el 70.6% del vocabulario de Work & Office está, en realidad, por debajo de HSK4, no por encima.*

---

## 6.8 Grocery Shopping & Meal Planning (Supermercado y Planificación de Comidas)

**Descripción:** Hacer una lista de compras, comprar víveres, comparar productos frescos, y planear las comidas de la semana.
**Lecciones:** Making a Shopping List — HSK2 (Hacer una Lista de Compras) · At the Grocery Store — HSK2 (En el Supermercado) · Comparing Fresh Produce — HSK3 (Comparar Productos Frescos) · Planning a Week of Meals — HSK3 (Planear las Comidas de la Semana)
**Nivel HSK:** 2, 2, 3, 3

| Chino | Pinyin | Inglés |
|---|---|---|
| 鸡蛋 | jīdàn | egg |
| 牛奶 | niúnǎi | milk |
| 不用 | búyòng | no need to |
| 写下来 | xiě xiàlái | to write down |
| 蔬菜 | shūcài | vegetables |
| 水果 | shuǐguǒ | fruit |
| 缺 | quē | to be missing, lacking |
| 西红柿 | xīhóngshì | tomato |
| 土豆 | tǔdòu | potato |
| 出发 | chūfā | to depart, set out |
| 米 | mǐ | rice |
| 区 | qū | section, area |
| 斤 | jīn | jin (500g unit) |
| 新鲜 | xīnxiān | fresh |
| 刚 | gāng | just (recently) |
| 到 | dào | to arrive |
| 别的 | biéde | other, something else |
| 两 | liǎng | two (of a measure) |
| 价钱 | jiàqián | price |
| 一共 | yígòng | in total |
| 种 | zhǒng | kind, type |
| 苹果 | píngguǒ | apple |
| 区别 | qūbié | difference |
| 甜 | tián | sweet |
| 酸 | suān | sour |
| 更 | gèng | even more |
| 还是 | háishi | still, after all |
| 孩子 | háizi | child |
| 装 | zhuāng | to pack, load |
| 帮 | bāng | to help |
| 鸡肉 | jīròu | chicken (meat) |
| 鱼 | yú | fish |
| 改成 | gǎichéng | to change to |
| 豆腐 | dòufu | tofu |
| 做饭 | zuòfàn | to cook |
| 轻松 | qīngsōng | relaxed, easy |
| 计划 | jìhuà | plan |
| 这周 | zhè zhōu | this week |
| 改 | gǎi | to change |
| 定 | dìng | to settle, decide |

**Gramática:** 把 para manejar un objeto específico · 不用 ("no hace falta") · 都...了 ("ya todos") · 一斤多少钱 para preguntar el precio por peso · 刚 + verbo + 的 para un evento recién sucedido · 两 vs. 二 antes de un medidor · 这种...那种 para comparar dos tipos · 还是 para una decisión final reconsiderada · 帮 + persona + verbo para ofrecer ayuda · 改成 ("cambiar a") · A + tarea, B + tarea, 怎么样？ para proponer una división de tareas · 就这么定了 para cerrar una decisión.

*Nota de alineación verificada (Sección 10.6): la lectura cualitativa original de esta nota era incorrecta. Verificado contra la lista oficial: 牛奶 y 水果 sí son HSK1 (redundantes con Foundations), pero 苹果 y 甜 son en realidad HSK3 (dentro del rango declarado de este escenario) y 酸 es HSK4 — ninguno de los dos últimos es una repetición de nivel básico como se afirmó originalmente.*

---

## 6.9 Coffee Shop & Casual Meetups (Cafetería y Encuentros Casuales)

**Descripción:** Pedir en una cafetería, encontrarte con un amigo, hacer plática mientras esperas, y sugerir dónde verse la próxima vez.
**Lecciones:** Ordering at a Coffee Shop — HSK2 (Pedir en la Cafetería) · Meeting a Friend for Coffee — HSK3 (Encontrarte con un Amigo) · Making Small Talk While Waiting — HSK3 (Plática Mientras Esperas) · Suggesting Where to Meet Next Time — HSK3 (Sugerir Dónde Verse la Próxima Vez)
**Nivel HSK:** 2, 3, 3, 3

| Chino | Pinyin | Inglés |
|---|---|---|
| 拿铁 | nátiě | latte |
| 大杯 | dà bēi | large size (drink) |
| 中杯 | zhōng bēi | medium size (drink) |
| 加糖 | jiā táng | to add sugar |
| 热的 | rè de | hot (drink) |
| 冰的 | bīng de | iced (drink) |
| 刷卡 | shuākǎ | to pay by card |
| 稍等 | shāo děng | please wait a moment |
| 杯 | bēi | measure word for cups/drinks |
| 咖啡师 | kāfēishī | barista |
| 好久不见 | hǎojiǔ bú jiàn | long time no see |
| 最近 | zuìjìn | recently |
| 换 | huàn | to change, switch |
| 同事 | tóngshì | colleague |
| 友好 | yǒuhǎo | friendly |
| 消息 | xiāoxi | news |
| 搬家 | bān jiā | to move house |
| 恭喜 | gōngxǐ | congratulations |
| 离 | lí | from, distance from |
| 方便 | fāngbiàn | convenient |
| 人多 | rén duō | crowded, many people |
| 等 | děng | to wait |
| 环境 | huánjìng | environment, atmosphere |
| 安静 | ānjìng | quiet |
| 刚才 | gāngcái | just now |
| 停 | tíng | to stop |
| 伞 | sǎn | umbrella |
| 快...了 | kuài...le | about to, soon |
| 纸巾 | zhǐjīn | tissue, napkin |
| 一会儿 | yíhuìr | a little while |
| 吵 | chǎo | noisy |
| 换个地方 | huàn gè dìfang | change places |
| 地铁站 | dìtiězhàn | subway station |
| 价钱 | jiàqián | price |
| 差不多 | chàbuduō | about the same |
| 地址 | dìzhǐ | address |
| 发 | fā | to send |
| 期待 | qīdài | to look forward to |
| 听起来 | tīng qǐlái | sounds like |
| 下次 | xiàcì | next time |

**Gramática:** A 还是 B para ofrecer dos opciones · 就可以了 ("con eso basta") · 热的 vs 冰的 con 的 nominalizador · 好久不见 como saludo · 要...了 para un evento futuro planeado · 离 + lugar + 近/远 para distancia · 刚才 para "hace un momento" · 快...了 para "está a punto de" · 还在 + verbo para una acción todavía en curso · 听起来 para reaccionar a información hablada · 跟...差不多 ("más o menos igual que") · 期待 ("esperar con ilusión").

---

## 6.10 Gym & Fitness Classes (Gimnasio y Clases de Ejercicio)

**Descripción:** Inscribirte en un gimnasio, preguntar por los horarios de clases, hablar de objetivos de condición física, y recuperarte de una lesión leve.
**Lecciones:** Signing Up at the Gym (Inscribirte en el Gimnasio) · Asking About Class Schedules (Preguntar por Horarios de Clases) · Talking About Fitness Goals (Hablar de Objetivos de Condición Física) · Recovering from a Minor Injury (Recuperarte de una Lesión Leve)
**Nivel HSK:** 3 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 办 | bàn | to handle, apply for |
| 健身卡 | jiànshēnkǎ | gym membership card |
| 选择 | xuǎnzé | choice, option |
| 半年 | bàn nián | half a year |
| 划算 | huásuàn | a good deal, worth it |
| 表格 | biǎogé | form |
| 付款 | fùkuǎn | to make a payment |
| 健身 | jiànshēn | to work out, fitness |
| 前台 | qiántái | front desk |
| 哪些 | nǎxiē | which (plural) |
| 课程 | kèchéng | class, course |
| 瑜伽 | yújiā | yoga |
| 拳击 | quánjī | boxing |
| 提前 | tíqián | in advance |
| 报名 | bàomíng | to sign up |
| 满 | mǎn | full |
| 位置 | wèizhi | spot, position |
| 教练 | jiàoliàn | trainer, coach |
| 瑜伽垫 | yújiā diàn | yoga mat |
| 会员 | huìyuán | member |
| 目标 | mùbiāo | goal |
| 变得 | biàn de | to become |
| 练 | liàn | to train, practice |
| 坚持 | jiānchí | to persist, stick with |
| 增加 | zēngjiā | to increase |
| 强度 | qiángdù | intensity |
| 着急 | zháojí | to worry, be anxious |
| 进步 | jìnbù | progress |
| 加油 | jiāyóu | keep it up, go for it |
| 相信 | xiāngxìn | to believe |
| 脚踝 | jiǎohuái | ankle |
| 弄伤 | nòngshāng | to injure (oneself) |
| 扭 | niǔ | to twist, sprain |
| 厉害 | lìhai | severe, intense |
| 冰敷 | bīngfū | to ice (an injury) |
| 小心 | xiǎoxīn | careful |
| 疼得厉害 | téng de lìhai | hurts a lot |
| 休息 | xiūxi | to rest |
| 如果 | rúguǒ | if |
| 要是 | yàoshi | if |

**Gramática:** 办 para trámites oficiales/formales · 哪些 para "cuáles" en plural · V + 好以后 ("una vez que X esté listo") · 每周 + días para un horario recurrente · V + 满了 + 就不能 para una condición de capacidad · 给 + persona + verbo para una petición directa · 变得 + adjetivo ("volverse") · 先...慢慢 para un enfoque gradual · 会 + verbo + 的 para una promesa confiada · 把 + parte del cuerpo + 弄伤 para describir una lesión · verbo + 得 + 厉害 para intensidad · 如果...就 vs. 要是...就 para condicionales (intercambiables en habla casual; 如果 algo más formal, 要是 más coloquial).

---

## 6.11 Renting an Apartment (Rentar un Departamento)

**Descripción:** Ver un departamento, preguntar por la renta y los servicios, negociar el contrato, y firmarlo.
**Lecciones:** Viewing an Apartment — HSK3 (Ver un Departamento) · Asking About Rent and Utilities — HSK3 (Preguntar por Renta y Servicios) · Negotiating the Lease — HSK3 (Negociar el Contrato) · Signing the Contract — HSK4 (Firmar el Contrato)
**Nivel HSK:** 3, 3, 3, 4

| Chino | Pinyin | Inglés |
|---|---|---|
| 房间 | fángjiān | room |
| 阳台 | yángtái | balcony |
| 电梯 | diàntī | elevator |
| 停车位 | tíngchēwèi | parking spot |
| 另外 | lìngwài | additionally, separately |
| 状态 | zhuàngtài | condition, state |
| 装修 | zhuāngxiū | to renovate |
| 光线 | guāngxiàn | natural light |
| 开灯 | kāidēng | to turn on a light |
| 中介 | zhōngjiè | real estate agent, agency |
| 房租 | fángzū | rent |
| 押金 | yājīn | deposit |
| 水电费 | shuǐdiànfèi | water and electricity fee |
| 包括 | bāokuò | to include |
| 交 | jiāo | to pay, hand over |
| 网费 | wǎngfèi | internet fee |
| 加起来 | jiā qǐlái | added together |
| 房东 | fángdōng | landlord |
| 自己 | zìjǐ | oneself |
| 多花 | duō huā | spend extra |
| 商量 | shāngliang | to discuss, negotiate |
| 签 | qiān | to sign |
| 少收 | shǎo shōu | to charge less |
| 养 | yǎng | to keep, raise (a pet) |
| 宠物 | chǒngwù | pet |
| 接受 | jiēshòu | to accept |
| 条件 | tiáojiàn | terms, conditions |
| 合同 | hétong | contract |
| 准备 | zhǔnbèi | to prepare |
| 多付 | duō fù | to pay extra |
| 条款 | tiáokuǎn | clause, term (of a contract) |
| 解约 | jiěyuē | to terminate a contract |
| 退还 | tuìhuán | to refund, return |
| 维修 | wéixiū | repair, maintenance |
| 人为 | rénwéi | man-made, caused by a person |
| 损坏 | sǔnhuài | damage |
| 承担 | chéngdān | to bear, take on (responsibility/cost) |
| 弄坏 | nònghuài | to break, damage (accidentally) |
| 签字 | qiānzì | to sign one's name |
| 租到 | zū dào | to successfully rent |

**Gramática:** 两室一厅 para describir la distribución · 带 ("viene con") · 刚 + verbo + 过 para un proceso recién terminado · 押一付三 para la convención común de depósito · 包括在...里 ("incluido en") · 加起来 ("sumado todo") · 可以商量 ("es negociable") · 如果...我可以 para una oferta condicional · 接受 + 条件 para aceptar términos · ...的话 para plantear un condicional · 由 + persona + verbo para asignar responsabilidad · 只要...就 para una condición suficiente.

*Nota de alineación verificada (Sección 10.6): 条款 y 人为 son oficialmente HSK7, no HSK5 como sugería la lectura cualitativa original — tres niveles por encima de esta lección HSK4. 解约 no aparece en ningún nivel de la lista oficial.*

---

## 6.12 Post Office & Mailing Packages (Correo y Envío de Paquetes)

**Descripción:** Enviar un paquete, elegir un método de envío, rastrear un paquete, y resolver un paquete extraviado.
**Lecciones:** Mailing a Package — HSK3 (Enviar un Paquete) · Choosing a Shipping Method — HSK3 (Elegir un Método de Envío) · Tracking a Package — HSK3 (Rastrear un Paquete) · Dealing with a Lost Package — HSK4 (Resolver un Paquete Extraviado)
**Nivel HSK:** 3, 3, 3, 4

| Chino | Pinyin | Inglés |
|---|---|---|
| 寄 | jì | to mail, send |
| 包裹 | bāoguǒ | package |
| 收件人 | shōujiànrén | recipient |
| 秤 | chèng | scale |
| 重量 | zhòngliàng | weight |
| 限制 | xiànzhì | limit |
| 超过 | chāoguò | to exceed |
| 公斤 | gōngjīn | kilogram |
| 单子 | dānzi | form, slip |
| 才 | cái | only (a small amount) |
| 邮寄 | yóujì | to mail, ship |
| 方式 | fāngshì | method, way |
| 普通 | pǔtōng | regular, ordinary |
| 快递 | kuàidì | express delivery |
| 第二天 | dì èr tiān | the next day |
| 差 | chà | to differ by |
| 着急 | zháojí | urgent, anxious |
| 选 | xuǎn | to choose |
| 大概 | dàgài | approximately |
| 需要 | xūyào | to need, require |
| 查 | chá | to check, look up |
| 快递单号 | kuàidì dānhào | tracking number |
| 运输 | yùnshū | transport, shipping |
| 途中 | tú zhōng | en route, on the way |
| 预计 | yùjì | expected, estimated |
| 送到 | sòngdào | to deliver (arrive) |
| 客服 | kèfú | customer service |
| 告诉 | gàosu | to tell |
| 其他 | qítā | other |
| 现在 | xiànzài | now |
| 一直 | yìzhí | continuously, all along |
| 系统 | xìtǒng | system |
| 显示 | xiǎnshì | to show, display |
| 弄丢 | nòngdiū | to lose (something) |
| 赔偿 | péicháng | compensation |
| 确认 | quèrèn | to confirm |
| 全额退款 | quán'é tuìkuǎn | full refund |
| 工作日 | gōngzuòrì | business day |
| 解决 | jiějué | to resolve |
| 不便 | búbiàn | inconvenience |

**Gramática:** 寄到 + lugar para un destino de envío · 不能超过 para un límite máximo · 才 para "solo" (enfatizando poca cantidad) · 有几种...方式 para preguntar por opciones · 差 + cantidad para una diferencia de precio/cantidad · 不着急 ("no es urgente") · 在...途中 ("en camino") · 预计 + tiempo + verbo para una estimación · 请告诉我 para pedir información cortésmente · 一直 + negativo para "todavía no, todo este tiempo" · 如果 + condición, 我们会 para una promesa condicional · 尽全力 + verbo ("hacer todo lo posible por").

---

## 6.13 Social Events & Small Talk with Strangers (Eventos Sociales y Charla con Desconocidos)

**Descripción:** Presentarte en una fiesta, encontrar puntos en común, intercambiar cumplidos, y terminar una conversación cortésmente.
**Lecciones:** Introducing Yourself at a Party (Presentarte en una Fiesta) · Finding Common Ground (Encontrar Puntos en Común) · Exchanging Compliments (Intercambiar Cumplidos) · Politely Ending a Conversation (Terminar una Conversación Cortésmente)
**Nivel HSK:** 3 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 主人 | zhǔrén | host |
| 大学同学 | dàxué tóngxué | college classmate |
| 同事 | tóngshì | colleague |
| 原来 | yuánlái | so, it turns out |
| 软件开发 | ruǎnjiàn kāifā | software development |
| 感兴趣 | gǎn xìngqù | to be interested |
| 设计 | shèjì | design |
| 公司 | gōngsī | company |
| 认识 | rènshi | to know, meet |
| 怎么 | zěnme | how |
| 爬山 | páshān | to hike, climb a mountain |
| 巧 | qiǎo | coincidental |
| 城外 | chéng wài | outside the city |
| 座 | zuò | measure word for mountains/buildings |
| 风景 | fēngjǐng | scenery |
| 特别是 | tèbié shì | especially |
| 主意 | zhǔyi | idea |
| 微信 | wēixìn | WeChat |
| 约 | yuē | to schedule, arrange |
| 方便 | fāngbiàn | convenient |
| 裙子 | qúnzi | dress, skirt |
| 哪里哪里 | nǎlǐ nǎlǐ | oh, it's nothing (modest reply) |
| 眼光 | yǎnguāng | taste, judgment |
| 过奖 | guòjiǎng | you flatter me |
| 发型 | fàxíng | hairstyle |
| 特别 | tèbié | special, unique |
| 夸奖 | kuājiǎng | compliment, praise |
| 逛街 | guàngjiē | to go shopping, stroll around |
| 好看 | hǎokàn | pretty, good-looking |
| 以后 | yǐhòu | in the future, later |
| 聊天 | liáotiān | to chat |
| 该 | gāi | should, ought to |
| 打招呼 | dǎ zhāohu | to say hi, greet |
| 保持联系 | bǎochí liánxì | to stay in touch |
| 扫 | sǎo | to scan |
| 二维码 | èrwéimǎ | QR code |
| 下次 | xiàcì | next time |
| 一定 | yídìng | definitely, surely |
| 回头见 | huítóu jiàn | see you later |
| 玩得开心 | wán de kāixīn | have fun |

**Gramática:** 是怎么...的 para preguntar cómo llegó a ser algo · 原来是这样 ("ah, ya veo") · 是做...的 para describir una profesión · 太巧了 para reaccionar a una coincidencia · 特别是 para destacar un caso específico · 这样 + resultado para referirse a un plan · 哪里哪里 como respuesta modesta · 过奖了 ("me halagas") · 在哪儿买的 para preguntar dónde se compró algo · 该 + verbo + 了 ("ya es hora de") · 保持联系 como frase natural de despedida · 玩得开心 para desear que alguien la pase bien.

*Nota de alineación verificada (Sección 10.6): 认识 y 怎么 son oficialmente HSK1, y 公司 es HSK2 — los tres muy por debajo de esta lección HSK3, cuyo contenido realmente HSK3 está casi enteramente del lado gramatical.*

---

## 6.14 Weather, Plans & Rescheduling (Clima, Planes y Reprogramación)

**Descripción:** Hablar del clima, hacer planes, y reprogramarlos cuando las cosas cambian.
**Lecciones:** Checking the Weather Forecast — HSK3 (Revisar el Pronóstico) · Making Weather-Dependent Plans — HSK3 (Hacer Planes según el Clima) · Suggesting a Reschedule — HSK4 (Sugerir Reprogramar) · Confirming the New Plan — HSK4 (Confirmar el Nuevo Plan)
**Nivel HSK:** 3, 3, 4, 4

| Chino | Pinyin | Inglés |
|---|---|---|
| 天气预报 | tiānqì yùbào | weather forecast |
| 下雨 | xiàyǔ | to rain |
| 气温 | qìwēn | temperature |
| 度 | dù | degree |
| 外套 | wàitào | jacket, coat |
| 一直 | yìzhí | continuously, always |
| 转晴 | zhuǎn qíng | to clear up (weather) |
| 出门 | chūmén | to go out |
| 情况 | qíngkuàng | situation |
| 最好 | zuìhǎo | had better, best |
| 野餐 | yěcān | picnic |
| 要是 | yàoshi | if |
| 如果 | rúguǒ | if |
| 博物馆 | bówùguǎn | museum |
| 决定 | juédìng | to decide |
| 结果 | jiéguǒ | result |
| 发消息 | fā xiāoxi | to send a message |
| 希望 | xīwàng | to hope |
| 不管怎样 | bùguǎn zěnyàng | regardless, either way |
| 好玩 | hǎowán | fun |
| 恐怕 | kǒngpà | I'm afraid (that) |
| 临时 | línshí | temporarily, at the last minute |
| 通知 | tōngzhī | to notify |
| 加班 | jiābān | to work overtime |
| 添麻烦 | tiān máfan | to cause trouble |
| 正常 | zhèngcháng | normal |
| 提前 | tíqián | in advance, ahead of time |
| 提醒 | tíxǐng | to remind |
| 要紧 | yàojǐn | important, urgent |
| 改 | gǎi | to change |
| 确认 | quèrèn | to confirm |
| 老地方 | lǎo dìfang | the usual place |
| 上次 | shàngcì | last time |
| 万一 | wànyī | in case, if by chance |
| 变化 | biànhuà | change |
| 放心 | fàngxīn | to rest assured, not worry |
| 期待 | qídài | to look forward to |
| 好久 | hǎojiǔ | a long time |
| 定 | dìng | to settle, fix (a plan) |
| 地点 | dìdiǎn | location |

**Gramática:** 最高...最低... para rangos de temperatura · 会不会 para preguntar por una posibilidad futura · 最好 + verbo para un consejo suave · 如果...就... para condicionales · 要是...怎么办 para preguntar por una contingencia · 不管怎样 ("de todos modos") · 恐怕 para suavizar una mala noticia · 给...添麻烦 para disculparse por una molestia · 到时候 para referirse a un momento futuro · 万一 para una contingencia de baja probabilidad (más tentativo que 如果/要是) · 就这么定了 para cerrar un plan · 还是...吗 para confirmar que algo sigue igual.

---

## 6.15 Roommate & Neighbor Issues (Problemas con Compañeros de Piso y Vecinos)

**Descripción:** Plantear problemas domésticos con un compañero de piso o vecino, negociar soluciones, y mantener la relación cordial.
**Lecciones:** Raising a Noise Complaint — HSK3 (Quejarte por el Ruido) · Splitting Household Chores — HSK3 (Dividir las Tareas del Hogar) · Addressing a Guest Policy Disagreement — HSK4 (Un Desacuerdo sobre Visitas) · Resolving a Dispute Over a Broken Item — HSK4 (Resolver una Disputa por un Objeto Roto)
**Nivel HSK:** 3, 3, 4, 4

| Chino | Pinyin | Inglés |
|---|---|---|
| 声音 | shēngyīn | sound |
| 注意到 | zhùyì dào | to notice |
| 睡不着 | shuì bu zháo | unable to fall asleep |
| 耳机 | ěrjī | headphones |
| 理解 | lǐjiě | to understand |
| 互相 | hùxiāng | mutually, each other |
| 体谅 | tǐliàng | to be considerate of |
| 直接 | zhíjiē | directly |
| 沟通 | gōutōng | to communicate |
| 打游戏 | dǎ yóuxì | to play video games |
| 家务 | jiāwù | household chores |
| 打扫 | dǎsǎo | to clean |
| 不够 | búgòu | not enough |
| 轮流表 | lúnliú biǎo | rotation schedule |
| 负责 | fùzé | to be responsible for |
| 轮流 | lúnliú | to take turns |
| 倒垃圾 | dào lājī | to take out the trash |
| 每天 | měitiān | every day |
| 公平 | gōngpíng | fair |
| 比较 | bǐjiào | relatively, comparatively |
| 商量 | shāngliang | to discuss, consult |
| 过夜 | guòyè | to stay overnight |
| 反对 | fǎnduì | to oppose |
| 说一声 | shuō yì shēng | to give a heads up, mention |
| 考虑不周 | kǎolǜ bùzhōu | not considered thoroughly enough |
| 注意 | zhùyì | to pay attention |
| 想法 | xiǎngfǎ | point of view, idea |
| 一家人 | yì jiā rén | one family |
| 经常 | jīngcháng | often |
| 最近 | zuìjìn | recently |
| 搅拌机 | jiǎobànjī | blender |
| 坏 | huài | broken |
| 追究 | zhuījiū | to investigate, look into (blame) |
| 弄坏 | nòng huài | to break (something) |
| 平摊 | píngtān | to split evenly |
| 修理费 | xiūlǐ fèi | repair cost |
| 修 | xiū | to repair |
| 小心 | xiǎoxīn | careful |
| 同意 | tóngyì | to agree |
| 好商量 | hǎo shāngliang | easy to talk to, reasonable |

**Gramática:** V不着 para incapacidad de lograr un resultado · 会...的 para una promesa futura · 互相 + verbo para acciones mutuas · V得 + adjetivo para describir la manera/grado · 一人一 + medidor para división equitativa · 多了 para enfatizar una mejora comparativa · 有件事我想跟你商量一下 para abrir un tema delicado · 不是...只是... para aclarar una intención · 就好 para una resolución sencilla, de bajo esfuerzo · 不是想...的 para desmentir una implicación no deseada · 要不 para proponer una opción · 对大家都 + adjetivo para evaluar equidad.

---

## 6.16 Online Shopping & Delivery Problems (Compras en Línea y Problemas de Entrega)

**Descripción:** Pedir productos en línea, rastrear entregas, y resolver problemas como artículos equivocados o paquetes dañados.
**Lecciones:** Asking About a Product Online — HSK3 (Preguntar por un Producto en Línea) · Tracking an Online Order — HSK4 (Rastrear un Pedido) · Reporting a Wrong Item — HSK4 (Reportar un Artículo Equivocado) · Requesting a Refund for a Damaged Item — HSK4 (Pedir un Reembolso por un Artículo Dañado)
**Nivel HSK:** 3, 4, 4, 4

| Chino | Pinyin | Inglés |
|---|---|---|
| 大号 | dàhào | large size |
| 有货 | yǒu huò | in stock |
| 颜色 | yánsè | color |
| 材质 | cáizhì | material |
| 纯棉 | chúnmián | pure cotton |
| 发货 | fāhuò | to ship (an order) |
| 下单 | xiàdān | to place an order |
| 百分之百 | bǎi fēn zhī bǎi | one hundred percent |
| 客服 | kèfú | customer service |
| 支持 | zhīchí | support |
| 订单 | dìngdān | order |
| 订单号 | dìngdān hào | order number |
| 提供 | tígōng | to provide |
| 包裹 | bāoguǒ | package |
| 运输途中 | yùnshū tújiōng | in transit |
| 延误 | yánwù | to be delayed |
| 预计 | yùjì | expected, estimated |
| 耐心 | nàixīn | patient |
| 不便 | búbiàn | inconvenience |
| 查 | chá | to check, look up |
| 商品 | shāngpǐn | product, merchandise |
| 具体情况 | jùtǐ qíngkuàng | specific situation |
| 失误 | shīwù | mistake, error |
| 换成 | huàn chéng | to exchange for |
| 免费 | miǎnfèi | free of charge |
| 重新 | chóngxīn | again, anew |
| 寄送 | jìsòng | to send, ship |
| 退回去 | tuì huíqù | to return (an item) |
| 留着 | liú zhe | to keep |
| 帮助 | bāngzhù | help |
| 破损 | pòsǔn | damaged, broken |
| 照片 | zhàopiàn | photo |
| 严重 | yánzhòng | serious, severe |
| 申请 | shēnqǐng | to apply for, request |
| 全额退款 | quán é tuìkuǎn | full refund |
| 工作日 | gōngzuò rì | business day |
| 到账 | dàozhàng | to arrive (in an account) |
| 损坏 | sǔnhuài | damage |
| 处理 | chǔlǐ | to handle, deal with |
| 处理掉 | chǔlǐ diào | to dispose of |

**Gramática:** 除了...还有... para preguntar por opciones adicionales · ...的话，就... para una promesa comercial condicional · 百分之百 para certeza enfática · 还要多久才能... para preguntar cuánto tiempo falta · 给您带来不便 disculpa formal de servicio al cliente · 两到三天 para un rango de días · V的是...但...的是... para contrastar expectativa vs. realidad · 为您 + verbo para acciones de registro formal de servicio · V着就可以了 para una instrucción simple · 所以我想申请... para una petición formal razonada · 三到五个工作日 para un rango de días hábiles · V掉 para completar una acción de deshacerse de algo.

---

## 6.17 Job Interview Basics (Entrevista de Trabajo Básica)

**Descripción:** Presentar tu experiencia, describir tus fortalezas, hablar de expectativas salariales, y hacer preguntas inteligentes en una entrevista de trabajo.
**Lecciones:** Introducing Your Work Background (Presentar tu Experiencia) · Describing Strengths and Weaknesses (Describir Fortalezas y Debilidades) · Discussing Salary Expectations (Hablar de Expectativas Salariales) · Asking the Interviewer Thoughtful Questions (Hacer Preguntas Inteligentes)
**Nivel HSK:** 4 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 背景 | bèijǐng | background |
| 毕业于 | bìyè yú | to graduate from |
| 专业 | zhuānyè | major, field of study |
| 负责 | fùzé | to be responsible for |
| 数据分析 | shùjù fēnxī | data analysis |
| 应聘 | yìngpìn | to apply for a job |
| 职位 | zhíwèi | position, role |
| 发展空间 | fāzhǎn kōngjiān | room for growth |
| 目标 | mùbiāo | goal |
| 方向 | fāngxiàng | direction |
| 优点 | yōudiǎn | strength, advantage |
| 责任心 | zérènxīn | sense of responsibility |
| 按时 | ànshí | on time |
| 缺点 | quēdiǎn | weakness, shortcoming |
| 细节 | xìjié | detail |
| 效率 | xiàolǜ | efficiency |
| 改进 | gǎijìn | to improve |
| 分清主次 | fēnqīng zhǔcì | to prioritize |
| 任务 | rènwu | task |
| 举例子 | jǔ lìzi | to give an example |
| 薪资 | xīnzī | salary |
| 期望 | qīwàng | expectation |
| 税前 | shuìqián | before tax |
| 行业 | hángyè | industry |
| 平均水平 | píngjūn shuǐpíng | average level |
| 预算 | yùsuàn | budget |
| 福利 | fúlì | benefits |
| 绩效奖金 | jìxiào jiǎngjīn | performance bonus |
| 五险一金 | wǔxiǎn yìjīn | social insurance and housing fund |
| 坦诚 | tǎnchéng | honest, candid |
| 团队 | tuánduì | team |
| 构成 | gòuchéng | composition, makeup |
| 分工 | fēngōng | division of labor |
| 培训机制 | péixùn jīzhì | training mechanism |
| 季度 | jìdù | quarter (of a year) |
| 晋升 | jìnshēng | promotion |
| 标准 | biāozhǔn | standard, criteria |
| 业绩 | yèjì | performance, achievements |
| 团队合作 | tuánduì hézuò | teamwork |
| 流程 | liúchéng | process |

**Gramática:** 毕业于 + institución/carrera · 主要负责 + área para describir responsabilidades · 朝...努力 para un esfuerzo sostenido hacia una meta · 对...要求太高 para describir un rasgo llevado al extremo · 以前会，不过我在...改进 para mostrar crecimiento · 先...再... para una secuencia de acciones · 根据 + base para fundamentar una afirmación · 如果...我可以考虑 para mostrar flexibilidad negociadora · 再考虑一下 para posponer cortésmente una decisión · 能介绍一下...吗 para pedir información cortésmente · 主要看 + criterio para explicar una base de evaluación · 在...内 para expresar un plazo.

*Nota de alineación verificada (Sección 10.6): 五险一金, 绩效奖金 y 培训机制 — vocabulario de RR.HH. propio de China — no aparecen en ningún nivel de la lista oficial HSK, no son "HSK5-6" sino contenido completamente fuera del marco. Llamativamente, la palabra 面试 ("entrevista") — el tema mismo del escenario, y que sí es oficialmente HSK4 — nunca se enseña como vocabulario explícito en este escenario etiquetado HSK4.*

---

# 7. Advanced Situations — Los 10 Escenarios (HSK 5–9)

Advanced Situations es el capítulo más avanzado del currículo: 10 escenarios, 40 lecciones, con registro profesional, académico, legal, diplomático y de negocios de alto nivel. Es importante señalar una limitación metodológica real: el estándar oficial **HSK 3.0 (2021) no publica listas de vocabulario independientes para los niveles 7, 8 y 9** — los define y evalúa como una única banda combinada "avanzada", con metas de tamaño de vocabulario en lugar de una partición palabra por palabra entre los tres niveles. Por eso, dentro de este capítulo, la etiqueta `hskReference` (7, 8 o 9) debe leerse como una gradación interna de dificultad del currículo, no como un mapeo verificado contra listas oficiales independientes por nivel — una distinción que se retoma con más detalle en la Sección 10.

---

## 7.1 Negotiating a Job Contract (Negociar un Contrato Laboral)

**Descripción:** Discutir los términos de un contrato, objetar cláusulas desfavorables, negociar prestaciones, y cerrar el acuerdo.
**Lecciones:** Reviewing Contract Terms (Revisar los Términos del Contrato) · Pushing Back on an Unfavorable Clause (Objetar una Cláusula Desfavorable) · Negotiating Benefits and Perks (Negociar Prestaciones) · Finalizing the Agreement (Cerrar el Acuerdo)
**Nivel HSK:** 5 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 条款 | tiáokuǎn | clause, provision |
| 确认 | quèrèn | to confirm |
| 竞业限制 | jìngyè xiànzhì | non-compete restriction |
| 涵盖 | hángài | to cover, encompass |
| 竞争对手 | jìngzhēng duìshǒu | competitor |
| 期限 | qīxiàn | time limit, deadline |
| 标准条款 | biāozhǔn tiáokuǎn | standard clause |
| 试用期 | shìyòngqī | probation period |
| 考核 | kǎohé | evaluation, assessment |
| 书面文件 | shūmiàn wénjiàn | written document |
| 不同的看法 | bùtóng de kànfǎ | a different view |
| 探讨 | tàntǎo | to discuss, explore |
| 额外补贴 | éwài bǔtiē | extra compensation, subsidy |
| 合理 | hélǐ | reasonable |
| 行业 | hángyè | industry |
| 调休 | tiáoxiū | time-off-in-lieu |
| 补偿 | bǔcháng | compensation |
| 提议 | tíyì | proposal |
| 附件 | fùjiàn | appendix, attachment |
| 法务 | fǎwù | legal department |
| 福利待遇 | fúlì dàiyù | benefits package |
| 五险一金 | wǔxiǎn yìjīn | social insurance and housing fund |
| 年度体检 | niándù tǐjiǎn | annual physical exam |
| 带薪年假 | dàixīn niánjià | paid annual leave |
| 逐年 | zhúnián | year by year |
| 远程办公 | yuǎnchéng bàngōng | remote work |
| 部门主管 | bùmén zhǔguǎn | department manager |
| 培训预算 | péixùn yùsuàn | training budget |
| 额度 | édù | quota, allowance |
| 吸引力 | xīyǐnlì | attractiveness, appeal |
| 最终条款 | zuìzhōng tiáokuǎn | final terms |
| 维持 | wéichí | to maintain, keep as-is |
| 原方案 | yuán fāng'àn | the original plan/proposal |
| 缩短 | suōduǎn | to shorten |
| 修改 | xiūgǎi | to revise, amend |
| 接受 | jiēshòu | to accept |
| 入职日期 | rùzhí rìqī | start date |
| 正式 | zhèngshì | formally, officially |
| 期待 | qídài | to look forward to |

**Gramática:** 具体涵盖哪些范围 para preguntar por el alcance · 是不是有点 + adjetivo para una objeción diplomática · 能不能把...写进书面文件 para pedir documentación formal · 关于...，我有些不同的看法 para plantear un desacuerdo con respeto · 恐怕不太合理 para una objeción tacta · 能不能考虑 + alternativa para proponer un punto medio · 除了...，具体包括哪些 para preguntar por un paquete completo · 如果我提出...呢？ para plantear una petición hipotética · 综合起来 para evaluar un paquete en conjunto · 把...再确认一遍 para una revisión final · 缩短到 para expresar una reducción · 正式确认 para sellar formalmente un acuerdo.

---

## 7.2 Debating a Current Issue (Debatir un Tema de Actualidad)

**Descripción:** Tomar una postura sobre un tema social, defenderla con razones, y responder a contraargumentos.
**Lecciones:** Stating Your Position (Plantear tu Postura) · Supporting Your Argument (Sustentar tu Argumento) · Responding to a Counterargument (Responder a un Contraargumento) · Conceding a Point Gracefully (Ceder un Punto con Elegancia)
**Nivel HSK:** 5 (las cuatro lecciones)

| Chino | Pinyin | Inglés |
|---|---|---|
| 立场 | lìchǎng | position, stance |
| 常态 | chángtài | the norm, normal state |
| 生活质量 | shēnghuó zhìliàng | quality of life |
| 当面 | dāngmiàn | face-to-face, in person |
| 效率 | xiàolǜ | efficiency |
| 数据 | shùjù | data |
| 下降 | xiàjiàng | to decline, drop |
| 来源 | láiyuán | source |
| 调查 | diàochá | survey, investigation |
| 结论 | jiélùn | conclusion |
| 方面 | fāngmiàn | aspect, angle |
| 观点 | guāndiǎn | viewpoint, opinion |
| 通勤 | tōngqín | commuting |
| 成本 | chéngběn | cost |
| 满意度 | mǎnyìdù | satisfaction level |
| 证明 | zhèngmíng | to prove |
| 离职率 | lízhílǜ | turnover rate |
| 说服力 | shuōfúlì | persuasiveness |
| 足以 | zúyǐ | enough to, sufficient to |
| 论证 | lùnzhèng | argumentation, reasoning |
| 忽略 | hūlüè | to overlook, ignore |
| 质疑 | zhìyí | challenge, doubt |
| 削弱 | xuēruò | to weaken |
| 凝聚力 | níngjùlì | cohesion |
| 逻辑 | luójí | logic |
| 漏洞 | lòudòng | gap, loophole, flaw |
| 假设 | jiǎshè | to assume |
| 局限性 | júxiànxìng | limitation |
| 弥补 | míbǔ | to make up for, offset |
| 反驳 | fǎnbó | rebuttal |
| 困难 | kùnnan | difficulty |
| 承认 | chéngrèn | to admit, acknowledge |
| 整体 | zhěngtǐ | overall, as a whole |
| 限于 | xiànyú | limited to |
| 特殊情况 | tèshū qíngkuàng | special case |
| 大多数 | dàduōshù | the majority |
| 优势 | yōushì | advantage |
| 依然 | yīrán | still, as before |
| 辩论 | biànlùn | debate |
| 挑战 | tiǎozhàn | challenge |

**Gramática:** 我认为...应该 para plantear una postura clara · 首先 para introducir la primera razón · 这一点我理解，但... para ceder y luego contraargumentar · 从...方面来支持 para estructurar un argumento de varios puntos · 举个例子 para citar evidencia de apoyo · 总的来说 para resumir el argumento · 你的逻辑有一个漏洞 para señalar una falla · 你假设...但事实并非如此 para exponer un supuesto oculto · 确实存在，但可以通过...来弥补 para ceder una limitación con elegancia · 你说得有道理，我承认这一点 para ceder un punto · 这只限于...这个特殊情况 para acotar una concesión · 对大多数人来说，...依然 para reafirmar la conclusión general.

---

## 7.3 Academic Seminar Discussion (Discusión en Seminario Académico)

**Descripción:** Presentar una investigación, responder preguntas del público, y participar en una discusión académica.
**Lecciones:** Presenting Your Research — HSK5 (Presentar tu Investigación) · Fielding a Probing Question — HSK5 (Responder una Pregunta Incisiva) · Citing Sources to Support Claims — HSK6 (Citar Fuentes) · Discussing Limitations and Future Work — HSK6 (Limitaciones y Trabajo Futuro)
**Nivel HSK:** 5, 5, 6, 6

| Chino | Pinyin | Inglés |
|---|---|---|
| 研究课题 | yánjiū kètí | research topic |
| 研究问题 | yánjiū wèntí | research question |
| 现实意义 | xiànshí yìyì | practical significance |
| 采用 | cǎiyòng | to adopt, use (a method) |
| 问卷调查 | wènjuàn diàochá | questionnaire survey |
| 访谈 | fǎngtán | interview |
| 样本量 | yàngběn liàng | sample size |
| 参与 | cānyù | to participate |
| 表明 | biǎomíng | to indicate, show |
| 显著 | xiǎnzhù | significantly, notably |
| 家庭背景 | jiātíng bèijǐng | family background |
| 变量 | biànliàng | variable |
| 控制 | kòngzhì | to control (a variable) |
| 经济条件 | jīngjì tiáojiàn | economic conditions |
| 教育水平 | jiàoyù shuǐpíng | education level |
| 仔细 | zǐxì | carefully, in detail |
| 完全 | wánquán | completely, fully |
| 局限 | júxiàn | limitation |
| 深入 | shēnrù | in-depth, thorough |
| 诚实 | chéngshí | honest |
| 根据 | gēnjù | according to, based on |
| 以往 | yǐwǎng | previous, in the past |
| 认知能力 | rènzhī nénglì | cognitive ability |
| 引用 | yǐnyòng | to cite, quote |
| 文献 | wénxiàn | literature, academic reference |
| 一致 | yízhì | consistent |
| 前人 | qiánrén | predecessors, prior researchers |
| 差异 | chāyì | difference, discrepancy |
| 解释 | jiěshì | to explain |
| 论文 | lùnwén | academic paper, thesis |
| 代表性 | dàibiǎoxìng | representativeness |
| 横断面研究 | héngduànmiàn yánjiū | cross-sectional study |
| 因果关系 | yīnguǒ guānxì | causal relationship, causality |
| 纵向研究 | zòngxiàng yánjiū | longitudinal study |
| 验证 | yànzhèng | to verify |
| 扩大 | kuòdà | to expand |
| 地域范围 | dìyù fànwéi | geographic range |
| 建议 | jiànyì | suggestion, to suggest |
| 报告 | bàogào | presentation, report |
| 精彩 | jīngcǎi | excellent, wonderful |

**Gramática:** 我的研究问题是 para plantear una pregunta de investigación · 我采用了...的方法 para describir la metodología · 结果表明 para reportar un hallazgo · 这是一个很好的问题 para reconocer una buena pregunta · 您是指...还是...？ para aclarar una pregunta ambigua · 这确实是一个局限，值得... para reconocer honestamente una limitación · 根据以往的研究 para citar literatura previa · 与...相比 para comparar con investigación previa · 这可能解释了...上的差异 para explicar una discrepancia · 首先...其次... para secuenciar limitaciones · 未来可以采用...来... para proponer investigación futura · 感谢各位今天的参与和提问 para cerrar un seminario.

*Nota de alineación verificada (Sección 10.8): 深入 es oficialmente HSK3 — muy por debajo tanto de su etiqueta aquí (HSK5) como de la del escenario 9, donde reaparece etiquetada HSK9.*

---

## 7.4 Resolving a Complex Workplace Conflict (Resolver un Conflicto Laboral Complejo)

**Descripción:** Mediar un desacuerdo entre colegas, abordar quejas subyacentes, y llegar a una resolución.
**Lecciones:** Opening the Mediation — HSK5 (Abrir la Mediación) · Hearing Each Side's Grievance — HSK5 (Escuchar a Cada Parte) · Identifying the Underlying Issue — HSK6 (Identificar la Causa Raíz) · Proposing and Confirming a Resolution — HSK6 (Proponer y Confirmar una Resolución)
**Nivel HSK:** 5, 5, 6, 6

| Chino | Pinyin | Inglés |
|---|---|---|
| 分歧 | fēnqí | disagreement, discrepancy |
| 原则 | yuánzé | principle, ground rule |
| 互相尊重 | hùxiāng zūnzhòng | mutual respect |
| 打断 | dǎduàn | to interrupt |
| 评判 | píngpàn | to judge, adjudicate |
| 对错 | duìcuò | right and wrong |
| 解决办法 | jiějué bànfǎ | solution |
| 组织 | zǔzhī | to organize |
| 看法 | kànfǎ | perspective, view |
| 耐心 | nàixīn | patience |
| 角度 | jiǎodù | angle, perspective |
| 贡献 | gòngxiàn | contribution |
| 忽视 | hūshì | to overlook, neglect |
| 汇报 | huìbào | report, briefing |
| 功劳 | gōngláo | credit, merit |
| 付出 | fùchū | effort, what one puts in |
| 看见 | kànjiàn | to see, notice |
| 当面 | dāngmiàn | face-to-face, in person |
| 在意 | zàiyì | to mind, take seriously |
| 清楚 | qīngchu | clear |
| 说法 | shuōfǎ | account, version of events |
| 共同点 | gòngtóngdiǎn | common thread, commonality |
| 表面上 | biǎomiàn shàng | on the surface |
| 分工 | fēngōng | division of labor |
| 根本原因 | gēnběn yuányīn | root cause |
| 沟通不足 | gōutōng bùzú | insufficient communication |
| 目标 | mùbiāo | goal |
| 表达方式 | biǎodá fāngshì | way of expressing oneself |
| 诊断 | zhěnduàn | diagnosis |
| 针对 | zhēnduì | to target, address specifically |
| 提议 | tíyì | to propose, proposal |
| 同步会 | tóngbùhuì | sync meeting |
| 分配 | fēnpèi | allocation, to allocate |
| 承诺 | chéngnuò | to commit, promise |
| 遵守 | zūnshǒu | to abide by, comply with |
| 约定 | yuēdìng | agreement, arrangement |
| 回顾 | huígù | to review, look back |
| 进展 | jìnzhǎn | progress |
| 坦诚 | tǎnchéng | candid, honest |
| 调解 | tiáojiě | mediation |

**Gramática:** 我的目的不是...，而是... para enmarcar la mediación de forma neutral · 我们先定几个原则 para establecer reglas básicas · 请慢慢说，我们有足够的时间 para transmitir paciencia · 从你的角度说说 para invitar una perspectiva · 如果我理解得对，你是希望... para reflejar lo escuchado · 这件事之前你有没有当面提过？ para indagar comunicación previa · 表面上是...，但根本原因是... para distinguir lo superficial de la causa raíz · 你们其实目标是一致的，只是... para encontrar puntos en común · 我这样理解对不对，你们可以确认一下吗？ para verificar un diagnóstico · 针对...的问题，我提议... para proponer una solución dirigida · 我们双方都承诺遵守... para asegurar un compromiso mutuo · 我们两周后再回顾一下进展 para programar un seguimiento.

*Nota de alineación verificada (Sección 10.8): 耐心 es oficialmente HSK5 — coincide con su etiqueta aquí, pero el escenario 9 la etiqueta HSK9, cuatro niveles por encima. 坦诚 es oficialmente HSK7 — coincide con su etiqueta en el escenario 9, pero aquí (escenario 4) se etiqueta HSK5, dos niveles por debajo de lo real.*

---

## 7.5 Media Interview as an Expert (Entrevista como Experto en Medios)

**Descripción:** Dar una entrevista a medios como experto en la materia, manejar una pregunta difícil, y mantener el mensaje clave.
**Lecciones:** Giving a Concise Soundbite — HSK5 (Dar una Respuesta Concisa) · Simplifying a Technical Concept — HSK5 (Simplificar un Concepto Técnico) · Handling a Leading Question — HSK6 (Manejar una Pregunta Tendenciosa) · Closing on Your Key Message — HSK6 (Cerrar con tu Mensaje Clave)
**Nivel HSK:** 5, 5, 6, 6

| Chino | Pinyin | Inglés |
|---|---|---|
| 概括 | gàikuò | to summarize |
| 意义 | yìyì | significance |
| 简单来说 | jiǎndān láishuō | simply put |
| 提升 | tíshēng | to increase, raise |
| 普通用户 | pǔtōng yònghù | ordinary user |
| 响应速度 | xiǎngyìng sùdù | response speed |
| 路线规划 | lùxiàn guīhuà | route planning |
| 瞬间 | shùnjiān | instant, in a flash |
| 应用场景 | yìngyòng chǎngjǐng | use case |
| 解读 | jiědú | to interpret, explain |
| 通俗 | tōngsú | accessible, popular (plain language) |
| 算法 | suànfǎ | algorithm |
| 原理 | yuánlǐ | principle |
| 想象 | xiǎngxiàng | to imagine |
| 分拣员 | fēnjiǎnyuán | sorting worker |
| 比喻 | bǐyù | metaphor, comparison |
| 形象 | xíngxiàng | vivid, graphic |
| 归类 | guīlèi | to categorize |
| 分类 | fēnlèi | classification |
| 转化 | zhuǎnhuà | to convert, translate (into plain terms) |
| 前提 | qiántí | premise |
| 澄清 | chéngqīng | to clarify |
| 岗位 | gǎngwèi | job position, post |
| 转型 | zhuǎnxíng | transformation, transition |
| 区别 | qūbié | distinction, difference |
| 消失 | xiāoshī | to disappear |
| 产生 | chǎnshēng | to produce, generate |
| 适应 | shìyìng | to adapt |
| 启发性 | qǐfāxìng | insightful, inspiring |
| 全面 | quánmiàn | comprehensive |
| 采访 | cǎifǎng | interview |
| 补充 | bǔchōng | to add, supplement |
| 借机会 | jiè jīhuì | to take the opportunity |
| 强调 | qiángdiào | to emphasize |
| 服务于 | fúwù yú | to serve (someone/something) |
| 分量 | fènliang | weight, gravitas |
| 传达 | chuándá | to convey |
| 理念 | lǐniàn | concept, guiding idea |
| 接受 | jiēshòu | to accept, agree to |
| 随时 | suíshí | anytime, always ready |

**Gramática:** 能不能用一句话概括... para pedir una respuesta concisa · 简单来说 para abrir con la idea principal · 比如说 para añadir un ejemplo concreto · 能不能用更通俗的方式解释一下 para pedir una simplificación · 可以把它想象成... para usar una analogía cotidiana · 换句话说 para verificar que la explicación se entendió · 这个问题的前提可能需要澄清一下 para señalar una premisa sesgada · 与其说是...，不如说是... para replantear la pregunta · 关键在于... para redirigir al mensaje clave · 借这个机会，我想强调一点 para conectar con el mensaje clave · 如果只记住一句话，那就是... para dejar una idea memorable · 希望这次采访能传达... para expresar el resultado deseado.

---

## 7.6 Legal and Notarial Procedures (Trámites Legales y Notariales)

**Descripción:** Navegar un trámite legal o notarial formal, entender terminología legal precisa, y confirmar cada paso.
**Lecciones:** Explaining Your Purpose — HSK6 (Explicar tu Propósito) · Asking About Required Documents — HSK6 (Preguntar por los Documentos Requeridos) · Clarifying Legal Terminology — HSK7 (Aclarar Terminología Legal) · Confirming the Next Steps — HSK7 (Confirmar los Siguientes Pasos)
**Nivel HSK:** 6, 6, 7, 7

| Chino | Pinyin | Inglés |
|---|---|---|
| 办理 | bànlǐ | to handle, process (a formal matter) |
| 委托公证 | wěituō gōngzhèng | power-of-attorney notarization |
| 事项 | shìxiàng | matter, item |
| 代为处理 | dàiwéi chǔlǐ | to handle on someone's behalf |
| 房产过户 | fángchǎn guòhù | property transfer |
| 财产 | cáichǎn | property, assets |
| 亲自到场 | qīnzì dàochǎng | to be present in person |
| 核实身份 | héshí shēnfèn | identity verification |
| 环节 | huánjié | step, phase (in a process) |
| 清单 | qīngdān | checklist |
| 材料 | cáiliào | materials, documents |
| 身份证原件 | shēnfènzhèng yuánjiàn | original ID card |
| 复印件 | fùyìnjiàn | photocopy |
| 核验 | héyàn | to verify, check |
| 房产证 | fángchǎnzhèng | property deed/title |
| 加盖公章 | jiāgài gōngzhāng | to affix an official seal |
| 外文 | wàiwén | foreign language (text) |
| 翻译 | fānyì | translation, to translate |
| 认可 | rènkě | to recognize, approve |
| 疑问 | yíwèn | question, doubt |
| 不可撤销 | bùkě chèxiāo | irrevocable |
| 签署 | qiānshǔ | to sign (a formal document) |
| 单方面 | dānfāngmiàn | unilateral(ly) |
| 撤回 | chèhuí | to revoke, withdraw |
| 终止 | zhōngzhǐ | to terminate |
| 授权 | shòuquán | authorization |
| 稳定性 | wěndìngxìng | stability |
| 原则上 | yuánzé shàng | in principle |
| 更改 | gēnggǎi | to alter, change |
| 慎重 | shènzhòng | careful, cautious (of decisions) |
| 流程 | liúchéng | process, procedure |
| 审核 | shěnhé | to review, examine (formal) |
| 工作日 | gōngzuòrì | business day |
| 通知 | tōngzhī | to notify |
| 第一时间 | dìyī shíjiān | right away, immediately |
| 公证书 | gōngzhèngshū | notarial certificate |
| 领取 | lǐngqǔ | to collect, receive |
| 自取 | zìqǔ | to pick up in person |
| 邮寄 | yóujì | to mail |
| 顺利 | shùnlì | smoothly, without a hitch |

**Gramática:** 我想办理一份...公证 para plantear un propósito legal · 我需要委托...代为处理 para describir una autorización · 具体是怎么操作的？ para preguntar por un procedimiento · 复印件可以吗，还是必须原件？ para aclarar requisitos documentales · 可以提供...，但需要... para requisitos condicionales · 如果材料是...的，需要...吗？ para preguntar por un caso condicional · ...具体是什么意思？ para pedir una definición legal precisa · 这和...有什么区别？ para distinguir términos similares · 这取决于... para explicar que una decisión depende de un factor · ...之后，接下来的流程是什么？ para preguntar por los siguientes pasos · 大概需要多长时间？ para confirmar un plazo · 可以选择...，也可以... para presentar opciones de entrega.

*Nota de alineación verificada (Sección 10.8): de estas cinco palabras, solo 流程 resultó ser oficialmente HSK7 — correctamente ubicada. 通知 y 顺利 son en realidad HSK2, 工作日 es HSK5, y 邮寄 no aparece en ningún nivel de la lista oficial — una desviación mayor de la estimada originalmente ("HSK4-5"), no menor.*

---

## 7.7 Formal Speech and Toast at an Event (Discurso Formal y Brindis en un Evento)

**Descripción:** Dar un discurso formal o un brindis en un banquete de empresa, honrando a los invitados y expresando gratitud con elocuencia.
**Lecciones:** Opening a Formal Speech — HSK6 (Abrir un Discurso Formal) · Honoring a Guest or Achievement — HSK6 (Honrar a un Invitado o Logro) · Proposing an Eloquent Toast — HSK7 (Proponer un Brindis Elocuente) · Closing a Speech Memorably — HSK7 (Cerrar un Discurso Memorablemente)
**Nivel HSK:** 6, 6, 7, 7

| Chino | Pinyin | Inglés |
|---|---|---|
| 来宾 | láibīn | guest, attendee (formal) |
| 拨冗 | bōrǒng | to take time out of a busy schedule (formal) |
| 出席 | chūxí | to attend (formal) |
| 庆典 | qìngdiǎn | celebration, ceremony |
| 欢聚一堂 | huānjù yì táng | to gather together joyfully |
| 周年 | zhōunián | anniversary |
| 在座 | zàizuò | those present (at the event) |
| 合作伙伴 | hézuò huǒbàn | partner, collaborator |
| 感想 | gǎnxiǎng | reflections, thoughts |
| 携手前行 | xiéshǒu qiánxíng | to move forward hand in hand |
| 表彰 | biǎozhāng | to honor, commend formally |
| 杰出 | jiéchū | outstanding, distinguished |
| 挑战性 | tiǎozhànxìng | challenging (nature of) |
| 专业精神 | zhuānyè jīngshén | professional spirit |
| 敬意 | jìngyì | respect, admiration |
| 荣誉 | róngyù | honor |
| 实至名归 | shízhìmíngguī | well-deserved, richly earned (idiom) |
| 榜样 | bǎngyàng | role model, example |
| 辜负 | gūfù | to let down, fail to live up to |
| 祝贺 | zhùhè | to congratulate |
| 举杯 | jǔbēi | to raise a glass, propose a toast |
| 酒杯 | jiǔbēi | wine glass |
| 祝愿 | zhùyuàn | to wish (someone well) |
| 蒸蒸日上 | zhēngzhēng rìshàng | ever-growing prosperity, thriving (idiom) |
| 事业 | shìyè | career, undertaking |
| 美好 | měihǎo | wonderful, beautiful |
| 长长久久 | chángcháng jiǔjiǔ | to last a very long time |
| 敬酒 | jìngjiǔ | to offer a toast (out of respect) |
| 干杯 | gānbēi | cheers, bottoms up |
| 尽兴 | jìnxìng | to enjoy oneself thoroughly |
| 欢聚 | huānjù | joyful gathering |
| 深深 | shēnshēn | deeply, profoundly |
| 大家庭 | dàjiātíng | big family (figurative, community) |
| 温暖 | wēnnuǎn | warmth |
| 迈向 | màixiàng | to stride toward |
| 辉煌 | huīhuáng | brilliant, glorious |
| 万事如意 | wànshì rúyì | may everything go as you wish (idiom) |
| 致辞 | zhìcí | to give a speech, address |
| 聆听 | língtīng | to listen attentively (formal) |
| 圆满成功 | yuánmǎn chénggōng | completely successful |

**Gramática:** 各位来宾 para dirigirse formalmente a una audiencia · 感谢大家拨冗出席 para agradecer formalmente la asistencia · 离不开在座每一位的努力 para reconocer a la audiencia · 我想特别表彰... para honrar a alguien formalmente · 这份荣誉，你实至名归 para elogiar un logro · 希望更多同事能以你为榜样 para expresar admiración colectiva · 请各位举起手中的酒杯 para invitar un brindis · 祝愿...蒸蒸日上 para un buen deseo elocuente · 来，为了...，干杯！ para cerrar un brindis · 在结束之前，我想再说几句话 para señalar un cierre · 愿我们携手迈向更加辉煌的明天 para un deseo con visión de futuro · 祝大家...，万事如意 para una bendición formal de cierre.

Este es el escenario con mayor densidad de modismos chinos (成语) de todo el capítulo: 实至名归, 蒸蒸日上, 万事如意.

---

## 7.8 Specialist Medical Consultation (Consulta Médica Especializada)

**Descripción:** Discutir un diagnóstico complejo con un especialista, entender las opciones de tratamiento, y hacer preguntas médicas precisas.
**Lecciones:** Describing a Complex Symptom History — HSK7 (Describir un Historial de Síntomas Complejo) · Understanding the Diagnosis — HSK7 (Entender el Diagnóstico) · Discussing Treatment Options and Risks — HSK8 (Opciones de Tratamiento y Riesgos) · Confirming the Treatment Plan — HSK8 (Confirmar el Plan de Tratamiento)
**Nivel HSK:** 7, 7, 8, 8

| Chino | Pinyin | Inglés |
|---|---|---|
| 症状 | zhèngzhuàng | symptom |
| 发展过程 | fāzhǎn guòchéng | developmental process, progression |
| 头晕 | tóuyūn | dizziness |
| 频率 | pínlǜ | frequency |
| 伴随 | bànsuí | to be accompanied by |
| 恶心 | ěxin | nausea |
| 诱因 | yòuyīn | trigger, contributing cause |
| 加重 | jiāzhòng | to worsen, intensify |
| 门诊 | ménzhěn | outpatient clinic |
| 改善 | gǎishàn | improvement, to improve |
| 患有 | huàn yǒu | to suffer from, have (a condition) |
| 前庭性偏头痛 | qiántíngxìng piāntóutòng | vestibular migraine |
| 引发 | yǐnfā | to trigger, induce |
| 平衡系统 | pínghéng xìtǒng | balance system |
| 反复发作 | fǎnfù fāzuò | to recur repeatedly (of a condition) |
| 病史 | bìngshǐ | medical history |
| 诱发因素 | yòufā yīnsù | triggering factor |
| 急重症 | jízhòngzhèng | critical/emergency condition |
| 长期管理 | chángqī guǎnlǐ | long-term management |
| 控制 | kòngzhì | to control |
| 可行 | kěxíng | viable, feasible |
| 治疗方案 | zhìliáo fāng'àn | treatment plan |
| 药物治疗 | yàowù zhìliáo | medication treatment |
| 副作用 | fùzuòyòng | side effect |
| 嗜睡 | shìshuì | drowsiness |
| 效果 | xiàoguǒ | effectiveness, effect |
| 起效 | qǐxiào | to take effect |
| 持久 | chíjiǔ | lasting, long-lasting |
| 倾向于 | qīngxiàng yú | to be inclined toward |
| 稳妥 | wěntuǒ | sound, prudent (of a choice) |
| 制定计划 | zhìdìng jìhuà | to develop a plan |
| 用药剂量 | yòngyào jìliàng | medication dosage |
| 调整 | tiáozhěng | to adjust |
| 警惕 | jǐngtì | to be vigilant, alert |
| 警示症状 | jǐngshì zhèngzhuàng | warning symptom |
| 剧烈 | jùliè | severe, intense |
| 视力模糊 | shìlì móhu | blurred vision |
| 就医 | jiùyī | to seek medical attention |
| 复诊 | fùzhěn | follow-up visit |
| 记录 | jìlù | to record, log |

**Gramática:** 大概...前开始，起初只是... para describir el inicio de un síntoma · 最近...，频率明显增加了，还伴随... para describir progresión · 好像在...后症状会加重 para señalar un patrón desencadenante · 您可能患有... para plantear un diagnóstico probable · 这和普通的...有什么不一样？ para distinguir un diagnóstico · 如果我理解得对，这不是什么...？ para confirmar una preocupación clave · 目前有哪些可行的治疗方案？ para preguntar por opciones de tratamiento · 会有什么副作用吗？ para preguntar por riesgos · ...更快，但...更持久 para comparar dos tratamientos · 有没有需要特别警惕的警示症状？ para preguntar por señales de alarma · 如果出现...，请立即就医 para una instrucción de emergencia · 复诊前需要提前做什么准备吗？ para confirmar la preparación del seguimiento.

*Nota de alineación verificada (Sección 10.8): 副作用 es oficialmente HSK7 — un nivel por debajo de esta lección HSK8, una brecha razonable. 效果, 调整 y 记录, en cambio, son HSK3 — cinco niveles por debajo, mucho más grave de lo que sugería la lectura cualitativa original, que los agrupaba todos como igualmente "por debajo".*

---

## 7.9 Diplomatic and Culturally Sensitive Negotiation (Negociación Diplomática y Culturalmente Sensible)

**Descripción:** Navegar una negociación intercultural con tacto, abordar un desacuerdo delicado diplomáticamente, y preservar la relación.
**Lecciones:** Opening with Tact — HSK7 (Abrir con Tacto) · Addressing a Cultural Misunderstanding — HSK8 (Abordar un Malentendido Cultural) · Navigating a Face-Sensitive Disagreement — HSK8 (Un Desacuerdo Sensible al "Rostro/Prestigio") · Closing While Preserving the Relationship — HSK9 (Cerrar Preservando la Relación)
**Nivel HSK:** 7, 8, 8, 9

| Chino | Pinyin | Inglés |
|---|---|---|
| 珍视 | zhēnshì | to treasure, value highly |
| 情谊 | qíngyì | friendship, bond |
| 意义重大 | yìyì zhòngdà | of great significance |
| 坦诚 | tǎnchéng | candid, sincere |
| 贵方 | guìfāng | your side (honorific, formal) |
| 考量 | kǎoliàng | consideration, factor weighed |
| 安心 | ānxīn | at ease, reassured |
| 互利共赢 | hùlì gòngyíng | mutually beneficial, win-win (idiom) |
| 议题 | yìtí | agenda item, topic for discussion |
| 交流 | jiāoliú | to communicate, exchange |
| 意外 | yìwài | surprised, unexpected |
| 误解 | wùjiě | misunderstanding |
| 愿闻其详 | yuàn wén qí xiáng | I'd welcome hearing the details (formal) |
| 商务习惯 | shāngwù xíguàn | business custom |
| 座次 | zuòcì | seating order |
| 含义 | hányì | implication, connotation |
| 怠慢 | dàimàn | to slight, treat with neglect |
| 谅解 | liàngjiě | to understand and forgive |
| 诚意 | chéngyì | sincerity, good faith |
| 彼此 | bǐcǐ | each other, mutual |
| 维持 | wéichí | to maintain |
| 水平 | shuǐpíng | level, standard |
| 换角度 | huàn jiǎodù | to change perspective |
| 成本上升 | chéngběn shàngshēng | rising costs |
| 稳定性 | wěndìngxìng | stability |
| 中间方案 | zhōngjiān fāng'àn | middle-ground solution |
| 空间 | kōngjiān | room, latitude (figurative) |
| 灵活 | línghuó | flexible |
| 体谅 | tǐliàng | to be understanding, considerate of others |
| 珍惜 | zhēnxī | to cherish, appreciate |
| 达成共识 | dáchéng gòngshí | to reach a consensus |
| 体现 | tǐxiàn | to embody, reflect |
| 智慧 | zhìhuì | wisdom |
| 耐心 | nàixīn | patience |
| 坚实 | jiānshí | solid, firm |
| 基础 | jīchǔ | foundation |
| 深入 | shēnrù | deep, in-depth |
| 坚固 | jiāngù | sturdy, solid |
| 衷心 | zhōngxīn | sincerely, wholeheartedly |
| 信任 | xìnrèn | trust |

**Gramática:** 我们非常珍视...的情谊 para reconocer una relación · 我们完全尊重贵方的立场和考量 para expresar respeto · 我们相信...最终会实现互利共赢 para enmarcar un beneficio mutuo · 我猜这里可能存在一些文化上的误解 para señalar un malentendido sin culpar · 这绝不是有意...，还请谅解 para reafirmar la buena intención · 我们对彼此的合作诚意从未改变 para reafirmar buena voluntad · 或许我们可以换一个角度来看这个问题 para disentir indirectamente · 也许我们可以探讨一个双方都能接受的中间方案 para ofrecer una salida elegante · 我们非常珍惜您愿意灵活考虑的态度 para preservar el respeto mutuo · 这份共识体现了我们双方的诚意与智慧 para enmarcar un acuerdo con calidez · 我们相信，这次合作会为未来打下更坚实的基础 para mirar hacia el futuro · 衷心感谢贵方的信任与支持 para un agradecimiento sincero de cierre.

*Nota de alineación verificada (Sección 10.8): este es el escenario con más incidencias de la misma palabra apareciendo en niveles muy distintos en otras partes del capítulo — 耐心 (oficialmente HSK5), 坦诚 (HSK7), 深入 (HSK3) y 维持 (HSK4) reaparecen en otros escenarios con etiquetas que no coinciden con su nivel oficial real; 稳定性 no aparece en ningún nivel de la lista oficial. Evidencia clara de que `hskReference` funciona como una etiqueta de dificultad por lección, no un mapeo palabra por palabra contra listas oficiales.*

---

## 7.10 Tech and Finance Expert Panel (Panel de Expertos en Tecnología y Finanzas)

**Descripción:** Participar en un panel de expertos de alto nivel sobre tecnología y finanzas, manejando ideas matizadas y abstractas.
**Lecciones:** Framing a Nuanced View — HSK8 (Plantear una Postura Matizada) · Engaging with a Fellow Panelist — HSK8 (Dialogar con Otro Panelista) · Discussing Systemic Risk — HSK9 (Discutir el Riesgo Sistémico) · Synthesizing the Panel Discussion — HSK9 (Sintetizar la Discusión del Panel)
**Nivel HSK:** 8, 8, 9, 9 — el escenario de mayor nivel de todo el currículo

| Chino | Pinyin | Inglés |
|---|---|---|
| 金融科技 | jīnróng kējì | fintech, financial technology |
| 机遇 | jīyù | opportunity |
| 威胁 | wēixié | threat |
| 二元对立 | èryuán duìlì | binary opposition |
| 普惠性 | pǔhuìxìng | inclusiveness, accessibility (of services) |
| 系统性风险 | xìtǒngxìng fēngxiǎn | systemic risk |
| 监管 | jiānguǎn | regulation, oversight |
| 到位 | dàowèi | adequate, up to standard |
| 非黑即白 | fēihēijíbái | black-and-white (thinking) (idiom) |
| 视角 | shìjiǎo | perspective, vantage point |
| 补充 | bǔchōng | to add, supplement |
| 认同 | rèntóng | to agree with, identify with |
| 维度 | wéidù | dimension (of an issue) |
| 统一性 | tǒngyīxìng | uniformity, standardization |
| 启发 | qǐfā | inspiration, insight |
| 同步推进 | tóngbù tuījìn | to advance in tandem/synchronously |
| 保留 | bǎoliú | reservation, to reserve (an opinion) |
| 抑制 | yìzhì | to suppress, inhibit |
| 多样性 | duōyàngxìng | diversity |
| 权衡 | quánhéng | to weigh (a trade-off), balance |
| 形成 | xíngchéng | to form, take shape |
| 关联性 | guānliánxìng | interconnectedness |
| 本质区别 | běnzhì qūbié | fundamental difference |
| 波及 | bōjí | to spread to, affect (adversely) |
| 蔓延 | mànyán | to spread, proliferate |
| 传导机制 | chuándǎo jīzhì | transmission mechanism |
| 违约 | wéiyuē | default, breach of contract |
| 连锁反应 | liánsuǒ fǎnyìng | chain reaction |
| 缓释手段 | huǎnshì shǒuduàn | mitigation method |
| 防火墙机制 | fánghuǒqiáng jīzhì | firewall mechanism |
| 总结 | zǒngjié | to summarize, summary |
| 归纳 | guīnà | to synthesize, induce (a conclusion) |
| 不尽相同 | bú jìn xiāngtóng | not entirely the same |
| 至关重要 | zhìguān zhòngyào | critically important (idiom) |
| 分歧 | fēnqí | disagreement, divergence |
| 综合 | zònghé | to synthesize, integrate |
| 平衡 | pínghéng | to balance |
| 稳健 | wěnjiàn | stability, steadiness (of a system) |
| 赞同 | zàntóng | to endorse, agree with |
| 主持 | zhǔchí | to moderate, chair (a discussion) |

**Gramática:** 这种二元对立的提问方式过于简化了 para rechazar un falso binario · 一方面...，另一方面... para presentar dos caras · 与其说...，不如说取决于... para ubicar una postura condicional · 我想在您刚才的观点基础上补充一点 para construir sobre un punto · 我在一定程度上同意，但也有一点保留 para disentir con elegancia · 这确实是一个值得权衡的问题 para reconocer un verdadero trade-off · 关键在于...之间高度的关联性 para explicar una causa sistémica · ...通常是可控的，不会波及全局。但...会...迅速蔓延 para distinguir tipos de riesgo · 建立...机制是常见的应对策略之一 para discutir un enfoque de mitigación · 尽管...不尽相同，但有一个共同点 para identificar un hilo común · 在...问题上，分歧依然存在 para nombrar un desacuerdo persistente · 综合各方观点，未来的关键在于... para una síntesis con visión de futuro.

*Nota de alineación verificada (Sección 10.8): la lección 4, etiquetada HSK9 — el techo nominal de todo el currículo — abre su lista de vocabulario con 总结 ("resumir", oficialmente HSK3, seis niveles por debajo) y 平衡 ("equilibrar", oficialmente HSK6, tres niveles por debajo). Es la inversión más llamativa y mejor verificada de todo el capítulo entre la etiqueta de nivel y el contenido real.*

---

# 8. Speaking Lab (Laboratorio de Conversación)

## 8.1 Propósito

Speaking Lab es el entorno dedicado a desarrollar la habilidad de hablar chino. Su propósito es transformar el conocimiento pasivo en habilidad comunicativa activa, a través de práctica continua, interacción en tiempo real y retroalimentación personalizada.

## 8.2 Estructura real

La pantalla principal de Speaking Lab ofrece tres puntos de entrada, además del paso de Expresión Oral integrado en cada lección. No existe una pantalla separada de "práctica de pronunciación", "entrevista" o "debate" — esas necesidades se cubren a través del propio contenido de los escenarios, en la dificultad correspondiente a dónde se encuentra el estudiante en el currículo (el paso de Expresión Oral de una lección de Foundations es un intercambio cotidiano simple; el de una lección de Situaciones Avanzadas es una entrevista de trabajo, un debate o una negociación diplomática).

1. **Practicar con Han (tema libre)** — el estudiante elige su propio tema, quién debe ser Han, el ritmo y el estilo de corrección, y sostiene una conversación hablada en vivo construida exactamente alrededor de eso. Para el nivel de dificultad de esa sesión en particular, puede dejar que Han use automáticamente su Nivel General real (opción por defecto), o elegir manualmente uno de siete niveles nombrados en lenguaje llano — Beginner, Elementary, Intermediate, Upper Intermediate, Advanced, Very Advanced, Expert — independientes del Nivel General descrito en la Sección 3.3: un estudiante avanzado puede elegir deliberadamente una sesión "Beginner" para calentar, sin que eso afecte su puntaje real.
2. **Shadowing (Repetición Guiada)** — dos formas de repetir el diálogo real de una lección: turno por turno como un chat, o la conversación completa como un solo pasaje continuo con pinyin siempre visible. **Actualmente bloqueado detrás de un candado de lanzamiento Pre-MVP** — completamente construido, temporalmente oculto mientras se prioriza el resto del producto.
3. **Juego de Rol por Escenario (Scenario Role Play)** — responder en personaje a la misión de un escenario elegido, fuera del flujo guiado de la lección. **También bloqueado actualmente bajo el mismo candado Pre-MVP.**
4. **El paso de Expresión Oral de cada lección** — cada lección publicada tiene una conversación real de IA en personaje (no un marcador de posición), construida a partir del escenario, vocabulario y gramática específicos de esa lección — esta es la forma principal en que la mayoría de los estudiantes encuentra la práctica de Expresión Oral, alcanzada automáticamente como parte del Learning Journey.

## 8.3 Sistema de evaluación de Expresión Oral

El desempeño oral se evalúa en 5 dimensiones:

| Métrica | Qué mide |
|---|---|
| **Pronunciación** | Capacidad de producir sonidos y tonos chinos comprensibles |
| **Fluidez** | Capacidad de hablar con fluidez, sin vacilación excesiva |
| **Precisión** | Uso correcto de gramática y vocabulario |
| **Complejidad** | Capacidad de usar estructuras cada vez más avanzadas |
| **Efectividad Comunicativa** | Capacidad de expresar ideas con éxito |

Estas 5 métricas son las mismas que alimentan el `promedio_base` de la fórmula de Expresión Oral descrita en la Sección 3.2.2.

---

# 9. Writing Lab (Laboratorio de Escritura)

## 9.1 Propósito

Writing Lab es el entorno dedicado a desarrollar la habilidad de escribir en chino, transformando el conocimiento de vocabulario y gramática en comunicación escrita clara, natural y efectiva.

## 9.2 Estructura real — tres opciones

### 1. Escribir un Párrafo — escritura a mano, por niveles, calificada por foto

El estudiante elige un nivel — **Básico** (~5-6 líneas, ~60-90 caracteres), **Intermedio** (~6-20 líneas, ~90-300 caracteres) o **Avanzado** (20+ líneas, 300+ caracteres) — y un tema (actualmente Familia, Rutina Diaria o Compras, cada uno formulado de forma distinta según el nivel). El estudiante escribe el párrafo **a mano, en papel**, lo fotografía (1-3 fotos para envíos Avanzados más largos) y lo sube a la plataforma.

Un modelo de IA con capacidad visual transcribe la escritura a mano, señala caracteres específicos mal formados o ilegibles (hasta 8, con la explicación de qué está mal), y califica contra una rúbrica ponderada específica de cada nivel:

| Nivel | Dimensiones de la rúbrica (peso) |
|---|---|
| Básico | Legibilidad (25%), Tema y extensión (20%), Construcción de oraciones (20%), Gramática (15%), Vocabulario (10%), Claridad (10%) |
| Intermedio | Legibilidad (20%), Desarrollo del tema (15%), Variedad gramatical (20%), Precisión del vocabulario (15%), Cohesión/transiciones (20%), Naturalidad (10%) |
| Avanzado | Legibilidad (15%), Profundidad del contenido (15%), Gramática compleja (20%), Precisión léxica/registro (20%), Organización (20%), Estilo (10%) |

Límite honesto: una fotografía estática puede confirmar que la forma final de un carácter es correcta, pero **no puede verificar el orden de trazos** — eso requiere observar el proceso de escritura, no solo el resultado.

### 2. Desafío de Traducción

Un banco de aproximadamente 15 textos de temas variados. El estudiante traduce uno al chino; la calificación verifica la precisión del significado contra una traducción de referencia oculta, aceptando cualquier otra formulación natural y correcta — no exige una coincidencia palabra por palabra.

### 3. Escritura Personalizada

El estudiante define su propio tema, nivel, formato y tono en lenguaje libre, y es calificado exactamente contra lo que pidió.

## 9.3 Retroalimentación de escritura

**Desafío de Traducción y Escritura Personalizada** (texto escrito) se califican en 4 dimensiones, de 0 a 100 cada una: **Gramática**, **Vocabulario**, **Naturalidad** (si suena como chino real, no como un libro de texto) y **Claridad Comunicativa**. Cada calificación devuelve además una versión corregida y una lista breve de los cambios específicos realizados.

**Escribir un Párrafo** (a mano) usa la rúbrica más completa y específica por nivel descrita arriba — Organización y Estilo solo aparecen como dimensiones nombradas en el nivel Avanzado, no como categorías universales.

---

# 10. Comparación con el Marco Oficial HSK (los 9 niveles)

## 10.1 Metodología del cotejo verificado

Esta sección se basa en un **cotejo verificado, palabra por palabra**, contra la lista oficial de vocabulario del estándar **国际中文教育中文水平等级标准** ("Estándar de Niveles de Competencia en Chino para la Educación Internacional del Chino", Ministerio de Educación de China, marzo 2021 — la reforma conocida extraoficialmente como "HSK 3.0"), que reorganizó el examen de 6 a **9 niveles en 3 bandas** (初等 1-3, 中等 4-6, 高等 7-9) y publicó una lista oficial de ~11,092 palabras acumuladas a lo largo de los 9 niveles.

**Fuente de datos usada**: la lista oficial fue consultada a través de un dataset abierto (`drkameleon/complete-hsk-vocabulary`) que compila y mantiene actualizadas las listas publicadas oficialmente por nivel, para ambos estándares (HSK clásico de 6 niveles y HSK 3.0 de 9 niveles). Se verificaron cifras clave contra fuentes independientes antes de usarlo (el total de ~11,092 palabras acumuladas y el hecho de que los niveles 7-9 comparten una única bolsa de vocabulario combinada, sin partición oficial palabra por palabra entre 7, 8 y 9, coinciden con lo reportado por múltiples fuentes de la reforma de 2021).

**Cómo se hizo el cotejo**: se extrajeron automáticamente las **1,590 palabras de vocabulario** de las tablas de las Secciones 5, 6 y 7 de este informe (todas y cada una, no una muestra), y se buscó cada una, por coincidencia exacta de caracteres, en la lista oficial de 9 niveles. Para cada escenario, se comparó el nivel HSK oficial real de cada palabra contra el rango de `hskReference` que HanGo declara para ese escenario (por ejemplo, un escenario etiquetado "HSK 3-4" se considera "dentro de rango" si la palabra aparece oficialmente en HSK3 o HSK4; "por encima" si aparece en HSK5+; "por debajo" si aparece en HSK1-2).

**Límites honestos de este método** (para que la cifra no se lea como más precisa de lo que es):
- La comparación es por **escenario** (rango declarado de sus 4 lecciones), no por lección individual — un cotejo lección por lección sería más fino pero requeriría reestructurar los datos de origen.
- **"No encontrada en la lista oficial" no significa automáticamente "mal elegida"**. Puede significar que la palabra es vocabulario genuinamente especializado o idiomático que excede el marco HSK por completo (plausible y hasta esperable en un capítulo de registro profesional/legal/diplomático), o puede reflejar una laguna de cobertura del propio dataset de terceros frente al documento oficial completo. Ambas lecturas son honestas; el informe las distingue caso por caso donde es relevante.
- Este cotejo reemplaza la lectura puramente cualitativa de la versión anterior de este informe — que, verificada ahora contra datos reales, resultó **equivocada en varios casos concretos** (ver 10.8), lo cual es en sí mismo la razón de ser de este ejercicio de verificación.

## 10.2 Foundations (HSK 1-2) — resultados cuantitativos

De las 559 palabras de vocabulario de los 14 escenarios de Foundations, **490 (87.7%) aparecen en la lista oficial de 9 niveles** y 69 (12.3%) no aparecen en ninguno de los 9 niveles. De las 490 encontradas:

| Resultado del cotejo | Palabras | % de las encontradas |
|---|---|---|
| Dentro del rango HSK declarado (1-2, o 1-3 en escenarios mixtos) | 261 | 53.3% |
| **Por encima** del rango declarado | 209 | 42.7% |
| Por debajo del rango declarado | 20 | 4.1% |

El patrón dominante y verificado es claro: **4 de cada 10 palabras de vocabulario encontradas en la lista oficial están, de hecho, por encima del nivel que HanGo les asigna** — una deriva mucho más extendida de lo que sugería la lectura cualitativa original de este informe (que citaba solo un puñado de ejemplos).

## 10.3 Foundations (HSK 1-2) — ejemplos representativos de la deriva hacia arriba

Algunos de los casos con mayor brecha (nivel oficial real menos nivel declarado por HanGo):

| Escenario | Palabra | Nivel HanGo | Nivel oficial real | Brecha |
|---|---|---|---|---|
| Money, Banking & Simple Transactions | 账单 ("factura") | 2 | 7 | 5 |
| Money, Banking & Simple Transactions | 付款 ("pagar") | 2 | 7 | 5 |
| Money, Banking & Simple Transactions | 收据 ("recibo") | 2 | 7 | 5 |
| Money, Banking & Simple Transactions | 预算 ("presupuesto") | 2 | 7 | 5 |
| Asking About Places & Opening Hours | 小区 ("colonia/urbanización") | 1-2 | 7 | 5 |
| Asking About Places & Opening Hours | 噪音 ("ruido") | 1-2 | 7 | 5 |
| Phone & Communication | 称呼 ("forma de dirigirse a alguien") | 1 | 7 | 6 |
| Basic Shopping | 收据 ("recibo") | 1 | 7 | 6 |
| Body & Feeling Unwell | 副作用 ("efecto secundario") | 1-2 | 7 | 5 |
| Body & Feeling Unwell | 症状 ("síntoma") | 1-2 | 6 | 4 |

Esto confirma la observación cualitativa original (Money Banking, Places & Hours y Body & Feeling Unwell eran justamente los escenarios señalados), pero con una magnitud verificada mucho mayor: varias de estas palabras no están "un poco" por encima de nivel — están en la banda combinada HSK7-9, es decir, seis o siete niveles por encima de donde HanGo las coloca.

## 10.4 Foundations (HSK 1-2) — el hallazgo más importante: ausencias, no excesos

Este es el hallazgo más accionable del análisis. Revisando las listas de vocabulario de los 14 escenarios (no los diálogos ni las explicaciones de gramática, que sí usan estas palabras constantemente), varias de las palabras individuales más frecuentes de todo el mandarín — y de cualquier lista real de HSK1 — **nunca se presentan como un elemento explícito de vocabulario en ninguno de los 14 escenarios**:

- **Pronombres básicos**: 我 (yo), 你 (tú), 他/她 (él/ella), 我们 (nosotros) nunca aparecen como una entrada de vocabulario enseñada, a pesar de usarse en prácticamente cada línea de diálogo desde la primera lección.
- **La cópula 是** ("ser/estar") — usada constantemente en los diálogos (p. ej. "我是学生", "我是美国人" en la primerísima lección) pero nunca enseñada formalmente como vocabulario; un punto de gramática incluso explica que los adjetivos *no* llevan 是, lo cual asume que el estudiante ya sabe qué hace 是 sin que nunca se le haya presentado.
- **Los números** — no existe una lección dedicada a los numerales ni entradas de vocabulario para 一/二/三/四/五/六/七/八/九/十 (ni superiores) en ninguno de los 14 escenarios. Los números aparecen libremente dentro de diálogos y ejercicios (三点, 五口人, 两个小时, 七月八号), pero nunca se le presentan al estudiante 一–十 como vocabulario explícito antes de esperar que los reconozca y produzca en contexto. Para un currículo cuya propia descripción del primer escenario promete "empezar el chino desde cero", esta es la ausencia más notoria — los números suelen estar entre las primeras 10-20 palabras de cualquier programa real para principiantes.
- **Los demostrativos básicos 这/那** ("esto/eso") como pronombres, y la partícula posesiva **的**, se usan constantemente pero tampoco aparecen nunca como elementos de vocabulario.
- **谢谢 (gracias) y 对不起 (perdón)** — entre las palabras de supervivencia de mayor frecuencia de HSK1 — se usan en diálogos y textos de quiz (una pregunta de quiz pregunta qué significa 不客气), pero 谢谢, 对不起, y el propio 不客气 nunca aparecen como entradas explícitas de vocabulario en ninguno de los 14 escenarios.
- Los verbos de movimiento básicos **去 (ir)** y **来 (venir)** solo aparecen enterrados dentro de compuestos (去年, 去过, 回来) pero nunca se enseñan como verbos independientes, aunque 走 (caminar/ir) sí se enseña en Getting Started como un sustituto parcial.

Es justo señalar que es posible que estos elementos se cubran en algún contenido de introducción previo a Foundations que no forma parte del alcance de este análisis (por ejemplo, un primer contacto con pinyin y conceptos básicos) — este hallazgo solo puede hablar de lo que sí y no está en las listas de `vocabulary` de estos 14 escenarios tal como existen. Pero, tomado tal cual, un estudiante que solo completara estos 14 escenarios en orden produciría y reconocería con fluidez 我/你/是/uno al diez/谢谢 por la exposición constante en los diálogos, pero ninguna de esas palabras aparecería jamás en su lista de vocabulario, sus flashcards, ni su registro explícito de "palabras enseñadas" — algo relevante si la audiencia del instituto o ministerio va a verificar la completitud del currículo contra un inventario de palabras en lugar de leer los diálogos directamente.

## 10.5 Foundations (HSK 1-2) — evaluación general

La secuenciación de temas y la selección de puntos gramaticales (preguntas con 吗/呢, 想 para deseo, 了 para finalización, medidores que se construyen progresivamente de 个/口 a 张/台/次/首/位, estructuras de comparación que escalan de 比 a 没有...那么 a 比...多了) muestran una intencionalidad pedagógica real y siguen un arco creíble de HSK1→3. Verificado contra la lista oficial, el 87.7% del vocabulario del capítulo sí existe dentro del marco de los 9 niveles HSK, y más de la mitad de ese vocabulario encontrado (53.3%) está exactamente donde HanGo lo declara. Los dos problemas concretos, ahora cuantificados, son:

1. **Una deriva hacia arriba real y extendida** — 42.7% del vocabulario encontrado está por encima del nivel declarado, con varios casos (Money Banking, Places & Hours, Body & Feeling Unwell) llegando hasta 5-6 niveles de diferencia (ver Sección 10.3).
2. **La ausencia completa de pronombres, la cópula 是, y los números** de cualquier lista de vocabulario, pese al enmarcado explícito del currículo como "empezar desde cero" (Sección 10.4).

Ambos son ajustes de contenido concretos y realizables — no señalan un problema estructural en el diseño del currículo, que en términos de secuenciación pedagógica y progresión gramatical es sólido.

## 10.6 Everyday Life (HSK 3-4) — resultados cuantitativos

De las 632 palabras de vocabulario de los 17 escenarios de Everyday Life, **462 (73.1%) aparecen en la lista oficial** y 170 (26.9%) no aparecen en ninguno de los 9 niveles — una tasa de "no encontradas" más del doble que en Foundations, ya señal de que este capítulo se aleja más del vocabulario núcleo estandarizado. De las 462 encontradas:

| Resultado del cotejo | Palabras | % de las encontradas |
|---|---|---|
| Dentro del rango HSK declarado (3-4, o rangos mixtos como 2-3) | 175 | 37.9% |
| Por encima del rango declarado | 123 | 26.6% |
| Por debajo del rango declarado | 164 | 35.5% |

A diferencia de Foundations (donde domina la deriva hacia arriba), Everyday Life está genuinamente **dividido casi en tres**: ni siquiera 4 de cada 10 palabras encontradas están exactamente donde se declaran. Ejemplos representativos de cada dirección:

**Por encima del nivel declarado** — 恭喜 ("felicidades", Coffee Shop, declarado 2-3, real HSK7); 划算/前台 (Gym, declarado 3, real HSK7); 过奖/夸奖/打招呼 (Social Events, declarado 3, real HSK7); 条款/人为/损坏 (Renting, declarado 3-4, real HSK7); 应聘/预算/坦诚 (Job Interview Basics, declarado 4, real HSK7).

**Por debajo del nivel declarado** — 蔬菜/西红柿/土豆 (Grocery Shopping, declarado 2-3, real HSK5 — es decir, palabras que técnicamente están *por encima* de HSK1-2 pero *por debajo* de lo que este escenario específico declara, mostrando que la deriva no es uniforme ni siquiera dentro de un mismo escenario); 认识/公司/怎么 (Social Events lección 1, declarado 3, real HSK1); 喜欢 (Restaurant, declarado 3, real HSK1); 等 (Health, declarado 4, real HSK2).

**Omisiones gramaticales notables**: 虽然...但是 y 因为...所以 — dos de los conectores más fundamentales de HSK2/3 — no aparecen como punto de gramática nombrado en ninguno de los 17 escenarios. La construcción pasiva con 被 está ausente en todo el capítulo, incluso donde encajaría de forma natural (el paquete perdido de Post Office, el artículo dañado de Online Shopping, la licuadora rota de Roommate Issues — todos frasean el problema en voz activa). Y, de forma llamativa, 面试 ("entrevista") — el tema mismo del escenario Job Interview Basics — nunca se enseña como vocabulario explícito.

**Balance**: el capítulo sí incrementa su dificultad de forma intencional (la gramática elegida por nivel es apropiada: 把, 是...的 y comparaciones con 比较/更 en HSK3; condicionales compuestos como 只要...就, 万一, ...的话 en HSK4), pero el vocabulario está mucho menos alineado con esas etiquetas de lo que sugería la lectura cualitativa original — con una dispersión real hacia ambos lados, no solo una tendencia.

## 10.7 Advanced Situations (HSK 5-9) — resultados cuantitativos y una precisión metodológica clave

Antes de los números, una limitación real del propio estándar oficial: **HSK 3.0 no publica listas independientes para los niveles 7, 8 y 9** — los define como una única banda combinada "avanzada". Etiquetar una lección como HSK7 y otra como HSK8 o 9, como hace HanGo, afirma una granularidad que el estándar oficial no respalda; el cotejo de esta sección trata todo HSK7+ como una sola banda "avanzada" al comparar contra lo declarado.

De las 399 palabras de vocabulario de los 10 escenarios de Advanced Situations, **255 (63.9%) aparecen en la lista oficial de 9 niveles** y **144 (36.1%) no aparecen en ninguno** — la tasa de "no encontradas" más alta de los tres capítulos. De las 255 encontradas:

| Resultado del cotejo | Palabras | % de las encontradas |
|---|---|---|
| Dentro del rango HSK declarado (banda avanzada, 5-9) | 80 | 31.4% |
| Por encima del rango declarado | 37 | 14.5% |
| **Por debajo del rango declarado** | 138 | 54.1% |

Este es el hallazgo central, y corrige directamente una afirmación de la versión anterior de este informe: **más de la mitad del vocabulario verificable de Advanced Situations está, de hecho, por debajo del nivel que HanGo declara** — no es un problema marginal, es el patrón dominante del capítulo.

Y sobre las palabras que el informe anterior calificó de "genuinamente HSK7-9-caliber" (系统性风险, 二元对立, 传导机制, 前庭性偏头痛, 不可撤销, 愿闻其详, 竞业限制, 互利共赢, 蒸蒸日上, 实至名归, 万事如意, 非黑即白, 五险一金): verificadas una por una contra la lista oficial, **12 de esas 13 no aparecen en ningún nivel del HSK 3.0** — solo 至关重要 sí es oficialmente HSK7-9. Esto no significa que sean palabras incorrectas o inventadas — son vocabulario real, avanzado y apropiado a su registro (compuestos técnicos, modismos) — pero **están fuera del marco HSK por completo**, no "dentro de HSK7-9" como se afirmó originalmente. Es una distinción importante para un informe que se presentará ante un instituto o ministerio: ese vocabulario certifica dominio avanzado del chino real, pero no debe presentarse como evidencia de cobertura del examen HSK específicamente.

## 10.8 Advanced Situations (HSK 5-9) — ejemplos verificados y evidencia de etiquetado inconsistente

Algunos de los casos con mayor brecha verificada (nivel declarado por HanGo vs. nivel oficial real):

| Escenario | Palabra | Nivel HanGo | Nivel oficial real | Brecha |
|---|---|---|---|---|
| Tech and Finance Expert Panel (lección tope, HSK9) | 总结 ("resumir") | 8-9 | 3 | 5-6 |
| Tech and Finance Expert Panel | 补充 / 保留 / 形成 / 主持 | 8-9 | 3 | 5-6 |
| Diplomatic Negotiation | 水平 ("nivel") | 7-9 | 2 | 5-7 |
| Legal and Notarial Procedures | 通知 / 顺利 | 6-7 | 2 | 4-5 |
| Formal Speech and Toast | 周年 / 干杯 | 6-7 | 2 | 4-5 |
| Specialist Medical Consultation | 效果 / 调整 / 记录 | 7-8 | 3 | 4-5 |
| Diplomatic Negotiation | 深入 ("a fondo") | 7-9 | 3 | 4-6 |

La lección etiquetada HSK9 — el techo nominal de todo el currículo — es, palabra por palabra, una de las que más términos de nivel HSK3 contiene de todo el capítulo. Esto confirma, ahora con cifras exactas, la observación cualitativa original sobre 总结 y 平衡 (平衡 resultó ser oficialmente HSK6, tres niveles por debajo de su etiqueta HSK9).

**Evidencia de un etiquetado inconsistente, ahora con el nivel oficial real de cada palabra repetida**: como `hskReference` se asigna por lección y no por palabra, la misma palabra carga niveles de dificultad muy distintos según en qué lección haya caído:

| Palabra | Aparece en HanGo como... | Nivel oficial real |
|---|---|---|
| 分歧 ("desacuerdo") | HSK5 (7.4) y HSK9 (7.10) | HSK7 |
| 深入 ("a fondo") | HSK5 (7.3) y HSK9 (7.9) | HSK3 |
| 耐心 ("paciencia") | HSK5 (7.4) y HSK9 (7.9) | HSK5 |
| 维持 ("mantener") | HSK5 (7.1) y HSK8 (7.9) | HSK4 |
| 坦诚 ("sincero") | HSK5 (7.4) y HSK7 (7.9) | HSK7 |

El patrón es revelador: en 3 de los 5 casos, ni siquiera la etiqueta *más baja* de las dos coincide con el nivel oficial real — 深入 y 维持 están sobrevaloradas incluso en su aparición "más baja". Esta es la evidencia más clara y ahora verificada de que `hskReference`, en este capítulo, funciona como una etiqueta aproximada de dificultad narrativa por lección — no como un mapeo fundamentado en la lista oficial.

**Omisiones notables** dado el tema de cada escenario: el registro legal nunca usa 甲方/乙方 ("Parte A/Parte B"), 法律效力 ni 违约责任; el registro diplomático omite 求同存异 ("buscar puntos en común dejando de lado las diferencias" — el modismo diplomático más esperado para esta situación exacta); el registro académico omite 综上所述 o 由此可见. De los ~400 elementos de vocabulario del capítulo, solo 5 están marcados como modismos (成语): 实至名归, 蒸蒸日上, 万事如意, 非黑即白, 至关重要 — y de esos 5, solo el último es oficialmente HSK7-9.

## 10.9 Desglose por Dominio interno (no solo por capítulo)

Todo el análisis anterior agrupa por los 3 capítulos que ve el estudiante. Pero, puertas adentro, esos 3 capítulos están construidos sobre **9 Dominios** de autoría de contenido (Sección 3.3.1) — y agregarlos todos en "Everyday Life" difumina diferencias reales entre, por ejemplo, el dominio Salud y el dominio Trabajo y Oficina, aunque ambos vivan en el mismo capítulo. Este desglose repite el mismo cotejo verificado de las secciones anteriores, esta vez por Dominio:

| Dominio interno | Escenarios | Vocabulario total | Encontrado en lista oficial | Dentro de rango declarado | Por encima | Por debajo |
|---|---|---|---|---|---|---|
| Foundations | 14 | 559 | 87.7% | 53.3% | 42.7% | 4.1% |
| Daily Life (Restaurant, Shopping) | 2 | 48 | 56.3% | 18.5% | 48.1% | 33.3% |
| Travel (Hotel) | 1 | 24 | 62.5% | 33.3% | 53.3% | 13.3% |
| Getting Around | 1 | 40 | 77.5% | 45.2% | 25.8% | 29.0% |
| Making Friends | 1 | 40 | 77.5% | 38.7% | 22.6% | 38.7% |
| Health | 1 | 40 | 82.5% | 36.4% | 36.4% | 27.3% |
| Work & Office | 1 | 40 | 85.0% | 20.6% | 8.8% | **70.6%** |
| Everyday Life (dominio interno, 10 escenarios) | 10 | 400 | 72.8% | 41.2% | 24.7% | 34.0% |
| Advanced Situations | 10 | 399 | 63.9% | 31.4% | 14.5% | 54.1% |

*(Foundations y Advanced Situations son, cada uno, un capítulo hecho de un solo Dominio — sus cifras aquí son idénticas a las de las Secciones 10.2 y 10.7. Las siete filas de en medio son las que antes solo existían agregadas dentro de "Everyday Life".)*

**El hallazgo más importante de este desglose corrige una afirmación anterior de este mismo informe.** La Sección 6.7 (y la nota de alineación de Work & Office) señaló, con ejemplos reales y verificados, que ese escenario usa palabras de registro elevado (挑战性, 调研, 汇报, 周到 — HSK6-7). Esas palabras existen y esa observación es correcta — pero, vistas en conjunto con las otras 36 palabras del escenario, son la excepción, no la regla: **el 70.6% del vocabulario de Work & Office está, en realidad, por debajo del nivel HSK4 que declara** — es, en conjunto, el dominio con más contenido "demasiado fácil" de toda la Sección 6, no el más difícil. La lectura correcta no es "Work & Office es más difícil de lo que dice ser" sino "Work & Office mezcla un puñado de términos genuinamente avanzados dentro de un fondo mayormente básico" — una combinación distinta, y un ajuste de contenido distinto (agregar vocabulario intermedio real, no simplificar los términos avanzados).

Otros hallazgos nuevos de este desglose:
- **Daily Life (Restaurant + Shopping)** tiene la tasa más baja de "encontrado en la lista oficial" entre los dominios pequeños (56.3%) — vale la pena revisar ese vocabulario específicamente antes que el resto.
- **Getting Around** es, de los 7 dominios de un solo escenario, el mejor alineado con su propia etiqueta declarada (45.2% dentro de rango) — a pesar de ser también el dominio con el desajuste de nivel más citado en la Sección 6.4 (las lecciones 1-2 etiquetadas HSK2 con contenido HSK3-4); el resto del escenario compensa esa parte.
- **Getting Around**, **Making Friends** y **Health** están casi empatados entre "por encima" y "por debajo" — no tienen un sesgo dominante como sí lo tienen Work & Office (hacia abajo) o Daily Life/Travel (hacia arriba).

## 10.10 Síntesis — los 9 niveles HSK en conjunto, con cifras verificadas

| Capítulo | Vocabulario total | Encontrado en lista oficial | Dentro de rango declarado | Por encima | Por debajo |
|---|---|---|---|---|---|
| Foundations (HSK 1-2) | 559 | 87.7% | 53.3% de lo encontrado | 42.7% | 4.1% |
| Everyday Life (HSK 3-4) | 632 | 73.1% | 37.9% de lo encontrado | 26.6% | 35.5% |
| Advanced Situations (HSK 5-9) | 399 | 63.9% | 31.4% de lo encontrado | 14.5% | 54.1% |

Tres patrones distintos, cada uno verificado:

- **Foundations**: la mayoría del vocabulario sí existe en el marco oficial (87.7%), pero cuando se desvía, lo hace consistentemente **hacia arriba** (42.7% del vocabulario encontrado).
- **Everyday Life**: el capítulo con menor coherencia interna — el vocabulario se dispersa en ambas direcciones casi por igual, y ni siquiera 4 de cada 10 palabras están donde se declaran.
- **Advanced Situations**: el patrón se invierte — la desviación dominante es **hacia abajo** (54.1%), y además es el capítulo con la mayor proporción de vocabulario fuera del marco HSK por completo (36.1%), en gran parte porque su vocabulario más avanzado (modismos, compuestos técnicos) sencillamente no está cubierto por la lista oficial de 9 niveles.

**Conclusión verificada**: `hskReference` es una etiqueta de dificultad relativa **dentro del propio currículo de HanGo** — útil para secuenciar contenido de forma interna — pero, cotejada palabra por palabra contra el estándar oficial de 2021, **no es una certificación fiable del nivel HSK real de cada lección**, en ningún capítulo. El diseño pedagógico subyacente (secuenciación de gramática, escenarios comunicativos reales, recurrencia de vocabulario) sigue siendo sólido; lo que este cotejo demuestra es que el *etiquetado numérico* de dificultad necesita una revisión palabra por palabra antes de presentarse como alineación certificada con HSK ante una audiencia institucional.

---

# 11. Conclusión

HanGo mide el progreso de forma resistente a la inflación de un solo intento, alineada con las expectativas reales de HSK, y utilizada de forma consistente por Han para encontrarse con cada estudiante exactamente en el punto en el que se encuentra. El sistema de puntuación está diseñado deliberadamente para que los últimos niveles (HSK 7-9) requieran meses de práctica sostenida y consistente, no solo volumen — reflejando la dificultad real de alcanzar fluidez avanzada en chino mandarín.

El currículo, organizado alrededor de situaciones comunicativas reales en lugar de listas léxicas aisladas, cubre el rango completo de HSK 1 a HSK 9 a través de 41 escenarios y 164 lecciones repartidos en tres capítulos: Foundations (14 escenarios, HSK 1-2) como punto de entrada para un estudiante que comienza desde cero, Everyday Life (17 escenarios, HSK 3-4) para la comunicación cotidiana real, y Advanced Situations (10 escenarios, HSK 5-9) para el registro profesional, académico, legal y diplomático más exigente.

La auditoría de alineación HSK de la Sección 10 cotejó, palabra por palabra, las 1,590 entradas de vocabulario del currículo contra la lista oficial de 9 niveles del estándar de 2021 — no una impresión cualitativa, sino un cotejo verificado. El resultado confirma que el diseño pedagógico general es sólido (secuenciación de gramática coherente, escenarios comunicativos genuinos, una progresión de dificultad intencional), pero también revela que **la etiqueta `hskReference` de cada lección no es, por sí sola, una certificación fiable del nivel HSK real**: en Foundations, el 42.7% del vocabulario verificable está por encima del nivel declarado; en Advanced Situations, el 54.1% está por debajo, incluyendo la propia lección etiquetada como HSK9 — el techo del currículo — cuyo vocabulario de apertura resultó ser, en la lista oficial, de nivel HSK3. Esto no señala un problema estructural en el currículo, pero sí una revisión de etiquetado concreta y priorizable antes de presentar HanGo como certificablemente alineado con HSK ante una audiencia institucional — la Sección 10 documenta, escenario por escenario, exactamente dónde.

---

*Fin del documento.*
