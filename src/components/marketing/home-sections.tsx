import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Compass,
  MessageCircleQuestion,
  MessagesSquare,
  Mic2,
  Palette,
  PenLine,
  Sparkles,
  Target,
  Trophy,
  Languages,
} from "lucide-react";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { Card } from "@/components/ui/card";
import { HanMascot } from "@/components/ui/han-mascot";
import { Logo } from "@/components/ui/logo";
import { localePath, type AppLocale } from "@/i18n/config";
import type { MarketingMessages } from "@/i18n/messages/types";

const productAreaPresentation = [
  { icon: Compass, accent: "text-primary-500 bg-primary-500/15" },
  { icon: Sparkles, accent: "text-accent-300 bg-accent-500/15" },
  { icon: Mic2, accent: "text-secondary-500 bg-secondary-500/15" },
  { icon: PenLine, accent: "text-info-500 bg-info-500/15" },
  { icon: Target, accent: "text-primary-500 bg-primary-500/15" },
  {
    icon: ChartNoAxesCombined,
    accent: "text-accent-300 bg-accent-500/15",
  },
];

const differenceIcons = [BookOpenText, MessagesSquare, CircleCheck];

const primaryLinkClasses =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-7 py-4 font-interface text-card-title font-semibold text-on-color-light transition-colors duration-fast ease-standard hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption font-bold uppercase tracking-[0.18em] text-accent-300">
      {children}
    </p>
  );
}

