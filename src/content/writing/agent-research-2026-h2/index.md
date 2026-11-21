---
title: "Where agent research stands in late 2026"
date: 2026-11-19
description: "Notes on LLM agent research in late 2026: DSLs and verifiers, filesystem memory, skill governance, self-evolving harnesses, and credit assignment in agentic RL."
tags: ["paper-notes", "ai", "agents"]
---

> 中文标题：2026 H2 Agent 研究现状与关键方向判断。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

来源说明：本文最初是我和 Gemini 讨论后整理的笔记。整理成这篇文章时，我对照原文核对了文中引用的每篇论文，并修正了与原文不符的描述。

> **核心脉络**：2026 年下半年，Agent 领域正在脱离早期“纯 Prompt 角色扮演流水线 + 无验证自我反思 + 黑盒向量 RAG”的范式，全面转向 **DSL 与确定性验证器闭环**、**文件系统记忆与 Harness 工程**、**可验证 Skill 治理**，以及 **Agentic RL 与长程信用分配**。与此同时，几乎所有热门自演化与归因方法都存在明确的工程代价与边界局限，投入前需对标强基线。

## 范式演进对照

| 维度            | 2023–2024 早期范式                                        | 2026 H2 主流范式与现实判断                                                                 |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 工作流编排      | 人工定义僵硬 SOP，多 Agent 扮演不同岗位靠自然语言聊天交接 | 专用 DSL（约束算子）+ 确定性物理/测试验证器（约束产出）+ 动态 Harness 调度                 |
| 多 Agent 定位   | 拟人化角色分工（编剧/架构师/审核员）                      | 核心价值收敛为**上下文隔离（Context Isolation）**与**独立任务并行扇出**                    |
| 质量提升编排    | 强制反思 2–3 轮、多智能体辩论（MAD）、强制负面 Critic     | 剥离无效辩论与协作税，转向**单模型内化审视**与**带轨迹压缩的长程 Test-Time Compute**       |
| 记忆与上下文    | 长窗口硬塞，或切片存入向量数据库（Vector RAG）/ 知识图谱  | **Filesystem-Based Memory（Markdown 文档树）** + 标准化主题索引 + 状态原地覆写             |
| 自主进化（RSI） | 成功经验只增不减地堆入列表                                | 聚焦 Skill 契约验证、生命周期淘汰与受控 Harness 修改，但仍受限于规则膨胀与工作区遗忘       |
| 模型与系统关系  | 冻结权重外挂 Prompt / Workflow                            | 前沿工作转向 **Harness-Policy Co-Evolution**；小算力需谨慎验证相对“闭源旗舰 + DSL”的净收益 |

## 1. 工作流与多 Agent：从自然语言交接转向 DSL + 验证器 + 上下文隔离

靠纯 Prompt 角色扮演、用自然语言互相交接的流水线，以及人工写死的僵硬 SOP，正在退潮。一方面，多轮自然语言交接会产生严重语义漂移，VLM/LLM 靠直觉审查 3D 几何或长视频极易产生幻觉；另一方面，固定流水线强依赖人类编排者的先验，编排者本身的偏见会被直接固化进流程。

- **合理的约束方式**：用面向 Agent 的专用语言（DSL）约束 Agent 可操作的算子空间，用确定性测试、编译器或物理/几何仿真引擎约束产出结果。3D/4D 领域的代表工作：**aDSL**（`arXiv:2608.17975`）为 Agent 设计了以关系算子代替绝对坐标的 DSL；**SimWorlds**（`arXiv:2607.01766`）用确定性验证器强制执行分层场景协议，并用运行时状态检查工具捕捉渲染图看不出的机构错误；**GS-Agent**（`arXiv:2607.21522`）让 Agent 通过代码与物理引擎交互，结合多模态反馈迭代构建 4D 场景。
- **角色分工并没有消失**：上述三项工作都保留了角色分工（aDSL 是 Plan-Execute-Critic 循环，SimWorlds 是 planner-coder-reviewer，GS-Agent 是多个不同专长的 Agent），SimWorlds 还按固定顺序推进构建阶段。变化不在于取消角色，而在于角色之间不再靠自然语言和直觉互相审查，而是通过 DSL 代码交接，由验证器或物理引擎给出客观反馈。
- **执行流的动态化**：在视频生成领域更明显。**FrameWorkers**（`arXiv:2608.29814`）由 Director 持续编辑 Task Stack，决定下一步执行哪个子任务、调用哪个子 Agent，所有产物落在共享的持久化 Workspace 中，以此替代固定流水线；Director 本身经过 SFT + GRPO 训练以提升路由可靠性。
- **多 Agent 的真正价值**：不再是模拟人类团队开会，而是解决两个系统级问题——**防上下文污染（Context Isolation）**（把大量文件读取、日志排查、网页检索放进独立子上下文，只把收敛结论回传主 Agent）和**独立子任务的并行扇出（Parallel Fan-out）**。

## 2. 推理质量提升：辩论祛魅与长程 Test-Time Compute

