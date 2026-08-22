import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { WebSocket } from "undici";
import { config } from "dotenv";
import {
  buildRealtimeSystemPrompt,
  type RolePlayContext,
} from "@/lib/ai-context";
import {
  buildRealtimeAssessmentTurnGuard,
  applyPlacementSpeakingTurnWindow,
  buildRealtimeClosingInstructions,
  buildRealtimeOpeningInstructions,
  buildRealtimeOpeningTurnGuard,
  buildRealtimeTurnInstructions,
  buildTextConversationAssessmentPrompt,
  ensurePendingLearnerQuestionIsAnswered,
  parseTextConversationAssessment,
  stabilizeConversationPracticeTargets,
  hasRepeatedRealtimeQuestionIntent,
  keepTimedSpeakingAssessmentOpen,
  REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT,
  shouldHoldRealtimeLearnerAction,
  type ConversationCompletionAssessment,
} from "@/lib/han-realtime";
import { OpenAiProvider } from "@/lib/ai/providers/openai";
import {
  buildPlacementSpeakingEvaluationPrompt,
  parsePlacementSpeakingEvaluation,
  PLACEMENT_SPEAKING_MAX_TURNS,
  PLACEMENT_SPEAKING_MIN_TURNS,
  PLACEMENT_SPEAKING_SCENARIOS,
} from "@/lib/placement-speaking";

config({ path: ".env.local", quiet: true });

type ScenarioCheck = {
  name: string;
  hsk: number;
  rolePlay: RolePlayContext;
  learnerTurns: string[];
  expectedEarliestEndAt?: number;
  useAudioInput?: boolean;
  placement?: boolean;
  behaviorCheck?: {
    ownershipPhrase?: string;
    learnerFirstUsesOwnershipPhraseTurn?: number;
    rejectRepeatedQuestions?: boolean;
  };
};

type RealtimeResponse = {
  transcript: string;
  audio: Buffer;
  output: unknown[];
  error?: string;
};

