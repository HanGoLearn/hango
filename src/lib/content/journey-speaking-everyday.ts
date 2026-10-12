import type { LessonBankPlan } from "./journey-speaking-banks";

// Explicit editorial choices from the published Everyday Life inventory.
// Related lessons are recycling candidates, never access prerequisites or
// mastery claims. Only the resolver may attach this user's step exposure.
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
const NUMBERS = "foundations-numbers-time-and-dates";
const NEEDS = "foundations-basic-needs";
const GREETINGS = "foundations-greetings-and-introductions";
const PRICE = "basic-shopping-asking-the-price";
const ROOMS = "house-rooms-in-your-house";
const HOBBIES = "hobbies-talking-about-hobbies";

export const JOURNEY_EVERYDAY_BANK_PLANS: Readonly<
  Record<string, LessonBankPlan>
> = {
  ...group(
    {
      "restaurant-entering-and-ordering": [
        ["几位", "点菜", "辣", "清淡"],
        ["我要 + [item]", "[Adjective/Verb] + 不 + [Adjective/Verb]"],
        "欢迎光临，请问几位？",
        "A waiter welcomes the customer. Party size before the learner's chosen order; accept other dishes, a mild flavor or no preference. Do not ask already-supplied details or require one particular dish.",
        ["宫保鸡丁"],
      ],
      "restaurant-ingredients-and-preferences": [
        ["推荐", "过敏", "花生", "喜欢", "香菜"],
        ["对 + [thing] + 过敏", "(不)喜欢 + [verb phrase or noun]"],
        "您好，需要什么帮助？",
        "Let the customer ask about an ingredient or recommendation. Take the stated restriction seriously in the fictional scene; never certify real allergen safety, invent an ingredient list or infer an allergy from a dislike.",
      ],
      "restaurant-requests-and-problems": [
        ["筷子", "麻烦", "弄错", "换", "不好意思"],
        ["麻烦你 + [request]", "好像 + [clause]"],
        "您好，有什么需要帮忙的吗？",
        "Respond to the actual missing item or wrong order. One relevant clarification if needed, then a fictional remedy; do not manufacture another problem or repeatedly apologize instead of answering.",
      ],
      "restaurant-payment-and-conversation": [
        ["买单", "一共", "刷信用卡", "手机支付", "分开付"],
        ["可以 + [verb phrase] + 吗？", "也可以 + [verb phrase]"],
        "您好。",
        "Wait for the bill request and follow the stated payment/split choice. Use a consistent fictional total, not a real transaction; satisfaction small talk is optional, not a compulsory final question.",
      ],
    },
    [NEEDS, PRICE],
  ),
  ...group(
    {
      "shopping-finding-a-product": [
        ["外套", "款", "区域", "材质", "棉"],
        ["你们有卖 + [item] + 吗？", "比较 + [adjective]"],
        "您好，需要什么帮助吗？",
        "Follow the item, color and material requested by the shopper; one unknown detail at a time. Offer a fictional product without assuming their preference or interrogating every attribute.",
      ],
      "shopping-price-and-comparison": [
        ["便宜", "区别", "暖和", "打折", "更"],
        ["A + 比 + B + [adjective]", "打 + [number] + 折"],
        "您好。",
        "Compare the requested feature of two fictional products, then a discount only if relevant. Keep arithmetic and product attributes consistent; do not force a sale or invent a price already contradicted by the learner.",
      ],
      "shopping-size-color-and-testing": [
        ["大一号", "试穿", "试衣间", "紧", "合适"],
        ["有点 + [adjective]", "正 + [adjective]"],
        "您好，需要什么帮助吗？",
        "Address size, fit or color in the order the shopper raises them. A fitting-room choice is fictional; never pretend to see the learner's body, decide their size or repeat a size/color they already supplied.",
      ],
      "shopping-payment-exchange-and-return": [
        ["收据", "换货", "退货", "拉链", "处理"],
        [
          "凭 + [proof] + 可以 + [action]",
          "如果 + [condition] + ，+ 可以 + [action] + 吗？",
        ],
        "您好，需要什么帮助吗？",
        "Follow purchase, exchange or return as the learner chooses, rather than requiring all three. Conditions are fictional shop policy, not legal rights or a real refund; proof may be described, never uploaded as private data.",
      ],
    },
    [
      "basic-shopping-colors-and-simple-items",
      "basic-shopping-sizes-and-preferences",
      PRICE,
      "basic-shopping-returning-an-item",
    ],
  ),
  ...group(
    {
      "hotel-reservation-and-check-in": [
        ["预订", "双人房", "护照", "房卡", "电梯"],
        ["我姓 + [surname]", "从 + [start] + 到 + [end]"],
        "您好，请问您有预订吗？",
        "Front desk staff respond to the guest's actual reservation request. Ask only missing fictional booking details; never request real identity documents or attribute the sample guest's name, room or stay to the learner.",
      ],
      "hotel-facilities-and-services": [
        ["健身房", "密码", "出租车", "叫醒服务", "安排"],
        ["可以帮我 + [verb phrase] + 吗？", "需要 + [verb phrase or noun]"],
        "您好，需要什么帮助吗？",
        "Answer the facility or service requested; do not require every service or invent a taxi/wake-up booking before agreement. Wi-Fi credentials and schedules are fictional, never ask for the learner's actual password.",
      ],
      "hotel-reporting-problems": [
        ["空调", "坏了", "维修", "换房间", "行李"],
        ["[thing] + 坏了", "如果 + [condition] + ，+ [clause with 可以]"],
        "您好，需要什么帮助吗？",
        "Listen to the guest's stated problem, offer a relevant fictional repair or alternative, and acknowledge the solution chosen. Do not invent extra faults or claim a repair, move or resolution has happened.",
      ],
      "hotel-extending-and-checking-out": [
        ["续住", "空", "退房", "账单", "收据"],
        ["多 + [verb] + 一 + [measure word]", "[time] + 前"],
        "您好。",
        "Handle extending or checking out according to the current request; do not force both or jump to the next day. Keep fictional nights/charges consistent and never bill an unstated service or claim actual payment.",
      ],
    },
    [NUMBERS, NEEDS, PRICE],
  ),
  ...group(
    {
      "making-friends-introducing-yourself-socially": [
        ["好像", "文章", "有意思", "主要", "共同", "爱好"],
        ["什么样的 + Noun", "Subject + 好像 + Statement"],
        "你好，很高兴认识你。",
        "A new acquaintance discovers interests naturally; accept any occupation, study or no job. Do not force the sample professions or infer that a shared interest or prior meeting exists. Detail with 的 is support, not a biographical checklist.",
        ["软件工程师", "自由撰稿人"],
      ],
      "making-friends-small-talk-and-hobbies": [
        ["摄影", "感兴趣", "拍", "风景", "人像", "更"],
        ["Subject + 对 + Object + 感兴趣", "一起 + Verb Phrase"],
        "你周末喜欢做什么？",
        "Follow the learner's chosen hobby even when it is not photography. Compare interests only when relevant, do not assume a camera or require a joint activity; DSLR detail is optional.",
        ["单反"],
      ],
      "making-friends-making-plans": [
        ["要不要", "部", "场次", "电影院", "门口", "提前"],
        ["要不要 + Verb Phrase？", "提前 + Verb Phrase"],
        "这周末要不要一起看电影？",
        "A friend offers a fictional invitation, accepts refusal or another activity, then resolves missing time/place. No repeated scheduling questions, automatic agreement or required film genre.",
        ["科幻片"],
      ],
      "making-friends-exchanging-contact-info": [
        ["加", "微信", "扫", "二维码", "联系", "账号"],
        ["Verb + 上 + 了", "直接 + Verb Phrase"],
        "我们加个微信，保持联系，好吗？",
        "Offer contact exchange once and accept a refusal or different platform. Use fictional identifiers only, never actual private contact data or claim to send/scan anything. A promise to stay in touch is optional.",
      ],
    },
    [GREETINGS, HOBBIES, NUMBERS],
  ),
  ...group(
    {
      "health-pharmacy-describing-symptoms": [
        ["感冒药", "症状", "咳嗽", "饭后", "副作用", "发烧"],
        ["从 + Time + 开始的", "可能 + 会 + Verb Phrase"],
        "您好，需要什么帮助？",
        "Fictional pharmacy language practice: hear the stated symptoms and rehearse questions about an explicitly provided label. Do not invent medication, dosage, effectiveness or safety. Real medical concerns require professional care, not a role-play prescription.",
        [],
        ["Time period + Verb + Number + 次"],
      ],
      "health-doctors-visit": [
        ["头疼", "恶心", "药物", "过敏", "检查", "压力"],
        ["Subject + 对 + Substance + 过敏", "给 + Person + Verb Phrase"],
        "您好，哪里不舒服？",
        "A fictional doctor's visit rehearses explaining a concern and clarifying the scene's information. Do not diagnose, prescribe, perform a real examination or guarantee recovery; do not turn every reply into a full symptom checklist. Real concerns require professional care.",
        [],
        ["Condition + 就会 + Result"],
      ],
      "health-emergency-situations": [
        ["救命", "晕倒", "救护车", "意识", "挂电话", "担心"],
        ["不要 + Verb Phrase", "Time + 内"],
        "您好，请问发生了什么事？",
        "This lesson retains its existing advanced difficulty inside Everyday Life. A fictional operator listens and requests one missing scene detail; do not invent physical first-aid instructions or promise actual dispatch. If a real emergency is stated, stop role-play and direct the learner to local emergency services.",
        [],
        ["让 + Person + Verb Phrase"],
      ],
      "health-follow-up-and-insurance": [
        ["复诊", "保险卡", "报销", "费用", "发票", "等"],
        ["Verb + 完", "Action + 以后 + 才能 + Result"],
        "您好，需要什么帮助？",
        "This lesson retains its existing advanced difficulty inside Everyday Life. Follow the requested appointment, fictional process or reimbursement clarification; no real insurance identifiers, guaranteed coverage or prescription collection before the stated prerequisite.",
      ],
    },
    ["body-basics-simple-symptoms", NEEDS, "daily-life-basic-feelings"],
  ),
  ...group(
    {
      "grocery-shopping-making-a-shopping-list": [
        ["鸡蛋", "牛奶", "不用", "写下来", "蔬菜", "缺"],
        ["不用 + verb phrase", "Subject(s) + 都 + verb + 了"],
        "我们需要买什么？",
        "A partner checks the fictional household's actual stated needs; do not invent missing food or demand all items. No-need and finished-list expressions before optional 把, without an obligatory grammar drill.",
        [],
        ["Subject + 把 + object + verb + resultative/complement"],
      ],
      "grocery-shopping-at-the-grocery-store": [
        ["米", "区", "斤", "两", "价钱", "一共"],
        ["Item + 一斤 + 多少钱？", "两 + measure word + noun"],
        "您好，需要什么帮助？",
        "Let the shopper ask location, price per weight or quantity; respond to the unknown detail only. Fictional unit price, quantity and total must agree; do not reuse the sample's inconsistent total or certify real freshness.",
        [],
        ["刚 + verb + 的"],
      ],
      "grocery-shopping-comparing-fresh-produce": [
        ["种", "苹果", "区别", "甜", "酸", "装"],
        ["这种 + description, 那种 + description", "还是 + choice + 吧"],
        "您好，想买什么水果？",
        "Compare one relevant feature of fictional produce and respect the shopper's choice. Never assume children, tastes or a purchase; 帮 supports offering assistance rather than adding more questions.",
      ],
      "grocery-shopping-planning-a-week-of-meals": [
        ["鸡肉", "鱼", "改成", "豆腐", "做饭", "计划"],
        ["改成 + new item", "我 + task A, 你 + task B, 怎么样？"],
        "这周我们吃什么？",
        "Roommates negotiate a fictional menu and responsibilities, accepting dislikes or an alternative. One change before one task allocation; do not dictate a seven-day menu or pronounce agreement before both accept it.",
        [],
        ["就这么定了"],
      ],
    },
    [ROOMS, PRICE, "house-household-activities"],
  ),
  ...group(
    {
      "coffee-shop-ordering-at-a-coffee-shop": [
        ["拿铁", "大杯", "中杯", "加糖", "热的", "冰的"],
        ["A + 还是 + B？", "Adjective + 的"],
        "您好，想喝点什么？",
        "The barista follows the drink already ordered, then only missing size/temperature/sugar. Do not ask every option when already supplied, force coffee instead of another drink or claim a real payment. Choice + 就可以了 is support.",
      ],
      "coffee-shop-meeting-a-friend-for-coffee": [
        ["好久不见", "最近", "换", "同事", "消息", "搬家"],
        ["好久不见！", "要 + verb phrase + 了"],
        "好久不见！你最近怎么样？",
        "An old friend catches up on the news actually shared. Do not assign the sample's job change, colleagues or move to the learner; react before an optional follow-up and allow no particular news.",
      ],
      "coffee-shop-making-small-talk-while-waiting": [
        ["人多", "等", "环境", "安静", "刚才", "一会儿"],
        ["刚才 + statement", "还在 + verb"],
        "今天人真多啊。",
        "The fictional wait provides a small-talk opening; follow the learner's topic rather than checking weather and atmosphere in sequence. Do not claim a real forecast, observed scene or completed drink order.",
        [],
        ["快 + verb/adjective + 了"],
      ],
      "coffee-shop-suggesting-where-to-meet-next-time": [
        ["吵", "换个地方", "地铁站", "价钱", "差不多", "下次"],
        ["听起来 + adjective/description", "跟 + comparison target + 差不多"],
        "下次我们换个地方见面，怎么样？",
        "A friend suggests an alternative, accepts keeping this place or another proposal, then considers the reason offered. No invented real venue/address, actual message or meeting agreement; anticipation is optional.",
      ],
    },
    [NUMBERS, PRICE, "weather-asking-about-todays-weather"],
  ),
  ...group(
    {
      "gym-fitness-signing-up-at-the-gym": [
        ["办", "健身卡", "选择", "半年", "划算", "付款"],
        ["办 + object (card, document, etc.)", "有哪些 + noun？"],
        "您好，需要什么帮助？",
        "Front desk staff answer the requested fictional membership options before a term/payment choice. No pressure to buy the longest plan, actual registration, real billing information or invented signed form.",
      ],
      "gym-fitness-asking-about-class-schedules": [
        ["课程", "瑜伽", "提前", "报名", "满", "位置"],
        ["每周 + day(s) + time", "满了 + 就不能 + verb + 了"],
        "您好，想了解什么课程？",
        "A trainer responds to the class and time requested, then fictional availability only if enrollment is desired. Do not require every class, repeat the chosen time or assume a place has already been booked.",
      ],
      "gym-fitness-talking-about-fitness-goals": [
        ["目标", "变得", "练", "坚持", "强度", "进步"],
        ["变得 + adjective", "先 + starting point, 慢慢 + gradual change"],
        "你有什么健身目标？",
        "Discuss the learner's stated fictional goal and schedule without judging their body or imposing a training program. Gradual-change language is not a personalized exercise prescription or guarantee of progress.",
      ],
      "gym-fitness-recovering-from-a-minor-injury": [
        ["脚踝", "弄伤", "扭", "疼得厉害", "休息", "如果"],
        ["把 + body part + 弄伤了", "Verb + 得 + 厉害"],
        "哪里不舒服？",
        "Fictional injury-description practice with a trainer, not diagnosis or treatment. Do not invent severity, prescribe icing or guarantee a safe return after two or three days. If the learner reports a real injury, recommend professional assessment rather than a role-play recovery plan.",
      ],
    },
    [NUMBERS, HOBBIES, "body-basics-parts-of-the-body"],
  ),
  ...group(
    {
      "renting-apartment-viewing-an-apartment": [
        ["房间", "阳台", "电梯", "停车位", "状态", "光线"],
        ["Number + 室 + number + 厅", "还带 + feature"],
        "您好，欢迎来看房。",
        "An agent answers the visitor's chosen layout/facility question using a consistent fictional property. Do not invent a real listing, visual inspection, tenancy or amenities already contradicted in the scene.",
        [],
        ["刚 + verb + 过"],
      ],
      "renting-apartment-asking-about-rent-and-utilities": [
        ["房租", "押金", "水电费", "包括", "交", "网费"],
        ["押 + number + 付 + number", "Item + 包括在 + total + 里吗？"],
        "您好。",
        "A landlord clarifies fictional rent, deposit and inclusion terms as asked, one amount at a time. These are not current market prices or legal defaults; do not assume utilities are included or require personal finances.",
      ],
      "renting-apartment-negotiating-the-lease": [
        ["商量", "签", "宠物", "接受", "条件", "合同"],
        ["Item + 可以商量吗？", "如果 + condition, 我可以 + offer"],
        "您好，有什么想商量的吗？",
        "Respond to the tenant's actual proposed term or pet question. A fictional concession may be declined or countered; no pressured signature, real legal advice or assumed acceptance of all conditions.",
      ],
      "renting-apartment-signing-the-contract": [
        ["条款", "解约", "退还", "维修", "承担", "签字"],
        ["Condition + 的话, result", "由 + person + verb phrase"],
        "在签合同之前，我们先看一下条款。",
        "The landlord explains explicitly fictional terms and answers the clause actually questioned. Do not treat the sample's deposit forfeiture as a law, invent binding rights, dismiss uncertainty or assume signature/acceptance; 只要...就 supports a relevant conditional exception.",
      ],
    },
    [ROOMS, "foundations-simple-directions", PRICE],
  ),
  ...group(
    {
      "post-office-mailing-a-package": [
        ["寄", "包裹", "收件人", "重量", "限制", "公斤"],
        ["寄到 + place", "不能超过 + amount"],
        "您好，需要办理什么业务？",
        "The clerk follows the chosen fictional destination/content/weight. Request only missing details with dummy addresses; limits are scene data, not a current shipping regulation, and no parcel is actually accepted or sent.",
      ],
      "post-office-choosing-a-shipping-method": [
        ["邮寄", "方式", "普通", "快递", "差", "选"],
        ["有几种 + noun + 方式？", "价钱差 + amount"],
        "您好。",
        "Compare fictional delivery options on speed or price as requested. Respect urgency and the method chosen; do not repeatedly ask a settled choice or guarantee a real next-day delivery.",
      ],
      "post-office-tracking-a-package": [
        ["查", "快递单号", "运输", "途中", "预计", "送到"],
        ["在 + noun + 途中", "预计 + time + verb phrase"],
        "您好，需要什么帮助？",
        "Use a dummy tracking number only if the learner wants a fictional lookup and has not supplied one. Simulated status/ETA are not real tracking; answer the last question without extra routine service questions.",
      ],
      "post-office-dealing-with-a-lost-package": [
        ["显示", "弄丢", "赔偿", "确认", "工作日", "解决"],
        ["一直 + 没(有) + verb", "如果 + condition, 我们会 + action"],
        "您好，需要什么帮助？",
        "Distinguish a reported delay from confirmed loss; offer a fictional investigation or conditional remedy. No automatic lost status, guaranteed compensation, real refund or policy; 尽全力 is optional reassurance, not a fixed promise.",
      ],
    },
    [NUMBERS, PRICE, "phone-texting-basics"],
  ),
  ...group(
    {
      "social-events-introducing-yourself-at-a-party": [
        ["主人", "同事", "原来", "认识", "怎么", "感兴趣"],
        ["是怎么 + verb + 的？", "原来是这样"],
        "你好，很高兴认识你。",
        "Another guest introduces themselves and follows the learner's actual connection to the fictional host. Accept any occupation/relationship and do not infer shared employment; no biographical interview or invented prior acquaintance.",
      ],
      "social-events-finding-common-ground": [
        ["爬山", "巧", "风景", "特别是", "主意", "约"],
        ["Statement, 特别是 + specific example", "这样 + benefit/result"],
        "你平时喜欢做什么？",
        "Discover a genuinely stated interest before claiming common ground or suggesting a fictional outing. Accept other hobbies or no invitation, and do not demand location/contact details or copy the sample's mountain preference.",
      ],
      "social-events-exchanging-compliments": [
        ["哪里哪里", "眼光", "过奖", "夸奖", "好看", "特别"],
        ["哪里哪里", "过奖了"],
        "你好。",
        "Let a compliment emerge within the fictional party, without pretending to observe the learner's clothing or hairstyle. Accept thanks as well as modest responses; do not require reciprocal flattery or shopping plans.",
      ],
      "social-events-politely-ending-a-conversation": [
        ["聊天", "该", "打招呼", "保持联系", "下次", "回头见"],
        ["我该 + verb + 了", "我们保持联系吧"],
        "很高兴认识你。",
        "Let the learner practice a polite social departure; accept it without another compulsory question or forced contact exchange. A scene farewell is not a technical End command; respect the app's closing controls and never restart a topic to fill the timer.",
      ],
    },
    [GREETINGS, "making-friends-introducing-yourself-socially", HOBBIES],
  ),
  ...group(
    {
      "weather-plans-checking-the-weather-forecast": [
        ["天气预报", "下雨", "气温", "度", "转晴", "最好"],
        ["最高 + temp，最低 + temp", "会不会 + verb phrase？"],
        "明天天气怎么样？",
        "A friend discusses a clearly fictional forecast or learner-provided information. Temperature before an optional preparation, not a live weather claim or mandatory list of high/low/rain/clothing questions.",
      ],
      "weather-plans-making-weather-dependent-plans": [
        ["野餐", "要是", "如果", "博物馆", "决定", "结果"],
        ["如果 + condition，就 + result", "要是 + situation + 怎么办？"],
        "周末我们去公园野餐吧。",
        "A friend offers an activity and accepts refusal or a different plan. Add one backup only if relevant; no real forecast, guaranteed fun, actual message or automatic agreement.",
        [],
        ["不管怎样，都 + result"],
      ],
      "weather-plans-suggesting-a-reschedule": [
        ["恐怕", "临时", "通知", "加班", "提前", "改"],
        ["恐怕 + clause", "给 + person + 添麻烦了"],
        "不好意思，明天的计划恐怕要改一下。",
        "The friend proposes a change to a fictional existing plan. Respond to the learner's availability and reason rather than obliging a particular replacement date or treating the sample's overtime as the learner's job.",
      ],
      "weather-plans-confirming-the-new-plan": [
        ["确认", "老地方", "万一", "变化", "定", "地点"],
        ["万一 + situation，action", "还是 + noun/detail + 吗？"],
        "我们再确认一下见面的时间，好吗？",
        "Confirm the plan actually established in this session or ask one unknown detail. Never invent a shared old place, prior meeting, fixed time or a promise that plans cannot change; 就这么定了 follows actual agreement only.",
      ],
    },
    [
      "weather-asking-about-todays-weather",
      NUMBERS,
      "plans-and-time-making-and-changing-plans",
    ],
  ),
  ...group(
    {
      "roommate-issues-raising-a-noise-complaint": [
        ["声音", "睡不着", "耳机", "理解", "体谅", "沟通"],
        ["verb + 不着", "互相 + verb"],
        "你想跟我说什么？",
        "The roommate listens to the learner's actual fictional complaint. Acknowledge the effect without automatic blame or inventing game-playing; offer a proportionate solution and do not repeat the complaint after it was clear.",
      ],
      "roommate-issues-splitting-household-chores": [
        ["家务", "打扫", "轮流表", "负责", "轮流", "公平"],
        ["verb + 得 + adjective/degree", "一人一 + measure word/unit"],
        "我们聊聊做家务的事吧。",
        "Negotiate one fair fictional responsibility or rotation, not a unilateral chore schedule. Accept disagreement and a counterproposal; don't declare an unequal share or new agreement before the learner establishes it.",
      ],
      "roommate-issues-addressing-a-guest-policy-disagreement": [
        ["商量", "过夜", "反对", "说一声", "注意", "想法"],
        ["有件事我想跟你商量一下", "不是 + strong claim，只是 + actual intent"],
        "有什么事想跟我商量吗？",
        "The roommate listens to the visitor-policy concern and acknowledges boundaries. No invented real guests, forced concession or dismissal of privacy; action + 就好 can specify a mutually accepted small change.",
      ],
      "roommate-issues-resolving-a-dispute-over-a-broken-item": [
        ["搅拌机", "弄坏", "平摊", "修理费", "修", "同意"],
        ["我不是想 + undesired action", "要不 + suggestion"],
        "你想跟我说什么？",
        "Hear the reported fictional shared-item problem, separate blame from a possible repair, and negotiate a remedy. Never identify a culprit, impose equal costs or claim repair/agreement without evidence.",
      ],
    },
    ["house-household-activities", "daily-life-basic-feelings", ROOMS],
  ),
  ...group(
    {
      "online-shopping-asking-about-a-product-online": [
        ["大号", "有货", "颜色", "材质", "发货", "下单"],
        [
          "除了 + known option，还有 + other options？",
          "condition + 的话，就 + result",
        ],
        "您好，需要什么帮助？",
        "Online customer service answers the actual product question and only missing order details. Stock/material/shipping are fictional scene data, not a live listing; do not assume an order or assert unsupported material certainty.",
        [],
        ["百分之百 + statement"],
      ],
      "online-shopping-tracking-an-online-order": [
        ["订单", "订单号", "包裹", "运输途中", "延误", "预计"],
        ["还要多久才能 + verb？", "number 到 number + unit"],
        "您好，需要什么帮助？",
        "Use a dummy order number once if needed; explain a fictional delay without repeated lookups, apologies or mandatory patience. Distinguish estimate from guarantee and do not claim access to a real order system.",
      ],
      "online-shopping-reporting-a-wrong-item": [
        ["商品", "具体情况", "失误", "换成", "重新", "退回去"],
        ["verb的是 + expected，但 + verb的是 + actual", "为您 + verb"],
        "您好，需要什么帮助？",
        "Contrast what was ordered with what arrived using only the learner's stated facts. Offer a fictional remedy after clarification; no automatic admission, free shipment, keep-item policy or actual dispatch.",
      ],
      "online-shopping-requesting-a-refund-for-a-damaged-item": [
        ["破损", "照片", "申请", "全额退款", "工作日", "到账"],
        ["所以我想申请 + request", "number 到 number 个 + unit"],
        "您好，需要什么帮助？",
        "Hear the reported fictional damage and desired resolution. Describe imagined evidence verbally, not a real photo upload; no guaranteed refund, invented arrival date, unsafe disposal instruction or confirmation of money received.",
        [],
        ["verb + 掉"],
      ],
    },
    [
      "shopping-finding-a-product",
      "shopping-payment-exchange-and-return",
      "post-office-tracking-a-package",
    ],
  ),
  ...group(
    {
      "job-interview-basics-introducing-your-work-background": [
        ["背景", "毕业于", "专业", "负责", "应聘", "职位"],
        ["毕业于 + institution/major", "主要负责 + area/task"],
        "请简单介绍一下你的背景。",
        "An interviewer listens to a short actual or fictional background, including no work experience. One relevant follow-up at a time; do not assign the sample's degree, bank career, responsibilities or ambition to the learner.",
      ],
      "job-interview-basics-describing-strengths-and-weaknesses": [
        ["优点", "责任心", "缺点", "效率", "改进", "举例子"],
        ["以前会，不过我在 + 慢慢/逐渐 + 改进", "先 + action 1，再 + action 2"],
        "你觉得自己有什么优点？",
        "Ask one professional reflection, accept the answer and request an example only if useful. No compulsory strength-weakness sequence, judgments about character or scripted admission of excessive perfectionism.",
      ],
      "job-interview-basics-discussing-salary-expectations": [
        ["薪资", "期望", "税前", "预算", "福利", "行业"],
        ["根据 + basis，statement", "如果 + condition，我可以考虑"],
        "你对薪资有什么期望？",
        "Negotiate fictional expectations tactfully, accepting a range, a question or time to consider. Do not request actual income, invent market averages, guarantee benefits or pressure acceptance; pauses are not poor language ability.",
      ],
      "job-interview-basics-asking-the-interviewer-thoughtful-questions": [
        ["团队", "构成", "分工", "培训机制", "晋升", "标准"],
        ["能介绍一下 + topic + 吗？", "主要看 + criteria"],
        "你对这个职位还有什么想了解的吗？",
        "Give the candidate room to ask their own question, not another interview script. Explain a consistent fictional team or process concisely; no real offer, guaranteed promotion or assumed hiring result.",
      ],
    },
    [
      "school-talking-about-your-studies",
      "plans-and-time-future-plans",
      "opinions-comparisons-agreeing-and-disagreeing",
    ],
  ),
};
