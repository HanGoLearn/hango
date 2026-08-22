// Seeds the FULL HSK1-9 item bank for the adaptive placement exam
// (project/placement-exam-questions.md is the source of truth - this
// script is a straight transcription of that document, kept in sync with
// it per the "document first, then database" workflow). Replaces
// scripts/seed-placement-exam-hsk1-2.mjs's original 78-question,
// MC-only, HSK1-2-only content with the full 211-question draft:
// 66 Vocabulary + 95 Grammar (77 MC + 18 SENTENCE_ORDERING) + 28 Reading +
// 22 Listening, across HSK1 through HSK7-9.
//
// Speaking is NOT seeded here - it has no PlacementQuestion rows (see
// placement-exam-questions.md's "## Speaking" section; needs the live
// Realtime API pipeline, design-only for now).
//
// Destructive: clears all existing PlacementQuestion rows (cascades to
// PlacementQuestionOption/PlacementListeningScript/PlacementListeningLine/
// PlacementAttempt) and PlacementSession rows before reseeding, since
// HSK1-2 content itself changed (trimmed) since the original seed.
//
// Run: node node_modules/tsx/dist/cli.mjs scripts/seed-placement-exam-full.mjs

import { config } from "dotenv";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

config({ path: ".env.local" });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function mc(prompt, options, category) {
  return {
    prompt,
    category,
    type: "MULTIPLE_CHOICE",
    options: {
      create: options.map((o, i) => ({ content: o.text, isCorrect: !!o.correct, order: i })),
    },
  };
}

function ordering(prompt, order, category) {
  return {
    prompt,
    category,
    type: "SENTENCE_ORDERING",
    correctAnswer: { order },
  };
}

