import Link from "next/link";
import { Briefcase, Clapperboard, Brain } from "lucide-react";
import { HanMascot } from "@/components/ui/han-mascot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Display,
  SectionTitle,
  CardTitle,
  Body,
  Supporting,
  Caption,
} from "@/components/ui/typography";
import { SayChip } from "@/components/welcome-to-chinese/say-chip";
import { ToneDemo } from "@/components/welcome-to-chinese/tone-demo";
import { WordRevealGrid } from "@/components/welcome-to-chinese/word-reveal-grid";
import { FlipFactCard } from "@/components/welcome-to-chinese/flip-fact-card";
import { SentenceBuilder } from "@/components/welcome-to-chinese/sentence-builder";
import { NumberPatternDemo } from "@/components/welcome-to-chinese/number-pattern-demo";

const PRONOUNS_SINGULAR = [
  { han: "我", pinyin: "wǒ", meaning: "I" },
  { han: "你", pinyin: "nǐ", meaning: "you" },
  { han: "他", pinyin: "tā", meaning: "he" },
  { han: "她", pinyin: "tā", meaning: "she" },
];

/** Same 4 characters, same order, each with 们 appended - the visual alignment with PRONOUNS_SINGULAR above is the point: it shows the suffix pattern instead of stating it. */
const PRONOUNS_PLURAL = [
  { han: "我们", pinyin: "wǒmen", meaning: "we" },
  { han: "你们", pinyin: "nǐmen", meaning: "you (plural)" },
  { han: "他们", pinyin: "tāmen", meaning: "they (mixed/male)" },
  { han: "她们", pinyin: "tāmen", meaning: "they (female)" },
];

const NUMBERS = [
  { han: "一", pinyin: "yī", meaning: "1" },
  { han: "二", pinyin: "èr", meaning: "2" },
  { han: "三", pinyin: "sān", meaning: "3" },
  { han: "四", pinyin: "sì", meaning: "4" },
  { han: "五", pinyin: "wǔ", meaning: "5" },
  { han: "六", pinyin: "liù", meaning: "6" },
  { han: "七", pinyin: "qī", meaning: "7" },
  { han: "八", pinyin: "bā", meaning: "8" },
  { han: "九", pinyin: "jiǔ", meaning: "9" },
  { han: "十", pinyin: "shí", meaning: "10" },
];

const COURTESY = [
  { han: "你好", pinyin: "nǐ hǎo", meaning: "hello" },
  { han: "再见", pinyin: "zàijiàn", meaning: "goodbye" },
  { han: "谢谢", pinyin: "xièxie", meaning: "thank you" },
  { han: "不客气", pinyin: "bú kèqi", meaning: "you're welcome" },
  { han: "对不起", pinyin: "duìbuqǐ", meaning: "sorry" },
  { han: "没关系", pinyin: "méi guānxi", meaning: "no problem" },
];

/**
 * Welcome to Chinese (2026-08-24) - a permanent, ungraded companion page,
 * not a Learning Journey chapter: cultural context + motivation, an honest
 * look at what's hard, and the absolute-beginner mechanics Foundations
 * itself never teaches explicitly (pronouns, 是, numbers 1-10, courtesy -
 * see docs/02_academy/informe_academico_hango.md Section 10.4's audit).
 * Deliberately outside the General Level entirely - nothing here is scored
 * or tracked, and this page never disappears from the Dashboard regardless
 * of how far along a learner is.
 */
