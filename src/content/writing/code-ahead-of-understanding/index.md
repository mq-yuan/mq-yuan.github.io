---
title: "When code runs ahead of understanding"
date: 2026-11-01
description: "Two kinds of technical debt that AI agents brought and one I took on with my own configuration, and why all three sit in the gap between the code and my understanding."
tags: ["essay", "ai", "technical-debt"]
---

> 中文标题：当代码走在理解前面。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

在[AI 已经侵入人类智慧的边界](/writing/ai-and-the-edge-of-human-thought/)里，我写到自己已经不再为每一行代码负责：实现交给 AI，我只检查结果，出了问题先怀疑思路，再怀疑代码。这一篇想算一算这样做欠下的账。不过回头整理时我发现，欠账的不只是 AI 写的代码，还有我自己这些年攒下的配置。它们都可以归到“技术债”这个词下面，大致分成两类：一类是 AI 带来的，一类是我自己欠下的。只是它们和这个词原本的意思都不太一样。

## 技术债原本说的是什么

1992 年，Ward Cunningham 在 OOPSLA 的一篇经验报告里第一次用了这个比喻：把第一次写出来的代码直接交付，就像借了一笔债。少量的债能加快开发，只要之后及时重写来偿还；危险在于一直不还，此后在这段不太对的代码上多花的每一分钟，都是这笔债的利息。

后来这个词被用得很宽，几乎所有难改的代码都被叫作技术债。2009 年 Cunningham 专门录了一段视频澄清：他从不赞成把代码写得很差，他赞成的是让代码反映你当前对问题的理解，即使这个理解还不完整。理解加深以后，代码没有跟着改，这中间的差距才是债。还债的方式是重构，让代码看起来像是我们从一开始就知道自己在做什么。

Martin Fowler 后来按两个维度把技术债分成四类：有意还是无意，审慎还是鲁莽。其中我最在意的是“鲁莽而无意”那一类：一个团队不了解设计实践，借了债却完全没有意识到自己借了多少。

按 Cunningham 的说法，传统的技术债是理解已经往前走了，代码落在后面。而我这几年遇到的债，方向大多是反过来的。

## AI 带来的债

这一类有两种，都和让 agent 写代码有关。

### agent 替我借的债

今年 6 月之前，AI agent 写代码的能力还没有让我满意到现在的程度。那时它写出来的代码，常常在当时的具体约束下是正确的，甚至非常鲁棒，却没有考虑项目后续迭代时的可持续性。

它的鲁棒来自防御。为了让任务在当下跑通，它会把当时的假设固定下来，再包上一层兜底：找不到的字段给一个默认值，对不上的形状悄悄修正，出错的地方换一条备用路径继续执行。在项目当时的状态下，这些代码不会出错。可一旦项目发生偏移，原来的假设不再成立，这层防御不会报错，而是把变化吸收掉，让程序沿着另一条路径继续运行。结果只是差了一点、偏了一点。

如果是我自己写代码，往往不会这样防御。即使写了，我也记得自己在哪里兜过底，项目推进到某一步时，就会意识到之前那段代码是防御性的，顺手改掉。agent 写的防御没有人记得。这像是有人以我的名义借了一笔钱，却没有告诉我。

这笔债的利息不是每天支付的，而是在发现问题时一次付清。刚写出来时它没有暴露任何问题，随着项目推进，它慢慢在结果里留下难以察觉的错误或负面影响。等我意识到不对，往往已经花了大量时间去定位。定位到之后，我还要理解 agent 在这部分是怎样构建代码的、问题为什么会出现，这需要把这段代码的功能和它的写法全部弄清楚，最后才能修改。

在科研里，这种债还有一层更麻烦的代价。一个悄悄降级的实验不会告诉你它降级了，它只会给出一个更差的数字。而按照我在上一篇里描述的习惯，出了问题先怀疑思路，这个数字很容易被读成“这个方法不行”。这时，债就不只在代码里，而是进入了结论。

### 许愿式编程

这种债发生得不多，通常出现在我处理自己不了解的任务时。我把这种编程方式叫作许愿式编程：我只大概知道要做什么，不了解其中的细节，也不知道常见的问题，一切交给 agent。

比如让我开发一个手机 app。我从来没有做过这件事，不知道什么需要注意，什么比较重要。一开始它还算正常工作。但随着需求不断迭代，要适配更多的手机型号，app 随着时间变得越来越臃肿；又或者我不了解平台能力的边界，异想天开地提出一些超出正常能力范围的需求。agent 很少拒绝，它会想办法实现，哪怕只能靠 hack。于是项目一路狂奔，从原本的设想 A，变成了怎样让某个不合适的需求成立的 hack 项目，最后尾大不掉。