// ---------------------------------------------------------------------------
// VOCABULARY (66)
// ---------------------------------------------------------------------------
const vocabulary = {
  1: [
    mc('"医院" means:', [{ text: "Hospital", correct: true }, { text: "School" }, { text: "Restaurant" }, { text: "Bank" }], "noun"),
    mc('"老师" means:', [{ text: "Teacher", correct: true }, { text: "Doctor" }, { text: "Student" }, { text: "Friend" }], "noun"),
    mc('Which word means "friend"?', [{ text: "朋友", correct: true }, { text: "老师" }, { text: "学生" }, { text: "医生" }], "noun"),
    mc('"喜欢" means:', [{ text: "To like", correct: true }, { text: "To eat" }, { text: "To buy" }, { text: "To go" }], "verb"),
    mc('"认识" means:', [{ text: "To know / recognize (a person)", correct: true }, { text: "To see" }, { text: "To learn" }, { text: "To ask" }], "verb"),
    mc('Which word means "to study"?', [{ text: "学习", correct: true }, { text: "工作" }, { text: "睡觉" }, { text: "说话" }], "verb"),
    mc('"高兴" means:', [{ text: "Happy", correct: true }, { text: "Sad" }, { text: "Tired" }, { text: "Angry" }], "adjective"),
    mc('Which word means "pretty"?', [{ text: "漂亮", correct: true }, { text: "大" }, { text: "小" }, { text: "好" }], "adjective"),
    mc('"冷" means:', [{ text: "Cold", correct: true }, { text: "Hot" }, { text: "Warm" }, { text: "Cool" }], "adjective"),
    mc("你是学生＿？ (question particle)", [{ text: "吗", correct: true }, { text: "了" }, { text: "的" }, { text: "吧" }], "function"),
    mc('我们走＿。 ("Let\'s go" - suggestion particle)', [{ text: "吧", correct: true }, { text: "吗" }, { text: "呢" }, { text: "的" }], "function"),
    mc("这是我＿书。 (possessive particle)", [{ text: "的", correct: true }, { text: "了" }, { text: "吗" }, { text: "呢" }], "function"),
  ],
  2: [
    mc('"同学" means:', [{ text: "Classmate", correct: true }, { text: "Teacher" }, { text: "Neighbor" }, { text: "Stranger" }], "noun"),
    mc('"公园" means:', [{ text: "Park", correct: true }, { text: "School" }, { text: "Hospital" }, { text: "Store" }], "noun"),
    mc('Which word means "movie"?', [{ text: "电影", correct: true }, { text: "电视" }, { text: "音乐" }, { text: "新闻" }], "noun"),
    mc('"打算" means:', [{ text: "To plan to", correct: true }, { text: "To buy" }, { text: "To ask" }, { text: "To forget" }], "verb"),
    mc('"觉得" means:', [{ text: "To feel / think", correct: true }, { text: "To see" }, { text: "To hear" }, { text: "To say" }], "verb"),
    mc('Which word means "to help"?', [{ text: "帮忙", correct: true }, { text: "工作" }, { text: "休息" }, { text: "游泳" }], "verb"),
    mc('"特别" means:', [{ text: "Special / particularly", correct: true }, { text: "Normal" }, { text: "Difficult" }, { text: "Boring" }], "adjective"),
    mc('Which word means "simple"?', [{ text: "简单", correct: true }, { text: "难" }, { text: "贵" }, { text: "大" }], "adjective"),
    mc('"一般" means:', [{ text: "Ordinary / generally", correct: true }, { text: "Special" }, { text: "Excellent" }, { text: "Terrible" }], "adjective"),
    mc("我去＿中国，很好玩。 (past-experience particle)", [{ text: "过", correct: true }, { text: "了" }, { text: "着" }, { text: "的" }], "function"),
    mc("她坐＿看电视。 (ongoing/durative particle)", [{ text: "着", correct: true }, { text: "了" }, { text: "过" }, { text: "的" }], "function"),
    mc('你要咖啡＿茶？ ("or" in a question)', [{ text: "还是", correct: true }, { text: "或者" }, { text: "也" }, { text: "都" }], "function"),
  ],
  3: [
    mc('"经验" means:', [{ text: "Experience", correct: true }, { text: "Money" }, { text: "Time" }, { text: "Health" }], "noun"),
    mc('"压力" means:', [{ text: "Pressure / stress", correct: true }, { text: "Happiness" }, { text: "Freedom" }, { text: "Success" }], "noun"),
    mc('"态度" means:', [{ text: "Attitude", correct: true }, { text: "Habit" }, { text: "Personality" }, { text: "Opinion" }], "noun"),
    mc('"讨论" means:', [{ text: "To discuss", correct: true }, { text: "To decide" }, { text: "To agree" }, { text: "To refuse" }], "verb"),
    mc('"解决" means:', [{ text: "To solve / resolve", correct: true }, { text: "To create" }, { text: "To hide" }, { text: "To forget" }], "verb"),
    mc('Which word means "to suggest"?', [{ text: "建议", correct: true }, { text: "决定" }, { text: "拒绝" }, { text: "反对" }], "verb"),
    mc('"复杂" means:', [{ text: "Complicated", correct: true }, { text: "Simple" }, { text: "Interesting" }, { text: "Boring" }], "adjective"),
    mc('"严重" means:', [{ text: "Serious", correct: true }, { text: "Minor" }, { text: "Common" }, { text: "Rare" }], "adjective"),
    mc('Which word means "reasonable"?', [{ text: "合理", correct: true }, { text: "便宜" }, { text: "免费" }, { text: "安全" }], "adjective"),
    mc('你等了很久，我＿来，对不起。 ("only just now" - marking lateness)', [{ text: "才", correct: true }, { text: "就" }, { text: "还" }, { text: "也" }], "function"),
    mc('你＿说，我＿糊涂。 ("the more...the more")', [{ text: "越 / 越", correct: true }, { text: "更 / 更" }, { text: "才 / 才" }, { text: "就 / 就" }], "function"),
    mc("他从早上到现在，＿没有休息。 (continuously, the whole time)", [{ text: "一直", correct: true }, { text: "才" }, { text: "越" }, { text: "就" }], "function"),
  ],
  4: [
    mc('"竞争" means:', [{ text: "Competition", correct: true }, { text: "Cooperation" }, { text: "Comparison" }, { text: "Communication" }], "noun"),
    mc('"效率" means:', [{ text: "Efficiency", correct: true }, { text: "Effect" }, { text: "Effort" }, { text: "Result" }], "noun"),
    mc('Which word means "responsibility"?', [{ text: "责任", correct: true }, { text: "权利" }, { text: "机会" }, { text: "兴趣" }], "noun"),
    mc('"承担" means:', [{ text: "To bear / take on (responsibility)", correct: true }, { text: "To refuse" }, { text: "To forget" }, { text: "To share" }], "verb"),
    mc('"影响" means:', [{ text: "To influence / affect", correct: true }, { text: "To ignore" }, { text: "To copy" }, { text: "To measure" }], "verb"),
    mc('Which word means "to adapt"?', [{ text: "适应", correct: true }, { text: "改变" }, { text: "发展" }, { text: "保持" }], "verb"),
    mc('"明显" means:', [{ text: "Obvious", correct: true }, { text: "Hidden" }, { text: "Complicated" }, { text: "Rare" }], "adjective"),
    mc('"普遍" means:', [{ text: "Common / widespread", correct: true }, { text: "Unique" }, { text: "Expensive" }, { text: "Ancient" }], "adjective"),
    mc('Which word means "positive / proactive"?', [{ text: "积极", correct: true }, { text: "消极" }, { text: "被动" }, { text: "懒惰" }], "adjective"),
    mc('他很有钱，＿并不快乐。 (contrastive "but, surprisingly")', [{ text: "却", correct: true }, { text: "也" }, { text: "就" }, { text: "才" }], "function"),
    mc('他＿忘了带钥匙。 ("unexpectedly, to one\'s surprise")', [{ text: "竟然", correct: true }, { text: "已经" }, { text: "终于" }, { text: "还" }], "function"),
    mc('你＿想说什么？ ("exactly, after all")', [{ text: "究竟", correct: true }, { text: "大概" }, { text: "也许" }, { text: "可能" }], "function"),
  ],
  5: [
    mc('"现象" means:', [{ text: "Phenomenon", correct: true }, { text: "Rule" }, { text: "Habit" }, { text: "Accident" }], "noun"),
    mc('"趋势" means:', [{ text: "Trend", correct: true }, { text: "Result" }, { text: "Reason" }, { text: "Method" }], "noun"),
    mc('Which word means "viewpoint / opinion"?', [{ text: "观点", correct: true }, { text: "态度" }, { text: "性格" }, { text: "兴趣" }], "noun"),
    mc('"强调" means:', [{ text: "To emphasize", correct: true }, { text: "To ignore" }, { text: "To forget" }, { text: "To hide" }], "verb"),
    mc('"承认" means:', [{ text: "To admit", correct: true }, { text: "To deny" }, { text: "To doubt" }, { text: "To suggest" }], "verb"),
    mc('Which word means "to overlook / ignore"?', [{ text: "忽略", correct: true }, { text: "重视" }, { text: "发现" }, { text: "研究" }], "verb"),
  ],
  6: [
    mc('"局限性" means:', [{ text: "Limitation", correct: true }, { text: "Advantage" }, { text: "Opportunity" }, { text: "Requirement" }], "noun"),
    mc('Which word means "consensus"?', [{ text: "共识", correct: true }, { text: "矛盾" }, { text: "争论" }, { text: "怀疑" }], "noun"),
    mc('"机制" means:', [{ text: "Mechanism", correct: true }, { text: "Machine" }, { text: "Method" }, { text: "Model" }], "noun"),
    mc('"削弱" means:', [{ text: "To weaken", correct: true }, { text: "To strengthen" }, { text: "To create" }, { text: "To repair" }], "verb"),
    mc('Which word means "to compensate / make up for"?', [{ text: "弥补", correct: true }, { text: "放弃" }, { text: "拒绝" }, { text: "忽略" }], "verb"),
    mc('"验证" means:', [{ text: "To verify", correct: true }, { text: "To guess" }, { text: "To invent" }, { text: "To copy" }], "verb"),
  ],
  7: [
    mc('"悖论" means:', [{ text: "Paradox", correct: true }, { text: "Theory" }, { text: "Proof" }, { text: "Question" }], "noun"),
    mc('Which word means "paradigm"?', [{ text: "范式", correct: true }, { text: "模型" }, { text: "系统" }, { text: "结构" }], "noun"),
    mc('"本质" means:', [{ text: "Essence / true nature", correct: true }, { text: "Appearance" }, { text: "Price" }, { text: "Size" }], "noun"),
    mc('"颠覆" means:', [{ text: "To subvert / overturn", correct: true }, { text: "To support" }, { text: "To repeat" }, { text: "To describe" }], "verb"),
    mc('Which word means "to weigh / balance (options)"?', [{ text: "权衡", correct: true }, { text: "选择" }, { text: "决定" }, { text: "放弃" }], "verb"),
    mc('"诠释" means:', [{ text: "To interpret / explain", correct: true }, { text: "To translate" }, { text: "To copy" }, { text: "To criticize" }], "verb"),
  ],
};

