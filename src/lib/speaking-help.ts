export interface SpeakingHelpPhrase {
  chinese: string;
  pinyin: string;
  english: string;
}

export interface SpeakingGrammarHint {
  name: string;
  structure: string;
  purpose: string | null;
  example: SpeakingHelpPhrase | null;
}

interface SpeakingHelpInput {
  learnerRole: string;
  vocabulary: Array<{ chineseForm: string; pinyin: string; meaning: string }>;
  grammar: Array<{
    name: string;
    structure: string;
    communicationPurpose: string | null;
    examples: Array<{
      chineseText: string;
      pinyin: string;
      translation: string;
    }>;
  }>;
  dialogues: Array<{
    lines: Array<{
      chineseText: string;
      pinyin: string;
      translation: string;
      speaker: { name: string; role: string | null };
    }>;
  }>;
}

function toPhrase(value: {
  chineseText: string;
  pinyin: string;
  translation: string;
}): SpeakingHelpPhrase {
  return {
    chinese: value.chineseText,
    pinyin: value.pinyin,
    english: value.translation,
  };
}

function isQuestion(phrase: SpeakingHelpPhrase): boolean {
  return /[?？]\s*$/u.test(phrase.chinese) || /\?\s*$/u.test(phrase.english);
}

function uniquePhrases(phrases: SpeakingHelpPhrase[]): SpeakingHelpPhrase[] {
  const seen = new Set<string>();
  return phrases.filter((phrase) => {
    const key = phrase.chinese.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildSpeakingHelp(input: SpeakingHelpInput) {
  const learnerRole = input.learnerRole.trim().toLowerCase();
  const allDialogueLines = input.dialogues.flatMap(
    (dialogue) => dialogue.lines,
  );
  const learnerLines = allDialogueLines.filter((line) => {
    const role = line.speaker.role?.trim().toLowerCase();
    const name = line.speaker.name.trim().toLowerCase();
    return role === learnerRole || name === learnerRole;
  });
  const grammarExamples = input.grammar.flatMap((point) => point.examples);
  const preferred = uniquePhrases([
    ...learnerLines.map(toPhrase),
    ...grammarExamples.map(toPhrase),
  ]);
  const allAuthored = uniquePhrases([
    ...preferred,
    ...allDialogueLines.map(toPhrase),
  ]);
  const questions = uniquePhrases([
    ...preferred.filter(isQuestion),
    ...allAuthored.filter(isQuestion),
  ]).slice(0, 4);

  return {
    vocabulary: input.vocabulary.slice(0, 8),
    grammar: input.grammar.slice(0, 4).map((point) => ({
      name: point.name,
      structure: point.structure,
      purpose: point.communicationPurpose,
      example: point.examples[0] ? toPhrase(point.examples[0]) : null,
    })),
    questions,
    thingsToSay: preferred.filter((phrase) => !isQuestion(phrase)).slice(0, 4),
  };
}
