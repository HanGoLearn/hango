export type HanAppContextIntent =
  | "LEARNING_JOURNEY_GUIDE"
  | "LEARNING_JOURNEY_ROUTE"
  | "SPEAKING_LAB_GUIDE"
  | "WRITING_LAB_GUIDE"
  | "PROGRESS_GUIDE"
  | "PROGRESS_GENERAL"
  | "PROGRESS_COMPETENCIES"
  | "PROGRESS_EXPOSURE"
  | "PROGRESS_SCENARIOS"
  | "PROGRESS_REVIEW"
  | "PROGRESS_FULL";

function normalize(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .trim();
}

function asksAboutCurrentPage(message: string): boolean {
  return (
    /\b(?:aqui|esta pagina|esta seccion|this page|this section|here)\b/u.test(
      message,
    ) &&
    /\b(?:como|que|cual|donde|empezar|hacer|funciona|sirve|opciones|how|what|where|start|use|work|options)\b/u.test(
      message,
    )
  );
}

function asksForAppHelp(message: string): boolean {
  return /\b(?:como|que|cual|donde|cuando|por que|explica|explicame|dime|ayuda|quiero saber|puedo|debo|empiezo|empezar|how|what|which|where|when|why|explain|tell|help|can i|should i|start|work|use)\b/u.test(
    message,
  );
}

function mentionsLearningJourney(message: string): boolean {
  return /\b(?:learning journey|ruta de aprendizaje|recorrido de aprendizaje)\b/u.test(
    message,
  );
}

function mentionsSpeakingLab(message: string): boolean {
  return /\b(?:speaking lab|laboratorio de speaking|laboratorio de conversacion|laboratorio de habla)\b/u.test(
    message,
  );
}

function mentionsWritingLab(message: string): boolean {
  return /\b(?:writing lab|laboratorio de writing|laboratorio de escritura)\b/u.test(
    message,
  );
}

function mentionsProgress(message: string): boolean {
  return /\b(?:progress|progreso|mis resultados|my results|mi avance|my progress)\b/u.test(
    message,
  );
}

/**
 * Cheap, deterministic gate for Han's optional app context. Page presence
 * alone never activates it: an unrelated Mandarin question must not trigger
 * a curriculum/progress read or add those tokens to the model request.
 */
export function detectHanAppContextIntent(
  rawMessage: string,
  currentPageName?: string,
): HanAppContextIntent | null {
  const message = normalize(rawMessage);
  const page = normalize(currentPageName);
  if (!message) return null;

  const deicticPageQuestion = asksAboutCurrentPage(message);
  const appHelpQuestion = asksForAppHelp(message);
  const onProgress = page === "progress" && deicticPageQuestion;

  const asksForAllProgress =
    (mentionsProgress(message) || onProgress) &&
    /\b(?:todo|todos|completo|completa|general|entero|entera|everything|all|full|overall)\b/u.test(
      message,
    ) &&
    /\b(?:explica|explicame|muestra|dime|resultados|puntajes|puntuaciones|explain|show|tell|results|scores)\b/u.test(
      message,
    );
  if (asksForAllProgress) return "PROGRESS_FULL";

  const asksForReview =
    /\b(?:review|repaso|repasar|cola de repaso|review queue|que debo repasar|what should i review)\b/u.test(
      message,
    ) &&
    (mentionsProgress(message) ||
      page === "progress" ||
      /\b(?:mi|my)\b/u.test(message));
  if (asksForReview) return "PROGRESS_REVIEW";

  const asksForScenarios =
    /\b(?:scenario mastery|dominio de escenarios|escenarios dominados|scenario progress|progreso de escenarios)\b/u.test(
      message,
    );
  if (asksForScenarios) return "PROGRESS_SCENARIOS";

  const asksForExposure =
    /\b(?:vocabulario|vocabulary|gramatica|grammar)\b/u.test(message) &&
    /\b(?:cuanto|cuantos|aprendi|encontre|vi|progreso|conteo|how much|how many|learned|encountered|count|progress)\b/u.test(
      message,
    );
  if (asksForExposure && (mentionsProgress(message) || page === "progress"))
    return "PROGRESS_EXPOSURE";

  const asksForCompetencies =
    /\b(?:competenc(?:ia|ias)|competenc(?:y|ies)|speaking|listening|writing|communication ability|habilidad(?:es)?|strengths?|fortalezas?|priorit(?:y|ies)|prioridades)\b/u.test(
      message,
    ) &&
    /\b(?:puntaje|puntuacion|score|resultado|result|nivel|level|progreso|progress|por que|why|como voy|how am i doing)\b/u.test(
      message,
    );
  if (asksForCompetencies && (mentionsProgress(message) || page === "progress"))
    return "PROGRESS_COMPETENCIES";

  const asksForGeneralLevel =
    /\b(?:general level|nivel general|puntos generales|general points|learning journey weighted average|promedio.*learning journey|hsk ganado|earned hsk)\b/u.test(
      message,
    ) ||
    ((mentionsProgress(message) || page === "progress") &&
      /\b(?:puntaje|puntuacion|score|puntos|points|55%|porcentaje|percentage|nivel|level)\b/u.test(
        message,
      ));
  if (asksForGeneralLevel) return "PROGRESS_GENERAL";

  if (
    (mentionsProgress(message) && appHelpQuestion) ||
    (onProgress &&
      /\b(?:como|que|funciona|sirve|explica|how|what|work|explain)\b/u.test(
        message,
      ))
  )
    return "PROGRESS_GUIDE";

  const asksForMatchingRoute =
    /\b(?:cual|que|donde|recomienda|recomiendas|mejor|escenario|leccion|ruta|para aprender|para practicar|which|what|where|recommend|best|scenario|lesson|to learn|to practice)\b/u.test(
      message,
    ) &&
    /\b(?:pedir|comprar|viajar|restaurante|pizza|hotel|trabajo|entrevista|direccion|direcciones|transporte|comida|order|buy|travel|restaurant|pizza|hotel|work|interview|directions|transport|food)\b/u.test(
      message,
    );
  const learningJourneyQuestion =
    (mentionsLearningJourney(message) && appHelpQuestion) ||
    (page === "learning journey" &&
      (deicticPageQuestion || asksForMatchingRoute));
  if (learningJourneyQuestion) {
    return asksForMatchingRoute
      ? "LEARNING_JOURNEY_ROUTE"
      : "LEARNING_JOURNEY_GUIDE";
  }

  if (
    (mentionsSpeakingLab(message) && appHelpQuestion) ||
    (page === "speaking lab" && deicticPageQuestion)
  )
    return "SPEAKING_LAB_GUIDE";

  if (
    (mentionsWritingLab(message) && appHelpQuestion) ||
    (page === "writing lab" && deicticPageQuestion)
  )
    return "WRITING_LAB_GUIDE";

  return null;
}

