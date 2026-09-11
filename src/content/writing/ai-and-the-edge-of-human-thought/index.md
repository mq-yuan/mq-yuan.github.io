---
title: "AI has crossed into the territory of human thought"
date: 2026-09-09
updated: 2026-09-11
description: "OpenAI's Navier–Stokes claim, the Buckmaster–Alpöge dispute, GPT-6 Astra driving Blender, and what is left of research practice once the work is delegated."
tags: ["essay", "ai", "research"]
math: true
---

> 中文标题：AI 已经侵入人类智慧的边界。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

今天是 9 月 9 日。北京时间凌晨两点，OpenAI 宣布他们的内部系统给出了 NS 方程问题的一个证明。

先把宣称的内容说准确，因为后面所有讨论都建立在这一点上。OpenAI 的公告说，他们分享的是 Navier–Stokes 存在性与光滑性问题的一个解答，走的是 Fefferman 官方表述中带外力的 C、D 两种表述，并附有 Lean 形式化证明。配套论文的主定理构造了一个三维不可压缩 NS 解：从静止出发，由光滑外力驱动，动能保持有界，速度在有限时间内变得无界。Nature、Scientific American、Quanta 等媒体写的都是"OpenAI 宣称"，而不是"OpenAI 证明了"：这份证明尚未被数学界接受，Clay 数学研究所仍把该问题列为未解决。OpenAI 表示不会申请奖金。

先把这个结果放一放，从两天前的一件事说起。

## 两位数学家与 OpenAI

我最初在小红书上看到的版本是这样的：两个数学家公开炮轰 OpenAI，指控 OpenAI 窃取了他们和 Codex 的聊天记录。他们沿着一条冷门思路攻克 NS 方程，取得了一大步进展；在整理成果的过程中，他们与 Codex 的对话内容泄露，OpenAI 借助他们的思路完成了证明。

一手来源说的并不是这样，而差异本身才是有意思的部分。

两位数学家是纽约大学的 Tristan Buckmaster 和任职于 Anthropic 的 Levent Alpöge，两人是纯粹的个人合作，双方雇主都没有机构层面的参与。他们在 9 月 7 日至 8 日公开的是带光滑外力的不可压缩多孔介质方程、Boussinesq 方程和三维 Euler 方程的有限时间 blowup，各自附有 Lean 验证。这不是 NS 问题本身。Buckmaster 写道，他们相信自己也拿到了低耗散 NS 的 blowup，但那篇论文因为 Lean 验证尚未完成而没有发布。他也明确说明了思路的来源：构造受迫 blowup 的研究纲领属于 Diego Córdoba 和 Luis Martínez-Zoroa，他和 Alpöge 借助语言模型（Claude、Codex，以及最近的 Astra）把这个纲领从粗糙外力推进到光滑外力，从模型方程推进到 Euler。

双方给出的时间线大体吻合。Buckmaster 说，Boussinesq 和 Euler 的结果在 8 月 15 日得到，Euler 的证明在 8 月 22 日通过 Lean 验证。9 月 3 日，在"Anthropic 解决了一个重大开放问题"的传闻流传、并且 Alpöge 收到消息称他们的进展已传到 OpenAI 之后，Buckmaster 写信给 OpenAI 的一位数学家澄清他们手里有什么。9 月 6 日，他与 Sébastien Bubeck 通了两次电话。Buckmaster 说，他被告知一个内部模型生成了大约一百页的受迫 NS blowup 证明；起初被告知几乎没有人工介入，但通话过程中逐渐显露出有一整个团队在用巨量算力攻这个问题，而起点是在他们的消息传到 OpenAI 之后。他问模型是否用他们的 Codex 会话训练过、或者访问过这些会话，那里面放着他们全部的草稿。他得到的回答是模型不会查看用户数据；关于训练，他说没有得到回答。

对方提了两个方案：先发 Euler 结果，OpenAI 第二天发 NS；或者由 Buckmaster 一个人撰写 NS 结果的论文，注明内部模型解决了问题。他说 Bubeck 两次要求把 Alpöge 从署名中去掉，理由是他在 Anthropic 工作；当他表示要公开此事时，对方回了一句"你为什么要毁掉自己的职业生涯？"他拒绝了两个方案。他的声明结尾有一段话值得引用，因为它离社交媒体版本有多远："我没有看过 OpenAI 的证明。我不知道他们的模型做了什么、怎么做的。我不知道我们的数据是否被使用。我不指控任何人。"

OpenAI 的说法主要通过 Bubeck 给出。整个尝试从 9 月 1 日开始，起因是网上疯传 Anthropic 解决了两个千禧年难题。他们让一个多智能体系统同时攻击所有未解决的千禧年难题和 NS 的全部四种表述，动用了约一万个智能体。系统先得到无外力 Euler 的结果，之后算力集中到 NS 上。证明在 9 月 5 日得到，Lean 形式化在 9 月 6 日完成。他们说研究人员和智能体在两人成果公开之前没有通过任何渠道看过他们的工作，而且两份证明存在显著差异。OpenAI 承认受迫 Euler 的优先权归两人，并表示不会申请 Clay 奖金。Bubeck 为"职业生涯"那句话道歉，称之为极差的措辞，但否认那是威胁。他也否认要求把 Alpöge 从他自己的 Euler 论文中除名；他的版本是，让竞争对手实验室的员工来撰写 OpenAI 内部模型产生的工作，涉及独立性和知识产权问题。关于数据，OpenAI 否认为解决此问题访问过任何特定用户的数据，同时表示不能完全排除去标识化的产品数据曾帮助改进模型。Buckmaster 随后指出，OpenAI 把新模型的训练起点定在 8 月 28 日，晚于他们得到结果的时间，并追问用客户数据去追赶客户是否合乎伦理。

