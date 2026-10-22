# Preparación de calibración docente — estado real

**Realizado:** revisión editorial asistida por Codex, 18 conversaciones ficticias,
108 valoraciones propuestas (36 acústicas nulas), paquete sin clave y comparador
offline. **Pendiente:** anotaciones de docentes independientes y validación sobre
estudiantes/audio reales. No llamar «calibración docente terminada» a esta entrega.

## Materiales

- `editorial-rubric-v2.md`: descriptores y decisiones de puntuación revisados.
- `editorial-anchors.ts`: propuestas con citas, motivos y notas para revisión;
  identificadas como `CODEX_AI_ASSISTED_DRAFT`, nunca como verdad humana.
- `src/lib/journey-speaking-teacher-calibration.ts`: prepara una ficha sin clave y
  compara anotaciones con la propuesta provisional; no califica alumnos ni aprueba.
- `scripts/prepare-teacher-calibration.ts`: genera las fichas de revisión Markdown y
  JSON y la clave separada en `.storage/journey-teacher-calibration/`, ignorada por Git.
  No usa claves, proveedores, base, grabaciones o conversaciones reales.

## Revisión asistida ejecutada

| Bloque | Casos | Hallazgos/decisiones editoriales |
| --- | --- | --- |
| Saludos | G0, G1, G2, G3, G4, GX | Cero exige dificultad demostrada tras apoyo; nombre elíptico no es mala gramática; modelos no son independencia; error local no rebaja todas las variables; desempeño breve puede ser alto; sin alumno no hay nota |
| Restaurante | R0, R1, R2, R3, R4, RX | Separar comida/bebida; no confundir ayuda con pregunta normal; sintaxis de pregunta separada de vocabulario; español para pedir ayuda no es un error chino ni dominio de palabras del personaje |
| Contrato | C0, C1, C2, C3, C4, CX | Término aislado no es consulta/petición; repetición de fórmulas no es transferencia; buenas paráfrasis no acreditan automáticamente requisitos formales; no puntuar conocimientos legales |

La propia revisión retiró una propuesta débil sobre el clasificador de una bebida:
podía depender del contexto y no justificaba una penalización segura. Se sustituyó
por un caso sintáctico más explícito (A-no-A + 吗) para discutir con docentes.
Esta decisión tampoco constituye una corrección validada por un humano.

Una segunda pasada corrigió C4: una paráfrasis comunicativamente eficaz no basta
para una máxima nota de gramática ligada a las dos formas centrales. La propuesta
gramatical se deja null y se conserva el logro comunicativo; también se hizo
explícito el referente ficticio de la cláusula. El paquete generado v1 se conserva
como borrador superado, no se sobrescribe. La revisión C4 se conserva en v2 y la
ficha legible vigente es **v3**, con tablas Markdown continuas y separación de
diálogo/párrafos corregidas. No se modificó ninguna nota del alumno. Esta revisión
sigue siendo de Codex, no de un docente externo.

Las cuatro dimensiones textuales tienen razones separadas; varias notas quedan
null cuando no hay muestra suficiente. Todos los casos carecen de audio, por lo que
pronunciación y fluidez permanecen nulas. Ninguna propuesta se aplica a la cuenta
administradora ni cambia la evaluación histórica de su conversación.

## Protocolo para cerrar la calibración independiente

1. Conseguir dos docentes reales de mandarín como lengua extranjera con experiencia
   evaluadora. Ser nativo no demuestra por sí solo competencia para valorar alumnos.
   Registrar experiencia y procedencia de cada revisión, sin inventar identidades.
2. Entregar por separado **solo ficha y rúbrica**, no la clave editorial. Los códigos
   de caso/turno del paquete son opacos y el orden es determinista por hash para no
   revelar bandas. Esto facilita ocultar respuestas, no prueba doble ciego ni independencia.
3. Cada docente valora sin consultar al otro, cita evidencias y registra ayuda,
   errores, reparaciones y objetivos/formas no observados. Una muestra sin datos va
   a no evaluable con motivo; no se rellenan notas por cumplir una tabla.