// ---------------------------------------------------------------------------
// GRAMMAR (95: 77 MC + 18 SENTENCE_ORDERING) - category names match the
// official HSK 3.0 grammar syllabus (中文水平考试 HSK 考试大纲, 中外语言
// 交流合作中心, Nov 2025). HSK7-9 shares one combined grammar table per the
// official syllabus's own structure.
// ---------------------------------------------------------------------------
const grammar = {
  1: [
    mc("我＿说一点儿中文。", [{ text: "会", correct: true }, { text: "是" }, { text: "在" }, { text: "的" }], "能愿动词"),
    mc("A: 你＿去吗？ B: 我很忙，不能去。", [{ text: "能", correct: true }, { text: "会" }, { text: "是" }, { text: "要" }], "能愿动词"),
    mc('How would you say "I want to drink coffee"?', [{ text: "我要喝咖啡。", correct: true }, { text: "我会喝咖啡。" }, { text: "我很喝咖啡。" }, { text: "我喝咖啡要。" }], "能愿动词"),
    mc("他＿老师。", [{ text: "是", correct: true }, { text: "在" }, { text: "有" }, { text: "很" }], '"是"字句1'),
    mc('How would you say "I am not a student"?', [{ text: "我不是学生。", correct: true }, { text: "我没是学生。" }, { text: "我不有学生。" }, { text: "我很不学生。" }], '"是"字句1'),
    mc("A: 这＿你的书吗？ B: 是，这是我的书。", [{ text: "是", correct: true }, { text: "在" }, { text: "有" }, { text: "的" }], '"是"字句1'),
    mc("A: 你叫＿名字？ B: 我叫王明。", [{ text: "什么", correct: true }, { text: "谁" }, { text: "哪儿" }, { text: "怎么" }], "疑问代词"),
    mc("你去＿？", [{ text: "哪儿", correct: true }, { text: "什么" }, { text: "谁" }, { text: "几" }], "疑问代词"),
    mc("A: ＿是你的老师？ B: 王老师是我的老师。", [{ text: "谁", correct: true }, { text: "什么" }, { text: "哪儿" }, { text: "怎么样" }], "疑问代词"),
    mc("我家有三＿人。", [{ text: "口", correct: true }, { text: "个" }, { text: "件" }, { text: "本" }], "量词"),
    mc("这＿书很有意思。", [{ text: "本", correct: true }, { text: "个" }, { text: "件" }, { text: "口" }], "量词"),
    mc("我买了一＿咖啡。", [{ text: "杯", correct: true }, { text: "个" }, { text: "件" }, { text: "本" }], "量词"),
    mc("她＿看书呢。 (ongoing action)", [{ text: "正在", correct: true }, { text: "了" }, { text: "过" }, { text: "的" }], "动作的态"),
    mc("我吃＿饭了。 (completed action)", [{ text: "了", correct: true }, { text: "正在" }, { text: "过" }, { text: "的" }], "动作的态"),
    mc("A: 你在做什么？ B: 我在写作业＿。", [{ text: "呢", correct: true }, { text: "了" }, { text: "吗" }, { text: "吧" }], "动作的态"),
    ordering('Build the sentence for: "I don\'t want to go to the park today."', ["我", "今天", "不", "想", "去", "公园。"], "word order"),
    ordering('Build the sentence for: "He is also my friend."', ["他", "也", "是", "我的", "朋友。"], "word order"),
    ordering('Build the sentence for: "What do you want to drink today?"', ["你", "今天", "想", "喝", "什么？"], "word order"),
  ],
  2: [
    mc("今天＿昨天热。", [{ text: "比", correct: true }, { text: "和" }, { text: "跟" }, { text: "从" }], "比较句1"),
    mc('How would you say "This book is 2 years newer than that one"?', [{ text: "这本书比那本新两年。", correct: true }, { text: "这本书两年比那本新。" }, { text: "这本书新比那本两年。" }, { text: "这本书比那本两年新。" }], "比较句1"),
    mc('How would you say "I am not as tall as him"?', [{ text: "我没有他高。", correct: true }, { text: "我不比他高。" }, { text: "我没有他那么高吗。" }, { text: "他没有我高。" }], "比较句1"),
    mc("A: 你的作业做＿了吗？ B: 做完了。", [{ text: "完", correct: true }, { text: "错" }, { text: "懂" }, { text: "会" }], "结果补语1"),
    mc("我说＿了，不是这个意思。", [{ text: "错", correct: true }, { text: "好" }, { text: "完" }, { text: "懂" }], "结果补语1"),
    mc("这个字我看不＿。", [{ text: "懂", correct: true }, { text: "错" }, { text: "完" }, { text: "会" }], "结果补语1"),
    mc('你＿这件衣服，怎么样？ ("try it on")', [{ text: "试试", correct: true }, { text: "试" }, { text: "试了" }, { text: "试着" }], "动词重叠"),
    mc('我们＿吧，别紧张。 ("let\'s rest a bit")', [{ text: "休息休息", correct: true }, { text: "休息休" }, { text: "休息了" }, { text: "休息着" }], "动词重叠"),
    mc('你＿这个问题。 ("think it over a bit")', [{ text: "想一想", correct: true }, { text: "想想想" }, { text: "想了想" }, { text: "在想" }], "动词重叠"),
    mc("你要咖啡＿茶？", [{ text: "还是", correct: true }, { text: "或者" }, { text: "也" }, { text: "都" }], "选择复句"),
    mc("你是学生＿是老师？", [{ text: "还是", correct: true }, { text: "或者" }, { text: "但是" }, { text: "所以" }], "选择复句"),
    mc('How would you say "Are you going by bus or by subway?"?', [{ text: "你坐公共汽车还是坐地铁？", correct: true }, { text: "你坐公共汽车或者坐地铁？" }, { text: "你坐公共汽车也坐地铁？" }, { text: "你坐公共汽车所以坐地铁？" }], "选择复句"),
    mc("＿今天下雨，＿我们不去公园了。", [{ text: "因为...所以", correct: true }, { text: "虽然...但是" }, { text: "如果...就" }, { text: "因为...但是" }], "因果复句"),
    mc("因为他很忙，＿没有时间吃饭。", [{ text: "所以", correct: true }, { text: "但是" }, { text: "而且" }, { text: "还是" }], "因果复句"),
    mc('How would you say "Because it\'s cold today, I\'m wearing a coat"?', [{ text: "因为今天冷，所以我穿大衣。", correct: true }, { text: "虽然今天冷，所以我穿大衣。" }, { text: "因为今天冷，但是我穿大衣。" }, { text: "如果今天冷，所以我穿大衣。" }], "因果复句"),
    ordering('Build the sentence for: "This book is much more expensive than that one."', ["这本书", "比", "那本", "贵", "很多。"], "word order"),
    ordering('Build the sentence for: "Because there\'s an exam tomorrow, I can\'t go out today."', ["因为", "明天", "要", "考试，", "所以", "我", "今天", "不能", "出去。"], "word order"),
    ordering('Build the sentence for: "Should we discuss this problem together for a bit?"', ["我们", "要不要", "一起", "商量商量", "这个", "问题？"], "word order"),
  ],
  3: [
    mc("请把门＿。", [{ text: "关上", correct: true }, { text: "关了吗" }, { text: "在关" }, { text: "关的" }], '"把"字句1'),
    mc('How would you say "Please put the book on the table"?', [{ text: "请把书放在桌子上。", correct: true }, { text: "请把书放桌子上了。" }, { text: "请书放在桌子把上。" }, { text: "请把桌子上放书。" }], '"把"字句1'),
    mc('我把作业＿了。 ("finished", result complement)', [{ text: "做完", correct: true }, { text: "做在" }, { text: "做着" }, { text: "做过" }], '"把"字句1'),
    mc("我的手机＿他借走了。", [{ text: "被", correct: true }, { text: "把" }, { text: "让" }, { text: "对" }], "被动句1"),
    mc('How would you say "The window was broken by him"?', [{ text: "窗户被他打破了。", correct: true }, { text: "窗户把他打破了。" }, { text: "他被窗户打破了。" }, { text: "窗户打破被他了。" }], "被动句1"),
    mc("这个消息已经＿大家知道了。", [{ text: "被", correct: true }, { text: "把" }, { text: "由" }, { text: "替" }], "被动句1"),
    mc("这件事跟那件事＿一样重要。", [{ text: "一样", correct: true }, { text: "一起" }, { text: "一直" }, { text: "一定" }], "比较句2"),
    mc('"他不比我聪明，可是更努力。" - what does this mean?', [{ text: "He isn't smarter than me, but he works harder", correct: true }, { text: "He is much smarter than me" }, { text: "He is exactly as smart as me" }, { text: "He doesn't work as hard as me" }], "比较句2"),
    mc('我比他＿两岁。 ("older", A比B+adj+数量)', [{ text: "大", correct: true }, { text: "远" }, { text: "贵" }, { text: "慢" }], "比较句2"),
    mc('"你不是已经知道了吗？" - what does the speaker imply?', [{ text: "They believe the listener already knew", correct: true }, { text: "They are asking for the first time" }, { text: "They don't believe the listener" }, { text: "They are confused" }], '反问句1 ("不是...吗")'),
    mc('How would you rhetorically ask "Isn\'t this too expensive?"', [{ text: "这不是太贵了吗？", correct: true }, { text: "这是太贵了吗？" }, { text: "这不太贵吗？" }, { text: "这不是贵了吗？" }], '反问句1 ("不是...吗")'),
    mc('"这不是很清楚吗？" is an example of:', [{ text: "A rhetorical question expecting agreement", correct: true }, { text: "A genuine question" }, { text: "A command" }, { text: "An apology" }], '反问句1 ("不是...吗")'),
    mc("＿你努力，＿一定能成功。", [{ text: "只要...就", correct: true }, { text: "只有...才" }, { text: "如果...就" }, { text: "因为...所以" }], "条件复句 (只要...就 / 只有...才)"),
    mc("＿你亲自去，他＿会相信你。", [{ text: "只有...才", correct: true }, { text: "只要...就" }, { text: "虽然...但是" }, { text: "因为...所以" }], "条件复句 (只要...就 / 只有...才)"),
    ordering('Build the sentence for: "Please put the book on the table."', ["请", "把", "书", "放在", "桌子上。"], "word order"),
    ordering('Build the sentence for: "My phone was borrowed by him."', ["我的手机", "被", "他", "借走了。"], "word order"),
    ordering('Build the sentence for: "This matter isn\'t as simple as you think."', ["这件事", "没有", "你想的", "那么", "简单。"], "word order"),
  ],
  4: [
    mc('Which sentence correctly uses 把 for "He lost his wallet"?', [{ text: "他把钱包丢了。", correct: true }, { text: "他丢把钱包了。" }, { text: "把他钱包丢了。" }, { text: "他钱包把丢了。" }], '"把"字句2'),
    mc('请你把这件事再＿一下。 ("explain again briefly")', [{ text: "说明", correct: true }, { text: "说明了" }, { text: "在说明" }, { text: "说明着" }], '"把"字句2'),
    mc('他把房间＿得很干净。 ("cleaned very clean" - state complement)', [{ text: "打扫", correct: true }, { text: "打扫了" }, { text: "打扫过" }, { text: "在打扫" }], '"把"字句2'),
    mc("这个杯子＿他打破了，真可惜。", [{ text: "叫", correct: true }, { text: "把" }, { text: "由" }, { text: "替" }], "被动句2 (叫/让)"),
    mc("这次的失败＿他明白了很多道理。", [{ text: "让", correct: true }, { text: "把" }, { text: "由" }, { text: "替" }], "被动句2 (叫/让)"),
    mc("我的画儿＿小孩儿弄脏了，没关系，可以再画一张。", [{ text: "让", correct: true }, { text: "把" }, { text: "由" }, { text: "替" }], "被动句2 (叫/让)"),
    mc('"坐火车不如坐飞机快，可是便宜很多。" - what does this mean?', [{ text: "Taking the train is not as fast as flying, but it's much cheaper", correct: true }, { text: "Taking the train is faster than flying" }, { text: "Both are equally fast" }, { text: "Flying is cheaper than the train" }], "比较句3 (A不如B / 跟...相比)"),
    mc("＿以前相比，现在的生活方便多了。", [{ text: "跟", correct: true }, { text: "比" }, { text: "让" }, { text: "被" }], "比较句3 (A不如B / 跟...相比)"),
    mc('How would you say "This method isn\'t as good as that one"?', [{ text: "这个办法不如那个好。", correct: true }, { text: "这个办法比那个不好。" }, { text: "这个办法没有不如那个好。" }, { text: "那个办法不如这个好吗。" }], "比较句3 (A不如B / 跟...相比)"),
    mc('"没有你的帮助，我不可能完成这个任务。" - what does this emphasize?', [{ text: "That the narrator absolutely needed the listener's help", correct: true }, { text: "That the narrator didn't need help" }, { text: "That the task was impossible even with help" }, { text: "That the listener refused to help" }], "双重否定句 (double negation)"),
    mc('How would you use double negation to say "You have to go" (emphatically)?', [{ text: "你不能不去。", correct: true }, { text: "你可以不去。" }, { text: "你不去也行。" }, { text: "你去不去都行。" }], "双重否定句 (double negation)"),
    mc('"他不是不知道，只是不想说。" - what is implied?', [{ text: "He actually knows, but chooses not to say", correct: true }, { text: "He genuinely doesn't know" }, { text: "He wants to say but can't" }, { text: "He forgot" }], "双重否定句 (double negation)"),
    mc("＿明天下雨，我们＿要去。", [{ text: "即使...也", correct: true }, { text: "因为...所以" }, { text: "虽然...但是" }, { text: "只要...就" }], "让步复句 (即使...也 / 就是...也)"),
    mc('How would you say "Even if you don\'t agree, I will still do it"?', [{ text: "就是你不同意，我也要做。", correct: true }, { text: "因为你不同意，我也要做。" }, { text: "如果你不同意，我就不做。" }, { text: "虽然你不同意，但是我不做。" }], "让步复句 (即使...也 / 就是...也)"),
    mc("＿他再忙，＿会抽时间陪家人。", [{ text: "即使...也", correct: true }, { text: "因为...所以" }, { text: "只有...才" }, { text: "不但...而且" }], "让步复句 (即使...也 / 就是...也)"),
    ordering('Build the sentence for: "This method isn\'t as good as that one."', ["这个办法", "不如", "那个", "好。"], "word order"),
    ordering('Build the sentence for: "You have to go - it\'s your responsibility."', ["你", "不能", "不去，", "这是", "你的", "责任。"], "word order"),
    ordering('Build the sentence for: "No matter how busy he is, he\'ll still make time to be with family."', ["他", "再", "忙", "也", "会", "抽时间", "陪", "家人。"], "word order"),
  ],
  5: [
    mc("这件事已经＿他给解释清楚了。", [{ text: "被", correct: true }, { text: "把" }, { text: "让" }, { text: "由" }], "被动句3"),
    mc('How would you say "The problem was already explained clearly by him"?', [{ text: "这个问题已经被他解释清楚了。", correct: true }, { text: "这个问题已经把他解释清楚了。" }, { text: "他已经被这个问题解释清楚了。" }, { text: "这个问题被解释已经清楚了他。" }], "被动句3"),
    mc("请把这本书＿他。", [{ text: "给", correct: true }, { text: "在" }, { text: "跟" }, { text: "对" }], "把字句3"),
    mc('How would you say "He gave the key to me"?', [{ text: "他把钥匙给了我。", correct: true }, { text: "他给了钥匙把我。" }, { text: "他把我给了钥匙。" }, { text: "他给把钥匙了我。" }], "把字句3"),
    mc("＿多难，我也要坚持完成。", [{ text: "哪怕...也", correct: true }, { text: "因为...所以" }, { text: "只要...就" }, { text: "虽然...但是" }], "让步复句 (哪怕...也)"),
    mc('How would you say "Even if no one supports me, I will still do it"?', [{ text: "哪怕没有人支持我，我也要做。", correct: true }, { text: "因为没有人支持我，我也要做。" }, { text: "如果没有人支持我，就不做。" }, { text: "虽然没有人支持我，但是不做。" }], "让步复句 (哪怕...也)"),
    ordering('Build the sentence for: "The problem was already explained clearly by him."', ["这个问题", "已经", "被他", "解释清楚了。"], "word order"),
    ordering('Build the sentence for: "No matter how difficult it is, I will still persist and finish."', ["不管", "多难，", "我", "也", "要", "坚持完成。"], "word order"),
  ],
  6: [
    mc("这场雨＿我们的计划全打乱了。", [{ text: "把", correct: true }, { text: "被" }, { text: "让" }, { text: "给" }], '"把"字句4 (inanimate subject - genuinely advanced)'),
    mc('How would you say "This mistake almost ruined the whole project"?', [{ text: "这个错误几乎把整个项目毁了。", correct: true }, { text: "这个错误几乎被整个项目毁了。" }, { text: "整个项目几乎把这个错误毁了。" }, { text: "这个错误把几乎整个项目毁了。" }], '"把"字句4 (inanimate subject - genuinely advanced)'),
    mc("＿是参加过这个项目的人，＿知道有多难。", [{ text: "凡是...都", correct: true }, { text: "除非...才" }, { text: "只要...就" }, { text: "无论...都" }], "条件复句 (凡是...都 / 除非...才)"),
    mc("＿你亲自解释，大家＿会相信。", [{ text: "除非...才", correct: true }, { text: "凡是...都" }, { text: "因为...所以" }, { text: "即使...也" }], "条件复句 (凡是...都 / 除非...才)"),
    mc("他＿年纪不大，可经验很丰富。", [{ text: "虽", correct: true }, { text: "但" }, { text: "却" }, { text: "可" }], "转折复句 (虽...但/可/却)"),
    mc('Which rephrasing of "Although this method works, it\'s not perfect" uses a terse literary connector correctly?', [{ text: "这个方法虽有效，却不完美。", correct: true }, { text: "这个方法虽有效，所以不完美。" }, { text: "这个方法因为有效，却不完美。" }, { text: "这个方法虽有效，因此不完美。" }], "转折复句 (虽...但/可/却)"),
    ordering('Build the sentence for: "This mistake almost ruined the whole project."', ["这个错误", "几乎", "把", "整个项目", "毁了。"], "word order"),
    ordering('Build the sentence for: "Unless you explain it yourself, no one will believe it."', ["除非", "你", "亲自", "解释，", "不然", "没有人", "会", "相信。"], "word order"),
  ],
  7: [
    mc("这个方法的效果明显＿传统方法。", [{ text: "优于", correct: true }, { text: "比于" }, { text: "多于" }, { text: "胜过于" }], "比较句5 (A+形容词+于/过+B)"),
    mc('How would you say "The risk of this plan far exceeds its benefit"?', [{ text: "这个方案的风险远大于它的收益。", correct: true }, { text: "这个方案的风险远比它的收益。" }, { text: "这个方案的风险远超它的收益于。" }, { text: "这个方案的收益远大于它的风险吗。" }], "比较句5 (A+形容词+于/过+B)"),
    mc("我＿放弃这个机会，＿违背自己的原则。", [{ text: "宁可...也不", correct: true }, { text: "因为...所以" }, { text: "即使...也" }, { text: "不但...而且" }], "选择复句 (宁可/宁愿...也不)"),
    mc('How would you say "I would rather fail than give up trying"?', [{ text: "我宁愿失败，也不愿放弃尝试。", correct: true }, { text: "我宁愿失败，所以放弃尝试。" }, { text: "我因为失败，也不愿放弃尝试。" }, { text: "我宁愿放弃尝试，也不愿失败。" }], "选择复句 (宁可/宁愿...也不)"),
    mc("＿这么简单的问题他＿答不出来，更不用说复杂的了。", [{ text: "连...都", correct: true }, { text: "凡是...都" }, { text: "不但...而且" }, { text: "虽然...但是" }], "递进复句 (连...都..., 更不用说)"),
    mc('How would you say "Even the experts can\'t fully explain this phenomenon, let alone ordinary people"?', [{ text: "连专家都无法完全解释这个现象，更不用说普通人了。", correct: true }, { text: "虽然专家都无法完全解释这个现象，更不用说普通人了。" }, { text: "因为专家都无法完全解释这个现象，更不用说普通人了。" }, { text: "连专家都无法完全解释这个现象，所以普通人了。" }], "递进复句 (连...都..., 更不用说)"),
    ordering('Build the sentence for: "The risk of this plan far exceeds its benefit."', ["这个方案的风险", "远", "大于", "它的收益。"], "word order"),
    ordering('Build the sentence for: "I would rather fail than give up trying."', ["我", "宁愿", "失败，", "也不愿", "放弃", "尝试。"], "word order"),
  ],
};

