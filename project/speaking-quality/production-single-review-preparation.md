# Preparación de una única revisión con la conversación de producción

18/10/2026. Usuario autoriza **preparar** la prueba reutilizando su conversación
guardada de Vercel, sin cambiar nota ni puntos. La autorización de esta etapa
no ejecuta todavía el consumo adicional; presupuesto pendiente de acordar.

## Hechos comprobados

- Proyecto seleccionado explícitamente en Prisma Console: HanGo Producción.
  No se usó la base local ni se dedujo el destino por un nombre parecido.
- Sin conexión privada de producción configurada: la conexión temporal previa
  ya estaba revocada. Se utilizó Studio con la sesión existente, sin crear
  credenciales, ampliar acceso, cambiar conexiones o publicar endpoints.
- Consultas SELECT limitadas a hango.learn@gmail.com, primera lección y un único
  intento sellado. Hay 13 turnos. La nota original es 100 y requestCount es 4.
- Hashes canónicos de snapshot y captura coinciden con sus valores congelados,
  tanto en la comprobación del resultado de Studio como en el preflight local.
- Copia de datos del intento y preparación en `.storage/journey-quality-imports`,
  ambas excluidas de Git. No es importación/restauración de la base ni una cuenta
  local nueva. Contienen texto privado en claro: tratar como artefactos privados,
  no adjuntar a un commit, reporte público o endpoint.
- Se conserva el contexto original para integridad; el mensaje futuro no incluye
  notas/respuestas de ejercicios ni la calificación anterior. Una intervención
  del estudiante con reconocimiento dudoso se excluye del texto evaluable.
- Cero llamadas pagadas, cero escrituras en bases, cero cambios de notas/puntos.

## Código y comprobaciones

`prepareImportedJourneyQualityReview` exige pins independientes del ID, snapshot
y captura, verifica versión/banco, orden y contenido y produce solo solicitud y
recibo. Los pins deben proceder de una consulta autorizada: etiquetas/hashes que
un archivo declare por sí mismo no prueban propiedad o procedencia.

El script `scripts/prepare-imported-journey-quality.ts` solo admite artefactos bajo
la carpeta privada, conserva el original y crea la preparación con wx; no importa
proveedor o DB, no configura conexiones ni ejecuta una evaluación. Un consumidor
posterior necesita autorización, presupuesto, límites y ledger de despacho único;
este preflight no es un bypass de esos controles.

Prueba real offline del único export: 13 turnos, ambos hashes verificados y una
intervención dudosa omitida; la preparación guardada coincide con la regenerada
en memoria. Suite dirigida de import/review/context: 49/49 pasa; tipos y lint
dirigido pasan. No se certifica calidad de juicio o medición acústica sin ejecutarlo.

No se reemplaza la selección vacía de la pantalla local por registros de otra
base. Los artefactos de producción quedan claramente separados. Siguiente paso:
acordar presupuesto para una sola evaluación, sin reintentos automáticos y sin
actualizar la calificación original ni premios. Revisar esa respuesta sin IA antes
de considerar otra llamada.

## Ejecución única autorizada — 18/10/2026

El usuario confirmó un máximo de US$0.05, una sola evaluación, sin reintentos.
Se añadió una herramienta manual separada de las rutas de aplicación, con pins
del intento y huella de la base local para contabilidad; no importa el intento
en esa base ni necesita una conexión de escritura a producción. El flag de la
pantalla/servicio de pruebas sigue apagado. No se publica ni cambia el evaluador.

- Modelo existente `gpt-5-mini`, salida máxima 3.500 tokens incluidos razonamiento,
  timeout 45 segundos, retry=false. Tarifas verificadas en documentación oficial:
  US$0.25/M entrada y US$2/M salida. No se aplica descuento de caché.
- Margen previo conservador: bytes UTF-8 de petición/esquema más 4.096 tokens
  de reserva de entrada; US$0.011545, inferior tanto al máximo del usuario como
  a la reserva TEXT de US$0.02. No es una tarifa fija ni una factura de OpenAI.
- Límites existentes respetados; identidad administradora verificada por lectura
  en la base local fijada. Registros de operación/consumo exclusivamente locales,
  feature lesson-reflection, experience LESSON_REFLECTION. No gasto reasignado
  ni registro de consumo agregado a la base de producción.
- Claim exclusivo permanente antes del envío: no se elimina tras bloqueo, timeout,
  rechazo o fallo de almacenamiento. Respuesta guardada antes de registrar gasto
  y validar. No se llama al proveedor de nuevo para reparar un candidato.
- Un despacho real. Respuesta completa: entrada 3.052, salida 2.532 tokens;
  coste calculado US$0.005827. Registro local de consumo confirmado por retorno.