- **多智能体辩论与强制反思的祛魅**：_What Does Multi-Agent Debate Actually Change?_（`arXiv:2609.08016`）在 GlobalOpinionQA 的 50 道观点题上测试了两到三人的辩论：语气指令会大幅改变成员口头上是否同意（友好指令下回复“强烈同意”的比例为 70.7–96.3%，敌对指令下只有 9.5–19.3%），但在所有配置下，成员最终选项与初始选项相同的比例都超过 90%。表达出来的分歧并不等于立场修正。这项研究用的是没有标准答案的观点题，不能直接推广到推理任务；但它与一个更一般的判断一致：缺少外部客观验证器提供新信息时，强制唱反调的 Critic 或无反馈的多轮反思，改变的多是措辞而不是结论，却要白白付出数倍 Token 的协作税（Coordination Tax）。
- **有效方向一：内化辩论**：在后训练阶段将多视角审视与自我检验内化进单个推理模型内部，而非在推理期外部挂载多个角色互相争吵。
- **有效方向二：长程推理期计算扩展（Agentic Test-Time Compute Scaling）**：单轮数学题可以用 Best-of-N 投票拿算力换质量，但长程 Agent 的单次 Rollout 往往长达几十步、充满报错与探索垃圾，无法直接把 N 条原始轨迹塞进窗口对比。2026 年的代表思路（_Scaling Test-Time Compute for Agentic Coding_，`arXiv:2604.16529`）是将长程扩展拆为“轨迹蒸馏表征 + 搜索”：
  - **轨迹蒸馏表征**：把凌乱的完整轨迹压缩成结构化摘要，保留关键假设、进展与失败模式，丢弃低信号的轨迹细节。
  - **并行扩展（Recursive Tournament Voting, RTV）**：并行跑 N 条轨迹，把结构化摘要分成小组相互比较、逐轮淘汰，递归收窄到最优的一条；整个选择过程不依赖 ground-truth 测试结果。
  - **串行扩展（Parallel-Distill-Refine, PDR）**：先并行探索并蒸馏出阶段性结论摘要，再开启完全干净的上下文窗口，仅喂入精炼摘要继续推进，兼顾多路探索与上下文整洁。

## 3. 记忆与 Harness：文件系统记忆与显式文档规范

行业对 Agent 的基本拆解已收敛为 $\text{Agent} = \text{Model Weights} + \text{Execution Harness}$。

- **为什么 RAG / 知识图谱常常水土不服**：主流模型并未针对外部向量库或知识图谱的检索协议做充分后训练，这类系统在实践中极易退化为不直观的黑盒向量索引，Top-K 碎片切片也会破坏因果和层级结构。相比之下，代码模型在预训练与后训练中见过大量终端操作，`rg`、`find` 等文件检索工具天然处于模型训练分布内。
- **裸文件检索的不足**：仅靠在项目目录里 `rg`/`find` 面临两大短板——项目组织高度自由且包含大量无法文本检索的非文本资产（3D 模型、渲染图、权重、二进制日志）；不同表述与同义词会导致关键词搜索漏检。
- **Filesystem-Based Memory（文件系统记忆）**：2026 H2 学术界开始系统研究用 Markdown 目录树作为长期记忆（`arXiv:2607.26637`）。文件系统可查看、可迁移，操作它用的正是 Agent 已经熟练掌握的文件工具；实验也显示，材料量大时，组织良好的目录能把检索成本降低约一半。但同一研究也暴露了短板：随着存储增长，除最强的管理 Agent 外，目录组织都会逐渐被侵蚀（熵增腐化）；被测的 Agent 都没能把“组织得好”转化为“答得更好”；而且只换工具集对存储形态的影响，和换模型一样大。
- **状态演进追踪**：StateMemBench（`arXiv:2608.19652`）指出，事实、约束与决策在长交互中被修订后，现有记忆系统、RAG 和长上下文基线都难以给出反映当前状态而非过时状态的答案；显式追踪“取代”关系的 state-first 方法能明显改善。
- **写入时提炼 vs 读取时整理**：JitMem（`arXiv:2609.27334`）从另一个方向提出质疑：多数记忆系统在任务结束时就把轨迹提炼成固定的反思、工作流或 Skill，相当于在不知道未来查询的情况下决定记什么，会不可逆地丢掉信息。JitMem 保留原始轨迹，到读取时再结合当前任务整理出紧凑的记忆内容。
- **落地原则**：在裸项目之上维护一套标准化文档语义索引层（这也是我自己的项目文档规范采用的做法）——用一行式主题索引解决同义词与非文本资产挂接问题；只记录收敛结论、不记录废弃假设以防误导后续推理；采用原地覆写而非追加日志来避免旧事实污染；通过硬阅读边界隔离 Archive。

## 4. 自演化（RSI）的三层拆解与现实瓶颈

“RSI（递归自我改进）”存在明显的营销炒作成分，落地视角下应清晰拆分为三层，而非幻想模型玄学地直接改写自身权重：

1. **第一层：不动模型与 Harness，自主探索并沉淀 Skill**。
2. **第二层：冻结模型权重，修改自身 Harness 代码（工具、记忆逻辑、控制流）**。
3. **第三层：大厂级闭环，由系统分析失败表现并自动调整训练配置、筛选数据、发起多卡重训**。

### 第一层：Skill 沉淀与生命周期治理的真实瓶颈

单次任务跑通后沉淀出的 Skill，在统计学上只是 $N=1$ 的单点过拟合，容易带来**伪因果与适用边界错配**、**修改旧规则导致的隐式回归**，以及**依赖变化引起的环境静默漂移**。2026 H2 的两类代表治理思路及其局限如下：

