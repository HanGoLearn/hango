"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  SectionTitle,
  Body,
  Caption,
  ChineseText,
} from "@/components/ui/typography";
import { JourneyFinalReport } from "@/components/lesson/journey-final-report";
import { createJourneyReportPreview } from "@/lib/journey-report-preview";
import type { AppLocale } from "@/i18n/config";

export function JourneySpeakingPreview({ locale }: { locale: AppLocale }) {
  const es = locale === "es";
  const [view, setView] = useState<"speaking" | "result">("speaking");
  const [turn, setTurn] = useState(0);
  const [holding, setHolding] = useState(false);
  const [help, setHelp] = useState(false);
  const [complete, setComplete] = useState(true);
  const examples = [
    { user: "你好，我叫安娜。", character: "我叫小雨。你是学生吗？" },
    { user: "我是老师。", character: "你是老师。我是学生。" },
    { user: "你是中国人吗？", character: "是，我是中国人。" },
  ];
  function release() {
    if (!holding) return;
    setHolding(false);
    setTurn((value) => Math.min(value + 1, examples.length));
    setHelp(false);
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <Caption className="font-semibold text-accent-500">
          {es
            ? "VISTA PREVIA LOCAL · DATOS DE EJEMPLO"
            : "LOCAL PREVIEW · EXAMPLE DATA"}
        </Caption>
        <PageTitle>
          {es
            ? "Conversación y feedback de Speaking"
            : "Speaking conversation and feedback"}
        </PageTitle>
        <Body>
          {es
            ? "Esta es una demostración, no una conversación con IA. No graba tu voz, no guarda puntajes ni cambia cuentas. Las notas mostradas son ejemplos, no tus resultados."
            : "This is a demonstration, not an AI conversation. It does not record your voice, save scores or change accounts. The scores shown are examples, not your results."}
        </Body>
      </header>
      <nav
        className="flex flex-wrap gap-2"
        aria-label={es ? "Pantallas de la vista previa" : "Preview screens"}
      >
        <Button
          variant={view === "speaking" ? "primary" : "secondary"}
          aria-pressed={view === "speaking"}
          onClick={() => setView("speaking")}
        >
          {es ? "Conversación de ejemplo" : "Example conversation"}
        </Button>
        <Button
          variant={view === "result" ? "primary" : "secondary"}
          aria-pressed={view === "result"}
          onClick={() => setView("result")}
        >
          {es ? "Ver resultado y feedback" : "View result and feedback"}
        </Button>
      </nav>
      {view === "speaking" ? (
        <section className="flex flex-col gap-6 rounded-panel border border-border bg-surface p-5 sm:p-8">
          <div>
            <Caption>
              {es
                ? "SALUDOS Y PRESENTACIONES · HSK 1"
                : "GREETINGS AND INTRODUCTIONS · HSK 1"}
            </Caption>
            <SectionTitle>
              {es ? "Nuevo compañero de clase" : "New classmate"}
            </SectionTitle>
          </div>
          <div className="flex min-h-32 flex-col gap-3" aria-live="polite">
            <div className="self-start rounded-panel bg-elevated p-3">
              <Caption>{es ? "Personaje" : "Character"}</Caption>
              <ChineseText>你好！</ChineseText>
            </div>
            {examples.slice(0, turn).map((example, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="self-end rounded-panel bg-primary-500/10 p-3">
                  <Caption>
                    {es ? "Alumno de ejemplo" : "Example learner"}
                  </Caption>
                  <ChineseText>{example.user}</ChineseText>
                </div>
                <div className="self-start rounded-panel bg-elevated p-3">
                  <Caption>{es ? "Personaje" : "Character"}</Caption>
                  <ChineseText>{example.character}</ChineseText>
                </div>
              </div>
            ))}
            {help && (
              <div className="rounded-panel border border-border bg-elevated p-3">
                <Body>
                  {es
                    ? "Te pregunté si eres estudiante: 你是学生吗？ Puedes responder con 我是… y tu ocupación."
                    : "I asked if you are a student: 你是学生吗？ You can answer with 我是… and your occupation."}
                </Body>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button
              disabled={turn >= examples.length}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setHolding(true);
              }}
              onPointerUp={release}
              onPointerCancel={() => setHolding(false)}
              onLostPointerCapture={() => setHolding(false)}
              onKeyDown={(event) => {
                if (
                  (event.key === " " || event.key === "Enter") &&
                  !event.repeat
                ) {
                  event.preventDefault();
                  setHolding(true);
                }
              }}
              onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  release();
                }
              }}
              className="min-h-16 touch-none select-none rounded-full px-6"
              aria-pressed={holding}
            >
              <Mic className="size-5" aria-hidden="true" />
              {holding
                ? es
                  ? "Suelta para avanzar el ejemplo"
                  : "Release to advance the example"
                : es
                  ? "Mantén presionado para simular un turno"
                  : "Hold to simulate a turn"}
            </Button>
            <Caption>
              {es
                ? "El botón solo avanza frases preparadas; no activa el micrófono."
                : "The button only advances prepared phrases; it does not activate the microphone."}
            </Caption>
            <Button
              variant="tertiary"
              onClick={() => {
                setTurn(Math.max(1, turn));
                setHelp(true);
              }}
            >
              {es
                ? "Ver ejemplo de ayuda en español"
                : "View an English help example"}
            </Button>
            <Button variant="secondary" onClick={() => setView("result")}>
              {es
                ? "Terminar ejemplo y ver feedback"
                : "Finish example and view feedback"}
            </Button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={complete ? "primary" : "secondary"}
              aria-pressed={complete}
              onClick={() => setComplete(true)}
            >
              {es
                ? "Ejemplo con evaluación completa"
                : "Complete evaluation example"}
            </Button>
            <Button
              variant={!complete ? "primary" : "secondary"}
              aria-pressed={!complete}
              onClick={() => setComplete(false)}
            >
              {es ? "Ejemplo sin captura oral" : "Missing oral capture example"}
            </Button>
          </div>
          <JourneyFinalReport
            report={createJourneyReportPreview(locale, complete)}
            preview
          />
        </section>
      )}
    </main>
  );
}
