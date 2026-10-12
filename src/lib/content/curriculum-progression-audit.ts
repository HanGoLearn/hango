import {
  CHAPTER_BUDGET,
  effectiveHskWeight,
  hskNumberForPoints,
  tierNameForLevel,
} from "../points-system";
import {
  JOURNEY_CHAPTER_ORDER,
  resolveJourneyChapter,
  type JourneyChapter,
} from "./learning-journey";

/** Offline inventory, NOT a proficiency classifier or a runtime Speaking policy. */
export interface AuditVocabulary {
  id: string;
  chineseForm: string;
  pinyin: string;
  meaning: string;
  meaningEs: string | null;
  hskLevel: number | null;
  status: string;
  exampleCount: number;
}

export interface AuditGrammar {
  id: string;
  name: string;
  nameEs: string | null;
  structure: string;
  hskLevel: number | null;
  status: string;
  exampleCount: number;
  exerciseCount: number;
}

export interface AuditLesson {
  id: string;
  slug: string;
  title: string;
  titleEs: string | null;
  objective: string;
  objectiveEs: string | null;
  order: number;
  levelOrder: number;
  difficulty: string;
  hskReference: number | null;
  scenario: {
    id: string;
    slug: string;
    name: string;
    nameEs: string | null;
    status: string;
    order: number;
    difficulties: string[];
    domainOrder: number;
  };
  vocabulary: AuditVocabulary[];
  grammar: AuditGrammar[];
  missions: { id: string; aiRole: string | null; learnerRole: string | null }[];
  dialogueLineCount: number;
  dialoguePhrases?: string[];
  hasSpeakingStep: boolean;
}

const normalize = (value: string) =>
  value.normalize("NFC").trim().replace(/\s+/g, " ");
const unique = (values: string[]) => [...new Set(values)].sort();
const wordKey = (word: AuditVocabulary) => normalize(word.chineseForm);
const grammarKey = (grammar: AuditGrammar) => normalize(grammar.structure);

function counts(lessons: AuditLesson[]) {
  const vocabulary = lessons.flatMap((lesson) =>
    lesson.vocabulary.filter((v) => v.status === "PUBLISHED"),
  );
  const grammar = lessons.flatMap((lesson) =>
    lesson.grammar.filter((g) => g.status === "PUBLISHED"),
  );
  return {
    lessons: lessons.length,
    scenarios: unique(lessons.map((l) => l.scenario.id)).length,
    vocabularyLinks: vocabulary.length,
    vocabularyRecords: unique(vocabulary.map((v) => v.id)).length,
    lexicalForms: unique(vocabulary.map(wordKey)).filter(Boolean).length,
    grammarLinks: grammar.length,
    grammarRecords: unique(grammar.map((g) => g.id)).length,
    exactStructures: unique(grammar.map(grammarKey)).filter(Boolean).length,
  };
}