Quanta 采访了 Córdoba、Martínez-Zoroa 和 Charles Fefferman。两边的工作都处在 Córdoba–Martínez-Zoroa 这条线上，也都必须越过同一个障碍：在无穷多尺度的级联中保持外力光滑。Fefferman 的总结是，这个故事的英雄是 Córdoba 和 Martínez-Zoroa。

所以，截至今天，谨慎的总结是：没有公开证据表明 OpenAI 读过他们的 Codex 会话或复制了他们的证明；有明确证据表明关于他们进展的消息触发了 OpenAI 的集中投入，两个团队共享同一个目标和同一个方法谱系；数据来源、优先权、署名规范，以及一家公司既出售数学家使用的工具又亲自参与竞争所带来的利益冲突，都还没有经过任何独立审计。

### 9 月 11 日补记

写完两天之后，事情又有了一些进展，但没有改变上面的判断。Alpöge 在 OpenAI 公告后约一小时发推，说 OpenAI 的证明"看起来更像我们手里的另一个 Euler blowup 证明"，9 月 9 日又补充说他本人在 9 月 2 日晚就联系了 OpenAI。Bubeck 先把 Buckmaster 的说法称为"不实且煽动性的指控"，随后给出细节：他们没有用两人的提示或证明去提示自己的模型或指挥智能体；"事后看，两份证明的差异很明显"；他从未要求把 Alpöge 从他自己的工作中除名；并再次为职业生涯那句话道歉。Sam Altman 说团队"自始至终正直而慷慨"，也说他"非常希望当初能够协调发布"。陶哲轩祝贺了 Buckmaster 和 Alpöge，称其为了不起的成就，同时批评 AI 公司因传闻而仓促行动、用新闻稿和社交媒体而非预印本和会议来宣布数学结果，并担心对开放问题的"无差别开采"会破坏产生下一代数学技术、问题和研究者的生态。Emil Wiedemann 指出 OpenAI 最初的论文没有引用 Córdoba 和 Martínez-Zoroa，后来的 166 页版本补上了。Clay 研究所主席 Martin Bridson 称评估会"刻意不急"且"绝对严格"，并强调需要经过同行评审的正式发表；研究所的规则本身也要求发表后经过两年并获得数学界普遍接受。数据使用问题仍然没有新的事实：两人当时用的是哪种账户、这些数据在政策上是否可用于训练、OpenAI 是否会公开智能体日志，都还没有答案。

### 在知道这些之前我是怎么想的

看到社交媒体版本时，我的第一反应是震惊。此前一直觉得，无论 OpenAI 还是 Anthropic，只要用户没有同意，他们就不会用用户的数据。这一半像君子协定，一半像现实约束：在那样的日调用量下，怎么可能识别出哪些对话有价值？单个人的数据没那么值钱，也只是流经系统的沧海一粟。藏一片叶子最好的地方是森林。哪怕我同意让他们拿我的对话去训练，似乎也没什么值得在意的。沙漠里的一粒沙子，从来无人在意。

震惊之后是对那篇帖子本身的怀疑。它写得很有煽动性，字里行间能感到愤怒。这可以理解：如果有人抢在你前面完成了你的工作，做得还更完整，而且本该是你的合作者，却把你踢了出去，你会愤怒，会写小作文。看起来更可能成立的是更窄的版本：两位数学家在 NS 相关问题上做出了真实贡献，OpenAI 在他们整理成果时宣布了结果，而他们全程使用了 AI 辅助。即使核心思路相似，也更像是想法通过人传播，而不是通过日志。OpenAI 有很多数学家，有些人研究流体，交流总会发生。森林的类比也可能不对；也许存在某种廉价的方式给对话打分、把有价值的筛出来。但在那样的数据量下，这仍然不太现实。

当时我没有意识到的是，OpenAI 宣称的是整个问题。帖子说的是两位数学家把 NS 方程推进了一大步，并指控 OpenAI 拿走了他们的想法。我以为 OpenAI 不过是抢先发了一篇同样推进一大步的论文。

## OpenAI 宣称解决了 NS 方程

今天情况变了。OpenAI 说他们解决了这个问题，评论区又流传第二种说法：OpenAI 的论文与两位数学家的思路毫无相似之处。这种说法同样过强。双方都选择了光滑外力下的 blowup 路线，也都是 Córdoba–Martínez-Zoroa 的后继：OpenAI 的论文把他们"在控制外力正则性的同时跨尺度放大"的策略列为自己所依托的前人工作，而 OpenAI 的声明则说自己的证明与 Alpöge–Buckmaster 的论文仍有显著差异。目标相同，方法家族相同，而据 OpenAI 所说，具体构造不同。两份证明究竟是否相似，只能由数学家把它们并排读完才能判断。

不过，如果证明经得起审查，谁先谁后就不再是最重要的问题了。这将是 AI 解决了七个千禧年难题之一。

此前也有过 AI 做数学的结果，我一直把它们归为"惊人但不惊世骇俗"。FunSearch 让语言模型写程序、由自动评估器打分，把 cap set 容量的下界推到 2.2202。AlphaEvolve 在十一维找到了 593 个互不重叠、同时与中心球相切的单位球，比此前最好的结果多一个，并用同样的方式改进了一串其他的界。PatternBoost 找到了六维超立方体的一个 81 条边、直径仍为 6 的子图，推翻了一个三十年的猜想。这三个例子的形状一样：生成候选、打分、加大搜索。界被算力推着走。反例能被找到，是因为它有限且可验证。

