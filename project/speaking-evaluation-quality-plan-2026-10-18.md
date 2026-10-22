# Speaking de Learning Journey: plan de calidad de evaluación y reflexión

Fecha: 18 de octubre de 2026.
Estado actualizado al 22/10/2026: auditoría, matriz editorial y contratos
candidatos desarrollados; reflexión integral experimental conectada localmente
para nuevos intentos ADMINISTRATOR. Tres P1 y nivel por experiencia corregidos
con pruebas. Ver `speaking-quality/fixes-and-progression-2026-10-22.md` y
`speaking-quality/unified-reflection-2026-10-21.md`. Prueba real de audio,
calibración docente, ajustes P2 y publicación siguen pendientes.

## 1. Resultado buscado y límites

Construir una evaluación formativa útil, explicable y contrastada: identificar lo que el estudiante demostró, qué necesita practicar y por qué recibe cada resultado. La aspiración es el rigor de una buena evaluación docente, no afirmar perfección automática, certificación HSK o equivalencia con un examinador humano.

Alcance: Speaking y reflexión final de Learning Journey. Han burbuja, Han Companion y Speaking Lab permanecen independientes. No introducir memoria pedagógica en Han burbuja, ni feedback visual durante la conversación. Conservar conversación natural, mantener presionado para hablar y ayuda ES/EN cuando se solicita.

Este documento no autoriza llamadas pagadas, contratación de docentes, nuevos proveedores, almacenamiento adicional de audio, cambios en producción ni reevaluaciones históricas. Esas operaciones requieren definir sus condiciones y la autorización que corresponda.

No borrar cuentas, progreso o currículo. No corregir la inflación simplemente bajando todas las notas, prohibiendo el 100 o inventando errores. La calidad se demuestra con evidencias y comparación externa.

## 2. Diagnóstico comprobado en el repositorio

- El juicio actual tiene cuatro dimensiones: comunicación 40%, uso del idioma 30%, interacción 20% y autonomía 10%. La escala ordinal 0–4 se convierte en puntuación mediante código.
- La captura sellada conserva turnos, texto original/reconocido, confianza de transcripción y estado de cierre. No es una medición acústica de tonos.
- El prompt final declara que no puede certificar pronunciación, tonos ni fluidez acústica. El 100 actual representa los cuatro máximos de esa rúbrica, no todas las capacidades orales.
- Hay una revisión de problemas de pronunciación en el código anterior, pero `finishConversation` y su persistencia la excluyen cuando `isolatedJourney` está activo. No basta con asumir que esos hallazgos llegan al informe nuevo.
- Se validan estructura, referencias, autoría y citas. Eso no demuestra que el juicio semántico sea justo.
- Los bancos de vocabulario/gramática core, support y extension y el contrato de conversación ya existen. No confundir exposición con dominio.
- La UI actual oculta el detalle de criterios y mezcla evidencias con recuentos técnicos. El diseño anterior tenía más identidad visual, pero su fórmula y algunas mediciones no deben restaurarse sin revisión.
- La conversación recuperada tiene cuatro niveles 4/4; no se dispone de una auditoría estadística que demuestre que todas las conversaciones obtienen 100. Esa frecuencia se medirá, no se supondrá.

Referencias locales principales:

- `src/lib/journey-speaking-attempt-contract.ts`
- `src/lib/journey-speaking-evaluation.ts`
- `src/lib/journey-lesson-report.ts`
- `src/lib/content/journey-speaking-bank-contract.ts`
- `src/components/ai-teacher/han-voice-conversation.tsx`
- `src/lib/speech/speaking-pronunciation-evidence.ts`
- `src/components/lesson/journey-final-report.tsx`
- `src/components/lesson/steps/reflection-step.tsx`

## 3. Reglas pedagógicas no negociables