export function buildCurriculumProgressionAudit(input: readonly AuditLesson[]) {
  if (unique(input.map((l) => l.id)).length !== input.length) {
    throw new Error("Duplicate lesson ID in audit input");
  }
  const all = [...input];
  const lessons = all.filter((l) => l.scenario.status === "PUBLISHED");
  const chapter = (l: AuditLesson) =>
    resolveJourneyChapter(l.scenario.difficulties);
  const denominators = Object.fromEntries(
    JOURNEY_CHAPTER_ORDER.map((c) => [
      c,
      all
        .filter((l) => resolveJourneyChapter([l.difficulty]) === c)
        .reduce((sum, l) => sum + effectiveHskWeight(l.hskReference), 0),
    ]),
  ) as Record<JourneyChapter, number>;
  lessons.sort(
    (a, b) =>
      JOURNEY_CHAPTER_ORDER.indexOf(chapter(a)) -
        JOURNEY_CHAPTER_ORDER.indexOf(chapter(b)) ||
      a.scenario.domainOrder - b.scenario.domainOrder ||
      a.scenario.order - b.scenario.order ||
      a.scenario.slug.localeCompare(b.scenario.slug) ||
      a.levelOrder - b.levelOrder ||
      a.order - b.order ||
      a.slug.localeCompare(b.slug),
  );
  const cursors: Record<JourneyChapter, number> = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
  };
  let nominalTotal = 0;
  const seenWords = new Map<string, string[]>();
  const seenGrammar = new Map<string, string[]>();
  const mapped = lessons.map((lesson, index) => {
    const c = chapter(lesson);
    // Mirrors the existing scenario/lesson formula, including its mixed-level
    // asymmetry. Does NOT fix it, renormalize it or recalculate user points.
    const nominalBudget =
      denominators[c] === 0
        ? 0
        : (effectiveHskWeight(lesson.hskReference) / denominators[c]) *
          CHAPTER_BUDGET[c];
    const nominalStart = nominalTotal;
    cursors[c] += nominalBudget;
    nominalTotal += nominalBudget;
    const vocab = lesson.vocabulary.filter((v) => v.status === "PUBLISHED");
    const grammar = lesson.grammar.filter((g) => g.status === "PUBLISHED");
    const recurringWords = vocab.flatMap((v) => {
      const earlierLessonSlugs = seenWords.get(wordKey(v));
      return earlierLessonSlugs
        ? [
            {
              id: v.id,
              chineseForm: v.chineseForm,
              earlierLessonSlugs: [...earlierLessonSlugs],
            },
          ]
        : [];
    });
    const recurringGrammar = grammar.flatMap((g) => {
      const earlierLessonSlugs = seenGrammar.get(grammarKey(g));
      return earlierLessonSlugs
        ? [
            {
              id: g.id,
              structure: g.structure,
              earlierLessonSlugs: [...earlierLessonSlugs],
            },
          ]
        : [];
    });
    for (const key of unique(vocab.map(wordKey)))
      seenWords.set(key, [...(seenWords.get(key) ?? []), lesson.slug]);
    for (const key of unique(grammar.map(grammarKey)))
      seenGrammar.set(key, [...(seenGrammar.get(key) ?? []), lesson.slug]);
    const issues: string[] = [];
    if (!lesson.objective.trim()) issues.push("MISSING_OBJECTIVE");
    if (!lesson.objectiveEs?.trim() || !lesson.titleEs?.trim())
      issues.push("MISSING_LESSON_ES");
    if (!vocab.length) issues.push("NO_PUBLISHED_VOCABULARY");
    if (!grammar.length) issues.push("NO_PUBLISHED_GRAMMAR");
    if (!lesson.hasSpeakingStep) issues.push("NO_SPEAKING_STEP");
    if (!lesson.missions.length) issues.push("NO_PUBLISHED_ROLEPLAY");
    if (lesson.missions.length > 1) issues.push("MULTIPLE_PUBLISHED_ROLEPLAYS");
    if (
      lesson.missions.some((m) => !m.aiRole?.trim() || !m.learnerRole?.trim())
    )
      issues.push("MISSING_ROLE");
    if (!lesson.dialogueLineCount) issues.push("NO_PUBLISHED_DIALOGUE_LINES");
    if (
      vocab.some(
        (v) => !v.chineseForm.trim() || !v.pinyin.trim() || !v.meaning.trim(),
      )
    )
      issues.push("INCOMPLETE_WORD");
    if (grammar.some((g) => !g.name.trim() || !g.structure.trim()))
      issues.push("INCOMPLETE_GRAMMAR");
    if (
      vocab.some((v) => !v.meaningEs?.trim()) ||
      grammar.some((g) => !g.nameEs?.trim())
    )
      issues.push("MISSING_TARGET_ES");
    if (
      vocab.some((v) => !v.exampleCount) ||
      grammar.some((g) => !g.exampleCount)
    )
      issues.push("TARGET_WITHOUT_EXAMPLE");
    if (grammar.some((g) => !g.exerciseCount))
      issues.push("GRAMMAR_WITHOUT_EXERCISE");
    if (
      lesson.vocabulary.length !== vocab.length ||
      lesson.grammar.length !== grammar.length
    )
      issues.push("UNPUBLISHED_LINKED_TARGET");
    if (
      lesson.hskReference === null ||
      vocab.some((v) => v.hskLevel === null) ||
      grammar.some((g) => g.hskLevel === null)
    )
      issues.push("MISSING_INTERNAL_DIFFICULTY_TAG");
    if (
      lesson.hskReference !== null &&
      (vocab.some(
        (v) => v.hskLevel !== null && v.hskLevel > lesson.hskReference!,
      ) ||
        grammar.some(
          (g) => g.hskLevel !== null && g.hskLevel > lesson.hskReference!,
        ))
    )
      issues.push("TARGET_ABOVE_LESSON_INTERNAL_TAG_REVIEW");
    return {
      ...lesson,
      chapter: c,
      proposedSequence: index + 1,
      nominalStart,
      nominalEnd: nominalTotal,
      nominalBudget,
      proposedPracticeTier: hskNumberForPoints(Math.floor(nominalStart + 1e-8)),
      proposedExitTier: hskNumberForPoints(Math.floor(nominalTotal + 1e-8)),
      firstSeenWordIds: vocab
        .filter((v) => !recurringWords.some((r) => r.id === v.id))
        .map((v) => v.id),
      firstSeenGrammarIds: grammar
        .filter((g) => !recurringGrammar.some((r) => r.id === g.id))
        .map((g) => g.id),
      recurringWords,
      recurringGrammar,
      issues,
    };
  });
  const tiers = Array.from({ length: 10 }, (_, level) => {
    const minPoints = Array.from({ length: 2001 }, (_, p) => p).find(
      (p) => hskNumberForPoints(p) === level,
    )!;
    const direct = mapped.filter((l) => l.proposedPracticeTier === level);
    const prior = mapped.filter((l) => l.proposedPracticeTier < level);
    return {
      level,
      label: tierNameForLevel(level),
      minPoints,
      directInventory: counts(direct),
      priorInventory: counts(prior),
      proposedLessonSlugs: direct.map((l) => l.slug),
      priorLessonSlugs: prior.map((l) => l.slug),
      refinementOnly: level >= 6,
    };
  });
  const wordOccurrences = new Map<
    string,
    { recordIds: Set<string>; lessons: Set<string>; meanings: Set<string> }
  >();
  const structureOccurrences = new Map<
    string,
    { recordIds: Set<string>; lessons: Set<string> }
  >();
  for (const l of mapped) {
    for (const v of l.vocabulary.filter((v) => v.status === "PUBLISHED")) {
      const key = wordKey(v);
      const row = wordOccurrences.get(key) ?? {
        recordIds: new Set<string>(),
        lessons: new Set<string>(),
        meanings: new Set<string>(),
      };
      row.recordIds.add(v.id);
      row.lessons.add(l.slug);
      row.meanings.add(v.meaning);
      wordOccurrences.set(key, row);
    }
    for (const g of l.grammar.filter((g) => g.status === "PUBLISHED")) {
      const key = grammarKey(g);
      const row = structureOccurrences.get(key) ?? {
        recordIds: new Set<string>(),
        lessons: new Set<string>(),
      };
      row.recordIds.add(g.id);
      row.lessons.add(l.slug);
      structureOccurrences.set(key, row);
    }
  }
  return {
    methodology: {
      mappingStatus: "PROPOSAL_NOT_RUNTIME",
      masteryStatus: "NOT_INFERRED",
      source: "Published lessons and all linked targets; no learner data",
      sequence:
        "Chapter, domain.order, scenario.order, level.order, lesson.order; stable slug tie-breaks",
      tierMapping:
        "Nominal sequential path at 100% of current curriculum point budgets; no placement or Lab points. NOT a prerequisite or individual mastery map.",
      reuse:
        "Earlier exact form/structure in proposed sequence is only a candidate; meaning and actual learner evidence must be checked before runtime use.",
      equivalence:
        "Internal HSK tags are authored metadata, NOT audited official HSK equivalence.",
    },
    totals: counts(lessons),
    excludedPublishedLessonSlugs: all
      .filter((l) => l.scenario.status !== "PUBLISHED")
      .map((l) => l.slug),
    chapters: JOURNEY_CHAPTER_ORDER.map((c) => ({
      chapter: c,
      ...counts(lessons.filter((l) => chapter(l) === c)),
      allocatedBudget: CHAPTER_BUDGET[c],
      projectedBudget: cursors[c],
      denominator: denominators[c],
      mixedLevelLessonSlugs: lessons
        .filter(
          (l) =>
            chapter(l) === c && resolveJourneyChapter([l.difficulty]) !== c,
        )
        .map((l) => l.slug),
    })),
    tiers,
    lessons: mapped,
    repeatedForms: [...wordOccurrences]
      .filter(([, row]) => row.lessons.size > 1)
      .map(([form, row]) => ({
        form,
        recordIds: [...row.recordIds],
        lessonSlugs: [...row.lessons],
        meanings: [...row.meanings],
      })),
    repeatedExactStructures: [...structureOccurrences]
      .filter(([, row]) => row.lessons.size > 1)
      .map(([structure, row]) => ({
        structure,
        recordIds: [...row.recordIds],
        lessonSlugs: [...row.lessons],
      })),
    issueCounts: Object.fromEntries(
      unique(mapped.flatMap((l) => l.issues)).map((issue) => [
        issue,
        mapped.filter((l) => l.issues.includes(issue)).length,
      ]),
    ),
  };
}

