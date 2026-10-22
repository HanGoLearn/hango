# Reconexión de audio en la reflexión Journey — 21/10/2026

**Actualización posterior del mismo día:** el nuevo ensayo integrado de la cuenta
administradora se describe en `unified-reflection-2026-10-21.md`. Para esos nuevos
intentos ya se unen las seis variables y el calibrador en la reflexión real, con
nota provisional sin recompensas. Este documento conserva el estado del lote
anterior y de los intentos que mantienen el juicio anterior; no describe la nueva
unión como si siguiera pendiente de implementar. La validación docente/audio
real y publicación sí siguen pendientes.

## Alcance y estado

El usuario pide probar el funcionamiento completo, no otra demostración visual ni
una supuesta nota de tonos desde texto. Este lote recupera un recorrido funcional
de **revisión experimental dentro de la sesión**. No equivale a terminar toda la
rúbrica, calibración o publicación. Han burbuja, Companion y Speaking Lab quedan
fuera del cambio.

Antes, `finishConversation` excluía la revisión de evidencia cuando
`isolatedJourney` era true. También se excluía su guardado anterior en el historial
global; esa separación era correcta, pero faltaba una vía propia para el audio.

## Recorrido implementado

1. Handshake autenticado vinculado al intento activo/dueño/lección y snapshot.
   Solo ese handshake anuncia la capacidad y el idioma ES/EN del intento. No se
   deduce del modo Tutor ni de datos de otra experiencia.
2. Relación entre item de audio Realtime y secuencia original del alumno. No se
   envían intervenciones del personaje ni se sustituye STT por una frase esperada.
3. End/cierre natural apaga el micrófono y silencia la salida inmediatamente.
   Cancela la respuesta del personaje si estaba generándose. Espera hasta 2,5 s
   la transcripción ya comprometida de la última intervención, sin reabrir el
   micrófono ni continuar la escena. Si no llega, lo declara incompleto.
4. Una sola respuesta silenciosa fuera del diálogo, `conversation:none`, con
   referencias a los items de audio del alumno. No abre otra sesión/modelo. Máximo
   24 items, 2.200 tokens de salida y 25 s; una muestra recortada se presenta parcial,
   nunca como revisión de todo. No hay reintento automático.
5. Enrutamiento por response ID y metadata propia: la cancelación del personaje,
   texto de otro response, rechazo, salida incompleta y JSON inválido no pueden
   convertirse en revisión satisfactoria. Timeout cancela por ID cuando se conoce.
6. Resultado limitado y versionado: tonos, articulación y ritmo/pausas; nivel
   provisional 0–4 o no evaluado, motivo, citas exactas y cobertura declarada por
   el modelo. Hasta seis observaciones con fragmento, rasgo oído, objetivo, pinyin,
   explicación y práctica. Cero observaciones no implica pronunciación perfecta.
7. Persistencia en el JSON existente `captureQuality.sessionAudio`, ligada al
   intento y hash de captura. No requiere columna/migración nueva. La lectura
   comprueba versión, dueño mediante el intento, locale, secuencia, rol y citas.
   Una salida rechazada se conserva acotada como borrador privado para diagnóstico
   offline; el lector de reflexión retira ese borrador de su respuesta y no lo
   convierte en correcciones ni manda otra solicitud para recuperarlo.
8. El lector del informe final recupera las observaciones incluso si el juicio
   textual está pendiente/falló. La UI ES/EN muestra el bloque y estados explícitos.
   Reabrir solo lee: ni review nueva, ni audio automático, ni recompensa extra.

## Qué se protege y qué NO demuestra

- Procedencia explícita `UNVERIFIED_BROWSER_REALTIME_REVIEW`. La entrega se recibe
  del navegador; validar formato/citas/hash no prueba autenticidad del proveedor ni
  veracidad acústica. **Nunca se usa para puntos, HanCoins, General Level o la nota
  vigente.** Se excluye también del prompt del juez textual para no contaminarlo.
- El JSON no permite nota global, porcentaje de confianza, campos arbitrarios,
  citas inventadas, objetivos ausentes del fragmento o máximo en una dimensión
  donde la propia respuesta señala un error. Eso no detecta todos los errores
  semánticos ni valida que el pinyin/consejo generado sea correcto.
- La IA debe declarar no evaluado cuando no pueda escuchar suficiente audio. Sus
  `reviewedItemIds` son una afirmación del modelo, no una medición independiente.
  La referencia al item no demuestra por sí misma que el proveedor mantenga cada
  token acústico disponible ni que la IA distinga los tonos de forma fiable.
