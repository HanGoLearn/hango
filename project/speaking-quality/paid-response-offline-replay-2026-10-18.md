# Pruebas con las dos respuestas ya pagadas

## Autorización y alcance

El usuario solicita reutilizar lo gastado, sin más consumo. Se ejecuta únicamente
revisión local: ninguna evaluación nueva, transcripción, llamada de proveedor,
conexión de base, cambio de nota/puntos o despliegue. Los dos informes originales
siguen rechazados; pasar estas pruebas significa que las protecciones funcionan,
no que se haya aprobado el juicio docente de esos informes.

## Método reproducible

`scripts/replay-paid-journey-quality-offline.ts` recibe el export privado, ambas
respuestas y los pins independientes del intento/snapshot/captura. Comprueba la
integridad con el preflight existente y que los datos enviados originalmente son
los mismos. No importa proveedores, claves, entorno, contabilidad o base. Bloquea
fetch durante todo el proceso y contabiliza cualquier intento de red.

Se vuelve a inspeccionar cada respuesta tal como llegó. Además, se proyectan sus
selecciones de citas en **sondas de prueba**, conservando el hablante real y el
orden original, nunca cambiando un turno P a L. Esa proyección no es una respuesta
generada por el modelo con el formato nuevo, no se publica y no corrige el informe.
No se interpreta una cita antigua fuera del contexto congelado ni se adivinan
fragmentos omitidos.

Casos comprobados:

- Los dos informes mantienen su rechazo con el inspector actual.
- El lector nuevo no acepta silenciosamente el contrato antiguo de citas libres.
- Proyectar las selecciones problemáticas completas sigue siendo rechazado.
- Las evidencias solo del personaje no se convierten en producción del alumno.
- El fragmento de destino no es elegible para una palabra ajena.
- Una cita estrecha que no contenía el saludo no puede escribirse en el nuevo
  contrato: la cita la proporciona el servidor y contiene el fragmento original
  completo con el recurso. Esto es recuperación literal de texto, no un cambio
  de nivel ni validación pedagógica de aquella afirmación del modelo.
- Contexto no conectado y ayudas sin evidencia siguen siendo rechazados.
- Dos controles positivos conservan una selección léxica válida y su autor;
  no se asignan niveles en esas sondas. Se exige score=null y sin premios.

## Resultado real de la ejecución

19/19 comprobaciones pasan, incluidas negativas y positivas, sobre las dos
respuestas privadas. Hashes de los tres archivos de entrada comprobados antes y
después: sin cambios. Cero intentos de red, cero despachos pagados, cero escrituras
de base y cero cambios de nota. Se creó un artefacto de auditoría privado nuevo
con wx y permisos 600, sin sobrescribir ninguna respuesta/claim/inspección.
El artefacto guarda procedencia/hashes, resultados originales y resultados de
sondas; permanece bajo `.storage/journey-quality-imports`, ignorado por Git.
Los datos privados no se copiaron a fixtures del repositorio.

Además, 80/80 pruebas unitarias dirigidas pasan en cuatro suites; tipos y lint del
script pasan. No hay build, integración de bases, commit/push o publicación.

## Qué permite concluir

Los errores de atribución y selección reproducidos se detectan o quedan fuera
de las elecciones admitidas por el contrato nuevo. El caso positivo evita confundir
«rechazar todo» con una protección útil. No se midieron porcentajes de precisión
del modelo, cambio real de sus respuestas, calidad de niveles/explicaciones,
pronunciación o tonos. Reutilizar respuestas permite verificar estas protecciones,
pero no simula una generación nueva ni constituye calibración docente.

La separación entre regresión con datos históricos y calidad del juicio sigue
la referencia de [OpenAI Docs: Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).