如果我对 app 开发有一定的了解，事情不会走到这一步。懂行的人很大一部分价值在于知道什么不该硬做，可以换一种方式绕开这个需求。我缺的不是代码，而是判断力。

这让我想到 Peter Naur 在 1985 年写的《Programming as Theory Building》。他认为程序真正的载体不是源代码，而是程序员脑中关于这个程序的理论：它为什么这样写，对应现实中的什么，应该怎样修改。代码只是这套理论不完整的表达。许愿式编程得到的，是一份没有理论支撑的代码。它可以运行，但我没法判断它该往哪里改。在 Fowler 的分类里，这正是鲁莽而无意的债：我不知道自己不知道什么。

## 我自己欠下的债：DIY 配置

这类债是我自己欠下的。它本来和 AI 无关，但 AI 让它变得更贵了。

我很喜欢 DIY，喜欢各种 CLI 工具，喜欢尝试不同的系统，测试各种配置。2023 年我用的是 Windows 11、WezTerm、WSL、zsh、starship 和 Neovim；2024 年换到 Ubuntu，用上刚发布的 Ghostty，加上 yazi、lazygit、fish、Neovim、Copilot CLI、Gemini CLI 和 Rime 输入法，也开始全面使用 ChatGPT、Kimi、DeepSeek、Claude、Gemini 这些 AI 服务；2025 年开始全面拥抱各种 AI CLI 工具；2026 年又开始尝试 Arch、CachyOS，以及 herdr、Rex、cmux 这些工具。

这四年里，我发现这些配置逐渐让我积重难返。我从零开始自己配 Neovim，后来发现自己会忘：某个配置一段时间不用，我就忘了它的存在，忘了自己做过什么，也忘了当时的小巧思。系统层面也是这样。我写过很多 plist，去做一些使用频率其实很低的事；专门写过一个函数处理 Ubuntu 下压缩包的安装，其实并不常用；专门配置过桌面图标，其实并不在乎；专门改过 Ubuntu 的软件源，现在也不在乎了。

每一项配置都像一笔小额贷款。本金很小，几行就够了；利息是记忆的维护成本，我得记住它存在、它做什么、当时为什么要加。写得越多，忘得越多。它们逐渐沉没在系统里，从记忆中消失，直到有一天我重新发现它们，却不知道它们在做什么。更糟的是，某个被遗忘的配置可能引发了一个 bug，而我根本想不到要去查它。

以前，这笔债只花我自己的记忆。和 agent 一起工作以后，它多了一份利息。agent 对这些工具的了解来自社区：官方文档、wiki、论坛和 issue 里的讨论。它默认我的系统是文档里描述的样子，可我的系统早就被我改过很多地方。macOS 默认的 shell 是 zsh，我用的是 fish，agent 有时意识不到，仍然按 zsh 来给命令、改配置；为此我在给 agent 的全局指令里专门写了一条，给我手动执行的命令要用 fish 语法。Codex 和 Claude Code 默认把配置放在 `~/.codex` 和 `~/.claude`，我更希望按 XDG 规范统一放在 `~/.config` 下；之前用 bash 时，我也把配置拆到了 `~/.config/bash.d` 里。agent 常常意识不到这些，会去默认的位置找。我还用 chezmoi 管理系统配置，agent 往往不会想到它要改的文件可能受 chezmoi 管理，直接在本地改掉，过两天 chezmoi 一更新，改动又恢复了原状。

这些偏差单个看影响不大，因为我知道它们在哪里，看到不对就能纠正。但每一项个人配置，都是 agent 的知识和我的实际情况之间的一处偏差。我记得的偏差，我可以替它纠正；我忘了的偏差，就没有人能纠正了。

这些个人配置也没有人维护。社区的配置有文档、有人讨论，出了问题能搜到答案，agent 也熟悉；我自己的配置只有我一个人单打独斗，而我还在不断忘记它。

Naur 说，掌握理论的团队解散时，程序就死了，而一个死去的程序仍然可以在计算机上运行，甚至产生有用的结果。我的配置也是这样：它们还在运行，但已经没有人知道它们为什么在那里。我不知道，agent 更不知道。

## 代码走在理解前面

这三种债来源不同，前两种是 AI 带来的，后一种是我自己欠下的，但它们有同一个结构。Cunningham 说的债，是理解往前走了，代码落在后面；我遇到的这三种，是代码已经在那里，理解落在后面。