export function HomeSections({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: MarketingMessages;
}) {
  return (
    <>
      <section className="border-y border-border bg-surface/60 px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <SectionEyebrow>{messages.startingPoints.eyebrow}</SectionEyebrow>
            <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(2.2rem,4vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-text-primary">
              {messages.startingPoints.title}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {messages.startingPoints.items.map((problem) => (
              <div
                key={problem}
                className="flex gap-3 rounded-card border border-border bg-page p-4 text-supporting leading-6 text-text-secondary"
              >
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-400"
                  aria-hidden="true"
                />
                <p>{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="motivacion"
        className="scroll-mt-24 bg-surface px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <SectionEyebrow>{messages.motivation.eyebrow}</SectionEyebrow>
              <h2 className="mt-4 max-w-[13ch] font-display text-[clamp(2.3rem,5vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-text-primary">
                {messages.motivation.title}
              </h2>
            </div>
            <p className="max-w-[62ch] text-lg leading-8 text-text-secondary lg:justify-self-end">
              {messages.motivation.description}
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            <Card size="lg" className="relative overflow-hidden bg-page/70">
              <div
                className="flex min-h-32 items-end justify-center gap-1 rounded-panel bg-elevated/70 px-3 pt-3"
                aria-hidden="true"
              >
                <AvatarDisplay animal="DOG" size={108} shape="square" />
                <AvatarDisplay animal="RABBIT" size={108} shape="square" />
                <AvatarDisplay animal="MONKEY" size={108} shape="square" />
              </div>
              <span className="mt-6 grid size-11 place-items-center rounded-2xl bg-primary-500/15 text-primary-500">
                <Palette className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-text-primary">
                {messages.motivation.avatarTitle}
              </h3>
              <p className="mt-3 text-supporting leading-6 text-text-secondary">
                {messages.motivation.avatarDescription}
              </p>
            </Card>

            <Card size="lg" className="bg-page/70">
              <div className="rounded-panel border border-border bg-elevated/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-caption font-bold uppercase tracking-[0.14em] text-accent-300">
                    Han Vocabulary
                  </span>
                  <Languages
                    className="size-5 text-primary-500"
                    aria-hidden="true"
                  />
                </div>
                <p
                  lang="zh-Hans"
                  className="mt-5 font-chinese text-4xl font-semibold text-text-primary"
                >
                  坚持
                </p>
                <p
                  lang="zh-Latn-pinyin"
                  className="mt-1 text-supporting text-text-secondary"
                >
                  jiānchí
                </p>
                <p className="mt-3 text-supporting font-medium text-text-primary">
                  {messages.motivation.vocabularyMeaning}
                </p>
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-text-primary">
                {messages.motivation.vocabularyTitle}
              </h3>
              <p className="mt-3 text-supporting leading-6 text-text-secondary">
                {messages.motivation.vocabularyDescription}
              </p>
            </Card>

            <Card size="lg" className="bg-page/70">
              <div className="rounded-panel border border-border bg-elevated/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-bold uppercase tracking-[0.14em] text-accent-300">
                    {messages.motivation.leaderboardLabel}
                  </span>
                  <Trophy
                    className="size-5 text-accent-300"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-5 space-y-2" aria-hidden="true">
                  {[
                    ["bg-accent-500", "text-on-color-dark"],
                    ["bg-secondary-700", "text-on-color-light"],
                    ["bg-primary-500", "text-on-color-light"],
                  ].map(([color, textColor], index) => (
                    <div
                      key={color}
                      className="flex items-center gap-3 rounded-card bg-page/70 px-3 py-2.5"
                    >
                      <span
                        className={`grid size-7 place-items-center rounded-full ${color} ${textColor} text-caption font-bold`}
                      >
                        {index + 1}
                      </span>
                      <span className="h-2 flex-1 rounded-full bg-border" />
                      <span className="h-2 w-10 rounded-full bg-accent-500/40" />
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-text-primary">
                {messages.motivation.leaderboardTitle}
              </h3>
              <p className="mt-3 text-supporting leading-6 text-text-secondary">
                {messages.motivation.leaderboardDescription}
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionEyebrow>{messages.howItWorks.eyebrow}</SectionEyebrow>
            <h2 className="mt-4 font-display text-[clamp(2.3rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-text-primary">
              {messages.howItWorks.title}
            </h2>
            <p className="mt-5 max-w-[62ch] text-lg leading-8 text-text-secondary">
              {messages.howItWorks.description}
            </p>
          </div>

          <ol className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {messages.howItWorks.steps.map((step, index) => (
              <li key={step.number} className="relative">
                <Card size="lg" className="h-full bg-surface/80">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-semibold text-accent-300">
                      {step.number}
                    </span>
                    {index < messages.howItWorks.steps.length - 1 && (
                      <ChevronRight
                        className="hidden size-5 text-text-muted xl:block"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <h3 className="mt-7 text-card-title font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-supporting leading-6 text-text-secondary">
                    {step.description}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="experiencia"
        className="scroll-mt-24 bg-surface px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <SectionEyebrow>{messages.experience.eyebrow}</SectionEyebrow>
              <h2 className="mt-4 max-w-[12ch] font-display text-[clamp(2.3rem,5vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-text-primary">
                {messages.experience.title}
              </h2>
            </div>
            <p className="max-w-[62ch] text-lg leading-8 text-text-secondary lg:justify-self-end">
              {messages.experience.description}
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {messages.experience.areas.map(({ title, description }, index) => {
              const { icon: Icon, accent } = productAreaPresentation[index]!;
              return (
              <Card key={title} size="lg" className="group bg-page/70">
                <span
                  className={`grid size-12 place-items-center rounded-2xl ${accent}`}
                >
                  <Icon
                    className="size-6"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
                <h3 className="mt-6 text-card-title font-semibold text-text-primary">
                  {title}
                </h3>
                <p className="mt-3 text-supporting leading-6 text-text-secondary">
                  {description}
                </p>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20">
          <div>
            <SectionEyebrow>{messages.restaurant.eyebrow}</SectionEyebrow>
            <h2 className="mt-4 max-w-[13ch] font-display text-[clamp(2.3rem,5vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-text-primary">
              {messages.restaurant.title}
            </h2>
            <p className="mt-6 max-w-[58ch] text-lg leading-8 text-text-secondary">
              {messages.restaurant.description}
            </p>

            <ul className="mt-8 space-y-4">
              {messages.restaurant.moments.map((moment, index) => (
                <li key={moment} className="flex items-center gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-primary-500/35 bg-primary-500/10 text-caption font-bold text-accent-300">
                    {index + 1}
                  </span>
                  <span className="text-body font-medium text-text-primary">
                    {moment}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="absolute -right-28 -top-28 size-80 rounded-full bg-accent-500/10 blur-3xl"
              aria-hidden="true"
            />
            <Card size="lg" className="relative overflow-hidden bg-surface p-0">
              <div className="border-b border-border p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-caption font-bold uppercase tracking-[0.16em] text-accent-300">
                      {messages.restaurant.missionLabel}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-text-primary sm:text-3xl">
                      {messages.restaurant.missionTitle}
                    </h3>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-500/15 text-accent-300">
                    <Target className="size-6" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 max-w-[48ch] text-supporting leading-6 text-text-secondary">
                  {messages.restaurant.missionDescription}
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                <div className="rounded-card border border-border bg-page p-5">
                  <p className="text-caption font-bold uppercase tracking-[0.14em] text-text-muted">
                    {messages.restaurant.objectiveLabel}
                  </p>
                  <p className="mt-3 font-semibold leading-6 text-text-primary">
                    {messages.restaurant.objective}
                  </p>
                </div>
                <div className="rounded-card border border-border bg-page p-5">
                  <p className="text-caption font-bold uppercase tracking-[0.14em] text-text-muted">
                    {messages.restaurant.supportLabel}
                  </p>
                  <p className="mt-3 font-semibold leading-6 text-text-primary">
                    {messages.restaurant.support}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="han"
        className="scroll-mt-24 border-y border-border bg-surface px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div className="relative flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[2rem] bg-primary-900/50">
            <div
              className="absolute inset-12 rounded-full bg-primary-500/20 blur-3xl"
              aria-hidden="true"
            />
            <HanMascot pose="curious" size={390} />
          </div>

          <div className="lg:pl-12">
            <SectionEyebrow>{messages.han.eyebrow}</SectionEyebrow>
            <h2 className="mt-4 max-w-[13ch] font-display text-[clamp(2.3rem,5vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-text-primary">
              {messages.han.title}
            </h2>
            <p className="mt-6 max-w-[60ch] text-lg leading-8 text-text-secondary">
              {messages.han.description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {messages.han.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 text-supporting leading-6 text-text-primary"
                >
                  <Check
                    className="mt-1 size-4 shrink-0 text-secondary-500"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  <p>{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>{messages.why.eyebrow}</SectionEyebrow>
            <h2 className="mt-4 font-display text-[clamp(2.3rem,5vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-text-primary">
              {messages.why.title}
            </h2>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {messages.why.differences.map(({ title, description }, index) => {
              const Icon = differenceIcons[index]!;
              return (
              <Card key={title} size="lg" className="bg-surface">
                <Icon
                  className="size-7 text-primary-500"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <h3 className="mt-7 font-display text-2xl font-semibold text-text-primary">
                  {title}
                </h3>
                <p className="mt-4 text-supporting leading-6 text-text-secondary">
                  {description}
                </p>
              </Card>
              );
            })}
          </div>

          <div className="mt-14 rounded-[2rem] border border-border bg-surface p-6 sm:p-9 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary-500/15 text-secondary-500">
                <MessageCircleQuestion className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-card-title font-semibold text-text-primary">
                  {messages.why.advancedQuestion}
                </h3>
                <p className="mt-2 max-w-[67ch] text-supporting leading-6 text-text-secondary">
                  {messages.why.advancedAnswer}
                </p>
              </div>
            </div>
            <Link
              href={localePath(locale, "/register")}
              className="mt-6 inline-flex shrink-0 items-center gap-2 rounded-control font-semibold text-accent-300 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 lg:mt-0"
            >
              {messages.why.advancedCta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-primary-500/30 bg-primary-900 px-6 py-14 text-center shadow-modal sm:px-12 sm:py-20">
          <div
            className="absolute -left-16 -top-24 size-64 rounded-full bg-primary-500/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-28 -right-10 size-72 rounded-full bg-secondary-500/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-3xl">
            <p className="text-caption font-bold uppercase tracking-[0.18em] text-primary-200">
              {messages.finalCta.eyebrow}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-on-color-light">
              {messages.finalCta.title}
            </h2>
            <p className="mx-auto mt-6 max-w-[58ch] text-lg leading-8 text-on-color-light/75">
              {messages.finalCta.description}
            </p>
            <Link
              href={localePath(locale, "/register")}
              className={`${primaryLinkClasses} mt-9`}
            >
              {messages.finalCta.action}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow>{messages.faq.eyebrow}</SectionEyebrow>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-text-primary">
              {messages.faq.title}
            </h2>
          </div>

          <div className="mt-12 flex flex-col divide-y divide-border rounded-[2rem] border border-border bg-surface/60 px-6 sm:px-8">
            {messages.faq.items.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-interface text-body font-semibold text-text-primary marker:content-none">
                  {faq.question}
                  <ChevronDown
                    className="size-5 shrink-0 text-text-muted transition-transform duration-fast ease-standard group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 max-w-[62ch] text-supporting leading-6 text-text-secondary">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-caption text-text-muted">
              {messages.footer.tagline}
            </p>
          </div>
          <nav
            aria-label={messages.footer.navLabel}
            className="flex items-center gap-6 text-supporting"
          >
            <Link
              href={localePath(locale, "/login")}
              className="rounded-control text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              {messages.footer.login}
            </Link>
            <Link
              href={localePath(locale, "/register")}
              className="rounded-control font-semibold text-accent-300 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              {messages.footer.createAccount}
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