const scenarios: ScenarioCheck[] = [
  {
    name: "hsk1-greetings",
    hsk: 1,
    rolePlay: {
      aiRole: "a new classmate",
      learnerRole: "a new student",
      scenarioContext: "Two new classmates meet before their first class.",
      objective:
        "Exchange a greeting, names, and nationalities with the new classmate.",
      lessonVocabulary: [
        "你好",
        "叫",
        "名字",
        "高兴",
        "认识",
        "哪",
        "国",
        "学生",
        "学习",
        "再见",
      ],
      lessonGrammar: [
        "Subject + 叫 + Name",
        "Statement + 吗？",
        "Noun/Pronoun + 呢？",
      ],
      lessonHskLevel: 1,
    },
    learnerTurns: [
      "你好，我叫安娜。",
      "我的名字是安娜。你叫什么名字？",
      "很高兴认识你。",
      "我是秘鲁人，也是学生。我学习中文。你呢？",
      "你是哪国人？你是中国人吗？",
      "好的，再见。",
      "好的。",
    ],
    expectedEarliestEndAt: 6,
    useAudioInput: true,
    behaviorCheck: { rejectRepeatedQuestions: true },
  },
  {
    name: "hsk3-restaurant",
    hsk: 3,
    rolePlay: {
      aiRole: "a restaurant waiter",
      learnerRole: "a customer",
      scenarioContext:
        "A customer has entered a restaurant and wants a table and a dish.",
      objective: "Ask for a table and order one dish.",
      lessonVocabulary: ["两位", "有位子吗", "菜单", "想要", "牛肉面", "谢谢"],
      lessonGrammar: ["有 + noun + 吗？", "我想要 + dish"],
      lessonHskLevel: 3,
    },
    learnerTurns: ["你好，我们两位。有位子吗？", "我想要一碗牛肉面，谢谢。"],
  },
  {
    name: "hsk5-contract",
    hsk: 5,
    rolePlay: {
      aiRole: "an HR manager",
      learnerRole: "a job candidate",
      scenarioContext:
        "A candidate reviews a draft employment contract with HR before signing.",
      objective:
        "Ask about a clause's scope, question an unfavorable term, and request written clarification.",
      lessonVocabulary: [
        "条款",
        "确认",
        "竞业限制",
        "涵盖",
        "期限",
        "书面文件",
      ],
      lessonGrammar: [
        "具体涵盖哪些范围",
        "是不是有点 + adjective",
        "能不能把...写进...",
      ],
      lessonHskLevel: 5,
    },
    learnerTurns: [
      "第三条的竞业限制具体涵盖哪些范围？",
      "两年的期限是不是有点长？",
      "能不能把修改后的标准写进书面文件？",
    ],
  },
  {
    name: "hsk1-bathroom-role-ownership",
    hsk: 1,
    rolePlay: {
      aiRole: "a shopping mall information desk clerk",
      learnerRole: "a visitor who needs the bathroom",
      scenarioContext:
        "A visitor approaches an information desk and needs to find the bathroom.",
      objective:
        "The learner asks where the bathroom is, confirms one simple direction, and thanks the clerk.",
      lessonVocabulary: [
        "你好",
        "请问",
        "洗手间",
        "在哪儿",
        "左边",
        "右边",
        "谢谢",
      ],
      lessonGrammar: ["请问 + place + 在哪儿？", "是在 + direction + 吗？"],
      lessonHskLevel: 1,
    },
    learnerTurns: [
      "你好。",
      "不好意思，我想问一个问题。",
      "请问，洗手间在哪儿？",
      "是在左边吗？",
      "所以是在右边吗？",
      "好的，谢谢。",
    ],
    expectedEarliestEndAt: 6,
    useAudioInput: true,
    behaviorCheck: {
      ownershipPhrase: "洗手间在哪儿",
      learnerFirstUsesOwnershipPhraseTurn: 3,
      rejectRepeatedQuestions: true,
    },
  },
  {
    name: "hsk3-weekend-question-memory",
    hsk: 3,
    rolePlay: {
      aiRole: "a Chinese friend making weekend plans",
      learnerRole: "a friend discussing weekend plans",
      scenarioContext:
        "Two friends plan Saturday together in a relaxed conversation.",
      objective:
        "Discuss the activity, companion, time, meeting place, food, transport, and return time, then agree on the plan.",
      lessonVocabulary: [
        "周末",
        "公园",
        "朋友",
        "星期六",
        "上午",
        "面条",
        "地铁",
        "回家",
      ],
      lessonGrammar: ["先……然后……", "跟 + person + 一起", "大概 + time"],
      lessonHskLevel: 3,
    },
    learnerTurns: [
      "我周末想去公园。",
      "我想跟你一起去。",
      "星期六上午怎么样？",
      "我们九点在地铁站见。",
      "我们先散步，然后吃饭。",
      "我想吃面条。",
      "我们坐地铁去，很方便。",
      "我大概下午四点回家。",
      "好，就这么决定了。",
    ],
    expectedEarliestEndAt: 8,
    useAudioInput: true,
    behaviorCheck: { rejectRepeatedQuestions: true },
  },
  {
    name: "hsk5-hotel-request-memory",
    hsk: 5,
    rolePlay: {
      aiRole: "a hotel receptionist",
      learnerRole: "a guest reporting a room problem",
      scenarioContext:
        "A hotel guest reports a noisy room and discusses a practical solution with reception.",
      objective:
        "The learner explains the noise problem, asks about two alternatives, compares them, and negotiates a room change.",
      lessonVocabulary: [
        "噪音",
        "房间",
        "换房",
        "安静",
        "楼层",
        "差价",
        "安排",
      ],
      lessonGrammar: ["不但……而且……", "与其……不如……", "能不能 + request"],
      lessonHskLevel: 5,
    },
    learnerTurns: [
      "你好，我想说一下房间的问题。",
      "外面的噪音很大，我昨天晚上没睡好。",
      "现在有安静一点的房间吗？",
      "高楼层和里面的房间，哪个更安静？",
      "如果换到高楼层，需要补差价吗？",
      "高楼层更安静，里面的房间更方便。与其继续住这个房间，不如换到高楼层。",
      "能不能今天上午帮我安排换房？",
      "我十一点以前可以收好行李。",
      "好的，谢谢你的帮助。",
    ],
    expectedEarliestEndAt: 6,
    useAudioInput: true,
    behaviorCheck: { rejectRepeatedQuestions: true },
  },
];

