import pg from "pg";
import { randomUUID } from "node:crypto";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? Number(arg.split("=")[1]) : Infinity;
})();

// Distractor pools by grammatical/functional category. Distractors are
// chosen to be clearly WRONG in the specific blank (not near-synonyms that
// could also be defensible), reducing the risk of an accidentally-correct
// "wrong" option.
const POOLS = {
  question_word: ["怎么样", "哪个", "哪里", "什么时候"],
  aspect_particle: ["了", "过", "着", "得"],
  modal_want: ["想", "会", "能", "可以"],
  buy_sell: ["买", "有", "送", "换"],
  formal_verb_a: ["从事", "参与", "处理", "承担"],
  discourse_then: ["才", "也", "还", "又"],
  exceed: ["超出", "达到", "低于", "接近"],
  necessity_no: ["不要", "别", "不能", "不会"],
  question_which: ["什么", "哪个", "哪里", "哪天"],
  discourse_reaction: ["其实", "反正", "果然", "难怪"],
  conditional: ["如果", "要是", "假如", "万一"],
  time_recent: ["才", "已经", "刚才", "曾经"],
  modal_should: ["应该", "一定", "最", "肯定"],
  comparison_marker: ["跟", "和", "比较", "对"],
  differ_amount: ["少", "多", "差不多", "共"],
  quantity_two: ["二", "几", "多", "一"],
  degree_more: ["太", "最", "很", "挺"],
  give_to: ["帮", "跟", "对", "让"],
  help_verb: ["给", "让", "跟", "陪"],
  sum_up: ["加上", "一共", "总共", "合计"],
  near_future: ["会", "快", "就要", "正在"],
  toward: ["给", "跟", "向", "为"],
  inconvenience: ["麻烦", "问题", "困难", "误会"],
  degree_special: ["非常", "十分", "特殊", "格外"],
  sequence_first: ["先后", "后来", "然后", "接着"],
  polite_request: ["请问", "劳驾", "打扰", "拜托"],
  estimate: ["已经", "会", "应该", "大概"],
  soon: ["会", "已经", "正在", "曾经"],
  bought: ["卖", "换", "送", "拿"],
  result_complement: ["到", "完", "好", "懂"],
  broken_state: ["坏掉", "坏过", "坏着", "坏得"],
  mild_degree: ["很", "太", "非常", "挺"],
  consider: ["决定", "同意", "拒绝", "确认"],
  cause_trouble: ["加", "给", "带", "留"],
  can_could: ["会", "要", "得", "应该"],
  ongoing_particle: ["了", "过", "的", "得"],
  reassure_particle: ["了", "过", "着", "呢"],
  measure_word_film: ["个", "件", "张", "本"],
  still_decide: ["就", "才", "也", "又"],
  settle_decide: ["好", "完", "成", "对"],
  within_time: ["中", "间", "里", "上"],
  proof_by: ["用", "拿", "以", "从"],
  fair_word: ["公正", "平等", "合适", "正常"],
  future_will: ["能", "要", "可能", "应该"],
  about_same: ["一样", "相同", "相似", "差点"],
  linking_de: ["的", "了", "过", "地"],
  stay_in_touch: ["维持", "继续", "保存", "留住"],
  completive_particle: ["完", "好", "了", "过"],
  bill_word: ["结账", "算账", "开票", "付款"],
  or_choice: ["或者", "但是", "不过", "而且"],
  directly: ["马上", "立刻", "立即", "赶紧"],
  more_of: ["再", "又", "还", "更"],
  assign_responsibility: ["从", "给", "为", "被"],
  respect: ["尊敬", "重视", "支持", "理解"],
  anytime: ["随便", "任何", "总是", "经常"],
  tag_question: ["是吗", "对吗", "好吗", "呢"],
  set_establish: ["立", "建", "做", "订"],
  formal_take_time: ["抽空", "抽时间", "腾出", "留出"],
  first_of_all: ["其次", "然后", "接着", "最后"],
  simply_put: ["总的来说", "换句话说", "总而言之", "一般来说"],
  accompanied_by: ["跟随", "陪伴", "加上", "带有"],
  the_other: ["另外", "其他", "别的", "另有"],
  results_show: ["数据显示", "研究认为", "报告指出", "调查发现"],
  how_operated: ["运行", "使用", "进行", "执行"],
  imagine_as: ["看作", "变成", "当作", "比作"],
  for_example: ["比如说", "例如", "打个比方", "譬如"],
  specifically: ["详细", "仔细", "清楚", "明确"],
  hope_wish: ["希望", "打算", "以为", "觉得"],
  well_deserved: ["当之无愧", "名副其实", "理所当然", "名不虚传"],
  affix_seal: ["盖上", "贴上", "签上", "印上"],
  or_formal: ["或者", "以及", "和", "跟"],
  reasonable: ["公平", "正常", "恰当", "妥当"],
  reservation: ["顾虑", "怀疑", "犹豫", "不满"],
  different_word: ["区别", "差别", "分别", "差异"],
  understand_forgive: ["理解", "包容", "原谅", "体谅"],
  cheers: ["举杯", "祝酒", "碰杯", "敬酒"],
  explore_discuss: ["讨论", "商量", "研究", "考虑"],
  side_effect: ["后果", "反应", "影响", "问题"],
  degree_complement_marker: ["的", "了", "地", "过"],
  rather_than: ["宁可", "不如", "反而", "至于"],
  through_means: ["经过", "利用", "凭借", "根据"],
  operated_by: ["操作", "运作", "运行", "管理"],
  one_of: ["其中", "之中", "当中", "其一"],
  compared_to: ["和", "跟", "对", "比"],
  difference_word: ["差别", "分别", "不同", "特点"],
  propose: ["建议", "要求", "希望", "表示"],
  just_only: ["仅仅", "光", "单", "都"],
  immediately: ["马上", "立刻", "赶紧", "随即"],
  how_long: ["久", "多", "长久", "远"],
  commit_promise: ["保证", "答应", "确保", "保障"],
  workplace_smalltalk_soon: ["就", "已经", "正在", "曾经"],
  adopt_use: ["使用", "运用", "利用", "借助"],
  sincerely: ["真心", "诚心", "特意", "特此"],
  blessing_phrase: ["心想事成", "一帆风顺", "步步高升", "恭喜发财"],
  still_remain: ["仍然", "还是", "始终", "一直"],
  limited_to: ["局限于", "限制于", "受限于", "针对"],
  that_is: ["便是", "即是", "那是", "正是"],
  polite_measure_word: ["个", "名", "人", "些"],
  shortened: ["减少", "降低", "削减", "缩减"],
  approximately: ["大约", "大概", "差不多", "上下"],
  location_at: ["从", "到", "向", "跟"],
  how_much_open: ["多", "几", "什么", "哪些"],
  not_yet: ["没有", "不", "已经", "曾经"],
  mild_a_little: ["一点", "一些", "很", "太"],
  as_for: ["跟", "给", "向", "以"],
  ever_since: ["才", "也", "还", "都"],
  then_rightaway: ["才", "也", "还", "都"],
  yesno_question: ["呢", "吧", "啊", "了"],
  have_verb: ["是", "在", "要", "会"],
  might_maybe: ["能", "要", "可能", "应该"],
  bit_softener: ["很", "太", "非常", "真"],
  there_is: ["是", "在", "为", "被"],
  try_casual: ["看看", "看一下", "一下", "一看"],
  free_available: ["没空", "忙", "在家", "方便"],
  ongoing_state_marker: ["了", "过", "的", "得"],
  drink_verb: ["吃", "买", "做", "点"],
  half_time: ["半点", "一半", "刻", "分"],
  degree_about_same: ["一样", "相同", "差点", "相似"],
  tall_word: ["矮", "胖", "瘦", "壮"],
  also_word: ["也", "都", "又", "再"],
  too_word: ["很", "非常", "真", "挺"],
  change_of_state: ["过", "着", "的", "得"],
  before_word: ["以后", "之后", "后来", "以来"],
  stops_measure: ["个", "次", "趟", "遍"],
  location_on: ["里", "下", "旁", "边"],
  ongoing_particle2: ["了", "过", "的", "得"],
  leave_message: ["说", "写", "发", "带"],
  takes_duration: ["有", "在", "是", "会"],
  will_word: ["要", "想", "能", "该"],
  can_also: ["还可以", "也是", "只可以", "才可以"],
  times_count: ["个", "回", "遍", "趟"],
  sounds_like: ["看起来", "说起来", "想起来", "算起来"],
  i_think: ["我说", "我猜", "我看", "我要"],
  need_verb: ["想", "要", "会", "该"],
  dont_word: ["不", "没", "无", "非"],
  plan_to: ["想要", "决定", "希望", "以为"],
  must_word: ["应该", "可以", "会", "要"],
  wrong_word: ["坏", "差", "假", "空"],
  makes_sense: ["意思", "想法", "看法", "问题"],
  if_word: ["虽然", "只要", "除非", "既然"],
  pass_by: ["路过", "穿过", "越过", "走过"],
  and_word: ["跟", "或", "还", "又"],
  stop_doing: ["过", "着", "的", "得"],
  although_word: ["因为", "所以", "如果", "既然"],
  again_word: ["又", "还", "才", "也"],
  completion_marker: ["过", "着", "的", "得"],
  so_that_much: ["这么", "多么", "越", "更"],
  already_word: ["曾经", "刚才", "还没", "正在"],
  size_number: ["码", "型", "款", "件"],
  much_more: ["一点", "一些", "很多", "非常"],
  completed_action_marker: ["过", "着", "的", "得"],
  not_yet_word: ["没有", "不用", "已经", "曾经"],
  is_located: ["有", "是", "去", "到"],
  weather_dependent_plans_custom: ["因为", "所以", "但是"],
};

