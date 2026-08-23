export const HANDWRITTEN_LEVELS = [
  "BASIC",
  "INTERMEDIATE",
  "ADVANCED",
] as const;
export type HandwrittenLevel = (typeof HANDWRITTEN_LEVELS)[number];

export const HANDWRITTEN_TOPICS = ["FAMILY", "ROUTINE", "SHOPPING"] as const;
export type HandwrittenTopic = (typeof HANDWRITTEN_TOPICS)[number];

export interface HandwrittenDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
}

export interface HandwrittenEvaluation {
  overallScore: number;
  characterCount: number;
  targetRange: string;
  dimensions: HandwrittenDimension[];
  problemCharacters: { character: string; issue: string }[];
  cohesionNotes: string | null;
  correctedVersion: string;
  errors: {
    type: "character" | "grammar" | "vocabulary";
    description: string;
  }[];
  overallNotes: string;
  strokeOrderDisclaimer: string;
}

export type HandwrittenSubmissionResult =
  | { readable: false; reason: string }
  | { readable: true; evaluation: HandwrittenEvaluation };

interface LevelConfig {
  label: string;
  lineTarget: string;
  characterTarget: string;
  minimumCharacters: number;
  maximumCharacters: number | null;
  rubric: { key: string; label: string; weight: number }[];
}

export const HANDWRITTEN_LEVEL_CONFIG: Record<HandwrittenLevel, LevelConfig> = {
  BASIC: {
    label: "Basic",
    lineTarget: "About 5–6 handwritten lines",
    characterTarget: "About 60–90 Chinese characters",
    minimumCharacters: 60,
    maximumCharacters: 90,
    rubric: [
      {
        key: "legibility",
        label: "Legibility and character formation",
        weight: 25,
      },
      { key: "topicFulfillment", label: "Topic and target length", weight: 20 },
      {
        key: "sentenceConstruction",
        label: "Sentence construction",
        weight: 20,
      },
      { key: "grammar", label: "Basic grammar", weight: 15 },
      { key: "vocabulary", label: "Vocabulary", weight: 10 },
      { key: "clarity", label: "Clarity of meaning", weight: 10 },
    ],
  },
  INTERMEDIATE: {
    label: "Intermediate",
    lineTarget: "About 6–20 handwritten lines",
    characterTarget: "About 90–300 Chinese characters",
    minimumCharacters: 90,
    maximumCharacters: 300,
    rubric: [
      {
        key: "legibility",
        label: "Legibility and character formation",
        weight: 20,
      },
      {
        key: "topicFulfillment",
        label: "Topic development and target length",
        weight: 15,
      },
      { key: "grammar", label: "Grammar variety and accuracy", weight: 20 },
      {
        key: "vocabulary",
        label: "Vocabulary variety and precision",
        weight: 15,
      },
      { key: "cohesion", label: "Cohesion and transitions", weight: 20 },
      { key: "naturalness", label: "Naturalness", weight: 10 },
    ],
  },
  ADVANCED: {
    label: "Advanced",
    lineTarget: "20+ handwritten lines",
    characterTarget: "300+ Chinese characters",
    minimumCharacters: 300,
    maximumCharacters: null,
    rubric: [
      {
        key: "legibility",
        label: "Legibility and character formation",
        weight: 15,
      },
      { key: "contentDepth", label: "Depth and development", weight: 15 },
      { key: "grammar", label: "Control of complex grammar", weight: 20 },
      {
        key: "lexicalPrecision",
        label: "Lexical precision and register",
        weight: 20,
      },
      { key: "organization", label: "Cohesion and organization", weight: 20 },
      { key: "style", label: "Naturalness and style", weight: 10 },
    ],
  },
};

interface TopicConfig {
  label: string;
  prompts: Record<HandwrittenLevel, string>;
}

export const HANDWRITTEN_TOPIC_CONFIG: Record<HandwrittenTopic, TopicConfig> = {
  FAMILY: {
    label: "Family",
    prompts: {
      BASIC:
        "Introduce people in your family and write one simple fact about them.",
      INTERMEDIATE:
        "Describe your family, your relationships or routines, and one shared experience.",
      ADVANCED:
        "Discuss how family relationships, responsibilities, or values have influenced you.",
    },
  },
  ROUTINE: {
    label: "Daily routine",
    prompts: {
      BASIC:
        "Describe what you do from morning to evening. You can include times.",
      INTERMEDIATE:
        "Describe your routine, explain why you organize it that way, and mention a change.",
      ADVANCED:
        "Analyze how your routine affects your productivity or well-being and propose improvements.",
    },
  },
  SHOPPING: {
    label: "Shopping",
    prompts: {
      BASIC:
        "Describe something you buy, where you buy it, and details such as quantity, color, or price.",
      INTERMEDIATE:
        "Describe a shopping experience, compare options, and explain your final choice.",
      ADVANCED:
        "Discuss a purchasing decision considering price, quality, needs, and consumer habits.",
    },
  },
};

export function isHandwrittenLevel(value: unknown): value is HandwrittenLevel {
  return (
    typeof value === "string" &&
    HANDWRITTEN_LEVELS.includes(value as HandwrittenLevel)
  );
}

export function isHandwrittenTopic(value: unknown): value is HandwrittenTopic {
  return (
    typeof value === "string" &&
    HANDWRITTEN_TOPICS.includes(value as HandwrittenTopic)
  );
}
