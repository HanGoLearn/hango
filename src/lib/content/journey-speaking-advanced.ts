import type { LessonBankPlan } from "./journey-speaking-banks";

// Reviewed selections, not automatic first-N words or evidence of mastery.
// Keep the catalogue server-side; the browser receives only its session bank.
type Review = readonly [
  words: readonly string[],
  patterns: readonly string[],
  opening: string,
  rationale: string,
  optionalWords?: readonly string[],
  optionalPatterns?: readonly string[],
];
function group(
  reviews: Readonly<Record<string, Review>>,
  anchors: readonly string[] = [],
  guard = "",
): Record<string, LessonBankPlan> {
  return Object.fromEntries(
    Object.entries(reviews).map(([slug, review]) => [
      slug,
      {
        coreWords: review[0],
        coreGrammar: review[1],
        openingLine: review[2],
        rationale: [review[3], guard].filter(Boolean).join(" "),
        optionalWords: review[4],
        optionalGrammar: review[5],
        relatedLessons: [
          ...new Set([...Object.keys(reviews), ...anchors]),
        ].filter((candidate) => candidate !== slug),
      },
    ]),
  );
}
const CONTRACT =
  "Language-only fictional negotiation, not legal advice or a real employment offer. Sample clauses, benefits, amounts and deadlines are fictional, not law or verified company policy. Never request real confidential documents, certify enforceability or claim a signed agreement; real legal decisions require qualified local advice.";
const RESEARCH =
  "Use learner-provided or explicitly fictional research, not fabricated verified sources, studies or statistics. Distinguish evidence, interpretation and uncertainty; no automatic praise of unsupported causation. Do not infer the sample's study, degree or data as the learner's actual work.";
const LEGAL =
  "Language-only fictional notarial scene, not legal advice or an actual transaction. Sample requirements, irrevocability, remote notarization and processing times are not authoritative law. No real IDs, documents, signatures or property details; for actual decisions consult the relevant qualified professional or authority.";
const MEDICAL =
  "Language-only fictional medical scene, not clinical advice. Do not diagnose the learner, prescribe drugs/doses, promise efficacy or rule out an emergency from this audio or the sample dialogue. For actual symptoms or treatment questions leave the clinical role and recommend a qualified clinician; if a real emergency is stated, stop role-play and direct them to local emergency services. Do not solicit identifying health records.";
const DIPLOMACY =
  "A fictional partner negotiation, not a national stereotype or a real diplomatic commitment. Cultural preferences are individual possibilities, not universal facts. Preserve respectful disagreement and refusal; no coerced concession, invented shared history, actual authority or agreement without explicit in-session acceptance.";
const FINANCE =
  "A fictional educational panel, not financial advice. No investment recommendations, returns, market forecasts, verified live data or guarantee that a risk-control measure works. Hypothetical mechanisms must remain qualified; summarize only positions actually expressed in this session, not imaginary other panelists.";

export const JOURNEY_ADVANCED_BANK_PLANS: Readonly<
  Record<string, LessonBankPlan>
