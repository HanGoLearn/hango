"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Body } from "@/components/ui/typography";
import { JourneyFinalReport } from "@/components/lesson/journey-final-report";
import {
  getJourneyLessonReportAction,
  evaluateJourneyLessonReportAction,
  saveJourneyLessonReportAction,
  recoverJourneyLessonReportAction,
} from "@/lib/actions/journey-lesson-report";
import type { JourneyLessonReportView } from "@/lib/journey-lesson-report";
import { journeyReportMessages } from "@/i18n/journey-report";
import type { AppLocale } from "@/i18n/config";

type Operation = "read" | "evaluate" | "save" | "recover";
const actions = {
  read: getJourneyLessonReportAction,
  evaluate: evaluateJourneyLessonReportAction,
  save: saveJourneyLessonReportAction,
  recover: recoverJourneyLessonReportAction,
};

/** Mounting/reopening is read-only. Only an explicit press may evaluate or
 * settle. Failed saves can be retried without a second provider dispatch. */
export function JourneyReportPanel({
  lessonId,
  locale,
  onContinue,
  onExit,
}: {
  lessonId: string;
  locale: AppLocale;
  onContinue?: () => void;
  onExit?: () => void;
}) {
  const text = journeyReportMessages[locale];
  const [state, setState] = useState<{
    lessonId: string;
    report?: JourneyLessonReportView;
    busy: boolean;
    error: boolean;
    saveConfirmed: boolean;
  }>({ lessonId, busy: true, error: false, saveConfirmed: false });
  const generation = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const current = ++generation.current;
    inFlight.current = true;
    void getJourneyLessonReportAction({ lessonId })
      .then((result) => {
        if (current !== generation.current) return;
        setState({
          lessonId,
          report: result.ok ? result.report : undefined,
          busy: false,
          error: !result.ok,
          saveConfirmed:
            result.ok && result.report.rewards.settlement === "SETTLED",
        });
      })
      .catch(() => {
        if (current === generation.current)
          setState({
            lessonId,
            busy: false,
            error: true,
            saveConfirmed: false,
          });
      })
      .finally(() => {
        if (current === generation.current) inFlight.current = false;
      });
    return () => {
      generation.current = current + 1;
    };
  }, [lessonId]);

  async function run(operation: Operation) {
    if (inFlight.current) return;
    inFlight.current = true;
    const current = generation.current;
    setState((previous) => ({ ...previous, busy: true, error: false }));
    try {
      const result = await actions[operation]({ lessonId });
      if (current !== generation.current) return;
      if (!result.ok) {
        setState((previous) => ({ ...previous, busy: false, error: true }));
        return;
      }
      setState({
        lessonId,
        report: result.report,
        busy: false,
        error: false,
        saveConfirmed:
          operation !== "read" ||
          result.report.rewards.settlement === "SETTLED",
      });
    } catch {
      if (current === generation.current)
        setState((previous) => ({ ...previous, busy: false, error: true }));
    } finally {
      if (current === generation.current) inFlight.current = false;
    }
  }

  const report = state.lessonId === lessonId ? state.report : undefined;
  const busy = state.lessonId !== lessonId || state.busy;
  const pending = report?.speaking.state === "PENDING";
  const processing = report?.speaking.state === "PROCESSING";
  const settled = report?.rewards.settlement === "SETTLED";
  const recoverable =
    report?.speaking.state === "FAILED" && report.speaking.canRetry;
  const freeRepair = report?.speaking.canRepairWithoutAi === true;
  const waitingForReview = Boolean(report?.unified && (pending || processing));
  return (
    <div className="flex min-w-0 flex-col gap-4" aria-busy={busy}>
      {waitingForReview && (
        <section
          className="space-y-3 rounded-panel border border-secondary-500/40 bg-surface p-5"
          aria-label={
            locale === "es" ? "Estado de la evaluación" : "Evaluation status"
          }
        >
          <h2 className="font-display text-xl">
            {processing
              ? locale === "es"
                ? "Estamos evaluando tu conversación"
                : "Your conversation is being evaluated"
              : locale === "es"
                ? "Tu conversación está guardada y lista para evaluar"
                : "Your conversation is saved and ready to assess"}
          </h2>
          <Body>
            {pending
              ? text.evaluateDescription
              : locale === "es"
                ? "Puedes comprobar el estado sin iniciar otra evaluación. No necesitas repetir la lección."
                : "You can check status without starting another evaluation. You do not need to repeat the lesson."}
          </Body>
          {report?.unified?.reviewStatus.audio !== "COMPLETED" && (
            <Body className="rounded-card border border-border p-3">
              {report?.unified?.reviewStatus.audio === "PARTIAL"
                ? locale === "es"
                  ? "La revisión de audio es parcial. Puedes evaluar el texto guardado, pero la nota integral puede quedar pendiente."
                  : "Audio review is partial. You can assess the saved text, but the integrated grade may remain pending."
                : `${report?.unified?.dimensions.pronunciation.reason ?? ""} ${locale === "es" ? "Evaluar la conversación guardada revisará el texto; no recuperará los tonos de un audio no evaluado." : "Assessing the saved conversation reviews text; it cannot recover tones from unassessed audio."}`}
            </Body>
          )}
          {pending && !state.error && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => void run("evaluate")}
            >
              {text.evaluate}
            </Button>
          )}
          <Body>
            {locale === "es"
              ? "Los resultados de tus ejercicios se conservan. Las notas y el comentario de Han se mostrarán después de la revisión; no son ceros ni resultados vacíos."
              : "Your exercise results are retained. Grades and Han's feedback appear after review; these are not zero or empty results."}
          </Body>
        </section>
      )}
      {report && !waitingForReview && <JourneyFinalReport report={report} />}
      {busy && <Body role="status">{text.loading}</Body>}
      {state.error && (
        <Body role="alert" className="text-error-500">
          {text.loadError}
        </Body>
      )}
      {pending && !waitingForReview && <Body>{text.evaluateDescription}</Body>}
      {recoverable && (
        <Body>
          {freeRepair ? text.repairDescription : text.recoverDescription}
        </Body>
      )}
      <div className="flex flex-wrap gap-2">
        {recoverable && !state.error && (
          <Button
            type="button"
            disabled={busy}
            onClick={() => void run("recover")}
          >
            {freeRepair ? text.repair : text.recover}
          </Button>
        )}
        {pending && !waitingForReview && !state.error && (
          <Button
            type="button"
            disabled={busy}
            onClick={() => void run("evaluate")}
          >
            {text.evaluate}
          </Button>
        )}
        {report &&
          !pending &&
          !processing &&
          !settled &&
          !recoverable &&
          !state.error &&
          !state.saveConfirmed && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => void run("save")}
            >
              {text.saveResult}
            </Button>
          )}
        {(processing || state.error || !report) && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run("read")}
          >
            {text.checkStatus}
          </Button>
        )}
        {state.error && report && !settled && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run("save")}
          >
            {text.retrySave}
          </Button>
        )}
        {onContinue &&
          report &&
          !pending &&
          !processing &&
          state.saveConfirmed &&
          settled &&
          report.rewards.eligible &&
          !state.error && (
            <Button type="button" disabled={busy} onClick={onContinue}>
              {text.finishLesson}
            </Button>
          )}
        {onExit &&
          report &&
          !pending &&
          !processing &&
          !report.rewards.eligible &&
          (state.saveConfirmed || recoverable) &&
          !state.error && (
            <div className="flex flex-col gap-2">
              <Body>
                {report.unified
                  ? locale === "es"
                    ? "Tu reflexión de prueba queda guardada en esta lección. Puedes volver a la ruta; esta evaluación provisional no concede recompensas."
                    : "Your test reflection is saved in this lesson. You can return to the journey; this provisional evaluation does not grant rewards."
                  : text.partialProgressNote}
              </Body>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={onExit}
              >
                {text.returnToJourney}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
