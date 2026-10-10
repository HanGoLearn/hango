# HanGo — Plan vivo de mejoras de IA conversacional

Estado: **Diseño y priorización**

Inicio: **2026-10-04**
Despliegue: **publicación en GitHub autorizada el 2026-10-09; aceptación de voz real pendiente**

## Propósito

Este documento registra las decisiones, propuestas, pruebas y entregas de la
siguiente mejora grande de IA de HanGo. Evita que una idea conversada se pierda
o se aplique por accidente a otro producto de voz.

El foco inicial es **Speaking de Learning Journey**. Cualquier cambio en otro
sistema debe indicarlo explícitamente antes de implementarse.

## Sistemas que deben seguir separados

| Sistema                      | Función principal                                                      | Regla de alcance                                             |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Han Tutor lateral            | Tutor personal para explicar, enseñar y acompañar                      | No heredar automáticamente reglas del role-play              |
| Han Companion                | Conversación visual con el orbe                                        | Mantener identidad, memoria y experiencia propias            |
| Speaking de Learning Journey | Role-play curricular ligado a una lección y objetivos concretos        | Foco principal de este plan                                  |
| Speaking Lab                 | Práctica independiente: estaciones guiadas, shadowing y práctica libre | No mezclar progreso ni evaluación con Learning Journey       |
| Speaking del placement       | Evidencia para estimar nivel                                           | No convertirlo en tutor ni usar la puntuación de una lección |

Algunas superficies comparten infraestructura Realtime, pero **compartir código
no significa compartir pedagogía, prompts, memoria, evaluación ni progreso**.

## Estados usados en este plan

- **Hecho local:** implementado y verificado en `localhost`, todavía sin commit.
- **Aprobado:** decisión aceptada por el usuario y lista para construir.
- **Propuesto:** candidato que debe revisarse antes de implementarse.
- **Descartado:** no se hará; se conserva la razón para no reabrirlo sin contexto.
- **Desplegado:** commit, GitHub y Vercel verificados.

## Actualización 0 — Control explícito del audio

Estado: **Hecho local; pendiente de prueba del usuario y despliegue**

- Mantener presionado para hablar y soltar para enviar.
- Micrófono deshabilitado fuera de la presión física.
- Buffer nuevo al comenzar cada presión; el ruido anterior no entra al turno.
- Un toque demasiado corto se descarta y no genera respuesta.
- Estados visibles separados: listo, escuchando, analizando y hablando.
- El botón de hablar y el de terminar conversación son acciones distintas.
- Se desactivó la detección automática de fin de turno en Realtime.
- El botón permanece disponible mientras Han o el personaje habla. Al comenzar
  una nueva presión, se cancela la respuesta activa y se vacía inmediatamente
  el audio WebRTC que todavía estaba en cola; la misma presión ya abre el nuevo
  turno del alumno, sin obligarlo a esperar el final de la frase de la IA.
- La confirmación tardía de la respuesta cancelada no puede apagar el micrófono
  ni borrar el nuevo turno que el alumno ya está grabando.
- No se cambiaron la personalidad, los prompts pedagógicos ni las rúbricas.

Superficies técnicas alcanzadas por esta entrega:

- Learning Journey Speaking y su modo local de prueba.
- Conversación Realtime de Han y Han Companion, conservando sus UI distintas.
- Práctica libre Realtime de Speaking Lab.
- Grabadores guiados de Speaking Lab y micrófono de entrada de Han.
- Placement Speaking, que comparte la entrada Realtime pero conserva su
  evaluación independiente.

Verificación local de la interrupción: typecheck y 105 pruebas focalizadas
pasan, incluidas pruebas de componente que interrumpen a Han mientras aún está
generando y cuando ya terminó de generar pero queda voz en reproducción. Se
comprueba el orden `input clear` → `response cancel` → `output clear` y que
`response.done` no vuelve a silenciar el micrófono. Falta una comprobación
auditiva breve con la voz real del usuario antes del despliegue.

