import type {
  JourneyQualityContext,
  JourneyQualityTarget,
} from "./journey-speaking-quality-candidate";
import { hasUncertainJourneyRecognition } from "./journey-speaking-attempt-contract";

const restaurant = "restaurant-entering-and-ordering";
const contract = "negotiating-job-contract-reviewing-contract-terms";
const bindings = [
  {
    slug: restaurant,
    rule: "restaurant-order-dish-v1",
    labels: ["Order at least one dish", "Pedir al menos un plato"],
  },
  {
    slug: restaurant,
    rule: "restaurant-order-drink-v1",
    labels: ["Order at least one drink", "Pedir al menos una bebida"],
  },
  {
    slug: restaurant,
    rule: "restaurant-ask-spicy-v1",
    labels: [
      "Ask whether the dish is spicy",
      "Preguntar si el plato es picante",
    ],
  },
  {
    slug: contract,
    rule: "contract-ask-scope-v1",
    labels: [
      "Ask about a clause's scope using 具体涵盖哪些范围",
      "Pregunta por el alcance de una cláusula usando 具体涵盖哪些范围",
    ],
  },
  {
    slug: contract,
    rule: "contract-pushback-v1",
    labels: [
      "Diplomatically push back using 是不是有点",
      "Cuestiona diplomáticamente una condición usando 是不是有点",
    ],
  },
  {
    slug: contract,
    rule: "contract-request-written-v1",
    labels: [
      "Request written documentation",
      "Solicita documentación por escrito",
    ],
  },
] as const;
export type ScenarioActEvidenceRule = (typeof bindings)[number]["rule"];
export function isScenarioActEvidenceRule(
  rule: string,
): rule is ScenarioActEvidenceRule {
  return bindings.some((item) => item.rule === rule);
}
export function scenarioActEvidenceRule(
  slug: string,
  target: JourneyQualityTarget,
): ScenarioActEvidenceRule | null {
  return target.kind === "act"
    ? (bindings.find(
        (item) =>
          item.slug === slug &&
          (item.labels as readonly string[]).includes(target.text),
      )?.rule ?? null)
    : null;
}
// Deliberately small editorial examples, NOT allowable menu restrictions.
// Unlisted choices and complex paraphrases are unresolved, never learner errors.
const dish = "(?:宫保鸡丁|炒饭|米饭|面条|饺子|牛肉面|青菜|豆腐)";
const drink = "(?:水|茶|咖啡|果汁|可乐|牛奶|啤酒|绿茶|红茶|矿泉水)";
const quantity =
  "(?:(?:一|两|二|三|四|五|六|七|八|九|十|[1-9][0-9]?)(?:份|碗|盘|个|杯|瓶)?)?";
const food = new RegExp(`^${quantity}${dish}$`, "u");
const beverage = new RegExp(`^${quantity}${drink}$`, "u");
type Cue =
  | "dish"
  | "drink"
  | "spicy"
  | "spicy-ellipsis"
  | "bare-dish"
  | "bare-drink"
  | "scope"
  | "scope-ellipsis"
  | "pushback"
  | "written"
  | "neutral";
