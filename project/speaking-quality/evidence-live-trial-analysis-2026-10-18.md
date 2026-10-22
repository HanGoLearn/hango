# Prueba real del formato nuevo: resultado y análisis crítico

## Conclusión

El transporte nuevo **pasó los controles técnicos con una respuesta real de
OpenAI**, pero eso no equivale a aprobar su calidad docente. La revisión crítica
de Codex encuentra explicaciones incorrectas y limitaciones de cobertura. Decisión:
mantener como candidato privado, no convertir en calificación ni publicar.
Este análisis no sustituye una evaluación independiente de un profesor nativo.

## Ejecución y gasto

El usuario autorizó gastar para probar el formato nuevo. Se mantuvo el máximo
anterior de US$0.05 y una sola llamada, sin reintentos. No se borraron ni reabrieron
los dos claims previos. Se añadió una autorización nominal diferente que requiere
el segundo predecesor rechazado y el transporte/esquema previsto. Cambiar versiones
no autoriza otras llamadas. La preparación coincide con el artefacto offline ya
guardado y se verifican de nuevo los pins del intento, snapshot y captura.

| Dato | Resultado |
| --- | --- |
| Proveedor/modelo | OpenAI / gpt-5-mini, mismos parámetros de razonamiento existentes |
| Solicitud | Catálogos L/P separados, selección por enums y ramas por recurso |
| Margen conservador previo | US$0.0181415, bajo reserva TEXT US$0.02 y máximo US$0.05 |
| Límite de salida | 3.500 tokens, incluido razonamiento |
| Timeout | 60 segundos solo en esta autorización; sin reintentos |
| Respuesta | Completa; contrato estructurado aceptado por el proveedor |
| Uso informado | 7.944 entrada / 2.535 salida |
| Coste calculado | **US$0.007056**; sin descontar posible caché |
| Registro local | Verificado por lectura de la fila propia del administrador, TOKEN_RATES, tarifas 0.25/2 por millón |
| Desde claim hasta respuesta guardada | Aproximadamente 33,8 s; no es latencia de una pantalla del alumno |
| Resultado técnico | VALIDATED_CANDIDATE; score=null, eligibleForRewards=false |
| Resultado de revisión crítica | No aprobado para convertirse en nota del estudiante |

Las tarifas se comprobaron en OpenAI Docs y la contabilidad se verificó siguiendo
la guía Prisma Client API. No se cambia proveedor/modelo, configuración de Han,
notas, General Level, recompensas o producción. Tres claims totales, cada uno
ligado a su autorización; ninguno se borra. Consumo de estas tres pruebas
candidatas juntas: US$0.01892875, no el coste histórico total de HanGo.

## Qué mejoró en esta respuesta

1. Citas originales y roles correctos: el modelo seleccionó referencias válidas;
   el servidor conservó texto y autor. Ya no escribió una cita del personaje como
   evidencia literal del alumno en los campos estructurados.
2. 高兴 está vinculado a la frase de presentación que sí contiene esa palabra.
   Desapareció la corrección de la frase sobre destinos bajo ese objetivo.
3. Las preguntas normales del personaje no se declararon automáticamente ayuda
   instructiva; las cuatro dimensiones indican NONE en vez de inventar dependencia.
4. No se inventaron notas de pronunciación o fluidez a partir de una transcripción.
5. El esquema nuevo funcionó con el proveedor. No hubo que reparar JSON, agregar
   citas, ajustar niveles o pagar otro intento para hacerlo pasar.

No se generalizan estas mejoras de una respuesta a todas las conversaciones.

## Auditoría semántica de los hallazgos

| Hallazgo | Revisión |
| --- | --- |
| Saludar | Evidencia adecuada: saludo del alumno, con contexto del personaje |
| Decir su nombre | Evidencia adecuada: presentación propia |
| Preguntar el nombre | **Cita incorrecta para ese acto**: seleccionó la presentación propia; la pregunta real está en una intervención anterior. Además, la explicación atribuye al alumno una pregunta recíproca que está en el turno del personaje |
| Preguntar origen | La intervención del alumno sí contiene nacionalidad y pregunta recíproca. La explicación describe principalmente responder y mezcla contexto previo/posterior, por lo que necesita más precisión |
| 你好 / 叫 | Evidencias apropiadas de producción en esta tarea |
| 名字 | El alumno sí usa la palabra; la razón, en cambio, habla de una pregunta del personaje ausente de los fragmentos del personaje seleccionados |
| 认识 | La frase seleccionada contiene el recurso, pero el motivo explica 高兴, no 认识 |
| 国 | Aparece dentro de 中国人: evidencia de esa expresión, no certificación de dominio independiente de 国 |
| Patrón de nombre con 叫 | Aplicación visible; la explicación conserva etiquetas inglesas en un informe español |
| Pregunta recíproca con 呢 | Aplicación visible. Contexto seleccionado no es el más pertinente para explicar la reciprocidad sobre origen |
| 高兴 | Uso pertinente en la presentación; no aparece la anterior falsa corrección bajo ese recurso |
| 哪 | No producido literalmente. Eso no prueba «sin oportunidad»: el alumno pudo resolver el acto mediante otra forma |
| 学生 / 学习 | No observados en la muestra clara; no convertir esa ausencia en fallo ni inferir automáticamente falta de oportunidad |