Seguimiento de navegador real (2026-10-08): la cancelación del servidor no era
suficiente para cortar de inmediato un fragmento WebRTC que ya estaba llegando
al navegador. Además, un `response.output_audio.delta` tardío podía devolver la
interfaz al estado de Han hablando y apagar el nuevo turno sostenido. Al
presionar, HanGo ahora silencia localmente el audio remoto sin esperar a la
red, conserva la secuencia oficial de limpieza/cancelación, mide si el audio
remoto es realmente audible, ignora deltas obsoletos y reactiva el sonido solo
para la siguiente respuesta válida. También procesa la confirmación
`output_audio_buffer.cleared`. Typecheck, lint focalizado y 104 pruebas de
interrupción, grabación, modalidad y Realtime pasan. Sigue pendiente únicamente
la confirmación auditiva del usuario con micrófono real.

Separación Tutor/Companion (2026-10-08): una prueba real reveló que Companion
todavía enviaba sus subtítulos al estado visual compartido de la burbuja Tutor.
Si la burbuja había quedado abierta antes de entrar en `/han/companion`, la ruta
la ocultaba sin cerrarla y podía reaparecer al salir mostrando la conversación
equivocada. Companion ahora conserva su transcripción únicamente dentro de la
sesión de voz, fuerza el cierre del Tutor al entrar en cualquier ruta autónoma
de Han y no navega al pulsar `End`. Los mensajes persistidos incluyen un límite
de superficie: Tutor solo lee/reinicia Tutor, Companion solo lee/reinicia
Companion y Speaking sigue separado mediante su contexto de role-play. Pasan
typecheck, lint, 189 pruebas focalizadas de unidad/componente y 18 pruebas de
integración con base de datos. Falta la confirmación visual final del usuario.

Integridad en ejercicios de ordenar (2026-10-08): Han Tutor recibió las piezas
`弟弟 / 笑了 / 高兴地`, pero añadió `很` y devolvió una estructura incorrecta. Los
turnos escritos y Realtime de Tutor ahora detectan que palabras, fichas o
posiciones enumeradas constituyen un conjunto cerrado. Deben usar cada pieza
exactamente una vez, sin añadir, retirar, duplicar, dividir ni combinar
elementos. Una conversión incierta de pinyin hablado a caracteres debe
presentarse como supuesto y, si sigue siendo ambigua, pedir confirmación o una
captura. La regresión concreta exige `弟弟高兴地笑了`: el grupo terminado en `地`
modifica `笑` y se coloca antes del verbo; `很` no existe entre las piezas. La
regla no se aplica a Companion ni a role-play/Speaking. Typecheck, lint y 173
pruebas focalizadas pasan.

## Actualización 1 — Pronunciación contextual en Han Tutor

Estado: **Hecho local; pendiente de prueba oral del usuario y despliegue**

Esta entrega mejora al **mismo Han Tutor lateral** cuando el alumno pide ayuda
de pronunciación. No crea otra personalidad y no modifica la pedagogía, memoria
ni progreso de Han Companion, Learning Journey Speaking, Speaking Lab o
placement.

- Han adapta la práctica al tamaño real del objetivo; el límite se aplica a la
  explicación de Han, nunca a la frase mandarín que el alumno quiera practicar.
- Para 1–4 sílabas, presenta `汉字 (pinyin con tonos)` y un microcoaching de
  hasta 45 palabras: una indicación útil y una repetición completa.
- Para 5–12 sílabas, conserva la frase completa, marca 2–3 grupos rítmicos y
  usa hasta 65 palabras antes de pedir una repetición completa.
- Para objetivos de más de 12 sílabas, muestra la frase y su pinyin completos,
  los divide en 2–4 grupos prosódicos y practica un solo bloque natural de 2–8
  sílabas por turno —preferentemente 2–6—. Después avanza por los bloques y
  finalmente recompone la frase; la explicación inicial usa hasta 80 palabras.
- Han no muestra ningún botón adicional. Ofrece conversacionalmente que también
  puede explicar por qué cambia el tono; solo si el alumno acepta desarrolla
  esa segunda capa en 3–5 frases y hasta 80 palabras.