最不符合这个故事的是雅可比猜想。七月，Alpöge 与 Claude Fable 5 合作，公布了一个从 $\mathbb{C}^3$ 到 $\mathbb{C}^3$ 的显式多项式映射：雅可比行列式是非零常数，映射却不是单射，从而推翻了三维及更高维的猜想。它很容易验证。陶哲轩的整理指出，验证容易并不意味着发现容易：这个例子需要大量的抵消，靠暴力搜索找到它的可能性极低。即便如此，我当时还是会说，反例最重要的是它如何被构造出来、构造过程带来了什么理解，被找到的对象不等于被理解的对象。

NS 方程是另一种量级。现代的正则性问题通常从 Leray 1934 年的整体弱解算起，到现在已经开放了九十二年。如果证明成立，而且确实没有借助两位数学家的草稿，那么人类思考所能达到的外沿，已经被机器触碰了。

## AI 真的没有创造力吗？

还能说 AI 没有创造力、突破性工作是人类专属吗？

假设证明成立，而有人依然坚持 AI 没有创造力。同时持有这两个立场的唯一办法，是说这个九十二年的问题归根到底只是一个复杂的 A 加 B 加 C：所需的每个工具都已经在架子上，需要的只是把现有工作组装起来。我无法接受这种描述。即使系统做的只是把已有的领域和工具重新组合，它也找到了没人找到过的联系，并用这些联系解决了没人解决过的问题。这恰恰是我们称之为创造性的许多人类工作的写照。麦克斯韦综合了法拉第、安培和高斯，加入位移电流，把电、磁和光统一起来。爱因斯坦在 Grossmann 的帮助下，把等效原理与黎曼几何和张量分析联系起来，得到广义相对论。香农注意到布尔代数可以描述继电器电路，奠定了数字设计的基础。这些人都没有发明自己的原材料。他们建立了此前不存在的关系，新的解释力由此产生。用马克思主义认识论的说法，这个过程是实践基础上的分析与综合：从已有材料出发，发现尚未被看见的内部联系，再回到实践中检验。这个说法里没有任何一处认为"材料早已存在"会让过程失去创造性。为什么换成一个模型来做，它就不再是创造了？

有一个问题应当和这个问题分开：有创造性的产出，是否意味着存在一个有自身目的的创造主体。人们可以把这个结果归于整个社会技术系统，前人的数学、研究人员、工程师、算力和模型一起，而拒绝把模型称为主体。这改变的是创造性归属于谁。它并不让过程本身变得没有创造性。

我觉得，AI 已经侵入了人类智慧的边界。

## Astra 与 3D 生成

GPT-6 Astra 在 9 月 3 日发布后，几天之内就出现了它原生操控 Blender 的演示：写 Blender Python、渲染、检查结果、再修改。这件事离我很近，因为 3D 生成是我关心的方向之一。

一年前，原生 3D 生成看起来是主路。过去一年里，随着 Direct3D 系列和 Hunyuan3D 的成熟，算法开始触到天花板，数据比方法更重要。到今年上半年，Tripo、DreamTech、Hunyuan3D 做得差不多一样好，不再有去年那种代际差距。大家都在同一条线上。

于是程序化生成成了有意思的替代路线：让 AI 操控 Blender 或 CAD 内核，用程序化方式构建物体和结构，再用反馈回路把它们组装起来。结果是可编辑的，这是原生生成做不到的。它在人脸、枕头这类柔软不规则的东西上表现一般。这条路线在稳步推进。

然后 Astra 来了，原生把 Blender 这一段做掉了，做得足够好，以至于之前的 Blender MCP 工具显得过时。这是 AI 第一次直接击穿我所在领域的一个子方向。

我原本在构思一个类似的项目：积累一个程序化组件库，让 AI 用这些组件复刻现有数据集中的场景，每遇到一个陌生结构就写一个新组件加入库中。等库足够丰富之后，搭建场景就简化为把物体匹配到组件、逐个生成、再拼接。现在看，我不确定这个项目还需不需要。

## AI、人和世界之间的中间层

再说一些关于 AI、人和世界的思考。

在马克思主义的叙述里，实践是核心：人与世界之间有目的的交互。生产是实践，价值在实践中被创造，科研也是实践的一种形式。现在似乎正在发生的是，人与世界之间的联系在变薄。中间出现了一个中间商：AI。

这里我得小心一点。实践从来不要求人与世界之间没有中介。《资本论》把劳动工具描述为劳动者置于自身与劳动对象之间、用来传导自身活动的东西。语言、数学、仪器和代码一直都在中介。所以 AI 的到来并不取消实践。新的是被中介的东西。过去的工具代理的是力量、计算或记忆；AI 同时代理执行、观察、判断和解释。人与世界的联系未必消失，但它的直接性、可理解性，以及一个人对过程的掌握，可能会。

## 不再为每一行代码负责

为什么会有中间商的感觉？因为和三年前相比，我已经不再为每一行代码负责。

三年前 AI 写代码刚起步时，我很快就用上了。但那时逻辑是我定的，代码要经过我的检查。现在不一样了：我不为每一行负责，甚至不为每个模块负责。我负责思考，实现和验证交给 AI。有时我假设简单的代码是对的；常常我假设全部都是对的。只有实际使用中出了问题，我才回头看，而且先怀疑思路，再怀疑代码。

如果把写代码、做实验、迭代出结果看作一个完整的实践过程，那么现在代码已经不是我的，我只检查它给出的结果。过程中直接接触世界的那部分被削减了。以前我知道每一行在做什么，大部分时候能确定系统按预期运行，所以出问题意味着设计或思路有问题。现在代码由 AI 编写并被默认正确，我只看结果，出了问题仍然先怪设计。回路里加入了一个第三方。