- Se solicita respetar cambios tonales/tono neutro, variantes aceptables, ruido,
  clipping, ayudas ES/EN y voz del personaje. No se inventa una probabilidad de
  acierto. El juicio actual puede equivocarse; requiere ensayo y contraste real.
- Esta función no conserva grabaciones reproducibles. Recuperar audio desde otra
  sesión o contrastar posteriormente un segmento requiere otra arquitectura,
  privacidad/retención y consentimiento. No se reconstruye audio histórico.
- Sigue existiendo la nota lingüística activa de cuatro criterios. No se divide
  artificialmente uso del idioma en gramática/vocabulario. El candidato separado
  aún no sustituye ese juicio. La nota de cabecera dice explícitamente que no es
  una calificación oral integral.

## Costes y privacidad

El aviso previo de Speaking explica que la revisión es experimental, apaga el
micrófono y añade inferencia de IA. Se utiliza el mismo `gpt-realtime-mini` de la
sesión Journey, autorizado/contabilizado bajo su experiencia existente. No hay
otra operación TEXT/otra sesión ni un cargo lógico duplicado por leer el informe.
El US$0,05 registrado sigue siendo **estimación preventiva de sesión**, no precio
fijo, factura real ni garantía de techo; este lote no añade telemetría fiable de
facturación del proveedor. El input de audio referenciado y la respuesta extra
pueden aumentar el gasto. Ninguna prueba de este lote envía audio a OpenAI.

Se guardan observaciones y fragmentos textuales privados con el mismo control de
propiedad del intento, no archivos de voz, URLs públicas ni transcripciones en Git.
La falta de retención nueva no elimina las condiciones de tratamiento del proveedor
de la conversación que ya se usa para voz. No se importan datos de otros productos.

## Verificación y límites de aceptación

Pruebas con proveedores/respuestas ficticios cubren correlación de eventos,
cancelación, idioma, referencias, nulos, muestra parcial, salida truncada, timeout,
ausencia de voz, último turno tardío, desconexión, cierre idempotente, aislamiento de
historial y UI/accesibilidad. Integración contra Postgres desechable prueba sellado,
hash canónico tras JSONB, lectura antes/después de evaluar, guardado y reapertura.
No se ejecutan migraciones en bases reales, reset de cuentas ni llamadas pagadas.

Los resultados finales de QA se registran en TASKS. Pruebas técnicas verdes no
prueban calidad docente, precisión fonética ni funcionamiento en la sesión real de
OpenAI, Safari/iPhone o Vercel. No se anuncia prueba integral lista en producción.

Regresión completa: 2.071/2.071 unitarias/componentes en 171 archivos antes del
último ajuste de borrador privado; lote dirigido final y comprobaciones estáticas
registrados en TASKS. Integración: 34/34 en tres archivos, incluido rechazo del
idioma de otro intento. Build aislado de Next: 73 páginas, sin claves de IA y con
conexión de base ficticia, correcto antes del ajuste final acotado. Ningún dato de
producción se usó para esas pruebas; el runner retiró sus bases desechables.

## Falta para satisfacer la prueba TOTAL solicitada

1. Verificar con una sesión real y gasto acordado que el audio está accesible,
   el proveedor devuelve el contrato y el guardado llega a la reflexión real.
   No repetir evaluaciones antiguas: no hay audio reproducible de ellas.
2. Asegurar procedencia del lado del servidor antes de usar acústica para notas.
   Una afirmación del navegador no es suficiente para calificación/recompensas.
3. Resolver el candidato textual de vocabulario/gramática separados y sus
   inconsistencias pedagógicas; unir el perfil sin convertir ausencia en máximo.
4. Definir e integrar la fórmula versionada de calificación integral con evidencia
   real suficiente, estados parciales y compatibilidad histórica. No activar los
   pesos propuestos como si estuvieran calibrados.
5. Contrastar precisión y coste reales; calibración docente independiente pendiente.
6. QA visual y funcional en dispositivo real y entorno publicado; revisión/commit/
   push/despliegue autorizados. Probar que recargar no paga ni premia otra vez.

## Fuentes de implementación

- [OpenAI Docs: respuestas fuera de la conversación y contexto por referencias](https://developers.openai.com/api/docs/guides/realtime-conversations).
- [OpenAI Docs: response.create y cancelación por response ID](https://developers.openai.com/api/reference/resources/realtime/client-events).

Estas páginas documentan el transporte; no certifican medición de tonos de mandarín.
