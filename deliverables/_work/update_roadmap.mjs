import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [inputPath, outputPath] = process.argv.slice(2);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));

const summary = workbook.worksheets.getItem("Resumen");
summary.getRange("B3").values = [["Aprendizaje de mandarín desde cero hasta perfeccionamiento, con práctica contextual, feedback útil y progreso observable."]];
summary.getRange("B11").values = [["Pre-MVP funcional en preparación de validación"]];
summary.getRange("B13:B15").values = [[
  "Demostrar que un principiante absoluto entiende el inicio y completa un tramo pequeño.",
], [
  "Demostrar que el estudiante regresa porque aprende y encuentra un siguiente paso claro.",
], [
  "Medir tokens, voz y costo real por función antes de ampliar el uso.",
]];
summary.getRange("B6").formulas = [["=IF(COUNTIF('Backlog MVP'!$D$5:$D$39,\"Sí\")=0,0,COUNTIFS('Backlog MVP'!$D$5:$D$39,\"Sí\",'Backlog MVP'!$F$5:$F$39,\"Hecho\")/COUNTIF('Backlog MVP'!$D$5:$D$39,\"Sí\"))"]];
summary.getRange("D7:I9").clear({ applyTo: "contents" });
summary.getRange("D7:I9").values = [
  [1, "Backlog", "Revisión humana del mandarín piloto", "Arean", "No iniciado", "Backlog MVP"],
  [2, "Backlog", "Errores, backups, límites y costo por función", "Jazmín", "En progreso", "Backlog MVP"],
  [3, "Backlog", "Beta cerrada de 10–20 estudiantes", "Arean", "No iniciado", "Backlog MVP"],
];
summary.getRange("E7:E9").format.wrapText = true;

const backlog = workbook.worksheets.getItem("Backlog MVP");
backlog.getRange("B11:J11").values = [[
  "Onboarding, landing, cuenta y recuperación coherentes",
  "Onboarding",
  "Sí",
  "Must",
  "En progreso",
  "Arean + Jazmín",
  4,
  "La promesa desde cero requiere validación externa",
  "Usuario entiende la propuesta, inicia desde su nivel y recupera acceso",
]];
backlog.getRange("B14:J14").values = [[
  "Ruta piloto desde cero hasta situaciones reales",
  "Learning Journey",
  "Sí",
  "Must",
  "En progreso",
  "Arean",
  8,
  "Falta acotar y revisar el tramo inicial",
  "6–8 lecciones coherentes con pinyin, objetivos claros y revisión humana",
]];
backlog.getRange("B17:J17").values = [[
  "Han Tutor con pedagogía progresiva y natural",
  "AI Teacher",
  "Sí",
  "Must",
  "En progreso",
  "Arean",
  4,
  "Falta QA con conversaciones reales",
  "Elige la profundidad adecuada; ejemplos escritos conservan caracteres, pinyin y traducción",
]];
backlog.getRange("B19:J19").values = [[
  "Separar Han Tutor, Han Companion y los dos Speakings",
  "AI Teacher",
  "Sí",
  "Must",
  "Hecho",
  "Arean + Jazmín",
  3,
  "Sin bloqueador técnico actual; vigilar regresiones",
  "Identidad, memoria, objetivos y UI separados",
]];
backlog.getRange("B22:J22").values = [[
  "Silencio, ruido y transcripciones estables",
  "Speaking",
  "Sí",
  "Must",
  "En progreso",
  "Arean",
  4,
  "Falta prueba amplia en dispositivos y ambientes reales",
  "Sin falsos turnos graves ni firmas de prompt mostradas, guardadas o enviadas",
]];
backlog.getRange("F27:J27").values = [[
  "En progreso",
  "Arean + Jazmín",
  3,
  "Falta reconciliar techos de tokens con Usage real",
  "Tokens de entrada/salida y costo real semanal por función con límites verificados",
]];

for (const row of [35, 36, 37, 38, 39]) {
  backlog.getRange(`A${row}:J${row}`).copyFrom(backlog.getRange("A34:J34"), "all");
}
backlog.getRange("A35:J39").values = [
  ["HAN-01", "Han Companion por voz", "Han Companion", "Condicional", "Should", "Hecho", "Arean", 3, "Falta QA externo de voz y memoria", "Orbe sin chat visible; silencio y turnos débiles no producen texto falso"],
  ["VOC-01", "Han Vocabulary contextual", "Han Vocabulary", "Condicional", "Should", "Hecho", "Arean", 2, "Falta observar búsquedas reales", "Consulta por caracteres o pinyin al nivel del alumno, sin puntos ni HanCoins"],
  ["MKT-01", "Landing pública desde cero a avanzado", "Marketing", "Sí", "Should", "Hecho", "Arean", 3, "Falta medir conversión", "Propuesta clara, registro y acceso; avatar, HanCoins, vocabulario y leaderboard explicados"],
  ["MOT-01", "Avatar, HanCoins, tienda y leaderboard", "Motivación", "Condicional", "Should", "Hecho", "Arean", 4, "Impacto educativo y de retención no validado", "Economía cosmética separada del Nivel General y premio semanal auditable"],
  ["CST-01", "Guardrails de tokens y recompensas idempotentes", "Costos y datos", "Sí", "Must", "En progreso", "Arean + Jazmín", 3, "Auditoría actual aún debe cerrarse y medirse en beta", "Límites, registros de uso y reintentos no duplican evaluaciones, progreso ni recompensas"],
];
backlog.getRange("B35:J39").format.wrapText = true;