const placementScenarios: ScenarioCheck[] = [
  {
    name: "placement-hsk3-weekend",
    hsk: 3,
    rolePlay: PLACEMENT_SPEAKING_SCENARIOS[3].rolePlay,
    learnerTurns: [
      "我想出去爬山，因为这个周末天气很好。",
      "不过如果你想看电影，我们可以上午爬山，晚上看电影。",
      "这样我们都可以做喜欢的事，就这么决定吧。",
    ],
    expectedEarliestEndAt: 2,
    useAudioInput: true,
    placement: true,
  },
  {
    name: "placement-hsk5-parents",
    hsk: 5,
    rolePlay: PLACEMENT_SPEAKING_SCENARIOS[5].rolePlay,
    learnerTurns: [
      "我觉得年轻人最好独立生活，因为这样能学会照顾自己。",
      "我承认跟父母住可以省钱，不过长期来看，独立生活也很重要。",
      "你说照顾父母很重要，这一点我同意，可是住得近不一定要住在一起。",
      "所以我觉得双方保持联系，同时有自己的空间比较好。",
    ],
    expectedEarliestEndAt: 2,
    useAudioInput: true,
    placement: true,
  },
  {
    name: "placement-hsk5-insufficient",
    hsk: 5,
    rolePlay: PLACEMENT_SPEAKING_SCENARIOS[5].rolePlay,
    learnerTurns: [
      "我觉得不好。",
      "我不知道。",
      "可能吧。",
      "我没有别的想法。",
      "好吧。",
    ],
    expectedEarliestEndAt: 5,
    useAudioInput: true,
    placement: true,
  },
  {
    name: "placement-hsk6-limitations",
    hsk: 6,
    rolePlay: PLACEMENT_SPEAKING_SCENARIOS[6].rolePlay,
    learnerTurns: [
      "我承认这个方法有局限性，比如开始的时候成本比较高。",
      "虽然实施起来不容易，但是长期来看，它可以提高整个团队的效率。",
      "你说培训时间太长很有道理，可我们可以先做小范围试验。",
      "这样既能控制风险，也能判断这个方法到底有没有价值。",
    ],
    expectedEarliestEndAt: 2,
    useAudioInput: true,
    placement: true,
  },
  {
    name: "placement-hsk7-disruption",
    hsk: 7,
    rolePlay: PLACEMENT_SPEAKING_SCENARIOS[7].rolePlay,
    learnerTurns: [
      "我认为颠覆并不是创新的唯一标准，关键要看它是否真正解决问题。",
      "连成熟行业都需要不断改进，更不用说变化很快的新领域了。",
      "我理解你的反对意见，因为激进的变化有时能创造新的机会，不过它也可能忽视已有经验。",
      "与其为了颠覆而颠覆，我宁可逐步验证，也不愿意承担没有必要的风险。",
    ],
    expectedEarliestEndAt: 2,
    useAudioInput: true,
    placement: true,
  },
];

type ConversationItem = {
  id?: string;
  type?: string;
  role?: string;
};

type SessionItemStats = {
  total: number;
  messages: number;
  functionCalls: number;
  functionCallOutputs: number;
  deleted: number;
  activeEstimate: number;
};

function normalizeUtterance(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s，。！？、,.!?：:；;“”"'‘’（）()]/gu, "");
}