4. Comparar docentes antes de enseñarles la propuesta de IA. Resolver desacuerdos
   con justificación y conservar valoraciones originales; no promediarlos a escondidas.
5. Contrastar la propuesta editorial y los candidatos del modelo con ese consenso.
   El comparador de esta entrega **solo compara con la propuesta asistida**, así que
   sus resultados no se anuncian como acuerdo docente ni precisión sobre alumnos.
6. Formar el corpus real propuesto por el plan: primer piloto de 24 intentos
   autorizados de distintas personas, después expansión de al menos 80 si corresponde.
   Son tamaños operativos propuestos, no certificación estadística. No sustituirlos
   por 18 conversaciones ficticias ni por la cuenta administradora.
7. Reservar al menos una cuarta parte por hablante fuera del ajuste. La propuesta
   y estos casos son material de desarrollo conocido, **no un examen reservado**.
8. Para medir pronunciación/fluidez, obtener consentimiento y audio apto de voz
   del alumno, segmentación, revisión humana y una medición validada. No enviar ni
   almacenar audio real adicional sin acordar condiciones de privacidad y coste.
9. Fijar umbrales antes del conjunto reservado. El plan propone 85% a un paso o
   menos, 95% de precisión de correcciones y 90% de estabilidad; no son estándares
   oficiales ni métricas logradas. Informar acuerdo exacto, n, cobertura, abstenciones,
   sesgo y máximos injustificados, no una cifra aislada. No bajar el umbral para pasar.

No se contacta a personas ni se comparten datos externamente desde este script.
La autorización para preparar el material no constituye permiso para contratar o
enviar conversaciones/identidades de alumnos a un tercero.

## Comparaciones y salvaguardas

El comparador entrega parejas evaluables, acuerdo exacto, diferencia de un nivel,
error absoluto medio y dirección del desacuerdo por dimensión; muestra anotaciones
faltantes y nulas. No convierte null en cero, no redistribuye pesos y no calcula
nota global. Cuenta máximos superiores a la propuesta **como desacuerdos con un
borrador**, no como errores probados de un docente o modelo.

Se puede rellenar con los códigos opacos y sus citas exactas. IDs/dimensiones
duplicados, citas inventadas, notas sin intervención propia y audio puntuado desde
texto se rechazan. La procedencia de la referencia está fijada como propuesta IA;
ni una comparación consigo misma que dé 100% puede activar producción.

`deploymentEligible=false`, `independentHumanReviewVerified=false` y `score=null`
siempre. Un archivo no verifica por sí mismo la identidad/cualificación de un revisor.
No se crean una vía de autoaprobación o un cambio del evaluador mediante JSON.

## Comandos offline y entrega

Verificaciones ejecutadas: regresión completa **2.040/2.040 pruebas en 170
archivos**, doce pruebas dirigidas tras el ajuste final de paquete; tipos,
lint dirigido, formato y diff correctos. Manifiesto/corpus/rúbrica/generador
verificados por hash; se comprobó que la ficha no contiene la clave y tiene
18 tablas Markdown continuas. No se interpreta este resultado técnico como
precisión de las propuestas pedagógicas o acuerdo con docentes.

```powershell
node node_modules/tsx/dist/cli.mjs scripts/prepare-teacher-calibration.ts
node node_modules/vitest/vitest.mjs run tests/unit/journey-speaking-teacher-calibration.test.ts --maxWorkers=2
```

El generador crea una carpeta exclusiva por versión: repetirlo no sobrescribe fichas
ni valoraciones. Los cuatro archivos son artefactos derivados ficticios, no código
de la app ni respuestas nuevas de OpenAI. El manifiesto incluye hashes del corpus y
rúbrica, cero docentes independientes, cero alumnos humanos y cero grabaciones.

Sin cambios a prompts, esquema, claims, tarifas, notas, General Level, HanCoins,
cuentas, modelo de voz, Han burbuja/Companion/Speaking Lab, migraciones o Vercel.
