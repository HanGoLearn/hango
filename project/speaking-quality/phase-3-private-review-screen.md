# Pantalla privada de revisión de Speaking

18/10/2026. Ruta local `/admin/speaking-quality`, solo lectura.
Usuario pide controlar gasto: **cero evaluaciones pagadas en esta entrega**.

## Qué se entrega

- Enlace «Calidad de Speaking» en el administrador de desarrollo; no aparece en
  el menú de producción y la página devuelve notFound fuera de development.
- Autorización existente del propietario administrador, incluso en el servicio
  de lectura. Hasta 20 capturas selladas de su propia cuenta, en las tres lecciones
  piloto; no selector de usuarios, IDs ajenos ni conversaciones globales de Han.
- Conversación original con reconocimiento dudoso identificado y enlaces desde
  las citas al turno. El lector existente verifica identidad y hashes antes de
  mostrar contenido. Un error de integridad se presenta sin exponer el texto.
- Estado de revisión, modelo/tokens/coste estimado registrados para ese consumo.
  No conciliado no se muestra como cero; sin revisión no se inventa un gasto.
  La lectura de AiUsageLog también queda limitada al administrador y experiencia.
- Comunicación, vocabulario, gramática e interacción/autonomía, con motivos y
  apoyo; citas desplegables. Pronunciación/fluidez sin evaluar. No nota global nueva.
- Hallazgos, prioridad vigente o resuelta, propuesta de chino/pinyin/traducción.
  Los candidatos rechazados muestran controles técnicos, no grados inventados
  ni supuestos errores del alumno. Los ejemplos requieren revisión docente.

## Lectura privada y procedencia

El archivo de inspección no se trata como aprobado por existir. El servidor vuelve
a inspeccionar la respuesta guardada, sin proveedor, frente al contexto congelado
del intento propio. Antes comprueba identidad/versión/hash de la reclamación,
payload idéntico y versión del prompt. No envía al navegador instrucciones privadas,
respuesta bruta, nombres de archivo, claves, hipótesis de reconocimiento o errores
de proveedor. La transcripción original se muestra únicamente al propietario admin.

El lector no importa el servicio de generación ni proveedor/contabilidad mutable;
no hay server action, formulario de envío pagado ni botón de evaluación en esta
pantalla. Abrir, elegir captura y desplegar citas no generan consumo de IA ni
escrituras de datos. También se puede consultar con el flag pagado apagado.

No se activa HANGO_JOURNEY_QUALITY_REVIEW; permanece off. No se modifica historial,
notas, premios, General Level, archivos candidatos o las conexiones de entornos.
No publicación en GitHub/Vercel, migración, borrado o grabación adicional.

## Comprobación

Se revisaron TASKS, cambios existentes, las guías Next page/use-client incluidas y
Prisma Client API antes de implementación. Tests del lector con auth/DB/store
simulados: entornos, propiedad, límites, integridad, procedencia y costes. Tests de
ruta: bloqueo productivo y consultas ambiguas rechazadas. Componentes: vacío,
ausencia de controles pagados, texto escapado, candidato/corrección/citas y axe.
Regresión completa: 1.839/1.839 pruebas unitarias/componentes en 163 archivos.
Tipos, lint dirigido y diff pasan. No build concurrente con el servidor activo.

Navegador real de localhost: administrador autenticado ve el estado vacío porque
no hay capturas piloto en su selección local. No se infiere que su base sea la de
Vercel ni que sus conversaciones de producción no existan. Se comprobó escritorio
y ancho 390 sin desbordamiento horizontal de la página; la navegación horizontal
del shell móvil conserva su comportamiento. No sustituye prueba en móvil real.
Captura de evidencia `.codex-tmp/private-speaking-quality.png`, excluida de Git.

## Siguiente paso, con gasto acotado

Primero escoger **un solo intento** y acordar su presupuesto/autorización. Si el
intento está únicamente en Vercel, no conectar la base equivocada ni copiar datos
sin un alcance explícito. El servicio actual es local; esta pantalla no publica
un flujo de experimentación en producción. Conservar respuesta, revisar sin IA y
ajustar offline antes de considerar otra llamada. No lanzar un lote masivo ni
recalcular informes anteriores. La calibración docente y medición de tonos reales
siguen pendientes y no se acreditan con pruebas de UI.