function extractQuestions(value: string) {
  return [...value.matchAll(/[^。！？!?\n]+[？?]/gu)]
    .map((match) => normalizeUtterance(match[0]))
    .filter(Boolean);
}

async function synthesizeLearnerPcm(apiKey: string, text: string) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "cedar",
      input: text,
      response_format: "pcm",
      instructions:
        "Speak only the provided Mandarin Chinese naturally, clearly, and at a normal conversational pace.",
    }),
  });
  if (!response.ok)
    throw new Error(
      `Learner TTS failed (${response.status}): ${await response.text()}`,
    );
  return Buffer.from(await response.arrayBuffer());
}

async function assessWithTextModel(
  provider: OpenAiProvider,
  rolePlay: RolePlayContext,
  latestLearnerTranscript: string,
  phase: "before_reply" | "after_reply",
  transcript: readonly { role: "user" | "assistant"; content: string }[],
  previouslyRemainingPracticeTargets: readonly string[] | null,
  continueUntilTimeLimit = false,
  placementTurnWindow = false,
): Promise<ConversationCompletionAssessment> {
  const result = await provider.complete({
    systemPrompt: buildTextConversationAssessmentPrompt(
      rolePlay,
      latestLearnerTranscript,
      phase,
      transcript,
      previouslyRemainingPracticeTargets,
      continueUntilTimeLimit,
      placementTurnWindow
        ? {
            minimum: PLACEMENT_SPEAKING_MIN_TURNS,
            maximum: PLACEMENT_SPEAKING_MAX_TURNS,
          }
        : undefined,
    ),
    messages: [
      {
        role: "user",
        content: "Assess the transcript and return the required JSON now.",
      },
    ],
    maxOutputTokens: 3_000,
    timeoutMs: 30_000,
  });
  const assessment = parseTextConversationAssessment(result.content);
  if (!assessment)
    throw new Error(
      `Text evaluator returned invalid JSON: ${result.content.slice(0, 800)}`,
    );
  const stabilized = ensurePendingLearnerQuestionIsAnswered(
    stabilizeConversationPracticeTargets(
      assessment,
      previouslyRemainingPracticeTargets,
      rolePlay,
      transcript,
    ),
    latestLearnerTranscript,
    phase,
  );
  const policyAssessment = continueUntilTimeLimit
    ? keepTimedSpeakingAssessmentOpen(stabilized)
    : stabilized;
  return placementTurnWindow
    ? applyPlacementSpeakingTurnWindow(
        policyAssessment,
        transcript,
        PLACEMENT_SPEAKING_MIN_TURNS,
        PLACEMENT_SPEAKING_MAX_TURNS,
      )
    : policyAssessment;
}

function pcm16Wav(pcm: Buffer, sampleRate = 24_000): Buffer {
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + pcm.length, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(pcm.length, 40);
  pcm.copy(wav, 44);
  return wav;
}

class LiveRealtimeSession {
  private readonly socket: WebSocket;
  private response:
    | {
        chunks: Buffer[];
        transcript: string;
        resolve: (response: RealtimeResponse) => void;
        reject: (error: Error) => void;
      }
    | undefined;
  private sessionReadyResolve: (() => void) | undefined;
  private sessionReadyReject: ((error: Error) => void) | undefined;
  private readonly sessionReady: Promise<void>;
  private readonly conversationItems: ConversationItem[] = [];
  private deletedItems = 0;

