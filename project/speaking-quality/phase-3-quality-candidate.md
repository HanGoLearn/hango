# Entrega 3 — Evaluador lingüístico candidato y coherencia del feedback

Fecha: 18/10/2026. Estado: contrato/validador offline, no evaluador productivo
calibrado. No reemplaza el v2, no hay llamadas IA, grabaciones, DB o publicación.

## Qué está implementado

`src/lib/journey-speaking-quality-candidate.ts` define un contrato independiente
versionado y una inspección determinista. Solo lo importa su prueba.

Dimensiones separadas: comunicación, vocabulario, gramática e interacción/autonomía
con niveles ordinales propuestos; pronunciación y fluidez quedan explícitamente
`NOT_EVALUATED`. El perfil siempre devuelve `score: null` y no concede recompensas.
No se ha conectado todavía una fórmula nueva ni un proveedor para generar juicios.

El contexto de entrada debe ser del servidor: intento, idioma, objetivos/recursos
seleccionados, turnos originales y calidad técnica. No aceptar del navegador/modelo
la lista de objetivos que desea evaluar ni qué turnos le pertenecen. La conexión
con snapshot/misiones reales y persistencia se hará después con autorización y QA;
los fixtures no son un adaptador productivo.

## Reglas ejecutables

1. Identidad de intento/idioma, banco de targets del contexto, IDs únicos, citas
   originales y orden de turnos. Rechazo de producción fundada en reconocimiento
   incierto, sin reconstruir lo que el alumno quiso decir.
2. Un nivel observado requiere cita del alumno. Interacción requiere contexto del
   personaje. Un criterio lingüístico observado también requiere hallazgos de su
   categoría: un máximo no puede apoyarse solo en una oración genérica.
3. Vocabulario y gramática se evalúan por separado. Un fallo gramatical no rebaja
   automáticamente comunicación e interacción.
4. Un máximo del criterio correspondiente es incompatible con un ERROR declarado
   sin resolver. Se rechaza el candidato inconsistente; no se inventa una nota menor.
5. Ayuda aplicada requiere citar evidencia del personaje anterior a la producción.
   Esto prueba existencia/orden, no que la frase del personaje constituya realmente
   una buena ayuda: esa parte sigue necesitando juicio y calibración.
6. Máximo léxico/gramatical necesita aplicación independiente/autocorrección. Si
   únicamente hay una aplicación asistida sin transferencia posterior, no se admite
   el máximo de ese criterio. Ayuda continua/desconocida no admite autonomía máxima;
   pedir ayuda ocasional no rebaja por sí mismo todos los criterios.
7. La autocorrección requiere fragmentos diferentes del alumno en orden, incluso
   dentro de un mismo turno. Un ERROR puede apuntar a una aplicación posterior del
   mismo recurso; no vale una referencia anterior, ajena o inexistente.
8. Se conservan errores originales y reparaciones. Un error resuelto se etiqueta
   como tal y no se presenta como prioridad vigente. Un error posterior no desaparece
   porque hubo un uso correcto anterior del mismo recurso.
9. Se exige un ejemplo accionable con caracteres/pinyin/traducción para un ERROR
   léxico/gramatical, sin permitir una corrección agregada a un hallazgo positivo.
   Su corrección lingüística aún debe verificarse; tener tres campos no la demuestra.
10. No se atribuye producción a «no observado/sin oportunidad». Los objetivos
    requeridos no demostrados quedan pendientes, no erróneos o dominados.
11. No se imponen todas las palabras: los recursos opcionales no usados no hacen
    parcial el resultado. El servidor deberá seleccionar objetivos pertinentes,
    no convertir todo el banco core en una cuota automática.
12. Una aceptación genérica no certifica una afirmación amplia de comprensión;
    tampoco se prohíbe toda respuesta corta. `是` puede ser producción léxica si es
    el recurso citado; decidir si responde bien requiere contexto pedagógico.

## Perfil y feedback preparado