- **Skill-V（`arXiv:2610.11781`）**：将 Skill 表示为带版本、可证伪的契约，把语义意图与可观测的行为判据连接起来：契约包含一份可确定性检查的可执行 rubric，涵盖适用范围、必需步骤、禁止行为、前置条件、后置条件与终止条件。任务失败时新增 Skill；契约评估与任务结果不一致时，修订已有 Skill 的适用边界。每次修订都必须保留受保护的语义约束，并通过**非回归校验（Non-Regression Check）**——在历史回放证据上，按 rubric 计算的结果指标不能下降——才允许合入。检索时还有一层适用性过滤，排除被明确判断为不适用的候选。
  - **局限**：契约中的自然语言判据经过多轮反例修补后，依然极易演变成冗长琐碎的补丁堆砌（Spec Bloat）；且在开放式真实项目中，自动维护一套可复现的历史回归用例池本身成本很高。
- **SELM（`arXiv:2610.24630`）**：引入三套机制管理多 Skill 库——① **效用感知检索（Utility-Aware Retrieval）**，将语义相关性与历史实测效用结合排序；② **Map-Reduce 更新流水线**，按任务类别对执行轨迹分组，逐组分析哪些 Skill 受影响、需要怎样修改（Map），再把分析合并为新增、编辑、删除等操作（Reduce），只作用于相关 Skill，避免不同类型任务的经验互相覆盖；③ **生命周期控制**，候选 Skill 先在留出集上验证再入库，并依据置信度与效用保留或淘汰 Skill，被淘汰的 Skill 不允许以原名回到库中。
  - **局限**：效用感知检索本质上是在 RAG 排序层加了“转化率/效用补丁”，只能压低伪相关垃圾经验（提升 Precision），无法解决向量初筛阶段的同义词漏召回与黑盒注入割裂问题。在中小规模（几十到几百条）场景下，维护一行式显式索引配合模型主动 `read_file` 更可控；只有库大到索引无法放进上下文时，效用检索才是不得不做的折中。

### 第二层：Harness 自修改（当前仅记录坐标，待后续深入）

- 核心风险包括两类：一是**自举活性灾难**（原地修改自身运行环境引入崩溃或中断，导致进程无法自救重启）；二是**隐蔽软退化与内生回环失效**（改完没崩溃、眼前任务跑通，却暗中削弱全局能力，且自评测试无法发现）。
- 常见的工程做法是由外层不可变的守护进程（Watchdog）在隔离的影子环境里试验修改，禁止原地自修改，崩溃即回滚并把日志喂回去排障；这是一般的工程模式，不是下面两篇论文的内容。两篇论文补上的是准入环节的统计门控：
  - **SEA**（`arXiv:2607.00871`）把自修改限制在冻结底座模型外的一个小型 steering adapter 和一个带版本的 harness 上，每次修改都必须通过随时有效（Anytime-Valid）的门控，针对固定错误预算出具可审计的证书。
  - **Self-Evolving Agent Harness**（`arXiv:2610.18813`）是一篇 66 页的综述兼理论工作，用持续 PAC 学习分析 harness 演化，给出期望泛化界、以历史回归预算为条件的保持界，以及基于新鲜独立验证数据的高概率准入规则。

> **自演化的共性副作用**：无论是不断沉淀 Skill 还是持续修改 Harness，只要面向当前任务流不断打补丁，就面临可塑性与稳定性的权衡（`arXiv:2610.25858`）。该研究在四个漂移任务流上评估了 ReasoningBank、GEPA 与 Meta-Harness：自演化在多数任务流上提升了总体表现，但可塑性越高，稳定性越差。自修改方法对共享的 prompt 或工作区做全局修改，会干扰未见任务、覆盖早期知识，即**工作区层面的灾难性遗忘**；基于相似度检索的记忆能把更新局部化，却会在未见任务上检索到其他领域的记忆，并在相似查询需要冲突工作流时发生检索碰撞。

## 5. Agentic RL、小算力评估与长程信用分配

前沿工作开始把脚手架和模型权重放在一起优化（**Harness-Policy Co-Evolution**）：Self-HPO（`arXiv:2610.22791`）交替执行 harness 优化与 RL 策略更新，由当前策略分析自身失败并提出新的 harness 候选，联合增益超过两者单独增益之和；ModHarness-RL（`arXiv:2611.18533`）把 harness 中的上下文压缩与行为引导写成程序，在 RL 训练中随模型一起学习和演化。带完整中间操作过程的垂域轨迹数据，可能会成为端到端工具 RL 的关键资源。

### 中小算力（几卡到十几卡）的现实判断

- **通用底座 RL 不可行**：无法对闭源旗舰做 RL，用小算力训开源通用 Agent 极易被闭源模型的通用能力与版本迭代碾平。
- **轻量编排大脑（Orchestrator / Router Policy）**：用小模型做动态任务调度、重型执行交给强模型，虽有工程降本价值，但 2025–2026 年该路线已较拥挤，学术创新空间有限。
- **垂直 DSL + 确定性验证器 + 开源小模型 GRPO**：动手做 RL 之前，必须先建立 **“最强闭源模型 + 同一套 DSL + 验证器报错闭环”** 的强基线。只有满足以下条件之一，开源小模型 RL 才具备明显超越闭源基线的价值：
  1. 任务强依赖海量闭环试错才能内化的**隐式物理/几何直觉**，闭源模型即使懂 DSL 语法也在有限轮试错内难以猜准；
  2. 存在硬性的**低延迟、高吞吐或大规模并行 Rollout 成本约束**；
  3. 输入包含闭源模型不擅长的私有非文本状态模态。