- La explicación opcional cubre tonos de cita, sandhi y pronunciación conectada
  del objetivo actual sin introducir ejemplos, ejercicios o preguntas nuevas.
- Este límite breve es exclusivo de pronunciación. Las solicitudes amplias de
  gramática, vocabulario o uso conservan la explicación extensa de Tutor.
- Al usar el micrófono pequeño, analiza localmente el contorno tonal y pausas
  observables del audio de ese turno; no añade una segunda llamada de IA. En
  una frase larga evalúa solo el bloque activo, nunca atribuye a toda la oración
  un diagnóstico silábico obtenido de un único contorno.
- Corrige un solo punto de alto impacto por intento, con progresión de hasta
  cuatro intentos: expresión completa, sílaba aislada, recombinación y cierre.
- La transcripción solo confirma contenido aproximado: nunca se usa como prueba
  de tonos, iniciales, finales o ritmo. Si el audio no alcanza, Han debe decirlo
  y no inventar un error.
- La conversación Realtime escucha el audio real y aplica la misma disciplina
  pedagógica sin reutilizar puntuaciones del grabador pequeño.
- El estilo general de Han evita elogios vacíos y puede usar humor suave o una
  imagen física útil, pero nunca se burla del alumno ni de su acento.

Límite técnico honesto: el análisis local actual compara forma de F0 y pausas
de manera conservadora; todavía no es alineación fonética forzada ni certifica
iniciales/finales. Una calibración fonética más profunda queda como mejora
posterior, no como promesa de esta entrega.

Verificación local: typecheck y lint globales, 192 pruebas focalizadas y flujo
real completo en el Han lateral de `localhost`: microcoaching de `你好`, oferta
conversacional sin botón, explicación opcional compacta al aceptarla, una
pregunta amplia de gramática `把` que conservó su desarrollo extenso y una
frase larga de 22 sílabas que se mostró completa y se convirtió en práctica por
bloques. Falta validar con la voz real del usuario que la corrección del
siguiente turno resulte útil y no sobrediagnostique.

## Actualización 2 — Personalidad vocal expresiva de Han Tutor

Estado: **Hecho local; pendiente de escucha y calibración del usuario**

Esta entrega conserva la voz `cedar` y la identidad del mismo Han Tutor. No
intenta copiar a otro producto ni crea otro personaje: convierte la intención
de Han en una dirección vocal propia, más juvenil-adulta, carismática y humana.

- “Acento neutral” deja de significar “emoción neutral”: el español mantiene un
  acento latinoamericano claro y el inglés uno natural, pero con variaciones
  reales de altura, énfasis, cadencia, velocidad local y pausas.
- La energía responde al momento: sonrisa audible y juego ligero cuando cabe,
  claridad concentrada al corregir, calidez después de una dificultad y un
  pequeño aumento de energía ante un progreso concreto.
- La personalidad no depende de hablar más rápido. La velocidad general sigue
  siendo conversacional y las demostraciones de mandarín priorizan precisión,
  tonos y ritmo nativos.
- Se evita el extremo artificial: nada de voz de locutor, call center,
  presentador infantil, actor exagerado, entusiasmo constante, jerga forzada,
  chistes obligatorios o risas falsas.
- La dirección expresiva alcanza las dos formas de hablar de **Han Tutor**: la
  síntesis de una respuesta escrita y la conversación Realtime.
- Han Companion mantiene sus instrucciones de voz anteriores. Los role-plays
  de Learning Journey, Speaking Lab y placement tampoco heredan esta identidad.
- La caché de audio distingue ahora el estilo Tutor/Companion; una respuesta ya
  escuchada no puede ocultar el cambio reproduciendo el clip neutral anterior.

Verificación local objetiva: typecheck, lint, las 206 pruebas focalizadas
combinadas de Han y 4 pruebas de integración de la ruta de voz pasan. Hay una
muestra breve lista en el Han lateral de `localhost`; la aceptación subjetiva
del carácter, energía y naturalidad debe decidirla el usuario al escucharla.

## Actualización 3 — Corrección inteligente y preferencias temporales

Estado: **Hecho local; pendiente de prueba conversacional y despliegue**