劳动过程理论对这种形态有一个名字：构思与执行的分离。Braverman 用它描述现代管理如何把对劳动过程的知识和控制从劳动者身上剥离，直到只剩局部操作。AI 辅助编程不是工厂劳动，也没有人强加于我，但结构上是押韵的。实现知识迁移进外部系统。人保留目标和验收，却越来越难说清目标是如何变成结果的。

## 当检查也交给 AI

这是现在。那之后呢？如果 AI 也代替人来检查结果，会发生什么？这已经在发生。实现之后要写测试检查正确性，而我的测试现在几乎全由 AI 写。如果同一个系统既写代码又写测试，测试就共享它的假设和盲点。测试仍然有用，但不再是独立检查。AI 还没有接管的，是对整个任务的把控。

会不会走到人只提出问题、其余全由模型完成的一天？到那时，研究这个问题的人还在进行实践吗？实践是为了什么，什么条件下才算实践？

按照"实践是有目的地改造对象并在客观结果中检验"这一思路，一个答案是四个问题：这个人是否理解并决定目标和约束？他能否接触到未经 AI 解释的现实反馈？结果不符合预期时，他能否介入、改变方向、再次行动？他是否理解并承担结果的责任？科研本来就是由前人理论、仪器、合作者和制度组成的社会实践，所以即使大量步骤由 AI 完成，整个过程仍可以是人类实践的一部分。但对具体的个人而言，参与的深度会变。如果我只说一句要求，然后接受 AI 对成败的判断，实践没有消失，只是它属于人机系统的成分多于属于我。

## 科研训练留下的底线

因为受过科研训练，我还有一条底线：我要为最终结果负责。所以简单的模块可以交给 AI，但对整个任务的把握留在我手里。

其他人呢？没有经过这种训练的人，能在 AI 时代保持自己与世界的接触吗？

AI 是中间商，正在接管更多人与世界相遇的地方。随着它变强，人与世界之间的墙会不会越来越厚？人会不会在墙后失去创造力？

近期关于向生成式 AI 进行认知卸载的研究给出了一个与这种担忧相符的区分。依赖性卸载把核心思考和判断权一并交出；自主性卸载把 AI 当作脚手架，但保留比较、质疑和最终判断。在一项针对学生和初入职场者的三波调查中，两种模式带来相同的即时收益，但依赖性卸载伴随更多的认知权威转移、更低的内在动机和更差的自我报告后续认知。这只是自我报告和相关性，所以它不能证明 AI 侵蚀创造力。它提示的是，危险的变量不是 AI 完成了多少步骤，而是人是否也交出了决定什么重要、什么正确、什么值得继续追问的权力。

## 缸中之脑

有一个可怕的老思想实验，缸中之脑。当 AI 什么都能做，人只需要说想要什么时，我们是否走进了类似的东西？

原版讨论的是怀疑论：一个由计算机喂给全部感官信号的大脑，无法判断它经验到的世界是否真实。让 AI 代我行动并不是那样。只要现实仍能反驳 AI，只要我仍能绕过它去看代码、实验和后果，联系就没有被切断。

但如果有一天，AI 不仅替人行动，还替人观察结果、验证结果、解释失败，并决定哪些东西能被看见，这个类比就越来越贴近。可怕的不是 AI 替我们做事，而是来自世界的反馈只能经过它才抵达我们。我们看似仍在设定目标，却在失去形成目标、修正目标、判断目标是否值得的实践。

## 关于来源的说明

关于本文的写法，有两点。事件部分借助 AI 对照参考文献做了事实核查，凡是我最初印象有误的地方，都直接写明而不是悄悄改掉。关于数据问题：OpenAI 的政策区分个人产品和商业产品。个人版 ChatGPT 和 Codex 的内容可能用于训练，用户可以选择退出，Codex 环境数据另有单独的控制项；商业版、企业版、教育版和 API 的流量默认不用于训练。公开材料没有说明两位数学家用的是哪类账户、如何设置，所以仅凭"私人 Codex 会话"无法判断他们的草稿在政策上是否可能进入训练。

参考文献见下文英文部分。

---

## English version

Today is September 9. At two in the morning Beijing time, OpenAI announced
that an internal system had produced a proof for the Navier–Stokes problem.

Let me be precise about what was claimed, because the precision matters for
everything below. OpenAI's announcement says it is sharing a resolution of the
Navier–Stokes existence and smoothness problem through the forced
formulations, options C and D in Fefferman's official statement, together with
a Lean formalization. The accompanying paper's main theorem constructs a
three-dimensional incompressible Navier–Stokes solution that starts from rest,
is driven by a smooth external force, keeps its kinetic energy bounded, and
develops unbounded velocity in finite time. Nature, Scientific American,
Quanta, and the rest of the press write "OpenAI claims", not "OpenAI proved":
the argument has not been accepted by the community, and the Clay Mathematics
Institute still lists the problem as open. OpenAI has said it will not apply
for the prize.

I want to set that result aside for a moment and start with what happened two
days earlier.

## Two mathematicians and OpenAI

The version I first saw, on Chinese social media, went like this. Two
mathematicians had publicly accused OpenAI of stealing their Codex chat logs.
They had been attacking Navier–Stokes along an obscure route and had made a
large step. While they were writing it up, the content of their conversations
with Codex leaked, and OpenAI used their ideas to finish the proof.

That is not what the primary sources say, and the gap is the interesting part.

The two mathematicians are Tristan Buckmaster at NYU and Levent Alpöge at
Anthropic, working as a personal collaboration with no institutional agreement
on either side. What they released on September 7 and 8 is finite-time blowup
with smooth forcing for the incompressible porous medium equation, the
Boussinesq equation, and the three-dimensional Euler equations, each with a
Lean verification. That is not the Navier–Stokes problem. Buckmaster writes
that they believe they also have blowup for hypo-dissipative Navier–Stokes,
but that paper was held back because its Lean verification had not finished.
He is also explicit about where the ideas come from: the program of
constructing forced blowups belongs to Diego Córdoba and Luis Martínez-Zoroa,
and he and Alpöge used language models, Claude, Codex, and more recently
Astra, to push that program from rough forcing to smooth forcing and from the
model equations to Euler.

