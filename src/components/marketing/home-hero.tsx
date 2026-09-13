import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { HomeSections } from "@/components/marketing/home-sections";
import { HeroDemoCard } from "@/components/marketing/hero-demo-card";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { localePath, type AppLocale } from "@/i18n/config";
import type { MarketingMessages } from "@/i18n/messages/types";

const primaryLinkClasses =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-7 py-4 font-interface text-card-title font-semibold text-on-color-light transition-colors duration-fast ease-standard hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600";

const secondaryLinkClasses =
  "inline-flex items-center justify-center rounded-full border border-border-strong bg-transparent px-7 py-4 font-interface text-card-title font-semibold text-text-primary transition-colors duration-fast ease-standard hover:bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

export function HomeHero({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: MarketingMessages;
}) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-page text-text-primary">
      <a
        href="#contenido-principal"
        className="sr-only z-50 rounded-control bg-primary-500 px-4 py-2 text-on-color-light focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {messages.skipToContent}
      </a>

      <header className="relative z-40 border-b border-border/70 bg-page/90 backdrop-blur-lg">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href={localePath(locale)}
            aria-label={messages.brandHome}
            className="rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
          >
            <Logo />
          </Link>

          <nav
            aria-label={messages.navLabel}
            className="hidden items-center gap-7 md:flex"
          >
            <a
              href="#como-funciona"
              className="rounded-control text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              {messages.navHow}
            </a>
            <a
              href="#experiencia"
              className="rounded-control text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              {messages.navExperience}
            </a>
            <a
              href="#han"
              className="rounded-control text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              {messages.navHan}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher
              locale={locale}
              label={locale === "es" ? "Elegir idioma" : "Choose language"}
            />
            <Link
              href={localePath(locale, "/login")}
              className="hidden rounded-control px-3 py-2 text-supporting font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 sm:inline-flex"
            >
              {messages.login}
            </Link>
            <Link
              href={localePath(locale, "/register")}
              className="inline-flex items-center justify-center rounded-full bg-primary-500 px-4 py-2.5 text-supporting font-semibold text-on-color-light transition-colors hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:px-5"
            >
              {messages.createAccount}
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido-principal">
        <section className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:px-10 lg:pb-28 lg:pt-24">
          <div
            className="pointer-events-none absolute -left-40 top-10 -z-10 size-[32rem] rounded-full bg-primary-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-48 bottom-0 -z-10 size-[34rem] rounded-full bg-secondary-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/35 bg-primary-500/10 px-4 py-2 text-caption font-semibold uppercase tracking-[0.14em] text-accent-300">
                <span
                  className="size-1.5 rounded-full bg-primary-400"
                  aria-hidden="true"
                />
                {messages.hero.eyebrow}
              </div>

              <h1 className="max-w-[14ch] font-display text-[clamp(2.85rem,7vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-text-primary">
                {messages.hero.titleBefore}{" "}
                <span className="text-accent-300">
                  {messages.hero.titleAccent}
                </span>
              </h1>

              <p className="mt-7 max-w-[59ch] text-lg leading-8 text-text-secondary sm:text-xl">
                {messages.hero.description}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={localePath(locale, "/register")}
                  className={primaryLinkClasses}
                >
                  {messages.hero.primaryCta}
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
                <a href="#como-funciona" className={secondaryLinkClasses}>
                  {messages.hero.secondaryCta}
                </a>
              </div>

              <ul className="mt-8 flex flex-col gap-3 text-supporting text-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-6">
                {messages.hero.benefits.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-secondary-500/15 text-secondary-500">
                      <Check
                        className="size-3.5"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <HeroDemoCard locale={locale} messages={messages.demo} />
          </div>
        </section>
        <HomeSections locale={locale} messages={messages} />
      </main>
    </div>
  );
}