  constructor(apiKey: string, rolePlay: RolePlayContext, hsk: number) {
    this.sessionReady = new Promise((resolve, reject) => {
      this.sessionReadyResolve = resolve;
      this.sessionReadyReject = reject;
    });
    this.socket = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-realtime-mini",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
    this.socket.addEventListener("open", () => {
      this.send({
        type: "session.update",
        session: {
          type: "realtime",
          output_modalities: ["audio"],
          instructions: buildRealtimeSystemPrompt(
            {
              level: `HSK ${hsk}`,
              explanationLanguage: "EN",
              generalLevelPoints: null,
            },
            { rolePlay },
            "PRACTICE",
          ),
          audio: {
            input: {
              format: { type: "audio/pcm", rate: 24_000 },
              transcription: {
                model: "gpt-4o-mini-transcribe",
                language: "zh",
                prompt:
                  "Mandarin Chinese lesson role-play. Prefer standard Mandarin and simplified Chinese characters.",
              },
              turn_detection: null,
            },
            output: { voice: "marin" },
          },
        },
      });
    });
    this.socket.addEventListener("error", (event) => {
      this.sessionReadyReject?.(
        new Error(`Realtime WebSocket connection failed: ${event.message}`),
      );
    });
    this.socket.addEventListener("close", (event) => {
      if (event.code !== 1000)
        this.sessionReadyReject?.(
          new Error(
            `Realtime WebSocket closed before setup (${event.code}): ${event.reason}`,
          ),
        );
    });
    this.socket.addEventListener("message", async (message) => {
      const raw =
        typeof message.data === "string"
          ? message.data
          : message.data instanceof Blob
            ? await message.data.text()
            : Buffer.from(message.data as ArrayBuffer).toString("utf8");
      const event = JSON.parse(raw) as {
        type?: string;
        delta?: string;
        transcript?: string;
        item?: ConversationItem;
        response?: { output?: unknown[]; status_details?: unknown };
        error?: { message?: string };
      };
      if (event.type === "session.updated") this.sessionReadyResolve?.();
      if (event.type === "conversation.item.added" && event.item)
        this.conversationItems.push(event.item);
      if (event.type === "conversation.item.deleted") this.deletedItems += 1;
      if (event.type === "error") {
        const error = new Error(event.error?.message ?? "Realtime API error");
        this.sessionReadyReject?.(error);
        this.response?.reject(error);
        this.response = undefined;
        return;
      }
      if (!this.response) return;
      if (
        (event.type === "response.output_audio.delta" ||
          event.type === "response.audio.delta") &&
        event.delta
      )
        this.response.chunks.push(Buffer.from(event.delta, "base64"));
      if (
        event.type === "response.output_audio_transcript.done" ||
        event.type === "response.audio_transcript.done"
      )
        this.response.transcript = event.transcript?.trim() ?? "";
      if (event.type === "response.done") {
        const current = this.response;
        this.response = undefined;
        current.resolve({
          transcript: current.transcript,
          audio: Buffer.concat(current.chunks),
          output: event.response?.output ?? [],
        });
      }
    });
  }

  private send(event: unknown) {
    this.socket.send(JSON.stringify(event));
  }

  async ready() {
    await Promise.race([
      this.sessionReady,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Realtime session timed out")),
          15_000,
        ),
      ),
    ]);
  }

  async createResponse(
    instructions: string,
    options: Record<string, unknown> = {},
  ): Promise<RealtimeResponse> {
    if (this.response) throw new Error("A Realtime response is already active");
    const response = new Promise<RealtimeResponse>((resolve, reject) => {
      this.response = { chunks: [], transcript: "", resolve, reject };
    });
    this.send({
      type: "response.create",
      response: { instructions, ...options },
    });
    return Promise.race([
      response,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Realtime response timed out")),
          25_000,
        ),
      ),
    ]);
  }

  addLearnerTurn(text: string) {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
  }

  addLearnerAudio(pcm: Buffer) {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_audio", audio: pcm.toString("base64") }],
      },
    });
  }

  addEphemeralSystemGuard(instructions: string) {
    const id = `item_guard_${crypto.randomUUID().replaceAll("-", "").slice(0, 21)}`;
    this.send({
      type: "conversation.item.create",
      item: {
        id,
        type: "message",
        role: "system",
        content: [
          {
            type: "input_text",
            text: `One-turn override. Follow this instruction for the next assistant audio only: ${instructions}`,
          },
        ],
      },
    });
    return id;
  }

  deleteItem(itemId: string) {
    this.send({ type: "conversation.item.delete", item_id: itemId });
  }

  getItemStats(): SessionItemStats {
    const stats = this.conversationItems.reduce<SessionItemStats>(
      (stats, item) => {
        stats.total += 1;
        if (item.type === "message") stats.messages += 1;
        if (item.type === "function_call") stats.functionCalls += 1;
        if (item.type === "function_call_output")
          stats.functionCallOutputs += 1;
        return stats;
      },
      {
        total: 0,
        messages: 0,
        functionCalls: 0,
        functionCallOutputs: 0,
        deleted: this.deletedItems,
        activeEstimate: 0,
      },
    );
    stats.activeEstimate = Math.max(0, stats.total - stats.deleted);
    return stats;
  }

  acknowledgeTool(callId: string) {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify({ accepted: true }),
      },
    });
  }

  close() {
    this.socket.close();
  }
}

