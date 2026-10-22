# Unión de evaluación y reflexión Journey — 21/10/2026

## Resultado solicitado

El usuario pidió unir el calibrador desarrollado, la revisión de audio y la
reflexión completa. Se integra en `JourneyReportPanel` → `JourneyFinalReport`,
el cierre/reapertura real de la lección. No es una nueva pantalla demostrativa
ni hay que buscar una evaluación textual y otra acústica en lugares distintos.
La pantalla privada anterior sigue siendo herramienta diagnóstica independiente,
no el lugar donde el alumno debe leer el resultado de este nuevo recorrido.

## Alcance de activación

Los **nuevos intentos de una cuenta ADMINISTRATOR** congelan la política
`journey-unified-2026-10-21-v1` en su snapshot de servidor. Es un ensayo integrado
real, no una calificación docente certificada. Los intentos existentes mantienen
su contrato; no se rebautiza una nota vieja ni se intenta recuperar audio perdido.
Alumnos normales siguen su flujo anterior durante esta aceptación. No se cambian
Han burbuja, Companion o Speaking Lab.

No hay migración: se reutilizan snapshot, captura y evaluación JSON existentes.
La versión de transporte/captura v2 se mantiene compatible; la nueva política
versiona explícitamente el algoritmo y su proyección. Los resultados oficiales
siguen nulos para estos ensayos; el valor provisional solo vive en el informe
integrado identificado como experimental. No concede GP, estrellas o HanCoins,
ni habilita la finalización premiada. Puede guardarse y volver a la ruta.

## Un recorrido y una fuente de verdad

1. Inicio autenticado: banco/objetivos/idioma y política provienen de servidor.
2. La sesión conserva los turnos propios y la revisión acústica experimental
   ya implementada: una petición silenciosa Realtime, con micrófono apagado al
   cerrar, respuesta correlacionada y límites. No se convierte el texto en audio.
3. La captura se sella y se selecciona por el paso Speaking del run actual.
4. Un botón explícito solicita **un solo juicio textual**. En este flujo usa
   `prepareJourneyQualityEvidenceReview`, el calibrador/transporte existente;
   sustituye la llamada antigua, no ejecuta ambos jueces ni otra narrativa de Han.
5. Se guarda su respuesta acotada y hash de petición antes de la validación.
   Se comprueban versión, intento, locale, referencias/roles y reglas de evidencia.
   El audio no se envía al juez textual ni hace que pierda evidencia válida si
   faltó/falló. Se revalida aparte contra la misma captura.
6. El servidor construye un solo perfil: cuatro variables textuales y dos de
   audio, con notas de ejercicios reales, cobertura y devoluciones concretas.
   La nota de Han se compone de cita/motivos de esa misma evaluación, sin otra IA.
7. Se guarda la proyección y se reabre mediante lectura. Consultar detalles,
   recargar, guardar y revisar una respuesta rechazada no disparan IA. Ni siquiera
   la revisión explícita de un fallo unificado repite el pago de ese intento.

## Fórmula visible de prueba

Es la propuesta original del plan, **no pesos científicamente validados**:

| Variable oral | Peso | Fuente |
| --- | ---: | --- |
| Comunicación | 20% | Actos/propósito y citas del alumno |
| Vocabulario en conversación | 15% | Selección y uso léxico, no nota del quiz |
| Gramática en conversación | 20% | Estructuras realmente utilizadas |
| Pronunciación/tonos | 25% | Media de tonos y articulación, mitad cada uno |
| Interacción/autonomía | 10% | Intercambio, reparación y dependencia |
| Fluidez: ritmo/pausas | 10% | Observación experimental del audio |

Cada aporte = nivel 0–4 ÷ 4 × peso. La suma se redondea al final. La nota
provisional de lección usa vocabulario de ejercicios 20%, gramática de ejercicios
20%, comprensión 30% y Speaking 30%. No se cuentan dos veces sus subvariables.
No hay nota global si algún ejercicio obligatorio no está evaluado.