1. Una transcripción correcta no demuestra tonos correctos. Una transcripción dudosa tampoco demuestra pronunciación incorrecta.
2. Cada fortaleza y error deben tener evidencia del mismo intento. Los errores fonéticos requieren audio identificable.
3. Distinguir correcto independiente, correcto con ayuda, autocorrección, error confirmado, no observado, sin oportunidad y no evaluable por problema técnico.
4. No sumar como dominio palabras del personaje, una copia inmediata sin transferencia o una respuesta genérica como 好.
5. Admitir respuestas breves, paráfrasis y desvíos cotidianos pertinentes; no usar longitud o número de turnos como sustituto de competencia.
6. Evaluar objetivos de la lección, no fluidez nativa universal. Las variaciones aceptables de acento no son por sí mismas errores.
7. La referencia de calificación proviene de la lección, sus bancos y sus requisitos. Ampliación autorizada el 21–22/10: los puntos existentes de General Level se congelan al comenzar cada intento y adaptan el apoyo inicial/extensión opcional, acotados a la tarea. No prueban competencia acústica, no suben la nota y no convierten una lección inicial en avanzada. Ver `speaking-quality/fixes-and-progression-2026-10-22.md`.
8. No convertir toda palabra no utilizada en una falta ni exigir un guion memorizado.
9. No penalizar al alumno por lenguaje demasiado difícil, preguntas repetidas, cortes o falta de oportunidades introducidos por la IA.
10. No descontar repetidamente un mismo fallo en varias dimensiones sin impactos distintos y explicados.
11. Pedir ayuda ES/EN es legítimo. La ayuda puede explicar que una producción fue asistida, no convertirla en error gramatical ni rebajar automáticamente todas las variables.
12. No forzar feedback negativo. Cuando no hay un error confirmado, distinguir un reto de ampliación de una corrección.

## 4. Parte A — Auditoría y línea de base

### Trabajo

- Dibujar el recorrido completo: micrófono → reconocimiento → conversación → cierre → captura → evaluación → informe → nota global → recompensas/General Level.
- Identificar qué audio existe realmente, cuánto permanece disponible y qué componentes lo reciben. No prometer recuperar tonos de sesiones que solo conservaron texto.
- Revisar una muestra autorizada de resultados existentes para observar distribución de notas, máximos por criterio, evidencia insuficiente, fallos y comentarios repetidos.
- Separar integridad técnica de validez pedagógica en las pruebas y documentación.
- Crear casos de regresión con texto ficticio para fallos conocidos: corrección inventada, frase reconstruida, asistencia confundida con autonomía y nota completa sin oportunidad.

### Entregables y aceptación

- Mapa de evidencia y tabla «se mide / no se mide / falta validar».
- Diagnóstico reproducible de la inflación, sin nuevas evaluaciones pagadas.
- Ningún cambio de notas, tablas o comportamiento productivo durante la auditoría.

## 5. Parte B — Matriz de evaluación por lección y dificultad

### Dimensiones propuestas

| Dimensión | Qué observa | No debe confundirse con |
| --- | --- | --- |
| Comunicación | Actos e intención expresados; entendimiento contextual demostrado | Repetir todas las condiciones del escenario |
| Vocabulario en conversación | Significado adecuado, selección y reutilización pertinente | Contar palabras o premiar lenguaje avanzado por sí mismo |
| Gramática en conversación | Control de las estructuras pertinentes, errores e independencia | Resultado de los ejercicios gramaticales |
| Pronunciación y tonos | Articulación, contrastes tonales y prosodia respaldados por audio | Confianza STT, similitud de texto o acento extranjero |
| Interacción y autonomía | Responder, iniciar, aclarar, adaptarse y transferir tras una ayuda | Número de preguntas o prohibición de pedir ayuda |
| Fluidez funcional | Continuidad y segmentación apropiadas al nivel | Hablar rápido, eliminar pausas normales o latencia de red |

Descriptores observables para cada nivel de cada dimensión: 0 dificultad observada incluso con apoyo; 1 desempeño limitado; 2 parcial/con apoyo; 3 eficaz con límites menores; 4 sólido y consistente para esa lección. Son anclas que deberán detallarse con ejemplos; no basta con reutilizar etiquetas genéricas.

### Adaptación al currículo existente

