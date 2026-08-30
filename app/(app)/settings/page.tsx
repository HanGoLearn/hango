import { User, GraduationCap, Palette, Shield, UserCog } from "lucide-react";
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
import { DefaultAiModeSelect } from "@/components/settings/default-ai-mode-select";
import { RecordingRetentionSelect } from "@/components/settings/recording-retention-select";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { HanAudioSettings } from "@/components/settings/han-audio-settings";

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
export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const [profile, avatar] = await Promise.all([
    getOrCreateLearnerProfile(userId),
    getAvatarPageData(userId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageTitle>Settings</PageTitle>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-accent-500"
          icon={
            <User className="size-4 text-on-color-dark" aria-hidden="true" />
          }
        >
          Profile
        </SectionHeading>
        <Card className="flex flex-col gap-4">
          <DisplayNameSection
            initialDisplayName={profile.displayName ?? ""}
          />
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <AccountNameSection nickname={profile.nickname} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        {/* Same "skip SectionHeading, the character art is its own badge"
            treatment as the Han section below (2026-08-30, user request -
            "en setting tampoco [aparece mi personaje]"). */}
        <SectionTitle>Avatar</SectionTitle>
        <Card>
          <AvatarSection
            animal={avatar.animal}
            animalName={avatar.animalName}
            equipped={avatar.equipped}
            coinBalance={avatar.coinBalance}
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
          Learning
        </SectionHeading>
        <Card>
          <LearningPreferencesSection
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
          <SectionTitle>Han</SectionTitle>
        </div>
        <Card className="flex flex-col gap-6">
          <DefaultAiModeSelect initialMode={profile.defaultAiMode} />
          <HanAudioSettings
            initialResponseMode={profile.hanResponseMode}
            initialVoice={profile.hanVoice}
          />
          <AiConversationStorageToggle
            initialEnabled={profile.aiConversationStorageEnabled}
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
          Appearance
        </SectionHeading>
        <Card className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-interface text-body text-text-primary">
              Theme
            </span>
            <Caption className="text-text-secondary">
              Light, dark, or match your system - this is the same control
              as the one in the top bar on every page.
            </Caption>
          </div>
          <ThemeToggle />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-secondary-300"
          icon={
            <Shield className="size-4 text-on-color-dark" aria-hidden="true" />
          }
        >
          Privacy
        </SectionHeading>
        <Card>
          <RecordingRetentionSelect
            initialDays={profile.recordingRetentionDays}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading
          badgeClassName="bg-neutral-600"
          icon={
            <UserCog className="size-4 text-neutral-50" aria-hidden="true" />
          }
        >
          Account
        </SectionHeading>
        <Card>
          <DeleteAccountButton />
        </Card>
      </div>
    </div>
  );
}