The timelines the two sides give are roughly consistent with each other.
Buckmaster says the Boussinesq and Euler results arrived on August 15 and the
Euler proof was verified in Lean on August 22. On September 3, with a rumor
circulating that "Anthropic" had resolved a major open problem, and after
Alpöge received tips that word of their progress had reached OpenAI,
Buckmaster wrote to a mathematician at OpenAI to clarify what they had. On
September 6 there were two calls with Sébastien Bubeck. Buckmaster says he was
told that an internal model had produced roughly one hundred pages proving
forced Navier–Stokes blowup, that he was initially told very little human
input was involved, and that over the course of the call it emerged that a
team had been working on the problem with a very large amount of compute,
starting after the news of their work reached OpenAI. He asked whether the
model had been trained on or had access to their Codex sessions, which held
all their drafts. He was told the model did not look up user data. On
training, he says he did not get an answer.

Two proposals were made to him: post the Euler result and let OpenAI post
Navier–Stokes the next day, or have Buckmaster alone write up the
Navier–Stokes result while crediting the internal model. He says Bubeck twice
asked that Alpöge be removed from authorship because he works at Anthropic,
and that when he said he would go public, the reply was "Why would you ruin
your career?" He declined both proposals. His statement ends with a paragraph
worth quoting for how far it sits from the social media version: "I have not
seen OpenAI's proof. I do not know what their model did, or how. I do not know
whether our data was used. I am not accusing anyone of anything."

OpenAI's account, mostly through Bubeck, is this. The effort started on
September 1, after viral rumors that Anthropic had resolved two Millennium
problems. They pointed a multi-agent system at every unsolved Millennium
problem and at all four formulations of Navier–Stokes, using on the order of
ten thousand agents. It first produced a result for unforced Euler, after
which the compute was concentrated on Navier–Stokes. The proof arrived on
September 5 and the Lean formalization on September 6. The researchers and the
agents, they say, did not see any of Buckmaster and Alpöge's work through any
means before it was public, and the two proofs differ significantly. OpenAI
concedes priority on forced Euler and will not claim the Clay prize. Bubeck
apologized for the "career" remark as an extremely poor choice of words and
denies it was a threat. He also denies asking for Alpöge's removal from his
own Euler paper; his version is that letting an employee of a competing lab
author a write-up of work produced by an OpenAI internal model raised
independence and intellectual property questions. On data, OpenAI denies that
anyone accessed a specific user's data for this problem, while saying it
cannot fully rule out that de-identified product data helped improve the
model. Buckmaster has since pointed out that OpenAI dates the training of its
new model to August 28, after their results existed, and asked whether using
customer data to catch up with a customer is ethical.

Quanta talked to Córdoba, Martínez-Zoroa, and Charles Fefferman. Both efforts
sit inside the Córdoba–Martínez-Zoroa line, and both had to get past the same
obstacle: keeping the force smooth across an infinite cascade of scales.
Fefferman's summary was that the heroes of the story are Córdoba and
Martínez-Zoroa.

So the careful summary, as of today, is this. There is no public evidence that
OpenAI read their Codex sessions or copied their proof. There is clear
evidence that news of their progress triggered OpenAI's concentrated push, and
that the two teams share a target and a method lineage. Data provenance,
priority, authorship norms, and the conflict of interest of a company that
sells the tools mathematicians work in while competing with them have not been
audited by anyone independent.

### Update, September 11

Two days on, there have been developments, none of which changes the summary
above. Alpöge tweeted about an hour after OpenAI's announcement that its proof
"looks more along the lines of another Euler blowup proof we had", and added
on September 9 that he had himself contacted OpenAI on the night of
September 2. Bubeck first called Buckmaster's account "false and inflammatory
allegations", then gave details: they did not use the pair's prompts or
proofs to prompt their models or direct their agents; "one can in hindsight
see that our proofs differ significantly"; he "never ever asked to remove
Alpöge from authorship of his own work"; and he repeated his apology for the
career remark. Sam Altman said the team "acted with integrity and generosity
throughout" and that he "would have greatly preferred coordination". Terence
Tao congratulated Buckmaster and Alpöge on a remarkable achievement,
criticized AI companies for rushing on the strength of rumors and announcing
mathematics through press releases and social media rather than preprints and
conferences, and warned that "the indiscriminate strip-mining of open problems
for solutions may destroy the ecosystem from which the next generation of
mathematical techniques, problems, and practitioners would have developed".
Emil Wiedemann pointed out that OpenAI's first version of the paper did not
cite Córdoba and Martínez-Zoroa; the later 166-page version does. Martin
Bridson, president of the Clay Institute, said any evaluation would be
"deliberately unhurried" and "absolutely rigorous" and stressed that a
peer-reviewed publication is required; the institute's rules also require two
years after publication and general acceptance by the community. On data use
there are no new facts: which accounts the two used, whether that data was
eligible for training under the policy, and whether OpenAI will release agent
logs all remain open.

### What I thought before I knew any of that

My first reaction to the social media version was shock. I had assumed that
neither OpenAI nor Anthropic would use a user's data without consent. That
felt partly like a gentleman's agreement and partly like a practical
constraint: at their daily volume, how would anyone even identify which
conversations were worth anything? A single person's data is not that
valuable, and it is a drop in the ocean of what passes through. The best place
to hide a leaf is a forest. Even if I let them train on my conversations, it
seemed like nothing worth caring about. Nobody notices one grain of sand in a
desert.