Usar `BEGINNER`, `INTERMEDIATE`, `UPPER_INTERMEDIATE` y `ADVANCED` y los niveles/secciones reales de contenido. Foundations necesita anclas específicas dentro de BEGINNER; no sustituir todo el currículo por cuatro etiquetas generales ni inventar equivalencias HSK/CEFR.

- Inicial/Foundations: intercambios breves y recursos elementales; pausas y respuestas cortas esperables; no exigir subordinadas ni velocidad.
- BEGINNER posterior: recombinar lo aprendido y sostener intercambios accesibles en situaciones conocidas.
- INTERMEDIATE: conectar ideas, describir y resolver necesidades con mayor independencia conforme a la lección.
- UPPER_INTERMEDIATE: justificar, matizar y reparar malentendidos usando los recursos realmente previstos.
- ADVANCED: precisión, registro, cohesión y flexibilidad vinculados al escenario; mayor exigencia sin convertir conocimientos profesionales en criterio lingüístico.

### Contrato por lección

Definir actos comunicativos centrales; vocabulario y gramática prioritarios; expresiones opcionales; variantes válidas; ayudas legítimas; oportunidades previstas; evidencias mínimas de los objetivos y errores típicos de referencia. No etiquetar esos errores de referencia como errores reales del estudiante.

Para cada objetivo registrar si hubo oportunidad, si fue intentado y qué se demostró. Si el personaje impidió observar un objetivo, el informe declara la limitación. La conversación ofrecerá oportunidades naturales, no interrogatorios ni repetición compulsiva.

### Aceptación

Primera lección y dos lecciones contrastantes revisadas a fondo antes de extender. Auditoría estructural de todos los bancos, con revisión pedagógica por lotes y seguimiento de lecciones aún no validadas. Ninguna sección se declara calibrada solo porque otra del mismo nivel pasó.

## 6. Parte C — Evidencia de audio y estudio de viabilidad

### Trabajo técnico

- Comparar revisión dentro de Realtime y alternativas de análisis de audio, sin elegir un proveedor por promesa comercial. Si se considera un servicio nuevo, verificar soporte real para mandarín y conversación espontánea, privacidad, coste y limitaciones vigentes.
- Separar sonidos iniciales/finales, contraste de tonos, pronunciación contextual y ritmo. Considerar cambios tonales, tonos neutros y realizaciones contextuales aceptables, con revisión docente.
- No usar un molde rígido de altura de voz; distinguir diferencias entre hablantes, micrófonos y condiciones de grabación.
- No trasladar directamente una nota de lectura de una frase conocida a conversación libre. El texto esperado de la lección no demuestra que esa fuera la frase pronunciada.
- Vincular cada hallazgo a un turno y segmento audible, clase de problema, evidencia, certeza respaldada y consejo. No presentar una «confianza» autodeclarada por un modelo como probabilidad estadística calibrada.
- Registrar ruido, eco, saturación, recortes y cobertura; no convertirlos en errores de idioma. Señalar cuando no se puede evaluar.
- Diseñar captura de voz del estudiante, no grabación indiscriminada del dispositivo ni mezcla con voz del personaje. Mantener el control de mantener presionado y no captar fuera de la intervención prevista.

### Privacidad y coste

Antes de almacenar o enviar audio adicional: informar al usuario, definir base/consentimiento cuando corresponda, duración, borrado y acceso privado por propietario. Usar cifrado en tránsito, almacenamiento privado, enlaces temporales y validación de tamaño/formato; no guardar binarios ni conversaciones en logs públicos o Git.

Presupuesto separado para conversación, reconocimiento y evaluación adicional, imputado a la experiencia correcta y sujeto al mismo control de límites. No adoptar una cifra fija como coste real de toda evaluación.

### Aceptación y decisión

Comparación ciega con grabaciones humanas revisadas. Si solo se detectan algunos problemas con fiabilidad, publicar solo esas capacidades validadas y mostrar lo no evaluado. Si no hay soporte acústico fiable, no ofrecer una nota oral integral como si lo hubiera. La falta de audio en intentos históricos no se resuelve inventándolo; una nueva muestra sería voluntaria.

## 7. Parte D — Nuevo juicio y cálculo explicable

### Arquitectura