- **能力退化代价**：在 7B–14B 模型上做纯垂域 DSL 的 GRPO 几乎必然损害通用能力，因此更适合将其定位为**专用子执行器或可插拔 LoRA Adapter**，而不是替代通用主 Agent。

### 长程信用分配（Credit Assignment）与认知卸载

- **“常识也要疯狂调工具”的一种解释**：标准轨迹级 RL（如 GRPO）会把最终成功奖励平均分摊给轨迹里的每一步；叠加探索期“凡事查工具更稳妥、靠内部记忆偶尔出错得 0 分”的方差陷阱，模型容易坍缩出**认知卸载（Cognitive Offloading）**怪癖，连简单常识都要反复调工具验证。
- **反事实信息增益归因**：核心思路是对比“包含工具返回观测 $O_t$”与“抹掉 $O_t$”两种条件下，模型生成后续动作 $A_{t+1}$ 的对数概率差异 $\log \pi(A_{t+1} \mid \text{with } O_t) - \log \pi(A_{t+1} \mid \text{without } O_t)$，以此衡量该次工具调用是否真的提供了新信息。
  - **算力真相**：该对比基于已采集轨迹做 **Teacher-Forcing 前向计算（Prefill）**，不需要重跑环境或自回归 Decode；但逐步抹掉每个 $O_t$ 各算一遍需要 `O(T)` 次长上下文前向，长轨迹下显存与算力开销可观。两项相关工作：
    - **OCSD**（`arXiv:2608.04788`）做的是与此相近的对照：它把真实的后续观测作为特权信息，重新给已生成的 token 打分，并构造两个结构对齐的回放视图（Full 与 Observation-Ablated），二者只差在是否包含真实观测，用两者之差得到“观测残差”。结构对齐的目的是扣除回放脚手架本身带来的分数偏移，而不是节省算力；在 ALFWorld、WebShop、Search-QA 上，双视图打分的额外开销约为 GRPO 流程的 1.4%。
    - **CRAFT**（`arXiv:2606.29476`）复用 GRPO 本来就会采样的 G−1 条兄弟轨迹，按教师-学生对数概率差做重要性加权，以几乎为零的额外算力得到带符号的逐 token 反事实信用。
  - **成组冗余调用的理论盲区**：单步留一法（每次只抹掉一个 $O_t$）在面对连续冗余工具组 `t ... t+n` 时会失效——① 若连续两步重复读取同一信息，互相备份会导致单删任意一步都被判 0 增益；② 若连续几步在思维链里互相引用废话验证结果，单删 $O_t$ 会让紧邻的 $A_{t+1}$ 概率暴跌，反而误判为高信息增益。理论上需要对步骤子集做 Shapley 式的终局归因。**Counterfactual Shapley Credit Assignment**（`arXiv:2607.16999`）在一般 RL 设定下用反事实 Shapley 值（φ 值）分配信用，给出了一致的高效估计器与 φ-PPO，但它并非针对 LLM Agent 的工具调用设计。精确 Shapley 值需要遍历 `O(2^T)` 个子集，只能靠近似，在长程 Agent 轨迹上精度与算力如何权衡，尚无完美银弹。

## 待后续深入

Harness 自修改的架构隔离与统计门控细节（重点是 SEA `arXiv:2607.00871` 和 Self-Evolving Agent Harness `arXiv:2610.18813`）还没有精读，留待以后有空时再深入。

参考文献见下文英文部分。

---

## English version

Provenance: this began as notes I put together after a discussion with Gemini.
While turning them into this post, I checked every cited paper against its
source and corrected the descriptions that did not match.

> **The through-line.** In the second half of 2026, agent work is moving away
> from the early pattern of prompt-only role-play pipelines, unverified
> self-reflection, and black-box vector RAG. It is turning to **DSLs closed by
> deterministic verifiers**, **filesystem memory and harness engineering**,
> **verifiable skill governance**, and **agentic RL with long-horizon credit
> assignment**. At the same time, almost every popular self-evolution and
> attribution method carries clear engineering costs and limits, so it should be
> measured against a strong baseline before anyone invests in it.

## How the paradigm has shifted

| Dimension                      | Early paradigm, 2023–2024                                                                 | Mainstream in 2026 H2, and my read                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow orchestration         | Hand-written rigid SOPs; agents play job roles and hand off through natural-language chat | Purpose-built DSLs (constrain the operators) + deterministic physics or test verifiers (constrain the output) + dynamic harness scheduling                             |
| Role of multiple agents        | Anthropomorphic division of roles (writer, architect, reviewer)                           | The core value narrows to **context isolation** and **parallel fan-out of independent tasks**                                                                          |
| Quality-boosting orchestration | Forced reflection for 2–3 rounds, multi-agent debate (MAD), mandatory negative critics    | Drop ineffective debate and its coordination tax; move to **review internalized in a single model** and **long-horizon test-time compute with trajectory compression** |
| Memory and context             | Stuff a long window, or chunk into a vector database (vector RAG) or knowledge graph      | **Filesystem-based memory (a tree of Markdown documents)** + a standardized topic index + state overwritten in place                                                   |
| Self-improvement (RSI)         | Successful experience piled into a list that only grows                                   | Skill-contract verification, lifecycle pruning, and controlled harness edits, still limited by rule bloat and workspace forgetting                                     |
| Model vs. system               | Frozen weights with prompts or workflows bolted on                                        | Frontier work moves to **harness-policy co-evolution**; with little compute, check the net gain over "closed flagship + DSL" carefully                                 |