- agent 写的防御代码：理解从来没有从 agent 转移到我这里。
- 许愿式编程：我从一开始就没有这份理解。
- 我的配置：我曾经有过，后来忘了；agent 则从来没有，因为这份理解只存在于我的系统里，不在它读过的任何文档里。

所以至少对我来说，技术债越来越不在代码本身，而在代码和我脑子之间的差距里。代码写得再干净，如果我说不清它为什么这样写、出了问题该从哪里查，它就仍然是一笔债。

## 怎样还

agent 写的防御代码最近出现得越来越少，主要是因为模型能力变强了。现在的 agent 很少再写出那种在当下鲁棒、在偏移后悄悄出错的防御。我仍然在给 agent 的指令里保留着一条规则：不要用宽泛的异常处理吞掉错误，宁可让程序在出错时立刻失败。它背后的原则是，即使出错，也要出在明处。藏起来的错误，迟早要连本带利地还。

许愿式编程的还法是，在许愿之前先补一点理论。进入一个陌生领域时，我可以先让 agent 讲清楚这个领域的基本约束、常见陷阱和能力边界，而不是直接让它开始写。当一个需求只能靠 hack 实现时，这本身就是一个信号：我可能已经走到了平台正常能力的范围之外，应该停下来想想有没有别的路，而不是让它继续往下挖。

配置的债，我已经在还了。我放弃了大量手动配置，转向文档成熟、有社区维护的方案，只做最简单、最必要的修改：Neovim 基于 AstroNvim；shell 从 zsh 加 oh-my-zsh 转到 bash，又因为 bash 要配的东西有点多转到 fish，现在只设置环境变量、几个最常用的 abbr 和函数；yazi 一开始还想和 lazygit 做联动，现在更倾向于开箱即用的原始体验。这样做是为了好维护，而且不只是我自己好维护。文档成熟、社区讨论多的配置，agent 也熟悉，我可以让它来帮我维护，而不是自己单打独斗。每少一项个人配置，agent 的知识和我的系统之间就少一处偏差。

## 模型变强以后

agent 写的防御代码正在随着模型变强而减少。许愿式编程则不取决于模型：模型可以写出更正确的代码，却不能把理论放进我的脑子里。它写得越快、越多，这个距离就可能拉得越大。配置的债正好反过来：正是因为 agent 越来越能干，我才愿意把自己的系统改回它熟悉的样子，把维护交给它。

所以在 AI 时代，我对“理解”的要求分成了两部分。我自己负责的部分，我必须懂；交给 agent 维护的部分，至少要让它能懂。最麻烦的是两边都不懂的那部分：agent 写了却没有交到我手里的代码，我写了却没有留给任何人的配置。

参考文献见下文英文部分。

---

## English version

In [AI has crossed into the territory of human thought](/writing/ai-and-the-edge-of-human-thought/),
I wrote that I am no longer responsible for every line of code: the
implementation goes to AI, I only check the results, and when something goes
wrong I suspect the idea first and the code second. This piece tries to add up
what that habit has cost. Looking back, though, I found the debt is not only in
code that AI wrote but also in the configuration I have piled up over the
years. All of it falls under "technical debt," in roughly two kinds: debt that
AI brought, and debt I took on myself. Neither quite matches what the term
originally meant.

## What technical debt originally meant

Ward Cunningham first used the metaphor in an experience report at OOPSLA in
1992: shipping first-time code is like going into debt. A little debt speeds
development, as long as it is paid back promptly with a rewrite. The danger is
never paying it back; every minute then spent on not-quite-right code is
interest on that debt.

Later the term was stretched until almost any code that is hard to change got
called technical debt. In 2009 Cunningham recorded a video to set the record
straight: he was never in favor of writing code poorly; he was in favor of
writing code that reflects your current understanding of a problem, even if
that understanding is partial. When your understanding deepens and the code
does not follow, the gap between the two is the debt. You pay it back by
refactoring, so that the program looks as if you had known what you were doing
all along.

Martin Fowler later sorted technical debt along two axes: deliberate or
inadvertent, prudent or reckless. The cell I care about most is the reckless,
inadvertent one: a team ignorant of design practices takes on debt without even
realizing how much it owes.

In Cunningham's sense, technical debt is understanding moving ahead while the
code lags behind. Most of the debt I have run into over the past few years goes
the other way.

## Debt that AI brought

This kind comes in two forms, both tied to having agents write code.

### Debt an agent took out in my name

Before June this year, AI agents could not yet code to the standard I am happy
with now. The code they wrote was often correct under the specific constraints
of the moment, even very robust, but it ignored whether the project could keep
evolving.

