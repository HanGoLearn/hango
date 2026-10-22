# Cuatro objetivos de Saludos: ampliación editorial offline

## Entrega

Se amplía la auditoría pedagógica a los cuatro objetivos reales congelados de
la primera lección: saludar, decir el propio nombre, preguntar nombre y preguntar
origen. Son comprobaciones de patrones y contexto, no un nuevo profesor automático.

La auditoría cambia a `journey-pedagogy-audit-2026-10-18-v2`. No cambia el prompt,
contrato del modelo, captura, nota, solicitud pagada, claim o autorización. La
auditoría v1 ya guardada se conserva; se escribe otro artefacto privado con creación
exclusiva. Sigue `HOLD`, `studentReady=false`, `score=null` incluso si se reconocen
los cuatro patrones. No hay promociones automáticas o reconstrucción del juicio.

## Reglas y límites

`journey-speaking-quality-act-evidence.ts` vincula reglas solo por slug exacto y
etiquetas editoriales ES/EN exactas. No depende de IDs de producción ni aproxima
cualquier texto para convertirlo en objetivo. Recursos léxicos/gramaticales no se
confunden con actos comunicativos.

- **Saludo:** comprueba patrones propios sencillos, no una palabra citada dentro
  de discurso referido. Formas no cubiertas se dejan pendientes.
- **Identificación:** reconoce presentaciones sencillas propias, no el nombre
  dicho por el personaje o una pregunta por el nombre del otro. No certifica que
  la construcción sea gramaticalmente perfecta ni que el nombre sea verdadero.
- **Pregunta de nombre:** conserva la detección de presentación confundida con
  pregunta. Acepta preguntas directas y reciprocidad pertinente, sin imponer una
  frase memorizada a quien elija otra forma.
- **Pregunta de origen:** distingue preguntar origen de declarar únicamente el
  propio. Reconoce preguntas sencillas y reciprocidad sobre origen, sin confundir
  «soy estudiante/buena persona» con una nacionalidad.

La reciprocidad usa el último tema local y, si falta, el contexto inmediatamente
anterior. No salta turnos ausentes ni mira el futuro. Si una cita parcial de «你呢»
omite el cambio de tema del propio turno, no se completa con una pregunta anterior.

Un conjunto geográfico pequeño permite reconocer algunas declaraciones con 是…人;
**no es una lista de nacionalidades permitidas para el estudiante**. Otras
nacionalidades, paráfrasis complejas, inglés/español mezclado, discurso referido,
negación y textos fuera del alcance van a revisión, no a ERROR ni cero. Para evitar
que una cita recortada oculte una negación, se exige que también el turno completo
esté dentro del alcance limitado del comprobador. La pronunciación y los tonos no
se miden aquí. No atribuir a esta regla precisión semántica universal.

## Otras evidencias, sin reparar el informe

La auditoría puede listar hasta seis intervenciones claras originales donde
aparezca un patrón pertinente, separadas de las citas seleccionadas por el modelo.
Estas sugerencias no se insertan en los hallazgos, no alteran el nivel, no cambian
«sin citar» a «citado» y no aprueban el objetivo. Solo ayudan a revisar la mala
selección sin volver a pagar una llamada. Nunca se usa reconocimiento dudoso.

La pantalla privada local muestra esta diferencia con títulos en español, enlaces
al original y el aviso «no se añadieron al informe ni modificaron la nota». No
publica motivos reescritos como si fueran feedback aprobado de Han. La conversación
importada de producción permanece en archivos privados, no en la lista local.

## Resultado sobre la misma respuesta comprada

Relectura offline de la tercera respuesta, con identidad/hash, solicitud completa
idéntica y red bloqueada:

- f1 (saludar), f2 (decir el nombre), f4 (preguntar origen): patrón localizado en la
  evidencia elegida. No implica aprobación docente del juicio, prosa o nivel.
- f3 (preguntar nombre): se mantiene la cita equivocada señalada. Se encuentra
  **otra intervención original** con la pregunta; no se sustituye en el informe.
- Cobertura se conserva en 3/5 intervenciones claras citadas. La alternativa no
  maquilla el indicador ni crea una nueva nota.
- Tres afirmaciones «sin oportunidad», configuración de objetivos obligatorios
  y prosa continúan pendientes. La decisión es HOLD, no evaluación corregida.
- Cero llamadas, intentos de red o escrituras de BD. Originales intactos.

## Ajuste de la matriz editorial

Se corrige una imprecisión de la matriz borrador: «compartir nacionalidad» no
equivale al objetivo congelado **Ask where they're from**. La evidencia ahora
explicita preguntar origen/reciprocidad; no se modifica el currículo en la base ni
se añade una cuota de palabras o nacionalidad obligatoria.
La matriz editorial pasa a v2; la rúbrica ordinal v1 y la solicitud pagada
permanecen intactas.

## Verificaciones

Regresión completa: **1.971/1.971 pruebas en 168 archivos**. Tipos, lint dirigido,
formato y diff pasan. Las pruebas de componente incluyen alternativas separadas,
enlaces y accesibilidad automatizada. Solicitud completa idéntica al ensayo
comprado, hashes de origen/respuesta iguales a los registrados en v1 y resultado
final v2 coincidente con su artefacto privado. Continúan solo tres claims; cero
intentos de red. No se sobrescribió la auditoría anterior.

## Pendientes

No se ha realizado nueva revisión visual en navegador. Las pruebas sintéticas,
accesibilidad automatizada y relectura real sirven para regresiones; no son
calibración independiente por profesor nativo ni una muestra de precisión del modelo.
Restaurante/contratos y demás lecciones requieren reglas/editorial propias, no
reutilizar estos patrones fuera de su contexto. Motivos, niveles y audio siguen
pendientes de validación antes de habilitar una evaluación nueva para alumnos.

OpenAI Docs guio la separación entre comprobaciones automáticas y calibración
humana: [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

Sin consumo adicional, migraciones, cambios de cuentas/notas/premios/General Level,
build, commit, push o despliegue. Han burbuja, Companion y Speaking Lab intactos.