No se alteraron los hallazgos para que coincidieran con este análisis. La respuesta
del proveedor y su inspección se conservan intactas; se guarda otra revisión
cualitativa privada con decisión de retención, no una evaluación nueva.

## Por qué no convierto los cuatro niveles 4 en 100/100

El modelo propone nivel 4 para comunicación, vocabulario, gramática e interacción,
pero el contrato no asigna porcentaje global. Son ordinales referidos a la tarea,
no pronunciación perfecta, HSK certificado ni ausencia de errores universales.

Hay razones reales para reconocer buen desempeño básico: el alumno saluda,
pregunta un nombre, se presenta y sostiene preguntas sobre origen. Bajar la nota
simplemente por ser breve o usar palabras de la lección también sería incorrecto.
El problema no es que aparezca un máximo, sino que cada máximo debe estar bien
respaldado y tener un alcance claro, cosa que esta respuesta todavía no garantiza.

Solo cita tres de las cinco intervenciones claras del alumno. Las otras dos
incluyen una pregunta con 吗 y una ampliación sobre visitar otros lugares. No citar
un turno no demuestra que el modelo no lo leyera; sí impide comprobar cómo lo
consideró para justificar un máximo global del criterio. Ese 3/5 es cobertura de
referencias, **no precisión del modelo ni puntuación del alumno**.

La frase de ampliación podría requerir completar una referencia a un lugar, o
tener una elipsis/intención no confirmada. No se debe inventar el sentido, borrar
再 silenciosamente o cargar el problema a 高兴. Si se comenta, debe marcarse como
aclaración contextual y no como error seguro de un recurso ajeno.

Además, el piloto importado no suministró una selección editorial de actos
obligatorios: required=0 no significa que se haya demostrado cobertura obligatoria
perfecta. No se debe confundir un parámetro de prueba no seleccionado con dominio.

## Revisión del feedback y siguiente paso sin más gasto

La prosa aún no es apta para mostrarla directamente: tiene una atribución errónea
en el acto de preguntar nombre, mezcla palabras objetivo, conserva etiquetas
inglesas y expone un alias técnico L1_0. Los comentarios deben derivarse de
evidencias correctas y contener una mejora realmente pertinente, no elogios
genéricos ni un fallo inventado para bajar el nivel.

Siguiente trabajo offline recomendado:

- Separar **acto comunicativo demostrado** de **forma lingüística producida** y
  exigir correspondencia semántica entre acto, fragmento y explicación, no solo
  propiedad correcta del texto.
- Registrar qué se pudo observar de cada intervención, incluida extensión o
  ambigüedad, sin obligar a penalizar lo que se salga del banco.
- Distinguir no observado de sin oportunidad mediante evidencia contextual, no
  inferirlo solo por la ausencia de una palabra.
- Mantener el juicio y sus niveles originales en una capa privada; construir
  prosa visible localizada y sin IDs técnicos solo a partir de hallazgos aprobados.
- Calibrar los niveles con revisión docente independiente y ejemplos reservados.
  No interpretar este análisis de Codex como esa validación.
- Pronunciación/tonos y fluidez siguen pendientes de audio y validación acústica.
  No resolverlos con más instrucciones sobre una transcripción.

No se ejecuta otra llamada por estas recomendaciones. Tampoco se publica el
resultado ni se cambia la calificación existente del usuario.

## Verificaciones técnicas

40 pruebas simuladas en cuatro suites pasan antes de enviar, incluidos permisos
nominales separados, predecesor, contradicción de autorizaciones, repetición y
persistencia. Tipos, lint, formato y diff pasan. Respuesta guardada antes de
contabilidad e inspección; consumo confirmado por lectura posterior. No build,
migración, commit/push o despliegue en este bloque.

Referencias consultadas:

- [OpenAI Docs: GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini)
- [OpenAI Docs: Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat)
