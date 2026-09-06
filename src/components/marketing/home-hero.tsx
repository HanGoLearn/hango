import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { HomeSections } from "@/components/marketing/home-sections";
import { HeroDemoCard } from "@/components/marketing/hero-demo-card";

const primaryLinkClasses =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-7 py-4 font-interface text-card-title font-semibold text-on-color-light transition-colors duration-fast ease-standard hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600";

const secondaryLinkClasses =
  "inline-flex items-center justify-center rounded-full border border-border-strong bg-transparent px-7 py-4 font-interface text-card-title font-semibold text-text-primary transition-colors duration-fast ease-standard hover:bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

export function HomeHero() {
  return (
    <div
      lang="es"
      className="min-h-dvh overflow-x-hidden bg-page text-text-primary"
    >
      <a
        href="#contenido-principal"
        className="sr-only z-50 rounded-control bg-primary-500 px-4 py-2 text-on-color-light focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir al contenido principal
      </a>

      <header className="relative z-40 border-b border-border/70 bg-page/90 backdrop-blur-lg">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            aria-label="HanGo, inicio"
            className="rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
          >
            <Logo />
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-7 md:flex"
          >
            <a
              href="#como-funciona"
              className="rounded-control text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              Cómo funciona
            </a>
            <a
              href="#experiencia"
              className="rounded-control text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              Experiencia
            </a>
            <a
              href="#han"
              className="rounded-control text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
            >
              Conoce a Han
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-control px-3 py-2 text-supporting font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 sm:inline-flex"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-primary-500 px-4 py-2.5 text-supporting font-semibold text-on-color-light transition-colors hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:px-5"
            >
              Crear cuenta
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
                Mandarín desde cero hasta nivel avanzado
              </div>

              <h1 className="max-w-[14ch] font-display text-[clamp(2.85rem,7vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-text-primary">
                Empieza desde cero. Lleva tu chino{" "}
                <span className="text-accent-300">hasta donde quieras.</span>
              </h1>

              <p className="mt-7 max-w-[59ch] text-lg leading-8 text-text-secondary sm:text-xl">
                Aprende mandarín paso a paso, úsalo en situaciones reales y
                perfecciona tu expresión oral, escritura y vocabulario con la
                guía de un AI Teacher que se adapta a tu nivel.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={primaryLinkClasses}>
                  Crear mi cuenta
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
                <a href="#como-funciona" className={secondaryLinkClasses}>
                  Ver cómo funciona
                </a>
              </div>

              <ul className="mt-8 flex flex-col gap-3 text-supporting text-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-6">
                {[
                  "Empieza sin conocimientos previos",
                  "Apoyo con pinyin",
                  "Avanza hasta perfeccionar tu chino",
                ].map((item) => (
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

            <HeroDemoCard />
          </div>
        </section>
        <HomeSections />
      </main>
    </div>
  );
}
