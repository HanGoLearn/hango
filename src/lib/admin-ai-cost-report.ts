import {
  aiFeatureDescriptor,
  type AiCostSection,
} from "@/lib/ai-feature-catalog";
import {
  AI_EXPERIENCES,
  AI_EXPERIENCE_IDS,
  featuresForExperience,
  recordedAiExperience,
} from "@/lib/ai-experiences";
export interface AdminAiCostRow {
  feature: string;
  experience?: string | null;
  provider: string;
  model: string;
  calls: number;
  costUsd: number;
  calculationMethod: string;
  durationSeconds: number;
  durationSource?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  inputRateUsdPerMillionTokens: number | null;
  outputRateUsdPerMillionTokens: number | null;
  audioRateUsdPerMinute: number | null;
}
export interface AdminAiCostGroup {
  id: string;
  label: string;
  description: string;
  section: AiCostSection;
  features: string[];
  calls: number;
  costUsd: number;
  rows: AdminAiCostRow[];
}
export function buildAdminAiCostReport(rows: readonly AdminAiCostRow[]) {
  const groups = new Map<string, AdminAiCostGroup>();
  for (const experience of AI_EXPERIENCE_IDS) {
    groups.set(experience, {
      id: experience,
      ...AI_EXPERIENCES[experience],
      features: featuresForExperience(experience),
      calls: 0,
      costUsd: 0,
      rows: [],
    });
  }
  for (const row of rows) {
    const experience = recordedAiExperience(row.feature, row.experience);
    const id = experience ?? `history:${row.feature}`;
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        label: aiFeatureDescriptor(row.feature)?.label ?? row.feature,
        description:
          "Histórico sin origen inequívoco. Se conserva el costo sin descontarlo de una experiencia inventada.",
        section: "HISTORY",
        features: [row.feature],
        calls: 0,
        costUsd: 0,
        rows: [],
      };
      groups.set(id, group);
    }
    group.calls += row.calls;
    group.costUsd += row.costUsd;
    group.rows.push(row);
  }
  const all = [...groups.values()].sort((a, b) => b.costUsd - a.costUsd);
  const interactive = all.filter((group) => group.section === "INTERACTIVE");
  const shared = all.filter((group) => group.section === "SHARED_CONTENT");
  const history = all.filter((group) => group.section === "HISTORY");
  const sum = (items: AdminAiCostGroup[]) =>
    items.reduce((total, group) => total + group.costUsd, 0);
  return {
    interactive,
    shared,
    history,
    interactiveCostUsd: sum(interactive),
    sharedCostUsd: sum(shared),
    historyCostUsd: sum(history),
    totalCostUsd: sum(all),
    totalCalls: all.reduce((total, group) => total + group.calls, 0),
  };
}
