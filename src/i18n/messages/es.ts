import type { AppMessages } from "@/i18n/messages/types";

export const messages = {
  metadata: {
    title: "HanGo — Aprende chino desde cero y úsalo de verdad",
    description:
      "Aprende mandarín paso a paso, úsalo en situaciones reales y perfecciona tus habilidades con una ruta estructurada y un AI Teacher que se adapta a tu nivel.",
    socialTitle: "Empieza desde cero. Lleva tu chino hasta donde quieras.",
    socialDescription:
      "Aprende chino paso a paso y úsalo en situaciones reales.",
    socialImageAlt:
      "HanGo — Empieza desde cero y lleva tu chino hasta donde quieras.",
  },
  common: {
    languageSwitcher: "Elegir idioma de la interfaz",
  },
  learningJourney: {
    title: "Ruta de aprendizaje",
    headline: "De tus primeras palabras a conversaciones reales",
    continueLabel: "Continúa",
    lessonProgress: "Lección {current} de {total}",
    scenarioProgress: "{completed} de {total} situaciones",
    inProgress: "En curso",
    description:
      "Elige una situación real y avanza paso a paso por sus lecciones.",
    emptyDescription:
      "Situaciones como Restaurante, Hotel y Compras aparecerán aquí cuando el contenido del curso esté disponible.",
    scenarioCount: "{count} situaciones",
    currentChapter: "Estás aquí",
    beta: {
      nextPhase: "Próxima fase de la beta",
      reviewMessage:
        "Estamos terminando de revisar este nivel antes de abrirlo a más estudiantes.",
      previewAction: "Ver lo que aprenderás",
      previewTitle: "Un vistazo a lo que viene después",
      backToFoundations: "Continuar con Fundamentos",
    },
    chapters: {
      BEGINNER: {
        title: "Fundamentos",
        subtitle: "Nivel principiante",
        blurb: "Saluda, preséntate, cuenta y pide lo básico.",
      },
      INTERMEDIATE: {
        title: "Vida cotidiana",
        subtitle: "Nivel intermedio",
        blurb: "Come fuera, compra, viaja y haz amigos.",
      },
      ADVANCED: {
        title: "Situaciones avanzadas",
        subtitle: "Nivel avanzado",
        blurb: "Trabaja, negocia y defiende tu punto de vista.",
      },
    },
    detail: {
      chapterBadge: "Capítulo {number} · {name}",
      outcomes: "Al terminar, podrás",
      lessonsProgress: "{completed} de {total} lecciones",
      pathLabel: "Tu camino · {count} lecciones",
      finalMission: "Misión final",
      difficulty: {
        BEGINNER: "Fundamentos",
        INTERMEDIATE: "Vida cotidiana",
        UPPER_INTERMEDIATE: "Intermedio alto",
        ADVANCED: "Situaciones avanzadas",
      },
    },
    lessonPath: {
      status: {
        COMPLETED: "Completada",
        AVAILABLE: "Disponible",
        LOCKED: "Bloqueada",
      },
      placedByExam: "Asignada por la prueba de nivel",
      placedByExamTitle:
        "Completa la lección para confirmar o mejorar tu puntuación.",
    },
  },
  lesson: {
    loading: "Cargando tu lección.",
    loadErrorTitle: "No pudimos cargar esta lección",
    loadErrorDescription:
      "Ocurrió un problema al cargar esta lección. Inténtalo de nuevo.",
    common: {
      continue: "Continuar",
      next: "Siguiente",
      nextQuestion: "Siguiente pregunta",
      of: "de",
      checkAnswers: "Comprobar respuestas",
      check: "Comprobar",
      submit: "Enviar",
      tryAgain: "Intentarlo de nuevo",
      cancel: "Cancelar",
      confirmTryAgain: "Sí, intentarlo de nuevo",
      showHint: "Mostrar pista",
      back: "Atrás",
      correct: "Correcto.",
      correctExcited: "¡Correcto!",
      notQuite: "Aún no.",
      notQuiteShort: "Aún no",
      submitted: "Enviado.",
      audioUnavailable: "Audio no disponible",
    },
    header: {
      exit: "Salir de la lección",
      progress: "{completed} de {total} pasos",
      saving: "Guardando...",
      saved: "Guardado",
      saveError: "No pudimos guardar eso. Inténtalo de nuevo.",
    },
    display: {
      pinyin: "Pinyin",
      translation: "Traducción",
    },
    navigation: {
      ariaLabel: "Pasos de la lección",
      status: {
        completed: "completado",
        available: "disponible",
        locked: "bloqueado",
      },
      steps: {
        situation: "Situación",
        objective: "Objetivo",
        dialogue: "Diálogo",
        comprehension: "Comprensión",
        vocabulary: "Vocabulario",
        grammar: "Gramática",
        guidedPractice: "Práctica guiada",
        speaking: "Expresión oral",
        writing: "Escritura",
        aiChallenge: "Desafío con IA",
        quiz: "Prueba",
        mission: "Misión",
        reflection: "Reflexión",
      },
    },
    ai: {
      ask: "Preguntar a la IA",
      aboutLine: "Preguntar a la IA sobre esta frase",
      aboutGrammar: "Preguntar a la IA sobre este punto gramatical",
      practiceVocabulary: "Practicar esto con la IA",
    },
    audio: {
      couldntLoad: "No pudimos cargar el audio.",
      couldntPlay: "No se pudo reproducir este archivo de audio.",
      stop: "Detener {label}",
      play: "Reproducir {label}",
      alreadyPlayed: "{label} ya se reprodujo; solo puede escucharse una vez",
      retry: "{error}; toca para volver a reproducir {label}",
      alreadyPlayedTitle: "Ya se reprodujo; solo puede escucharse una vez",
      retryTitle: "No pudimos cargar el audio; toca para reintentar",
      stopLine: "Detener la frase de {speaker}",
      playLine: "Reproducir la frase de {speaker}",
      pronunciation: "pronunciación de {word}",
      example: "ejemplo {text}",
      conversation: {
        play: "Reproducir conversación",
        pause: "Pausar conversación",
        seek: "Desplazarse por el audio de la conversación",
        unavailable: "Audio de la conversación no disponible",
      },
    },
    situation: { title: "Situación", conversation: "Conversación" },
    dialogue: { title: "Diálogo" },
    comprehension: {
      title: "Comprensión",
      listenFirst: "Escucha antes de leer",
      listenDescription:
        "Reproduce la conversación y descubre cuánto comprendes de oído. Las preguntas y el texto en chino aparecerán cuando estés listo.",
      ready: "Estoy listo para las preguntas",
      error: "No pudimos comprobar tus respuestas. Inténtalo de nuevo.",
      emptyTitle: "Todavía no hay nada que comprobar",
      emptyDescription: "Esta lección no tiene preguntas de comprensión.",
    },
    grammar: {
      title: "Gramática",
      explanation: "Explicación",
      examples: "Ejemplos",
      practice: "Práctica",
      commonMistake: "Error frecuente: {mistake}",
      noPractice: "No hay preguntas de práctica disponibles por ahora.",
      screenProgress: "Pregunta {current} de {total}",
    },
    vocabulary: {
      title: "Vocabulario",
      introduction: "Estas son las palabras que necesitarás en esta lección.",
      listenToHan: "Escuchar a Han",
      pauseHan: "Pausar a Han",
      voiceUnavailable: "Voz no disponible",
      empty: "Esta lección no tiene vocabulario.",
      alreadyKnow: "¿Ya conoces estas {count} palabras?",
      quickTestDescription:
        "Haz una prueba rápida: consigue al menos {threshold}% y pasa directamente a Gramática. Después practicarás bien todo lo que falles.",
      quickTest: "Prueba rápida",
      normalWalkthrough: "Aprender paso a paso",
      quickTestProgress: "Progreso de la prueba rápida",
      finishQuickTest: "Terminar prueba rápida",
      wordProgress: "Progreso de palabras",
      questionProgress: "Pregunta {current} de {total}",
      example: "Ejemplo",
      noExamples: "No hay ejemplos disponibles.",
      whatDoesMean: "¿Qué significa {word}?",
      whichWordMeans: "¿Qué palabra significa «{meaning}»?",
      completeSentence: "Completa la oración",
      nextWord: "Siguiente palabra",
      correctAnswer: "{option} (respuesta correcta)",
      incorrectAnswer: "{option} (tu respuesta, incorrecta)",
      orderSentence: "Ordena la oración",
      tapInOrder: "Toca las palabras de abajo en el orden correcto.",
      correctOrder: "Orden correcto: {order}",
    },
    guidedPractice: {
      title: "Práctica guiada",
      emptyTitle: "Todavía no hay nada que practicar",
      emptyDescription: "Esta lección no tiene ejercicios de práctica guiada.",
    },
    writing: {
      title: "Escritura",
      description:
        "Practicarás escribiendo oraciones de esta lección con comentarios de la IA.",
      comingIn: "Writing Lab",
    },
    placeholder: {
      comingIn: "Disponible en {area}",
      description:
        "Este paso es provisional por ahora y será totalmente interactivo cuando se complete esa fase.",
    },
    quiz: {
      title: "Prueba",
      emptyTitle: "Todavía no hay una prueba",
      emptyDescription: "Esta lección no tiene una prueba.",
      questions: "{count} preguntas",
      start: "Comenzar prueba",
      results: "Resultados de la prueba",
      score: "{correct} de {total} correctas — {score}%",
      retry: "Repetir prueba",
      finish: "Terminar prueba",
    },
    mission: {
      title: "Misión",
      emptyTitle: "Todavía no hay una misión",
      emptyDescription: "Esta lección no tiene una misión.",
      retry: "Reintentar",
      done: "Terminar",
      end: "Finalizar misión",
      roles: "Tú interpretas a {learner}. La IA interpreta a {ai}.",
      learnerFallback: "el estudiante",
      aiFallback: "el otro personaje",
      success: "Cómo completar la misión",
      start: "Comenzar misión",
      ready: "Comienza la conversación cuando estés listo.",
      thinking: "Pensando...",
      retryMessage: "Reintentar",
      responsePlaceholder: "Escribe tu respuesta en chino...",
      yourMessage: "Tu mensaje",
      sendMessage: "Enviar mensaje",
      reportDimensions: {
        communicationSuccess: "Éxito comunicativo",
        taskCompletion: "Tarea completada",
        vocabularyUsage: "Uso del vocabulario",
        grammarUsage: "Uso de la gramática",
        clarity: "Claridad",
      },
      successConditions: "Condiciones para completar la misión",
      notes: "Observaciones",
      recommendedNextStep: "Próximo paso recomendado",
    },
    exercise: {
      answerPlaceholder: "Escribe tu respuesta",
      answerLabel: "Tu respuesta",
      responsePlaceholder: "Escribe tu respuesta",
      responseLabel: "Tu respuesta",
      tapInOrder: "Toca las palabras de abajo en el orden correcto.",
    },
    speaking: {
      title: "Expresión oral",
      description:
        "Ten una conversación nueva y espontánea dentro del escenario de la lección. Puedes explorar con naturalidad; tu interlocutor te ayudará a volver al objetivo.",
      hideHelp: "Ocultar ayuda",
      needHelp: "¿Necesitas ayuda?",
      helpLabel: "Ayuda para la conversación",
      yourGoal: "Tu objetivo",
      questions: "Preguntas que puedes hacer",
      usefulPhrases: "Frases útiles",
      grammar: "Gramática que puedes usar",
      vocabulary: "Vocabulario de la lección",
      helpTip:
        "Elige una frase corta para tu próximo turno y adáptala a la conversación en vez de leer toda la lista.",
      testFinished: "Conversación de prueba terminada",
      saved: "Conversación guardada",
      testTurns:
        "Se capturaron {count} turnos transcritos solo para esta prueba. No se añadieron a Progreso ni a Reflexión.",
      reflectionTurns:
        "Se usarán {count} turnos transcritos en los comentarios de tu Reflexión.",
      testNextLesson: "Probar la siguiente lección",
      microphoneUnavailable:
        "El micrófono no está disponible; continúa el mismo juego de rol por texto.",
      useText: "Usar texto",
    },
    reflection: {
      title: "Reflexión",
      loading: "Preparando tu informe...",
      error:
        "No pudimos preparar tu informe ahora. Aun así, puedes terminar la lección abajo.",
      finishLesson: "Terminar lección",
      holdBreakdown: "{label} — mantén presionado para ver el detalle",
      loadingBreakdown: "Cargando detalle…",
      nothingGraded: "Todavía no hay nada calificado en {noun}.",
      breakdown: "{correct} aciertos de {total} en {noun} ({missed} fallos)",
      finalScore:
        "Tu puntuación final es {final}/100: el promedio de tus 5 habilidades principales fue {average}/100, pero solo usaste {vocabulary}% del vocabulario objetivo y completaste {objective}% del objetivo. Esos dos porcentajes multiplican el promedio ({average} × {vocabulary}% × {objective}% ≈ {final}) en vez de reducirlo solo un poco; por eso la puntuación final queda muy por debajo del promedio de habilidades.",
      niceWork: "Buen trabajo hoy",
      keepPracticing: "Sigue practicando",
      passScore: "/ 100 — se aprueba con {score}+",
      dayStreak: "Racha de {count} días",
      learned: "Lo que aprendiste",
      vocabulary: "Vocabulario",
      comprehension: "Comprensión",
      grammar: "Gramática",
      speaking: "Expresión oral",
      wordsExplored: "{covered}/{total} palabras exploradas",
      quizQuestions: "preguntas de vocabulario",
      exercises: "ejercicios",
      speakingRequirement:
        "Alcanzar 30/30 exige usar bien el vocabulario y completar todo el objetivo, no solo conversar con fluidez.",
      speakingIssues:
        "Se identificaron {count} {issues} concretos en esta conversación.",
      issue: "aspecto",
      issues: "aspectos",
      noSpeakingEvaluation: "Todavía no hay una evaluación oral.",
      dimensions: {
        pronunciation: "Pronunciación",
        fluency: "Fluidez",
        accuracy: "Precisión",
        lessonLanguage: "Lenguaje de la lección",
        communication: "Comunicación",
        vocabularyUsed: "Vocabulario utilizado",
        objectiveCompleted: "Objetivo completado",
      },
      evaluationUnavailable:
        "La evaluación oral no está disponible temporalmente. Vuelve a abrir Reflexión para reintentarlo.",
      notEnoughData:
        "Todavía no hay suficientes datos. Practica en el paso de Expresión oral para ver aquí tu puntuación.",
      speakingErrors: "Errores de expresión oral",
      transcriptSaved:
        "Tu transcripción se guardó, pero la evaluación automática no está disponible temporalmente. Vuelve a abrir Reflexión para reintentarlo.",
      longerConversation:
        "Completa una conversación oral más larga para recibir aquí comentarios específicos.",
      noErrors:
        "No se detectaron errores orales específicos en la evidencia disponible.",
      recommendedNextStep: "Próximo paso recomendado",
      noteFromHan: "Una nota de Han",
      wentWell: "Lo que hiciste bien",
      improve: "Lo que puedes mejorar",
    },
    results: {
      loading: "Cargando tus resultados...",
      error: "No pudimos cargar tus resultados ahora.",
      tryAgainTitle: "¿Quieres repetir esta lección?",
      tryAgainDescription:
        "Esto borra tu progreso y puntuación de esta lección para que puedas comenzarla de nuevo. El resultado nuevo reemplazará al anterior; no se acumularán.",
    },
    rewards: {
      title: "Lo que ganaste",
      experienceEarned: "+{amount} experiencia",
      experienceTitle: "Experiencia",
      coinsEarned: "+{amount} HanCoins",
      coinsBalance: "Tienes {balance} en total",
      coinsNone: "HanCoins",
      rankTitle: "Tu puesto",
      rankValue: "#{rank} de {total}",
      achievementsTitle: "Logros",
      achievementsValue: "{unlocked} de {total}",
    },
  },
  shell: {
    primaryNavigation: "Navegación principal",
    mobileNavigation: "Navegación principal para móvil",
    learnerProfile: "Perfil del estudiante",
    todayGoal: "Meta de hoy",
    userMenu: "Menú de usuario",
    administrator: "Administrador",
    logOut: "Cerrar sesión",
    navigation: {
      dashboard: { label: "Inicio", mobile: "Inicio" },
      learning: { label: "Aprendizaje", mobile: "Aprender" },
      learningJourney: { label: "Ruta de aprendizaje", mobile: "Ruta" },
      speakingLab: { label: "Speaking Lab", mobile: "Speaking" },
      writingLab: { label: "Writing Lab", mobile: "Writing" },
      han: { label: "Han", mobile: "Han" },
      // Sin traducir, igual que Speaking Lab y Writing Lab: terminología
      // oficial de producto (branding.md).
      hanTutor: { label: "Han Tutor", mobile: "Tutor" },
      hanCompanion: { label: "Han Companion", mobile: "Companion" },
      hanVocabulary: { label: "Han Vocabulary", mobile: "Vocabulario" },
      progress: { label: "Progreso", mobile: "Progreso" },
      shop: { label: "Tienda", mobile: "Tienda" },
      leaderboard: { label: "Ranking", mobile: "Ranking" },
      settings: { label: "Configuración", mobile: "Ajustes" },
    },
    theme: {
      change: "Cambiar tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    hanCoins: {
      balance: "Tienes {balance}",
      description:
        "Úsalos en la Tienda para conseguir sombreros, gafas y ropa para tu personaje.",
      earnTitle: "Cómo conseguirlos",
      sources: {
        daily: {
          title: "Entra a la app",
          detail: "Una vez al día, solo por volver",
        },
        lesson: {
          title: "Completa una lección",
          detail: "1, 2 o 3 HanCoins, según tu puntuación",
        },
        scenario: {
          title: "Termina un escenario por primera vez",
          detail: "Una vez por escenario; no cuenta al repetirlo",
        },
        achievement: {
          title: "Desbloquea un logro",
          detail:
            "Rachas, niveles generales, dominio, capítulos completos y más",
        },
        leaderboard: {
          title: "Queda entre los 3 primeros del leaderboard semanal",
          detail: "Clasificado por los HanCoins ganados esa semana",
        },
      },
      earnedOnly: "Nunca se compran con dinero real: siempre se ganan.",
    },
    achievementCelebration: {
      unlocked: "Logro desbloqueado",
      next: "Siguiente ({count} más)",
      nice: "¡Genial!",
    },
    coinCelebration: {
      received: "¡Recibiste HanCoins!",
      continue: "Continuar",
      earned: "Ganados",
      reasons: {
        lessonCompleted: "Lección completada",
        scenarioCompleted: "Escenario completado",
        achievementUnlocked: "Logro desbloqueado",
        weeklyLeaderboard: "Premio semanal del leaderboard",
        dailyLogin: "Entrada diaria",
      },
    },
  },
  onboarding: {
    progress: { step: "Paso", of: "de" },
    common: { back: "Atrás", continue: "Continuar" },
    welcome: {
      title: "Conoce a Han",
      description:
        "Tu profesor durante todo este recorrido. Primero responderás unas preguntas breves para adaptar las lecciones a ti.",
      features: [
        {
          title: "Te explica mientras avanzas",
          description:
            "Pregúntale a Han lo que necesites, por texto o por voz.",
        },
        {
          title: "Conversa contigo",
          description:
            "Practica conversaciones reales en voz alta, no solo escribiendo.",
        },
        {
          title: "Te ayuda a mantener tu racha",
          description: "Un pequeño impulso antes de perderla.",
        },
      ],
      action: "Comenzar",
    },
    appearance: {
      title: "¿Cómo prefieres ver HanGo?",
      description:
        "Elige el aspecto que te resulte más cómodo para estudiar. Puedes cambiarlo cuando quieras desde Ajustes.",
      light: "Claro",
      dark: "Oscuro",
      system: "Como mi dispositivo",
    },
    profile: {
      title: "¿Cómo debería llamarte Han?",
      description:
        "Han usará tu nombre para dirigirse a ti y podrás cambiarlo cuando quieras. Tu nombre de cuenta es lo que verán otros estudiantes en el leaderboard y será permanente una vez elegido.",
      displayName: "Tu nombre",
      displayNamePlaceholder: "Como te llamará Han",
      accountName: "Nombre de cuenta",
      accountNamePlaceholder: "Para el leaderboard",
      accountNameHint:
        "Solo letras, números y guiones bajos. Será permanente: elígelo con cuidado.",
    },
    avatar: {
      title: "Elige tu personaje",
      description:
        "Escoge un animal del zodiaco para representarte. Es solo por diversión: podrás cambiarlo cuando quieras y nunca afectará tu progreso.",
      comingSoon: "Próximamente",
      animalNames: {
        RABBIT: "Conejo",
        MONKEY: "Mono",
        DOG: "Perro",
        TIGER: "Tigre",
        OX: "Buey",
        RAT: "Rata",
        DRAGON: "Dragón",
        SNAKE: "Serpiente",
        HORSE: "Caballo",
        GOAT: "Cabra",
        ROOSTER: "Gallo",
        PIG: "Cerdo",
      },
    },
    goal: {
      title: "¿Cuál es tu objetivo de aprendizaje?",
      selectAll: "Selecciona todas las opciones que correspondan.",
      options: {
        speakConfidently: "Hablar con confianza",
        hskPreparation: "Prepararme para el HSK",
        travel: "Viajar",
        work: "Trabajar",
        study: "Estudiar",
        personalInterest: "Interés personal",
      },
      reactions: {
        speakConfidently:
          "Bien: empezaremos a hablar desde temprano y con frecuencia.",
        hskPreparation:
          "Entendido: mantendremos tu nivel HSK siempre presente.",
        travel:
          "Perfecto para pedir comida, preguntar direcciones y mucho más.",
        work: "Nos enfocaremos en el chino que realmente usarás en el trabajo.",
        study: "Construiremos una base sólida para tus estudios.",
        personalInterest: "Aprender por puro gusto: mi motivación favorita.",
      },
    },
    level: {
      title: "¿Cuál es tu nivel actual de chino?",
      options: {
        hsk12: "Empezando desde cero o con lo esencial",
        hsk3: "Hablando con soltura",
        hsk4: "Haciéndote entender fácilmente",
        hsk5: "Resolviendo situaciones reales",
        hsk6: "Hablando como profesional",
        hsk79: "Cerca del dominio",
        unsure: "No estoy seguro",
      },
    },
    explanationLanguage: {
      title: "¿En qué idioma debería explicar tu profesor?",
      description:
        "Solo para las explicaciones; las lecciones permanecen en chino.",
      options: {
        english: "Inglés",
        spanish: "Español",
        chinese: "中文 (Chino)",
      },
    },
    skills: {
      title: "¿En qué quieres enfocarte?",
      selectAll: "Selecciona todas las opciones que correspondan.",
      options: {
        listening: "Comprensión auditiva",
        speaking: "Expresión oral",
        reading: "Lectura",
        writing: "Escritura",
        grammar: "Gramática",
        vocabulary: "Vocabulario",
      },
    },
    dailyTarget: {
      title: "¿Cuánto tiempo puedes estudiar cada día?",
      minutes: "min",
    },
    placementOffer: {
      title: "¿Quieres un punto de partida más preciso?",
      description:
        "Realiza una prueba breve de vocabulario, gramática, lectura, comprensión auditiva y expresión oral; toma entre 10 y 15 minutos. Las lecciones que estén en tu nivel real o por debajo se reconocerán automáticamente y podrás repetirlas cuando quieras.",
      skip: "Omitir por ahora",
      takeExam: "Realizar la prueba de nivel",
    },
    placementExam: {
      title: "Prueba de nivel",
      unavailable: "No hay preguntas disponibles en este momento.",
      listeningLabel: "audio de comprensión auditiva",
      listeningInstruction:
        "Solo puedes reproducirlo una vez. Escucha con atención y responde después; el texto no se mostrará.",
      groupedListening:
        "Responde todas las preguntas sobre este audio y envíalas juntas.",
      groupedPassage:
        "Responde todas las preguntas sobre este texto y envíalas juntas.",
      groupedDefault: "Responde todas las preguntas y envíalas juntas.",
      orderingInstruction: "Toca las palabras de abajo en el orden correcto.",
      next: "Siguiente",
      resultTitle: "Tu resultado de nivel",
      resultSummary:
        "{questions} preguntas · aproximadamente {minutes} min. Cada habilidad recibe su propio nivel porque reconocer y producir chino son capacidades diferentes; no se reduce todo a un solo número.",
      skills: {
        vocabulary: "Vocabulario",
        grammar: "Gramática",
        reading: "Lectura",
        listening: "Comprensión auditiva",
        speaking: "Expresión oral",
      },
      notReached: "No alcanzado",
      diagnosticTop:
        "El nivel superior que aparece aquí es solo una referencia. No otorga una ubicación ni puntos reales, porque ese rango solo se obtiene con evidencia sostenida en los Labs.",
      diagnosticSpeaking:
        "Tu intento de expresión oral en {level} es solo diagnóstico. La ubicación reconocida se mantiene en {maximum} o menos.",
      creditNote:
        "Las lecciones que están en tu nivel asignado o por debajo recibieron automáticamente puntos de Nivel general. Verás la insignia «Asignado por prueba» en la Ruta de aprendizaje; puedes completar cualquiera de esas lecciones para confirmar o mejorar su puntuación.",
      speaking: {
        evaluating: "Evaluando tu expresión oral",
        evaluatingDescription:
          "Han está comprobando tu fluidez, precisión, complejidad, comunicación, evidencia de pronunciación y cumplimiento de la situación.",
        title: "Nivel de expresión oral · {level}",
        instructions:
          "Mantén una conversación breve y natural en mandarín. El personaje cerrará la situación cuando tenga suficiente evidencia, normalmente después de dos a cinco turnos tuyos.",
        previousBand:
          "Nivel anterior confirmado ({score}/100). Ahora probaremos el siguiente.",
        errorSuffix:
          "Tu transcripción se conservó en esta pantalla; vuelve a iniciar este nivel cuando quieras.",
        retry: "Reintentar",
        evidenceNote:
          "Habla con naturalidad. Las palabras del personaje nunca cuentan como evidencia tuya y {level} seguirá siendo solo diagnóstico.",
        dismiss: "Cerrar mensaje",
      },
      levels: {
        "Mastering the Language": "Dominando el idioma",
        "Refined Fluency": "Fluidez refinada",
        "Nearing Mastery": "Cerca del dominio",
        "Speaking Like a Professional": "Hablando como profesional",
        "Handling Real Situations": "Resolviendo situaciones reales",
        "Easily Understood": "Haciéndote entender fácilmente",
        "Speaking with Ease": "Hablando con soltura",
        "Finding Your Footing": "Encontrando tu ritmo",
        "Getting By": "Comunicándote con lo esencial",
        "Just Starting Out": "Comenzando desde cero",
      },
    },
    recommendation: {
      loading: "Buscando tu punto de partida...",
      ready: "Todo está listo para comenzar",
      recommended: "Recomendado para ti",
      matchingSessions: "Sesiones relacionadas con tus objetivos",
      start: "Empezar a aprender",
    },
    actions: {
      enterName: "Escribe tu nombre",
      nameTooLong: "Usa menos de 60 caracteres",
      accountNameTooShort: "Usa al menos 3 caracteres",
      accountNameTooLong: "Usa menos de 24 caracteres",
      accountNameCharacters: "Usa solo letras, números y guiones bajos",
      selectGoal: "Selecciona al menos un objetivo",
      selectSkill: "Selecciona al menos una habilidad",
      chooseDuration: "Elige una de las duraciones disponibles",
      nicknameTaken: "Ese nombre de cuenta ya está en uso. Prueba con otro.",
      signInRequired: "Debes iniciar sesión para hacer esto.",
      animalUnavailable: "Ese animal todavía no está disponible.",
    },
  },
  dashboard: {
    newLearner: {
      welcomeNamed: "Te damos la bienvenida, {name}",
      welcome: "Te damos la bienvenida a HanGo",
      description:
        "Comienza tu primera lección y empieza a desarrollar tus habilidades en chino.",
      journeyAction: "Ir a la Ruta de aprendizaje",
      primerAction:
        "¿Es tu primer contacto con el chino? Empieza con una introducción breve →",
    },
    titleNamed: "Qué gusto verte de nuevo, {name}",
    title: "Inicio",
    hero: {
      continueLearning: "Continúa aprendiendo",
      caughtUp: "Estás al día",
      caughtUpDescription:
        "No tienes una lección activa en este momento. Revisa las recomendaciones más abajo.",
      streak: "Racha de {count} días",
      streakOne: "Racha de 1 día",
      streakStart: "Empieza tu racha hoy",
      goalMet: "Meta de {minutes} min completada hoy",
      goal: "Meta de hoy: {minutes} min",
      goalShort: "{minutes} min",
      suggestedNext: "Siguiente recomendación:",
      weeklyActivity: "Actividad en {active} de los últimos 7 días",
      experience: "Experiencia",
      streakRisk:
        "Tu racha de {count} días termina hoy si no practicas. ¡Mantenla viva!",
      continueAction: "Continuar",
      weekdays: ["D", "L", "M", "X", "J", "V", "S"],
    },
    quickActions: {
      speaking: "Practicar expresión oral",
      writing: "Practicar escritura",
      primer: "Primeros pasos en chino",
    },
    journey: {
      title: "Ruta de aprendizaje",
      progress: "{completed} de {total} lecciones completadas",
      currentScenario: "Tu escenario actual",
      scenarioProgress: "{completed} de {total}",
      viewAll: "Ver toda la ruta",
      youAreHere: "Estás aquí",
    },
    review: {
      title: "Recomendaciones de repaso",
      minutes: "~{minutes} min",
      learnedIn: "Lo aprendiste en «{lesson}»",
      recentMistake: "Tuviste una dificultad con esto recientemente",
      dialogueTitle: "Escuchar de nuevo: {title}",
      dialogueReason:
        "De «{lesson}»: vuelve a practicar la comprensión auditiva",
      aiTitle: "Práctica generada con IA",
      aiReason: "Recibe una nueva pregunta de práctica de tu AI Teacher",
      actions: {
        review: "Repasar",
        tryAgain: "Intentar de nuevo",
        replay: "Reproducir",
        start: "Comenzar",
      },
    },
    generalLevel: "Experiencia",
    yourProgress: "Tu progreso",
    levels: {
      "Mastering the Language": "Dominando el idioma",
      "Refined Fluency": "Fluidez refinada",
      "Nearing Mastery": "Cerca del dominio",
      "Speaking Like a Professional": "Hablando como profesional",
      "Handling Real Situations": "Resolviendo situaciones reales",
      "Easily Understood": "Haciéndote entender fácilmente",
      "Speaking with Ease": "Hablando con soltura",
      "Finding Your Footing": "Encontrando tu ritmo",
      "Getting By": "Comunicándote con lo esencial",
      "Just Starting Out": "Comenzando desde cero",
    },
    words: {
      title: "Palabras para ti hoy",
      modalTitle: "Palabra del día",
      loading: "Buscando {word}...",
    },
    leaderboard: {
      title: "Leaderboard",
      empty: "Nadie ha sumado puntos todavía. ¡Sé el primero!",
      rank: "Estás en el puesto #{rank} de {total}",
    },
    achievements: {
      title: "Logros",
      unlocked: "{unlocked} de {total} desbloqueados",
    },
    avatar: {
      title: "Tu personaje",
      choose: "Elige tu personaje",
    },
    competency: {
      title: "Resumen de habilidades",
      strong: "Fortaleza",
      focus: "Por reforzar",
      stages: {
        EXPOSURE: "Exposición",
        PRACTICE: "En práctica",
        FUNCTIONAL: "En desarrollo",
        CONFIDENT: "Con confianza",
        MASTERY: "Dominado",
      },
      names: {
        LISTENING: "Comprensión auditiva",
        SPEAKING: "Expresión oral",
        READING: "Lectura",
        WRITING: "Escritura",
        DAILY_COMMUNICATION: "Comunicación cotidiana",
        SOCIAL_COMMUNICATION: "Comunicación social",
        TRAVEL_COMMUNICATION: "Comunicación en viajes",
        PROFESSIONAL_COMMUNICATION: "Comunicación profesional",
        ACADEMIC_COMMUNICATION: "Comunicación académica",
      },
    },
    levelUp: {
      label: "Nuevo nivel",
      message: "Alcanzaste {level}",
    },
    hanTip: {
      title: "Consejo de Han",
      tips: {
        "measure-words-default":
          "En mandarín, los sustantivos necesitan un clasificador después de un número: 一个人 (yí gè rén), no 一人. Si no sabes cuál usar, 个 (gè) suele ser la opción más segura.",
        "tone-minimal-pairs":
          "Un mismo sonido puede formar cuatro palabras distintas: 妈 (mā, mamá), 麻 (má, cáñamo), 马 (mǎ, caballo) y 骂 (mà, regañar). Los tonos son parte de la palabra.",
        "no-verb-conjugation":
          "Los verbos en mandarín no se conjugan. 我吃, 你吃 y 他吃 usan el mismo 吃 (chī); el tiempo se entiende por el contexto o por palabras como 昨天 (ayer).",
        "hao-etymology":
          "好 (hǎo, «bueno») combina 女 (mujer) y 子 (niño). Muchos caracteres se forman al unir componentes más simples que aportan significado o sonido.",
        "le-not-past-tense":
          "了 (le) es una de las partículas más difíciles de ubicar. No significa «pasado»: indica una acción completada o un cambio de estado.",
        "third-tone-sandhi":
          "你好 se escribe con dos terceros tonos, pero se pronuncia ní hǎo, no nǐ hǎo. Cuando se juntan dos terceros tonos, el primero sube como un segundo tono.",
        "ta-homophones":
          "他 (él), 她 (ella) y 它 (eso) se pronuncian tā. El mandarín hablado no distingue el género en este caso; solo lo hacen los caracteres escritos.",
        "number-construction":
          "Los números mayores que 10 se construyen de forma lógica: 十一 (11) es «diez-uno», 二十 (20) es «dos-diez» y 三十五 (35) es «tres-diez-cinco».",
        "qingwen-polite-opener":
          "请问 (qǐngwèn, «¿puedo preguntar?») sirve para iniciar con cortesía una pregunta a una persona desconocida; se parece a «disculpe».",
        "water-radical":
          "Los caracteres que comparten el radical 氵, una forma reducida de 水 («agua»), suelen relacionarse con líquidos: 河 (río), 海 (mar), 汗 (sudor).",
        "no-articles":
          "El mandarín no tiene equivalentes directos de «un» o «el». 猫 puede significar «un gato», «el gato» o «gatos»; el contexto aporta esa información.",
        "ma-question-particle":
          "Añadir 吗 (ma) al final de una afirmación la convierte en una pregunta de sí o no: 你是学生 pasa a ser 你是学生吗?",
        "ye-dou-before-verb":
          "也 (yě, «también») y 都 (dōu, «todos/ambos») se colocan siempre antes del verbo en mandarín.",
        "number-four-taboo":
          "四 (sì, «cuatro») suena parecido a 死 (sǐ, «muerte»), por eso se evita en algunos contextos chinos; ciertos edificios incluso omiten el cuarto piso.",
        "chi-le-ma-greeting":
          "你吃了吗? («¿ya comiste?») suele ser un saludo informal entre amigos, no una pregunta literal sobre la última comida.",
        "yixia-softener":
          "Añadir 一下 (yíxià) suaviza una petición: 等一下 («espera un momento») suena más amable que la orden directa 等 («espera»).",
        "xie-radical":
          "El radical 讠, una forma reducida de 言 («habla»), aparece en caracteres relacionados con hablar: 说 (hablar), 谢 (agradecer), 请 (invitar/pedir por favor).",
        "svo-word-order":
          "El orden básico del mandarín se parece al del español: sujeto-verbo-objeto. 我喜欢猫 significa literalmente «yo-gustar-gatos», en ese orden.",
      },
    },
  },
  speakingLab: {
    common: {
      back: "Volver",
      hidePinyin: "Ocultar pinyin",
      showPinyin: "Mostrar pinyin",
      tryAgain: "Intentar de nuevo",
      finish: "Finalizar",
      backToLab: "Volver a Speaking Lab",
    },
    home: {
      title: "Speaking Lab",
      description:
        "Practica en voz alta con feedback real, incluida una puntuación de tonos calculada a partir de tu propia grabación.",
      practiceWithHan: "Practicar con Han",
      practiceWithHanDescription:
        "Elige cualquier tema, define el nivel y la velocidad, y mantén una conversación oral en vivo creada alrededor de lo que quieres practicar.",
      testMode: "Modo de prueba de Speaking",
      testModeDescription:
        "Abre el paso de Speaking de cualquier lección sin cambiar tu progreso en la Ruta de aprendizaje.",
      openTestMode: "Abrir modo de prueba",
      practiceLesson: "Practicar una lección",
      chooseLesson: "Elegir una lección",
      oneLesson: "1 lección",
      lessons: "{count} lecciones",
      locked: "Bloqueado",
      comingSoon: "Próximamente.",
      unavailable: "Todavía no está disponible: este modo no tiene contenido.",
      emptyTitle: "Todavía no hay actividades",
      emptyDescription:
        "Las actividades de Speaking aparecerán cuando haya contenido disponible en las lecciones.",
      modes: {
        SHADOWING: {
          title: "Shadowing",
          description:
            "Repite una conversación real o un texto largo con apoyo de pinyin.",
        },
        SCENARIO_ROLE_PLAY: {
          title: "Juego de rol del escenario",
          description: "Responde desde tu personaje a la misión del escenario.",
        },
      },
    },
    beta: {
      eyebrow: "Práctica guiada de la beta",
      title: "Practica una situación real a la vez",
      description:
        "Escucha, sigue los caracteres y el pinyin, y repite cada línea a tu ritmo.",
      station: "Estación {current} de {total}",
      available: "Lista para practicar",
      locked: "Empieza primero la lección relacionada",
      practiceNow: "Practicar ahora",
      goToLesson: "Empezar la lección",
      backToStations: "Volver a las estaciones",
      unlockRequirement: "Empieza «{lesson}» para abrir esta estación.",
      unavailableTitle: "Estamos preparando esta práctica",
      unavailableDescription:
        "El contenido de la lección para esta estación no está disponible ahora.",
      stations: {
        INTRODUCTIONS: {
          title: "Saluda y preséntate",
          description:
            "Practica saludos, nombres y una primera presentación sencilla.",
          outcome: "Saluda a alguien y di quién eres.",
        },
        NUMBERS_TIME: {
          title: "Números, hora y fecha",
          description:
            "Gana confianza diciendo números, una hora y una fecha breve.",
          outcome: "Di claramente un número, una hora y una fecha.",
        },
        PRICES: {
          title: "Pregunta el precio y paga",
          description:
            "Repite las frases necesarias para preguntar un precio y entender la respuesta.",
          outcome: "Pregunta cuánto cuesta algo y responde.",
        },
      },
    },
    picker: {
      title: "Shadowing",
      description: "Elige cómo quieres practicar el diálogo de esta lección.",
      conversation: "Conversación",
      conversationDescription:
        "Repite el diálogo real de la lección, un turno a la vez, como si fuera un chat.",
      longText: "Texto largo",
      longTextDescription:
        "Repite todo el diálogo como un pasaje continuo, siempre con el pinyin visible.",
      unavailableTitle: "Conversación no disponible",
      unavailableDescription:
        "Esta lección no tiene un diálogo disponible para practicar con shadowing.",
      player: {
        play: "Reproducir conversación",
        pause: "Pausar conversación",
        seek: "Desplazarse por el audio de la conversación",
        unavailable: "El audio de la conversación no está disponible",
      },
    },
    session: {
      activityTitles: {
        SHADOWING: "Shadowing",
        SCENARIO_ROLE_PLAY: "Juego de rol del escenario",
      },
      sayOutLoud: "Di lo siguiente en voz alta:",
      respondOutLoud: "Responde en voz alta en chino:",
      colorFeedback:
        "Los caracteres se pondrán verdes o rojos cuando termines de grabar.",
      listenNative: "Escuchar audio nativo",
    },
    recorder: {
      microphoneDenied: "Acceso al micrófono denegado",
      typeInsteadDescription: "Puedes escribir tu respuesta.",
      textPlaceholder: "Escribe lo que dirías en chino",
      yourAnswer: "Tu respuesta",
      submit: "Enviar",
      useMicrophone: "Usar el micrófono",
      stopRecording: "Detener grabación",
      startRecording: "Iniciar grabación",
      requestingAccess: "Solicitando acceso al micrófono...",
      recording: "Grabando — {time}",
      analyzingTones: "Analizando tus tonos…",
      insufficientAudio: "No hay suficiente voz para puntuar los tonos.",
      toneMatch: "Coincidencia de tonos: {score}%",
      retry: "Grabar de nuevo",
      typeInstead: "Escribir en su lugar",
    },
    feedback: {
      heard: "Lo que escuchamos",
      noSpeech: "(no se detectó voz)",
      toneMatch: "Coincidencia de tonos: {score}%",
      toneExplanation:
        "Se calcula directamente con la entonación de tu grabación; no se deduce del texto transcrito.",
      toneUnavailable:
        "No se pudo medir la coincidencia de tonos porque no hubo suficiente voz en la grabación.",
      dimensions: {
        pronunciation: "Pronunciación",
        fluency: "Fluidez",
        accuracy: "Precisión",
        complexity: "Complejidad",
        communicationEffectiveness: "Eficacia comunicativa",
      },
      feedback: "Feedback",
      recommendedNext: "Siguiente paso recomendado",
    },
    shadowing: {
      title: "Shadowing — Conversación",
      progress: "Progreso",
      listenLine: "Escuchar esta línea",
      nextLine: "Siguiente línea",
      completeOne: "Conversación completada: practicaste 1 línea.",
      completeMany: "Conversación completada: practicaste {count} líneas.",
    },
    freePractice: {
      title: "Practicar con Han",
      description:
        "Elige un tema y cómo quieres que Han dirija la actividad: una conversación oral en vivo, como en el paso de Speaking de la Ruta de aprendizaje.",
      topic: "Tema",
      topicPlaceholder: "Ej.: Hablar sobre mi viaje de fin de semana a Pekín",
      role: "¿Quién es Han?",
      roleLabel: "Rol de Han",
      roles: {
        AUTO: {
          label: "Adaptar el rol al tema (predeterminado)",
          display: "Han",
        },
        FRIEND: { label: "Un amigo", display: "Han, como amigo" },
        COLLEAGUE: { label: "Un colega", display: "Han, como colega" },
        STRANGER: { label: "Un desconocido", display: "Han, como desconocido" },
        INTERVIEWER: {
          label: "Un entrevistador laboral",
          display: "Han, como entrevistador laboral",
        },
      },
      level: "Nivel",
      useProfileLevel: "Usar el nivel de mi perfil",
      speed: "Velocidad",
      paces: { slow: "Lenta", normal: "Normal", fast: "Rápida" },
      correctionQuestion: "¿Cuándo debería corregirme Han?",
      corrections: {
        scene: {
          label: "Mantenerse en la escena",
          description:
            "Han permanece en su personaje y habla mandarín; el feedback llega al final (predeterminado).",
        },
        tutor: {
          label: "Corregirme durante la conversación",
          description:
            "Han explica brevemente los errores de pronunciación, tono o gramática en el momento.",
        },
      },
      extra: "¿Algo más? (opcional)",
      extraPlaceholder:
        "Ej.: Usa un tono más formal. Enfócate en vocabulario de restaurante. Corrige mis tonos al terminar.",
      extraLabel: "Instrucciones adicionales",
      start: "Iniciar conversación",
      useText: "Usar texto",
      microphoneUnavailable:
        "El micrófono no está disponible. Practica este tema por texto.",
      complete: "Conversación completada",
      gettingFeedback: "Preparando tu feedback…",
      tooShort:
        "La conversación fue demasiado corta para puntuarla. Inténtalo de nuevo y habla un poco más.",
      retryFeedback: "Volver a solicitar el feedback",
      transcriptTitle: "Conversación en vivo sobre: {topic}",
    },
    testHarness: {
      eyebrow: "Herramienta temporal de control local",
      title: "Modo de prueba de Speaking",
      description:
        "Prueba el paso de Speaking en tiempo real sin cambiar el progreso, las puntuaciones ni la Reflexión de la lección.",
      exit: "Salir del modo de prueba",
      lessonCount: "Lección {current} de {total}",
      previous: "Anterior",
      next: "Siguiente",
      objective: "Objetivo: {objective}",
      noMission: "No hay una misión de Speaking configurada.",
    },
    errors: {
      notAuthenticated: "Necesitas iniciar sesión para hacer esto.",
      feedbackRateLimit:
        "Has solicitado feedback muchas veces recientemente. Espera un momento.",
      feedbackFailed: "Ocurrió un problema al generar el feedback.",
      attemptRateLimit:
        "Has enviado muchos intentos en poco tiempo. Espera un momento antes de continuar.",
      emptyResponse: "Tu respuesta no puede estar vacía.",
      responseTooLong:
        "Tu respuesta es demasiado larga (máximo {max} caracteres).",
      recordingTooLarge: "La grabación es demasiado grande.",
      recordingTooLong: "La grabación es demasiado larga (máximo 5 minutos).",
      unsupportedRecording: "Ese formato de grabación no es compatible.",
      submitFailed:
        "Ocurrió un problema al enviar tu intento. Inténtalo de nuevo.",
      repeatSpeech:
        "No pude reconocerlo como español, inglés o mandarín. Inténtalo de nuevo.",
    },
  },
  writingLab: {
    common: {
      back: "Volver",
      submit: "Enviar",
      tryAgain: "Intentar de nuevo",
      done: "Finalizar",
      rewrite: "Volver a escribir",
    },
    home: {
      title: "Writing Lab",
      paragraphTitle: "Escribir un texto a mano",
      paragraphDescription:
        "Escribe chino a mano, sube de 1 a 3 fotos y recibe feedback adecuado para tu nivel.",
      translationTitle: "Reto de traducción",
      translationDescription:
        "Traduce al chino uno de los {count} textos breves disponibles.",
      translationDescriptionFallback:
        "Traduce al chino uno de los textos breves disponibles.",
      customTitle: "Escritura personalizada",
      customDescription: "Elige tu propio tema, nivel, formato y tono.",
      recentAttempts: "Intentos recientes",
      customAttemptTitle: "Escritura personalizada",
    },
    translation: {
      description:
        "Elige un texto, tradúcelo al chino y Han te mostrará qué tan precisa fue tu traducción y qué puedes mejorar.",
      emptyTitle: "Todavía no hay actividades",
      emptyDescription:
        "Los textos para traducir aparecerán aquí cuando haya contenido disponible.",
    },
    custom: {
      description:
        "Elige tu propio tema, nivel, formato y tono. Han evaluará tu texto exactamente según lo que pediste.",
      topic: "Tema",
      topicPlaceholder: "Ej.: Escribe sobre un viaje inolvidable que hiciste",
      level: "Nivel",
      useProfileLevel: "Usar el nivel de mi perfil",
      profileLevel: "Nivel de tu perfil",
      format: "Formato",
      formats: {
        short: "Mensaje breve",
        paragraph: "Párrafo",
        practical: "Texto práctico",
        essay: "Ensayo",
      },
      tone: "Tono",
      tones: { casual: "Informal", formal: "Formal" },
      extra: "¿Algo más? (opcional)",
      extraPlaceholder:
        "Ej.: Enfócate en vocabulario de restaurante. Usa al menos una expresión de tiempo.",
      extraLabel: "Instrucciones adicionales",
      start: "Empezar a escribir",
      writingPlaceholder: "Escribe tu respuesta en chino",
      writingLabel: "Tu texto",
    },
    editor: {
      placeholder: "Escribe tu respuesta en chino",
      label: "Tu texto",
      saving: "Guardando...",
      saveFailed: "No se pudo guardar. Comprueba tu conexión",
      unsaved: "Cambios sin guardar",
      saved: "Guardado",
      loadingDraft: "Cargando tu borrador.",
    },
    feedback: {
      yourResponse: "Tu respuesta",
      correctedVersion: "Versión corregida",
      dimensions: {
        grammar: "Gramática",
        vocabulary: "Vocabulario",
        naturalness: "Naturalidad",
        communicationClarity: "Claridad comunicativa",
      },
      importantChanges: "Cambios importantes",
      notes: "Observaciones",
    },
    handwritten: {
      description:
        "Escribe chino a mano en oraciones separadas o como un texto continuo y sube fotos claras para recibir feedback.",
      chooseLevel: "1. Elige tu nivel",
      chooseTopic: "2. Elige un tema",
      target: "Objetivo: {lineTarget} ({characterTarget}).",
      uploadTitle: "3. Sube tu texto escrito a mano",
      uploadDescription:
        "Sube de 1 a 3 fotos en el orden de las páginas. Usa una luz clara y uniforme, y mantén todo el texto enfocado.",
      retakeTitle: "Vuelve a tomar la foto",
      unreadableSuffix:
        "No se creó ninguna puntuación. Reemplaza la foto poco clara y vuelve a enviarla cuando esté lista.",
      photoAlt: "Página manuscrita {page}",
      page: "Página {page}",
      removePage: "Eliminar página {page}",
      preparingPhotos: "Preparando fotos…",
      addPhotos: "Añadir fotos",
      supportedPhotos: "JPG, PNG o WebP · hasta {max} páginas en total",
      evaluate: "Evaluar mi escritura a mano",
      evaluationNote:
        "Han primero comprueba la calidad de las fotos. La evaluación de pago solo se envía cuando presionas este botón y las llamadas fallidas nunca se reintentan automáticamente.",
      feedbackTitle: "Feedback de tu escritura a mano",
      tryAnotherTopic: "Probar otro tema",
      levels: {
        BASIC: {
          label: "Básico",
          lineTarget: "Aproximadamente 5–6 líneas escritas a mano",
          characterTarget: "Aproximadamente 60–90 caracteres chinos",
        },
        INTERMEDIATE: {
          label: "Intermedio",
          lineTarget: "Aproximadamente 6–20 líneas escritas a mano",
          characterTarget: "Aproximadamente 90–300 caracteres chinos",
        },
        ADVANCED: {
          label: "Avanzado",
          lineTarget: "20 o más líneas escritas a mano",
          characterTarget: "300 o más caracteres chinos",
        },
      },
      topics: {
        FAMILY: {
          label: "Familia",
          prompts: {
            BASIC:
              "Presenta a las personas de tu familia y escribe un dato sencillo sobre ellas.",
            INTERMEDIATE:
              "Describe a tu familia, sus relaciones o rutinas y una experiencia compartida.",
            ADVANCED:
              "Explica cómo han influido en ti las relaciones, responsabilidades o valores familiares.",
          },
        },
        ROUTINE: {
          label: "Rutina diaria",
          prompts: {
            BASIC:
              "Describe qué haces desde la mañana hasta la noche. Puedes incluir las horas.",
            INTERMEDIATE:
              "Describe tu rutina, explica por qué la organizas de esa manera y menciona un cambio.",
            ADVANCED:
              "Analiza cómo afecta tu rutina a tu productividad o bienestar y propone mejoras.",
          },
        },
        SHOPPING: {
          label: "Compras",
          prompts: {
            BASIC:
              "Describe algo que compras, dónde lo compras y detalles como la cantidad, el color o el precio.",
            INTERMEDIATE:
              "Describe una experiencia de compra, compara opciones y explica tu elección final.",
            ADVANCED:
              "Analiza una decisión de compra teniendo en cuenta el precio, la calidad, las necesidades y los hábitos de consumo.",
          },
        },
      },
      feedback: {
        overallScore: "Puntuación general",
        characterCount: "{count} caracteres chinos",
        targetRange: "Objetivo: {range}",
        charactersToImprove: "Caracteres por mejorar",
        cohesion: "Cohesión",
        specificFeedback: "Feedback específico",
        errorTypes: {
          character: "Formación de caracteres",
          grammar: "Gramática",
          vocabulary: "Vocabulario",
        },
        dimensionLabels: {
          legibility: "Legibilidad y formación de caracteres",
          topicFulfillment: "Desarrollo del tema y extensión objetivo",
          sentenceConstruction: "Construcción de oraciones",
          grammar: "Gramática",
          vocabulary: "Vocabulario",
          clarity: "Claridad del significado",
          cohesion: "Cohesión y transiciones",
          naturalness: "Naturalidad",
          contentDepth: "Profundidad y desarrollo",
          lexicalPrecision: "Precisión léxica y registro",
          organization: "Cohesión y organización",
          style: "Naturalidad y estilo",
        },
        correctedVersion: "Versión corregida",
        noteFromHan: "Una nota de Han",
        strokeOrderDisclaimer:
          "El orden de los trazos no puede comprobarse mediante una foto estática; esta puntuación evalúa únicamente el resultado final visible.",
      },
    },
    errors: {
      notAuthenticated: "Necesitas iniciar sesión para hacer esto.",
      attemptRateLimit:
        "Has enviado muchos intentos en poco tiempo. Espera un momento antes de continuar.",
      topicEmpty: "El tema no puede estar vacío.",
      responseEmpty: "Tu respuesta no puede estar vacía.",
      responseTooLong:
        "Tu respuesta es demasiado larga (máximo {max} caracteres).",
      submitFailed:
        "Ocurrió un problema al enviar tu texto. Inténtalo de nuevo.",
      browserPhotoFailed: "Este navegador no pudo preparar la foto.",
      photoFailed: "No se pudo preparar esta foto.",
      photoTooLarge:
        "{name} es demasiado grande. Elige una foto de menos de 15 MB.",
      photoTooSmall:
        "{name} es demasiado pequeña para leer claramente los caracteres chinos.",
      photoCompressionFailed:
        "{name} no pudo comprimirse lo suficiente. Prueba con un recorte más cercano.",
      tooManyPhotos: "Puedes subir hasta {max} fotos en un mismo envío.",
      photoFormats: "Usa fotos JPG, PNG o WebP.",
      photoPreparationFailed: "No se pudieron preparar las fotos.",
      photoEvaluationFailed: "No se pudieron evaluar las fotos.",
      photoSendFailed:
        "No se pudieron enviar las fotos. Comprueba tu conexión e inténtalo de nuevo cuando estés listo.",
      unauthorized: "Necesitas iniciar sesión para hacer esto.",
      invalidSubmission: "El envío de fotos no es válido.",
      invalidLevelTopic: "Elige un nivel y un tema válidos.",
      invalidPhotoCount: "Sube entre 1 y 3 fotos.",
      invalidPhoto:
        "Usa fotos claras en formato JPG, PNG o WebP de máximo 2 MB cada una.",
      invalidImage:
        "Uno de los archivos seleccionados no es una imagen válida.",
      handwrittenRateLimit:
        "Has enviado varias evaluaciones de fotos. Espera unos minutos antes de intentarlo de nuevo.",
      featureUnavailable: "Esta función no está disponible para tu cuenta.",
      dailyLimit:
        "Alcanzaste el límite de uso de hoy para esta función. Inténtalo de nuevo mañana.",
      evaluationNotConfigured:
        "La evaluación de escritura a mano no está configurada.",
      photosUnclear:
        "Las fotos no son lo suficientemente claras para evaluarlas. Vuelve a tomarlas.",
      evaluationIncomplete: "La evaluación quedó incompleta.",
      evaluationUnavailable: "Las fotos no se pueden evaluar en este momento.",
      evaluationGeneric:
        "Ocurrió un problema al evaluar tus fotos. Inténtalo de nuevo cuando estés listo.",
    },
  },
  tour: {
    common: {
      ariaLabel: "Recorrido guiado",
      progress: "{current} de {total}",
      start: "Enséñame",
      notNow: "Ahora no, gracias",
      next: "Siguiente",
      back: "Atrás",
      skip: "Omitir recorrido",
      finish: "Empezar a estudiar",
      showTheRest: "Enséñame el resto",
      laterFromSettings: "Puedes verlo luego desde Configuración",
      gotIt: "Entendido",
    },
    welcome: {
      eyebrow: "Tu profesor",
      title: "Hola, soy Han",
      body: "Aquí vas a aprender mandarín de verdad: desde tu primer 你好 hasta sostener una conversación. Déjame enseñarte la app en un minuto.",
    },
    nextStep: {
      eyebrow: "Tu próximo paso",
      body: "Esto es lo único que necesitas mirar para empezar. Yo elijo tu siguiente lección y la dejo aquí, lista.",
    },
    streak: {
      eyebrow: "Tu racha",
      body: "Estos son los días que has practicado esta semana. La racha cuenta los días seguidos: a mí me importa el hábito, no la nota.",
    },
    experience: {
      eyebrow: "Experiencia",
      body: "Sube cada vez que terminas una lección. Mide cuánto chino llevas de verdad, no cuánto rato pasaste aquí dentro.",
    },
    words: {
      eyebrow: "Palabras y consejo",
      body: "Cada día te dejo palabras nuevas de tu nivel, y justo debajo un consejo corto. Toca una palabra para ver su significado y ejemplos.",
    },
    bubble: {
      eyebrow: "Estoy en todas las pantallas",
      body: "¿Ves esa burbuja? Soy yo. Si algo no te cuadra — una palabra, una regla, por qué fallaste una respuesta — tócame y pregúntame. Escribe en tu idioma.",
    },
    navigation: {
      eyebrow: "Ya sabes lo básico",
      body: "Todo lo demás vive aquí abajo. ¿Te enseño el resto de la app? Es un minuto más, o lo dejamos para cuando tú quieras.",
    },
    sections: {
      journey: {
        eyebrow: "Tu ruta de aprendizaje",
        body: "Tiene tres capítulos: Fundamentos empieza desde cero, Vida cotidiana es comer fuera y viajar, y Situaciones avanzadas es trabajo y negociación. Presiona acá, en Aprender, y entra a Ruta de aprendizaje.",
      },
      writing: {
        eyebrow: "Writing Lab",
        body: "En el mismo menú tienes el Writing Lab: ahí traduces frases, escribes libre, o escribes un párrafo a mano y te lo corrijo. También está Speaking Lab, con tres estaciones guiadas para escuchar y repetir con caracteres y pinyin. Presiona acá otra vez y elige Writing Lab.",
      },
      han: {
        eyebrow: "Aquí vivo yo",
        body: "Hago tres cosas: como tutor te explico por escrito, como compañero hablo contigo solo en chino, y como buscador te doy el significado de cualquier palabra. Presiona acá para verlas.",
      },
      progress: {
        eyebrow: "Progreso",
        body: "Ahí ves en qué eres fuerte y en qué no: escuchar, hablar, leer y escribir. Y abajo, lo que conviene repasar antes de que se te olvide. Presiona acá.",
      },
      shop: {
        eyebrow: "HanCoins y la Tienda",
        body: "Los HanCoins se ganan estudiando: entrar cada día, terminar lecciones, completar situaciones. Se gastan en ropa para tu personaje, y nunca se compran con dinero real. Presiona acá para ver la Tienda.",
      },
      settings: {
        eyebrow: "Y eso es todo",
        body: "En Configuración, desde tu menú de usuario en Inicio, cambias el idioma, el tema, tus preferencias y mi voz. También puedes volver a ver esta introducción desde ahí. Ahora sí: a estudiar.",
      },
    },
    hints: {
      journey:
        "Tu ruta tiene tres capítulos. Dentro de cada uno hay situaciones, y dentro de cada situación, cuatro lecciones.",
      scenario:
        "Arriba tienes lo que sabrás hacer al terminar. Abajo, sus cuatro lecciones en orden, y al final la misión: una conversación de verdad donde lo usas todo junto.",
      lesson:
        "Cada lección son seis pasos. La barra de arriba te dice en cuál vas y te deja volver a cualquiera que ya hayas abierto.",
      han: "El tutor te explica por escrito, el compañero habla contigo en chino, y el buscador te da el significado de cualquier palabra.",
      writingLab:
        "Escritura fuera de la ruta: traducción, texto libre, o un párrafo escrito a mano.",
      speakingLab:
        "Aquí practicas con tres estaciones guiadas. Empieza la lección relacionada y después escucha, sigue los caracteres y el pinyin, y repite cada línea a tu ritmo.",
      progress:
        "Aquí ves en qué eres fuerte y en qué no. Y abajo, lo que conviene repasar.",
      shop: "Los HanCoins se ganan estudiando y se gastan aquí. Nunca se compran con dinero real.",
      settings:
        "Desde aquí cambias idioma, tema, preferencias y mi voz, y puedes volver a ver la introducción.",
    },
    settings: {
      title: "Recorrido guiado",
      description:
        "El recorrido de Han por la app, y las notas cortas que explican cada sección la primera vez que entras.",
      replay: "Ver la introducción otra vez",
      replayHint: "Volverás a Inicio y el recorrido comenzará de inmediato.",
      restoreHints: "Recuperar las notas de sección",
      restoreHintsHint: "Cada una vuelve a aparecer la próxima vez que entres.",
      done: "Hecho",
    },
  },
  hanVocabulary: {
    backToHan: "Volver a Han",
    benefits: [
      "Escribe una palabra en caracteres o pinyin",
      "Recibe una explicación adaptada automáticamente a tu nivel real",
      "Descubre ejemplos, palabras relacionadas, errores frecuentes y más",
      "Una búsqueda, una respuesta, sin elegir manualmente la dificultad",
    ],
    lookup: {
      placeholder: "Escribe una palabra: 要 o yao, en caracteres o pinyin",
      inputLabel: "Palabra o pinyin que quieres buscar",
      loading: "Buscando...",
      explain: "Explicar",
      hint: "Se adapta automáticamente a tu nivel real; no necesitas elegir uno.",
    },
    card: {
      frequency: {
        veryCommon: "⭐ Palabra muy frecuente",
        common: "⭐ Palabra frecuente",
        lessCommon: "Palabra menos frecuente",
      },
      explanation: "💡 Explicación",
      examples: "📋 Ejemplos",
      related: "🔗 Palabras relacionadas",
      mistakes: "⚠️ Errores frecuentes",
      chineseGloss: "汉 Definición solo en chino",
      curiosity: "🔍 Curiosidad",
    },
    errors: {
      notAuthenticated: "Necesitas iniciar sesión para hacer esto.",
      notFound:
        "Han no pudo encontrar esa palabra. Escríbela de otra manera o comprueba la ortografía.",
      empty: "Escribe una palabra o su pinyin.",
      tooLong:
        "El texto es demasiado largo (máximo {max} caracteres). Prueba con una sola palabra o una frase corta.",
      rateLimit:
        "Has buscado muchas palabras en poco tiempo. Espera un momento antes de continuar.",
      featureUnavailable: "Esta función no está disponible para tu cuenta.",
      dailyLimit:
        "Alcanzaste el límite de uso de hoy para esta función. Inténtalo de nuevo mañana.",
      lookupFailed:
        "Ocurrió un problema durante la búsqueda. Inténtalo de nuevo.",
    },
  },
  progress: {
    title: "Progreso",
    emptyDescription:
      "Completa tu primera lección para empezar a construir tu perfil de competencias.",
    startingLevel: "Nivel inicial seleccionado: {level}",
    generalLevel: "Experiencia",
    generalLevelDescription:
      "Se obtiene al completar escenarios y practicar en los Labs; no se basa en una autoevaluación. Este es el progreso al que Han realmente se adapta. El máximo es {max}, no 2000, hasta que se lance Reading Lab.",
    weightedAverage: "Promedio ponderado de la Ruta de aprendizaje",
    recommendedNext: "Siguiente paso recomendado",
    continueLearning: "Continuar aprendiendo",
    competencies: "Competencias",
    vocabularyGrammar: "Vocabulario y gramática",
    vocabularyEncountered: "Elementos de vocabulario encontrados",
    grammarEncountered: "Puntos gramaticales encontrados",
    scenarioMastery: "Dominio de escenarios",
    mastered: "Dominado",
    complete: "{percent}% completado",
    review: "Repaso",
  },
  achievements: {
    title: "Logros",
    unlocked: "{unlocked} de {total} desbloqueados",
    categories: {
      STREAK: "Rachas",
      LEVEL: "Nivel general",
      MASTERY: "Dominio",
      PROGRESS: "Progreso",
      COMMUNITY: "Comunidad",
    },
    items: {
      streak_3: {
        title: "Racha de 3 días",
        description: "Estudiaste 3 días seguidos.",
      },
      streak_7: {
        title: "Semana perfecta",
        description: "Estudiaste 7 días seguidos.",
      },
      streak_30: {
        title: "Racha de 30 días",
        description: "Estudiaste 30 días seguidos.",
      },
      streak_60: {
        title: "Racha de 60 días",
        description: "Estudiaste 60 días seguidos.",
      },
      streak_100: {
        title: "Racha de 100 días",
        description: "Estudiaste 100 días seguidos.",
      },
      level_tier_1: {
        title: "Defendiéndote",
        description: "Alcanzaste el nivel general «Defendiéndote».",
      },
      level_tier_2: {
        title: "Encontrando tu ritmo",
        description: "Alcanzaste el nivel general «Encontrando tu ritmo».",
      },
      level_tier_3: {
        title: "Hablando con soltura",
        description: "Alcanzaste el nivel general «Hablando con soltura».",
      },
      level_tier_4: {
        title: "Fácil de entender",
        description: "Alcanzaste el nivel general «Fácil de entender».",
      },
      level_tier_5: {
        title: "Resolviendo situaciones reales",
        description:
          "Alcanzaste el nivel general «Resolviendo situaciones reales».",
      },
      level_tier_6: {
        title: "Hablando como profesional",
        description: "Alcanzaste el nivel general «Hablando como profesional».",
      },
      level_tier_7: {
        title: "Cerca del dominio",
        description: "Alcanzaste el nivel general «Cerca del dominio».",
      },
      level_tier_8: {
        title: "Fluidez refinada",
        description: "Alcanzaste el nivel general «Fluidez refinada».",
      },
      level_tier_9: {
        title: "Dominando el idioma",
        description: "Alcanzaste el nivel general «Dominando el idioma».",
      },
      reflection_perfect: {
        title: "Puntuación perfecta",
        description: "Obtuviste 100 en la Reflexión de una lección.",
      },
      reflection_three_star_5: {
        title: "Estrella en ascenso",
        description: "Obtuviste 90 o más en 5 lecciones.",
      },
      reflection_three_star_25: {
        title: "Desempeño estelar",
        description: "Obtuviste 90 o más en 25 lecciones.",
      },
      lessons_10: {
        title: "10 lecciones",
        description: "Completaste 10 lecciones.",
      },
      lessons_50: {
        title: "50 lecciones",
        description: "Completaste 50 lecciones.",
      },
      scenario_first: {
        title: "Primer escenario",
        description: "Completaste tu primer escenario.",
      },
      chapter_completed_beginner: {
        title: "Fundamentos completados",
        description:
          "Completaste todos los escenarios de Fundamentos con una puntuación media de Reflexión superior a 70.",
      },
      chapter_completed_intermediate: {
        title: "Vida cotidiana completada",
        description:
          "Completaste todos los escenarios de Vida cotidiana con una puntuación media de Reflexión superior a 70.",
      },
      chapter_completed_advanced: {
        title: "Situaciones avanzadas completadas",
        description:
          "Completaste todos los escenarios de Situaciones avanzadas con una puntuación media de Reflexión superior a 70.",
      },
      curriculum_graduate: {
        title: "Graduado",
        description:
          "Completaste Fundamentos, Vida cotidiana y Situaciones avanzadas.",
      },
      speaking_lab_first: {
        title: "Primeras palabras",
        description: "Completaste tu primera sesión de Speaking Lab.",
      },
      writing_lab_first: {
        title: "Primer borrador",
        description: "Completaste tu primer envío en Writing Lab.",
      },
      leaderboard_top10: {
        title: "Top 10",
        description: "Llegaste al top 10 del leaderboard.",
      },
      leaderboard_rank1: {
        title: "Número 1 del leaderboard",
        description: "Llegaste al número 1 del leaderboard.",
      },
    },
  },
  leaderboard: {
    title: "Leaderboard",
    description:
      "La clasificación usa los puntos del Nivel general. Todas las personas con un Nombre de cuenta participan automáticamente.",
    weeklyBonus: "Premio semanal en {time}",
    weeklyBonusNow: "cualquier momento",
    weeklyPrize: "Los 3 primeros ganan 50 / 30 / 10 HanCoins esta semana",
    yourRank: "Tu posición",
    rankOf: "de {total}",
    points: "pts",
    joinPrompt:
      "Completa una lección para ganar puntos de Nivel general y entrar al leaderboard.",
    empty: "Nadie ha ganado puntos todavía. Sé la primera persona.",
    you: "tú",
    spotsAwayOne: "Sigue adelante: estás a 1 puesto del top {top}.",
    spotsAwayMany: "Sigue adelante: estás a {count} puestos del top {top}.",
    keepLearning: "Sigue aprendiendo para subir de posición →",
  },
  shop: {
    title: "Tu personaje",
    description:
      "Personaliza tu personaje con los HanCoins que ganas mediante progreso real.",
    tabs: { ANIMAL: "Animal", HEAD: "Cabeza", FACE: "Rostro", TORSO: "Torso" },
    noAvatar: "Aún no tienes personaje",
    wearing: "Lleva: {items}",
    nothingEquipped: "Todavía no lleva accesorios",
    comingSoon: "Próximamente",
    rarity: { COMMON: "Común", SPECIAL: "Especial", LIMITED: "Limitado" },
    equipped: "Equipado",
    equip: "Equipar",
    previewing: "Vista previa",
    animalNames: {
      RABBIT: "Conejo",
      MONKEY: "Mono",
      DOG: "Perro",
      TIGER: "Tigre",
      OX: "Buey",
      RAT: "Rata",
      DRAGON: "Dragón",
      SNAKE: "Serpiente",
      HORSE: "Caballo",
      GOAT: "Cabra",
      ROOSTER: "Gallo",
      PIG: "Cerdo",
    },
    accessoryNames: {
      cap: "Gorra casual",
      "bamboo-hat": "Sombrero de bambú",
      "red-beanie": "Gorro rojo HanGo",
      "traditional-hairstyle": "Peinado tradicional",
      "round-glasses": "Gafas redondas",
      "gold-sunglasses": "Gafas de sol doradas",
      "square-glasses": "Gafas cuadradas",
      "festival-red-glasses": "Gafas rojas festivas",
      polo: "Polo HanGo",
      "tang-jacket": "Chaqueta Tang",
      "varsity-jacket": "Chaqueta universitaria HanGo",
      "modern-hanfu": "Hanfu moderno",
    },
    actions: {
      signInRequired: "Necesitas iniciar sesión para hacer esto.",
      insufficientCoins: "Todavía no tienes suficientes HanCoins.",
      alreadyOwned: "Ya tienes este accesorio.",
      accessoryNotFound: "Ese accesorio no existe.",
      purchaseFailed: "No se pudo completar la compra. Inténtalo de nuevo.",
      notOwned: "Todavía no tienes este accesorio.",
      equipFailed: "No se pudo equipar. Inténtalo de nuevo.",
    },
  },
  settings: {
    title: "Configuración",
    sections: {
      profile: "Perfil",
      avatar: "Personaje",
      learning: "Aprendizaje",
      han: "Han",
      appearance: "Apariencia",
      privacy: "Privacidad",
      account: "Cuenta",
    },
    displayName: {
      label: "Nombre",
      placeholder: "Como te llamará Han",
      save: "Guardar",
    },
    accountName: {
      label: "Nombre de cuenta",
      permanent:
        "Se muestra en el leaderboard. Es permanente y no se puede cambiar.",
      placeholder: "Un nombre único para el leaderboard",
      hint: "Usa solo letras, números y guiones bajos. Solo puedes elegirlo una vez.",
      set: "Establecer nombre de cuenta",
    },
    avatar: {
      none: "Todavía no has elegido un personaje",
      manage: "Administrar →",
    },
    learning: {
      saved: "Cambios guardados.",
      interfaceLanguage: "Idioma de la interfaz",
      explanationLanguage: "Idioma de respaldo para las explicaciones de Han",
      learningGoals: "Objetivos de aprendizaje",
      skillPriorities: "Habilidades prioritarias",
      dailyTarget: "Meta diaria de estudio",
      minutes: "{minutes} minutos",
      correctionStyle: "Estilo de corrección",
      save: "Guardar",
      languages: {
        english: "Inglés",
        spanish: "Español",
        chinese: "中文 (Chino)",
      },
      goals: {
        speakConfidently: "Hablar con confianza",
        hskPreparation: "Prepararme para el HSK",
        travel: "Viajar",
        work: "Trabajar",
        study: "Estudiar",
        personalInterest: "Interés personal",
      },
      skills: {
        listening: "Comprensión auditiva",
        speaking: "Expresión oral",
        reading: "Lectura",
        writing: "Escritura",
        grammar: "Gramática",
        vocabulary: "Vocabulario",
      },
      corrections: {
        immediate: "Corrígeme de inmediato",
        afterConversation: "Corrígeme al terminar la conversación",
        onlyImportant: "Corrige solo los errores importantes",
      },
    },
    han: {
      saved: "Cambios guardados.",
      saveError: "No pudimos guardar la configuración. Inténtalo de nuevo.",
      previewError: "La prueba de voz no está disponible temporalmente.",
      replies: "Respuestas de Han",
      textOnly: "Solo texto",
      textAndAudio: "Texto y audio",
      audioOnly: "Solo audio",
      replyDescription:
        "Han siempre prepara la respuesta por escrito. Texto y audio la muestra y la reproduce automáticamente; Solo audio la reproduce y oculta el texto.",
      voice: "Voz de Han",
      voiceName: "Cedar",
      voiceDisclosure:
        "Esta voz es generada por IA. OpenAI la optimiza principalmente para inglés.",
      preview: "Probar voz",
      save: "Guardar configuración de audio",
      memoryLabel: "Recordar conversaciones con el AI Teacher",
      memoryDescription:
        "Si lo desactivas, el AI Teacher seguirá respondiendo, pero no se guardará nada entre mensajes o sesiones.",
    },
    appearance: {
      theme: "Tema",
      description:
        "Elige el modo claro, oscuro o el de tu sistema. Es el mismo control disponible en la barra superior.",
    },
    privacy: {
      recordingRetention: "Conservación de grabaciones de Speaking Lab",
      ariaLabel: "Conservación de grabaciones",
      forever: "Conservar indefinidamente",
      never: "No conservar las grabaciones",
      days7: "7 días",
      days30: "30 días",
      days90: "90 días",
      year: "1 año",
      note: "Esto se aplica solo al audio de Speaking Lab. Las transcripciones y el feedback siguen disponibles después de eliminar una grabación.",
    },
    deleteAccount: {
      open: "Eliminar cuenta",
      title: "¿Eliminar tu cuenta?",
      description:
        "Esto elimina permanentemente tu cuenta y todos tus datos de aprendizaje: progreso, historial de lecciones, intentos de expresión oral y escritura, y conversaciones con IA. No se puede deshacer.",
      instruction: "Escribe {confirmation} para confirmar.",
      confirmation: "ELIMINAR",
      ariaLabel: "Texto de confirmación",
      action: "Eliminar cuenta permanentemente",
    },
    actions: {
      enterName: "Escribe tu nombre",
      nameTooLong: "Usa menos de 60 caracteres",
      accountNameTooShort: "Usa al menos 3 caracteres",
      accountNameTooLong: "Usa menos de 24 caracteres",
      accountNameCharacters: "Usa solo letras, números y guiones bajos",
      accountNamePermanent:
        "Tu nombre de cuenta ya está establecido y no se puede cambiar.",
      accountNameTaken: "Ese nombre de cuenta ya está en uso. Prueba con otro.",
      selectGoal: "Selecciona al menos un objetivo",
      selectSkill: "Selecciona al menos una habilidad",
    },
  },
  auth: {
    layout: {
      brandHome: "Inicio de HanGo",
      titleBefore: "Aprende",
      titleAccent: "chino",
      titleAfter: "a tu manera",
      description:
        "Lecciones reales, conversaciones con IA y misiones prácticas — a tu ritmo y en tu idioma.",
    },
    login: {
      title: "Iniciar sesión",
      subtitle: "Te damos la bienvenida de nuevo a HanGo.",
      email: "Correo electrónico",
      password: "Contraseña",
      forgotPassword: "¿Olvidaste tu contraseña?",
      submit: "Iniciar sesión",
      noAccount: "¿Todavía no tienes una cuenta?",
      register: "Regístrate",
      verified: "Correo verificado. Ya puedes iniciar sesión.",
      verificationError:
        "El enlace de verificación no es válido o ha vencido. Regístrate nuevamente.",
    },
    register: {
      title: "Crea tu cuenta",
      subtitle: "Aprende chino a través de comunicación real.",
      name: "Nombre",
      email: "Correo electrónico",
      password: "Contraseña",
      passwordHint: "Mínimo 8 caracteres",
      terms: "Acepto los Términos de servicio y la Política de privacidad",
      submit: "Crear cuenta",
      existingAccount: "¿Ya tienes una cuenta?",
      login: "Iniciar sesión",
      successTitle: "Revisa tu correo",
      backToLogin: "Volver a iniciar sesión",
    },
    forgotPassword: {
      title: "Restablece tu contraseña",
      description:
        "Escribe tu correo y te enviaremos un enlace para restablecer la contraseña.",
      email: "Correo electrónico",
      submit: "Enviar enlace",
      successTitle: "Revisa tu correo",
      backToLogin: "Volver a iniciar sesión",
    },
    resetPassword: {
      title: "Elige una nueva contraseña",
      password: "Nueva contraseña",
      passwordHint: "Mínimo 8 caracteres",
      submit: "Actualizar contraseña",
      successTitle: "Contraseña actualizada",
      goToLogin: "Ir a iniciar sesión",
      invalidTitle: "Enlace no válido",
      invalidDescription:
        "A este enlace le falta información necesaria. Solicita uno nuevo.",
      requestNew: "Solicitar un enlace nuevo",
      backToLogin: "Volver a iniciar sesión",
    },
    google: {
      continue: "Continuar con Google",
      unavailable: "Continuar con Google (no configurado)",
    },
    actions: {
      invalidCredentials: "El correo o la contraseña no son válidos.",
      accountExists:
        "Ya existe una cuenta con este correo. Intenta iniciar sesión.",
      accountCreated:
        "Cuenta creada. Revisa tu correo y verifica la cuenta antes de iniciar sesión.",
      accountCreatedDevelopment:
        "Cuenta creada. El envío de correos está desactivado en este entorno de desarrollo, así que ya puedes iniciar sesión.",
      emailUnavailable:
        "No pudimos enviar el correo de verificación en este momento. Inténtalo más tarde.",
      tooManyAttempts:
        "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
      invalidEmail: "Escribe una dirección de correo válida",
      resetSent:
        "Si existe una cuenta con ese correo, enviamos un enlace para restablecer la contraseña.",
      invalidPassword: "La contraseña no es válida",
      invalidReset:
        "Este enlace no es válido o ha vencido. Solicita uno nuevo.",
      passwordUpdated:
        "Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.",
      nameRequired: "El nombre es obligatorio",
      passwordLength: "La contraseña debe tener al menos 8 caracteres",
      oauthNotLinked:
        "El correo de esa cuenta de Google no coincide con una cuenta verificada de HanGo. Intenta iniciar sesión con tu contraseña.",
      oauthCancelled: "Se canceló el inicio de sesión con Google.",
      oauthUnavailable:
        "El inicio de sesión con Google no está disponible ahora. Usa tu correo y contraseña.",
      oauthGeneric:
        "No pudimos completar el inicio de sesión con Google. Inténtalo de nuevo.",
    },
  },
  marketing: {
    skipToContent: "Ir al contenido principal",
    brandHome: "HanGo, inicio",
    navLabel: "Navegación principal",
    navHow: "Cómo funciona",
    navExperience: "Experiencia",
    navHan: "Conoce a Han",
    login: "Iniciar sesión",
    createAccount: "Crear cuenta",
    hero: {
      eyebrow: "Mandarín desde cero hasta nivel avanzado",
      titleBefore: "Empieza desde cero. Lleva tu chino",
      titleAccent: "hasta donde quieras.",
      description:
        "Aprende mandarín paso a paso, úsalo en situaciones reales y perfecciona tu expresión oral, escritura y vocabulario con la guía de un AI Teacher que se adapta a tu nivel.",
      primaryCta: "Crear mi cuenta",
      secondaryCta: "Ver cómo funciona",
      benefits: [
        "Empieza sin conocimientos previos",
        "Apoyo con pinyin",
        "Avanza hasta perfeccionar tu chino",
      ],
    },
    startingPoints: {
      eyebrow: "Un camino para cada punto de partida",
      title: "Cada nivel tiene un reto distinto. HanGo te muestra qué sigue.",
      items: [
        "Si empiezas desde cero, construyes bases claras sin sentirte perdido.",
        "Si ya estudiaste, conviertes vocabulario y gramática en respuestas reales.",
        "Si ya te comunicas, trabajas precisión, naturalidad y confianza.",
        "En cualquier nivel, siempre sabes qué practicar a continuación.",
      ],
    },
    motivation: {
      eyebrow: "Una experiencia que también es tuya",
      title: "Aprende, personaliza y comparte el progreso.",
      description:
        "La motivación acompaña al aprendizaje: tu personaje crece contigo, Han Vocabulary te ayuda a explorar palabras y el leaderboard hace visible tu constancia.",
      avatarTitle: "Crea tu personaje",
      avatarDescription:
        "Elige tu animal, gana HanCoins con progreso real y personalízalo con accesorios que reflejen tu estilo.",
      vocabularyMeaning: "perseverar · mantenerse constante",
      vocabularyTitle: "Aprende vocabulario con contexto",
      vocabularyDescription:
        "Busca una palabra en caracteres o pinyin y recibe una explicación adaptada a tu nivel, con ejemplos y errores frecuentes.",
      leaderboardLabel: "Clasificación semanal",
      leaderboardTitle: "Compite en el leaderboard",
      leaderboardDescription:
        "Suma puntos mientras aprendes, descubre tu posición semanal y reta a la comunidad con progreso auténtico.",
    },
    howItWorks: {
      eyebrow: "Cómo funciona",
      title: "Una ruta que termina en comunicación.",
      description:
        "Cada parte del sistema tiene una función distinta. Juntas convierten lo que entiendes en algo que puedes decir, escribir y resolver.",
      steps: [
        {
          number: "01",
          title: "Entra en una situación real",
          description:
            "Empieza con un objetivo concreto: pedir comida, resolver un cambio o explicar una necesidad.",
        },
        {
          number: "02",
          title: "Aprende dentro del contexto",
          description:
            "Comprende el vocabulario y la gramática justo donde los vas a necesitar.",
        },
        {
          number: "03",
          title: "Practica de forma activa",
          description:
            "Lleva lo aprendido a espacios dedicados de speaking y writing, con apoyo cuando lo necesites.",
        },
        {
          number: "04",
          title: "Demuestra lo que puedes hacer",
          description:
            "Completa una misión y descubre qué dominaste y qué conviene practicar después.",
        },
      ],
    },
    experience: {
      eyebrow: "Un sistema, funciones claras",
      title: "Todo conectado. Nada confundido.",
      description:
        "La ruta organiza tu aprendizaje. Han te orienta. Los laboratorios entrenan habilidades específicas. Las misiones comprueban si puedes aplicar lo aprendido.",
      areas: [
        {
          title: "Learning Journey",
          description:
            "Una ruta clara desde los fundamentos hasta escenarios y lecciones cada vez más exigentes.",
        },
        {
          title: "AI Teacher",
          description:
            "Pregunta a Han dentro del contexto de tu nivel, tu lección y los errores que estás trabajando.",
        },
        {
          title: "Speaking Lab",
          description:
            "Entrena producción oral en un espacio dedicado, con actividades y feedback enfocados.",
        },
        {
          title: "Writing Lab",
          description:
            "Escribe respuestas propias y entiende cómo hacerlas más correctas y naturales.",
        },
        {
          title: "Missions",
          description:
            "Usa el chino para resolver tareas comunicativas que se parecen a lo que ocurre fuera de una clase.",
        },
        {
          title: "Competency Progress",
          description:
            "Observa lo que ya puedes hacer y recibe una siguiente acción útil, no solo puntos acumulados.",
        },
      ],
    },
    restaurant: {
      eyebrow: "Una situación, capacidades reales",
      title: "No aprendes “restaurante”. Aprendes a desenvolverte en uno.",
      description:
        "Una situación conecta lenguaje, decisiones y práctica hasta que puedas alcanzar un resultado concreto.",
      moments: [
        "Entrar y pedir una mesa",
        "Preguntar por ingredientes",
        "Explicar una restricción",
        "Resolver un error en el pedido",
        "Pedir la cuenta y pagar",
      ],
      missionLabel: "Misión final",
      missionTitle: "Corrige tu pedido",
      missionDescription:
        "El plato llegó con un ingrediente que no puedes comer. Explica el problema con claridad y solicita una solución.",
      objectiveLabel: "Objetivo comunicativo",
      objective: "Explicar una restricción y negociar un cambio.",
      supportLabel: "Apoyo disponible",
      support: "Pinyin, traducción, pistas y audio más lento.",
    },
    han: {
      eyebrow: "Conoce a Han",
      title: "Un AI Teacher que conoce el contexto.",
      description:
        "Han puede explicarte una expresión, ayudarte a descubrir por qué algo suena poco natural y proponerte práctica relacionada con lo que estás aprendiendo.",
      benefits: [
        "Explicaciones en español o inglés",
        "Apoyo conectado con tu lección",
        "Correcciones claras y respetuosas",
        "Recomendaciones con una razón",
      ],
    },
    why: {
      eyebrow: "Por qué HanGo",
      title: "Diseñado para avanzar, no para distraerte.",
      differences: [
        {
          title: "Más que contenido",
          description:
            "Las explicaciones forman parte de una ruta que termina en uso real, no en otra lista para memorizar.",
        },
        {
          title: "Más que un chatbot",
          description:
            "Han no conversa en el vacío: puede ayudarte desde el contexto pedagógico de lo que estás estudiando.",
        },
        {
          title: "Más que completar lecciones",
          description:
            "El progreso representa capacidades comunicativas: hablar, escribir y resolver situaciones.",
        },
      ],
      advancedQuestion: "¿Sirve si ya tengo un buen nivel?",
      advancedAnswer:
        "Sí. La ruta y Han se adaptan para que puedas trabajar precisión, naturalidad y capacidades más avanzadas, sin volver a contenidos que ya dominas.",
      advancedCta: "Empezar ahora",
    },
    finalCta: {
      eyebrow: "De cero a la comunicación",
      title: "Empieza en tu nivel. Avanza con propósito.",
      description:
        "Desde tus primeras palabras hasta conversaciones y textos más naturales, siempre tendrás un siguiente paso claro.",
      action: "Crear mi cuenta",
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Antes de que te registres",
      items: [
        {
          question: "¿Es gratis?",
          answer:
            "Sí, puedes empezar a aprender con Han sin pagar nada. Más adelante habrá una opción para mejorar tu experiencia, pero no la necesitas para arrancar.",
        },
        {
          question: "¿Necesito saber chino para empezar?",
          answer:
            "No. Puedes crear tu cuenta sin haber estudiado mandarín antes — HanGo ubica tu nivel real y arranca desde ahí.",
        },
        {
          question: "¿Han es una IA?",
          answer:
            "Sí. Han es un tutor con inteligencia artificial, no una persona real — pero te escucha, te explica y se adapta a ti como lo haría un buen profesor.",
        },
        {
          question: "¿Qué pasa con el audio de mi voz?",
          answer:
            "Se usa únicamente para que Han te entienda y te responda en el momento — no es para otra cosa.",
        },
        {
          question: "¿Funciona en el teléfono?",
          answer:
            "Sí, funciona directamente en el navegador de tu teléfono, sin necesidad de instalar nada.",
        },
      ],
    },
    footer: {
      tagline: "Aprende chino a través de situaciones reales.",
      navLabel: "Enlaces de cuenta",
      login: "Iniciar sesión",
      createAccount: "Crear cuenta",
    },
    demo: {
      situationLabel: "Situación real",
      restaurant: "En un restaurante",
      level: "A tu nivel",
      tablistLabel: "Demostración de una lección de HanGo",
      tabs: ["Contexto", "Práctica", "Misión"],
      waiter: "Mesero",
      you: "Tú",
      greetingTranslation: "Hola, ¿qué desea comer?",
      orderTranslation: "Quiero esto. ¿Podría ponerle menos picante?",
      contextNote: "Así descubres las frases que vas a necesitar.",
      practiceLabel: "PRÁCTICA CONTEXTUAL",
      practiceQuestion:
        "¿Cómo le pedirías al mesero que le pongan menos picante?",
      correctFeedback:
        "¡Correcto! “少放辣” significa “poner menos picante” — la forma más natural de pedirlo.",
      incorrectFeedback:
        "Casi — con el mesero, “可以少放辣吗？” se entiende mejor y suena más natural.",
      missionLabel: "MISIÓN",
      missionDescription:
        "Tu plato llegó demasiado picante. Explícale el problema al mesero y pide un cambio.",
      evaluationLabel: "HanGo evaluaría",
      evaluationItems: [
        "Cumplir el objetivo",
        "Uso del vocabulario",
        "Qué tan natural suena",
      ],
      missionCta: "Practicar esta misión en HanGo",
      nextStepLabel: "Próximo paso claro",
      nextStep: "Resolver un cambio en el pedido",
    },
  },
} satisfies AppMessages;