After the shock came doubt about the post itself. It was written to inflame,
and you could feel the anger in it. That is understandable. If someone
finishes your work before you, finishes it more completely, and was supposed
to be your collaborator but cut you out, you get angry and you write the long
post. What seemed likely to be true was narrower: the two mathematicians had
made a real contribution on problems adjacent to Navier–Stokes, OpenAI had
announced while they were writing up, and they had used AI assistance
throughout. Even if the core ideas were similar, it seemed more plausible that
ideas travel through people than through logs. OpenAI employs many
mathematicians, some of whom work on fluids, and conversations happen. The
forest analogy might also be wrong; perhaps there is a cheap way to score
conversations and skim off the valuable ones. At that data volume it still did
not seem realistic.

What I had not registered at that point was that OpenAI was claiming the whole
thing. The post said the two mathematicians had pushed Navier–Stokes a large
step forward and accused OpenAI of taking their idea. I assumed OpenAI had
merely rushed out a paper making the same kind of step.

## OpenAI says it solved Navier–Stokes

Today that changed. OpenAI says it solved the problem, and a second claim
started circulating in the comments: that OpenAI's paper has nothing in common
with the two mathematicians' approach. That claim is also too strong. Both
sides chose the smooth-forcing blowup route, and both are descendants of
Córdoba–Martínez-Zoroa: OpenAI's paper names their strategy of amplification
across scales under a controlled force as the previous work it builds on, and
OpenAI's statement says its proof nonetheless differs significantly from the
Alpöge–Buckmaster papers. Same target, same family of methods, and, according
to OpenAI, different specific constructions. Whether the proofs are actually
similar can only be settled by mathematicians reading them side by side.

If the proof survives review, though, the question of who was first stops
being the important one. This would be an AI settling one of the seven
Millennium problems.

There have been AI results in mathematics before, and I used to file them all
under "impressive but not earth-shaking". FunSearch pushed the lower bound on
the cap set capacity to 2.2202 by having a language model write programs that
an automatic evaluator scored. AlphaEvolve found 593 non-overlapping unit
spheres touching a central sphere in eleven dimensions, one more than the
previous best, and improved a list of other bounds the same way. PatternBoost
found an 81-edge subgraph of the six-dimensional hypercube with diameter six,
a counterexample to a thirty-year-old conjecture. Those three have the same
shape: generate candidates, score them, search harder. Bounds get pushed by
compute. A counterexample gets found because it is finite and checkable.

The one that fits that story least is the Jacobian conjecture. In July,
Alpöge, working with Claude Fable 5, published an explicit polynomial map from
$\mathbb{C}^3$ to $\mathbb{C}^3$ with constant nonzero Jacobian determinant
that is not injective, which refutes the conjecture in dimension three and
above. It is easy to check. Tao's write-up makes the point that ease of
checking says nothing about ease of finding: the example requires massive
cancellations, and locating it by brute force looks very unlikely. Even so, I
would have said the important thing about a counterexample is how it was built
and what that construction teaches, and that a found object is not the same as
an understood one.

Navier–Stokes is different in kind. The modern regularity problem is usually
dated to Leray's 1934 global weak solutions, so the question has been open for
ninety-two years. If the proof holds and really was produced without the two
mathematicians' drafts, then the outer edge of what human thought has managed
has been touched by a machine.

## Does AI really lack creativity?

Can we still say AI is not creative, that breakthroughs are a human specialty?

Suppose the proof stands and someone still insists AI has no creativity. The
only way to hold both positions is to say that a ninety-two-year-old problem
was, in the end, a complicated A plus B plus C: every tool was already on the
shelf, and all that was needed was to assemble existing work. I cannot accept
that description. Even if what the system did was recombine existing fields
and tools, it found connections that nobody had found and used them to solve
what nobody had solved. That is a fair description of a lot of the human work
we call creative. Maxwell synthesized Faraday, Ampère, and Gauss, added the
displacement current, and unified electricity, magnetism, and light. Einstein,
with Grossmann's help, connected the equivalence principle to Riemannian
geometry and tensor calculus and got general relativity. Shannon noticed that
Boolean algebra describes relay circuits and founded digital design. None of
those people invented their raw materials. They built relations that did not
exist before, and new explanatory power came out. Marxist epistemology would
call the process analysis and synthesis grounded in practice: start from
existing material, find the internal connections that were not yet seen, and
go back to practice to test them. Nothing in that account says the process
stops being creative because the materials were already there. Why would it
stop being creative because the thing doing it is a model?

There is a separate question I should keep apart from this one: whether a
creative output implies a creative agent with purposes of its own. One can
attribute this result to the whole sociotechnical system, the prior
mathematics, the researchers, the engineers, the compute, and the model
together, and refuse to call the model a subject. That changes who the
creativity belongs to. It does not make the process uncreative.

I think AI has crossed into the territory of human thought.

## Astra and 3D generation

When GPT-6 Astra shipped on September 3, demos of it driving Blender natively
appeared within days: it writes Blender Python, renders, inspects the result,
and revises. That landed close to home, because 3D generation is one of the
directions I care about.

A year ago, native 3D generation looked like the main road. Over the past
year, as the Direct3D series and Hunyuan3D matured, the algorithms started to
hit a ceiling and data mattered more than method. By the first half of this
year, Tripo, DreamTech, and Hunyuan3D were all roughly as good, with none of
the generation-to-generation gaps of the year before. Everyone sits on the
same line.

So the interesting alternative became procedural generation: have an AI drive
Blender or a CAD kernel, build objects and structure procedurally, and
assemble them with a feedback loop. The result is editable, which native
generation is not. It is weak on soft, irregular things like faces and
pillows. It was advancing at a steady pace.