Esta entrega alcanza únicamente al **Han Tutor lateral**, tanto en chat escrito
como en conversación Realtime. Consolida reglas que antes podían divergir
entre texto y voz sin crear otro Han, una pantalla nueva ni memoria permanente.

- En cada turno Han elige silenciosamente una sola acción adecuada: continuar
  cuando el significado está claro, reformular de manera natural un error menor,
  corregir de forma explícita un único problema importante y seguro, pedir una
  aclaración breve cuando la evidencia es ambigua, o iniciar pronunciación solo
  cuando el alumno la solicita o acepta.
- Una corrección explícita contiene la forma natural, una razón breve y el
  regreso a la conversación. No acumula errores, no inventa diagnósticos desde
  audio débil, no convierte cada turno en examen y no genera un informe final
  no solicitado.
- Texto y voz aplican la misma divulgación progresiva: una pregunta corta recibe
  una respuesta directa y como máximo un ejemplo útil; una explicación amplia,
  un segundo ejemplo o una nota de uso aparecen cuando el alumno los pide o
  realmente resuelven una diferencia.
- El idioma sigue la intención del alumno turno a turno. Una frase portadora en
  español o inglés puede contener mandarín sin cambiar el idioma de explicación;
  una conversación sustantiva en mandarín puede continuar en chino. El alumno
  puede pedir un idioma concreto para un solo turno o para la sesión abierta.
- Dentro de esa conversación abierta puede pedir menos correcciones y más
  fluidez, corrección equilibrada o más estricta, y voz lenta, normal o rápida.
  También puede decir “repítelo”, “divide la frase”, “compara cómo lo dije” o
  “habla más despacio”; Han ejecuta la acción sin convertirla en otra lección.
- Todo lo anterior es temporal. Al cerrar y abrir Han Tutor se vuelve a
  seguimiento automático de idioma, corrección equilibrada y velocidad normal.
  No se añadió memoria pedagógica persistente, nueva tabla, migración, resumen
  de sesión ni feedback visual.
- Han Companion, los role-plays de Learning Journey, Speaking Lab y placement
  no reciben estas reglas ni sus preferencias.

Verificación objetiva local: typecheck, lint y 187 pruebas unitarias/de
componentes focalizadas pasan, incluidas regresiones de idioma mixto,
conversación en mandarín,
preferencias temporales, órdenes directas, pronunciación y separación de
Companion. Falta conversar por voz en `localhost` para valorar naturalidad,
ritmo y frecuencia real de correcciones antes de desplegar.

## Hoja de ruta propuesta

Nada marcado como **Propuesto** se implementa hasta revisarlo con el usuario.

### 1. Conversaciones más naturales

Estado: **Propuesto**

- Respuestas breves y conversacionales, especialmente para principiantes.
- Evitar aperturas repetitivas como “Claro”, “Entiendo” o el nombre del alumno.
- No repetir una pregunta ya contestada ni pedir datos ya dichos en la sesión.
- Responder primero una pregunta real del estudiante y después regresar con
  naturalidad al objetivo de la escena.
- No robarle al alumno su frase o acción objetivo: el personaje crea la
  oportunidad y espera a que el alumno la produzca.
- Variar reacciones, preguntas de seguimiento y cierres sin perder el rol.
- Mantener una relación sana de tiempo hablado: el alumno debe hablar más que
  la IA en una práctica de Speaking.

### 2. Pedagogía adaptativa de verdad

Estado: **Propuesto**

- Ajustar vocabulario, velocidad, longitud y complejidad al nivel real del
  alumno y a la lección actual.
- Para nivel cero/HSK1: dar apoyo corto en español o inglés solo cuando sea
  necesario, mantener pinyin disponible y volver al mandarín practicable.
- Usar el vocabulario y la gramática ya enseñados como objetivos, no como un
  guion que la IA recita.
- Detectar si el alumno está bloqueado y ofrecer ayuda gradual: pista,
  estructura, ejemplo parcial y ejemplo completo como último recurso.
- Elegir correcciones según el objetivo del turno: no interrumpir por cada
  error si el significado se entiende.