That robustness came from defensiveness. To make the task run right away, the
agent would freeze the assumptions of the moment and wrap them in fallbacks: a
default value for a missing field, a quiet fix for a mismatched shape, a backup
path when something failed. In the project's state at the time, this code never
broke. But once the project drifted and the old assumptions no longer held, the
defenses did not raise an error. They absorbed the change and let the program
carry on down another path. The results came out only a little worse, a little
off.

When I write code myself, I am rarely this defensive. Even when I am, I
remember where I put the safety nets, and at some point as the project moves on
I realize an earlier piece was defensive and fix it in passing. No one
remembers the defenses an agent wrote. It is as if someone took out a loan in my
name and never told me.

The interest on this debt is not paid day by day; it falls due all at once,
when the problem is discovered. Freshly written, the code exposes nothing. As
the project moves on, it slowly leaves hard-to-see errors or side effects in
the results. By the time I notice something is wrong, I have usually spent a
lot of time locating it. Once I find it, I still have to understand how the
agent built that part and why the problem arose, which means working out both
what the code does and how it was written, before I can finally change it.

In research this debt carries a worse cost. A silently degraded experiment does
not tell you it degraded; it just gives you a worse number. And given the habit
I described in the earlier essay, suspecting the idea first, that number is
easily read as "this method does not work." At that point the debt is no longer
only in the code. It has entered the conclusions.

### Wish-driven programming

This debt is rarer. It usually shows up when I take on a task I do not
understand. I call this way of working wish-driven programming: I know roughly
what I want, but not the details or the usual pitfalls, and I hand everything
to the agent.

Say I set out to build a phone app. I have never built one, and I do not know
what needs care or what matters. At first it works well enough. But as the
requirements keep changing and more phone models need support, the app grows
more bloated over time. Or, not knowing where the platform's limits are, I ask
on a whim for something beyond what it can reasonably do. The agent rarely says
no; it finds a way, even if only through a hack. So the project races ahead,
from the original idea A to a hack project built around making one ill-suited
requirement work, until it is too big to turn around.

If I knew something about app development, it would not get this far. Much of
an expert's value lies in knowing what not to force, and in finding another way
around the requirement. What I lack is not code but judgment.

This brings to mind Peter Naur's 1985 essay "Programming as Theory Building."
He argues that a program lives not in its source code but in the theory its
programmers hold about it: why it is written this way, what in the world it
corresponds to, and how it should be changed. The code is only a partial
expression of that theory. Wish-driven programming yields code with no theory
behind it. It runs, but I cannot tell which way it should change. In Fowler's
terms this is exactly reckless, inadvertent debt: I do not know what I do not
know.

## Debt I took on myself: DIY configuration

This debt is my own. It had nothing to do with AI originally, but AI has made
it more expensive.

I love DIY: CLI tools of every kind, trying different systems, testing
configurations. In 2023 I used Windows 11, WezTerm, WSL, zsh, starship, and
Neovim. In 2024 I moved to Ubuntu, picked up Ghostty right after its release,
added yazi, lazygit, fish, Neovim, Copilot CLI, Gemini CLI, and the Rime input
method, and started using AI services such as ChatGPT, Kimi, DeepSeek, Claude,
and Gemini across the board. In 2025 I went all in on AI CLI tools. In 2026 I
started trying Arch and CachyOS, along with tools such as herdr, Rex, and cmux.

Over these four years I found all this configuration gradually piling up into
something hard to turn back from. I configured Neovim from scratch, then found
that I forget: when I go a while without using some setting, I forget it
exists, forget what I did, and forget the small trick behind it. The system
level is the same. I wrote many plists for things I rarely do; wrote a function
just to install archives on Ubuntu, which I seldom used; set up desktop icons I
did not really care about; and switched Ubuntu's package mirrors, which I no
longer care about either.

Each setting is like a small loan. The principal is tiny, a few lines. The
interest is the cost of keeping it in memory: I have to remember that it
exists, what it does, and why I added it. The more I write, the more I forget.
The settings gradually sink into the system and vanish from memory, until one
day I come across one again and have no idea what it does. Worse, a forgotten
setting may cause a bug I would never think to look for.

