import type { LessonBankPlan } from "./journey-speaking-banks";

// Editorial selections from the audited published curriculum, not first-N
// guesses. Peer lessons are candidates only: the resolver requires actual
// matching completed steps before making their content available as support.
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
): Record<string, LessonBankPlan> {
  return Object.fromEntries(
    Object.entries(reviews).map(([slug, review]) => [
      slug,
      {
        coreWords: review[0],
        coreGrammar: review[1],
        openingLine: review[2],
        rationale: review[3],
        optionalWords: review[4],
        optionalGrammar: review[5],
        relatedLessons: [
          ...new Set([...Object.keys(reviews), ...anchors]),
        ].filter((candidate) => candidate !== slug),
      },
    ]),
  );
}
const GREETINGS = "foundations-greetings-and-introductions";
const NUMBERS = "foundations-numbers-time-and-dates";
const NEEDS = "foundations-basic-needs";
const DIRECTIONS = "foundations-simple-directions";
const FEELINGS = "daily-life-basic-feelings";
const ROUTINE = "daily-life-your-daily-routine";
const ROOMS = "house-rooms-in-your-house";
const PRICE = "basic-shopping-asking-the-price";
const WEATHER = "weather-asking-about-todays-weather";
const HOBBIES = "hobbies-talking-about-hobbies";

export const JOURNEY_FOUNDATIONS_ADDITIONAL_PLANS: Readonly<
  Record<string, LessonBankPlan>
