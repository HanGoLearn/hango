# Evidencia controlada por servidor, no por prosa del evaluador

## Causa y cambio

Los dos juicios pagados demostraron que reforzar instrucciones no bastó: el modelo
copiaba texto y elegía IDs de cualquiera de los hablantes, vinculando además una
observación a un objetivo ajeno. El inspector detectaba el fallo después del pago,
pero ese bloqueo no corregía la forma de construir el juicio.

Se implementa `prepareJourneyQualityEvidenceReview`, un transporte distinto del
formato de citas libres. No se cambia el contrato interno de perfil ni se convierte
ninguno de los dos informes rechazados. No se cambia el evaluador activo en Vercel.

### Propiedad de las evidencias

1. El servidor construye un catálogo L de fragmentos originales del alumno y
   otro P del personaje. Excluye habla dudosa, sin reconstruirla a partir de la
   reacción del personaje. Los IDs reales de base no aparecen en el contrato
   seleccionable; los alias distinguen explícitamente L/P.
2. Cada campo de evidencia del alumno admite solo IDs L y cada campo de contexto
   admite solo P, mediante enumeraciones del esquema de salida y comprobaciones
   locales independientes. La IA no escribe un `turnId`, una cita ni su autor.
3. El servidor recupera las citas textuales originales desde el catálogo congelado.
   No las inventa, normaliza, traduce o intercambia para hacer pasar un informe.
4. Cada objetivo léxico ofrece solo fragmentos L que contienen ese recurso. Las
   ramas del esquema relacionan targetId y evidencias elegibles; no basta con que
   la palabra aparezca en algún turno del personaje o en otra frase del alumno.
5. Si no hay producción léxica clara del recurso, solo admite NOT_OBSERVED o
   NO_OPPORTUNITY, no un error ni dominio inventados. No se rebaja una nota por
   omitir una palabra opcional ni por no haber podido observarla.
6. El perfil reconstruido pasa todavía por todos los controles anteriores:
   cronología, interacción contigua, apoyo, resoluciones, citas/dimensiones,
   máximos contradictorios y falta de audio. No se generan nota global o premios.

Los fragmentos largos conservan segmentos exactos de hasta 240 unidades UTF-16;
para una palabra que cruza un corte se añade una ventana exacta del original.
No se recorta evidencia silenciosamente para ajustar el tamaño de una solicitud:
se rechazan catálogos/esquemas excesivos antes de enviar. Límites: 160 fragmentos,
1.000 valores enum y 180.000 caracteres de esquema. El presupuesto del despacho
sigue siendo otro control necesario, no se autoriza consumo por preparar datos.

## Integración local y conservación

- Servicio manual privado `runLocalJourneyQualityReview`: ahora prepara el
  transporte de selección, sin activar su flag off por defecto, crear botones
  pagados o cambiar el proveedor/modelo/clave de despacho. Los claims anteriores
  siguen bloqueando llamadas repetidas; cambiar transporte no concede autorización.
- Lector de pantalla privada: admite el nuevo formato por su preparación/hash y
  conserva la lectura antigua para sus datos originales. No procesa una respuesta
  antigua como si fuera del formato nuevo; identidad, contenido y versión deben
  coincidir antes de inspeccionar. Solo lectura.
- Export verificado: opción explícita `evidence` en la preparación offline; el
  comportamiento legacy por defecto se conserva para comparar y leer artefactos
  congelados. Ninguno de los modos pagados anteriores acepta silenciosamente el
  nuevo formato; sus preparaciones/claims permanecen intactos.
- Script `prepare-imported-journey-evidence.ts`: preparación privada exclusiva,
  sin proveedor, credenciales, entorno, base o consumo. Conserva los pins del
  intento/snapshot/captura y no modifica el export ni las dos respuestas originales.

## Comprobación con el export real, sin IA

Se verificó la integridad y se preparó el formato nuevo: cinco fragmentos claros
del alumno y siete del personaje. El saludo queda ligado únicamente al fragmento
L correspondiente del alumno. 高兴 solo admite el fragmento L de la presentación,
no el fragmento posterior sobre visitar otro lugar. Una intervención dudosa sigue
excluida de la evidencia, no se transforma en acierto ni error.

Esquema: 25.950 bytes. Solicitud total: 40.470 bytes. Con el margen conservador
anterior de bytes más 4.096 y salida máxima 3.500, la exposición calculada sería
US$0.0181415, no una factura ni autorización de pago. Cero llamadas ejecutadas en
este bloque. Los dos claims de los pagos previos siguen siendo los únicos dos.

## Lo que NO se ha resuelto por estructura

Esta corrección evita aceptar una evidencia del personaje como producción del
alumno y la asociación léxica concreta que originó el fallo. No puede garantizar
que el modelo elija correctamente el nivel, interprete una elipsis, distinga ayuda
real de una pregunta ordinaria o redacte una buena corrección. Gramática y actos
comunicativos requieren juicio semántico: sus posibles evidencias L no prueban por
coincidencia textual que una estructura esté dominada.

La v1 de este transporte no admite atribuir ERROR a un recurso léxico ausente de
la producción clara, incluso si una sustitución/omisión verdadera podría requerir
ese recurso. Eso requiere un diagnóstico aparte con anclaje en el fragmento y
revisión docente; no se disfraza como cero, error en otra palabra o dominio.
Una aparición de un carácter dentro de una palabra compuesta tampoco certifica
dominio independiente del carácter: sigue siendo un juicio semántico pendiente.

No se garantiza que cualquier juicio pase, ni que pasar equivalga a calibración.
Sin audio válido se mantienen pronunciación y fluidez sin evaluar. No hay otro
intento pagado, cambio de notas/puntos/General Level ni publicación en este trabajo.

## Verificación

Casos sintéticos sin datos privados en Git: propietario equivocado aun con texto
chino coincidente, palabras solo del personaje, objetivo léxico ajeno, IDs/citas
inventados, formato antiguo, duplicados, STT dudoso, recorte de palabra en frontera,
contexto congelado, referencias locales del esquema y respuestas incompletas.
También se verifica el lector nuevo sin alterar la lectura legacy ni sus guardas.

65 pruebas dirigidas pasan después del último caso añadido. Regresión completa
previa a ese último caso: 1.886/1.886 en 166 archivos pasan. Tipos/lint/formato se
verifican por separado. Sin build, integración de bases o comprobación pagada del
esquema por el proveedor: las pruebas locales no certifican aceptación del API.

OpenAI Docs orientó el uso de enums, referencias y anyOf dentro del formato
estructurado, manteniendo validación local y estados de rechazo/incompleto:
[Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat).
