"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  MessageCircleMore,
  Route,
  Target,
} from "lucide-react";
import { HanMascot, type HanPose } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";

/**
 * Interactive hero demo (2026-09-03, replacing a static "01/02/03" grid
 * with real tabs) - lets a visitor experience HanGo's actual method
 * (situation -> practice -> mission) in ~30 seconds, with zero signup, zero
 * microphone, and zero AI cost: everything here is scripted, not a live
 * call. Mirrors the same reasoning already applied to the anonymous voice
 * demo question earlier - interactive beats static, but only when it's
 * free to run for every visitor.
 */

type TabKey = "contexto" | "practica" | "mision";

const TABS: { key: TabKey; number: string; label: string }[] = [
  { key: "contexto", number: "01", label: "Contexto" },
  { key: "practica", number: "02", label: "Práctica" },
  { key: "mision", number: "03", label: "Misión" },
];

const PRACTICE_OPTIONS = [
  { chinese: "可以少放辣吗？", correct: true },
  { chinese: "我不喜欢辣的。", correct: false },
  { chinese: "辣一点吧。", correct: false },
];

/** Real evaluation dimensions already used across HanGo's scenarios (prisma/seed.ts), not invented for this demo. */
const MISSION_EVALUATION = [
  "Cumplir el objetivo",
  "Uso del vocabulario",
  "Qué tan natural suena",
];

const MISSION_VOCAB = ["太辣了", "可以换一个吗", "谢谢"];

function poseForState(tab: TabKey, selected: number | null): HanPose {
  if (tab === "contexto") return "curious";
  if (tab === "mision") return "celebrating";
  if (selected === null) return "curious";
  return PRACTICE_OPTIONS[selected]!.correct ? "celebrating" : "wrong";
}