- Reforzar errores recurrentes dentro de la conversación activa. Cualquier
  memoria entre sesiones queda fuera de Han Tutor hasta una aprobación futura
  explícita y deberá diseñarse sin contaminar los otros sistemas de Han.

### 3. Transcripción y feedback confiables

Estado: **Propuesto**

- Mostrar con claridad qué entendió la IA después de cada turno, con opción de
  corregir la transcripción cuando sea necesario.
- Escribir mandarín en caracteres simplificados y ofrecer pinyin como apoyo
  separado; conservar normalmente el español o inglés hablado.
- No inventar una frase a partir de silencio, ruido, tos o audio insuficiente.
- Distinguir “no hubo evidencia suficiente” de “respuesta incorrecta”.
- Durante pronunciación, usar microcoaching: una indicación concreta, una
  demostración y una sola acción para el alumno. No repetir significado,
  traducción, pinyin hablado ni ejemplos alternativos en cada intento.
- Usar una coincidencia de transcripción de al menos 80% como señal pragmática
  para cerrar ese objetivo y avanzar. Esto evita bucles sobre una sílaba ya
  reconocida; no se presenta como una medición acústica perfecta de tonos.
- Dar microfeedback solo cuando aporta valor; reservar el informe completo para
  el final para no romper la conversación.
- En role-play curricular o laboratorio, un informe final basado en evidencia
  puede resumir objetivos logrados, comprensión, fluidez y una prioridad de
  mejora. Han Tutor lateral no genera un informe final automático.
- No presentar la transcripción como una medición exacta de pronunciación o
  tonos si el audio disponible no permite sostener esa conclusión.

### 4. Velocidad y continuidad

Estado: **Propuesto**

- Objetivo inicial: respuesta audible en menos de 2 segundos en condiciones
  normales y degradación comprensible cuando la red sea lenta.
- Medir por separado: soltar→transcripción, transcripción→decisión y
  decisión→primer audio.
- Preparar contexto y reglas al abrir la sesión para no recalcular lo mismo en
  cada turno.
- Evitar dobles respuestas, estados “analizando” atascados y audio cortado.
- Recuperar la interfaz con seguridad ante desconexión, timeout o rechazo del
  proveedor, sin duplicar progreso ni puntuación.

### 5. Experiencia móvil y señales de voz

Estado: **Propuesto**

- Botón grande, cómodo y fijo para el pulgar; impedir scroll o selección
  accidental mientras se mantiene presionado.
- Vibración corta opcional al empezar y terminar de grabar cuando el navegador
  móvil lo permita.
- Borde/orbe reactivo diferente para voz del alumno y voz de la IA.
- Indicaciones inequívocas: “Mantén para hablar”, “Suelta para enviar”,
  “Analizando” y “Han está hablando”.
- Verificar Android Chrome, iPhone Safari, auriculares Bluetooth, altavoz y
  cambios de orientación.

### 6. Coste, límites y operación

Estado: **En progreso**

- Mantener límites globales y por usuario separados para Realtime, STT, TTS y
  evaluaciones; conservar los overrides individuales del administrador.
- El inicio local de Realtime ya distingue pruebas de desarrollo de producción:
  localhost acepta más reinicios cortos y una reserva diaria predeterminada
  mayor, pero nunca reemplaza un límite explícito de usuario o función. La
  producción conserva sus límites anteriores y el presupuesto global de
  seguridad continúa aplicándose en ambos entornos.
- Mostrar un mensaje legible cuando un límite impida iniciar la sesión y, para
  el límite de ráfaga, comunicar cuánto falta antes de volver a intentar.
- Cerrar sesiones inactivas y establecer reserva suficiente para despedida y
  reporte final.
- Registrar coste y latencia por sesión, lección, sistema y proveedor sin
  guardar audio del alumno por defecto.
- Circuit breaker y fallback claro cuando se alcance presupuesto o falle el
  proveedor.
- Evitar llamadas repetidas para contexto, feedback o contenido que pueda
  reutilizarse de forma segura.

### 7. Medición pedagógica y de engagement