// Per-exercise category assignment, keyed by Exercise.id.
const CATEGORY_BY_ID = {
  cmstlzb9t04ps3weo1f6iz4sc: "question_word",
  cmstm0ovv04zf3weoynh4r8xn: "aspect_particle",
  cmstlbrg4009o3weostp73fw6: "buy_sell",
  cmstlaflc001c3weo9nkphmkn: "modal_want",
  cmstlcznt00hi3weoa5ijju29: "buy_sell",
  cmstmg8bv07x53weo0942z9iq: "formal_verb_a",
  cmstm5f0705s93weo669ura7s: "discourse_then",
  cmstm9dkp06l33weobcfc59j6: "exceed",
  cmstmdhc407dx3weo7lexexea: "reassure_particle",
  cmstm41q805in3weoav5bydob: "necessity_no",
  cmstm6qhr061v3weo04s4u8bi: "question_which",
  cmstmappo06up3weom5pbbabc: "discourse_reaction",
  cmstmew5t07nj3weomh83wp0x: "conditional",
  cmstm82k506bh3weomvooy7kn: "time_recent",
  cmstmc1i8074b3weor3xl9e8q: "modal_should",
  // Not "conditional" - 如果/假如/万一 are too interchangeable with 要是
  // here (all four would fit "___下雨怎么办？" equally well), making the
  // question ambiguous. Custom pool of words that clearly don't fit this
  // pre-clause hypothetical slot instead.
  cmstmcf3l076o3weoox3ealvu: "weather_dependent_plans_custom",
  cmstlda5j00jd3weophso52ap: "comparison_marker",
  cmstm9po406ng3weofweufdzb: "differ_amount",
  cmstm4d9w05l03weo2vasurrk: "quantity_two",
  cmstlzmjd04s53weob3bgxcr1: "degree_more",
  cmstmdtkg07ga3weox4jr67ni: "much_more",
  cmstm14c9051s3weo83u3zatn: "give_to",
  cmstlc1pz00bj3weoucxfix8w: "help_verb",
  cmstm71wl06483weo8fae34n2: "discourse_then",
  cmstm8dn006du3weorrws670c: "sum_up",
  cmstm5qoe05um3weo2em521g4: "near_future",
  cmstlaro1003v3weojwk5u7qs: "toward",
  cmstmf8fz07pw3weomj1v8u85: "inconvenience",
  cmstmb0a406x23weo5gl5w04o: "degree_special",
  cmstmglbg07zi3weoywr8g6z6: "sequence_first",
  cmstlb1vz005r3weohzuk350q: "polite_request",
  cmstme6uj07in3weo81fd6xng: "discourse_then",
  cmstma18q06pt3weon6dwrt2a: "estimate",
  cmstm62rg05wz3weosg7rsjpy: "soon",
  cmstmbcme06zf3weoxveksb6x: "bought",
  cmstlyl9i04kw3weoxi2xy65k: "result_complement",
  cmstlcbga00de3weosecxbjaz: "broken_state",
  cmstldl2k00l83weoyxg7xb3g: "mild_degree",
  cmstmgxd7081v3weov7ikjdbk: "consider",
  cmstmcrlp07913weoouuz52xg: "cause_trouble",
  cmstm8pqs06g73weof9f04sgb: "can_could",
  cmstmfkta07s93weohzix4vx2: "ongoing_particle",
  cmstm7csy066l3weop8uqm3q6: "reassure_particle",
  cmstlzz4m04ui3weozfn1ys4v: "measure_word_film",
  cmstm4odu05nd3weompqet83r: "still_decide",
  cmstmd40507be3weoz3sp0k2i: "settle_decide",
  cmstmh8nm08483weoyan4iaxr: "within_time",
  cmstldusp00n33weokje0lbp1: "proof_by",
  cmstmej8807l03weoyw0epd6o: "fair_word",
  cmstmad9j06s63weo8lsp5nu6: "future_will",
  cmstm6f1305zc3weocjeuqvd0: "about_same",
  cmstm7p8x068y3weofve3d1og: "linking_de",
  cmstmbp99071s3weoi565cktw: "stay_in_touch",
  cmstmfwn207um3weobnjsgtsy: "completive_particle",
  cmstlbcnl007n3weocvn2s8ij: "bill_word",
  cmstm51gw05pq3weosby11su4: "settle_decide",
  cmstlyxnv04n93weofv43j0v9: "or_choice",
  cmstm0c9n04wv3weo2w81fau3: "directly",
  cmstlcmnd00f93weookjzqmfv: "more_of",
  cmstm917k06ik3weoype4z1rp: "assign_responsibility",
  cmstmsclc0a2r3weolbym8p27: "respect",
  cmstm29mq05913weoiu0mgng5: "anytime",
  cmstmhm7p086r3weoraap6ahr: "tag_question",
  cmstmlrww08w93weoej690met: "set_establish",
  cmstmpovu09lr3weo49c4jizr: "formal_take_time",
  cmstmj2m008f93weokvw82v4p: "first_of_all",
  cmstmn2xg094r3weowxms1xjx: "simply_put",
  cmstmr44x09u93weog97tw1cb: "accompanied_by",
  cmstmtmmn0ab93weo7qvatlr4: "the_other",
  cmstmkfm308nr3weotpx0w9cf: "results_show",
  cmstmod9l09d93weoeakgcso6: "how_operated",
  cmstmne7e096u3weon9uquau5: "imagine_as",
  cmstmjebc08hc3weof65nc8ed: "for_example",
  cmstm2p9q05be3weowhl4jpk0: "specifically",
  cmstmm2ks08yc3weo35kizyc6: "hope_wish",
  cmstmq0yd09nu3weoktrqcsnp: "well_deserved",
  cmstmoo7m09fc3weowyu99h6h: "affix_seal",
  cmstmkr8p08pu3weotdayjqc2: "or_formal",
  cmstmi1cj088u3weopclqmkqu: "reasonable",
  cmstmtwvg0adc3weo29yoi0ud: "reservation",
  cmstmrekf09wc3weo9wgzpflf: "different_word",
  cmstmsnk20a4u3weo34etryz8: "understand_forgive",
  cmstmqbin09px3weo0v7uyhmi: "cheers",
  cmstmsy2s0a6x3weo31o3ghe5: "explore_discuss",
  cmstmrp6l09yf3weol0obwpds: "side_effect",
  cmstm35zi05dr3weo4d5liq0i: "degree_complement_marker",
  cmstmnqeg098x3weogu3ttfgr: "rather_than",
  cmstmjqly08jf3weoa6vcri28: "through_means",
  cmstm1egw05453weo5iv9py2z: "within_time",
  cmstmu7zr0aff3weo4luezbza: "one_of",
  cmstml2hl08rx3weox5cjzfnh: "compared_to",
  cmstmoz8f09hf3weom59r9r5f: "different_word",
  cmstmici208ax3weoi0xh5t2o: "propose",
  cmstmmdt3090f3weonw53485b: "just_only",
  cmstms0ae0a0i3weo49oczv18: "immediately",
  cmstmpbjc09ji3weotkhen9y0: "how_long",
  cmstmmp0y092i3weonz6xq2an: "commit_promise",
  cmstm3h5205g43weoury4s2gq: "workplace_smalltalk_soon",
  cmstmld3808u03weo5w57ne2i: "adopt_use",
  cmstmt9sz0a903weon8ackwqm: "sincerely",
  cmstmqp4h09s03weow3ajv5qk: "blessing_phrase",
  cmstmujl20ahi3weom30cczxp: "still_remain",
  cmstmk11l08li3weo7selk0j2: "limited_to",
  cmstmo1v409b03weobqqcqnc9: "that_is",
  cmstm1r33056i3weo99lu5vfv: "polite_measure_word",
  cmstmin2c08d03weox0oq2x30: "shortened",
  cmstlxx6v04g63weonujws20x: "approximately",
  cmstloj3o02kv3weo2ei5ssp6: "location_at",
  cmstlsnpq03dp3weo7xwmiqni: "how_much_open",
  cmstlwms1046j3weoc3g41o49: "not_yet",
  cmstlre0f03433weobvs9w158: "mild_a_little",
  cmstlvcz403wx3weo2zykhju1: "as_for",
  cmstlpvbf02uh3weo5sc9dx1v: "ever_since",
  cmstlu10p03nb3weoiqf9t6zn: "then_rightaway",
  cmstleec000po3weomdyrv2hk: "yesno_question",
  cmstlfx5200z73weojzds7xxb: "have_verb",
  cmstlhe1d018t3weoo0aiufz3: "might_maybe",
  cmstliwe601if3weokirzuzm2: "bit_softener",
  cmstlkc9l01s13weoxrb8bghe: "there_is",
  cmstllssb021n3weowzwsu8kr: "try_casual",
  cmstln56x02b93weo9fwefc59: "free_available",
  cmstlm66x02403weot3c8uwpc: "ongoing_state_marker",
  cmstlep6x00ry3weomzsa8zu4: "drink_verb",
  cmstlszlh03g23weo4e296aqq: "discourse_then",
  cmstljakl01ks3weoqi5luhbx: "half_time",
  cmstlvnmf03za3weorq52edlj: "degree_about_same",
  cmstlg7l4011k3weo6pdpg2mj: "tall_word",
  cmstlq99t02wu3weob4bhdxp0: "also_word",
  cmstlhqi801b63weobgx8jk9d: "too_word",
  cmstlouc602n83weo4pyyfmkm: "change_of_state",
  cmstlwxl3048w3weozdingnbp: "reassure_particle",
  cmstlrokc036g3weo7j93iv61: "before_word",
  cmstly8k304ij3weokknda0ur: "stops_measure",
  cmstlkrjp01ue3weoca3masi4: "location_on",
  cmstluc3a03po3weoxzzqmlqp: "ongoing_particle2",
  cmstlngmw02dm3weoayj4d4p9: "leave_message",
  cmstlgmyd013x3weotlllofld: "takes_duration",
  cmstlx9kg04b93weo1u97j4zy: "will_word",
  cmstltbg003if3weoxmk6dohl: "can_also",
  cmstlp60v02pl3weol102ijhb: "times_count",
  cmstluo9d03s13weo0tjc7qv2: "sounds_like",
  cmstlqntv02z73weoy3q7hhr6: "i_think",
  cmstlf1mu00ub3weoibzcaejv: "need_verb",
  cmstlmgmc026d3weoq4tc62nd: "or_choice",
  cmstli6wi01dj3weosurycg7c: "dont_word",
  cmstljma701n53weo7l3tpio8: "plan_to",
  cmstll3jk01wr3weo1yeglwv6: "must_word",
  cmstlns9102fz3weodjelvioy: "wrong_word",
  cmstlvzax041n3weogefn20ah: "makes_sense",
  cmstlrzh3038t3weorz12rwqg: "if_word",
  cmstlv0oh03ue3weop50u0u1g: "pass_by",
  cmstljxe101pi3weob8qoi7su: "and_word",
  cmstlsbuc03b63weobcpf9v1e: "stop_doing",
  cmstlwawx04403weovkmuhl7h: "although_word",
  cmstlxlap04dm3weoeqsa69p9: "again_word",
  cmstllenz01z43weow8qfrvvq: "completion_marker",
  cmstlr1cj031k3weo8hd4do63: "so_that_much",
  cmstlo4z802ic3weo5qbs9vdh: "already_word",
  cmstlmsey028q3weo9l98uiyb: "size_number",
  cmstlgz8b016a3weofjdm38a9: "also_word",
  cmstltokv03ks3weofl0d3ffw: "much_more",
  cmstlijoq01fw3weormtuawe6: "completed_action_marker",
  cmstlpihj02ry3weodlu0a4ka: "not_yet_word",
  cmstlfko600wo3weoemzns0f2: "is_located",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

try {
  const rows = await pool.query(`
    SELECT e.id, e.prompt, e."correctAnswer"
    FROM "Exercise" e
    WHERE e.status = 'PUBLISHED' AND e."grammarPointId" IS NULL AND e.type = 'FILL_IN_BLANK'
  `);
  console.log("Total FILL_IN_BLANK to convert:", rows.rows.length);

  let converted = 0;
  let missingCategory = [];
  let processed = 0;
  for (const row of rows.rows) {
    if (processed >= LIMIT) break;
    const category = CATEGORY_BY_ID[row.id];
    if (!category || !POOLS[category]) {
      missingCategory.push({ id: row.id, prompt: row.prompt });
      continue;
    }
    processed++;
    const correct = row.correctAnswer.accepted[0];
    const distractors = POOLS[category]
      .filter((w) => w !== correct)
      .slice(0, 3);
    while (distractors.length < 3) distractors.push("——"); // safety pad, should never trigger

    const options = shuffle([
      { content: correct, isCorrect: true },
      ...distractors.map((d) => ({ content: d, isCorrect: false })),
    ]);
    const correctIndex = options.findIndex((o) => o.isCorrect);

    console.log(
      `[${DRY_RUN ? "DRY" : "APPLY"}] ${row.prompt}\n  correct: ${correct}\n  options: ${options.map((o) => (o.isCorrect ? `*${o.content}*` : o.content)).join(", ")}\n`,
    );
    if (DRY_RUN) {
      converted++;
      continue;
    }

    await pool.query("BEGIN");
    try {
      await pool.query(
        `UPDATE "Exercise" SET type = 'MULTIPLE_CHOICE', "correctAnswer" = $1 WHERE id = $2`,
        [JSON.stringify({ optionIndex: correctIndex }), row.id],
      );
      for (const [order, option] of options.entries()) {
        await pool.query(
          `INSERT INTO "ExerciseOption" (id, "exerciseId", content, "isCorrect", "order")
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), row.id, option.content, option.isCorrect, order],
        );
      }
      await pool.query("COMMIT");
      converted++;
    } catch (e) {
      await pool.query("ROLLBACK");
      throw e;
    }
  }
  console.log("Converted:", converted);
  console.log("Missing category assignment:", missingCategory.length);
  if (missingCategory.length) console.log(JSON.stringify(missingCategory, null, 1));
} catch (e) {
  console.error("ERR", e);
} finally {
  await pool.end();
}