Then Astra arrived and did the Blender part natively, well enough to make the
Blender MCP tooling that preceded it look quaint. This is the first time AI
has punched straight through a sub-area of my own field.

I had been sketching a project along those lines: accumulate a library of
procedural components, have an AI reproduce scenes from existing datasets with
them, and each time an unfamiliar structure came up, write a new component and
add it to the library. Once the library was rich enough, assembling a scene
would reduce to matching objects to components, generating each, and
composing. Looking at it now, I am not sure that project is needed anymore.

## The middle layer between people and the world

A few thoughts on AI, people, and the world.

In the Marxist account, practice is central: purposeful interaction between
people and the world. Production is practice, value is created in practice,
and research is a form of practice. What seems to be happening is that the
link between people and the world is thinning. A middleman has appeared: AI.

I should be careful here. Practice never required an unmediated relation to
the world. Capital describes the instrument of labor as precisely the thing
the worker puts between himself and the object of labor to conduct his
activity. Language, mathematics, instruments, and code have always mediated.
So AI's arrival does not abolish practice. What is new is what gets mediated.
Earlier tools stood in for force, calculation, or memory. AI stands in for
execution, observation, judgment, and explanation at the same time. The link
to the world need not disappear, but its directness, its intelligibility, and
one person's grip on the process can.

## No longer responsible for every line

Why does it feel like a middleman? Because compared with three years ago, I am
no longer responsible for every line of code.

Three years ago, when AI coding was new, I adopted it quickly. But the logic
was mine, and the code passed through my review. Now I am not responsible for
every line, or even for every module. I am responsible for the thinking;
implementation and verification go to the AI. Sometimes I assume the simple
code is right; often I assume all of it is right. Only when something breaks
in use do I go back and look, and even then I check the idea before I check
the code.

If writing the code, running the experiment, and iterating to a result used to
be one complete act of practice, then the code is no longer mine and I only
inspect what it produces. The part of the process that touched the world
directly has been cut down. I used to know what every line did, and most of
the time I could be sure the system did what I expected, so a failure meant
the design or the idea was wrong. Now the code is written by AI and presumed
correct, I look only at outcomes, and a failure still gets blamed on the
design first. A third party has entered the loop.

Labor-process theory has a name for this shape: the separation of conception
from execution, which Braverman used to describe how management strips
knowledge of and control over the work away from the worker until only local
operations remain. AI-assisted programming is not factory labor, and no one is
imposing it on me, but the structure rhymes. Implementation knowledge migrates
into an external system. The person keeps goals and acceptance, and has a
harder and harder time saying how the goal became the result.

## When checking is delegated too

That is now. What about next? What happens when AI also replaces the person in
checking the results? It is already happening. After implementation, tests are
written to check correctness, and nearly all of my tests are now written by AI
too. If the same system writes the code and the tests, the tests share its
assumptions and its blind spots. They remain useful. They stop being an
independent check. What AI has not yet taken over is control of the task as a
whole.

Will it get to the point where a person only poses the question and
everything else is done by the model? At that point, is the person researching
the problem still engaged in practice? What is practice for, and what has to
be true for something to count as it?

One answer, consistent with the idea that practice is purposeful
transformation of an object tested by objective results, is a set of four
questions. Does the person understand and decide the goal and its constraints?
Can they reach feedback from reality that has not been interpreted for them by
the AI? Can they step in, change course, and act again when results do not
match expectations? Do they understand and carry responsibility for the
outcome? Research has always been a social practice made of prior theory,
instruments, collaborators, and institutions, so even a process in which AI
does most steps can remain part of human practice. But for a specific
individual, the depth of participation can change. If I state one request and
then accept the AI's verdict on whether it worked, practice has not vanished.
It belongs to the human–machine system more than to me.

## The floor that research training leaves

Because I was trained as a researcher, there is a floor. I am responsible for
the final result. So simple modules can go to AI, but control of the whole
task stays with me.

What about everyone else? Can people without that training keep their own
contact with the world in the AI era?

AI is a middleman, and it is taking over more of the places where people meet
the world. As it improves, does the wall between people and the world thicken?
Do people lose creativity behind it?

Recent work on cognitive offloading to generative AI draws a distinction that
matches this worry. Dependent offloading hands over the core thinking and the
authority to judge. Autonomous offloading uses AI as scaffolding but keeps the
comparison, the doubt, and the final call. In a three-wave survey of students
and early-career workers, both modes gave the same immediate benefits, but
dependent offloading went with more transfer of cognitive authority, less
intrinsic motivation, and worse self-reported downstream cognition.
Self-report and correlation only, so it does not prove that AI erodes
creativity. It does suggest the dangerous variable is not how many steps AI
performs. It is whether the person also gives up deciding what matters, what
is correct, and what is worth asking next.

## The brain in a vat

There is a frightening old thought experiment, the brain in a vat. When AI can
do anything and people only have to say what they want, have we walked into
something like that?

The original is about skepticism: a brain fed every sensory signal by a
computer cannot tell whether the world it experiences is real. Letting AI act
on my behalf is not that. As long as reality can still contradict the AI, and
I can still go around it to look at the code, the experiment, and the
consequences, the link has not been cut.

But if one day AI not only acts for people but also observes the results,
verifies them, explains the failures, and decides what gets seen, the analogy
gets closer. The frightening part would not be that AI does things for us. It
would be that feedback from the world reaches us only through it. We would
still seem to be setting goals while losing the practice of forming them,
revising them, and judging whether they were worth having.

## A note on sources