La cobertura distingue objetivos requeridos con aplicación independiente, con
ayuda, autocorregidos y no confirmados. Usa la última evidencia observada del recurso
por orden de turno/posición; no confunde autocorrección con ayuda ni borra el historial.

El perfil parcial conserva aciertos observables. Un criterio ausente o un fallo
técnico no produce un cero ni pierde el resto de datos. No se asigna ninguna nota
oral integral mientras las capacidades acústicas no estén validadas.

El feedback preparado contiene el recurso real del contexto, estado, citas,
corrección propuesta y condición de prioridad/resuelto. Las etiquetas de estado
las elige el servidor en ES/EN; no hay un campo libre de «nota de Han» que pueda
afirmar en ese espacio que los tonos fueron perfectos.

Eso NO es un detector completo de idioma ni una garantía contra cualquier afirmación
falsa dentro de una explicación/ejemplo. Las razones libres del candidato son para
revisión, no un comentario aprobado para el alumno. La traducción de una corrección
también puede estar mal y debe validarse en el lote docente.

## Relación con las seis brechas de fase 1

| Brecha | Qué mejora el candidato | Qué sigue pendiente |
| --- | --- | --- |
| G01: máximo sin inventario de evidencia | Hallazgos por criterio y cobertura requerida explícita; ninguna nota integral | Calidad de la selección y juicio real por objetivo |
| G02: máximo con ERROR | Rechazo del máximo incompatible con ERROR sin resolver | Que el modelo no omita o clasifique mal ese error |
| G03: ayuda continua con autonomía máxima | Dependencia declarada estructurada y límites de coherencia | Detectar correctamente ayuda/transferencia desde conversación real |
| G04: elogio fonético sin audio | Campos acústicos no evaluados; sin narrativa libre de perfección en la proyección | Consistencia semántica de cualquier otro texto antes de publicarlo |
| G05: prosa en otro idioma | Etiquetas ES/EN del servidor y correspondencia de metadatos | Idioma/calidad de traducciones y correcciones libres |
| G06: extremos aceptados para iguales citas | No se certifica una nota ni calibración por pasar reglas | Comparación docente y estabilidad del proveedor; no resuelto por código |

No se afirma que el modelo haya mejorado sin ejecutar y contrastar juicios reales.
Las pruebas comprueban condiciones declaradas por candidatos ficticios.

## Verificación y transición

Suite nueva: `tests/unit/journey-speaking-quality-candidate.test.ts`. Escenarios de
máximos contradictorios, ayudas, transferencia, autocorrección, cobertura, falsos
targets/citas, texto dudoso, idiomas y no mutación. No reescribe pruebas del v2 para
simular una migración; su baseline histórico se conserva.

Verificado: 34 pruebas nuevas y suite unitaria completa con 1.520 pruebas en
117 archivos, todas pasan. Tipos y lint dirigido también pasan. Búsqueda de
consumidores: únicamente su test importa el candidato; no se activa en la app.
No se ejecutaron build, pruebas de integración contra bases ni evaluaciones pagadas.

Antes de activación faltan: revisión docente y muestra real, decisión de pesos y
capacidad acústica, conexión al proveedor con control de costes, adapter de targets
del snapshot, almacenamiento versionado y política de resultados parciales/recompensas.
No alterar General Level ni recalcular notas históricas mediante este prototipo.

Avance posterior 18/10: adaptador puro del snapshot/captura preparado y probado en
`journey-speaking-quality-context.ts`; ver `phase-3-context-adapter.md`. No se ha
conectado una lectura productiva ni un proveedor. La selección editorial definitiva
y el resto de condiciones de activación siguen pendientes.

Puede avanzarse el diseño de la reflexión con estos perfiles y datos de ejemplo,
claramente marcados. No presentar ese diseño como resultado real de un intento ni
usar sus cifras ficticias como validación de pronunciación.

Fuente contrastada con OpenAI Docs: [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).
La documentación advierte que un resultado conforme a esquema todavía puede tener
errores. Las reglas de este módulo comprueban consistencia/procedencia, no sustituyen
ese juicio ni prueban competencia docente.