## 1. Workflows and multiple agents: from natural-language handoffs to DSLs, verifiers, and context isolation

Pipelines built on prompt-only role-play with natural-language handoffs, and
rigid hand-written SOPs, are receding. On one side, multi-turn natural-language
handoffs cause serious semantic drift, and a VLM or LLM that reviews 3D geometry
or long video by intuition hallucinates easily. On the other, a fixed pipeline
leans heavily on the priors of whoever designed it, and that person's biases get
baked straight into the process.

- **A sound way to constrain agents**: use an agent-oriented domain-specific
  language (DSL) to constrain the operators an agent can use, and use
  deterministic tests, compilers, or physics and geometry simulators to
  constrain what it produces. Representative 3D/4D work: **aDSL**
  (`arXiv:2608.17975`) designs a DSL for agents that uses relational operators
  instead of absolute coordinates; **SimWorlds** (`arXiv:2607.01766`) enforces a
  layered scene protocol with a deterministic verifier and uses runtime-state
  inspection tools to catch mechanism failures a rendered image cannot reveal;
  **GS-Agent** (`arXiv:2607.21522`) has agents drive physics engines through
  code and iterate on 4D scenes with multimodal feedback.
- **Roles have not gone away**: all three keep a division of roles (aDSL runs a
  Plan-Execute-Critic loop, SimWorlds a planner-coder-reviewer workflow,
  GS-Agent several agents with distinct expertise), and SimWorlds still moves
  through its construction stages in a fixed order. What changes is not that
  roles disappear, but that they no longer review each other through natural
  language and intuition: they hand off DSL code, and a verifier or physics
  engine supplies objective feedback.
- **Dynamic execution flow**: this is clearer in video generation. In
  **FrameWorkers** (`arXiv:2608.29814`), a Director keeps editing a Task Stack
  to decide which subtask to run next and which sub-agent to call, and every
  artifact lands in a shared, persistent Workspace, replacing a fixed pipeline.
  The Director itself is trained with SFT followed by GRPO to make routing more
  reliable.
- **The real value of multiple agents**: not simulating a human team in a
  meeting, but solving two system-level problems: **context isolation** (push
  heavy file reading, log digging, and web search into separate sub-contexts and
  return only the converged conclusion to the main agent) and **parallel fan-out
  of independent subtasks**.

## 2. Better reasoning: debate demystified, and long-horizon test-time compute

- **Demystifying multi-agent debate and forced reflection**: _What Does
  Multi-Agent Debate Actually Change?_ (`arXiv:2609.08016`) ran two- and
  three-member debates on 50 opinion questions from GlobalOpinionQA. Tone
  instructions sharply changed whether members said they agreed (replies
  reporting strong agreement made up 70.7–96.3% under friendly instructions and
  only 9.5–19.3% under hostile ones), yet in every configuration, members' final
  choice matched their initial one in over 90% of comparisons. Expressed
  disagreement is not the same as a revised position. The study uses opinion
  questions with no correct answer, so it does not carry over directly to
  reasoning tasks, but it fits a more general judgment: without an external,
  objective verifier that brings in new information, a forced contrarian critic
  or feedback-free multi-round reflection mostly changes the wording rather than
  the conclusion, while paying several times the tokens as a coordination tax.
- **What works, part one: internalized debate**. Build multi-perspective review
  and self-checking into a single reasoning model during post-training, instead
  of attaching several arguing roles at inference time.
- **What works, part two: agentic test-time compute scaling**. On a single-turn
  math problem you can trade compute for quality with best-of-N voting, but one
  rollout of a long-horizon agent often runs dozens of steps full of errors and
  exploratory noise, and N raw trajectories cannot simply be laid side by side
  in one window. A representative 2026 approach (_Scaling Test-Time Compute for
  Agentic Coding_, `arXiv:2604.16529`) splits long-horizon scaling into
  "distilled trajectory representation + search":
  - **Distilled trajectory representation**: compress each messy full trajectory
    into a structured summary that keeps its key hypotheses, progress, and
    failure modes and drops low-signal trace details.
  - **Parallel scaling (Recursive Tournament Voting, RTV)**: run N trajectories
    in parallel, compare their structured summaries in small groups, eliminate
    round by round, and recursively narrow down to the best one. The selection
    does not use ground-truth test outcomes.
  - **Sequential scaling (Parallel-Distill-Refine, PDR)**: explore in parallel
    and distill the interim conclusions into a summary, then open a completely
    clean context window fed only with the refined summary and carry on, which
    keeps both multi-path exploration and a tidy context.

## 3. Memory and harness: filesystem memory and explicit documentation rules

The field's basic decomposition of an agent has settled on
$\text{Agent} = \text{Model Weights} + \text{Execution Harness}$.

- **Why RAG and knowledge graphs often fit poorly**: mainstream models have not
  been post-trained much on the retrieval protocols of external vector stores or
  knowledge graphs, so in practice these systems easily degrade into an opaque
  black-box vector index, and top-K fragments break causal and hierarchical
  structure. Code models, by contrast, have seen a great deal of terminal use in
  pre- and post-training, so file search tools like `rg` and `find` sit
  naturally inside their training distribution.
