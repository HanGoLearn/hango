# Restaurante y contrato: controles editoriales de los dos pilotos restantes

## Resultado y alcance

Se añaden seis reglas editoriales para **las dos lecciones piloto**, no todos los
escenarios de restaurante ni todas las lecciones avanzadas. Cada regla exige slug y
etiqueta exactos ES/EN del objetivo de la misión. No se vincula por parecido de texto
ni por una palabra aislada. La auditoría pasa a v3; las auditorías v1/v2 y las
respuestas pagadas anteriores se conservan.

La salida sigue siendo `HOLD`, `studentReady=false`, `score=null`. Un patrón
comunicativo localizado no certifica gramática, adecuación nativa, pronunciación,
autonomía, oportunidades o la calificación propuesta por el modelo. No se modifica
la evaluación activa de la app ni se concede una nota nueva.

## Contraste documental antes de programar

La instantánea del inventario identifica estas misiones:

| Lección                                           | Misión                    | Objetivos originales verificados en el paquete ES                                              |
| ------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| restaurant-entering-and-ordering                  | cmstlaijt001w3weoz7i0bd7x | Pedir un plato; pedir una bebida; preguntar si pica                                            |
| negotiating-job-contract-reviewing-contract-terms | cmstmhpca087e3weo70q24jwf | Consultar alcance con 具体涵盖哪些范围; cuestionar con 是不是有点; pedir documentación escrita |

Fuente local: `project/curriculum-audit-2026-10-10/final/matriz.json` y unidades
`missionSuccessCondition:*:description` de los dos paquetes de traducción. Las
pruebas vinculan las seis etiquetas EN/ES al contenido de esos artefactos. Es una
comprobación documental offline, **no una lectura actual de la base de Vercel**.
Si una captura futura tiene otra etiqueta, queda sin regla hasta revisar su alcance.

El borrador de la matriz resumía restaurante como grupo/pedido/preferencia y
contrato como identificar cláusula/aclarar/solicitar constancia. Se corrige la
matriz editorial a v3: bebida y objeción explícitas, picante como pregunta y no solo
preferencia. El grupo sigue siendo contexto natural, no una meta que sustituya al
pedido. No se cambia el currículo persistente ni los objetivos de capturas previas.

## Restaurante

- Separa pedir un plato de pedir una bebida. Decir «me gusta el té» o pronunciar
  `点菜` no acredita haber pedido una bebida/comida.
- Admite algunas peticiones directas, peticiones combinadas y elipsis ante una
  pregunta pertinente del camarero inmediatamente anterior.
- Distingue preguntar si pica de pedir «sin picante». Esto último puede ser una
  intervención comunicativa válida, pero no se transforma en otra pregunta.
- No toma la oferta del camarero como producción del cliente; no une una elipsis
  recortada a un contexto que oculta otra intención en el propio turno.

El pequeño conjunto de comidas/bebidas sirve para pruebas editoriales de patrón,
**no limita lo que el alumno puede pedir**. Otras comidas, idiomas mezclados y
paráfrasis no cubiertas van a revisión, no a ERROR/cero. No se obliga a un plato ni
se certifican ingredientes, alergias, seguridad alimentaria o una compra real.

## Contrato

- Distingue preguntar por alcance de enumerar términos o afirmar su contenido.
- Reconoce algunos patrones de objeción o ajuste. No determina si una condición
  es legal, justa o aceptada; no se exige estar de acuerdo con RR. HH.
- Distingue pedir documentación escrita de repetir `书面文件` o leer una promesa
  del personaje. Admite algunas peticiones alternativas sin exigir 把.
- Dos objetivos originales incluyen una forma explícita. Se añade el aviso
  `ACT_FORM_REQUIREMENT_REQUIRES_SEPARATE_REVIEW`: reconocer la intención mediante
  paráfrasis **no demuestra** haber usado esa forma. Tampoco permite puntuar registro
  diplomático desde un patrón sin revisión docente.

Negación, discurso referido, texto desconocido y citas cuyo turno completo no puede
verificarse quedan sin resolver. No se reescribe el objetivo fuente para eliminar su
requisito gramatical, ni se declara cumplido por una intención aproximada.

## Integración y protección

`journey-speaking-quality-scenario-evidence.ts` no importa proveedores, BD,
configuración privada, contabilidad o escritura de notas. Se integra en el lector de
actos y en la auditoría, detrás de la comprobación estructural existente. La pantalla
privada tiene títulos ES para las seis reglas y aviso de forma gramatical separada.
Solo lectura; no hay nuevos controles pagados o ruta de aprobación.

No cambian prompt, esquema del modelo, solicitud comprada, claves de despacho,
autorizaciones, límites, cifras de consumo, niveles, recompensas ni General Level.
Han burbuja/Companion/Speaking Lab intactos. Ninguna llamada nueva, migración,
limpieza de cuentas, commit/push o despliegue.

## Pendientes para calidad docente real

Verificaciones de esta entrega: **2.028/2.028 pruebas en 169 archivos**; tipos,
lint dirigido, formato y diff pasan. Incluye correspondencia con los seis objetivos
de los paquetes, autoría, negación/discurso referido, elipsis, contexto incorrecto,
captura dudosa, variantes no cubiertas, distinción intención/forma y accesibilidad
automatizada de la pantalla privada.

También se releyó gratuitamente la respuesta pagada anterior de Saludos: conserva
los tres patrones localizados, f3 señalado y su alternativa separada; 3/5 citas y
HOLD. La solicitud completa permanece idéntica, origen/respuesta mantienen sus hashes
y se conservan auditorías v1/v2/v3 sin sobrescribirlas. Solo tres claims, cero intentos
de red. Esto **no es una prueba real de restaurante/contrato**.

Los ejemplos son sintéticos y de regresión. No hay una evaluación pagada real de
estos dos pilotos en esta entrega ni datos de precisión/estabilidad del modelo.
Faltan revisión docente independiente de niveles, motivos y registro; muestras
representativas reservadas; audio evaluable y validación de tonos/fluidez.
No se ha realizado comprobación visual adicional en navegador.

OpenAI Docs se utilizó para mantener controles automatizados y calibración humana
separados: [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).