- Mantener separadas la captura original, hipótesis de reconocimiento, análisis lingüístico, hallazgos acústicos y presentación pedagógica.
- El evaluador produce hallazgos y niveles justificados; el servidor calcula notas y contribuciones. El personaje de conversación no decide sus propias calificaciones.
- Conservar autoría, citas exactas, bancos/versiones originales y límites de seguridad. El diálogo es dato no confiable: una petición de «ponme 100» no modifica reglas.
- Registrar regla, versión, modelo/configuración, fuentes y cobertura por dimensión. No convertir un cambio de proveedor o prompt en una reinterpretación silenciosa del pasado.
- Priorizar severidad, recurrencia y efecto comunicativo; tratar una autocorrección de forma distinta a un fallo persistente. No restar puntos por cada repetición de una misma palabra de manera ilimitada.

### Ponderación candidata para experimentación, no aprobada para producción

Comunicación 20%, vocabulario 15%, gramática 20%, pronunciación/tonos 25%, interacción/autonomía 10% y fluidez funcional 10%.

Los pesos y umbrales definitivos se decidirán mediante comparación docente y análisis de sensibilidad. No atribuir validación científica a esta propuesta. Valorar si ciertas diferencias por etapa son necesarias; evitarlas si destruyen comparabilidad sin beneficio demostrado.

### Reglas de nota y cobertura

- Un 100 requiere desempeño máximo respaldado en todas las dimensiones requeridas y cobertura suficiente; no es una felicitación por terminar ni prueba de dominio general.
- Un error confirmado incompatible con el descriptor máximo debe reflejarse en su variable, sin inventar penalizaciones en las demás. No prohibir por sistema el 100 ni ajustar la distribución para que «parezca real».
- Falta de evidencia = no evaluado, no cero y tampoco máximo. No redistribuir automáticamente los pesos para inflar una nota parcial.
- Si falta una dimensión obligatoria, mostrar perfil parcial y distinguir finalizar práctica de recibir una nota integral. Definir esa política antes de conectar recompensas para no crear bloqueos indefinidos.
- Separar uso correcto de lo intentado de evidencia de los objetivos prioritarios. No calcular «dominio» como todas las palabras de la lección menos las no mencionadas.
- Definir redondeo explícito; no dejar que el redondeo o una media oculten una condición incumplida para el máximo.

### Integración

Mantener visibles las cuatro categorías de lección: vocabulario de ejercicios, gramática de ejercicios, comprensión y Speaking. La propuesta conserva inicialmente los pesos globales existentes 20/20/30/30; el nuevo desglose es interno a Speaking. No sumar otra vez las subvariables orales como puntos extra.

Probar las políticas para reintentos, primera respuesta de ejercicios, resultado parcial, estrellas, HanCoins, General Level y leaderboard. Recompensas idempotentes: recargar o recuperar no concede puntos dos veces. No recalcular notas históricas ni retirar premios sin una decisión explícita.

## 8. Parte E — Calibración y revisión docente

### Referencia humana necesaria

Para afirmar calidad comparable a una evaluación docente se necesita revisión humana real. Preferir docentes de mandarín como lengua extranjera, con dominio de Putonghua y experiencia en evaluación; ser hablante nativo por sí solo no garantiza criterio pedagógico.

Objetivo: dos revisores independientes para una muestra relevante y resolución de desacuerdos. Sin acceso a ellos se puede avanzar en ingeniería y pruebas, pero la validación docente queda pendiente, no «simulada» por dos modelos de IA.

### Corpus por etapas