export type CurriculumProgressionAudit = ReturnType<
  typeof buildCurriculumProgressionAudit
>;

const cell = (value: string) =>
  value.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");

export function renderCurriculumProgressionAudit(
  audit: CurriculumProgressionAudit,
): string {
  const lines = [
    "# Auditoría curricular y matriz propuesta de los diez niveles de HanGo",
    "",
    "Estado: inventario comprobado; asignación pedagógica provisional, NO aplicada a la app.",
    "",
    "Fuente: base configurada en .env.local. Solo contenido; sin datos personales, llamadas de IA o cambios de puntos. No se ha comprobado Vercel.",
    "",
    "## Cómo leer los números",
    "",
    "Los registros e IDs no equivalen a palabras diferentes. Se cuentan por separado vínculos, registros y formas chinas únicas. Una forma puede tener varios significados; no se fusionan registros. Las estructuras se comparan literalmente, no por equivalencia gramatical.",
    "",
    "El orden propuesto usa capítulo → dominio → escenario → nivel de dificultad → lección. La app permite elegir escenarios: este orden NO acredita que un alumno haya estudiado sus predecesores.",
    "",
    "La asignación a los diez niveles simula una ruta secuencial con notas perfectas y la fórmula de puntos existente. No es una certificación, requisito de desbloqueo ni equivalencia HSK. Se conserva cualquier asimetría de los escenarios con múltiples dificultades y se informa abajo. Los cortes requieren revisión pedagógica antes de aplicarlos.",
    "",
    "## Inventario real",
    "",
    `- ${audit.totals.scenarios} escenarios; ${audit.totals.lessons} lecciones publicadas.`,
    `- Vocabulario: ${audit.totals.vocabularyLinks} vínculos, ${audit.totals.vocabularyRecords} registros, ${audit.totals.lexicalForms} formas chinas únicas.`,
    `- Gramática: ${audit.totals.grammarLinks} vínculos, ${audit.totals.grammarRecords} registros, ${audit.totals.exactStructures} estructuras literales distintas.`,
    `- ${audit.repeatedForms.length} formas y ${audit.repeatedExactStructures.length} estructuras reaparecen en distintas lecciones.`,
    "",
    "| Capítulo | Escenarios | Lecciones | Formas únicas | Estructuras literales | Presupuesto / proyección |",
    "|---|---:|---:|---:|---:|---:|",
    ...audit.chapters.map(
      (c) =>
        `| ${c.chapter} | ${c.scenarios} | ${c.lessons} | ${c.lexicalForms} | ${c.exactStructures} | ${c.allocatedBudget} / ${c.projectedBudget.toFixed(4)} |`,
    ),
    "",
    "## Matriz provisional por nivel personal",
    "",
    "Inventario directo = contenido de lecciones asignadas al tramo, no cantidad de conocimientos certificados. Inventario anterior = candidatos acumulados, no repertorio demostrado del alumno.",
    "",
    "| Nivel interno | Nombre existente | Desde puntos | Lecciones directas | Formas directas / anteriores | Estructuras directas / anteriores |",
    "|---|---|---:|---:|---:|---:|",
    ...audit.tiers.map(
      (t) =>
        `| ${t.level} | ${t.label} | ${t.minPoints} | ${t.directInventory.lessons} | ${t.directInventory.lexicalForms} / ${t.priorInventory.lexicalForms} | ${t.directInventory.exactStructures} / ${t.priorInventory.exactStructures} |`,
    ),
    "",
    "Los niveles desde 1500 puntos son de refinamiento mediante Labs según el sistema actual. No se inventan lecciones ni listas nuevas para llenar sus filas. Necesitan objetivos y evidencia de transferencia, no una cuota artificial de vocabulario.",
    "",
    "## Hallazgos estructurales (no evaluación lingüística del contenido)",
    "",
    ...Object.entries(audit.issueCounts).map(
      ([issue, count]) => `- ${issue}: ${count} lecciones.`,
    ),
    ...(Object.keys(audit.issueCounts).length
      ? []
      : [
          "- No se detectaron carencias en las comprobaciones estructurales seleccionadas.",
        ]),
    `- Lecciones publicadas bajo escenarios no publicados: ${audit.excludedPublishedLessonSlugs.length}.`,
    ...audit.chapters
      .filter(
        (c) =>
          c.mixedLevelLessonSlugs.length ||
          Math.abs(c.projectedBudget - c.allocatedBudget) > 1e-6,
      )
      .map(
        (c) =>
          `- Revisar ponderación de ${c.chapter}: ${c.mixedLevelLessonSlugs.length} lecciones de dificultad distinta a la agrupación del escenario; proyección ${c.projectedBudget.toFixed(4)} frente a presupuesto ${c.allocatedBudget}. No se modificó la fórmula.`,
      ),
    "",
    "Un objetivo con etiqueta interna superior a la de la lección requiere revisión; no demuestra por sí solo que la lección esté mal. Tener traducción, ejemplos y ejercicios tampoco garantiza corrección semántica o una dificultad adecuada.",
    "",
    "## Fichas de todas las lecciones",
    "",
    "Cada ficha conserva los objetivos reales. «Primera aparición» significa primera en este orden propuesto, no nuevo para el usuario. «Reaparece» es un candidato a repaso por coincidencia literal; hay que comprobar significado y evidencia individual. El vocabulario complementario contextual y la ampliación nueva están pendientes de selección pedagógica; no se inventan automáticamente.",
    "",
  ];
  for (const l of audit.lessons) {
    lines.push(
      `### ${l.proposedSequence}. ${cell(l.titleEs ?? l.title)}`,
      "",
      `- Identificador: \`${l.slug}\` (${l.id}).`,
      `- Escenario: ${cell(l.scenario.nameEs ?? l.scenario.name)}; capítulo ${l.chapter}; dificultad ${l.difficulty}; referencia interna ${l.hskReference ?? "sin etiqueta"}.`,
      `- Objetivo real: ${cell(l.objectiveEs ?? l.objective)}.`,
      `- Tramo propuesto: nivel ${l.proposedPracticeTier}; salida nominal ${l.proposedExitTier}; ${l.nominalStart.toFixed(4)}–${l.nominalEnd.toFixed(4)} puntos en la simulación, no puntos del alumno.`,
      `- Escena: ${l.missions.map((m) => `${cell(m.aiRole ?? "sin rol IA")} ↔ ${cell(m.learnerRole ?? "sin rol alumno")}`).join("; ") || "sin misión publicada"}; ${l.dialogueLineCount} líneas de diálogo.`,
      "",
      "| Vocabulario publicado | Pinyin | Significado ES (o fuente EN) | Aparición en la ruta |",
      "|---|---|---|---|",
      ...l.vocabulary
        .filter((v) => v.status === "PUBLISHED")
        .map(
          (v) =>
            `| ${cell(v.chineseForm)} | ${cell(v.pinyin)} | ${cell(v.meaningEs ?? v.meaning)} | ${l.firstSeenWordIds.includes(v.id) ? "Primera aparición" : "Reaparece"} |`,
        ),
      "",
      "| Gramática publicada | Estructura | Aparición en la ruta |",
      "|---|---|---|",
      ...l.grammar
        .filter((g) => g.status === "PUBLISHED")
        .map(
          (g) =>
            `| ${cell(g.nameEs ?? g.name)} | ${cell(g.structure)} | ${l.firstSeenGrammarIds.includes(g.id) ? "Primera aparición" : "Reaparece"} |`,
        ),
      "",
      `Candidatos anteriores: ${
        unique([
          ...l.recurringWords.flatMap((r) => r.earlierLessonSlugs),
          ...l.recurringGrammar.flatMap((r) => r.earlierLessonSlugs),
        ])
          .map((slug) => `\`${slug}\``)
          .join(", ") || "ninguno por coincidencia literal"
      }.`,
      "",
      `Revisión: ${l.issues.join(", ") || "sin alertas estructurales seleccionadas"}.`,
      "",
    );
    if (l.dialoguePhrases?.length) {
      lines.push(
        "Frases del diálogo publicado (banco de referencia, no guion obligatorio):",
        "",
        ...l.dialoguePhrases.map((phrase) => `- ${cell(phrase)}`),
        "",
      );
    }
  }
  return lines.join("\n");
}