- **Where raw file search falls short**: relying only on `rg` and `find` in a
  project directory has two weaknesses. Projects are organized very freely and
  hold many non-text assets that text search cannot reach (3D models, renders,
  weights, binary logs), and different phrasings and synonyms make keyword
  search miss things.
- **Filesystem-based memory**: in the second half of 2026, researchers began to
  study a tree of Markdown files as long-term memory systematically
  (`arXiv:2607.26637`). A filesystem is inspectable and portable, and it is
  operated with the file tools agents already know well; the experiments also
  show that where material is large, a well-organized store roughly halves
  retrieval cost. The same study exposes the weak side: as stores grow,
  organization erodes for all but the strongest management agent (entropy creeps
  in); none of the agents measured turns "well organized" into "better answers";
  and changing the tool set alone reshapes the store as strongly as swapping the
  model.
- **Tracking evolving state**: StateMemBench (`arXiv:2608.19652`) shows that
  once facts, constraints, and decisions are revised over a long interaction,
  existing memory systems, RAG, and long-context baselines all struggle to
  answer from the current state rather than a superseded one; a state-first
  method that tracks supersession explicitly helps clearly.
- **Curating at write time versus read time**: JitMem (`arXiv:2609.27334`)
  raises a challenge from another direction. Most memory systems distill a
  trajectory into a fixed reflection, workflow, or skill as soon as the task
  ends, which means deciding what to remember before the future query is known,
  and that discards information irreversibly. JitMem keeps raw trajectories and,
  at read time, curates a compact payload for the task at hand.
- **Working principles**: on top of the bare project, maintain a standardized
  semantic index layer of documents (the approach my own project-documentation
  rules take): a one-line-per-topic index handles synonyms and attaches non-text
  assets; record only converged conclusions, not abandoned hypotheses, so they
  do not mislead later reasoning; overwrite in place rather than appending logs,
  so stale facts do not contaminate; and put the archive behind a hard reading
  boundary.

## 4. Self-improvement (RSI) in three layers, and its real bottlenecks

"RSI" (recursive self-improvement) carries plenty of marketing hype. From a
practical angle, it should be split cleanly into three layers rather than
imagined as a model mysteriously rewriting its own weights:

1. **Layer one: leave the model and harness alone; explore and accumulate
   skills.**
2. **Layer two: freeze the weights; modify the agent's own harness code (tools,
   memory logic, control flow).**
3. **Layer three: a big-lab closed loop in which the system analyzes its
   failures, adjusts the training configuration, filters data, and launches
   multi-GPU retraining by itself.**

### Layer one: the real bottlenecks of skill accumulation and lifecycle governance

A skill distilled after one successful task is, statistically, an $N=1$ overfit.
It invites **spurious causation and mismatched scope**, **hidden regressions
when old rules are edited**, and **silent environment drift when dependencies
change**. Two representative governance approaches from 2026 H2, and their
limits:

- **Skill-V (`arXiv:2610.11781`)**: represents skills as versioned, falsifiable
  contracts that link semantic intent to observable behavioral criteria. A
  contract carries an executable rubric that can be checked deterministically,
  covering applicability, required steps, forbidden behaviors, preconditions,
  postconditions, and termination conditions. Task failures add new skills; when
  a contract's evaluation disagrees with the task outcome, the boundary of the
  existing skill is revised. Every revision must preserve protected semantic
  constraints and pass a **non-regression check** (on historical replay
  evidence, the rubric-based outcome metrics must not drop) before it is
  accepted. Retrieval also has an applicability filter that excludes candidates
  confidently judged inapplicable.
  - **Limits**: after rounds of counterexample patches, the natural-language
    criteria in a contract can still bloat into long, fussy patch piles (spec
    bloat); and in open-ended real projects, automatically maintaining a
    reproducible pool of historical regression cases is expensive in itself.
- **SELM (`arXiv:2610.24630`)**: manages a multi-skill library with three
  mechanisms: (1) **utility-aware retrieval**, which ranks by semantic relevance
  combined with measured utility; (2) a **Map-Reduce update pipeline** that
  groups execution trajectories by task category and analyzes each group for
  which skills are affected and what changes they need (Map), then combines the
  analyses into operations such as adding, editing, and deleting skills
  (Reduce), applied only to the relevant skills so that experience from
  different task types does not overwrite each other; (3) **lifecycle control**:
  candidate skills are validated on a held-out set before entering the library,
  skills are kept or retired by confidence and utility, and a retired skill may
  not return under its old name.
  - **Limits**: utility-aware retrieval is essentially a "conversion-rate" or
    utility patch on top of a RAG ranking layer. It can push down spuriously
    relevant junk (better precision) but cannot recover synonyms missed at the
    vector pre-filter stage or fix the disconnect of black-box injection. At
    small and medium scale (tens to hundreds of skills), a one-line explicit
    index plus the model actively calling `read_file` is easier to control;
    utility retrieval is a compromise you only need once the library is too
    large for its index to fit in context.

### Layer two: harness self-modification (only coordinates recorded for now)

- The core risks come in two kinds. One is **bootstrap liveness failure**:
  modifying your own runtime in place introduces a crash or interruption, and
  the process cannot restart itself. The other is **hidden soft degradation and
  a broken internal loop**: the edit does not crash and the task at hand passes,
  but global capability quietly weakens, and self-evaluation does not catch it.
