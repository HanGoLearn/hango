import type { JourneySessionAudioResult } from "@/lib/journey-session-audio-review";
import {
  Body,
  Caption,
  CardTitle,
  ChineseText,
} from "@/components/ui/typography";

/** Saved observations only. No microphone, replay, provider or reward action. */
export function JourneyAudioReviewPanel({
  result,
  locale,
}: {
  result?: JourneySessionAudioResult;
  locale: "es" | "en";
}) {
  const t = (es: string, en: string) => (locale === "es" ? es : en);
  const judgment = result?.judgment;
  const reasons = {
    COMPLETED: t("Revisión recibida", "Review received"),
    NO_AUDIO_ITEMS: t(
      "No hubo intervenciones de audio identificables para revisar.",
      "No identifiable audio turns were available to review.",
    ),
    CONNECTION_CLOSED: t(
      "La conexión terminó antes de revisar el audio. Tu conversación escrita se conserva.",
      "The connection ended before the audio review. Your written conversation is retained.",
    ),
    PENDING_TURN: t(
      "La última intervención no terminó de llegar. No se ha supuesto que tu pronunciación fuera correcta o incorrecta.",
      "The last turn did not finish arriving. No correct or incorrect pronunciation was assumed.",
    ),
    PROVIDER_FAILED: t(
      "La revisión de audio no se completó. No se ha enviado otro intento automáticamente.",
      "The audio review did not complete. No automatic additional attempt was sent.",
    ),
    INVALID_REVIEW: t(
      "La revisión no pudo vincularse de forma coherente a tus intervenciones. No se muestran correcciones de esa respuesta.",
      "The review could not be consistently linked to your turns. Corrections from that response are not shown.",
    ),
    TIMEOUT: t(
      "La revisión de audio superó el tiempo de espera. No se ha repetido automáticamente.",
      "The audio review timed out. It was not repeated automatically.",
    ),
    ABANDONED: t(
      "La sesión se cerró antes de completar la revisión de audio.",
      "The session was closed before the audio review completed.",
    ),
  };
  return (
    <section
      className="min-w-0 space-y-4 rounded-panel border border-border bg-surface p-5 sm:p-6"
      aria-label={t(
        "Tu pronunciación, tonos y ritmo",
        "Your pronunciation, tones and rhythm",
      )}
    >
      <CardTitle>
        {t(
          "Tu pronunciación, tonos y ritmo",
          "Your pronunciation, tones and rhythm",
        )}
      </CardTitle>
      <Body>
        {judgment
          ? t(
              "Revisión experimental del audio de esta sesión. Sus niveles son provisionales; no están calibrados con docentes ni modifican la nota lingüística, los puntos o HanCoins.",
              "Experimental review of this session's audio. Levels are provisional, not teacher-calibrated, and do not change your language score, points or HanCoins.",
            )
          : result
            ? reasons[result.reason]
            : t(
                "Este intento no tiene una revisión de audio guardada. No es una nota cero ni una pronunciación perfecta.",
                "This attempt has no saved audio review. That means neither a zero score nor perfect pronunciation.",
              )}
      </Body>
      {judgment && (
        <Caption className="block">
          {t(
            "Intervenciones que la IA declara haber escuchado",
            "Turns the AI reports hearing",
          )}
          : {judgment.reviewedItemIds.length}/{result!.totalLearnerTurns}.{" "}
          {t(
            "La vinculación se comprueba; la apreciación acústica aún no tiene validación independiente.",
            "References are checked; the acoustic judgment has not been independently validated.",
          )}
        </Caption>
      )}
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        {(["tones", "articulation", "rhythm"] as const).map((key) => {
          const dimension = judgment?.dimensions[key];
          const label =
            key === "tones"
              ? t("Tonos", "Tones")
              : key === "articulation"
                ? t("Articulación", "Articulation")
                : t("Ritmo y pausas", "Rhythm and pauses");
          return (
            <details
              key={key}
              className="min-w-0 rounded-card border border-border p-3"
            >
              <summary className="min-h-11 cursor-pointer">
                <span className="block font-semibold">{label}</span>
                <span className="text-sm">
                  {dimension?.status === "OBSERVED"
                    ? `${dimension.level}/4 · ${t("provisional", "provisional")}`
                    : t("Sin evaluar", "Not assessed")}
                </span>
              </summary>
              {dimension && (
                <>
                  <Body className="mt-3 break-words">{dimension.reason}</Body>
                  {dimension.evidence.map((ref) => (
                    <blockquote
                      key={`${ref.itemId}-${ref.quote}`}
                      className="mt-3 break-words font-chinese"
                    >
                      <Caption>
                        {t("Intervención", "Turn")} {ref.sequence + 1}
                      </Caption>
                      <p>{ref.quote}</p>
                    </blockquote>
                  ))}
                </>
              )}
            </details>
          );
        })}
      </div>
      {judgment?.findings.length === 0 && (
        <Body>
          {t(
            "No se señalaron errores acústicos concretos en la muestra revisada. Esto no demuestra una pronunciación perfecta ni cubre el audio que no se pudo evaluar.",
            "No specific acoustic errors were reported in the reviewed sample. This does not demonstrate perfect pronunciation or cover audio that could not be assessed.",
          )}
        </Body>
      )}
      {judgment?.findings.map((finding, index) => (
        <article key={index} className="space-y-2 rounded-card bg-elevated p-4">
          <Caption>
            {t("Observación experimental", "Experimental observation")} ·{" "}
            {t("Intervención", "Turn")} {finding.evidence.sequence + 1}
          </Caption>
          <blockquote className="break-words font-chinese text-lg">
            {finding.evidence.quote}
          </blockquote>
          <Body className="break-words">{finding.heard}</Body>
          <ChineseText className="break-words">{finding.target}</ChineseText>
          <Body className="break-words">{finding.pinyin}</Body>
          <Body className="break-words">{finding.explanation}</Body>
          <Body className="break-words font-semibold">{finding.practice}</Body>
        </article>
      ))}
      {judgment?.limitations.map((limitation, index) => (
        <Body key={index} className="break-words">
          {limitation}
        </Body>
      ))}
      <Caption className="block">
        {t(
          "Los tonos y la pronunciación no se puntúan desde una transcripción.",
          "Tones and pronunciation cannot be scored from a transcript.",
        )}
      </Caption>
      <Caption className="block">
        {t(
          "El audio se revisa dentro de la sesión; esta función no guarda una grabación reproducible. Reabrir esta reflexión solo lee el resultado guardado, sin otra llamada de IA.",
          "Audio is reviewed within the session; this feature does not save a playable recording. Reopening this reflection only reads the saved result, with no additional AI call.",
        )}
      </Caption>
    </section>
  );
}