function parts(text: string): string[] | null {
  if (!text || text.length > 240 || /[“”"「」『』:：]/u.test(text)) return null;
  const chunks = text
    .replace(/\s/gu, "")
    .split(/[，,。！!？?；;\n]/u)
    .filter(Boolean);
  return chunks.length ? chunks : null;
}
function restaurantCues(text: string): Cue[] | null {
  const chunks = parts(text);
  if (!chunks) return null;
  const cues: Cue[] = [];
  for (const chunk of chunks) {
    if (
      /^(?:你好|您好|谢谢|好的|服务员|不要辣|清淡一点|[一两二三四五六七八九十]位)$/u.test(
        chunk,
      )
    ) {
      cues.push("neutral");
      continue;
    }
    if (
      new RegExp(
        `^(?:这个菜|这道菜|${dish})(?:辣吗|辣不辣|是不是辣的)$`,
        "u",
      ).test(chunk)
    ) {
      cues.push("spicy");
      continue;
    }
    if (/^(?:辣吗|辣不辣)$/u.test(chunk)) {
      cues.push("spicy-ellipsis");
      continue;
    }
    const request = chunk.match(
      /^(?:我想点|我要点|我想要|我想|我要|请给我|麻烦给我|给我|来)(.+)$/u,
    );
    if (request) {
      const items = request[1]!.split(/和|还有/u);
      if (
        !items.length ||
        items.some((item) => !food.test(item) && !beverage.test(item))
      )
        return null;
      cues.push(
        ...items.map((item): Cue => (food.test(item) ? "dish" : "drink")),
      );
    } else if (food.test(chunk)) cues.push("bare-dish");
    else if (beverage.test(chunk)) cues.push("bare-drink");
    else return null;
  }
  return cues;
}
const term =
  "(?:这条条款|这一条条款|这个条款|这条|竞业限制|保密条款|试用期|考核条款)";
function contractCues(text: string): Cue[] | null {
  const chunks = parts(text);
  if (!chunks) return null;
  const cues: Cue[] = [];
  for (const chunk of chunks) {
    if (/^(?:你好|您好|谢谢|好的|请问)$/u.test(chunk)) cues.push("neutral");
    else if (
      new RegExp(
        `^(?:请问)?${term}(?:具体)?(?:涵盖|包括|涉及)(?:哪些|什么)(?:范围|内容|方面|工作)?$`,
        "u",
      ).test(chunk) ||
      new RegExp(
        `^(?:请问)?${term}的(?:适用范围|范围)(?:具体)?是什么$`,
        "u",
      ).test(chunk)
    )
      cues.push("scope");
    else if (/^(?:具体)?涵盖哪些范围$/u.test(chunk))
      cues.push("scope-ellipsis");
    else if (
      /^(?:我觉得)?(?:这个|这条)?(?:期限|范围|条款|要求|限制|条件)(?:是不是|是否)(?:有点|过于)(?:长|短|宽|严格|苛刻|不合理)$/u.test(
        chunk,
      ) ||
      /^(?:这个|这条)?(?:期限|范围|条款|要求|限制|条件)(?:可能)?(?:有些|有点|过于)(?:长|短|宽|严格|苛刻|不合理)$/u.test(
        chunk,
      ) ||
      /^这个期限可以缩短一点吗$/u.test(chunk)
    )
      cues.push("pushback");
    else if (
      /^(?:(?:可以|能否|能不能)(?:请您|请你)?(?:提供|给我)|请(?:提供|给我)|我想要)(?:一份)?(?:书面说明|书面文件|书面确认)(?:吗)?$/u.test(
        chunk,
      ) ||
      /^能不能把(?:这些内容|这个约定|刚才说的内容)写进(?:合同|书面文件)(?:里)?$/u.test(
        chunk,
      ) ||
      /^可以用邮件确认吗$/u.test(chunk)
    )
      cues.push("written");
    else return null;
  }
  return cues;
}

/** Only communication patterns; no grammar mastery, diplomatic register grade,
 * agreement/legal validity, native-like speech, or opportunity inference. */
export function probeScenarioActEvidence(
  rule: ScenarioActEvidenceRule,
  quote: string,
  turnId: string,
  context: JourneyQualityContext,
): "PATTERN_SUPPORTED" | "NEEDS_REVIEW" {
  const binding = bindings.find((item) => item.rule === rule)!;
  const turn = context.turns.find((item) => item.id === turnId);
  if (
    context.lessonSlug !== binding.slug ||
    !turn ||
    turn.role !== "user" ||
    hasUncertainJourneyRecognition(turn) ||
    !turn.content.includes(quote)
  )
    return "NEEDS_REVIEW";
  const parse = binding.slug === restaurant ? restaurantCues : contractCues;
  const whole = parse(turn.content),
    selected = parse(quote);
  if (!whole || !selected) return "NEEDS_REVIEW";
  const previous = context.turns.find(
    (item) => item.role === "assistant" && item.sequence === turn.sequence - 1,
  );
  // A clipped bare item must not borrow a prompt while hiding a different local
  // intent. Only an entire, otherwise neutral learner turn may use ellipsis.
  const contextual =
    quote === turn.content &&
    selected.every((cue) =>
      [
        "bare-dish",
        "bare-drink",
        "spicy-ellipsis",
        "scope-ellipsis",
        "neutral",
      ].includes(cue),
    );
  let supported = false;
  switch (rule) {
    case "restaurant-order-dish-v1":
      supported =
        selected.includes("dish") ||
        (contextual &&
          selected.includes("bare-dish") &&
          /^(?:请问)?(?:您|你)(?:想吃什么|要点什么菜|想点什么菜)[？?。]*$/u.test(
            previous?.content.replace(/\s/gu, "") ?? "",
          ));
      break;
    case "restaurant-order-drink-v1":
      supported =
        selected.includes("drink") ||
        (contextual &&
          selected.includes("bare-drink") &&
          /^(?:请问)?(?:您|你)(?:想喝什么|要喝什么|喝什么)[？?。]*$/u.test(
            previous?.content.replace(/\s/gu, "") ?? "",
          ));
      break;
    case "restaurant-ask-spicy-v1":
      supported =
        selected.includes("spicy") ||
        (selected.includes("spicy-ellipsis") && selected.includes("dish")) ||
        (contextual &&
          selected.includes("spicy-ellipsis") &&
          new RegExp(
            `^(?:您|你)要(?:这个菜|这道菜|${dish})吗[？?。]*$`,
            "u",
          ).test(previous?.content.replace(/\s/gu, "") ?? ""));
      break;
    case "contract-ask-scope-v1":
      supported =
        selected.includes("scope") ||
        (contextual &&
          selected.includes("scope-ellipsis") &&
          /^(?:我们|现在我们)(?:来)?(?:讨论|看一下)(?:竞业限制|保密条款|试用期|考核条款)[。！!]*$/u.test(
            previous?.content.replace(/\s/gu, "") ?? "",
          ));
      break;
    case "contract-pushback-v1":
      supported = selected.includes("pushback");
      break;
    case "contract-request-written-v1":
      supported = selected.includes("written");
      break;
  }
  return supported ? "PATTERN_SUPPORTED" : "NEEDS_REVIEW";
}