- Piloto inicial propuesto: 24 intentos humanos autorizados, con desempeño limitado, intermedio y sólido, en varias lecciones iniciales. No usar únicamente a una persona, su administrador o audio sintético.
- Ampliación propuesta: al menos 80 intentos, aproximadamente 20 por dificultad real, diversos hablantes y dispositivos. Es un punto de partida operativo, no tamaño suficiente para una validación universal.
- Reservar al menos una cuarta parte como conjunto de prueba separado por hablante, no usado para ajustar reglas. Informar límites si algún grupo tiene pocas muestras.
- Incluir usuarios hispanohablantes/anglófonos, mezclas de idiomas, pausas, autocorrecciones, peticiones de ayuda, tonos/sílabas problemáticos, voces y micrófonos diversos, ruido y fallos de red.
- Escenarios de control: texto correcto/audio problemático; errores gramaticales con voz fluida; vocabulario limitado; ayuda seguida de transferencia; silencio; conversación excelente; IA fuera de nivel; evaluación manipulada por instrucciones en el diálogo.
- Datos sintéticos sirven para regresión técnica, no para demostrar por sí solos competencia evaluadora con alumnos reales.

### Métricas y umbrales provisionales de salida

Fijarlos antes de ver el resultado reservado; reportar cantidades e intervalos cuando sea viable, no solo porcentajes.

- Acuerdo entre docentes; error de la IA respecto al consenso, sesgo por dimensión/nivel y tasas de máximo injustificado.
- Objetivo inicial: al menos 85% de valoraciones a un paso o menos de la escala docente 0–4; acompañarlo de acuerdo exacto, error medio y concordancia ordinal para evitar una cifra engañosamente fácil.
- Objetivo inicial: precisión de correcciones específicas al menos 95% en casos evaluables; informar también cuántos errores reales se detectan y cuántos quedan sin detectar. No alcanzar precisión callando siempre.
- Repetir una muestra, con presupuesto autorizado, para medir estabilidad. Objetivo inicial: al menos 90% de criterios conservan nivel; investigar cualquier salto de más de un nivel.
- Cero certificados de tono basados solo en texto y cero máxima nota integral con dimensiones obligatorias no evaluadas en las pruebas de control.
- Toda corrección visible debe tener evidencia localizable. Los conflictos entre juicio y comentario bloquean el informe inconsistente, no toda la conversación guardada.
- Medir diferencias por idioma de ayuda, dispositivo y nivel; no afirmar equidad con grupos insuficientes ni inferir rasgos sensibles de la voz.

Estos valores son puertas de calidad propuestas, no estándares oficiales ni resultados logrados. Ajustar con justificación docente antes de fijar el protocolo; si no se cumplen, corregir y repetir, sin relajar después el examen reservado para pasar.

## 9. Parte F — Feedback específico y útil

Crear el comentario desde los hallazgos ya evaluados, no un segundo juicio libre que pueda contradecirlos. Comprobar consistencia entre nota, evidencias y recomendaciones.

Estructura:

1. Balance de lo demostrado, sin elogios vacíos ni afirmar dominio de lo no observado.
2. Uno o dos logros concretos, con ejemplo real y explicación de por qué funcionó.
3. Hasta dos prioridades de alto valor inicialmente; el resto accesible bajo detalle, sin ocultar el inventario de hallazgos confirmados.
4. Cada corrección: intervención original, alternativa adecuada, motivo breve y práctica relacionada. Caracteres, pinyin y traducción ES/EN cuando corresponda. Un diagnóstico tonal requiere evidencia acústica.
5. Un siguiente paso accionable; si no hay error confirmado, etiquetarlo como reto de ampliación.

El límite de prioridades evita sobrecarga, no impone explicaciones superficiales. El detalle puede ampliarse sin generar otra llamada de IA. No repetir lo mismo en resumen, logro, prioridad y cierre.

No reconstruir una frase ininteligible ni atribuir al alumno una oración corregida por el reconocedor. No confundir tono neutro con primer tono, ni forma de diccionario con pronunciación contextual. Los ejemplos lingüísticos requieren revisión de consistencia.

Feedback ES/EN coherente con el idioma de la interfaz/ayuda seleccionado; las citas chinas no cambian ese idioma. Nada de audio automático, burbuja abierta automáticamente o memoria añadida a otros sistemas.

Aceptación: lector puede identificar qué hizo bien, qué cambiar y cómo practicar; comentarios de intentos distintos no son intercambiables; no hay contradicción entre «sin errores» y una corrección obligatoria.

## 10. Parte G — Diseño profesional de la reflexión

### Dirección visual