export function buildStaticHanAppContext(
  intent: HanAppContextIntent,
): string | null {
  switch (intent) {
    case "LEARNING_JOURNEY_GUIDE":
      return [
        "On-demand HanGo context for this response only:",
        "Learning Journey is the structured course. It groups real-life scenarios into Foundations, Everyday Life, and Advanced Situations, with ordered lessons inside each scenario.",
        'To start, open "Learning Journey", find the chapter marked "You are here", enter its current scenario, and open the available lesson marked by Han/the play icon. If no marker appears, choose the first unfinished scenario.',
        "Answer the learner's app-navigation question before offering Mandarin examples. Do not claim you opened a page for them.",
      ].join("\n");
    case "SPEAKING_LAB_GUIDE":
      return [
        "On-demand HanGo context for this response only:",
        "Speaking Lab is optional extra speaking practice, separate from the Speaking step inside a lesson and separate from Han's side-panel conversation.",
        "Its choices are: Practice with Han for a live free-topic conversation with level and speed controls; Practice a lesson to revisit lesson speaking; Shadowing to repeat a lesson dialogue turn by turn or as a continuous long text; and Scenario Role Play to respond in character to a mission.",
        "It can provide spoken-practice feedback including tone matching. Explain only the option relevant to the learner's question.",
      ].join("\n");
    case "WRITING_LAB_GUIDE":
      return [
        "On-demand HanGo context for this response only:",
        "Writing Lab is optional extra writing practice, separate from lesson exercises.",
        "Its choices are: Write a Paragraph about a lesson topic; Translation Challenge to translate a provided text into Chinese; and Custom Writing, where the learner chooses topic, level, format, and tone. Han gives feedback and recent attempts are saved.",
        "Explain only the option relevant to the learner's question.",
      ].join("\n");
    case "PROGRESS_GUIDE":
      return [
        "On-demand HanGo context for this response only:",
        "Progress explains evidence-based growth: earned General Level, Learning Journey average, competencies, vocabulary/grammar exposure, strengths, priorities, Scenario Mastery, recommended next lesson, and Review.",
        "Starting level is self-reported and is not the same as earned progress. Vocabulary/grammar counts mean encountered items, not mastery. Offer to explain a specific block; do not invent the learner's numbers.",
      ].join("\n");
    default:
      return null;
  }
}
