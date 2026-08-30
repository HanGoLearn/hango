import type { ReactNode } from "react";
import Link from "next/link";
import { Logo, LogoMark } from "@/components/ui/logo";
import { Display, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";

/**
 * Layout for unauthenticated screens (login, registration, password
 * recovery — ui.md "Authentication Interface"). Deliberately has no sidebar,
 * bottom nav, or AI Teacher — those belong to the authenticated shell only.
 *
 * DESIGN_TASKS.md Phase 2, Option 1 (split screen): an editorial hero panel
 * on desktop, collapsing to just the form on narrower viewports — below
 * `md` the hero is `hidden`, not resized, since a squeezed version of it
 * never reads well.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-page">
      <div className="relative hidden w-[45%] flex-col overflow-hidden bg-surface p-12 md:flex lg:w-1/2">
        <LogoMark
          className="pointer-events-none absolute -right-16 -bottom-16 size-[380px] text-neutral-50 opacity-[0.06]"
          aria-hidden="true"
        />
        <Link href="/" className="relative w-fit rounded-control">
          <Logo size="lg" />
        </Link>
        <div className="relative flex flex-1 items-center">
          <div
            className="-ml-6"
            style={{
              filter:
                "drop-shadow(0 16px 24px rgba(0,0,0,0.35)) drop-shadow(0 0 48px rgba(196,42,62,0.4))",
            }}
          >
            <HanMascot pose="wave" size={320} gesture="wave" />
          </div>
        </div>
        <div className="relative">
          <Display className="max-w-[9ch]">
            Learn <em className="text-primary-300 not-italic">Chinese</em> your
            way
          </Display>
          <Body className="mt-4 max-w-[34ch] text-text-secondary">
            Real lessons, AI conversation, and hands-on missions — at your pace,
            in your language.
          </Body>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 block w-fit rounded-control md:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