This debt used to cost only my own memory. Since I started working with agents,
it carries extra interest. An agent's knowledge of these tools comes from the
community: official docs, wikis, discussions in forums and issues. It assumes
my system looks the way the docs describe, but I have changed mine in many
places. The default shell on macOS is zsh, but I use fish, and agents sometimes
miss this and still give commands or edit configuration as if for zsh; I even
put a rule in my global agent instructions that commands for me to run by hand
must use fish syntax. Codex and Claude Code keep their configuration in
`~/.codex` and `~/.claude` by default, but I prefer to keep everything under
`~/.config`, following the XDG convention; back when I used bash, I also split
its configuration into `~/.config/bash.d`. Agents often miss this and go
looking in the default locations. I also manage my system configuration with
chezmoi, and an agent rarely considers that the file it is about to change may
be managed by chezmoi. It edits the local copy, and a couple of days later,
when chezmoi next updates, the change is gone.

Each of these gaps matters little on its own, because I know where they are and
can correct the agent when I see something off. But every personal setting is
one more gap between what the agent knows and what my system actually is. The
gaps I remember, I can correct for it. The ones I have forgotten, no one can.

No one maintains these personal settings, either. Community configurations
have documentation and discussion, answers can be found when something breaks,
and agents know them well. My own configuration has only me, working alone,
and I keep forgetting it.

Naur writes that a program dies when the team that holds its theory is
dissolved, and that a dead program may still run on a computer and even produce
useful results. My configuration is like that: it still runs, but no one knows
why it is there anymore. I do not, and the agent knows even less.

## Code ahead of understanding

These three debts come from different places, two from AI and one from me, but
they share one structure. The debt Cunningham described is understanding
moving ahead while the code lags behind. In all three of mine, the code is
already there and understanding lags behind.

- Defensive code written by an agent: the understanding never passed from the
  agent to me.
- Wish-driven programming: I never had that understanding to begin with.
- My configuration: I once had it and then forgot it; the agent never had it,
  because it exists only in my system and in none of the docs the agent has
  read.

So, for me at least, technical debt lies less and less in the code itself and
more and more in the gap between the code and my head. However clean the code,
if I cannot say why it is written that way or where to look when something goes
wrong, it is still a debt.

## Paying it back

Defensive code from agents shows up less and less these days, mainly because
the models have become more capable. Today's agents rarely write the kind of
defense that is robust in the moment and fails silently after the project
drifts. I still keep a rule in my agent instructions: do not swallow errors with
broad exception handling; let the program fail immediately when something goes
wrong. The principle behind it is that if things go wrong, they should go wrong
in the open. Hidden errors get paid back sooner or later, with interest.

The way to repay wish-driven programming is to buy a little theory before
making the wish. When I enter an unfamiliar field, I can first ask the agent to
lay out the field's basic constraints, common pitfalls, and limits, instead of
having it start writing right away. When a requirement can only be met with a
hack, that in itself is a signal: I may have stepped outside what the platform
can normally do, and I should stop and look for another route rather than let
the agent keep digging.

I am already repaying the configuration debt. I have given up most of my
hand-written configuration in favor of well-documented, community-maintained
setups, making only the simplest and most necessary changes. Neovim is based on
AstroNvim. My shell went from zsh with oh-my-zsh to bash, then to fish because
bash needed a bit too much setup, and now it only sets environment variables, a
few of the most-used abbreviations, and some functions. With yazi I once tried
to wire it up with lazygit; now I prefer the plain out-of-the-box experience.
The point is easy maintenance, and not just for me. Agents know well-documented,
widely discussed configurations, so I can let them help maintain mine instead
of going it alone. Every personal setting I drop is one less gap between the
agent's knowledge and my system.

## After the models get stronger

Defensive code from agents is fading as the models get stronger. Wish-driven
programming does not depend on the model: a model can write more correct code,
but it cannot put the theory into my head. The faster and the more it writes,
the wider that gap may grow. The configuration debt runs the other way:
precisely because agents keep getting more capable, I am willing to turn my
system back into the shape they know and hand its upkeep to them.

So in the age of AI, what has to be understood splits into two parts. The
parts I am responsible for, I must understand. The parts I hand to an agent, it
must at least be able to understand. The real trouble is the part neither of
us understands: code an agent wrote but never handed over to me, and
configuration I wrote but never left to anyone.

## References

1. Ward Cunningham, [The WyCash Portfolio Management System](https://c2.com/doc/oopsla92.html), OOPSLA '92 Experience Report, 1992.
2. Ward Cunningham, [Debt Metaphor](https://www.youtube.com/watch?v=pqeJFYwnkjE), video, February 2009.
3. Martin Fowler, [Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html), October 14, 2009.
4. Peter Naur, [Programming as Theory Building](<https://doi.org/10.1016/0165-6074(85)90032-8>), _Microprocessing and Microprogramming_ 15(5): 253–261, 1985.