export function HeroDemoCard() {
  const [tab, setTab] = useState<TabKey>("contexto");
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:mr-0">
      <div
        className="absolute inset-x-12 top-7 h-56 rounded-full bg-primary-500/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface shadow-modal">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-500/15 text-primary-500">
              <Route className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
                Situación real
              </p>
              <p className="mt-0.5 font-semibold text-text-primary">
                En un restaurante
              </p>
            </div>
          </div>
          <span className="rounded-full bg-accent-500/15 px-3 py-1 text-caption font-semibold text-accent-300">
            A tu nivel
          </span>
        </div>

        {/* Tabs - real navigation, not a static "01/02/03" label row */}
        <div
          role="tablist"
          aria-label="Demostración de una lección de HanGo"
          className="grid grid-cols-3 gap-2 border-b border-border px-5 pt-4 sm:gap-3 sm:px-7"
        >
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex flex-col gap-1 rounded-t-card border-x border-t px-3 pb-3 pt-3 text-left transition-colors duration-fast ease-standard sm:p-4",
                  active
                    ? "border-primary-500/50 bg-primary-500/10"
                    : "border-transparent text-text-muted hover:bg-page/60",
                )}
              >
                <span
                  className={cn(
                    "text-caption font-bold",
                    active ? "text-accent-300" : "text-text-muted",
                  )}
                >
                  {item.number}
                </span>
                <span
                  className={cn(
                    "text-caption font-semibold sm:text-supporting",
                    active ? "text-text-primary" : "text-text-muted",
                  )}
                >
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "-mb-px h-0.5 w-full rounded-full transition-colors duration-fast ease-standard",
                    active ? "bg-primary-500" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="relative min-h-[23rem] px-5 pb-6 pt-5 sm:px-7">
          <div className="relative mb-3 flex h-56 items-center justify-center sm:mb-0 sm:block sm:h-auto">
            <div
              className={cn(
                "sm:absolute sm:-right-16",
                tab === "practica" ? "sm:top-14" : "sm:top-8",
              )}
            >
              <HanMascot pose={poseForState(tab, selected)} size={340} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {tab === "contexto" && (
              <motion.div
                key="contexto"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 flex flex-col gap-3"
              >
                {/* Only the dialogue bubbles stay narrow (chat-bubble
                    column) - HanNote below is a separate, full-width child
                    of this wrapper on purpose, not nested inside this
                    max-w, so it can span the whole card and stay centered
                    without affecting the bubbles above it. */}
                <div className="flex flex-col gap-3 sm:max-w-[19rem]">
                  <DialogueLine
                    speaker="Mesero"
                    chinese="您好，想吃点什么？"
                    pinyin="Nín hǎo, xiǎng chī diǎn shénme?"
                    translation="Hola, ¿qué desea comer?"
                  />
                  <DialogueLine
                    speaker="Tú"
                    chinese="我想要这个，可以少放辣吗？"
                    pinyin="Wǒ xiǎng yào zhège, kěyǐ shǎo fàng là ma?"
                    translation="Quiero esto. ¿Podría ponerle menos picante?"
                    align="end"
                  />
                </div>
                <HanNote className="text-center">
                  Así descubres las frases que vas a necesitar.
                </HanNote>
              </motion.div>
            )}

            {tab === "practica" && (
              <motion.div
                key="practica"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 flex flex-col gap-3"
              >
                <div className="rounded-panel rounded-bl-sm border border-border bg-elevated p-5 shadow-elevated sm:max-w-[16rem]">
                  <div className="mb-3 flex items-center gap-2 text-caption font-semibold text-accent-300">
                    <MessageCircleMore className="size-4" aria-hidden="true" />
                    PRÁCTICA CONTEXTUAL
                  </div>
                  <p className="text-body font-medium text-text-primary">
                    ¿Cómo le pedirías al mesero que le pongan menos picante?
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {PRACTICE_OPTIONS.map((option, index) => {
                      const isSelected = selected === index;
                      return (
                        <button
                          key={option.chinese}
                          type="button"
                          onClick={() => setSelected(index)}
                          className={cn(
                            "rounded-control border px-3.5 py-2.5 text-left font-chinese text-supporting transition-colors duration-fast ease-standard",
                            isSelected && option.correct
                              ? "border-secondary-500/60 bg-secondary-500/10 text-text-primary"
                              : isSelected
                                ? "border-primary-500/60 bg-primary-500/10 text-text-primary"
                                : "border-border bg-page/60 text-text-primary hover:border-border-strong",
                          )}
                        >
                          {option.chinese}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selected !== null && (
                  <HanNote className="text-center">
                    {PRACTICE_OPTIONS[selected]!.correct
                      ? "¡Correcto! “少放辣” significa “poner menos picante” - la forma más natural de pedirlo."
                      : "Casi - con el mesero, “可以少放辣吗？” se entiende mejor y suena más natural."}
                  </HanNote>
                )}
              </motion.div>
            )}

            {tab === "mision" && (
              <motion.div
                key="mision"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 flex flex-col gap-3"
              >
                <div className="rounded-panel rounded-bl-sm border border-border bg-elevated p-5 shadow-elevated sm:max-w-[16rem]">
                  <div className="mb-3 flex items-center gap-2 text-caption font-semibold text-accent-300">
                    <Target className="size-4" aria-hidden="true" />
                    MISIÓN
                  </div>
                  <p className="text-supporting leading-6 text-text-primary">
                    Tu plato llegó demasiado picante. Explícale el problema al
                    mesero y pide un cambio.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {MISSION_VOCAB.map((word) => (
                      <span
                        key={word}
                        className="rounded-full border border-border bg-page/70 px-2.5 py-1 font-chinese text-caption text-text-primary"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-caption font-semibold uppercase tracking-[0.12em] text-text-muted">
                    HanGo evaluaría
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {MISSION_EVALUATION.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-caption text-text-secondary"
                      >
                        <Check
                          className="size-3.5 shrink-0 text-secondary-500"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-control bg-primary-500 px-4 py-2.5 text-supporting font-semibold text-on-color-light transition-colors duration-fast ease-standard hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Practicar esta misión en HanGo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-card border border-border bg-elevated px-4 py-3 shadow-elevated sm:mx-5">
        <div>
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-text-muted">
            Próximo paso claro
          </p>
          <p className="mt-1 text-supporting font-semibold text-text-primary">
            Resolver un cambio en el pedido
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-500/15 text-primary-500">
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function DialogueLine({
  speaker,
  chinese,
  pinyin,
  translation,
  align = "start",
}: {
  speaker: string;
  chinese: string;
  pinyin: string;
  translation: string;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex max-w-[90%] flex-col gap-0.5 rounded-panel rounded-bl-sm border border-border bg-elevated p-4 shadow-elevated",
        align === "end" && "self-end rounded-bl-panel rounded-br-sm",
      )}
    >
      <span className="text-caption font-semibold uppercase tracking-[0.1em] text-text-muted">
        {speaker}
      </span>
      <p
        lang="zh-Hans"
        className="font-chinese text-body font-semibold text-text-primary"
      >
        {chinese}
      </p>
      <p lang="zh-Latn-pinyin" className="text-caption text-text-muted">
        {pinyin}
      </p>
      <p className="text-supporting text-text-secondary">{translation}</p>
    </div>
  );
}

function HanNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-control bg-primary-500/10 px-3.5 py-2.5 text-caption leading-5 text-text-secondary",
        className,
      )}
    >
      <span className="font-semibold text-accent-300">Han: </span>
      {children}
    </p>
  );
}
