import type { HanPose } from "@/components/ui/han-mascot";
import type { AppMessages } from "@/i18n/messages/types";

type TourMessages = AppMessages["tour"];

export interface TourStepCopy {
  /** Small uppercase label above the body. Absent on the welcome card, which leads with a real title instead. */
  eyebrow?: string;
  /** Only the welcome card has one - the rest are Han talking, not headings. */
  title?: string;
  body: string;
}

export interface TourStep {
  id: string;
  /**
   * `data-tour-id` of the element to spotlight. `null` renders a card with
   * no cutout.
   */
  anchor: string | null;
  /**
   * Second-leg steps only: the locale-less path this step is asking the
   * learner to open. The tour does **not** navigate there itself - it
   * spotlights the menu entry and waits. Arriving is what advances the
   * step, so the learner is the one who moves, which is the whole point of
   * showing them where things are.
   */
  route?: string;
  /**
   * Marks a section as already explained, so the standalone hint for it
   * never repeats what Han just said. One list serves both.
   */
  hintId?: string;
  pose: HanPose;
  /**
   * Copy is read out of the dictionary rather than stored here, so no
   * user-facing string lives in this file and both locales stay in one place.
   */
  copy: (messages: TourMessages) => TourStepCopy;
  /** Bring the anchor into view before the card appears. */
  scrollIntoView?: boolean;
}

/**
 * First leg: seven steps, all on the dashboard (2026-09-23). Nothing here
 * changes the page the learner is on.
 *
 * The pose carries as much as the copy. `wave` bookends the leg, `idle`
 * delivers plain facts, `celebrating` lands on the one metric that is a
 * reward, `thinking` marks the study moment and `heart` introduces Han
 * himself. `wrong` is the one pose the tour never uses: nobody fails here.
 */
export const WELCOME_TOUR: TourStep[] = [
  {
    id: "welcome",
    anchor: null,
    pose: "wave",
    copy: (messages) => ({
      eyebrow: messages.welcome.eyebrow,
      title: messages.welcome.title,
      body: messages.welcome.body,
    }),
  },
  {
    id: "next-step",
    anchor: "dashboard-hero",
    pose: "curious",
    copy: (messages) => ({
      eyebrow: messages.nextStep.eyebrow,
      body: messages.nextStep.body,
    }),
  },
  {
    id: "streak",
    anchor: "dashboard-streak",
    pose: "idle",
    copy: (messages) => ({
      eyebrow: messages.streak.eyebrow,
      body: messages.streak.body,
    }),
  },
  {
    id: "experience",
    anchor: "dashboard-experience",
    pose: "celebrating",
    copy: (messages) => ({
      eyebrow: messages.experience.eyebrow,
      body: messages.experience.body,
    }),
  },
  {
    // The only step that moves the page: both cards it talks about sit
    // below the fold on a phone.
    id: "words",
    anchor: "dashboard-words",
    pose: "thinking",
    scrollIntoView: true,
    copy: (messages) => ({
      eyebrow: messages.words.eyebrow,
      body: messages.words.body,
    }),
  },
  {
    // After the words on purpose: by now the learner has seen actual
    // Chinese on screen, so "ask me what you don't understand" has
    // something to refer to instead of being an empty promise.
    id: "bubble",
    anchor: "han-bubble",
    pose: "heart",
    copy: (messages) => ({
      eyebrow: messages.bubble.eyebrow,
      body: messages.bubble.body,
    }),
  },
  {
    // Does two jobs: points at the nav, so even someone who stops here has
    // seen where everything lives, and offers the second leg rather than
    // simply ending.
    id: "navigation",
    anchor: "primary-nav",
    pose: "wave",
    copy: (messages) => ({
      eyebrow: messages.navigation.eyebrow,
      body: messages.navigation.body,
    }),
  },
];

/**
 * Second leg: five places to open, offered at the end of the first and
 * never forced (2026-09-23, revised after review).
 *
 * It exists because per-section hints alone were not enough: a hint only
 * fires when the learner reaches the section, so anything they never think
 * to open stays invisible forever. This leg makes the breadth of the app
 * knowable without making thirteen steps compulsory.
 *
 * **The learner does the navigating.** An earlier version pushed the route
 * itself, which taught nobody anything - being teleported somewhere is not
 * the same as learning where it lives. Each step now dims the screen,
 * spotlights the menu entry, and Han says to press it; arriving is what
 * moves the tour on.
 *
 * Writing Lab shares the Learning menu with the journey rather than having
 * a tab of its own, so its step points at that same entry and the copy says
 * which item to pick inside it. Speaking Lab gets no separate navigation
 * step so this optional leg stays short; the Writing step points out its
 * three guided beta stations, and the first-visit hint explains their
 * listen/read/repeat loop once the learner opens the Lab.
 *
 * Settings closes the leg without a target. It is reached from the user
 * menu, which only exists on the home screen, so spotlighting it from here
 * would point at something that isn't on the page.
 */
export const SECTION_TOUR: TourStep[] = [
  {
    id: "journey",
    anchor: "nav-learning",
    route: "/learning-journey",
    hintId: "journey",
    pose: "curious",
    copy: (messages) => ({
      eyebrow: messages.sections.journey.eyebrow,
      body: messages.sections.journey.body,
    }),
  },
  {
    id: "writing",
    anchor: "nav-learning",
    route: "/writing-lab",
    hintId: "writingLab",
    pose: "thinking",
    copy: (messages) => ({
      eyebrow: messages.sections.writing.eyebrow,
      body: messages.sections.writing.body,
    }),
  },
  {
    id: "han",
    anchor: "nav-han",
    route: "/han",
    hintId: "han",
    pose: "heart",
    copy: (messages) => ({
      eyebrow: messages.sections.han.eyebrow,
      body: messages.sections.han.body,
    }),
  },
  {
    id: "progress",
    anchor: "nav-progress",
    route: "/progress",
    hintId: "progress",
    pose: "idle",
    copy: (messages) => ({
      eyebrow: messages.sections.progress.eyebrow,
      body: messages.sections.progress.body,
    }),
  },
  {
    id: "shop",
    anchor: "nav-shop",
    route: "/tienda",
    hintId: "shop",
    pose: "celebrating",
    copy: (messages) => ({
      eyebrow: messages.sections.shop.eyebrow,
      body: messages.sections.shop.body,
    }),
  },
  {
    // No route and no anchor: the closing word, not another errand.
    id: "settings",
    anchor: null,
    hintId: "settings",
    pose: "wave",
    copy: (messages) => ({
      eyebrow: messages.sections.settings.eyebrow,
      body: messages.sections.settings.body,
    }),
  },
];

export type TourLeg = "welcome" | "sections";

export function stepsForLeg(leg: TourLeg): TourStep[] {
  return leg === "welcome" ? WELCOME_TOUR : SECTION_TOUR;
}