// ---------------------------------------------------------------------------
// READING (28)
// ---------------------------------------------------------------------------
const reading = {
  1: [
    {
      passage: "我叫李明。我是学生，我的学校很大。我喜欢我的老师，他很好。",
      questions: [
        mc("What does Li Ming do?", [{ text: "Student", correct: true }, { text: "Teacher" }, { text: "Doctor" }, { text: "Friend" }], "comprehension"),
        mc("Who does Li Ming like?", [{ text: "His teacher", correct: true }, { text: "His friend" }, { text: "His father" }, { text: "His classmate" }], "comprehension"),
      ],
    },
    {
      passage: "今天天气很冷。我在家看书，我不想出去。",
      questions: [
        mc("How is the weather today?", [{ text: "Very cold", correct: true }, { text: "Very hot" }, { text: "Very nice" }, { text: "Rainy" }], "comprehension"),
        mc("What is he doing?", [{ text: "Reading a book", correct: true }, { text: "Sleeping" }, { text: "Working" }, { text: "Eating" }], "comprehension"),
      ],
    },
  ],
  2: [
    {
      passage: "我觉得学中文比学英文难，可是因为我很喜欢，所以每天都练习。已经学了半年了，现在我能看懂简单的故事，也能跟中国朋友聊几句了。虽然说话还是不太流利，但是我相信以后会越来越好。",
      questions: [
        mc("Why does the narrator practice every day?", [{ text: "Because they really like it", correct: true }, { text: "Because it's easy" }, { text: "Because the teacher requires it" }, { text: "Because it's fun for other people" }], "comprehension"),
        mc("What can the narrator do now, after half a year?", [{ text: "Understand simple stories and chat a little with Chinese friends", correct: true }, { text: "Write essays in Chinese" }, { text: "Give speeches in Chinese" }, { text: "Watch the news without subtitles" }], "comprehension"),
        mc("How does the narrator feel about their speaking ability?", [{ text: "Not very fluent yet, but believes it will improve", correct: true }, { text: "Already very fluent" }, { text: "Doesn't think it will ever improve" }, { text: "Prefers not to speak at all" }], "comprehension"),
      ],
    },
    {
      passage: "这个周末你想在家休息休息，还是想出去运动？如果天气好，我们可以去爬山；要是下雨，就在家看电影吧。我比较喜欢爬山，因为运动完以后心情会更好。你呢？你运动完以后觉得怎么样？",
      questions: [
        mc("What will they do if it rains?", [{ text: "Watch a movie at home", correct: true }, { text: "Go hiking" }, { text: "Go to a restaurant" }, { text: "Stay in bed" }], "comprehension"),
        mc("Why does the narrator prefer hiking?", [{ text: "Because their mood improves afterward", correct: true }, { text: "Because it's cheaper" }, { text: "Because friends are going too" }, { text: "Because the weather is always good" }], "comprehension"),
        mc("What does the narrator ask at the end?", [{ text: "How the other person feels after exercising", correct: true }, { text: "What time they'll meet" }, { text: "Where they will go" }, { text: "How much it costs" }], "comprehension"),
      ],
    },
  ],
  3: [
    {
      passage: "最近工作压力越来越大，我常常加班到很晚。虽然经理已经给了我一些建议，但是问题还是没有完全解决。我打算跟同事讨论一下，看看有没有更好的办法。",
      questions: [
        mc("Why is the narrator stressed?", [{ text: "Work pressure has been increasing and they often work overtime", correct: true }, { text: "They lost their job" }, { text: "They have too much free time" }, { text: "Their boss is too kind" }], "comprehension"),
        mc("What has the manager already done?", [{ text: "Given some suggestions", correct: true }, { text: "Solved the whole problem" }, { text: "Fired the narrator" }, { text: "Given a raise" }], "comprehension"),
        mc("What does the narrator plan to do next?", [{ text: "Discuss with colleagues to find a better solution", correct: true }, { text: "Quit the job" }, { text: "Ignore the problem" }, { text: "Ask for a vacation" }], "comprehension"),
      ],
    },
    {
      passage: "这个城市的空气污染问题很严重，很多人开始骑自行车上班，而不是开车。政府也提出了一些新的规定，希望能一起解决这个问题。不过，要真正改变还需要很长时间。",
      questions: [
        mc("What environmental problem does the passage describe?", [{ text: "Serious air pollution", correct: true }, { text: "Water shortage" }, { text: "Noise pollution" }, { text: "Traffic accidents" }], "comprehension"),
        mc("What are many people doing instead of driving?", [{ text: "Riding bicycles to work", correct: true }, { text: "Taking the subway" }, { text: "Walking" }, { text: "Working from home" }], "comprehension"),
        mc("According to the passage, how long will real change take?", [{ text: "A long time", correct: true }, { text: "One week" }, { text: "It already happened" }, { text: "It's impossible" }], "comprehension"),
      ],
    },
  ],
  4: [
    {
      passage: "随着竞争越来越激烈，很多公司开始重视员工的工作效率，而不只是工作时间的长短。有的员工虽然每天加班，但效率并不高；相反，有些人虽然工作时间不长，却能承担更多的责任，完成更多的任务。这说明，效率比时间更重要。",
      questions: [
        mc("What are many companies starting to value more?", [{ text: "Work efficiency, not just how many hours are worked", correct: true }, { text: "Only working hours" }, { text: "Employee friendships" }, { text: "Office decoration" }], "comprehension"),
        mc("What's said about employees who work overtime every day?", [{ text: "Their efficiency isn't necessarily high", correct: true }, { text: "They are always the most productive" }, { text: "They get promoted fastest" }, { text: "They are unhappy" }], "comprehension"),
        mc("What does the passage conclude?", [{ text: "Efficiency matters more than time spent working", correct: true }, { text: "Overtime is always necessary" }, { text: "Responsibility doesn't matter" }, { text: "Everyone should work fewer hours" }], "comprehension"),
      ],
    },
    {
      passage: "近年来，环境污染问题越来越受到人们的关注。不少城市已经采取了一系列措施，比如限制汽车数量、鼓励使用公共交通等。虽然这些措施在短期内可能带来一些不便，但从长远来看，对改善空气质量是有帮助的。究竟这些政策能不能真正解决问题，还需要时间来验证。",
      questions: [
        mc("What have many cities done?", [{ text: "Taken measures like limiting cars and encouraging public transit", correct: true }, { text: "Banned all cars immediately" }, { text: "Ignored the pollution problem" }, { text: "Moved factories abroad" }], "comprehension"),
        mc("What's acknowledged about these measures in the short term?", [{ text: "They might cause some inconvenience", correct: true }, { text: "They are completely free" }, { text: "They have no effect at all" }, { text: "Everyone supports them" }], "comprehension"),
        mc("What does the passage say about whether these policies will really work?", [{ text: "It still needs time to be verified", correct: true }, { text: "They have already failed" }, { text: "They are guaranteed to succeed" }, { text: "No one knows what they are" }], "comprehension"),
      ],
    },
  ],
  5: [
    {
      passage: "很多人认为，年轻人越来越不愿意和父母住在一起，这已经成为一种普遍的社会现象。有人强调这是独立意识增强的表现，也有人担心这会削弱家庭关系。不管怎样，这个趋势短期内很难改变。",
      questions: [
        mc("What social phenomenon does the passage describe?", [{ text: "Young people increasingly unwilling to live with their parents", correct: true }, { text: "Rising housing prices" }, { text: "Declining birth rates" }, { text: "Increasing unemployment" }], "comprehension"),
        mc("What does the passage say about this trend?", [{ text: "It's unlikely to change in the short term", correct: true }, { text: "It has already reversed" }, { text: "Everyone agrees it's bad" }, { text: "It only happens in one country" }], "comprehension"),
      ],
    },
  ],
  6: [
    {
      passage: "这个理论虽然在学术界得到了广泛认可，但也存在一定的局限性。有学者指出，现有的研究机制还不足以完全验证这个理论在所有情况下都成立。凡是提出质疑的人，都希望看到更多的实证数据，而不是仅仅依靠理论推导。",
      questions: [
        mc("What is said about the theory?", [{ text: "It's widely accepted but has certain limitations", correct: true }, { text: "It has been completely disproven" }, { text: "Everyone fully agrees with it" }, { text: "It was just proposed yesterday" }], "comprehension"),
        mc("What do the people who question the theory want?", [{ text: "More empirical data, not just theoretical reasoning", correct: true }, { text: "To ban the theory" }, { text: "To replace the researchers" }, { text: "Nothing, they were satisfied" }], "comprehension"),
      ],
    },
  ],
  7: [
    {
      passage: "有学者提出，真正颠覆性的创新往往来自对已有范式的质疑，而不是对细节的改进。这种观点听起来有一定道理，但也有人认为，过度强调颠覆本身可能忽略了渐进式改进的价值——毕竟，大多数进步其实是一点一点积累起来的，而不是一夜之间发生的。",
      questions: [
        mc("What do some scholars claim about truly disruptive innovation?", [{ text: "It often comes from questioning existing paradigms, not refining details", correct: true }, { text: "It always comes from young people" }, { text: "It never actually happens" }, { text: "It's always accidental" }], "comprehension"),
        mc("What is the counterargument mentioned in the passage?", [{ text: "Overemphasizing disruption may overlook the value of gradual improvement", correct: true }, { text: "Disruption is always harmful" }, { text: "Gradual improvement never works" }, { text: "There is no real disagreement on this topic" }], "comprehension"),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// LISTENING (22) - speaker voices: 男 -> echo, 女 -> nova (gender-aware
// convention fixed for Dialogue.DialogueSpeaker.voice).
// ---------------------------------------------------------------------------
const listening = {
  1: [
    {
      lines: [
        { speaker: "男", voice: "echo", text: "你好！你叫什么名字？" },
        { speaker: "女", voice: "nova", text: "我叫王芳。你呢？" },
        { speaker: "男", voice: "echo", text: "我叫李明。你是学生吗？" },
        { speaker: "女", voice: "nova", text: "是，我是学生。你也是学生吗？" },
        { speaker: "男", voice: "echo", text: "不是，我是老师。" },
      ],
      questions: [
        mc("What is the woman's name?", [{ text: "王芳", correct: true }, { text: "李芳" }, { text: "王明" }, { text: "李明" }], "comprehension"),
        mc("Is the man a student or a teacher?", [{ text: "Student" }, { text: "Teacher", correct: true }], "comprehension"),
      ],
    },
    {
      lines: [
        { speaker: "男", voice: "echo", text: "你家有几个人？" },
        { speaker: "女", voice: "nova", text: "我家有四个人，爸爸、妈妈、哥哥和我。" },
        { speaker: "男", voice: "echo", text: "你哥哥做什么？" },
        { speaker: "女", voice: "nova", text: "他是医生。" },
      ],
      questions: [
        mc("How many people are in the woman's family?", [{ text: "Four", correct: true }, { text: "Three" }, { text: "Five" }, { text: "Two" }], "comprehension"),
        mc("What does the woman's older brother do?", [{ text: "Doctor", correct: true }, { text: "Teacher" }, { text: "Student" }, { text: "Driver" }], "comprehension"),
      ],
    },
  ],
  2: [
    {
      lines: [
        { speaker: "男", voice: "echo", text: "你周末做什么？" },
        { speaker: "女", voice: "nova", text: "我打算和朋友一起去公园。你呢？" },
        { speaker: "男", voice: "echo", text: "我已经买了电影票，晚上去看电影。" },
        { speaker: "女", voice: "nova", text: "是吗？那你几点走？" },
        { speaker: "男", voice: "echo", text: "六点半。电影七点开始。" },
      ],
      questions: [
        mc("What time does the movie start?", [{ text: "Seven o'clock", correct: true }, { text: "Six thirty" }, { text: "Eight o'clock" }, { text: "Five o'clock" }], "comprehension"),
        mc("What is the woman planning to do this weekend?", [{ text: "Go to the park with a friend", correct: true }, { text: "Watch a movie" }, { text: "Buy tickets" }, { text: "Go to work" }], "comprehension"),
      ],
    },
    {
      lines: [
        { speaker: "男", voice: "echo", text: "你觉得这家餐厅怎么样？" },
        { speaker: "女", voice: "nova", text: "很不错，菜很好吃，可是有点儿贵。" },
        { speaker: "男", voice: "echo", text: "没关系，今天我请客。" },
        { speaker: "女", voice: "nova", text: "谢谢你！" },
      ],
      questions: [
        mc("What does the woman think of the restaurant?", [{ text: "Good food, but a bit expensive", correct: true }, { text: "Not tasty" }, { text: "Very cheap" }, { text: "Not clean" }], "comprehension"),
        mc("Who is paying?", [{ text: "The man", correct: true }, { text: "The woman" }, { text: "They're splitting it" }, { text: "The waiter" }], "comprehension"),
      ],
    },
  ],
  3: [
    {
      lines: [
        { speaker: "男", voice: "echo", text: "你看起来很累，怎么了？" },
        { speaker: "女", voice: "nova", text: "最近工作压力太大了，每天都要加班。" },
        { speaker: "男", voice: "echo", text: "你跟经理说了吗？也许他能帮你解决一下。" },
        { speaker: "女", voice: "nova", text: "说了，他建议我先跟同事商量一下，看看能不能重新分配任务。" },
      ],
      questions: [
        mc("Why does the woman look tired?", [{ text: "Work pressure and having to work overtime every day", correct: true }, { text: "She didn't sleep well" }, { text: "She's sick" }, { text: "She's worried about money" }], "comprehension"),
        mc("What did the manager suggest?", [{ text: "Discuss with colleagues about redistributing tasks", correct: true }, { text: "Take a vacation" }, { text: "Quit the job" }, { text: "Hire more staff" }], "comprehension"),
      ],
    },
    {
      lines: [
        { speaker: "男", voice: "echo", text: "这两份工作你选哪个？" },
        { speaker: "女", voice: "nova", text: "一个工资更高，可是压力也更大；另一个比较轻松，但是工资低一些。" },
        { speaker: "男", voice: "echo", text: "那你打算怎么办？" },
        { speaker: "女", voice: "nova", text: "我觉得健康更重要，所以我可能会选轻松一点的那个。" },
      ],
      questions: [
        mc("What's the difference between the two jobs?", [{ text: "One pays more but has more pressure; the other is more relaxed but pays less", correct: true }, { text: "Both pay the same" }, { text: "One is full-time, one is part-time" }, { text: "One is closer to home" }], "comprehension"),
        mc("Which job does the woman lean toward, and why?", [{ text: "The more relaxed one, because she thinks health is more important", correct: true }, { text: "The higher-paying one, for the money" }, { text: "Neither - she'll look for a third option" }, { text: "The closer one, to save commute time" }], "comprehension"),
      ],
    },
  ],
  4: [
    {
      lines: [
        { speaker: "男", voice: "echo", text: "听说你们公司最近竞争特别激烈。" },
        { speaker: "女", voice: "nova", text: "是啊，效率不高的话很难留下来。不过我倒觉得这样能让人更积极。" },
        { speaker: "男", voice: "echo", text: "你不怕压力太大吗？" },
        { speaker: "女", voice: "nova", text: "说实话，一开始确实不适应，但慢慢就习惯了，现在反而觉得挺有意思的。" },
      ],
      questions: [
        mc("What does the woman think about the intense competition at her company?", [{ text: "It's difficult to stay if efficiency isn't high, but it makes people more proactive", correct: true }, { text: "It's completely unfair" }, { text: "She's planning to quit" }, { text: "She doesn't notice it" }], "comprehension"),
        mc("How does the woman feel about the pressure now, compared to at first?", [{ text: "She wasn't used to it at first, but now finds it interesting", correct: true }, { text: "She still can't handle it" }, { text: "She was fine with it from day one" }, { text: "She's more stressed than ever" }], "comprehension"),
      ],
    },
    {
      lines: [
        { speaker: "女", voice: "nova", text: "你觉得限制汽车数量这个政策有效果吗？" },
        { speaker: "男", voice: "echo", text: "短期内可能不太方便，但我觉得长远来看是有帮助的。" },
        { speaker: "女", voice: "nova", text: "可是也有人说，这样并不能真正解决污染问题，究竟根本原因在哪儿？" },
        { speaker: "男", voice: "echo", text: "这个我也不太清楚，可能需要更多研究吧。" },
      ],
      questions: [
        mc("What is the man's opinion on the car-limiting policy?", [{ text: "It's inconvenient short-term but helpful long-term", correct: true }, { text: "It's completely useless" }, { text: "It should be cancelled immediately" }, { text: "It's the only solution needed" }], "comprehension"),
        mc("What does the woman question?", [{ text: "Whether the policy addresses the real root cause of pollution", correct: true }, { text: "Whether cars should be banned entirely" }, { text: "Whether the man owns a car" }, { text: "Whether the policy is expensive" }], "comprehension"),
      ],
    },
  ],
  5: [
    {
      lines: [
        { speaker: "男", voice: "echo", text: "现在很多年轻人不愿意跟父母住在一起，你怎么看？" },
        { speaker: "女", voice: "nova", text: "我觉得这是正常的，说明大家越来越独立了。不过我承认，这样确实会让家人之间的联系变少。" },
        { speaker: "男", voice: "echo", text: "那你自己会选择跟父母住吗？" },
        { speaker: "女", voice: "nova", text: "目前不会，但以后有了孩子，可能会重新考虑。" },
      ],
      questions: [
        mc("What does the woman think about young people not living with parents?", [{ text: "It's normal and shows growing independence, though it does reduce family connection", correct: true }, { text: "It's a terrible trend" }, { text: "She strongly disagrees" }, { text: "She thinks it's illegal" }], "comprehension"),
        mc("Would the woman consider living with her parents in the future?", [{ text: "Not now, but might reconsider after having children", correct: true }, { text: "Never" }, { text: "Yes, immediately" }, { text: "She already does" }], "comprehension"),
      ],
    },
  ],
  6: [
    {
      lines: [
        { speaker: "女", voice: "nova", text: "这个理论最近争议很大，你怎么看？" },
        { speaker: "男", voice: "echo", text: "我觉得它有一定道理，但确实存在局限性，不能什么情况都套用。" },
        { speaker: "女", voice: "nova", text: "那你觉得该怎么弥补这个不足？" },
        { speaker: "男", voice: "echo", text: "可能需要更多实证研究吧，光靠理论推导说服不了所有人。" },
      ],
      questions: [
        mc("What does the man think about the theory?", [{ text: "It makes some sense but has limitations and can't apply to every situation", correct: true }, { text: "It's completely wrong" }, { text: "It's perfect as is" }, { text: "He hasn't heard of it" }], "comprehension"),
        mc("What does the man think would help address this shortcoming?", [{ text: "More empirical research", correct: true }, { text: "Banning the theory" }, { text: "Ignoring critics" }, { text: "Nothing can be done" }], "comprehension"),
      ],
    },
  ],
  7: [
    {
      lines: [
        { speaker: "男", voice: "echo", text: "你觉得真正的创新一定要颠覆原来的范式吗？" },
        { speaker: "女", voice: "nova", text: "不一定吧，我觉得渐进式的改进也很重要，很多突破其实是慢慢积累出来的。" },
        { speaker: "男", voice: "echo", text: "可是也有人说，太保守的话，可能永远也想不出真正突破性的东西。" },
        { speaker: "女", voice: "nova", text: "这倒也是，可能关键在于怎么权衡两者，而不是非此即彼。" },
      ],
      questions: [
        mc("What is the woman's view on innovation?", [{ text: "Gradual improvement matters too - many breakthroughs accumulate slowly", correct: true }, { text: "Only disruptive innovation counts" }, { text: "Innovation is always accidental" }, { text: "She has no opinion" }], "comprehension"),
        mc("What does the woman suggest at the end?", [{ text: "The key is balancing both approaches, not choosing one or the other", correct: true }, { text: "Only radical change works" }, { text: "Gradual change is always better" }, { text: "They should give up trying to innovate" }], "comprehension"),
      ],
    },
  ],
};

// hskLevel stored in the DB for the "7" bucket above is 7, representing the
// combined HSK7-9 tier (matches the official syllabus's own merged table).

function countAll() {
  const counts = { vocabulary: 0, grammar: 0, grammarMc: 0, grammarOrdering: 0, reading: 0, listening: 0 };
  for (const items of Object.values(vocabulary)) counts.vocabulary += items.length;
  for (const items of Object.values(grammar)) {
    counts.grammar += items.length;
    for (const item of items) {
      if (item.type === "SENTENCE_ORDERING") counts.grammarOrdering++;
      else counts.grammarMc++;
    }
  }
  for (const passages of Object.values(reading)) {
    for (const p of passages) counts.reading += p.questions.length;
  }
  for (const scripts of Object.values(listening)) {
    for (const s of scripts) counts.listening += s.questions.length;
  }
  return counts;
}

async function main() {
  if (process.env.DRY_RUN === "1") {
    const counts = countAll();
    console.log("Dry run - no DB writes. Counts:", JSON.stringify(counts));
    console.log("Total:", counts.vocabulary + counts.grammar + counts.reading + counts.listening);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log("Clearing existing placement exam data...");
  const deletedAttempts = await prisma.placementAttempt.deleteMany({});
  const deletedSessions = await prisma.placementSession.deleteMany({});
  const deletedQuestions = await prisma.placementQuestion.deleteMany({});
  console.log(
    `Cleared: ${deletedQuestions.count} questions, ${deletedSessions.count} sessions, ${deletedAttempts.count} attempts.`,
  );

  let order = 0;
  const created = { vocabulary: 0, grammar: 0, reading: 0, listening: 0 };

  for (const [level, items] of Object.entries(vocabulary)) {
    for (const item of items) {
      await prisma.placementQuestion.create({
        data: { skill: "VOCABULARY", hskLevel: Number(level), order: order++, ...item },
      });
      created.vocabulary++;
    }
  }

  for (const [level, items] of Object.entries(grammar)) {
    for (const item of items) {
      await prisma.placementQuestion.create({
        data: { skill: "GRAMMAR", hskLevel: Number(level), order: order++, ...item },
      });
      created.grammar++;
    }
  }

  for (const [level, passages] of Object.entries(reading)) {
    for (const p of passages) {
      for (const q of p.questions) {
        await prisma.placementQuestion.create({
          data: {
            skill: "READING",
            hskLevel: Number(level),
            order: order++,
            passage: p.passage,
            ...q,
          },
        });
        created.reading++;
      }
    }
  }

  for (const [level, scripts] of Object.entries(listening)) {
    for (const script of scripts) {
      for (const q of script.questions) {
        await prisma.placementQuestion.create({
          data: {
            skill: "LISTENING",
            hskLevel: Number(level),
            order: order++,
            ...q,
            listening: {
              create: {
                lines: {
                  create: script.lines.map((line, i) => ({
                    speaker: line.speaker,
                    voice: line.voice,
                    order: i,
                    chineseText: line.text,
                  })),
                },
              },
            },
          },
        });
        created.listening++;
      }
    }
  }

  console.log("Seeded:", JSON.stringify(created));
  const total = await prisma.placementQuestion.count();
  console.log("Total PlacementQuestion rows in DB:", total);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