const weekly = workbook.worksheets.getItem("Roadmap semanal");
weekly.getRange("E10:I10").values = [[
  "Han Companion con orbe y bordes de voz; rechazo de silencio y firmas del prompt; Han Tutor con pedagogía progresiva; landing pública desde cero a avanzado; Han Vocabulary y propuesta de avatar/HanCoins visibles.",
  null,
  "Falta validar estas mejoras con usuarios y revisar el mandarín del tramo piloto.",
  "En progreso",
  "Cerrar QA integral del inicio desde cero y reclutar testers",
]];
weekly.getRange("E12:I12").values = [[
  "Auditoría de costo y datos en curso: límite para evaluación oral de placement, límite separado al cerrar misiones, idempotencia de finalización y recompensas, e índice para vocabulario por nivel y estado.",
  null,
  "Cambios actuales sin confirmar; requieren migraciones y pruebas antes del cierre.",
  "En progreso",
  "Cerrar la auditoría sin mezclarla con trabajo paralelo",
]];

const fourMonths = workbook.worksheets.getItem("Roadmap 4 meses");
fourMonths.getRange("B15").values = [["Ruta piloto desde cero de 6–8 lecciones, Han Tutor, Speaking de lección, Reflection/Progress, autenticación, revisión humana y operación de beta."]];
fourMonths.getRange("B16").values = [["Han Companion, Han Vocabulary, avatar/HanCoins/leaderboard, Writing por fotos y Speaking Lab entran como apoyos si son estables y no retrasan la validación del core."]];
fourMonths.getRange("B17").values = [["HanGo Teacher, Institutions completo, Connect, Community, Play, ampliación de HanCoins, Creator, Marketplace y aplicaciones nativas."]];

const costs = workbook.worksheets.getItem("Costos por usuario");
costs.getRange("A9").values = [["Realtime API — Speaking y Han Companion"]];
costs.getRange("A12").values = [["Texto IA — Han Tutor y funciones de apoyo"]];
costs.getRange("E12").values = [["Costo promedio por llamada; reconciliar con tokens reales registrados por proveedor y modelo"]];
costs.getRange("A19:E19").copyFrom(costs.getRange("A7:E7"), "all");
costs.getRange("A19:E19").values = [["Controles de consumo de IA al 5 de septiembre de 2026", null, null, null, null]];
costs.getRange("A20:E20").copyFrom(costs.getRange("A8:E8"), "all");
costs.getRange("A20:E20").values = [["Flujo", "Máximo de salida", "Límite actual", "Estado", "Lectura"]];
for (const row of [21, 22, 23, 24]) {
  costs.getRange(`A${row}:E${row}`).copyFrom(costs.getRange("A9:E9"), "all");
}
costs.getRange("A21:E24").values = [
  ["Placement speaking", 1800, "10 evaluaciones por hora y usuario", "En implementación", "Mayor techo de una llamada de texto; debe medirse contra consumo real"],
  ["Misión — turno", 300, "15 mensajes por 5 minutos", "Construido", "Techo breve por respuesta conversacional"],
  ["Misión — cierre", 500, "10 cierres por 15 minutos", "En implementación", "Límite separado e idempotencia para no duplicar evaluación o progreso"],
  ["Reflection y Speaking Lab", 1600, "10 evaluaciones por 5 minutos en práctica libre", "Construido", "Presupuesto amplio para evitar feedback truncado; no equivale al consumo esperado"],
];
costs.getRange("B21:B24").setNumberFormat("#,##0");
costs.getRange("A21:E24").format.wrapText = true;
costs.getRange("A26:E26").copyFrom(costs.getRange("A2:E2"), "all");
costs.getRange("A26").values = [["AiUsageLog registra proveedor, modelo, tokens de entrada, tokens de salida y costo estimado por solicitud completada. Los techos anteriores son controles técnicos, no consumo promedio ni precio de venta."]];
costs.getRange("A26:E26").format.wrapText = true;

const investment = workbook.worksheets.getItem("Inversión");
investment.getRange("E4:F4").formulas = [["=SUM(E5:E1000)", "=SUM(F5:F1000)"]];