- Estado REJECTED_CANDIDATE: WORD_NOT_PRODUCED (f5 atribuye un saludo a una cita
  que solo pregunta el nombre) y MISSING_INTERLOCUTOR_CONTEXT (interacción cita
  solo al estudiante). La respuesta original y el rechazo están en el ledger
  privado ignorado por Git, sin reescribirlos para que pasen el control.

La revisión cualitativa de Codex de esta respuesta detecta también dos riesgos
que los controles actuales no resuelven por completo: equiparar el avance normal
del personaje con ayuda pedagógica y vincular una corrección de frase a un objetivo
de vocabulario distinto. Además, parte del motivo de gramática mezcla inglés con
español. No basta con bajar notas o añadir citas mecánicamente: el juicio requiere
mejor alineación de objetivos y una definición operativa de ayuda, seguida de
revisión humana. Los niveles propuestos no se aceptan como medición válida ni
se convierten en nota. Pronunciación y fluidez permanecen sin evaluar.

37 pruebas simuladas dirigidas pasan (one-shot/import/review/store), incluidas
duplicación, timeout ambiguo, presupuesto, preservación previa y fallo de registro;
tipos y lint dirigidos pasan. No hay nuevas llamadas, cambios de notas/recompensas,
migraciones, cuentas borradas, commit/push ni despliegue.

Referencias verificadas:
- https://developers.openai.com/api/docs/models/gpt-5-mini
- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create

## Segunda autorización específica: prompt v2

Después de explicar el rechazo, el usuario confirmó otra única evaluación,
máximo US$0.05, sin reintentos ni cambios de nota/puntos. Esto no revoca ni
elimina el bloqueo anterior. La nueva autorización tiene una clave nominal fija
distinta; exige el predecesor completo REJECTED_CANDIDATE con un despacho, prompt
v2 y datos/esquema idénticos. El archivo de preparación v1 y su respuesta siguen
intactos. Se guarda una preparación v2 nueva con creación exclusiva, sin
sobrescribir la anterior. No existe un modo para un tercer despacho autorizado.

Mismo modelo y precios verificados con OpenAI Docs; mismos límites y proveedor.
Preflight del nuevo tamaño: US$0.01213425 de margen conservador. Se mantiene la
salida máxima 3.500 tokens, timeout 45 segundos y retry=false. Se usó la guía
Prisma Client API para verificar que identidad y contabilidad apuntan solo al
administrador local y no a tablas de resultados o conexiones de producción.

Resultado de UNA llamada adicional:

- Respuesta completa; 3.479 tokens de entrada y 2.588 salida.
- Coste calculado por tokens: US$0.00604575. Contabilizado localmente como
  lesson-reflection / LESSON_REFLECTION; no es una nueva nota guardada.
- Rechazo con seis incidencias: MISSING_LEARNER_EVIDENCE en dos hallazgos,
  WORD_NOT_PRODUCED, ERROR_TARGET_NOT_GROUNDED,
  DIMENSION_EVIDENCE_NOT_LINKED y MISSING_LINKED_EXCHANGE.
- Dos claims privados en total, uno por cada autorización humana, sin borrar,
  reemplazar o reenviar ninguno. No más IA en esta etapa.

### Interpretación: no se certifica mejora

El modelo sigue atribuyendo al alumno fragmentos del personaje. Mantiene una
corrección de destino bajo la palabra «contento», pese a que las instrucciones
prohíben expresamente esa asociación. Sus cuatro niveles 3 tampoco demuestran
mejor calibración: justificó limitaciones mediante brevedad y vocabulario de la
lección, cuando esas propiedades pueden ser correctas en un principiante.
También persiste prosa inglesa dentro de motivos españoles. No se aceptan esos
niveles ni se editan citas para hacer pasar el informe.

La conclusión operativa es dejar de comprar intentos para acumular instrucciones.
El siguiente diseño debe preparar evidencia elegible por autor/recurso en servidor
y acotar estructuralmente la selección, conservando aparte el contexto del
personaje. Eso puede reducir atribuciones mecánicas falsas, pero seguirá sin
probar corrección semántica, calibración o pronunciación. Antes de otra llamada:
casos offline de errores de autor, alineación léxica/gramatical, elipsis y ayuda,
sin datos privados en fixtures. Cualquier prueba pagada adicional requiere otra
autorización, no forma parte de la presente.

Verificación técnica del envío: 42 pruebas simuladas en cuatro suites, tipos,
lint, formato y diff pasan. Sin build, migración, modificación de calificaciones,
recompensas/cuentas, commit/push o despliegue.
