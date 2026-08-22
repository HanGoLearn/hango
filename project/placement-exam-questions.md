# Placement Exam — Question Bank (HSK1-9)

Source of truth for all 211 questions (HSK1-9, Vocabulary/Grammar/Reading/Listening): this document, kept in sync with the database. This is a living planning document — edit questions here, then regenerate/update `scripts/seed-placement-exam-full.mjs` to apply changes back to the database.

**✅ Status (2026-08-16, "ahora si realiza el examen"): fully synced to the database.** All 211 questions - both MULTIPLE_CHOICE and SENTENCE_ORDERING - are seeded and live: 66 Vocabulary + 95 Grammar (77 MC + 18 ordering) + 28 Reading + 22 Listening, across HSK1 through HSK7-9. `PILOT_MAX_HSK_LEVEL` (`src/lib/placement-exam.ts`) is raised to 9, so the adaptive engine actually climbs the full range instead of stopping at HSK2. Verified with a fresh DB query after seeding (counts by skill/level/type, no MC question missing a correct option, no ordering question missing `correctAnswer`) - not just the seed script's own printed summary.

**Speaking is still design-only, not implemented** - it has no `PlacementQuestion` rows and needs the live Realtime API pipeline described in its own section below; that work cannot be built by Claude directly. Likewise, turning a completed placement result into real Learning Journey lesson-skipping/point credit (`applyPlacementCredit`, the `source: "PLACEMENT"` badge) is designed in `project/TASKS.md` but **not implemented** - the exam itself is real and playable end to end, but its result doesn't yet write anything back into the curriculum.