Recuperar la identidad anterior: colores de marca, degradado contenido, Han integrado, estrellas reales y barras claras. No restaurar sus problemas de puntuación ni copiar toda su acumulación de secciones.

Antes de implementar el diseño final, presentar una propuesta estática/local con datos de ejemplo claramente marcados y estados completos e incompletos. Aprobar la dirección visual, no confundirla con una evaluación real validada.

### Jerarquía de pantalla

1. Cabecera compacta: lección completada, nota global, estrellas y Han sin tapar contenido. Animación breve opcional con respeto a movimiento reducido.
2. Resumen de lección: vocabulario, gramática, comprensión y Speaking con resultados y acceso claro a errores de ejercicios. Distinguir cuestionarios de aplicación oral.
3. Bloque destacado «Tu conversación»: nota, alcance/nivel, variables visibles, barras, contribuciones y una justificación breve. No esconder todo el fundamento del resultado.
4. «Lo que demostraste»: objetivos prioritarios con etiquetas comprendidas por el alumno, no códigos técnicos.
5. «Ajustemos esto»: correcciones priorizadas con caracteres, pinyin, traducción y explicación. Si existe audio conservado con permiso, reproducción explícita del segmento; sin audio disponible, no botón fingido ni reproducción automática. Evitar generar modelos TTS extra sin definir coste/caché.
6. Nota de Han: síntesis personal del intento, no repetición de las tarjetas ni otro sermón.
7. Próximo paso principal y acceso secundario a evidencias completas. Repetir no será obligación ni reinicio silencioso de la lección.

Estas son capas de lectura, no siete grandes paneles del mismo tamaño. Agrupar logros/correcciones/nota en una sección pedagógica, dar mayor peso a Speaking y permitir profundizar sin convertir la pantalla en un informe interminable.

### Calidad de interacción y accesibilidad

- Móvil primero; comprobar al menos 320, 390, 768 y 1440px, zoom 200%, tema claro/oscuro y textos ES/EN más largos.
- Sin superposición con Feedback, Han flotante, navegación inferior ni zonas seguras. Sin desplazamiento horizontal ni pinyin recortado.
- No depender de pulsación larga para descubrir notas. Acciones explícitas accesibles por teclado/lector de pantalla; foco, contraste, iconos con significado y no solo color.
- Mostrar estados: completo, evidencia parcial, audio no evaluable, procesando, fallo recuperable y resultado antiguo. No vestir un fallo técnico como mal desempeño.
- No incorporar gráficas de tonos o indicadores durante la conversación; este rediseño es del resultado final.

Aceptación: revisión visual local y aceptación del usuario antes de publicar; verificación final en móvil real y dominio publicado, sin confundir captura de ejemplo con funcionamiento real.

## 11. Parte H — Robustez, datos, costes e integración

- Nuevo contrato/versionado y migraciones aditivas solo si hacen falta; planes explícitos para desarrollo y producción, sin reutilizar conexiones equivocadas.
- Compatibilidad de lectura de informes antiguos, etiquetados por su alcance real, sin convertirlos falsamente en notas acústicas.
- Captura y resultado persistidos antes de navegación; estados recuperables y tiempos de espera razonables. Un fallo opcional de audio no pierde el resto del informe.
- Guardas de concurrencia, propiedad, límites y claves de idempotencia. Nunca repetir una solicitud pagada al abrir, recargar o cambiar de idioma.
- Separar candidatos privados de informes aceptados. Validadores estrictos, mensajes comprensibles y diagnósticos técnicos privados.
- Cachear el informe por intento/configuración; reordenar o desplegar evidencia no invoca IA. Un reintento nuevo no se confunde con la misma captura.
- Medir coste real por fase y duración y latencia mediana/p95 antes de comprometer cifras. Límites de administrador y analítica deben usar la misma experiencia contable, sin duplicar cargos lógicos.
- Un cambio de rúbrica no recalcula automáticamente General Level, estrellas o HanCoins históricos; decidir política de nuevos intentos y recuperación por separado.
- Pruebas de contratos/citas, cálculo, ayuda, idioma, persistencia, errores, privacidad, audio ausente, dispositivos y recompensas. Las pruebas técnicas no sustituyen calibración docente.