async function saveAudio(
  outputDir: string,
  name: string,
  response: RealtimeResponse,
) {
  if (!response.audio.length) return null;
  const filename = `${name}.wav`;
  await writeFile(path.join(outputDir, filename), pcm16Wav(response.audio));
  return filename;
}

async function runScenario(
  apiKey: string,
  outputDir: string,
  scenario: ScenarioCheck,
  continueUntilTimeLimit = false,
) {
  const session = new LiveRealtimeSession(
    apiKey,
    scenario.rolePlay,
    scenario.hsk,
  );
  const turns: Array<{
    phase: string;
    transcript: string;
    audioFile: string | null;
    toolCall: boolean;
  }> = [];
  const dialogue: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [];
  const assessments: Array<{
    phase: string;
    assessment: ConversationCompletionAssessment;
  }> = [];
  const evaluator = new OpenAiProvider(apiKey);
  try {
    await session.ready();
    const openingGuard = buildRealtimeOpeningTurnGuard(scenario.rolePlay);
    const openingGuardItemId = openingGuard
      ? session.addEphemeralSystemGuard(openingGuard)
      : null;
    const opening = await session.createResponse(
      openingGuard ?? buildRealtimeOpeningInstructions(scenario.rolePlay),
      {
        max_output_tokens: REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT.opening,
      },
    );
    if (openingGuardItemId) session.deleteItem(openingGuardItemId);
    turns.push({
      phase: "opening",
      transcript: opening.transcript,
      audioFile: await saveAudio(
        outputDir,
        `${scenario.name}-00-opening`,
        opening,
      ),
      toolCall: false,
    });
    if (opening.transcript)
      dialogue.push({ role: "assistant", content: opening.transcript });

    let endedAt: number | null = null;
    let remainingPracticeTargets: string[] | null = null;
    for (const [index, learnerTurn] of scenario.learnerTurns.entries()) {
      if (scenario.useAudioInput) {
        const learnerPcm = await synthesizeLearnerPcm(apiKey, learnerTurn);
        await writeFile(
          path.join(
            outputDir,
            `${scenario.name}-${String(index + 1).padStart(2, "0")}-learner.wav`,
          ),
          pcm16Wav(learnerPcm),
        );
        session.addLearnerAudio(learnerPcm);
      } else {
        session.addLearnerTurn(learnerTurn);
      }
      dialogue.push({ role: "user", content: learnerTurn });
      const assessment = await assessWithTextModel(
        evaluator,
        scenario.rolePlay,
        learnerTurn,
        "before_reply",
        dialogue,
        remainingPracticeTargets,
        continueUntilTimeLimit,
        scenario.placement === true,
      );
      remainingPracticeTargets = assessment.remainingPracticeTargets;
      assessments.push({
        phase: `before-${index + 1}`,
        assessment,
      });
      if (assessment.decision === "end") {
        endedAt = index + 1;
        turns.push({
          phase: `assessment-${index + 1}`,
          transcript: assessment.reason,
          audioFile: null,
          toolCall: true,
        });
        const closing = await session.createResponse(
          buildRealtimeClosingInstructions(scenario.rolePlay),
          {
            tools: [],
            tool_choice: "none",
            max_output_tokens: REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT.closing,
          },
        );
        turns.push({
          phase: "closing",
          transcript: closing.transcript,
          audioFile: await saveAudio(
            outputDir,
            `${scenario.name}-99-closing`,
            closing,
          ),
          toolCall: false,
        });
        break;
      }

      const baseTurnInstructions = buildRealtimeTurnInstructions(
        "English",
        scenario.rolePlay,
        null,
        learnerTurn,
      );
      const assessmentGuard = buildRealtimeAssessmentTurnGuard(
        assessment,
        dialogue,
        scenario.rolePlay,
      );
      const audibleTurnInstructions =
        shouldHoldRealtimeLearnerAction(
          assessment,
          scenario.rolePlay,
          dialogue,
        ) || Boolean(assessment.nextCharacterUtterance)
          ? assessmentGuard
          : [baseTurnInstructions, assessmentGuard].filter(Boolean).join(" ");
      const guardItemId = session.addEphemeralSystemGuard(
        audibleTurnInstructions,
      );
      const response = await session.createResponse(audibleTurnInstructions, {
        tools: [],
        tool_choice: "none",
        max_output_tokens: REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT.turn,
      });
      session.deleteItem(guardItemId);
      turns.push({
        phase: `turn-${index + 1}`,
        transcript: response.transcript,
        audioFile: await saveAudio(
          outputDir,
          `${scenario.name}-${String(index + 1).padStart(2, "0")}`,
          response,
        ),
        toolCall: false,
      });
      if (response.transcript)
        dialogue.push({ role: "assistant", content: response.transcript });
      if (!assessment.closeAfterReply) continue;

      endedAt = index + 1;
      turns.push({
        phase: `assessment-close-after-${index + 1}`,
        transcript: assessment.reason,
        audioFile: null,
        toolCall: true,
      });
      const closing = await session.createResponse(
        buildRealtimeClosingInstructions(scenario.rolePlay),
        {
          tools: [],
          tool_choice: "none",
          max_output_tokens: REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT.closing,
        },
      );
      turns.push({
        phase: "closing",
        transcript: closing.transcript,
        audioFile: await saveAudio(
          outputDir,
          `${scenario.name}-99-closing`,
          closing,
        ),
        toolCall: false,
      });
      break;
    }

    const audibleTurns = turns.filter(
      (turn) => !turn.toolCall && turn.phase !== "closing",
    );
    const ownershipPhrase = scenario.behaviorCheck?.ownershipPhrase;
    const firstLearnerUse =
      scenario.behaviorCheck?.learnerFirstUsesOwnershipPhraseTurn;
    const assistantBeforeOwnershipTurn = audibleTurns.filter((turn) => {
      if (turn.phase === "opening") return true;
      const match = /^turn-(\d+)$/u.exec(turn.phase);
      return Boolean(
        match && firstLearnerUse && Number(match[1]) < firstLearnerUse,
      );
    });
    const ownershipPassed =
      !ownershipPhrase ||
      assistantBeforeOwnershipTurn.every(
        (turn) =>
          !normalizeUtterance(turn.transcript).includes(
            normalizeUtterance(ownershipPhrase),
          ),
      );
    const seenQuestions = new Set<string>();
    const repeatedQuestions = audibleTurns.flatMap((turn) =>
      extractQuestions(turn.transcript)
        .filter((question) => {
          if (!seenQuestions.has(question)) {
            seenQuestions.add(question);
            return false;
          }
          return true;
        })
        .map((question) => ({ phase: turn.phase, question })),
    );
    const semanticQuestionHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];
    const semanticRepeatedQuestions = dialogue.flatMap((message, index) => {
      const repeated =
        message.role === "assistant" &&
        hasRepeatedRealtimeQuestionIntent(
          message.content,
          semanticQuestionHistory,
        );
      semanticQuestionHistory.push(message);
      return repeated
        ? [{ phase: `dialogue-${index + 1}`, transcript: message.content }]
        : [];
    });
    const repetitionPassed =
      !scenario.behaviorCheck?.rejectRepeatedQuestions ||
      (repeatedQuestions.length === 0 &&
        semanticRepeatedQuestions.length === 0);

    let placementEvaluation = null;
    if (scenario.placement) {
      const placementScenario =
        PLACEMENT_SPEAKING_SCENARIOS[
          scenario.hsk as keyof typeof PLACEMENT_SPEAKING_SCENARIOS
        ];
      const evaluationResult = await evaluator.complete({
        systemPrompt: buildPlacementSpeakingEvaluationPrompt(
          placementScenario,
          dialogue,
        ),
        messages: [
          { role: "user", content: "Grade this placement speaking attempt now." },
        ],
        maxOutputTokens: 1_800,
        timeoutMs: 45_000,
      });
      placementEvaluation = parsePlacementSpeakingEvaluation(
        evaluationResult.content,
      );
    }

    return {
      scenario: scenario.name,
      hsk: scenario.hsk,
      objective: scenario.rolePlay.objective,
      endedAt,
      expectedEndAt: scenario.learnerTurns.length,
      dynamicEndingPassed: continueUntilTimeLimit
        ? endedAt == null
        : endedAt != null &&
          endedAt >=
            (scenario.expectedEarliestEndAt ?? scenario.learnerTurns.length) &&
          endedAt <= scenario.learnerTurns.length,
      behaviorCheck: scenario.behaviorCheck
        ? {
            ownershipPassed,
            repetitionPassed,
            repeatedQuestions,
            semanticRepeatedQuestions,
            passed: ownershipPassed && repetitionPassed,
          }
        : null,
      conversationItems: session.getItemStats(),
      placementEvaluation,
      assessments,
      turns,
    };
  } finally {
    session.close();
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    throw new Error("OPENAI_API_KEY is not configured in .env.local");

  const outputDir = path.resolve(
    "project",
    "test-artifacts",
    "realtime-ending",
  );
  await mkdir(outputDir, { recursive: true });
  const requestedScenario = process.argv
    .find((argument) => argument.startsWith("--scenario="))
    ?.slice("--scenario=".length);
  const selectedScenarios = requestedScenario
    ? [...scenarios, ...placementScenarios].filter(
        (scenario) => scenario.name === requestedScenario,
      )
    : process.argv.includes("--placement")
      ? placementScenarios
      : process.argv.includes("--behavior")
      ? scenarios.filter((scenario) => scenario.behaviorCheck)
      : scenarios;
  const continueUntilTimeLimit = process.argv.includes(
    "--continue-until-limit",
  );
  const results = [];
  for (const scenario of selectedScenarios) {
    results.push(
      await runScenario(apiKey, outputDir, scenario, continueUntilTimeLimit),
    );
    await writeFile(
      path.join(outputDir, "behavior-results.partial.json"),
      JSON.stringify(results, null, 2),
      "utf8",
    );
  }
  await writeFile(
    path.join(outputDir, "results.json"),
    JSON.stringify(results, null, 2),
    "utf8",
  );

  for (const result of results) {
    console.log(
      `${result.scenario}: ${continueUntilTimeLimit ? "timer-policy" : "dynamic"}=${result.dynamicEndingPassed ? "PASS" : "FAIL"} endedAt=${result.endedAt ?? "never"}/${result.expectedEndAt}`,
    );
    if (result.behaviorCheck)
      console.log(
        `  behavior=${result.behaviorCheck.passed ? "PASS" : "FAIL"} ownership=${result.behaviorCheck.ownershipPassed ? "PASS" : "FAIL"} repetition=${result.behaviorCheck.repetitionPassed ? "PASS" : "FAIL"} items=${JSON.stringify(result.conversationItems)}`,
      );
    for (const turn of result.turns)
      console.log(
        `  ${turn.phase}: ${turn.transcript || "[tool call / no audio]"}`,
      );
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