> = {
  ...group(
    {
      [NEEDS]: [
        ["请问", "洗手间", "哪儿", "水", "需要", "帮助"],
        ["请问 + Question", "Noun + 在哪儿？"],
        "你好，需要帮助吗？",
        "A staff member responds to the learner's actual need, one request at a time. Permission is support; do not assume illness or start a medical interview.",
      ],
      [DIRECTIONS]: [
        ["图书馆", "银行", "旁边", "一直", "往", "转"],
        ["Subject + 在 + Location", "往 + Direction + Verb"],
        "你好。",
        "Wait for the tourist's destination; give one short direction at a time. A-not-A supports asking distance, not mandatory questioning.",
      ],
    },
    [GREETINGS, NUMBERS],
  ),
  ...group(
    {
      "family-introducing-your-family": [
        ["家", "口", "爸爸", "妈妈", "工作", "老师"],
        ["Subject + 有 + Object", "几 + 口 + 人"],
        "你家有几口人？",
        "Family size and members before optional occupations; 或者 offers alternatives, not a checklist. Accept any family structure and never assume parents or siblings exist.",
      ],
      "family-describing-family-members": [
        ["多大", "岁", "头发", "高", "性格", "聪明"],
        ["Number + 岁", "Subject + (很) + Adjective"],
        "你想聊哪位家人？",
        "Let the learner choose a relative; describe one feature before another. 多 + adjective supports questions only when the learner has not already supplied that fact. Do not invent relatives.",
      ],
      "family-where-your-family-lives": [
        ["住", "城市", "离", "多久", "回家", "小时"],
        [
          "Place A + 离 + Place B + Adjective (远/近)",
          "Verb Phrase + 要 + Duration",
        ],
        "你家人住在哪儿？",
        "Location and travel time first, visit frequency only if relevant. Respect a declined personal question; do not assume the learner is homesick or visits family.",
      ],
      "family-family-activities": [
        ["周末", "一般", "电影", "做饭", "公园", "散步"],
        ["Action 1 + 然后 + Action 2", "Subject + 有时候 + Verb Phrase"],
        "周末你一般做什么？",
        "Respond to the activity actually chosen; invite a family connection without requiring one. Sequence before optional additional activities; do not infer a happy household.",
        [],
        ["除了 + A + 还/也 + B"],
      ],
    },
    [GREETINGS, NUMBERS],
  ),
  ...group(
    {
      [WEATHER]: [
        ["天气", "冷", "刮风", "下雨", "可能", "伞"],
        ["Topic + 怎么样？", "Subject + 会 + Verb Phrase"],
        "今天天气怎么样？",
        "Discuss fictional or learner-provided weather, not a live forecast. Weather first, then one sensible preparation if needed; 应该 supports advice without testing every item.",
      ],
      "weather-seasons-and-preferences": [
        ["季节", "秋天", "夏天", "冬天", "春天", "游泳"],
        ["最 + Adjective/Verb", "太 + Adjective + 了"],
        "你最喜欢哪个季节？",
        "Accept the chosen season and a short reason, without demanding all four seasons. Compare mild weather only if the learner is ready.",
        [],
        ["不 + Adjective A + 也不 + Adjective B"],
      ],
      "weather-weather-and-clothing": [
        ["毛衣", "戴", "帽子", "手套", "短袖", "短裤"],
        [
          "穿 + Clothing (body/legs) / 戴 + Accessory (head/hands/etc.)",
          "别 + Verb Phrase",
        ],
        "明天天气很冷，你要穿什么？",
        "Distinguish wearing clothing from accessories in a fictional cold-weather scene. One clothing decision before an optional reason; no repeated wardrobe quiz.",
      ],
      "weather-planning-around-weather": [
        ["爬山", "查", "晴天", "如果", "改天", "出发"],
        ["如果 + Condition + 就 + Result", "那 + Suggestion"],
        "周末我们去爬山，好吗？",
        "Offer a plan, accept refusal or another activity. Adapt only to weather stated in this fictional scene; agreement and departure time are not assumed. 了 supports reporting a check, not a new grammar lesson.",
      ],
    },
    [NUMBERS, DIRECTIONS],
  ),
  ...group(
    {
      [FEELINGS]: [
        ["累", "睡", "饿", "渴", "茶", "开心"],
        ["有点儿 + Adjective", "Adjective + 不 + same Adjective"],
        "你今天怎么样？",
        "Ask neutrally, not as if the learner is visibly ill. Acknowledge hunger, thirst or tiredness and offer one relevant response; do not promise recovery or recite every feeling.",
        [],
        ["Subject + 会 + Verb Phrase + 的"],
      ],
      [ROUTINE]: [
        ["每天", "起床", "早饭", "上班", "下班", "睡觉"],
        ["先 + Action 1 + 然后 + Action 2", "Hour + 点 + 半"],
        "你每天几点起床？",
        "Time before sequence; build on the actual routine, including study or other activities instead of assuming employment. 以后 is support, not a demand to narrate the entire day.",
      ],
      "daily-life-how-you-feel-about-your-day": [
        ["过", "发生", "完成", "不过", "打算", "晚安"],
        ["Time period + 过得怎么样？", "Subject + 打算 + Verb Phrase"],
        "你今天过得怎么样？",
        "Let a simple busy/tired/happy answer suffice. A completed task is not automatically a big project or achievement; a short plan may follow only if relevant.",
        ["成就感"],
      ],
      "daily-life-weekend-routine": [
        ["早起", "晚", "看书", "出去", "平时", "一样"],
        ["A + 和 + B + 不一样", "Verb + 到 + Result"],
        "周末你也早起吗？",
        "Compare one real weekend habit with weekdays. Respect a different routine; 还要 can add a task without obliging housework or sport.",
      ],
    },
    [NUMBERS, NEEDS],
  ),
  ...group(
    {
      [ROOMS]: [
        ["房间", "客厅", "卧室", "厨房", "卫生间", "里"],
        ["Location + 有 + Object", "Number + 个 + Noun"],
        "你家有几个房间？",
        "Room count and location before furniture. Accept shared or small homes; never infer possessions or judge housing. 只有 supports a limited count naturally.",
      ],
      "house-furniture-and-objects": [
        ["床", "衣柜", "桌子", "电脑", "底下", "箱子"],
        ["Number + 张/台 + Noun", "Noun + 上/下/里 + 有 + Object"],
        "你的房间里有什么？",
        "One object and its position at a time; do not invent furniture or turn the scene into a purchase task. Maybe is optional speculation.",
        [],
        ["也许 + Statement"],
      ],
      "house-household-activities": [
        ["家务", "洗碗", "谁", "洗衣服", "星期", "打扫"],
        [
          "Subject + 会 + Verb Phrase",
          "Time period + Verb Phrase + Number + 次",
        ],
        "你平时做家务吗？",
        "Housework ability before who does it and frequency. Never assume a shared household or assign chores; 必须 is support, not a moral instruction.",
      ],
      "house-describing-your-neighborhood": [
        ["附近", "超市", "公园", "地铁站", "对面", "安静"],
        ["Subject + 有没有 + Object？", "就 + 在 + Location"],
        "你家附近有什么？",
        "Nearby places and positions first. Accept an area without a metro or shops; ask about duration living there only if appropriate.",
        [],
        ["Verb Phrase + Duration + 了"],
      ],
    },
    [DIRECTIONS, NUMBERS],
  ),
  ...group(
    {
      "phone-making-a-phone-call": [
        ["喂", "哪位", "打电话", "问", "有空", "没问题"],
        ["喂 + (rest of greeting)", "Subject + 有空 + 吗？"],
        "喂，你好。",
        "Answer as the friend; establish who called only if unknown, then follow the caller's purpose. 我就是 confirms identity; never pretend to remember an unknown person or force an invitation.",
      ],
      "phone-leaving-a-message": [
        ["经理", "回来", "留言", "回电话", "称呼", "转告"],
        ["请 + Person + Verb Phrase", "您怎么称呼？"],
        "喂，您好。",
        "Respond to the requested recipient, explain absence only in the scene, and take a short message. Ask one missing detail, never repeated identity questions. Use fictional contact details, not real private data.",
      ],
      "phone-texting-basics": [
        ["收到", "短信", "看懂", "错", "见面", "地址"],
        ["看/听 + 懂", "Verb + 错"],
        "你收到我的短信了吗？",
        "A fictional misunderstood message is the premise. Repair the actual misunderstanding, then confirm one plan; do not claim to send a real message or request a real address.",
      ],
      "phone-making-an-appointment-by-phone": [
        ["预约", "约", "已经", "贵姓", "安排", "时间"],
        ["已经 + Verb Phrase + 了", "您贵姓？"],
        "喂，您好。",
        "Let the caller state the appointment request; offer a time only after their preference. One missing detail at a time, fictional names/numbers allowed; Verb + 好了 means completion only after an agreed booking.",
      ],
    },
    [GREETINGS, NUMBERS],
  ),
  ...group(
    {
      "school-talking-about-your-studies": [
        ["学校", "大学", "上学", "专业", "年级", "学习"],
        ["Subject + 在 + place + verb", "Subject + 也 + verb/adjective"],
        "你在哪个学校上学？",
        "School before optional major/year, without an interview checklist. If the learner says they work or teach instead, accept that correction and keep a short school-related exchange; never force student status.",
      ],
      "school-classroom-objects-and-requests": [
        ["借", "笔", "本子", "黑板", "作业", "书"],
        ["可以 + verb + 吗？", "Sentence + 了"],
        "你好。",
        "Wait for the classmate's request; lend or clarify an item in the fictional classroom. Permission before changed-state 了; do not force a lesson about relationships.",
        [],
        ["Noun/Group + 之间"],
      ],
      "school-asking-about-schedules": [
        ["课", "开始", "下课", "节", "星期", "次"],
        ["几点 + verb", "Number + 次"],
        "你想问什么课？",
        "As the teacher, answer the actual class/time question with a simple fictional schedule. Use 那 for a relevant follow-up, not a requirement; do not quiz the learner on all weekdays.",
      ],
      "school-describing-a-typical-school-day": [
        ["先", "然后", "最后", "中午", "食堂", "做完"],
        [
          "先 + action 1, 然后 + action 2, 最后 + action 3",
          "还没有 + verb (+ object)",
        ],
        "你今天在学校做了什么？",
        "Let the learner narrate a short sequence; distinguish unfinished homework from a completed action without imposing a whole-day narrative or assuming completion.",
      ],
    },
    [GREETINGS, NUMBERS, ROUTINE],
  ),
  ...group(
    {
      [HOBBIES]: [
        ["爱好", "画画儿", "唱歌", "多久", "常常", "画"],
        ["平时 + subject/verb"],
        "你平时有什么爱好？",
        "Accept a hobby outside the examples and keep the next turn accessible. Frequency before optional history or sharing; do not demand childhood details.",
        [],
        [
          "从 + starting point + 就 + verb/state",
          "有机会 + subject + 想/要 + verb",
        ],
      ],
      "hobbies-sports-and-activities": [
        ["打篮球", "得", "怎么样", "运动", "跑步", "游泳"],
        ["Verb (+ object, repeated) + 得 + description"],
        "你喜欢什么运动？",
        "Follow the sport and ability actually expressed, accepting no sport. 得 describes performance, not a required pronunciation drill. Offer participation only when relevant.",
        [],
        ["Subject + 让 + person + verb/adjective"],
      ],
      "hobbies-music-movies-and-books": [
        ["电影", "过", "觉得", "推荐", "音乐", "歌"],
        ["Verb + 过", "我觉得 + statement"],
        "你最近看过什么电影？",
        "Accept not having seen a movie and move to a chosen book/song naturally. Experience before opinion/recommendation, one work at a time; 首 is support, not a trivia quiz.",
      ],
      "hobbies-comparing-free-time-preferences": [
        ["比", "安静", "跟", "一样", "比较", "累"],
        ["A + 比 + B + adjective", "A + 跟 + B + 不一样"],
        "周末你喜欢做什么？",
        "Respond to the chosen activity, then compare one feature without judging either preference. Negative comparison is an optional nuance after simple 比.",
        [],
        ["A + 没有 + B + 那么 + adjective"],
      ],
    },
    [NUMBERS, "daily-life-weekend-routine"],
  ),
  ...group(
    {
      "body-basics-parts-of-the-body": [
        ["头", "疼", "肚子", "眼睛", "脚", "休息"],
        ["Body part + 有点 + 疼 / 不 + 疼", "你怎么了？"],
        "你怎么了？",
        "Fictional language practice with a concerned friend: identify the body part the learner names, not a full symptom checklist. No diagnosis, treatment or fabricated visible symptoms.",
      ],
      "body-basics-simple-symptoms": [
        ["咳嗽", "嗓子", "发烧", "症状", "看医生", "好像"],
        ["Subject/topic + 多久了？", "好像 + statement"],
        "你今天身体怎么样？",
        "A roommate listens to the stated fictional symptom and its duration, without assuming illness or diagnosing. Before-action advice is linguistic support, not personalized treatment.",
      ],
      "body-basics-basic-pharmacy-visit": [
        ["帮助", "药", "饭后", "副作用", "明白", "可能"],
        ["可能会 + verb/adjective", "如果 + condition, 要 + action"],
        "您好，需要什么帮助？",
        "A fictional pharmacy language scene, not medical advice: rehearse asking about label directions and side effects. Do not invent medication, dosage, safety or effectiveness; leave unprovided label details unspecified.",
        ["对...有效"],
        ["Subject + 对 + problem + 有效"],
      ],
      "body-basics-giving-simple-advice": [
        ["最好", "睡觉", "知道", "健康", "建议", "没事"],
        ["最好 + verb phrase", "别 + verb + 了"],
        "我这几天没睡好，有点累。",
        "The AI is the tired coworker, not the person interviewing an ill learner. Let the learner offer ordinary rest advice; acknowledge it without a medical checklist, diagnosis or treatment.",
        [],
        ["要是 + condition, 就 + action"],
      ],
    },
    [FEELINGS, NEEDS],
  ),
  ...group(
    {
      "money-banking-at-the-bank": [
        ["银行", "账户", "开", "护照", "存", "表"],
        ["想 + verb phrase", "多少 + noun"],
        "您好，需要办理什么业务？",
        "Fictional account-opening practice; follow the requested service before one missing detail. Never request actual passport, account or financial identifiers, or claim a real account/card was issued.",
      ],
      "money-banking-using-an-atm": [
        ["机器", "坏了", "插卡", "反应", "取钱", "试试"],
        ["Verb + 了, 但是 + unexpected result", "Verb + verb (e.g., 试试)"],
        "您好，需要帮助吗？",
        "Ask what happened only if missing, then one simple fictional troubleshooting step. Never ask the learner to say a real PIN; do not declare withdrawal success before their report.",
      ],
      "money-banking-paying-bills": [
        ["付", "电费", "账单", "一共", "手机支付", "收据"],
        ["一共 + 是/花了 + amount", "也可以 + verb phrase"],
        "您好，需要帮助吗？",
        "Wait for the bill request, offer a fictional total/payment choice, and respond to their selection. No real payment, QR code or completed transaction is implied; 好了 requires stated completion.",
      ],
      "money-banking-talking-about-prices-and-budgeting": [
        ["花", "大概", "房租", "存钱", "预算", "每个月"],
        ["花 + amount + verb phrase", "有没有 + verb phrase"],
        "你平时做预算吗？",
        "Practice optional fictional spending and approximate amounts, not personal financial advice. A simple amount before stronger comparison; respect privacy and never require actual income or rent.",
        [],
        ["A + 比 + B + adjective + 多了"],
      ],
    },
    [PRICE, NUMBERS],
  ),
  ...group(
    {
      "places-hours-asking-where-things-are": [
        ["邮局", "前面", "远", "分钟", "超市", "对面"],
        ["Subject + 在 + place", "走 + time + 就到了"],
        "你好。",
        "As the local, wait for the visitor's destination, then a place or short route. No live navigation or assumed real geography; 一带 is support, not a requirement.",
      ],
      "places-hours-opening-and-closing-hours": [
        ["开门", "关门", "早上", "晚上", "到", "时间"],
        ["从 + start time + 到 + end time", "Verb + 着"],
        "您好。",
        "Staff answer the opening-hours question using a fictional consistent schedule. Start/end times before state 着; a weekend exception only if asked, never claim live opening hours.",
      ],
      "places-hours-describing-a-neighborhood": [
        ["小区", "附近", "公园", "噪音", "交通", "地铁站"],
        ["挺 + adjective + 的", "听起来 + adjective/description"],
        "你住的地方怎么样？",
        "A simple opinion and one nearby feature before a possible drawback. No assumptions about rent, noise or transport; listen instead of requiring every neighborhood detail.",
        ["唯一"],
        ["唯一的问题是 + drawback"],
      ],
      "places-hours-giving-directions-with-landmarks": [
        ["经过", "一直", "红绿灯", "右转", "左边", "火车站"],
        ["从 + place A + 到 + place B + 怎么走？", "经过 + landmark"],
        "请问，从这儿到火车站怎么走？",
        "The AI is a visitor asking the learner for directions, not the guide. Follow each supplied landmark and request one clarification only if necessary; do not fill in an unspoken route or repeat known steps.",
      ],
    },
    [DIRECTIONS, NUMBERS, "house-describing-your-neighborhood"],
  ),
  ...group(
    {
      "opinions-comparisons-likes-and-dislikes": [
        ["最", "季节", "秋天", "舒服", "夏天", "想法"],
        ["最 + verb/adjective", "对 + person + 来说, opinion"],
        "你最喜欢哪个季节？",
        "Accept the expressed preference, then a brief reason or differing view. No forced contradiction or claim that a sport dictates a favorite season.",
        ["才"],
        ["Statement + 才对"],
      ],
      "opinions-comparisons-comparing-two-things": [
        ["好吃", "贵", "服务", "一样", "差不多", "餐厅"],
        ["A + 比 + B + adjective + amount", "差不多 + 一样 + adjective"],
        "这家餐厅比那家好吃吗？",
        "Compare fictional restaurants on the learner's chosen feature; one comparison before another. Price difference is optional, and no venue agreement is assumed.",
        [],
        ["A + 没有 + B + 那么 + adjective + 吧"],
      ],
      "opinions-comparisons-agreeing-and-disagreeing": [
        ["计划", "同意", "为什么", "安排", "道理", "意见"],
        ["我不太同意 (+ 这一点)", "Statement + 也有道理"],
        "我觉得这个计划不错，你觉得呢？",
        "A manager genuinely accepts agreement or disagreement and a brief reason. Do not pressure compliance or pretend an original plan was accepted; 按 supports a decision only after agreement.",
      ],
      "opinions-comparisons-giving-reasons": [
        ["因为", "所以", "效率", "容易", "虽然", "但是"],
        [
          "因为 + reason, 所以 + result",
          "虽然 + concession, 但是 + contrasting point",
        ],
        "你喜欢一个人学习，还是和朋友一起？",
        "Reason before concession: acknowledge the learner's choice and allow nuance, not a debate or logic test. Do not infer that one preference always applies; 看情况 supports alternatives.",
      ],
    },
    [
      "weather-seasons-and-preferences",
      "hobbies-comparing-free-time-preferences",
    ],
  ),
  ...group(
    {
      "plans-and-time-past-experiences": [
        ["去过", "去年", "烤鸭", "还没", "打算", "推荐"],
        [
          "Verb + 过 (experience) vs. Verb + 了 (specific completed event)",
          "还没 + verb + 过",
        ],
        "你去过中国吗？",
        "Accept never having traveled and talk about a real or imagined experience instead. Distinguish experience from one completed event without testing all details or inventing a trip.",
      ],
      "plans-and-time-future-plans": [
        ["毕业", "打算", "要", "城市", "机会", "出发"],
        [
          "打算 (planning to) / 要 (going to, more decided) / 会 (will, prediction/promise)",
        ],
        "你以后有什么打算？",
        "Invite a plan without assuming graduation, a job or a destination. Separate intention, decided action and prediction; reassurance/promise is optional, not guaranteed success.",
        [],
        ["应该会 + verb/adjective", "我会 + verb + 的"],
      ],
      "plans-and-time-making-and-changing-plans": [
        ["本来", "说好", "突然", "改", "合适", "变化"],
        ["本来 + original plan, 还是 + 这样 + 吗？", "改到 + new time"],
        "我们本来说好周六见面，还是这样吗？",
        "The Saturday appointment is a fictional premise, not a stored learner fact. Accept cancellation or a different proposal, confirm only what was agreed; no forced promise of punctuality.",
      ],
      "plans-and-time-telling-a-simple-story": [
        ["旅行", "坐飞机", "以前", "第一次", "礼物", "这次"],
        ["先 + event 1, 然后 + event 2, 最后 + event 3", "这是我第一次 + verb"],
        "跟我说说你的旅行吧。",
        "Listen to a short real or imagined story, including no travel. A natural listener reaction before one useful prompt; no mandatory then/finally interrogation or fabricated ending.",
      ],
    },
    [NUMBERS, "school-describing-a-typical-school-day"],
  ),
  ...group(
    {
      "getting-around-taking-a-taxi": [
        ["师傅", "火车站", "上车", "堵车", "打表", "一共"],
        ["我要 + Verb Phrase", "Number + 左右"],
        "您好，您要去哪儿？",
        "The driver asks the unknown destination once, then uses a consistent fictional trip and approximate fare. Do not encourage unsafe driving or assume arrival/payment.",
        [],
        ["Condition + 的话, Result"],
      ],
      "getting-around-public-transport": [
        ["路", "车", "地铁", "线", "换乘", "站"],
        ["坐 + Route number/Line", "Verb + Number + 站"],
        "你好。",
        "Wait for the destination and offer one fictional route; transfer and stop count only when relevant. 路 as route and 站 as stop retain their own record meanings; no live transit information.",
      ],
      "getting-around-asking-for-directions": [
        ["邮局", "路口", "红绿灯", "拐", "路线", "记不住"],
        ["从 + Place + 走", "第 + Number + Measure word + Noun"],
        "你好。",
        "This lesson retains its existing intermediate difficulty inside Foundations. A passerby waits for the destination and chunks the route; if the learner cannot remember, simplify/repeat only the missing step.",
        [],
        ["Verb + 得/不 + 住"],
      ],
      "getting-around-booking-travel": [
        ["订", "火车票", "班", "二等座", "张", "出发"],
        ["哪天 + Verb Phrase？", "Option A + 还是 + Option B"],
        "您好。",
        "This lesson retains its existing intermediate difficulty inside Foundations. Let the traveler request a ticket, then resolve date/time before a seat choice. No repeated destination/date question, real booking or invented confirmation.",
      ],
    },
    [NUMBERS, DIRECTIONS, PRICE],
  ),
};