- A common engineering practice is to have an immutable outer watchdog try
  modifications in an isolated shadow environment, forbid in-place
  self-modification, roll back on a crash, and feed the logs back for debugging.
  This is a general engineering pattern, not the content of the two papers
  below. What the papers add is statistical gating at admission:
  - **SEA** (`arXiv:2607.00871`) confines self-modification to a small steering
    adapter and a versioned harness around a frozen base model, and admits each
    modification only through an anytime-valid gate that issues an auditable
    certificate against a fixed error budget.
  - **Self-Evolving Agent Harness** (`arXiv:2610.18813`) is a 66-page survey and
    theory paper that analyzes harness evolution through continual PAC learning,
    giving an expected generalization bound, a retention bound conditional on
    historical regression budgets, and a high-probability admission rule based
    on fresh, independent validation data.

> **A side effect all self-evolution shares.** Whether you keep accumulating
> skills or keep modifying the harness, as long as you patch for the current
> task stream you face a trade-off between plasticity and stability
> (`arXiv:2610.25858`). That study evaluates ReasoningBank, GEPA, and
> Meta-Harness on four drifting task streams: self-evolution improves aggregate
> performance on most streams, but higher plasticity comes at the cost of
> stability. Self-modifying methods apply global edits to a shared prompt or
> workspace, which interferes with unseen tasks and overwrites earlier
> knowledge, that is, **catastrophic forgetting at the workspace level**.
> Similarity-based memory retrieval localizes updates, but still retrieves
> foreign memories on unseen tasks and suffers retrieval collisions when similar
> queries need conflicting workflows.

## 5. Agentic RL, judging what little compute can do, and long-horizon credit assignment

Frontier work has started optimizing the scaffold and the model weights together
(**harness-policy co-evolution**). Self-HPO (`arXiv:2610.22791`) alternates
harness optimization with RL policy updates, letting the current policy analyze
its own failures and propose new harness candidates, and the joint gain exceeds
the sum of the individual gains. ModHarness-RL (`arXiv:2611.18533`) writes the
harness's context compression and behavior steering as programs that are learned
and evolve with the model during RL training. Domain trajectory data that
records every intermediate step may become a key resource for end-to-end tool
RL.

### A realistic view for small and medium compute (a few to a dozen-odd GPUs)

- **RL on a general-purpose base is not feasible**: closed flagships cannot be
  trained with RL, and a general open agent trained with little compute is
  easily flattened by the closed models' general ability and release cadence.
- **A lightweight orchestration brain (orchestrator or router policy)**: a small
  model schedules tasks dynamically while a strong model does the heavy
  execution. It has engineering value for cutting cost, but the route was
  already crowded in 2025–2026, leaving limited room for academic novelty.
- **Vertical DSL + deterministic verifier + GRPO on a small open model**: before
  doing any RL, first build the strong baseline of **"the strongest closed
  model + the same DSL + a verifier error-feedback loop"**. RL on a small open
  model clearly beats that closed baseline only if at least one of the following
  holds:
  1. The task depends heavily on **implicit physical or geometric intuition**
     that can only be internalized through massive closed-loop trial and error,
     so a closed model that knows the DSL syntax still struggles to guess right
     within a limited number of tries;
  2. There are hard **constraints on latency, throughput, or the cost of
     large-scale parallel rollouts**;
  3. The input includes private non-text state modalities that closed models
     handle poorly.
- **The cost in capability**: GRPO on a pure vertical DSL with a 7B–14B model
  almost inevitably hurts general ability, so it is better positioned as a
  **specialized sub-executor or a pluggable LoRA adapter** than as a replacement
  for the general main agent.

### Long-horizon credit assignment and cognitive offloading

- **One explanation for "calling tools even for common sense"**: standard
  trajectory-level RL (such as GRPO) spreads the final success reward evenly
  over every step of a trajectory. Add the variance trap of exploration, where
  looking things up is always safer and relying on internal memory occasionally
  earns a zero, and the model tends to collapse into a **cognitive offloading**
  quirk, calling tools again and again even to check simple common sense.
- **Counterfactual information-gain attribution**: the core idea is to compare
  the log-probability of the next action $A_{t+1}$ with and without the tool
  observation $O_t$,
  $\log \pi(A_{t+1} \mid \text{with } O_t) - \log \pi(A_{t+1} \mid \text{without } O_t)$,
  as a measure of whether that tool call actually provided new information.
  - **The compute reality**: the comparison is a **teacher-forced forward pass
    (prefill)** over trajectories already collected, with no environment re-runs
    or autoregressive decoding. But ablating each $O_t$ in turn takes `O(T)`
    long-context forward passes, so memory and compute costs add up on long
    trajectories. Two related works:
    - **OCSD** (`arXiv:2608.04788`) runs a closely related contrast. It uses the
      actual subsequent observation as privileged information to re-score tokens
      already generated, and builds two structurally matched replay views, Full
      and Observation-Ablated, that differ only in whether the actual
      observation is present; their difference gives an "observation residual."
      The structural matching is there to discount score shifts caused by the
      replay scaffold itself, not to save compute; on ALFWorld, WebShop, and
      Search-QA, scoring the two views adds about 1.4% to the GRPO pipeline.
    - **CRAFT** (`arXiv:2606.29476`) reuses the G−1 sibling rollouts that GRPO
      already samples, importance-weighted by the teacher-student
      log-probability gap, to obtain signed per-token counterfactual credit at
      near-zero extra compute.
  - **A blind spot with groups of redundant calls**: single-step leave-one-out
    (ablating one $O_t$ at a time) fails on a run of redundant tool calls
    `t ... t+n`. (1) If two consecutive steps read the same information, each
    backs the other up, so removing either one alone scores zero gain. (2) If
    several consecutive steps cite each other's filler in the chain of thought
    to confirm a result, removing a single $O_t$ makes the probability of the
    adjacent $A_{t+1}$ plunge, and the call is misjudged as high information
    gain. In principle this calls for Shapley-style attribution over subsets of
    steps against the final outcome. **Counterfactual Shapley Credit
    Assignment** (`arXiv:2607.16999`) assigns credit with counterfactual Shapley
    values (φ-values) in a general RL setting and gives a consistent, efficient
    estimator and φ-PPO, but it is not designed for tool calls by LLM agents.
    Exact Shapley values require enumerating `O(2^T)` subsets, so approximation
    is the only option, and there is no silver bullet yet for trading accuracy
    against compute on long-horizon agent trajectories.

