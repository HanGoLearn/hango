import {
  User,
  GraduationCap,
  LifeBuoy,
  Palette,
  Shield,
  UserCog,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { getAvatarPageData } from "@/lib/avatar-data";
import { PageTitle, SectionTitle, Caption } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { HanAvatar } from "@/components/ui/han-mascot";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { AiConversationStorageToggle } from "@/components/settings/ai-conversation-storage-toggle";
import { AccountNameSection } from "@/components/settings/account-name-section";
import { DisplayNameSection } from "@/components/settings/display-name-section";
import { AvatarSection } from "@/components/settings/avatar-section";
import { LearningPreferencesSection } from "@/components/settings/learning-preferences-section";
import { RecordingRetentionSelect } from "@/components/settings/recording-retention-select";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { HanAudioSettings } from "@/components/settings/han-audio-settings";
import { TourSection } from "@/components/settings/tour-section";
import { interfaceLanguageFromLocale, isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Redesigned 2026-08-21 (user request, third of three directions compared
 * in an artifact - project/learning-journey-optimization.md): purely
 * visual/structural, no new queries - same two fetches as before, only how
 * the same data is grouped and labeled on the page changes.
 *
 * Two real fixes: (1) 4 of the 5 section badges used text-neutral-0/900 on
 * a non-inverting brand fill, the same on-color-token bug already fixed
 * ~35+ times elsewhere this session - this page predates that sweep and
 * was missed. (2) Han's settings were scattered across three unrelated
 * sections (Learning had explanation language/correction style, "Han" had
 * just the mode select, "Audio" had voice, "Privacy" had the memory
 * toggle) with no indication they were related - default mode, voice, and
 * memory now live together under one "Han" section. Explanation language
 * and correction style stay under Learning - they're fields inside
 * LearningPreferencesSection's single form/server action, and splitting
 * that into a separate submission is a behavior change, not a visual one.
 *
 * Also new: an Appearance section - the dual-theme toggle already exists
 * (top-bar.tsx, every screen) but had no home inside Settings at all,
 * despite ui.md documenting one. Reuses <ThemeToggle /> directly rather
 * than a second theme-switching implementation, so there's exactly one
 * place this logic lives.
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const locale = localeParam;
  const dictionary = await getDictionary(locale);
  const messages = dictionary.settings;
  const session = await auth();
  const userId = session!.user!.id!;
  const [profile, avatar] = await Promise.all([
    getOrCreateLearnerProfile(userId, interfaceLanguageFromLocale(locale)),
    getAvatarPageData(userId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageTitle>{messages.title}</PageTitle>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-accent-500"
          icon={
            <User className="size-4 text-on-color-dark" aria-hidden="true" />
          }
        >
          {messages.sections.profile}
        </SectionHeading>
        <Card className="flex flex-col gap-4">
          <DisplayNameSection
            initialDisplayName={profile.displayName ?? ""}
            locale={locale}
            messages={messages.displayName}
          />
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <AccountNameSection
              nickname={profile.nickname}
              locale={locale}
              messages={messages.accountName}
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        {/* Same "skip SectionHeading, the character art is its own badge"
            treatment as the Han section below (2026-08-30, user request -
            "en setting tampoco [aparece mi personaje]"). */}
        <SectionTitle>{messages.sections.avatar}</SectionTitle>
        <Card>
          <AvatarSection
            animal={avatar.animal}
            animalName={
              avatar.animal
                ? (dictionary.onboarding.avatar.animalNames[
                    avatar.animal as keyof typeof dictionary.onboarding.avatar.animalNames
                  ] ?? avatar.animalName)
                : null
            }
            equipped={avatar.equipped}
            coinBalance={avatar.coinBalance}
            locale={locale}
            messages={messages.avatar}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-primary-500"
          icon={
            <GraduationCap
              className="size-4 text-on-color-light"
              aria-hidden="true"
            />
          }
        >
          {messages.sections.learning}
        </SectionHeading>
        <Card>
          <LearningPreferencesSection
            locale={locale}
            messages={messages.learning}
            initialValues={{
              interfaceLanguage: profile.interfaceLanguage,
              explanationLanguage: profile.explanationLanguage ?? "EN",
              learningGoals: profile.learningGoals,
              skillPriorities: profile.skillPriorities,
              dailyStudyTargetMinutes: profile.dailyStudyTargetMinutes ?? 20,
              correctionStyle: profile.correctionStyle ?? "AFTER_CONVERSATION",
            }}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        {/* HanAvatar is already a circular badge on its own (Phase 6) — the
            square color-badge wrapper other sections use would just sit
            fully hidden behind it, so this row skips SectionHeading.
            Consolidated (2026-08-21): default mode, voice, and the
            conversation-memory toggle were three unrelated-looking
            sections before - all three are "how Han behaves," together. */}
        <div className="flex items-center gap-2">
          <HanAvatar pose="idle" size={28} />
          <SectionTitle>{messages.sections.han}</SectionTitle>
        </div>
        <Card className="flex flex-col gap-6">
          <HanAudioSettings
            initialResponseMode={profile.hanResponseMode}
            initialVoice={profile.hanVoice}
            messages={messages.han}
          />
          <AiConversationStorageToggle
            initialEnabled={profile.aiConversationStorageEnabled}
            messages={messages.han}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-info-500"
          icon={
            <Palette
              className="size-4 text-on-color-light"
              aria-hidden="true"
            />
          }
        >
          {messages.sections.appearance}
        </SectionHeading>
        <Card className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-interface text-body text-text-primary">
              {messages.appearance.theme}
            </span>
            <Caption className="text-text-secondary">
              {messages.appearance.description}
            </Caption>
          </div>
          <ThemeToggle messages={dictionary.shell.theme} />
        </Card>
        {/* Grouped with appearance rather than given a heading of its own:
            it is a preference about how the app presents itself, and a
            separate section for two buttons would overstate it. */}
        <Card>
          <TourSection messages={dictionary.tour} locale={locale} />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-secondary-300"
          icon={
            <Shield className="size-4 text-on-color-dark" aria-hidden="true" />
          }
        >
          {messages.sections.privacy}
        </SectionHeading>
        <Card>
          <RecordingRetentionSelect
            initialDays={profile.recordingRetentionDays}
            messages={messages.privacy}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-neutral-600"
          icon={
            <LifeBuoy className="size-4 text-neutral-50" aria-hidden="true" />
          }
        >
          {messages.sections.support}
        </SectionHeading>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="font-interface text-body font-semibold text-text-primary">
              {messages.support.title}
            </p>
            <Caption className="text-text-secondary">
              {messages.support.description}
            </Caption>
            <a
              href="mailto:arean.mendoza@unmsm.edu.pe"
              className="mt-1 w-fit rounded-control font-interface text-supporting font-semibold text-primary-400 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              {messages.support.emailLabel}: arean.mendoza@unmsm.edu.pe
            </a>
            <Caption className="text-text-muted">
              {messages.support.responseTime}
            </Caption>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-neutral-600"
          icon={
            <UserCog className="size-4 text-neutral-50" aria-hidden="true" />
          }
        >
          {messages.sections.account}
        </SectionHeading>
        <Card>
          <DeleteAccountButton
            locale={locale}
            messages={messages.deleteAccount}
          />
        </Card>
      </div>
    </div>
  );
}