Si falta una variable oral, audio completo declarado, cierre coherente o captura
finalizada, no se calcula la nota integral: se conserva lo disponible. No se cambia
el peso ni se inventa cero/100. Una contradicción detectada por el auditor de actos
retiene la nota, no reduce niveles arbitrariamente ni publica ese acto como logro.
Un máximo también exige objetivos prioritarios confirmados. Eso no significa
exigir literalmente cada palabra del banco o un guion rígido de conversación.

## Lectura pedagógica y visual

Una cabecera de resultado provisional, cuatro tarjetas de ejercicios/Speaking,
seis variables desplegables con aporte, motivo y citas; tonos y articulación con
sus niveles propios dentro del criterio oral. Después logros, una nota de Han,
hasta dos correcciones prioritarias con original/objetivo/pinyin/traducción si
existe, una práctica siguiente y detalles secundarios de cobertura/otros ajustes.
Las correcciones prioritarias no vuelven a renderizarse completas en detalles.
ES/EN corresponde al idioma congelado del intento; no se traduce pagando al abrir.

## Calidad: qué sigue pendiente

Integrar no equivale a calibrar. El auditor original sigue devolviendo HOLD,
studentReady=false y score=null; sus pruebas no se convierten en aval docente.
El resultado numérico nuevo es explícitamente una **nota de prueba**, calculada
para comprobar el recorrido completo, no una certificación de precisión fonética.

El audio se entrega desde navegador y no tiene autenticación independiente del
proveedor ni grabación reproducible. El modelo puede confundir tonos, pinyin o
variantes; sus referencias/cobertura son afirmaciones suyas, no validación humana.
Los límites semánticos de las reglas automáticas y el juicio generativo siguen
requiriendo ejemplos reales y contraste docente. Las reglas de actos desconocidos
no son una aprobación; se mantienen como NEEDS_REVIEW en el diagnóstico.

Antes de activar para alumnos/recompensas: ensayo real acotado de audio/proveedor,
procedencia de servidor, contraste/calibración humana, revisión de coste/latencia,
aceptación móvil y despliegue autorizado. Ninguno de esos puntos se declara hecho
por aprobar pruebas con candidatos sintéticos. Este lote no usa la API pagada.

## Verificaciones

- 2.089/2.089 pruebas unitarias/componentes, 172 archivos, dos workers.
- 37/37 integraciones en tres archivos: intento/sellado, captura y reflexión.
  Recorrido real ES/EN de administrador, seis variables y fórmula 75/93 en el
  ejemplo sintético; concurrencia produce una solicitud, cache/reapertura exactos,
  propietario/hash respetados y cero recompensas. Se conserva la evaluación
  anterior para no administradores. Rechazo/incomplete conserva salida privada,
  resultados de ejercicios y relectura/revisión sin segunda solicitud.
- Accesibilidad automatizada ES/EN del componente integrado, sin bloque acústico
  anterior duplicado ni corrección repetida. No sustituye aceptación visual en
  navegador real o móvil.
- Typecheck, lint dirigido, formato y diff correctos.
- Build Next aislado correcto: 73 páginas, sin claves de IA y con conexión de
  base ficticia que no apunta a ningún entorno real.

La integración usó Postgres temporal 127.0.0.1:54329/hango_local_test y proveedor
simulado; el runner retiró la base generada al terminar, también en la primera
pasada cuyo fixture de audio se corrigió. No se usaron ni borraron cuentas o
bases reales. No se ha publicado en GitHub/Vercel ni se ejecutó ninguna llamada
pagada. Pruebas técnicas aprobadas no equivalen a validar tonos o calidad docente.

Las guías OpenAI de Realtime/Structured Outputs y las guías Prisma de consultas
y transacciones se usaron para conservar la separación entre navegador/servidor,
validación y guardado atómico; no son evidencia de exactitud pedagógica.