export default function WelcomeToChinesePage() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 rounded-panel bg-linear-to-br from-primary-500/10 to-secondary-500/10 p-6 text-center sm:flex-row sm:items-start sm:p-10 sm:text-left">
        <HanMascot pose="wave" size={120} className="shrink-0" />
        <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
          <Caption className="font-semibold tracking-wide text-accent-300 uppercase">
            Before your first scenario
          </Caption>
          <Display className="max-w-xl">
            Chinese doesn&apos;t look like anything you&apos;ve studied
            before.
          </Display>
          <Body className="max-w-lg text-text-secondary">
            And that&apos;s exactly what makes it fascinating. Before your
            first lesson, here&apos;s what you need to know — why it
            matters, what makes it different, and the basics nobody&apos;s
            taught you yet.
          </Body>
          <SayChip han="你好" pinyin="nǐ hǎo" />
          <Caption>Tap the bubble — that&apos;s how you&apos;ll greet Han in a minute.</Caption>
        </div>
      </section>

      {/* Why */}
      <section className="flex flex-col gap-6">
        <div>
          <Caption className="font-semibold tracking-wide text-accent-300 uppercase">
            Why
          </Caption>
          <SectionTitle className="mt-1">
            It&apos;s not just another language on your list.
          </SectionTitle>
          <Body className="mt-2 text-text-secondary">
            It&apos;s a different door into three things at once.
          </Body>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <Briefcase className="size-6 text-secondary-400" aria-hidden="true" />
            <CardTitle className="mt-3">Professional</CardTitle>
            <Supporting className="mt-1.5">
              China is the world&apos;s second-largest economy. Speaking
              Mandarin puts you in a conversation almost no one else in your
              field can enter without a translator.
            </Supporting>
          </Card>
          <Card>
            <Clapperboard className="size-6 text-secondary-400" aria-hidden="true" />
            <CardTitle className="mt-3">Cultural</CardTitle>
            <Supporting className="mt-1.5">
              Film, literature, philosophy, and music you currently only
              reach through subtitles — and something always gets lost in
              translation.
            </Supporting>
          </Card>
          <Card>
            <Brain className="size-6 text-secondary-400" aria-hidden="true" />
            <CardTitle className="mt-3">Cognitive</CardTitle>
            <Supporting className="mt-1.5">
              A tonal, logographic language asks something of your brain
              that no Romance language ever did. It&apos;s literally new
              training.
            </Supporting>
          </Card>
        </div>
      </section>

      {/* What makes it different */}
      <section className="flex flex-col gap-6">
        <div>
          <Caption className="font-semibold tracking-wide text-accent-300 uppercase">
            What makes it different
          </Caption>
          <SectionTitle className="mt-1">
            Forget the rules you already know.
          </SectionTitle>
          <Body className="mt-2 text-text-secondary">Tap each card.</Body>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FlipFactCard
            tag="01"
            front="No alphabet"
            backTitle="Characters, not letters"
            backBody={'Each character represents a whole idea, not an isolated sound. 木 means "tree." Two trees together, 林, become "forest." Three, 森, become "dense forest."'}
          />
          <FlipFactCard
            tag="02"
            front="It's tonal"
            backTitle="The melody changes the meaning"
            backBody={'The same syllable, "ma," means four different things depending on the tone: mom, hemp, horse, or scold. Try it below.'}
          />
          <FlipFactCard
            tag="03"
            front="No conjugations"
            backTitle="A relief, not an obstacle"
            backBody="No verb ever changes form. No gender, no mandatory plural. In several ways, Chinese grammar is simpler than Spanish or English."
          />
          <FlipFactCard
            tag="04"
            front="Measure words"
            backTitle="One extra word, oddly charming"
            backBody={'You don’t say "a book," you say "one-copy book" (一本书). Every type of object gets its own counting word. Strange at first, easy to love.'}
          />
        </div>
      </section>

      {/* What you'll have to deal with */}
      <section className="flex flex-col gap-6 rounded-panel bg-surface p-6 sm:p-10">
        <div>
          <Caption className="font-semibold tracking-wide text-accent-300 uppercase">
            What you&apos;ll have to deal with
          </Caption>
          <SectionTitle className="mt-1">No empty promises.</SectionTitle>
          <Body className="mt-2 text-text-secondary">
            This part really is hard — and it&apos;s still doable.
          </Body>
        </div>
        <div className="flex flex-col divide-y divide-dashed divide-border">
          {[
            {
              title: "At first, every tone is going to sound the same",
              body: "That's normal. Your ear trains through repeated exposure, not willpower. In a few weeks you'll tell them apart without thinking.",
            },
            {
              title: "Memorizing characters takes time — but it isn't random",
              body: "You're not memorizing loose drawings. Most characters are built from reusable pieces (radicals) that show up again and again.",
            },
            {
              title: "Almost nothing looks like Spanish or English",
              body: "No cognates to give you a shortcut. New vocabulary feels slower to gain at first — and it speeds up over time.",
            },
          ].map((item, index) => (
            <div key={item.title} className="grid grid-cols-[2.75rem_1fr] gap-4 py-4 first:pt-0 last:pb-0">
              <span className="font-display text-2xl text-primary-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <CardTitle>{item.title}</CardTitle>
                <Supporting className="mt-1.5">{item.body}</Supporting>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fun facts */}
      <section className="flex flex-col gap-6">
        <div>
          <Caption className="font-semibold tracking-wide text-accent-300 uppercase">
            Fun facts
          </Caption>
          <SectionTitle className="mt-1">
            Things worth showing off in week one.
          </SectionTitle>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[
            {
              han: "好",
              body: '"Good" (hǎo) is literally "woman" (女) + "child" (子) — a mother with her son.',
              src: "Character composition",
            },
            {
              han: "人",
              body: "Chinese is the oldest continuously used writing system in the world — over 3,000 years without ever falling out of use.",
              src: "Writing history",
            },
            {
              han: "木林森",
              body: 'One tree (木), two trees (林 = "forest"), three trees (森 = "dense forest"). Chinese literally builds meaning by repetition.',
              src: "Character composition",
            },
            {
              han: "哈",
              body: "Mandarin has more native speakers than any other language on Earth — more than Spanish or English.",
              src: "Language demographics",
            },
            {
              han: "谢谢",
              body: '"Thank you" (谢谢) is said by repeating the same character twice — a pattern you’ll see again and again in everyday Chinese.',
              src: "Repetition pattern",
            },
          ].map((fact) => (
            <Card
              key={fact.han}
              className="w-64 shrink-0"
            >
              <span className="font-chinese text-3xl text-accent-300">
                {fact.han}
              </span>
              <Supporting className="mt-3">{fact.body}</Supporting>
              <Caption className="mt-2 block">{fact.src}</Caption>
            </Card>
          ))}
        </div>
      </section>

      {/* The basics */}
      <section className="flex flex-col gap-6">
        <div>
          <Caption className="font-semibold tracking-wide text-accent-300 uppercase">
            Before your first lesson
          </Caption>
          <SectionTitle className="mt-1">
            The basics nobody&apos;s taught you yet.
          </SectionTitle>
          <Body className="mt-2 text-text-secondary">
            No score, no evaluation — just explore. Come back here anytime.
          </Body>
        </div>

        <div className="rounded-panel bg-surface p-6 sm:p-8">
          <CardTitle>Pinyin and the four tones</CardTitle>
          <Supporting className="mt-1.5 max-w-xl">
            The same syllable, &ldquo;ma,&rdquo; with four different
            melodies — four completely different words. Tap each one to
            hear it.
          </Supporting>
          <div className="mt-6">
            <ToneDemo />
          </div>
        </div>

        <div className="rounded-panel bg-surface p-6 sm:p-8">
          <CardTitle>Pronouns</CardTitle>
          <Supporting className="mt-1.5 max-w-xl">
            Tap each card to reveal the pinyin and meaning.
          </Supporting>
          <div className="mt-6">
            <WordRevealGrid words={PRONOUNS_SINGULAR} />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" aria-hidden="true" />
            <Caption>Add 们 (men) to make any of these plural</Caption>
            <div className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          <div className="mt-6">
            <WordRevealGrid words={PRONOUNS_PLURAL} />
          </div>
        </div>

        <div className="rounded-panel bg-surface p-6 sm:p-8">
          <CardTitle>Numbers</CardTitle>
          <Supporting className="mt-1.5 max-w-xl">
            Tap each card to reveal the pinyin and meaning.
          </Supporting>
          <div className="mt-6">
            <WordRevealGrid words={NUMBERS} />
          </div>
          <div className="mt-8">
            <CardTitle className="text-card-title">
              Bonus: 11 through 99 is just arithmetic
            </CardTitle>
            <Supporting className="mt-1.5 max-w-xl">
              Unlike &ldquo;eleven&rdquo; or &ldquo;twenty,&rdquo; Chinese
              numbers past ten are built from the ones you already know.
            </Supporting>
            <div className="mt-4">
              <NumberPatternDemo />
            </div>
          </div>
        </div>

        <div className="rounded-panel bg-surface p-6 sm:p-8">
          <CardTitle>是 — the verb &ldquo;to be&rdquo;</CardTitle>
          <Supporting className="mt-1.5 max-w-xl">
            Chinese&apos;s simplest pattern: Subject + 是 + Noun.
          </Supporting>
          <div className="mt-6">
            <SentenceBuilder
              pieces={[
                { han: "我", pinyin: "wǒ · I" },
                { han: "是", pinyin: "shì · to be", emphasize: true },
                { han: "学生", pinyin: "xuésheng · student" },
              ]}
              fullSentence="我是学生"
              translation="I am a student."
              note="Always this direct."
            />
          </div>
          <div className="mt-8 border-t border-border pt-8">
            <CardTitle className="text-card-title">
              Now put a pronoun and a number together
            </CardTitle>
            <Supporting className="mt-1.5 max-w-xl">
              These aren&apos;t just separate word lists — you can already
              combine them.
            </Supporting>
            <div className="mt-4">
              <SentenceBuilder
                pieces={[
                  { han: "我", pinyin: "wǒ · I" },
                  { han: "十八", pinyin: "shíbā · 18" },
                  { han: "岁", pinyin: "suì · years old" },
                ]}
                fullSentence="我十八岁"
                translation="I am 18 years old."
                note="Ages skip 是 entirely — a common early surprise."
                playLabel="Play this example"
              />
            </div>
          </div>
        </div>

        <div className="rounded-panel bg-surface p-6 sm:p-8">
          <CardTitle>Everyday courtesy</CardTitle>
          <Supporting className="mt-1.5 max-w-xl">
            The six words you&apos;ll use in your first conversation with
            Han.
          </Supporting>
          <div className="mt-6 flex flex-wrap gap-3">
            {COURTESY.map((word) => (
              <SayChip key={word.han} {...word} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="flex flex-col items-center gap-4 rounded-panel bg-linear-to-br from-primary-500/10 to-secondary-500/10 p-10 text-center">
        <HanMascot pose="heart" size={100} />
        <SectionTitle className="max-w-md">
          Han is waiting for you in your first scenario.
        </SectionTitle>
        <Body className="max-w-sm text-text-secondary">
          Foundations starts with the simplest thing: greeting you and
          asking your name.
        </Body>
        <Link href="/learning-journey">
          <Button type="button" className="mt-2">
            Start my first scenario →
          </Button>
        </Link>
      </section>

      <Caption className="text-center">
        Come back to this page whenever you want — it never disappears, and
        it never counts toward your General Level.
      </Caption>
    </div>
  );
}