## Still to dig into

I have not yet read the architectural isolation and statistical gating of
harness self-modification closely (mainly SEA, `arXiv:2607.00871`, and
Self-Evolving Agent Harness, `arXiv:2610.18813`); that is deferred until I have
time.

## References

1. Chen Qian, [What Does Multi-Agent Debate Actually Change?](https://arxiv.org/abs/2609.08016), arXiv:2609.08016, 2026.
2. Sizhe Zhou et al., [Filesystem-Based Memory for LLM Agents: Organization, Evolution, and Sustainability](https://arxiv.org/abs/2607.26637), arXiv:2607.26637, 2026.
3. Xinyi Fan et al., [Can Agent Memory Systems Track Evolving State?](https://arxiv.org/abs/2608.19652) (StateMemBench), arXiv:2608.19652, 2026.
4. Yefan Zhou et al., [Just-in-Time Memory: Learning to Curate Task-Adaptive Memory for LLM Agents](https://arxiv.org/abs/2609.27334) (JitMem), arXiv:2609.27334, 2026.
5. Yingli Zhou et al., [A Comprehensive Survey on Agent Skills: Taxonomy, Techniques, and Applications](https://arxiv.org/abs/2605.07358), arXiv:2605.07358, 2026.
6. Jie Ma et al., [Skill-V: Verifiable Self-Evolving Skill Library for Interactive Agents](https://arxiv.org/abs/2610.11781), arXiv:2610.11781, 2026.
7. Mengxi Hu et al., [SELM: Self-Evolving Library Management for Multi-Skill Agent Optimization](https://arxiv.org/abs/2610.24630), arXiv:2610.24630, 2026.
8. Biswa Sengupta, [Self-Evolving Agents with Anytime-Valid Certificates](https://arxiv.org/abs/2607.00871) (SEA), arXiv:2607.00871, 2026.
9. Chuyang Wei et al., [Self-Evolving Agent Harness](https://arxiv.org/abs/2610.18813), arXiv:2610.18813, 2026.
10. Xiaoyin Chen et al., [Are Self-Evolving Agents Continual Learners?](https://arxiv.org/abs/2610.25858), arXiv:2610.25858, 2026.
11. Zhepei Wei et al., [Self-Evolving Coding Agents via Harness-Policy Optimization](https://arxiv.org/abs/2610.22791) (Self-HPO), arXiv:2610.22791, 2026.
12. Zelin He et al., [ModHarness-RL: Recasting Harnesses as Learnable and Evolving Programs for Agentic RL](https://arxiv.org/abs/2611.18533), arXiv:2611.18533, 2026.
13. Yi Yang et al., [Agentic Reinforcement Learning with Observation-Calibrated Self-Distillation](https://arxiv.org/abs/2608.04788) (OCSD), arXiv:2608.04788, 2026.
14. Zibin Meng and Kani Chen, [CRAFT: Counterfactual Credit Assignment from Free Sibling Rollouts for Self-Distilled Agentic Reinforcement Learning](https://arxiv.org/abs/2606.29476), arXiv:2606.29476, 2026.
15. Mingxuan Li, Kai-Zhan Lee, and Elias Bareinboim, [Counterfactual Shapley Credit Assignment](https://arxiv.org/abs/2607.16999), arXiv:2607.16999, 2026.
16. Joongwon Kim et al., [Scaling Test-Time Compute for Agentic Coding](https://arxiv.org/abs/2604.16529), arXiv:2604.16529, 2026.
17. Rui-Huan Wang et al., [aDSL: Agentic 3D Creation via Joint Agent-Program Design](https://arxiv.org/abs/2608.17975), arXiv:2608.17975, 2026.
18. Chunjiang Liu et al., [SimWorlds: A Multi-Agent System for Dynamic 3D Scene Creation](https://arxiv.org/abs/2607.01766), arXiv:2607.01766, 2026.
19. Hongxin Zhang et al., [GS-Agent: Creating 4D Physical Worlds With Generative Simulation](https://arxiv.org/abs/2607.21522), arXiv:2607.21522, 2026.
20. Zhendong Li et al., [FrameWorkers: A Dynamic Multi-Agent Framework for AI-Generated Video Production](https://arxiv.org/abs/2608.29814), arXiv:2608.29814, 2026.