**HSK1-2 trimmed 2026-08-16** (user request: don't let the exam run long, most test-takers will clear this fast anyway): vocabulary categories cut from 4 items to 3 items each, HSK1's extra "combination" grammar category removed (the ordering questions + new 10s timer already cover the harder tier). Combined with the 10-second-per-question limit (HSK1-2 only - HSK3+ is untimed, meant to take real thought), HSK1-2 should now move quickly for anyone who actually knows the material.

**HSK5-9 uses a lighter density than HSK1-4** (2-3 categories instead of 4-5 per skill) to keep this full-range draft tractable in one pass - real, grounded content throughout, just less exhaustive per level than the more thoroughly reviewed HSK1-4. Easy to expand once the overall shape is validated.

**Total: 211 questions** (66 Vocabulary + 95 Grammar [77 MC + 18 ordering] + 28 Reading + 22 Listening) **across HSK1-9, plus 5 Speaking conversation scenarios (HSK3 through HSK7-9, design-only, not yet buildable).**

**⚠ HSK7-9 is diagnostic only - it never grants real placement, points, or lesson-skipping.** Decided 2026-08-16 (user question: "should we do something for HSK7-9?"), catching a real conflict with `points_system.md`'s own already-established rule: HSK7-9 (1650-2000 points) can only be earned through sustained Writing Lab/Speaking Lab evidence over time - the user's own deliberate anti-shortcut design ("2000 must be genuinely hard to reach... no shortcut through lesson content alone"). Letting a one-time exam grant that tier would contradict it. So the HSK7-9 questions/scenario below still run (useful to see how far someone's real ability goes), but the result is shown to the learner as informational only ("your exam performance reached this level") - it must never skip lessons or credit the 1650-2000 point range. Whoever implements the final result screen/sync needs to gate this explicitly, not just extend the same HSK1-6 placement logic upward.

---

## Vocabulary (66)

### HSK1 (12)

**Category: noun**

1. "医院" means:
   - **[correct]** Hospital
   - School
   - Restaurant
   - Bank

2. "老师" means:
   - **[correct]** Teacher
   - Doctor
   - Student
   - Friend

3. Which word means "friend"?
   - **[correct]** 朋友
   - 老师
   - 学生
   - 医生

**Category: verb**

5. "喜欢" means:
   - **[correct]** To like
   - To eat
   - To buy
   - To go

6. "认识" means:
   - **[correct]** To know / recognize (a person)
   - To see
   - To learn
   - To ask

7. Which word means "to study"?
   - **[correct]** 学习
   - 工作
   - 睡觉
   - 说话

**Category: adjective**

9. "高兴" means:
   - **[correct]** Happy
   - Sad
   - Tired
   - Angry

10. Which word means "pretty"?
   - **[correct]** 漂亮
   - 大
   - 小
   - 好

11. "冷" means:
   - **[correct]** Cold
   - Hot
   - Warm
   - Cool

**Category: function**

13. 你是学生＿？ (question particle)
   - **[correct]** 吗
   - 了
   - 的
   - 吧

14. 我们走＿。 ("Let's go" - suggestion particle)
   - **[correct]** 吧
   - 吗
   - 呢
   - 的

15. 这是我＿书。 (possessive particle)
   - **[correct]** 的
   - 了
   - 吗
   - 呢

### HSK2 (12)

**Category: noun**

17. "同学" means:
   - **[correct]** Classmate
   - Teacher
   - Neighbor
   - Stranger

18. "公园" means:
   - **[correct]** Park
   - School
   - Hospital
   - Store

19. Which word means "movie"?
   - **[correct]** 电影
   - 电视
   - 音乐
   - 新闻

**Category: verb**

21. "打算" means:
   - **[correct]** To plan to
   - To buy
   - To ask
   - To forget

22. "觉得" means:
   - **[correct]** To feel / think
   - To see
   - To hear
   - To say

23. Which word means "to help"?
   - **[correct]** 帮忙
   - 工作
   - 休息
   - 游泳

**Category: adjective**

25. "特别" means:
   - **[correct]** Special / particularly
   - Normal
   - Difficult
   - Boring

26. Which word means "simple"?
   - **[correct]** 简单
   - 难
   - 贵
   - 大

27. "一般" means:
   - **[correct]** Ordinary / generally
   - Special
   - Excellent
   - Terrible

**Category: function**

29. 我去＿中国，很好玩。 (past-experience particle)
   - **[correct]** 过
   - 了
   - 着
   - 的

30. 她坐＿看电视。 (ongoing/durative particle)
   - **[correct]** 着
   - 了
   - 过
   - 的

31. 你要咖啡＿茶？ ("or" in a question)
   - **[correct]** 还是
   - 或者
   - 也
   - 都

### HSK3 (12)

> Added 2026-08-16 (user request: "the difficulty should increase
> considerably now"). Vocabulary shifts from concrete daily-life words to
> more abstract concepts (experience, pressure, attitude) - this is the
> real HSK1-3 vs. HSK4-6 tier boundary from the official syllabus
> ("初等" elementary vs. "中等" intermediate).

**Category: noun**

32a. "经验" means:
   - **[correct]** Experience
   - Money
   - Time
   - Health

32b. "压力" means:
   - **[correct]** Pressure / stress
   - Happiness
   - Freedom
   - Success

32c. "态度" means:
   - **[correct]** Attitude
   - Habit
   - Personality
   - Opinion

**Category: verb**

32d. "讨论" means:
   - **[correct]** To discuss
   - To decide
   - To agree
   - To refuse

32e. "解决" means:
   - **[correct]** To solve / resolve
   - To create
   - To hide
   - To forget

32f. Which word means "to suggest"?
   - **[correct]** 建议
   - 决定
   - 拒绝
   - 反对

**Category: adjective**

32g. "复杂" means:
   - **[correct]** Complicated
   - Simple
   - Interesting
   - Boring

32h. "严重" means:
   - **[correct]** Serious
   - Minor
   - Common
   - Rare

32i. Which word means "reasonable"?
   - **[correct]** 合理
   - 便宜
   - 免费
   - 安全

**Category: function**

32j. 你等了很久，我＿来，对不起。 ("only just now" - marking lateness)
   - **[correct]** 才
   - 就
   - 还
   - 也

32k. 你＿说，我＿糊涂。 ("the more...the more")
   - **[correct]** 越 / 越
   - 更 / 更
   - 才 / 才
   - 就 / 就

32l. 他从早上到现在，＿没有休息。 (continuously, the whole time)
   - **[correct]** 一直
   - 才
   - 越
   - 就

### HSK4 (12)

**Category: noun**

32m. "竞争" means:
   - **[correct]** Competition
   - Cooperation
   - Comparison
   - Communication

32n. "效率" means:
   - **[correct]** Efficiency
   - Effect
   - Effort
   - Result

32o. Which word means "responsibility"?
   - **[correct]** 责任
   - 权利
   - 机会
   - 兴趣

**Category: verb**

32p. "承担" means:
   - **[correct]** To bear / take on (responsibility)
   - To refuse
   - To forget
   - To share

32q. "影响" means:
   - **[correct]** To influence / affect
   - To ignore
   - To copy
   - To measure

32r. Which word means "to adapt"?
   - **[correct]** 适应
   - 改变
   - 发展
   - 保持

**Category: adjective**

32s. "明显" means:
   - **[correct]** Obvious
   - Hidden
   - Complicated
   - Rare

32t. "普遍" means:
   - **[correct]** Common / widespread
   - Unique
   - Expensive
   - Ancient

32u. Which word means "positive / proactive"?
   - **[correct]** 积极
   - 消极
   - 被动
   - 懒惰

**Category: function**

32v. 他很有钱，＿并不快乐。 (contrastive "but, surprisingly")
   - **[correct]** 却
   - 也
   - 就
   - 才

32w. 他＿忘了带钥匙。 ("unexpectedly, to one's surprise")
   - **[correct]** 竟然
   - 已经
   - 终于
   - 还

32x. 你＿想说什么？ ("exactly, after all")
   - **[correct]** 究竟
   - 大概
   - 也许
   - 可能

### HSK5 (6)

> HSK5+ uses a lighter density than HSK1-4 (2-3 categories instead of 4-5)
> to keep this draft pass tractable - still real, grounded content, just
> less exhaustive per level. Easy to expand later once HSK1-4 is validated
> in practice.

**Category: noun**

32y. "现象" means:
   - **[correct]** Phenomenon
   - Rule
   - Habit
   - Accident

32z. "趋势" means:
   - **[correct]** Trend
   - Result
   - Reason
   - Method

32za. Which word means "viewpoint / opinion"?
   - **[correct]** 观点
   - 态度
   - 性格
   - 兴趣

**Category: verb**

32zb. "强调" means:
   - **[correct]** To emphasize
   - To ignore
   - To forget
   - To hide

32zc. "承认" means:
   - **[correct]** To admit
   - To deny
   - To doubt
   - To suggest

32zd. Which word means "to overlook / ignore"?
   - **[correct]** 忽略
   - 重视
   - 发现
   - 研究

### HSK6 (6)

**Category: noun**

32ze. "局限性" means:
   - **[correct]** Limitation
   - Advantage
   - Opportunity
   - Requirement

32zf. Which word means "consensus"?
   - **[correct]** 共识
   - 矛盾
   - 争论
   - 怀疑

32zg. "机制" means:
   - **[correct]** Mechanism
   - Machine
   - Method
   - Model

**Category: verb**

32zh. "削弱" means:
   - **[correct]** To weaken
   - To strengthen
   - To create
   - To repair

32zi. Which word means "to compensate / make up for"?
   - **[correct]** 弥补
   - 放弃
   - 拒绝
   - 忽略

32zj. "验证" means:
   - **[correct]** To verify
   - To guess
   - To invent
   - To copy

### HSK7-9 (6)

> Combined tier, matching the official syllabus's own structure - HSK7-9
> share ONE grammar table and a single 10,896-word pool (confirmed
> directly from the official PDF earlier today). This isn't new content,
> it's depth/register - consistent with `points_system.md`'s own decision
> that 1650-2000 points are Lab-evidence-only, never exam-granted.

**Category: noun**

32zk. "悖论" means:
   - **[correct]** Paradox
   - Theory
   - Proof
   - Question

32zl. Which word means "paradigm"?
   - **[correct]** 范式
   - 模型
   - 系统
   - 结构

32zm. "本质" means:
   - **[correct]** Essence / true nature
   - Appearance
   - Price
   - Size

**Category: verb**

32zn. "颠覆" means:
   - **[correct]** To subvert / overturn
   - To support
   - To repeat
   - To describe

32zo. Which word means "to weigh / balance (options)"?
   - **[correct]** 权衡
   - 选择
   - 决定
   - 放弃

32zp. "诠释" means:
   - **[correct]** To interpret / explain
   - To translate
   - To copy
   - To criticize

## Grammar (95: 77 MC + 18 ordering)

### HSK1 (18: 15 MC + 3 ordering)

**Category: 能愿动词**

33. 我＿说一点儿中文。
   - **[correct]** 会
   - 是
   - 在
   - 的

34. A: 你＿去吗？ B: 我很忙，不能去。
   - **[correct]** 能
   - 会
   - 是
   - 要

35. How would you say "I want to drink coffee"?
   - **[correct]** 我要喝咖啡。
   - 我会喝咖啡。
   - 我很喝咖啡。
   - 我喝咖啡要。

**Category: "是"字句1**

36. 他＿老师。
   - **[correct]** 是
   - 在
   - 有
   - 很

37. How would you say "I am not a student"?
   - **[correct]** 我不是学生。
   - 我没是学生。
   - 我不有学生。
   - 我很不学生。

38. A: 这＿你的书吗？ B: 是，这是我的书。
   - **[correct]** 是
   - 在
   - 有
   - 的

**Category: 疑问代词**

39. A: 你叫＿名字？ B: 我叫王明。
   - **[correct]** 什么
   - 谁
   - 哪儿
   - 怎么

40. 你去＿？
   - **[correct]** 哪儿
   - 什么
   - 谁
   - 几

41. A: ＿是你的老师？ B: 王老师是我的老师。
   - **[correct]** 谁
   - 什么
   - 哪儿
   - 怎么样

**Category: 量词**

42. 我家有三＿人。
   - **[correct]** 口
   - 个
   - 件
   - 本

43. 这＿书很有意思。
   - **[correct]** 本
   - 个
   - 件
   - 口

44. 我买了一＿咖啡。
   - **[correct]** 杯
   - 个
   - 件
   - 本

**Category: 动作的态**

45. 她＿看书呢。 (ongoing action)
   - **[correct]** 正在
   - 了
   - 过
   - 的

46. 我吃＿饭了。 (completed action)
   - **[correct]** 了
   - 正在
   - 过
   - 的

47. A: 你在做什么？ B: 我在写作业＿。
   - **[correct]** 呢
   - 了
   - 吗
   - 吧

**Category: word order (SENTENCE_ORDERING)**

> Trimmed 2026-08-16 (user request: keep HSK1-2 short, since most
> test-takers will breeze through it and shouldn't spend much time here).
> Removed the separate "combination" harder-MC category added earlier this
> session - the ordering questions below already provide the harder tier,
> and the new 10s-per-question timer (see below) does the rest of the work
> of keeping HSK1-2 fast without needing a 6th grammar category.

> New question type added 2026-08-16 (user request: "ordering questions
> that use grammar and vocabulary together, a bit intricate"). Same
> tap-to-order mechanic already shipped for Grammar/Vocabulary exercises
> earlier today. Format below: target sentence, then the shuffled tiles
> the learner would actually see.

47d. Build the sentence for: "I don't want to go to the park today."
   - Correct order: 我 / 今天 / 不 / 想 / 去 / 公园。
   - Tiles shown (shuffled): 公园。 / 想 / 我 / 不 / 去 / 今天

47e. Build the sentence for: "He is also my friend."
   - Correct order: 他 / 也 / 是 / 我的 / 朋友。
   - Tiles shown (shuffled): 朋友。 / 他 / 我的 / 是 / 也

47f. Build the sentence for: "What do you want to drink today?"
   - Correct order: 你 / 今天 / 想 / 喝 / 什么？
   - Tiles shown (shuffled): 什么？ / 你 / 喝 / 今天 / 想

### HSK2 (18: 15 MC + 3 ordering)

**Category: 比较句1**

48. 今天＿昨天热。
   - **[correct]** 比
   - 和
   - 跟
   - 从

49. How would you say "This book is 2 years newer than that one"?
   - **[correct]** 这本书比那本新两年。
   - 这本书两年比那本新。
   - 这本书新比那本两年。
   - 这本书比那本两年新。

50. How would you say "I am not as tall as him"?
   - **[correct]** 我没有他高。
   - 我不比他高。
   - 我没有他那么高吗。
   - 他没有我高。

**Category: 结果补语1**

51. A: 你的作业做＿了吗？ B: 做完了。
   - **[correct]** 完
   - 错
   - 懂
   - 会

52. 我说＿了，不是这个意思。
   - **[correct]** 错
   - 好
   - 完
   - 懂

53. 这个字我看不＿。
   - **[correct]** 懂
   - 错
   - 完
   - 会

**Category: 动词重叠**

54. 你＿这件衣服，怎么样？ ("try it on")
   - **[correct]** 试试
   - 试
   - 试了
   - 试着

55. 我们＿吧，别紧张。 ("let's rest a bit")
   - **[correct]** 休息休息
   - 休息休
   - 休息了
   - 休息着

56. 你＿这个问题。 ("think it over a bit")
   - **[correct]** 想一想
   - 想想想
   - 想了想
   - 在想

**Category: 选择复句**

57. 你要咖啡＿茶？
   - **[correct]** 还是
   - 或者
   - 也
   - 都

58. 你是学生＿是老师？
   - **[correct]** 还是
   - 或者
   - 但是
   - 所以

59. How would you say "Are you going by bus or by subway?"?
   - **[correct]** 你坐公共汽车还是坐地铁？
   - 你坐公共汽车或者坐地铁？
   - 你坐公共汽车也坐地铁？
   - 你坐公共汽车所以坐地铁？

**Category: 因果复句**

60. ＿今天下雨，＿我们不去公园了。
   - **[correct]** 因为...所以
   - 虽然...但是
   - 如果...就
   - 因为...但是

61. 因为他很忙，＿没有时间吃饭。
   - **[correct]** 所以
   - 但是
   - 而且
   - 还是

62. How would you say "Because it's cold today, I'm wearing a coat"?
   - **[correct]** 因为今天冷，所以我穿大衣。
   - 虽然今天冷，所以我穿大衣。
   - 因为今天冷，但是我穿大衣。
   - 如果今天冷，所以我穿大衣。

**Category: word order (SENTENCE_ORDERING)**

> Same new question type as HSK1, intentionally more intricate here -
> chains 2-3 HSK2 grammar patterns per sentence (degree complement after a
> comparison, a full 因为...所以 clause pair with two different time words
> that must not get swapped, and modal + verb reduplication together).

62a. Build the sentence for: "This book is much more expensive than that one."
   - Correct order: 这本书 / 比 / 那本 / 贵 / 很多。
   - Tiles shown (shuffled): 很多。 / 比 / 这本书 / 贵 / 那本

62b. Build the sentence for: "Because there's an exam tomorrow, I can't go out today."
   - Correct order: 因为 / 明天 / 要 / 考试， / 所以 / 我 / 今天 / 不能 / 出去。
   - Tiles shown (shuffled): 出去。 / 因为 / 不能 / 考试， / 明天 / 我 / 今天 / 所以 / 要
   - *Note: 明天/今天 are deliberately close together as tiles - swapping them produces a grammatically valid but factually wrong sentence, which is the actual point of the exercise.*

62c. Build the sentence for: "Should we discuss this problem together for a bit?"
   - Correct order: 我们 / 要不要 / 一起 / 商量商量 / 这个 / 问题？
   - Tiles shown (shuffled): 问题？ / 我们 / 商量商量 / 一起 / 这个 / 要不要

### HSK3 (18: 15 MC + 3 ordering)

> Categories chosen as HSK3's real signature structures, straight from the
> official syllabus's own 特殊句型 section: 把字句1, 被动句1 - this is
> where Chinese grammar genuinely gets harder, not just "more vocabulary."

**Category: "把"字句1**

62d. 请把门＿。
   - **[correct]** 关上
   - 关了吗
   - 在关
   - 关的

62e. How would you say "Please put the book on the table"?
   - **[correct]** 请把书放在桌子上。
   - 请把书放桌子上了。
   - 请书放在桌子把上。
   - 请把桌子上放书。

62f. 我把作业＿了。 ("finished", result complement)
   - **[correct]** 做完
   - 做在
   - 做着
   - 做过

**Category: 被动句1**

62g. 我的手机＿他借走了。
   - **[correct]** 被
   - 把
   - 让
   - 对

62h. How would you say "The window was broken by him"?
   - **[correct]** 窗户被他打破了。
   - 窗户把他打破了。
   - 他被窗户打破了。
   - 窗户打破被他了。

62i. 这个消息已经＿大家知道了。
   - **[correct]** 被
   - 把
   - 由
   - 替

**Category: 比较句2**

62j. 这件事跟那件事＿一样重要。
   - **[correct]** 一样
   - 一起
   - 一直
   - 一定

62k. "他不比我聪明，可是更努力。" - what does this mean?
   - **[correct]** He isn't smarter than me, but he works harder
   - He is much smarter than me
   - He is exactly as smart as me
   - He doesn't work as hard as me

62l. 我比他＿两岁。 ("older", A比B+adj+数量)
   - **[correct]** 大
   - 远
   - 贵
   - 慢

**Category: 反问句1 ("不是...吗")**

62m. "你不是已经知道了吗？" - what does the speaker imply?
   - **[correct]** They believe the listener already knew
   - They are asking for the first time
   - They don't believe the listener
   - They are confused

62n. How would you rhetorically ask "Isn't this too expensive?"
   - **[correct]** 这不是太贵了吗？
   - 这是太贵了吗？
   - 这不太贵吗？
   - 这不是贵了吗？

62o. "这不是很清楚吗？" is an example of:
   - **[correct]** A rhetorical question expecting agreement
   - A genuine question
   - A command
   - An apology

**Category: 条件复句 (只要...就 / 只有...才)**

62p. ＿你努力，＿一定能成功。
   - **[correct]** 只要...就
   - 只有...才
   - 如果...就
   - 因为...所以

62q. ＿你亲自去，他＿会相信你。
   - **[correct]** 只有...才
   - 只要...就
   - 虽然...但是
   - 因为...所以

**Category: word order (SENTENCE_ORDERING)**

62r. Build the sentence for: "Please put the book on the table."
   - Correct order: 请 / 把 / 书 / 放在 / 桌子上。
   - Tiles shown (shuffled): 桌子上。 / 请 / 放在 / 把 / 书

62s. Build the sentence for: "My phone was borrowed by him."
   - Correct order: 我的手机 / 被 / 他 / 借走了。
   - Tiles shown (shuffled): 借走了。 / 被 / 我的手机 / 他

62t. Build the sentence for: "This matter isn't as simple as you think."
   - Correct order: 这件事 / 没有 / 你想的 / 那么 / 简单。
   - Tiles shown (shuffled): 简单。 / 没有 / 这件事 / 那么 / 你想的

### HSK4 (18: 15 MC + 3 ordering)

> Deliberately avoided pitting 被 against 叫/让 as "one correct, one wrong"
> in the 被动句2 items below - in real Chinese they're largely
> interchangeable (a register difference, not a correctness one), and
> treating one as a wrong answer would be a disputable, not-really-wrong
> distractor - the same class of mistake caught and fixed in today's real
> Grammar curriculum work (的话/如果/要是/万一 conditional cluster).
> Distractors here are 把/由/替, which are genuinely, unambiguously wrong
> in these sentences.

**Category: "把"字句2**

62u. Which sentence correctly uses 把 for "He lost his wallet"?
   - **[correct]** 他把钱包丢了。
   - 他丢把钱包了。
   - 把他钱包丢了。
   - 他钱包把丢了。

62v. 请你把这件事再＿一下。 ("explain again briefly")
   - **[correct]** 说明
   - 说明了
   - 在说明
   - 说明着

62w. 他把房间＿得很干净。 ("cleaned very clean" - state complement)
   - **[correct]** 打扫
   - 打扫了
   - 打扫过
   - 在打扫

**Category: 被动句2 (叫/让)**

62x. 这个杯子＿他打破了，真可惜。
   - **[correct]** 叫
   - 把
   - 由
   - 替

62y. 这次的失败＿他明白了很多道理。
   - **[correct]** 让
   - 把
   - 由
   - 替

62z. 我的画儿＿小孩儿弄脏了，没关系，可以再画一张。
   - **[correct]** 让
   - 把
   - 由
   - 替

**Category: 比较句3 (A不如B / 跟...相比)**

63a. "坐火车不如坐飞机快，可是便宜很多。" - what does this mean?
   - **[correct]** Taking the train is not as fast as flying, but it's much cheaper
   - Taking the train is faster than flying
   - Both are equally fast
   - Flying is cheaper than the train

63b. ＿以前相比，现在的生活方便多了。
   - **[correct]** 跟
   - 比
   - 让
   - 被

63c. How would you say "This method isn't as good as that one"?
   - **[correct]** 这个办法不如那个好。
   - 这个办法比那个不好。
   - 这个办法没有不如那个好。
   - 那个办法不如这个好吗。

**Category: 双重否定句 (double negation)**

63d. "没有你的帮助，我不可能完成这个任务。" - what does this emphasize?
   - **[correct]** That the narrator absolutely needed the listener's help
   - That the narrator didn't need help
   - That the task was impossible even with help
   - That the listener refused to help

63e. How would you use double negation to say "You have to go" (emphatically)?
   - **[correct]** 你不能不去。
   - 你可以不去。
   - 你不去也行。
   - 你去不去都行。

63f. "他不是不知道，只是不想说。" - what is implied?
   - **[correct]** He actually knows, but chooses not to say
   - He genuinely doesn't know
   - He wants to say but can't
   - He forgot

**Category: 让步复句 (即使...也 / 就是...也)**

63g. ＿明天下雨，我们＿要去。
   - **[correct]** 即使...也
   - 因为...所以
   - 虽然...但是
   - 只要...就

63h. How would you say "Even if you don't agree, I will still do it"?
   - **[correct]** 就是你不同意，我也要做。
   - 因为你不同意，我也要做。
   - 如果你不同意，我就不做。
   - 虽然你不同意，但是我不做。

63i. ＿他再忙，＿会抽时间陪家人。
   - **[correct]** 即使...也
   - 因为...所以
   - 只有...才
   - 不但...而且

**Category: word order (SENTENCE_ORDERING)**

63j. Build the sentence for: "This method isn't as good as that one."
   - Correct order: 这个办法 / 不如 / 那个 / 好。
   - Tiles shown (shuffled): 好。 / 这个办法 / 那个 / 不如

63k. Build the sentence for: "You have to go - it's your responsibility."
   - Correct order: 你 / 不能 / 不去， / 这是 / 你的 / 责任。
   - Tiles shown (shuffled): 责任。 / 你 / 不能 / 这是 / 不去， / 你的

63l. Build the sentence for: "No matter how busy he is, he'll still make time to be with family."
   - Correct order: 他 / 再 / 忙 / 也 / 会 / 抽时间 / 陪 / 家人。
   - Tiles shown (shuffled): 家人。 / 他 / 会 / 再 / 陪 / 忙 / 抽时间 / 也

### HSK5 (8: 6 MC + 2 ordering)

**Category: 被动句3**

63m. 这件事已经＿他给解释清楚了。
   - **[correct]** 被
   - 把
   - 让
   - 由

63n. How would you say "The problem was already explained clearly by him"?
   - **[correct]** 这个问题已经被他解释清楚了。
   - 这个问题已经把他解释清楚了。
   - 他已经被这个问题解释清楚了。
   - 这个问题被解释已经清楚了他。

**Category: 把字句3**

63o. 请把这本书＿他。
   - **[correct]** 给
   - 在
   - 跟
   - 对

63p. How would you say "He gave the key to me"?
   - **[correct]** 他把钥匙给了我。
   - 他给了钥匙把我。
   - 他把我给了钥匙。
   - 他给把钥匙了我。

**Category: 让步复句 (哪怕...也)**

63q. ＿多难，我也要坚持完成。
   - **[correct]** 哪怕...也
   - 因为...所以
   - 只要...就
   - 虽然...但是

63r. How would you say "Even if no one supports me, I will still do it"?
   - **[correct]** 哪怕没有人支持我，我也要做。
   - 因为没有人支持我，我也要做。
   - 如果没有人支持我，就不做。
   - 虽然没有人支持我，但是不做。

**Category: word order (SENTENCE_ORDERING)**

63s. Build the sentence for: "The problem was already explained clearly by him."
   - Correct order: 这个问题 / 已经 / 被他 / 解释清楚了。
   - Tiles shown (shuffled): 解释清楚了。 / 已经 / 这个问题 / 被他

63t. Build the sentence for: "No matter how difficult it is, I will still persist and finish."
   - Correct order: 不管 / 多难， / 我 / 也 / 要 / 坚持完成。
   - Tiles shown (shuffled): 坚持完成。 / 不管 / 我 / 也 / 多难， / 要

### HSK6 (8: 6 MC + 2 ordering)

**Category: "把"字句4 (inanimate subject - genuinely advanced)**

63u. 这场雨＿我们的计划全打乱了。
   - **[correct]** 把
   - 被
   - 让
   - 给

63v. How would you say "This mistake almost ruined the whole project"?
   - **[correct]** 这个错误几乎把整个项目毁了。
   - 这个错误几乎被整个项目毁了。
   - 整个项目几乎把这个错误毁了。
   - 这个错误把几乎整个项目毁了。

**Category: 条件复句 (凡是...都 / 除非...才)**

63w. ＿是参加过这个项目的人，＿知道有多难。
   - **[correct]** 凡是...都
   - 除非...才
   - 只要...就
   - 无论...都

63x. ＿你亲自解释，大家＿会相信。
   - **[correct]** 除非...才
   - 凡是...都
   - 因为...所以
   - 即使...也

**Category: 转折复句 (虽...但/可/却)**

63y. 他＿年纪不大，可经验很丰富。
   - **[correct]** 虽
   - 但
   - 却
   - 可

63z. Which rephrasing of "Although this method works, it's not perfect" uses a terse literary connector correctly?
   - **[correct]** 这个方法虽有效，却不完美。
   - 这个方法虽有效，所以不完美。
   - 这个方法因为有效，却不完美。
   - 这个方法虽有效，因此不完美。

**Category: word order (SENTENCE_ORDERING)**

63za. Build the sentence for: "This mistake almost ruined the whole project."
   - Correct order: 这个错误 / 几乎 / 把 / 整个项目 / 毁了。
   - Tiles shown (shuffled): 毁了。 / 把 / 这个错误 / 几乎 / 整个项目

63zb. Build the sentence for: "Unless you explain it yourself, no one will believe it."
   - Correct order: 除非 / 你 / 亲自 / 解释， / 不然 / 没有人 / 会 / 相信。
   - Tiles shown (shuffled): 相信。 / 除非 / 没有人 / 你 / 会 / 亲自 / 解释， / 不然

### HSK7-9 (8: 6 MC + 2 ordering)

**Category: 比较句5 (A+形容词+于/过+B)**

63zc. 这个方法的效果明显＿传统方法。
   - **[correct]** 优于
   - 比于
   - 多于
   - 胜过于

63zd. How would you say "The risk of this plan far exceeds its benefit"?
   - **[correct]** 这个方案的风险远大于它的收益。
   - 这个方案的风险远比它的收益。
   - 这个方案的风险远超它的收益于。
   - 这个方案的收益远大于它的风险吗。

**Category: 选择复句 (宁可/宁愿...也不)**

63ze. 我＿放弃这个机会，＿违背自己的原则。
   - **[correct]** 宁可...也不
   - 因为...所以
   - 即使...也
   - 不但...而且

63zf. How would you say "I would rather fail than give up trying"?
   - **[correct]** 我宁愿失败，也不愿放弃尝试。
   - 我宁愿失败，所以放弃尝试。
   - 我因为失败，也不愿放弃尝试。
   - 我宁愿放弃尝试，也不愿失败。

**Category: 递进复句 (连...都..., 更不用说)**

63zg. ＿这么简单的问题他＿答不出来，更不用说复杂的了。
   - **[correct]** 连...都
   - 凡是...都
   - 不但...而且
   - 虽然...但是

63zh. How would you say "Even the experts can't fully explain this phenomenon, let alone ordinary people"?
   - **[correct]** 连专家都无法完全解释这个现象，更不用说普通人了。
   - 虽然专家都无法完全解释这个现象，更不用说普通人了。
   - 因为专家都无法完全解释这个现象，更不用说普通人了。
   - 连专家都无法完全解释这个现象，所以普通人了。

**Category: word order (SENTENCE_ORDERING)**

63zi. Build the sentence for: "The risk of this plan far exceeds its benefit."
   - Correct order: 这个方案的风险 / 远 / 大于 / 它的收益。
   - Tiles shown (shuffled): 收益。 / 远 / 这个方案的风险 / 大于 / 它的

63zj. Build the sentence for: "I would rather fail than give up trying."
   - Correct order: 我 / 宁愿 / 失败， / 也不愿 / 放弃 / 尝试。
   - Tiles shown (shuffled): 尝试。 / 我 / 放弃 / 宁愿 / 失败， / 也不愿

## Reading (28)

### HSK1 (4)

**Category: comprehension**

63. *Passage:* 我叫李明。我是学生，我的学校很大。我喜欢我的老师，他很好。
   What does Li Ming do?
   - **[correct]** Student
   - Teacher
   - Doctor
   - Friend

64. *Passage:* 我叫李明。我是学生，我的学校很大。我喜欢我的老师，他很好。
   Who does Li Ming like?
   - **[correct]** His teacher
   - His friend
   - His father
   - His classmate

65. *Passage:* 今天天气很冷。我在家看书，我不想出去。
   How is the weather today?
   - **[correct]** Very cold
   - Very hot
   - Very nice
   - Rainy

66. *Passage:* 今天天气很冷。我在家看书，我不想出去。
   What is he doing?
   - **[correct]** Reading a book
   - Sleeping
   - Working
   - Eating

### HSK2 (6)

**Category: comprehension**

> Revised 2026-08-16 (user feedback: HSK2 reading was too simple, almost
> single-idea passages) - now each passage chains 2-3 HSK2 grammar
> patterns already in this level's Grammar bank (比较, 因果复句, 选择复句,
> 动词重叠), and the questions require following the reasoning, not just
> recalling one fact.

67. *Passage:* 我觉得学中文比学英文难，可是因为我很喜欢，所以每天都练习。已经学了半年了，现在我能看懂简单的故事，也能跟中国朋友聊几句了。虽然说话还是不太流利，但是我相信以后会越来越好。
   Why does the narrator practice every day?
   - **[correct]** Because they really like it
   - Because it's easy
   - Because the teacher requires it
   - Because it's fun for other people

68. *Passage:* 我觉得学中文比学英文难，可是因为我很喜欢，所以每天都练习。已经学了半年了，现在我能看懂简单的故事，也能跟中国朋友聊几句了。虽然说话还是不太流利，但是我相信以后会越来越好。
   What can the narrator do now, after half a year?
   - **[correct]** Understand simple stories and chat a little with Chinese friends
   - Write essays in Chinese
   - Give speeches in Chinese
   - Watch the news without subtitles

68a. *Passage:* 我觉得学中文比学英文难，可是因为我很喜欢，所以每天都练习。已经学了半年了，现在我能看懂简单的故事，也能跟中国朋友聊几句了。虽然说话还是不太流利，但是我相信以后会越来越好。
   How does the narrator feel about their speaking ability?
   - **[correct]** Not very fluent yet, but believes it will improve
   - Already very fluent
   - Doesn't think it will ever improve
   - Prefers not to speak at all

69. *Passage:* 这个周末你想在家休息休息，还是想出去运动？如果天气好，我们可以去爬山；要是下雨，就在家看电影吧。我比较喜欢爬山，因为运动完以后心情会更好。你呢？你运动完以后觉得怎么样？
   What will they do if it rains?
   - **[correct]** Watch a movie at home
   - Go hiking
   - Go to a restaurant
   - Stay in bed

70. *Passage:* 这个周末你想在家休息休息，还是想出去运动？如果天气好，我们可以去爬山；要是下雨，就在家看电影吧。我比较喜欢爬山，因为运动完以后心情会更好。你呢？你运动完以后觉得怎么样？
   Why does the narrator prefer hiking?
   - **[correct]** Because their mood improves afterward
   - Because it's cheaper
   - Because friends are going too
   - Because the weather is always good

70a. *Passage:* 这个周末你想在家休息休息，还是想出去运动？如果天气好，我们可以去爬山；要是下雨，就在家看电影吧。我比较喜欢爬山，因为运动完以后心情会更好。你呢？你运动完以后觉得怎么样？
   What does the narrator ask at the end?
   - **[correct]** How the other person feels after exercising
   - What time they'll meet
   - Where they will go
   - How much it costs

### HSK3 (6)

**Category: comprehension**

> Noticeably longer/more abstract than HSK1-2 (workplace stress, city
> pollution policy) - matches the real "初等 → 中等" jump, not just harder
> vocabulary dropped into the same simple sentence shapes.

70b. *Passage:* 最近工作压力越来越大，我常常加班到很晚。虽然经理已经给了我一些建议，但是问题还是没有完全解决。我打算跟同事讨论一下，看看有没有更好的办法。
   Why is the narrator stressed?
   - **[correct]** Work pressure has been increasing and they often work overtime
   - They lost their job
   - They have too much free time
   - Their boss is too kind

70c. *Passage:* 最近工作压力越来越大，我常常加班到很晚。虽然经理已经给了我一些建议，但是问题还是没有完全解决。我打算跟同事讨论一下，看看有没有更好的办法。
   What has the manager already done?
   - **[correct]** Given some suggestions
   - Solved the whole problem
   - Fired the narrator
   - Given a raise

70d. *Passage:* 最近工作压力越来越大，我常常加班到很晚。虽然经理已经给了我一些建议，但是问题还是没有完全解决。我打算跟同事讨论一下，看看有没有更好的办法。
   What does the narrator plan to do next?
   - **[correct]** Discuss with colleagues to find a better solution
   - Quit the job
   - Ignore the problem
   - Ask for a vacation

70e. *Passage:* 这个城市的空气污染问题很严重，很多人开始骑自行车上班，而不是开车。政府也提出了一些新的规定，希望能一起解决这个问题。不过，要真正改变还需要很长时间。
   What environmental problem does the passage describe?
   - **[correct]** Serious air pollution
   - Water shortage
   - Noise pollution
   - Traffic accidents

70f. *Passage:* 这个城市的空气污染问题很严重，很多人开始骑自行车上班，而不是开车。政府也提出了一些新的规定，希望能一起解决这个问题。不过，要真正改变还需要很长时间。
   What are many people doing instead of driving?
   - **[correct]** Riding bicycles to work
   - Taking the subway
   - Walking
   - Working from home

70g. *Passage:* 这个城市的空气污染问题很严重，很多人开始骑自行车上班，而不是开车。政府也提出了一些新的规定，希望能一起解决这个问题。不过，要真正改变还需要很长时间。
   According to the passage, how long will real change take?
   - **[correct]** A long time
   - One week
   - It already happened
   - It's impossible

### HSK4 (6)

**Category: comprehension**

> Formal/abstract register (corporate efficiency, environmental policy) -
> the kind of text a learner would actually meet reading news or a work
> email, not a staged textbook dialogue.

70h. *Passage:* 随着竞争越来越激烈，很多公司开始重视员工的工作效率，而不只是工作时间的长短。有的员工虽然每天加班，但效率并不高；相反，有些人虽然工作时间不长，却能承担更多的责任，完成更多的任务。这说明，效率比时间更重要。
   What are many companies starting to value more?
   - **[correct]** Work efficiency, not just how many hours are worked
   - Only working hours
   - Employee friendships
   - Office decoration

70i. *Passage:* 随着竞争越来越激烈，很多公司开始重视员工的工作效率，而不只是工作时间的长短。有的员工虽然每天加班，但效率并不高；相反，有些人虽然工作时间不长，却能承担更多的责任，完成更多的任务。这说明，效率比时间更重要。
   What's said about employees who work overtime every day?
   - **[correct]** Their efficiency isn't necessarily high
   - They are always the most productive
   - They get promoted fastest
   - They are unhappy

70j. *Passage:* 随着竞争越来越激烈，很多公司开始重视员工的工作效率，而不只是工作时间的长短。有的员工虽然每天加班，但效率并不高；相反，有些人虽然工作时间不长，却能承担更多的责任，完成更多的任务。这说明，效率比时间更重要。
   What does the passage conclude?
   - **[correct]** Efficiency matters more than time spent working
   - Overtime is always necessary
   - Responsibility doesn't matter
   - Everyone should work fewer hours

70k. *Passage:* 近年来，环境污染问题越来越受到人们的关注。不少城市已经采取了一系列措施，比如限制汽车数量、鼓励使用公共交通等。虽然这些措施在短期内可能带来一些不便，但从长远来看，对改善空气质量是有帮助的。究竟这些政策能不能真正解决问题，还需要时间来验证。
   What have many cities done?
   - **[correct]** Taken measures like limiting cars and encouraging public transit
   - Banned all cars immediately
   - Ignored the pollution problem
   - Moved factories abroad

70l. *Passage:* 近年来，环境污染问题越来越受到人们的关注。不少城市已经采取了一系列措施，比如限制汽车数量、鼓励使用公共交通等。虽然这些措施在短期内可能带来一些不便，但从长远来看，对改善空气质量是有帮助的。究竟这些政策能不能真正解决问题，还需要时间来验证。
   What's acknowledged about these measures in the short term?
   - **[correct]** They might cause some inconvenience
   - They are completely free
   - They have no effect at all
   - Everyone supports them

70m. *Passage:* 近年来，环境污染问题越来越受到人们的关注。不少城市已经采取了一系列措施，比如限制汽车数量、鼓励使用公共交通等。虽然这些措施在短期内可能带来一些不便，但从长远来看，对改善空气质量是有帮助的。究竟这些政策能不能真正解决问题，还需要时间来验证。
   What does the passage say about whether these policies will really work?
   - **[correct]** It still needs time to be verified
   - They have already failed
   - They are guaranteed to succeed
   - No one knows what they are

### HSK5 (2)

**Category: comprehension**

70n. *Passage:* 很多人认为，年轻人越来越不愿意和父母住在一起，这已经成为一种普遍的社会现象。有人强调这是独立意识增强的表现，也有人担心这会削弱家庭关系。不管怎样，这个趋势短期内很难改变。
   What social phenomenon does the passage describe?
   - **[correct]** Young people increasingly unwilling to live with their parents
   - Rising housing prices
   - Declining birth rates
   - Increasing unemployment

70o. *Passage:* 很多人认为，年轻人越来越不愿意和父母住在一起，这已经成为一种普遍的社会现象。有人强调这是独立意识增强的表现，也有人担心这会削弱家庭关系。不管怎样，这个趋势短期内很难改变。
   What does the passage say about this trend?
   - **[correct]** It's unlikely to change in the short term
   - It has already reversed
   - Everyone agrees it's bad
   - It only happens in one country

### HSK6 (2)

**Category: comprehension**

70p. *Passage:* 这个理论虽然在学术界得到了广泛认可，但也存在一定的局限性。有学者指出，现有的研究机制还不足以完全验证这个理论在所有情况下都成立。凡是提出质疑的人，都希望看到更多的实证数据，而不是仅仅依靠理论推导。
   What is said about the theory?
   - **[correct]** It's widely accepted but has certain limitations
   - It has been completely disproven
   - Everyone fully agrees with it
   - It was just proposed yesterday

70q. *Passage:* 这个理论虽然在学术界得到了广泛认可，但也存在一定的局限性。有学者指出，现有的研究机制还不足以完全验证这个理论在所有情况下都成立。凡是提出质疑的人，都希望看到更多的实证数据，而不是仅仅依靠理论推导。
   What do the people who question the theory want?
   - **[correct]** More empirical data, not just theoretical reasoning
   - To ban the theory
   - To replace the researchers
   - Nothing, they were satisfied

### HSK7-9 (2)

**Category: comprehension**

70r. *Passage:* 有学者提出，真正颠覆性的创新往往来自对已有范式的质疑，而不是对细节的改进。这种观点听起来有一定道理，但也有人认为，过度强调颠覆本身可能忽略了渐进式改进的价值——毕竟，大多数进步其实是一点一点积累起来的，而不是一夜之间发生的。
   What do some scholars claim about truly disruptive innovation?
   - **[correct]** It often comes from questioning existing paradigms, not refining details
   - It always comes from young people
   - It never actually happens
   - It's always accidental

70s. *Passage:* 有学者提出，真正颠覆性的创新往往来自对已有范式的质疑，而不是对细节的改进。这种观点听起来有一定道理，但也有人认为，过度强调颠覆本身可能忽略了渐进式改进的价值——毕竟，大多数进步其实是一点一点积累起来的，而不是一夜之间发生的。
   What is the counterargument mentioned in the passage?
   - **[correct]** Overemphasizing disruption may overlook the value of gradual improvement
   - Disruption is always harmful
   - Gradual improvement never works
   - There is no real disagreement on this topic

## Listening (22)

### HSK1 (4)

**Category: comprehension**

71. *Listening script (no text shown to learner):*
   - 男: 你好！你叫什么名字？
   - 女: 我叫王芳。你呢？
   - 男: 我叫李明。你是学生吗？
   - 女: 是，我是学生。你也是学生吗？
   - 男: 不是，我是老师。

   What is the woman's name?
   - **[correct]** 王芳
   - 李芳
   - 王明
   - 李明

72. *Listening script (no text shown to learner):*
   - 男: 你好！你叫什么名字？
   - 女: 我叫王芳。你呢？
   - 男: 我叫李明。你是学生吗？
   - 女: 是，我是学生。你也是学生吗？
   - 男: 不是，我是老师。

   Is the man a student or a teacher?
   - Student
   - **[correct]** Teacher

73. *Listening script (no text shown to learner):*
   - 男: 你家有几个人？
   - 女: 我家有四个人，爸爸、妈妈、哥哥和我。
   - 男: 你哥哥做什么？
   - 女: 他是医生。

   How many people are in the woman's family?
   - **[correct]** Four
   - Three
   - Five
   - Two

74. *Listening script (no text shown to learner):*
   - 男: 你家有几个人？
   - 女: 我家有四个人，爸爸、妈妈、哥哥和我。
   - 男: 你哥哥做什么？
   - 女: 他是医生。

   What does the woman's older brother do?
   - **[correct]** Doctor
   - Teacher
   - Student
   - Driver

### HSK2 (4)

**Category: comprehension**

75. *Listening script (no text shown to learner):*
   - 男: 你周末做什么？
   - 女: 我打算和朋友一起去公园。你呢？
   - 男: 我已经买了电影票，晚上去看电影。
   - 女: 是吗？那你几点走？
   - 男: 六点半。电影七点开始。

   What time does the movie start?
   - **[correct]** Seven o'clock
   - Six thirty
   - Eight o'clock
   - Five o'clock

76. *Listening script (no text shown to learner):*
   - 男: 你周末做什么？
   - 女: 我打算和朋友一起去公园。你呢？
   - 男: 我已经买了电影票，晚上去看电影。
   - 女: 是吗？那你几点走？
   - 男: 六点半。电影七点开始。

   What is the woman planning to do this weekend?
   - **[correct]** Go to the park with a friend
   - Watch a movie
   - Buy tickets
   - Go to work

77. *Listening script (no text shown to learner):*
   - 男: 你觉得这家餐厅怎么样？
   - 女: 很不错，菜很好吃，可是有点儿贵。
   - 男: 没关系，今天我请客。
   - 女: 谢谢你！

   What does the woman think of the restaurant?
   - **[correct]** Good food, but a bit expensive
   - Not tasty
   - Very cheap
   - Not clean

78. *Listening script (no text shown to learner):*
   - 男: 你觉得这家餐厅怎么样？
   - 女: 很不错，菜很好吃，可是有点儿贵。
   - 男: 没关系，今天我请客。
   - 女: 谢谢你！

   Who is paying?
   - **[correct]** The man
   - The woman
   - They're splitting it
   - The waiter

### HSK3 (4)

**Category: comprehension**

> Pace note: per the new level-aware TTS instructions (`placement-listening-audio.ts`),
> HSK3+ scripts synthesize at the same natural, unhurried pace as HSK2 -
> only HSK1 gets the slowed-down, extra-clear delivery. Real difficulty
> increase here comes from content (workplace/decision-making topics,
> longer turns), not speaking speed.

78a. *Listening script (no text shown to learner):*
   - 男: 你看起来很累，怎么了？
   - 女: 最近工作压力太大了，每天都要加班。
   - 男: 你跟经理说了吗？也许他能帮你解决一下。
   - 女: 说了，他建议我先跟同事商量一下，看看能不能重新分配任务。

   Why does the woman look tired?
   - **[correct]** Work pressure and having to work overtime every day
   - She didn't sleep well
   - She's sick
   - She's worried about money

78b. *Listening script (no text shown to learner):*
   - 男: 你看起来很累，怎么了？
   - 女: 最近工作压力太大了，每天都要加班。
   - 男: 你跟经理说了吗？也许他能帮你解决一下。
   - 女: 说了，他建议我先跟同事商量一下，看看能不能重新分配任务。

   What did the manager suggest?
   - **[correct]** Discuss with colleagues about redistributing tasks
   - Take a vacation
   - Quit the job
   - Hire more staff

78c. *Listening script (no text shown to learner):*
   - 男: 这两份工作你选哪个？
   - 女: 一个工资更高，可是压力也更大；另一个比较轻松，但是工资低一些。
   - 男: 那你打算怎么办？
   - 女: 我觉得健康更重要，所以我可能会选轻松一点的那个。

   What's the difference between the two jobs?
   - **[correct]** One pays more but has more pressure; the other is more relaxed but pays less
   - Both pay the same
   - One is full-time, one is part-time
   - One is closer to home

78d. *Listening script (no text shown to learner):*
   - 男: 这两份工作你选哪个？
   - 女: 一个工资更高，可是压力也更大；另一个比较轻松，但是工资低一些。
   - 男: 那你打算怎么办？
   - 女: 我觉得健康更重要，所以我可能会选轻松一点的那个。

   Which job does the woman lean toward, and why?
   - **[correct]** The more relaxed one, because she thinks health is more important
   - The higher-paying one, for the money
   - Neither - she'll look for a third option
   - The closer one, to save commute time

### HSK4 (4)

**Category: comprehension**

78e. *Listening script (no text shown to learner):*
   - 男: 听说你们公司最近竞争特别激烈。
   - 女: 是啊，效率不高的话很难留下来。不过我倒觉得这样能让人更积极。
   - 男: 你不怕压力太大吗？
   - 女: 说实话，一开始确实不适应，但慢慢就习惯了，现在反而觉得挺有意思的。

   What does the woman think about the intense competition at her company?
   - **[correct]** It's difficult to stay if efficiency isn't high, but it makes people more proactive
   - It's completely unfair
   - She's planning to quit
   - She doesn't notice it

78f. *Listening script (no text shown to learner):*
   - 男: 听说你们公司最近竞争特别激烈。
   - 女: 是啊，效率不高的话很难留下来。不过我倒觉得这样能让人更积极。
   - 男: 你不怕压力太大吗？
   - 女: 说实话，一开始确实不适应，但慢慢就习惯了，现在反而觉得挺有意思的。

   How does the woman feel about the pressure now, compared to at first?
   - **[correct]** She wasn't used to it at first, but now finds it interesting
   - She still can't handle it
   - She was fine with it from day one
   - She's more stressed than ever

78g. *Listening script (no text shown to learner):*
   - 女: 你觉得限制汽车数量这个政策有效果吗？
   - 男: 短期内可能不太方便，但我觉得长远来看是有帮助的。
   - 女: 可是也有人说，这样并不能真正解决污染问题，究竟根本原因在哪儿？
   - 男: 这个我也不太清楚，可能需要更多研究吧。

   What is the man's opinion on the car-limiting policy?
   - **[correct]** It's inconvenient short-term but helpful long-term
   - It's completely useless
   - It should be cancelled immediately
   - It's the only solution needed

78h. *Listening script (no text shown to learner):*
   - 女: 你觉得限制汽车数量这个政策有效果吗？
   - 男: 短期内可能不太方便，但我觉得长远来看是有帮助的。
   - 女: 可是也有人说，这样并不能真正解决污染问题，究竟根本原因在哪儿？
   - 男: 这个我也不太清楚，可能需要更多研究吧。

   What does the woman question?
   - **[correct]** Whether the policy addresses the real root cause of pollution
   - Whether cars should be banned entirely
   - Whether the man owns a car
   - Whether the policy is expensive

### HSK5 (2)

**Category: comprehension**

78i. *Listening script (no text shown to learner):*
   - 男: 现在很多年轻人不愿意跟父母住在一起，你怎么看？
   - 女: 我觉得这是正常的，说明大家越来越独立了。不过我承认，这样确实会让家人之间的联系变少。
   - 男: 那你自己会选择跟父母住吗？
   - 女: 目前不会，但以后有了孩子，可能会重新考虑。

   What does the woman think about young people not living with parents?
   - **[correct]** It's normal and shows growing independence, though it does reduce family connection
   - It's a terrible trend
   - She strongly disagrees
   - She thinks it's illegal

78j. *Listening script (no text shown to learner):*
   - 男: 现在很多年轻人不愿意跟父母住在一起，你怎么看？
   - 女: 我觉得这是正常的，说明大家越来越独立了。不过我承认，这样确实会让家人之间的联系变少。
   - 男: 那你自己会选择跟父母住吗？
   - 女: 目前不会，但以后有了孩子，可能会重新考虑。

   Would the woman consider living with her parents in the future?
   - **[correct]** Not now, but might reconsider after having children
   - Never
   - Yes, immediately
   - She already does

### HSK6 (2)

**Category: comprehension**

78k. *Listening script (no text shown to learner):*
   - 女: 这个理论最近争议很大，你怎么看？
   - 男: 我觉得它有一定道理，但确实存在局限性，不能什么情况都套用。
   - 女: 那你觉得该怎么弥补这个不足？
   - 男: 可能需要更多实证研究吧，光靠理论推导说服不了所有人。

   What does the man think about the theory?
   - **[correct]** It makes some sense but has limitations and can't apply to every situation
   - It's completely wrong
   - It's perfect as is
   - He hasn't heard of it

78l. *Listening script (no text shown to learner):*
   - 女: 这个理论最近争议很大，你怎么看？
   - 男: 我觉得它有一定道理，但确实存在局限性，不能什么情况都套用。
   - 女: 那你觉得该怎么弥补这个不足？
   - 男: 可能需要更多实证研究吧，光靠理论推导说服不了所有人。

   What does the man think would help address this shortcoming?
   - **[correct]** More empirical research
   - Banning the theory
   - Ignoring critics
   - Nothing can be done

### HSK7-9 (2)

**Category: comprehension**

78m. *Listening script (no text shown to learner):*
   - 男: 你觉得真正的创新一定要颠覆原来的范式吗？
   - 女: 不一定吧，我觉得渐进式的改进也很重要，很多突破其实是慢慢积累出来的。
   - 男: 可是也有人说，太保守的话，可能永远也想不出真正突破性的东西。
   - 女: 这倒也是，可能关键在于怎么权衡两者，而不是非此即彼。

   What is the woman's view on innovation?
   - **[correct]** Gradual improvement matters too - many breakthroughs accumulate slowly
   - Only disruptive innovation counts
   - Innovation is always accidental
   - She has no opinion

78n. *Listening script (no text shown to learner):*
   - 男: 你觉得真正的创新一定要颠覆原来的范式吗？
   - 女: 不一定吧，我觉得渐进式的改进也很重要，很多突破其实是慢慢积累出来的。
   - 男: 可是也有人说，太保守的话，可能永远也想不出真正突破性的东西。
   - 女: 这倒也是，可能关键在于怎么权衡两者，而不是非此即彼。

   What does the woman suggest at the end?
   - **[correct]** The key is balancing both approaches, not choosing one or the other
   - Only radical change works
   - Gradual change is always better
   - They should give up trying to innovate

## Speaking

> Added 2026-08-16 (user request: "Speaking is missing - it should be real
> conversation starting at HSK3-4, then continue through 5 and the rest").
> **This section is design/specification only - none of it is
> implementable by Claude directly.** Real conversational speaking needs
> the live Realtime API pipeline (turn-taking, VAD, interruption handling)
> that only the OpenAI-side session can build and verify with real audio -
> see the updated standalone spec in `project/TASKS.md`. Scenarios below
> use the exact same shape as lesson role-play (`aiRole`/`learnerRole`/
> `scenarioContext`/`objective`) so they can plug into the existing
> Realtime pipeline conventions once implemented, rather than needing a
> new format invented from scratch. No Speaking below HSK3, confirmed
> per the user's own instruction.

### HSK3 - "Weekend plans with a friend"
- **aiRole**: your friend
- **learnerRole**: yourself
- **scenarioContext**: You and your friend are deciding what to do this weekend - go hiking or stay in and watch a movie.
- **objective**: State a preference with at least one reason (因为), and respond to the friend's counter-suggestion - agree, compromise, or politely disagree.
- **AI opens with**: "这个周末你想在家休息休息，还是想出去运动？"

### HSK4 - "A dip in team efficiency"
- **aiRole**: your colleague
- **learnerRole**: yourself
- **scenarioContext**: Your team's work efficiency has dropped recently, and your colleague wants your take on why, and what to do about it.
- **objective**: Identify at least one possible cause, propose at least one solution, and respond to a mild pushback from the colleague using comparison or concession language (比较 / 虽然...但是 / 不过).
- **AI opens with**: "最近咱们团队的效率好像下降了，你觉得是为什么？"

### HSK5 - "Should young people live with their parents?"
- **aiRole**: an acquaintance with a differing opinion
- **learnerRole**: yourself
- **scenarioContext**: A casual but real debate about the social trend of young people living independently from their parents.
- **objective**: State and defend a position with reasoning, acknowledge at least one valid point from the other side (承认/不过), without simply agreeing to end the conversation.
- **AI opens with**: "现在很多年轻人不愿意跟父母住，你怎么看？"

### HSK6 - "Defending a position under scrutiny"
- **aiRole**: a skeptical colleague/reviewer
- **learnerRole**: yourself, presenting an idea or theory
- **scenarioContext**: The learner has proposed an idea (a plan, a theory, a method) and must defend it against genuine, substantive pushback about its limitations.
- **objective**: Acknowledge the theory/plan's real limitations honestly (局限性) while still making a coherent case for its value, using at least one concessive structure (虽...但/可/却).
- **AI opens with**: "这个想法听起来不错，不过你觉得它有没有局限性？"

### HSK7-9 - "Is disruption overrated?"
- **aiRole**: a debate partner with a genuinely opposing, well-reasoned view
- **learnerRole**: yourself
- **scenarioContext**: An abstract discussion of whether disruptive innovation is more valuable than gradual improvement - the kind of conversation a fluent adult speaker has, not a scripted exchange.
- **objective**: Construct a nuanced argument (not just pro/con), use at least one advanced discourse connector (连...都/宁可...也不/更不用说) naturally, and engage substantively with the counterargument rather than deflecting it.
- **AI opens with**: "你觉得真正的创新一定要颠覆原来的范式吗？"

### What "objective completion" grading would need (spec note for OpenAI)
Mirrors `assess_conversation_completion` (already built for lesson
role-play, `han-realtime.ts`) - reuse that tool-calling pattern rather
than inventing a new one: same silent, forced structured-decision check
after each learner turn, same "the character prompting/suggesting an
action can't complete it on the learner's behalf" rule. The one addition
placement Speaking needs: grade against the *specific* objective bullet
points above (e.g., "acknowledged at least one valid counterpoint"), not
just "the conversation felt complete."

### How a conversation's grade becomes a Speaking HSK level

> Filled in 2026-08-16 (user question: "how is the score evaluated in
> these?") - this was a real gap: the sections above specified *what* to
> check for, not how that becomes a level, unlike Vocabulary/Grammar/
> Reading/Listening's discrete correct/incorrect + stratified-coverage
> mechanism.

Speaking has no "correct answer" to count, so it reuses the same rubric
lesson Speaking already uses (`computeSpeakingConversationScore`,
`points-system.ts`) instead of inventing a new one:

```
base_average = (pronunciation + fluency + accuracy + complexity + communication_effectiveness) / 5
speaking_0_100 = base_average × objective_completion_ratio
```

**Corrected 2026-08-16** (user feedback): no `vocabularyUsageRatio` term
at all here, full stop - not because objective completion happens to
cover it (that was a muddled first explanation conflating two different
things), but because that concept doesn't apply to an exam in the first
place. Lesson Speaking's `vocabularyUsageRatio` checks engagement with
*that lesson's own taught word list* - a placement scenario has no such
list, there's no "unit" to have taught it. `objective_completion_ratio`
grades a completely different thing: whether the learner accomplished
the conversational task (stated a preference, responded to pushback,
etc.), regardless of which words they used to do it. Whether their
language was actually *at* the target level is the job of `complexity`
(and to a lesser extent `accuracy`), which are already inside
`base_average` - no separate multiplier needed for that either.

**Level-climbing logic** (same "climb while passing, stop on the first
failure" shape the other 4 skills already use, via a score threshold
instead of discrete right/wrong):

1. Start at the level suggested by Vocabulary/Grammar/Reading/Listening
   (their lowest, if they disagree - never start Speaking above what the
   learner has already shown elsewhere).
2. Run that level's conversation scenario. Grade with the formula above.
3. **≥70/100** (the same passing threshold already used for lesson
   Reflection, `points_system.md`) → that level is confirmed; move up one
   level and repeat, up to HSK7-9.
4. **<70/100** → stop. The last level that scored ≥70 is
   `listeningHskLevel`'s Speaking equivalent - if even the starting level
   fails, Speaking is credited below where the other 4 skills placed
   (the recognition-vs-production gap, expected and correct, not a bug).
5. **Reaching HSK7-9 here is informational only** (see the ⚠ note at the
   top of this document) - it's shown to the learner, but doesn't grant
   the 1650-2000 point range or skip anything. That tier stays
   Lab-evidence-gated, per the existing `points_system.md` rule.
