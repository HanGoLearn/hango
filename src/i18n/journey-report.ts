/** Final-report interface copy only; provider feedback stays in the frozen
 * attempt locale. Switching display language must not trigger paid translation. */
export const journeyReportMessages = {
  es: {
    title: "Tu resultado de la lección",
    legacyTitle: "Esta lección conserva un resultado anterior",
    legacyNotice:
      "La nueva evaluación ya está habilitada. Para medir esta lección con tu conversación propia, pulsa Intentar de nuevo y confirma. No convertiremos el resultado anterior en una evaluación nueva ni borraremos otras lecciones o cuentas.",
    setupTitle: "La nueva evaluación aún no está disponible",
    setupNotice:
      "Falta completar la preparación de la base de datos local. No iniciaremos el flujo antiguo como sustituto ni generaremos un informe con datos incompletos.",
    accountSummary: "Tu progreso y saldo",
    pointsContribution: "Aporte: {amount} puntos",
    lessonCoinsRecorded: "{amount} HanCoins registrados",
    loading: "Cargando el resultado…",
    continueWithoutVoice: "Continuar sin evaluación oral",
    loadError:
      "No pudimos confirmar el resultado. Comprueba su estado o reintenta solo el guardado; no generamos otra evaluación automáticamente.",
    evaluate: "Evaluar esta conversación",
    evaluateDescription:
      "Evaluaremos la conversación guardada una sola vez. Esta acción utiliza IA; volver a abrir el informe no genera otra evaluación.",
    checkStatus: "Comprobar estado",
    saveResult: "Guardar resultado",
    retrySave: "Reintentar solo el guardado",
    finishLesson: "Finalizar lección",
    returnToJourney: "Volver a la ruta",
    partialProgressNote:
      "El informe parcial queda guardado, pero esta lección aún no está completada. No otorgamos logros de finalización ni desbloqueamos la siguiente lección con evidencia faltante.",
    score: "Nota global",
    stars: "Estrellas",
    complete: "Evaluación completa",
    partial: "Resultado parcial",
    pending: "Evaluación pendiente",
    vocabulary: "Vocabulario",
    grammar: "Gramática",
    comprehension: "Comprensión y práctica",
    speaking: "Conversación",
    quizComplete: "Todas las respuestas evaluadas",
    quizPartial: "Faltan respuestas por evaluar",
    quizMissing: "Sin respuestas registradas",
    noOpportunity: "Sin preguntas previstas",
    correct: "Correctas",
    incorrect: "Incorrectas",
    ungraded: "Pendientes de evaluar",
    missing: "Sin responder",
    speakingPending: "La evaluación de esta conversación está pendiente.",
    speakingProcessing: "Estamos evaluando esta conversación.",
    speakingFailed:
      "No pudimos obtener una evaluación fiable. Esto no equivale a una nota de cero.",
    speakingInsufficient:
      "No hay suficiente evidencia para dar una nota de conversación.",
    partialNote:
      "No calculamos una nota global mientras falte evidencia esencial. No sustituimos los datos faltantes por errores.",
    achievement: "Lo que hiciste bien",
    priority: "Tu siguiente mejora",
    nextStep: "Ahora prueba esto",
    details: "Ver evidencia y criterios",
    answerDetails: "Detalle de ejercicios",
    speakingTechnical:
      "La captura oral no se completó correctamente o terminó sin audio. No lo contamos como un error de idioma ni una nota de cero.",
    speakingNoSpeech:
      "No hay intervenciones tuyas registradas en este intento. No es una nota de cero.",
    communication: "Comunicación",
    language: "Uso del idioma",
    interaction: "Interacción",
    autonomy: "Autonomía",
    notObserved: "Sin evidencia suficiente",
    noCriterionOpportunity: "Sin oportunidad de observarlo",
    acousticNote:
      "Los tonos y la pronunciación no se puntúan desde una transcripción.",
    rewardsPending:
      "Las recompensas se confirmarán después de guardar el resultado completo.",
    rewardsSettled:
      "Resultado guardado y recompensas procesadas. Volver a abrirlo no suma recompensas otra vez.",
    rewardsUnavailable:
      "Sin nota global completa, todavía no hay estrellas ni recompensas por este resultado.",
  },
  en: {
    title: "Your lesson result",
    legacyTitle: "This lesson has a previous result",
    legacyNotice:
      "The new evaluation is enabled. To assess this lesson from your own conversation, press Try again and confirm. We will not relabel the old result as a new evaluation or reset other lessons or accounts.",
    setupTitle: "The new evaluation is not available yet",
    setupNotice:
      "Local database preparation is incomplete. We will not silently use the old flow or generate a report from incomplete data.",
    accountSummary: "Your progress and balance",
    pointsContribution: "Contribution: {amount} points",
    lessonCoinsRecorded: "{amount} HanCoins recorded",
    loading: "Loading your result…",
    continueWithoutVoice: "Continue without an oral evaluation",
    loadError:
      "We could not confirm the result. Check its status or retry saving only; we do not generate another evaluation automatically.",
    evaluate: "Evaluate this conversation",
    evaluateDescription:
      "We will evaluate the saved conversation once. This action uses AI; reopening the report does not generate another evaluation.",
    checkStatus: "Check status",
    saveResult: "Save result",
    retrySave: "Retry saving only",
    finishLesson: "Finish lesson",
    returnToJourney: "Return to the journey",
    partialProgressNote:
      "The partial report is saved, but this lesson is not completed yet. Missing evidence does not grant completion achievements or unlock the next lesson.",
    score: "Overall score",
    stars: "Stars",
    complete: "Complete evaluation",
    partial: "Partial result",
    pending: "Evaluation pending",
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    comprehension: "Comprehension and practice",
    speaking: "Conversation",
    quizComplete: "All answers assessed",
    quizPartial: "Some answers still need assessment",
    quizMissing: "No answers recorded",
    noOpportunity: "No questions planned",
    correct: "Correct",
    incorrect: "Incorrect",
    ungraded: "Awaiting assessment",
    missing: "Unanswered",
    speakingPending: "This conversation is awaiting evaluation.",
    speakingProcessing: "We are evaluating this conversation.",
    speakingFailed:
      "We could not obtain a reliable evaluation. This does not mean a score of zero.",
    speakingInsufficient:
      "There is not enough evidence for a conversation score.",
    partialNote:
      "We do not calculate an overall score while essential evidence is missing. Missing data is not counted as a mistake.",
    achievement: "What you did well",
    priority: "Your next improvement",
    nextStep: "Try this next",
    details: "View evidence and criteria",
    answerDetails: "Exercise details",
    speakingTechnical:
      "The oral capture did not finish correctly or ended without audio. This is not counted as a language mistake or a score of zero.",
    speakingNoSpeech:
      "No learner turns were recorded in this attempt. This is not a score of zero.",
    communication: "Communication",
    language: "Language use",
    interaction: "Interaction",
    autonomy: "Autonomy",
    notObserved: "Not enough evidence",
    noCriterionOpportunity: "No opportunity to observe this",
    acousticNote: "Tones and pronunciation are not scored from a transcript.",
    rewardsPending:
      "Rewards will be confirmed after the complete result is saved.",
    rewardsSettled:
      "Result saved and rewards processed. Reopening it does not grant rewards again.",
    rewardsUnavailable:
      "Without a complete overall score, there are no stars or rewards for this result yet.",
  },
} as const;