Aceptación: una conversación produce un resultado recuperable; recargar no consume ni premia de nuevo; fallos no borran trabajo; desarrollo/producción permanecen separados.

## 12. Parte I — Piloto y publicación gradual

1. Implementar y comprobar en desarrollo, con datos de prueba identificados y sin consumo pagado automático.
2. Validar matriz lingüística y mediciones de audio por separado; no activar una nota integral antes de que ambas cumplan su alcance.
3. Ejecutar lote pagado de calibración solo tras acordar presupuesto, grabaciones y personas revisoras. Una segunda IA no sustituye al consenso docente.
4. Probar el recorrido completo en la cuenta de prueba: conversación, cierre, guardado, informe, variables, correcciones y puntos.
5. Revisar contigo el diseño final y claridad pedagógica. Incluir intento flojo, intermedio, excelente y técnicamente incompleto, no solo una demo perfecta.
6. Publicar con activación limitada por entorno/cohorte, monitorización y posibilidad de volver a la versión anterior sin borrar datos.
7. Ampliar por dificultad y lecciones tras comprobar el lote correspondiente; no abrir todo el currículo como validado por una sola prueba inicial.

Condiciones de publicación: integridad técnica verde, criterios pedagógicos contrastados, capacidades acústicas declaradas con honestidad, diseño aceptado, presupuesto conocido, privacidad definida y prueba real de persistencia/recompensas.

## 13. Orden de entregas

| Entrega | Contenido | Dependencias y salida |
| --- | --- | --- |
| 1 | Auditoría, contrato pedagógico y matriz piloto | Sin nuevas llamadas pagadas; criterios de calidad explícitos |
| 2 | Viabilidad/captura acústica y corpus de referencia | Permisos/budget para audio; disponibilidad de revisores para validación real |
| 3 | Evaluador versionado, cálculo, evidencia y feedback | Rúbrica definida; pruebas con fixtures; notas no publicadas como calibradas |
| 4 | Comparación docente, estabilidad y ajustes | Lote autorizado y referencia humana; aprobación de capacidades reales |
| 5 | Propuesta visual y reflexión final | Diseño puede prepararse antes con fixtures; no requiere esperar para mostrarlo |
| 6 | Integración, QA extremo a extremo y piloto en Vercel | Aceptación funcional/pedagógica/visual y publicación autorizada |

Se puede preparar diseño y trabajo de ingeniería mientras se consiguen revisores. Eso no elimina el bloqueo para afirmar «calibrado con docentes» o medir tonos con calidad no comprobada.

No prometer una fecha cerrada sin resolver audio, presupuesto y revisión docente. Informar por entrega: implementado, comprobado técnicamente, validado pedagógicamente, publicado y pendiente. Son estados distintos.

## 14. Fuentes y alcance de su uso

Avance 18/10: propuesta visual independiente disponible en localhost,
`/es/reflection-design` y EN. Detalle y verificaciones en
`speaking-quality/phase-5-reflection-design.md`. Preparada en paralelo con
fixtures explícitos; no implica completar calibración, audio o integración.

- [OpenAI, Realtime Eval Guide](https://developers.openai.com/cookbook/examples/realtime_eval_guide): respalda separar audio de transcripción y combinar pruebas reproducibles con revisión humana. No certifica que un modelo califique tonos de mandarín con la calidad buscada.
- [Consejo de Europa, Phonological competence](https://www.coe.int/en/web/common-european-framework-reference-languages/phonological-competence): orienta a distinguir articulación/prosodia e inteligibilidad de la imitación de un acento nativo. No implica equivalencia entre niveles HanGo, HSK y CEFR.
- [EEF, Teacher Feedback to Improve Pupil Learning](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback): apoya feedback vinculado a objetivos y útil para la siguiente acción. Su contexto principal es escolar; no valida directamente un tutor automático de mandarín para adultos.

Los pesos, tamaños de piloto, umbrales y etapas de este documento son propuestas de producto/ingeniería, no estándares oficiales derivados de esas fuentes.
