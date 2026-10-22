# Servicio privado de revisión candidata — desarrollo

18/10/2026. Implementado, apagado por defecto y probado con dobles locales.
**No se ejecutó ninguna evaluación pagada. No hay botón, ruta ni server action
que lo invoque todavía.** No confundir el servicio preparado con activación de
la evaluación nueva en las lecciones.

## Entrada y autorización

`runLocalJourneyQualityReview` solo permite NODE_ENV=development y el opt-in
HANGO_JOURNEY_QUALITY_REVIEW=local; su valor predeterminado es off. No se modificó
ninguna configuración privada ni se habilitó el flag. Test/producción se rechazan
incluso si se indica local. Requiere confirmPaidReview=true, la autorización real
de administrador y un intento propio de esa cuenta. No permite seleccionar otro
usuario. Reutiliza el lector que comprueba propiedad y hashes de captura/snapshot.

Restringido a las tres lecciones piloto. Solo capturas selladas compatibles,
no abandonadas, banco congelado coherente y suficiente texto claro para justificar
el gasto. El filtro de suficiencia no es un juicio de dominio lingüístico.

## Proveedor y consumo

Reutiliza getAiProvider, sin cambiar modelo, clave o selección global. Rechaza mock
y proveedor sin salida estructurada. Envía instrucciones y datos por separado con
el nuevo esquema; 3.500 tokens máximos de salida y 45 segundos, retry=false.
No hay fallback a una llamada ordinaria si no funciona el formato.

Usa trackAiOperation con lesson-reflection/LESSON_REFLECTION, incluidos límites
existentes. No crea un presupuesto paralelo ni una tarifa fija inventada. Registra
tokens/tarifa por recordAiUsage antes de validar el juicio, también para rechazo o
salida incompleta. El gasto de esta prueba quedaría en Reflexión de lección y su
ID de consumo se liga al registro privado. No se ejecutó para comprobar saldo real.
El límite de tokens no es un tope contractual de dólares; el lote real necesita
presupuesto acordado y observar la tarifa efectiva del modelo configurado.

## Conservación y concurrencia

Registro separado en `.storage/journey-quality-reviews`, excluido de Git y fuera
de public. Cada clave es un SHA-256 de administrador/intento/versión candidata;
claim.json se crea con exclusión (wx). Un único proceso gana la reclamación;
los demás solo recuperan el resumen o ALREADY_CLAIMED. No se retira la reclamación
tras timeout, caída, presupuesto bloqueado o fallo ambiguo: nunca se reenvía
automáticamente. Esto puede requerir intervención manual incluso si no se gastó.

response.json conserva petición y respuesta antes de registro de consumo y
validación; inspection.json conserva el análisis. No se sobrescriben archivos.
El resultado del servicio solo contiene clave/estado/usageLogId, no transcripciones,
diagnósticos, secretos o una nota. Si almacenamiento/registro de gasto falla,
se detiene la aceptación; no se presenta el gasto como cero ni se compra otra
evaluación. Una caída justo tras la red puede dejar coste incierto sin respuesta:
la reclamación queda bloqueada y requiere conciliación manual con el proveedor.

Almacenamiento **solo local de desarrollo**, no apto para Vercel/serverless.
Las peticiones contienen texto personal que el alumno pueda haber pronunciado:
son archivos privados en texto claro, no respaldo cifrado. Se solicita modo 600/700
en plataformas que lo admiten; en Windows aplica la ACL de la carpeta. Antes de una
cohorte hacen falta política de retención/borrado, almacenamiento productivo y
verificación de permisos. No se hicieron escrituras con conversaciones reales.

## Separación de resultados

No escribe en JourneySpeakingEvaluation, informes activos, progreso, recompensas
o General Level. No cambia prompts del personaje, Han burbuja, Companion o Lab.
El candidato sigue sin nota integral ni acústica calibrada. No se puede declarar
mejor precisión por aprobar estas comprobaciones técnicas.

## Verificación

22 pruebas nuevas: servicio con auth/lector/proveedor/contabilidad simulados y
almacenamiento real en carpetas temporales de test. Comprueban bloqueo de entornos,
consentimiento, autorización, propiedad delegada al lector, captura, piloto,
consumo antes de validación, rechazo/incompleto, no reintento, conservación,
reclamaciones concurrentes y rechazo de rutas manipuladas.

OpenAI Docs: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
para separación de rechazo y salida incompleta; Prisma Client API para revisar el
lector existente. No se certificó compatibilidad de una solicitud real ni calidad
pedagógica con un modelo. La prueba dirigida de estos dos archivos pasa 22/22.
Regresión completa: 1.819 pruebas unitarias/componentes en 160 archivos pasan;
tipos, lint dirigido y comprobación de diferencias pasan. Sin build ni despliegue.

Siguiente: interfaz privada de revisión/confirmación y consulta sin IA, autorización
del lote pagado con presupuesto, prueba end-to-end conservando el candidato y
comparación editorial/docente. No activar el nuevo cálculo o la medición acústica
antes de resolver sus condiciones y compatibilidad con el resultado real.