Two things about how this was written. The events section was fact-checked
with AI assistance against the sources below, and where my first impression
was wrong, I said so rather than quietly fixing it. On the data question
specifically: OpenAI's policy separates consumer and business products.
Consumer ChatGPT and Codex content may be used for training with an opt-out,
and Codex environment data has its own control; business, enterprise,
education, and API traffic is not used by default. Nothing public says which
kind of account the two mathematicians used or how it was configured, so
"private Codex sessions" alone does not settle whether their drafts could have
entered training under the policy.

## References

1. Tristan Buckmaster, [public statement](https://cims.nyu.edu/~tristanb/statement.pdf), September 2026.
2. OpenAI, [On the Navier–Stokes Millennium Prize Problem](https://openai.com/index/navier-stokes-solution/), September 8, 2026.
3. OpenAI, [Finite Time Blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), the paper accompanying the announcement.
4. Sébastien Bubeck, [response thread](https://unrollnow.com/status/2097379411691516310), September 8, 2026.
5. Terence Tao, [Finite time blowup with smooth forcing term for the incompressible porous medium, Boussinesq, and incompressible Euler equations](https://terrytao.wordpress.com/2026/09/07/finite-time-blowup-with-smooth-forcing-term-for-the-incompressible-porous-medium-boussinesq-and-incompressible-euler-equations/), September 7, 2026.
6. Quanta Magazine, [AI Has Solved One of Math's $1 Million Millennium Prize Problems](https://www.quantamagazine.org/ai-has-solved-one-of-maths-1-million-millennium-prize-problems-20260908/), September 8, 2026.
7. TechCrunch, [OpenAI fought dirty on career-making math problem, says NYU mathematician](https://techcrunch.com/2026/09/08/openai-fought-dirty-on-career-making-math-problem-says-nyu-mathematician/), September 8, 2026.
8. Scientific American, [OpenAI claims blockbuster math breakthrough amid swirl of controversy](https://www.scientificamerican.com/article/openai-claims-blockbuster-math-breakthrough-amid-swirl-of-controversy/), September 8, 2026.
9. MIT Technology Review, [What OpenAI's latest controversy tells us about the future of math](https://www.technologyreview.com/2026/09/08/1143747/what-openais-latest-controversy-tells-us-about-the-future-of-math/), September 8, 2026.
10. Nature, [OpenAI claims huge maths breakthrough on a famed Millennium Problem](https://www.nature.com/articles/d41586-026-02842-5), September 2026.
11. Clay Mathematics Institute, [Navier–Stokes Equation](https://www.claymath.org/millennium/navier-stokes-equation/) and [Rules for the Millennium Prize Problems](https://www.claymath.org/millennium-problems/rules/).
12. Charles Fefferman, [Existence and Smoothness of the Navier–Stokes Equation](https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf), the official problem statement.
13. OpenAI, [How your data is used to improve model performance](https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance).
14. Romera-Paredes et al., [Mathematical discoveries from program search with large language models](https://www.nature.com/articles/s41586-023-06924-6), Nature, 2023 (FunSearch).
15. Georgiev, Gómez-Serrano, Tao, and Wagner, [Mathematical exploration and discovery at scale](https://arxiv.org/abs/2511.02864), 2025 (AlphaEvolve).
16. Charton, Ellenberg, Wagner, and Williamson, [PatternBoost: Constructions in Mathematics with a Little Help from AI](https://arxiv.org/abs/2411.00566), 2024.
17. Terence Tao, [A digestion of the Jacobian conjecture counterexample](https://terrytao.wordpress.com/2026/07/21/a-digestion-of-the-jacobian-conjecture-counterexample/), July 21, 2026.
18. Shuhong Gao, [Counterexamples to the Jacobian conjecture in dimensions greater than two](https://arxiv.org/abs/2608.00222), 2026, which generalizes the Alpöge, Gallagher, and Speyer constructions.
19. Karl Marx, [Capital, Volume I, Chapter 7: The Labour-Process and the Process of Producing Surplus-Value](https://www.marxists.org/archive/marx/works/1867-c1/ch07.htm).
20. Mao Zedong, [On Practice](https://www.marxists.org/reference/archive/mao/selected-works/volume-1/mswv1_16.htm).
21. Harry Braverman, [Labor and Monopoly Capital](https://doi.org/10.14452/mr-026-03-1974-07_1), Monthly Review, 1974.
22. Zhu et al., [Not all cognitive offloading is equal: distinguishing dependent and autonomous offloading to generative AI](https://doi.org/10.3389/fpsyg.2026.1878629), Frontiers in Psychology, 2026.
23. Stanford Encyclopedia of Philosophy, [Content Externalism and Skepticism](https://plato.stanford.edu/entries/skepticism-content-externalism/), on the brain-in-a-vat argument.
24. Claude E. Shannon, [A Symbolic Analysis of Relay and Switching Circuits](https://dspace.mit.edu/handle/1721.1/11173), 1937.
25. ABC News, [Controversy erupts as OpenAI claims solution to Navier Stokes maths problem](https://www.abc.net.au/news/2026-09-10/openai-navier-stokes-millennium-problem-claims/107132242), September 10, 2026.
26. Fortune, [OpenAI says it cracked Navier-Stokes, one of math's grand challenges](https://fortune.com/2026/09/08/openai-says-it-cracked-navier-stokes-math-grand-challenge-buckmaster-accusation-cheating-intimidation-tao-lament/), September 8, 2026, for Tao's remarks.
27. The Next Web, [OpenAI's Bubeck denies trying to cut Anthropic mathematician from credit](https://thenextweb.com/news/bubeck-navier-stokes-account-apology-altman), September 2026.
28. Wikipedia, [Navier–Stokes priority controversy](https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_priority_controversy), a running timeline of the dispute.
