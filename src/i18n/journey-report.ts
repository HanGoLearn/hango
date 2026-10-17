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
    recover: "Recuperar evaluación",
    recoverDescription:
      "Usaremos la conversación que ya guardaste; no necesitas repetir la lección. Puedes solicitar una recuperación. Generará una nueva evaluación con IA y consumo adicional; abrir esta pantalla no lo hace automáticamente.",
    exerciseProgress: "Tu avance hasta ahora",
    exerciseSummary:
      "En los ejercicios evaluados: {correct} de {total} respuestas correctas.",
    savedPractice: "Tu práctica está guardada",
    feedbackPending:
      "La devolución de tu conversación sigue pendiente. Tus respuestas no se han perdido.",
    hanNote: "Una nota de Han",
    evaluateDescription:
      "Evaluaremos la conversación guardada una sola vez. Esta acción utiliza IA; volver a abrir el informe no genera otra evaluación.",
    checkStatus: "Comprobar estado",
    saveResult: "Guardar resultado",
    retrySave: "Reintentar solo el guardado",
    finishLesson: "Finalizar lección",
    returnToJourney: "Volver a la ruta",
    partialProgressNote:
      "Tu avance está guardado. La lección se completará cuando esté lista la evaluación pendiente.",
    score: "Nota global",
    stars: "Estrellas",
    complete: "Evaluación completa",
    partial: "Resultado parcial",
    pending: "Evaluación pendiente",
    vocabulary: "Vocabulario",
    grammar: "Gramática",
    comprehension: "Comprensión y práctica",
    speaking: "Conversación",
    clearTurnsOnly:
      "Evaluamos tus intervenciones claras; los fragmentos con reconocimiento dudoso quedan fuera de la nota.",
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
      "Tu conversación está guardada, pero HanGo no pudo validar su evaluación. Es un fallo del sistema, no un error tuyo ni una nota de cero.",
    speakingInsufficient:
      "No hay suficiente evidencia para dar una nota de conversación.",
    partialNote:
      "La nota final está pendiente; conservamos los resultados que ya completaste.",
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
    recover: "Recover evaluation",
    recoverDescription:
      "We will use your saved conversation; you do not need to repeat the lesson. You can request one recovery. It creates a new AI evaluation and additional usage; opening this screen never does this automatically.",
    exerciseProgress: "Your progress so far",
    exerciseSummary:
      "In assessed exercises: {correct} of {total} answers correct.",
    savedPractice: "Your practice is saved",
    feedbackPending:
      "Your conversation feedback is still pending. Your answers have not been lost.",
    hanNote: "A note from Han",
    evaluateDescription:
      "We will evaluate the saved conversation once. This action uses AI; reopening the report does not generate another evaluation.",
    checkStatus: "Check status",
    saveResult: "Save result",
    retrySave: "Retry saving only",
    finishLesson: "Finish lesson",
    returnToJourney: "Return to the journey",
    partialProgressNote:
      "Your progress is saved. The lesson will be completed once the pending evaluation is ready.",
    score: "Overall score",
    stars: "Stars",
    complete: "Complete evaluation",
    partial: "Partial result",
    pending: "Evaluation pending",
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    comprehension: "Comprehension and practice",
    speaking: "Conversation",
    clearTurnsOnly:
      "We assess your clear turns; fragments with uncertain recognition are excluded from the score.",
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
      "Your conversation is saved, but HanGo could not validate its evaluation. This is a system failure, not your mistake or a score of zero.",
    speakingInsufficient:
      "There is not enough evidence for a conversation score.",
    partialNote:
      "Your final score is pending; we keep the results you have already completed.",
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