> = {
  ...group(
    {
      "work-office-introducing-yourself-professionally": [
        ["公司", "了解", "负责", "开发", "随时", "挑战性"],
        ["Subject + 负责 + Noun/Verb Phrase", "对 + Topic + 了解"],
        "你好，很高兴认识你。",
        "A colleague welcomes the learner and responds to the role they actually introduce. Accept a different occupation or no job experience; never assign the sample's name, product-manager job or years of service.",
      ],
      "work-office-simple-meetings": [
        ["议题", "讨论", "推广", "按照", "调研", "汇报"],
        ["按照 + Reference + Statement", "具体 + Question"],
        "今天想讨论哪个议题？",
        "A colleague invites one concrete meeting topic. Work through the learner's proposal before a relevant clarification; fictional assignments need agreement, not automatic responsibility or a forced report deadline.",
        [],
        ["交给 + Person + 负责"],
      ],
      "work-office-asking-for-time-off": [
        ["请假", "原因", "填", "请假单", "代班", "考虑"],
        ["请 + Duration + 假", "因为 + Reason"],
        "你好，有什么事想跟我商量？",
        "A manager hears the learner's leave request without asking for private medical detail. Ask one missing scheduling detail, accept a different reason, and discuss fictional coverage without asserting actual permission or policy.",
      ],
      "work-office-workplace-small-talk": [
        ["加班", "项目", "结束", "计划", "休假", "放松"],
        ["虽然 + A + 但是 + B", "快 + Verb Phrase + 了"],
        "最近工作怎么样？",
        "A colleague makes brief small talk, follows the actual answer or a light detour and does not diagnose stress, invent overtime or force vacation plans. A short answer is sufficient, not an invitation to a chain of probing questions.",
      ],
    },
    [
      "job-interview-basics-introducing-your-work-background",
      "roommate-issues-splitting-household-chores",
      "plans-and-time-future-plans",
    ],
  ),
  ...group(
    {
      "negotiating-job-contract-reviewing-contract-terms": [
        ["条款", "确认", "涵盖", "期限", "考核", "书面文件"],
        ["具体涵盖哪些 + noun？", "能不能把 + item + 写进 + document？"],
        "您想先确认哪一条条款？",
        "HR answers the specific clause question and permits requests for written clarification. A non-compete is optional specialist vocabulary, not a compulsory two-year restriction or an accepted fact.",
        ["竞业限制"],
      ],
      "negotiating-job-contract-pushing-back-on-an-unfavorable-clause": [
        ["不同的看法", "探讨", "合理", "调休", "补偿", "提议"],
        [
          "关于 + topic，我有些不同的看法",
          "能不能考虑 + alternative + 作为 + purpose？",
        ],
        "您对哪一条有不同的看法？",
        "HR listens to a disagreement and negotiates an alternative without normalizing unpaid overtime as lawful or universal. Accept refusal or time to consider; do not promise legal review was performed.",
      ],
      "negotiating-job-contract-negotiating-benefits-and-perks": [
        ["福利待遇", "带薪年假", "远程办公", "培训预算", "额度", "吸引力"],
        ["除了 + known item，具体包括哪些？", "如果我提出 + request + 呢？"],
        "您想了解哪些福利待遇？",
        "HR discusses the benefit the learner chooses before another relevant condition. 五险一金 is an optional term to explain if asked, not an eligibility claim; do not assume satisfaction or guaranteed negotiated perks.",
        ["五险一金"],
      ],
      "negotiating-job-contract-finalizing-the-agreement": [
        ["最终条款", "维持", "缩短", "修改", "接受", "确认"],
        ["把 + item + 再确认一遍", "缩短到 + new amount"],
        "您想先确认哪项最终条款？",
        "Review only terms actually established in this session. If none exist, let the learner choose one fictional term; unresolved items stay unresolved. Formal confirmation and a start date follow explicit acceptance only; no new bargaining during preparing-close.",
        [],
        ["正式确认 + agreement"],
      ],
    },
    [
      "job-interview-basics-discussing-salary-expectations",
      "renting-apartment-negotiating-the-lease",
    ],
    CONTRACT,
  ),
  ...group(
    {
      "debating-current-issue-stating-your-position": [
        ["立场", "生活质量", "效率", "数据", "来源", "结论"],
        ["我认为 + subject + 应该 + claim", "这一点我理解，但 + counter"],
        "关于远程办公，你怎么看？",
        "A debate participant invites a view without imposing the sample's position. Engage one reason before another question, allow uncertainty, and do not equate confidence or agreement with sound evidence.",
      ],
      "debating-current-issue-supporting-your-argument": [
        ["方面", "观点", "成本", "满意度", "说服力", "论证"],
        ["举个例子，+ example", "总的来说，+ summary"],
        "你想用什么例子支持你的观点？",
        "A debate participant lets the learner support a chosen claim with one relevant example. No mandatory three-point speech, fabricated surveys or verified claim that turnover fell by thirty percent.",
      ],
      "debating-current-issue-responding-to-a-counterargument": [
        ["质疑", "逻辑", "假设", "局限性", "弥补", "反驳"],
        [
          "你假设 + assumption，但事实并非如此",
          "确实存在，但可以通过 + solution + 来弥补",
        ],
        "远程办公会不会影响团队协作？",
        "Offer one tentative counterargument and listen to the response rather than recycling the same objection. Use polite disagreement, not personal criticism, declaring a logical flaw without evidence or forcing the learner to concede.",
        [],
        ["你的逻辑有一个漏洞 + explanation"],
      ],
      "debating-current-issue-conceding-a-point-gracefully": [
        ["承认", "整体", "特殊情况", "大多数", "优势", "依然"],
        [
          "你说得有道理，我承认 + point",
          "对大多数人来说，+ claim + 依然 + adjective",
        ],
        "新员工适应远程办公可能有困难，你怎么看？",
        "Acknowledge nuance without demanding concession or an unchanged overall position. The learner may agree, disagree or revise; one exception does not prove all other workers benefit. No ceremonial closing before the actual conversation ends.",
      ],
    },
    [
      "opinions-comparisons-agreeing-and-disagreeing",
      "work-office-workplace-small-talk",
    ],
    RESEARCH,
  ),
  ...group(
    {
      "academic-seminar-discussion-presenting-your-research": [
        ["研究课题", "研究问题", "采用", "问卷调查", "访谈", "样本量"],
        ["我的研究问题是 + question", "我采用了 + method + 的方法"],
        "请介绍一下你的研究课题。",
        "A faculty advisor lets the learner choose a real or fictional project. Accept a brief outline or no completed results; don't assign the sample's three hundred students, effect sizes or conclusion. Follow one point at a time.",
      ],
      "academic-seminar-discussion-fielding-a-probing-question": [
        ["家庭背景", "变量", "控制", "教育水平", "局限", "深入"],
        [
          "您是指 + option A + 还是 + option B？",
          "这确实是一个局限，值得 + future direction",
        ],
        "你的研究考虑过家庭背景这个变量吗？",
        "An audience member asks one relevant methodological question. Accept clarification, a different project, an unknown or a limitation; don't claim a variable was controlled or press for private participant information.",
        [],
        ["这是一个很好的问题，+ answer"],
      ],
      "academic-seminar-discussion-citing-sources-to-support-claims": [
        ["根据", "引用", "文献", "一致", "前人", "差异"],
        ["根据以往的研究，+ claim", "与 + prior work + 相比，+ comparison"],
        "你想引用哪项研究来支持这个观点？",
        "A faculty advisor invites a source for the learner's actual claim. If none is known, accept that or an explicitly fictional citation for wording practice; never invent a verified Professor Zhang paper from 2019 or treat a sample as a real reference.",
      ],
      "academic-seminar-discussion-discussing-limitations-and-future-work": [
        ["代表性", "因果关系", "纵向研究", "验证", "扩大", "地域范围"],
        [
          "首先，+ limitation 1。其次，+ limitation 2。",
          "未来可以采用 + method + 来 + purpose",
        ],
        "这项研究有哪些局限？",
        "Discuss a limitation actually stated and one possible next step, not every scripted issue. Do not promise a longitudinal design alone establishes causality, infer results or praise a report that was never given.",
      ],
    },
    [
      "school-talking-about-your-studies",
      "debating-current-issue-supporting-your-argument",
    ],
    RESEARCH,
  ),
  ...group(
    {
      "resolving-workplace-conflict-opening-the-mediation": [
        ["分歧", "互相尊重", "打断", "评判", "解决办法", "看法"],
        [
          "我的目的不是 + wrong framing，而是 + right framing",
          "我们先定几个原则：+ rule 1，+ rule 2",
        ],
        "谢谢你愿意沟通，我们先听听你的想法。",
        "The AI is the team member, not the mediator: the learner opens mediation. Listen to the learner's proposed ground rules and consent without impersonating another absent party, assigning blame or claiming unlimited time.",
        [],
        ["请慢慢说，我们有足够的时间"],
      ],
      "resolving-workplace-conflict-hearing-each-sides-grievance": [
        ["角度", "贡献", "忽视", "汇报", "功劳", "付出"],
        [
          "从你的角度说说，+ question",
          "如果我理解得对，你是希望 + underlying need",
        ],
        "我想谈谈项目里功劳分配的问题。",
        "The team member describes one fictional concern to the learner-mediator. Leave room to listen and paraphrase; don't assert a real colleague stole credit, fabricate both sides' testimony or insist that a suggested interpretation is correct.",
      ],
      "resolving-workplace-conflict-identifying-the-underlying-issue": [
        ["共同点", "表面上", "分工", "根本原因", "目标", "表达方式"],
        [
          "表面上是 + surface issue，但根本原因是 + root cause",
          "我这样理解对不对，+ request to confirm",
        ],
        "你觉得这个分歧的关键在哪里？",
        "A team member responds to the learner's proposed interpretation. Root causes and shared aims are hypotheses to confirm, not a forced communication-deficit diagnosis; no imagined second testimony or automatic agreement.",
        [],
        ["你们其实目标是一致的，只是 + difference"],
      ],
      "resolving-workplace-conflict-proposing-and-confirming-a-resolution": [
        ["提议", "分配", "承诺", "遵守", "约定", "回顾"],
        [
          "针对 + problem + 的问题，我提议 + solution",
          "我们 + timeframe + 后再回顾一下进展",
        ],
        "你有什么解决办法建议吗？",
        "The team member discusses the learner-mediator's proposal and may decline or counteroffer. Commit only for this fictional speaker after explicit agreement, never for absent parties; no mandatory weekly meetings or invented successful resolution.",
        [],
        ["我们双方都承诺遵守 + agreement + 吗？"],
      ],
    },
    [
      "roommate-issues-resolving-a-dispute-over-a-broken-item",
      "work-office-simple-meetings",
    ],
  ),
  ...group(
    {
      "media-interview-expert-giving-a-concise-soundbite": [
        ["概括", "意义", "简单来说", "普通用户", "应用场景", "解读"],
        ["能不能用一句话概括 + topic？", "简单来说，+ main point"],
        "能用一句话介绍一下这项技术吗？",
        "A journalist invites a concise description of the learner's chosen fictional technology. Ask for one useful example only if needed, not a forced headline; no verified tenfold speedup or assumed audience reaction.",
      ],
      "media-interview-expert-simplifying-a-technical-concept": [
        ["通俗", "算法", "原理", "想象", "比喻", "分类"],
        [
          "能不能用更通俗的方式解释一下 + concept？",
          "可以把它想象成 + everyday thing",
        ],
        "能用通俗的话解释一下算法吗？",
        "A journalist hears an analogy and checks only a genuine ambiguity. The learner may choose another concept; don't automatically say every reader understood or that all algorithms are classifiers.",
        ["分拣员"],
      ],
      "media-interview-expert-handling-a-leading-question": [
        ["前提", "澄清", "岗位", "转型", "区别", "适应"],
        [
          "这个问题的前提可能需要澄清一下",
          "与其说是 + loaded framing，不如说是 + accurate framing",
        ],
        "有人担心这项技术会影响就业，您怎么看？",
        "A journalist poses one tentative concern, then accepts a correction to its premise without asking the same loaded question again. Avoid alarmist certainty, forced optimism or treating a labor-market prediction as established fact.",
      ],
      "media-interview-expert-closing-on-your-key-message": [
        ["采访", "补充", "强调", "服务于", "传达", "理念"],
        ["借这个机会，我想强调一点", "如果只记住一句话，那就是 + key message"],
        "您最后想传达什么信息？",
        "This lesson begins at the closing segment of a fictional interview, not a technical End. Hear the key message, acknowledge it briefly and allow a natural goodbye without another compulsory question; no claim that real publication or audience reception occurred.",
      ],
    },
    [
      "academic-seminar-discussion-presenting-your-research",
      "debating-current-issue-responding-to-a-counterargument",
    ],
    RESEARCH,
  ),
  ...group(
    {
      "legal-notarial-procedures-explaining-your-purpose": [
        ["办理", "委托公证", "事项", "代为处理", "亲自到场", "清单"],
        [
          "我想办理一份 + type + 公证",
          "我需要委托 + person + 代为处理 + matter",
        ],
        "您好，您想了解哪类公证？",
        "A notary character hears a fictional purpose, allows another matter and asks only a missing procedural detail. Never assume an overseas learner, a sister or a property transfer; remote identity verification is not guaranteed available.",
      ],
      "legal-notarial-procedures-asking-about-required-documents": [
        ["材料", "复印件", "核验", "外文", "翻译", "疑问"],
        [
          "复印件可以吗，还是必须 + requirement？",
          "如果材料是 + condition，需要 + action + 吗？",
        ],
        "您想先了解哪项材料要求？",
        "A notary explains clearly fictional example requirements one at a time, not a binding checklist. Do not demand an actual ID, stamp, original deed or upload; acknowledge jurisdiction and procedure are unknown for a real case.",
        ["身份证原件", "房产证", "加盖公章"],
      ],
      "legal-notarial-procedures-clarifying-legal-terminology": [
        ["不可撤销", "签署", "撤回", "终止", "授权", "慎重"],
        ["term + 具体是什么意思？", "这和 + term B + 有什么区别？"],
        "您想了解哪个法律用语？",
        "Clarify the linguistic contrast of revocable/irrevocable without deciding which authorization the learner should choose or declaring that withdrawal is legally impossible. Any actual legal effect is outside this language scene.",
      ],
      "legal-notarial-procedures-confirming-the-next-steps": [
        ["流程", "审核", "通知", "领取", "自取", "邮寄"],
        [
          "action + 之后，接下来的流程是什么？",
          "可以选择 + option A，也可以 + option B",
        ],
        "您对接下来的流程有什么问题？",
        "Describe an imagined next step only after the learner's stated fictional stage. No presumed signature, five-day guarantee, actual approval, notification or postal delivery; at closure mention unresolved items honestly.",
      ],
    },
    [
      "renting-apartment-signing-the-contract",
      "negotiating-job-contract-reviewing-contract-terms",
    ],
    LEGAL,
  ),
  ...group(
    {
      "formal-speech-toast-event-opening-a-formal-speech": [
        ["来宾", "出席", "庆典", "在座", "合作伙伴", "感想"],
        ["各位来宾，+ greeting", "感谢大家拨冗出席 + occasion"],
        "有请您为今天的活动致辞。",
        "An emcee gives the learner the floor for a short fictional occasion of their choice. Do not label them CEO, invent a tenth anniversary or interrupt every sentence; ornate ceremonial wording is available but not a fluency requirement.",
        ["拨冗", "欢聚一堂", "携手前行"],
      ],
      "formal-speech-toast-event-honoring-a-guest-or-achievement": [
        ["表彰", "杰出", "专业精神", "敬意", "荣誉", "祝贺"],
        ["我想特别表彰 + honoree", "这份荣誉，你实至名归"],
        "您好，很高兴参加今天的活动。",
        "The AI is the honored employee and receives the learner's tribute, not the emcee giving an award. Let the learner define a fictional achievement; do not demand public praise, infer real achievements or attribute the character's honor to the learner.",
      ],
      "formal-speech-toast-event-proposing-an-eloquent-toast": [
        ["举杯", "祝愿", "美好", "事业", "敬酒", "尽兴"],
        ["祝愿 + subject + 蒸蒸日上", "来，为了 + purpose，干杯！"],
        "很高兴和大家相聚，请说说您的祝愿。",
        "A guest hears the learner's toast. A toast can use water or no drink: never pressure drinking alcohol, emptying a glass or performing every ornate wish. Toast vocabulary stays fictional, not actual drinking or audience action.",
        ["蒸蒸日上", "长长久久"],
      ],
      "formal-speech-toast-event-closing-a-speech-memorably": [
        ["欢聚", "温暖", "迈向", "致辞", "聆听", "圆满成功"],
        ["在结束之前，我想再说几句话", "愿我们携手迈向 + vision + 的明天"],
        "请您说说最后的祝愿。",
        "An emcee gives space for a short final wish and acknowledges the learner's actual speech. Closing-segment rehearsal is not automatic technical End; no imaginary success, applause, additional topic or mandatory follow-up after a goodbye.",
        ["万事如意"],
      ],
    },
    [
      "social-events-exchanging-compliments",
      "media-interview-expert-closing-on-your-key-message",
    ],
  ),
  ...group(
    {
      "specialist-medical-consultation-describing-a-complex-symptom-history": [
        ["症状", "发展过程", "频率", "伴随", "诱因", "加重"],
        [
          "大概 + time + 前开始，起初只是 + mild symptom",
          "最近 + timeframe，频率明显增加了，还伴随 + new symptom",
        ],
        "请介绍一下这位虚构患者的症状变化。",
        "Invite a fictional chronology, one relevant clarification at a time. Do not assume the learner has the sample's dizziness or nausea, infer a diagnosis or seek actual test records. A brief account or request for language help is acceptable.",
      ],
      "specialist-medical-consultation-understanding-the-diagnosis": [
        ["平衡系统", "反复发作", "病史", "诱发因素", "长期管理", "控制"],
        [
          "这和普通的 + general condition + 有什么不一样？",
          "如果我理解得对，这不是什么 + worry + ？",
        ],
        "这份虚构诊断中，您想了解哪一点？",
        "Explain wording in an explicitly fictional diagnosis, not the learner's condition. Never adopt the sample's reassurance that it is not acute or serious; uncertainty and safety take priority over a scripted reassuring answer.",
        ["前庭性偏头痛"],
        ["您可能患有 + condition"],
      ],
      "specialist-medical-consultation-discussing-treatment-options-and-risks":
        [
          ["可行", "治疗方案", "副作用", "效果", "倾向于", "稳妥"],
          ["目前有哪些可行的 + category？", "treatment + 会有什么副作用吗？"],
          "这份虚构方案中，您想先问哪一点？",
          "Practice asking about hypothetical options and uncertainty. Do not claim combined treatment is best, list personal side effects or recommend a treatment; the learner can decline and seek clarification without pressure.",
        ],
      "specialist-medical-consultation-confirming-the-treatment-plan": [
        ["制定计划", "警惕", "警示症状", "就医", "复诊", "记录"],
        [
          "有没有需要特别警惕的 + symptom category？",
          "复诊前需要提前做什么准备吗？",
        ],
        "您对这份虚构计划还有什么问题？",
        "Practice clarification of an imagined follow-up, not administering care. No daily-dose answer, invented medication, fixed follow-up date or diagnosis-specific emergency checklist. Do not dismiss danger because symptoms are absent from the sample; actual urgent concerns override role-play.",
        ["用药剂量"],
        ["如果出现 + symptom，请立即就医"],
      ],
    },
    [
      "health-doctors-visit",
      "health-follow-up-and-insurance",
      "body-basics-simple-symptoms",
    ],
    MEDICAL,
  ),
  ...group(
    {
      "diplomatic-sensitive-negotiation-opening-with-tact": [
        ["珍视", "情谊", "坦诚", "贵方", "考量", "议题"],
        [
          "我们非常珍视 + relationship description + 的情谊",
          "我们完全尊重贵方的立场和考量",
        ],
        "很高兴与您交流，请谈谈贵方的考量。",
        "A partner representative opens respectfully without asserting years of shared history. Listen to the learner's actual objective and concern; optimistic rhetoric is not proof of inevitable mutual benefit.",
        ["互利共赢"],
        ["我们相信...最终会实现互利共赢"],
      ],
      "diplomatic-sensitive-negotiation-addressing-a-cultural-misunderstanding":
        [
          ["误解", "愿闻其详", "商务习惯", "含义", "谅解", "彼此"],
          [
            "我猜这里可能存在一些文化上的误解",
            "这绝不是有意 + offense，还请谅解",
          ],
          "您对会议安排有什么想法？",
          "A partner asks about the actual concern before interpreting it. Seating and intent need clarification; do not classify a nation as rude or assume misunderstanding is resolved because the character explained a preference.",
        ],
      "diplomatic-sensitive-negotiation-navigating-a-face-sensitive-disagreement":
        [
          ["维持", "成本上升", "稳定性", "中间方案", "空间", "灵活"],
          [
            "或许我们可以换一个角度来看这个问题",
            "也许我们可以探讨一个双方都能接受的中间方案",
          ],
          "关于价格，贵方有什么考量？",
          "A partner hears a pricing position and offers one hypothetical trade-off, not forced concession. Accept disagreement or no deal; don't invent an existing price, cost increase or gratitude for flexibility the learner never showed.",
        ],
      "diplomatic-sensitive-negotiation-closing-while-preserving-the-relationship":
        [
          ["达成共识", "耐心", "基础", "深入", "衷心", "信任"],
          [
            "这份共识体现了我们双方的 + qualities",
            "衷心感谢贵方的 + qualities",
          ],
          "结束前，贵方还有什么需要确认的吗？",
          "Practice a diplomatic closing segment, not automatic technical End. Thank the learner for actual discussion, retain unresolved disagreements and use consensus wording only after explicit agreement; no guaranteed future cooperation or new question after a goodbye.",
        ],
    },
    [
      "negotiating-job-contract-pushing-back-on-an-unfavorable-clause",
      "opinions-comparisons-agreeing-and-disagreeing",
    ],
    DIPLOMACY,
  ),
  ...group(
    {
      "tech-finance-expert-panel-framing-a-nuanced-view": [
        ["机遇", "威胁", "二元对立", "普惠性", "监管", "视角"],
        [
          "一方面，+ side A。另一方面，+ side B。",
          "与其说 A，不如说取决于 + condition",
        ],
        "您怎么看金融科技的机遇与风险？",
        "A moderator invites one nuanced view without enforcing a binary answer or praising depth automatically. Accept an accessible explanation or request for a term; no prerequisite proof of expert status or an unsolicited lecture.",
      ],
      "tech-finance-expert-panel-engaging-with-a-fellow-panelist": [
        ["补充", "认同", "维度", "保留", "多样性", "权衡"],
        [
          "我想在您刚才的观点基础上补充一点",
          "我在一定程度上同意，但也有一点保留",
        ],
        "您想谈谈监管与技术标准的关系吗？",
        "A fellow panelist exchanges one view at a time. Reference only a point actually stated, not a supposed previous speaker; allow a reservation or a different angle and don't equate agreement with correctness.",
      ],
      "tech-finance-expert-panel-discussing-systemic-risk": [
        ["关联性", "本质区别", "波及", "蔓延", "传导机制", "连锁反应"],
        [
          "关键在于 + entities + 之间高度的关联性",
          "建立 + mechanism + 是常见的应对策略之一",
        ],
        "您想怎样解释系统性风险？",
        "A moderator requests a hypothetical mechanism, then one relevant clarification if needed. No claim that individual risks never spread or a firewall guarantees containment; don't endorse the source's absolute comparison as a verified fact.",
        ["防火墙机制"],
        [
          "individual risk + 通常是可控的，不会波及全局。但 + systemic risk + 会...迅速蔓延",
        ],
      ],
      "tech-finance-expert-panel-synthesizing-the-panel-discussion": [
        ["总结", "归纳", "不尽相同", "分歧", "综合", "平衡"],
        [
          "尽管 + views + 不尽相同，但有一个共同点：+ shared point",
          "综合各方观点，未来的关键在于 + synthesis",
        ],
        "我们可以先谈谈创新与稳健的平衡。",
        "As a fellow panelist, first offer room for a view if there is no actual session discussion to synthesize. A summary may retain disagreement or uncertainty; don't invent a full panel, consensus, expert credentials or agreement on regulation.",
      ],
    },
    [
      "debating-current-issue-conceding-a-point-gracefully",
      "academic-seminar-discussion-discussing-limitations-and-future-work",
    ],
    FINANCE,
  ),
};