const ideas = workbook.worksheets.getItem("Próximas ideas");
ideas.getRange("A2").values = [["Arquitectura oficial: HanGo Learn, Teacher, Institutions, Connect, Community, Play y Marketplace. HanCoins, avatar, tienda y leaderboard ya pertenecen a HanGo Learn; cualquier ampliación de la economía se decide con evidencia."]];
ideas.getRange("C8:K8").values = [[
  "Costos, tokens y límites de IA",
  "Registro por proveedor/modelo, tokens de entrada y salida, techos por operación, rate limits, caché, reintentos idempotentes y kill switch.",
  "MVP 0–4 meses",
  "Aprobado para MVP",
  "Usage real",
  "Medición de 7 días y pruebas de abuso/reintento",
  "El costo cabe en presupuesto y una repetición no duplica gasto, progreso ni recompensas",
  "Arean + Jazmín",
  "En progreso",
]];
ideas.getRange("C11:K11").values = [[
  "Han Tutor con pedagogía progresiva",
  "Elige entre respuesta breve, contraste, corrección, enseñanza amplia o práctica; ejemplos escritos conservan caracteres, pinyin y traducción.",
  "MVP 0–4 meses",
  "Aprobado para MVP",
  "Nivel y contexto confiables",
  "Banco de conversaciones reales",
  "Respuestas naturales sin aperturas repetitivas ni uso rutinario del nombre",
  "Arean",
  "Construido; QA continuo",
]];
ideas.getRange("C13:K13").values = [[
  "Speaking de Learning Journey",
  "Roleplay contextual de lección con memoria, turnos naturales, transcripción protegida contra silencio/ruido y evaluación posterior.",
  "MVP 0–4 meses",
  "Aprobado para MVP",
  "Realtime estable",
  "Matriz de lecciones, ambientes y transcripciones",
  "Sesiones completas sin falsos turnos, firmas de prompt ni pérdida de contexto",
  "Arean + Jazmín",
  "En progreso",
]];
ideas.getRange("A23:K23").values = [[
  "MVP-11",
  "HanGo Learn",
  "Ruta desde cero hasta perfeccionamiento",
  "Fundamentos con pinyin, tonos y caracteres conectados con situaciones reales; la primera beta valida un tramo pequeño sin limitar la promesa futura.",
  "MVP 0–4 meses",
  "Aprobado para MVP",
  "Tramo inicial revisado",
  "Prueba con principiantes absolutos y estudiantes con experiencia",
  "Ambos perfiles entienden el siguiente paso y completan el tramo elegido",
  "Arean",
  "Construido; por validar",
]];
ideas.getRange("A38:K38").values = [[
  "MOT-01",
  "HanGo Learn",
  "HanCoins, avatar, tienda y leaderboard",
  "Economía cosmética separada de los puntos de Nivel General. Incluye cuatro avatares, accesorios, logros, ranking acumulativo y premio semanal por HanCoins ganados.",
  "MVP 0–4 meses",
  "Apoyo construido; no bloquea la beta",
  "Actividad de aprendizaje verificable",
  "Observar uso, retorno y conducta durante la beta",
  "Mejora motivación sin pay-to-win, ansiedad ni actividad vacía",
  "Arean",
  "Construido; por validar",
]];

for (const row of [49, 50, 51]) {
  ideas.getRange(`A${row}:K${row}`).copyFrom(ideas.getRange("A6:K6"), "all");
}
ideas.getRange("A49:K51").values = [
  ["HAN-01", "HanGo Learn", "Han Companion", "Conversación personal por voz con memoria limitada de hechos compartidos; orbe sin chat visible y bordes distintos para alumno y Han.", "MVP 0–4 meses", "Apoyo construido; no bloquea la beta", "Voz y memoria estables", "Sesiones observadas con silencio y ruido", "Conversación natural sin falsos turnos ni mezcla con Tutor o Speaking", "Arean", "Construido; QA continuo"],
  ["VOC-01", "HanGo Learn", "Han Vocabulary", "Consulta por caracteres o pinyin con explicación, ejemplos, uso y errores comunes ajustados al nivel real del alumno; no otorga puntos.", "MVP 0–4 meses", "Apoyo construido; no bloquea la beta", "Contenido y consulta estables", "Búsquedas reales por nivel", "Resuelve dudas y ayuda a volver a la ruta sin convertirse en otro chat", "Arean", "Construido; por validar"],
  ["MKT-02", "HanGo Learn", "Landing pública", "Página en español desde cero hasta perfeccionamiento con ciclo de aprendizaje, funciones reales, registro, acceso y preview social.", "MVP 0–4 meses", "Aprobado para captación", "Mensaje y flujo de acceso", "Medir visita, CTA, registro y primera acción de valor", "La captación produce usuarios activados, no solo visitas", "Arean", "Construida; falta medir conversión"],
];
ideas.getRange("C49:K51").format.wrapText = true;

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(formulaErrors.ndjson);

await fs.mkdir(outputPath.slice(0, outputPath.lastIndexOf("\\")), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