Estado: **Propuesto**

Medir antes de decidir que una mejora funciona:

- porcentaje que inicia y termina Speaking;
- turnos útiles del alumno por sesión;
- tiempo hablado alumno/IA;
- abandonos, repeticiones y uso de “Necesito ayuda”;
- falsos turnos por ruido y turnos sin transcripción;
- cumplimiento de objetivos de la escena;
- latencia mediana y percentil 95;
- coste medio y máximo por sesión;
- valoración del alumno y feedback cualitativo posterior.

No se usarán métricas oscuras para aumentar tiempo o gasto. Engagement aquí
significa que el alumno practica, entiende su progreso y quiere volver.

## Orden recomendado de ejecución

1. Probar y aceptar el push-to-talk actual en PC y celular.
2. Definir juntos la experiencia ideal de una conversación HSK1 desde cero.
3. Aprobar el bloque de naturalidad y pedagogía antes de editar prompts.
4. Construir una sola mejora por lote pequeño y probarla en `/speaking-test`.
5. Repetir pruebas HSK1, HSK3 y HSK5; después validar Han y Speaking Lab por
   separado para detectar efectos compartidos no deseados.
6. Añadir métricas y límites antes de abrir la mejora a usuarios beta.
7. Solo con aceptación local: commit, GitHub, despliegue en Vercel y prueba
   real en HTTPS desde Android/iPhone.

## Puerta de salida antes de GitHub/Vercel

Actualización 2026-10-09: el usuario autorizó explícitamente corregir la consulta
sobre capacidades de Han Tutor y subir todos los cambios revisados a GitHub.
Esta decisión reemplaza la pausa de publicación del 2026-10-04. Las casillas de
aceptación oral y móvil no se marcan como completadas por esa autorización;
siguen siendo comprobaciones de producto pendientes después de la publicación.

- [ ] El usuario acepta el comportamiento del botón en PC.
- [ ] El usuario acepta el comportamiento del botón en celular.
- [ ] No aparece una transcripción cuando no se mantuvo presionado.
- [ ] Soltar corta la captura antes de analizar.
- [ ] La respuesta usa únicamente el audio del turno enviado.
- [ ] Han, Learning Journey, Speaking Lab y placement conservan objetivos y
      progreso independientes.
- [ ] Pruebas automatizadas, compilación y prueba de voz real pasan.
- [ ] El lote exacto que se desplegará está revisado; no se incluyen cambios
      ajenos sin verificar.

## Registro de decisiones

| Fecha      | Decisión                                                                          | Estado      | Evidencia / nota                                                                    |
| ---------- | --------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| 2026-10-04 | Reemplazar escucha continua por mantener-presionado en las experiencias de voz    | Hecho local | Typecheck, lint, 115 pruebas focalizadas, build y revisión visual PC/móvil          |
| 2026-10-04 | No enviar todavía a GitHub/Vercel; diseñar primero la siguiente gran mejora de IA | Aprobado    | Solicitud directa del usuario                                                       |
| 2026-10-04 | Mejorar el Han Tutor existente con enseñanza contextual de tonos, sílabas y ritmo | Hecho local | 181 pruebas focalizadas y respuesta real verificada; falta intento oral del usuario |
| 2026-10-07 | Separar los reinicios de prueba local de los límites conservadores de producción  | Hecho local | Inicio local recuperado; 96 pruebas focalizadas; falta prueba real del micrófono    |
| 2026-10-07 | Cerrar cada objetivo de pronunciación al alcanzar 80% y usar microcoaching breve  | Hecho local | Regresión `共享喝水` → `我想喝水` cubierta; falta revalidación oral del usuario     |

## Próxima conversación de diseño

Para convertir propuestas en tareas aprobadas, definir en este orden:

1. Qué debe hacer la IA durante una conversación perfecta de nivel cero/HSK1.
2. Cuándo corregir y cuándo dejar fluir.
3. Qué debe ver el alumno después de soltar el botón.
4. Qué debe incluir el reporte final.
5. Qué recordar entre sesiones y qué nunca compartir entre sistemas.
